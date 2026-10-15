// Uji beban BISA-PNS: 500 peserta serentak login → mulai tryout → simpan 20 jawaban → submit.
//
// Jalankan (lihat README.md di folder ini untuk menyiapkan akun loadtest):
//   k6 run tests/load/k6-submit.js
//   k6 run -e BASE_URL=http://localhost:8080 -e VUS=500 -e PACKAGE_ID=<uuid> tests/load/k6-submit.js
//
// Env:
//   BASE_URL     default http://localhost:8080 (langsung ke API; boleh juga http://localhost:3000)
//   VUS          default 500 (jumlah peserta virtual; akun loadtest1..loadtestN)
//   PACKAGE_ID   opsional; jika kosong dipakai paket pertama yang "tersedia"
//   ANSWERS      default 20 (jumlah jawaban yang disimpan sebelum submit)
//   PASSWORD     default Peserta123!
//   THINK_MIN/THINK_MAX  jeda antar-jawaban dalam detik (default 1..3)
//   START_SPREAD jendela acak (detik) sebelum login, meniru peserta yang masuk bertahap (default 30)
import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const VUS = parseInt(__ENV.VUS || '500', 10);
const ANSWERS = parseInt(__ENV.ANSWERS || '20', 10);
const PASSWORD = __ENV.PASSWORD || 'Peserta123!';
const THINK_MIN = parseFloat(__ENV.THINK_MIN || '1');
const THINK_MAX = parseFloat(__ENV.THINK_MAX || '3');
const START_SPREAD = parseFloat(__ENV.START_SPREAD || '30');

const submitDuration = new Trend('bisa_submit_duration', true);
const answerDuration = new Trend('bisa_answer_duration', true);
const submitted = new Counter('bisa_attempts_submitted');

export const options = {
  scenarios: {
    submit_serentak: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: 1,
      maxDuration: '15m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    bisa_submit_duration: ['p(95)<800'],
    bisa_answer_duration: ['p(95)<800'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };

function post(path, body, name) {
  return http.post(`${BASE_URL}${path}`, body ? JSON.stringify(body) : null, {
    ...JSON_HEADERS,
    tags: { name: name || path },
  });
}

function data(res) {
  try {
    return res.json('data');
  } catch (_) {
    return null;
  }
}

// Ambil satu kali di awal: cari paket tersedia memakai akun loadtest1.
export function setup() {
  if (__ENV.PACKAGE_ID) return { packageId: __ENV.PACKAGE_ID };
  const login = post('/api/auth/login', { email: 'loadtest1@bisapns.id', password: PASSWORD }, 'setup_login');
  if (login.status !== 200) fail(`setup: login loadtest1 gagal (${login.status}) — sudah buat akun loadtest?`);
  const res = http.get(`${BASE_URL}/api/packages`, { tags: { name: 'setup_packages' } });
  const pkgs = data(res) || [];
  const pkg = pkgs.find((p) => p.availability === 'tersedia') || pkgs[0];
  if (!pkg) fail('setup: tidak ada paket tryout terbit. Terbitkan paket atau set -e PACKAGE_ID=...');
  console.log(`Paket uji: ${pkg.title} (${pkg.id}), ${pkg.question_count} soal`);
  return { packageId: pkg.id };
}

export default function ({ packageId }) {
  const email = `loadtest${__VU}@bisapns.id`;
  sleep(Math.random() * START_SPREAD);

  // 1) Login (cookie access_token/refresh_token disimpan otomatis oleh cookie jar per-VU)
  const login = post('/api/auth/login', { email, password: PASSWORD }, 'login');
  if (!check(login, { 'login 200': (r) => r.status === 200 })) return;

  // 2) Mulai / lanjutkan attempt
  const start = post('/api/attempts', { package_id: packageId }, 'attempt_start');
  if (!check(start, { 'start attempt 200/201': (r) => r.status === 200 || r.status === 201 })) return;
  const attemptId = (data(start) || {}).attempt_id;
  if (!attemptId) return;

  // 3) Ambil soal
  const detail = http.get(`${BASE_URL}/api/attempts/${attemptId}`, { tags: { name: 'attempt_get' } });
  if (!check(detail, { 'get attempt 200': (r) => r.status === 200 })) return;
  const questions = (data(detail) || {}).questions || [];
  check(questions, { 'soal tersedia': (q) => q.length > 0 });

  // 4) Simpan N jawaban (opsi acak)
  const n = Math.min(ANSWERS, questions.length);
  for (let i = 0; i < n; i++) {
    const q = questions[i];
    const opt = q.options[Math.floor(Math.random() * q.options.length)];
    const res = http.put(
      `${BASE_URL}/api/attempts/${attemptId}/answers`,
      JSON.stringify({ question_id: q.id, option_id: opt.id, is_flagged: Math.random() < 0.1 }),
      { ...JSON_HEADERS, tags: { name: 'answer_save' } },
    );
    answerDuration.add(res.timings.duration);
    check(res, { 'simpan jawaban 200': (r) => r.status === 200 });
    sleep(THINK_MIN + Math.random() * (THINK_MAX - THINK_MIN));
  }

  // 5) Submit
  const sub = post(`/api/attempts/${attemptId}/submit`, null, 'attempt_submit');
  submitDuration.add(sub.timings.duration);
  if (check(sub, { 'submit 200': (r) => r.status === 200 })) submitted.add(1);
}
