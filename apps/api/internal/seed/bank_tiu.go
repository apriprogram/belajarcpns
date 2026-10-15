package seed

import (
	"fmt"
	"math/rand/v2"
	"strconv"
)

// Soal TIU verbal & logika ditulis manual.
var tiuManual = []sq{
	// ---- Analogi ----
	{Sub: "TIU", Cat: "Verbal – Analogi", Diff: "mudah", Body: "DOKTER : RUMAH SAKIT = GURU : ...",
		Opts: [5]string{"Murid", "Sekolah", "Buku", "Pelajaran", "Kapur"}, Key: 1,
		Exp: "Dokter bekerja di rumah sakit; guru bekerja di sekolah (hubungan profesi–tempat kerja)."},
	{Sub: "TIU", Cat: "Verbal – Analogi", Diff: "mudah", Body: "AIR : HAUS = MAKANAN : ...",
		Opts: [5]string{"Kenyang", "Lapar", "Piring", "Lezat", "Minum"}, Key: 1,
		Exp: "Air menghilangkan haus; makanan menghilangkan lapar."},
	{Sub: "TIU", Cat: "Verbal – Analogi", Diff: "sedang", Body: "PADI : LUMBUNG = UANG : ...",
		Opts: [5]string{"Dompet", "Bank", "Pasar", "Kaya", "Koin"}, Key: 1,
		Exp: "Padi disimpan dalam jumlah besar di lumbung; uang disimpan dalam jumlah besar di bank."},
	{Sub: "TIU", Cat: "Verbal – Analogi", Diff: "sedang", Body: "TERMOMETER : SUHU = BAROMETER : ...",
		Opts: [5]string{"Kelembapan", "Tekanan udara", "Kecepatan angin", "Curah hujan", "Ketinggian"}, Key: 1,
		Exp: "Termometer mengukur suhu; barometer mengukur tekanan udara."},
	{Sub: "TIU", Cat: "Verbal – Analogi", Diff: "sedang", Body: "KAYU : MEJA = BENANG : ...",
		Opts: [5]string{"Jarum", "Kain", "Penjahit", "Gulungan", "Warna"}, Key: 1,
		Exp: "Meja dibuat dari kayu; kain dibuat dari benang (bahan–hasil)."},
	{Sub: "TIU", Cat: "Verbal – Analogi", Diff: "sulit", Body: "MURAH : MAHAL = ... : ...",
		Opts: [5]string{"Cepat : lekas", "Rajin : tekun", "Hemat : boros", "Indah : cantik", "Besar : luas"}, Key: 2,
		Exp: "Murah–mahal adalah antonim; pasangan antonim yang sesuai adalah hemat–boros."},
	{Sub: "TIU", Cat: "Verbal – Analogi", Diff: "sulit", Body: "SEMUT : SERANGGA = ... : ...",
		Opts: [5]string{"Ikan : air", "Paus : mamalia", "Burung : sayap", "Kucing : tikus", "Ular : bisa"}, Key: 1,
		Exp: "Semut termasuk golongan serangga; paus termasuk golongan mamalia (anggota–kelompok)."},

	// ---- Silogisme ----
	{Sub: "TIU", Cat: "Verbal – Silogisme", Diff: "mudah",
		Body: "Semua pegawai wajib mengikuti apel pagi. Rina adalah pegawai. Kesimpulan yang tepat adalah ...",
		Opts: [5]string{"Rina tidak wajib mengikuti apel pagi", "Rina wajib mengikuti apel pagi", "Sebagian pegawai tidak mengikuti apel pagi", "Rina mungkin mengikuti apel pagi", "Tidak dapat disimpulkan"}, Key: 1,
		Exp: "Silogisme kategoris: semua A adalah B; Rina adalah A, maka Rina adalah B."},
	{Sub: "TIU", Cat: "Verbal – Silogisme", Diff: "sedang",
		Body: "Jika hujan turun, jalan menjadi basah. Jalan tidak basah. Kesimpulan yang tepat adalah ...",
		Opts: [5]string{"Hujan turun", "Hujan tidak turun", "Jalan kering karena panas", "Hujan turun tetapi jalan tidak basah", "Tidak dapat disimpulkan"}, Key: 1,
		Exp: "Modus tollens: jika p maka q; bukan q, maka bukan p."},
	{Sub: "TIU", Cat: "Verbal – Silogisme", Diff: "sedang",
		Body: "Jika Andi rajin belajar, ia lulus ujian. Jika Andi lulus ujian, ia diterima bekerja. Kesimpulan yang tepat adalah ...",
		Opts: [5]string{"Jika Andi diterima bekerja, ia rajin belajar", "Jika Andi rajin belajar, ia diterima bekerja", "Andi tidak rajin belajar", "Jika Andi tidak lulus ujian, ia tidak rajin belajar dan tidak diterima bekerja", "Andi lulus ujian"}, Key: 1,
		Exp: "Silogisme hipotetis: p → q dan q → r, maka p → r."},
	{Sub: "TIU", Cat: "Verbal – Silogisme", Diff: "sedang",
		Body: "Semua peserta yang lulus SKD mengikuti SKB. Sebagian peserta yang mengikuti SKB berasal dari luar kota. Kesimpulan yang pasti benar adalah ...",
		Opts: [5]string{"Semua peserta dari luar kota lulus SKD", "Sebagian peserta yang lulus SKD berasal dari luar kota", "Semua peserta yang mengikuti SKB lulus SKD", "Tidak ada peserta luar kota yang lulus SKD", "Tidak dapat ditarik kesimpulan yang pasti"}, Key: 4,
		Exp: "Peserta SKB dari luar kota belum tentu termasuk kelompok yang lulus SKD, sehingga tidak ada kesimpulan yang pasti."},
	{Sub: "TIU", Cat: "Verbal – Silogisme", Diff: "sulit",
		Body: "Tidak ada pejabat yang boleh menerima gratifikasi. Sebagian pegawai di kantor X adalah pejabat. Kesimpulan yang tepat adalah ...",
		Opts: [5]string{"Semua pegawai kantor X boleh menerima gratifikasi", "Sebagian pegawai kantor X tidak boleh menerima gratifikasi", "Tidak ada pegawai kantor X yang boleh menerima gratifikasi", "Sebagian pejabat boleh menerima gratifikasi", "Semua pegawai kantor X adalah pejabat"}, Key: 1,
		Exp: "Pegawai kantor X yang merupakan pejabat termasuk kelompok yang tidak boleh menerima gratifikasi."},
	{Sub: "TIU", Cat: "Verbal – Silogisme", Diff: "sulit",
		Body: "Jika anggaran disetujui, proyek dimulai bulan depan. Proyek tidak dimulai bulan depan atau tim ditambah. Anggaran disetujui. Kesimpulan yang tepat adalah ...",
		Opts: [5]string{"Proyek tidak dimulai", "Tim ditambah", "Tim tidak ditambah", "Anggaran ditolak", "Proyek ditunda"}, Key: 1,
		Exp: "Anggaran disetujui → proyek dimulai (modus ponens). Dari \"tidak dimulai atau tim ditambah\" dan proyek dimulai, maka tim ditambah (silogisme disjungtif)."},

	// ---- Figural / Logika ----
	{Sub: "TIU", Cat: "Figural/Logika", Diff: "sedang",
		Body: "Lima orang duduk berjajar. Budi duduk di sebelah kanan Ani. Cici duduk paling kiri. Dedi duduk di antara Cici dan Ani. Eko duduk paling kanan. Siapa yang duduk di tengah?",
		Opts: [5]string{"Ani", "Budi", "Cici", "Dedi", "Eko"}, Key: 0,
		Exp: "Urutan dari kiri: Cici, Dedi, Ani, Budi, Eko. Posisi tengah (ketiga) adalah Ani."},
	{Sub: "TIU", Cat: "Figural/Logika", Diff: "sedang",
		Body: "Tinggi badan Rani lebih dari Sinta. Tinggi badan Tika kurang dari Sinta. Ulfa lebih tinggi daripada Rani. Siapa yang paling pendek?",
		Opts: [5]string{"Rani", "Sinta", "Tika", "Ulfa", "Tidak dapat ditentukan"}, Key: 2,
		Exp: "Urutan dari tertinggi: Ulfa > Rani > Sinta > Tika. Paling pendek adalah Tika."},
	{Sub: "TIU", Cat: "Figural/Logika", Diff: "sulit",
		Body: "Sebuah kubus dicat merah pada seluruh permukaannya, lalu dipotong menjadi 27 kubus kecil yang sama besar. Banyaknya kubus kecil yang tepat memiliki dua sisi berwarna merah adalah ...",
		Opts: [5]string{"6", "8", "12", "18", "24"}, Key: 2,
		Exp: "Kubus kecil dengan dua sisi merah berada di tengah setiap rusuk: 12 rusuk × 1 = 12."},
}

