/** Isi artikel: Materi SKD CPNS — Kisi-kisi TWK, TIU, dan TKP. Skema: docs/SEO.md. */
const article = {
  intro:
    '**Materi SKD CPNS** terdiri atas tiga subtes: **TWK** (Tes Wawasan Kebangsaan) tentang nasionalisme, integritas, bela negara, pilar negara, dan bahasa negara; **TIU** (Tes Intelegensia Umum) tentang kemampuan verbal, numerik, dan figural; serta **TKP** (Tes Karakteristik Pribadi) tentang sikap kerja seperti pelayanan publik dan jejaring kerja. Pada seleksi terakhir, ketiganya dikerjakan dalam satu sesi CAT berisi 110 soal selama 100 menit.',
  sections: [
    {
      id: 'format-skd',
      title: 'Seperti apa format SKD CPNS?',
      blocks: [
        {
          type: 'p',
          text: 'SKD (Seleksi Kompetensi Dasar) adalah tes yang wajib diikuti semua pelamar CPNS, apa pun jabatannya. Tes dikerjakan di komputer dengan sistem CAT BKN. Acuan terakhir adalah seleksi CPNS 2024 (KepmenPANRB No. 321 Tahun 2024):',
        },
        {
          type: 'table',
          head: ['Subtes', 'Soal', 'Penilaian', 'Nilai maks.', 'Passing grade'],
          rows: [
            ['TWK', '30', 'Benar 5, salah/kosong 0', '150', '65'],
            ['TIU', '35', 'Benar 5, salah/kosong 0', '175', '80'],
            ['TKP', '45', 'Setiap opsi bernilai 1–5', '225', '166'],
            ['Total', '110 soal, 100 menit', '—', '550', 'Semua subtes wajib lolos'],
          ],
        },
        {
          type: 'p',
          text: 'Format ini bisa berubah untuk seleksi CPNS 2027, tetapi kisi-kisi materinya cenderung stabil. Cara menghitung nilai dan contoh perhitungannya ada di [panduan passing grade SKD](/panduan/passing-grade-skd).',
        },
      ],
    },
    {
      id: 'materi-twk',
      title: 'Apa saja materi TWK?',
      blocks: [
        {
          type: 'p',
          text: 'TWK mengukur penguasaan pengetahuan sekaligus kemampuan menerapkan nilai-nilai kebangsaan. Kisi-kisinya terbagi menjadi lima kelompok:',
        },
        {
          type: 'table',
          head: ['Sub-materi', 'Contoh cakupan'],
          rows: [
            ['Nasionalisme', 'Semangat kebangsaan, cinta tanah air, dan sejarah perjuangan bangsa, seperti Sumpah Pemuda 28 Oktober 1928 dan sidang BPUPKI'],
            ['Integritas', 'Kejujuran, tanggung jawab, konsistensi antara ucapan dan tindakan, serta sikap antikorupsi'],
            ['Bela negara', 'Hak dan kewajiban warga negara dalam usaha pertahanan dan keamanan negara, serta kesadaran berbangsa'],
            ['Pilar negara', 'Pancasila, UUD NRI Tahun 1945, Negara Kesatuan Republik Indonesia (NKRI), dan Bhinneka Tunggal Ika'],
            ['Bahasa negara', 'Kedudukan dan fungsi bahasa Indonesia serta penggunaan bahasa yang baik dan benar'],
          ],
        },
        { type: 'h3', text: 'Cara belajar TWK' },
        {
          type: 'ul',
          items: [
            'Kuasai teks dasar: lima sila Pancasila, Pembukaan UUD 1945, dan pasal-pasal pokok, misalnya Pasal 1 (bentuk negara, kedaulatan, dan negara hukum), Pasal 27, Pasal 28, dan Pasal 30.',
            'Pahami alur sejarah penting: Sumpah Pemuda, BPUPKI dan PPKI, Proklamasi 17 Agustus 1945, hingga perumusan dasar negara.',
            'Latih soal penerapan nilai. Banyak soal TWK menyajikan situasi sehari-hari lalu menanyakan sikap yang paling mencerminkan nilai tertentu.',
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Belajar dari kesalahan',
          text: 'Saat salah menjawab soal TWK, catat bukan hanya kuncinya, tetapi juga konsep yang belum kamu pahami. Konsep yang sama sering muncul lagi dengan redaksi berbeda.',
        },
      ],
    },
    {
      id: 'materi-tiu',
      title: 'Apa saja materi TIU?',
      blocks: [
        { type: 'p', text: 'TIU mengukur kemampuan berpikir, bukan hafalan. Soalnya terbagi ke dalam tiga kelompok besar:' },
        {
          type: 'table',
          head: ['Kelompok', 'Bentuk soal yang umum'],
          rows: [
            ['Verbal', 'Analogi (hubungan kata), silogisme (penarikan kesimpulan), dan soal analitis'],
            ['Numerik', 'Berhitung, deret angka, perbandingan kuantitatif, dan soal cerita'],
            ['Figural', 'Analogi gambar, ketidaksamaan gambar, dan serial gambar'],
          ],
        },
        { type: 'h3', text: 'Cara belajar TIU' },
        {
          type: 'ul',
          items: [
            'Ulang dasar matematika: operasi pecahan dan persen, perbandingan senilai dan berbalik nilai, serta hubungan jarak, kecepatan, dan waktu.',
            'Untuk deret, periksa secara berurutan: selisih antarsuku, rasio, lalu pola selang-seling atau bertingkat.',
            'Untuk silogisme, pegang aturan sederhana: jika premis memakai kata "sebagian", kesimpulan tidak boleh berlaku untuk "semua".',
            'Latih soal figural dengan memperhatikan satu unsur dalam satu waktu: arah putaran, jumlah, warna, lalu posisi.',
          ],
        },
        {
          type: 'p',
          text: 'Contoh soal TIU beserta langkah penyelesaiannya bisa kamu lihat di [contoh soal SKD](/panduan/contoh-soal-skd).',
        },
      ],
    },
    {
      id: 'materi-tkp',
      title: 'Apa saja materi TKP?',
      blocks: [
        {
          type: 'p',
          text: 'TKP menilai bagaimana kamu bersikap dalam situasi kerja. Setiap soal punya lima opsi dengan nilai 1 sampai 5; yang membedakan adalah seberapa tepat sikap yang kamu pilih. Aspek yang dinilai meliputi:',
        },
        {
          type: 'table',
          head: ['Aspek', 'Yang dinilai'],
          rows: [
            ['Pelayanan publik', 'Sikap melayani masyarakat dengan ramah, cepat, adil, dan sesuai prosedur'],
            ['Jejaring kerja', 'Kemampuan membangun hubungan kerja dan bekerja sama dalam tim'],
            ['Sosial budaya', 'Kemampuan beradaptasi dan menghargai perbedaan di lingkungan yang beragam'],
            ['Teknologi informasi dan komunikasi (TIK)', 'Kemauan memanfaatkan teknologi untuk meningkatkan kinerja'],
            ['Profesionalisme', 'Kesungguhan, tanggung jawab, dan kualitas dalam bekerja'],
            ['Anti radikalisme', 'Sikap menolak paham radikal dan menjaga persatuan dalam keberagaman'],
          ],
        },
        { type: 'h3', text: 'Cara belajar TKP' },
        {
          type: 'ul',
          items: [
            'Pilih opsi yang menyelesaikan masalah secara aktif, bukan yang menunda atau melempar tanggung jawab.',
            'Utamakan kepentingan organisasi dan masyarakat, tetapi tetap dalam koridor aturan.',
            'Waspadai opsi yang terdengar baik tetapi melanggar prosedur; nilainya biasanya tidak tinggi.',
            'Passing grade TKP pada seleksi terakhir adalah 166 dari 225, atau rata-rata sekitar **3,7 poin per soal**. Artinya, sebagian besar jawabanmu perlu berada di opsi bernilai 4 atau 5.',
          ],
        },
      ],
    },
    {
      id: 'urutan-belajar',
      title: 'Bagaimana urutan belajar materi SKD yang efektif?',
      blocks: [
        {
          type: 'ol',
          items: [
            '**Mulai dari tryout diagnostik** untuk mengetahui subtes dan sub-materi terlemah.',
            '**Bangun fondasi TWK dan TIU dasar** di minggu-minggu awal: pilar negara, sejarah pokok, operasi hitung, dan pola analogi.',
            '**Latih TKP sejak awal** sedikit demi sedikit, karena kepekaan memilih opsi terbaik terbentuk dari kebiasaan.',
            '**Naik ke soal yang lebih sulit**, seperti TIU figural, soal cerita, dan TWK penerapan, setelah dasarnya kuat.',
            '**Tutup dengan tryout berkala** untuk melatih ketahanan dan manajemen waktu 100 menit.',
          ],
        },
        {
          type: 'p',
          text: 'Jadwal mingguan yang lebih rinci ada di [panduan belajar CPNS dari nol](/panduan/belajar-cpns-dari-nol).',
        },
      ],
    },
    {
      id: 'sumber-belajar',
      title: 'Dari mana sumber belajar SKD yang bisa dipercaya?',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Pengumuman resmi** di [SSCASN BKN](https://sscasn.bkn.go.id) dan [KemenPANRB](https://www.menpan.go.id) untuk format, kisi-kisi, dan passing grade terbaru.',
            '**Buku pelajaran PPKn dan sejarah** tingkat SMA untuk memperkuat dasar TWK.',
            '**Latihan soal dengan pembahasan** agar kamu memahami alasan di balik setiap jawaban. Di platform latihan ini, soal TWK, TIU, dan TKP bisa dilatih per sub-materi dengan pembahasan yang langsung muncul setelah menjawab. [Daftar gratis](/daftar) untuk mencobanya.',
            '**Tryout dengan sistem CAT** untuk menguji kesiapan secara utuh. Lihat [tryout CPNS gratis](/panduan/tryout-cpns-gratis).',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Hati-hati dengan "bocoran soal"',
          text: 'SKD dikerjakan langsung di sistem CAT BKN. Pihak yang menjual bocoran soal atau menjanjikan kelulusan patut dicurigai sebagai penipuan.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Apa saja materi SKD CPNS?',
      a: 'SKD terdiri atas TWK (nasionalisme, integritas, bela negara, pilar negara, bahasa negara), TIU (verbal, numerik, figural), dan TKP (pelayanan publik, jejaring kerja, sosial budaya, TIK, profesionalisme, anti radikalisme).',
    },
    {
      q: 'Subtes SKD mana yang paling sulit?',
      a: 'Tergantung latar belakangmu. TIU menuntut kecepatan berpikir, sedangkan TKP sering menjadi penentu karena passing grade-nya paling tinggi jika dibandingkan dengan nilai maksimalnya (sekitar 74%).',
    },
    {
      q: 'Apakah TWK hanya hafalan?',
      a: 'Tidak. Hafalan tetap diperlukan untuk hal pokok seperti sila Pancasila dan pasal penting UUD 1945, tetapi banyak soal menuntut kamu menerapkan nilai kebangsaan pada situasi nyata.',
    },
    {
      q: 'Apakah ada jawaban yang bernilai nol di TKP?',
      a: 'Setiap opsi TKP bernilai 1 sampai 5, jadi tidak ada opsi bernilai nol; soal yang tidak dijawab saja yang tidak mendapat nilai. Meski begitu, terlalu sering memilih opsi bernilai rendah membuat nilai sulit mencapai passing grade.',
    },
    {
      q: 'Apakah materi SKD 2027 akan berubah?',
      a: 'Per Oktober 2026 belum ada pengumuman resmi. Kisi-kisi SKD cenderung stabil, tetapi pastikan kembali saat aturan seleksi terbaru diterbitkan.',
    },
  ],
  sources: [
    { label: 'SSCASN BKN (portal pendaftaran resmi)', url: 'https://sscasn.bkn.go.id' },
    { label: 'Badan Kepegawaian Negara (BKN)', url: 'https://www.bkn.go.id' },
    { label: 'Kementerian PANRB', url: 'https://www.menpan.go.id' },
  ],
};

export default article;
