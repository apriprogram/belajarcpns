package app

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strings"
	"testing"
	"time"
)

func TestChatSettingsDefaults(t *testing.T) {
	d := DefaultChatSettings()
	want := ChatSettings{
		Enabled: true, PesertaCanSend: true,
		Attachments: ChatAttachSettings{Image: true, Video: true, Audio: true, Document: true},
		Links:       true, Emoji: true, Reactions: true, Replies: true, Mentions: true, Stars: true,
		UserDelete: true, ProfanityFilter: true, AutoDelete: true, RetentionDays: 7,
	}
	if d != want {
		t.Fatalf("default = %+v, want %+v", d, want)
	}
	// belum tersimpan / JSON rusak → default
	for _, raw := range [][]byte{nil, []byte(``), []byte(`{}`), []byte(`not-json`)} {
		if got := parseChatSettings(raw); got != want {
			t.Errorf("parseChatSettings(%q) = %+v, want default", raw, got)
		}
	}
	// kunci JSON persis sesuai kontrak
	b, _ := json.Marshal(d)
	var m map[string]any
	_ = json.Unmarshal(b, &m)
	for _, k := range []string{"enabled", "peserta_can_send", "attachments", "links", "emoji", "reactions", "replies",
		"mentions", "stars", "user_delete", "profanity_filter", "auto_delete", "retention_days"} {
		if _, ok := m[k]; !ok {
			t.Errorf("kunci %q tidak ada di JSON", k)
		}
	}
	att, _ := m["attachments"].(map[string]any)
	for _, k := range []string{"image", "video", "audio", "document"} {
		if _, ok := att[k]; !ok {
			t.Errorf("kunci attachments.%q tidak ada di JSON", k)
		}
	}
}

func TestChatSettingsMerge(t *testing.T) {
	got := parseChatSettings([]byte(`{"enabled":false,"attachments":{"video":false},"links":false,"retention_days":30}`))
	want := DefaultChatSettings()
	want.Enabled = false
	want.Attachments.Video = false
	want.Links = false
	want.RetentionDays = 30
	if got != want {
		t.Fatalf("merge = %+v, want %+v", got, want)
	}
	// retensi tersimpan di luar batas → default (janitor tidak boleh memakai 0 hari)
	for _, raw := range []string{`{"retention_days":0}`, `{"retention_days":-3}`, `{"retention_days":91}`} {
		if got := parseChatSettings([]byte(raw)).RetentionDays; got != chatDefaultRetention {
			t.Errorf("parseChatSettings(%s).RetentionDays = %d, want %d", raw, got, chatDefaultRetention)
		}
	}
	// PUT parsial di atas pengaturan saat ini: kunci yang tidak dikirim tetap
	cur := DefaultChatSettings()
	cur.Stars = false
	if err := json.Unmarshal([]byte(`{"peserta_can_send":false}`), &cur); err != nil {
		t.Fatal(err)
	}
	if cur.PesertaCanSend || cur.Stars || !cur.Enabled || !cur.Attachments.Image {
		t.Errorf("PUT parsial = %+v", cur)
	}
}

func TestChatSettingsValidate(t *testing.T) {
	cases := map[int]bool{-1: false, 0: false, 1: true, 7: true, 90: true, 91: false, 365: false}
	for days, valid := range cases {
		st := DefaultChatSettings()
		st.RetentionDays = days
		f := st.validate()
		if valid && len(f) != 0 {
			t.Errorf("retention_days=%d: galat tak terduga %v", days, f)
		}
		if !valid {
			if _, ok := f["retention_days"]; !ok {
				t.Errorf("retention_days=%d: harus galat pada fields.retention_days", days)
			}
		}
	}
}

