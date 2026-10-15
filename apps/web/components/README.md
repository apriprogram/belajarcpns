# Komponen BISA-PNS — panduan untuk divisi halaman

Design system "Order. Balance. Clarity." Semua contoh hidup ada di **`/design-system`** — buka itu dulu.

```js
import { Button, Card, CardHeader, StatCard, Badge, useToast /* … */ } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useForm, rules } from '@/lib/useForm';
import { formatTanggal, formatDurasi, formatAngka } from '@/lib/format';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/cn';
```

## Aturan penting

1. **Ikon**: kirim sebagai *elemen* — `icon={<Plus />}` (bukan `icon={Plus}`). Elemen aman di Server maupun Client Component.
2. Halaman yang memakai state/hook/handler (`onClick`, `useToast`, fetch klien) wajib `'use client'` di baris pertama. Pola umum: `page.jsx` (server, `export const metadata`) merender `<XxxView />` (client).
3. `useSearchParams()` → bungkus komponen client dalam `<Suspense>` di `page.jsx` (lihat `app/(auth)/login/page.jsx`).
4. Warna hanya dari token: `obsidian`, `cobalt(-50/100/600/700)`, `mint(-50/100/700)`, `mist(-50/100/500/700)`, `ghost`, `danger(-50/700)`, `warning(-50/700)`. Teks di atas `bg-mint` selalu `text-obsidian`. Teks hijau di latar terang pakai `text-mint-700`. **Tanpa gradien** selain `.glow-cobalt` / `.glow-cobalt-dark`.
5. Radius kartu: `rounded-card` (28px), `rounded-card-sm` (24), `rounded-card-lg` (32). Shadow: `shadow-card`, `shadow-soft`, `shadow-pop`.
6. Angka besar: `tabular-nums` (StatCard/Gauge sudah). Timer, nomor soal, kode: `font-mono`.
7. Subtes → warna chip: `SUBTEST_COLOR` = `{ TWK: 'cobalt', TIU: 'warning', TKP: 'mint' }`.
8. Kerangka sudah ada: `(peserta)` → `PesertaShell` (topbar pill + glow, konten `max-w-7xl`), `(admin)` → `AdminShell` (sidebar obsidian), `(focus)` → tanpa navigasi (ruang ujian). **Jangan** bungkus halaman dengan shell lagi; cukup timpa `page.jsx`.

---

## Komponen (`components/ui`)

