package app

import (
	"bufio"
	"bytes"
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ---------- Kategori ----------

type Category struct {
	ID       int    `json:"id"`
	ParentID *int   `json:"parent_id"`
	Code     string `json:"code"`
	Name     string `json:"name"`
	Count    int    `json:"question_count"`
}

func validSubtest(s string) bool { return s == "TWK" || s == "TIU" || s == "TKP" }

func (s *Server) listCategories(c *gin.Context) {
	rows, err := s.DB.Query(c, `SELECT cat.id, cat.parent_id, cat.code, cat.name,
		(SELECT count(*) FROM questions q WHERE q.category_id=cat.id OR (cat.parent_id IS NULL AND q.subtest=cat.code))
		FROM categories cat ORDER BY cat.code, cat.parent_id NULLS FIRST, cat.name`)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer rows.Close()
	out := []Category{}
	for rows.Next() {
		var x Category
		if err := rows.Scan(&x.ID, &x.ParentID, &x.Code, &x.Name, &x.Count); err != nil {
			httpx.Internal(c, err)
			return
		}
		out = append(out, x)
	}
	httpx.OK(c, out)
}

func (s *Server) createCategory(c *gin.Context) {
	var in struct {
		Code string `json:"code"`
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	if !validSubtest(in.Code) || in.Name == "" {
		httpx.FailFields(c, "Data kategori tidak lengkap.", map[string]string{"name": "Nama dan subtes wajib diisi."})
		return
	}
	var parent int
	if err := s.DB.QueryRow(c, `SELECT id FROM categories WHERE code=$1 AND parent_id IS NULL`, in.Code).Scan(&parent); err != nil {
		httpx.Internal(c, err)
		return
	}
	var x Category
	err := s.DB.QueryRow(c, `INSERT INTO categories(parent_id, code, name) VALUES ($1,$2,$3) RETURNING id, parent_id, code, name`,
		parent, in.Code, in.Name).Scan(&x.ID, &x.ParentID, &x.Code, &x.Name)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.Created(c, x)
}

func (s *Server) updateCategory(c *gin.Context) {
	var in struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&in); err != nil || strings.TrimSpace(in.Name) == "" {
		httpx.FailFields(c, "Nama kategori wajib diisi.", map[string]string{"name": "Nama kategori wajib diisi."})
		return
	}
	tag, err := s.DB.Exec(c, `UPDATE categories SET name=$1 WHERE id=$2 AND parent_id IS NOT NULL`, strings.TrimSpace(in.Name), c.Param("id"))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Sub-kategori tidak ditemukan.")
		return
	}
	httpx.OK(c, gin.H{"message": "Kategori diperbarui."})
}

func (s *Server) deleteCategory(c *gin.Context) {
	tag, err := s.DB.Exec(c, `DELETE FROM categories WHERE id=$1 AND parent_id IS NOT NULL`, c.Param("id"))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Sub-kategori tidak ditemukan.")
		return
	}
	httpx.OK(c, gin.H{"message": "Kategori dihapus."})
}

// ---------- Soal ----------

type Option struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Body   string `json:"body"`
	Weight int    `json:"weight"`
}

