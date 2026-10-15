# Review bank soal paket 5 & 6 (TWK, TIU teks, TKP)

Status: SELESAI (15 Okt 2026). Figural tidak direviu (sudah diverifikasi mesin).
`merge.py --paket 5,6` dan `validate.py --paket 5,6` → **ERROR 0, PERINGATAN 0** (validasi penuh 10 paket juga 0/0).
Bobot, kunci, id, kategori, kesulitan, `basis`, dan `verify` **tidak berubah** di semua soal; yang diubah hanya teks
stem/opsi/pembahasan. Sebaran huruf kunci tetap: TWK 6/6/6/6/6 per paket, TKP 9/9/9/9/9 per paket.

## Metode
- **TWK (60):** kunci ditentukan sendiri dulu tanpa melihat kunci, baru dibandingkan. Fakta dicek ke riset dan teks
  resmi: UU 24/2009 (naskah peraturan.go.id), UU 23/2019 (naskah peraturan.go.id), UU 20/2023 (salinan DJPb),
  Penjelasan UU 30/2014 (Wikisource, salinan lembaran negara), KBBI daring (kbbi.kemendikdasmen.go.id).
- **TIU (54):** semua butir dikerjakan ulang dengan Python. Analitis dengan brute force semua permutasi (kunci unik).
  Silogisme dicek dengan pola logika. Numerik dihitung ulang, `verify.expr` dijalankan validator.
- **TKP (90):** urutan 5→1 disusun sendiri dulu tanpa melihat bobot, lalu dibandingkan dengan §4. Diperiksa juga:
  huruf/bobot di pembahasan, regulasi yang dikutip (harus ada di §3), isu partisan, dan petunjuk tak sengaja.

## Ringkasan
| Subtes | Diperiksa | OK tanpa perubahan | Diubah | Catatan |
|---|---|---|---|---|
| TWK | 60 | 55 | 5 | 60/60 kunci sama dengan jawaban reviewer; perbaikan kutipan hukum dan kejelasan stem |
| TIU teks | 54 | 54 | 0 | 54/54 kunci benar dan tunggal; tidak ada PK yang kebetulan P = 2Q selain P05-TIU-21 (kunci memang E) |
| TKP | 90 | 53 | 37 | Bobot 5 dan 1 sama dengan reviewer di 90/90; tidak ada bobot yang diubah. Perubahan untuk mengurangi petunjuk tak sengaja dan merapikan kutipan |

## Temuan TWK
| id | masalah | perbaikan | sumber |
|---|---|---|---|
| P05-TWK-11 | Pembahasan menulis definisi asas kecermatan seolah isi Pasal 10 ayat (1). Definisinya ada di Penjelasan Ps. 10(1) huruf d | Kutipan jadi "Pasal 10 ayat (1) huruf d + penjelasannya". Isi definisi diselaraskan: keputusan didasarkan pada informasi dan dokumen lengkap, dipersiapkan cermat sebelum ditetapkan | UU 30/2014 Ps. 10(1), Penjelasan Ps. 10(1)d (id.wikisource.org/wiki/Halaman:UU_30_2014.pdf/74) |
| P06-TWK-05 | Opsi kunci C dan pembahasan menyebut "hasil ubahan dilarang disebarluaskan" tanpa unsur "untuk tujuan komersial" (Ps. 64 huruf b) | Opsi C dilengkapi "untuk tujuan komersial". Pembahasan merinci huruf a–c | UU 24/2009 Ps. 64 |
| P06-TWK-06 | Pembahasan memparafrasakan nilai harmonis secara tidak persis | Disesuaikan dengan teks: "menghargai setiap orang tanpa membedakan latar belakang; suka menolong; membangun lingkungan kerja yang kondusif" | UU 20/2023 Ps. 4(2)d |
| P06-TWK-19 | Angka hanya ditandai "diasumsikan", belum tegas hipotetis. Pembahasan berupa satu kalimat panjang bersambung koma | Stem diubah: "misalkan … (angka hipotetis, bukan jumlah sebenarnya)". Pembahasan dirapikan: ayat (1) soal cara pemilihan, ayat (2) soal jumlah sama dan ≤ 1/3 DPR (600 : 3 = 200; 4 × 40 = 160). Kunci tetap A dan tunggal | UUD NRI 1945 Ps. 22C(1)–(2) |
| P06-TWK-22 | Letak kiri/kanan pada perisai sering ditafsirkan dari sudut pengamat; sumber populer saling bertentangan | Stem menegaskan bahwa letak dikutip dari Ps. 48. Pembahasan menegaskan kunci ditentukan oleh pasangan lambang–sila, bukan tafsiran kiri/kanan. Semua pengecoh salah karena pasangan lambang–silanya, bukan letaknya. Kunci tetap E | UU 24/2009 Ps. 48(1)–(2) |

