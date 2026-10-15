package app

import (
	"context"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
)

// ---------- Testimoni peserta (lihat docs/TESTIMONI.md) ----------

const (
	testimonialMinLen      = 20
	testimonialMaxLen      = 500
	testimonialPublicLimit = 40
)

var testimonialStatuses = map[string]bool{"pending": true, "published": true, "hidden": true}

type TestimonialUser struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatar_url"`
	Gender    *string `json:"gender"`
	Email     string  `json:"email,omitempty"` // hanya untuk admin
}

type Testimonial struct {
	ID            string          `json:"id"`
	Rating        int             `json:"rating"`
	Content       string          `json:"content"`
	Status        string          `json:"status"`
	EditedByAdmin bool            `json:"edited_by_admin"`
	IsRead        bool            `json:"is_read"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
	PublishedAt   *time.Time      `json:"published_at"`
	User          TestimonialUser `json:"user"`
}

const testimonialSelect = `SELECT t.id, t.rating, t.content, t.status, t.edited_by_admin, t.is_read, t.created_at, t.updated_at, t.published_at,
	u.id, u.name, u.avatar_url, u.gender, u.email
	FROM testimonials t JOIN users u ON u.id = t.user_id`

// queryTestimonials menjalankan query berbasis testimonialSelect; email hanya disertakan bila withEmail.
func (s *Server) queryTestimonials(ctx context.Context, withEmail bool, sql string, args ...any) ([]Testimonial, error) {
	rows, err := s.DB.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Testimonial{}
	for rows.Next() {
		var t Testimonial
		var rating int16
		if err := rows.Scan(&t.ID, &rating, &t.Content, &t.Status, &t.EditedByAdmin, &t.IsRead, &t.CreatedAt, &t.UpdatedAt, &t.PublishedAt,
			&t.User.ID, &t.User.Name, &t.User.AvatarURL, &t.User.Gender, &t.User.Email); err != nil {
			return nil, err
		}
		t.Rating = int(rating)
		if !withEmail {
			t.User.Email = ""
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Server) testimonialByID(ctx context.Context, id string, withEmail bool) (*Testimonial, error) {
	list, err := s.queryTestimonials(ctx, withEmail, testimonialSelect+` WHERE t.id=$1`, id)
	if err != nil || len(list) == 0 {
		return nil, err
	}
	return &list[0], nil
}

// normalizeTestimonialContent merapikan isi: trim, CRLF → LF, maksimal satu baris kosong berturut-turut.
func normalizeTestimonialContent(s string) string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.TrimSpace(s)
	for strings.Contains(s, "\n\n\n") {
		s = strings.ReplaceAll(s, "\n\n\n", "\n\n")
	}
	return s
}

func validateTestimonialRating(f v, rating int) {
	if rating < 1 || rating > 5 {
		f["rating"] = "Pilih penilaian 1–5 bintang."
	}
}

// validateTestimonialContent memeriksa panjang isi (setelah dinormalisasi); kata kasar hanya ditolak
// untuk tulisan peserta (checkProfanity) — suntingan admin dipercaya.
func validateTestimonialContent(f v, content string, checkProfanity bool) {
	n := utf8.RuneCountInString(content)
	switch {
	case n < testimonialMinLen:
		f["content"] = "Testimoni minimal " + strconv.Itoa(testimonialMinLen) + " karakter."
	case n > testimonialMaxLen:
		f["content"] = "Testimoni maksimal " + strconv.Itoa(testimonialMaxLen) + " karakter."
	case checkProfanity && censor(content) != content:
		f["content"] = "Testimoni mengandung kata yang tidak pantas. Mohon gunakan bahasa yang sopan."
	}
}

// ---------- Publik ----------

type publicTestimonial struct {
	ID          string     `json:"id"`
	Rating      int        `json:"rating"`
	Content     string     `json:"content"`
	PublishedAt *time.Time `json:"published_at"`
	User        struct {
		Name      string  `json:"name"`
		AvatarURL *string `json:"avatar_url"`
	} `json:"user"`
}

// publicTestimonials: GET /testimonials — hanya yang published (maks 40) + rata-rata & jumlah.
func (s *Server) publicTestimonials(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	rows, err := s.DB.Query(c, `SELECT t.id, t.rating, t.content, t.published_at, u.name, u.avatar_url
		FROM testimonials t JOIN users u ON u.id = t.user_id
		WHERE t.status = 'published'
		ORDER BY t.published_at DESC NULLS LAST, t.created_at DESC LIMIT $1`, testimonialPublicLimit)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer rows.Close()
	items := []publicTestimonial{}
	for rows.Next() {
		var t publicTestimonial
		var rating int16
		if err := rows.Scan(&t.ID, &rating, &t.Content, &t.PublishedAt, &t.User.Name, &t.User.AvatarURL); err != nil {
			httpx.Internal(c, err)
			return
		}
		t.Rating = int(rating)
		items = append(items, t)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(c, err)
		return
	}
	var avg float64
	var total int
	if err := s.DB.QueryRow(c, `SELECT COALESCE(avg(rating), 0)::float8, count(*) FROM testimonials WHERE status = 'published'`).Scan(&avg, &total); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"items": items, "average": round1(avg), "total": total})
}

// ---------- Peserta ----------

func (s *Server) myTestimonial(c *gin.Context) {
	list, err := s.queryTestimonials(c, false, testimonialSelect+` WHERE t.user_id=$1`, auth.UserID(c))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if len(list) == 0 {
		httpx.OK(c, gin.H{"testimonial": nil})
		return
	}
	httpx.OK(c, gin.H{"testimonial": list[0]})
}

// saveMyTestimonial: PUT /me/testimonial — buat/ubah; setiap perubahan kembali menunggu tinjauan admin.
func (s *Server) saveMyTestimonial(c *gin.Context) {
	var in struct {
		Rating  int    `json:"rating"`
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	in.Content = normalizeTestimonialContent(in.Content)
	f := v{}
	validateTestimonialRating(f, in.Rating)
	validateTestimonialContent(f, in.Content, true)
	if len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali testimoni Anda.", f)
		return
	}
	var id string
	err := s.DB.QueryRow(c, `INSERT INTO testimonials(user_id, rating, content) VALUES ($1,$2,$3)
		ON CONFLICT (user_id) DO UPDATE SET rating=EXCLUDED.rating, content=EXCLUDED.content, status='pending',
			is_read=false, edited_by_admin=false, published_at=NULL, updated_at=now()
		RETURNING id`, auth.UserID(c), in.Rating, in.Content).Scan(&id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	t, err := s.testimonialByID(c, id, false)
	if err != nil || t == nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"testimonial": t})
}

func (s *Server) deleteMyTestimonial(c *gin.Context) {
	tag, err := s.DB.Exec(c, `DELETE FROM testimonials WHERE user_id=$1`, auth.UserID(c))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Anda belum menulis testimoni.")
		return
	}
	httpx.OK(c, gin.H{"ok": true})
}

// ---------- Admin ----------

// adminListTestimonials: ?status=semua|pending|published|hidden · ?q=nama/email/isi
func (s *Server) adminListTestimonials(c *gin.Context) {
	where := []string{"true"}
	args := []any{}
	if q := strings.TrimSpace(c.Query("q")); q != "" {
		args = append(args, "%"+q+"%")
		n := strconv.Itoa(len(args))
		where = append(where, "(u.name ILIKE $"+n+" OR u.email ILIKE $"+n+" OR t.content ILIKE $"+n+")")
	}
	// jumlah per tab mengikuti pencarian, tetapi tidak dibatasi status
	baseWhere := strings.Join(where, " AND ")
	counts := gin.H{"semua": 0, "pending": 0, "published": 0, "hidden": 0}
	var all, pending, published, hidden int
	if err := s.DB.QueryRow(c, `SELECT count(*), count(*) FILTER (WHERE t.status='pending'), count(*) FILTER (WHERE t.status='published'),
		count(*) FILTER (WHERE t.status='hidden') FROM testimonials t JOIN users u ON u.id = t.user_id WHERE `+baseWhere, args...).
		Scan(&all, &pending, &published, &hidden); err != nil {
		httpx.Internal(c, err)
		return
	}
	counts["semua"], counts["pending"], counts["published"], counts["hidden"] = all, pending, published, hidden

	if st := c.Query("status"); testimonialStatuses[st] {
		args = append(args, st)
		where = append(where, "t.status = $"+strconv.Itoa(len(args)))
	}
	list, err := s.queryTestimonials(c, true, testimonialSelect+` WHERE `+strings.Join(where, " AND ")+` ORDER BY t.created_at DESC LIMIT 500`, args...)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var unread int
	_ = s.DB.QueryRow(c, `SELECT count(*) FROM testimonials WHERE status='pending' AND is_read=false`).Scan(&unread)
	httpx.OK(c, gin.H{"items": list, "counts": counts, "unread": unread})
}

func (s *Server) adminUnreadTestimonials(c *gin.Context) {
	var unread int
	if err := s.DB.QueryRow(c, `SELECT count(*) FROM testimonials WHERE status='pending' AND is_read=false`).Scan(&unread); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"unread": unread})
}

func (s *Server) adminReadAllTestimonials(c *gin.Context) {
	tag, err := s.DB.Exec(c, `UPDATE testimonials SET is_read=true WHERE is_read=false`)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"ok": true, "updated": tag.RowsAffected()})
}

// adminUpdateTestimonial: PATCH /admin/testimonials/:id body opsional { rating?, content?, status? }.
func (s *Server) adminUpdateTestimonial(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Testimoni tidak ditemukan.")
	if !ok {
		return
	}
	var in struct {
		Rating  *int    `json:"rating"`
		Content *string `json:"content"`
		Status  *string `json:"status"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	f := v{}
	if in.Rating != nil {
		validateTestimonialRating(f, *in.Rating)
	}
	if in.Content != nil {
		norm := normalizeTestimonialContent(*in.Content)
		in.Content = &norm
		validateTestimonialContent(f, norm, false)
	}
	if in.Status != nil && !testimonialStatuses[*in.Status] {
		f["status"] = "Status tidak valid."
	}
	if len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali isian testimoni.", f)
		return
	}
	// Di sisi kanan SET, kolom merujuk nilai lama baris.
	tag, err := s.DB.Exec(c, `UPDATE testimonials SET
			rating = COALESCE($2::smallint, rating),
			content = COALESCE($3::text, content),
			edited_by_admin = edited_by_admin OR ($2::smallint IS NOT NULL AND $2::smallint <> rating) OR ($3::text IS NOT NULL AND $3::text <> content),
			status = COALESCE($4::varchar, status),
			published_at = CASE WHEN $4::varchar = 'published' AND (published_at IS NULL OR status <> 'published') THEN now() ELSE published_at END,
			is_read = true,
			updated_at = now()
		WHERE id = $1`, id, in.Rating, in.Content, in.Status)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Testimoni tidak ditemukan.")
		return
	}
	t, err := s.testimonialByID(c, id, true)
	if err != nil || t == nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "testimoni.ubah", id)
	httpx.OK(c, gin.H{"testimonial": t})
}

func (s *Server) adminDeleteTestimonial(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Testimoni tidak ditemukan.")
	if !ok {
		return
	}
	tag, err := s.DB.Exec(c, `DELETE FROM testimonials WHERE id=$1`, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Testimoni tidak ditemukan.")
		return
	}
	s.logActivity(c, auth.UserID(c), "testimoni.hapus", id)
	httpx.OK(c, gin.H{"ok": true})
}