type Question struct {
	ID           string    `json:"id"`
	Subtest      string    `json:"subtest"`
	CategoryID   *int      `json:"category_id"`
	CategoryName *string   `json:"category_name"`
	Body         string    `json:"body"`
	ImageURL     string    `json:"image_url"`
	Difficulty   string    `json:"difficulty"`
	Explanation  string    `json:"explanation"`
	Status       string    `json:"status"`
	Options      []Option  `json:"options"`
	UsedCount    int       `json:"used_in_packages"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type questionInput struct {
	Subtest     string   `json:"subtest"`
	CategoryID  *int     `json:"category_id"`
	Body        string   `json:"body"`
	ImageURL    string   `json:"image_url"`
	Difficulty  string   `json:"difficulty"`
	Explanation string   `json:"explanation"`
	Status      string   `json:"status"`
	Options     []Option `json:"options"`
}

var labels = []string{"A", "B", "C", "D", "E"}

func (in *questionInput) validate() map[string]string {
	f := v{}
	in.Body = strings.TrimSpace(in.Body)
	if !validSubtest(in.Subtest) {
		f["subtest"] = "Pilih subtes TWK, TIU, atau TKP."
	}
	if len(in.Body) < 5 {
		f["body"] = "Teks soal minimal 5 karakter."
	}
	if in.Difficulty == "" {
		in.Difficulty = "sedang"
	}
	if in.Difficulty != "mudah" && in.Difficulty != "sedang" && in.Difficulty != "sulit" {
		f["difficulty"] = "Tingkat kesulitan tidak valid."
	}
	if in.Status == "" {
		in.Status = "draft"
	}
	if in.Status != "draft" && in.Status != "terbit" {
		f["status"] = "Status tidak valid."
	}
	if len(in.Options) != 5 {
		f["options"] = "Soal wajib memiliki 5 opsi (A–E)."
		return f
	}
	positive := 0
	for i := range in.Options {
		in.Options[i].Label = labels[i]
		in.Options[i].Body = strings.TrimSpace(in.Options[i].Body)
		o := in.Options[i]
		if o.Body == "" {
			f["options."+o.Label] = "Opsi " + o.Label + " wajib diisi."
		}
		if o.Weight < 0 || o.Weight > 5 {
			f["options."+o.Label] = "Bobot opsi " + o.Label + " harus 0–5."
		}
		if in.Subtest == "TKP" && (o.Weight < 1 || o.Weight > 5) {
			f["options."+o.Label] = "Bobot TKP opsi " + o.Label + " harus 1–5."
		}
		if o.Weight > 0 {
			positive++
		}
	}
	if (in.Subtest == "TWK" || in.Subtest == "TIU") && positive != 1 {
		f["options"] = "TWK/TIU harus memiliki tepat satu kunci jawaban (bobot 5), opsi lain bobot 0."
	}
	return f
}

const questionSelect = `SELECT q.id, q.subtest, q.category_id, cat.name, q.body, q.image_url, q.difficulty, q.explanation, q.status,
	(SELECT count(*) FROM package_questions pq WHERE pq.question_id=q.id), q.created_at, q.updated_at
	FROM questions q LEFT JOIN categories cat ON cat.id=q.category_id`

func scanQuestion(row pgx.Row, q *Question) error {
	return row.Scan(&q.ID, &q.Subtest, &q.CategoryID, &q.CategoryName, &q.Body, &q.ImageURL, &q.Difficulty,
		&q.Explanation, &q.Status, &q.UsedCount, &q.CreatedAt, &q.UpdatedAt)
}

func (s *Server) loadOptions(ctx context.Context, qs []Question) error {
	if len(qs) == 0 {
		return nil
	}
	ids := make([]string, len(qs))
	idx := map[string]int{}
	for i, q := range qs {
		ids[i] = q.ID
		idx[q.ID] = i
		qs[i].Options = []Option{}
	}
	rows, err := s.DB.Query(ctx, `SELECT question_id, id, label, body, weight FROM question_options WHERE question_id = ANY($1) ORDER BY label`, ids)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var qid string
		var o Option
		if err := rows.Scan(&qid, &o.ID, &o.Label, &o.Body, &o.Weight); err != nil {
			return err
		}
		qs[idx[qid]].Options = append(qs[idx[qid]].Options, o)
	}
	return rows.Err()
}

func (s *Server) adminListQuestions(c *gin.Context) {
	page, perPage, offset := httpx.Paging(c)
	where := []string{"1=1"}
	args := []any{}
	add := func(cond string, val any) {
		args = append(args, val)
		where = append(where, fmt.Sprintf(cond, len(args)))
	}
	if q := strings.TrimSpace(c.Query("q")); q != "" {
		add("q.body ILIKE $%d", "%"+q+"%")
	}
	if st := c.Query("subtest"); validSubtest(st) {
		add("q.subtest = $%d", st)
	}
	if cid, err := strconv.Atoi(c.Query("category_id")); err == nil {
		add("q.category_id = $%d", cid)
	}
	if d := c.Query("difficulty"); d != "" {
		add("q.difficulty = $%d", d)
	}
	if st := c.Query("status"); st != "" {
		add("q.status = $%d", st)
	}
	w := strings.Join(where, " AND ")
	var total int
	if err := s.DB.QueryRow(c, `SELECT count(*) FROM questions q WHERE `+w, args...).Scan(&total); err != nil {
		httpx.Internal(c, err)
		return
	}
	args = append(args, perPage, offset)
	rows, err := s.DB.Query(c, questionSelect+` WHERE `+w+fmt.Sprintf(` ORDER BY q.created_at DESC LIMIT $%d OFFSET $%d`, len(args)-1, len(args)), args...)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	out := []Question{}
	for rows.Next() {
		var q Question
		if err := scanQuestion(rows, &q); err != nil {
			rows.Close()
			httpx.Internal(c, err)
			return
		}
		out = append(out, q)
	}
	rows.Close()
	if c.Query("with_options") == "1" {
		if err := s.loadOptions(c, out); err != nil {
			httpx.Internal(c, err)
			return
		}
	}
	httpx.OKMeta(c, out, httpx.NewMeta(page, perPage, total))
}

func (s *Server) getQuestion(ctx context.Context, id string) (*Question, error) {
	var q Question
	if err := scanQuestion(s.DB.QueryRow(ctx, questionSelect+` WHERE q.id=$1`, id), &q); err != nil {
		return nil, err
	}
	list := []Question{q}
	if err := s.loadOptions(ctx, list); err != nil {
		return nil, err
	}
	return &list[0], nil
}

func (s *Server) adminGetQuestion(c *gin.Context) {
	if _, err := uuid.Parse(c.Param("id")); err != nil {
		httpx.NotFound(c, "Soal tidak ditemukan.")
		return
	}
	q, err := s.getQuestion(c, c.Param("id"))
	if errors.Is(err, pgx.ErrNoRows) {
		httpx.NotFound(c, "Soal tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, q)
}

func (s *Server) saveQuestion(ctx context.Context, tx pgx.Tx, id string, in questionInput, userID string) (string, error) {
	if id == "" {
		err := tx.QueryRow(ctx, `INSERT INTO questions(subtest, category_id, body, image_url, difficulty, explanation, status, created_by)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
			in.Subtest, in.CategoryID, in.Body, in.ImageURL, in.Difficulty, in.Explanation, in.Status, userID).Scan(&id)
		if err != nil {
			return "", err
		}
	} else {
		tag, err := tx.Exec(ctx, `UPDATE questions SET subtest=$1, category_id=$2, body=$3, image_url=$4, difficulty=$5,
			explanation=$6, status=$7, updated_at=now() WHERE id=$8`,
			in.Subtest, in.CategoryID, in.Body, in.ImageURL, in.Difficulty, in.Explanation, in.Status, id)
		if err != nil {
			return "", err
		}
		if tag.RowsAffected() == 0 {
			return "", pgx.ErrNoRows
		}
	}
	// opsi diperbarui per label agar riwayat jawaban peserta tetap terhubung
	for _, o := range in.Options {
		if _, err := tx.Exec(ctx, `INSERT INTO question_options(question_id, label, body, weight) VALUES ($1,$2,$3,$4)
			ON CONFLICT (question_id, label) DO UPDATE SET body=EXCLUDED.body, weight=EXCLUDED.weight`,
			id, o.Label, o.Body, o.Weight); err != nil {
			return "", err
		}
	}
	return id, nil
}

