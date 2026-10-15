# Penyeimbangan panjang opsi TWK paket 3–6 (+ P10-TKP-24)

15 Okt 2026. Tujuannya menghilangkan isyarat "kunci = opsi terpanjang" pada TWK paket 3–6. Caranya sama dengan
`review-p01-p02.md`: distraktor diperpanjang dengan alasan atau keterangan yang masuk akal tetapi tetap salah, dan pada
beberapa soal kunci dipadatkan tanpa mengubah makna. Id, bobot, huruf kunci, kategori, kesulitan, `basis`, pembahasan,
dan rujukan hukum tidak diubah. Setiap soal yang disunting dibaca ulang sebagai peserta, dan tiap soal tetap hanya
punya satu jawaban yang dapat dipertahankan.

Kunci yang menjadi opsi terpanjang tunggal (sebelum → sesudah): P03 12 → 4, P04 16 → 4, P05 16 → 6, P06 19 → 6 (dari 30).
`merge.py` dan `validate.py` menghasilkan 0 ERROR dan 0 PERINGATAN.

| id | perubahan |
|---|---|
| P03-TWK-01 | E diperpanjang ("…bangsa sendiri…, termasuk mengejek lawan") |
| P03-TWK-02 | B: "Batavia (kini Jakarta)" |
| P03-TWK-07 | C diperpanjang ("…lalu membiarkan anggota tim lain memutuskan nilai kontraknya") |
| P03-TWK-09 | A: "setelah berita acara serah terima ditandatangani" |
| P03-TWK-11 | D: "honor atau fasilitas … tenaga pendukung lain" |
| P03-TWK-13 | A: "…sebelum memutuskan sikap terhadap ajakan tersebut" |
| P03-TWK-17 | A: "hanya ancaman militer dari negara lain" |
| P03-TWK-18 | A: "…badan usaha swasta di wilayah kabupaten tersebut" (tetap lingkup pekerjaan) |
| P04-TWK-01 | A: "merendahkan bangsa dan negara lain" |
| P04-TWK-03 | A: "suara mayoritas dianggap selalu mencerminkan … anggota forum" |
| P04-TWK-06 | E: "aparat setempat … mendatangi lokasi secara langsung" |
| P04-TWK-07 | A: "jika sampel itu tidak menunjukkan kekurangan persyaratan" |
| P04-TWK-09 | A: "…dan sudah dikabarkan sebelumnya" |
| P04-TWK-14 | A (tugas Polri): "…di seluruh wilayah negara" |
| P04-TWK-16 | D: "kebakaran besar … warga kota Bandung bagian selatan" |
| P04-TWK-17 | B: "…negara lain maupun kelompok separatis" |
| P04-TWK-21 | C: "oleh MPR dalam sidang paripurna" |
| P04-TWK-24 | D: "…bahan ejekan di kelas" |
| P04-TWK-28 | B: "…puskesmas di daerah itu…" (kesalahan "antara … dengan" tetap) |
| P04-TWK-30 | C: "…Presiden dan Wakil Presiden, bukan bagi menteri" |
| P05-TWK-03 | D (kunci) dipadatkan: "Menjelaskan … wajib memakai Rupiah, lalu membina pedagang…"; E: "…dan harga dalam Rupiah ikut dicantumkan sebagai pembanding" |
| P05-TWK-04 | C: "…agar tidak terlambat" |
| P05-TWK-06 | C: "seragam dinas dan logo instansi yang terlihat jelas di layar" |
| P05-TWK-07 | D (kunci) dipadatkan ("agar sejalan dengan yang ia minta dari staf"); A: "tanggung jawab dan beban kerjanya jauh lebih besar" |
| P05-TWK-08 | E: "kesalahan tersebut sepenuhnya menjadi tanggung jawab atasan" |
| P05-TWK-10 | C (kunci) dipadatkan; E: "…meskipun warga lain yang datang lebih awal sudah lama menunggu giliran" |
| P05-TWK-12 | B (kunci) dipadatkan ("memberikan klarifikasi, lalu memperbaiki…"); A: "masalah pelayanan seperti itu … secara internal oleh unit" |
| P05-TWK-13 | C (kunci) dipadatkan (tanpa "secara rutin"); D: "…sebab keadaan darurat jarang sekali terjadi di kantornya" |
| P05-TWK-15 | C: "…didukung oleh TNI serta komponen pendukung" (komponen utama tetap salah) |
| P05-TWK-18 | A: "ke kota dekat keluarganya" |
| P06-TWK-01 | A: "negara tempat ia lahir dan dibesarkan sejak kecil" |
| P06-TWK-03 | A (kunci): "berdasarkan" → "sesuai"; E: "pemerintah kelurahan … relawan dari tiap rumah ibadah tidak perlu saling berkoordinasi" |
| P06-TWK-04 | B: "tanda tangan seluruh karyawan" |
| P06-TWK-05 | B: "keterangan "parodi" yang jelas sejak awal dan tidak dimaksudkan menghina … terhadap isi videonya" (tetap komersial, jadi tetap dilarang Ps. 64 huruf b–c) |
| P06-TWK-07 | E: "…dan bisa ikut memeriksanya" |
| P06-TWK-08 | C (kunci): "penambahan" → "tambahan"; B: "tanpa upaya tambahan … dianggap bukan tanggung jawab petugas di unit perekaman" |
| P06-TWK-09 | D: "karena ia memproses berkas warga itu lebih cepat daripada rekannya di loket sebelah" |
| P06-TWK-16 | E: "…dalam konferensi para komandan" (fakta 12 Nov tetap, salahnya pada Hari TNI) |
| P06-TWK-17 | E (kunci) dipadatkan ("karena …, sedangkan kapal Q berada di luarnya"); A: "lebar laut teritorial negara kepulauan … diukur dari garis pangkal kepulauan" |
| P06-TWK-25 | C: "dibuat dan ditetapkan sendiri oleh bank sentral agar independensinya terjaga sepenuhnya" |
| P06-TWK-27 | C: "Selama tiga tahun bekerja … ke tempat kerja" ("sekalipun" tetap salah tulis) |
| P06-TWK-29 | A: "…selain tekanan akademik dan perundungan" (tetap sesuai teks) |
| P06-TWK-30 | A: "agar menarik minat pembeli dari kalangan menengah atas" |
| P10-TKP-24 | "keturunan Tionghoa" → "dari kelompok etnis minoritas" di `body` dan `topic`. Opsi dan pembahasan tidak menyebut etnis. Bobot tidak berubah. |

Jumlah: 43 soal TWK (P03 8, P04 12, P05 10, P06 13) + 1 soal TKP.
