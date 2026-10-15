# Review bank soal SKD 2027 — paket 3 & 4 (TWK, TIU teks, TKP)

> Status: SELESAI (15 Okt 2026). Reviewer independen. Soal figural tidak ditinjau karena sudah diverifikasi mesin.
> Setelah perbaikan: `merge.py --paket 3,4` dan `validate.py --paket 3,4` → 0 ERROR, 0 PERINGATAN. Validasi penuh 10 paket juga 0 ERROR.

**Metode.** Semua soal TWK dan TIU dijawab sendiri lebih dulu tanpa melihat kunci, lalu dibandingkan. Hasilnya, 114 dari 114 kunci
sama dengan jawaban reviewer. Fakta TWK dicek ke `docs/riset-cpns-2024-2027.md`. Butir yang meragukan dicek ke sumber primer:
- teks UU 23/2019 dari peraturan.bpk.go.id (Ps. 4, 6, 7, 9, 10, 15, 17, 28);
- UUD NRI 1945 satu naskah dari JDIH Kemenkeu;
- pasal.id untuk UU 20/2023 Ps. 4 ayat (2) dan Ps. 10, serta UU 30/2014 Ps. 43;
- KBBI daring untuk entri *voucer* dan *diagnosa* (→ diagnosis).

Soal analitis diverifikasi dengan brute force semua permutasi, termasuk keunikan jawaban. Silogisme diperiksa dengan tabel
kebenaran/himpunan, dan soal numerik dihitung ulang dengan Python. TKP diperingkat sendiri tanpa melihat bobot, lalu dicocokkan
dengan §4 riset.

## Temuan & perbaikan

| id | masalah | perbaikan | sumber |
|---|---|---|---|
| P04-TWK-17 | Kunci C menyandingkan "wabah = wujud ancaman" dengan Ps. 15(4) tentang **ancaman nonmiliter**. Akibatnya kunci bergantung pada klasifikasi wabah sebagai ancaman nonmiliter. Padahal Ps. 4(3) hanya menyebut wabah penyakit sebagai **wujud ancaman** tanpa memilah militer/nonmiliter/hibrida, dan klasifikasi itu tidak ditemukan dalam teks maupun sumber Penjelasan yang dapat diakses. | Opsi C diubah menjadi "…pengabdian sesuai profesi merupakan salah satu bentuk keikutsertaan dalam usaha bela negara" (Ps. 6(2) huruf d, Ps. 15(1)). Pembahasan ditulis ulang tanpa klaim klasifikasi; distraktor D dibantah dengan Ps. 28(2) (Komcad warga negara bersifat sukarela). | UU 23/2019 (BPK) Ps. 4, 6, 15, 28 |
| P04-TWK-19 | Pembahasan mengutip alinea III dengan ejaan "rahmat", padahal naskah resmi UUD NRI 1945 (satu naskah) memakai "rakhmat". | Pembahasan memuat kutipan resmi lengkap bertanda petik dengan "rakhmat", ditambah catatan bahwa bentuk baku KBBI kini "rahmat". Opsi B berupa parafrasa, jadi tetap. | UUD1945dlmsatunaskah.pdf (JDIH Kemenkeu) |
| P03-TWK-11 | Rujukan "UU 30/2014 Pasal 43" kurang presisi. | Pembahasan dirujuk ke Ps. 43 ayat (1) huruf a (kepentingan pribadi/bisnis) dan huruf b (hubungan kerabat dan keluarga). | pasal.id UU 30/2014 Ps. 43 |
| P03-TIU-26 | Stem berakhir "pada pukul …", padahal opsi berbunyi "Pukul 11.00", sehingga terbaca "pada pukul Pukul 11.00". | Stem diubah menjadi "Pada pukul berapa Sinta menyusul Raka?". Opsi, kunci, dan `verify` tetap. | — |
| P03-TKP-37 | Opsi D (menyerahkan kajian yang diketahui memuat kutipan data fiktif, hanya dengan catatan "dihasilkan AI") diberi bobot 3, di atas E (berhenti memakai AI dan menyusun ulang walau lewat tenggat) yang diberi bobot 2. D sengaja meloloskan data keliru dan melempar tanggung jawab akurasi (level 2 di §4), sedangkan E jujur tetapi menunda (level 3). | Bobot D ↔ E ditukar (D=2, E=3), dan pembahasan disesuaikan. | §4 panduan bobot TKP |
| P03-TKP-20, P04-TKP-05, -08, -15, -17, -24, -28, -31, -38, -43 | Petunjuk panjang opsi: opsi bobot 5 1,4–1,9× lebih panjang daripada opsi terpanjang lainnya. Ini melanggar aturan tulis §4 ("panjang opsi dibuat seragam"). | Opsi bobot 5 dipadatkan dan opsi bobot 4 diperpanjang secara wajar tanpa mengubah makna maupun tingkat bobotnya. Rasio kini 1,03–1,15. Bobot dan pembahasan tetap. | §4 aturan tulis TKP |

