'use client';

import { useState } from 'react';
import {
  ArrowUpDown,
  Bell,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Inbox,
  LayoutGrid,
  ListChecks,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Search,
  Settings2,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';
import {
  Avatar,
  AvatarGroup,
  Badge,
  BarChart,
  Button,
  Calendar,
  Card,
  CardHeader,
  ChartLegend,
  Checkbox,
  Chip,
  ConfirmDialog,
  DatePicker,
  Dropdown,
  EmptyState,
  ErrorState,
  Field,
  FileUpload,
  FilterBar,
  Gauge,
  IconBox,
  IconButton,
  Input,
  LineChart,
  Menu,
  Modal,
  PageTitle,
  Pagination,
  PasswordInput,
  Popover,
  ProgressBar,
  SearchInput,
  SegmentedControl,
  SegmentedProgress,
  Select,
  SelectMenu,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  Spinner,
  StatCard,
  Switch,
  Table,
  TableContainer,
  TBody,
  Td,
  Th,
  THead,
  TimeList,
  Tr,
  Tabs,
  Textarea,
  useToast,
} from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatDurasi, formatTanggal } from '@/lib/format';
import { cn } from '@/lib/cn';

const COLORS = [
  { name: 'Neon Mint', token: 'mint', hex: '#70FC8E', cls: 'bg-mint', shades: [['50', 'bg-mint-50'], ['100', 'bg-mint-100'], ['700', 'bg-mint-700']], note: 'Sukses, lulus, highlight kecil. Teks di atasnya selalu obsidian.' },
  { name: 'True Cobalt', token: 'cobalt', hex: '#3765F6', cls: 'bg-cobalt', shades: [['50', 'bg-cobalt-50'], ['100', 'bg-cobalt-100'], ['600', 'bg-cobalt-600'], ['700', 'bg-cobalt-700']], note: 'Aksi utama, tautan, ring fokus, garis grafik.' },
  { name: 'Cool Mist', token: 'mist', hex: '#C3CED7', cls: 'bg-mist', shades: [['50', 'bg-mist-50'], ['100', 'bg-mist-100'], ['500', 'bg-mist-500'], ['700', 'bg-mist-700']], note: 'Border, divider, placeholder, track progres.' },
  { name: 'Ghost Grey', token: 'ghost', hex: '#F2F3F6', cls: 'bg-ghost ring-1 ring-inset ring-mist-100', shades: [], note: 'Latar halaman & permukaan sekunder.' },
  { name: 'Obsidian', token: 'obsidian', hex: '#181D25', cls: 'bg-obsidian', shades: [['800', 'bg-obsidian-800'], ['600', 'bg-obsidian-600']], note: 'Teks utama, CTA hitam, sidebar.' },
  { name: 'Status', token: 'danger / warning', hex: '#E5484D · #F5B301', cls: 'bg-danger', split: 'bg-warning', shades: [['danger-50', 'bg-danger-50'], ['warning-50', 'bg-warning-50']], note: 'Hanya untuk makna: error & ragu/menunggu.' },
];

const SECTIONS = [
  ['judul', 'Judul & deskripsi'],
  ['tombol', 'Button'],
  ['input', 'Input'],
  ['dropdown', 'Dropdown'],
  ['kalender', 'Kalender'],
  ['switch', 'Switch'],
  ['menu', 'Menu'],
  ['upload', 'Upload file'],
  ['modal', 'Modal'],
  ['card', 'Card'],
  ['tabel', 'Tabel'],
  ['filter', 'Filter'],
  ['pagination', 'Pagination'],
  ['badge', 'Badge & chip'],
  ['status', 'Status'],
  ['fondasi', 'Warna & tipografi'],
];

const LINE = [
  { label: 'Sen', value: 1.2, kemarin: 0.8 },
  { label: 'Sel', value: 1.4, kemarin: 1.5 },
  { label: 'Rab', value: 3.6, kemarin: 2 },
  { label: 'Kam', value: 7.4, kemarin: 4.2 },
  { label: 'Jum', value: 10.2, kemarin: 5.5 },
  { label: 'Sab', value: 10.2, kemarin: 6.1 },
  { label: 'Min', value: 10.4, kemarin: 6.4 },
];
const BARS = Array.from({ length: 14 }, (_, i) => ({ label: `${i + 1} Okt`, attempts: [12, 18, 9, 22, 30, 26, 14, 19, 33, 28, 24, 36, 31, 40][i], registrations: [4, 6, 3, 8, 7, 9, 5, 6, 10, 8, 7, 12, 9, 11][i] }));
const ROWS = [
  { id: 1, name: 'Tope Aryasatya', email: 'tope@mail.id', paket: 'Tryout Nasional #1', score: 462, passed: true, dur: 5820, at: '2026-10-10T09:12:00+07:00' },
  { id: 2, name: 'John Nirwan', email: 'john@mail.id', paket: 'Tryout Nasional #1', score: 398, passed: false, dur: 6000, at: '2026-10-10T10:40:00+07:00' },
  { id: 3, name: 'Faith Ondasari', email: 'faith@mail.id', paket: 'Tryout Mini TIU', score: 455, passed: true, dur: 4310, at: '2026-10-11T13:05:00+07:00' },
  { id: 4, name: 'Jenny Wulandari', email: 'jenny@mail.id', paket: 'Tryout Nasional #2', score: null, passed: null, dur: null, at: '2026-10-12T08:00:00+07:00' },
];
const SUBTES = [
  { value: 'TWK', label: 'TWK — Wawasan Kebangsaan', icon: <BookOpen /> },
  { value: 'TIU', label: 'TIU — Intelegensia Umum', icon: <Sparkles /> },
  { value: 'TKP', label: 'TKP — Karakteristik Pribadi', icon: <UserRound /> },
];

