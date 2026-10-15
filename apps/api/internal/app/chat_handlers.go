package app

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

// ---------- GroupChat ----------
// Toggle fitur & retensi dibaca dari settings.key='chat_settings' (lihat chat_settings.go).

const (
	chatMaxBody = 2000     // karakter
	chatMaxFile = 10 << 20 // 10 MB
	chatDir     = "chat"   // sub-folder di UPLOAD_DIR
)

// Ekstensi yang diizinkan → jenis pesan. File di luar daftar ini ditolak.
var chatExt = map[string]string{
	".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image", ".gif": "image",
	".mp4": "video", ".webm": "video", ".mov": "video",
	".mp3": "audio", ".wav": "audio", ".ogg": "audio", ".m4a": "audio", ".aac": "audio", ".opus": "audio",
	".pdf": "file", ".doc": "file", ".docx": "file", ".xls": "file", ".xlsx": "file", ".ppt": "file", ".pptx": "file",
	".txt": "file", ".csv": "file", ".zip": "file", ".rar": "file",
}

type ChatUser struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Role      string  `json:"role"`
	AvatarURL *string `json:"avatar_url,omitempty"`
}

type ChatFile struct {
	URL  string `json:"url"`
	Name string `json:"name"`
	Size int64  `json:"size"`
	Mime string `json:"mime"`
}

// ChatRef: pengguna ringkas (mentions & daftar yang bereaksi).
type ChatRef struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ChatReplyRef: kutipan pesan yang dibalas (cuplikan ≤120 karakter).
type ChatReplyRef struct {
	ID       string `json:"id"`
	UserName string `json:"user_name"`
	Body     string `json:"body"`
	Kind     string `json:"kind"`
	Deleted  bool   `json:"deleted"`
}

type ChatReaction struct {
	Emoji string    `json:"emoji"`
	Count int       `json:"count"`
	Users []ChatRef `json:"users"`
}

