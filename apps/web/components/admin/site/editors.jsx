'use client';

import { Plus } from 'lucide-react';
import { Button, Field, Input, SegmentedControl, Textarea } from '@/components/ui';
import { cn } from '@/lib/cn';
import { seoDescription, seoTitle, siteHost } from '@/lib/seo';
import { SITE_DEFAULTS } from '@/lib/site-defaults';
import {
  AreaField,
  Block,
  ChipsInput,
  Grid,
  ListEditor,
  MediaField,
  NumberField,
  RowActions,
  StringListEditor,
  SwitchField,
  TextField,
  useEditor,
  useValue,
} from './fields';
import { BrandMark } from './SitePreview';
import { getIn, moveItem } from './utils';

/* Editor per grup. Semua membaca/menulis draft lewat konteks (lihat fields.jsx). */

const SECTION_META = [
  { key: 'fitur', name: 'Fitur' },
  { key: 'testimoni', name: 'Testimoni' },
  { key: 'skd', name: 'Struktur SKD' },
  { key: 'langkah', name: 'Cara mulai' },
  { key: 'panduan', name: 'Panduan' },
  { key: 'faq', name: 'FAQ' },
  { key: 'kontak', name: 'Kontak' },
];

/**
 * Item bawaan yang belum ada di daftar tersimpan (mis. section/fitur baru setelah update aplikasi).
 * Array dari server mengganti default utuh, jadi item baru perlu ditambahkan manual lewat tombol ini.
 */
