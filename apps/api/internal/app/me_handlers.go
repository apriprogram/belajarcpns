package app

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ---------- Dashboard peserta ----------

type StudyDay struct {
	Day     string `json:"day"`
	Label   string `json:"label"`
	Minutes int    `json:"minutes"`
}

type UpcomingPackage struct {
	ID              string     `json:"id"`
	Title           string     `json:"title"`
	StartAt         *time.Time `json:"start_at"`
	EndAt           *time.Time `json:"end_at"`
	DurationMinutes int        `json:"duration_minutes"`
	QuestionCount   int        `json:"question_count"`
}

func (s *Server) myDashboard(c *gin.Context) {
	uid := auth.UserID(c)
	s.finalizeExpiredForUser(c, uid)
	today := todayJakarta()
	start := today.AddDate(0, 0, -6)

	// waktu belajar 7 hari terakhir
	secs := map[string]int{}
	rows, err := s.DB.Query(c, `SELECT to_char(day,'YYYY-MM-DD'), seconds FROM study_logs WHERE user_id=$1 AND day >= $2::date - 1 AND day <= $3::date`,
		uid, start.Format("2006-01-02"), today.Format("2006-01-02"))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	for rows.Next() {
		var d string
		var n int
		if err := rows.Scan(&d, &n); err == nil {
			secs[d] = n
		}
	}
	rows.Close()
	days := make([]StudyDay, 0, 7)
	week := 0
	for i := 0; i < 7; i++ {
		d := start.AddDate(0, 0, i)
		key := d.Format("2006-01-02")
		m := secs[key] / 60
		week += m
		days = append(days, StudyDay{Day: key, Label: dayLabels[d.Weekday()], Minutes: m})
	}
	todayMin := secs[today.Format("2006-01-02")] / 60
	yMin := secs[today.AddDate(0, 0, -1).Format("2006-01-02")] / 60
	change := 0
	if yMin > 0 {
		change = int(math.Round(float64(todayMin-yMin) * 100 / float64(yMin)))
	} else if todayMin > 0 {
		change = 100
	}

	// statistik
	var avg float64
	var best, done, passed int
	if err := s.DB.QueryRow(c, `SELECT COALESCE(avg(score_total),0), COALESCE(max(score_total),0), count(*), count(*) FILTER (WHERE passed)
		FROM results WHERE user_id=$1 AND hidden_at IS NULL`, uid).Scan(&avg, &best, &done, &passed); err != nil {
		httpx.Internal(c, err)
		return
	}
	var pkgAvail, prAnswered, prCorrect int
	if err := s.DB.QueryRow(c, `SELECT count(*) FROM exam_packages WHERE status='terbit' AND (end_at IS NULL OR end_at > now())`).Scan(&pkgAvail); err != nil {
		httpx.Internal(c, err)
		return
	}
	if err := s.DB.QueryRow(c, `SELECT count(*), count(*) FILTER (WHERE is_correct) FROM practice_answers WHERE user_id=$1`, uid).Scan(&prAnswered, &prCorrect); err != nil {
		httpx.Internal(c, err)
		return
	}
	passRate := 0
	if done > 0 {
		passRate = int(math.Round(float64(passed) * 100 / float64(done)))
	}
	accuracy := 0
	if prAnswered > 0 {
		accuracy = int(math.Round(float64(prCorrect) * 100 / float64(prAnswered)))
	}

	// jadwal ujian terdekat
	upcoming := []UpcomingPackage{}
	rows, err = s.DB.Query(c, `SELECT p.id, p.title, p.start_at, p.end_at, p.duration_minutes,
		(SELECT count(*) FROM package_questions pq WHERE pq.package_id=p.id)
		FROM exam_packages p WHERE p.status='terbit' AND (p.end_at IS NULL OR p.end_at > now())
		ORDER BY p.start_at NULLS LAST, p.created_at DESC LIMIT 5`)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	for rows.Next() {
		var u UpcomingPackage
		if err := rows.Scan(&u.ID, &u.Title, &u.StartAt, &u.EndAt, &u.DurationMinutes, &u.QuestionCount); err == nil {
			upcoming = append(upcoming, u)
		}
	}
	rows.Close()

	targets, err := s.queryTargets(c, uid, today.Format("2006-01-02"))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	anns, err := s.queryAnnouncements(c, `SELECT a.id, a.title, a.body, a.published, a.created_at`+annStatsCols+` FROM announcements a WHERE a.published ORDER BY a.created_at DESC LIMIT 5`, uid)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var latest *ResultSummary
	if list, err := s.queryResultSummaries(c, resultSummarySelect+` WHERE r.user_id=$1 AND r.hidden_at IS NULL ORDER BY r.created_at DESC LIMIT 1`, uid); err != nil {
		httpx.Internal(c, err)
		return
	} else if len(list) > 0 {
		latest = &list[0]
	}

	httpx.OK(c, gin.H{
		"study": gin.H{"days": days, "today_minutes": todayMin, "yesterday_minutes": yMin, "week_minutes": week, "change_pct": change},
		"stats": gin.H{"avg_score": round1(avg), "best_score": best, "attempts_done": done, "packages_available": pkgAvail,
			"pass_rate": passRate, "practice_answered": prAnswered, "practice_accuracy": accuracy},
		"upcoming":      upcoming,
		"targets_today": targets,
		"announcements": anns,
		"latest_result": latest,
	})
}