// ---- Generator TIU numerik (deterministik) ----

// distractors membuat 4 pengecoh unik dari jawaban integer.
func distractors(r *rand.Rand, ans int, step int) []int {
	if step < 1 {
		step = 1
	}
	cands := []int{ans + step, ans - step, ans + 2*step, ans - 2*step, ans + 1, ans - 1, ans + 3*step, ans + step + 1, ans * 2, ans + 10}
	seen := map[int]bool{ans: true}
	out := []int{}
	r.Shuffle(len(cands), func(i, j int) { cands[i], cands[j] = cands[j], cands[i] })
	for _, c := range cands {
		if c > 0 && !seen[c] {
			seen[c] = true
			out = append(out, c)
			if len(out) == 4 {
				break
			}
		}
	}
	for k := 3; len(out) < 4; k++ {
		if !seen[ans+k*7] {
			seen[ans+k*7] = true
			out = append(out, ans+k*7)
		}
	}
	return out
}

// mcq menempatkan jawaban benar di posisi acak di antara pengecoh.
func mcq(r *rand.Rand, ans string, wrong []string) ([5]string, int) {
	key := r.IntN(5)
	var opts [5]string
	w := 0
	for i := 0; i < 5; i++ {
		if i == key {
			opts[i] = ans
		} else {
			opts[i] = wrong[w]
			w++
		}
	}
	return opts, key
}

