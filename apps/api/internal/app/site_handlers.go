package app

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ---------- Atur Website (CMS) — lihat docs/SITE-CMS.md ----------

const (
	siteKey       = "site"
	siteDir       = "site" // sub-folder di UPLOAD_DIR
	siteMaxJSON   = 256 << 10
	siteMaxImage  = 5 << 20
	siteMaxVideo  = 50 << 20
	siteUploadMax = siteMaxVideo
)

// siteGet: GET /api/site (publik) → { site, updated_at }.
func (s *Server) siteGet(c *gin.Context) {
	var raw []byte
	var updated *time.Time
	err := s.DB.QueryRow(c, `SELECT value, updated_at FROM settings WHERE key=$1`, siteKey).Scan(&raw, &updated)
	if err != nil && !isNoRows(err) {
		httpx.Internal(c, err)
		return
	}
	site := json.RawMessage(`{}`)
	if len(raw) > 0 {
		site = raw
	}
	c.Header("Cache-Control", "no-store")
	httpx.OK(c, gin.H{"site": site, "updated_at": updated})
}

// siteUpdate: PUT /api/admin/site — simpan objek site lengkap (menimpa).
func (s *Server) siteUpdate(c *gin.Context) {
	body, err := io.ReadAll(io.LimitReader(c.Request.Body, siteMaxJSON+1))
	if err != nil {
		httpx.BadRequest(c, "Gagal membaca data.")
		return
	}
	if len(body) > siteMaxJSON {
		httpx.BadRequest(c, "Data situs terlalu besar (maks 256 KB).")
		return
	}
	var obj map[string]any
	if err := json.Unmarshal(body, &obj); err != nil || obj == nil {
		httpx.BadRequest(c, "Format data situs tidak valid (harus objek JSON).")
		return
	}
	norm, _ := json.Marshal(obj)
	var updated time.Time
	if err := s.DB.QueryRow(c, `INSERT INTO settings(key, value, updated_at) VALUES ($1, $2, now())
		ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now() RETURNING updated_at`, siteKey, norm).Scan(&updated); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "situs.ubah", "Mengubah tampilan & konten website")
	httpx.OK(c, gin.H{"site": json.RawMessage(norm), "updated_at": updated})
}

// siteReset: DELETE /api/admin/site — kembali ke konten bawaan.
func (s *Server) siteReset(c *gin.Context) {
	if _, err := s.DB.Exec(c, `DELETE FROM settings WHERE key=$1`, siteKey); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "situs.reset", "Mengembalikan website ke tampilan bawaan")
	httpx.OK(c, gin.H{"site": json.RawMessage(`{}`), "updated_at": nil})
}

// siteUpload: POST /api/admin/site/upload (multipart "file") — gambar ≤5 MB atau video ≤50 MB.
func (s *Server) siteUpload(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, siteUploadMax+(1<<20))
	fh, err := c.FormFile("file")
	if err != nil {
		httpx.BadRequest(c, "Pilih file gambar atau video (maks 50 MB).")
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
	ext := strings.ToLower(filepath.Ext(fh.Filename))
	kind := ""
	switch {
	case sniff == "image/png":
		kind, ext = "image", ".png"
	case sniff == "image/jpeg":
		kind, ext = "image", ".jpg"
	case sniff == "image/webp":
		kind, ext = "image", ".webp"
	case sniff == "image/gif":
		kind, ext = "image", ".gif"
	case sniff == "image/x-icon" || sniff == "image/vnd.microsoft.icon":
		kind, ext = "image", ".ico"
	case sniff == "video/webm" || (ext == ".webm" && sniff == "application/octet-stream"):
		kind, ext = "video", ".webm"
	case sniff == "video/mp4" || ext == ".mp4" && sniff == "application/octet-stream":
		kind, ext = "video", ".mp4"
	}
	if kind == "" {
		httpx.BadRequest(c, "Format tidak didukung. Gunakan PNG, JPG, WEBP, GIF, ICO, MP4, atau WEBM.")
		return
	}
	if kind == "image" && fh.Size > siteMaxImage {
		httpx.BadRequest(c, "Ukuran gambar maksimal 5 MB.")
		return
	}
	if fh.Size > siteMaxVideo {
		httpx.BadRequest(c, "Ukuran video maksimal 50 MB.")
		return
	}
	dir := filepath.Join(s.Cfg.UploadDir, siteDir)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		httpx.Internal(c, err)
		return
	}
	name := uuid.NewString() + ext
	out, err := os.Create(filepath.Join(dir, name))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	_, _ = out.Write(head[:n])
	written, err := io.Copy(out, f)
	out.Close()
	if err != nil {
		_ = os.Remove(filepath.Join(dir, name))
		httpx.Internal(c, err)
		return
	}
	httpx.Created(c, gin.H{"url": "/uploads/" + siteDir + "/" + name, "kind": kind, "name": filepath.Base(fh.Filename), "size": int64(n) + written})
}
