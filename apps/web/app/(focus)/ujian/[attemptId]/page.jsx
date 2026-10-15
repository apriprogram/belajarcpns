import { ExamRoom } from './ExamRoom';

export const metadata = { title: 'Ruang ujian' };

export default async function Page({ params }) {
  const { attemptId } = await params;
  return <ExamRoom attemptId={attemptId} />;
}
