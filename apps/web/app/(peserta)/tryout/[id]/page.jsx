import { TryoutDetailView } from './TryoutDetailView';

export const metadata = { title: 'Detail tryout' };

export default async function Page({ params }) {
  const { id } = await params;
  return <TryoutDetailView id={id} />;
}
