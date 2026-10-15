package app

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"bisapns/api/internal/auth"
	"bisapns/api/internal/httpx"
	"github.com/gin-gonic/gin"
)

// Statistik pengunjung (docs/VISITORS.md).
// POST /api/track (publik): catat 1 page view anonim (tanpa IP).
// GET  /api/admin/visits/stats (admin): total/hari ini/minggu/bulan/tahun, tren, negara, halaman, perangkat.

var (
	botRe     = regexp.MustCompile(`(?i)bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget|python|httpclient|go-http`)
	tabletRe  = regexp.MustCompile(`(?i)ipad|tablet|kindle|silk|playbook`)
	mobileRe  = regexp.MustCompile(`(?i)mobi|iphone|ipod|windows phone|blackberry|opera mini`)
	androidRe = regexp.MustCompile(`(?i)android`)
	countryRe = regexp.MustCompile(`^[A-Z]{2}$`)
	langRe    = regexp.MustCompile(`(?i)^[a-z]{2,3}[-_]([a-z]{2})\b`)
)

// visitCountry: header negara dari CDN/reverse proxy (Cloudflare, Vercel, CloudFront, X-Country-Code dari proxy
// GeoIP) paling akurat. Tanpa itu dipakai wilayah Accept-Language (mis. id-ID → ID) sebagai perkiraan; lainnya "ZZ".
func visitCountry(r *http.Request) string {
	for _, h := range []string{"CF-IPCountry", "X-Vercel-IP-Country", "CloudFront-Viewer-Country", "X-Country-Code", "X-Geo-Country"} {
		v := strings.ToUpper(strings.TrimSpace(r.Header.Get(h)))
		if countryRe.MatchString(v) && v != "XX" && v != "T1" {
			return v
		}
	}
	al := strings.TrimSpace(strings.Split(r.Header.Get("Accept-Language"), ",")[0])
	if m := langRe.FindStringSubmatch(al); m != nil {
		return strings.ToUpper(m[1])
	}
	if strings.HasPrefix(strings.ToLower(al), "id") {
		return "ID"
	}
	return "ZZ"
}

func visitDevice(ua string) string {
	switch {
	case tabletRe.MatchString(ua), androidRe.MatchString(ua) && !mobileRe.MatchString(ua):
		return "tablet"
	case mobileRe.MatchString(ua):
		return "mobile"
	}
	return "desktop"
}

