package app

import (
	"context"
	"fmt"
	"math/rand/v2"
	"net/http"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ---------- Mulai ujian ----------

func (s *Server) startAttempt(c *gin.Context) {
	var in struct {
		PackageID string `json:"package_id"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if _, err := uuid.Parse(in.PackageID); err != nil {
		httpx.NotFound(c, "Paket tidak ditemukan.")
		return
	}
	uid := auth.UserID(c)
	var (
		title             string
		duration          int
		startAt, endAt    *time.Time
		shuffleQ, shuffle bool
	)
	err := s.DB.QueryRow(c, `SELECT title, duration_minutes, start_at, end_at, shuffle_questions, shuffle_options
		FROM exam_packages WHERE id=$1 AND status='terbit'`, in.PackageID).Scan(&title, &duration, &startAt, &endAt, &shuffleQ, &shuffle)
	if isNoRows(err) {
		httpx.NotFound(c, "Paket tidak ditemukan atau belum diterbitkan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}

	now := time.Now()
	if startAt != nil && now.Before(*startAt) {
		httpx.Conflict(c, "Ujian belum dibuka. Silakan kembali sesuai jadwal.")
		return
	}
	if endAt != nil && !now.Before(*endAt) {
		httpx.Conflict(c, "Jadwal ujian sudah ditutup.")
		return
	}

	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)

	// lanjutkan sesi yang masih berjalan (satu sesi aktif per peserta per paket)
	var activeID string
	var deadline time.Time
	err = tx.QueryRow(c, `SELECT id, deadline_at FROM attempts WHERE user_id=$1 AND package_id=$2 AND status='berlangsung' FOR UPDATE`,
		uid, in.PackageID).Scan(&activeID, &deadline)
	if err == nil {
		if time.Now().Before(deadline) {
			if err := tx.Commit(c); err != nil {
				httpx.Internal(c, err)
				return
			}
			httpx.OK(c, gin.H{"attempt_id": activeID, "resumed": true})
			return
		}
		// sesi lama sudah habis waktunya → tutup dulu
		if _, err := s.finalizeTx(c, tx, activeID); err != nil {
			httpx.Internal(c, err)
			return
		}
	} else if !isNoRows(err) {
		httpx.Internal(c, err)
		return
	}

	// has_image: opsi soal bergambar (figural "Gambar A–E") merujuk label di gambar → tidak boleh diacak.
	rows, err := tx.Query(c, `SELECT pq.question_id, COALESCE(q.image_url, '') <> ''
		FROM package_questions pq JOIN questions q ON q.id = pq.question_id
		WHERE pq.package_id=$1 ORDER BY pq.position`, in.PackageID)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var qids []string
	hasImage := map[string]bool{}
	for rows.Next() {
		var q string
		var img bool
		if err := rows.Scan(&q, &img); err != nil {
			rows.Close()
			httpx.Internal(c, err)
			return
		}
		qids = append(qids, q)
		hasImage[q] = img
	}
	rows.Close()
	if len(qids) == 0 {
		httpx.Conflict(c, "Paket ini belum memiliki soal.")
		return
	}

	var attemptID string
	err = tx.QueryRow(c, `INSERT INTO attempts(user_id, package_id, deadline_at)
		VALUES ($1, $2, LEAST(now() + make_interval(mins => $3), COALESCE($4::timestamptz, 'infinity'::timestamptz)))
		RETURNING id`, uid, in.PackageID, duration, endAt).Scan(&attemptID)
	if isUniqueViolation(err) {
		// permintaan paralel sudah membuat sesi → kembalikan sesi tersebut
		tx.Rollback(c)
		if err := s.DB.QueryRow(c, `SELECT id FROM attempts WHERE user_id=$1 AND package_id=$2 AND status='berlangsung'`,
			uid, in.PackageID).Scan(&activeID); err != nil {
			httpx.Internal(c, err)
			return
		}
		httpx.OK(c, gin.H{"attempt_id": activeID, "resumed": true})
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}

	if shuffleQ {
		rand.Shuffle(len(qids), func(i, j int) { qids[i], qids[j] = qids[j], qids[i] })
	}
	pos := make([]int32, len(qids))
	orders := make([]string, len(qids))
	for i := range qids {
		pos[i] = int32(i + 1)
		orders[i] = "ABCDE"
		if shuffle && !hasImage[qids[i]] {
			b := []byte("ABCDE")
			rand.Shuffle(len(b), func(i, j int) { b[i], b[j] = b[j], b[i] })
			orders[i] = string(b)
		}
	}
	if _, err := tx.Exec(c, `INSERT INTO attempt_questions(attempt_id, question_id, position, option_order)
		SELECT $1, unnest($2::uuid[]), unnest($3::int[]), unnest($4::text[])`, attemptID, qids, pos, orders); err != nil {
		httpx.Internal(c, err)
		return
	}
	if err := tx.Commit(c); err != nil {
		if isUniqueViolation(err) {
			httpx.Conflict(c, "Sesi ujian sedang dibuat. Silakan muat ulang halaman.")
			return
		}
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, uid, "ujian.mulai", title)
	httpx.Created(c, gin.H{"attempt_id": attemptID, "resumed": false})
}

// ---------- Data attempt ----------

type attemptRow struct {
	ID, UserID, PackageID, Status string
	StartedAt, DeadlineAt         time.Time
	SubmittedAt                   *time.Time
}

func (s *Server) loadAttempt(ctx context.Context, id string) (*attemptRow, error) {
	var a attemptRow
	err := s.DB.QueryRow(ctx, `SELECT id, user_id, package_id, status, started_at, deadline_at, submitted_at FROM attempts WHERE id=$1`, id).
		Scan(&a.ID, &a.UserID, &a.PackageID, &a.Status, &a.StartedAt, &a.DeadlineAt, &a.SubmittedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// ownAttempt memuat attempt dari path dan memastikan milik user (admin boleh jika allowAdmin).
func (s *Server) ownAttempt(c *gin.Context, allowAdmin bool) (*attemptRow, bool) {
	id, ok := pathUUID(c, "id", "Sesi ujian tidak ditemukan.")
	if !ok {
		return nil, false
	}
	a, err := s.loadAttempt(c, id)
	if isNoRows(err) {
		httpx.NotFound(c, "Sesi ujian tidak ditemukan.")
		return nil, false
	}
	if err != nil {
		httpx.Internal(c, err)
		return nil, false
	}
	if a.UserID != auth.UserID(c) && !(allowAdmin && auth.Role(c) == "admin") {
		httpx.NotFound(c, "Sesi ujian tidak ditemukan.")
		return nil, false
	}
	// tutup otomatis bila waktu sudah habis
	if a.Status == "berlangsung" && !time.Now().Before(a.DeadlineAt) {
		if err := s.finalizeAttempt(c, a.ID); err != nil {
			httpx.Internal(c, err)
			return nil, false
		}
		if a, err = s.loadAttempt(c, id); err != nil {
			httpx.Internal(c, err)
			return nil, false
		}
	}
	return a, true
}

func remaining(deadline time.Time) int {
	r := int(time.Until(deadline).Seconds())
	if r < 0 {
		return 0
	}
	return r
}

type examQuestion struct {
	ID       string         `json:"id"`
	Position int            `json:"position"`
	Subtest  string         `json:"subtest"`
	Body     string         `json:"body"`
	ImageURL string         `json:"image_url"`
	Options  []PublicOption `json:"options"`
}

type answerState struct {
	OptionID  *string `json:"option_id"`
	IsFlagged bool    `json:"is_flagged"`
}

// orderOptions mengurutkan opsi sesuai option_order dan memberi label tampil A–E.
func orderOptions[T any](order string, byLabel map[string]T, relabel func(T, string) T) []T {
	out := []T{}
	used := map[string]bool{}
	for _, ch := range order {
		l := string(ch)
		if o, ok := byLabel[l]; ok && !used[l] {
			used[l] = true
			out = append(out, relabel(o, labels[len(out)]))
		}
	}
	for _, l := range labels { // jaga-jaga jika option_order tidak lengkap
		if o, ok := byLabel[l]; ok && !used[l] {
			out = append(out, relabel(o, labels[len(out)]))
		}
	}
	return out
}

func (s *Server) getAttempt(c *gin.Context) {
	a, ok := s.ownAttempt(c, false)
	if !ok {
		return
	}
	var pkg struct {
		ID       string `json:"id"`
		Title    string `json:"title"`
		Duration int    `json:"duration_minutes"`
	}
	if err := s.DB.QueryRow(c, `SELECT id, title, duration_minutes FROM exam_packages WHERE id=$1`, a.PackageID).
		Scan(&pkg.ID, &pkg.Title, &pkg.Duration); err != nil {
		httpx.Internal(c, err)
		return
	}
	resp := gin.H{"id": a.ID, "status": a.Status, "package": pkg, "started_at": a.StartedAt, "deadline_at": a.DeadlineAt,
		"server_time": time.Now().UTC(), "remaining_seconds": 0, "questions": []examQuestion{}, "answers": map[string]answerState{}}
	if a.Status != "berlangsung" {
		resp["submitted_at"] = a.SubmittedAt
		httpx.OK(c, resp)
		return
	}
	rows, err := s.DB.Query(c, `SELECT aq.question_id, aq.position, aq.option_order, q.subtest, q.body, q.image_url
		FROM attempt_questions aq JOIN questions q ON q.id=aq.question_id WHERE aq.attempt_id=$1 ORDER BY aq.position`, a.ID)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	qs := []examQuestion{}
	orders := map[string]string{}
	ids := []string{}
	for rows.Next() {
		var q examQuestion
		var order string
		if err := rows.Scan(&q.ID, &q.Position, &order, &q.Subtest, &q.Body, &q.ImageURL); err != nil {
			rows.Close()
			httpx.Internal(c, err)
			return
		}
		orders[q.ID] = order
		ids = append(ids, q.ID)
		qs = append(qs, q)
	}
	rows.Close()
	opts := map[string]map[string]PublicOption{}
	rows, err = s.DB.Query(c, `SELECT question_id, id, label, body FROM question_options WHERE question_id = ANY($1)`, ids)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	for rows.Next() {
		var qid string
		var o PublicOption
		if err := rows.Scan(&qid, &o.ID, &o.Label, &o.Body); err != nil {
			rows.Close()
			httpx.Internal(c, err)
			return
		}
		if opts[qid] == nil {
			opts[qid] = map[string]PublicOption{}
		}
		opts[qid][o.Label] = o
	}
	rows.Close()
	for i := range qs {
		qs[i].Options = orderOptions(orders[qs[i].ID], opts[qs[i].ID], func(o PublicOption, l string) PublicOption { o.Label = l; return o })
	}
	answers := map[string]answerState{}
	rows, err = s.DB.Query(c, `SELECT question_id, option_id, is_flagged FROM attempt_answers WHERE attempt_id=$1`, a.ID)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	for rows.Next() {
		var qid string
		var st answerState
		if err := rows.Scan(&qid, &st.OptionID, &st.IsFlagged); err == nil {
			answers[qid] = st
		}
	}
	rows.Close()
	resp["questions"] = qs
	resp["answers"] = answers
	resp["remaining_seconds"] = remaining(a.DeadlineAt)
	httpx.OK(c, resp)
}

// ---------- Simpan jawaban ----------

func timeUp(c *gin.Context) {
	httpx.Fail(c, http.StatusConflict, "TIME_UP", "Waktu ujian telah habis. Jawaban Anda sudah dikumpulkan otomatis.")
}

func attemptFinished(c *gin.Context) {
	httpx.Fail(c, http.StatusConflict, "ATTEMPT_FINISHED", "Ujian ini sudah selesai.")
}

func (s *Server) saveAnswer(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Sesi ujian tidak ditemukan.")
	if !ok {
		return
	}
	var in struct {
		QuestionID string  `json:"question_id"`
		OptionID   *string `json:"option_id"`
		IsFlagged  bool    `json:"is_flagged"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if _, err := uuid.Parse(in.QuestionID); err != nil {
		httpx.FailFields(c, "Soal tidak valid.", map[string]string{"question_id": "Soal tidak valid."})
		return
	}
	if in.OptionID != nil && *in.OptionID == "" {
		in.OptionID = nil
	}
	if in.OptionID != nil {
		if _, err := uuid.Parse(*in.OptionID); err != nil {
			httpx.FailFields(c, "Pilihan jawaban tidak valid.", map[string]string{"option_id": "Pilihan jawaban tidak valid."})
			return
		}
	}
	a, err := s.loadAttempt(c, id)
	if isNoRows(err) || (err == nil && a.UserID != auth.UserID(c)) {
		httpx.NotFound(c, "Sesi ujian tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if a.Status != "berlangsung" {
		attemptFinished(c)
		return
	}
	if !time.Now().Before(a.DeadlineAt) {
		if err := s.finalizeAttempt(c, a.ID); err != nil {
			httpx.Internal(c, err)
			return
		}
		timeUp(c)
		return
	}
	// soal harus bagian dari attempt, opsi harus milik soal
	var inAttempt bool
	if err := s.DB.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM attempt_questions WHERE attempt_id=$1 AND question_id=$2)`, a.ID, in.QuestionID).Scan(&inAttempt); err != nil {
		httpx.Internal(c, err)
		return
	}
	if !inAttempt {
		httpx.FailFields(c, "Soal tidak valid.", map[string]string{"question_id": "Soal bukan bagian dari ujian ini."})
		return
	}
	if in.OptionID != nil {
		var okOpt bool
		if err := s.DB.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM question_options WHERE id=$1 AND question_id=$2)`, *in.OptionID, in.QuestionID).Scan(&okOpt); err != nil {
			httpx.Internal(c, err)
			return
		}
		if !okOpt {
			httpx.FailFields(c, "Pilihan jawaban tidak valid.", map[string]string{"option_id": "Opsi tidak sesuai dengan soal."})
			return
		}
	}
	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)
	// FOR SHARE: penyimpanan paralel tetap jalan, tetapi finalisasi (FOR UPDATE) menunggu commit ini
	var status string
	var deadline time.Time
	if err := tx.QueryRow(c, `SELECT status, deadline_at FROM attempts WHERE id=$1 FOR SHARE`, a.ID).Scan(&status, &deadline); err != nil {
		httpx.Internal(c, err)
		return
	}
	if status != "berlangsung" {
		attemptFinished(c)
		return
	}
	if !time.Now().Before(deadline) {
		tx.Rollback(c)
		if err := s.finalizeAttempt(c, a.ID); err != nil {
			httpx.Internal(c, err)
			return
		}
		timeUp(c)
		return
	}
	var savedAt time.Time
	if err := tx.QueryRow(c, `INSERT INTO attempt_answers(attempt_id, question_id, option_id, is_flagged, answered_at)
		VALUES ($1,$2,$3,$4,now()) ON CONFLICT (attempt_id, question_id)
		DO UPDATE SET option_id=EXCLUDED.option_id, is_flagged=EXCLUDED.is_flagged, answered_at=now() RETURNING answered_at`,
		a.ID, in.QuestionID, in.OptionID, in.IsFlagged).Scan(&savedAt); err != nil {
		httpx.Internal(c, err)
		return
	}
	if err := tx.Commit(c); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"saved_at": savedAt, "remaining_seconds": remaining(deadline)})
}

