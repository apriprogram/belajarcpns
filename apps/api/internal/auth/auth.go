// Package auth: hashing password, JWT access token, refresh token, dan middleware RBAC.
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"time"

	"bisapns/api/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	AccessTTL     = 15 * time.Minute
	RefreshTTL    = 7 * 24 * time.Hour
	AccessCookie  = "access_token"
	RefreshCookie = "refresh_token"
	ctxUserID     = "uid"
	ctxRole       = "role"
)

type Claims struct {
	Role string `json:"role"`
	Name string `json:"name"`
	jwt.RegisteredClaims
}

type Manager struct {
	secret       []byte
	cookieSecure bool
}

func NewManager(secret string, cookieSecure bool) *Manager {
	return &Manager{secret: []byte(secret), cookieSecure: cookieSecure}
}

func HashPassword(pw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), 12)
	return string(b), err
}

func CheckPassword(hash, pw string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(pw)) == nil
}

func (m *Manager) SignAccess(userID, role, name string) (string, error) {
	claims := Claims{Role: role, Name: name, RegisteredClaims: jwt.RegisteredClaims{
		Subject:   userID,
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(AccessTTL)),
		Issuer:    "bisa-pns",
	}}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.secret)
}

func (m *Manager) Parse(token string) (*Claims, error) {
	claims := &Claims{}
	t, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("metode tanda tangan tidak valid")
		}
		return m.secret, nil
	})
	if err != nil || !t.Valid {
		return nil, errors.New("token tidak valid")
	}
	return claims, nil
}

// RandomToken menghasilkan token acak (dikirim ke klien) dan hash-nya (disimpan di DB).
func RandomToken() (plain, hash string) {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	plain = hex.EncodeToString(b)
	return plain, HashToken(plain)
}

func HashToken(plain string) string {
	s := sha256.Sum256([]byte(plain))
	return hex.EncodeToString(s[:])
}

func (m *Manager) SetCookies(c *gin.Context, access, refresh string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(AccessCookie, access, int(AccessTTL.Seconds()), "/", "", m.cookieSecure, true)
	if refresh != "" {
		c.SetCookie(RefreshCookie, refresh, int(RefreshTTL.Seconds()), "/", "", m.cookieSecure, true)
	}
}

func (m *Manager) ClearCookies(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(AccessCookie, "", -1, "/", "", m.cookieSecure, true)
	c.SetCookie(RefreshCookie, "", -1, "/", "", m.cookieSecure, true)
}

// RequireAuth memvalidasi access token dari cookie atau header Authorization.
func (m *Manager) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tok, _ := c.Cookie(AccessCookie)
		if h := c.GetHeader("Authorization"); strings.HasPrefix(h, "Bearer ") {
			tok = strings.TrimPrefix(h, "Bearer ")
		}
		if tok == "" {
			httpx.Fail(c, http.StatusUnauthorized, "UNAUTHORIZED", "Sesi berakhir. Silakan masuk kembali.")
			return
		}
		claims, err := m.Parse(tok)
		if err != nil {
			httpx.Fail(c, http.StatusUnauthorized, "TOKEN_EXPIRED", "Sesi berakhir. Silakan masuk kembali.")
			return
		}
		c.Set(ctxUserID, claims.Subject)
		c.Set(ctxRole, claims.Role)
		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		r := c.GetString(ctxRole)
		for _, x := range roles {
			if r == x {
				c.Next()
				return
			}
		}
		httpx.Forbidden(c, "Anda tidak memiliki akses ke fitur ini.")
	}
}

func UserID(c *gin.Context) string { return c.GetString(ctxUserID) }
func Role(c *gin.Context) string   { return c.GetString(ctxRole) }