type ChatMessage struct {
	ID            string         `json:"id"`
	User          ChatUser       `json:"user"`
	Body          string         `json:"body"`
	Kind          string         `json:"kind"`
	File          *ChatFile      `json:"file"`
	ReplyTo       *ChatReplyRef  `json:"reply_to"`
	Mentions      []ChatRef      `json:"mentions"`
	Reactions     []ChatReaction `json:"reactions"`
	Starred       bool           `json:"starred"`
	StarredByName *string        `json:"starred_by_name"`
	Pinned        bool           `json:"pinned"`
	PinnedAt      *time.Time     `json:"pinned_at"`
	PinnedByName  *string        `json:"pinned_by_name"`
	Deleted       bool           `json:"deleted"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

const chatSelect = `SELECT m.id, u.id, u.name, u.role, u.avatar_url, m.body, m.kind, m.file_url, m.file_name, m.file_size, m.file_mime,
	m.starred, sb.name, m.deleted_at IS NOT NULL, m.created_at, m.updated_at,
	m.pinned_at, pb.name, m.mentions::text[],
	rm.id, ru.name, rm.body, rm.kind, rm.deleted_at IS NOT NULL
	FROM chat_messages m JOIN users u ON u.id=m.user_id LEFT JOIN users sb ON sb.id=m.starred_by
	LEFT JOIN users pb ON pb.id=m.pinned_by
	LEFT JOIN chat_messages rm ON rm.id=m.reply_to LEFT JOIN users ru ON ru.id=rm.user_id`

// queryChat menjalankan chatSelect lalu memuat reaksi & nama mentions secara batch.
func (s *Server) queryChat(ctx context.Context, sql string, args ...any) ([]ChatMessage, error) {
	rows, err := s.DB.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	out := []ChatMessage{}
	rawMentions := [][]string{}
	for rows.Next() {
		var m ChatMessage
		var url, name, mime *string
		var size *int64
		var mentions []string
		var rID, rName, rBody, rKind *string
		var rDeleted bool
		if err := rows.Scan(&m.ID, &m.User.ID, &m.User.Name, &m.User.Role, &m.User.AvatarURL, &m.Body, &m.Kind, &url, &name, &size, &mime,
			&m.Starred, &m.StarredByName, &m.Deleted, &m.CreatedAt, &m.UpdatedAt,
			&m.PinnedAt, &m.PinnedByName, &mentions,
			&rID, &rName, &rBody, &rKind, &rDeleted); err != nil {
			rows.Close()
			return nil, err
		}
		if url != nil && !m.Deleted {
			m.File = &ChatFile{URL: *url}
			if name != nil {
				m.File.Name = *name
			}
			if size != nil {
				m.File.Size = *size
			}
			if mime != nil {
				m.File.Mime = *mime
			}
		}
		if m.Deleted { // pesan terhapus tidak lagi tersemat
			m.PinnedAt, m.PinnedByName = nil, nil
		}
		m.Pinned = m.PinnedAt != nil
		if rID != nil {
			ref := &ChatReplyRef{ID: *rID, Deleted: rDeleted}
			if rName != nil {
				ref.UserName = *rName
			}
			if rKind != nil {
				ref.Kind = *rKind
			}
			if rBody != nil && !rDeleted {
				ref.Body = cutRunes(*rBody, chatReplyCut)
			}
			m.ReplyTo = ref
		}
		out = append(out, m)
		rawMentions = append(rawMentions, mentions)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := s.hydrateChat(ctx, out, rawMentions); err != nil {
		return nil, err
	}
	return out, nil
}

// chatResetAt: waktu reset terakhir oleh admin (klien yang sinkron sebelum waktu ini harus memuat ulang).
func (s *Server) chatResetAt(ctx context.Context) *time.Time {
	var raw []byte
	if err := s.DB.QueryRow(ctx, `SELECT value FROM settings WHERE key='chat'`).Scan(&raw); err != nil {
		return nil
	}
	var v struct {
		ResetAt *time.Time `json:"reset_at"`
	}
	_ = json.Unmarshal(raw, &v)
	return v.ResetAt
}

func parseTS(s string) (time.Time, bool) {
	if s == "" {
		return time.Time{}, false
	}
	t, err := time.Parse(time.RFC3339Nano, s)
	return t, err == nil
}

// chatList: GET /chat/messages?before=<RFC3339>&limit=50 → pesan terbaru (urut lama → baru) + pinned + config.
func (s *Server) chatList(c *gin.Context) {
	st, admin, ok := s.chatAccess(c)
	if !ok {
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit < 1 || limit > 100 {
		limit = 50
	}
	now := time.Now().UTC() // diambil SEBELUM query: titik awal /chat/sync berikutnya (lihat chatSync)
	args := []any{limit + 1}
	where := "m.deleted_at IS NULL"
	if t, ok := parseTS(c.Query("before")); ok {
		args = append(args, t)
		where += " AND m.created_at < $2"
	}
	list, err := s.queryChat(c, chatSelect+` WHERE `+where+` ORDER BY m.created_at DESC LIMIT $1`, args...)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	hasMore := len(list) > limit
	if hasMore {
		list = list[:limit]
	}
	for i, j := 0, len(list)-1; i < j; i, j = i+1, j-1 {
		list[i], list[j] = list[j], list[i]
	}
	pinned, err := s.chatPinned(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{
		"items":          list,
		"has_more":       hasMore,
		"server_time":    now,
		"reset_at":       s.chatResetAt(c),
		"retention_days": st.RetentionDays,
		"pinned":         pinned,
		"config":         chatConfigFor(st, admin),
	})
}

const (
	chatSyncLimit   = 200             // baris maks per respons /chat/sync
	chatSyncOverlap = 2 * time.Second // jendela tumpang-tindih di belakang since (lihat chatSync)
)

// chatSyncPage: potong ke chatSyncLimit. Bila terpotong, kursor berikutnya = updated_at baris terakhir
// (urut updated_at ASC) agar sisa baris terkirim di sync berikutnya; bila tidak, kursor = now.
func chatSyncPage(list []ChatMessage, now time.Time) ([]ChatMessage, time.Time, bool) {
	if len(list) <= chatSyncLimit {
		return list, now, false
	}
	list = list[:chatSyncLimit]
	return list, list[chatSyncLimit-1].UpdatedAt.UTC(), true
}

// chatSync: GET /chat/sync?since=<RFC3339> → pesan yang dibuat/diubah/dihapus sejak waktu itu + pinned + config.
//
// Pendekatan agar tidak ada perubahan yang terlewat:
//   - updated_at dinaikkan dengan clock_timestamp() (bukan now() = awal transaksi), sedekat mungkin dengan COMMIT.
//   - Query memakai since - chatSyncOverlap: baris yang updated_at-nya sedikit lebih tua dari since tetapi baru
//     ter-COMMIT setelah sync sebelumnya tetap terambil. Duplikat aman karena klien menggabung per id.
//   - Urut updated_at ASC, maks chatSyncLimit. Bila terpotong: has_more=true dan server_time = updated_at baris
//     terakhir (bukan now), sehingga sisa baris dikirim di sync berikutnya.
//   - Bila satu halaman penuh hanya berisi baris tumpang-tindih (≤ since), query diulang tanpa overlap agar
//     kursor selalu maju (tidak berputar di tempat).
func (s *Server) chatSync(c *gin.Context) {
	st, admin, ok := s.chatAccess(c)
	if !ok {
		return
	}
	since, ok := parseTS(c.Query("since"))
	if !ok {
		httpx.BadRequest(c, "Parameter since tidak valid.")
		return
	}
	now := time.Now().UTC() // diambil SEBELUM query; baris yang ter-COMMIT setelahnya tertangkap overlap
	q := chatSelect + ` WHERE m.updated_at > $1 ORDER BY m.updated_at ASC, m.id LIMIT $2`
	list, err := s.queryChat(c, q, since.Add(-chatSyncOverlap), chatSyncLimit+1)
	if err == nil && len(list) > chatSyncLimit && !list[chatSyncLimit-1].UpdatedAt.After(since) {
		list, err = s.queryChat(c, q, since, chatSyncLimit+1)
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	list, next, hasMore := chatSyncPage(list, now)
	pinned, err := s.chatPinned(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var purge *time.Time
	if st.AutoDelete {
		p := now.Add(-time.Duration(st.RetentionDays) * 24 * time.Hour)
		purge = &p
	}
	httpx.OK(c, gin.H{
		"items":        list,
		"has_more":     hasMore,
		"server_time":  next,
		"reset_at":     s.chatResetAt(c),
		"purge_before": purge,
		"pinned":       pinned,
		"config":       chatConfigFor(st, admin),
	})
}

// isReplyFKViolation: pesan yang dibalas terhapus permanen di antara validasi & INSERT.
func isReplyFKViolation(err error) bool {
	var pg *pgconn.PgError
	return errors.As(err, &pg) && pg.Code == "23503" && strings.Contains(pg.ConstraintName, "reply_to")
}

// chatSend: POST /chat/messages (multipart: body, file, reply_to, mentions — semua opsional kecuali body/file).
// Pembatasan fitur hanya berlaku untuk peserta; admin selalu boleh.
func (s *Server) chatSend(c *gin.Context) {
	st, admin, ok := s.chatAccess(c)
	if !ok {
		return
	}
	if !admin && !st.PesertaCanSend {
		httpx.Fail(c, http.StatusForbidden, "CHAT_CLOSED", "Grup sedang ditutup. Hanya admin yang dapat mengirim pesan.")
		return
	}
	uid := auth.UserID(c)
	body := strings.TrimSpace(c.PostForm("body"))
	replyRaw := strings.TrimSpace(c.PostForm("reply_to"))
	fh, ferr := c.FormFile("file")
	hasFile := ferr == nil

	// --- fitur yang dimatikan admin (403) ---
	if replyRaw != "" && !admin && !st.Replies {
		chatFeatureOff(c, "Membalas pesan sedang dinonaktifkan admin.")
		return
	}
	if hasFile && !admin {
		if k, okExt := chatExt[strings.ToLower(filepath.Ext(fh.Filename))]; okExt && !st.Attachments.allows(k) {
			chatFeatureOff(c, "Mengirim "+chatKindLabel[k]+" sedang dinonaktifkan admin.")
			return
		}
	}

	// --- validasi isi (sebelum file disimpan agar tidak ada file yatim) ---
	if n := len([]rune(body)); n > chatMaxBody {
		httpx.FailFields(c, "Pesan terlalu panjang.", map[string]string{"body": "Pesan maksimal 2000 karakter."})
		return
	}
	if body == "" && !hasFile {
		httpx.FailFields(c, "Pesan kosong.", map[string]string{"body": "Tulis pesan atau lampirkan file."})
		return
	}
	if !admin && !st.Links && hasURL(body) {
		httpx.FailFields(c, "Mengirim link sedang dinonaktifkan admin.", map[string]string{"body": "Mengirim link sedang dinonaktifkan admin."})
		return
	}
	var replyTo *string
	if replyRaw != "" {
		badReply := func() {
			httpx.FailFields(c, "Pesan yang dibalas tidak ditemukan.", map[string]string{"reply_to": "Pesan yang dibalas tidak ditemukan atau sudah dihapus."})
		}
		rid, err := uuid.Parse(replyRaw)
		if err != nil {
			badReply()
			return
		}
		var exists bool
		if err := s.DB.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM chat_messages WHERE id=$1 AND deleted_at IS NULL)`, rid.String()).Scan(&exists); err != nil {
			httpx.Internal(c, err)
			return
		}
		if !exists {
			badReply()
			return
		}
		r := rid.String()
		replyTo = &r
	}
	mentions := []string{}
	if admin || st.Mentions { // fitur mati → mentions diabaikan
		var err error
		raw := strings.Join(c.PostFormArray("mentions"), ",") // "a,b" atau field berulang
		if mentions, err = s.validMentions(c, parseMentionIDs(raw)); err != nil {
			httpx.Internal(c, err)
			return
		}
	}
	if st.ProfanityFilter {
		body = censor(body)
	}

	kind := "text"
	var fileURL, fileName, fileMime *string
	var fileSize *int64
	if hasFile {
		if fh.Size > chatMaxFile {
			httpx.BadRequest(c, "Ukuran file maksimal 10 MB.")
			return
		}
		ext := strings.ToLower(filepath.Ext(fh.Filename))
		k, okExt := chatExt[ext]
		if !okExt {
			httpx.BadRequest(c, "Jenis file tidak didukung.")
			return
		}
		f, err := fh.Open()
		if err != nil {
			httpx.Internal(c, err)
			return
		}
		defer f.Close()
		head := make([]byte, 512)
		n, _ := io.ReadFull(f, head)
		sniff := http.DetectContentType(head[:n])
		// Tolak konten yang bisa dieksekusi browser (HTML/XML/SVG) walau ekstensinya tampak aman.
		if strings.HasPrefix(sniff, "text/html") || strings.Contains(sniff, "xml") {
			httpx.BadRequest(c, "Isi file tidak diizinkan.")
			return
		}
		if k == "image" && !strings.HasPrefix(sniff, "image/") {
			httpx.BadRequest(c, "File gambar tidak valid.")
			return
		}
		dir := filepath.Join(s.Cfg.UploadDir, chatDir)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			httpx.Internal(c, err)
			return
		}
		stored := uuid.NewString() + ext
		out, err := os.Create(filepath.Join(dir, stored))
		if err != nil {
			httpx.Internal(c, err)
			return
		}
		_, _ = out.Write(head[:n])
		written, err := io.Copy(out, f)
		out.Close()
		url := "/uploads/" + chatDir + "/" + stored
		if err != nil {
			s.removeChatFile(&url)
			httpx.Internal(c, err)
			return
		}
		name := strings.TrimSpace(filepath.Base(fh.Filename))
		if st.ProfanityFilter {
			name = censor(name)
		}
		name = cutRunes(name, 200)
		mime := fh.Header.Get("Content-Type")
		if mime == "" {
			mime = sniff
		}
		size := int64(n) + written
		kind, fileURL, fileName, fileMime, fileSize = k, &url, &name, &mime, &size
	}

	var id string
	if err := s.DB.QueryRow(c, `INSERT INTO chat_messages(user_id, body, kind, file_url, file_name, file_size, file_mime, reply_to, mentions)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::text[]::uuid[]) RETURNING id`,
		uid, body, kind, fileURL, fileName, fileSize, fileMime, replyTo, mentions).Scan(&id); err != nil {
		s.removeChatFile(fileURL)
		if isReplyFKViolation(err) {
			httpx.FailFields(c, "Pesan yang dibalas tidak ditemukan.", map[string]string{"reply_to": "Pesan yang dibalas tidak ditemukan atau sudah dihapus."})
			return
		}
		httpx.Internal(c, err)
		return
	}
	m, err := s.chatByID(c, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if m == nil { // terhapus (mis. reset admin) tepat setelah INSERT
		httpx.NotFound(c, "Pesan tidak ditemukan.")
		return
	}
	httpx.Created(c, m)
}