function MissingDefaults({ items, defaults, same, label, onAdd }) {
  const missing = (defaults || []).filter((d) => !(items || []).some((x) => x && same(x, d)));
  if (!missing.length) return null;
  return (
    <div className="mt-3 rounded-xl bg-cobalt-50/60 p-3 ring-1 ring-inset ring-cobalt-100">
      <p className="text-[12px] font-medium text-cobalt-700">Belum ada di daftar (bawaan terbaru):</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {missing.map((d, i) => (
          <Button key={i} variant="secondary" size="sm" icon={<Plus />} onClick={() => onAdd(d)}>
            {label(d)}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function BrandEditor() {
  return (
    <>
      <Block title="Identitas" description="Nama tampil di logo, judul tab, footer, halaman login, dan panel.">
        <Grid>
          <TextField path={['brand', 'name']} label="Nama website" required maxLength={40} hint="Maksimal 40 karakter." />
          <TextField path={['brand', 'accent_char']} label="Karakter aksen" maxLength={3} hint="Karakter di nama yang diwarnai biru. Kosongkan bila tidak ada." />
        </Grid>
        <Grid>
          <TextField path={['brand', 'tagline']} label="Tagline" hint="Dipakai di judul tab beranda: Nama — Tagline." />
          <TextField path={['brand', 'logo_letter']} label="Huruf logo bawaan" maxLength={2} hint="Dipakai bila belum ada gambar logo." />
        </Grid>
        <AreaField path={['brand', 'description']} label="Deskripsi (meta)" hint="Ringkasan untuk mesin pencari, ±160 karakter." />
      </Block>
      <Block title="Logo" description="Gambar persegi, disarankan 256×256 px. Kosongkan untuk memakai logo bawaan.">
        <MediaField path={['brand', 'logo_url']} kind="image" square nullable />
      </Block>
    </>
  );
}

/* ------------------------------------------------------------------ */

function NavbarEditor() {
  const { site } = useEditor();
  const [links, setLinks] = useValue(['navbar', 'links'], []);
  const items = Array.isArray(links) ? links : [];
  return (
    <>
      <Block title="Tautan navbar" description="Urutan & label. Tautan section yang disembunyikan otomatis tidak tampil.">
        <div className="space-y-2">
          {items.map((l, i) => {
            const hidden = getIn(site, ['sections', l.id, 'visible'], true) === false;
            return (
              <div key={`${l.id}-${i}`} className="flex items-center gap-2 rounded-xl bg-ghost/60 p-2 ring-1 ring-inset ring-mist-100">
                <span className="w-16 shrink-0 truncate pl-1 font-mono text-[12px] text-mist-700" title={`#${l.id}`}>
                  #{l.id}
                </span>
                <input
                  value={l.label ?? ''}
                  onChange={(e) => setLinks(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  aria-label={`Label tautan ${l.id}`}
                  className="h-9 min-w-0 flex-1 rounded-xl border border-mist-100 bg-white px-3 text-sm text-obsidian outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt"
                />
                {hidden && <span className="hidden shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-mist-700 ring-1 ring-inset ring-mist-100 sm:inline">Disembunyikan</span>}
                <RowActions
                  index={i}
                  length={items.length}
                  onMove={(a, b) => setLinks(moveItem(items, a, b))}
                  onRemove={(j) => setLinks(items.filter((_, k) => k !== j))}
                  label="tautan"
                />
              </div>
            );
          })}
        </div>
        <MissingDefaults
          items={items}
          defaults={SITE_DEFAULTS.navbar.links}
          same={(a, b) => a.id === b.id}
          label={(d) => d.label}
          onAdd={(d) => {
            // Sisipkan sesuai urutan bawaan (setelah tautan bawaan sebelumnya yang sudah ada).
            const order = SITE_DEFAULTS.navbar.links.map((l) => l.id);
            const at = items.findIndex((x) => order.indexOf(x.id) > order.indexOf(d.id));
            const next = items.slice();
            next.splice(at < 0 ? next.length : at, 0, { ...d });
            setLinks(next);
          }}
        />
      </Block>
      <Block title="Tombol akun">
        <Grid>
          <TextField path={['navbar', 'login_label']} label="Label tombol masuk" />
          <TextField path={['navbar', 'cta_label']} label="Label tombol daftar" />
        </Grid>
      </Block>
    </>
  );
}

/* ------------------------------------------------------------------ */

function SectionsEditor() {
  return (
    <>
      <Block title="Hero & CTA">
        <SwitchField path={['sections', 'hero', 'visible']} label="Tampilkan hero" description="Bagian pembuka paling atas." />
        <SwitchField path={['sections', 'cta', 'visible']} label="Tampilkan CTA penutup" description="Ajakan daftar di bawah halaman." />
      </Block>
      {SECTION_META.map((s) => (
        <SectionBlock key={s.key} sKey={s.key} name={s.name} />
      ))}
    </>
  );
}

function SectionBlock({ sKey, name }) {
  const [visible] = useValue(['sections', sKey, 'visible'], true);
  const p = (k) => ['sections', sKey, k];
  return (
    <Block title={name} description={visible === false ? 'Disembunyikan dari halaman & navbar.' : `#${sKey}`} action={<SwitchField path={p('visible')} />}>
      {visible !== false && (
        <>
          <Grid cols={3}>
            <TextField path={p('index')} label="Nomor" mono />
            <TextField path={p('label')} label="Label kecil" className="sm:col-span-2" />
          </Grid>
          <TextField path={p('title')} label="Judul" />
          <AreaField path={p('description')} label="Deskripsi" rows={2} />
          <MascotFields base={['sections', sKey, 'mascot']} />
        </>
      )}
    </Block>
  );
}

/** Maskot section: gambar + kalimat yang "diucapkan" saat di-hover. Kosongkan gambar = tanpa maskot. */
function MascotFields({ base }) {
  return (
    <Grid>
      <MediaField path={[...base, 'image']} label="Maskot (gambar transparan)" kind="image" />
      <TextField path={[...base, 'say']} label="Kalimat saat di-hover" placeholder="Mis. Yuk, mulai latihan!" />
    </Grid>
  );
}

/* ------------------------------------------------------------------ */

function HeroEditor() {
  return (
    <>
      <Block title="Mode hero" description="Tab di hero (maks 3). Teks aksen diwarnai biru.">
        <ListEditor
          path={['hero', 'modes']}
          label="mode"
          min={1}
          max={3}
          addLabel="Tambah mode"
          itemTitle={(m) => m && m.tab}
          newItem={() => ({ key: `mode${Date.now().toString(36)}`, tab: 'Mode baru', lead: '', accent: '', points: [], cta: 'Mulai', href: '/daftar' })}
          renderItem={(p) => (
            <>
              <Grid cols={3}>
                <TextField path={[...p, 'tab']} label="Nama tab" />
                <TextField path={[...p, 'lead']} label="Kalimat awal" />
                <TextField path={[...p, 'accent']} label="Teks aksen" />
              </Grid>
              <StringListEditor path={[...p, 'points']} label="Poin" max={6} />
              <Grid>
                <TextField path={[...p, 'cta']} label="Label tombol" />
                <TextField path={[...p, 'href']} label="Tautan tombol" placeholder="/daftar" mono />
              </Grid>
            </>
          )}
        />
      </Block>
      <Block title="Video tutorial">
        <Grid>
          <MediaField path={['hero', 'video_url']} label="Video" kind="video" />
          <MediaField path={['hero', 'poster_url']} label="Poster (gambar sampul)" kind="image" />
        </Grid>
      </Block>
      <Block title="Bab video" description="Detik awal tiap bab pada video.">
        <ListEditor
          path={['hero', 'steps']}
          label="bab"
          addLabel="Tambah bab"
          max={6}
          itemTitle={(s) => s && s.label}
          newItem={() => ({ start: 0, label: '' })}
          renderItem={(p) => (
            <Grid>
              <NumberField path={[...p, 'start']} label="Mulai (detik)" />
              <TextField path={[...p, 'label']} label="Label" />
            </Grid>
          )}
        />
      </Block>
      <Block title="Maskot" action={<SwitchField path={['hero', 'mascot', 'visible']} />}>
        <Grid>
          <MediaField path={['hero', 'mascot', 'image_url']} label="Gambar maskot" kind="image" />
          <TextField path={['hero', 'mascot', 'bubble']} label="Teks gelembung" />
        </Grid>
      </Block>
      <Block title="Emblem" description="Gambar di pojok kanan atas video (layar desktop)." action={<SwitchField path={['hero', 'emblem', 'visible']} />}>
        <MediaField path={['hero', 'emblem', 'image_url']} label="Gambar emblem (transparan)" kind="image" />
      </Block>
    </>
  );
}

/* ------------------------------------------------------------------ */

function FeaturesEditor() {
  const h = (k) => ['features', 'hero', k];
  return (
    <>
      <Block title="Kartu utama">
        <Grid>
          <TextField path={h('tag')} label="Tag" />
          <TextField path={h('meta')} label="Meta" placeholder="110 soal · 100 menit" />
        </Grid>
        <TextField path={h('title')} label="Judul" />
        <AreaField path={h('description')} label="Deskripsi" rows={2} />
        <MediaField path={h('image')} label="Gambar" kind="image" />
      </Block>
      <Block title="Kartu fitur">
        <ListEditor
          path={['features', 'items']}
          label="fitur"
          addLabel="Tambah fitur"
          max={9}
          itemTitle={(it) => it && it.title}
          newItem={() => ({ tag: '', image: '', title: 'Fitur baru', description: '' })}
          renderItem={(p) => (
            <>
              <Grid>
                <TextField path={[...p, 'tag']} label="Tag" />
                <TextField path={[...p, 'title']} label="Judul" />
              </Grid>
              <AreaField path={[...p, 'description']} label="Deskripsi" rows={2} />
              <MediaField path={[...p, 'image']} label="Gambar" kind="image" />
            </>
          )}
        />
        <FeatureDefaults />
      </Block>
    </>
  );
}

function FeatureDefaults() {
  const [list, setList] = useValue(['features', 'items'], []);
  const items = Array.isArray(list) ? list : [];
  return (
    <MissingDefaults
      items={items}
      defaults={SITE_DEFAULTS.features.items}
      same={(a, b) => a.title === b.title || (!!b.image && a.image === b.image)}
      label={(d) => d.title}
      onAdd={(d) => setList([...items, { ...d }])}
    />
  );
}

/* ------------------------------------------------------------------ */

function SkdEditor() {
  return (
    <>
      <Block title="Subtes" description="Tampilan kartu SKD di beranda. Penilaian ujian tetap diatur di Pengaturan/Paket.">
        <ListEditor
          path={['skd', 'subtests']}
          label="subtes"
          reorder={false}
          min={1}
          max={6}
          addLabel="Tambah subtes"
          itemTitle={(s) => s && `${s.code || ''} · ${s.name || ''}`}
          newItem={() => ({ code: '', name: '', count: 0, max: 0, pass: 0, scoring: '', topics: [] })}
          renderItem={(p) => (
            <>
              <Grid cols={3}>
                <TextField path={[...p, 'code']} label="Kode" mono />
                <TextField path={[...p, 'name']} label="Nama" className="sm:col-span-2" />
              </Grid>
              <Grid cols={3}>
                <NumberField path={[...p, 'count']} label="Jumlah soal" />
                <NumberField path={[...p, 'max']} label="Nilai maks" />
                <NumberField path={[...p, 'pass']} label="Passing grade" />
              </Grid>
              <TextField path={[...p, 'scoring']} label="Cara penilaian" />
              <ChipsInput path={[...p, 'topics']} label="Topik" hint="Tekan Enter atau koma untuk menambah." />
            </>
          )}
        />
      </Block>
      <Block title="Lainnya">
        <Grid>
          <NumberField path={['skd', 'duration_minutes']} label="Durasi (menit)" />
          <TextField path={['skd', 'note']} label="Catatan" />
        </Grid>
      </Block>
    </>
  );
}

/* ------------------------------------------------------------------ */

function StepsEditor() {
  const s = (...k) => ['steps', ...k];
  return (
    <>
      <Block title="1 · Daftar">
        <TextField path={s('daftar', 'title')} label="Judul" />
        <AreaField path={s('daftar', 'text')} label="Teks" rows={2} />
        <MediaField path={s('daftar', 'image')} label="Gambar" kind="image" />
      </Block>
      <Block title="2 · Latihan">
        <TextField path={s('latihan', 'title')} label="Judul" />
        <AreaField path={s('latihan', 'text')} label="Teks" rows={2} />
      </Block>
      <Block title="3 · Tryout">
        <TextField path={s('tryout', 'title')} label="Judul" />
        <AreaField path={s('tryout', 'text')} label="Teks" rows={2} />
        <Grid>
          <TextField path={s('tryout', 'cta')} label="Label tombol" />
          <TextField path={s('tryout', 'href')} label="Tautan tombol" mono />
        </Grid>
      </Block>
      <Block title="Hasil">
        <Grid>
          <TextField path={s('hasil', 'eyebrow')} label="Eyebrow" />
          <TextField path={s('hasil', 'badge')} label="Badge" />
        </Grid>
        <TextField path={s('hasil', 'title')} label="Judul" />
        <AreaField path={s('hasil', 'text')} label="Teks" rows={2} />
        <Grid>
          <MediaField path={s('hasil', 'images', 0)} label="Gambar 1" kind="image" />
          <MediaField path={s('hasil', 'images', 1)} label="Gambar 2" kind="image" />
        </Grid>
      </Block>
    </>
  );
}

/* ------------------------------------------------------------------ */

function FaqEditor() {
  return (
    <Block title="Pertanyaan" description="Urutan di sini = urutan di halaman.">
      <ListEditor
        path={['faq', 'items']}
        label="pertanyaan"
        addLabel="Tambah pertanyaan"
        itemTitle={(it) => it && it.q}
        newItem={() => ({ q: '', a: '' })}
        renderItem={(p) => (
          <>
            <TextField path={[...p, 'q']} label="Pertanyaan" />
            <AreaField path={[...p, 'a']} label="Jawaban" rows={3} />
          </>
        )}
      />
    </Block>
  );
}

function KontakEditor() {
  return (
    <Block title="Kartu samping" description="Info di sebelah formulir kontak.">
      <ListEditor
        path={['kontak', 'aside']}
        label="kartu"
        addLabel="Tambah kartu"
        max={4}
        itemTitle={(it) => it && it.title}
        newItem={() => ({ title: '', text: '' })}
        renderItem={(p) => (
          <>
            <TextField path={[...p, 'title']} label="Judul" />
            <AreaField path={[...p, 'text']} label="Teks" rows={2} />
          </>
        )}
      />
    </Block>
  );
}

function CtaEditor() {
  const c = (k) => ['cta', k];
  return (
    <>
      <Block title="Judul">
        <Grid>
          <TextField path={c('title')} label="Judul" />
          <TextField path={c('accent')} label="Teks aksen" />
        </Grid>
        <TextField path={c('subtitle')} label="Subjudul" />
      </Block>
      <Block title="Maskot" description="Muncul di pojok kanan bawah kartu CTA (layar ≥ tablet).">
        <MascotFields base={['sections', 'cta', 'mascot']} />
      </Block>
      <Block title="Tombol">
        <Grid>
          <TextField path={c('primary_label')} label="Label tombol utama" />
          <TextField path={c('primary_href')} label="Tautan tombol utama" mono />
          <TextField path={c('secondary_label')} label="Label tombol kedua" />
          <TextField path={c('secondary_href')} label="Tautan tombol kedua" mono />
        </Grid>
      </Block>
    </>
  );
}

/* ------------------------------------------------------------------ */

function FooterEditor() {
  return (
    <>
      <Block title="Teks">
        <AreaField path={['footer', 'description']} label="Deskripsi" rows={2} />
        <Grid>
          <TextField path={['footer', 'copyright']} label="Teks hak cipta" hint="Tampil: © tahun Nama. Teks ini" />
          <TextField path={['footer', 'tagline']} label="Tagline" />
        </Grid>
      </Block>
      <Block title="Kolom tautan">
        <ListEditor
          path={['footer', 'columns']}
          label="kolom"
          addLabel="Tambah kolom"
          max={5}
          itemTitle={(c) => c && c.title}
          newItem={() => ({ title: 'Kolom baru', links: [] })}
          renderItem={(p) => (
            <>
              <TextField path={[...p, 'title']} label="Judul kolom" />
              <ListEditor
                path={[...p, 'links']}
                label="tautan"
                addLabel="Tambah tautan"
                max={8}
                itemTitle={(l) => l && l.label}
                newItem={() => ({ label: '', href: '/' })}
                renderItem={(lp) => (
                  <Grid>
                    <TextField path={[...lp, 'label']} label="Label" />
                    <TextField path={[...lp, 'href']} label="Tautan" mono />
                  </Grid>
                )}
              />
            </>
          )}
        />
      </Block>
    </>
  );
}

/* ------------------------------------------------------------------ */

function AuthSlideMedia({ path }) {
  const [slide, setSlide] = useValue(path, {});
  const type = slide && slide.video ? 'video' : 'image';
  const switchType = (t) => {
    if (t === type) return;
    const next = { ...slide };
    if (t === 'video') {
      next.video = next.video || '/video/tutorial-2.webm';
      delete next.image;
    } else {
      next.image = next.image || '';
      delete next.video;
      delete next.poster;
      delete next.start;
    }
    setSlide(next);
  };
  return (
    <>
      <SegmentedControl
        size="sm"
        ariaLabel="Jenis media"
        value={type}
        onChange={switchType}
        options={[
          { value: 'image', label: 'Gambar' },
          { value: 'video', label: 'Video' },
        ]}
      />
      {type === 'image' ? (
        <>
          <MediaField path={[...path, 'image']} label="Gambar" kind="image" hint="Screenshot aplikasi cocok ditampilkan dalam bingkai." />
          <SwitchField path={[...path, 'framed']} fallback={false} label="Tampilkan dalam bingkai browser" description="Latar gradasi biru + jendela browser (cocok untuk screenshot)." />
        </>
      ) : (
        <>
          <Grid>
            <MediaField path={[...path, 'video']} label="Video" kind="video" />
            <MediaField path={[...path, 'poster']} label="Poster" kind="image" />
          </Grid>
          <Grid>
            <NumberField path={[...path, 'start']} label="Mulai dari detik" />
            <NumberField path={[...path, 'duration']} label="Durasi tampil (ms)" hint="Kosong/0 = 5000 ms." />
          </Grid>
        </>
      )}
      <MediaField path={[...path, 'mascot']} label="Maskot (opsional)" kind="image" hint="Gambar transparan; tampil di kanan bingkai." />
    </>
  );
}

function AuthEditor() {
  return (
    <Block title="Slide panel media" description="Panel kiri halaman masuk & daftar, bergulir otomatis.">
      <ListEditor
        path={['auth', 'slides']}
        label="slide"
        addLabel="Tambah slide"
        min={1}
        max={6}
        itemTitle={(s) => s && (s.label || s.title)}
        newItem={() => ({ key: `slide${Date.now().toString(36)}`, label: 'Slide', title: '', subtitle: '', image: '' })}
        renderItem={(p) => (
          <>
            <Grid cols={3}>
              <TextField path={[...p, 'label']} label="Label tab" />
              <TextField path={[...p, 'title']} label="Judul" className="sm:col-span-2" />
            </Grid>
            <TextField path={[...p, 'subtitle']} label="Subjudul" />
            <AuthSlideMedia path={p} />
          </>
        )}
      />
    </Block>
  );
}

/* ------------------------------------------------------------------ */
/* SEO (docs/SEO.md) — site.seo                                          */
/* ------------------------------------------------------------------ */

/** Input/textarea dengan penghitung karakter langsung (batas ideal, bukan batas keras). */
function CountedField({ path, label, limit, hint, placeholder, area }) {
  const [value, setValue, error] = useValue(path, '');
  const len = String(value || '').trim().length;
  const over = len > limit;
  const msg = over ? `Lebih dari ${limit} karakter — bisa terpotong di hasil pencarian.` : hint;
  return (
    <Field
      label={label}
      error={error}
      hint={msg}
      labelAction={
        <span className={cn('text-xs font-medium tabular-nums', over ? 'text-danger-700' : len ? 'text-mint-700' : 'text-mist-500')} aria-live="polite">
          {len}/{limit}
        </span>
      }
    >
      {area ? (
        <Textarea value={value ?? ''} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} rows={3} className="min-h-[72px]" />
      ) : (
        <Input value={value ?? ''} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} />
      )}
    </Field>
  );
}

/** Daftar URL (sameAs) dengan pesan error per baris. */
function UrlListEditor({ path, placeholder, addLabel, max = 10 }) {
  const { errors } = useEditor();
  const [list, setList] = useValue(path, []);
  const items = Array.isArray(list) ? list : [];
  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="rounded-xl bg-ghost px-4 py-3 text-[13px] text-mist-700">Belum ada tautan profil.</p>}
      {items.map((v, i) => {
        const err = errors[[...path, i].join('.')];
        return (
          <div key={i}>
            <div className="flex items-center gap-1.5">
              <Input
                size="sm"
                mono
                value={v ?? ''}
                placeholder={placeholder}
                invalid={!!err}
                aria-label={`Tautan profil ${i + 1}`}
                onChange={(e) => setList(items.map((x, j) => (j === i ? e.target.value : x)))}
                wrapperClassName="flex-1"
              />
              <RowActions
                index={i}
                length={items.length}
                onMove={(a, b) => setList(moveItem(items, a, b))}
                onRemove={(k) => setList(items.filter((_, j) => j !== k))}
                label="tautan"
              />
            </div>
            {err && (
              <p role="alert" className="mt-1 text-[13px] text-danger-700">
                {err}
              </p>
            )}
          </div>
        );
      })}
      {items.length < max && (
        <Button variant="link" size="sm" icon={<Plus />} onClick={() => setList([...items, ''])}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}

/** Pratinjau sederhana hasil pencarian ala Google (judul/URL/deskripsi beranda). */
function SerpPreview() {
  const { site } = useEditor();
  const title = seoTitle(site);
  const desc = seoDescription(site);
  const host = siteHost(site);
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-obsidian">Pratinjau hasil pencarian</p>
      <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-mist-100">
        <div className="flex items-center gap-2.5">
          <BrandMark brand={site.brand} className="!h-7 !w-7 !rounded-full [&>span:first-child]:!text-[12px] [&>span:last-child]:hidden" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] text-obsidian">{site.brand?.name}</span>
            <span className="block truncate text-[12px] text-mist-700">https://{host}</span>
          </span>
        </div>
        <p className="mt-2 truncate text-[18px] leading-snug text-[#1a0dab]">{title}</p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-obsidian-600">{desc || 'Belum ada deskripsi — isi Deskripsi di atas atau di Branding.'}</p>
      </div>
      <p className="mt-1.5 text-[13px] text-mist-700">Perkiraan saja — Google bisa memotong atau mengganti judul &amp; deskripsi.</p>
    </div>
  );
}

function SeoEditor() {
  const { site } = useEditor();
  const autoTitle = seoTitle({ ...site, seo: { ...(site.seo || {}), title: '' } });
  return (
    <>
      <Block title="Alamat website" description="Domain utama untuk canonical, sitemap.xml, robots.txt, Open Graph, dan llms.txt.">
        <TextField
          path={['seo', 'site_url']}
          label="URL website"
          mono
          placeholder="https://belajarcpns.web.id"
          hint="URL lengkap dengan https://, tanpa garis miring di akhir. Env SITE_URL di server (bila diisi) lebih diutamakan."
        />
      </Block>
      <Block title="Hasil pencarian (beranda)" description="Judul & deskripsi yang tampil di Google/Bing. Kosongkan untuk memakai isi otomatis.">
        <CountedField path={['seo', 'title']} label="Judul (title)" limit={60} placeholder={autoTitle} hint="Ideal ≤ 60 karakter; taruh kata kunci utama di depan." />
        <CountedField
          path={['seo', 'description']}
          label="Deskripsi (meta description)"
          limit={160}
          area
          placeholder={site.brand?.description || ''}
          hint="Ideal ≤ 160 karakter. Kosong = deskripsi di Branding."
        />
        <SerpPreview />
      </Block>
      <Block title="Kata kunci & nama lain">
        <ChipsInput
          path={['seo', 'keywords']}
          label="Kata kunci"
          hint="Mis. belajar cpns, tryout cpns gratis. Dipakai untuk meta keywords — isi halaman tetap yang paling menentukan."
        />
        <ChipsInput path={['seo', 'alternate_names']} label="Nama alternatif brand" hint="Nama lain yang mungkin dicari orang (schema.org alternateName), mis. BELAJAR CPNS." />
      </Block>
      <Block title="Gambar bagikan (Open Graph)" description="Tampil saat tautan dibagikan di WhatsApp, Facebook, X, Telegram, dll.">
        <MediaField path={['seo', 'og_image']} kind="image" hint="Ukuran 1200×630 px (PNG/JPG). Kosongkan untuk gambar otomatis berisi nama website & maskot." />
      </Block>
      <Block title="Verifikasi webmaster" description="Tempel kode dari Google Search Console / Bing Webmaster Tools (metode tag HTML).">
        <Grid>
          <TextField path={['seo', 'google_verification']} label="Google Search Console" mono placeholder="kode google-site-verification" hint="Boleh kodenya saja atau tag <meta> utuh." />
          <TextField path={['seo', 'bing_verification']} label="Bing Webmaster Tools" mono placeholder="kode msvalidate.01" hint="Bing juga dipakai ChatGPT Search & Copilot." />
        </Grid>
      </Block>
      <Block title="Profil resmi (sameAs)" description="Tautan akun resmi brand (Instagram, TikTok, YouTube, dll.) agar mesin pencari mengenali entitas yang sama.">
        <UrlListEditor path={['seo', 'same_as']} placeholder="https://instagram.com/…" addLabel="Tambah tautan profil" />
      </Block>
    </>
  );
}

export const EDITORS = {
  branding: BrandEditor,
  seo: SeoEditor,
  navbar: NavbarEditor,
  sections: SectionsEditor,
  hero: HeroEditor,
  fitur: FeaturesEditor,
  skd: SkdEditor,
  langkah: StepsEditor,
  faq: FaqEditor,
  kontak: KontakEditor,
  cta: CtaEditor,
  footer: FooterEditor,
  auth: AuthEditor,
};
