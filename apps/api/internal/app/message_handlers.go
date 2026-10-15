package app

import (
	"context"
	"strconv"
	"strings"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
)

// ---------- Pesan pengunjung (halaman utama → admin/developer) ----------

var occupations = map[string]bool{"siswa": true, "mahasiswa": true, "bekerja": true, "belum_bekerja": true, "pengusaha": true}

type Message struct {
	ID         string     `json:"id"`
	Name       string     `json:"name"`
	Occupation string     `json:"occupation"`
	Recipient  string     `json:"recipient"`
	Contact    *string    `json:"contact"`
	Body       string     `json:"body"`
	IsRead     bool       `json:"is_read"`
	ReadAt     *time.Time `json:"read_at"`
	CreatedAt  time.Time  `json:"created_at"`
}

const messageCols = `id, name, occupation, recipient, contact, body, is_read, read_at, created_at`

func (s *Server) queryMessages(ctx context.Context, sql string, args ...any) ([]Message, error) {
	rows, err := s.DB.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Message{}
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.Name, &m.Occupation, &m.Recipient, &m.Contact, &m.Body, &m.IsRead, &m.ReadAt, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

type messageInput struct {
	Name       string `json:"name"`
	Occupation string `json:"occupation"`
	Recipient  string `json:"recipient"`
	Contact    string `json:"contact"`
	Body       string `json:"body"`
	Website    string `json:"website"` // honeypot: harus kosong (diisi bot)
}

func (in *messageInput) validate() map[string]string {
	f := v{}
	in.Name = strings.TrimSpace(in.Name)
	in.Body = strings.TrimSpace(in.Body)
	in.Contact = strings.TrimSpace(in.Contact)
	if in.Recipient == "" {
		in.Recipient = "admin"
	}
	if n := len([]rune(in.Name)); n < 3 {
		f["name"] = "Nama lengkap minimal 3 karakter."
	} else if n > 120 {
		f["name"] = "Nama lengkap maksimal 120 karakter."
	}
	if !occupations[in.Occupation] {
		f["occupation"] = "Pilih status Anda."
	}
	if in.Recipient != "admin" && in.Recipient != "developer" {
		f["recipient"] = "Tujuan pesan tidak valid."
	}
	if len([]rune(in.Contact)) > 160 {
		f["contact"] = "Kontak maksimal 160 karakter."
	}
	if n := len([]rune(in.Body)); n < 10 {
		f["body"] = "Pesan minimal 10 karakter."
	} else if n > 1000 {
		f["body"] = "Pesan maksimal 1000 karakter."
	}
	return f
}

// createMessage: endpoint publik (dibatasi rate limit) untuk mengirim pesan.
func (s *Server) createMessage(c *gin.Context) {
	var in messageInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	if strings.TrimSpace(in.Website) != "" {
		// bot: pura-pura berhasil tanpa menyimpan
		httpx.Created(c, gin.H{"message": "Pesan terkirim."})
		return
	}
	if f := in.validate(); len(f) > 0 {
		httpx.FailFields(c, "Periksa kembali isian pesan.", f)
		return
	}
	var contact *string
	if in.Contact != "" {
		contact = &in.Contact
	}
	if _, err := s.DB.Exec(c, `INSERT INTO messages(name, occupation, recipient, contact, body) VALUES ($1,$2,$3,$4,$5)`,
		in.Name, in.Occupation, in.Recipient, contact, in.Body); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.Created(c, gin.H{"message": "Pesan terkirim."})
}

// adminListMessages: ?status=semua|belum|sudah · ?recipient=admin|developer · ?q=teks
func (s *Server) adminListMessages(c *gin.Context) {
	where := []string{"true"}
	args := []any{}
	switch c.Query("status") {
	case "belum":
		where = append(where, "is_read = false")
	case "sudah":
		where = append(where, "is_read = true")
	}
	if r := c.Query("recipient"); r == "admin" || r == "developer" {
		args = append(args, r)
		where = append(where, "recipient = $"+strconv.Itoa(len(args)))
	}
	if q := strings.TrimSpace(c.Query("q")); q != "" {
		args = append(args, "%"+q+"%")
		n := strconv.Itoa(len(args))
		where = append(where, "(name ILIKE $"+n+" OR body ILIKE $"+n+" OR contact ILIKE $"+n+")")
	}
	list, err := s.queryMessages(c, `SELECT `+messageCols+` FROM messages WHERE `+strings.Join(where, " AND ")+` ORDER BY created_at DESC LIMIT 500`, args...)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var total, unread int
	_ = s.DB.QueryRow(c, `SELECT count(*), count(*) FILTER (WHERE is_read = false) FROM messages`).Scan(&total, &unread)
	httpx.OK(c, gin.H{"items": list, "total": total, "unread": unread})
}

func (s *Server) adminUnreadMessages(c *gin.Context) {
	var unread int
	if err := s.DB.QueryRow(c, `SELECT count(*) FROM messages WHERE is_read = false`).Scan(&unread); err != nil {
		httpx.Internal(c, err)
		return
	}
	httpx.OK(c, gin.H{"unread": unread})
}

func (s *Server) adminMarkMessage(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pesan tidak ditemukan.")
	if !ok {
		return
	}
	var in struct {
		Read *bool `json:"read"`
	}
	if err := c.ShouldBindJSON(&in); err != nil || in.Read == nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	list, err := s.queryMessages(c, `UPDATE messages SET is_read=$1, read_at=CASE WHEN $1 THEN now() ELSE NULL END WHERE id=$2 RETURNING `+messageCols, *in.Read, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if len(list) == 0 {
		httpx.NotFound(c, "Pesan tidak ditemukan.")
		return
	}
	httpx.OK(c, list[0])
}

func (s *Server) adminDeleteMessage(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Pesan tidak ditemukan.")
	if !ok {
		return
	}
	tag, err := s.DB.Exec(c, `DELETE FROM messages WHERE id=$1`, id)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Pesan tidak ditemukan.")
		return
	}
	s.logActivity(c, auth.UserID(c), "pesan.hapus", id)
	httpx.OK(c, gin.H{"message": "Pesan dihapus."})
}
