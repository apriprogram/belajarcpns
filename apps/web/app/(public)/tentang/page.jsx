import Link from 'next/link';
import { ArrowRight, BookOpen, ChartLine, MessagesSquare, Save, Timer, Trophy } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/panduan/ArticleParts';
import { Callout, DataTable } from '@/components/panduan/blocks';
import { Inline } from '@/components/panduan/Inline';
import { CategoryIcon } from '@/components/panduan/ArticleCard';
import { getSite } from '@/lib/site-server';
import { absoluteUrl, siteUrl } from '@/lib/seo';
import { ogImages } from '@/lib/seo-metadata';
import { ARTICLES } from '@/lib/panduan';
import { breadcrumbNode, organizationNode } from '@/lib/panduan/schema';

// Hanya fitur yang benar-benar ada (docs/SEO.md → "Fitur platform yang BOLEH disebut").
const FEATURES = [
  { Icon: Timer, title: 'Tryout CBT 110 soal · 100 menit', text: 'Alur mirip CAT BKN: panel nomor soal, tanda ragu-ragu, dan konfirmasi sebelum selesai.' },
  { Icon: Save, title: 'Timer server & simpan otomatis', text: 'Waktu dihitung server dan jawaban tersimpan setiap kali dipilih, jadi ujian bisa dilanjutkan setelah koneksi putus.' },
  { Icon: BookOpen, title: 'Latihan per sub-materi', text: 'Soal TWK, TIU, dan TKP per sub-materi dengan pembahasan yang langsung muncul setelah menjawab.' },
  { Icon: Trophy, title: 'Skor, status & peringkat', text: 'Skor per subtes, status lulus terhadap passing grade, dan posisimu dibanding peserta lain.' },
  { Icon: ChartLine, title: 'Analisis & riwayat', text: 'Grafik progres, riwayat ujian, dan target belajar harian untuk menjaga ritme.' },
  { Icon: MessagesSquare, title: 'Komunitas & bantuan', text: 'Live group chat sesama peserta dan formulir pesan langsung ke admin atau developer.' },
];

const STATS = [
  { value: '110', label: 'soal per tryout' },
  { value: '100', label: 'menit, seperti CAT' },
  { value: '3', label: 'subtes: TWK, TIU, TKP' },
  { value: 'Rp0', label: 'gratis, tanpa iklan' },
];

const describe = (brand) =>
  `${brand} adalah platform latihan soal dan tryout CBT SKD CPNS yang gratis dan tanpa iklan: 110 soal dalam 100 menit mirip CAT BKN, pembahasan, skor per subtes, dan peringkat. Bukan situs resmi BKN.`;

export async function generateMetadata() {
  const site = await getSite();
  const brand = site.brand.name;
  const title = `Tentang ${brand}`;
  const description = describe(brand);
  return {
    // absolute: hindari "Tentang X · X" dari template judul layout.
    title: { absolute: `${title}: Latihan & Tryout SKD CPNS Gratis` },
    description,
    alternates: { canonical: '/tentang' },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      siteName: brand,
      url: '/tentang',
      title,
      description,
      images: ogImages(site, title, '/opengraph-image'),
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

function aboutGraph(site) {
  const base = siteUrl(site);
  const url = absoluteUrl(site, '/tentang');
  const brand = site.brand.name;
  const org = { ...organizationNode(site), description: site.brand.description || describe(brand) };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${url}#page`,
        url,
        name: `Tentang ${brand}`,
        description: describe(brand),
        inLanguage: 'id-ID',
        isPartOf: { '@type': 'WebSite', '@id': `${base}/#website`, name: brand, url: `${base}/` },
        about: org,
        mainEntity: org,
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      breadcrumbNode(
        site,
        [
          { name: 'Beranda', path: '/' },
          { name: `Tentang ${brand}`, path: '/tentang' },
        ],
        `${url}#breadcrumb`,
      ),
    ],
  };
}

