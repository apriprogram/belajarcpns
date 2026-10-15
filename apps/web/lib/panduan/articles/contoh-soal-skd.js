/** Isi artikel: Contoh Soal SKD CPNS + Pembahasan. Skema: docs/SEO.md. Semua kunci & hitungan sudah diperiksa ulang. */
const article = {
  intro:
    'Berikut **contoh soal SKD CPNS** yang terdiri atas 3 soal TWK, 3 soal TIU, dan 3 soal TKP, lengkap dengan kunci jawaban dan pembahasan. Coba jawab sendiri dulu sebelum membuka pembahasan, lalu lanjutkan dengan tryout 110 soal untuk mengukur kemampuanmu secara utuh.',
  sections: [
    {
      id: 'cara-memakai',
      title: 'Bagaimana cara memakai contoh soal ini?',
      blocks: [
        {
          type: 'ul',
          items: [
            'Siapkan kertas, lalu kerjakan kesembilan soal dalam waktu sekitar 9 menit. Ritme ini kurang lebih sama dengan ujian sungguhan, yaitu rata-rata ±54 detik per soal.',
            'Catat jawabanmu, baru buka bagian **Lihat jawaban & pembahasan** di setiap soal.',
            'Untuk soal yang salah, baca pembahasannya sampai kamu bisa menjelaskan ulang alasannya.',
          ],
        },
        {
          type: 'p',
          text: 'Soal-soal ini disusun mengikuti kisi-kisi SKD dan bukan soal asli ujian. Pada SKD seleksi terakhir, TWK dan TIU bernilai 5 untuk jawaban benar dan 0 untuk jawaban salah atau kosong, sedangkan setiap opsi TKP bernilai 1 sampai 5.',
        },
      ],
    },
    {
      id: 'contoh-soal-twk',
      title: 'Contoh soal TWK (Tes Wawasan Kebangsaan)',
      blocks: [
        {
          type: 'question',
          label: 'TWK',
          text: 'Dalam rapat warga, terjadi perbedaan pendapat tentang jadwal kerja bakti. Ketua RT memberi kesempatan setiap warga menyampaikan pendapat, lalu mengambil keputusan bersama yang dapat diterima semua pihak. Sikap ketua RT tersebut paling mencerminkan pengamalan Pancasila sila ...',
          options: ['A. pertama', 'B. kedua', 'C. ketiga', 'D. keempat', 'E. kelima'],
          answer: 'D',
          explanation:
            'Sila keempat berbunyi "Kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan". Mengutamakan musyawarah untuk mencapai mufakat dan menghormati pendapat orang lain adalah pengamalan langsung sila ini. Sila ketiga (Persatuan Indonesia) memang berkaitan dengan kerukunan, tetapi inti situasi pada soal adalah **cara mengambil keputusan bersama**.',
        },
        {
          type: 'question',
          label: 'TWK',
          text: 'Ketentuan "Negara Indonesia adalah negara hukum" dalam UUD NRI Tahun 1945 tercantum pada ...',
          options: ['A. Pasal 1 ayat (1)', 'B. Pasal 1 ayat (2)', 'C. Pasal 1 ayat (3)', 'D. Pasal 27 ayat (1)', 'E. Pasal 30 ayat (1)'],
          answer: 'C',
          explanation:
            'Pasal 1 ayat (3) UUD NRI Tahun 1945 berbunyi "Negara Indonesia adalah negara hukum." Sebagai pembanding: Pasal 1 ayat (1) mengatur bentuk negara kesatuan yang berbentuk republik, Pasal 1 ayat (2) mengatur kedaulatan yang berada di tangan rakyat, Pasal 27 ayat (1) mengatur persamaan kedudukan warga negara di dalam hukum dan pemerintahan, dan Pasal 30 ayat (1) mengatur hak dan kewajiban warga negara dalam usaha pertahanan dan keamanan negara.',
        },
        {
          type: 'question',
          label: 'TWK',
          text: 'Badan Penyelidik Usaha-Usaha Persiapan Kemerdekaan Indonesia (BPUPKI) diketuai oleh ...',
          options: ['A. Ir. Soekarno', 'B. Drs. Mohammad Hatta', 'C. dr. K.R.T. Radjiman Wedyodiningrat', 'D. Mr. Soepomo', 'E. Mr. Muhammad Yamin'],
          answer: 'C',
          explanation:
            'Ketua BPUPKI adalah dr. K.R.T. Radjiman Wedyodiningrat. Ir. Soekarno dan Drs. Mohammad Hatta kemudian menjadi ketua dan wakil ketua PPKI (Panitia Persiapan Kemerdekaan Indonesia), badan yang dibentuk setelah BPUPKI. Mr. Muhammad Yamin dan Mr. Soepomo adalah anggota BPUPKI yang menyampaikan gagasan tentang dasar negara pada sidang pertama.',
        },
        {
          type: 'p',
          text: 'Soal sejarah seperti nomor 3 biasanya menguji tokoh dan peristiwa pokok, misalnya Sumpah Pemuda pada 28 Oktober 1928, sidang BPUPKI, dan PPKI. Kisi-kisi lengkap TWK ada di [panduan materi SKD](/panduan/materi-skd-cpns).',
        },
      ],
    },
    {
      id: 'contoh-soal-tiu',
      title: 'Contoh soal TIU (Tes Intelegensia Umum)',
      blocks: [
        {
          type: 'question',
          label: 'TIU',
          text: 'DOKTER : STETOSKOP = ... : ...',
          options: ['A. Petani : Cangkul', 'B. Guru : Murid', 'C. Pilot : Bandara', 'D. Penulis : Buku', 'E. Koki : Restoran'],
          answer: 'A',
          explanation:
            'Hubungan pada soal adalah **profesi dengan alat yang dipakai untuk bekerja**: dokter memakai stetoskop untuk memeriksa pasien. Pasangan yang hubungannya sama adalah petani dengan cangkul. Guru : Murid adalah profesi dengan orang yang dilayani, Pilot : Bandara dan Koki : Restoran adalah profesi dengan tempat kerjanya, sedangkan Penulis : Buku adalah profesi dengan hasil karyanya.',
        },
        {
          type: 'question',
          label: 'TIU',
          text: 'Bilangan berikutnya dari deret 3, 4, 8, 17, 33, ... adalah ...',
          options: ['A. 49', 'B. 54', 'C. 58', 'D. 62', 'E. 66'],
          answer: 'C',
          explanation:
            'Perhatikan selisih antarsuku: 4 − 3 = 1, 8 − 4 = 4, 17 − 8 = 9, dan 33 − 17 = 16. Selisihnya adalah bilangan kuadrat berurutan: 1², 2², 3², dan 4². Selisih berikutnya 5² = 25, sehingga suku berikutnya adalah 33 + 25 = **58**.',
        },
        {
          type: 'question',
          label: 'TIU',
          text: 'Semua pegawai yang disiplin mendapat penghargaan. Sebagian pegawai bagian keuangan adalah pegawai yang disiplin. Simpulan yang tepat adalah ...',
          options: [
            'A. Semua pegawai bagian keuangan mendapat penghargaan.',
            'B. Sebagian pegawai bagian keuangan mendapat penghargaan.',
            'C. Semua pegawai yang mendapat penghargaan bekerja di bagian keuangan.',
            'D. Sebagian pegawai bagian keuangan tidak disiplin.',
            'E. Tidak ada pegawai bagian keuangan yang mendapat penghargaan.',
          ],
          answer: 'B',
          explanation:
            'Premis pertama: semua yang disiplin pasti mendapat penghargaan. Premis kedua: sebagian pegawai keuangan termasuk kelompok yang disiplin. Maka sebagian pegawai keuangan itu pasti mendapat penghargaan (B). Opsi A terlalu luas karena premis hanya menyebut "sebagian". Opsi C membalik hubungan dalam premis. Opsi D tidak dapat dipastikan, karena "sebagian" tidak berarti sisanya pasti tidak disiplin. Opsi E bertentangan dengan premis.',
        },
      ],
    },
    {
      id: 'contoh-soal-tkp',
      title: 'Contoh soal TKP (Tes Karakteristik Pribadi)',
      blocks: [
        {
          type: 'p',
          text: 'Pada TKP, setiap opsi memiliki nilai 1 sampai 5. Kunci di bawah menunjukkan opsi bernilai tertinggi, dan pembahasannya mencantumkan nilai setiap opsi beserta alasannya.',
        },
        {
          type: 'question',
          label: 'TKP',
          text: 'Anda bertugas di loket pelayanan. Lima belas menit sebelum loket tutup, seorang warga lanjut usia datang untuk mengurus dokumen, tetapi satu persyaratan belum ia bawa. Sikap Anda adalah ...',
          options: [
            'A. Meminta warga tersebut datang lagi besok karena waktu layanan hampir habis.',
            'B. Menjelaskan persyaratan yang kurang, lalu memintanya kembali setelah dokumennya lengkap.',
            'C. Memeriksa seluruh berkas yang dibawa, menjelaskan persyaratan yang kurang beserta cara tercepat melengkapinya, dan memastikan berkas lainnya sudah benar agar ia tidak perlu bolak-balik.',
            'D. Memintanya menunggu rekan lain yang akan menangani karena Anda sedang merapikan loket.',
            'E. Memeriksa berkas yang dibawa dan menjelaskan persyaratan yang masih kurang.',
          ],
          answer: 'C',
          explanation:
            'Nilai tiap opsi: **A = 1, B = 3, C = 5, D = 2, E = 4**. Opsi C paling tepat karena tetap melayani sampai jam layanan berakhir, taat pada persyaratan, dan proaktif mencegah warga harus bolak-balik. Opsi E baik, tetapi kurang tuntas dibanding C. Opsi B benar secara prosedur, tetapi minim bantuan. Opsi D melempar tugas, sedangkan opsi A menolak melayani padahal loket masih buka.',
        },
        {
          type: 'question',
          label: 'TKP',
          text: 'Anda ditunjuk menjadi ketua tim proyek yang anggotanya berasal dari beberapa unit dan belum saling mengenal. Pada rapat pertama, beberapa anggota tampak pasif. Yang Anda lakukan adalah ...',
          options: [
            'A. Membagi tugas secara merata tanpa menanyakan kemampuan masing-masing anggota.',
            'B. Mengajak setiap anggota menyampaikan ide dan keahliannya, lalu membagi tugas sesuai kemampuan dan kesepakatan bersama.',
            'C. Mengerjakan sebagian besar pekerjaan sendiri agar hasilnya sesuai harapan.',
            'D. Membiarkannya karena keaktifan adalah tanggung jawab masing-masing anggota.',
            'E. Mendekati anggota yang pasif secara pribadi setelah rapat untuk mengenal mereka lebih jauh.',
          ],
          answer: 'B',
          explanation:
            'Nilai tiap opsi: **A = 3, B = 5, C = 2, D = 1, E = 4**. Opsi B membangun keterlibatan seluruh anggota sekaligus memanfaatkan keahlian mereka, yang merupakan inti dari jejaring kerja. Opsi E menunjukkan kepedulian dan membangun hubungan, tetapi belum langsung menggerakkan kerja tim. Opsi A sudah membagi peran, tetapi mengabaikan kekuatan tiap anggota. Opsi C membuat beban tidak seimbang dan anggota tidak berkembang, sedangkan opsi D mengabaikan peran Anda sebagai ketua.',
        },
        {
          type: 'question',
          label: 'TKP',
          text: 'Di grup percakapan kantor, seorang rekan membagikan pesan berantai yang belum jelas sumbernya dan berisi ajakan membenci kelompok tertentu. Sikap Anda adalah ...',
          options: [
            'A. Meneruskan pesan itu ke grup lain agar lebih banyak orang tahu.',
            'B. Menegur rekan tersebut dengan keras di dalam grup.',
            'C. Diam saja karena itu bukan urusan Anda.',
            'D. Memeriksa kebenaran pesan tersebut, lalu dengan santun mengingatkan rekan dan anggota grup agar tidak menyebarkan konten yang belum jelas sumbernya dan bernada kebencian.',
            'E. Mengingatkan rekan tersebut lewat pesan pribadi agar lebih berhati-hati.',
          ],
          answer: 'D',
          explanation:
            'Nilai tiap opsi: **A = 1, B = 3, C = 2, D = 5, E = 4**. Opsi D paling tepat karena berbasis verifikasi, menjaga suasana tetap kondusif, dan mencegah ujaran kebencian menyebar ke seluruh anggota grup. Opsi E sudah baik, tetapi dampaknya terbatas pada satu orang, padahal pesan sudah dilihat banyak anggota. Opsi B berniat benar, tetapi caranya berpotensi memicu konflik. Opsi C membiarkan konten negatif beredar, sedangkan opsi A justru ikut menyebarkannya.',
        },
      ],
    },
    {
      id: 'hitung-skor',
      title: 'Berapa skor kamu? Cara menilai hasil latihan ini',
      blocks: [
        {
          type: 'ul',
          items: [
            '**TWK dan TIU:** setiap jawaban benar bernilai 5, sehingga nilai maksimal masing-masing 15 untuk tiga soal.',
            '**TKP:** jumlahkan nilai opsi yang kamu pilih. Nilai maksimalnya 15 (tiga kali nilai 5).',
          ],
        },
        {
          type: 'p',
          text: 'Sembilan soal terlalu sedikit untuk memprediksi hasil SKD. Gunakan latihan ini untuk mengenali tipe soal, lalu ukur kemampuan sebenarnya dengan tryout lengkap. Sebagai gambaran, passing grade TKP 2024 setara rata-rata sekitar 3,7 poin per soal. Jika nilai TKP-mu di latihan ini di bawah 11, pola memilih opsimu masih perlu diasah.',
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Pola opsi TKP bernilai tinggi',
          text: 'Opsi bernilai tinggi biasanya **aktif** (langsung bertindak), **solutif** (menyelesaikan masalah sampai tuntas), **taat aturan**, dan **mengutamakan kepentingan bersama**. Opsi bernilai rendah biasanya menolak, menunda, melempar tanggung jawab, atau bersikap acuh.',
        },
      ],
    },
    {
      id: 'langkah-selanjutnya',
      title: 'Apa langkah selanjutnya setelah mengerjakan contoh soal?',
      blocks: [
        {
          type: 'ol',
          items: [
            'Pelajari sub-materi dari soal yang kamu jawab salah lewat [panduan materi SKD](/panduan/materi-skd-cpns).',
            'Pahami cara menghitung nilai dan ambang batasnya di [panduan passing grade SKD](/panduan/passing-grade-skd).',
            'Kerjakan tryout lengkap 110 soal dalam 100 menit. Di platform latihan ini, tryout dan latihan per sub-materi tersedia gratis dengan pembahasan tiap soal. [Daftar di sini](/daftar) atau baca dulu [cara kerja tryout-nya](/panduan/tryout-cpns-gratis).',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Apakah contoh soal ini sama dengan soal SKD asli?',
      a: 'Bukan. Soal disusun berdasarkan kisi-kisi SKD untuk latihan. Soal SKD asli dikerjakan langsung di sistem CAT BKN dan tidak dipublikasikan.',
    },
    {
      q: 'Apakah TKP memiliki jawaban salah?',
      a: 'Tidak ada opsi bernilai nol di TKP; setiap opsi bernilai 1 sampai 5. Namun, sering memilih opsi bernilai rendah membuat nilai sulit mencapai passing grade, yang pada seleksi 2024 adalah 166.',
    },
    {
      q: 'Berapa waktu ideal untuk satu soal SKD?',
      a: 'Rata-ratanya sekitar 54 detik per soal (100 menit untuk 110 soal). Soal yang kamu kuasai sebaiknya dijawab lebih cepat agar ada sisa waktu untuk soal hitungan TIU yang lebih panjang.',
    },
    {
      q: 'Di mana bisa latihan soal SKD lebih banyak?',
      a: 'Setelah mendaftar gratis di platform latihan ini, kamu bisa berlatih soal TWK, TIU, dan TKP per sub-materi dengan pembahasan langsung, lalu mengikuti tryout CAT 110 soal.',
    },
  ],
  sources: [
    { label: 'SSCASN BKN (portal pendaftaran resmi)', url: 'https://sscasn.bkn.go.id' },
    { label: 'Badan Kepegawaian Negara (BKN)', url: 'https://www.bkn.go.id' },
    { label: 'Kementerian PANRB', url: 'https://www.menpan.go.id' },
  ],
};

export default article;
