'use client';

import { createContext, useContext } from 'react';

/**
 * Data testimoni awal dari server (SSR) untuk section Testimoni di landing — supaya teks testimoni
 * sudah ada di HTML (mesin pencari) tanpa menunggu fetch klien. `initial` = { items, average, total } | null.
 * TestimonialMarquee tetap mengambil ulang di klien untuk data terbaru.
 */
const TestimonialsCtx = createContext(null);

export function TestimonialsProvider({ initial, children }) {
  return <TestimonialsCtx.Provider value={initial || null}>{children}</TestimonialsCtx.Provider>;
}

export function useInitialTestimonials() {
  return useContext(TestimonialsCtx);
}

export default TestimonialsProvider;
