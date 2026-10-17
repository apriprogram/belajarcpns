'use client';

import { useEffect, useRef } from 'react';

const SPACING = 26; // jarak antar titik (px)
const REACH = 190; // radius pengaruh kursor (px)
const COBALT = [55, 101, 246];
const MIST = [138, 153, 166];

/**
 * Latar hero interaktif (canvas): medan titik yang tertarik dan menyala cobalt di sekitar kursor,
 * plus sorotan lembut yang mengikuti kursor. Tanpa kursor (sentuh/idle) sorotan berkelana pelan
 * sehingga latar tetap hidup. Berhenti saat tidak terlihat; statis bila prefers-reduced-motion.
 */
export function HeroBackground({ className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let dots = [];
    let raf = 0;
    let visible = true;
    let hasPointer = false;
    let lastMove = 0;
    let lastDraw = 0;
    const pointer = { x: -9999, y: -9999 }; // target
    const cur = { x: -9999, y: -9999 }; // posisi sorotan (di-lerp)
    const t0 = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const offX = ((w % SPACING) / 2) | 0;
      const offY = ((h % SPACING) / 2) | 0;
      for (let y = offY; y <= h; y += SPACING) for (let x = offX; x <= w; x += SPACING) dots.push(x, y);
      if (reduced) drawStatic();
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = `rgba(${MIST.join(',')},0.45)`;
      for (let i = 0; i < dots.length; i += 2) {
        ctx.beginPath();
        ctx.arc(dots[i], dots[i + 1], 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (now) => {
      raf = 0;
      if (!visible) return;
      // Layar sempit (ponsel): cukup ±30 fps — hemat baterai, gerak tetap halus.
      if (w < 640 && now - lastDraw < 32) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastDraw = now;
      // Idle (tanpa kursor >2.5s): sorotan berkelana di jalur Lissajous.
      const idle = !hasPointer || now - lastMove > 2500;
      let tx = pointer.x;
      let ty = pointer.y;
      if (idle) {
        const t = (now - t0) / 1000;
        tx = w * (0.5 + 0.32 * Math.sin(t * 0.23));
        ty = h * (0.45 + 0.28 * Math.sin(t * 0.31 + 1.3));
      }
      cur.x += (tx - cur.x) * 0.1;
      cur.y += (ty - cur.y) * 0.1;

      ctx.clearRect(0, 0, w, h);

      // Sorotan lembut
      const g = ctx.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, 360);
      g.addColorStop(0, 'rgba(55,101,246,0.13)');
      g.addColorStop(0.5, 'rgba(55,101,246,0.05)');
      g.addColorStop(1, 'rgba(55,101,246,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Titik-titik
      const r2 = REACH * REACH;
      for (let i = 0; i < dots.length; i += 2) {
        const x = dots[i];
        const y = dots[i + 1];
        const dx = cur.x - x;
        const dy = cur.y - y;
        const d2 = dx * dx + dy * dy;
        let f = 0;
        if (d2 < r2) {
          f = 1 - Math.sqrt(d2) / REACH;
          f *= f;
        }
        const px = x + dx * f * 0.14; // tertarik ke kursor
        const py = y + dy * f * 0.14;
        const rad = 1.1 + f * 1.9;
        const a = 0.42 + f * 0.58;
        const c0 = MIST[0] + (COBALT[0] - MIST[0]) * f;
        const c1 = MIST[1] + (COBALT[1] - MIST[1]) * f;
        const c2 = MIST[2] + (COBALT[2] - MIST[2]) * f;
        ctx.fillStyle = `rgba(${c0 | 0},${c1 | 0},${c2 | 0},${a})`;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf && visible && !reduced) raf = requestAnimationFrame(frame);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Di luar area hero → kembali ke mode berkelana.
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        lastMove = 0;
        return;
      }
      pointer.x = x;
      pointer.y = y;
      hasPointer = true;
      lastMove = performance.now();
      if (cur.x < -1000) {
        cur.x = x;
        cur.y = y;
      }
    };

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting && !document.hidden;
      if (visible) kick();
    });
    const onVis = () => {
      visible = !document.hidden;
      if (visible) kick();
    };
    const ro = new ResizeObserver(resize);

    resize();
    ro.observe(canvas);
    io.observe(canvas);
    document.addEventListener('visibilitychange', onVis);
    // Dengarkan di window agar titik tetap bereaksi saat kursor di atas teks/video hero.
    window.addEventListener('pointermove', onMove, { passive: true });
    kick();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div className={className} aria-hidden>
      <canvas
        ref={canvasRef}
        className="block h-full w-full [mask-image:radial-gradient(85%_80%_at_50%_45%,#000_30%,transparent_100%)]"
      />
      {/* pudar di atas (area navbar) dan di bawah (menyatu dengan section berikutnya) */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white via-white/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white" />
    </div>
  );
}

export default HeroBackground;
