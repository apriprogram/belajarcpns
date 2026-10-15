package app

import (
	"errors"
	"log"
	"net/http"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type User struct {
	ID         string     `json:"id"`
	Name       string     `json:"name"`
	Email      string     `json:"email"`
	Phone      string     `json:"phone"`
	Role       string     `json:"role"`
	Status     string     `json:"status"`
	Gender     *string    `json:"gender"`
	AvatarURL  *string    `json:"avatar_url"`
	Address    *string    `json:"address"`
	BirthPlace *string    `json:"birth_place"`
	BirthDate  *string    `json:"birth_date"` // YYYY-MM-DD
	LastSeen   *time.Time `json:"last_seen_at"`
	CreatedAt  time.Time  `json:"created_at"`
}

const userCols = `id, name, email, phone, role, status, gender, avatar_url, address, birth_place, to_char(birth_date, 'YYYY-MM-DD'), last_seen_at, created_at`

func scanUser(row pgx.Row, u *User) error {
	return row.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Role, &u.Status, &u.Gender, &u.AvatarURL, &u.Address, &u.BirthPlace, &u.BirthDate, &u.LastSeen, &u.CreatedAt)
}

var phoneRe = regexp.MustCompile(`^\+?[0-9]{9,15}$`)

func validatePassword(f v, field, pw string) {
	if len(pw) < 8 {
		f[field] = "Password minimal 8 karakter."
		return
	}
	hasLetter := regexp.MustCompile(`[A-Za-z]`).MatchString(pw)
	hasDigit := regexp.MustCompile(`[0-9]`).MatchString(pw)
	if !hasLetter || !hasDigit {
		f[field] = "Password harus mengandung huruf dan angka."
	}
}

func (s *Server) register(c *gin.Context) {
	var in struct {
		Name            string `json:"name"`
		Email           string `json:"email"`
		Phone           string `json:"phone"`
		Gender          string `json:"gender"`
		Password        string `json:"password"`
		PasswordConfirm string `json:"password_confirm"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	in.Phone = strings.ReplaceAll(strings.TrimSpace(in.Phone), " ", "")
	f := v{}
	if len(in.Name) < 3 {
		f["name"] = "Nama minimal 3 karakter."
	}
	if _, err := mail.ParseAddress(in.Email); err != nil {
		f["email"] = "Format email tidak valid."
	}
	if !phoneRe.MatchString(in.Phone) {
		f["phone"] = "Nomor HP harus 9–15 digit angka."
	}
	if !genders[in.Gender] {
		f["gender"] = "Pilih jenis kelamin."
	}
	validatePassword(f, "password", in.Password)
	if in.Password != in.PasswordConfirm {
		f["password_confirm"] = "Konfirmasi password tidak sama."
	}
	if len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali data yang Anda isi.", f)
		return
	}
	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var u User
	err = scanUser(s.DB.QueryRow(c, `INSERT INTO users(name,email,phone,password_hash,role,gender) VALUES ($1,$2,$3,$4,'peserta',$5) ON CONFLICT (email) DO NOTHING RETURNING `+userCols,
		in.Name, in.Email, in.Phone, hash, in.Gender), &u)
	if errors.Is(err, pgx.ErrNoRows) {
		httpx.FailFields(c, "Email sudah terdaftar.", map[string]string{"email": "Email sudah terdaftar. Silakan masuk."})
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if err := s.issueSession(c, u); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.Created(c, u)
}

func (s *Server) issueSession(c *gin.Context, u User) error {
	access, err := s.Auth.SignAccess(u.ID, u.Role, u.Name)
	if err != nil {
		return err
	}
	plain, hash := auth.RandomToken()
	if _, err := s.DB.Exec(c, `INSERT INTO refresh_tokens(user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
		u.ID, hash, time.Now().Add(auth.RefreshTTL)); err != nil {
		return err
	}
	s.Auth.SetCookies(c, access, plain)
	return nil
}

func (s *Server) login(c *gin.Context) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	f := v{}
	f.req("email", in.Email, "Email wajib diisi.")
	f.req("password", in.Password, "Password wajib diisi.")
	if len(f) > 0 {
		httpx.FailFields(c, "Lengkapi data masuk.", f)
		return
	}
	var u User
	var hash string
	err := s.DB.QueryRow(c, `SELECT `+userCols+`, password_hash FROM users WHERE email=$1`, in.Email).
		Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Role, &u.Status, &u.Gender, &u.AvatarURL, &u.Address, &u.BirthPlace, &u.BirthDate, &u.LastSeen, &u.CreatedAt, &hash)
	if err != nil || !auth.CheckPassword(hash, in.Password) {
		httpx.Fail(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Email atau password salah.")
		return
	}
	if u.Status == "blocked" {
		httpx.Forbidden(c, "Akun Anda diblokir. Hubungi admin.")
		return
	}
	if err := s.issueSession(c, u); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, u.ID, "login", u.Email)
	httpx.OK(c, u)
}

