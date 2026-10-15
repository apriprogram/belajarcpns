'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, CheckCircle2, Lightbulb, ListRestart, Play, RotateCcw, Send, Sparkles, Target, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api, errorMessage } from '@/lib/api';
import { formatAngka } from '@/lib/format';
import { Badge, Button, Chip, ErrorState, Gauge, Skeleton, SUBTEST_COLOR, useToast } from '@/components/ui';
import { OptionButton } from '@/components/peserta/OptionButton';
import { useHeartbeat, useResource } from '@/components/peserta/hooks';
import { SUBTESTS } from '@/components/peserta/constants';
import { IconBox, PageHead, Panel, PanelHeader, Segmented } from '../_components/kit';

const CRUMBS = [{ href: '/dashboard', label: 'Dashboard' }, { label: 'Latihan' }];

const SESSION_SIZE = 10;
const DIFFICULTY = [
  { value: '', label: 'Semua tingkat' },
  { value: 'mudah', label: 'Mudah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'sulit', label: 'Sulit' },
];
const SUBTEST_INFO = {
  TWK: 'Nasionalisme, integritas, bela negara, pilar negara, dan bahasa Indonesia. Benar = 5 poin.',
  TIU: 'Verbal, numerik, dan figural untuk mengukur kemampuan berpikir logis. Benar = 5 poin.',
  TKP: 'Situasi kerja ASN. Setiap opsi berbobot 1–5 — tidak ada jawaban yang benar-benar salah.',
};

export function LatihanView() {
  useHeartbeat(true);
  const toast = useToast();
  const cats = useResource(() => api.get('/categories'), []);
  const [subtest, setSubtest] = useState('TWK');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('');

  // sesi
  const [phase, setPhase] = useState('setup'); // setup | session | summary
  const [starting, setStarting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState({}); // qid -> option_id
  const [results, setResults] = useState({}); // qid -> response
  const [sending, setSending] = useState(false);

  const subcats = useMemo(() => {
    const list = cats.data || [];
    const parent = list.find((c) => c.code === subtest && c.parent_id == null);
    return { parent, children: list.filter((c) => c.code === subtest && c.parent_id != null) };
  }, [cats.data, subtest]);

  const start = async () => {
    setStarting(true);
    try {
      const qs = await api.get('/practice/questions', { query: { subtest, category_id: categoryId, difficulty, limit: SESSION_SIZE } });
      if (!qs || !qs.length) {
        toast.warning('Soal belum tersedia', 'Coba pilih sub-materi atau tingkat kesulitan lain.');
        return;
      }
      setQuestions(qs);
      setIdx(0);
      setPicked({});
      setResults({});
      setPhase('session');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error('Gagal memulai sesi', errorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  const q = questions[idx];
  const res = q ? results[q.id] : null;

  const submit = useCallback(async () => {
    if (!q || !picked[q.id] || results[q.id] || sending) return;
    setSending(true);
    try {
      const r = await api.post('/practice/answer', { question_id: q.id, option_id: picked[q.id] });
      setResults((m) => ({ ...m, [q.id]: r }));
    } catch (err) {
      toast.error('Gagal mengirim jawaban', errorMessage(err));
    } finally {
      setSending(false);
    }
  }, [q, picked, results, sending, toast]);

  const next = useCallback(() => {
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else setPhase('summary');
  }, [idx, questions.length]);

  // Keyboard: A–E pilih, Enter kirim/lanjut
  useEffect(() => {
    if (phase !== 'session' || !q) return undefined;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      const k = e.key.toUpperCase();
      const opt = q.options.find((o) => o.label === k);
      if (opt && !results[q.id]) {
        setPicked((m) => ({ ...m, [q.id]: opt.id }));
        e.preventDefault();
      } else if (e.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') {
        if (results[q.id]) next();
        else submit();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, q, results, submit, next]);

  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter((r) => r.is_correct).length;
  const score = Object.values(results).reduce((s, r) => s + (Number(r.score) || 0), 0);
  const maxScore = Object.values(results).reduce((s, r) => s + (Number(r.max_weight) || 0), 0);

  /* ------------------------------ SETUP ------------------------------ */
  if (phase === 'setup') {
    return (
      <>
        <PageHead crumbs={CRUMBS} mascot="/maskot/latihan.webp" title="Latihan soal" description="Pilih subtes dan sub-materi, jawab 10 soal, dan lihat pembahasan langsung setelah setiap jawaban." />
        <div className="grid gap-4 lg:grid-cols-12 [&>*]:min-w-0">
          <Panel padding="lg" className="lg:col-span-8">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Atur sesi latihan</h2>
            <p className="mt-1 text-sm text-mist-700">Setiap sesi berisi {SESSION_SIZE} soal acak dari bank soal terbit.</p>
            <div className="my-6 border-t border-mist-100" />

            <p className="mb-3 text-sm font-semibold">1 · Subtes</p>
            <Segmented
              ariaLabel="Pilih subtes"
              value={subtest}
              onChange={(v) => {
                setSubtest(v);
                setCategoryId('');
              }}
              items={SUBTESTS.map((s) => ({ value: s.code, label: s.code }))}
            />
            <div className="mt-3 rounded-xl bg-ghost p-4">
              <p className="font-semibold">{SUBTESTS.find((s) => s.code === subtest)?.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-mist-700">{SUBTEST_INFO[subtest]}</p>
            </div>

            <p className="mb-3 mt-7 text-sm font-semibold">2 · Sub-materi</p>
            {cats.loading ? (
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-9 w-32" rounded="rounded-xl" />
                ))}
              </div>
            ) : cats.error ? (
              <ErrorState size="sm" error={cats.error} onRetry={() => cats.reload()} />
            ) : (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih sub-materi">
                <Chip color="white" shape="soft" onClick={() => setCategoryId('')} selected={categoryId === ''} className="!h-9 !px-3.5">
                  Semua materi{subcats.parent ? ` · ${subcats.parent.question_count}` : ''}
                </Chip>
                {subcats.children.map((c) => (
                  <Chip key={c.id} color="white" shape="soft" onClick={() => setCategoryId(String(c.id))} selected={categoryId === String(c.id)} disabled={!c.question_count} className="!h-9 !px-3.5 disabled:opacity-50">
                    {c.name} · {c.question_count}
                  </Chip>
                ))}
              </div>
            )}

            <p className="mb-3 mt-7 text-sm font-semibold">3 · Tingkat kesulitan</p>
            <Segmented size="sm" ariaLabel="Tingkat kesulitan" value={difficulty} onChange={setDifficulty} items={DIFFICULTY} />

            <div className="mt-8 flex flex-col gap-3 border-t border-mist-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Chip color={SUBTEST_COLOR[subtest]} size="sm">
                  {subtest}
                </Chip>
                <Chip color="white" size="sm" mono>
                  {SESSION_SIZE} soal
                </Chip>
                <Chip color="white" size="sm">
                  Pembahasan langsung
                </Chip>
              </div>
              <Button size="lg" icon={<Play />} loading={starting} onClick={start}>
                Mulai sesi
              </Button>
            </div>
          </Panel>

          <Panel className="lg:col-span-4 lg:self-start">
            <PanelHeader title="Cara kerja latihan" info="Mode belajar: jawab lalu langsung lihat pembahasan." action={<IconBox icon={Sparkles} tone="mint" />} />
            <ol className="space-y-4">
              {[
                ['Pilih jawaban', 'Klik opsi atau tekan huruf A–E pada keyboard.'],
                ['Kirim & periksa', 'Tekan Enter untuk melihat benar/salah, bobot TKP, dan pembahasan.'],
                ['Lanjutkan', 'Kerjakan hingga 10 soal lalu lihat ringkasan akurasi.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ghost font-mono text-xs font-semibold text-obsidian">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold">{t}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-mist-700">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 rounded-xl bg-ghost p-4 text-sm leading-relaxed text-mist-700">Waktu belajar di halaman ini tercatat otomatis dan tampil di grafik dashboard.</p>
          </Panel>
        </div>
      </>
    );
  }

  /* ----------------------------- SUMMARY ----------------------------- */
  if (phase === 'summary') {
    const acc = answered ? Math.round((correct / answered) * 100) : 0;
    return (
      <>
        <PageHead crumbs={[...CRUMBS, { label: 'Ringkasan sesi' }]} title="Sesi latihan selesai" description={`${subtest}${categoryId ? ' · ' + (subcats.children.find((c) => String(c.id) === categoryId)?.name || '') : ''} — ${answered} dari ${questions.length} soal dijawab.`} />
        <div className="grid gap-4 lg:grid-cols-12 [&>*]:min-w-0">
          <Panel padding="lg" className="flex flex-col items-center lg:col-span-5">
            <Gauge value={acc} max={100} suffix="%" label="akurasi" color={acc >= 70 ? 'mint-dark' : acc >= 40 ? 'cobalt' : 'danger'} size={260} />
            <div className="mt-8 grid w-full grid-cols-3 gap-2">
              {[
                ['Benar', correct, 'text-mint-700'],
                ['Tidak tepat', answered - correct, 'text-danger-700'],
                ['Skor', `${formatAngka(score)}/${formatAngka(maxScore)}`, 'text-obsidian'],
              ].map(([l, v, c]) => (
                <div key={l} className="rounded-xl bg-ghost p-4 text-center">
                  <p className="text-xs text-mist-700">{l}</p>
                  <p className={cn('mt-1 text-xl font-semibold tabular-nums', c)}>{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
              <Button variant="secondary" fullWidth icon={<ListRestart />} onClick={() => setPhase('setup')}>
                Ganti materi
              </Button>
              <Button fullWidth icon={<RotateCcw />} loading={starting} onClick={start}>
                Sesi baru
              </Button>
            </div>
          </Panel>
          <Panel className="lg:col-span-7">
            <PanelHeader title="Rincian jawaban" info="Klik soal untuk membuka kembali pembahasannya." />
            <ul className="divide-y divide-mist-100">
              {questions.map((qq, i) => {
                const r = results[qq.id];
                const st = !r ? 'kosong' : r.is_correct ? 'benar' : 'salah';
                return (
                  <li key={qq.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setIdx(i);
                        setPhase('session');
                      }}
                      className="flex w-full items-center gap-4 rounded-xl px-2 py-3 text-left transition-colors hover:bg-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-semibold ring-1 ring-inset ring-mist-100">{String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{qq.body}</span>
                        <span className="text-xs text-mist-700">{qq.category_name}</span>
                      </span>
                      {r && qq.subtest === 'TKP' && <span className="font-mono text-xs font-semibold tabular-nums text-obsidian-600">{r.score}/{r.max_weight}</span>}
                      <Badge status={st} size="sm" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </>
    );
  }

  /* ----------------------------- SESSION ----------------------------- */
  const isTKP = q?.subtest === 'TKP';
  const keyId = res ? res.correct_option_id : null;
  const weightOf = (optId) => res?.options?.find((o) => o.id === optId)?.weight;

  return (
    <>
      <PageHead
        crumbs={[...CRUMBS, { label: `Latihan ${subtest}` }]}
        title={
          <span className="inline-flex items-baseline gap-3">
            Soal <span className="font-mono tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
            <span className="text-lg font-medium text-mist-500">/ {questions.length}</span>
          </span>
        }
        actions={
          <Button variant="secondary" onClick={() => setPhase('summary')}>
            Akhiri sesi
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        <Panel padding="lg" className="lg:col-span-8">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Chip color={SUBTEST_COLOR[q.subtest]} size="sm">
              {q.subtest}
            </Chip>
            <Chip color="white" size="sm">
              {q.category_name}
            </Chip>
            {q.difficulty && <Badge status={q.difficulty} size="sm" dot={false} />}
          </div>
          <p className="whitespace-pre-line text-[17px] leading-relaxed text-obsidian">{q.body}</p>
          {q.image_url && <img src={q.image_url} alt="Gambar soal" className="mt-5 max-h-80 rounded-2xl bg-ghost object-contain" />}

          <div className="mt-6 space-y-3" role="group" aria-label="Pilihan jawaban">
            {q.options.map((o) => {
              const chosen = picked[q.id] === o.id;
              let state = chosen ? 'selected' : 'default';
              let note = null;
              if (res) {
                if (isTKP) {
                  const w = weightOf(o.id);
                  state = o.id === keyId ? 'correct' : chosen ? (res.is_correct ? 'correct' : 'selected') : 'muted';
                  if (chosen) note = <span className="text-cobalt-700">Jawaban Anda</span>;
                  return (
                    <OptionButton
                      key={o.id}
                      label={o.label}
                      body={o.body}
                      state={state}
                      note={note}
                      trailing={
                        <span className={cn('rounded-lg px-2 py-1 font-mono text-xs font-semibold', w === res.max_weight ? 'bg-mint text-obsidian' : 'bg-ghost text-obsidian-600')}>Bobot {w ?? '—'}</span>
                      }
                    />
                  );
                }
                state = o.id === keyId ? 'correct' : chosen ? 'wrong' : 'muted';
                if (chosen) note = <span className={res.is_correct ? 'text-mint-700' : 'text-danger-700'}>Jawaban Anda</span>;
                else if (o.id === keyId) note = <span className="text-mint-700">Kunci jawaban</span>;
              }
              return (
                <OptionButton
                  key={o.id}
                  label={o.label}
                  body={o.body}
                  state={state}
                  note={note}
                  onClick={res ? undefined : () => setPicked((m) => ({ ...m, [q.id]: o.id }))}
                />
              );
            })}
          </div>

          {res && (
            <div className="mt-6 animate-fade-up space-y-4">
              <div className={cn('flex items-center gap-3 rounded-xl p-4', res.is_correct ? 'bg-mint-50 text-mint-700' : isTKP ? 'bg-cobalt-50 text-cobalt-700' : 'bg-danger-50 text-danger-700')} role="status">
                {res.is_correct ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : isTKP ? <Target className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                <p className="font-semibold">
                  {isTKP
                    ? `Skor ${res.score} dari ${res.max_weight}${res.is_correct ? ' — pilihan terbaik!' : ''}`
                    : res.is_correct
                      ? `Benar! +${res.score} poin`
                      : 'Kurang tepat. Perhatikan kunci jawaban di atas.'}
                </p>
              </div>
              {res.explanation && (
                <div className="rounded-xl bg-ghost p-5">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Lightbulb className="h-4 w-4 text-warning-700" aria-hidden />
                    Pembahasan
                  </p>
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-obsidian-600">{res.explanation}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-mist-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="hidden text-xs text-mist-700 sm:block">
              <kbd className="rounded-md bg-ghost px-1.5 py-0.5 font-mono">A–E</kbd> pilih · <kbd className="rounded-md bg-ghost px-1.5 py-0.5 font-mono">Enter</kbd> {res ? 'lanjut' : 'kirim'}
            </p>
            {res ? (
              <Button size="lg" iconRight={<ArrowRight />} onClick={next}>
                {idx < questions.length - 1 ? 'Soal berikutnya' : 'Lihat ringkasan'}
              </Button>
            ) : (
              <Button size="lg" variant="accent" icon={<Send />} disabled={!picked[q.id]} loading={sending} onClick={submit}>
                Kirim jawaban
              </Button>
            )}
          </div>
        </Panel>

        <div className="space-y-4 lg:col-span-4">
          <Panel>
            <PanelHeader title="Progres sesi" className="mb-0" />
            <div className="mt-4 flex gap-1.5" aria-label={`${answered} dari ${questions.length} soal dijawab`}>
              {questions.map((qq, i) => {
                const r = results[qq.id];
                return (
                  <button
                    key={qq.id}
                    type="button"
                    onClick={() => setIdx(i)}
                    aria-label={`Soal ${i + 1}${r ? (r.is_correct ? ', benar' : ', tidak tepat') : ''}`}
                    aria-current={i === idx ? 'step' : undefined}
                    className={cn(
                      'h-2 flex-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40',
                      r ? (r.is_correct ? 'bg-mint-700' : 'bg-danger') : i === idx ? 'bg-cobalt' : 'bg-mist-100',
                    )}
                  />
                );
              })}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ['Dijawab', `${answered}/${questions.length}`],
                ['Benar', correct],
                ['Skor', formatAngka(score)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-ghost p-3 text-center">
                  <p className="text-xs text-mist-700">{l}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{v}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <IconBox icon={BookOpenCheck} tone="cobalt" />
            <p className="mt-4 text-sm font-semibold">Tips {q.subtest}</p>
            <p className="mt-1 text-sm leading-relaxed text-mist-700">{SUBTEST_INFO[q.subtest]}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}

export default LatihanView;