| Komponen | Props utama | Contoh |
|---|---|---|
| `Button` | `variant` primary·accent·mint·secondary·ghost·danger·danger-soft·link · `size` sm·md·lg·xl · `loading` · `icon` · `iconRight` · `fullWidth` · `href` (jadi Link) · `type` | `<Button icon={<Plus />} onClick={add}>Tambah soal</Button>` |
| `IconButton` | `icon` · **`label` (wajib, aria)** · `variant` white·dark·accent·ghost·outline·soft·danger · `size` xs·sm·md(40)·lg · `dot` · `href` · `loading` | `<IconButton icon={<Pencil />} label="Ubah" variant="dark" />` |
| `Card` | `variant` white·ghost·outline·obsidian·mint·cobalt · `padding` none·sm·md·lg · `radius` sm·md·lg · `interactive` · `as` | `<Card padding="lg">…</Card>` |
| `CardHeader` | `title` · `subtitle` · `action` · `icon` · `iconTone` · `size` sm·md·lg | `<CardHeader title="Target hari ini" action={<Button size="sm">Baru</Button>} />` |
| `StatCard` | `label` · `value` · `suffix` · `icon` · `tone` cobalt·mint·warning·danger·mist · `trend` (angka % atau `{value,label}`) · `hint` · `variant` white·ghost·obsidian · `loading` | `<StatCard label="Rata-rata skor" value="412,5" suffix="/550" icon={<Target />} trend={12} />` |
| `Chip` | `color` cobalt·mint·warning·danger·mist·obsidian·white · `size` sm·md·lg · `shape` pill·soft · `icon` · `mono` · `onClick`+`selected` (filter) | `<Chip color="warning" icon={<Clock3 />} mono>100 menit</Chip>` |
| `Badge` | `status` lulus·gagal·berlangsung·menunggu·selesai·draft·terbit·arsip·aktif·diblokir·tersedia·belum_dibuka·ditutup·benar·salah·kosong·mudah·sedang·sulit·online (juga `active`/`blocked`) · `tone` · `dot` · `size` sm·md · children = label kustom | `<Badge status={r.passed ? 'lulus' : 'gagal'} />` |
| `Field` | `label` · `hint` · `error` · `success` (string/true) · `required` · `optional` · `labelAction` · anak tunggal otomatis diberi `id`, `state`, `aria-*` | lihat Form di bawah |
| `Input` | `state` default·success·error (atau `invalid`) · `size` sm·md·lg · `leftIcon` · `rightIcon` · `rightSlot` · `mono` · `disabled` · atribut `<input>` | `<Input leftIcon={<Mail />} type="email" />` |
| `PasswordInput` | seperti `Input` + tombol tampil/sembunyi | `<PasswordInput autoComplete="new-password" />` |
| `Textarea` | `state` · `rows` | |
| `Select` | `options=[{value,label}]` atau `<option>` · `placeholder` (opsi "") · `state` · `leftIcon` | `<Select placeholder="Semua subtes" options={…} />` |
| `Checkbox` | `label` · `description` · `checked` · `onChange(e)` · `indeterminate` · `disabled` | |
| `Switch` | `checked` · `onChange(bool)` · `label` · `description` · `size` sm·md | `<Switch checked={v} onChange={setV} label="Acak soal" />` |
| `Tabs` | `items=[{value,label,icon?,count?}]` · `value`+`onChange` / `defaultValue` · `variant` pill·soft·underline · `size` · `fullWidth` | `<Tabs value={f} onChange={setF} items={[{value:'semua',label:'Semua'}, …]} />` |
| `TabPanel` | `idPrefix` · `value` · `current` | opsional, untuk aria-controls |
| `ProgressBar` | `value` · `max` · `color` cobalt·mint·mint-dark·obsidian·warning·danger · `size` xs–lg · `label` · `showValue` · `valueText` · `marker` (passing grade) | `<ProgressBar label="TWK" value={115} max={150} marker={65} showValue valueText="115/150" />` |
| `SegmentedProgress` | `total` · `value` · `color` · `label` · `showCount` | `<SegmentedProgress label="Checklist" total={4} value={2} />` |
| `Gauge` | `value` · `max` · `label` · `valueText` · `suffix` · `color` · `size` (px) · `thickness` · `marker` · children (legend) | `<Gauge value={412.5} max={550} label="dari 550" />` |
| `LineChart` | `data` · `xKey`('label') · `series=[{key,label,color?,dashed?}]` · `height` · `curved` · `area` · `formatY(v)` · `formatValue(v,s)` · `defaultActive` · `yMin/yMax` | `<LineChart data={study.days.map(d=>({label:d.label,value:d.minutes}))} series={[{key:'value',label:'Menit'}]} defaultActive={6} />` |
| `BarChart` | `data` · `xKey` · `series` (grouped) · `height` · `formatY` · `formatValue` · `highlightIndex` | `<BarChart data={activity} series={[{key:'attempts',label:'Tryout'},{key:'registrations',label:'Pendaftar'}]} />` |
| `ChartLegend` | `items=[{label,color}]` | warna seri default: `#3765F6`, `#C3CED7`, `#14833A`, `#F5B301` |
| `Modal` | `open` · `onClose` · `title` · `eyebrow` · `description` · `size` sm·md·lg·xl·full · `footer` · `closeOnOverlay` · `hideClose` · `initialFocus` | Portal, ESC, focus trap, kunci scroll, bottom-sheet di mobile. Tambah `data-autofocus` pada elemen yang ingin difokus. |
| `ConfirmDialog` | `open` · `onClose` · `onConfirm` (async → loading otomatis, tutup jika sukses; kembalikan `false` untuk tetap terbuka) · `title` · `description` · `confirmText` · `cancelText` · `tone` danger·default · children | lihat pola di bawah |
| `TableContainer` | `maxHeight` (aktifkan scroll + header sticky) | |
| `Table` `THead` `TBody` `Tr` `Th` `Td` | `Th`: `align` · `width` · `sort` asc·desc·null + `onSort` · `Td`: `align` · `muted` · `mono` · `nowrap` · `Tr`: `onClick` · `selected` · `Table`: `dense` | |
| `TableEmpty` / `TableSkeleton` | `colSpan` / `rows`, `cols` | baris kosong & memuat di dalam `<TBody>` |
| `Pagination` | `meta` (langsung dari API) **atau** `page`,`totalPages`,`total`,`perPage` · `onChange(page)` | `<Pagination meta={meta} onChange={setPage} />` |
| `EmptyState` | `icon` · `title` · `description` · `action` · `size` sm·md · `variant` plain·card·dashed | |
| `ErrorState` | `error` (ApiError/string) · `title` · `onRetry` · `size` · `variant` | |
| `Skeleton` / `SkeletonText` / `SkeletonCard` | `className` (ukuran) · `rounded` / `lines` / `height` | |
| `Spinner` / `LoadingBlock` | `size` xs–xl · `tone` current·cobalt·white / `label` | |
| `Avatar` / `AvatarGroup` | `name` · `src` · `size` xs–xl · `status` online·offline / `names[]` · `max` | inisial dengan warna deterministik |
| `ToastProvider` / `useToast` | sudah terpasang global | `toast.success(title, desc)`, `.error`, `.warning`, `.info`, `toast({title, description, tone, duration, action:{label,onClick}})` |
| `Dropdown` | `trigger` (elemen) · `items=[{label,icon,onClick,href,danger,disabled,description} \| {divider:true} \| {header:'…'}]` · `align` end·start · `width` · children (panel kustom, boleh `({close}) => …`) · `onOpenChange` | portal + fixed → aman di tabel |
| `Menu` | menu titik tiga: `items` · `label` · `variant` · `size` · `vertical` | `<Menu items={[{label:'Ubah',icon:<Pencil/>,onClick:edit},{divider:true},{label:'Hapus',icon:<Trash2/>,danger:true,onClick:ask}]} />` |
| `SearchInput` | `value`+`onChange(v)` · `onSearch(v)` (debounce `debounce`=350ms) · `placeholder` · `size` sm·md · `shortcut` (tombol "/") | `<SearchInput placeholder="Cari soal…" onSearch={(q)=>setQuery({q, page:1})} />` |

