/** Isi artikel: Passing Grade SKD CPNS & Cara Menghitung Nilai. Skema: docs/SEO.md. */
const article = {
  intro:
    'Pada seleksi CPNS terakhir (2024, KepmenPANRB No. 321 Tahun 2024), **passing grade SKD adalah TWK 65, TIU 80, dan TKP 166**, dengan nilai total maksimal 550. Peserta memenuhi passing grade jika nilai **setiap subtes** mencapai ambang batasnya, lalu diperingkat berdasarkan nilai total. Angka untuk CPNS 2027 bisa berubah dan baru pasti setelah aturan resminya terbit.',
  sections: [
    {
      id: 'passing-grade-terbaru',
      title: 'Berapa passing grade SKD CPNS terbaru?',
      blocks: [
        {
          type: 'p',
          text: 'Passing grade atau nilai ambang batas adalah nilai minimal yang harus dicapai di setiap subtes SKD. Berikut acuan dari seleksi CPNS 2024:',
        },
        {
          type: 'table',
          head: ['Subtes', 'Soal', 'Sistem nilai', 'Nilai maks.', 'Passing grade', 'Setara dengan'],
          rows: [
            ['TWK', '30', 'Benar 5, salah/kosong 0', '150', '**65**', '13 soal benar'],
            ['TIU', '35', 'Benar 5, salah/kosong 0', '175', '**80**', '16 soal benar'],
            ['TKP', '45', 'Nilai 1–5 per opsi', '225', '**166**', 'Rata-rata ±3,7 per soal'],
            ['Total', '110', 'Waktu 100 menit', '550', '—', '—'],
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          title: 'Ini acuan 2024, bukan angka 2027',
          text: 'Passing grade untuk CPNS 2027 akan ditetapkan lewat aturan resmi yang baru dan bisa berbeda. Per Oktober 2026, aturan maupun jadwalnya belum diumumkan.',
        },
      ],
    },
    {
      id: 'cara-menghitung',
      title: 'Bagaimana cara menghitung nilai SKD?',
      blocks: [
        { type: 'p', text: 'Perhitungannya sederhana dan bisa kamu lakukan sendiri setelah tryout:' },
        {
          type: 'ul',
          items: [
            '**TWK** = jumlah jawaban benar × 5. Jawaban salah atau kosong bernilai 0, jadi tidak ada pengurangan nilai.',
            '**TIU** = jumlah jawaban benar × 5, dengan aturan yang sama seperti TWK.',
            '**TKP** = jumlah nilai opsi yang kamu pilih. Setiap opsi bernilai 1 sampai 5, sedangkan soal yang tidak dijawab tidak mendapat nilai.',
            '**Total SKD** = TWK + TIU + TKP, maksimal 550.',
          ],
        },
        { type: 'p', text: 'Contoh dua peserta berikut menunjukkan mengapa nilai total yang tinggi belum tentu lolos:' },
        {
          type: 'table',
          head: ['Komponen', 'Peserta A', 'Peserta B'],
          rows: [
            ['TWK', '20 benar → **100**', '12 benar → **60**'],
            ['TIU', '22 benar → **110**', '30 benar → **150**'],
            ['TKP', '**178**', '**195**'],
            ['Total', '**388**', '**405**'],
            ['Status', 'Memenuhi passing grade', 'Tidak memenuhi (TWK kurang 5 poin)'],
          ],
        },
        {
          type: 'p',
          text: 'Peserta B punya total lebih tinggi, tetapi gugur karena nilai TWK-nya 60, di bawah ambang 65. Selisihnya hanya satu soal benar. Inilah alasan strategi belajar harus menyeimbangkan ketiga subtes.',
        },
      ],
    },
    {
      id: 'soal-benar-minimal',
      title: 'Berapa soal yang harus benar agar lolos passing grade?',
      blocks: [
        {
          type: 'p',
          text: 'Dengan aturan nilai di atas, kebutuhan minimal setiap subtes bisa diterjemahkan menjadi jumlah soal. Hitungan ini berguna untuk menetapkan target saat latihan:',
        },
        {
          type: 'table',
          head: ['Subtes', 'Kebutuhan minimal', 'Artinya'],
          rows: [
            ['TWK', '13 dari 30 soal benar', 'Maksimal 17 soal salah atau kosong'],
            ['TIU', '16 dari 35 soal benar', 'Maksimal 19 soal salah atau kosong'],
            ['TKP', 'Total nilai 166 dari 45 soal', 'Misalnya 31 opsi bernilai 4 dan 14 opsi bernilai 3 (124 + 42 = 166)'],
          ],
        },
        {
          type: 'p',
          text: 'Untuk TKP ada banyak kombinasi. Jika sisanya bernilai 3, kamu butuh minimal 16 opsi bernilai 5 (80 + 87 = 167). Angka-angka ini hanya batas bawah untuk lolos ambang; untuk bersaing di peringkat, kamu tetap membutuhkan nilai yang lebih tinggi.',
        },
      ],
    },
    {
      id: 'tkp-penentu',
      title: 'Kenapa TKP sering menjadi penentu?',
      blocks: [
        { type: 'p', text: 'Jika dibandingkan dengan nilai maksimalnya, ambang batas TKP jauh lebih tinggi daripada dua subtes lain:' },
        {
          type: 'table',
          head: ['Subtes', 'Passing grade ÷ nilai maksimal', 'Persentase'],
          rows: [
            ['TWK', '65 ÷ 150', '±43%'],
            ['TIU', '80 ÷ 175', '±46%'],
            ['TKP', '166 ÷ 225', '±74%'],
          ],
        },
        {
          type: 'p',
          text: 'Dengan 45 soal, nilai 166 berarti rata-rata sekitar 3,7 poin per soal. Sebagai gambaran, jika 30 jawabanmu bernilai 4 dan 15 sisanya bernilai 3, totalnya 165: masih kurang satu poin. Kamu tidak harus selalu memilih opsi bernilai 5, tetapi terlalu sering memilih opsi bernilai 3 ke bawah akan membuat TKP sulit menembus ambang. Pola opsi TKP dibahas di [contoh soal SKD](/panduan/contoh-soal-skd).',
        },
      ],
    },
    {
      id: 'jalur-khusus',
      title: 'Berapa passing grade jalur khusus?',
      blocks: [
        {
          type: 'p',
          text: 'Selain formasi umum, KepmenPANRB No. 321 Tahun 2024 mengatur ambang batas khusus untuk beberapa kelompok pelamar:',
        },
        {
          type: 'table',
          head: ['Jalur', 'Nilai total minimal', 'Nilai TIU minimal'],
          rows: [
            ['Lulusan cumlaude dan diaspora', '311', '85'],
            ['Penyandang disabilitas', '286', '60'],
            ['Putra/putri Papua', '286', '60'],
          ],
        },
        {
          type: 'p',
          text: 'Ketentuan rinci tiap jalur, termasuk syarat untuk bisa melamar di jalur tersebut, mengikuti pengumuman resmi. Untuk seleksi 2027, ambang jalur khusus juga bisa berubah.',
        },
      ],
    },
    {
      id: 'setelah-lolos',
      title: 'Lolos passing grade, apakah otomatis lanjut SKB?',
      blocks: [
        {
          type: 'p',
          text: 'Belum tentu. Memenuhi passing grade hanyalah syarat minimal. Peserta yang lolos kemudian diperingkat berdasarkan nilai total SKD, dan yang berhak mengikuti SKB maksimal **tiga kali jumlah kebutuhan formasi**.',
        },
        {
          type: 'p',
          text: 'Misalnya, sebuah jabatan membutuhkan 2 orang. Maka paling banyak 6 peserta dengan peringkat teratas yang lanjut ke SKB, meskipun ada 20 peserta yang memenuhi passing grade. Setelah SKB, nilai SKD dan SKB diintegrasikan untuk menentukan kelulusan akhir sesuai bobot yang diatur dalam ketentuan seleksi. Alur lengkapnya ada di panduan [cara jadi PNS](/panduan/cara-jadi-pns).',
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Nilai total tetap penting',
          text: 'Karena peringkat ditentukan nilai total, targetkan nilai yang jauh di atas passing grade, terutama untuk formasi yang peminatnya banyak.',
        },
      ],
    },
    {
      id: 'target-nilai',
      title: 'Berapa target nilai yang aman saat tryout?',
      blocks: [
        {
          type: 'p',
          text: 'Tidak ada angka aman yang pasti karena persaingan berbeda di setiap formasi. Jadikan passing grade sebagai lantai, bukan target. Sebagai contoh, kamu bisa memakai target latihan berikut:',
        },
        {
          type: 'ul',
          items: [
            'TWK 85 atau lebih (17 soal benar).',
            'TIU 100 atau lebih (20 soal benar).',
            'TKP 180 atau lebih (rata-rata 4 poin per soal).',
          ],
        },
        {
          type: 'p',
          text: 'Angka di atas hanyalah contoh target pribadi, bukan aturan resmi. Saat tryout di platform latihan ini, skor setiap subtes langsung dibandingkan dengan passing grade, sehingga kamu tahu subtes mana yang masih di bawah target. Coba [tryout CPNS gratis](/panduan/tryout-cpns-gratis) atau [daftar di sini](/daftar) untuk mulai mengukur.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Berapa passing grade SKD CPNS 2027?',
      a: 'Per Oktober 2026 belum diumumkan. Acuan terakhir adalah seleksi 2024: TWK 65, TIU 80, dan TKP 166. Pantau pengumuman resmi di sscasn.bkn.go.id dan menpan.go.id.',
    },
    {
      q: 'Berapa nilai total minimal agar lolos SKD?',
      a: 'Untuk formasi umum, syaratnya adalah setiap subtes mencapai passing grade. Secara hitungan, nilai total terendah yang memenuhi ketiganya adalah 311 (65 + 80 + 166). Jalur khusus punya ambang total tersendiri, misalnya 311 untuk cumlaude dan diaspora serta 286 untuk penyandang disabilitas dan putra/putri Papua.',
    },
    {
      q: 'Apakah jawaban salah mengurangi nilai SKD?',
      a: 'Tidak. Pada TWK dan TIU, jawaban salah dan kosong sama-sama bernilai 0. Karena itu, sebaiknya semua soal tetap dijawab.',
    },
    {
      q: 'Mengapa tidak lolos padahal nilai total tinggi?',
      a: 'Kemungkinan besar ada satu subtes yang belum mencapai passing grade. Kelulusan SKD mensyaratkan setiap subtes lolos, bukan hanya nilai total yang tinggi.',
    },
    {
      q: 'Apakah memenuhi passing grade berarti pasti lanjut SKB?',
      a: 'Tidak selalu. Peserta yang lolos diperingkat berdasarkan nilai total, dan yang lanjut ke SKB maksimal tiga kali jumlah kebutuhan formasi.',
    },
  ],
  sources: [
    { label: 'Kementerian PANRB (regulasi seleksi CASN)', url: 'https://www.menpan.go.id' },
    { label: 'SSCASN BKN (portal pendaftaran resmi)', url: 'https://sscasn.bkn.go.id' },
    { label: 'Badan Kepegawaian Negara (BKN)', url: 'https://www.bkn.go.id' },
  ],
};

export default article;
