// Package seed mengisi database dengan data contoh BISA-PNS. Aman dijalankan berulang (idempoten).
package seed

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand/v2"
	"time"

	"bisapns/api/internal/app"
	"bisapns/api/internal/auth"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var subCategories = map[string][]string{
	"TWK": {"Nasionalisme", "Integritas", "Bela Negara", "Pilar Negara", "Bahasa Indonesia"},
	"TIU": {"Verbal – Analogi", "Verbal – Silogisme", "Numerik – Deret Angka", "Numerik – Aritmatika", "Figural/Logika"},
	"TKP": {"Pelayanan Publik", "Jejaring Kerja", "Sosial Budaya", "TIK", "Profesionalisme", "Anti Radikalisme"},
}

var parentNames = map[string]string{
	"TWK": "Tes Wawasan Kebangsaan",
	"TIU": "Tes Intelegensia Umum",
	"TKP": "Tes Karakteristik Pribadi",
}

type account struct {
	Name, Email, Phone, Password, Role string
}

var accounts = []account{
	{"Admin BISA-PNS", "admin@bisapns.id", "081200000001", "Admin123!", "admin"},
	{"Rina Kartika", "peserta1@bisapns.id", "081200000011", "Peserta123!", "peserta"},
	{"Bayu Pratama", "peserta2@bisapns.id", "081200000012", "Peserta123!", "peserta"},
	{"Siti Rahmawati", "peserta3@bisapns.id", "081200000013", "Peserta123!", "peserta"},
}

const (
	pkgNasional = "Tryout SKD Nasional #1"
	pkgMini     = "Tryout SKD Mini – TWK & TIU"
	pkgDraft    = "Tryout SKD #2"
	pkgAkbar    = "Tryout Akbar SKD CPNS 2027"
)

type seeder struct {
	db    *pgxpool.Pool
	rng   *rand.Rand
	cats  map[string]int // "TWK|Nasionalisme" → id
	users map[string]string
}

// seedDoneKey menandai bahwa konten contoh (soal, paket, riwayat, dll.) pernah diisi. Setelah itu seed hanya
// memastikan kategori, akun, dan pengaturan — data yang sengaja dihapus admin tidak dibuat ulang saat API restart.
const seedDoneKey = "seed_done"

