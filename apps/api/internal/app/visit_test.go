package app

import (
	"net/http/httptest"
	"testing"
)

func TestVisitCountry(t *testing.T) {
	cases := []struct{ hdr, val, want string }{
		{"CF-IPCountry", "sg", "SG"},
		{"Accept-Language", "id-ID,id;q=0.9,en;q=0.8", "ID"},
		{"Accept-Language", "en-US,en;q=0.9", "US"},
		{"Accept-Language", "id", "ID"},
		{"Accept-Language", "fr", "ZZ"},
		{"CF-IPCountry", "XX", "ZZ"},
	}
	for _, c := range cases {
		r := httptest.NewRequest("POST", "/api/track", nil)
		r.Header.Set(c.hdr, c.val)
		if got := visitCountry(r); got != c.want {
			t.Errorf("%s=%q → %s, mau %s", c.hdr, c.val, got, c.want)
		}
	}
}

func TestVisitDevice(t *testing.T) {
	for ua, want := range map[string]string{
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148":       "mobile",
		"Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit Mobile Safari/537.36": "mobile",
		"Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit Safari/537.36":         "tablet",
		"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":                              "tablet",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0":                     "desktop",
	} {
		if got := visitDevice(ua); got != want {
			t.Errorf("%q → %s, mau %s", ua, got, want)
		}
	}
}
