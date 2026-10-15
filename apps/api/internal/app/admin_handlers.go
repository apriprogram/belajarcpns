package app

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"strconv"
	"strings"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
)

// ---------- Dashboard admin ----------

func (s *Server) adminDashboard(c *gin.Context) {
	var t struct {
		Peserta           int     `json:"peserta"`
		Online            int     `json:"online"`
		ActiveToday       int     `json:"active_today"`
		Questions         int     `json:"questions"`
		QuestionsPub      int     `json:"questions_published"`
		Packages          int     `json:"packages"`
		PackagesPublished int     `json:"packages_published"`
		Attempts          int     `json:"attempts"`
		AttemptsToday     int     `json:"attempts_today"`
		AvgScore          float64 `json:"avg_score"`
		PassRate          float64 `json:"pass_rate"`
	}
	todayStart := todayJakarta()
	var passed, results int
	err := s.DB.QueryRow(c, `SELECT
		(SELECT count(*) FROM users WHERE role='peserta'),
		(SELECT count(*) FROM users WHERE role='peserta' AND last_seen_at > now() - interval '5 minutes'),
		(SELECT count(*) FROM users WHERE role='peserta' AND last_seen_at >= $1),
		(SELECT count(*) FROM questions),
		(SELECT count(*) FROM questions WHERE status='terbit'),
		(SELECT count(*) FROM exam_packages),
		(SELECT count(*) FROM exam_packages WHERE status='terbit'),
		(SELECT count(*) FROM attempts),
		(SELECT count(*) FROM attempts WHERE started_at >= $1),
		(SELECT COALESCE(avg(score_total),0) FROM results),
		(SELECT count(*) FILTER (WHERE passed) FROM results),
		(SELECT count(*) FROM results)`, todayStart).
		Scan(&t.Peserta, &t.Online, &t.ActiveToday, &t.Questions, &t.QuestionsPub, &t.Packages, &t.PackagesPublished,
			&t.Attempts, &t.AttemptsToday, &t.AvgScore, &passed, &results)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	t.AvgScore = round1(t.AvgScore)
	t.PassRate = pct(passed, results)

	type dayAct struct {
		Day           string `json:"day"`
		Label         string `json:"label"`
		Attempts      int    `json:"attempts"`
		Registrations int    `json:"registrations"`
	}
	start := todayStart.AddDate(0, 0, -13)
	rows, err := s.DB.Query(c, `SELECT to_char(d,'YYYY-MM-DD'),
		(SELECT count(*) FROM attempts a WHERE (a.started_at AT TIME ZONE 'Asia/Jakarta')::date = d),
		(SELECT count(*) FROM users u WHERE u.role='peserta' AND (u.created_at AT TIME ZONE 'Asia/Jakarta')::date = d)
		FROM generate_series($1::date, $2::date, interval '1 day') AS g(d0), LATERAL (SELECT g.d0::date AS d) x
		ORDER BY d`, start.Format("2006-01-02"), todayStart.Format("2006-01-02"))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	activity := []dayAct{}
	for rows.Next() {
		var a dayAct
		if err := rows.Scan(&a.Day, &a.Attempts, &a.Registrations); err == nil {
			if d, err := time.Parse("2006-01-02", a.Day); err == nil {
				a.Label = dayLabels[d.Weekday()]
			}
			activity = append(activity, a)
		}
	}
	rows.Close()

	bySub := map[string]int{"TWK": 0, "TIU": 0, "TKP": 0}
	rows, err = s.DB.Query(c, `SELECT subtest, count(*) FROM questions GROUP BY subtest`)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	for rows.Next() {
		var sub string
		var n int
		if rows.Scan(&sub, &n) == nil {
			bySub[sub] = n
		}
	}
	rows.Close()

	type recent struct {
		AttemptID    string    `json:"attempt_id"`
		UserName     string    `json:"user_name"`
		PackageTitle string    `json:"package_title"`
		ScoreTotal   int       `json:"score_total"`
		Passed       bool      `json:"passed"`
		CreatedAt    time.Time `json:"created_at"`
	}
	recents := []recent{}
	rows, err = s.DB.Query(c, `SELECT r.attempt_id, u.name, p.title, r.score_total, r.passed, r.created_at
		FROM results r JOIN users u ON u.id=r.user_id JOIN exam_packages p ON p.id=r.package_id
		ORDER BY r.created_at DESC LIMIT 8`)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	for rows.Next() {
		var x recent
		if rows.Scan(&x.AttemptID, &x.UserName, &x.PackageTitle, &x.ScoreTotal, &x.Passed, &x.CreatedAt) == nil {
			recents = append(recents, x)
		}
	}
	rows.Close()

	type topPkg struct {
		ID       string  `json:"id"`
		Title    string  `json:"title"`
		Attempts int     `json:"attempts"`
		AvgScore float64 `json:"avg_score"`
	}
	tops := []topPkg{}
	rows, err = s.DB.Query(c, `SELECT p.id, p.title, (SELECT count(*) FROM attempts a WHERE a.package_id=p.id) AS n,
		COALESCE((SELECT avg(score_total) FROM results r WHERE r.package_id=p.id),0)
		FROM exam_packages p ORDER BY n DESC, p.created_at DESC LIMIT 5`)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	for rows.Next() {
		var x topPkg
		if rows.Scan(&x.ID, &x.Title, &x.Attempts, &x.AvgScore) == nil {
			x.AvgScore = round1(x.AvgScore)
			tops = append(tops, x)
		}
	}
	rows.Close()

	httpx.OK(c, gin.H{"totals": t, "activity": activity, "by_subtest": bySub, "recent_results": recents, "top_packages": tops})
}