// chatStar: PATCH /chat/messages/:id/star { starred } — pesan berbintang tidak ikut terhapus otomatis.
func (s *Server) chatStar(c *gin.Context) {
	st, admin, ok := s.chatAccess(c)
	if !ok {
		return
	}
	if !admin && !st.Stars {
		chatFeatureOff(c, "Fitur bintang sedang dinonaktifkan admin.")
		return
	}
	id, ok := pathUUID(c, "id", "Pesan tidak ditemukan.")
	if !ok {
		return
	}
	var in struct {
		Starred *bool `json:"starred"`
	}
	if err := c.ShouldBindJSON(&in); err != nil || in.Starred == nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	var by any
	if *in.Starred {
		by = auth.UserID(c)
	}
	tag, err := s.DB.Exec(c, `UPDATE chat_messages SET starred=$1, starred_by=$2, updated_at=clock_timestamp() WHERE id=$3 AND deleted_at IS NULL`, *in.Starred, by, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Pesan tidak ditemukan.")
		return
	}
	s.respondChatMessage(c, id)
}

// chatDelete: DELETE /chat/messages/:id — pengirim atau admin. Isi, file, reaksi, tag & pin dihapus;
// jejak "pesan dihapus" tetap.
func (s *Server) chatDelete(c *gin.Context) {
	st, admin, ok := s.chatAccess(c)
	if !ok {
		return
	}
	if !admin && !st.UserDelete {
		chatFeatureOff(c, "Menghapus pesan sedang dinonaktifkan admin.")
		return
	}
	id, ok := pathUUID(c, "id", "Pesan tidak ditemukan.")
	if !ok {
		return
	}
	uid := auth.UserID(c)
	var owner string
	var fileURL *string
	if err := s.DB.QueryRow(c, `SELECT user_id, file_url FROM chat_messages WHERE id=$1 AND deleted_at IS NULL`, id).Scan(&owner, &fileURL); err != nil {
		if isNoRows(err) {
			httpx.NotFound(c, "Pesan tidak ditemukan.")
			return
		}
		httpx.Internal(c, err)
		return
	}
	if owner != uid && !admin {
		httpx.Forbidden(c, "Anda hanya dapat menghapus pesan sendiri.")
		return
	}
	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)
	if _, err := tx.Exec(c, `UPDATE chat_messages SET body='', file_url=NULL, file_name=NULL, file_size=NULL, file_mime=NULL,
		starred=false, starred_by=NULL, pinned_at=NULL, pinned_by=NULL, mentions='{}', deleted_at=now(), updated_at=clock_timestamp()
		WHERE id=$1`, id); err != nil {
		httpx.Internal(c, err)
		return
	}
	if _, err := tx.Exec(c, `DELETE FROM chat_reactions WHERE message_id=$1`, id); err != nil {
		httpx.Internal(c, err)
		return
	}
	// balasan ikut dikirim ulang lewat /chat/sync agar kutipannya berubah menjadi "pesan dihapus"
	if _, err := tx.Exec(c, `UPDATE chat_messages SET updated_at=clock_timestamp() WHERE reply_to=$1 AND deleted_at IS NULL`, id); err != nil {
		httpx.Internal(c, err)
		return
	}
	if err := tx.Commit(c); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.removeChatFile(fileURL)
	httpx.OK(c, gin.H{"message": "Pesan dihapus."})
}

