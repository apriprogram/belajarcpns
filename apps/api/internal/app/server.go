// Package app berisi handler HTTP dan logika bisnis BISA-PNS.
package app

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/config"
	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	DB   *pgxpool.Pool
	Cfg  config.Config
	Auth *auth.Manager
}

func New(db *pgxpool.Pool, cfg config.Config) *Server {
	return &Server{DB: db, Cfg: cfg, Auth: auth.NewManager(cfg.JWTSecret, cfg.CookieSecure)}
}

func (s *Server) Router() *gin.Engine {
	if !s.Cfg.IsDev() {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), httpx.SecurityHeaders(), httpx.CORS(s.Cfg.CORSOrigins))
	r.MaxMultipartMemory = 8 << 20
	_ = os.MkdirAll(s.Cfg.UploadDir, 0o755)
	r.Static("/uploads", s.Cfg.UploadDir)

	r.GET("/health", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c, 2*time.Second)
		defer cancel()
		if err := s.DB.Ping(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "db_down"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	strict := httpx.NewRateLimiter(10, time.Minute) // login/daftar/lupa password

	a := api.Group("/auth")
	a.POST("/register", strict.Middleware(), s.register)
	a.POST("/login", strict.Middleware(), s.login)
	a.POST("/refresh", s.refresh)
	a.POST("/logout", s.logout)
	a.POST("/forgot-password", strict.Middleware(), s.forgotPassword)
	a.POST("/reset-password", strict.Middleware(), s.resetPassword)

	// Pesan publik dari halaman utama (dibatasi: 5 pesan / 10 menit per IP)
	msgLimit := httpx.NewRateLimiter(5, 10*time.Minute)
	api.POST("/messages", msgLimit.Middleware(), s.createMessage)

	// Konten & branding website (publik)
	api.GET("/site", s.siteGet)

	// Testimoni yang ditampilkan di halaman utama (publik)
	api.GET("/testimonials", s.publicTestimonials)

	authed := api.Group("", s.Auth.RequireAuth(), s.touchLastSeen())
	authed.GET("/auth/me", s.me)
	authed.PUT("/me", s.updateProfile)
	authed.PUT("/me/password", s.changePassword)
	authed.POST("/me/avatar", s.uploadAvatar)
	authed.DELETE("/me/avatar", s.deleteAvatar)
	authed.GET("/categories", s.listCategories)
	authed.GET("/announcements", s.listPublishedAnnouncements)

	// GroupChat (semua pengguna terautentikasi: peserta & admin)
	chatLimit := httpx.NewRateLimiter(30, time.Minute)
	reactLimit := httpx.NewRateLimiter(120, time.Minute)
	authed.GET("/chat/config", s.chatConfigHandler)
	authed.GET("/chat/messages", s.chatList)
	authed.GET("/chat/sync", s.chatSync)
	authed.GET("/chat/members", s.chatMembers)
	authed.POST("/chat/messages", chatLimit.Middleware(), s.chatSend)
	authed.PATCH("/chat/messages/:id/star", s.chatStar)
	authed.PUT("/chat/messages/:id/reaction", reactLimit.Middleware(), s.chatReact)
	authed.DELETE("/chat/messages/:id/reaction", reactLimit.Middleware(), s.chatUnreact)
	authed.DELETE("/chat/messages/:id", s.chatDelete)

	p := authed.Group("", auth.RequireRole("peserta", "admin"))
	p.GET("/me/dashboard", s.myDashboard)
	p.POST("/me/heartbeat", s.heartbeat)
	p.GET("/me/targets", s.listTargets)
	p.POST("/me/targets", s.createTarget)
	p.PATCH("/me/targets/:id", s.updateTarget)
	p.DELETE("/me/targets/:id", s.deleteTarget)
	testiLimit := httpx.NewRateLimiter(10, 10*time.Minute) // simpan testimoni: 10 kali / 10 menit per IP
	p.GET("/me/testimonial", s.myTestimonial)
	p.PUT("/me/testimonial", testiLimit.Middleware(), s.saveMyTestimonial)
	p.DELETE("/me/testimonial", s.deleteMyTestimonial)
	p.GET("/me/results", s.myResults)
	p.PATCH("/me/results/:id", s.setResultSaved)
	p.DELETE("/me/results/:id", s.hideResult)
	p.GET("/practice/questions", s.practiceQuestions)
	p.POST("/practice/answer", s.practiceAnswer)
	p.GET("/packages", s.listAvailablePackages)
	p.GET("/packages/:id", s.getAvailablePackage)
	p.POST("/attempts", s.startAttempt)
	p.GET("/attempts/:id", s.getAttempt)
	p.PUT("/attempts/:id/answers", s.saveAnswer)
	p.POST("/attempts/:id/events", s.logEvent)
	p.POST("/attempts/:id/submit", s.submitAttempt)
	p.GET("/results/:id", s.getResult)

	ad := authed.Group("/admin", auth.RequireRole("admin"))
	ad.GET("/dashboard", s.adminDashboard)
	ad.GET("/categories", s.listCategories)
	ad.POST("/categories", s.createCategory)
	ad.PUT("/categories/:id", s.updateCategory)
	ad.DELETE("/categories/:id", s.deleteCategory)
	ad.GET("/questions", s.adminListQuestions)
	ad.GET("/questions/export", s.exportQuestions)
	ad.GET("/questions/template", s.importTemplate)
	ad.POST("/questions/import", s.importQuestions)
	ad.POST("/questions", s.createQuestion)
	ad.GET("/questions/:id", s.adminGetQuestion)
	ad.PUT("/questions/:id", s.updateQuestion)
	ad.DELETE("/questions/:id", s.deleteQuestion)
	ad.POST("/uploads", s.uploadImage)
	ad.GET("/packages", s.adminListPackages)
	ad.POST("/packages", s.createPackage)
	ad.GET("/packages/:id", s.adminGetPackage)
	ad.PUT("/packages/:id", s.updatePackage)
	ad.DELETE("/packages/:id", s.deletePackage)
	ad.PUT("/packages/:id/questions", s.setPackageQuestions)
	ad.POST("/packages/:id/auto-fill", s.autoFillPackage)
	ad.PATCH("/packages/:id/status", s.setPackageStatus)
	ad.GET("/users", s.adminListUsers)
	ad.GET("/users/:id", s.adminGetUser)
	ad.GET("/users/:id/export", s.adminExportUserHistory)
	ad.PATCH("/users/:id/status", s.adminSetUserStatus)
	ad.DELETE("/users/:id", s.adminDeleteUser)
	ad.POST("/users/:id/reset-password", s.adminResetPassword)
	ad.GET("/reports/packages/:id", s.packageReport)
	ad.GET("/reports/packages/:id/export", s.exportPackageReport)
	ad.GET("/announcements", s.adminListAnnouncements)
	ad.POST("/announcements", s.createAnnouncement)
	ad.PUT("/announcements/:id", s.updateAnnouncement)
	ad.DELETE("/announcements/:id", s.deleteAnnouncement)
	ad.GET("/messages", s.adminListMessages)
	ad.GET("/messages/unread", s.adminUnreadMessages)
	ad.PATCH("/messages/:id", s.adminMarkMessage)
	ad.DELETE("/messages/:id", s.adminDeleteMessage)
	ad.GET("/testimonials", s.adminListTestimonials)
	ad.GET("/testimonials/unread", s.adminUnreadTestimonials)
	ad.POST("/testimonials/read-all", s.adminReadAllTestimonials)
	ad.PATCH("/testimonials/:id", s.adminUpdateTestimonial)
	ad.DELETE("/testimonials/:id", s.adminDeleteTestimonial)
	ad.POST("/chat/reset", s.chatReset)
	ad.PATCH("/chat/messages/:id/pin", s.chatPin)
	ad.GET("/chat/settings", s.getChatSettings)
	ad.PUT("/chat/settings", s.updateChatSettings)
	ad.PUT("/site", s.siteUpdate)
	ad.DELETE("/site", s.siteReset)
	ad.POST("/site/upload", s.siteUpload)
	ad.GET("/settings", s.getSettings)
	ad.PUT("/settings", s.updateSettings)
	ad.GET("/activity", s.adminActivity)

	return r
}