Komponen layout (`components/layout`): `PageHeader`, `Logo`/`LogoMark`, `PesertaShell` (+`PESERTA_NAV`), `AdminShell` (+`ADMIN_NAV`), `NotificationBell`, `UserMenu`, `PublicNavbar`, `PublicFooter`, `ComingSoon`.
Auth helpers (`components/auth/AuthParts`): `AuthHeading`, **`FormAlert`** (`tone` error·success·info, `title`) — banner pesan dalam form, boleh dipakai di mana saja.

---

## Utilitas

### `lib/api.js`
- `api.get(path, { query })` → `data` · `api.list(path, { query })` → `{ data, meta }` (untuk daftar berpaginasi)
- `api.post/put/patch(path, body)` · `api.del(path)` · `api.upload(path, formData)` · `api.download(path, filename?, { query })`
- `path` boleh tanpa `/api` (`'/me/dashboard'` → `/api/me/dashboard`). `query` mengabaikan nilai kosong.
- 401 → otomatis `POST /api/auth/refresh` sekali lalu ulang. Gagal → event `bisapns:unauthorized` → AuthProvider mengarahkan ke `/login?next=…` (di rute terproteksi).
- Error: `ApiError { status, code, message, fields, data }`. `errorMessage(err)` → pesan ramah. Kode khusus: `TIME_UP`, `ATTEMPT_FINISHED`, `ATTEMPT_NOT_FINISHED`, `IMPORT_ERROR` (`err.data.errors=[{row,message}]`), `CONFLICT`, `TOO_MANY_REQUESTS`.

### `lib/format.js` (id-ID, Asia/Jakarta)
`formatTanggal(v, 'medium'|'long'|'short'|'day-month')` · `formatJam` ("09.30") · `formatTanggalJam` ("12 Okt 2026, 09.30 WIB") · `formatHari` · `isoDay()` ("2026-10-12" untuk `?day=`) · `formatDurasi(detik, {unit:'minutes'})` ("1 j 20 m") · `formatTimer(detik)` ("01:39:58") · `formatAngka(v,{decimals})` · `formatRingkas` · `formatPersen(v)` · `formatRelatif(v)` ("5 menit yang lalu") · `initials` · `excerpt(text, max)`.

### `lib/useForm.js`
`useForm({ initial, validate })` → `{ values, setValue, bind(name,{type}), field(name,{success}), errorOf, handleSubmit(fn), submitting, formError, setFormError, applyApiError, setServerErrors, reset }`. Validator: `rules.required/email/phone/password/match`, `passwordStrength(pw)`.

### `useAuth()`
`{ user, loading, setUser, refresh, logout, isAdmin }`. `homeFor(user)` → `/admin` atau `/dashboard`.

---

## Pola halaman standar

