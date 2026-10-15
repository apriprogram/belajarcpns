package app

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
)

// ---------- Pengaturan GroupChat (settings.key='chat_settings') ----------

const (
	chatSettingsKey      = "chat_settings"
	chatDefaultRetention = 7
	chatMinRetention     = 1
	chatMaxRetention     = 90
)

// ChatAttachSettings: jenis lampiran yang boleh dikirim peserta.
type ChatAttachSettings struct {
	Image    bool `json:"image"`
	Video    bool `json:"video"`
	Audio    bool `json:"audio"`
	Document bool `json:"document"`
}

// allows: jenis pesan (image|video|audio|file) → apakah lampiran itu aktif.
func (a ChatAttachSettings) allows(kind string) bool {
	switch kind {
	case "image":
		return a.Image
	case "video":
		return a.Video
	case "audio":
		return a.Audio
	default:
		return a.Document
	}
}

// chatKindLabel: label jenis lampiran untuk pesan galat.
var chatKindLabel = map[string]string{"image": "gambar", "video": "video", "audio": "audio", "file": "dokumen"}

// ChatSettings: toggle fitur GroupChat. Toggle fitur hanya membatasi peserta; admin selalu bisa semua.
// profanity_filter, auto_delete, retention_days berlaku global.
type ChatSettings struct {
	Enabled         bool               `json:"enabled"`
	PesertaCanSend  bool               `json:"peserta_can_send"`
	Attachments     ChatAttachSettings `json:"attachments"`
	Links           bool               `json:"links"`
	Emoji           bool               `json:"emoji"`
	Reactions       bool               `json:"reactions"`
	Replies         bool               `json:"replies"`
	Mentions        bool               `json:"mentions"`
	Stars           bool               `json:"stars"`
	UserDelete      bool               `json:"user_delete"`
	ProfanityFilter bool               `json:"profanity_filter"`
	AutoDelete      bool               `json:"auto_delete"`
	RetentionDays   int                `json:"retention_days"`
}

// DefaultChatSettings: semua fitur aktif, retensi 7 hari.
func DefaultChatSettings() ChatSettings {
	return ChatSettings{
		Enabled:         true,
		PesertaCanSend:  true,
		Attachments:     ChatAttachSettings{Image: true, Video: true, Audio: true, Document: true},
		Links:           true,
		Emoji:           true,
		Reactions:       true,
		Replies:         true,
		Mentions:        true,
		Stars:           true,
		UserDelete:      true,
		ProfanityFilter: true,
		AutoDelete:      true,
		RetentionDays:   chatDefaultRetention,
	}
}

// parseChatSettings: nilai tersimpan di-unmarshal ke struct default (kunci yang tidak ada = default).
// Retensi di luar 1–90 (mis. diubah manual di DB) dikembalikan ke default agar janitor tetap aman.
func parseChatSettings(raw []byte) ChatSettings {
	st := DefaultChatSettings()
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &st); err != nil {
			st = DefaultChatSettings()
		}
	}
	if st.RetentionDays < chatMinRetention || st.RetentionDays > chatMaxRetention {
		st.RetentionDays = chatDefaultRetention
	}
	return st
}

// validate: galat per field (kosong = valid).
func (st ChatSettings) validate() map[string]string {
	f := map[string]string{}
	if st.RetentionDays < chatMinRetention || st.RetentionDays > chatMaxRetention {
		f["retention_days"] = "Nilai harus 1–90 hari."
	}
	return f
}

// loadChatSettingsErr: belum pernah disimpan → default; galat DB lain dikembalikan agar pemanggil
// tidak diam-diam memakai default (yang membuka semua batasan peserta).
func (s *Server) loadChatSettingsErr(ctx context.Context) (ChatSettings, error) {
	var raw []byte
	if err := s.DB.QueryRow(ctx, `SELECT value FROM settings WHERE key=$1`, chatSettingsKey).Scan(&raw); err != nil {
		if isNoRows(err) {
			return DefaultChatSettings(), nil
		}
		return DefaultChatSettings(), err
	}
	return parseChatSettings(raw), nil
}

// loadChatSettings: pengaturan efektif (default bila belum tersimpan / gagal dibaca).
// Hanya untuk GET /chat/config yang wajib selalu 200.
func (s *Server) loadChatSettings(ctx context.Context) ChatSettings {
	st, _ := s.loadChatSettingsErr(ctx)
	return st
}