// Run menjalankan seluruh langkah seed. Setiap langkah memeriksa data yang sudah ada.
func Run(ctx context.Context, db *pgxpool.Pool) error {
	s := &seeder{db: db, rng: rand.New(rand.NewPCG(20271012, 7)), cats: map[string]int{}, users: map[string]string{}}
	base := []struct {
		name string
		fn   func(context.Context) error
	}{
		{"kategori", s.categories},
		{"akun", s.accounts},
		{"pengaturan", s.settings},
	}
	for _, st := range base {
		if err := st.fn(ctx); err != nil {
			return fmt.Errorf("seed %s: %w", st.name, err)
		}
	}
	var done bool
	if err := db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM settings WHERE key=$1)`, seedDoneKey).Scan(&done); err != nil {
		return fmt.Errorf("seed cek status: %w", err)
	}
	if done {
		return nil
	}
	steps := []struct {
		name string
		fn   func(context.Context) error
	}{
		{"soal", s.questions},
		{"paket", s.packages},
		{"riwayat ujian", s.history},
		{"waktu belajar", s.studyLogs},
		{"target harian", s.targets},
		{"latihan", s.practice},
		{"pengumuman", s.announcements},
	}
	for _, st := range steps {
		if err := st.fn(ctx); err != nil {
			return fmt.Errorf("seed %s: %w", st.name, err)
		}
	}
	_, err := db.Exec(ctx, `INSERT INTO settings(key, value) VALUES ($1, to_jsonb(now())) ON CONFLICT (key) DO NOTHING`, seedDoneKey)
	return err
}

func (s *seeder) categories(ctx context.Context) error {
	for _, code := range []string{"TWK", "TIU", "TKP"} {
		var pid int
		err := s.db.QueryRow(ctx, `SELECT id FROM categories WHERE code=$1 AND parent_id IS NULL`, code).Scan(&pid)
		if err == pgx.ErrNoRows {
			err = s.db.QueryRow(ctx, `INSERT INTO categories(code, name) VALUES ($1,$2) RETURNING id`, code, parentNames[code]).Scan(&pid)
		}
		if err != nil {
			return err
		}
		for _, name := range subCategories[code] {
			var id int
			err := s.db.QueryRow(ctx, `SELECT id FROM categories WHERE code=$1 AND parent_id=$2 AND name=$3`, code, pid, name).Scan(&id)
			if err == pgx.ErrNoRows {
				err = s.db.QueryRow(ctx, `INSERT INTO categories(parent_id, code, name) VALUES ($1,$2,$3) RETURNING id`, pid, code, name).Scan(&id)
			}
			if err != nil {
				return err
			}
			s.cats[code+"|"+name] = id
		}
	}
	return nil
}

func (s *seeder) accounts(ctx context.Context) error {
	for _, a := range accounts {
		var id string
		err := s.db.QueryRow(ctx, `SELECT id FROM users WHERE email=$1`, a.Email).Scan(&id)
		if err == pgx.ErrNoRows {
			hash, herr := auth.HashPassword(a.Password)
			if herr != nil {
				return herr
			}
			created := time.Now().AddDate(0, 0, -20+len(s.users)*3)
			err = s.db.QueryRow(ctx, `INSERT INTO users(name, email, phone, password_hash, role, created_at, last_seen_at)
				VALUES ($1,$2,$3,$4,$5,$6, now() - interval '2 hours') RETURNING id`, a.Name, a.Email, a.Phone, hash, a.Role, created).Scan(&id)
			if err == nil {
				log.Printf("seed: akun %s dibuat", a.Email)
			}
		}
		if err != nil {
			return err
		}
		s.users[a.Email] = id
	}
	return nil
}

func (s *seeder) settings(ctx context.Context) error {
	raw, _ := json.Marshal(app.DefaultSettings())
	_, err := s.db.Exec(ctx, `INSERT INTO settings(key, value) VALUES ('app', $1) ON CONFLICT (key) DO NOTHING`, raw)
	return err
}

func (s *seeder) insertQuestion(ctx context.Context, tx pgx.Tx, q sq, status string) error {
	cid, ok := s.cats[q.Sub+"|"+q.Cat]
	if !ok {
		return fmt.Errorf("kategori %s|%s tidak dikenal", q.Sub, q.Cat)
	}
	var id string
	if err := tx.QueryRow(ctx, `INSERT INTO questions(subtest, category_id, body, difficulty, explanation, status, created_by)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, q.Sub, cid, q.Body, q.Diff, q.Exp, status, s.users["admin@bisapns.id"]).Scan(&id); err != nil {
		return err
	}
	for i, body := range q.Opts {
		w := 0
		if q.Sub == "TKP" {
			w = q.W[i]
			if w < 1 || w > 5 {
				return fmt.Errorf("bobot TKP tidak valid pada soal %q", q.Body)
			}
		} else if i == q.Key {
			w = 5
		}
		if _, err := tx.Exec(ctx, `INSERT INTO question_options(question_id, label, body, weight) VALUES ($1,$2,$3,$4)`,
			id, string(rune('A'+i)), body, w); err != nil {
			return err
		}
	}
	return nil
}