// chatReset: POST /admin/chat/reset — hapus SEMUA riwayat GroupChat termasuk pesan berbintang, tersemat, reaksi & file.
// Pengaturan GroupChat (chat_settings) tidak ikut direset.
func (s *Server) chatReset(c *gin.Context) {
	if _, err := s.DB.Exec(c, `DELETE FROM chat_messages`); err != nil {
		httpx.Internal(c, err)
		return
	}
	_ = os.RemoveAll(filepath.Join(s.Cfg.UploadDir, chatDir))
	now := time.Now().UTC()
	raw, _ := json.Marshal(gin.H{"reset_at": now})
	if _, err := s.DB.Exec(c, `INSERT INTO settings(key, value) VALUES ('chat', $1) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`, raw); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "groupchat.reset", "Semua riwayat GroupChat dihapus")
	httpx.OK(c, gin.H{"message": "GroupChat direset.", "reset_at": now})
}

// purgeChat: satu transaksi — naikkan updated_at balasan yang masih ada dari pesan yang akan dihapus
// (reply_to akan menjadi NULL lewat ON DELETE SET NULL) agar /chat/sync menyegarkan kutipannya, lalu hapus
// permanen. now() sama di kedua statement sehingga predikatnya identik. File dihapus setelah COMMIT.
func (s *Server) purgeChat(ctx context.Context, pred string, args []any) (int, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `UPDATE chat_messages SET updated_at=clock_timestamp()
		WHERE deleted_at IS NULL AND reply_to IN (SELECT id FROM chat_messages WHERE `+pred+`)`, args...); err != nil {
		return 0, err
	}
	rows, err := tx.Query(ctx, `DELETE FROM chat_messages WHERE `+pred+` RETURNING file_url`, args...)
	if err != nil {
		return 0, err
	}
	urls := []*string{}
	for rows.Next() {
		var url *string
		if err := rows.Scan(&url); err != nil {
			rows.Close()
			return 0, err
		}
		urls = append(urls, url)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, err
	}
	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	for _, u := range urls {
		s.removeChatFile(u)
	}
	return len(urls), nil
}

