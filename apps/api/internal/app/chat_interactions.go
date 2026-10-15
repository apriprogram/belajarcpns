package app

import (
	"context"
	"strings"
	"unicode"
	"unicode/utf8"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ---------- GroupChat v2: balas, tag @, reaksi, sematkan ----------

const (
	chatMaxMentions = 10  // id unik per pesan
	chatMaxPinned   = 3   // pesan tersemat aktif
	chatReplyCut    = 120 // karakter cuplikan reply_to
	chatMaxEmoji    = 32  // byte
	chatMaxEmojiLen = 10  // rune (cukup untuk ZWJ keluarga & bendera bertag)
)

// ---------- validasi & parsing murni (diuji unit) ----------

// emojiJoiner: rune format/penanda yang sah di dalam rangkaian emoji
// (ZWJ, variation selector, keycap, karakter tag bendera subdivisi).
func emojiJoiner(r rune) bool {
	return r == 0x200D || r == 0xFE0E || r == 0xFE0F || r == 0x20E3 || (r >= 0xE0020 && r <= 0xE007F)
}

// validEmoji: 1–32 byte & ≤10 rune UTF-8 valid; tanpa ASCII, huruf/angka (semua aksara), spasi, kontrol,
// format tak terlihat (Cf) atau tanda gabung (Mn/Me) selain emojiJoiner; minimal satu simbol (So) atau
// rune di blok emoji (termasuk regional indicator). Keycap (1️⃣, #️⃣) sengaja ditolak.
func validEmoji(s string) bool {
	if len(s) == 0 || len(s) > chatMaxEmoji || !utf8.ValidString(s) || utf8.RuneCountInString(s) > chatMaxEmojiLen {
		return false
	}
	sym := false
	for _, r := range s {
		switch {
		case emojiJoiner(r):
			continue
		case r < 0x80, unicode.IsLetter(r), unicode.IsNumber(r), unicode.IsSpace(r), unicode.IsControl(r),
			unicode.In(r, unicode.Cf, unicode.Mn, unicode.Me):
			return false
		case unicode.Is(unicode.So, r), r >= 0x1F000 && r <= 0x1FAFF:
			// blok emoji 1F000–1FAFF (termasuk regional indicator 1F1E6–1F1FF) ikut dihitung agar emoji
			// yang lebih baru dari tabel Unicode Go tetap diterima
			sym = true
		}
	}
	return sym
}

// hasURL: teks berisi http://, https://, atau www. (tanpa memedulikan huruf besar/kecil).
// "www." hanya dihitung di awal kata agar kata seperti "awww." tidak dianggap link.
func hasURL(s string) bool {
	low := strings.ToLower(s)
	if strings.Contains(low, "http://") || strings.Contains(low, "https://") {
		return true
	}
	for i := 0; ; {
		j := strings.Index(low[i:], "www.")
		if j < 0 {
			return false
		}
		at := i + j
		if at == 0 {
			return true
		}
		prev, _ := utf8.DecodeLastRuneInString(low[:at])
		if !unicode.IsLetter(prev) && !unicode.IsDigit(prev) {
			return true
		}
		i = at + 1
	}
}

// parseMentionIDs: "uuid,uuid,..." → uuid kanonik, unik, maks 10; yang tidak valid dibuang.
func parseMentionIDs(raw string) []string {
	out := []string{}
	seen := map[string]bool{}
	for _, p := range strings.Split(raw, ",") {
		id, err := uuid.Parse(strings.TrimSpace(p))
		if err != nil || id == uuid.Nil {
			continue
		}
		k := id.String()
		if seen[k] {
			continue
		}
		seen[k] = true
		out = append(out, k)
		if len(out) == chatMaxMentions {
			break
		}
	}
	return out
}

func cutRunes(s string, n int) string {
	if utf8.RuneCountInString(s) <= n {
		return s
	}
	return string([]rune(s)[:n])
}

// ---------- pemuatan batch (tanpa N+1) ----------

// hydrateChat mengisi reactions & nama mentions untuk satu halaman pesan dengan 2 query.
// rawMentions[i] = id mentions tersimpan untuk list[i].
func (s *Server) hydrateChat(ctx context.Context, list []ChatMessage, rawMentions [][]string) error {
	idx := map[string]int{}
	ids := []string{}
	users := []string{}
	seenUser := map[string]bool{}
	for i := range list {
		list[i].Reactions = []ChatReaction{}
		list[i].Mentions = []ChatRef{}
		if list[i].Deleted {
			continue
		}
		idx[list[i].ID] = i
		ids = append(ids, list[i].ID)
		for _, u := range rawMentions[i] {
			if !seenUser[u] {
				seenUser[u] = true
				users = append(users, u)
			}
		}
	}
	if len(ids) == 0 {
		return nil
	}

	// reaksi: urut reaksi pertama (created_at) → urutan chip mengikuti emoji yang muncul lebih dulu
	rows, err := s.DB.Query(ctx, `SELECT r.message_id, r.emoji, u.id, u.name FROM chat_reactions r
		JOIN users u ON u.id=r.user_id WHERE r.message_id = ANY($1::text[]::uuid[])
		ORDER BY r.created_at, u.name`, ids)
	if err != nil {
		return err
	}
	pos := map[string]map[string]int{} // pesan → emoji → indeks chip
	for rows.Next() {
		var mid, emoji string
		var u ChatRef
		if err := rows.Scan(&mid, &emoji, &u.ID, &u.Name); err != nil {
			rows.Close()
			return err
		}
		i, ok := idx[mid]
		if !ok {
			continue
		}
		m := &list[i]
		if pos[mid] == nil {
			pos[mid] = map[string]int{}
		}
		k, ok := pos[mid][emoji]
		if !ok {
			m.Reactions = append(m.Reactions, ChatReaction{Emoji: emoji, Users: []ChatRef{}})
			k = len(m.Reactions) - 1
			pos[mid][emoji] = k
		}
		m.Reactions[k].Count++
		m.Reactions[k].Users = append(m.Reactions[k].Users, u)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	if len(users) == 0 {
		return nil
	}
	names := map[string]string{}
	rows, err = s.DB.Query(ctx, `SELECT id, name FROM users WHERE id = ANY($1::text[]::uuid[])`, users)
	if err != nil {
		return err
	}
	for rows.Next() {
		var id, name string
		if err := rows.Scan(&id, &name); err != nil {
			rows.Close()
			return err
		}
		names[id] = name
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}
	for i := range list {
		if list[i].Deleted {
			continue
		}
		for _, u := range rawMentions[i] {
			if n, ok := names[u]; ok { // pengguna yang sudah dihapus tidak ditampilkan
				list[i].Mentions = append(list[i].Mentions, ChatRef{ID: u, Name: n})
			}
		}
	}
	return nil
}

// chatByID: satu pesan lengkap; nil bila tidak ada.
func (s *Server) chatByID(ctx context.Context, id string) (*ChatMessage, error) {
	list, err := s.queryChat(ctx, chatSelect+` WHERE m.id=$1`, id)
	if err != nil || len(list) == 0 {
		return nil, err
	}
	return &list[0], nil
}

// chatPinned: pesan tersemat aktif, terbaru dulu, maks 3.
func (s *Server) chatPinned(ctx context.Context) ([]ChatMessage, error) {
	return s.queryChat(ctx, chatSelect+` WHERE m.pinned_at IS NOT NULL AND m.deleted_at IS NULL
		ORDER BY m.pinned_at DESC, m.id LIMIT $1`, chatMaxPinned)
}

// validMentions: hanya pengguna yang ada & tidak diblokir; urutan masukan dipertahankan.
func (s *Server) validMentions(ctx context.Context, ids []string) ([]string, error) {
	if len(ids) == 0 {
		return []string{}, nil
	}
	rows, err := s.DB.Query(ctx, `SELECT id FROM users WHERE id = ANY($1::text[]::uuid[]) AND status <> 'blocked'`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ok := map[string]bool{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ok[id] = true
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	out := []string{}
	for _, id := range ids {
		if ok[id] {
			out = append(out, id)
		}
	}
	return out, nil
}

// ---------- handler ----------

// chatMembers: GET /chat/members?q= — anggota untuk @tag (tidak diblokir, urut nama, maks 20).
// Peserta saat fitur tag dimatikan → 403 CHAT_FEATURE_DISABLED.
func (s *Server) chatMembers(c *gin.Context) {
	st, admin, ok := s.chatAccess(c)
	if !ok {
		return
	}
	if !admin && !st.Mentions {
		chatFeatureOff(c, "Tag anggota sedang dinonaktifkan admin.")
		return
	}
	q := cutRunes(strings.TrimSpace(c.Query("q")), 60)
	// karakter wildcard LIKE diperlakukan sebagai teks biasa
	q = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(q)
	rows, err := s.DB.Query(c, `SELECT id, name, role, avatar_url FROM users WHERE status <> 'blocked' AND name ILIKE $1
		ORDER BY name, id LIMIT 20`, "%"+q+"%")
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer rows.Close()
	out := []ChatUser{}
	for rows.Next() {
		var u ChatUser
		if err := rows.Scan(&u.ID, &u.Name, &u.Role, &u.AvatarURL); err != nil {
			httpx.Internal(c, err)
			return
		}
		out = append(out, u)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, out)
}

// reactionGate: CHAT_DISABLED / CHAT_FEATURE_DISABLED untuk peserta, lalu id pesan.
func (s *Server) reactionGate(c *gin.Context) (string, bool) {
	st, admin, ok := s.chatAccess(c)
	if !ok {
		return "", false
	}
	if !admin && !st.Reactions {
		chatFeatureOff(c, "Reaksi emoji sedang dinonaktifkan admin.")
		return "", false
	}
	return pathUUID(c, "id", "Pesan tidak ditemukan.")
}

// chatReact: PUT /chat/messages/:id/reaction { emoji } — satu reaksi per pengguna;
// emoji sama dengan milik saya = hapus, emoji lain = ganti. Mengembalikan pesan terbaru.
func (s *Server) chatReact(c *gin.Context) {
	id, ok := s.reactionGate(c)
	if !ok {
		return
	}
	var in struct {
		Emoji string `json:"emoji"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	emoji := strings.TrimSpace(in.Emoji)
	if !validEmoji(emoji) {
		httpx.FailFields(c, "Emoji tidak valid.", map[string]string{"emoji": "Pilih satu emoji."})
		return
	}
	uid := auth.UserID(c)
	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)
	// kunci baris pesan sekaligus menaikkan updated_at agar /chat/sync mengirim ulang
	// (clock_timestamp, bukan now() = awal transaksi; lihat chatSync)
	tag, err := tx.Exec(c, `UPDATE chat_messages SET updated_at=clock_timestamp() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Pesan tidak ditemukan.")
		return
	}
	var cur string
	err = tx.QueryRow(c, `SELECT emoji FROM chat_reactions WHERE message_id=$1 AND user_id=$2`, id, uid).Scan(&cur)
	switch {
	case err == nil && cur == emoji:
		_, err = tx.Exec(c, `DELETE FROM chat_reactions WHERE message_id=$1 AND user_id=$2`, id, uid)
	case err == nil || isNoRows(err):
		_, err = tx.Exec(c, `INSERT INTO chat_reactions(message_id, user_id, emoji) VALUES ($1,$2,$3)
			ON CONFLICT (message_id, user_id) DO UPDATE SET emoji=EXCLUDED.emoji, created_at=now()`, id, uid, emoji)
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if err := tx.Commit(c); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.respondChatMessage(c, id)
}

// chatUnreact: DELETE /chat/messages/:id/reaction — hapus reaksi saya.
func (s *Server) chatUnreact(c *gin.Context) {
	id, ok := s.reactionGate(c)
	if !ok {
		return
	}
	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)
	var one int
	if err := tx.QueryRow(c, `SELECT 1 FROM chat_messages WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`, id).Scan(&one); err != nil {
		if isNoRows(err) {
			httpx.NotFound(c, "Pesan tidak ditemukan.")
			return
		}
		httpx.Internal(c, err)
		return
	}
	tag, err := tx.Exec(c, `DELETE FROM chat_reactions WHERE message_id=$1 AND user_id=$2`, id, auth.UserID(c))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() > 0 {
		if _, err := tx.Exec(c, `UPDATE chat_messages SET updated_at=clock_timestamp() WHERE id=$1`, id); err != nil {
			httpx.Internal(c, err)
			return
		}
	}
	if err := tx.Commit(c); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.respondChatMessage(c, id)
}

func (s *Server) respondChatMessage(c *gin.Context, id string) {
	m, err := s.chatByID(c, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if m == nil {
		httpx.NotFound(c, "Pesan tidak ditemukan.")
		return
	}
	httpx.OK(c, m)
}

// chatPin: PATCH /admin/chat/messages/:id/pin { pinned } — maks 3; menyematkan yang ke-4 melepas yang paling lama.
func (s *Server) chatPin(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pesan tidak ditemukan.")
	if !ok {
		return
	}
	var in struct {
		Pinned *bool `json:"pinned"`
	}
	if err := c.ShouldBindJSON(&in); err != nil || in.Pinned == nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)
	// serialisasi antar-admin agar batas 3 pesan tersemat tidak terlampaui
	if _, err := tx.Exec(c, `SELECT pg_advisory_xact_lock(hashtext('chat_pin'))`); err != nil {
		httpx.Internal(c, err)
		return
	}
	var wasPinned bool
	if err := tx.QueryRow(c, `SELECT pinned_at IS NOT NULL FROM chat_messages WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`, id).Scan(&wasPinned); err != nil {
		if isNoRows(err) {
			httpx.NotFound(c, "Pesan tidak ditemukan.")
			return
		}
		httpx.Internal(c, err)
		return
	}
	// clock_timestamp(): waktu setelah lock didapat, sehingga urutan pinned_at = urutan sematan sebenarnya
	switch {
	case *in.Pinned && !wasPinned:
		if _, err := tx.Exec(c, `UPDATE chat_messages SET pinned_at=clock_timestamp(), pinned_by=$2, updated_at=clock_timestamp() WHERE id=$1`, id, auth.UserID(c)); err != nil {
			httpx.Internal(c, err)
			return
		}
		// lepas yang paling lama bila lebih dari batas (updated_at ikut naik)
		if _, err := tx.Exec(c, `UPDATE chat_messages SET pinned_at=NULL, pinned_by=NULL, updated_at=clock_timestamp()
			WHERE id IN (SELECT id FROM chat_messages WHERE pinned_at IS NOT NULL AND id<>$1
				ORDER BY pinned_at DESC, id OFFSET $2)`, id, chatMaxPinned-1); err != nil {
			httpx.Internal(c, err)
			return
		}
	case !*in.Pinned && wasPinned:
		if _, err := tx.Exec(c, `UPDATE chat_messages SET pinned_at=NULL, pinned_by=NULL, updated_at=clock_timestamp() WHERE id=$1`, id); err != nil {
			httpx.Internal(c, err)
			return
		}
	}
	if err := tx.Commit(c); err != nil {
		httpx.Internal(c, err)
		return
	}
	m, err := s.chatByID(c, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if m == nil {
		httpx.NotFound(c, "Pesan tidak ditemukan.")
		return
	}
	pinned, err := s.chatPinned(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"message": m, "pinned": pinned})
}
