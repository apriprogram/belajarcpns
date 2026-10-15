package app

import (
	"net/http"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"
	"github.com/gin-gonic/gin"
)

// Interaksi peserta dengan pengumuman (migrasi 0010).
// POST   /api/announcements/:id/view  → peserta membuka modal detail (dicatat sekali per peserta).
// PUT    /api/announcements/:id/like  → suka; DELETE → batal suka. Respons: { liked, likes }.
// GET    /api/admin/announcements/:id/engagement → daftar peserta yang melihat/menyukai.
// Hanya akun peserta yang dihitung agar pratinjau admin tidak menambah angka.

func (s *Server) viewAnnouncement(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pengumuman tidak ditemukan.")
	if !ok {
		return
	}
	if auth.Role(c) != "peserta" {
		c.Status(http.StatusNoContent)
		return
	}
	if _, err := s.DB.Exec(c, `INSERT INTO announcement_views(announcement_id, user_id)
		SELECT id, $2 FROM announcements WHERE id=$1 AND published
		ON CONFLICT DO NOTHING`, id, auth.UserID(c)); err != nil {
		httpx.Internal(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) likeAnnouncement(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pengumuman tidak ditemukan.")
	if !ok {
		return
	}
	if auth.Role(c) != "peserta" {
		httpx.Forbidden(c, "Hanya peserta yang dapat menyukai pengumuman.")
		return
	}
	var exists bool
	if err := s.DB.QueryRow(c, `SELECT EXISTS (SELECT 1 FROM announcements WHERE id=$1 AND published)`, id).Scan(&exists); err != nil {
		httpx.Internal(c, err)
		return
	}
	if !exists {
		httpx.NotFound(c, "Pengumuman tidak ditemukan.")
		return
	}
	uid := auth.UserID(c)
	var err error
	if c.Request.Method == http.MethodDelete {
		_, err = s.DB.Exec(c, `DELETE FROM announcement_likes WHERE announcement_id=$1 AND user_id=$2`, id, uid)
	} else {
		// Menyukai berarti sudah melihat.
		_, err = s.DB.Exec(c, `WITH v AS (INSERT INTO announcement_views(announcement_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING)
			INSERT INTO announcement_likes(announcement_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, id, uid)
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var likes int
	var liked bool
	if err := s.DB.QueryRow(c, `SELECT count(*), coalesce(bool_or(user_id::text=$2), false) FROM announcement_likes WHERE announcement_id=$1`, id, uid).Scan(&likes, &liked); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"liked": liked, "likes": likes})
}

type announcementViewer struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Email     string     `json:"email"`
	AvatarURL *string    `json:"avatar_url"`
	ViewedAt  time.Time  `json:"viewed_at"`
	Liked     bool       `json:"liked"`
	LikedAt   *time.Time `json:"liked_at"`
}

func (s *Server) adminAnnouncementEngagement(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pengumuman tidak ditemukan.")
	if !ok {
		return
	}
	var title string
	if err := s.DB.QueryRow(c, `SELECT title FROM announcements WHERE id=$1`, id).Scan(&title); err != nil {
		httpx.NotFound(c, "Pengumuman tidak ditemukan.")
		return
	}
	// Peserta yang melihat (atau menyukai) — urut terbaru.
	rows, err := s.DB.Query(c, `
		SELECT u.id, u.name, u.email, u.avatar_url,
		       coalesce(v.created_at, l.created_at), l.user_id IS NOT NULL, l.created_at
		FROM announcement_views v
		FULL JOIN announcement_likes l ON l.announcement_id = v.announcement_id AND l.user_id = v.user_id
		JOIN users u ON u.id = coalesce(v.user_id, l.user_id)
		WHERE coalesce(v.announcement_id, l.announcement_id) = $1
		ORDER BY 5 DESC LIMIT 1000`, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer rows.Close()
	viewers := []announcementViewer{}
	likes := 0
	for rows.Next() {
		var x announcementViewer
		if err := rows.Scan(&x.ID, &x.Name, &x.Email, &x.AvatarURL, &x.ViewedAt, &x.Liked, &x.LikedAt); err != nil {
			httpx.Internal(c, err)
			return
		}
		if x.Liked {
			likes++
		}
		viewers = append(viewers, x)
	}
	if err := rows.Err(); err != nil {
		httpx.Internal(c, err)
		return
	}
	var audience int
	_ = s.DB.QueryRow(c, `SELECT count(*) FROM users WHERE role='peserta'`).Scan(&audience)
	httpx.OK(c, gin.H{"id": id, "title": title, "views": len(viewers), "likes": likes, "audience": audience, "viewers": viewers})
}
