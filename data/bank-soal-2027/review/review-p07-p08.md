# Review bank soal SKD 2027 — paket 7 & 8

Peninjau: agen reviewer independen (15 Okt 2026). Cakupan: `parts/p07-*.json`, `parts/p08-*.json` (figural dilewati,
sudah diverifikasi mesin). Cadangan sebelum edit: scratchpad `rev0708/backup/`.
Hasil akhir: `merge.py --paket 7,8` → `validate.py --paket 7,8` = **ERROR 0, PERINGATAN 0**.

## Ringkasan per subtes

| Subtes | Jumlah | Kunci/urutan benar | Tidak diubah (OK) | Diubah | Rincian perubahan |
|---|---|---|---|---|---|
| TWK | 60 | 60/60 (dijawab buta dulu, semua cocok) | 29 | 31 | 1 perbaikan fakta (P07-TWK-11), 3 presisi pembahasan (P07-TWK-09, P08-TWK-09, P08-TWK-27), 28 penyeimbangan panjang opsi (P07-TWK-09 termasuk) |
| TIU teks | 54 | 54/54 (analitis & silogisme dicek brute force; numerik dihitung ulang) | 53 | 1 | P08-TIU-08 (semesta premis) |
| TKP | 90 | 90/90 urutan bobot dapat dipertahankan (§4) | 42 | 48 | 1 opsi + pembahasan (P08-TKP-37), 2 ejaan (P07-TKP-30, P08-TKP-29), 45 penyeimbangan panjang opsi |

Tidak ada kunci/bobot yang dipindah (sebaran huruf kunci tetap: TWK 6/6/6/6/6 per paket; TKP bobot 5 masing-masing 9× A–E per paket).

## Pemeriksaan yang dilakukan
- **TWK**: tiap soal dijawab tanpa melihat kunci → 60/60 cocok. Fakta dicek ke sumber primer: PP 94/2021 Ps. 4 huruf g
  (wajib menggunakan & memelihara BMN) dan Ps. 5 huruf i (sewenang-wenang terhadap bawahan) — pasal.id; UU 20/2023
  Ps. 4(2) huruf f (adaptif: cepat menyesuaikan diri, berinovasi & mengembangkan kreativitas, bertindak proaktif), Ps. 9(2),
  11, 12, 24(1) — pasal.id; UU 24/2009 Ps. 17, 21 (panji: kanan, tidak bersilang, ayat (2) **lebih besar & lebih tinggi**),
  33, 44, 55 — pasal.id; UU 23/2019 Ps. 1 angka 13–14, 4(3), 6(3), 6(5), 7(2), 13(1), 15(1)–(3), 35(1) (**pelatihan dasar
  kemiliteran selama 3 bulan**) — pasal.id; UU 28/1999 Ps. 1 angka 5, Ps. 3, Penjelasan Ps. 2 — pasal.id & JDIH Kemenkeu;
  UU 25/2009 Ps. 17 — pasal.id; EYD V Kata Turunan 1c & 1e (non-Indonesia, pasca-Orba; **Yang Maha Esa, Tuhan Yang Maha
  Kuasa, Yang Maha Pengasih** ditulis terpisah) — ejaan.kemendikdasmen.go.id. Pasal UUD (18, 24A–24C, 23E–23G, 25A, 28H(2),
  28I(2), 28J, 10, 11, Aturan Tambahan Ps. II) sesuai naskah satu naskah. Ejaan dipindai (kata tidak baku hanya muncul di
  opsi pengecoh yang memang diuji).
- **TIU**: 54 soal diselesaikan ulang (skrip scratchpad `rev0708/p07_tiu.py`, `p08_tiu.py`): P07-TIU-09/10/11/12 dan
  P08-TIU-09/11/12 diuji brute force (susunan tunggal, atau untuk "pasti benar" hanya kunci yang benar di semua susunan).
  Perbandingan kuantitatif: P07-TIU-23 (P = 1/2, Q = 1/4) dan P08-TIU-23 (x = 4, y = 2) memang P = 2Q; stem sudah
  "Hubungan yang paling tepat" dan pembahasan menjelaskan mengapa P = 2Q lebih tepat daripada P > Q → OK. PK lain
  (P07-TIU-21/22, P08-TIU-21/22) tidak mengandung kasus P = 2Q tersembunyi. Semua `verify.expr` lolos validator.
