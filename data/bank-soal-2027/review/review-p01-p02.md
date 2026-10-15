# Review bank soal SKD 2027: paket 1 & 2

Reviewer independen, 15 Okt 2026. Cakupan: `parts/p01-twk|tiu|tkp.json` dan `parts/p02-twk|tiu|tkp.json`
(204 soal teks). Soal figural tidak ditinjau karena sudah diverifikasi mesin.
Setelah perbaikan: `merge.py --paket 1,2` lalu `validate.py --paket 1,2` menghasilkan **0 ERROR, 0 PERINGATAN**.
Validasi seluruh paket (cek duplikat lintas paket) juga menghasilkan 0 ERROR.

## Cara kerja

- **TWK (60).** Semua soal dijawab buta lebih dahulu, baru dicocokkan dengan kunci. Fakta dicek ke teks
  UU 23/2019 dan UU 24/2009 (salinan peraturan.go.id), UU 3/2022 (pasal.id), KBBI daring (kbbi.kemendikdasmen.go.id),
  dan dokumen riset.
- **TIU teks (54).** Semua soal dijawab buta. Soal analitis diselesaikan dengan *brute force* permutasi (skrip
  `solve_p01.py` dan `solve_p02.py` di scratchpad). Semua soal numerik dihitung ulang, dan `verify.expr` dicek oleh
  `validate.py`. Untuk perbandingan kuantitatif, dicek apakah P = 2Q atau Q = 2P pernah benar.
- **TKP (90).** Urutan bobot 1..5 dibaca terhadap §4 riset. Huruf dan bobot di pembahasan dicek otomatis terhadap
  opsi. Regulasi yang dikutip dicocokkan dengan daftar §3. Isyarat panjang opsi diukur dengan skrip.

## Ringkasan

| Subtes | Diperiksa | Kunci/urutan bobot OK | Diubah | Jenis perubahan |
|---|---|---|---|---|
| TWK P01 | 30 | 30/30 kunci benar dan tunggal | 11 | isyarat "kunci = opsi terpanjang", 1 istilah tak baku di pembahasan, 2 pembahasan dilengkapi |
| TWK P02 | 30 | 30/30 kunci benar dan tunggal | 15 | isyarat "kunci = opsi terpanjang", 1 kutipan pasal dirapikan |
| TIU P01 | 27 | 27/27 (analitis unik; numerik dan PK benar) | 0 | – |
| TIU P02 | 27 | 27/27 | 2 | ejaan KBBI (SPIDOMETER), redaksi stem |
| TKP P01 | 45 | 45/45 urutan dapat dipertahankan | 19 | isyarat panjang opsi bobot 5 (teks opsi lain diperpanjang; bobot tidak berubah) |
| TKP P02 | 45 | 45/45 urutan dapat dipertahankan | 20 | idem |

Tidak ada kunci TWK/TIU yang salah. Tidak ada bobot TKP yang dipindah. Sebaran huruf kunci tidak berubah
(P01: A13 B15 C13 D13 E11; P02: A13 B13 C14 D11 E14).

**Soal OK tanpa perubahan:** TWK 34/60 (P01 19, P02 15) · TIU 52/54 (P01 27, P02 25) · TKP 51/90 (P01 26, P02 25).

## Temuan sistemik (paling serius)

1. **TWK: kunci hampir selalu opsi terpanjang.** Kunci menjadi opsi terpanjang pada P01 18/30 dan P02 22/30 soal
   (67%). Peserta yang asal memilih opsi terpanjang bisa lolos ambang batas TWK. Perbaikannya: distraktor yang jelas
   salah diperpanjang dengan isi yang masuk akal tetapi tetap salah, atau kunci dipadatkan tanpa mengubah makna.
   Hasilnya, kunci terpanjang tinggal 7/30 per paket (≈23%, mendekati peluang acak 20%). Paket 3–10 menunjukkan pola
   yang sama (13–25/30) tetapi berada di luar cakupan review ini.
