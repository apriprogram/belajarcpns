/** Utilitas profil: umur & tempat/tanggal lahir dari string "YYYY-MM-DD" (tanpa geser zona waktu). */

function parseYMD(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? { y: +m[1], mo: +m[2], d: +m[3] } : null;
}

/** Umur dalam tahun penuh, atau null. */
export function hitungUmur(birthDate, now = new Date()) {
  const b = parseYMD(birthDate);
  if (!b) return null;
  let age = now.getFullYear() - b.y;
  const m = now.getMonth() + 1;
  if (m < b.mo || (m === b.mo && now.getDate() < b.d)) age -= 1;
  return age >= 0 ? age : null;
}

/** "12 Mei 2000" */
export function formatTanggalLahir(birthDate) {
  const b = parseYMD(birthDate);
  if (!b) return null;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(b.y, b.mo - 1, b.d));
}

/** "Jakarta, 12 Mei 2000" (bagian yang kosong dilewati) atau "—". */
export function formatTTL(place, birthDate) {
  const parts = [place?.trim(), formatTanggalLahir(birthDate)].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

/** "25 tahun" atau "—". */
export function formatUmur(birthDate) {
  const a = hitungUmur(birthDate);
  return a == null ? '—' : `${a} tahun`;
}

/** Batas input tanggal lahir: maks hari ini, min 1940-01-01. */
export function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