// heartbeat menambah waktu belajar hari ini (WIB), maksimal 120 detik per panggilan.
func (s *Server) heartbeat(c *gin.Context) {
	var in struct {
		Seconds int `json:"seconds"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if in.Seconds <= 0 {
		httpx.FailFields(c, "Durasi tidak valid.", map[string]string{"seconds": "Durasi harus lebih dari 0 detik."})
		return
	}
	if in.Seconds > 120 {
		in.Seconds = 120
	}
	day := todayJakarta().Format("2006-01-02")
	var total int
	err := s.DB.QueryRow(c, `INSERT INTO study_logs(user_id, day, seconds) VALUES ($1,$2,$3)
		ON CONFLICT (user_id, day) DO UPDATE SET seconds = study_logs.seconds + EXCLUDED.seconds RETURNING seconds`,
		auth.UserID(c), day, in.Seconds).Scan(&total)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"day": day, "seconds": total, "today_minutes": total / 60})
}

// ---------- Target harian ----------

type Target struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Subtest  string `json:"subtest"`
	DueTime  string `json:"due_time"`
	Priority string `json:"priority"`
	Day      string `json:"day"`
	Done     bool   `json:"done"`
}

const targetCols = `id, title, subtest, due_time, priority, to_char(day,'YYYY-MM-DD'), done`

func scanTarget(row pgx.Row, t *Target) error {
	return row.Scan(&t.ID, &t.Title, &t.Subtest, &t.DueTime, &t.Priority, &t.Day, &t.Done)
}

var (
	timeRe = regexp.MustCompile(`^([01][0-9]|2[0-3]):[0-5][0-9]$`)
	dayRe  = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
)

func validTargetSubtest(s string) bool { return s == "TWK" || s == "TIU" || s == "TKP" || s == "SKD" }

func validDay(s string) bool {
	if !dayRe.MatchString(s) {
		return false
	}
	_, err := time.Parse("2006-01-02", s)
	return err == nil
}

func (s *Server) queryTargets(c *gin.Context, uid, day string) ([]Target, error) {
	rows, err := s.DB.Query(c, `SELECT `+targetCols+` FROM daily_targets WHERE user_id=$1 AND day=$2
		ORDER BY done, due_time, created_at`, uid, day)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Target{}
	for rows.Next() {
		var t Target
		if err := scanTarget(rows, &t); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Server) listTargets(c *gin.Context) {
	day := c.Query("day")
	if day == "" {
		day = todayJakarta().Format("2006-01-02")
	}
	if !validDay(day) {
		httpx.FailFields(c, "Tanggal tidak valid.", map[string]string{"day": "Format tanggal harus YYYY-MM-DD."})
		return
	}
	out, err := s.queryTargets(c, auth.UserID(c), day)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, out)
}

type targetInput struct {
	Title    *string `json:"title"`
	Subtest  *string `json:"subtest"`
	DueTime  *string `json:"due_time"`
	Priority *string `json:"priority"`
	Day      *string `json:"day"`
	Done     *bool   `json:"done"`
}

func (in *targetInput) validate(partial bool) map[string]string {
	f := v{}
	if in.Title != nil || !partial {
		t := ""
		if in.Title != nil {
			t = strings.TrimSpace(*in.Title)
		}
		in.Title = &t
		if len([]rune(t)) < 3 {
			f["title"] = "Judul target minimal 3 karakter."
		} else if len([]rune(t)) > 160 {
			f["title"] = "Judul target maksimal 160 karakter."
		}
	}
	if in.Subtest != nil {
		up := strings.ToUpper(strings.TrimSpace(*in.Subtest))
		in.Subtest = &up
		if !validTargetSubtest(up) {
			f["subtest"] = "Pilih subtes TWK, TIU, TKP, atau SKD."
		}
	}
	if in.DueTime != nil && !timeRe.MatchString(*in.DueTime) {
		f["due_time"] = "Format jam harus HH:MM (contoh 09:00)."
	}
	if in.Priority != nil && *in.Priority != "rendah" && *in.Priority != "sedang" && *in.Priority != "tinggi" {
		f["priority"] = "Prioritas harus rendah, sedang, atau tinggi."
	}
	if in.Day != nil && !validDay(*in.Day) {
		f["day"] = "Format tanggal harus YYYY-MM-DD."
	}
	return f
}

func (s *Server) createTarget(c *gin.Context) {
	var in targetInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if f := in.validate(false); len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali isian target.", f)
		return
	}
	str := func(p *string, def string) string {
		if p == nil || *p == "" {
			return def
		}
		return *p
	}
	done := in.Done != nil && *in.Done
	var t Target
	err := scanTarget(s.DB.QueryRow(c, `INSERT INTO daily_targets(user_id, title, subtest, due_time, priority, day, done)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING `+targetCols,
		auth.UserID(c), *in.Title, str(in.Subtest, "TWK"), str(in.DueTime, "09:00"), str(in.Priority, "sedang"),
		str(in.Day, todayJakarta().Format("2006-01-02")), done), &t)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.Created(c, t)
}

func (s *Server) updateTarget(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Target tidak ditemukan.")
	if !ok {
		return
	}
	var in targetInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if f := in.validate(true); len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali isian target.", f)
		return
	}
	sets := []string{}
	args := []any{}
	add := func(col string, val any) {
		args = append(args, val)
		sets = append(sets, fmt.Sprintf("%s=$%d", col, len(args)))
	}
	if in.Title != nil {
		add("title", *in.Title)
	}
	if in.Subtest != nil {
		add("subtest", *in.Subtest)
	}
	if in.DueTime != nil {
		add("due_time", *in.DueTime)
	}
	if in.Priority != nil {
		add("priority", *in.Priority)
	}
	if in.Day != nil {
		add("day", *in.Day)
	}
	if in.Done != nil {
		add("done", *in.Done)
	}
	var t Target
	var err error
	if len(sets) == 0 {
		err = scanTarget(s.DB.QueryRow(c, `SELECT `+targetCols+` FROM daily_targets WHERE id=$1 AND user_id=$2`, id, auth.UserID(c)), &t)
	} else {
		args = append(args, id, auth.UserID(c))
		err = scanTarget(s.DB.QueryRow(c, `UPDATE daily_targets SET `+strings.Join(sets, ", ")+
			fmt.Sprintf(` WHERE id=$%d AND user_id=$%d RETURNING `, len(args)-1, len(args))+targetCols, args...), &t)
	}
	if isNoRows(err) {
		httpx.NotFound(c, "Target tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, t)
}

func (s *Server) deleteTarget(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Target tidak ditemukan.")
	if !ok {
		return
	}
	tag, err := s.DB.Exec(c, `DELETE FROM daily_targets WHERE id=$1 AND user_id=$2`, id, auth.UserID(c))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Target tidak ditemukan.")
		return
	}
	httpx.OK(c, gin.H{"message": "Target dihapus."})
}

// ---------- Riwayat hasil ----------

func (s *Server) myResults(c *gin.Context) {
	uid := auth.UserID(c)
	s.finalizeExpiredForUser(c, uid)
	page, perPage, offset := httpx.Paging(c)
	var total int
	if err := s.DB.QueryRow(c, `SELECT count(*) FROM results WHERE user_id=$1 AND hidden_at IS NULL`, uid).Scan(&total); err != nil {
		httpx.Internal(c, err)
		return
	}
	list, err := s.queryResultSummaries(c, resultSummarySelect+` WHERE r.user_id=$1 AND r.hidden_at IS NULL ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`, uid, perPage, offset)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OKMeta(c, list, httpx.NewMeta(page, perPage, total))
}

// ---------- Latihan soal ----------

type PublicOption struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Body  string `json:"body"`
}

type PracticeQuestion struct {
	ID           string         `json:"id"`
	Subtest      string         `json:"subtest"`
	CategoryName string         `json:"category_name"`
	Body         string         `json:"body"`
	ImageURL     string         `json:"image_url"`
	Difficulty   string         `json:"difficulty"`
	Options      []PublicOption `json:"options"`
}

func (s *Server) practiceQuestions(c *gin.Context) {
	where := []string{"q.status='terbit'"}
	args := []any{}
	if st := strings.ToUpper(c.Query("subtest")); st != "" {
		if !validSubtest(st) {
			httpx.FailFields(c, "Subtes tidak valid.", map[string]string{"subtest": "Pilih subtes TWK, TIU, atau TKP."})
			return
		}
		args = append(args, st)
		where = append(where, fmt.Sprintf("q.subtest=$%d", len(args)))
	}
	if cs := c.Query("category_id"); cs != "" {
		cid, err := strconv.Atoi(cs)
		if err != nil {
			httpx.FailFields(c, "Kategori tidak valid.", map[string]string{"category_id": "Kategori tidak valid."})
			return
		}
		args = append(args, cid)
		where = append(where, fmt.Sprintf("(q.category_id=$%d OR cat.parent_id=$%d)", len(args), len(args)))
	}
	if d := c.Query("difficulty"); d == "mudah" || d == "sedang" || d == "sulit" {
		args = append(args, d)
		where = append(where, fmt.Sprintf("q.difficulty=$%d", len(args)))
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}
	args = append(args, limit)
	rows, err := s.DB.Query(c, `SELECT q.id, q.subtest, COALESCE(cat.name,''), q.body, q.image_url, q.difficulty
		FROM questions q LEFT JOIN categories cat ON cat.id=q.category_id
		WHERE `+strings.Join(where, " AND ")+fmt.Sprintf(` ORDER BY random() LIMIT $%d`, len(args)), args...)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	out := []PracticeQuestion{}
	idx := map[string]int{}
	ids := []string{}
	for rows.Next() {
		var q PracticeQuestion
		if err := rows.Scan(&q.ID, &q.Subtest, &q.CategoryName, &q.Body, &q.ImageURL, &q.Difficulty); err != nil {
			rows.Close()
			httpx.Internal(c, err)
			return
		}
		q.Options = []PublicOption{}
		idx[q.ID] = len(out)
		ids = append(ids, q.ID)
		out = append(out, q)
	}
	rows.Close()
	if len(ids) > 0 {
		rows, err = s.DB.Query(c, `SELECT question_id, id, label, body FROM question_options WHERE question_id = ANY($1) ORDER BY label`, ids)
		if err != nil {
			httpx.Internal(c, err)
			return
		}
		for rows.Next() {
			var qid string
			var o PublicOption
			if err := rows.Scan(&qid, &o.ID, &o.Label, &o.Body); err == nil {
				out[idx[qid]].Options = append(out[idx[qid]].Options, o)
			}
		}
		rows.Close()
	}
	httpx.OK(c, out)
}

func (s *Server) practiceAnswer(c *gin.Context) {
	var in struct {
		QuestionID string  `json:"question_id"`
		OptionID   *string `json:"option_id"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if _, err := uuid.Parse(in.QuestionID); err != nil {
		httpx.NotFound(c, "Soal tidak ditemukan.")
		return
	}
	var explanation string
	err := s.DB.QueryRow(c, `SELECT explanation FROM questions WHERE id=$1 AND status='terbit'`, in.QuestionID).Scan(&explanation)
	if isNoRows(err) {
		httpx.NotFound(c, "Soal tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	rows, err := s.DB.Query(c, `SELECT id, label, body, weight FROM question_options WHERE question_id=$1 ORDER BY label`, in.QuestionID)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	opts := []Option{}
	for rows.Next() {
		var o Option
		if err := rows.Scan(&o.ID, &o.Label, &o.Body, &o.Weight); err == nil {
			opts = append(opts, o)
		}
	}
	rows.Close()
	maxW, correctID := 0, ""
	for _, o := range opts {
		if o.Weight > maxW {
			maxW, correctID = o.Weight, o.ID
		}
	}
	score := 0
	var chosen *string
	if in.OptionID != nil && *in.OptionID != "" {
		found := false
		for _, o := range opts {
			if o.ID == *in.OptionID {
				found, score = true, o.Weight
			}
		}
		if !found {
			httpx.FailFields(c, "Pilihan jawaban tidak valid.", map[string]string{"option_id": "Opsi tidak sesuai dengan soal."})
			return
		}
		chosen = in.OptionID
	}
	isCorrect := chosen != nil && maxW > 0 && score == maxW
	if _, err := s.DB.Exec(c, `INSERT INTO practice_answers(user_id, question_id, option_id, score, is_correct) VALUES ($1,$2,$3,$4,$5)`,
		auth.UserID(c), in.QuestionID, chosen, score, isCorrect); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"is_correct": isCorrect, "score": score, "max_weight": maxW, "correct_option_id": correctID,
		"explanation": explanation, "options": opts})
}

// ---------- Pengumuman (peserta) ----------

func (s *Server) listPublishedAnnouncements(c *gin.Context) {
	out, err := s.queryAnnouncements(c, `SELECT a.id, a.title, a.body, a.published, a.created_at`+annStatsCols+` FROM announcements a WHERE a.published ORDER BY a.created_at DESC LIMIT 20`, auth.UserID(c))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, out)
}