/** Mini sparkline (slot `chart` StatCard). */
function Sparkline({ points = [], className }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${(i / (points.length - 1)) * 100},${28 - ((p - min) / (max - min || 1)) * 24}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn('h-8 w-full', className)} aria-hidden>
      <path d={d} fill="none" stroke="#3765F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Mini bar (slot `chart` StatCard). filled: jumlah bar penuh (sisanya pudar). */
function MiniBars({ values = [], filled }) {
  const max = Math.max(...values);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden>
      {values.map((v, i) => (
        <span key={i} className={cn('w-[5px] rounded-full', filled == null || i < filled ? 'bg-cobalt' : 'bg-cobalt-100')} style={{ height: `${Math.max(12, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

export function Showcase() {
  const toast = useToast();
  const [tab, setTab] = useState('semua');
  const [bigTab, setBigTab] = useState('ringkasan');
  const [seg, setSeg] = useState('semua');
  const [modal, setModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [reschedule, setReschedule] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sw, setSw] = useState(true);
  const [sw2, setSw2] = useState(false);
  const [check, setCheck] = useState(true);
  const [page, setPage] = useState(2);
  const [page2, setPage2] = useState(7);
  const [sort, setSort] = useState('desc');
  const [q, setQ] = useState('');
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [subtes, setSubtes] = useState('TIU');
  const [urut, setUrut] = useState('terbaru');
  const [date, setDate] = useState(() => new Date(2026, 9, 17));
  const [date2, setDate2] = useState(null);
  const [time, setTime] = useState('09:30');
  const [files, setFiles] = useState([]);

  const urutItems = [
    { header: 'Urutkan' },
    { label: 'Terbaru', active: urut === 'terbaru', onClick: () => setUrut('terbaru') },
    { label: 'Skor tertinggi', active: urut === 'skor', onClick: () => setUrut('skor') },
    { label: 'Nama (A–Z)', active: urut === 'nama', onClick: () => setUrut('nama') },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <PageHeader
        size="lg"
        breadcrumb={[{ label: 'Beranda', href: '/' }, 'Design system']}
        title="Design system"
        description="Calm Workspace — Style UI v2: datar, garis 1px, shadow hanya untuk lapisan melayang. Semua komponen diimpor dari @/components/ui."
        actions={
          <>
            <Button variant="secondary" icon={<FileText />} href="#tombol">
              Komponen
            </Button>
            <Button variant="accent" icon={<Bell />} onClick={() => toast.success('Toast berhasil', 'Contoh notifikasi sukses.')}>
              Coba toast
            </Button>
          </>
        }
      >
        <nav aria-label="Bagian" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {SECTIONS.map(([id, l]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[13px] font-medium text-obsidian-600 ring-1 ring-inset ring-mist-100 transition-colors hover:text-obsidian hover:ring-mist">
              {l}
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="space-y-16">
        {/* JUDUL & DESKRIPSI */}
        <Section id="judul" title="Judul & deskripsi" desc="PageTitle / PageHeader: breadcrumb kecil, judul 28px, deskripsi satu kalimat, aksi di kanan. Tabs “display” untuk judul bertab.">
          <div className="space-y-4">
            <Card>
              <PageTitle
                breadcrumb={[{ label: 'Admin', href: '#judul' }, { label: 'Bank soal', href: '#judul' }, 'Semua soal']}
                title="Bank soal"
                description="Kelola soal TWK, TIU, dan TKP beserta pembahasan dan bobot opsi."
                actions={
                  <>
                    <Button variant="secondary" icon={<Download />}>
                      Ekspor
                    </Button>
                    <Button variant="accent" icon={<Plus />}>
                      Tambah soal
                    </Button>
                  </>
                }
              />
            </Card>
            <Card>
              <Tabs
                variant="display"
                value={bigTab}
                onChange={setBigTab}
                ariaLabel="Bagian laporan"
                items={[
                  { value: 'ringkasan', label: 'Ringkasan' },
                  { value: 'peserta', label: 'Peserta' },
                  { value: 'analisis', label: 'Analisis butir' },
                ]}
              />
              <p className="mt-3 text-sm text-mist-700">Tab besar: nonaktif abu, aktif obsidian. Navigasi ← → Home End.</p>
            </Card>
          </div>
        </Section>

        {/* BUTTON */}
        <Section id="tombol" title="Button" desc="Tanpa shadow. Bentuk default rounded-xl; shape='pill' untuk landing & navigasi. Tinggi sm 36 · md 44 · lg 48.">
          <Card padding="lg" className="space-y-8">
            <Row label="Variant">
              <Button>Primary</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="soft">Soft</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="mint">Mint</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="danger-soft">Danger soft</Button>
              <Button variant="link">Tautan</Button>
            </Row>
            <Row label="Bentuk">
              <Button variant="accent" icon={<Plus />}>
                Rounded (default)
              </Button>
              <Button variant="accent" shape="pill" icon={<Plus />}>
                Pill
              </Button>
              <Button variant="secondary" shape="pill">
                Lihat detail
              </Button>
              <Button variant="soft" shape="pill" icon={<Mail />}>
                Lanjutkan dengan email
              </Button>
            </Row>
            <Row label="Ukuran">
              <Button size="sm" icon={<Plus />}>
                Small
              </Button>
              <Button size="md" icon={<Plus />}>
                Medium
              </Button>
              <Button size="lg" icon={<Plus />}>
                Large
              </Button>
              <Button size="xl" iconRight={<TrendingUp />}>
                Extra large
              </Button>
            </Row>
            <Row label="State">
              <Button
                variant="accent"
                loading={loadingBtn}
                onClick={() => {
                  setLoadingBtn(true);
                  setTimeout(() => setLoadingBtn(false), 1500);
                }}
              >
                {loadingBtn ? 'Menyimpan…' : 'Klik untuk loading'}
              </Button>
              <Button loading>Memuat</Button>
              <Button disabled>Disabled</Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
            </Row>
            <Row label="Tombol ikon">
              <IconButton icon={<Bell />} label="Notifikasi" dot />
              <IconButton icon={<Search />} label="Cari" />
              <IconButton icon={<Settings2 />} label="Pengaturan" variant="soft" />
              <IconButton icon={<Pencil />} label="Ubah" variant="dark" />
              <IconButton icon={<Plus />} label="Tambah" variant="accent" />
              <IconButton icon={<Eye />} label="Lihat" variant="outline" />
              <IconButton icon={<Trash2 />} label="Hapus" variant="danger" />
              <span className="mx-1 h-6 w-px bg-mist-100" aria-hidden />
              <IconButton icon={<Share2 />} label="Bagikan" shape="rounded" />
              <IconButton icon={<Copy />} label="Salin" shape="rounded" variant="soft" />
              <IconButton icon={<Pencil />} label="Ubah kecil" shape="rounded" size="sm" />
            </Row>
          </Card>
        </Section>

        {/* INPUT */}
        <Section id="input" title="Input" desc="Putih, garis 1px mist-100, rounded-xl, h-11. Fokus = garis cobalt 2px. 5 state: disabled · default · focus · sukses · error.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card padding="lg" className="space-y-5">
              <CardHeader title="Lima state" info="Disabled, default, focus, sukses, error" className="mb-1" />
              <Field label="Nomor peserta" hint="State: disabled">
                <Input disabled placeholder="1234 1234 1234 1234" mono />
              </Field>
              <Field label="Nomor peserta" hint="State: default">
                <Input placeholder="1234 1234 1234 1234" mono />
              </Field>
              <Field label="Nomor peserta" hint="State: focus (klik di sini)">
                <Input defaultValue="2783 2922 23" mono />
              </Field>
              <Field label="Nomor peserta" success="Nomor peserta ditemukan">
                <Input defaultValue="2783 2922 2326 2882" mono />
              </Field>
              <Field label="Nomor peserta" error="Oopss.. nomor peserta tidak kami temukan.">
                <Input defaultValue="2783 2922 2326 8829" mono />
              </Field>
            </Card>
            <Card padding="lg" className="space-y-5">
              <CardHeader title="Jenis input" className="mb-1" />
              <Field label="Email" required>
                <Input type="email" placeholder="nama@email.com" leftIcon={<Mail />} />
              </Field>
              <Field label="Kata sandi" required hint="Klik ikon mata untuk menampilkan.">
                <PasswordInput defaultValue="rahasia123" leftIcon={<Lock />} />
              </Field>
              <Input innerLabel="Nama paket" leftIcon={<Briefcase />} defaultValue="Tryout Nasional #3" />
              <Field label="Subtes (select native)">
                <Select placeholder="Pilih subtes" options={SUBTES.map(({ value, label }) => ({ value, label }))} />
              </Field>
              <Field label="Pembahasan" description="Jelaskan langkah penyelesaian secara singkat." optional>
                <Textarea placeholder="Tulis pembahasan soal…" />
              </Field>
            </Card>
          </div>
        </Section>

        {/* DROPDOWN */}
        <Section id="dropdown" title="Dropdown" desc="Pemicu seperti Select; panel melayang putih rounded-2xl + shadow-float. Item h-9, aktif bg-ghost + centang. Keyboard ↑ ↓ Enter Esc.">
          <Card padding="lg">
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Subtes (SelectMenu)">
                <SelectMenu options={SUBTES} value={subtes} onChange={setSubtes} />
              </Field>
              <Field label="Kategori">
                <SelectMenu
                  placeholder="Pilih kategori"
                  leftIcon={<FolderOpen />}
                  options={[
                    { value: 'pancasila', label: 'Pancasila', description: 'TWK · 42 soal' },
                    { value: 'verbal', label: 'Analogi verbal', description: 'TIU · 31 soal' },
                    { value: 'pelayanan', label: 'Pelayanan publik', description: 'TKP · 27 soal' },
                  ]}
                  onChange={(v) => toast.info('Kategori dipilih', v)}
                />
              </Field>
              <div className="flex flex-col">
                <span className="mb-1.5 text-sm font-medium text-obsidian">Dropdown dari tombol</span>
                <Dropdown
                  align="start"
                  items={urutItems}
                  trigger={
                    <Button variant="secondary" icon={<ArrowUpDown />} iconRight={<ChevronDown />} className="self-start">
                      Urutkan
                    </Button>
                  }
                />
              </div>
            </div>
          </Card>
        </Section>

        {/* KALENDER */}
        <Section id="kalender" title="Kalender" desc="Calendar (bulan, nama hari Indonesia, tombol bulat ‹ ›, hari ini cobalt tebal, terpilih cobalt), DatePicker (popover), TimeList (slot jam).">
          <div className="grid gap-4 lg:grid-cols-3">
            <Calendar bordered value={date} onChange={setDate} markedDates={[new Date(2026, 9, 20), new Date(2026, 9, 27)]} showToday clearable />
            <Card padding="lg" className="flex flex-col">
              <CardHeader title="Jadwalkan ulang" subtitle="Pilih tanggal & jam terbit paket." icon={<CalendarCheck />} />
              <div className="space-y-3">
                <DatePicker label="Tanggal" value={date} onChange={setDate} min={new Date(2026, 0, 1)} weekday />
                <Popover
                  ariaLabel="Pilih jam"
                  width="trigger"
                  className="p-2"
                  trigger={
                    <button type="button" className="group flex min-h-14 w-full items-center gap-3 rounded-xl border border-mist-100 bg-white px-4 py-2 text-left transition-[border-color,box-shadow] hover:border-mist focus-visible:border-cobalt focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cobalt aria-expanded:border-cobalt aria-expanded:ring-1 aria-expanded:ring-cobalt">
                      <Clock3 className="h-5 w-5 text-obsidian-600 group-aria-expanded:text-cobalt" aria-hidden />
                      <span className="flex flex-col">
                        <span className="text-xs text-mist-700">Jam</span>
                        <span className="text-[15px] font-medium tabular-nums">{time.replace(':', '.')} WIB</span>
                      </span>
                    </button>
                  }
                >
                  {({ close }) => (
                    <TimeList
                      value={time}
                      suffix="WIB"
                      maxHeight={240}
                      onChange={(t) => {
                        setTime(t);
                        close();
                      }}
                    />
                  )}
                </Popover>
                <DatePicker label="Tanggal tutup" value={date2} onChange={setDate2} placeholder="Belum diatur" min={date} />
              </div>
              <div className="mt-auto flex justify-end pt-5">
                <Button variant="accent" onClick={() => toast.success('Jadwal diperbarui', `${date ? date.toLocaleDateString('id-ID') : '—'} · ${time.replace(':', '.')} WIB`)}>
                  Simpan jadwal
                </Button>
              </div>
            </Card>
            <Card padding="lg">
              <CardHeader title={`${time.replace(':', '.')} WIB`} subtitle="TimeList — slot 30 menit" />
              <TimeList value={time} onChange={setTime} start="07:00" end="17:00" suffix="WIB" isTimeDisabled={(t) => t === '12:00' || t === '12:30'} />
            </Card>
          </div>
        </Section>

        {/* SWITCH */}
        <Section id="switch" title="Switch & checkbox" desc="Switch track 36×20: off mist, on cobalt, knob putih. Checkbox tercentang cobalt.">
          <Card padding="lg">
            <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
              <div className="space-y-5">
                <Switch checked={sw} onChange={setSw} label="Terbitkan paket" description="Paket terlihat oleh peserta." />
                <Switch checked={sw2} onChange={setSw2} label="Acak urutan opsi" description="Opsi A–E diacak per peserta." />
                <Switch checked={false} disabled label="Mode ujian ketat" description="Nonaktif (contoh disabled)." />
                <div className="flex items-center gap-4">
                  <Switch checked={sw} onChange={setSw} aria-label="Switch md" />
                  <Switch checked={sw} onChange={setSw} size="sm" aria-label="Switch sm" />
                </div>
              </div>
              <div className="flex flex-col items-start gap-4">
                <Checkbox label="Acak urutan soal" description="Setiap peserta mendapat urutan berbeda." checked={check} onChange={(e) => setCheck(e.target.checked)} />
                <Checkbox label="Indeterminate" indeterminate readOnly />
                <Checkbox label="Disabled" disabled />
              </div>
            </div>
          </Card>
        </Section>

        {/* MENU */}
        <Section id="menu" title="Menu" desc="Menu titik tiga dan menu pengguna: panel putih, grup berlabel kecil uppercase, item berikon, pemisah, item bahaya merah.">
          <Card padding="lg">
            <Row label="Pemicu">
              <Menu
                items={[
                  { label: 'Lihat detail', icon: <Eye /> },
                  { label: 'Ubah', icon: <Pencil />, shortcut: 'E' },
                  { label: 'Duplikat', icon: <Copy />, shortcut: 'D' },
                  { divider: true },
                  { label: 'Hapus', icon: <Trash2 />, danger: true, onClick: () => setConfirm(true) },
                ]}
              />
              <Menu
                variant="white"
                size="md"
                vertical
                label="Aksi paket"
                items={[
                  { header: 'Paket' },
                  { label: 'Buka ruang ujian', icon: <Timer />, description: 'Peserta dapat mulai' },
                  { label: 'Atur passing grade', icon: <Target /> },
                  { header: 'Data' },
                  { label: 'Ekspor CSV', icon: <Download /> },
                  { label: 'Arsipkan', icon: <Inbox />, disabled: true },
                ]}
              />
              <Menu variant="soft" shape="rounded" size="md" items={[{ label: 'Tampilan kisi', icon: <LayoutGrid />, active: true }, { label: 'Tampilan daftar', icon: <ListChecks /> }]} label="Tampilan" />
              <Dropdown
                width={260}
                header={
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar name="Tope Aryasatya" size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">Tope Aryasatya</p>
                      <p className="truncate text-xs text-mist-700">tope@mail.id</p>
                    </div>
                  </div>
                }
                items={[{ divider: true }, { label: 'Profil saya', icon: <UserRound /> }, { label: 'Pengaturan', icon: <Settings2 /> }, { divider: true }, { label: 'Keluar', icon: <LogOut />, danger: true }]}
                trigger={
                  <button type="button" className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 ring-1 ring-inset ring-mist-100 hover:bg-mist-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt" aria-label="Menu pengguna">
                    <Avatar name="Tope Aryasatya" size="sm" />
                    <span className="text-sm font-medium">Tope</span>
                    <ChevronDown className="h-4 w-4 text-mist-700" aria-hidden />
                  </button>
                }
              />
            </Row>
          </Card>
        </Section>

        {/* UPLOAD FILE */}
        <Section id="upload" title="Upload file" desc="Dropzone putus-putus: seret & lepas atau klik; validasi format dan ukuran (pesan Bahasa Indonesia); daftar file dengan tombol hapus.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card padding="lg">
              <Field label="Impor soal" description="Unggah file CSV/XLSX sesuai template. Bisa lebih dari satu file.">
                <FileUpload accept=".csv,.xlsx" multiple maxSize={5} maxFiles={3} files={files} onFiles={setFiles} />
              </Field>
            </Card>
            <Card padding="lg">
              <Field label="Gambar soal" description="Satu gambar, maksimal 2 MB.">
                <FileUpload accept="image/*" maxSize={2} compact title="Seret gambar ke sini" buttonText="Pilih gambar" onFiles={(f) => f.length && toast.success('Gambar dipilih', f[0].name)} />
              </Field>
              <div className="mt-5">
                <Field label="Lampiran (disabled)">
                  <FileUpload disabled compact />
                </Field>
              </div>
            </Card>
          </div>
        </Section>

        {/* MODAL */}
        <Section id="modal" title="Modal" desc="rounded-[24px], header (ikon + judul + tombol tutup bulat), garis pemisah, body p-6, footer kanan. Satu-satunya elemen ber-shadow + backdrop blur.">
          <Card padding="lg">
            <div className="flex flex-wrap gap-2">
              <Button variant="accent" icon={<Plus />} onClick={() => setProjectModal(true)}>
                Buat paket baru
              </Button>
              <Button variant="secondary" icon={<CalendarDays />} onClick={() => setReschedule(true)}>
                Jadwalkan ulang
              </Button>
              <Button variant="secondary" icon={<Users />} onClick={() => setModal(true)}>
                Detail peserta
              </Button>
              <Button variant="danger-soft" onClick={() => setConfirm(true)}>
                Dialog konfirmasi
              </Button>
            </div>
          </Card>

          <Modal
            open={projectModal}
            onClose={() => setProjectModal(false)}
            icon={<Briefcase />}
            title="Buat paket baru"
            size="lg"
            footer={
              <>
                <Button variant="secondary" onClick={() => setProjectModal(false)}>
                  Batal
                </Button>
                <Button
                  variant="accent"
                  onClick={() => {
                    setProjectModal(false);
                    toast.success('Paket dibuat', 'Draf paket tersimpan.');
                  }}
                >
                  Simpan paket
                </Button>
              </>
            }
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama paket" required>
                  <Input placeholder="Tryout Nasional #3" />
                </Field>
                <Field label="Subtes utama">
                  <SelectMenu options={SUBTES} value={subtes} onChange={setSubtes} />
                </Field>
              </div>
              <Field label="Unggah dokumen soal" description="Seret dokumen untuk mengisi paket otomatis.">
                <FileUpload accept=".csv,.xlsx,.pdf" maxSize={10} multiple />
              </Field>
              <Field label="Deskripsi" description="Ringkasan paket untuk peserta.">
                <Textarea rows={3} defaultValue="Paket tryout lengkap 110 soal (TWK, TIU, TKP) dengan durasi 100 menit." />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <DatePicker label="Dibuka" value={date} onChange={setDate} />
                <DatePicker label="Ditutup" value={date2} onChange={setDate2} min={date} placeholder="Belum diatur" />
              </div>
            </div>
          </Modal>

          <Modal
            open={reschedule}
            onClose={() => setReschedule(false)}
            title="Jadwalkan ulang tryout"
            icon={<CalendarDays />}
            size="sm"
            footer={
              <Button
                variant="accent"
                onClick={() => {
                  setReschedule(false);
                  toast.success('Jadwal diperbarui');
                }}
              >
                Jadwalkan
              </Button>
            }
          >
            <p className="mb-4 text-sm leading-relaxed text-mist-700">Pilih hari dan jam baru kapan tryout dibuka untuk peserta.</p>
            <div className="space-y-3">
              <DatePicker label="Tanggal" value={date} onChange={setDate} />
              <Input innerLabel="Jam" leftIcon={<Clock3 />} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </Modal>

          <Modal
            open={modal}
            onClose={() => setModal(false)}
            eyebrow="Detail peserta"
            title="Tope Aryasatya"
            description="PST-12345 · tope@mail.id · 0812 3456 7890"
            size="lg"
            footer={
              <>
                <Button variant="secondary" onClick={() => setModal(false)}>
                  Tutup
                </Button>
                <Button icon={<Download />}>Ekspor CSV</Button>
              </>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Tryout', '12', <Trophy key="i" />],
                ['Rata-rata', '428', <Target key="i" />],
                ['Terbaik', '486', <TrendingUp key="i" />],
                ['Pindah tab', '3', <Eye key="i" />],
              ].map(([l, v, ic]) => (
                <div key={l} className="rounded-2xl p-4 ring-1 ring-inset ring-mist-100">
                  <IconBox icon={ic} size="sm" />
                  <p className="mt-3 text-xs text-mist-700">{l}</p>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            <p className="mb-3 mt-6 text-sm font-medium text-obsidian-600">Riwayat</p>
            <TableContainer bordered>
              <Table className="min-w-[480px]">
                <THead>
                  <Tr>
                    <Th>Paket</Th>
                    <Th align="right">Skor</Th>
                    <Th>Status</Th>
                  </Tr>
                </THead>
                <TBody>
                  {ROWS.slice(0, 3).map((r) => (
                    <Tr key={r.id}>
                      <Td>{r.paket}</Td>
                      <Td align="right" className="font-semibold tabular-nums">
                        {r.score}
                      </Td>
                      <Td>
                        <Badge status={r.passed ? 'lulus' : 'gagal'} />
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
          </Modal>

          <ConfirmDialog
            open={confirm}
            onClose={() => setConfirm(false)}
            tone="danger"
            title="Hapus hasil tryout?"
            description="Data skor dan jawaban peserta pada percobaan ini akan dihapus permanen."
            onConfirm={() => new Promise((r) => setTimeout(r, 900)).then(() => toast.success('Hasil dihapus'))}
          />
        </Section>

        {/* CARD */}
        <Section id="card" title="Card" desc="Putih rounded-[20px] + garis 1px, tanpa shadow. Header: judul + ikon info + aksi secondary sm. StatCard gaya dashboard: kotak ikon, angka besar, pill delta mint, mini chart.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Peserta" info="Total peserta terdaftar" value="1.879" delta="+115" icon={<Users />} action={<Button variant="secondary" size="sm">Detail</Button>} chart={<Sparkline points={[3, 5, 4, 6, 5, 7, 6, 8, 7, 9]} />} caption="Naik 15% dalam 7 hari terakhir" />
            <StatCard label="Tryout dikerjakan" info="Percobaan selesai" value="955" delta="+215" icon={<CalendarCheck />} action={<Button variant="secondary" size="sm">Detail</Button>} chart={<MiniBars values={[6, 9, 5, 8, 10, 7, 9, 11, 6, 8, 10, 12, 9, 11]} />} caption="Naik 10% dari minggu lalu" />
            <StatCard label="Rata-rata skor" value="412,5" suffix="/550" icon={<Target />} tone="mint" trend={-3} info="Rata-rata skor total" />
            <StatCard label="Peserta online" value="56" icon={<Users />} variant="obsidian" trend={{ value: 8, label: 'vs kemarin' }} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Total waktu belajar"
                info="Akumulasi minggu ini"
                subtitle="11 jam 25 menit"
                action={
                  <Button variant="secondary" size="sm">
                    Detail
                  </Button>
                }
              />
              <LineChart data={LINE} defaultActive={4} formatY={(v) => `${v}j`} formatValue={(v) => `${v} jam`} series={[{ key: 'value', label: 'Minggu ini' }]} />
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader title="Aktivitas 14 hari" info="Tryout & pendaftar per hari" action={<ChartLegend items={[{ label: 'Tryout', color: '#3765F6' }, { label: 'Pendaftar', color: '#C3CED7' }]} />} />
              <BarChart
                data={BARS}
                series={[
                  { key: 'attempts', label: 'Tryout' },
                  { key: 'registrations', label: 'Pendaftar' },
                ]}
              />
            </Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="space-y-5">
              <CardHeader title="Progres subtes" icon={<ListChecks />} className="mb-0" />
              <ProgressBar label="TWK" value={115} max={150} showValue valueText="115/150" marker={65} />
              <ProgressBar label="TIU" value={70} max={175} showValue valueText="70/175" marker={80} color="danger" />
              <ProgressBar label="TKP" value={207} max={225} showValue valueText="207/225" marker={166} color="mint-dark" />
              <SegmentedProgress label="Target hari ini" total={4} value={2} />
            </Card>
            <Card>
              <CardHeader title="Rata-rata skor" info="Dari 550" />
              <Gauge value={412.5} max={550} label="dari 550" marker={311} />
            </Card>
            <div className="grid gap-4">
              <Card padding="sm">
                <Card variant="ghost" padding="sm">
                  <CardHeader title="Kartu ghost" subtitle="Permukaan sekunder di dalam panel putih." className="mb-0" />
                </Card>
              </Card>
              <Card variant="cobalt" padding="sm" interactive>
                <CardHeader title="Kartu cobalt (interactive)" subtitle="Hover untuk melihat garis." icon={<Sparkles />} iconVariant="tint" className="mb-0" />
              </Card>
              <Card variant="obsidian" padding="sm">
                <p className="text-[15px] font-semibold text-white">Kartu obsidian</p>
                <p className="mt-0.5 text-[13px] text-white/60">Untuk sorotan tunggal.</p>
              </Card>
            </div>
          </div>
        </Section>

        {/* TABEL */}
        <Section id="tabel" title="Tabel" desc="Dibungkus kartu; header abu uppercase kecil; baris h-14 dengan garis 1px; badge pill outline; aksi titik tiga.">
          <Card padding="none">
            <div className="p-5 pb-4 sm:p-6 sm:pb-4">
              <CardHeader title="Daftar peserta" info="Hasil tryout terbaru" className="mb-4" />
              <FilterBar
                search={<SearchInput size="sm" placeholder="Cari peserta…" value={q} onChange={setQ} />}
                filters={<SegmentedControl size="sm" value={tab} onChange={setTab} options={[{ value: 'semua', label: 'Semua' }, { value: 'lulus', label: 'Lulus' }, { value: 'gagal', label: 'Gagal' }]} ariaLabel="Filter status" />}
                actions={
                  <>
                    <Button variant="secondary" size="sm" icon={<SlidersHorizontal />}>
                      Filter
                    </Button>
                    <Button size="sm" icon={<Download />}>
                      Ekspor CSV
                    </Button>
                  </>
                }
              />
            </div>
            <div className="px-5 sm:px-6">
              <TableContainer bordered maxHeight={420}>
                <Table>
                  <THead>
                    <Tr>
                      <Th>Peserta</Th>
                      <Th>Paket</Th>
                      <Th align="right" sort={sort} onSort={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}>
                        Skor
                      </Th>
                      <Th>Durasi</Th>
                      <Th>Status</Th>
                      <Th>Tanggal</Th>
                      <Th align="right" width={56}>
                        <span className="sr-only">Aksi</span>
                      </Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {[...ROWS]
                      .filter((r) => (tab === 'lulus' ? r.passed : tab === 'gagal' ? r.passed === false : true))
                      .filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()))
                      .sort((a, b) => (sort === 'asc' ? 1 : -1) * ((a.score ?? -1) - (b.score ?? -1)))
                      .map((r) => (
                        <Tr key={r.id}>
                          <Td>
                            <div className="flex items-center gap-3">
                              <Avatar name={r.name} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-medium">{r.name}</p>
                                <p className="truncate text-xs text-mist-700">{r.email}</p>
                              </div>
                            </div>
                          </Td>
                          <Td muted>{r.paket}</Td>
                          <Td align="right" className="font-semibold tabular-nums">
                            {r.score ?? '—'}
                          </Td>
                          <Td>{r.dur ? <span className="rounded-md bg-ghost px-2 py-1 text-xs font-medium tabular-nums">{formatDurasi(r.dur)}</span> : <span className="text-mist-500">—</span>}</Td>
                          <Td>
                            <Badge status={r.passed == null ? 'berlangsung' : r.passed ? 'lulus' : 'gagal'} />
                          </Td>
                          <Td muted nowrap>
                            {formatTanggal(r.at)}
                          </Td>
                          <Td align="right">
                            <Menu
                              items={[
                                { label: 'Lihat hasil', icon: <Eye /> },
                                { label: 'Unduh CSV', icon: <Download /> },
                                { divider: true },
                                { label: 'Hapus', icon: <Trash2 />, danger: true, onClick: () => setConfirm(true) },
                              ]}
                            />
                          </Td>
                        </Tr>
                      ))}
                  </TBody>
                </Table>
              </TableContainer>
            </div>
            <div className="p-5 sm:p-6">
              <Pagination page={page} totalPages={5} total={42} perPage={10} onChange={setPage} showJump />
            </div>
          </Card>
        </Section>

        {/* FILTER */}
        <Section id="filter" title="Filter" desc="FilterBar: search kiri (opsional ⌘K), segmented control, tombol Filter; aksi di kanan. Tabs pill / soft / underline.">
          <Card padding="lg" className="space-y-8">
            <FilterBar
              search={<SearchInput placeholder="Cari soal, kategori…" kbd="⌘K" />}
              filters={<SegmentedControl value={seg} onChange={setSeg} options={[{ value: 'semua', label: 'Semua' }, { value: 'pribadi', label: 'Pribadi', icon: <Lock /> }, { value: 'dibagikan', label: 'Dibagikan', icon: <Share2 /> }]} ariaLabel="Kepemilikan" />}
              actions={
                <>
                  <Button variant="secondary" icon={<SlidersHorizontal />}>
                    Filter
                  </Button>
                  <Button variant="accent" icon={<Plus />}>
                    Tambah
                  </Button>
                </>
              }
            />
            <Row label="Search">
              <SearchInput placeholder="Cari (tekan /)…" shortcut className="max-w-xs" />
              <SearchInput placeholder="Cari peserta…" shape="pill" size="sm" className="max-w-xs" />
            </Row>
            <Row label="Tabs pill">
              <Tabs
                value={tab}
                onChange={setTab}
                items={[
                  { value: 'semua', label: 'Semua', count: 42 },
                  { value: 'lulus', label: 'Lulus', count: 28 },
                  { value: 'gagal', label: 'Gagal', count: 14 },
                ]}
              />
            </Row>
            <Row label="Tabs soft / underline">
              <Tabs
                variant="soft"
                size="sm"
                items={[
                  { value: 'a', label: 'Hari', icon: <Clock3 /> },
                  { value: 'b', label: 'Minggu' },
                  { value: 'c', label: 'Bulan' },
                ]}
              />
              <Tabs
                variant="underline"
                items={[
                  { value: 'a', label: 'Ringkasan' },
                  { value: 'b', label: 'Ranking' },
                  { value: 'c', label: 'Analisis butir' },
                ]}
              />
            </Row>
            <Row label="Chip filter">
              {['semua', 'twk', 'tiu', 'tkp'].map((v) => (
                <Chip key={v} onClick={() => setTab(v)} selected={tab === v} color="white">
                  {v === 'semua' ? 'Semua' : v.toUpperCase()}
                </Chip>
              ))}
            </Row>
          </Card>
        </Section>

        {/* PAGINATION */}
        <Section id="pagination" title="Pagination" desc="Ringkasan di kiri; tombol angka kotak h-8 bergaris, aktif cobalt; « ‹ › »; opsional “Ke halaman”.">
          <Card padding="lg" className="space-y-6">
            <Pagination page={page2} totalPages={30} total={235} perPage={8} onChange={setPage2} showJump />
            <div className="h-px bg-mist-100" />
            <Pagination page={page} totalPages={5} onChange={setPage} showEdges={false} />
            <div className="h-px bg-mist-100" />
            <Pagination meta={{ page: 1, per_page: 10, total: 9, total_pages: 1 }} onChange={() => {}} />
          </Card>
        </Section>

        {/* BADGE & CHIP */}
        <Section id="badge" title="Badge & chip" desc="Badge status = pill outline-tint tipis; chip metadata ber-tint dengan ikon.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card padding="lg">
              <CardHeader title="Badge status" subtitle="status=… (label default Bahasa Indonesia)" />
              <div className="flex flex-wrap gap-2">
                {['lulus', 'berlangsung', 'menunggu', 'gagal', 'draft', 'terbit', 'arsip', 'aktif', 'diblokir', 'tersedia', 'belum_dibuka', 'ditutup', 'benar', 'salah', 'kosong', 'mudah', 'sedang', 'sulit'].map((s) => (
                  <Badge key={s} status={s} />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge status="lulus" variant="soft" />
                <Badge status="menunggu" variant="soft" />
                <Badge status="gagal" size="sm" />
                <Badge tone="cobalt" dot={false}>
                  Tanpa titik
                </Badge>
              </div>
            </Card>
            <Card padding="lg">
              <CardHeader title="Chip" subtitle="color · size · shape · mono · icon" />
              <div className="flex flex-wrap gap-2">
                <Chip color="cobalt" icon={<CalendarDays />} size="lg" shape="soft" mono>
                  12 — 18 Okt
                </Chip>
                <Chip color="warning" icon={<Clock3 />} size="lg" shape="soft" mono>
                  100 menit
                </Chip>
                <Chip color="mint" icon={<FileText />} size="lg" shape="soft">
                  110 soal
                </Chip>
                <Chip color="danger" icon={<Users />} size="lg" shape="soft">
                  48 peserta
                </Chip>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip color="cobalt" mono>
                  TWK
                </Chip>
                <Chip color="warning" mono>
                  TIU
                </Chip>
                <Chip color="mint" mono>
                  TKP
                </Chip>
                <Chip color="mist">Mist</Chip>
                <Chip color="obsidian">Obsidian</Chip>
                <Chip color="white">White</Chip>
                <Chip size="sm" color="cobalt">
                  Small
                </Chip>
              </div>
            </Card>
          </div>
        </Section>

        {/* STATUS */}
        <Section id="status" title="Kosong, error, memuat & toast" desc="Pola state standar untuk setiap halaman yang mengambil data. Toast melayang dengan shadow-float.">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card padding="none">
              <EmptyState
                icon={<Inbox />}
                title="Belum ada tryout"
                description="Paket tryout akan muncul di sini setelah dibuka admin."
                action={
                  <Button size="sm" icon={<Plus />}>
                    Buat paket
                  </Button>
                }
                secondaryAction={
                  <Button size="sm" variant="ghost">
                    Lihat template
                  </Button>
                }
              />
            </Card>
            <Card padding="none">
              <ErrorState error="Tidak dapat terhubung ke server. Periksa koneksi Anda." onRetry={() => toast.info('Mencoba lagi…')} />
            </Card>
            <Card padding="lg" className="space-y-5">
              <div className="flex items-center gap-3">
                <Spinner size="sm" />
                <Spinner tone="cobalt" />
                <Spinner size="lg" tone="cobalt" />
                <span className="ml-auto flex items-center gap-1">
                  <AvatarGroup names={['Andi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita']} />
                </span>
              </div>
              <Skeleton className="h-6 w-1/2" />
              <SkeletonText lines={3} />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10" rounded="rounded-xl" />
                <Skeleton className="h-10 flex-1" rounded="rounded-xl" />
              </div>
            </Card>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <EmptyState variant="dashed" size="sm" title="Tidak ada hasil" description="Coba ubah kata kunci pencarian." icon={<Search />} />
          </div>
          <Card padding="lg" className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => toast.success('Soal tersimpan', 'Perubahan berhasil disimpan.')}>
                Toast sukses
              </Button>
              <Button variant="secondary" onClick={() => toast.error('Gagal menyimpan', 'Periksa kembali isian Anda.')}>
                Toast error
              </Button>
              <Button variant="secondary" onClick={() => toast.warning('Waktu hampir habis', 'Sisa 5 menit.')}>
                Toast peringatan
              </Button>
              <Button variant="secondary" onClick={() => toast.info('Info', 'Pengumuman baru tersedia.')}>
                Toast info
              </Button>
            </div>
          </Card>
        </Section>

        {/* FONDASI */}
        <Section id="fondasi" title="Warna & tipografi" desc="Komposisi ±80% netral, 15% cobalt, 5% mint. Inter untuk UI, JetBrains Mono untuk timer & kode.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COLORS.map((c) => (
              <Card key={c.name} padding="none" className="overflow-hidden">
                <div className={cn('flex h-24', !c.split && c.cls)}>
                  {c.split && (
                    <>
                      <span className={cn('flex-1', c.cls)} />
                      <span className={cn('flex-1', c.split)} />
                    </>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold">{c.name}</p>
                    <p className="font-mono text-xs text-mist-700">{c.hex}</p>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-cobalt">{c.token}</p>
                  <p className="mt-2 text-sm text-mist-700">{c.note}</p>
                  {c.shades.length > 0 && (
                    <div className="mt-4 flex gap-1.5">
                      {c.shades.map(([n, cls]) => (
                        <div key={n} className="flex-1">
                          <div className={cn('h-8 rounded-lg ring-1 ring-inset ring-black/5', cls)} />
                          <p className="mt-1 text-center font-mono text-[10px] text-mist-700">{n}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Card padding="lg" className="mt-4 space-y-6">
            {[
              ['Judul halaman · 28/600', 'text-[28px] font-semibold tracking-[-0.02em]', 'Dashboard peserta'],
              ['Judul kartu · 15/600', 'text-[15px] font-semibold', 'Jadwal tryout terdekat'],
              ['Body · 15/400', 'text-[15px] text-obsidian-600', 'Kerjakan 110 soal dalam 100 menit. Jawaban tersimpan otomatis.'],
              ['Deskripsi · 14/400', 'text-sm text-mist-700', 'Kelola paket, soal, dan peserta dari satu tempat.'],
              ['Label field · 14/500', 'text-sm font-medium', 'Nama lengkap'],
              ['Statistik · 32/600 tabular', 'text-[32px] font-semibold tracking-[-0.03em] tabular-nums', '412,5'],
              ['Mono · timer', 'font-mono text-3xl font-semibold tabular-nums', '01:39:58'],
            ].map(([label, cls, sample]) => (
              <div key={label} className="grid items-baseline gap-2 border-b border-mist-100 pb-6 last:border-0 last:pb-0 md:grid-cols-[220px_1fr]">
                <p className="eyebrow">{label}</p>
                <p className={cls}>{sample}</p>
              </div>
            ))}
          </Card>
        </Section>
      </div>
    </div>
  );
}

function Section({ id, title, desc, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {desc && <p className="mt-1 max-w-3xl text-sm text-mist-700">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
      <p className="eyebrow">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
