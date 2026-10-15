package app

import (
	"context"
	"fmt"
	"strings"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// AdminPackage representasi paket untuk admin.
type AdminPackage struct {
	ID               string         `json:"id"`
	Title            string         `json:"title"`
	Description      string         `json:"description"`
	DurationMinutes  int            `json:"duration_minutes"`
	StartAt          *time.Time     `json:"start_at"`
	EndAt            *time.Time     `json:"end_at"`
	ShuffleQuestions bool           `json:"shuffle_questions"`
	ShuffleOptions   bool           `json:"shuffle_options"`
	Status           string         `json:"status"`
	PassTWK          int            `json:"pass_twk"`
	PassTIU          int            `json:"pass_tiu"`
	PassTKP          int            `json:"pass_tkp"`
	PassTotal        int            `json:"pass_total"`
	QuestionCount    int            `json:"question_count"`
	Counts           map[string]int `json:"counts"`
	AttemptsCount    int            `json:"attempts_count"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	Questions        []PackageItem  `json:"questions,omitempty"`
}

type PackageItem struct {
	ID           string `json:"id"`
	Position     int    `json:"position"`
	Subtest      string `json:"subtest"`
	CategoryName string `json:"category_name"`
	Body         string `json:"body"`
	Difficulty   string `json:"difficulty"`
	Status       string `json:"status"`
}

// Package representasi paket untuk peserta.
type Package struct {
	ID               string         `json:"id"`
	Title            string         `json:"title"`
	Description      string         `json:"description"`
	DurationMinutes  int            `json:"duration_minutes"`
	StartAt          *time.Time     `json:"start_at"`
	EndAt            *time.Time     `json:"end_at"`
	QuestionCount    int            `json:"question_count"`
	Counts           map[string]int `json:"counts"`
	PassTWK          int            `json:"pass_twk"`
	PassTIU          int            `json:"pass_tiu"`
	PassTKP          int            `json:"pass_tkp"`
	PassTotal        int            `json:"pass_total"`
	ShuffleQuestions bool           `json:"shuffle_questions"`
	Availability     string         `json:"availability"`
	ActiveAttemptID  *string        `json:"active_attempt_id"`
	AttemptsCount    int            `json:"attempts_count"`
	LastResult       *LastResult    `json:"last_result"`
}

type LastResult struct {
	AttemptID  string `json:"attempt_id"`
	ScoreTotal int    `json:"score_total"`
	Passed     bool   `json:"passed"`
}

const packageSelect = `SELECT p.id, p.title, p.description, p.duration_minutes, p.start_at, p.end_at, p.shuffle_questions,
	p.shuffle_options, p.status, p.pass_twk, p.pass_tiu, p.pass_tkp, p.pass_total, p.created_at, p.updated_at,
	(SELECT count(*) FROM package_questions pq WHERE pq.package_id=p.id),
	(SELECT count(*) FROM package_questions pq JOIN questions q ON q.id=pq.question_id WHERE pq.package_id=p.id AND q.subtest='TWK'),
	(SELECT count(*) FROM package_questions pq JOIN questions q ON q.id=pq.question_id WHERE pq.package_id=p.id AND q.subtest='TIU'),
	(SELECT count(*) FROM package_questions pq JOIN questions q ON q.id=pq.question_id WHERE pq.package_id=p.id AND q.subtest='TKP'),
	(SELECT count(*) FROM attempts a WHERE a.package_id=p.id)
	FROM exam_packages p`

func scanPackage(row pgx.Row, p *AdminPackage) error {
	var twk, tiu, tkp int
	err := row.Scan(&p.ID, &p.Title, &p.Description, &p.DurationMinutes, &p.StartAt, &p.EndAt, &p.ShuffleQuestions,
		&p.ShuffleOptions, &p.Status, &p.PassTWK, &p.PassTIU, &p.PassTKP, &p.PassTotal, &p.CreatedAt, &p.UpdatedAt,
		&p.QuestionCount, &twk, &tiu, &tkp, &p.AttemptsCount)
	p.Counts = map[string]int{"TWK": twk, "TIU": tiu, "TKP": tkp}
	return err
}

func (s *Server) queryPackages(ctx context.Context, sql string, args ...any) ([]AdminPackage, error) {
	rows, err := s.DB.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AdminPackage{}
	for rows.Next() {
		var p AdminPackage
		if err := scanPackage(rows, &p); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func availability(p AdminPackage, now time.Time) string {
	if p.StartAt != nil && now.Before(*p.StartAt) {
		return "belum_dibuka"
	}
	if p.EndAt != nil && !now.Before(*p.EndAt) {
		return "ditutup"
	}
	return "tersedia"
}

// toPublicPackages melengkapi data paket dengan status milik peserta.
func (s *Server) toPublicPackages(ctx context.Context, userID string, list []AdminPackage) ([]Package, error) {
	out := make([]Package, 0, len(list))
	if len(list) == 0 {
		return out, nil
	}
	ids := make([]string, len(list))
	for i, p := range list {
		ids[i] = p.ID
	}
	type info struct {
		count  int
		active *string
		last   *LastResult
	}
	m := map[string]*info{}
	for _, id := range ids {
		m[id] = &info{}
	}
	rows, err := s.DB.Query(ctx, `SELECT package_id, count(*),
		(array_agg(id ORDER BY started_at DESC) FILTER (WHERE status='berlangsung' AND deadline_at > now()))[1]
		FROM attempts WHERE user_id=$1 AND package_id = ANY($2) GROUP BY package_id`, userID, ids)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var pid string
		var n int
		var act *string
		if err := rows.Scan(&pid, &n, &act); err != nil {
			rows.Close()
			return nil, err
		}
		m[pid].count, m[pid].active = n, act
	}
	rows.Close()
	rows, err = s.DB.Query(ctx, `SELECT DISTINCT ON (package_id) package_id, attempt_id, score_total, passed
		FROM results WHERE user_id=$1 AND package_id = ANY($2) AND hidden_at IS NULL ORDER BY package_id, created_at DESC`, userID, ids)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var pid string
		var lr LastResult
		if err := rows.Scan(&pid, &lr.AttemptID, &lr.ScoreTotal, &lr.Passed); err != nil {
			rows.Close()
			return nil, err
		}
		m[pid].last = &lr
	}
	rows.Close()
	now := time.Now()
	for _, p := range list {
		inf := m[p.ID]
		out = append(out, Package{
			ID: p.ID, Title: p.Title, Description: p.Description, DurationMinutes: p.DurationMinutes,
			StartAt: p.StartAt, EndAt: p.EndAt, QuestionCount: p.QuestionCount, Counts: p.Counts,
			PassTWK: p.PassTWK, PassTIU: p.PassTIU, PassTKP: p.PassTKP, PassTotal: p.PassTotal,
			ShuffleQuestions: p.ShuffleQuestions, Availability: availability(p, now),
			ActiveAttemptID: inf.active, AttemptsCount: inf.count, LastResult: inf.last,
		})
	}
	return out, nil
}

// ---------- Peserta ----------

func (s *Server) listAvailablePackages(c *gin.Context) {
	uid := auth.UserID(c)
	s.finalizeExpiredForUser(c, uid)
	list, err := s.queryPackages(c, packageSelect+` WHERE p.status='terbit'
		ORDER BY (p.end_at IS NOT NULL AND p.end_at <= now()), p.start_at NULLS FIRST, p.created_at DESC`)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	out, err := s.toPublicPackages(c, uid, list)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, out)
}

func (s *Server) getAvailablePackage(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Paket tidak ditemukan.")
	if !ok {
		return
	}
	uid := auth.UserID(c)
	s.finalizeExpiredForUser(c, uid)
	list, err := s.queryPackages(c, packageSelect+` WHERE p.id=$1 AND p.status='terbit'`, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if len(list) == 0 {
		httpx.NotFound(c, "Paket tidak ditemukan.")
		return
	}
	out, err := s.toPublicPackages(c, uid, list)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, out[0])
}

// ---------- Admin ----------

func (s *Server) adminListPackages(c *gin.Context) {
	page, perPage, offset := httpx.Paging(c)
	where := []string{"1=1"}
	args := []any{}
	if q := strings.TrimSpace(c.Query("q")); q != "" {
		args = append(args, "%"+q+"%")
		where = append(where, fmt.Sprintf("p.title ILIKE $%d", len(args)))
	}
	if st := c.Query("status"); st == "draft" || st == "terbit" || st == "arsip" {
		args = append(args, st)
		where = append(where, fmt.Sprintf("p.status = $%d", len(args)))
	}
	w := strings.Join(where, " AND ")
	var total int
	if err := s.DB.QueryRow(c, `SELECT count(*) FROM exam_packages p WHERE `+w, args...).Scan(&total); err != nil {
		httpx.Internal(c, err)
		return
	}
	args = append(args, perPage, offset)
	list, err := s.queryPackages(c, packageSelect+` WHERE `+w+fmt.Sprintf(` ORDER BY p.created_at DESC LIMIT $%d OFFSET $%d`, len(args)-1, len(args)), args...)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OKMeta(c, list, httpx.NewMeta(page, perPage, total))
}

func (s *Server) loadAdminPackage(ctx context.Context, id string) (*AdminPackage, error) {
	var p AdminPackage
	if err := scanPackage(s.DB.QueryRow(ctx, packageSelect+` WHERE p.id=$1`, id), &p); err != nil {
		return nil, err
	}
	rows, err := s.DB.Query(ctx, `SELECT q.id, pq.position, q.subtest, COALESCE(cat.name,''), q.body, q.difficulty, q.status
		FROM package_questions pq JOIN questions q ON q.id=pq.question_id LEFT JOIN categories cat ON cat.id=q.category_id
		WHERE pq.package_id=$1 ORDER BY pq.position`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	p.Questions = []PackageItem{}
	for rows.Next() {
		var it PackageItem
		if err := rows.Scan(&it.ID, &it.Position, &it.Subtest, &it.CategoryName, &it.Body, &it.Difficulty, &it.Status); err != nil {
			return nil, err
		}
		p.Questions = append(p.Questions, it)
	}
	return &p, rows.Err()
}

func (s *Server) adminGetPackage(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Paket tidak ditemukan.")
	if !ok {
		return
	}
	p, err := s.loadAdminPackage(c, id)
	if isNoRows(err) {
		httpx.NotFound(c, "Paket tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, p)
}

type packageInput struct {
	Title            string  `json:"title"`
	Description      string  `json:"description"`
	DurationMinutes  *int    `json:"duration_minutes"`
	StartAt          *string `json:"start_at"`
	EndAt            *string `json:"end_at"`
	ShuffleQuestions bool    `json:"shuffle_questions"`
	ShuffleOptions   bool    `json:"shuffle_options"`
	PassTWK          *int    `json:"pass_twk"`
	PassTIU          *int    `json:"pass_tiu"`
	PassTKP          *int    `json:"pass_tkp"`
	PassTotal        *int    `json:"pass_total"`
}

type packageValues struct {
	title, description                 string
	duration                           int
	startAt, endAt                     *time.Time
	shuffleQ, shuffleO                 bool
	passTWK, passTIU, passTKP, passTot int
}

func (in packageInput) validate(def packageValues) (packageValues, map[string]string) {
	f := v{}
	out := def
	out.title = strings.TrimSpace(in.Title)
	out.description = strings.TrimSpace(in.Description)
	out.shuffleQ, out.shuffleO = in.ShuffleQuestions, in.ShuffleOptions
	if len([]rune(out.title)) < 3 {
		f["title"] = "Judul paket minimal 3 karakter."
	} else if len([]rune(out.title)) > 160 {
		f["title"] = "Judul paket maksimal 160 karakter."
	}
	if in.DurationMinutes != nil {
		out.duration = *in.DurationMinutes
	}
	if out.duration < 1 || out.duration > 600 {
		f["duration_minutes"] = "Durasi harus 1–600 menit."
	}
	var ok bool
	if out.startAt, ok = parseTimePtr(in.StartAt); !ok {
		f["start_at"] = "Format waktu mulai tidak valid."
	}
	if out.endAt, ok = parseTimePtr(in.EndAt); !ok {
		f["end_at"] = "Format waktu selesai tidak valid."
	}
	if out.startAt != nil && out.endAt != nil && !out.endAt.After(*out.startAt) {
		f["end_at"] = "Waktu tutup harus setelah waktu buka."
	}
	setPass := func(field string, val *int, dst *int, max int) {
		if val != nil {
			*dst = *val
		}
		if *dst < 0 || *dst > max {
			f[field] = fmt.Sprintf("Nilai ambang batas harus 0–%d.", max)
		}
	}
	setPass("pass_twk", in.PassTWK, &out.passTWK, 150)
	setPass("pass_tiu", in.PassTIU, &out.passTIU, 175)
	setPass("pass_tkp", in.PassTKP, &out.passTKP, 225)
	setPass("pass_total", in.PassTotal, &out.passTot, 550)
	return out, f
}

func (s *Server) createPackage(c *gin.Context) {
	var in packageInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	st := s.loadSettings(c)
	def := packageValues{duration: st.DefaultDuration, passTWK: st.PassingGrade.TWK, passTIU: st.PassingGrade.TIU,
		passTKP: st.PassingGrade.TKP, passTot: st.PassingGrade.Total}
	pv, f := in.validate(def)
	if len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali isian paket.", f)
		return
	}
	var id string
	err := s.DB.QueryRow(c, `INSERT INTO exam_packages(title, description, duration_minutes, start_at, end_at, shuffle_questions,
		shuffle_options, pass_twk, pass_tiu, pass_tkp, pass_total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
		pv.title, pv.description, pv.duration, pv.startAt, pv.endAt, pv.shuffleQ, pv.shuffleO,
		pv.passTWK, pv.passTIU, pv.passTKP, pv.passTot).Scan(&id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "paket.tambah", pv.title)
	p, err := s.loadAdminPackage(c, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.Created(c, p)
}

func (s *Server) updatePackage(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Paket tidak ditemukan.")
	if !ok {
		return
	}
	var in packageInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	cur, err := s.loadAdminPackage(c, id)
	if isNoRows(err) {
		httpx.NotFound(c, "Paket tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	def := packageValues{duration: cur.DurationMinutes, passTWK: cur.PassTWK, passTIU: cur.PassTIU, passTKP: cur.PassTKP, passTot: cur.PassTotal}
	pv, f := in.validate(def)
	if len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali isian paket.", f)
		return
	}
	_, err = s.DB.Exec(c, `UPDATE exam_packages SET title=$1, description=$2, duration_minutes=$3, start_at=$4, end_at=$5,
		shuffle_questions=$6, shuffle_options=$7, pass_twk=$8, pass_tiu=$9, pass_tkp=$10, pass_total=$11, updated_at=now() WHERE id=$12`,
		pv.title, pv.description, pv.duration, pv.startAt, pv.endAt, pv.shuffleQ, pv.shuffleO,
		pv.passTWK, pv.passTIU, pv.passTKP, pv.passTot, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "paket.ubah", pv.title)
	p, err := s.loadAdminPackage(c, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, p)
}

func (s *Server) deletePackage(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Paket tidak ditemukan.")
	if !ok {
		return
	}
	var used bool
	if err := s.DB.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM attempts WHERE package_id=$1)`, id).Scan(&used); err != nil {
		httpx.Internal(c, err)
		return
	}
	if used {
		httpx.Conflict(c, "Paket sudah pernah dikerjakan peserta sehingga tidak bisa dihapus. Ubah statusnya menjadi arsip.")
		return
	}
	var title string
	err := s.DB.QueryRow(c, `DELETE FROM exam_packages WHERE id=$1 RETURNING title`, id).Scan(&title)
	if isNoRows(err) {
		httpx.NotFound(c, "Paket tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "paket.hapus", title)
	httpx.OK(c, gin.H{"message": "Paket dihapus."})
}

// replacePackageQuestions mengganti isi paket (urutan slice = posisi).
func replacePackageQuestions(ctx context.Context, tx pgx.Tx, packageID string, ids []string) error {
	if _, err := tx.Exec(ctx, `DELETE FROM package_questions WHERE package_id=$1`, packageID); err != nil {
		return err
	}
	if len(ids) == 0 {
		return nil
	}
	pos := make([]int32, len(ids))
	for i := range ids {
		pos[i] = int32(i + 1)
	}
	_, err := tx.Exec(ctx, `INSERT INTO package_questions(package_id, question_id, position)
		SELECT $1, unnest($2::uuid[]), unnest($3::int[])`, packageID, ids, pos)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `UPDATE exam_packages SET updated_at=now() WHERE id=$1`, packageID)
	return err
}

func (s *Server) packageExists(ctx context.Context, id string) (bool, error) {
	var ok bool
	err := s.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM exam_packages WHERE id=$1)`, id).Scan(&ok)
	return ok, err
}

func (s *Server) setPackageQuestions(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Paket tidak ditemukan.")
	if !ok {
		return
	}
	var in struct {
		QuestionIDs []string `json:"question_ids"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if exists, err := s.packageExists(c, id); err != nil {
		httpx.Internal(c, err)
		return
	} else if !exists {
		httpx.NotFound(c, "Paket tidak ditemukan.")
		return
	}
	seen := map[string]bool{}
	ids := []string{}
	for _, q := range in.QuestionIDs {
		if _, err := uuid.Parse(q); err != nil {
			httpx.FailFields(c, "Daftar soal tidak valid.", map[string]string{"question_ids": "Terdapat ID soal yang tidak valid."})
			return
		}
		if seen[q] {
			httpx.FailFields(c, "Daftar soal tidak valid.", map[string]string{"question_ids": "Terdapat soal yang dipilih lebih dari sekali."})
			return
		}
		seen[q] = true
		ids = append(ids, q)
	}
	var found int
	if err := s.DB.QueryRow(c, `SELECT count(*) FROM questions WHERE id = ANY($1)`, ids).Scan(&found); err != nil {
		httpx.Internal(c, err)
		return
	}
	if found != len(ids) {
		httpx.FailFields(c, "Daftar soal tidak valid.", map[string]string{"question_ids": "Sebagian soal tidak ditemukan di bank soal."})
		return
	}
	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)
	if err := replacePackageQuestions(c, tx, id, ids); err != nil {
		httpx.Internal(c, err)
		return
	}
	if err := tx.Commit(c); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "paket.soal", fmt.Sprintf("%s: %d soal", id, len(ids)))
	p, err := s.loadAdminPackage(c, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, p)
}

func (s *Server) autoFillPackage(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Paket tidak ditemukan.")
	if !ok {
		return
	}
	st := s.loadSettings(c)
	in := struct {
		TWK *int `json:"twk"`
		TIU *int `json:"tiu"`
		TKP *int `json:"tkp"`
	}{}
	if c.Request.ContentLength != 0 {
		if err := c.ShouldBindJSON(&in); err != nil {
			httpx.BadRequest(c, "Format data tidak valid.")
			return
		}
	}
	want := map[string]int{"TWK": st.Composition.TWK, "TIU": st.Composition.TIU, "TKP": st.Composition.TKP}
	if in.TWK != nil {
		want["TWK"] = *in.TWK
	}
	if in.TIU != nil {
		want["TIU"] = *in.TIU
	}
	if in.TKP != nil {
		want["TKP"] = *in.TKP
	}
	if exists, err := s.packageExists(c, id); err != nil {
		httpx.Internal(c, err)
		return
	} else if !exists {
		httpx.NotFound(c, "Paket tidak ditemukan.")
		return
	}
	f := v{}
	total := 0
	for _, sub := range []string{"TWK", "TIU", "TKP"} {
		n := want[sub]
		key := strings.ToLower(sub)
		if n < 0 || n > 500 {
			f[key] = "Jumlah soal harus 0–500."
			continue
		}
		total += n
		var avail int
		if err := s.DB.QueryRow(c, `SELECT count(*) FROM questions WHERE subtest=$1 AND status='terbit'`, sub).Scan(&avail); err != nil {
			httpx.Internal(c, err)
			return
		}
		if avail < n {
			f[key] = fmt.Sprintf("Soal %s terbit hanya tersedia %d.", sub, avail)
		}
	}
	if total == 0 && len(f) == 0 {
		f["twk"] = "Isi minimal satu subtes dengan jumlah lebih dari 0."
	}
	if len(f) > 0 {
		httpx.FailFields(c, "Komposisi soal tidak dapat dipenuhi.", f)
		return
	}
	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)
	ids := []string{}
	for _, sub := range []string{"TWK", "TIU", "TKP"} {
		if want[sub] == 0 {
			continue
		}
		rows, err := tx.Query(c, `SELECT id FROM questions WHERE subtest=$1 AND status='terbit' ORDER BY random() LIMIT $2`, sub, want[sub])
		if err != nil {
			httpx.Internal(c, err)
			return
		}
		for rows.Next() {
			var q string
			if err := rows.Scan(&q); err != nil {
				rows.Close()
				httpx.Internal(c, err)
				return
			}
			ids = append(ids, q)
		}
		rows.Close()
	}
	if err := replacePackageQuestions(c, tx, id, ids); err != nil {
		httpx.Internal(c, err)
		return
	}
	if err := tx.Commit(c); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "paket.auto_fill", fmt.Sprintf("%s: %d soal", id, len(ids)))
	p, err := s.loadAdminPackage(c, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, p)
}

func (s *Server) setPackageStatus(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Paket tidak ditemukan.")
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
	if in.Status != "draft" && in.Status != "terbit" && in.Status != "arsip" {
		httpx.FailFields(c, "Status tidak valid.", map[string]string{"status": "Pilih status draft, terbit, atau arsip."})
		return
	}
	var n int
	err := s.DB.QueryRow(c, `SELECT (SELECT count(*) FROM package_questions WHERE package_id=p.id) FROM exam_packages p WHERE p.id=$1`, id).Scan(&n)
	if isNoRows(err) {
		httpx.NotFound(c, "Paket tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if in.Status == "terbit" && n == 0 {
		httpx.FailFields(c, "Paket belum memiliki soal.", map[string]string{"status": "Tambahkan minimal satu soal sebelum menerbitkan paket."})
		return
	}
	if _, err := s.DB.Exec(c, `UPDATE exam_packages SET status=$1, updated_at=now() WHERE id=$2`, in.Status, id); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "paket.status", id+" → "+in.Status)
	p, err := s.loadAdminPackage(c, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, p)
}