func (s *Server) trackVisit(c *gin.Context) {
	var in struct {
		VisitorID string `json:"visitor_id"`
		Path      string `json:"path"`
		Referrer  string `json:"referrer"`
	}
	if err := c.ShouldBindJSON(&in); err != nil || len(in.VisitorID) < 8 || len(in.VisitorID) > 80 {
		c.Status(http.StatusNoContent)
		return
	}
	ua := c.GetHeader("User-Agent")
	path := strings.TrimSpace(in.Path)
	if botRe.MatchString(ua) || !strings.HasPrefix(path, "/") || strings.HasPrefix(path, "/admin") || strings.HasPrefix(path, "/api") {
		c.Status(http.StatusNoContent)
		return
	}
	if i := strings.IndexAny(path, "?#"); i >= 0 {
		path = path[:i]
	}
	if len(path) > 300 {
		path = path[:300]
	}
	ref := strings.TrimSpace(in.Referrer)
	if len(ref) > 300 {
		ref = ref[:300]
	}
	sum := sha256.Sum256([]byte("bisapns-visitor:" + in.VisitorID))
	var uid any
	if tok, _ := c.Cookie(auth.AccessCookie); tok != "" {
		if cl, err := s.Auth.Parse(tok); err == nil && cl.Subject != "" {
			uid = cl.Subject
		}
	}
	if _, err := s.DB.Exec(c, `INSERT INTO site_visits(visitor, path, referrer, country, device, user_id) VALUES ($1,$2,$3,$4,$5,$6)`,
		hex.EncodeToString(sum[:])[:32], path, ref, visitCountry(c.Request), visitDevice(ua), uid); err != nil {
		httpx.Internal(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type visitCount struct {
	Views    int `json:"views"`
	Visitors int `json:"visitors"`
}

type visitBucket struct {
	Key      string `json:"key"`
	Label    string `json:"label"`
	Views    int    `json:"views"`
	Visitors int    `json:"visitors"`
}

type visitGroup struct {
	Key      string `json:"key"`
	Views    int    `json:"views"`
	Visitors int    `json:"visitors"`
}

// adminVisitStats: ?granularity=harian|mingguan|bulanan|tahunan untuk tren. Semua perhitungan dalam WIB.
func (s *Server) adminVisitStats(c *gin.Context) {
	const day = `date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta')`
	start := func(unit string) string {
		return `created_at >= date_trunc('` + unit + `', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'`
	}
	conds := map[string]string{
		"all":       "true",
		"today":     start("day"),
		"yesterday": `created_at >= (` + day + ` - interval '1 day') AT TIME ZONE 'Asia/Jakarta' AND created_at < ` + day + ` AT TIME ZONE 'Asia/Jakarta'`,
		"week":      start("week"),
		"month":     start("month"),
		"year":      start("year"),
	}
	totals := map[string]visitCount{}
	for key, cond := range conds {
		var v visitCount
		if err := s.DB.QueryRow(c, `SELECT count(*), count(DISTINCT visitor) FROM site_visits WHERE `+cond).Scan(&v.Views, &v.Visitors); err != nil {
			httpx.Internal(c, err)
			return
		}
		totals[key] = v
	}

	gran := c.DefaultQuery("granularity", "harian")
	unit, n, keyFmt, labelFmt := "day", 30, "YYYY-MM-DD", "DD/MM"
	switch gran {
	case "mingguan":
		unit, n, keyFmt, labelFmt = "week", 12, "IYYY-IW", `"Mg "IW`
	case "bulanan":
		unit, n, keyFmt, labelFmt = "month", 12, "YYYY-MM", "MM/YY"
	case "tahunan":
		unit, n, keyFmt, labelFmt = "year", 5, "YYYY", "YYYY"
	default:
		gran = "harian"
	}
	rows, err := s.DB.Query(c, `
		WITH b AS (
		  SELECT generate_series(date_trunc('`+unit+`', now() AT TIME ZONE 'Asia/Jakarta') - ($1::int - 1) * interval '1 `+unit+`',
		                         date_trunc('`+unit+`', now() AT TIME ZONE 'Asia/Jakarta'), interval '1 `+unit+`') AS k)
		SELECT to_char(b.k, '`+keyFmt+`'), to_char(b.k, '`+labelFmt+`'), count(v.id), count(DISTINCT v.visitor)
		FROM b LEFT JOIN site_visits v ON date_trunc('`+unit+`', v.created_at AT TIME ZONE 'Asia/Jakarta') = b.k
		GROUP BY b.k ORDER BY b.k`, n)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	series := []visitBucket{}
	for rows.Next() {
		var x visitBucket
		if err := rows.Scan(&x.Key, &x.Label, &x.Views, &x.Visitors); err != nil {
			rows.Close()
			httpx.Internal(c, err)
			return
		}
		series = append(series, x)
	}
	rows.Close()

	group := func(col string, limit int) ([]visitGroup, error) {
		rs, err := s.DB.Query(c, `SELECT `+col+`, count(*), count(DISTINCT visitor) FROM site_visits GROUP BY 1 ORDER BY 3 DESC, 2 DESC LIMIT `+strconv.Itoa(limit))
		if err != nil {
			return nil, err
		}
		defer rs.Close()
		list := []visitGroup{}
		for rs.Next() {
			var g visitGroup
			if err := rs.Scan(&g.Key, &g.Views, &g.Visitors); err != nil {
				return nil, err
			}
			list = append(list, g)
		}
		return list, rs.Err()
	}
	countries, err := group("country", 50)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	pages, err := group("path", 10)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	devices, err := group("device", 3)
	if err != nil {
		httpx.Internal(c, err)
		return
	}
	var online int
	_ = s.DB.QueryRow(c, `SELECT count(DISTINCT visitor) FROM site_visits WHERE created_at > now() - interval '5 minutes'`).Scan(&online)
	httpx.OK(c, gin.H{
		"totals": totals, "granularity": gran, "series": series,
		"countries": countries, "pages": pages, "devices": devices,
		"online_now": online, "generated_at": time.Now().UTC(),
	})
}