## Butir yang dicek khusus dan dinyatakan OK
- **P04-TKP-38 (netralitas pilkada):** tidak menyebut partai, calon, atau tokoh. Kunci tetap menolak dengan sopan dan melapor
  tekanan ke kanal berwenang. Mengikuti kampanye (opsi B) diberi bobot 1, dan pembahasan tidak memuat unsur partisan.
- **Perbandingan kuantitatif (P03-TIU-21/22/23, P04-TIU-21/22/23):** tidak ada butir dengan relasi P = 2Q. Rasio P/Q berturut-turut
  1,25; 0,98; 1,04; 1; negatif; 1. Kunci A/B/C tepat dan `verify` cocok.
- **Analitis (brute force):**
  - P03-TIU-10: hanya P (dan T yang tetap ke-4) yang tidak mungkin ke-3.
  - P03-TIU-11: Eka tunggal.
  - P03-TIU-12: 3 susunan, Keamanan Siber selalu Jumat.
  - P04-TIU-09: 1 solusi.
  - P04-TIU-10: Kirana selalu terakhir.
  - P04-TIU-11: Elsa di antara Cahya–Hesti pada 4 susunan.
  - P04-TIU-12: hanya opsi B yang valid.
- **Fakta TWK terverifikasi:** UU 23/2019 Ps. 7(3), 9, 10, 17(1); UU 20/2023 Ps. 4(2) huruf c dan huruf e angka 3, serta Ps. 10; UU 30/2014
  Ps. 43; KBBI *voucer* (baku) dan *diagnosa* → *diagnosis*.

## Catatan sistemik (tidak diubah, saran revisi berikutnya)
- **TKP:** opsi bobot 5 masih selalu termasuk dua opsi terpanjang di kedua paket. Kasus yang mencolok sudah diperbaiki, tetapi
  polanya tetap bisa dikenali. Disarankan merapikan panjang opsi di seluruh bank soal.
- **TWK:** kunci cenderung opsi terpanjang (P03 15/30, P04 18/30), terutama pada soal kasus. Sebaran huruf kunci sudah rata
  (6 per huruf). Di P04-TWK-06 s.d. 25, huruf kunci mengikuti siklus tetap A-C-E-B-D. Ini tidak masalah bila paket memakai acak
  opsi, tetapi sebaiknya diacak ulang pada revisi berikutnya.
- **Pola bobot TKP:** P03-TKP-23 dan P04-TKP-36 berpola bobot berurutan A1–E5 (permutasi identitas). Pola ini sah, hanya kurang acak.
- **P03-TKP-45:** urutan "bicara dari hati ke hati lalu melapor" berisiko memberi tahu pelaku sebelum aparat bertindak.
  Bobot 5/4 masih sesuai §4 ("merangkul bila aman"), jadi tidak diubah.
- **P03-TIU-05:** kalimat diawali "dr. Nanda" dengan huruf kecil. Ini konvensi singkatan gelar, jadi dibiarkan.

## Ringkasan per subtes

| Subtes | Paket 3: OK / diubah | Paket 4: OK / diubah | Kunci berubah |
|---|---|---|---|
| TWK (30 + 30) | 29 / 1 (pembahasan) | 28 / 2 (1 opsi kunci + pembahasan, 1 pembahasan) | 0 (huruf kunci tetap) |
| TIU teks (27 + 27) | 26 / 1 (redaksi stem) | 27 / 0 | 0 |
| TKP (45 + 45) | 43 / 2 (1 bobot D↔E, 1 panjang opsi) | 36 / 9 (panjang opsi) | 0 (opsi bobot 5 tetap) |
