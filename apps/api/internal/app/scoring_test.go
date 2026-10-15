package app

import "testing"

func w(n int) *int { return &n }

func build(sub string, n int, weight *int, max int) []ScoreItem {
	out := make([]ScoreItem, n)
	for i := range out {
		out[i] = ScoreItem{Subtest: sub, ChosenWeight: weight, MaxWeight: max}
	}
	return out
}

var defaultPG = PassingGrade{TWK: 65, TIU: 80, TKP: 166}

func TestScoreAllEmpty(t *testing.T) {
	items := append(append(build("TWK", 30, nil, 5), build("TIU", 35, nil, 5)...), build("TKP", 45, nil, 5)...)
	r := Score(items, defaultPG)
	if r.Total != 0 || r.Empty != 110 || r.Passed {
		t.Fatalf("hasil tidak sesuai: %+v", r)
	}
}

func TestScoreAllCorrect(t *testing.T) {
	items := append(append(build("TWK", 30, w(5), 5), build("TIU", 35, w(5), 5)...), build("TKP", 45, w(5), 5)...)
	r := Score(items, defaultPG)
	if r.TWK != 150 || r.TIU != 175 || r.TKP != 225 || r.Total != 550 || !r.Passed || r.Correct != 110 {
		t.Fatalf("hasil tidak sesuai: %+v", r)
	}
}

func TestScoreFailOneSubtest(t *testing.T) {
	// TWK 12 benar = 60 (< 65) walaupun subtes lain tinggi -> tidak lulus
	items := append(build("TWK", 12, w(5), 5), build("TWK", 18, w(0), 5)...)
	items = append(items, build("TIU", 35, w(5), 5)...)
	items = append(items, build("TKP", 45, w(5), 5)...)
	r := Score(items, defaultPG)
	if r.TWK != 60 || r.Passed || r.Wrong != 18 {
		t.Fatalf("hasil tidak sesuai: %+v", r)
	}
}

func TestScoreExactPassingGrade(t *testing.T) {
	items := append(build("TWK", 13, w(5), 5), build("TIU", 16, w(5), 5)...)
	items = append(items, build("TKP", 1, w(1), 5)...)
	items = append(items, build("TKP", 33, w(5), 5)...) // 1 + 165 = 166
	r := Score(items, defaultPG)
	if r.TWK != 65 || r.TIU != 80 || r.TKP != 166 || !r.Passed {
		t.Fatalf("tepat di ambang batas harus lulus: %+v", r)
	}
}

func TestScoreTotalThreshold(t *testing.T) {
	items := append(build("TWK", 13, w(5), 5), build("TIU", 16, w(5), 5)...)
	items = append(items, build("TKP", 34, w(5), 5)...)
	r := Score(items, PassingGrade{TWK: 65, TIU: 80, TKP: 166, Total: 400})
	if r.Passed {
		t.Fatalf("total di bawah ambang harus tidak lulus: %+v", r)
	}
}