// touchLastSeen memastikan akun masih aktif lalu memperbarui last_seen_at maksimal sekali per menit (untuk statistik "online").
func (s *Server) touchLastSeen() gin.HandlerFunc {
	return func(c *gin.Context) {
		uid := auth.UserID(c)
		// akun yang diblokir/dihapus langsung kehilangan akses walau access token belum kedaluwarsa
		var status string
		if err := s.DB.QueryRow(c, `SELECT status FROM users WHERE id=$1`, uid).Scan(&status); err != nil {
			httpx.Fail(c, http.StatusUnauthorized, "UNAUTHORIZED", "Sesi berakhir. Silakan masuk kembali.")
			return
		}
		if status == "blocked" {
			s.Auth.ClearCookies(c)
			httpx.Forbidden(c, "Akun Anda diblokir. Hubungi admin.")
			return
		}
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			_, _ = s.DB.Exec(ctx, `UPDATE users SET last_seen_at=now() WHERE id=$1 AND (last_seen_at IS NULL OR last_seen_at < now()-interval '1 minute')`, uid)
		}()
		c.Next()
	}
}

// StartAutoSubmitter menutup otomatis attempt yang melewati batas waktu.
func (s *Server) StartAutoSubmitter(ctx context.Context) {
	go func() {
		t := time.NewTicker(30 * time.Second)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				rows, err := s.DB.Query(ctx, `SELECT id FROM attempts WHERE status='berlangsung' AND deadline_at < now()`)
				if err != nil {
					continue
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
					if err := s.finalizeAttempt(ctx, id); err != nil {
						log.Printf("auto-submit %s gagal: %v", id, err)
					}
				}
			}
		}
	}()
}

func (s *Server) logActivity(ctx context.Context, userID, action, detail string) {
	_, _ = s.DB.Exec(ctx, `INSERT INTO activity_logs(user_id, action, detail) VALUES ($1,$2,$3)`, userID, action, detail)
}

// --- helper validasi sederhana ---

type v map[string]string

func (f v) req(field, val, msg string) {
	if strings.TrimSpace(val) == "" {
		f[field] = msg
	}
}