Diperiksa khusus dan **OK** (tanpa perubahan):
- **P05-TWK-04:** Ps. 15(1) UU 24/2009 cocok.
- **P05-TWK-06:** Ps. 4(2)e: "menjaga nama baik ASN, instansi, dan negara", sesuai teks.
- **P05-TWK-09:** PP 94/2021 Ps. 5, larangan menjadi perantara.
- **P05-TWK-13:** UU 23/2019 Ps. 7(3)e.
- **P05-TWK-17:** Ps. 4(3) memuat "pelanggaran wilayah perbatasan, perompakan dan pencurian sumber daya alam".
- **P05-TWK-22:** Ps. 46–47.
- **P05-TWK-30:** Ps. 31.
- **P06-TWK-04:** Ps. 24 huruf b dan d.
- **P06-TWK-13:** Pasal 8 UU 23/2019 tentang lingkup pendidikan, setiap jalur/jenjang/jenis.
- **P06-TWK-27:** KBBI hanya mencatat "sekalipun" sebagai konjungsi (= meskipun). Jadi "belum sekalipun datang" (makna 'satu kali pun') salah, dan kunci D benar.
- **P06-TWK-30:** Ps. 36(3)–(4).
- Ejaan pengecoh bahasa (sekedar, ijin, Dimana, Apapun, himbau, lembab, terlanjur, handal, foto kopi) memang sengaja dipakai sebagai distraktor. Tidak ditemukan salah ejaan di stem, opsi kunci, atau pembahasan.

## Temuan TIU
Tidak ada perubahan. Hasil cek ulang (skrip reviewer):
- **Analitis, kunci unik:**
  - P05-TIU-09: E > B > C > A > D (1 susunan).
  - P05-TIU-10: urutan BADCE (1 susunan).
  - P05-TIU-11: 2 susunan; lantai 5 selalu Kepegawaian.
  - P05-TIU-12: dengan G di kursi 6 ada 4 susunan; hanya "Kiki di kursi 4" yang mungkin.
  - P06-TIU-09: 1 susunan; petak 4 abu-abu.
  - P06-TIU-10: 2 susunan; Keamanan Siber selalu Senin.
  - P06-TIU-11: 8 susunan; hanya "Ani–Gilang dipisahkan satu orang" yang selalu benar.
  - P06-TIU-12: 1 susunan; Jaringan = Arif, Rabu.
- **Silogisme:** semua valid.
  - P05-TIU-06: Ferio.
  - P05-TIU-07: middle term tidak terdistribusi, jadi "tidak dapat disimpulkan".
  - P05-TIU-08: tollens berantai; "hoaks bertambah" memang tidak pasti.
  - P06-TIU-07: Bocardo.
  - P06-TIU-08: kontraposisi.