func (s *Server) removeChatFile(url *string) {
	if url == nil || !strings.HasPrefix(*url, "/uploads/"+chatDir+"/") {
		return
	}
	name := filepath.Base(*url)
	_ = os.Remove(filepath.Join(s.Cfg.UploadDir, chatDir, name))
}

// StartChatJanitor: tiap jam membaca pengaturan; bila auto_delete aktif, hapus pesan yang tidak berbintang
// & tidak tersemat yang lebih tua dari retention_days (termasuk file-nya). Jejak pesan terhapus > 1 hari
// selalu dibersihkan.
func (s *Server) StartChatJanitor(ctx context.Context) {
	run := func() {
		st, err := s.loadChatSettingsErr(ctx)
		if err != nil { // jangan menebak pengaturan saat DB bermasalah
			log.Printf("pembersihan GroupChat dilewati: %v", err)
			return
		}
		// predikat pesan yang dihapus permanen
		pred := `deleted_at IS NOT NULL AND deleted_at < now() - interval '1 day'`
		args := []any{}
		if st.AutoDelete {
			pred = `(starred = false AND pinned_at IS NULL AND created_at < now() - make_interval(days => $1))
				OR (deleted_at IS NOT NULL AND deleted_at < now() - interval '1 day')`
			args = append(args, st.RetentionDays)
		}
		n, err := s.purgeChat(ctx, pred, args)
		if err != nil {
			log.Printf("pembersihan GroupChat gagal: %v", err)
			return
		}
		if n > 0 {
			log.Printf("GroupChat: %d pesan lama dihapus otomatis", n)
		}
	}
	go func() {
		run()
		t := time.NewTicker(time.Hour)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				run()
			}
		}
	}()
}
