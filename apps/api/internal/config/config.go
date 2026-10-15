// Package config membaca konfigurasi aplikasi dari environment variable.
package config

import (
	"os"
	"strings"
)

type Config struct {
	Port         string
	DatabaseURL  string
	JWTSecret    string
	AppEnv       string
	CORSOrigins  []string
	UploadDir    string
	CookieSecure bool
}

func get(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func Load() Config {
	return Config{
		Port:         get("PORT", "8080"),
		DatabaseURL:  get("DATABASE_URL", "postgres://bisapns:bisapns@localhost:5432/bisapns?sslmode=disable"),
		JWTSecret:    get("JWT_SECRET", "ganti-dengan-secret-panjang-dan-acak"),
		AppEnv:       get("APP_ENV", "development"),
		CORSOrigins:  strings.Split(get("CORS_ORIGINS", "http://localhost:3000"), ","),
		UploadDir:    get("UPLOAD_DIR", "./uploads"),
		CookieSecure: get("COOKIE_SECURE", "false") == "true",
	}
}

func (c Config) IsDev() bool { return c.AppEnv != "production" }
