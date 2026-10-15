# Review bank soal SKD 2027 — paket 9 & 10 (SELESAI)

Peninjau independen (adversarial), 15 Okt 2026. Cakupan: `parts/p09-*.json`, `parts/p10-*.json` (figural dilewati,
sudah diverifikasi mesin). Metode: TWK dijawab buta lalu dibandingkan dengan kunci, fakta dicek ke riset + sumber
primer; TIU diselesaikan ulang (Python, brute force untuk analitis/silogisme); TKP dibaca per opsi terhadap §4 riset.

## TWK (60 butir) — selesai

Hasil jawab buta: **60/60 cocok dengan kunci**. Sebaran kunci P09 dan P10 masing-masing A–E = 6/6/6/6/6.
Kunci = opsi terpanjang pada 13/30 (P09) dan 10/30 (P10), tetapi selisihnya dengan opsi terpanjang berikutnya ≤ 7%
→ tidak dianggap petunjuk (tidak diubah).

| id | masalah | perbaikan | sumber |
|---|---|---|---|
| P09-TWK-04 | Riset menulis Ps. 5; dicek apakah bukan Ps. 4 | OK — Ps. 5 ayat (1)–(2) benar | pasal.id UU 24/2009 |
| P09-TWK-10 | Diminta cek penomoran UU 20/2023 Ps. 24 ayat (2)–(3) | OK — terkonfirmasi: ayat (1) kewajiban, (2) "dikenakan pelanggaran disiplin dan dijatuhi hukuman disiplin", (3) "Instansi Pemerintah wajib melaksanakan penegakan disiplin" | pasal.id/peraturan/uu/uu-no-20-tahun-2023/pasal-24 |
| P09-TWK-09, P10-TWK-09 | Cek huruf PP 94/2021 Ps. 5 | OK — huruf f (meminjamkan/menyewakan BMN secara tidak sah), huruf l (meminta sesuatu terkait jabatan) | pasal.id PP 94/2021 |
| P09-TWK-11 | Cek PP 94/2021 Ps. 4 | OK — huruf i (menolak segala bentuk pemberian terkait tugas & fungsi) | pasal.id PP 94/2021 |
| P09-TWK-13, -17, -18; P10-TWK-15, -16, -17, -18 | Cek UU 23/2019 Ps. 1 angka 12, 2, 3, 4(1), 4(3), 5(1) | OK — semua rumusan sesuai | pasal.id UU 23/2019 |
| P10-TWK-02, -03, -04, -30; P09-TWK-30 | Cek UU 24/2009 Ps. 58(1), 60(2), 12(2)–(3), 16(2), 30, 38 | OK | pasal.id UU 24/2009 (+ /pasal-12) |
| P10-TWK-06, -10 | Cek UU 20/2023 Ps. 2 (asas) dan Ps. 63(4) | OK | pasal.id UU 20/2023 |
| P10-TWK-08 | Diminta cek UU 20/2023 Ps. 4 ayat (2) huruf b angka 3 | OK — terkonfirmasi: huruf b akuntabel, angka 3 "tidak menyalahgunakan kewenangan jabatan" | pasal.id/peraturan/uu/uu-no-20-tahun-2023/pasal-4 |
| P10-TWK-12 | Cek PP 43/2018 Ps. 12(2) | OK — pelindungan hukum bagi pelapor yang laporannya mengandung kebenaran | pasal.id PP 43/2018 |
| P10-TWK-27 | Cek nomor kaidah EYD V | OK — Huruf Miring 1 (judul siniar, nama media massa), Huruf Miring 3 (bahasa daerah/asing), Huruf Kapital 23 (kata kekerabatan sebagai sapaan) | ejaan.kemendikdasmen.go.id |
| P09-TWK-26, P10-TWK-26 | Cek bentuk baku | OK — utang, esai, kompleks, konkret, persen, napas/pernapasan, sintesis, subjek | KBBI VI daring |
| P09-TWK-27 | Cek gabungan kata | OK — kunci E satu-satunya yang seluruhnya benar (beasiswa, kacamata serangkai; menggarisbawahi) | EYD V Gabungan Kata |

Butir TWK lain (UUD Ps. 2, 8, 12, 13–14, 23, 26, 27, 28D, 28I, 29, 31, 33, 37; KAA, Roem-Royen, KMB, Mosi Integral,
Dekrit, SU 1 Maret, Resolusi Jihad; Keppres 2/2022, 22/2015, 33/2009; UU 3/2022 Ps. 2; UU 25/2009 Ps. 4 & 34):
fakta, kunci tunggal, distraktor, dan bahasa **OK**.

**TWK: 60 OK, 0 diubah.**

## TIU teks (54 butir) — selesai

Hasil kerja ulang buta (skrip Python di scratchpad): **54/54 cocok dengan kunci**. Analitis (P09-TIU-09..12,
P10-TIU-09..12) dicek brute force: semuanya punya jawaban tunggal; opsi "pasti benar/pasti salah" hanya satu yang
memenuhi. Silogisme dicek per opsi (konvers/invers/kontraposisi). Semua `verify.expr` dievaluasi ulang dan sama dengan
opsi kunci; tidak ada opsi lain bernilai sama.

