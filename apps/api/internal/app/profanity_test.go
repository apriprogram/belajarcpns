package app

import "testing"

func TestCensor(t *testing.T) {
	cases := map[string]string{
		"dasar anjing kamu":        "dasar ****** kamu",
		"BANGSAT!":                 "*******!",
		"bangsaaat lu":             "********* lu",
		"4nj1ng banget":            "****** banget",
		"tolol bego":               "***** ****",
		"what the fuck, shit":      "what the ****, ****",
		"asumsi saya taiwan cocok": "asumsi saya taiwan cocok", // bukan kata kasar
		"semangat belajar TIU":     "semangat belajar TIU",
		"":                         "",
		"kata kasar: goblok.":      "kata kasar: ******.",
	}
	for in, want := range cases {
		if got := censor(in); got != want {
			t.Errorf("censor(%q) = %q, want %q", in, got, want)
		}
	}
}
