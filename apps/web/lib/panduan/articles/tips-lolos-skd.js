/** Isi artikel: Tips Lolos SKD CPNS — Strategi Belajar & Saat Ujian. Skema: docs/SEO.md. */
const article = {
  intro:
    'Kunci **lolos SKD CPNS** adalah memenuhi passing grade **di setiap subtes** (pada seleksi terakhir TWK 65, TIU 80, dan TKP 166), lalu meraih nilai total setinggi mungkin untuk bersaing di peringkat. Caranya: tutup kelemahan per subtes, latih manajemen waktu 100 menit untuk 110 soal, dan evaluasi kemajuan lewat tryout rutin.',
  sections: [
    {
      id: 'syarat-lolos',
      title: 'Apa artinya lolos SKD?',
      blocks: [
        {
          type: 'p',
          text: 'Lolos SKD berarti dua hal. Pertama, nilai TWK, TIU, dan TKP masing-masing harus mencapai passing grade. Kedua, peserta yang memenuhi passing grade diperingkat berdasarkan nilai total, dan yang lanjut ke SKB pada seleksi terakhir maksimal tiga kali kebutuhan formasi. Karena itu, kamu juga perlu nilai total yang kompetitif. Detail penghitungannya ada di [panduan passing grade SKD](/panduan/passing-grade-skd).',
        },
        {
          type: 'callout',
          tone: 'info',
          title: 'Acuan 2024, bukan angka final 2027',
          text: 'Passing grade dan format di panduan ini mengacu pada seleksi CPNS 2024. Per Oktober 2026, aturan dan jadwal CPNS 2027 belum diumumkan resmi.',
        },
      ],
    },
    {
      id: 'tips-belajar',
      title: 'Bagaimana cara belajar agar lolos SKD?',
      blocks: [
        {
          type: 'ol',
          items: [
            '**Mulai dari diagnosis.** Kerjakan satu tryout lengkap, lalu tentukan subtes yang paling jauh dari passing grade. Itu prioritas pertamamu.',
            '**Latih per sub-materi, bukan acak.** Fokus pada satu sub-materi sampai polanya terasa familiar, misalnya deret angka atau silogisme, baru pindah ke yang lain.',
            '**Simpan catatan kesalahan.** Tulis soal yang salah, jawaban yang benar, dan alasan kamu keliru. Baca ulang catatan ini setiap pekan.',
            '**Jangan tinggalkan TKP.** Ambang TKP setara sekitar 74% dari nilai maksimalnya, paling tinggi di antara ketiga subtes. Latih sedikit setiap hari agar kepekaan memilih opsi terbaik terbentuk.',
            '**Tryout berkala dengan waktu sungguhan.** Ukur kemajuan tiap satu atau dua minggu dan bandingkan skor per subtes, bukan hanya total.',
            '**Jaga ritme.** Belajar rutin 60–90 menit per hari lebih mudah dipertahankan daripada belajar berjam-jam lalu berhenti.',
          ],
        },
        {
          type: 'p',
          text: 'Jadwal belajar bertahap untuk pemula bisa kamu lihat di [panduan belajar CPNS dari nol](/panduan/belajar-cpns-dari-nol).',
        },
      ],
    },
    {
      id: 'manajemen-waktu',
      title: 'Bagaimana mengatur waktu 100 menit untuk 110 soal?',
      blocks: [
        {
          type: 'p',
          text: 'Rata-rata waktumu hanya sekitar 54 detik per soal. Karena karakter soal tiap subtes berbeda, bagi waktu sesuai jenis soalnya. Contoh pembagian berikut bisa kamu uji saat tryout, lalu sesuaikan:',
        },
        {
          type: 'table',
          head: ['Bagian', 'Soal', 'Alokasi contoh', 'Catatan'],
          rows: [
            ['TKP', '45', '30 menit', 'Baca situasi dengan teliti, pilih opsi yang paling solutif'],
            ['TWK', '30', '25 menit', 'Jangan terpaku pada satu soal hafalan'],
            ['TIU', '35', '40 menit', 'Lewati dulu soal hitungan yang panjang'],
            ['Cadangan', '—', '5 menit', 'Cek soal bertanda ragu-ragu dan pastikan tidak ada yang kosong'],
          ],
        },
        {
          type: 'ul',
          items: [
            '**Kerjakan yang paling kamu kuasai lebih dulu** jika sistem ujian memungkinkan berpindah nomor. Cara ini membangun kepercayaan diri dan mengamankan nilai.',
            '**Gunakan tanda ragu-ragu, lalu lanjut.** Kembali ke soal itu setelah soal-soal yang mudah selesai.',
            '**Jangan biarkan soal kosong.** Pada TWK dan TIU, jawaban salah bernilai 0, sama seperti soal kosong, jadi menjawab tidak merugikan. Pada TKP, soal yang tidak dijawab tidak mendapat nilai sama sekali.',
          ],
        },
      ],
    },
    {
      id: 'strategi-per-subtes',
      title: 'Bagaimana strategi mengerjakan TWK, TIU, dan TKP?',
      blocks: [
        { type: 'h3', text: 'TWK' },
        {
          type: 'ul',
          items: [
            'Baca kalimat pertanyaan di akhir soal lebih dulu untuk tahu apa yang ditanyakan, terutama pada soal cerita yang panjang.',
            'Pada soal penerapan nilai, pilih opsi yang paling sejalan dengan Pancasila, UUD 1945, dan semangat persatuan, bukan yang menguntungkan pihak tertentu.',
            'Jika ragu di antara dua opsi, cari kata kunci yang membedakan, misalnya musyawarah, keadilan, atau kepentingan umum.',
          ],
        },
        { type: 'h3', text: 'TIU' },
        {
          type: 'ul',
          items: [
            'Untuk deret angka, cek selisih, rasio, lalu pola selang-seling. Jika dalam 60–90 detik belum ketemu, tandai dan lanjut.',
            'Pada soal cerita, tulis informasi penting dalam bentuk angka sebelum menghitung.',
            'Manfaatkan opsi jawaban: kadang lebih cepat menguji opsi satu per satu daripada menghitung dari awal.',
          ],
        },
        { type: 'h3', text: 'TKP' },
        {
          type: 'ul',
          items: [
            'Bayangkan dirimu sebagai ASN yang melayani masyarakat: pilih sikap yang proaktif, tuntas, dan tetap taat aturan.',
            'Hindari opsi yang menolak, menunda, melempar tanggung jawab, atau mementingkan diri sendiri.',
            'Bedakan opsi bernilai 4 dan 5 dari tingkat ketuntasannya: opsi terbaik biasanya menyelesaikan akar masalah, bukan hanya gejalanya.',
          ],
        },
        {
          type: 'p',
          text: 'Latih pola-pola di atas dengan [contoh soal SKD beserta pembahasannya](/panduan/contoh-soal-skd).',
        },
      ],
    },
    {
      id: 'hari-ujian',
      title: 'Apa yang perlu disiapkan menjelang dan saat hari ujian?',
      blocks: [
        {
          type: 'ul',
          items: [
            '**Seminggu terakhir:** kurangi materi baru. Ulang catatan kesalahan dan kerjakan satu sampai dua tryout untuk menjaga ritme.',
            '**Sehari sebelumnya:** cek lokasi, jadwal sesi, dan dokumen yang wajib dibawa sesuai ketentuan di kartu ujian dan pengumuman resmi. Tidur cukup.',
            '**Di lokasi ujian:** datang lebih awal, ikuti arahan panitia, dan patuhi larangan membawa barang tertentu ke ruang ujian.',
            '**Saat mengerjakan:** pantau sisa waktu secara berkala, jangan panik ketika menemui soal sulit, dan sisihkan waktu di akhir untuk memeriksa soal bertanda ragu-ragu.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Tidak ada jalan pintas',
          text: 'Waspadai pihak yang menawarkan bocoran soal, joki, atau janji kelulusan dengan imbalan. Selain merugikan, praktik ini melanggar aturan seleksi. Informasi resmi hanya dari [SSCASN BKN](https://sscasn.bkn.go.id), [BKN](https://www.bkn.go.id), dan [KemenPANRB](https://www.menpan.go.id).',
        },
      ],
    },
    {
      id: 'kesalahan-umum',
      title: 'Kesalahan apa yang sering membuat gagal SKD?',
      blocks: [
        {
          type: 'ul',
          items: [
            'Hanya mengejar nilai total dan mengabaikan subtes yang lemah.',
            'Menghabiskan terlalu banyak waktu di beberapa soal TIU yang sulit, sehingga soal mudah di akhir tidak sempat dikerjakan.',
            'Memilih opsi TKP berdasarkan kebiasaan sehari-hari, bukan sikap ideal seorang pelayan publik.',
            'Tidak pernah berlatih dengan batas waktu 100 menit.',
            'Tidak membaca pembahasan setelah tryout, sehingga kesalahan yang sama terulang.',
          ],
        },
        {
          type: 'p',
          text: 'Untuk mengukur sejauh mana tips ini sudah kamu terapkan, ikuti [tryout CPNS gratis](/panduan/tryout-cpns-gratis) di platform latihan ini. Hasilnya menampilkan skor per subtes, status terhadap passing grade, dan peringkat, sehingga kamu tahu bagian mana yang perlu dikejar. [Daftar gratis](/daftar) untuk mulai.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Subtes mana yang sebaiknya dikerjakan lebih dulu saat SKD?',
      a: 'Tidak ada urutan wajib. Salah satu pendekatan yang umum adalah memulai dari subtes yang paling kamu kuasai untuk membangun kepercayaan diri. Uji beberapa urutan saat tryout, lalu pakai yang hasilnya paling stabil.',
    },
    {
      q: 'Apakah boleh menebak jawaban di SKD?',
      a: 'Pada aturan seleksi terakhir, jawaban salah di TWK dan TIU bernilai 0, sama dengan soal kosong, jadi menebak tidak mengurangi nilai. Tetap usahakan menebak secara cerdas dengan menyingkirkan opsi yang jelas keliru.',
    },
    {
      q: 'Berapa kali sebaiknya tryout sebelum SKD?',
      a: 'Tidak ada angka pasti. Yang penting, tryout dilakukan berkala dengan waktu sungguhan dan selalu diikuti evaluasi pembahasan. Menjelang ujian, satu sampai dua kali per minggu sudah cukup.',
    },
    {
      q: 'Nilai TKP selalu kurang, apa yang harus dilakukan?',
      a: 'Pelajari pembahasan setiap soal TKP, terutama alasan sebuah opsi bernilai 5. Biasanya masalahnya adalah memilih opsi yang terdengar wajar tetapi kurang tuntas. Latih sedikit setiap hari agar polanya terbentuk.',
    },
    {
      q: 'Apakah lolos passing grade sudah pasti lanjut ke SKB?',
      a: 'Belum tentu. Peserta yang lolos diperingkat berdasarkan nilai total, dan yang lanjut ke SKB maksimal tiga kali jumlah kebutuhan formasi pada seleksi terakhir.',
    },
  ],
  sources: [
    { label: 'SSCASN BKN (portal pendaftaran resmi)', url: 'https://sscasn.bkn.go.id' },
    { label: 'Badan Kepegawaian Negara (BKN)', url: 'https://www.bkn.go.id' },
    { label: 'Kementerian PANRB', url: 'https://www.menpan.go.id' },
  ],
};

export default article;