2. **TKP: opsi bobot 5 selalu terpanjang ke-1 atau ke-2.** Ini terjadi pada 89/90 soal. Penulis rupanya selalu
   menyisipkan tepat satu distraktor (bobot 1/2) yang sedikit lebih panjang, sementara opsi bobot 3 hampir selalu
   termasuk dua opsi terpendek. Polanya mudah ditebak. Perbaikannya: opsi bobot 3/4 diperpanjang (tanpa menambah unsur
   yang menaikkan bobotnya), dan pada 3 soal opsi bobot 4 diperpanjang agar bobot 5 tidak lagi terpanjang.
   - P01: peringkat panjang opsi bobot 5 (ke-1/ke-2/ke-3) berubah dari 14/31/0 menjadi 11/18/16.
   - P02: berubah dari 6/39/0 menjadi 6/19/20.

## Rincian per soal

| id | masalah | perbaikan | sumber |
|---|---|---|---|
| P01-TWK-01 | Kunci C terpanjang (168 vs 132). Pembahasan memakai "chauvinistis" (tidak ada di KBBI). | C dipadatkan; D diperpanjang ("…dan menghindari rekan dari negara lain…"); pembahasan → "merendahkan bangsa lain (sauvinisme)". | KBBI: *sauvinisme* ada, *chauvinistis* "entri tidak ditemukan" |
| P01-TWK-03 | Kunci D 175 vs distraktor ≤94 | D dipadatkan; C dan E diperpanjang (tetap salah: memperluas sebaran / pasif) | §2 riset (opsi setara panjang) |
| P01-TWK-07 | Kunci D 161 vs ≤111 | D dipadatkan; A dan C diperpanjang | idem |
| P01-TWK-12 | Kunci D 150 vs ≤85 | D dipadatkan (alasan "tidak dipungut biaya" dipertahankan); A dan B diperpanjang | PermenPANRB 6/2024 (riset [P6]) |
| P01-TWK-13 | Kunci B (kutipan definisi) 175 vs ≤113 | A dan C diperpanjang dengan rumusan yang tetap salah (bersenjata/kolektif saja; mendukung pemerintah yang berkuasa) | UU 23/2019 Ps. 1 angka 11 (teks peraturan.go.id) |
| P01-TWK-16 | Hanya kunci yang memuat tanggal (66 vs ≤35) | Distraktor diberi tanggal yang benar: Bandung Lautan Api Maret 1946, Ambarawa berakhir 15 Des 1945, Puputan Margarana 20 Nov 1946, Serangan Umum 1 Maret 1949 | riset [SEJ-AMB] [SEJ-BLA] [SEJ-MRG] |
| P01-TWK-19 | Kunci E 135 vs ≤101 | E dipadatkan; C diperpanjang | UUD Ps. 1(3) |
| P01-TWK-22 | Kunci D 115 vs ≤58 | Ketiga distraktor diperpanjang (Piagam Jakarta, PPKI, pembukaan sidang BPUPKI); D dipadatkan | riset [SEJ-PANCASILA] |
| P01-TWK-23 | Kunci A 164 vs ≤111 | A dipadatkan; B (dalih kekhususan) diperpanjang | UU 12/2011 Ps. 7 |
| P01-TWK-24 | Kunci E (kutipan Ps. 28F) 178 vs ≤79. Opsi B mengutip Ps. 27(2) dengan "serta" (naskah: "dan"). | E memakai bagian ps. 28F yang langsung sesuai kasus ("mencari, memperoleh, memiliki, menyimpan, mengolah, dan menyampaikan…"); A dan D dilengkapi sesuai naskah Ps. 28G(1) dan 28H(3); B → "pekerjaan dan penghidupan"; pembahasan menyebut pasal asal distraktor | UUD NRI 1945 satu naskah |
| P01-TWK-25 | Kunci C 187 vs ≤163. Pembahasan belum menyebut dasar dalam UU IKN sendiri. | E diperpanjang; pembahasan ditambah "UU 3/2022 Pasal 39 ayat (1)" | pasal.id UU 3/2022: Ps. 1 angka 2 & 9, Ps. 39(1) |
| P02-TWK-01 | Kunci B 162 vs ≤100 | B dipadatkan; A dan E diperpanjang | KBBI *patriotisme* |
| P02-TWK-03 | Kunci A 170 vs ≤97 | A dipadatkan; C dan E diperpanjang | – |
| P02-TWK-04 | Kunci C 125 vs ≤82 | B diperpanjang (dalih tetap salah) | UU 24/2009 Ps. 24 huruf c (teks dicek) |
| P02-TWK-06 | Kunci B 160 vs ≤102 | B dipadatkan; A dan E diperpanjang | Perpres 58/2023 (riset [MB]) |
| P02-TWK-07 | Kunci A 164 vs ≤111 | A dipadatkan; C dan D diperpanjang | KBBI *integritas* |
| P02-TWK-08 | Kunci C 136 vs ≤91 | A (kuitansi rekaan) diperpanjang | 9 nilai KPK |
| P02-TWK-10 | Kunci D 116 vs ≤92 | C diperpanjang | UU 20/2023 Ps. 4(2)b |
| P02-TWK-12 | Kunci A 189 vs ≤125 | A sedikit dipadatkan; D diperpanjang (tetap salah: penghargaan "hanya bagi ASN") | PP 43/2018 (riset [PP43]) |
| P02-TWK-16 | Kunci A 168 vs ≤88 | A dipadatkan; D ditulis lengkap "Pemerintahan Darurat Republik Indonesia (PDRI) di Yogyakarta … Hatta … Agresi Militer I" | Keppres 28/2006 (riset [KP28]) |
| P02-TWK-17 | Kunci B 173 vs ≤117 | B dipadatkan; A diperpanjang | UU 23/2019 Ps. 4(3) "serangan siber" (teks dicek) |
| P02-TWK-18 | Kunci C 174 vs ≤120 | A dan E diperpanjang (tetap salah: "menggantikan", "nonmiliter") | UU 23/2019 Ps. 1 angka 9 & Ps. 29 (teks dicek) |
| P02-TWK-19 | Kunci D 187 vs ≤127 | D dipadatkan ("bentuk NKRI"); A diperpanjang | UUD Ps. 37(5) |
| P02-TWK-20 | Kunci E 142 vs ≤114 | D (alasan ekonomi) disetarakan panjangnya | Pembukaan alinea I |
| P02-TWK-24 | Kunci E 91 vs ≤77. Opsi B "pekerjaan serta penghidupan" (naskah: "dan"). | A diperpanjang; B → "pekerjaan dan penghidupan" | UUD Ps. 27(2), 28F, 28G(1) |
| P02-TWK-29 | Kunci B 159 vs ≤92 | B dipadatkan; A dan E diperpanjang (tetap memuat klaim yang tidak ada di teks) | – |
| P02-TIU-02 | Opsi E "SPEDOMETER" tidak baku | → "SPIDOMETER : KECEPATAN"; pembahasan juga disesuaikan | KBBI: *spedometer* → bentuk baku *spidometer* |
| P02-TIU-11 | Stem "Rumah hijau bernomor …" dengan opsi "Nomor 6" terbaca "bernomor Nomor 6" | Stem → "Letak rumah hijau adalah …" | – |
| P01-TKP-02, -03, -05, -09, -11, -12, -13, -17, -18, -20, -25, -28, -32, -37, -39, -43 | Opsi bobot 5 terpanjang ke-2, sementara opsi lain jauh lebih pendek (pola tebakan) | Satu opsi bobot 3/4 diperpanjang. Kekurangannya tetap tampak, bobot dan pembahasan tetap. Opsi bobot 5 kini terpanjang ke-3. | §4 riset ("panjang opsi dibuat seragam") |
| P01-TKP-19, -33, -44 | Opsi bobot 5 jauh lebih panjang dari semua opsi | Opsi bobot 2/4 diperpanjang. P01-TKP-33 D: unsur "risiko mutu" yang tidak disampaikan kini tertulis eksplisit, sesuai pembahasan. | idem |
| P02-TKP-01, -02, -04, -05, -09, -10, -12, -13, -15, -17, -18, -22, -25, -28, -31, -33, -35, -38, -42, -44 | Pola yang sama (bobot 5 terpanjang ke-2 pada 39/45 soal) | Satu opsi bobot 3/4 diperpanjang; bobot dan pembahasan tetap | idem |