// ---------- Peserta (admin) ----------

type AdminUser struct {
	User
	AttemptsCount int     `json:"attempts_count"`
	AvgScore      float64 `json:"avg_score"`
}

func (s *Server) adminListUsers(c *gin.Context) {
	page, perPage, offset := httpx.Paging(c)
	where := []string{}
	args := []any{}
	switch role := c.DefaultQuery("role", "peserta"); role {
	case "admin", "peserta":
		args = append(args, role)
		where = append(where, fmt.Sprintf("u.role=$%d", len(args)))
	}
	if q := strings.TrimSpace(c.Query("q")); q != "" {
		args = append(args, "%"+q+"%")
		where = append(where, fmt.Sprintf("(u.name ILIKE $%d OR u.email ILIKE $%d OR u.phone ILIKE $%d)", len(args), len(args), len(args)))
	}
	if st := c.Query("status"); st == "active" || st == "blocked" {
		args = append(args, st)
		where = append(where, fmt.Sprintf("u.status=$%d", len(args)))
	}
	w := "TRUE"
	if len(where) > 0 {
		w = strings.Join(where, " AND ")
	}
	var total int
	if err := s.DB.QueryRow(c, `SELECT count(*) FROM users u WHERE `+w, args...).Scan(&total); err != nil {
		httpx.Internal(c, err)
		return
	}
	args = append(args, perPage, offset)
	rows, err := s.DB.Query(c, `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.gender, u.avatar_url, u.last_seen_at, u.created_at,
		(SELECT count(*) FROM attempts a WHERE a.user_id=u.id),
		COALESCE((SELECT avg(score_total) FROM results r WHERE r.user_id=u.id),0)
		FROM users u WHERE `+w+fmt.Sprintf(` ORDER BY u.created_at DESC LIMIT $%d OFFSET $%d`, len(args)-1, len(args)), args...)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer rows.Close()
	out := []AdminUser{}
	for rows.Next() {
		var u AdminUser
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Role, &u.Status, &u.Gender, &u.AvatarURL, &u.LastSeen, &u.CreatedAt,
			&u.AttemptsCount, &u.AvgScore); err != nil {
			httpx.Internal(c, err)
			return
		}
		u.AvgScore = round1(u.AvgScore)
		out = append(out, u)
	}
	httpx.OKMeta(c, out, httpx.NewMeta(page, perPage, total))
}