- **Perbandingan kuantitatif:**
  - P05-TIU-21: P = 8, Q = 4. Stem bertanya "paling tepat", kunci E, dan pembahasan menjelaskan mengapa P = 2Q lebih tepat daripada P > Q.
  - P05-TIU-22: tak tentu.
  - P05-TIU-23: P = 360.000 > Q = 350.000.
  - P06-TIU-21: 255 < 256.
  - P06-TIU-22: P = Q = 3.
  - P06-TIU-23: 25% > 20%.
  - Tidak ada kunci A/B yang ternyata P = 2Q.

## Temuan TKP
Masalah utama: **petunjuk tak sengaja**. Pada naskah awal:
- Opsi bobot 5 memuat rangkaian "dan/lalu/serta/sambil" di 44/45 (P5) dan 43/45 (P6) butir.
- Opsi bobot 5 hampir tak pernah memakai "karena/agar/supaya/sehingga": 6/45 dan 4/45.
- Sebaliknya, kata alasan muncul di 61 (P5) dan 48 (P6) dari 90 opsi bobot 1–2.
- Di beberapa butir, opsi 5 juga jauh lebih panjang, hingga 86 karakter lebih panjang dari opsi terpanjang berikutnya.

Perbaikan dilakukan dengan mengubah redaksi secara wajar tanpa mengubah makna maupun urutan bobot:
- opsi 4/3 diberi rangkaian tindakan;
- sebagian opsi 1–2 tidak lagi memakai "karena/agar";
- sebagian opsi 5 diberi klausa tujuan;
- opsi 5 yang terlalu panjang dipadatkan, atau opsi lain dilengkapi.

Hasil setelah perbaikan:

| Ukuran | Paket 5 sebelum | Paket 5 sesudah | Paket 6 sebelum | Paket 6 sesudah |
|---|---|---|---|---|
| Opsi bobot 4 yang memuat "dan/lalu/serta/sambil" | 32/45 | 39/45 | 29/45 | 38/45 |
| Opsi bobot 1–2 yang memuat "karena/agar/supaya/sehingga" | 61/90 | 48/90 | 48/90 | 37/90 |
| Opsi bobot 5 yang memuat "karena/agar/supaya/sehingga" | 6/45 | 10/45 | 4/45 | 6/45 |
| Selisih panjang maksimum (opsi 5 vs opsi terpanjang berikutnya) | 50 karakter | 31 karakter | 86 karakter | 36 karakter |