function Panel({ id, title, children }) {
  return (
    <section aria-labelledby={`${id}-title`} className="rounded-[24px] bg-white p-6 ring-1 ring-inset ring-mist-100 sm:p-8">
      <h2 id={`${id}-title`} className="text-[22px] font-semibold tracking-[-0.025em] sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

const P = ({ children }) => <p className="mt-3 text-[16px] leading-[1.75] text-obsidian-800">{children}</p>;

export default async function TentangPage() {
  const site = await getSite();
  const brand = site.brand.name;
  const subtests = Array.isArray(site.skd?.subtests) ? site.skd.subtests : [];

  return (
    <>
      <JsonLd data={aboutGraph(site)} />
      <div className="container-wide pb-20 pt-6 lg:pb-28 lg:pt-10">
        <div className="mx-auto max-w-[1200px]">
          <Breadcrumbs items={[{ label: 'Beranda', href: '/' }, { label: 'Tentang' }]} />

          <header className="mt-8 max-w-3xl">
            <span className="inline-flex h-8 items-center rounded-full bg-white px-3.5 text-[13px] font-medium text-obsidian-600 ring-1 ring-inset ring-mist-100">Tentang kami</span>
            <h1 className="mt-5 text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[56px]">Tentang {brand}</h1>
            <p className="mt-5 text-lg leading-relaxed text-mist-700">
              {brand} adalah platform latihan mandiri untuk persiapan Seleksi Kompetensi Dasar (SKD) CPNS. Kamu bisa berlatih soal TWK, TIU, dan TKP per sub-materi, lalu mengikuti tryout CBT 110 soal
              dalam 100 menit yang meniru alur CAT BKN, gratis dan tanpa iklan.
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Button shape="pill" href="/daftar" size="lg" iconRight={<ArrowRight />}>
                Daftar gratis
              </Button>
              <Button shape="pill" href="/panduan" size="lg" variant="secondary">
                Baca panduan CPNS
              </Button>
            </div>
          </header>

          <dl className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-[24px] bg-white p-5 ring-1 ring-inset ring-mist-100 sm:p-6">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-[32px] font-semibold tabular-nums tracking-[-0.03em] sm:text-[40px]">{s.value}</span>
                  <span className="mt-1 block text-sm text-mist-700">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
            <div className="min-w-0 space-y-6">
              <Panel id="untuk-siapa" title="Untuk siapa platform ini?">
                <ul className="mt-4 space-y-3">
                  {[
                    'Pelamar CPNS pemula yang baru mulai belajar SKD dan butuh latihan terarah.',
                    'Peserta yang pernah ikut seleksi dan ingin menutup kelemahan di subtes tertentu.',
                    'Siapa pun yang ingin terbiasa dengan ritme ujian berbasis komputer (CAT) sebelum hari ujian.',
                  ].map((t) => (
                    <li key={t} className="relative pl-6 text-[16px] leading-[1.7] text-obsidian-800">
                      <span aria-hidden className="absolute left-1 top-[0.7em] h-1.5 w-1.5 rounded-full bg-cobalt" />
                      {t}
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel id="fitur" title="Fitur yang tersedia">
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {FEATURES.map(({ Icon, title, text }) => (
                    <li key={title} className="rounded-2xl bg-ghost p-4 ring-1 ring-inset ring-mist-100 sm:p-5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-inset ring-mist-100">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
                      </span>
                      <p className="mt-3 text-[15px] font-semibold">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-mist-700">{text}</p>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel id="penilaian" title="Bagaimana skor dihitung?">
                <P>
                  Penilaian mengikuti format SKD seleksi terakhir (CPNS 2024, KepmenPANRB No. 321 Tahun 2024). TWK dan TIU bernilai 5 untuk setiap jawaban benar dan 0 untuk jawaban salah atau
                  kosong, sedangkan setiap opsi TKP bernilai 1 sampai 5.
                </P>
                {subtests.length > 0 && (
                  <DataTable
                    head={['Subtes', 'Soal', 'Penilaian', 'Nilai maks.', 'Passing grade bawaan']}
                    rows={subtests.map((s) => [`${s.code}${s.name ? ` · ${s.name}` : ''}`, String(s.count ?? '—'), s.scoring || '—', String(s.max ?? '—'), String(s.pass ?? '—')])}
                  />
                )}
                <P>
                  Passing grade setiap paket tryout diatur admin dan bisa diperbarui bila aturan resmi berubah. Status <strong className="font-semibold text-obsidian">Lulus</strong> muncul bila setiap
                  subtes mencapai passing grade-nya (serta ambang total, bila paket menetapkannya). Peringkat diurutkan dari nilai total. Penjelasan lengkap ada di{' '}
                  <Inline text="[panduan passing grade SKD](/panduan/passing-grade-skd)" />.
                </P>
              </Panel>

              <Callout
                tone="warning"
                flush
                title={`${brand} bukan situs resmi BKN`}
                text="Platform ini bukan situs resmi BKN maupun instansi pemerintah. Soal latihan disusun mengikuti kisi-kisi SKD, bukan soal asli ujian. Format dan passing grade bisa berubah setiap periode seleksi, jadi selalu cocokkan dengan [sscasn.bkn.go.id](https://sscasn.bkn.go.id), [bkn.go.id](https://www.bkn.go.id), dan [menpan.go.id](https://www.menpan.go.id). Hasil tryout adalah gambaran latihan, bukan jaminan kelulusan."
              />
            </div>

            <aside className="space-y-6" aria-label="Kontak dan panduan">
              <div className="rounded-[24px] bg-obsidian p-6 text-white sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-mint">Hubungi kami</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-white">Ada pertanyaan atau saran?</p>
                <p className="mt-2 text-[15px] leading-relaxed text-white/65">Tanyakan soal akun dan tryout, laporkan soal yang keliru, atau usulkan fitur baru lewat formulir pesan untuk admin dan developer.</p>
                <div className="mt-5">
                  <Button shape="pill" href="/#kontak" variant="mint" iconRight={<ArrowRight />}>
                    Kirim pesan
                  </Button>
                </div>
              </div>

              <nav aria-labelledby="panduan-title" className="rounded-[24px] bg-white p-5 ring-1 ring-inset ring-mist-100 sm:p-6">
                <h2 id="panduan-title" className="eyebrow">
                  Panduan belajar CPNS
                </h2>
                <ul className="mt-3 space-y-0.5">
                  {ARTICLES.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/panduan/${a.slug}`} className="group flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-ghost">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ghost ring-1 ring-inset ring-mist-100 group-hover:bg-white">
                          <CategoryIcon category={a.category} className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[14px] font-medium leading-snug text-obsidian-600 group-hover:text-obsidian">{a.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/panduan" className="mt-3 inline-flex items-center gap-1.5 px-2 text-sm font-semibold text-cobalt hover:text-cobalt-700">
                  Semua panduan
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </nav>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
