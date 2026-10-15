import { HasilView } from './HasilView';

export const metadata = { title: 'Hasil tryout' };

export default async function Page({ params }) {
  const { attemptId } = await params;
  return <HasilView attemptId={attemptId} />;
}
