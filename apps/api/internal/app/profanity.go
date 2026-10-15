package app

import (
	"regexp"
	"strings"
	"unicode/utf8"
)

// Daftar kata kasar (Indonesia, daerah umum, Inggris). Dicocokkan per kata utuh, tanpa memedulikan
// huruf besar/kecil, huruf yang diulang ("bangsaaat"), dan angka/simbol pengganti ("4nj1ng").
var badWords = []string{
	// Indonesia
	"anjing", "anjeng", "anjir", "anjrit", "anjg", "njing", "bangsat", "bajingan", "brengsek", "berengsek",
	"kampret", "keparat", "bedebah", "sialan", "babi", "monyet", "goblok", "goblog", "tolol", "bego", "bodoh",
	"idiot", "dungu", "kontol", "kntl", "memek", "mmk", "ngentot", "ngentod", "entot", "jembut", "pepek",
	"peler", "titit", "pantek", "pukimak", "lonte", "pelacur", "perek", "jablay", "bencong", "tai", "taik",
	"asu", "jancok", "jancuk", "cok", "dancok", "matamu", "ndasmu", "kimak", "puki", "bacot", "bacod",
	// Inggris
	"fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit", "bitch", "asshole", "bastard", "dick",
	"pussy", "cunt", "slut", "whore", "wtf", "stfu",
}

// Pengganti umum angka/simbol untuk huruf.
var leet = map[rune]string{
	'a': "a4@", 'i': "i1!|", 'o': "o0", 'e': "e3", 's': "s5$", 't': "t7", 'g': "g9", 'b': "b8", 'l': "l1|",
}

var profanityRe = buildProfanityRe()

func buildProfanityRe() *regexp.Regexp {
	alts := make([]string, 0, len(badWords))
	for _, w := range badWords {
		var b strings.Builder
		for _, r := range w {
			set := string(r)
			if l, ok := leet[r]; ok {
				set = l
			}
			b.WriteString("[" + regexp.QuoteMeta(set) + "]+")
		}
		alts = append(alts, b.String())
	}
	// grup 1: awal/ pemisah · grup 2: kata kasar · grup 3: akhir/ pemisah
	return regexp.MustCompile(`(?i)(^|[^\p{L}\p{N}])(` + strings.Join(alts, "|") + `)([^\p{L}\p{N}]|$)`)
}

// censor mengganti setiap kata kasar dengan bintang sepanjang kata tersebut.
func censor(s string) string {
	if s == "" {
		return s
	}
	// Ulangi karena pemisah yang sama bisa dipakai dua kata berdampingan ("tolol bego").
	for i := 0; i < 4; i++ {
		locs := profanityRe.FindAllStringSubmatchIndex(s, -1)
		if len(locs) == 0 {
			break
		}
		var b strings.Builder
		last := 0
		for _, m := range locs {
			start, end := m[4], m[5] // grup 2
			b.WriteString(s[last:start])
			b.WriteString(strings.Repeat("*", utf8.RuneCountInString(s[start:end])))
			last = end
		}
		b.WriteString(s[last:])
		s = b.String()
	}
	return s
}