// refresh merotasi refresh token dan menerbitkan access token baru.
func (s *Server) refresh(c *gin.Context) {
	plain, _ := c.Cookie(auth.RefreshCookie)
	if plain == "" {
		httpx.Fail(c, http.StatusUnauthorized, "UNAUTHORIZED", "Sesi berakhir. Silakan masuk kembali.")
		return
	}
	var u User
	var tokenID string
	err := s.DB.QueryRow(c, `SELECT rt.id, u.id, u.name, u.email, u.phone, u.role, u.status, u.last_seen_at, u.created_at
		FROM refresh_tokens rt JOIN users u ON u.id=rt.user_id
		WHERE rt.token_hash=$1 AND rt.revoked_at IS NULL AND rt.expires_at > now()`, auth.HashToken(plain)).
		Scan(&tokenID, &u.ID, &u.Name, &u.Email, &u.Phone, &u.Role, &u.Status, &u.LastSeen, &u.CreatedAt)
	if err != nil || u.Status == "blocked" {
		s.Auth.ClearCookies(c)
		httpx.Fail(c, http.StatusUnauthorized, "UNAUTHORIZED", "Sesi berakhir. Silakan masuk kembali.")
		return
	}
	_, _ = s.DB.Exec(c, `UPDATE refresh_tokens SET revoked_at=now() WHERE id=$1`, tokenID)
	if err := s.issueSession(c, u); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, u)
}

func (s *Server) logout(c *gin.Context) {
	if plain, _ := c.Cookie(auth.RefreshCookie); plain != "" {
		_, _ = s.DB.Exec(c, `UPDATE refresh_tokens SET revoked_at=now() WHERE token_hash=$1`, auth.HashToken(plain))
	}
	s.Auth.ClearCookies(c)
	httpx.OK(c, gin.H{"message": "Berhasil keluar."})
}

func (s *Server) me(c *gin.Context) {
	var u User
	if err := scanUser(s.DB.QueryRow(c, `SELECT `+userCols+` FROM users WHERE id=$1`, auth.UserID(c)), &u); err != nil {
		httpx.Fail(c, http.StatusUnauthorized, "UNAUTHORIZED", "Akun tidak ditemukan.")
		return
	}
	httpx.OK(c, u)
}

func (s *Server) forgotPassword(c *gin.Context) {
	var in struct {
		Email string `json:"email"`
	}
	_ = c.ShouldBindJSON(&in)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	resp := gin.H{"message": "Jika email terdaftar, tautan reset password telah dikirim."}
	var uid string
	if err := s.DB.QueryRow(c, `SELECT id FROM users WHERE email=$1 AND status='active'`, in.Email).Scan(&uid); err == nil {
		plain, hash := auth.RandomToken()
		_, _ = s.DB.Exec(c, `INSERT INTO password_resets(user_id, token_hash, expires_at) VALUES ($1,$2,now()+interval '30 minutes')`, uid, hash)
		// TODO produksi: kirim email berisi tautan. Saat development token dikembalikan agar mudah diuji.
		log.Printf("[reset-password] %s -> /reset-password?token=%s", in.Email, plain)
		if s.Cfg.IsDev() {
			resp["dev_token"] = plain
		}
	}
	httpx.OK(c, resp)
}