func intsToStr(xs []int) []string {
	out := make([]string, len(xs))
	for i, x := range xs {
		out[i] = formatInt(x)
	}
	return out
}

// formatInt memakai titik sebagai pemisah ribuan (gaya Indonesia).
func formatInt(n int) string {
	s := strconv.Itoa(n)
	neg := false
	if n < 0 {
		neg, s = true, s[1:]
	}
	out := ""
	for i, ch := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			out += "."
		}
		out += string(ch)
	}
	if neg {
		return "-" + out
	}
	return out
}

func seqStr(xs []int) string {
	s := ""
	for i, x := range xs {
		if i > 0 {
			s += ", "
		}
		s += strconv.Itoa(x)
	}
	return s
}

func numQ(r *rand.Rand, cat, diff, body string, ans, step int, exp string) sq {
	opts, key := mcq(r, formatInt(ans), intsToStr(distractors(r, ans, step)))
	return sq{Sub: "TIU", Cat: cat, Diff: diff, Body: body, Opts: opts, Key: key, Exp: exp}
}

func generateTIU() []sq {
	r := rand.New(rand.NewPCG(2027, 110))
	out := []sq{}
	const deret, arit = "Numerik – Deret Angka", "Numerik – Aritmatika"

	// Deret aritmetika
	for _, p := range [][2]int{{3, 4}, {12, 7}} {
		a, d := p[0], p[1]
		xs := []int{a, a + d, a + 2*d, a + 3*d, a + 4*d}
		ans := a + 5*d
		out = append(out, numQ(r, deret, "mudah", fmt.Sprintf("Bilangan berikutnya dari deret %s, ... adalah ...", seqStr(xs)), ans, d,
			fmt.Sprintf("Setiap suku bertambah %d, sehingga %d + %d = %d.", d, xs[4], d, ans)))
	}
	// Deret geometri
	for _, p := range [][2]int{{2, 3}, {5, 2}} {
		a, k := p[0], p[1]
		xs := []int{a}
		for i := 1; i < 5; i++ {
			xs = append(xs, xs[i-1]*k)
		}
		ans := xs[4] * k
		out = append(out, numQ(r, deret, "sedang", fmt.Sprintf("Bilangan berikutnya dari deret %s, ... adalah ...", seqStr(xs)), ans, xs[4],
			fmt.Sprintf("Setiap suku dikali %d, sehingga %d × %d = %d.", k, xs[4], k, ans)))
	}
	// Selisih bertingkat
	{
		xs := []int{2, 5, 10, 17, 26}
		ans := 37
		out = append(out, numQ(r, deret, "sedang", fmt.Sprintf("Bilangan berikutnya dari deret %s, ... adalah ...", seqStr(xs)), ans, 2,
			"Selisih antarsuku 3, 5, 7, 9 (bilangan ganjil berurutan), selisih berikutnya 11, sehingga 26 + 11 = 37."))
	}
	// Deret selang-seling (dua pola)
	{
		xs := []int{4, 20, 7, 18, 10, 16, 13}
		ans := 14
		out = append(out, numQ(r, deret, "sulit", fmt.Sprintf("Bilangan berikutnya dari deret %s, ... adalah ...", seqStr(xs)), ans, 3,
			"Ada dua pola: suku ganjil 4, 7, 10, 13 (+3) dan suku genap 20, 18, 16 (−2). Suku berikutnya pola genap: 16 − 2 = 14."))
	}
	// Fibonacci
	{
		xs := []int{1, 3, 4, 7, 11, 18}
		ans := 29
		out = append(out, numQ(r, deret, "sulit", fmt.Sprintf("Bilangan berikutnya dari deret %s, ... adalah ...", seqStr(xs)), ans, 4,
			"Setiap suku adalah jumlah dua suku sebelumnya: 11 + 18 = 29."))
	}

	// Aritmatika dasar
	for _, p := range [][3]int{{24, 15, 85}} {
		a, b, c := p[0], p[1], p[2]
		ans := a*b - c
		out = append(out, numQ(r, arit, "mudah", fmt.Sprintf("Hasil dari %d × %d − %d adalah ...", a, b, c), ans, 10,
			fmt.Sprintf("%d × %d = %d; %d − %d = %d.", a, b, a*b, a*b, c, ans)))
	}
	// Persen
	for _, p := range [][2]int{{15, 480}} {
		pc, n := p[0], p[1]
		ans := pc * n / 100
		out = append(out, numQ(r, arit, "mudah", fmt.Sprintf("%d%% dari %s adalah ...", pc, formatInt(n)), ans, 6,
			fmt.Sprintf("%d/100 × %s = %s.", pc, formatInt(n), formatInt(ans))))
	}
	// Kecepatan
	{
		v, t := 60, 3
		d := v*t + v/2
		ans := v
		out = append(out, numQ(r, arit, "sedang", fmt.Sprintf("Sebuah mobil menempuh jarak %d km dalam waktu 3 jam 30 menit. Kecepatan rata-rata mobil tersebut adalah ... km/jam.", d), ans, 5,
			fmt.Sprintf("Kecepatan = jarak ÷ waktu = %d ÷ 3,5 = %d km/jam.", d, ans)))
		_ = t
	}
	// Rata-rata
	{
		xs := []int{72, 85, 90, 64, 79}
		sum := 0
		for _, x := range xs {
			sum += x
		}
		ans := sum / len(xs)
		out = append(out, numQ(r, arit, "mudah", fmt.Sprintf("Nilai ujian lima peserta adalah %s. Rata-rata nilai mereka adalah ...", seqStr(xs)), ans, 2,
			fmt.Sprintf("Jumlah nilai = %d; rata-rata = %d ÷ 5 = %d.", sum, sum, ans)))
	}
	// Pekerjaan (perbandingan berbalik nilai)
	{
		w1, d1, w2 := 6, 12, 9
		ans := w1 * d1 / w2
		out = append(out, numQ(r, arit, "sedang", fmt.Sprintf("Suatu pekerjaan dapat diselesaikan oleh %d orang dalam %d hari. Jika dikerjakan oleh %d orang, pekerjaan tersebut selesai dalam ... hari.", w1, d1, w2), ans, 2,
			fmt.Sprintf("Perbandingan berbalik nilai: %d × %d = %d × x, sehingga x = %d hari.", w1, d1, w2, ans)))
	}
	// Perbandingan
	{
		a, b, total := 3, 5, 640000
		ans := total * b / (a + b)
		out = append(out, numQ(r, arit, "sedang", fmt.Sprintf("Perbandingan uang Ali dan Badu adalah %d : %d. Jika jumlah uang mereka Rp%s, uang Badu adalah Rp ...", a, b, formatInt(total)), ans, 40000,
			fmt.Sprintf("Uang Badu = %d/%d × %s = %s.", b, a+b, formatInt(total), formatInt(ans))))
	}
	{
		age, diff := 4, 27 // ayah 4x anak, selisih 27 tahun
		child := diff / (age - 1)
		ans := child * age
		out = append(out, numQ(r, arit, "sulit", fmt.Sprintf("Umur ayah %d kali umur anaknya. Selisih umur mereka %d tahun. Umur ayah sekarang adalah ... tahun.", age, diff), ans, 4,
			fmt.Sprintf("Misal umur anak x, maka %dx − x = %d → x = %d. Umur ayah = %d × %d = %d tahun.", age, diff, child, age, child, ans)))
	}
	{
		// skala peta
		cm, scale := 8, 250000
		ans := cm * scale / 100000
		out = append(out, numQ(r, arit, "sedang", fmt.Sprintf("Jarak dua kota pada peta berskala 1 : %s adalah %d cm. Jarak sebenarnya adalah ... km.", formatInt(scale), cm), ans, 3,
			fmt.Sprintf("%d cm × %s = %s cm = %d km.", cm, formatInt(scale), formatInt(cm*scale), ans)))
	}
	{
		// harga diskon
		price, disc := 250000, 20
		ans := price * (100 - disc) / 100
		out = append(out, numQ(r, arit, "mudah", fmt.Sprintf("Harga sebuah tas Rp%s mendapat diskon %d%%. Harga yang harus dibayar adalah Rp ...", formatInt(price), disc), ans, 25000,
			fmt.Sprintf("Diskon = %d%% × %s = %s; harga bayar = %s.", disc, formatInt(price), formatInt(price*disc/100), formatInt(ans))))
	}
	{
		// perbandingan senilai
		k1, p1, k2 := 4, 30000, 10
		ans := p1 / k1 * k2
		out = append(out, numQ(r, arit, "mudah", fmt.Sprintf("Harga %d buku tulis adalah Rp%s. Harga %d buku tulis yang sama adalah Rp ...", k1, formatInt(p1), k2), ans, 7500,
			fmt.Sprintf("Harga satu buku = %s ÷ %d = %s; %d buku = %s.", formatInt(p1), k1, formatInt(p1/k1), k2, formatInt(ans))))
	}
	{
		// pecahan → ditulis sebagai teks
		opts, key := mcq(r, "5/6", []string{"2/5", "1/6", "2/3", "3/4"})
		out = append(out, sq{Sub: "TIU", Cat: arit, Diff: "mudah", Body: "Hasil dari 1/2 + 1/3 adalah ...", Opts: opts, Key: key,
			Exp: "Samakan penyebut: 3/6 + 2/6 = 5/6."})
	}
	{
		opts, key := mcq(r, "8 : 15", []string{"2 : 5", "6 : 15", "8 : 12", "4 : 5"})
		out = append(out, sq{Sub: "TIU", Cat: arit, Diff: "sulit", Body: "Jika x : y = 2 : 3 dan y : z = 4 : 5, maka x : z adalah ...", Opts: opts, Key: key,
			Exp: "Samakan nilai y: x : y = 8 : 12 dan y : z = 12 : 15, sehingga x : z = 8 : 15."})
	}
	return out
}
