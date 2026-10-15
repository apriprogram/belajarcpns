package app

import (
	"io"
	"log"
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

// ---------- Profil: jenis kelamin & foto profil ----------

const (
	avatarDir     = "avatars" // sub-folder di UPLOAD_DIR
	avatarMaxSize = 2 << 20   // 2 MB
)

var genders = map[string]bool{"laki-laki": true, "perempuan": true}

// uploadAvatar: POST /me/avatar (multipart "file") — PNG/JPG/WEBP maks 2 MB; foto lama dihapus.
func (s *Server) uploadAvatar(c *gin.Context) {
	fh, err := c.FormFile("file")
	if err != nil {
		httpx.BadRequest(c, "Pilih foto profil.")
		return
	}
	if fh.Size > avatarMaxSize {
		httpx.BadRequest(c, "Ukuran foto maksimal 2 MB.")
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
	ext := map[string]string{"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}[http.DetectContentType(head[:n])]
	if ext == "" {
		httpx.BadRequest(c, "Foto harus berformat PNG, JPG, atau WEBP.")
		return
	}
	dir := filepath.Join(s.Cfg.UploadDir, avatarDir)
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
	_, err = io.Copy(out, f)
	out.Close()
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	url := "/uploads/" + avatarDir + "/" + name
	var old *string
	_ = s.DB.QueryRow(c, `SELECT avatar_url FROM users WHERE id=$1`, auth.UserID(c)).Scan(&old)
	var u User
	if err := scanUser(s.DB.QueryRow(c, `UPDATE users SET avatar_url=$1, updated_at=now() WHERE id=$2 RETURNING `+userCols, url, auth.UserID(c)), &u); err != nil {
		_ = os.Remove(filepath.Join(dir, name))
		httpx.Internal(c, err)
		return
	}
	s.removeAvatarFile(old)
	httpx.OK(c, u)
}

// deleteAvatar: DELETE /me/avatar — kembali ke inisial nama.
func (s *Server) deleteAvatar(c *gin.Context) {
	var old *string
	_ = s.DB.QueryRow(c, `SELECT avatar_url FROM users WHERE id=$1`, auth.UserID(c)).Scan(&old)
	var u User
	if err := scanUser(s.DB.QueryRow(c, `UPDATE users SET avatar_url=NULL, updated_at=now() WHERE id=$1 RETURNING `+userCols, auth.UserID(c)), &u); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.removeAvatarFile(old)
	httpx.OK(c, u)
}

func (s *Server) removeAvatarFile(url *string) {
	if url == nil || !strings.HasPrefix(*url, "/uploads/"+avatarDir+"/") {
		return
	}
	_ = os.Remove(filepath.Join(s.Cfg.UploadDir, avatarDir, filepath.Base(*url)))
}

// validateProfileExtra memvalidasi & merapikan alamat, tempat lahir, tanggal lahir (nil = tidak diubah).
func validateProfileExtra(f v, address, place, date **string) {
	trim := func(p **string) {
		if *p != nil {
			t := strings.TrimSpace(**p)
			*p = &t
		}
	}
	trim(address)
	trim(place)
	trim(date)
	if *address != nil && len([]rune(**address)) > 300 {
		f["address"] = "Alamat maksimal 300 karakter."
	}
	if *place != nil && len([]rune(**place)) > 100 {
		f["birth_place"] = "Tempat lahir maksimal 100 karakter."
	}
	if *date != nil && **date != "" {
		d, err := time.Parse("2006-01-02", **date)
		now := time.Now()
		switch {
		case err != nil:
			f["birth_date"] = "Format tanggal lahir tidak valid."
		case d.After(now):
			f["birth_date"] = "Tanggal lahir tidak boleh di masa depan."
		case d.Year() < 1940 || now.Sub(d) < 10*365*24*time.Hour:
			f["birth_date"] = "Periksa kembali tanggal lahir Anda."
		}
	}
}

// adminDeleteUser: DELETE /admin/users/:id — hapus permanen PESERTA beserta profil, foto,
// riwayat latihan, tryout/ujian, hasil, target, dan pesan GroupChat-nya (FK ON DELETE CASCADE).
func (s *Server) adminDeleteUser(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Peserta tidak ditemukan.")
	if !ok {
		return
	}
	var name, email, role string
	var avatar *string
	if err := s.DB.QueryRow(c, `SELECT name, email, role, avatar_url FROM users WHERE id=$1`, id).Scan(&name, &email, &role, &avatar); err != nil {
		if isNoRows(err) {
			httpx.NotFound(c, "Peserta tidak ditemukan.")
			return
		}
		httpx.Internal(c, err)
		return
	}
	if role != "peserta" {
		httpx.Forbidden(c, "Akun admin tidak dapat dihapus dari sini.")
		return
	}
	// berkas lampiran chat milik peserta (dihapus setelah transaksi berhasil)
	files := []string{}
	if rows, err := s.DB.Query(c, `SELECT file_url FROM chat_messages WHERE user_id=$1 AND file_url IS NOT NULL`, id); err == nil {
		for rows.Next() {
			var u string
			if rows.Scan(&u) == nil {
				files = append(files, u)
			}
		}
		rows.Close()
	}
	tag, err := s.DB.Exec(c, `DELETE FROM users WHERE id=$1 AND role='peserta'`, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Peserta tidak ditemukan.")
		return
	}
	s.removeAvatarFile(avatar)
	for i := range files {
		s.removeChatFile(&files[i])
	}
	log.Printf("admin %s menghapus peserta %s", auth.UserID(c), email)
	s.logActivity(c, auth.UserID(c), "peserta.hapus", name+" ("+email+")")
	httpx.OK(c, gin.H{"message": "Peserta dan seluruh datanya telah dihapus."})
}