func (s *Server) resetPassword(c *gin.Context) {
	var in struct {
		Token           string `json:"token"`
		Password        string `json:"password"`
		PasswordConfirm string `json:"password_confirm"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	f := v{}
	validatePassword(f, "password", in.Password)
	if in.Password != in.PasswordConfirm {
		f["password_confirm"] = "Konfirmasi password tidak sama."
	}
	if len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali password baru Anda.", f)
		return
	}
	var resetID, uid string
	err := s.DB.QueryRow(c, `SELECT id, user_id FROM password_resets WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now()`,
		auth.HashToken(in.Token)).Scan(&resetID, &uid)
	if err != nil {
		httpx.BadRequest(c, "Tautan reset tidak valid atau sudah kedaluwarsa.")
		return
	}
	hash, _ := auth.HashPassword(in.Password)
	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)
	tx.Exec(c, `UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2`, hash, uid)
	tx.Exec(c, `UPDATE password_resets SET used_at=now() WHERE id=$1`, resetID)
	tx.Exec(c, `UPDATE refresh_tokens SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL`, uid)
	if err := tx.Commit(c); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"message": "Password berhasil diubah. Silakan masuk."})
}

func (s *Server) updateProfile(c *gin.Context) {
	var in struct {
		Name       string  `json:"name"`
		Phone      string  `json:"phone"`
		Gender     *string `json:"gender"`      // opsional; nil = tidak diubah
		Address    *string `json:"address"`     // nil = tidak diubah, "" = kosongkan
		BirthPlace *string `json:"birth_place"` // idem
		BirthDate  *string `json:"birth_date"`  // YYYY-MM-DD; idem
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	in.Phone = strings.ReplaceAll(strings.TrimSpace(in.Phone), " ", "")
	f := v{}
	if len(in.Name) < 3 {
		f["name"] = "Nama minimal 3 karakter."
	}
	if !phoneRe.MatchString(in.Phone) {
		f["phone"] = "Nomor HP harus 9–15 digit angka."
	}
	if in.Gender != nil && !genders[*in.Gender] {
		f["gender"] = "Pilih jenis kelamin."
	}
	validateProfileExtra(f, &in.Address, &in.BirthPlace, &in.BirthDate)
	if len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali data Anda.", f)
		return
	}
	var u User
	if err := scanUser(s.DB.QueryRow(c, `UPDATE users SET name=$1, phone=$2, gender=COALESCE($4, gender),
		address=CASE WHEN $5::text IS NULL THEN address ELSE NULLIF($5, '') END,
		birth_place=CASE WHEN $6::text IS NULL THEN birth_place ELSE NULLIF($6, '') END,
		birth_date=CASE WHEN $7::text IS NULL THEN birth_date ELSE NULLIF($7, '')::date END,
		updated_at=now() WHERE id=$3 RETURNING `+userCols,
		in.Name, in.Phone, auth.UserID(c), in.Gender, in.Address, in.BirthPlace, in.BirthDate), &u); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, u)
}

func (s *Server) changePassword(c *gin.Context) {
	var in struct {
		Current         string `json:"current_password"`
		Password        string `json:"password"`
		PasswordConfirm string `json:"password_confirm"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	var hash string
	if err := s.DB.QueryRow(c, `SELECT password_hash FROM users WHERE id=$1`, auth.UserID(c)).Scan(&hash); err != nil {
		httpx.Internal(c, err)
		return
	}
	f := v{}
	if !auth.CheckPassword(hash, in.Current) {
		f["current_password"] = "Password saat ini salah."
	}
	validatePassword(f, "password", in.Password)
	if in.Password != in.PasswordConfirm {
		f["password_confirm"] = "Konfirmasi password tidak sama."
	}
	if len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali isian password.", f)
		return
	}
	newHash, _ := auth.HashPassword(in.Password)
	_, err := s.DB.Exec(c, `UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2`, newHash, auth.UserID(c))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"message": "Password berhasil diperbarui."})
}