| id | masalah | perbaikan | sumber |
|---|---|---|---|
| P05-TKP-05 | Opsi bobot 2 bertanda "karena" | A(2) diredaksi ulang tanpa alasan | §4 aturan tulis |
| P05-TKP-06 | Opsi 1 dan 2 sama-sama bertanda alasan | D(2) dipadatkan tanpa "karena" | §4 |
| P05-TKP-07 | Hanya opsi rendah yang memakai "karena/agar" | C(3) tanpa "karena", diberi rangkaian tindakan | §4 |
| P05-TKP-13 | Hanya opsi 5 yang berupa rangkaian tindakan; opsi 4 dan 2 memakai "agar" | A(4) diberi rangkaian tindakan, C(2) tanpa "agar", D(5) dipadatkan | §4 |
| P05-TKP-15 | Opsi 5 jauh lebih panjang (+40) | E(4) dilengkapi "sebelum tenggat" | §4 (panjang seragam) |
| P05-TKP-18 | Opsi 4 dan 1 bertanda "agar/supaya" | E(4) diberi rangkaian tindakan, C(1) diredaksi | §4 |
| P05-TKP-20 | Opsi rendah bertanda "karena", opsi 5 tanpa alasan | E(5) diberi klausa tujuan, C(1) tanpa "karena" | §4 |
| P05-TKP-21 | Hanya opsi 5 yang berupa rangkaian tindakan; tiga opsi lain bertanda "agar" | C(5) diberi "agar", A(4) diberi rangkaian tindakan, D(3) tanpa "agar" | §4 |
| P05-TKP-23 | Empat opsi non-kunci bertanda "karena/agar/sehingga" | C(3) dan E(1) diredaksi tanpa alasan | §4 |
| P05-TKP-24 | Opsi 5 jauh lebih panjang (+42) | B(5) dipadatkan, C(4) dilengkapi | §4 |
| P05-TKP-25 | Opsi 2 bertanda "karena"; opsi 4 sangat pendek | C(5) diberi "agar", B(4) dilengkapi, D(2) tanpa "karena" | §4 |
| P05-TKP-27 | Opsi 1 dan 2 bertanda "karena" | C(2) diredaksi | §4 |
| P05-TKP-28 | Opsi 5 jauh lebih panjang (+50) | C(5) dipadatkan, A(4) dilengkapi | §4 |
| P05-TKP-30 | Opsi 5 jauh lebih panjang (+47) | C(5) dipadatkan, D(4) dilengkapi | §4 |
| P05-TKP-32 | Hanya opsi 5 yang berupa rangkaian tindakan; opsi lain bertanda "agar/karena" | E(5) disusun ulang, A(4) diberi rangkaian tindakan, C(1) tanpa "agar" | §4 |
| P05-TKP-36 | Opsi 1 bertanda "karena" | D(1) diredaksi | §4 |
| P05-TKP-37 | Opsi 2 bertanda "karena", opsi 5 tanpa alasan | D(5) diberi "agar", C(2) diredaksi | §4 |
| P05-TKP-38 | Hanya opsi 5 yang berupa rangkaian tindakan dan terpanjang (+48) | B(5) dipadatkan, C(4) diberi rangkaian tindakan, E(2) tanpa "karena" | §4 |
| P05-TKP-42 | Opsi 2 bertanda "karena"; opsi 3 sangat pendek | A(2) dan D(3) diredaksi | §4 |
| P05-TKP-44 | Opsi 5 jauh lebih panjang (+41) | A(4) dilengkapi | §4 |
| P05-TKP-45 | Pembahasan mengklaim Perpres 8/2026 memuat "pendekatan pencegahan berbasis masyarakat"; isi ini tidak terverifikasi di §3 | Klaim dilunakkan menjadi "sejalan dengan semangat RAN PE (Perpres 8/2026) dan moderasi beragama" | riset §3 |
| P06-TKP-01 | Hanya opsi 5 yang berupa rangkaian tindakan; opsi 2 bertanda "karena" | C(5) diberi "agar", A(4) diberi rangkaian tindakan, B(2) diredaksi. Pembahasan A(4) disesuaikan | §4 |
| P06-TKP-07 | Opsi 5 jauh lebih panjang (+57) | D(5) dipadatkan, A(4) dilengkapi (makna "keluarga belum mendapat kepastian" tetap) | §4 |
| P06-TKP-09 | Opsi 2 bertanda "karena", opsi 5 tanpa alasan | E(5) diberi "agar", A(2) dipadatkan | §4 |
| P06-TKP-10 | Hanya opsi 5 yang berupa rangkaian tindakan; opsi 4 bertanda "agar" | D(4) diberi rangkaian tindakan tanpa "agar" | §4 |
| P06-TKP-12 | Opsi 5 jauh lebih panjang (+33) | B(4) dilengkapi | §4 |
| P06-TKP-24 | Opsi 4 dan 1 bertanda "agar" | E(5) diberi "agar", B(4) dan C(1) diredaksi | §4 |
| P06-TKP-25 | Opsi 4 sangat pendek; opsi 1 bertanda "agar" | B(4) dilengkapi, D(1) diredaksi | §4 |
| P06-TKP-27 | Opsi 5 terpanjang dengan selisih +74 | A(5) dipadatkan, D(4) dan B(3) dilengkapi | §4 |
| P06-TKP-28 | Pembahasan menyebut "prinsip Satu Data (Perpres 82/2023)"; menurut §3, Satu Data adalah salah satu layanan prioritas Perpres 82/2023. Opsi 5 juga terlalu panjang | Pembahasan diluruskan, B(5) dipadatkan | riset §3 |
| P06-TKP-29 | Hanya opsi 5 yang berupa rangkaian tindakan dan terpanjang (+56); opsi 1 bertanda "karena" | C(5) dipadatkan; E(4) dan B(3) diberi rangkaian tindakan; D(1) diredaksi | §4 |
| P06-TKP-31 | Pembahasan menyebut Perpres 82/2023 sebagai "kebijakan SPBE" | Diganti "kebijakan transformasi digital dan keterpaduan layanan (Perpres 82/2023)" | riset §3 |
| P06-TKP-35 | Hanya opsi 5 yang berupa rangkaian tindakan; ketiga opsi lain bertanda "agar/karena" | E(5) diberi "agar"; C(4), A(3), dan B(2) diredaksi | §4 |
| P06-TKP-37 | Opsi 5 jauh lebih panjang (+74); hanya opsi 5 yang berupa rangkaian tindakan | E(5) dipadatkan, B(4) diberi rangkaian tindakan, D(1) tanpa "agar" | §4 |
| P06-TKP-39 | Opsi 5 jauh lebih panjang (+86); opsi 3 dan 2 bertanda "agar/karena" | C(5) dipadatkan; A(4), B(3), dan D(2) diredaksi | §4 |
| P06-TKP-41 | Hanya opsi 5 yang berupa rangkaian tindakan; opsi 2 bertanda "agar" | A(4) dilengkapi, B(2) diredaksi | §4 |
| P06-TKP-43 | Opsi 2 dan 1 bertanda "karena/agar" | B(2) dan C(1) diredaksi | §4 |