## Dicek dan OK (tanpa perubahan)

- **TWK.** Semua kutipan pasal yang menjadi kunci cocok dengan naskah:
  - UU 24/2009 Ps. 7(3), 7(4), 24c, 25(1), dan 25(2);
  - UU 23/2019 Ps. 1 angka 9 dan 11, 4(2), 4(3), 6(2), 7(3), 10, dan 29;
  - UU 30/2014 Ps. 17(2) dan 42(1); UU 20/2001 Ps. 12B dan 12C (30 hari kerja, KPK);
  - UUD Ps. 1(1), 1(3), 2(1), 3, 18B(2), 27(3), 28F, 28G(1), 30(1), 36, 37(5);
  - UU 12/2011 Ps. 2, 3(1), dan 7; Inpres 2/2022 (≥ 40%); ICH jamu 2023 dan Reog 2024 (USL).

  Kata baku pada P01-TWK-26 dan P02-TWK-26, kapital pada P01-TWK-27 dan P02-TWK-27, pleonasme, dan kalimat efektif
  semuanya tepat. Tidak ditemukan isu politik partisan.
- **TIU.**
  - Analitis: P01-TIU-10 punya 2 solusi dan opsi C benar di keduanya; P01-TIU-11 solusinya unik (kanan Fani = Bayu);
    pada P01-TIU-12, hanya A yang mustahil dari 5 solusi; P02-TIU-09, P02-TIU-11 (hijau = 6), dan P02-TIU-12
    (Dimas–Pontianak) solusinya unik; P02-TIU-10 punya 2 solusi dan opsi E benar di keduanya.
  - Silogisme: semua kunci sah dan distraktornya tidak sah.
  - Numerik: semua hasil hitung ulang cocok.
  - Perbandingan kuantitatif (PK): tidak ada kasus P = 2Q atau Q = 2P pada P01-TIU-21–23 dan P02-TIU-21–23.
    P02-TIU-22 (P = 1,5Q) sudah dijelaskan di pembahasan.