// ---------- Event anti-curang ----------

var eventTypes = map[string]bool{"tab_hidden": true, "blur": true, "fullscreen_exit": true}

func (s *Server) logEvent(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Sesi ujian tidak ditemukan.")
	if !ok {
		return
	}
	var in struct {
		Type string `json:"type"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if !eventTypes[in.Type] {
		httpx.FailFields(c, "Jenis event tidak valid.", map[string]string{"type": "Jenis event harus tab_hidden, blur, atau fullscreen_exit."})
		return
	}
	a, err := s.loadAttempt(c, id)
	if isNoRows(err) || (err == nil && a.UserID != auth.UserID(c)) {
		httpx.NotFound(c, "Sesi ujian tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if a.Status != "berlangsung" {
		attemptFinished(c)
		return
	}
	if _, err := s.DB.Exec(c, `INSERT INTO attempt_events(attempt_id, type) VALUES ($1,$2)`, a.ID, in.Type); err != nil {
		httpx.Internal(c, err)
		return
	}
	var switches int
	if in.Type == "tab_hidden" || in.Type == "blur" {
		err = s.DB.QueryRow(c, `UPDATE attempts SET tab_switches=tab_switches+1 WHERE id=$1 RETURNING tab_switches`, a.ID).Scan(&switches)
	} else {
		err = s.DB.QueryRow(c, `SELECT tab_switches FROM attempts WHERE id=$1`, a.ID).Scan(&switches)
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"recorded": true, "tab_switches": switches})
}

// ---------- Submit & finalisasi ----------

func (s *Server) submitAttempt(c *gin.Context) {
	a, ok := s.ownAttempt(c, false)
	if !ok {
		return
	}
	if a.Status == "berlangsung" {
		if err := s.finalizeAttempt(c, a.ID); err != nil {
			httpx.Internal(c, err)
			return
		}
	}
	r, err := s.resultSummary(c, a.ID)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"attempt_id": a.ID, "result": r})
}

// finalizeAttempt menutup attempt dan menghitung skor. Idempoten: aman dipanggil berulang/paralel.
func (s *Server) finalizeAttempt(ctx context.Context, attemptID string) error {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	done, err := s.finalizeTx(ctx, tx, attemptID)
	if err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	if done != nil {
		s.logActivity(context.WithoutCancel(ctx), done.userID, "ujian.selesai", fmt.Sprintf("%s · skor %d", done.title, done.total))
	}
	return nil
}

type finalized struct {
	userID, title string
	total         int
}

// finalizeTx mengunci attempt (FOR UPDATE) lalu menyimpan hasil. Mengembalikan nil jika sudah selesai sebelumnya.
func (s *Server) finalizeTx(ctx context.Context, tx pgx.Tx, attemptID string) (*finalized, error) {
	var status, userID, packageID string
	if err := tx.QueryRow(ctx, `SELECT status, user_id, package_id FROM attempts WHERE id=$1 FOR UPDATE`, attemptID).
		Scan(&status, &userID, &packageID); err != nil {
		return nil, err
	}
	if status == "selesai" {
		return nil, nil
	}
	var title string
	var pg PassingGrade
	if err := tx.QueryRow(ctx, `SELECT title, pass_twk, pass_tiu, pass_tkp, pass_total FROM exam_packages WHERE id=$1`, packageID).
		Scan(&title, &pg.TWK, &pg.TIU, &pg.TKP, &pg.Total); err != nil {
		return nil, err
	}
	rows, err := tx.Query(ctx, `SELECT q.subtest, o.weight,
		COALESCE((SELECT max(weight) FROM question_options mo WHERE mo.question_id=aq.question_id), 0)
		FROM attempt_questions aq
		JOIN questions q ON q.id=aq.question_id
		LEFT JOIN attempt_answers aa ON aa.attempt_id=aq.attempt_id AND aa.question_id=aq.question_id
		LEFT JOIN question_options o ON o.id=aa.option_id AND o.question_id=aq.question_id
		WHERE aq.attempt_id=$1`, attemptID)
	if err != nil {
		return nil, err
	}
	var items []ScoreItem
	for rows.Next() {
		var it ScoreItem
		if err := rows.Scan(&it.Subtest, &it.ChosenWeight, &it.MaxWeight); err != nil {
			rows.Close()
			return nil, err
		}
		items = append(items, it)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}
	r := Score(items, pg)
	var submitted, started time.Time
	if err := tx.QueryRow(ctx, `UPDATE attempts SET status='selesai', submitted_at=LEAST(now(), deadline_at)
		WHERE id=$1 RETURNING submitted_at, started_at`, attemptID).Scan(&submitted, &started); err != nil {
		return nil, err
	}
	dur := int(submitted.Sub(started).Seconds())
	if dur < 0 {
		dur = 0
	}
	if _, err := tx.Exec(ctx, `INSERT INTO results(attempt_id, user_id, package_id, score_twk, score_tiu, score_tkp, score_total,
		correct_count, wrong_count, empty_count, passed, duration_seconds, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (attempt_id) DO NOTHING`,
		attemptID, userID, packageID, r.TWK, r.TIU, r.TKP, r.Total, r.Correct, r.Wrong, r.Empty, r.Passed, dur, submitted); err != nil {
		return nil, err
	}
	return &finalized{userID: userID, title: title, total: r.Total}, nil
}

// ---------- Hasil & pembahasan ----------

type reviewOption struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Body   string `json:"body"`
	Weight int    `json:"weight"`
}

type reviewItem struct {
	Position       int            `json:"position"`
	QuestionID     string         `json:"question_id"`
	Subtest        string         `json:"subtest"`
	CategoryName   string         `json:"category_name"`
	Body           string         `json:"body"`
	ImageURL       string         `json:"image_url"`
	Explanation    string         `json:"explanation"`
	ChosenOptionID *string        `json:"chosen_option_id"`
	Score          int            `json:"score"`
	MaxWeight      int            `json:"max_weight"`
	Status         string         `json:"status"`
	Options        []reviewOption `json:"options"`
}

func (s *Server) getResult(c *gin.Context) {
	a, ok := s.ownAttempt(c, true)
	if !ok {
		return
	}
	if a.Status != "selesai" {
		httpx.Fail(c, http.StatusConflict, "ATTEMPT_NOT_FINISHED", "Ujian belum selesai.")
		return
	}
	var hidden bool
	if err := s.DB.QueryRow(c, `SELECT hidden_at IS NOT NULL FROM results WHERE attempt_id=$1`, a.ID).Scan(&hidden); err == nil && hidden && auth.Role(c) != "admin" {
		httpx.NotFound(c, "Hasil ini sudah Anda hapus dari riwayat.")
		return
	}
	r, err := s.resultSummary(c, a.ID)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var pkg struct {
		ID        string `json:"id"`
		Title     string `json:"title"`
		PassTWK   int    `json:"pass_twk"`
		PassTIU   int    `json:"pass_tiu"`
		PassTKP   int    `json:"pass_tkp"`
		PassTotal int    `json:"pass_total"`
	}
	if err := s.DB.QueryRow(c, `SELECT id, title, pass_twk, pass_tiu, pass_tkp, pass_total FROM exam_packages WHERE id=$1`, a.PackageID).
		Scan(&pkg.ID, &pkg.Title, &pkg.PassTWK, &pkg.PassTIU, &pkg.PassTKP, &pkg.PassTotal); err != nil {
		httpx.Internal(c, err)
		return
	}
	var userName string
	_ = s.DB.QueryRow(c, `SELECT name FROM users WHERE id=$1`, a.UserID).Scan(&userName)
	var rank, participants int
	if err := s.DB.QueryRow(c, `SELECT
		(SELECT count(*) + 1 FROM results WHERE package_id=$1 AND score_total > $2),
		(SELECT count(*) FROM results WHERE package_id=$1)`, a.PackageID, r.ScoreTotal).Scan(&rank, &participants); err != nil {
		httpx.Internal(c, err)
		return
	}

	rows, err := s.DB.Query(c, `SELECT aq.position, aq.question_id, aq.option_order, q.subtest, COALESCE(cat.name,''), q.body,
		q.image_url, q.explanation, aa.option_id
		FROM attempt_questions aq JOIN questions q ON q.id=aq.question_id
		LEFT JOIN categories cat ON cat.id=q.category_id
		LEFT JOIN attempt_answers aa ON aa.attempt_id=aq.attempt_id AND aa.question_id=aq.question_id
		WHERE aq.attempt_id=$1 ORDER BY aq.position`, a.ID)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	review := []reviewItem{}
	orders := map[string]string{}
	ids := []string{}
	for rows.Next() {
		var it reviewItem
		var order string
		if err := rows.Scan(&it.Position, &it.QuestionID, &order, &it.Subtest, &it.CategoryName, &it.Body, &it.ImageURL,
			&it.Explanation, &it.ChosenOptionID); err != nil {
			rows.Close()
			httpx.Internal(c, err)
			return
		}
		orders[it.QuestionID] = order
		ids = append(ids, it.QuestionID)
		review = append(review, it)
	}
	rows.Close()
	opts := map[string]map[string]reviewOption{}
	rows, err = s.DB.Query(c, `SELECT question_id, id, label, body, weight FROM question_options WHERE question_id = ANY($1)`, ids)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	for rows.Next() {
		var qid string
		var o reviewOption
		if err := rows.Scan(&qid, &o.ID, &o.Label, &o.Body, &o.Weight); err != nil {
			rows.Close()
			httpx.Internal(c, err)
			return
		}
		if opts[qid] == nil {
			opts[qid] = map[string]reviewOption{}
		}
		opts[qid][o.Label] = o
	}
	rows.Close()
	maxBy := map[string]int{"TWK": 0, "TIU": 0, "TKP": 0}
	for i := range review {
		it := &review[i]
		it.Options = orderOptions(orders[it.QuestionID], opts[it.QuestionID], func(o reviewOption, l string) reviewOption { o.Label = l; return o })
		chosenW := -1
		for _, o := range it.Options {
			if o.Weight > it.MaxWeight {
				it.MaxWeight = o.Weight
			}
			if it.ChosenOptionID != nil && o.ID == *it.ChosenOptionID {
				chosenW = o.Weight
			}
		}
		maxBy[it.Subtest] += it.MaxWeight
		switch {
		case chosenW < 0:
			it.Status, it.ChosenOptionID = "kosong", nil
		case it.MaxWeight > 0 && chosenW == it.MaxWeight:
			it.Status, it.Score = "benar", chosenW
		default:
			it.Status, it.Score = "salah", chosenW
		}
	}
	submittedAt := r.CreatedAt
	if a.SubmittedAt != nil {
		submittedAt = *a.SubmittedAt
	}
	httpx.OK(c, gin.H{
		"attempt_id": a.ID, "package": pkg, "user": gin.H{"name": userName},
		"score_twk": r.ScoreTWK, "score_tiu": r.ScoreTIU, "score_tkp": r.ScoreTKP, "score_total": r.ScoreTotal,
		"correct_count": r.CorrectCount, "wrong_count": r.WrongCount, "empty_count": r.EmptyCount,
		"passed": r.Passed, "duration_seconds": r.DurationSeconds, "rank": rank, "participants": participants,
		"submitted_at": submittedAt, "max": maxBy, "review": review,
	})
}
