/**
 * Utilitas editor "Atur Website": akses/ubah path secara imutabel, validasi, dan peta grup.
 * Path = array kunci, mis. ['hero', 'modes', 0, 'href'] → string error "hero.modes.0.href".
 */

export const pathKey = (path) => path.join('.');

export function getIn(obj, path, fallback) {
  let cur = obj;
  for (const k of path) {
    if (cur == null) return fallback;
    cur = cur[k];
  }
  return cur === undefined ? fallback : cur;
}

/** Salin-ubah: kembalikan objek baru dengan nilai di `path` diganti. */
export function setIn(obj, path, value) {
  if (!path.length) return value;
  const [head, ...rest] = path;
  const base = obj == null ? (typeof head === 'number' ? [] : {}) : obj;
  const next = Array.isArray(base) ? base.slice() : { ...base };
  next[head] = setIn(base[head], rest, value);
  return next;
}

export function moveItem(list, from, to) {
  if (!Array.isArray(list) || to < 0 || to >= list.length) return list;
  const next = list.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

/** URL tautan valid: diawali "/", "#", "http://" atau "https://". */
export const isLinkUrl = (v) => typeof v === 'string' && /^(\/|#|https?:\/\/)/i.test(v.trim());

export const URL_HINT = 'Harus diawali "/", "#", atau http(s)://';

/** URL absolut http(s) dengan host, mis. https://belajarcpns.web.id */
export const isAbsoluteUrl = (v) => {
  if (typeof v !== 'string' || !/^https?:\/\//i.test(v.trim())) return false;
  try {
    return new URL(v.trim()).hostname.includes('.');
  } catch {
    return false;
  }
};

export const ABS_URL_HINT = 'Harus URL lengkap, mis. https://belajarcpns.web.id';

/** Grup tab editor → kunci top-level skema site. */
export const GROUPS = [
  { id: 'branding', label: 'Branding', keys: ['brand'] },
  { id: 'seo', label: 'SEO', keys: ['seo'] },
  { id: 'navbar', label: 'Navbar', keys: ['navbar'] },
  { id: 'sections', label: 'Section', keys: ['sections'] },
  { id: 'hero', label: 'Hero', keys: ['hero'] },
  { id: 'fitur', label: 'Fitur', keys: ['features'] },
  { id: 'skd', label: 'SKD', keys: ['skd'] },
  { id: 'langkah', label: 'Cara mulai', keys: ['steps'] },
  { id: 'faq', label: 'FAQ', keys: ['faq'] },
  { id: 'kontak', label: 'Kontak', keys: ['kontak'] },
  { id: 'cta', label: 'CTA', keys: ['cta'] },
  { id: 'footer', label: 'Footer', keys: ['footer'] },
  { id: 'auth', label: 'Halaman login', keys: ['auth'] },
];

export function groupOfPath(key) {
  const top = String(key).split('.')[0];
  const g = GROUPS.find((x) => x.keys.includes(top));
  return g ? g.id : null;
}

/** Validasi draft → { "path.str": "pesan" }. Kosong = valid. */
export function validateSite(site) {
  const errors = {};
  const name = (getIn(site, ['brand', 'name'], '') || '').trim();
  if (!name) errors['brand.name'] = 'Nama website wajib diisi.';
  else if (name.length > 40) errors['brand.name'] = 'Maksimal 40 karakter.';

  const link = (path, { required = true } = {}) => {
    const v = getIn(site, path, '');
    const s = typeof v === 'string' ? v.trim() : '';
    if (!s) {
      if (required) errors[pathKey(path)] = 'Tautan wajib diisi.';
      return;
    }
    if (!isLinkUrl(s)) errors[pathKey(path)] = URL_HINT;
  };

  (getIn(site, ['hero', 'modes'], []) || []).forEach((_, i) => link(['hero', 'modes', i, 'href']));
  link(['steps', 'tryout', 'href']);
  link(['cta', 'primary_href']);
  link(['cta', 'secondary_href']);
  (getIn(site, ['footer', 'columns'], []) || []).forEach((col, i) =>
    ((col && col.links) || []).forEach((_, j) => link(['footer', 'columns', i, 'links', j, 'href'])),
  );

  // Media (opsional) — URL unggahan atau manual.
  const media = [
    ['brand', 'logo_url'],
    ['hero', 'video_url'],
    ['hero', 'poster_url'],
    ['hero', 'mascot', 'image_url'],
    ['features', 'hero', 'image'],
    ['steps', 'daftar', 'image'],
  ];
  (getIn(site, ['features', 'items'], []) || []).forEach((_, i) => media.push(['features', 'items', i, 'image']));
  (getIn(site, ['steps', 'hasil', 'images'], []) || []).forEach((_, i) => media.push(['steps', 'hasil', 'images', i]));
  (getIn(site, ['auth', 'slides'], []) || []).forEach((_, i) => {
    media.push(['auth', 'slides', i, 'image'], ['auth', 'slides', i, 'video'], ['auth', 'slides', i, 'poster']);
  });
  media.forEach((p) => link(p, { required: false }));

  // SEO (docs/SEO.md): URL website & profil sameAs wajib URL lengkap http(s).
  const siteUrl = String(getIn(site, ['seo', 'site_url'], '') || '').trim();
  if (siteUrl && !isAbsoluteUrl(siteUrl)) errors['seo.site_url'] = ABS_URL_HINT;
  link(['seo', 'og_image'], { required: false });
  (getIn(site, ['seo', 'same_as'], []) || []).forEach((v, i) => {
    const s = String(v || '').trim();
    if (s && !isAbsoluteUrl(s)) errors[`seo.same_as.${i}`] = ABS_URL_HINT;
  });
  return errors;
}

/** Hitung error per grup. */
export function errorCountByGroup(errors) {
  const out = {};
  Object.keys(errors).forEach((k) => {
    const g = groupOfPath(k);
    if (g) out[g] = (out[g] || 0) + 1;
  });
  return out;
}

/** Cek apakah suatu grup berubah dibanding versi tersimpan. */
export function groupDirty(group, draft, saved) {
  return group.keys.some((k) => JSON.stringify(draft?.[k] ?? null) !== JSON.stringify(saved?.[k] ?? null));
}