func (s *Server) adminGetUser(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pengguna tidak ditemukan.")
	if !ok {
		return
	}
	var u User
	err := scanUser(s.DB.QueryRow(c, `SELECT `+userCols+` FROM users WHERE id=$1`, id), &u)
	if isNoRows(err) {
		httpx.NotFound(c, "Pengguna tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var sum struct {
		Attempts     int     `json:"attempts"`
		AvgScore     float64 `json:"avg_score"`
		BestScore    int     `json:"best_score"`
		Passed       int     `json:"passed"`
		Failed       int     `json:"failed"`
		TabSwitches  int     `json:"tab_switches"`
		StudyMinutes int     `json:"study_minutes"`
	}
	err = s.DB.QueryRow(c, `SELECT
		(SELECT count(*) FROM attempts WHERE user_id=$1),
		(SELECT COALESCE(avg(score_total),0) FROM results WHERE user_id=$1),
		(SELECT COALESCE(max(score_total),0) FROM results WHERE user_id=$1),
		(SELECT count(*) FROM results WHERE user_id=$1 AND passed),
		(SELECT count(*) FROM results WHERE user_id=$1 AND NOT passed),
		(SELECT COALESCE(sum(tab_switches),0) FROM attempts WHERE user_id=$1),
		(SELECT COALESCE(sum(seconds),0)/60 FROM study_logs WHERE user_id=$1)`, id).
		Scan(&sum.Attempts, &sum.AvgScore, &sum.BestScore, &sum.Passed, &sum.Failed, &sum.TabSwitches, &sum.StudyMinutes)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	sum.AvgScore = round1(sum.AvgScore)
	history, err := s.queryResultSummaries(c, resultSummarySelect+` WHERE r.user_id=$1 ORDER BY r.created_at DESC LIMIT 100`, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"user": u, "summary": sum, "history": history})
}

func passedLabel(p bool) string {
	if p {
		return "Lulus"
	}
	return "Tidak Lulus"
}

func fmtTime(t time.Time) string { return t.In(Jakarta).Format("2006-01-02 15:04") }

func (s *Server) adminExportUserHistory(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pengguna tidak ditemukan.")
	if !ok {
		return
	}
	var name, email string
	err := s.DB.QueryRow(c, `SELECT name, email FROM users WHERE id=$1`, id).Scan(&name, &email)
	if isNoRows(err) {
		httpx.NotFound(c, "Pengguna tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	history, err := s.queryResultSummaries(c, resultSummarySelect+` WHERE r.user_id=$1 ORDER BY r.created_at DESC`, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	out := [][]string{{"nama", "email", "tanggal", "paket", "twk", "tiu", "tkp", "total", "benar", "salah", "kosong", "status", "durasi_menit"}}
	for _, r := range history {
		out = append(out, []string{name, email, fmtTime(r.CreatedAt), r.PackageTitle, strconv.Itoa(r.ScoreTWK), strconv.Itoa(r.ScoreTIU),
			strconv.Itoa(r.ScoreTKP), strconv.Itoa(r.ScoreTotal), strconv.Itoa(r.CorrectCount), strconv.Itoa(r.WrongCount),
			strconv.Itoa(r.EmptyCount), passedLabel(r.Passed), strconv.Itoa(r.DurationSeconds / 60)})
	}
	writeCSV(c, "riwayat-"+strings.SplitN(email, "@", 2)[0]+".csv", out)
}

func (s *Server) adminSetUserStatus(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pengguna tidak ditemukan.")
	if !ok {
		return
	}
	var in struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if in.Status != "active" && in.Status != "blocked" {
		httpx.FailFields(c, "Status tidak valid.", map[string]string{"status": "Status harus active atau blocked."})
		return
	}
	if id == auth.UserID(c) && in.Status == "blocked" {
		httpx.Conflict(c, "Anda tidak dapat memblokir akun Anda sendiri.")
		return
	}
	var u User
	err := scanUser(s.DB.QueryRow(c, `UPDATE users SET status=$1, updated_at=now() WHERE id=$2 RETURNING `+userCols, in.Status, id), &u)
	if isNoRows(err) {
		httpx.NotFound(c, "Pengguna tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if in.Status == "blocked" {
		_, _ = s.DB.Exec(c, `UPDATE refresh_tokens SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL`, id)
		s.logActivity(c, auth.UserID(c), "peserta.blokir", u.Email)
	} else {
		s.logActivity(c, auth.UserID(c), "peserta.aktifkan", u.Email)
	}
	httpx.OK(c, u)
}

// tempPassword menghasilkan password sementara 10 karakter (huruf + angka).
func tempPassword() string {
	const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"
	const digits = "23456789"
	pick := func(set string) byte {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(set))))
		return set[n.Int64()]
	}
	b := make([]byte, 10)
	all := letters + digits
	for i := range b {
		b[i] = pick(all)
	}
	// pastikan ada huruf & angka di posisi acak
	i1, _ := rand.Int(rand.Reader, big.NewInt(5))
	i2, _ := rand.Int(rand.Reader, big.NewInt(5))
	b[i1.Int64()] = pick(letters)
	b[5+i2.Int64()] = pick(digits)
	return string(b)
}