### 1. Header + grid kartu
```jsx
<PageHeader
  title="Bank soal"
  description="Kelola soal TWK, TIU, dan TKP."
  actions={<>
    <Button variant="secondary" icon={<Download />} onClick={() => api.download('/admin/questions/export', 'soal.csv')}>Ekspor</Button>
    <Button icon={<Plus />} href="/admin/soal/baru">Soal baru</Button>
  </>}
>
  <Tabs value={tab} onChange={setTab} items={[…]} />   {/* opsional */}
</PageHeader>

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{/* StatCard … */}</div>
<div className="mt-4 grid gap-4 lg:grid-cols-12">
  <Card className="lg:col-span-8">…</Card>
  <Card className="lg:col-span-4">…</Card>
</div>
```
Jarak antar kartu `gap-4`, antar bagian `mt-4`/`mt-8`. Satu fokus per kartu.

### 2. Fetch data: loading / error / empty
```jsx
'use client';
const [state, setState] = useState({ loading: true, error: null, data: null, meta: null });
const load = useCallback(async () => {
  setState((s) => ({ ...s, loading: true, error: null }));
  try {
    const { data, meta } = await api.list('/admin/questions', { query: { q, page, per_page: 10 } });
    setState({ loading: false, error: null, data, meta });
  } catch (error) {
    setState((s) => ({ ...s, loading: false, error }));
  }
}, [q, page]);
useEffect(() => { load(); }, [load]);

if (state.error) return <Card padding="none"><ErrorState error={state.error} onRetry={load} /></Card>;
// tabel:
<TBody>
  {state.loading ? <TableSkeleton rows={6} cols={5} />
   : !state.data.length ? <TableEmpty colSpan={5}><EmptyState size="sm" title="Belum ada soal" /></TableEmpty>
   : state.data.map((r) => <Tr key={r.id}>…</Tr>)}
</TBody>
<Pagination meta={state.meta} onChange={setPage} />
```
Untuk kartu: `loading ? <SkeletonCard /> : …`, `StatCard loading`.

### 3. Toast + ConfirmDialog
```jsx
const toast = useToast();
const [toDelete, setToDelete] = useState(null);

<Menu items={[{ label: 'Hapus', icon: <Trash2 />, danger: true, onClick: () => setToDelete(row) }]} />

<ConfirmDialog
  open={!!toDelete}
  onClose={() => setToDelete(null)}
  tone="danger"
  title="Hapus soal ini?"
  description="Soal yang sudah dipakai di paket tidak dapat dihapus."
  onConfirm={async () => {
    try {
      await api.del(`/admin/questions/${toDelete.id}`);
      toast.success('Soal dihapus');
      load();
    } catch (err) {
      toast.error('Gagal menghapus', errorMessage(err));
      return false; // tetap buka dialog
    }
  }}
/>
```

### 4. Form + error `fields` dari ApiError
```jsx
const form = useForm({
  initial: { name: user.name, phone: user.phone },
  validate: (v) => ({ name: rules.required(v.name, 'Nama'), phone: rules.phone(v.phone) }),
});
const onSubmit = form.handleSubmit(async (v) => {
  const me = await api.put('/me', v);   // 422 → fields otomatis tampil di Field terkait
  setUser(me);
  toast.success('Profil diperbarui');
});

<form onSubmit={onSubmit} noValidate className="space-y-5">
  {form.formError && <FormAlert>{form.formError}</FormAlert>}
  <Field label="Nama" required {...form.field('name')}><Input {...form.bind('name')} /></Field>
  <Field label="Nomor HP" required {...form.field('phone', { success: true })}><Input type="tel" {...form.bind('phone')} /></Field>
  <Button type="submit" loading={form.submitting}>Simpan</Button>
</form>
```
Tanpa `useForm`: `catch (err) { if (err instanceof ApiError && err.fields) setErrors(err.fields); else toast.error('Gagal', err.message); }` lalu `<Field error={errors.body}>`. Field bersarang dari API (mis. `options.A`) dibaca langsung: `errors['options.A']`.

### 5. Modal detail (pola referensi)
`<Modal eyebrow="Detail peserta" size="lg" footer={…}>` → blok profil `rounded-card-sm bg-ghost p-5` → ringkasan 4 kotak (`grid grid-cols-2 sm:grid-cols-4 gap-px bg-mist-100 rounded-2xl` dengan sel `bg-white p-4`) → tabel riwayat. Contoh lengkap di `/design-system#overlay`.

### 6. Ruang ujian (`(focus)`)
Layout `(focus)/layout.jsx` hanya `min-h-screen bg-ghost`. Status nomor soal: belum = `bg-white ring-1 ring-mist-100 text-mist-500`, dijawab = `bg-cobalt text-white`, ragu = `bg-warning text-obsidian`, aktif = `ring-2 ring-obsidian`. Timer pakai `formatTimer()` + `font-mono tabular-nums`; < 5 menit → `text-danger`.
