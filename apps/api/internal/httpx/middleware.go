package httpx

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// CORS hanya mengizinkan origin yang terdaftar (dengan kredensial).
func CORS(origins []string) gin.HandlerFunc {
	allowed := map[string]bool{}
	for _, o := range origins {
		allowed[strings.TrimSpace(o)] = true
	}
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" && allowed[origin] {
			h := c.Writer.Header()
			h.Set("Access-Control-Allow-Origin", origin)
			h.Set("Access-Control-Allow-Credentials", "true")
			h.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			h.Set("Vary", "Origin")
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// SecurityHeaders menambahkan header keamanan dasar.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.Writer.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	}
}

// RateLimiter sederhana berbasis IP (fixed window) untuk endpoint sensitif.
type RateLimiter struct {
	mu     sync.Mutex
	hits   map[string]*window
	limit  int
	period time.Duration
}

type window struct {
	count int
	reset time.Time
}

func NewRateLimiter(limit int, period time.Duration) *RateLimiter {
	rl := &RateLimiter{hits: map[string]*window{}, limit: limit, period: period}
	go func() {
		for range time.Tick(time.Minute) {
			rl.mu.Lock()
			now := time.Now()
			for k, w := range rl.hits {
				if now.After(w.reset) {
					delete(rl.hits, k)
				}
			}
			rl.mu.Unlock()
		}
	}()
	return rl
}

func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP() + c.FullPath()
		now := time.Now()
		rl.mu.Lock()
		w, ok := rl.hits[key]
		if !ok || now.After(w.reset) {
			w = &window{reset: now.Add(rl.period)}
			rl.hits[key] = w
		}
		w.count++
		over := w.count > rl.limit
		rl.mu.Unlock()
		if over {
			Fail(c, http.StatusTooManyRequests, "TOO_MANY_REQUESTS", "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.")
			return
		}
		c.Next()
	}
}
