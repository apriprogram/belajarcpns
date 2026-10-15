/** Isi artikel: Tryout CPNS Online Gratis dengan Sistem CAT. Skema: docs/SEO.md. */
const article = {
  intro:
    '**Tryout CPNS gratis** di platform latihan ini meniru alur CAT BKN: 110 soal SKD (TWK, TIU, TKP) dikerjakan dalam 100 menit, dengan timer yang dihitung server dan jawaban yang tersimpan otomatis. Setelah selesai, kamu langsung melihat skor per subtes, status terhadap passing grade, peringkat, dan pembahasan tiap soal, tanpa biaya dan tanpa iklan.',
  sections: [
    {
      id: 'apa-itu-tryout-cat',
      title: 'Apa itu tryout CAT CPNS dan kenapa penting?',
      blocks: [
        {
          type: 'p',
          text: 'SKD CPNS dikerjakan dengan **CAT (Computer Assisted Test)** milik BKN: soal tampil di layar, kamu memilih jawaban dengan mengklik, dan waktu berjalan mundur. Tryout CAT adalah simulasi dari pengalaman itu. Manfaatnya bukan hanya mengukur nilai, tetapi juga:',
        },
        {
          type: 'ul',
          items: [
            '**Melatih manajemen waktu.** Rata-rata kamu hanya punya sekitar 54 detik per soal (100 menit untuk 110 soal).',
            '**Membiasakan diri dengan tampilan ujian**, seperti panel nomor soal dan tanda ragu-ragu, sehingga tidak canggung di hari ujian.',
            '**Memetakan kelemahan per subtes dan sub-materi**, supaya waktu belajarmu lebih terarah.',
            '**Melatih ketahanan fokus** selama 100 menit tanpa jeda.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          title: 'Simulasi, bukan ujian resmi',
          text: 'Tryout di sini adalah latihan mandiri dan bukan bagian dari seleksi resmi. Platform ini bukan situs resmi BKN, dan soalnya disusun mengikuti kisi-kisi SKD, bukan soal asli CAT BKN.',
        },
      ],
    },
    {
      id: 'fitur-tryout',
      title: 'Fitur apa saja yang tersedia di tryout ini?',
      blocks: [
        {
          type: 'table',
          head: ['Fitur', 'Manfaatnya'],
          rows: [
            ['110 soal dalam 100 menit', 'Mengikuti format SKD seleksi terakhir: TWK 30, TIU 35, dan TKP 45 soal'],
            ['Timer dihitung server', 'Sisa waktu tetap akurat walaupun halaman dimuat ulang'],
            ['Simpan otomatis', 'Setiap jawaban langsung tersimpan; ujian bisa dilanjutkan setelah koneksi putus'],
            ['Panel nomor dan tanda ragu-ragu', 'Berpindah antarsoal dengan cepat dan menandai soal yang ingin dicek ulang'],
            ['Skor per subtes dan status lulus', 'Nilai TWK, TIU, dan TKP langsung dibandingkan dengan passing grade'],
            ['Peringkat', 'Melihat posisimu dibanding peserta lain'],
            ['Pembahasan tiap soal', 'Kunci jawaban, bobot opsi TKP, dan penjelasan singkat'],
            ['Riwayat dan grafik progres', 'Memantau perkembangan nilai dari tryout ke tryout'],
          ],
        },
        {
          type: 'p',
          text: 'Selain tryout, tersedia juga latihan soal per sub-materi TWK, TIU, dan TKP dengan pembahasan langsung, target belajar harian, dan live group chat untuk berdiskusi dengan sesama peserta.',
        },
      ],
    },
    {
      id: 'cara-ikut-tryout',
      title: 'Bagaimana cara ikut tryout CPNS gratis?',
      blocks: [
        {
          type: 'ol',
          items: [
            '**[Daftar akun gratis](/daftar)** dengan nama, email, nomor HP, dan kata sandi.',
            '**Masuk ke dashboard**, lalu buka menu **Tryout**.',
            '**Pilih paket tryout** yang tersedia, perhatikan durasi dan jumlah soalnya, lalu klik **Mulai**.',
            '**Kerjakan seperti ujian sungguhan.** Gunakan panel nomor untuk berpindah soal dan tanda ragu-ragu untuk soal yang ingin dicek ulang.',
            '**Klik Selesai** setelah semua soal terjawab. Jika waktu habis, jawaban dikirim otomatis.',
            '**Pelajari hasilnya**: skor per subtes, status terhadap passing grade, peringkat, dan pembahasan tiap soal.',
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Kondisikan seperti hari ujian',
          text: 'Kerjakan tryout dalam sekali duduk, tanpa membuka catatan, dengan ponsel dalam mode senyap. Hasil yang jujur jauh lebih berguna daripada nilai tinggi yang semu.',
        },
      ],
    },
    {
      id: 'membaca-hasil',
      title: 'Bagaimana membaca hasil tryout?',
      blocks: [
        { type: 'p', text: 'Jangan berhenti di nilai total. Baca hasil tryout dengan urutan berikut:' },
        {
          type: 'ol',
          items: [
            '**Cek status per subtes.** Subtes yang masih di bawah passing grade adalah prioritas pertama, berapa pun nilai totalmu.',
            '**Hitung jarak ke target.** Misalnya, nilai TWK 55 berarti kamu butuh 2 soal benar lagi untuk mencapai 65.',
            '**Baca pembahasan soal yang salah dan yang ditebak.** Soal yang benar karena menebak sama pentingnya untuk dipelajari dengan soal yang salah.',
            '**Latih sub-materi yang lemah** lewat latihan per sub-materi, lalu ulangi tryout untuk melihat apakah nilainya naik.',
          ],
        },
        {
          type: 'p',
          text: 'Riwayat dan grafik progres membantu kamu melihat tren, bukan sekadar satu hasil. Nilai yang naik turun itu wajar; yang penting arahnya menanjak. Cara menghitung nilai secara manual dijelaskan di [panduan passing grade SKD](/panduan/passing-grade-skd).',
        },
      ],
    },
    {
      id: 'latihan-vs-tryout',
      title: 'Apa bedanya latihan soal dan tryout?',
      blocks: [
        {
          type: 'p',
          text: 'Keduanya saling melengkapi. Latihan dipakai untuk memahami konsep dan pola soal, sedangkan tryout dipakai untuk menguji apakah pemahaman itu bertahan di bawah tekanan waktu.',
        },
        {
          type: 'table',
          head: ['Aspek', 'Latihan per sub-materi', 'Tryout'],
          rows: [
            ['Tujuan', 'Memahami konsep dan mengenali pola soal', 'Mengukur kesiapan secara utuh'],
            ['Waktu', 'Bebas, sesuai kecepatanmu', '100 menit untuk 110 soal, timer dari server'],
            ['Pembahasan', 'Langsung muncul setelah menjawab', 'Bisa dibaca setelah tryout selesai'],
            ['Kapan dipakai', 'Hampir setiap hari', 'Berkala, sesuai fase belajar'],
          ],
        },
        {
          type: 'p',
          text: 'Pola yang efektif: gunakan hasil tryout untuk menemukan sub-materi yang lemah, latih sub-materi itu selama beberapa hari, lalu buktikan kemajuannya di tryout berikutnya. Daftar sub-materi yang bisa kamu latih ada di [panduan materi SKD](/panduan/materi-skd-cpns).',
        },
      ],
    },
    {
      id: 'seberapa-sering',
      title: 'Seberapa sering sebaiknya ikut tryout?',
      blocks: [
        {
          type: 'p',
          text: 'Tryout yang terlalu jarang membuatmu kehilangan gambaran kemajuan, sedangkan tryout terlalu sering tanpa evaluasi juga kurang bermanfaat. Pola berikut bisa kamu pakai:',
        },
        {
          type: 'table',
          head: ['Fase', 'Frekuensi', 'Fokus'],
          rows: [
            ['Awal belajar', '1 kali', 'Tryout diagnostik untuk memetakan kelemahan'],
            ['Membangun dasar', '1 kali tiap 2 minggu', 'Mengukur dampak latihan per sub-materi'],
            ['Menjelang ujian', '1–2 kali per minggu', 'Stabilitas nilai dan manajemen waktu'],
          ],
        },
        {
          type: 'p',
          text: 'Untuk setiap tryout, sediakan waktu membaca pembahasan setidaknya sama panjang dengan waktu mengerjakannya. Strategi lengkapnya ada di [tips lolos SKD](/panduan/tips-lolos-skd).',
        },
      ],
    },
    {
      id: 'perangkat',
      title: 'Perangkat apa yang dibutuhkan?',
      blocks: [
        {
          type: 'p',
          text: 'Cukup browser modern dan koneksi internet. Tryout bisa dibuka di laptop maupun ponsel, tetapi laptop atau komputer lebih mirip dengan suasana CAT di lokasi ujian. Jika koneksi sempat terputus, jawaban yang sudah dipilih tetap tersimpan dan ujian bisa dilanjutkan. Karena waktu dihitung server, ingat bahwa waktu tetap berjalan selama koneksi terputus.',
        },
        {
          type: 'p',
          text: 'Siap mencoba? [Daftar gratis](/daftar), lalu mulai dari satu tryout untuk mengetahui posisimu saat ini. Kalau ingin pemanasan dulu, kerjakan [contoh soal SKD](/panduan/contoh-soal-skd) beserta pembahasannya.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Apakah tryout CPNS ini benar-benar gratis?',
      a: 'Ya. Daftar, latihan soal, dan tryout bisa digunakan tanpa biaya dan tanpa iklan.',
    },
    {
      q: 'Apakah soalnya sama dengan soal CAT BKN?',
      a: 'Tidak. Soal disusun mengikuti kisi-kisi dan format SKD, bukan soal asli BKN. Tujuannya melatih pemahaman materi, kecepatan, dan manajemen waktu.',
    },
    {
      q: 'Bagaimana jika koneksi internet putus saat tryout?',
      a: 'Jawaban tersimpan otomatis setiap kali kamu memilih opsi, dan timer dihitung server. Setelah tersambung kembali, kamu bisa melanjutkan ujian; waktu tetap berjalan selama koneksi terputus.',
    },
    {
      q: 'Apakah passing grade di tryout sama dengan aturan resmi?',
      a: 'Passing grade tiap paket diatur admin dan bawaannya mengikuti acuan seleksi terakhir (TWK 65, TIU 80, TKP 166). Nilainya dapat diperbarui bila ada aturan baru, jadi tetap cocokkan dengan pengumuman resmi.',
    },
    {
      q: 'Bisakah tryout dikerjakan lewat HP?',
      a: 'Bisa, melalui browser di ponsel. Namun, untuk simulasi yang paling mirip dengan ujian sebenarnya, gunakan laptop atau komputer.',
    },
  ],
  sources: [
    { label: 'SSCASN BKN (portal pendaftaran resmi)', url: 'https://sscasn.bkn.go.id' },
    { label: 'Badan Kepegawaian Negara (BKN)', url: 'https://www.bkn.go.id' },
    { label: 'Kementerian PANRB', url: 'https://www.menpan.go.id' },
  ],
};

export default article;
