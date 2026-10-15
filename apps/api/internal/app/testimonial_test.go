package app

import (
	"strings"
	"testing"
)

func TestNormalizeTestimonialContent(t *testing.T) {
	cases := map[string]string{
		"  halo  ":                 "halo",
		"a\r\nb":                   "a\nb",
		"a\n\n\n\n\nb":             "a\n\nb",
		"\n\nsatu\n\ndua\n\n":      "satu\n\ndua",
		"tanpa perubahan apa pun.": "tanpa perubahan apa pun.",
	}
	for in, want := range cases {
		if got := normalizeTestimonialContent(in); got != want {
			t.Errorf("normalizeTestimonialContent(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestValidateTestimonial(t *testing.T) {
	ok := "Latihannya sangat membantu persiapan SKD saya."
	for _, r := range []int{0, -1, 6} {
		f := v{}
		validateTestimonialRating(f, r)
		if f["rating"] == "" {
			t.Errorf("rating %d seharusnya ditolak", r)
		}
	}
	for r := 1; r <= 5; r++ {
		f := v{}
		validateTestimonialRating(f, r)
		if len(f) != 0 {
			t.Errorf("rating %d seharusnya valid", r)
		}
	}
	cases := []struct {
		content   string
		profanity bool
		wantErr   bool
	}{
		{ok, true, false},
		{"terlalu pendek", true, true},
		{strings.Repeat("a", 19), true, true},
		{strings.Repeat("a", 20), true, false},
		{strings.Repeat("é", 500), true, false}, // dihitung per karakter, bukan byte
		{strings.Repeat("a", 501), true, true},
		{"Soalnya bagus tapi admin goblok sekali", true, true},
		{"Soalnya bagus tapi admin goblok sekali", false, false}, // suntingan admin tidak dicek
	}
	for _, tc := range cases {
		f := v{}
		validateTestimonialContent(f, tc.content, tc.profanity)
		if got := f["content"] != ""; got != tc.wantErr {
			t.Errorf("validateTestimonialContent(%q, %v) error=%v, want %v (%q)", tc.content, tc.profanity, got, tc.wantErr, f["content"])
		}
	}
}
