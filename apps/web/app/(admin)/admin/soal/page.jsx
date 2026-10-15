import { Suspense } from 'react';
import { QuestionBankView } from './QuestionBankView';

export const metadata = { title: 'Bank soal' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <QuestionBankView />
    </Suspense>
  );
}
