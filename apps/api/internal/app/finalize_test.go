package app

import (
	"context"
	"os"
	"sync"
	"testing"
	"time"

	"bisapns/api/internal/config"
	"bisapns/api/internal/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// testServer terhubung ke DATABASE_URL (default lokal). Tes dilewati bila database tidak tersedia.
func testServer(t *testing.T) *Server {
	t.Helper()
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		url = "postgres://bisapns:bisapns@localhost:5432/bisapns?sslmode=disable"
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, url)
	if err == nil {
		err = pool.Ping(ctx)
	}
	if err != nil {
		t.Skipf("database tidak tersedia: %v", err)
	}
	if err := db.Migrate(context.Background(), pool); err != nil {
		t.Fatalf("migrasi: %v", err)
	}
	t.Cleanup(pool.Close)
	return New(pool, config.Load())
}

func TestFinalizeAttemptIdempotent(t *testing.T) {
	s := testServer(t)
	ctx := context.Background()
	tag := uuid.NewString()[:8]

	var uid, pid string
	must := func(err error) {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
	}
	must(s.DB.QueryRow(ctx, `INSERT INTO users(name,email,password_hash) VALUES ('Uji Finalisasi',$1,'x') RETURNING id`, "uji-"+tag+"@test.local").Scan(&uid))
	must(s.DB.QueryRow(ctx, `INSERT INTO exam_packages(title,status,pass_twk,pass_tiu,pass_tkp,pass_total) VALUES ($1,'terbit',5,0,3,0) RETURNING id`, "Uji "+tag).Scan(&pid))
	var qTWK, qTKP string
	must(s.DB.QueryRow(ctx, `INSERT INTO questions(subtest,body,status) VALUES ('TWK','Soal uji TWK','terbit') RETURNING id`).Scan(&qTWK))
	must(s.DB.QueryRow(ctx, `INSERT INTO questions(subtest,body,status) VALUES ('TKP','Soal uji TKP','terbit') RETURNING id`).Scan(&qTKP))
	t.Cleanup(func() {
		s.DB.Exec(ctx, `DELETE FROM users WHERE id=$1`, uid)
		s.DB.Exec(ctx, `DELETE FROM exam_packages WHERE id=$1`, pid)
		s.DB.Exec(ctx, `DELETE FROM questions WHERE id = ANY($1)`, []string{qTWK, qTKP})
	})
	opt := map[string]string{}
	for i, l := range labels {
		var id string
		w := 0
		if l == "C" {
			w = 5
		}
		must(s.DB.QueryRow(ctx, `INSERT INTO question_options(question_id,label,body,weight) VALUES ($1,$2,$4,$3) RETURNING id`, qTWK, l, w, l).Scan(&id))
		opt["TWK"+l] = id
		must(s.DB.QueryRow(ctx, `INSERT INTO question_options(question_id,label,body,weight) VALUES ($1,$2,$4,$3) RETURNING id`, qTKP, l, i+1, l).Scan(&id))
		opt["TKP"+l] = id
	}
	var aid string
	must(s.DB.QueryRow(ctx, `INSERT INTO attempts(user_id,package_id,started_at,deadline_at) VALUES ($1,$2,now()-interval '10 minutes',now()+interval '50 minutes') RETURNING id`, uid, pid).Scan(&aid))
	_, err := s.DB.Exec(ctx, `INSERT INTO attempt_questions(attempt_id,question_id,position) VALUES ($1,$2,1),($1,$3,2)`, aid, qTWK, qTKP)
	must(err)
	_, err = s.DB.Exec(ctx, `INSERT INTO attempt_answers(attempt_id,question_id,option_id) VALUES ($1,$2,$3),($1,$4,$5)`,
		aid, qTWK, opt["TWKC"], qTKP, opt["TKPD"])
	must(err)

	// panggilan paralel (double submit + auto-submitter)
	var wg sync.WaitGroup
	errs := make(chan error, 4)
	for i := 0; i < 4; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			errs <- s.finalizeAttempt(ctx, aid)
		}()
	}
	wg.Wait()
	close(errs)
	for e := range errs {
		must(e)
	}
	must(s.finalizeAttempt(ctx, aid)) // panggilan ulang setelah selesai

	var n, twk, tkp, total int
	var passed bool
	must(s.DB.QueryRow(ctx, `SELECT count(*) OVER (), score_twk, score_tkp, score_total, passed FROM results WHERE attempt_id=$1`, aid).
		Scan(&n, &twk, &tkp, &total, &passed))
	if n != 1 || twk != 5 || tkp != 4 || total != 9 || !passed {
		t.Fatalf("hasil tidak sesuai: n=%d twk=%d tkp=%d total=%d passed=%v", n, twk, tkp, total, passed)
	}
	var status string
	var submittedOK bool
	must(s.DB.QueryRow(ctx, `SELECT status, submitted_at <= deadline_at FROM attempts WHERE id=$1`, aid).Scan(&status, &submittedOK))
	if status != "selesai" || !submittedOK {
		t.Fatalf("status attempt %s, submitted<=deadline %v", status, submittedOK)
	}
	var logs int
	must(s.DB.QueryRow(ctx, `SELECT count(*) FROM activity_logs WHERE user_id=$1 AND action='ujian.selesai'`, uid).Scan(&logs))
	if logs != 1 {
		t.Fatalf("log aktivitas finalisasi tercatat %d kali, seharusnya 1", logs)
	}
}

func TestOrderOptionsRelabels(t *testing.T) {
	by := map[string]PublicOption{}
	for _, l := range labels {
		by[l] = PublicOption{ID: "id" + l, Label: l}
	}
	got := orderOptions("CAEBD", by, func(o PublicOption, l string) PublicOption { o.Label = l; return o })
	want := []string{"idC", "idA", "idE", "idB", "idD"}
	for i, o := range got {
		if o.ID != want[i] || o.Label != labels[i] {
			t.Fatalf("posisi %d: dapat %s/%s, harap %s/%s", i, o.ID, o.Label, want[i], labels[i])
		}
	}
}

func TestTempPasswordRules(t *testing.T) {
	for i := 0; i < 200; i++ {
		f := v{}
		pw := tempPassword()
		validatePassword(f, "p", pw)
		if len(f) > 0 {
			t.Fatalf("password sementara %q tidak memenuhi aturan: %v", pw, f)
		}
	}
}
