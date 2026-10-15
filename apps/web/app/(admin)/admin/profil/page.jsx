import { ProfilView } from '@/app/(peserta)/profil/ProfilView';

export const metadata = { title: 'Profil admin' };

/** Profil admin: data diri, foto profil, dan kata sandi (komponen yang sama dengan profil peserta). */
export default function Page() {
  return <ProfilView admin />;
}