- **TKP.**
  - Tidak ada opsi berbobot ≥ 4 yang melanggar aturan atau etika, dan opsi bobot 5 tidak lebih buruk daripada opsi
    bobot 4.
  - Huruf dan bobot di pembahasan cocok dengan opsi pada 90/90 soal (dicek otomatis).
  - Regulasi yang dikutip semuanya termasuk §3: UU 25/2009, UU 27/2022, UU 8/2016, PP 42/2020, Perpres 82/2023,
    Perpres 58/2023, Perpres 8/2026, PermenPANRB 4/2025, SE MenPANRB 137/2018, SE Menkominfo 9/2023, UU 1/2024.

## Catatan / belum pasti

- **UU 20/2023 Ps. 4(2) huruf b angka 1–2** (dipakai P01-TWK-10 dan P02-TWK-10). PDF resmi yang bisa diakses berupa
  hasil pindaian tanpa lapisan teks, jadi rumusan per angka hanya dapat dicocokkan dengan sumber sekunder (Kumparan dan
  ringkasan lain) serta dokumen riset. Isinya konsisten, tetapi letak persisnya (batang tubuh atau penjelasan) belum
  terverifikasi dari naskah primer. Kunci kedua soal tidak terpengaruh.
- **Urutan bobot yang bisa diperdebatkan, tetapi tetap dipertahankan:**
  - P02-TKP-28: A3 (membalas pelaku dan meminta ditelepon) di atas C2 (bertanya ke rekan bendahara).
  - P01-TKP-35: C3 (menerima amplop lalu melapor) di atas A2 (menerima bingkisan makanan).
  - P02-TKP-19: B5 (datang memberi selamat lalu menyampaikan kebutuhan istirahat) di atas C4 (memaklumi dan memakai
    penutup telinga).

  Ketiganya masih sesuai §4, jadi tidak diubah.
- P01-TKP-41 (keluarga melarang anak ikut upacara bendera karena keyakinan) bersifat sensitif. Opsi bobot 5 sudah
  hati-hati, karena melapor ke pihak berwenang hanya "bila ada indikasi paham radikal".