// ---------- Konfigurasi publik ----------

type ChatFeatures struct {
	Attachments ChatAttachSettings `json:"attachments"`
	Links       bool               `json:"links"`
	Emoji       bool               `json:"emoji"`
	Reactions   bool               `json:"reactions"`
	Replies     bool               `json:"replies"`
	Mentions    bool               `json:"mentions"`
	Stars       bool               `json:"stars"`
	UserDelete  bool               `json:"user_delete"`
}

// ChatGroupStatus: status grup asli (hanya dikirim ke admin).
type ChatGroupStatus struct {
	Enabled        bool `json:"enabled"`
	PesertaCanSend bool `json:"peserta_can_send"`
}

type ChatConfig struct {
	Enabled       bool             `json:"enabled"`
	CanSend       bool             `json:"can_send"`
	IsAdmin       bool             `json:"is_admin"`
	RetentionDays int              `json:"retention_days"`
	AutoDelete    bool             `json:"auto_delete"`
	Features      ChatFeatures     `json:"features"`
	Group         *ChatGroupStatus `json:"group,omitempty"`
}

// chatConfigFor: admin tidak dibatasi (semua true) tetapi menerima status grup asli; peserta = nilai pengaturan.
func chatConfigFor(st ChatSettings, isAdmin bool) ChatConfig {
	cfg := ChatConfig{
		IsAdmin:       isAdmin,
		RetentionDays: st.RetentionDays,
		AutoDelete:    st.AutoDelete,
	}
	if isAdmin {
		cfg.Enabled, cfg.CanSend = true, true
		cfg.Features = ChatFeatures{
			Attachments: ChatAttachSettings{Image: true, Video: true, Audio: true, Document: true},
			Links:       true, Emoji: true, Reactions: true, Replies: true, Mentions: true, Stars: true, UserDelete: true,
		}
		cfg.Group = &ChatGroupStatus{Enabled: st.Enabled, PesertaCanSend: st.PesertaCanSend}
		return cfg
	}
	cfg.Enabled = st.Enabled
	cfg.CanSend = st.Enabled && st.PesertaCanSend
	cfg.Features = ChatFeatures{
		Attachments: st.Attachments,
		Links:       st.Links, Emoji: st.Emoji, Reactions: st.Reactions, Replies: st.Replies,
		Mentions: st.Mentions, Stars: st.Stars, UserDelete: st.UserDelete,
	}
	return cfg
}

func isChatAdmin(c *gin.Context) bool { return auth.Role(c) == "admin" }

// chatAccess: memuat pengaturan & memblokir peserta saat GroupChat nonaktif (403 CHAT_DISABLED).
// Admin selalu lolos. ok=false berarti respons galat sudah dikirim (500 bila pengaturan gagal dibaca).
func (s *Server) chatAccess(c *gin.Context) (st ChatSettings, isAdmin, ok bool) {
	st, err := s.loadChatSettingsErr(c)
	if err != nil {
		httpx.Internal(c, err)
		return st, false, false
	}
	isAdmin = isChatAdmin(c)
	if !isAdmin && !st.Enabled {
		httpx.Fail(c, http.StatusForbidden, "CHAT_DISABLED", "GroupChat sedang dinonaktifkan admin.")
		return st, isAdmin, false
	}
	return st, isAdmin, true
}

func chatFeatureOff(c *gin.Context, msg string) {
	httpx.Fail(c, http.StatusForbidden, "CHAT_FEATURE_DISABLED", msg)
}

// chatConfigHandler: GET /chat/config — selalu 200, juga saat GroupChat dinonaktifkan.
func (s *Server) chatConfigHandler(c *gin.Context) {
	httpx.OK(c, chatConfigFor(s.loadChatSettings(c), isChatAdmin(c)))
}

// ---------- Admin: pengaturan & statistik ----------

type ChatStats struct {
	Messages  int `json:"messages"`
	Starred   int `json:"starred"`
	Pinned    int `json:"pinned"`
	Files     int `json:"files"`
	Reactions int `json:"reactions"`
	Members7d int `json:"members_7d"`
}

