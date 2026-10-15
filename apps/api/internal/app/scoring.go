package app

// Logika penilaian SKD dipisah agar mudah diuji.
// Skor setiap soal = bobot opsi yang dipilih.
//   - TWK/TIU: opsi benar berbobot 5, opsi lain 0 (dapat diatur admin per opsi).
//   - TKP    : setiap opsi berbobot 1–5.
// Soal kosong bernilai 0.

type ScoreItem struct {
	Subtest      string // TWK | TIU | TKP
	ChosenWeight *int   // nil = tidak dijawab
	MaxWeight    int    // bobot tertinggi di antara opsi soal
}

type PassingGrade struct {
	TWK, TIU, TKP, Total int
}

type ScoreResult struct {
	TWK     int  `json:"score_twk"`
	TIU     int  `json:"score_tiu"`
	TKP     int  `json:"score_tkp"`
	Total   int  `json:"score_total"`
	Correct int  `json:"correct_count"`
	Wrong   int  `json:"wrong_count"`
	Empty   int  `json:"empty_count"`
	Passed  bool `json:"passed"`
}

func Score(items []ScoreItem, pg PassingGrade) ScoreResult {
	var r ScoreResult
	for _, it := range items {
		if it.ChosenWeight == nil {
			r.Empty++
			continue
		}
		w := *it.ChosenWeight
		if w < 0 {
			w = 0
		}
		switch it.Subtest {
		case "TWK":
			r.TWK += w
		case "TIU":
			r.TIU += w
		case "TKP":
			r.TKP += w
		}
		if it.MaxWeight > 0 && w == it.MaxWeight {
			r.Correct++
		} else {
			r.Wrong++
		}
	}
	r.Total = r.TWK + r.TIU + r.TKP
	r.Passed = r.TWK >= pg.TWK && r.TIU >= pg.TIU && r.TKP >= pg.TKP && r.Total >= pg.Total
	return r
}
