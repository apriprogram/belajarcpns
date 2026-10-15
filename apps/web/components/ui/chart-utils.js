'use client';

import { useEffect, useRef, useState } from 'react';

export const CHART_COLORS = ['#3765F6', '#C3CED7', '#14833A', '#F5B301', '#181D25'];

/** Ukur lebar elemen (responsif) dengan ResizeObserver. */
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.floor(el.getBoundingClientRect().width));
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/** Tick sumbu Y yang "bulat". */
export function niceTicks(min, max, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) {
    max = min + (min === 0 ? 1 : Math.abs(min) * 0.5);
  }
  const range = max - min;
  const rough = range / Math.max(1, count - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const steps = [1, 2, 2.5, 5, 10];
  let step = pow;
  for (const s of steps) {
    if (s * pow >= rough) {
      step = s * pow;
      break;
    }
  }
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}

/** Path kurva monoton (Fritsch–Carlson) — halus tanpa overshoot. */
export function monotonePath(pts) {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  if (n === 2) return `M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}`;
  const dx = [];
  const dy = [];
  const m = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    dy.push(pts[i + 1][1] - pts[i][1]);
    m.push(dy[i] / dx[i]);
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t.push(0);
    else {
      const common = dx[i - 1] + dx[i];
      t.push((3 * common) / ((common + dx[i]) / m[i - 1] + (common + dx[i - 1]) / m[i]));
    }
  }
  t.push(m[n - 2]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i][0] + h},${pts[i][1] + h * t[i]} ${pts[i + 1][0] - h},${pts[i + 1][1] - h * t[i + 1]} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

export const defaultFormat = (v) => (v == null || Number.isNaN(Number(v)) ? '—' : Number(v).toLocaleString('id-ID', { maximumFractionDigits: 1 }));
