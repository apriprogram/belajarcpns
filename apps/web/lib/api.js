/**
 * Fetch wrapper untuk API BISA-PNS.
 * - Selalu `credentials: 'include'` (cookie httpOnly access/refresh token).
 * - Jika 401 → panggil POST /api/auth/refresh SEKALI lalu ulangi request.
 *   Jika refresh gagal → event `bisapns:unauthorized` dipancarkan (AuthProvider
 *   menangani redirect ke /login) dan ApiError 401 dilempar.
 * - Respons standar: { success, data, error:{code,message,fields}, meta }.
 *   `api.get()` dkk mengembalikan `data`; pakai `{ raw: true }` untuk mendapat
 *   seluruh envelope (mis. butuh `meta` pagination) → `api.list()` adalah pintasannya.
 */

export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message = 'Terjadi kesalahan', fields = null, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields || null;
    this.data = data;
  }
}

const BASE = '/api';
let refreshPromise = null;

function buildUrl(path, query) {
  let url = path.startsWith('http') || path.startsWith('/api') ? path : `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  if (query && typeof query === 'object') {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) v.forEach((item) => qs.append(k, item));
      else qs.append(k, String(v));
    }
    const s = qs.toString();
    if (s) url += (url.includes('?') ? '&' : '?') + s;
  }
  return url;
}

async function parseBody(res) {
  const type = res.headers.get('content-type') || '';
  if (res.status === 204) return null;
  if (type.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  const text = await res.text().catch(() => '');
  return text ? { _text: text } : null;
}

function toError(res, body) {
  const err = body && body.error ? body.error : null;
  const fallback = {
    0: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
    401: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    403: 'Anda tidak memiliki akses.',
    404: 'Data tidak ditemukan.',
    429: 'Terlalu banyak permintaan. Coba lagi sebentar.',
    500: 'Terjadi kesalahan pada server.',
  };
  return new ApiError({
    status: res ? res.status : 0,
    code: (err && err.code) || (res ? `HTTP_${res.status}` : 'NETWORK_ERROR'),
    message: (err && err.message) || fallback[res ? res.status : 0] || fallback[500],
    fields: err && err.fields,
    data: body && 'data' in body ? body.data : null,
  });
}

/** Refresh token (dibagikan bila beberapa request 401 bersamaan). */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null;
        const body = await parseBody(res);
        return body && body.data ? body.data : true;
      })
      .catch(() => null)
      .finally(() => {
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      });
  }
  return refreshPromise;
}

const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password', '/auth/reset-password'];

async function request(method, path, { body, query, headers, raw = false, signal, retry = true, isForm = false } = {}) {
  const url = buildUrl(path, query);
  const init = {
    method,
    credentials: 'include',
    headers: { Accept: 'application/json', ...(headers || {}) },
    signal,
  };
  if (body !== undefined && body !== null) {
    if (isForm || (typeof FormData !== 'undefined' && body instanceof FormData)) {
      init.body = body; // browser mengatur boundary multipart
    } else {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    if (e && e.name === 'AbortError') throw e;
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.' });
  }

  if (res.status === 401 && retry && !NO_REFRESH.some((p) => url.includes(p))) {
    const ok = await refreshSession();
    if (ok) return request(method, path, { body, query, headers, raw, signal, retry: false, isForm });
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('bisapns:unauthorized'));
  }

  const parsed = await parseBody(res);
  if (!res.ok || (parsed && parsed.success === false)) throw toError(res, parsed);
  if (raw) return parsed;
  if (parsed && typeof parsed === 'object' && 'data' in parsed) return parsed.data;
  return parsed;
}

async function download(path, filename, { query } = {}) {
  const url = buildUrl(path, query);
  const doFetch = () => fetch(url, { credentials: 'include' });
  let res = await doFetch().catch(() => null);
  if (res && res.status === 401 && (await refreshSession())) res = await doFetch().catch(() => null);
  if (!res) throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Tidak dapat terhubung ke server.' });
  if (!res.ok) throw toError(res, await parseBody(res));
  const blob = await res.blob();
  let name = filename;
  if (!name) {
    const cd = res.headers.get('content-disposition') || '';
    const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
    name = m ? decodeURIComponent(m[1]) : 'unduhan';
  }
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
  return name;
}

export const api = {
  /** GET → data */
  get: (path, opts = {}) => request('GET', path, opts),
  /** GET → { data, meta } (untuk daftar berpaginasi) */
  list: async (path, opts = {}) => {
    const r = await request('GET', path, { ...opts, raw: true });
    return { data: (r && r.data) || [], meta: (r && r.meta) || null };
  },
  post: (path, body, opts = {}) => request('POST', path, { ...opts, body }),
  put: (path, body, opts = {}) => request('PUT', path, { ...opts, body }),
  patch: (path, body, opts = {}) => request('PATCH', path, { ...opts, body }),
  del: (path, opts = {}) => request('DELETE', path, opts),
  /** Unggah multipart. formData: FormData */
  upload: (path, formData, opts = {}) => request('POST', path, { ...opts, body: formData, isForm: true }),
  /** Unduh file (CSV dsb.) dengan cookie → memicu simpan file di browser. */
  download,
};

/** Pesan ramah dari error apa pun. */
export function errorMessage(err, fallback = 'Terjadi kesalahan. Coba lagi.') {
  if (!err) return fallback;
  if (err instanceof ApiError) return err.message || fallback;
  return err.message || fallback;
}

export default api;