// getChatSettings: GET /admin/chat/settings → { settings, stats } (statistik pesan yang tidak terhapus).
func (s *Server) getChatSettings(c *gin.Context) {
	var st ChatStats
	if err := s.DB.QueryRow(c, `SELECT count(*),
		count(*) FILTER (WHERE starred),
		count(*) FILTER (WHERE pinned_at IS NOT NULL),
		count(*) FILTER (WHERE file_url IS NOT NULL),
		(SELECT count(*) FROM chat_reactions r JOIN chat_messages x ON x.id=r.message_id WHERE x.deleted_at IS NULL),
		count(DISTINCT user_id) FILTER (WHERE created_at > now() - interval '7 days')
		FROM chat_messages WHERE deleted_at IS NULL`).
		Scan(&st.Messages, &st.Starred, &st.Pinned, &st.Files, &st.Reactions, &st.Members7d); err != nil {
		httpx.Internal(c, err)
		return
	}
	cfg, err := s.loadChatSettingsErr(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"settings": cfg, "stats": st})
}

// updateChatSettings: PUT /admin/chat/settings — body = objek pengaturan lengkap.
func (s *Server) updateChatSettings(c *gin.Context) {
	// galat baca → 500; jangan menimpa pengaturan tersimpan dengan default + body parsial
	st, err := s.loadChatSettingsErr(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	old := st
	if err := c.ShouldBindJSON(&st); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if f := st.validate(); len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali pengaturan GroupChat.", f)
		return
	}
	raw, _ := json.Marshal(st)
	if _, err := s.DB.Exec(c, `INSERT INTO settings(key, value, updated_at) VALUES ($1, $2, now())
		ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`, chatSettingsKey, raw); err != nil {
		httpx.Internal(c, err)
		return
	}
	if sum := chatSettingsSummary(old, st); sum != "" { // tanpa perubahan → tidak dicatat
		s.logActivity(c, auth.UserID(c), "groupchat.pengaturan", sum)
	}
	httpx.OK(c, gin.H{"settings": st})
}

// chatSettingsSummary: ringkasan perubahan untuk log aktivitas, mis. "Grup ditutup, Reaksi dimatikan".
// String kosong bila tidak ada yang berubah.
func chatSettingsSummary(old, cur ChatSettings) string {
	out := []string{}
	onOff := func(was, now bool, name string) {
		if was == now {
			return
		}
		if now {
			out = append(out, name+" diaktifkan")
		} else {
			out = append(out, name+" dimatikan")
		}
	}
	if old.Enabled != cur.Enabled {
		if cur.Enabled {
			out = append(out, "GroupChat diaktifkan")
		} else {
			out = append(out, "GroupChat dinonaktifkan")
		}
	}
	if old.PesertaCanSend != cur.PesertaCanSend {
		if cur.PesertaCanSend {
			out = append(out, "Grup dibuka")
		} else {
			out = append(out, "Grup ditutup")
		}
	}
	onOff(old.Attachments.Image, cur.Attachments.Image, "Lampiran gambar")
	onOff(old.Attachments.Video, cur.Attachments.Video, "Lampiran video")
	onOff(old.Attachments.Audio, cur.Attachments.Audio, "Lampiran audio")
	onOff(old.Attachments.Document, cur.Attachments.Document, "Lampiran dokumen")
	onOff(old.Links, cur.Links, "Link")
	onOff(old.Emoji, cur.Emoji, "Emoji")
	onOff(old.Reactions, cur.Reactions, "Reaksi")
	onOff(old.Replies, cur.Replies, "Balas pesan")
	onOff(old.Mentions, cur.Mentions, "Tag anggota")
	onOff(old.Stars, cur.Stars, "Bintang pesan")
	onOff(old.UserDelete, cur.UserDelete, "Hapus pesan oleh peserta")
	onOff(old.ProfanityFilter, cur.ProfanityFilter, "Filter kata kasar")
	switch {
	case !cur.AutoDelete && old.AutoDelete:
		out = append(out, "Hapus otomatis dimatikan")
	case cur.AutoDelete && (!old.AutoDelete || old.RetentionDays != cur.RetentionDays):
		out = append(out, fmt.Sprintf("Hapus otomatis %d hari", cur.RetentionDays))
	}
	if !cur.AutoDelete && old.RetentionDays != cur.RetentionDays {
		out = append(out, fmt.Sprintf("Masa simpan diubah ke %d hari", cur.RetentionDays))
	}
	return strings.Join(out, ", ")
}
