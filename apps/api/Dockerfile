# syntax=docker/dockerfile:1
# ---------- Tahap build ----------
FROM golang:1.25-alpine AS build
WORKDIR /src
RUN apk add --no-cache git ca-certificates
ENV CGO_ENABLED=0 GOOS=linux GOFLAGS=-trimpath

# go.sum sengaja tidak disertakan di repo, sehingga `go mod tidy` wajib dijalankan.
# Blok replace khusus sandbox (DEV-ONLY-REPLACE) dihapus bila masih ada.
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    sed -i '/DEV-ONLY-REPLACE-START/,/DEV-ONLY-REPLACE-END/d' go.mod \
 && go mod tidy \
 && go mod download \
 && go build -ldflags="-s -w" -o /out/api ./cmd/api \
 && go build -ldflags="-s -w" -o /out/seed ./cmd/seed

# ---------- Tahap runtime ----------
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata wget \
 && addgroup -S app && adduser -S -G app -H -s /sbin/nologin app \
 && mkdir -p /app/uploads && chown -R app:app /app
WORKDIR /app
COPY --from=build /out/api /out/seed /app/
ENV PORT=8080 \
    APP_ENV=production \
    UPLOAD_DIR=/app/uploads \
    TZ=Asia/Jakarta
USER app
VOLUME ["/app/uploads"]
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1
ENTRYPOINT ["/app/api"]