func TestChatConfigFor(t *testing.T) {
	st := DefaultChatSettings()
	st.Enabled, st.PesertaCanSend, st.Reactions, st.Attachments.Audio = true, false, false, false
	st.RetentionDays, st.AutoDelete = 14, false

	p := chatConfigFor(st, false)
	if !p.Enabled || p.CanSend || p.IsAdmin || p.Group != nil {
		t.Errorf("peserta: %+v", p)
	}
	if p.Features.Reactions || p.Features.Attachments.Audio || !p.Features.Attachments.Image {
		t.Errorf("peserta features: %+v", p.Features)
	}
	if p.RetentionDays != 14 || p.AutoDelete {
		t.Errorf("peserta retensi: %+v", p)
	}

	a := chatConfigFor(st, true)
	if !a.Enabled || !a.CanSend || !a.IsAdmin || !a.Features.Reactions || !a.Features.Attachments.Audio {
		t.Errorf("admin harus tanpa batasan: %+v", a)
	}
	if a.Group == nil || !a.Group.Enabled || a.Group.PesertaCanSend {
		t.Errorf("admin group: %+v", a.Group)
	}

	st.Enabled = false
	if p := chatConfigFor(st, false); p.Enabled || p.CanSend {
		t.Errorf("peserta saat nonaktif: %+v", p)
	}
}

func TestChatAttachAllows(t *testing.T) {
	a := ChatAttachSettings{Image: true, Video: false, Audio: true, Document: false}
	want := map[string]bool{"image": true, "video": false, "audio": true, "file": false}
	for k, w := range want {
		if a.allows(k) != w {
			t.Errorf("allows(%q) = %v, want %v", k, !w, w)
		}
		if chatKindLabel[k] == "" {
			t.Errorf("label %q kosong", k)
		}
	}
}

func TestParseMentionIDs(t *testing.T) {
	a := "11111111-1111-1111-1111-111111111111"
	b := "22222222-2222-2222-2222-222222222222"
	got := parseMentionIDs(" " + a + ",bukan-uuid, " + strings.ToUpper(a) + "," + b + ",,00000000-0000-0000-0000-000000000000," + a)
	if !reflect.DeepEqual(got, []string{a, b}) {
		t.Errorf("dedupe/invalid = %v", got)
	}
	if got := parseMentionIDs(""); got == nil || len(got) != 0 {
		t.Errorf("kosong harus [] bukan nil: %#v", got)
	}
	var parts []string
	for i := 1; i <= 15; i++ {
		parts = append(parts, fmt.Sprintf("00000000-0000-0000-0000-%012x", i))
	}
	got = parseMentionIDs(strings.Join(parts, ","))
	if len(got) != chatMaxMentions || got[0] != parts[0] || got[9] != parts[9] {
		t.Errorf("maks 10 = %v", got)
	}
}

func TestValidEmoji(t *testing.T) {
	flagEngland := "🏴\U000E0067\U000E0062\U000E0065\U000E006E\U000E0067\U000E007F" // 7 rune, 28 byte
	ok := []string{"👍", "❤️", "😂", "😮", "😢", "🙏", "🇮🇩", "👨‍👩‍👧", "✅", "👍🏽", "👩🏽‍💻", "©️", flagEngland,
		"\U0001FAE9" /* emoji lebih baru dari tabel Unicode Go */, strings.Repeat("©", 10) /* 10 rune */}
	for _, e := range ok {
		if !validEmoji(e) {
			t.Errorf("validEmoji(%q) = false, want true", e)
		}
	}
	bad := []string{"", "a", "Z", "7", "ok👍", "👍 ", " ", "\t", "<", ">", "<b>", "\x00", "\xff\xfe",
		strings.Repeat("👍", 9) /* 36 byte */, " ",
		"é", "中", "ß", "١", "½", "Ⅻ", // huruf/angka non-ASCII
		"#️⃣", "1️⃣", "👍!", "→", "‼", // keycap, ASCII, tanpa simbol So
		"​👍", "👍‮", "⁠👍", "‍", "️", "\U000E0067", // format tak terlihat / penanda saja
		"😀́", strings.Repeat("©", 11) /* 11 rune */}
	for _, e := range bad {
		if validEmoji(e) {
			t.Errorf("validEmoji(%q) = true, want false", e)
		}
	}
	if s := strings.Repeat("👍", 8); len(s) != 32 || !validEmoji(s) {
		t.Errorf("32 byte harus valid")
	}
	if len(flagEngland) != 28 {
		t.Errorf("flagEngland = %d byte", len(flagEngland))
	}
}

