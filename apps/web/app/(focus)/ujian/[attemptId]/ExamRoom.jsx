'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eraser, Flag, LayoutGrid, Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api, ApiError, errorMessage } from '@/lib/api';
import { LogoMark } from '@/components/layout/Logo';
import { Button, Chip, ConfirmDialog, ErrorState, Modal, ProgressBar, Skeleton, Spinner, SUBTEST_COLOR, useToast } from '@/components/ui';

/* Permukaan datar (Style UI v2): putih + garis 1px, tanpa shadow. */
const SURFACE = 'rounded-[20px] bg-white ring-1 ring-inset ring-mist-100';
import { OptionButton } from '@/components/peserta/OptionButton';
import { useHeartbeat } from '@/components/peserta/hooks';
import { SUBTEST_NAME } from '@/components/peserta/constants';
import { NavGrid, SaveIndicator, statusOf, TimerPill, WARN_SECONDS } from './ExamParts';

const RESYNC_MS = 30_000;
const EVENT_THROTTLE_MS = 3_000;
const FINISH_CODES = ['TIME_UP', 'ATTEMPT_FINISHED'];

/* ---- penyimpanan lokal (aman bila storage diblokir) ---- */
const lsKey = (id) => `bisapns:ujian:${id}:pending`;
const posKey = (id) => `bisapns:ujian:${id}:pos`;
const warnKey = (id) => `bisapns:ujian:${id}:warned`;
function readJSON(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(storage, key, value) {
  try {
    if (value == null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
  } catch {
    /* abaikan */
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isFinishErr = (err) => err instanceof ApiError && FINISH_CODES.includes(err.code);

/**
 * Ruang ujian CBT.
 * - Sisa waktu = remaining_seconds server + jam monotonic (performance.now), sinkron ulang tiap 30 dtk.
 * - Jawaban disimpan optimis lewat antrean (latest-wins per soal) dengan retry backoff;
 *   antrean juga dicerminkan ke localStorage sehingga tidak hilang saat refresh/koneksi putus.
 */
export function ExamRoom({ attemptId: id }) {
  const router = useRouter();
  const toast = useToast();

  const [phase, setPhase] = useState('loading'); // loading | error | ready | finishing
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [finishReason, setFinishReason] = useState('manual');
  const [tabSwitches, setTabSwitches] = useState(null);

  const answersRef = useRef({});
  const endAtRef = useRef(null);
  const queueRef = useRef(new Map());
  const processingRef = useRef(false);
  const retryTimerRef = useRef(null);
  const retryDelayRef = useRef(1000);
  const finishedRef = useRef(false);
  const finishingRef = useRef(false);
  const lastEventRef = useRef(0);
  const warnAfterReturnRef = useRef(false);

  useHeartbeat(phase === 'ready');

  const questions = useMemo(() => attempt?.questions || [], [attempt]);
  const q = questions[idx];

  /* ------------------------------ util ------------------------------ */
  const persistQueue = useCallback(() => {
    if (typeof window === 'undefined') return;
    const obj = Object.fromEntries(queueRef.current);
    writeJSON(window.localStorage, lsKey(id), Object.keys(obj).length ? obj : null);
  }, [id]);

  const goResult = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    queueRef.current.clear();
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    try {
      window.localStorage.removeItem(lsKey(id));
      window.sessionStorage.removeItem(posKey(id));
      window.sessionStorage.removeItem(warnKey(id));
    } catch {
      /* abaikan */
    }
    router.replace(`/hasil/${id}`);
  }, [id, router]);

  /** Set ulang titik akhir timer bila selisih > toleransi (hindari timer "melompat"). */
  const syncEnd = useCallback((remainingSeconds, at = performance.now(), tolerance = 1500) => {
    const next = at + Math.max(0, Number(remainingSeconds) || 0) * 1000;
    if (endAtRef.current == null || Math.abs(next - endAtRef.current) > tolerance) endAtRef.current = next;
  }, []);

  /* --------------------------- antrean simpan --------------------------- */
  const processQueue = useCallback(async () => {
    if (processingRef.current || finishedRef.current) return;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    processingRef.current = true;
    try {
      while (queueRef.current.size && !finishedRef.current) {
        const [qid, payload] = queueRef.current.entries().next().value;
        setSaveState('saving');
        try {
          const r = await api.put(`/attempts/${id}/answers`, payload);
          if (queueRef.current.get(qid) === payload) queueRef.current.delete(qid);
          persistQueue();
          retryDelayRef.current = 1000;
          if (r && r.remaining_seconds != null) syncEnd(r.remaining_seconds, performance.now(), 2500);
        } catch (err) {
          if (isFinishErr(err)) {
            toast.info('Ujian telah berakhir', err.code === 'TIME_UP' ? 'Waktu habis — jawaban Anda sudah dikumpulkan otomatis.' : 'Ujian ini sudah diselesaikan.');
            goResult();
            return;
          }
          if (err instanceof ApiError && [400, 404, 422].includes(err.status)) {
            queueRef.current.delete(qid);
            persistQueue();
            toast.error('Jawaban tidak dapat disimpan', errorMessage(err));
            continue;
          }
          // jaringan / 5xx / 429 → coba lagi dengan backoff
          setSaveState('error');
          const delay = retryDelayRef.current;
          retryDelayRef.current = Math.min(15000, delay * 2);
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            processQueue();
          }, delay);
          return;
        }
      }
      if (!finishedRef.current) setSaveState('saved');
    } finally {
      processingRef.current = false;
    }
  }, [id, persistQueue, syncEnd, goResult, toast]);

  const updateAnswer = useCallback(
    (qid, patch) => {
      if (finishingRef.current || finishedRef.current) return;
      const cur = answersRef.current[qid] || { option_id: null, is_flagged: false };
      const next = { ...cur, ...patch };
      answersRef.current = { ...answersRef.current, [qid]: next };
      setAnswers(answersRef.current);
      queueRef.current.delete(qid); // pindah ke ujung antrean (latest-wins)
      queueRef.current.set(qid, { question_id: qid, option_id: next.option_id || null, is_flagged: !!next.is_flagged });
      persistQueue();
      processQueue();
    },
    [persistQueue, processQueue],
  );

  /** Tunggu antrean kosong (maks timeoutMs). */
  const flushQueue = useCallback(
    async (timeoutMs = 8000) => {
      const deadline = Date.now() + timeoutMs;
      while (queueRef.current.size && !finishedRef.current && Date.now() < deadline) {
        if (!processingRef.current) processQueue();
        await sleep(300);
      }
      return queueRef.current.size === 0;
    },
    [processQueue],
  );

  /* ----------------------------- selesai ----------------------------- */
  const finish = useCallback(
    async ({ auto = false } = {}) => {
      if (finishingRef.current || finishedRef.current) return false;
      finishingRef.current = true;
      setFinishReason(auto ? 'timeup' : 'manual');
      setConfirmOpen(false);
      setNavOpen(false);
      setPhase('finishing');
      const flushed = await flushQueue(auto ? 6000 : 10000);
      if (finishedRef.current) return true;
      if (!flushed && !auto) {
        toast.error('Masih ada jawaban yang belum tersimpan', 'Periksa koneksi Anda lalu coba selesaikan lagi.');
        finishingRef.current = false;
        setPhase('ready');
        return false;
      }
      for (let i = 0; i < (auto ? 4 : 1); i++) {
        try {
          await api.post(`/attempts/${id}/submit`);
          goResult();
          return true;
        } catch (err) {
          if (isFinishErr(err)) {
            goResult();
            return true;
          }
          if (!auto) {
            toast.error('Gagal menyelesaikan ujian', errorMessage(err));
            finishingRef.current = false;
            setPhase('ready');
            return false;
          }
          await sleep(1500 * (i + 1));
        }
      }
      // Waktu habis & server tak terjangkau: server tetap memfinalisasi otomatis.
      goResult();
      return true;
    },
    [flushQueue, goResult, id, toast],
  );

  /* ------------------------------ muat ------------------------------ */
  const load = useCallback(async () => {
    setPhase('loading');
    setLoadError(null);
    try {
      const t0 = performance.now();
      const a = await api.get(`/attempts/${id}`);
      const t1 = performance.now();
      if (!a || a.status !== 'berlangsung') {
        goResult();
        return;
      }
      endAtRef.current = null;
      syncEnd(a.remaining_seconds, (t0 + t1) / 2, 0);

      // Gabungkan jawaban server dengan antrean lokal yang belum terkirim (mis. refresh saat offline).
      const merged = { ...(a.answers || {}) };
      const pending = readJSON(window.localStorage, lsKey(id), {});
      const qids = new Set((a.questions || []).map((x) => x.id));
      queueRef.current = new Map();
      Object.entries(pending || {}).forEach(([qid, p]) => {
        if (!qids.has(qid) || !p) return;
        merged[qid] = { option_id: p.option_id || null, is_flagged: !!p.is_flagged };
        queueRef.current.set(qid, { question_id: qid, option_id: p.option_id || null, is_flagged: !!p.is_flagged });
      });
      answersRef.current = merged;
      setAnswers(merged);
      setAttempt(a);
      const pos = Number(readJSON(window.sessionStorage, posKey(id), 0)) || 0;
      setIdx(Math.min(Math.max(0, pos), Math.max(0, (a.questions || []).length - 1)));
      setRemaining(Math.max(0, Math.ceil((endAtRef.current - performance.now()) / 1000)));
      setPhase('ready');
      if (queueRef.current.size) {
        setSaveState('saving');
        processQueue();
      }
    } catch (err) {
      setLoadError(err);
      setPhase('error');
    }
  }, [id, goResult, syncEnd, processQueue]);

  useEffect(() => {
    load();
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [load]);

  // simpan posisi soal
  useEffect(() => {
    if (phase === 'ready') writeJSON(window.sessionStorage, posKey(id), idx);
  }, [idx, id, phase]);

  /* ------------------------------ timer ------------------------------ */
  useEffect(() => {
    if (phase !== 'ready' && phase !== 'finishing') return undefined;
    const tick = () => {
      if (endAtRef.current == null) return;
      const rem = Math.max(0, Math.ceil((endAtRef.current - performance.now()) / 1000));
      setRemaining(rem);
      if (rem <= WARN_SECONDS && rem > 0 && !readJSON(window.sessionStorage, warnKey(id), false)) {
        writeJSON(window.sessionStorage, warnKey(id), true);
        toast.warning('Waktu tersisa kurang dari 5 menit', 'Periksa kembali soal yang belum dijawab atau ditandai ragu-ragu.', { duration: 8000 });
      }
      if (rem === 0 && !finishingRef.current) finish({ auto: true });
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [phase, finish, id, toast]);

  // sinkron ulang dengan server tiap 30 dtk (+ saat tab kembali terlihat)
  const resync = useCallback(async () => {
    if (finishingRef.current || finishedRef.current) return;
    try {
      const t0 = performance.now();
      const a = await api.get(`/attempts/${id}`);
      const t1 = performance.now();
      if (!a || a.status !== 'berlangsung') {
        toast.info('Ujian telah berakhir', 'Mengalihkan ke halaman hasil…');
        goResult();
        return;
      }
      syncEnd(a.remaining_seconds, (t0 + t1) / 2);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) goResult();
    }
  }, [id, goResult, syncEnd, toast]);

  useEffect(() => {
    if (phase !== 'ready') return undefined;
    const t = setInterval(resync, RESYNC_MS);
    return () => clearInterval(t);
  }, [phase, resync]);

  /* ---------------------- deteksi pindah tab/blur ---------------------- */
  useEffect(() => {
    if (phase !== 'ready') return undefined;
    let blurTimer = null;
    const record = (type) => {
      const now = Date.now();
      if (now - lastEventRef.current < EVENT_THROTTLE_MS) return;
      lastEventRef.current = now;
      warnAfterReturnRef.current = true;
      api
        .post(`/attempts/${id}/events`, { type })
        .then((r) => r && r.tab_switches != null && setTabSwitches(r.tab_switches))
        .catch(() => {});
    };
    const onReturn = () => {
      if (!warnAfterReturnRef.current) return;
      warnAfterReturnRef.current = false;
      toast.warning('Anda meninggalkan halaman ujian', 'Aktivitas pindah tab/jendela dicatat dan dapat dilihat admin.', { duration: 6000 });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') record('tab_hidden');
      else {
        onReturn();
        resync();
        processQueue();
      }
    };
    const onBlur = () => {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => record(document.visibilityState === 'hidden' ? 'tab_hidden' : 'blur'), 200);
    };
    const onFocus = () => onReturn();
    const onOnline = () => processQueue();
    const onBeforeUnload = (e) => {
      if (finishedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      clearTimeout(blurTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [phase, id, toast, resync, processQueue]);

  /* ----------------------------- navigasi ----------------------------- */
  const go = useCallback(
    (i) => {
      const n = Math.max(0, Math.min(questions.length - 1, i));
      setIdx(n);
      setNavOpen(false);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [questions.length],
  );

  const choose = useCallback((optionId) => q && updateAnswer(q.id, { option_id: optionId }), [q, updateAnswer]);
  const toggleFlag = useCallback(() => q && updateAnswer(q.id, { is_flagged: !answersRef.current[q.id]?.is_flagged }), [q, updateAnswer]);

  // Keyboard: ←/→ soal, A–E opsi, R ragu-ragu
  useEffect(() => {
    if (phase !== 'ready' || !q) return undefined;
    const onKey = (e) => {
      if (confirmOpen || navOpen || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || '';
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || e.target?.isContentEditable) return;
      if (e.key === 'ArrowRight') go(idx + 1);
      else if (e.key === 'ArrowLeft') go(idx - 1);
      else if (e.key.toLowerCase() === 'r') toggleFlag();
      else {
        const opt = q.options.find((o) => o.label === e.key.toUpperCase());
        if (!opt) return;
        choose(opt.id);
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, q, idx, go, choose, toggleFlag, confirmOpen, navOpen]);

  /* ------------------------------ ringkasan ------------------------------ */
  const counts = useMemo(() => {
    const c = { belum: 0, dijawab: 0, ragu: 0, answered: 0 };
    questions.forEach((x) => {
      const a = answers[x.id];
      c[statusOf(a)] += 1;
      if (a && a.option_id) c.answered += 1;
    });
    return c;
  }, [questions, answers]);
  const unansweredList = useMemo(() => questions.map((x, i) => (!answers[x.id]?.option_id ? i + 1 : null)).filter(Boolean), [questions, answers]);
  const flaggedList = useMemo(() => questions.map((x, i) => (answers[x.id]?.is_flagged ? i + 1 : null)).filter(Boolean), [questions, answers]);

  /* ------------------------------ render ------------------------------ */
  if (phase === 'loading' && !attempt) return <ExamSkeleton />;

  if (phase === 'error') {
    const notFound = loadError instanceof ApiError && loadError.status === 404;
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className={SURFACE}>
          <ErrorState
            error={notFound ? 'Ujian ini tidak ditemukan atau bukan milik Anda.' : loadError}
            title={notFound ? 'Ujian tidak ditemukan' : 'Ruang ujian gagal dimuat'}
            onRetry={notFound ? undefined : load}
          />
          <div className="flex justify-center pb-10">
            <Button variant="ghost" href="/tryout" icon={<ArrowLeft />}>
              Kembali ke daftar tryout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className={SURFACE}>
          <ErrorState title="Paket tidak berisi soal" error="Hubungi admin untuk informasi lebih lanjut." />
        </div>
      </div>
    );
  }

  const ans = answers[q.id] || {};
  const flagged = !!ans.is_flagged;
  const isLast = idx === questions.length - 1;

  return (
    <div className="pb-28 lg:pb-12">
      {/* ------------------------------ HEADER ------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-mist-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-3 px-4 sm:h-[76px] sm:gap-4 sm:px-6 lg:px-8">
          <LogoMark className="hidden shrink-0 sm:flex" />
          <span className="hidden h-8 w-px bg-mist-100 sm:block" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[14px] font-semibold tracking-tight sm:text-lg">{attempt.package?.title}</h1>
              <Chip color={SUBTEST_COLOR[q.subtest]} size="sm" className="hidden md:inline-flex">
                {q.subtest}
              </Chip>
            </div>
            <SaveIndicator state={saveState} className="mt-0.5 !text-xs sm:!text-[13px]" />
          </div>
          <TimerPill remaining={remaining} />
          <Button className="hidden !shadow-none lg:inline-flex" icon={<Send />} onClick={() => setConfirmOpen(true)} disabled={phase !== 'ready'}>
            Selesai
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1440px] gap-4 px-4 pt-4 sm:px-6 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        {/* ------------------------------ SOAL ------------------------------ */}
        <section aria-label={`Soal nomor ${idx + 1}`} className="min-w-0">
          <div className={cn(SURFACE, 'p-5 sm:p-8')}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-obsidian px-3 font-mono text-lg font-semibold tabular-nums text-white">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-xs text-mist-700">
                    Soal <span className="font-mono tabular-nums">{idx + 1}</span> dari <span className="font-mono tabular-nums">{questions.length}</span>
                  </p>
                  <p className="text-sm font-semibold">{SUBTEST_NAME[q.subtest] || q.subtest}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Chip color={SUBTEST_COLOR[q.subtest]} size="sm">
                  {q.subtest}
                </Chip>
                {flagged && (
                  <Chip color="warning" size="sm" icon={<Flag />}>
                    Ragu-ragu
                  </Chip>
                )}
              </div>
            </div>

            <div className="mt-5 whitespace-pre-line border-t border-mist-100 pt-5 text-[15px] leading-[1.7] text-obsidian sm:mt-6 sm:pt-6 sm:text-lg sm:leading-[1.75]">{q.body}</div>
            {q.image_url && <img src={q.image_url} alt={`Gambar soal nomor ${idx + 1}`} className="mt-5 max-h-96 w-auto max-w-full rounded-2xl bg-ghost object-contain" />}

            <div className="mt-6 space-y-3 sm:mt-7" role="radiogroup" aria-label="Pilihan jawaban">
              {q.options.map((o) => (
                <OptionButton
                  key={o.id}
                  label={o.label}
                  body={o.body}
                  state={ans.option_id === o.id ? 'selected' : 'default'}
                  onClick={() => choose(o.id)}
                  disabled={phase !== 'ready'}
                  role="radio"
                  aria-checked={ans.option_id === o.id}
                  aria-pressed={undefined}
                />
              ))}
            </div>

            <div className="mt-4 flex min-h-[36px] items-center justify-between gap-3">
              <p className="hidden text-xs text-mist-700 md:block">
                <Kbd>←</Kbd> <Kbd>→</Kbd> pindah soal · <Kbd>A</Kbd>–<Kbd>E</Kbd> pilih jawaban · <Kbd>R</Kbd> ragu-ragu
              </p>
              {ans.option_id && (
                <Button variant="ghost" size="sm" icon={<Eraser />} onClick={() => updateAnswer(q.id, { option_id: null })} className="ml-auto">
                  Hapus jawaban
                </Button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-t border-mist-100 pt-5 sm:flex sm:items-center sm:justify-between sm:gap-3 [&_button]:!shadow-none">
              <Button variant="secondary" icon={<ArrowLeft />} onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Soal sebelumnya" className="max-sm:px-0 sm:px-5">
                <span className="hidden sm:inline">Sebelumnya</span>
              </Button>
              <Button
                variant={flagged ? 'mint' : 'secondary'}
                icon={<Flag />}
                onClick={toggleFlag}
                aria-pressed={flagged}
                className={cn('px-3 sm:px-5', flagged && '!bg-warning !text-obsidian hover:!brightness-95')}
              >
                <span className="hidden sm:inline">Ragu-ragu</span>
                <span className="sm:hidden">Ragu</span>
              </Button>
              {isLast ? (
                <Button variant="accent" iconRight={<Send />} onClick={() => setConfirmOpen(true)} className="px-3 sm:px-5">
                  Selesai
                </Button>
              ) : (
                <Button iconRight={<ArrowRight />} onClick={() => go(idx + 1)} className="px-3 sm:px-5">
                  <span className="hidden sm:inline">Berikutnya</span>
                  <span className="sm:hidden">Lanjut</span>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* --------------------------- PANEL NOMOR --------------------------- */}
        <aside className="hidden lg:block" aria-label="Navigasi soal">
          <div className={cn(SURFACE, 'sticky top-[100px] flex max-h-[calc(100vh-124px)] flex-col p-5')}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-[14px] font-semibold sm:text-[15px]">Navigasi soal</h2>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {counts.answered}/{questions.length}
              </span>
            </div>
            <ProgressBar value={counts.answered} max={questions.length} size="sm" className="mt-3" />
            <div className="-mx-1 mt-5 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
              <NavGrid questions={questions} answers={answers} current={idx} onJump={go} counts={counts} />
            </div>
            {tabSwitches > 0 && (
              <p className="mt-4 rounded-xl bg-warning-50 px-3 py-2 text-xs font-medium text-warning-700">Pindah tab tercatat {tabSwitches}×</p>
            )}
            <Button fullWidth className="mt-5 shrink-0 !shadow-none" icon={<Send />} onClick={() => setConfirmOpen(true)} disabled={phase !== 'ready'}>
              Selesai ujian
            </Button>
          </div>
        </aside>
      </main>

      {/* ---------------------------- BAR MOBILE ---------------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-mist-100 bg-white/95 pb-[max(12px,env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] pt-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-2 [&_button]:!shadow-none">
          <Button variant="secondary" icon={<LayoutGrid />} onClick={() => setNavOpen(true)} className="flex-1" aria-haspopup="dialog">
            Daftar soal
            <span className="ml-1 rounded-md bg-ghost px-2 py-0.5 font-mono text-xs tabular-nums">
              {counts.answered}/{questions.length}
            </span>
          </Button>
          <Button icon={<Send />} onClick={() => setConfirmOpen(true)} disabled={phase !== 'ready'}>
            Selesai
          </Button>
        </div>
      </div>

      <Modal open={navOpen} onClose={() => setNavOpen(false)} title="Daftar soal" description={`${counts.answered} dari ${questions.length} soal dijawab`} size="md" className="max-sm:pb-[env(safe-area-inset-bottom)]">
        <NavGrid questions={questions} answers={answers} current={idx} onJump={go} counts={counts} />
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Selesaikan ujian sekarang?"
        description="Setelah dikumpulkan, jawaban tidak dapat diubah lagi dan skor langsung dihitung."
        confirmText="Ya, kumpulkan"
        cancelText="Periksa lagi"
        icon={<Send className="h-[22px] w-[22px]" />}
        onConfirm={async () => {
          await finish();
          return false;
        }}
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          <SummaryCell label="Dijawab" value={counts.answered} tone="text-cobalt-700" />
          <SummaryCell label="Belum dijawab" value={unansweredList.length} tone={unansweredList.length ? 'text-danger-700' : 'text-obsidian'} />
          <SummaryCell label="Ragu-ragu" value={flaggedList.length} tone={flaggedList.length ? 'text-warning-700' : 'text-obsidian'} />
        </div>
        {(unansweredList.length > 0 || flaggedList.length > 0) && (
          <div className="mt-4 space-y-3 text-left">
            {unansweredList.length > 0 && <JumpList label="Belum dijawab" items={unansweredList} onJump={(n) => { setConfirmOpen(false); go(n - 1); }} />}
            {flaggedList.length > 0 && <JumpList label="Ragu-ragu" items={flaggedList} onJump={(n) => { setConfirmOpen(false); go(n - 1); }} warn />}
          </div>
        )}
      </ConfirmDialog>

      {phase === 'finishing' && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ghost/90 px-4" role="alertdialog" aria-live="assertive" aria-label="Menyelesaikan ujian">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-8 text-center shadow-float ring-1 ring-mist-100">
            <Spinner size="lg" tone="cobalt" className="mx-auto" />
            <p className="mt-5 text-lg font-semibold tracking-tight">{finishReason === 'timeup' ? 'Waktu habis' : 'Mengumpulkan jawaban…'}</p>
            <p className="mt-1.5 text-sm text-mist-700">{finishReason === 'timeup' ? 'Jawaban Anda sedang dikumpulkan otomatis.' : 'Mohon tunggu, jangan tutup halaman ini.'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Kbd({ children }) {
  return <kbd className="inline-flex min-w-[22px] items-center justify-center rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-obsidian-600 ring-1 ring-inset ring-mist-100">{children}</kbd>;
}

function SummaryCell({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-ghost px-2 py-3">
      <p className={cn('font-mono text-2xl font-semibold tabular-nums', tone)}>{value}</p>
      <p className="mt-0.5 text-[11px] text-mist-700">{label}</p>
    </div>
  );
}

function JumpList({ label, items, onJump, warn }) {
  const max = 18;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-mist-700">{label}</p>
      <div className="flex flex-wrap gap-2 sm:gap-1.5">
        {items.slice(0, max).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onJump(n)}
            className={cn(
              'h-10 min-w-10 rounded-lg px-2 font-mono text-[13px] font-semibold sm:h-8 sm:min-w-8 sm:text-xs tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
              warn ? 'bg-warning-50 text-warning-700 hover:bg-warning/20' : 'bg-ghost text-obsidian-600 hover:bg-mist-100',
            )}
            aria-label={`Ke soal ${n}`}
          >
            {n}
          </button>
        ))}
        {items.length > max && <span className="self-center text-xs text-mist-700">+{items.length - max} lagi</span>}
      </div>
    </div>
  );
}

function ExamSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat ruang ujian">
      <div className="border-b border-mist-100 bg-white">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-9 w-9" rounded="rounded-xl" />
          <Skeleton className="h-5 w-56" rounded="rounded-md" />
          <Skeleton className="ml-auto h-14 w-40" rounded="rounded-full" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-4 px-4 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className={cn(SURFACE, 'p-8')}>
          <Skeleton className="h-12 w-40" rounded="rounded-xl" />
          <Skeleton className="mt-6 h-5 w-full" rounded="rounded-md" />
          <Skeleton className="mt-3 h-5 w-4/5" rounded="rounded-md" />
          <div className="mt-8 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" rounded="rounded-2xl" />
            ))}
          </div>
        </div>
        <div className={cn(SURFACE, 'hidden p-5 lg:block')}>
          <Skeleton className="h-5 w-32" rounded="rounded-md" />
          <div className="mt-6 grid grid-cols-5 gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="h-10" rounded="rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamRoom;