func (s *Server) upsertQuestion(c *gin.Context, id string) {
	var in questionInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if f := in.validate(); len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali isian soal.", f)
		return
	}
	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)
	newID, err := s.saveQuestion(c, tx, id, in, auth.UserID(c))
	if errors.Is(err, pgx.ErrNoRows) {
		httpx.NotFound(c, "Soal tidak ditemukan.")
		return
	}
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if err := tx.Commit(c); err != nil {
		httpx.Internal(c, err)
		return
	}
	q, _ := s.getQuestion(c, newID)
	if id == "" {
		s.logActivity(c, auth.UserID(c), "soal.tambah", newID)
		httpx.Created(c, q)
		return
	}
	s.logActivity(c, auth.UserID(c), "soal.ubah", newID)
	httpx.OK(c, q)
}

func (s *Server) createQuestion(c *gin.Context) { s.upsertQuestion(c, "") }
func (s *Server) updateQuestion(c *gin.Context) {
	if _, err := uuid.Parse(c.Param("id")); err != nil {
		httpx.NotFound(c, "Soal tidak ditemukan.")
		return
	}
	s.upsertQuestion(c, c.Param("id"))
}

func (s *Server) deleteQuestion(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		httpx.NotFound(c, "Soal tidak ditemukan.")
		return
	}
	var used bool
	_ = s.DB.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM attempt_questions WHERE question_id=$1)`, id).Scan(&used)
	if used {
		httpx.Conflict(c, "Soal sudah pernah dikerjakan peserta sehingga tidak bisa dihapus. Ubah statusnya menjadi draft.")
		return
	}
	tag, err := s.DB.Exec(c, `DELETE FROM questions WHERE id=$1`, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Soal tidak ditemukan.")
		return
	}
	s.logActivity(c, auth.UserID(c), "soal.hapus", id)
	httpx.OK(c, gin.H{"message": "Soal dihapus."})
}

// ---------- Import / Export CSV ----------

var csvHeader = []string{"subtes", "kategori", "kesulitan", "status", "soal", "opsi_a", "bobot_a", "opsi_b", "bobot_b",
	"opsi_c", "bobot_c", "opsi_d", "bobot_d", "opsi_e", "bobot_e", "pembahasan", "gambar_url"}

func writeCSV(c *gin.Context, filename string, rows [][]string) {
	var buf bytes.Buffer
	buf.WriteString("\uFEFF") // BOM agar Excel membaca UTF-8
	w := csv.NewWriter(&buf)
	w.Comma = ';' // Excel locale Indonesia memakai titik koma
	_ = w.WriteAll(rows)
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Data(http.StatusOK, "text/csv; charset=utf-8", buf.Bytes())
}

func (s *Server) importTemplate(c *gin.Context) {
	writeCSV(c, "template-bank-soal.csv", [][]string{csvHeader,
		{"TWK", "Pilar Negara", "sedang", "terbit", "Pancasila sebagai dasar negara tercantum dalam ...", "Pembukaan UUD 1945 alinea IV", "5",
			"Batang Tubuh UUD 1945", "0", "Ketetapan MPR", "0", "Keputusan Presiden", "0", "Piagam Jakarta", "0",
			"Rumusan Pancasila terdapat dalam Pembukaan UUD 1945 alinea keempat.", ""},
		{"TKP", "Pelayanan Publik", "sedang", "draft", "Seorang warga datang mengeluh saat jam istirahat. Sikap Anda ...",
			"Meminta datang lagi nanti", "1", "Melayani dengan ramah", "5", "Mengarahkan ke rekan", "3", "Melayani seadanya", "2",
			"Mengabaikan", "1", "Sikap terbaik adalah melayani dengan ramah.", ""},
	})
}

func (s *Server) exportQuestions(c *gin.Context) {
	rows, err := s.DB.Query(c, questionSelect+` ORDER BY q.subtest, q.created_at`)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var qs []Question
	for rows.Next() {
		var q Question
		if err := scanQuestion(rows, &q); err == nil {
			qs = append(qs, q)
		}
	}
	rows.Close()
	if err := s.loadOptions(c, qs); err != nil {
		httpx.Internal(c, err)
		return
	}
	out := [][]string{csvHeader}
	for _, q := range qs {
		cat := ""
		if q.CategoryName != nil {
			cat = *q.CategoryName
		}
		r := []string{q.Subtest, cat, q.Difficulty, q.Status, q.Body}
		for i := 0; i < 5; i++ {
			if i < len(q.Options) {
				r = append(r, q.Options[i].Body, strconv.Itoa(q.Options[i].Weight))
			} else {
				r = append(r, "", "0")
			}
		}
		r = append(r, q.Explanation, q.ImageURL)
		out = append(out, r)
	}
	writeCSV(c, "bank-soal-"+time.Now().Format("20060102")+".csv", out)
}

type importRowError struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

func (s *Server) importQuestions(c *gin.Context) {
	fh, err := c.FormFile("file")
	if err != nil {
		httpx.BadRequest(c, "Unggah file CSV terlebih dahulu.")
		return
	}
	if fh.Size > 5<<20 {
		httpx.BadRequest(c, "Ukuran file maksimal 5 MB.")
		return
	}
	f, err := fh.Open()
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer f.Close()
	raw, _ := io.ReadAll(f)
	raw = bytes.TrimPrefix(raw, []byte("\uFEFF"))
	firstLine, _ := bufio.NewReader(bytes.NewReader(raw)).ReadString('\n')
	r := csv.NewReader(bytes.NewReader(raw))
	if strings.Count(firstLine, ";") > strings.Count(firstLine, ",") {
		r.Comma = ';'
	}
	r.FieldsPerRecord = -1
	records, err := r.ReadAll()
	if err != nil || len(records) < 2 {
		httpx.BadRequest(c, "File CSV kosong atau formatnya tidak valid. Gunakan template yang disediakan.")
		return
	}
	// pemetaan kolom berdasarkan header
	col := map[string]int{}
	for i, h := range records[0] {
		col[strings.ToLower(strings.TrimSpace(h))] = i
	}
	for _, h := range csvHeader[:15] {
		if _, ok := col[h]; !ok {
			httpx.BadRequest(c, "Kolom '"+h+"' tidak ditemukan. Gunakan template yang disediakan.")
			return
		}
	}
	get := func(rec []string, name string) string {
		if i, ok := col[name]; ok && i < len(rec) {
			return strings.TrimSpace(rec[i])
		}
		return ""
	}
	catIDs := map[string]int{}
	resolveCat := func(ctx context.Context, tx pgx.Tx, subtest, name string) (*int, error) {
		if name == "" {
			return nil, nil
		}
		key := subtest + "|" + strings.ToLower(name)
		if id, ok := catIDs[key]; ok {
			return &id, nil
		}
		var id int
		err := tx.QueryRow(ctx, `SELECT id FROM categories WHERE code=$1 AND lower(name)=lower($2) AND parent_id IS NOT NULL`, subtest, name).Scan(&id)
		if errors.Is(err, pgx.ErrNoRows) {
			err = tx.QueryRow(ctx, `INSERT INTO categories(parent_id, code, name)
				SELECT id, code, $2 FROM categories WHERE code=$1 AND parent_id IS NULL RETURNING id`, subtest, name).Scan(&id)
		}
		if err != nil {
			return nil, err
		}
		catIDs[key] = id
		return &id, nil
	}

	tx, err := s.DB.Begin(c)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer tx.Rollback(c)
	var rowErrs []importRowError
	inserted := 0
	for i, rec := range records[1:] {
		rowNum := i + 2
		if len(strings.Join(rec, "")) == 0 {
			continue
		}
		in := questionInput{
			Subtest:     strings.ToUpper(get(rec, "subtes")),
			Body:        get(rec, "soal"),
			Difficulty:  strings.ToLower(get(rec, "kesulitan")),
			Status:      strings.ToLower(get(rec, "status")),
			Explanation: get(rec, "pembahasan"),
			ImageURL:    get(rec, "gambar_url"),
		}
		bad := false
		for _, l := range []string{"a", "b", "c", "d", "e"} {
			wt, err := strconv.Atoi(get(rec, "bobot_"+l))
			if err != nil {
				rowErrs = append(rowErrs, importRowError{rowNum, "Bobot opsi " + strings.ToUpper(l) + " harus berupa angka."})
				bad = true
				break
			}
			in.Options = append(in.Options, Option{Body: get(rec, "opsi_"+l), Weight: wt})
		}
		if bad {
			continue
		}
		if f := in.validate(); len(f) > 0 {
			msgs := []string{}
			for _, m := range f {
				msgs = append(msgs, m)
			}
			rowErrs = append(rowErrs, importRowError{rowNum, strings.Join(msgs, " ")})
			continue
		}
		cid, err := resolveCat(c, tx, in.Subtest, get(rec, "kategori"))
		if err != nil {
			httpx.Internal(c, err)
			return
		}
		in.CategoryID = cid
		if _, err := s.saveQuestion(c, tx, "", in, auth.UserID(c)); err != nil {
			httpx.Internal(c, err)
			return
		}
		inserted++
	}
	// semua-atau-tidak-sama-sekali: jika ada baris bermasalah, tidak ada yang disimpan
	if len(rowErrs) > 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"success": false, "data": gin.H{"errors": rowErrs, "inserted": 0},
			"error": httpx.ErrorBody{Code: "IMPORT_ERROR", Message: fmt.Sprintf("%d baris bermasalah. Perbaiki lalu unggah ulang.", len(rowErrs))}})
		return
	}
	if err := tx.Commit(c); err != nil {
		httpx.Internal(c, err)
		return
	}
	s.logActivity(c, auth.UserID(c), "soal.import", strconv.Itoa(inserted)+" soal")
	httpx.OK(c, gin.H{"inserted": inserted, "errors": []importRowError{}})
}

// ---------- Upload gambar ----------

func (s *Server) uploadImage(c *gin.Context) {
	fh, err := c.FormFile("file")
	if err != nil {
		httpx.BadRequest(c, "Pilih file gambar.")
		return
	}
	if fh.Size > 2<<20 {
		httpx.BadRequest(c, "Ukuran gambar maksimal 2 MB.")
		return
	}
	f, err := fh.Open()
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer f.Close()
	head := make([]byte, 512)
	n, _ := f.Read(head)
	ext := map[string]string{"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif"}[http.DetectContentType(head[:n])]
	if ext == "" {
		httpx.BadRequest(c, "Format gambar harus PNG, JPG, WEBP, atau GIF.")
		return
	}
	name := uuid.NewString() + ext
	dst := filepath.Join(s.Cfg.UploadDir, name)
	out, err := os.Create(dst)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	defer out.Close()
	out.Write(head[:n])
	if _, err := io.Copy(out, f); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.Created(c, gin.H{"url": "/uploads/" + name})
}
