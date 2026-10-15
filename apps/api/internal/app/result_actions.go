package app

import (
	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
)

// setResultSaved: peserta menandai/membatalkan tanda "disimpan" pada hasilnya sendiri.
// Body: { "saved": true|false } · :id = attempt_id
func (s *Server) setResultSaved(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Hasil tidak ditemukan.")
	if !ok {
		return
	}
	var in struct {
		Saved *bool `json:"saved"`
	}
	if err := c.ShouldBindJSON(&in); err != nil || in.Saved == nil {
		httpx.BadRequest(c, "Format data tidak valid.")
		return
	}
	tag, err := s.DB.Exec(c, `UPDATE results SET saved=$1 WHERE attempt_id=$2 AND user_id=$3 AND hidden_at IS NULL`, *in.Saved, id, auth.UserID(c))
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Hasil tidak ditemukan.")
		return
	}
	httpx.OK(c, gin.H{"attempt_id": id, "saved": *in.Saved})
}

// hideResult: peserta menghapus hasil dari riwayatnya. Data disembunyikan (bukan dihapus fisik)
// agar laporan admin dan peringkat paket peserta lain tetap konsisten.
func (s *Server) hideResult(c *gin.Context) {
	id, ok := pathUUID(c, "id", "Hasil tidak ditemukan.")
	if !ok {
		return
	}
	uid := auth.UserID(c)
	tag, err := s.DB.Exec(c, `UPDATE results SET hidden_at=now(), saved=false WHERE attempt_id=$1 AND user_id=$2 AND hidden_at IS NULL`, id, uid)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	if tag.RowsAffected() == 0 {
		httpx.NotFound(c, "Hasil tidak ditemukan.")
		return
	}
	s.logActivity(c, uid, "hasil.hapus", id)
	httpx.OK(c, gin.H{"message": "Hasil dihapus dari riwayat."})
}
