package app

import (
	"context"
	"errors"
	"math"
	"strings"
	"time"
	_ "time/tzdata" // zona waktu tertanam agar Asia/Jakarta tersedia di container minimal

	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Jakarta adalah zona waktu acuan untuk "hari ini" (WIB).
var Jakarta = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return time.FixedZone("WIB", 7*3600)
	}
	return loc
}()

var dayLabels = []string{"Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"}

func todayJakarta() time.Time {
	n := time.Now().In(Jakarta)
	return time.Date(n.Year(), n.Month(), n.Day(), 0, 0, 0, 0, Jakarta)
}

// pathUUID memvalidasi parameter path berupa UUID; jika tidak valid → 404.
func pathUUID(c *gin.Context, name, notFoundMsg string) (string, bool) {
	id := c.Param(name)
	if _, err := uuid.Parse(id); err != nil {
		httpx.NotFound(c, notFoundMsg)
		return "", false
	}
	return id, true
}

func isNoRows(err error) bool { return errors.Is(err, pgx.ErrNoRows) }

func isUniqueViolation(err error) bool {
	var pg *pgconn.PgError
	return errors.As(err, &pg) && pg.Code == "23505"
}

func round1(f float64) float64 { return math.Round(f*10) / 10 }

func pct(part, total int) float64 {
	if total == 0 {
		return 0
	}
	return round1(float64(part) * 100 / float64(total))
}

// parseTimePtr menerima RFC3339 atau format datetime-local ("2006-01-02T15:04", dianggap WIB).
// String kosong / null → nil.
func parseTimePtr(s *string) (*time.Time, bool) {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil, true
	}
	v := strings.TrimSpace(*s)
	for _, layout := range []string{time.RFC3339Nano, time.RFC3339} {
		if t, err := time.Parse(layout, v); err == nil {
			return &t, true
		}
	}
	for _, layout := range []string{"2006-01-02T15:04:05", "2006-01-02T15:04", "2006-01-02 15:04", "2006-01-02"} {
		if t, err := time.ParseInLocation(layout, v, Jakarta); err == nil {
			return &t, true
		}
	}
	return nil, false
}

// ResultSummary ringkasan hasil ujian (dipakai peserta & admin).
type ResultSummary struct {
	AttemptID       string    `json:"attempt_id"`
	PackageID       string    `json:"package_id"`
	PackageTitle    string    `json:"package_title"`
	ScoreTWK        int       `json:"score_twk"`
	ScoreTIU        int       `json:"score_tiu"`
	ScoreTKP        int       `json:"score_tkp"`
	ScoreTotal      int       `json:"score_total"`
	CorrectCount    int       `json:"correct_count"`
	WrongCount      int       `json:"wrong_count"`
	EmptyCount      int       `json:"empty_count"`
	Passed          bool      `json:"passed"`
	DurationSeconds int       `json:"duration_seconds"`
	Saved           bool      `json:"saved"`
	CreatedAt       time.Time `json:"created_at"`
}

const resultSummarySelect = `SELECT r.attempt_id, r.package_id, p.title, r.score_twk, r.score_tiu, r.score_tkp, r.score_total,
	r.correct_count, r.wrong_count, r.empty_count, r.passed, r.duration_seconds, r.saved, r.created_at
	FROM results r JOIN exam_packages p ON p.id=r.package_id`

func scanResultSummary(row pgx.Row, r *ResultSummary) error {
	return row.Scan(&r.AttemptID, &r.PackageID, &r.PackageTitle, &r.ScoreTWK, &r.ScoreTIU, &r.ScoreTKP, &r.ScoreTotal,
		&r.CorrectCount, &r.WrongCount, &r.EmptyCount, &r.Passed, &r.DurationSeconds, &r.Saved, &r.CreatedAt)
}

func (s *Server) queryResultSummaries(ctx context.Context, sql string, args ...any) ([]ResultSummary, error) {
	rows, err := s.DB.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ResultSummary{}
	for rows.Next() {
		var r ResultSummary
		if err := scanResultSummary(rows, &r); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Server) resultSummary(ctx context.Context, attemptID string) (*ResultSummary, error) {
	var r ResultSummary
	if err := scanResultSummary(s.DB.QueryRow(ctx, resultSummarySelect+` WHERE r.attempt_id=$1`, attemptID), &r); err != nil {
		return nil, err
	}
	return &r, nil
}

// Announcement pengumuman.
type Announcement struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Published bool      `json:"published"`
	CreatedAt time.Time `json:"created_at"`
	Views     int       `json:"views"`
	Likes     int       `json:"likes"`
	Liked     bool      `json:"liked"`
}

// annStatsCols: kolom tambahan views, likes, liked (oleh user $1) untuk query "FROM announcements a".
const annStatsCols = `,
	(SELECT count(*) FROM announcement_views v WHERE v.announcement_id = a.id),
	(SELECT count(*) FROM announcement_likes l WHERE l.announcement_id = a.id),
	EXISTS (SELECT 1 FROM announcement_likes l WHERE l.announcement_id = a.id AND l.user_id::text = $1)`

// queryAnnouncements memindai id, title, body, published, created_at [, views, likes, liked].
func (s *Server) queryAnnouncements(ctx context.Context, sql string, args ...any) ([]Announcement, error) {
	rows, err := s.DB.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	withStats := len(rows.FieldDescriptions()) >= 8
	out := []Announcement{}
	for rows.Next() {
		var a Announcement
		dst := []any{&a.ID, &a.Title, &a.Body, &a.Published, &a.CreatedAt}
		if withStats {
			dst = append(dst, &a.Views, &a.Likes, &a.Liked)
		}
		if err := rows.Scan(dst...); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// finalizeExpiredForUser menutup attempt milik user yang sudah lewat batas waktu.
func (s *Server) finalizeExpiredForUser(ctx context.Context, userID string) {
	rows, err := s.DB.Query(ctx, `SELECT id FROM attempts WHERE user_id=$1 AND status='berlangsung' AND deadline_at <= now()`, userID)
	if err != nil {
		return
	}
	var ids []string
	for rows.Next() {
		var id string
		if rows.Scan(&id) == nil {
			ids = append(ids, id)
		}
	}
	rows.Close()
	for _, id := range ids {
		_ = s.finalizeAttempt(ctx, id)
	}
}
