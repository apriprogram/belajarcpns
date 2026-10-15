'use client';

import { AdminPageHeader } from '@/components/admin/AdminUI';
import { QuestionForm } from '@/components/admin/QuestionForm';

export function NewQuestionView() {
  return (
    <div>
      <AdminPageHeader back={{ href: '/admin/soal', label: 'Bank soal' }} title="Tambah soal" description="Lengkapi teks soal, lima opsi jawaban, bobot nilai, dan pembahasan." />
      <QuestionForm />
    </div>
  );
}

export default NewQuestionView;