func TestChatSyncPage(t *testing.T) {
	base := time.Date(2026, 10, 1, 8, 0, 0, 0, time.UTC)
	now := base.Add(time.Hour)
	mk := func(n int) []ChatMessage {
		l := make([]ChatMessage, n)
		for i := range l {
			l[i].ID = fmt.Sprint(i)
			l[i].UpdatedAt = base.Add(time.Duration(i) * time.Second)
		}
		return l
	}
	// tidak terpotong → kursor = now
	l, next, more := chatSyncPage(mk(chatSyncLimit), now)
	if len(l) != chatSyncLimit || !next.Equal(now) || more {
		t.Errorf("penuh tanpa sisa: len=%d next=%v more=%v", len(l), next, more)
	}
	// terpotong → 200 baris, kursor = updated_at baris terakhir yang dikirim (bukan now)
	l, next, more = chatSyncPage(mk(chatSyncLimit+1), now)
	if len(l) != chatSyncLimit || !more || !next.Equal(base.Add((chatSyncLimit-1)*time.Second)) {
		t.Errorf("terpotong: len=%d next=%v more=%v", len(l), next, more)
	}
	if l, next, more = chatSyncPage([]ChatMessage{}, now); len(l) != 0 || !next.Equal(now) || more {
		t.Errorf("kosong: len=%d next=%v more=%v", len(l), next, more)
	}
	if chatSyncOverlap <= 0 {
		t.Errorf("overlap harus > 0")
	}
}

func TestChatSettingsSummary(t *testing.T) {
	d := DefaultChatSettings()
	if got := chatSettingsSummary(d, d); got != "" {
		t.Errorf("tanpa perubahan = %q", got)
	}
	cur := d
	cur.PesertaCanSend, cur.Reactions, cur.Attachments.Video = false, false, false
	if got, want := chatSettingsSummary(d, cur), "Grup ditutup, Lampiran video dimatikan, Reaksi dimatikan"; got != want {
		t.Errorf("got %q, want %q", got, want)
	}
	if got := chatSettingsSummary(cur, d); got != "Grup dibuka, Lampiran video diaktifkan, Reaksi diaktifkan" {
		t.Errorf("kebalikan = %q", got)
	}
	cur = d
	cur.RetentionDays = 14
	if got := chatSettingsSummary(d, cur); got != "Hapus otomatis 14 hari" {
		t.Errorf("retensi = %q", got)
	}
	cur.AutoDelete = false
	if got := chatSettingsSummary(d, cur); got != "Hapus otomatis dimatikan, Masa simpan diubah ke 14 hari" {
		t.Errorf("auto delete off = %q", got)
	}
	if got := chatSettingsSummary(cur, d); got != "Hapus otomatis 7 hari" {
		t.Errorf("auto delete on = %q", got)
	}
	cur = d
	cur.Enabled = false
	if got := chatSettingsSummary(d, cur); got != "GroupChat dinonaktifkan" {
		t.Errorf("nonaktif = %q", got)
	}
}

func TestHasURL(t *testing.T) {
	yes := []string{"http://contoh.id", "lihat HTTPS://X.ID ya", "kunjungi www.google.com", "WWW.bkn.go.id",
		"(www.x.id)", "link:https://a", "Www.Situs.com"}
	for _, s := range yes {
		if !hasURL(s) {
			t.Errorf("hasURL(%q) = false, want true", s)
		}
	}
	no := []string{"", "halo semua", "awww.", "http:/salah", "wwwx", "ftp://x", "semangat www"}
	for _, s := range no {
		if hasURL(s) {
			t.Errorf("hasURL(%q) = true, want false", s)
		}
	}
}

func TestCutRunes(t *testing.T) {
	if got := cutRunes("héllo", 3); got != "hél" {
		t.Errorf("cutRunes = %q", got)
	}
	if got := cutRunes("abc", 120); got != "abc" {
		t.Errorf("cutRunes = %q", got)
	}
	if got := cutRunes(strings.Repeat("é", 130), chatReplyCut); len([]rune(got)) != 120 {
		t.Errorf("panjang = %d", len([]rune(got)))
	}
}