func (s *seeder) questions(ctx context.Context) error {
	var n int
	if err := s.db.QueryRow(ctx, `SELECT count(*) FROM questions`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	tiu := append(append([]sq{}, tiuManual...), generateTIU()...)
	if len(twkBank) != 30 || len(tiu) != 35 || len(tkpBank) != 45 {
		return fmt.Errorf("jumlah bank soal tidak sesuai (TWK %d, TIU %d, TKP %d)", len(twkBank), len(tiu), len(tkpBank))
	}
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	// sedikit jeda waktu agar urutan "terbaru" di bank soal tetap stabil
	for _, list := range [][]sq{twkBank, tiu, tkpBank} {
		for _, q := range list {
			if err := s.insertQuestion(ctx, tx, q, "terbit"); err != nil {
				return err
			}
		}
	}
	for _, q := range draftBank {
		if err := s.insertQuestion(ctx, tx, q, "draft"); err != nil {
			return err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	log.Printf("seed: %d soal terbit + %d draft dibuat", 110, len(draftBank))
	return nil
}

func (s *seeder) publishedIDs(ctx context.Context, sub string, limit int) ([]string, error) {
	rows, err := s.db.Query(ctx, `SELECT q.id FROM questions q JOIN categories c ON c.id=q.category_id
		WHERE q.subtest=$1 AND q.status='terbit' ORDER BY c.id, q.created_at, q.id LIMIT $2`, sub, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

type pkgDef struct {
	title, desc        string
	duration           int
	status             string
	startAt, endAt     *time.Time
	shuffleQ, shuffleO bool
	pass               [4]int
	twk, tiu, tkp      int
	createdDaysAgo     int
}

func (s *seeder) packages(ctx context.Context) error {
	tomorrow := time.Now().In(app.Jakarta).AddDate(0, 0, 1)
	start := time.Date(tomorrow.Year(), tomorrow.Month(), tomorrow.Day(), 8, 0, 0, 0, app.Jakarta)
	end := start.Add(12 * time.Hour)
	defs := []pkgDef{
		{pkgNasional, "Simulasi SKD lengkap sesuai komposisi resmi: 30 TWK, 35 TIU, dan 45 TKP dalam 100 menit. Cocok untuk mengukur kesiapan Anda secara menyeluruh.",
			100, "terbit", nil, nil, false, true, [4]int{65, 80, 166, 0}, 30, 35, 45, 14},
		{pkgMini, "Latihan singkat 20 soal (10 TWK & 10 TIU) dalam 30 menit untuk pemanasan harian.",
			30, "terbit", nil, nil, true, true, [4]int{40, 45, 0, 0}, 10, 10, 0, 10},
		{pkgDraft, "Paket tryout kedua yang sedang disusun.", 100, "draft", nil, nil, false, false, [4]int{65, 80, 166, 0}, 0, 0, 0, 2},
		{pkgAkbar, "Tryout serentak dengan jadwal terbatas. Pastikan koneksi stabil dan mulai sebelum jadwal ditutup.",
			100, "terbit", &start, &end, true, true, [4]int{65, 80, 166, 0}, 30, 35, 45, 1},
	}
	for _, d := range defs {
		var exists bool
		if err := s.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM exam_packages WHERE title=$1)`, d.title).Scan(&exists); err != nil {
			return err
		}
		if exists {
			continue
		}
		var ids []string
		for _, part := range []struct {
			sub string
			n   int
		}{{"TWK", d.twk}, {"TIU", d.tiu}, {"TKP", d.tkp}} {
			if part.n == 0 {
				continue
			}
			got, err := s.publishedIDs(ctx, part.sub, part.n)
			if err != nil {
				return err
			}
			ids = append(ids, got...)
		}
		created := time.Now().AddDate(0, 0, -d.createdDaysAgo)
		var pid string
		if err := s.db.QueryRow(ctx, `INSERT INTO exam_packages(title, description, duration_minutes, start_at, end_at, shuffle_questions,
			shuffle_options, status, pass_twk, pass_tiu, pass_tkp, pass_total, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13) RETURNING id`,
			d.title, d.desc, d.duration, d.startAt, d.endAt, d.shuffleQ, d.shuffleO, d.status,
			d.pass[0], d.pass[1], d.pass[2], d.pass[3], created).Scan(&pid); err != nil {
			return err
		}
		for i, q := range ids {
			if _, err := s.db.Exec(ctx, `INSERT INTO package_questions(package_id, question_id, position) VALUES ($1,$2,$3)`, pid, q, i+1); err != nil {
				return err
			}
		}
		log.Printf("seed: paket %q (%d soal) dibuat", d.title, len(ids))
	}
	return nil
}

// ---- Riwayat ujian ----

type histDef struct {
	email    string
	pkg      string
	daysAgo  int
	accuracy float64 // peluang menjawab benar TWK/TIU & memilih opsi terbaik TKP
	empty    float64 // peluang tidak menjawab
	minutes  int
	tabs     int
}

var histories = []histDef{
	{"peserta1@bisapns.id", pkgNasional, 9, 0.62, 0.03, 88, 0},
	{"peserta1@bisapns.id", pkgMini, 6, 0.80, 0.00, 22, 1},
	{"peserta1@bisapns.id", pkgNasional, 3, 0.80, 0.01, 95, 0},
	{"peserta2@bisapns.id", pkgNasional, 7, 0.55, 0.08, 100, 3},
	{"peserta2@bisapns.id", pkgMini, 2, 0.65, 0.05, 27, 0},
	{"peserta3@bisapns.id", pkgNasional, 5, 0.38, 0.15, 74, 5},
	{"peserta3@bisapns.id", pkgMini, 1, 0.45, 0.10, 30, 2},
}

type qOpt struct {
	id     string
	weight int
}

func (s *seeder) history(ctx context.Context) error {
	var n int
	if err := s.db.QueryRow(ctx, `SELECT count(*) FROM attempts`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	for _, h := range histories {
		if err := s.oneAttempt(ctx, h); err != nil {
			return err
		}
	}
	log.Printf("seed: %d riwayat ujian dibuat", len(histories))
	return nil
}

func (s *seeder) oneAttempt(ctx context.Context, h histDef) error {
	var pid string
	var duration int
	var pg app.PassingGrade
	if err := s.db.QueryRow(ctx, `SELECT id, duration_minutes, pass_twk, pass_tiu, pass_tkp, pass_total FROM exam_packages WHERE title=$1`, h.pkg).
		Scan(&pid, &duration, &pg.TWK, &pg.TIU, &pg.TKP, &pg.Total); err != nil {
		return err
	}
	rows, err := s.db.Query(ctx, `SELECT pq.question_id, q.subtest, o.id, o.weight
		FROM package_questions pq JOIN questions q ON q.id=pq.question_id JOIN question_options o ON o.question_id=q.id
		WHERE pq.package_id=$1 ORDER BY pq.position, o.label`, pid)
	if err != nil {
		return err
	}
	type qq struct {
		id, sub string
		opts    []qOpt
	}
	var qs []*qq
	idx := map[string]*qq{}
	for rows.Next() {
		var qid, sub, oid string
		var w int
		if err := rows.Scan(&qid, &sub, &oid, &w); err != nil {
			rows.Close()
			return err
		}
		q, ok := idx[qid]
		if !ok {
			q = &qq{id: qid, sub: sub}
			idx[qid] = q
			qs = append(qs, q)
		}
		q.opts = append(q.opts, qOpt{oid, w})
	}
	rows.Close()

	day := time.Now().In(app.Jakarta).AddDate(0, 0, -h.daysAgo)
	started := time.Date(day.Year(), day.Month(), day.Day(), 8+s.rng.IntN(10), s.rng.IntN(60), 0, 0, app.Jakarta)
	deadline := started.Add(time.Duration(duration) * time.Minute)
	used := h.minutes
	if used > duration {
		used = duration
	}
	submitted := started.Add(time.Duration(used)*time.Minute - time.Duration(s.rng.IntN(50))*time.Second)

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var aid string
	if err := tx.QueryRow(ctx, `INSERT INTO attempts(user_id, package_id, started_at, deadline_at, submitted_at, status, tab_switches)
		VALUES ($1,$2,$3,$4,$5,'selesai',$6) RETURNING id`, s.users[h.email], pid, started, deadline, submitted, h.tabs).Scan(&aid); err != nil {
		return err
	}
	items := make([]app.ScoreItem, 0, len(qs))
	for i, q := range qs {
		if _, err := tx.Exec(ctx, `INSERT INTO attempt_questions(attempt_id, question_id, position, option_order) VALUES ($1,$2,$3,'ABCDE')`,
			aid, q.id, i+1); err != nil {
			return err
		}
		maxW := 0
		for _, o := range q.opts {
			if o.weight > maxW {
				maxW = o.weight
			}
		}
		it := app.ScoreItem{Subtest: q.sub, MaxWeight: maxW}
		if s.rng.Float64() >= h.empty {
			chosen := s.pick(q.sub, q.opts, maxW, h.accuracy)
			w := chosen.weight
			it.ChosenWeight = &w
			answeredAt := started.Add(time.Duration(float64(submitted.Sub(started)) * float64(i+1) / float64(len(qs)+1)))
			if _, err := tx.Exec(ctx, `INSERT INTO attempt_answers(attempt_id, question_id, option_id, is_flagged, answered_at) VALUES ($1,$2,$3,$4,$5)`,
				aid, q.id, chosen.id, s.rng.Float64() < 0.04, answeredAt); err != nil {
				return err
			}
		}
		items = append(items, it)
	}
	for i := 0; i < h.tabs; i++ {
		if _, err := tx.Exec(ctx, `INSERT INTO attempt_events(attempt_id, type, created_at) VALUES ($1,'tab_hidden',$2)`,
			aid, started.Add(time.Duration(5+i*7)*time.Minute)); err != nil {
			return err
		}
	}
	r := app.Score(items, pg)
	if _, err := tx.Exec(ctx, `INSERT INTO results(attempt_id, user_id, package_id, score_twk, score_tiu, score_tkp, score_total,
		correct_count, wrong_count, empty_count, passed, duration_seconds, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
		aid, s.users[h.email], pid, r.TWK, r.TIU, r.TKP, r.Total, r.Correct, r.Wrong, r.Empty, r.Passed,
		int(submitted.Sub(started).Seconds()), submitted); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `INSERT INTO activity_logs(user_id, action, detail, created_at) VALUES ($1,'ujian.selesai',$2,$3)`,
		s.users[h.email], fmt.Sprintf("%s · skor %d", h.pkg, r.Total), submitted); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// pick memilih opsi jawaban simulasi sesuai tingkat akurasi peserta.
func (s *seeder) pick(sub string, opts []qOpt, maxW int, acc float64) qOpt {
	best := opts[0]
	for _, o := range opts {
		if o.weight == maxW {
			best = o
		}
	}
	if s.rng.Float64() < acc {
		return best
	}
	if sub == "TKP" {
		// peserta yang tidak memilih opsi terbaik biasanya tetap memilih opsi cukup baik
		var good []qOpt
		for _, o := range opts {
			if o.weight >= 3 && o.weight < maxW {
				good = append(good, o)
			}
		}
		if len(good) > 0 && s.rng.Float64() < 0.7 {
			return good[s.rng.IntN(len(good))]
		}
	}
	var others []qOpt
	for _, o := range opts {
		if o.id != best.id {
			others = append(others, o)
		}
	}
	return others[s.rng.IntN(len(others))]
}

func (s *seeder) studyLogs(ctx context.Context) error {
	minutes := map[string][]int{
		"peserta1@bisapns.id": {45, 60, 30, 75, 50, 40, 25},
		"peserta2@bisapns.id": {20, 0, 35, 15, 40, 30, 10},
		"peserta3@bisapns.id": {10, 15, 0, 25, 5, 20, 15},
	}
	today := time.Now().In(app.Jakarta)
	for email, mins := range minutes {
		for i, m := range mins {
			if m == 0 {
				continue
			}
			day := today.AddDate(0, 0, -(len(mins) - 1 - i)).Format("2006-01-02")
			if _, err := s.db.Exec(ctx, `INSERT INTO study_logs(user_id, day, seconds) VALUES ($1,$2,$3) ON CONFLICT (user_id, day) DO NOTHING`,
				s.users[email], day, m*60); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *seeder) targets(ctx context.Context) error {
	today := time.Now().In(app.Jakarta).Format("2006-01-02")
	list := []struct {
		title, sub, due, prio string
		done                  bool
	}{
		{"Latihan 20 soal TIU deret angka", "TIU", "08:00", "tinggi", true},
		{"Baca ringkasan pasal-pasal UUD 1945", "TWK", "10:00", "sedang", false},
		{"Kerjakan 15 soal TKP pelayanan publik", "TKP", "14:00", "sedang", false},
		{"Review pembahasan tryout terakhir", "SKD", "19:30", "rendah", false},
	}
	for _, email := range []string{"peserta1@bisapns.id", "peserta2@bisapns.id", "peserta3@bisapns.id"} {
		var n int
		if err := s.db.QueryRow(ctx, `SELECT count(*) FROM daily_targets WHERE user_id=$1 AND day=$2`, s.users[email], today).Scan(&n); err != nil {
			return err
		}
		if n > 0 {
			continue
		}
		for _, t := range list {
			if _, err := s.db.Exec(ctx, `INSERT INTO daily_targets(user_id, title, subtest, due_time, priority, day, done) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
				s.users[email], t.title, t.sub, t.due, t.prio, today, t.done); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *seeder) practice(ctx context.Context) error {
	var n int
	if err := s.db.QueryRow(ctx, `SELECT count(*) FROM practice_answers`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	plan := map[string][2]float64{"peserta1@bisapns.id": {40, 0.72}, "peserta2@bisapns.id": {25, 0.6}, "peserta3@bisapns.id": {12, 0.45}}
	for email, p := range plan {
		rows, err := s.db.Query(ctx, `SELECT q.id, q.subtest, o.id, o.weight FROM questions q JOIN question_options o ON o.question_id=q.id
			WHERE q.status='terbit' ORDER BY q.id, o.label`)
		if err != nil {
			return err
		}
		type qq struct {
			id, sub string
			opts    []qOpt
		}
		var qs []*qq
		idx := map[string]*qq{}
		for rows.Next() {
			var qid, sub, oid string
			var w int
			if err := rows.Scan(&qid, &sub, &oid, &w); err != nil {
				rows.Close()
				return err
			}
			if idx[qid] == nil {
				idx[qid] = &qq{id: qid, sub: sub}
				qs = append(qs, idx[qid])
			}
			idx[qid].opts = append(idx[qid].opts, qOpt{oid, w})
		}
		rows.Close()
		s.rng.Shuffle(len(qs), func(i, j int) { qs[i], qs[j] = qs[j], qs[i] })
		for i := 0; i < int(p[0]) && i < len(qs); i++ {
			q := qs[i]
			maxW := 0
			for _, o := range q.opts {
				if o.weight > maxW {
					maxW = o.weight
				}
			}
			c := s.pick(q.sub, q.opts, maxW, p[1])
			at := time.Now().Add(-time.Duration(s.rng.IntN(6*24)) * time.Hour)
			if _, err := s.db.Exec(ctx, `INSERT INTO practice_answers(user_id, question_id, option_id, score, is_correct, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
				s.users[email], q.id, c.id, c.weight, c.weight == maxW, at); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *seeder) announcements(ctx context.Context) error {
	var n int
	if err := s.db.QueryRow(ctx, `SELECT count(*) FROM announcements`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	admin := s.users["admin@bisapns.id"]
	items := []struct {
		title, body string
		ago         time.Duration
	}{
		{"Selamat datang di BISA-PNS", "Gunakan menu Latihan untuk belajar per materi dan menu Tryout untuk simulasi CBT. Waktu belajar Anda tercatat otomatis di dashboard.", 72 * time.Hour},
		{"Tryout Akbar SKD dibuka besok", "Tryout Akbar SKD CPNS 2027 dibuka besok pukul 08.00–20.00 WIB. Siapkan perangkat dan koneksi yang stabil; ujian berdurasi 100 menit sejak Anda menekan tombol mulai.", 3 * time.Hour},
	}
	for _, it := range items {
		if _, err := s.db.Exec(ctx, `INSERT INTO announcements(title, body, published, created_by, created_at) VALUES ($1,$2,true,$3,$4)`,
			it.title, it.body, admin, time.Now().Add(-it.ago)); err != nil {
			return err
		}
	}
	return nil
}