- **TKP**: 90 soal dibaca; urutan 5→1 sesuai §4 (5 = proaktif, sesuai kewenangan, solutif; tidak ada opsi bobot ≥4 yang
  melanggar aturan/etika); huruf & bobot di pembahasan cocok dengan opsi dan berurutan 5→1 (cek otomatis); regulasi yang
  dikutip hanya dari §3 (UU 8/2016, PP 42/2020, UU 27/2022, Perpres 82/2023, SE Menkominfo 9/2023, SE MenPANRB 137/2018,
  Perpres 58/2023, Perpres 8/2026, UU 20/2023); tidak ada muatan partisan.

## Temuan sistemik: isyarat panjang opsi (diperbaiki)
- **TWK**: kunci adalah opsi terpanjang pada P07 25/30 dan P08 21–24/30 (tertinggi di seluruh bank) → strategi "pilih yang
  terpanjang" memberi ±80% benar. Diperbaiki dengan memperpanjang distraktor (alasan yang terdengar masuk akal tetapi tetap
  salah) atau merapikan kunci yang bertele-tele, tanpa mengubah fakta kunci. Sebaran peringkat panjang kunci (ke-1..ke-5)
  sekarang P07 8/11/9/1/1, P08 9/10/8/0/3.
- **TKP**: opsi bobot 5 selalu terpanjang ke-1/ke-2 (P07 43/45, P08 45/45; ke-2 saja 33 dan 36) karena satu distraktor
  dipanjangkan sedikit di atas opsi bobot 5 → pola "pilih yang terpanjang kedua". Diperbaiki dengan menambah keterangan
  netral pada opsi bobot 1–4 (tanpa tindakan baru yang menaikkan bobot). Sebaran sekarang P07 10/15/16/4/0,
  P08 9/15/17/4/0.

## Tabel temuan