func (s *Server) adminResetPassword(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pengguna tidak ditemukan.")
	if !ok {
		return
	}
	pw := tempPassword()
	hash, err := auth.HashPassword(pw)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var email string
	err = s.DB.QueryRow(c, `UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2 RETURNING email`, hash, id).Scan(&email)
	if isNoRows(err) {
		httpx.NotFound(c, "Pengguna tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	_, _ = s.DB.Exec(c, `UPDATE refresh_tokens SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL`, id)
	s.logActivity(c, auth.UserID(c), "peserta.reset_password", email)
	httpx.OK(c, gin.H{"temp_password": pw})
}

// ---------- Laporan paket ----------

type rankRow struct {
	Rank       int       `json:"rank"`
	AttemptID  string    `json:"attempt_id"`
	UserName   string    `json:"user_name"`
	Email      string    `json:"email"`
	ScoreTWK   int       `json:"score_twk"`
	ScoreTIU   int       `json:"score_tiu"`
	ScoreTKP   int       `json:"score_tkp"`
	ScoreTotal int       `json:"score_total"`
	Passed     bool      `json:"passed"`
	CreatedAt  time.Time `json:"created_at"`
}

type itemRow struct {
	QuestionID string  `json:"question_id"`
	Position   int     `json:"position"`
	Subtest    string  `json:"subtest"`
	Body       string  `json:"body"`
	Answered   int     `json:"answered"`
	Correct    int     `json:"correct"`
	PctCorrect float64 `json:"pct_correct"`
	Flag       *string `json:"flag"`
}

type reportSummary struct {
	Participants int     `json:"participants"`
	AvgTotal     float64 `json:"avg_total"`
	MaxTotal     int     `json:"max_total"`
	MinTotal     int     `json:"min_total"`
	PassRate     float64 `json:"pass_rate"`
	AvgTWK       float64 `json:"avg_twk"`
	AvgTIU       float64 `json:"avg_tiu"`
	AvgTKP       float64 `json:"avg_tkp"`
}

type distRow struct {
	Range string `json:"range"`
	Count int    `json:"count"`
}

type packageReportData struct {
	Package      *AdminPackage `json:"package"`
	Summary      reportSummary `json:"summary"`
	Distribution []distRow     `json:"distribution"`
	Ranking      []rankRow     `json:"ranking"`
	Items        []itemRow     `json:"items"`
}

// Item dianggap layak dianalisis bila minimal dijawab oleh minItemAnswers peserta.
const minItemAnswers = 1

func (s *Server) buildPackageReport(ctx context.Context, id string) (*packageReportData, error) {
	p, err := s.loadAdminPackage(ctx, id)
	if err != nil {
		return nil, err
	}
	p.Questions = nil
	rep := &packageReportData{Package: p}
	var passed int
	err = s.DB.QueryRow(ctx, `SELECT count(*), COALESCE(avg(score_total),0), COALESCE(max(score_total),0), COALESCE(min(score_total),0),
		count(*) FILTER (WHERE passed), COALESCE(avg(score_twk),0), COALESCE(avg(score_tiu),0), COALESCE(avg(score_tkp),0)
		FROM results WHERE package_id=$1`, id).Scan(&rep.Summary.Participants, &rep.Summary.AvgTotal, &rep.Summary.MaxTotal,
		&rep.Summary.MinTotal, &passed, &rep.Summary.AvgTWK, &rep.Summary.AvgTIU, &rep.Summary.AvgTKP)
	if err != nil {
		return nil, err
	}
	rep.Summary.AvgTotal = round1(rep.Summary.AvgTotal)
	rep.Summary.AvgTWK = round1(rep.Summary.AvgTWK)
	rep.Summary.AvgTIU = round1(rep.Summary.AvgTIU)
	rep.Summary.AvgTKP = round1(rep.Summary.AvgTKP)
	rep.Summary.PassRate = pct(passed, rep.Summary.Participants)

	buckets := []distRow{{"0-99", 0}, {"100-199", 0}, {"200-299", 0}, {"300-399", 0}, {"400-499", 0}, {"500-550", 0}}
	rows, err := s.DB.Query(ctx, `SELECT RANK() OVER (ORDER BY r.score_total DESC), r.attempt_id, u.name, u.email,
		r.score_twk, r.score_tiu, r.score_tkp, r.score_total, r.passed, r.created_at
		FROM results r JOIN users u ON u.id=r.user_id WHERE r.package_id=$1
		ORDER BY r.score_total DESC, r.created_at`, id)
	if err != nil {
		return nil, err
	}
	rep.Ranking = []rankRow{}
	for rows.Next() {
		var x rankRow
		if err := rows.Scan(&x.Rank, &x.AttemptID, &x.UserName, &x.Email, &x.ScoreTWK, &x.ScoreTIU, &x.ScoreTKP,
			&x.ScoreTotal, &x.Passed, &x.CreatedAt); err != nil {
			rows.Close()
			return nil, err
		}
		b := x.ScoreTotal / 100
		if b < 0 {
			b = 0
		}
		if b > 5 {
			b = 5
		}
		buckets[b].Count++
		rep.Ranking = append(rep.Ranking, x)
	}
	rows.Close()
	rep.Distribution = buckets

	// analisis butir: jawaban pada attempt selesai untuk paket ini
	rows, err = s.DB.Query(ctx, `SELECT pq.question_id, pq.position, q.subtest, q.body,
		count(aa.option_id) AS answered,
		count(aa.option_id) FILTER (WHERE o.weight = mx.max_w AND mx.max_w > 0) AS correct
		FROM package_questions pq
		JOIN questions q ON q.id=pq.question_id
		JOIN LATERAL (SELECT COALESCE(max(weight),0) AS max_w FROM question_options WHERE question_id=pq.question_id) mx ON true
		LEFT JOIN attempts a ON a.package_id=pq.package_id AND a.status='selesai'
		LEFT JOIN attempt_answers aa ON aa.attempt_id=a.id AND aa.question_id=pq.question_id
		LEFT JOIN question_options o ON o.id=aa.option_id
		WHERE pq.package_id=$1
		GROUP BY pq.question_id, pq.position, q.subtest, q.body
		ORDER BY pq.position`, id)
	if err != nil {
		return nil, err
	}
	rep.Items = []itemRow{}
	for rows.Next() {
		var x itemRow
		if err := rows.Scan(&x.QuestionID, &x.Position, &x.Subtest, &x.Body, &x.Answered, &x.Correct); err != nil {
			rows.Close()
			return nil, err
		}
		x.PctCorrect = pct(x.Correct, x.Answered)
		if x.Answered >= minItemAnswers {
			if x.PctCorrect >= 90 {
				f := "terlalu_mudah"
				x.Flag = &f
			} else if x.PctCorrect <= 20 {
				f := "terlalu_sulit"
				x.Flag = &f
			}
		}
		rep.Items = append(rep.Items, x)
	}
	rows.Close()
	return rep, rows.Err()
}

func (s *Server) packageReport(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Paket tidak ditemukan.")
	if !ok {
		return
	}
	rep, err := s.buildPackageReport(c, id)
	if isNoRows(err) {
		httpx.NotFound(c, "Paket tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, rep)
}

func (s *Server) exportPackageReport(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Paket tidak ditemukan.")
	if !ok {
		return
	}
	rep, err := s.buildPackageReport(c, id)
	if isNoRows(err) {
		httpx.NotFound(c, "Paket tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	f1 := func(x float64) string { return strconv.FormatFloat(x, 'f', 1, 64) }
	out := [][]string{
		{"Laporan Paket", rep.Package.Title},
		{"Peserta", strconv.Itoa(rep.Summary.Participants), "Rata-rata", f1(rep.Summary.AvgTotal), "Tertinggi", strconv.Itoa(rep.Summary.MaxTotal),
			"Terendah", strconv.Itoa(rep.Summary.MinTotal), "Kelulusan (%)", f1(rep.Summary.PassRate)},
		{},
		{"peringkat", "nama", "email", "twk", "tiu", "tkp", "total", "status", "tanggal"},
	}
	for _, r := range rep.Ranking {
		out = append(out, []string{strconv.Itoa(r.Rank), r.UserName, r.Email, strconv.Itoa(r.ScoreTWK), strconv.Itoa(r.ScoreTIU),
			strconv.Itoa(r.ScoreTKP), strconv.Itoa(r.ScoreTotal), passedLabel(r.Passed), fmtTime(r.CreatedAt)})
	}
	out = append(out, []string{}, []string{"no", "subtes", "soal", "dijawab", "benar", "persen_benar", "catatan"})
	for _, it := range rep.Items {
		flag := ""
		if it.Flag != nil {
			flag = strings.ReplaceAll(*it.Flag, "_", " ")
		}
		body := it.Body
		if r := []rune(body); len(r) > 120 {
			body = string(r[:120]) + "…"
		}
		out = append(out, []string{strconv.Itoa(it.Position), it.Subtest, body, strconv.Itoa(it.Answered), strconv.Itoa(it.Correct), f1(it.PctCorrect), flag})
	}
	writeCSV(c, "laporan-paket-"+time.Now().In(Jakarta).Format("20060102")+".csv", out)
}

// ---------- Pengumuman (admin) ----------

func (s *Server) adminListAnnouncements(c *gin.Context) {
	out, err := s.queryAnnouncements(c, `SELECT a.id, a.title, a.body, a.published, a.created_at`+annStatsCols+` FROM announcements a ORDER BY a.created_at DESC`, auth.UserID(c))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, out)
}

type announcementInput struct {
	Title     string `json:"title"`
	Body      string `json:"body"`
	Published *bool  `json:"published"`
}

func (in *announcementInput) validate() map[string]string {
	f := v{}
	in.Title = strings.TrimSpace(in.Title)
	in.Body = strings.TrimSpace(in.Body)
	if len([]rune(in.Title)) < 3 {
		f["title"] = "Judul minimal 3 karakter."
	} else if len([]rune(in.Title)) > 160 {
		f["title"] = "Judul maksimal 160 karakter."
	}
	if len([]rune(in.Body)) < 5 {
		f["body"] = "Isi pengumuman minimal 5 karakter."
	}
	return f
}

func (s *Server) createAnnouncement(c *gin.Context) {
	var in announcementInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if f := in.validate(); len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali isian pengumuman.", f)
		return
	}
	pub := in.Published == nil || *in.Published
	list, err := s.queryAnnouncements(c, `INSERT INTO announcements(title, body, published, created_by) VALUES ($1,$2,$3,$4)
		RETURNING id, title, body, published, created_at`, in.Title, in.Body, pub, auth.UserID(c))
	if err != nil || len(list) == 0 {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "pengumuman.tambah", in.Title)
	httpx.Created(c, list[0])
}

func (s *Server) updateAnnouncement(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pengumuman tidak ditemukan.")
	if !ok {
		return
	}
	var in announcementInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if f := in.validate(); len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali isian pengumuman.", f)
		return
	}
	list, err := s.queryAnnouncements(c, `UPDATE announcements SET title=$1, body=$2, published=COALESCE($3, published) WHERE id=$4
		RETURNING id, title, body, published, created_at`, in.Title, in.Body, in.Published, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if len(list) == 0 {
		httpx.NotFound(c, "Pengumuman tidak ditemukan.")
		return
	}
	s.logActivity(c, auth.UserID(c), "pengumuman.ubah", in.Title)
	httpx.OK(c, list[0])
}

func (s *Server) deleteAnnouncement(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pengumuman tidak ditemukan.")
	if !ok {
		return
	}
	tag, err := s.DB.Exec(c, `DELETE FROM announcements WHERE id=$1`, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Pengumuman tidak ditemukan.")
		return
	}
	s.logActivity(c, auth.UserID(c), "pengumuman.hapus", id)
	httpx.OK(c, gin.H{"message": "Pengumuman dihapus."})
}

// ---------- Pengaturan ----------

type Settings struct {
	PassingGrade struct {
		TWK   int `json:"twk"`
		TIU   int `json:"tiu"`
		TKP   int `json:"tkp"`
		Total int `json:"total"`
	} `json:"passing_grade"`
	DefaultDuration int `json:"default_duration"`
	Composition     struct {
		TWK int `json:"twk"`
		TIU int `json:"tiu"`
		TKP int `json:"tkp"`
	} `json:"composition"`
}

func DefaultSettings() Settings {
	var st Settings
	st.PassingGrade.TWK, st.PassingGrade.TIU, st.PassingGrade.TKP, st.PassingGrade.Total = 65, 80, 166, 0
	st.DefaultDuration = 100
	st.Composition.TWK, st.Composition.TIU, st.Composition.TKP = 30, 35, 45
	return st
}

// loadSettings membaca pengaturan; nilai yang tidak ada memakai default.
func (s *Server) loadSettings(ctx context.Context) Settings {
	st := DefaultSettings()
	var raw []byte
	if err := s.DB.QueryRow(ctx, `SELECT value FROM settings WHERE key='app'`).Scan(&raw); err == nil {
		_ = json.Unmarshal(raw, &st)
	}
	return st
}

func (s *Server) getSettings(c *gin.Context) { httpx.OK(c, s.loadSettings(c)) }

func (s *Server) updateSettings(c *gin.Context) {
	st := s.loadSettings(c)
	if err := c.ShouldBindJSON(&st); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	f := v{}
	chk := func(field string, val, min, max int) {
		if val < min || val > max {
			f[field] = fmt.Sprintf("Nilai harus %d–%d.", min, max)
		}
	}
	chk("passing_grade.twk", st.PassingGrade.TWK, 0, 150)
	chk("passing_grade.tiu", st.PassingGrade.TIU, 0, 175)
	chk("passing_grade.tkp", st.PassingGrade.TKP, 0, 225)
	chk("passing_grade.total", st.PassingGrade.Total, 0, 550)
	chk("default_duration", st.DefaultDuration, 1, 600)
	chk("composition.twk", st.Composition.TWK, 0, 500)
	chk("composition.tiu", st.Composition.TIU, 0, 500)
	chk("composition.tkp", st.Composition.TKP, 0, 500)
	if st.Composition.TWK+st.Composition.TIU+st.Composition.TKP == 0 {
		f["composition"] = "Komposisi soal minimal 1."
	}
	if len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali pengaturan.", f)
		return
	}
	raw, _ := json.Marshal(st)
	if _, err := s.DB.Exec(c, `INSERT INTO settings(key, value, updated_at) VALUES ('app', $1, now())
		ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`, raw); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "pengaturan.ubah", string(raw))
	httpx.OK(c, st)
}

// ---------- Log aktivitas ----------

func (s *Server) adminActivity(c *gin.Context) {
	page, perPage, offset := httpx.Paging(c)
	var total int
	if err := s.DB.QueryRow(c, `SELECT count(*) FROM activity_logs`).Scan(&total); err != nil {
		httpx.Internal(c, err)
		return
	}
	rows, err := s.DB.Query(c, `SELECT l.id, COALESCE(u.name,'Sistem'), l.action, l.detail, l.created_at
		FROM activity_logs l LEFT JOIN users u ON u.id=l.user_id ORDER BY l.created_at DESC, l.id DESC LIMIT $1 OFFSET $2`, perPage, offset)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer rows.Close()
	type act struct {
		ID        int64     `json:"id"`
		UserName  string    `json:"user_name"`
		Action    string    `json:"action"`
		Detail    string    `json:"detail"`
		CreatedAt time.Time `json:"created_at"`
	}
	out := []act{}
	for rows.Next() {
		var a act
		if err := rows.Scan(&a.ID, &a.UserName, &a.Action, &a.Detail, &a.CreatedAt); err != nil {
			httpx.Internal(c, err)
			return
		}
		out = append(out, a)
	}
	httpx.OKMeta(c, out, httpx.NewMeta(page, perPage, total))
}