| id | masalah | perbaikan | sumber |
|---|---|---|---|
| P09-TIU-27 | Tanggal kalender | OK — `datetime`: 5 Jan 2026 = Senin; KPK(6,4)=12, bersamaan & Senin tiap 84 hari → Senin 30 Mar 2026; distraktor 2 Mar (Senin, hanya posyandu), 16 Mar, 29 Mar (Minggu), 6 Apr bukan hari bersamaan | Python `datetime` |
| P09-TIU-21..23, P10-TIU-21..23 | PK: cek jebakan P = 2Q | OK — tidak ada butir yang nilai benarnya P = 2Q (P09: 90=90, {0,1,4} vs 4, 78 vs 77,5; P10: 17=17, 7,07 vs 7, 180.000 vs 200.000), jadi kunci A/B/C/D tunggal | Python |
| P09-TIU-11 | 6 syarat melingkar | OK — 4 susunan (cermin & tukar penulis/petani), polisi selalu Fajar | brute force |
| P09-TIU-12 | Kondisional "jika Mira di Tim Kinerja" | OK — 2 susunan, hanya B (Lina–Raka) pasti benar | brute force |
| P10-TIU-10 | Bujur sangkar latin 4×4 | OK — 1 solusi, Ayu minggu ke-3 di Data | brute force |
| P10-TIU-11 | Meja persegi | OK — 4 susunan, rekan sesisi Deni selalu Hadi | brute force |
| P10-TIU-12 | Skenario "Chatbot ke-3" | OK — 2 susunan, hanya D pasti benar | brute force |

**TIU teks: 54 OK, 0 diubah.**

## TKP (90 butir) — selesai

Semua 90 butir dibaca per opsi terhadap §4 riset. Cek otomatis: bobot tiap butir permutasi 1..5; setiap pasangan
"huruf (bobot)" di pembahasan cocok dengan opsi dan urut 5→1 (90/90); kategori/basis/kesulitan cocok dengan tabel
alokasi riset (90/90); regulasi yang disebut hanya UU PDP (P09-TKP-15, P10-TKP-29) — ada di §3; tidak ada nama
partai/tokoh/calon. Petunjuk panjang: opsi bobot 5 menjadi opsi terpanjang hanya 6/45 (P09) dan 3/45 (P10); sebaran
huruf bobot 5 = 9/9/9/9/9 di kedua paket → tidak ada pola tebakan.

| id | masalah | perbaikan | sumber |
|---|---|---|---|
| P10-TKP-28 | Opsi C (bobot 4) menyarankan rekan "menghapus nama serta NIP pegawai sebelum memakai AI" → tersirat bahwa draf anggaran yang belum final boleh tetap diunggah ke layanan AI berbayar **pribadi**; opsi berbobot 4 tidak boleh membenarkan praktik yang melanggar keamanan data | Opsi C diganti: "Menolak ikut mengunggah dan meminta rekan berhenti mengunggah draf anggaran serta data pegawai ke layanan AI pribadinya." Bobot (4) dan pembahasan tetap cocok (beda dengan B = tanpa usulan pedoman) | §3 riset (SE Menkominfo 9/2023: privasi & keamanan; UU 27/2022 PDP) |
| P10-TKP-24 | Penyebutan etnis spesifik | Diganti "kelompok etnis minoritas" (lihat rebalance-twk-p03-p06.md) | - |
| P10-TKP-45 | Konteks "menjelang pilkada" | OK — tanpa partai/calon; yang diuji polarisasi SARA, kunci = lapor kanal resmi & penyelenggara pemilu + FKUB | §3 riset (Perpres 58/2023) |
| P10-TKP-42 | "Kantor distrik" + separatisme (sensitif) | OK — kunci merangkul aspirasi + melapor; opsi intimidatif bobot 1 | — |
| P09-TKP-44 | Boikot upacara karena keyakinan | OK — kunci dialog pribadi + minta hapus status + lapor atasan | — |
| P09-TKP-21, -24; P10-TKP-30 | Gradasi 2–3 tipis (A vs D; C vs A; E "akun tamu" memakai aset dinas) | OK — masih sesuai §4 (3 = membiarkan/empati yang melanggar, 2 = menghindar/melempar) | §4 riset |

Butir TKP lainnya: urutan 1..5 dapat dipertahankan, opsi 5 bukan lebih buruk daripada opsi 4, tidak ada opsi
berbobot ≥ 4 yang melanggar aturan/etika, bahasa wajar → **OK**.

**TKP: 89 OK, 1 diubah (P10-TKP-28).**

## Ringkasan

| Subtes | Diperiksa | OK | Diubah |
|---|---|---|---|
| TWK | 60 | 60 | 0 |
| TIU teks | 54 | 54 | 0 |
| TKP | 90 | 89 | 1 |
| **Total** | **204** | **203** | **1** |

Setelah perbaikan: `python -I scripts/bank-soal/merge.py --paket 9,10` → paket-09/10 masing-masing 102 soal teks;
`python -I scripts/bank-soal/validate.py --paket 9,10` → 220 soal, **0 ERROR, 0 PERINGATAN** (validasi seluruh 10
paket juga 0/0). Sebaran kunci TWK+TIU (termasuk figural): P09 A12/B13/C12/D14/E14, P10 A13/B14/C11/D14/E13.

Catatan tersisa (tidak diubah): P09-TWK-03 opsi E ("kelompok sedaerah, ketua bergiliran dari daerah berbeda") agak
janggal secara logika, tetapi jelas salah sehingga tidak mengganggu kunci.
