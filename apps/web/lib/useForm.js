'use client';

import { useCallback, useRef, useState } from 'react';
import { ApiError } from './api';

/**
 * Hook form ringan: nilai, error per field, touched, submit, dan pemetaan ApiError.fields.
 *
 * const form = useForm({ initial: { email: '' }, validate: (v) => ({ email: !v.email && 'Email wajib diisi' }) });
 * <Field label="Email" {...form.field('email')}><Input {...form.bind('email')} /></Field>
 * <form onSubmit={form.handleSubmit(async (values) => { await api.post(...) })}>
 *
 * - validate(values) → objek { field: 'pesan' | falsy }
 * - handleSubmit(fn): validasi → fn(values). Jika fn melempar ApiError dengan `fields`,
 *   error otomatis dipasang ke field yang sesuai; pesan umum → form.formError.
 * - field(name, { success }) → props untuk <Field> (error hanya tampil setelah touched/submit).
 */
export function useForm({ initial = {}, validate } = {}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const runValidate = useCallback(
    (v) => {
      if (!validate) return {};
      const res = validate(v) || {};
      return Object.fromEntries(Object.entries(res).filter(([, msg]) => !!msg));
    },
    [validate],
  );

  const setValue = useCallback(
    (name, value) => {
      setValues((prev) => {
        const next = { ...prev, [name]: value };
        setErrors(runValidate(next));
        return next;
      });
      setServerErrors((s) => {
        if (!s[name]) return s;
        const n = { ...s };
        delete n[name];
        return n;
      });
      setFormError(null);
    },
    [runValidate],
  );

  const bind = (name, { type } = {}) => ({
    name,
    value: type === 'checkbox' ? undefined : values[name] ?? '',
    checked: type === 'checkbox' ? !!values[name] : undefined,
    onChange: (e) => {
      const t = e && e.target;
      setValue(name, t ? (t.type === 'checkbox' ? t.checked : t.value) : e);
    },
    onBlur: () => {
      setTouched((t) => ({ ...t, [name]: true }));
      setErrors(runValidate(valuesRef.current));
    },
  });

  const errorOf = (name) => serverErrors[name] || ((touched[name] || submitted) && errors[name]) || null;

  /** Props untuk <Field>. success: tampilkan state sukses saat valid & sudah disentuh. */
  const field = (name, { success } = {}) => {
    const error = errorOf(name);
    const ok = !error && success && touched[name] && values[name] && !errors[name];
    return { error, success: ok ? success : undefined };
  };

  /** Pasang error dari ApiError (422 VALIDATION_ERROR → fields). Mengembalikan true jika ada field. */
  const applyApiError = (err) => {
    if (err instanceof ApiError && err.fields && Object.keys(err.fields).length) {
      setServerErrors(err.fields);
      const known = Object.keys(err.fields).some((k) => k in valuesRef.current);
      if (!known) setFormError(err.message);
      return true;
    }
    setFormError(err?.message || 'Terjadi kesalahan. Coba lagi.');
    return false;
  };

  const handleSubmit = (fn) => async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    const errs = runValidate(valuesRef.current);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      if (typeof document !== 'undefined') document.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await fn(valuesRef.current);
    } catch (err) {
      applyApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = (next = initial) => {
    setValues(next);
    setErrors({});
    setServerErrors({});
    setTouched({});
    setSubmitted(false);
    setFormError(null);
  };

  return {
    values,
    setValue,
    setValues,
    errors: { ...errors, ...serverErrors },
    touched,
    bind,
    field,
    errorOf,
    handleSubmit,
    submitting,
    formError,
    setFormError,
    setServerErrors,
    applyApiError,
    reset,
  };
}

/* Validator umum (pesan Bahasa Indonesia) */
export const rules = {
  required: (v, label = 'Kolom ini') => (!v || !String(v).trim() ? `${label} wajib diisi` : null),
  email: (v) => {
    if (!v || !String(v).trim()) return 'Email wajib diisi';
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? null : 'Format email belum benar, mis. nama@email.com';
  },
  phone: (v) => {
    if (!v || !String(v).trim()) return 'Nomor HP wajib diisi';
    return /^(\+62|62|0)8\d{7,12}$/.test(String(v).replace(/[\s-]/g, '')) ? null : 'Nomor HP tidak valid, mis. 081234567890';
  },
  password: (v) => {
    if (!v) return 'Kata sandi wajib diisi';
    if (String(v).length < 8) return 'Minimal 8 karakter';
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Gunakan kombinasi huruf dan angka';
    return null;
  },
  match: (v, other, msg = 'Konfirmasi kata sandi tidak cocok') => (!v ? 'Ulangi kata sandi Anda' : v !== other ? msg : null),
};

/** Skor kekuatan kata sandi 0–4. */
export function passwordStrength(pw = '') {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  return pw ? Math.max(1, s) : 0;
}

export default useForm;