Diperiksa dan **OK** (tanpa perubahan):
- Semua pembahasan menyebut huruf dan bobot yang cocok dengan opsi, berurutan 5→1 (dicek skrip).
- Tidak ada opsi berbobot ≥ 4 yang melanggar aturan atau etika.
- Regulasi yang dikutip hanya dari §3: UU 8/2016, PP 42/2020, SE MenPANRB 137/2018, UU 20/2023, Perpres 82/2023, UU 27/2022, Perpres 58/2023, Perpres 8/2026, dan SE Menkominfo 9/2023.
- Tidak ada isu partisan. P05-TKP-22 menguji netralitas tanpa menyebut calon atau partai.

## Catatan yang masih bisa diperdebatkan (dibiarkan)
- **P06-TKP-19:** A "ikut datang terlambat" diberi 2, B "menyindir di grup kantor" diberi 1. Keduanya sama-sama paling rendah dan bisa dipertahankan menurut §4: B memperburuk hubungan. Namun ada juga yang berpendapat A lebih rendah karena melanggar jam kerja.
- **P06-TKP-45:** D "membiarkan semua komentar" diberi 3, A "menghapus unggahan ucapan" diberi 2. Ini sesuai §4 (3 = mengabaikan, 2 = mengalah pada tekanan). Namun membiarkan ajakan menyerang rumah ibadah tetap tampil juga bisa dinilai lebih buruk.
- **P05-TKP-16, P05-TKP-20, P05-TKP-30:** reviewer menukar bobot 2↔3 atau 3↔4. Kunci penulis tetap sesuai rumusan §4, jadi tidak diubah.
- **Petunjuk residual TKP:** opsi 5 masih hampir selalu berupa rangkaian tindakan (kini opsi 4 juga, 38–39/45). Kata alasan masih lebih sering muncul di opsi rendah, tetapi jauh berkurang. Menghapusnya sepenuhnya berarti menulis ulang banyak butir yang isinya sudah baik.
- **P05-TWK-17:** 150 mil laut dianggap masih dalam ZEE (UU 5/1983, 200 mil). Di perairan sempit, batas ZEE ditentukan perjanjian, tetapi stem tidak menyebut lokasi spesifik, jadi kunci tetap dapat dipertahankan.
