// Perintah api menjalankan server HTTP BISA-PNS.
package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"bisapns/api/internal/app"
	"bisapns/api/internal/config"
	"bisapns/api/internal/db"
	"bisapns/api/internal/seed"
)

func main() {
	seedFlag := flag.Bool("seed", os.Getenv("SEED") == "true", "isi data contoh sebelum server berjalan (atau SEED=true)")
	flag.Parse()

	cfg := config.Load()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("gagal terhubung ke database: %v", err)
	}
	defer pool.Close()
	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrasi gagal: %v", err)
	}
	if *seedFlag {
		if err := seed.Run(ctx, pool); err != nil {
			log.Fatalf("seed gagal: %v", err)
		}
	}

	srv := app.New(pool, cfg)
	srv.StartAutoSubmitter(ctx)
	srv.StartChatJanitor(ctx)

	httpSrv := &http.Server{
		Addr:              cfg.Host + ":" + cfg.Port,
		Handler:           srv.Router(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}
	go func() {
		log.Printf("BISA-PNS API berjalan di :%s (env=%s)", cfg.Port, cfg.AppEnv)
		if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server berhenti: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("mematikan server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := httpSrv.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown tidak bersih: %v", err)
	}
}
