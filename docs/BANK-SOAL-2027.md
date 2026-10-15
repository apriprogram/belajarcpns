# Bank Soal SKD 2027 — kontrak (MENGIKAT)

10 paket tryout SKD penuh, **semua soal berbeda** (1.100 soal): tiap paket 110 soal / 100 menit =
**30 TWK + 35 TIU (termasuk 8 soal gambar/figural) + 45 TKP**. Gaya soal mengikuti pola seleksi **CPNS 2024**
(kisi-kisi resmi + tren yang dilaporkan peserta/media) dan **prediksi CPNS 2027** (topik yang relevan dengan
regulasi & isu terbaru). Data lama dihapus (backup: `backups/sebelum-bank-soal-2027-*.dump`).

## Hak cipta & kejujuran (WAJIB)
- Soal SKD resmi bersifat rahasia; "soal CPNS 2024" yang beredar adalah buatan bimbel/ingatan peserta dan berhak cipta.
  **Jangan menyalin soal dari situs/buku/bimbel.** Riset hanya untuk kisi-kisi, tipe soal, pola, tingkat kesulitan,
  dan topik. **Semua soal ditulis orisinal.**
- Fakta TWK harus benar & bisa dicek (UUD NRI 1945 hasil amendemen, Pancasila, sejarah, UU yang berlaku). Hindari isu
  politik partisan, tokoh politik aktif, angka yang cepat berubah, dan klaim yang tidak pasti.
- Kunci jawaban harus benar dan tunggal (TWK/TIU). Hitung ulang semua soal numerik dengan Python.

## Sebaran per paket (sama untuk semua paket)
| Subtes | Kategori (nama persis di DB) | Jumlah |
|---|---|---|
| TWK | Nasionalisme | 6 |
| TWK | Integritas | 6 |
| TWK | Bela Negara | 6 |
| TWK | Pilar Negara | 7 |
| TWK | Bahasa Indonesia | 5 |
| TIU | Verbal – Analogi | 4 |
| TIU | Verbal – Silogisme | 4 |
| TIU | Verbal – Analitis | 4 |
| TIU | Numerik – Aritmatika | 4 |
| TIU | Numerik – Deret Angka | 4 |
| TIU | Numerik – Perbandingan Kuantitatif | 3 |
| TIU | Numerik – Soal Cerita | 4 |
| TIU | Figural – Analogi | 3 (gambar) |
| TIU | Figural – Ketidaksamaan | 2 (gambar) |
| TIU | Figural – Serial | 3 (gambar) |
| TKP | Pelayanan Publik | 8 |
| TKP | Jejaring Kerja | 8 |
| TKP | Sosial Budaya | 8 |
| TKP | TIK | 7 |
| TKP | Profesionalisme | 7 |
| TKP | Anti Radikalisme | 7 |

Kesulitan: paket 1–5 ≈ 30% mudah / 50% sedang / 20% sulit; paket 6–10 ≈ 20% / 50% / 30%.
Label sumber gaya di field `basis`: `"pola-2024"` atau `"prediksi-2027"`; tiap paket ≈ 60% pola-2024, 40% prediksi-2027.
Nama paket: `Tryout SKD CPNS 2027 #N` (deskripsi menyebut fokus paket).

## Skema file `data/bank-soal-2027/paket-NN.json` (NN = 01..10)
```json
{
  "paket": 1,
  "title": "Tryout SKD CPNS 2027 #1",
  "description": "1–2 kalimat: komposisi resmi 110 soal/100 menit + fokus paket.",
  "questions": [
    {
      "id": "P01-TWK-01",
      "subtest": "TWK",
      "category": "Nasionalisme",
      "difficulty": "mudah",
      "basis": "pola-2024",
      "topic": "kata kunci topik (untuk cek duplikat)",
      "body": "Teks soal (boleh beberapa paragraf, pakai \\n). Untuk figural: kalimat perintah saja.",
      "image": null,
      "options": [
        {"label": "A", "body": "…", "weight": 0},
        {"label": "B", "body": "…", "weight": 5},
        {"label": "C", "body": "…", "weight": 0},
        {"label": "D", "body": "…", "weight": 0},
        {"label": "E", "body": "…", "weight": 0}
      ],
      "explanation": "Pembahasan ringkas & jelas (mengapa kunci benar; untuk TKP jelaskan urutan bobot).",
      "verify": null
    }
  ]
}
```
- TWK/TIU: tepat **satu** opsi bobot 5, lainnya 0. Sebar posisi kunci A–E merata (jangan dominan satu huruf).
- TKP: bobot 1–5, **kelimanya berbeda** (permutasi 1..5), acak posisinya; bobot 5 = sikap paling ideal ASN
  (BerAKHLAK: Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif).
- Numerik (Aritmatika, Deret, Perbandingan Kuantitatif, Soal Cerita): isi `verify` = `{"expr": "<ekspresi Python>",
  "expect": "<teks opsi kunci>"}` — `eval(expr)` harus sama dengan nilai di opsi kunci (dicek otomatis).
  Perbandingan kuantitatif memakai opsi baku: A "P > Q", B "P < Q", C "P = Q", D "Hubungan P dan Q tidak dapat
  ditentukan", E "P = 2Q" (atau variasi yang konsisten) — `verify.expr` boleh mengembalikan string opsi.
- Figural: `image` = path relatif PNG (`figural/pNN-xx.png`), opsi berisi teks "Gambar A" … "Gambar E";
  gambar memuat soal + kelima pilihan berlabel A–E.

## Alur & berkas
- `docs/riset-cpns-2024-2027.md` — hasil riset (kisi-kisi resmi, tren 2024, prediksi 2027, **alokasi topik per paket**
  yang saling lepas), dengan sumber.
- `data/bank-soal-2027/paket-NN.json` — soal teks (TWK 30, TIU non-gambar 27, TKP 45) per paket.
- `data/bank-soal-2027/figural/` — 80 PNG + `figural.json` (8 per paket, entri berformat sama dengan `questions`).
- `scripts/bank-soal/validate.py` — validasi skema, sebaran, kunci, `verify`, duplikat lintas paket.
- `scripts/bank-soal/load.py` — hapus data lama (soal, paket, riwayat), buat kategori yang kurang, unggah gambar,
  buat soal & 10 paket via API admin, terbitkan.

## Status (15 Oktober 2026)
- Dimuat: 10 paket × 110 soal = **1.100 soal**, semua terbit (`data/bank-soal-2027/_loaded.json`). Validasi 0 error/0 peringatan.
- Ditinjau ulang oleh 5 reviewer independen (log: `data/bank-soal-2027/review/`), plus penyeimbangan panjang opsi.
- `shuffle_options` paket = false. API juga **tidak pernah mengacak opsi soal bergambar** (opsi "Gambar A–E" merujuk label di gambar).
- Seeder API (`SEED=true`) kini hanya mengisi konten contoh sekali (penanda `settings.seed_done`); restart API tidak membuat ulang paket/riwayat demo.
- Backup sebelum penggantian: `backups/sebelum-bank-soal-2027-20261015-103948.dump` (berisi 116 soal, 4 paket, 11 riwayat lama).
- Muat ulang dari nol: `python -I scripts/bank-soal/merge.py && python -I scripts/bank-soal/validate.py && python -I scripts/bank-soal/load.py --apply`.
