// Perintah seed mengisi database dengan data contoh (idempoten).
package main

import (
	"context"
	"log"

	"bisapns/api/internal/config"
	"bisapns/api/internal/db"
	"bisapns/api/internal/seed"
)

func main() {
	ctx := context.Background()
	cfg := config.Load()
	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("gagal terhubung ke database: %v", err)
	}
	defer pool.Close()
	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrasi gagal: %v", err)
	}
	if err := seed.Run(ctx, pool); err != nil {
		log.Fatalf("seed gagal: %v", err)
	}
	log.Println("seed selesai")
}