| id | masalah | perbaikan | sumber |
|---|---|---|---|
| P07-TWK-11 | Pelaku "kepala dinas" (eselon II) tidak termasuk Penyelenggara Negara menurut Penjelasan Ps. 2 angka 7 UU 28/1999 (yang disebut pejabat eselon I), padahal definisi nepotisme Ps. 1 angka 5 mensyaratkan penyelenggara negara | Pelaku diganti "direktur jenderal di sebuah kementerian"; opsi E disesuaikan; pembahasan menambah dasar Penjelasan Ps. 2 angka 7; opsi D diperpanjang (isyarat panjang) | UU 28/1999 Ps. 1 angka 5, Ps. 2 + Penjelasan (JDIH Kemenkeu) |
| P07-TWK-09 | Fakta benar (Ps. 4 memuat kewajiban memelihara BMN); sitasi kurang presisi; kunci terpanjang | Pembahasan: "PP 94/2021 Pasal 4 huruf g"; kunci A dirapikan, opsi C diperpanjang | PP 94/2021 Ps. 4 huruf g (pasal.id) |
| P08-TWK-09 | Fakta benar; sitasi kurang presisi | Pembahasan: "PP 94/2021 Pasal 5 huruf i" | PP 94/2021 Ps. 5 huruf i (pasal.id) |
| P08-TWK-27 | Kunci E benar (Yang Maha Esa, Yang Maha Pengasih). Catatan: kunci juga benar menurut PUEBI, jadi butir tidak membedakan perubahan EYD V untuk kata dasar | Pembahasan ditambah: kaidah EYD V berlaku untuk kata dasar maupun berimbuhan (Tuhan Yang Maha Kuasa), berbeda dengan PUEBI (Mahakuasa) | EYD V Kata Turunan 1e (ejaan.kemendikdasmen.go.id) |
| P07-TWK-10 | Dicek: UU 20/2023 Ps. 4(2) huruf f benar | Hanya penyeimbangan panjang (opsi C, E) | UU 20/2023 Ps. 4 (pasal.id) |
| P08-TWK-04 | Dicek: Ps. 21 ayat (1) huruf a–d & ayat (2) "lebih besar dan lebih tinggi" benar; pembeda dengan Ps. 17 (bendera negara lain) tepat | Hanya penyeimbangan panjang (opsi A, D) | UU 24/2009 Ps. 17, 21 (pasal.id) |
| P08-TWK-17 | Dicek: Ps. 6(5), 13(1), 35(1) "selama 3 (tiga) bulan" benar | Kunci E dirapikan, opsi A diperpanjang (isyarat panjang) | UU 23/2019 Ps. 6, 13, 35 (pasal.id) |
| P08-TIU-08 | Premis 1 "Semua laporan **warga** yang diverifikasi …", premis lain tentang "laporan"; kesimpulan tentang laporan anonim bergantung pada asumsi laporan anonim termasuk laporan warga | Premis 1 → "Semua laporan yang diverifikasi akan ditindaklanjuti." (kunci A tetap, kini tanpa asumsi) | Analisis logika |
| P07-TIU-23, P08-TIU-23 | Kasus P = 2Q (P > Q juga benar secara harfiah) | Sudah sesuai: stem "paling tepat" + pembahasan menjelaskan → tidak diubah | Perhitungan ulang |
| P08-TKP-37 | Opsi B (bobot 4) "Memberinya cuti" — ketua tim tidak berwenang memberi cuti; pembahasan B ("beban tim tidak ditata ulang") bertentangan dengan isi opsi yang justru membagi tugas | B → "Menyarankannya mengambil cuti …"; pembahasan B → "diputuskan tanpa memahami akar masalahnya dan bebannya hanya dipindahkan ke anggota lain" | §4 panduan bobot (kewenangan) |
| P07-TKP-30 | "terlanjur" tidak baku; tanda baca pembahasan D janggal | "telanjur"; "D (3) setengah langkah karena stiker masih bisa dipindai" | KBBI: telanjur |
| P08-TKP-29 | "terlanjur" tidak baku (pembahasan) | "telanjur" | KBBI: telanjur |
| P07-TWK-01 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+, E+ → kini ke-3 | — |
| P07-TWK-03 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi D+ → kini ke-2 | — |
| P07-TWK-05 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+, B+ → kini ke-3 | — |
| P07-TWK-06 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi D+ → kini ke-2 | — |
| P07-TWK-07 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+, D+ → kini ke-3 | — |
| P07-TWK-12 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A*−, C+, D+ → kini ke-3 | — |
| P07-TWK-17 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A*−, B+ → kini ke-2 | — |
| P07-TWK-18 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+, C+, E*− → kini ke-2 | — |
| P07-TWK-20 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+ → kini ke-2 | — |
| P07-TWK-23 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi C+ → kini ke-2 | — |
| P07-TWK-24 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi D+ → kini ke-2 | — |
| P07-TWK-27 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi E+ → kini ke-2 | — |
| P07-TWK-29 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+ → kini ke-2 | — |
| P07-TWK-30 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+, C+ → kini ke-3 | — |
| P08-TWK-01 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi B+ → kini ke-2 | — |
| P08-TWK-03 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi B+, E+ → kini ke-3 | — |
| P08-TWK-06 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+ → kini ke-2 | — |
| P08-TWK-07 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+, C+ → kini ke-3 | — |
| P08-TWK-13 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi B+, C*− → kini ke-2 | — |
| P08-TWK-14 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi C+ → kini ke-1 | — |
| P08-TWK-21 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+ → kini ke-2 | — |
| P08-TWK-23 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+, B+ → kini ke-3 | — |
| P08-TWK-24 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi B+, D+ → kini ke-3 | — |
| P08-TWK-30 | kunci terpanjang ke-1 (pola isyarat panjang) | opsi A+, E+ → kini ke-3 | — |
| P07-TKP-02 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+, E+ → kini ke-4 | — |
| P07-TKP-03 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+ → kini ke-3 | — |
| P07-TKP-05 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi B+ → kini ke-3 | — |
| P07-TKP-06 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi E+ → kini ke-3 | — |
| P07-TKP-08 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi D+ → kini ke-2 | — |
| P07-TKP-11 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi D+ → kini ke-3 | — |
| P07-TKP-12 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi D+ → kini ke-3 | — |
| P07-TKP-14 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi C+ → kini ke-3 | — |
| P07-TKP-17 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi C+, E+ → kini ke-4 | — |
| P07-TKP-19 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi E+ → kini ke-3 | — |
| P07-TKP-20 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi E+ → kini ke-3 | — |
| P07-TKP-23 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+ → kini ke-3 | — |
| P07-TKP-26 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi B+ → kini ke-3 | — |
| P07-TKP-28 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi B+ → kini ke-3 | — |
| P07-TKP-32 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi C+ → kini ke-3 | — |
| P07-TKP-33 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+, D+ → kini ke-4 | — |
| P07-TKP-36 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+, C+ → kini ke-4 | — |
| P07-TKP-38 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi C+ → kini ke-3 | — |
| P07-TKP-42 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi C+ → kini ke-2 | — |
| P07-TKP-45 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+ → kini ke-3 | — |
| P08-TKP-01 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+ → kini ke-3 | — |
| P08-TKP-02 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+ → kini ke-3 | — |
| P08-TKP-03 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi B+ → kini ke-3 | — |
| P08-TKP-05 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi B+ → kini ke-3 | — |
| P08-TKP-06 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+ → kini ke-3 | — |
| P08-TKP-08 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi E+ → kini ke-3 | — |
| P08-TKP-09 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi D+ → kini ke-3 | — |
| P08-TKP-11 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi B+ → kini ke-3 | — |
| P08-TKP-12 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi E+ → kini ke-3 | — |
| P08-TKP-13 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+ → kini ke-3 | — |
| P08-TKP-14 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi C+ → kini ke-3 | — |
| P08-TKP-15 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi B+ → kini ke-3 | — |
| P08-TKP-17 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+, B+ → kini ke-4 | — |
| P08-TKP-19 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi C+ → kini ke-2 | — |
| P08-TKP-21 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi E+ → kini ke-3 | — |
| P08-TKP-23 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi C+ → kini ke-3 | — |
| P08-TKP-24 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi C+, E+ → kini ke-4 | — |
| P08-TKP-26 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+, C+ → kini ke-4 | — |
| P08-TKP-27 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi E+ → kini ke-3 | — |
| P08-TKP-28 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi D+ → kini ke-2 | — |
| P08-TKP-32 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi E+ → kini ke-2 | — |
| P08-TKP-34 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+ → kini ke-3 | — |
| P08-TKP-36 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi A+, E+ → kini ke-4 | — |
| P08-TKP-38 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi B+ → kini ke-3 | — |
| P08-TKP-40 | opsi bobot 5 terpanjang ke-2 (pola isyarat panjang) | opsi E+ → kini ke-2 | — |

Keterangan baris penyeimbangan panjang: `X+` = opsi X diperpanjang, `X*−` = kunci/opsi bobot 5 dirapikan (dipendekkan).
Fakta kunci dan bobot tidak berubah; tambahan pada distraktor TWK berupa alasan/keterangan yang tetap salah, pada TKP
berupa keterangan netral tanpa tindakan baru yang menaikkan bobot.

## Yang masih perlu perhatian (tidak diubah)
- P07-TWK-04, P07-TWK-08, P07-TWK-25, P07-TWK-26, P08-TWK-27: kunci hampir sama panjang dengan opsi lain karena opsinya
  sejajar — dibiarkan, bukan isyarat.
- Pola isyarat panjang yang sama ada di paket lain (TWK P01–P06: kunci terpanjang 15–22/30; TKP P01/P03: bobot 5 di
  peringkat panjang ke-1/ke-2 ≥44/45) — di luar cakupan review ini.
