'use client';

import { useParams } from 'next/navigation';
import { FileStack, FileQuestion } from 'lucide-react';
import { api } from '@/lib/api';
import { formatTanggalJam } from '@/lib/format';
import { Button, Chip, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { QuestionForm } from '@/components/admin/QuestionForm';
import { SubtestChip } from '@/components/admin/AdminParts';
import { AdminPageHeader, Panel, StatusPill } from '@/components/admin/AdminUI';
import { shortCode, useResource } from '@/components/admin/shared';

export function EditQuestionView() {
  const { id } = useParams();
  const { loading, error, data, reload, setData } = useResource(() => api.get(`/admin/questions/${id}`), [id]);

  return (
    <div>
      <AdminPageHeader
        back={{ href: '/admin/soal', label: 'Bank soal' }}
        title="Ubah soal"
        description={data ? `Terakhir diperbarui ${formatTanggalJam(data.updated_at)}` : 'Perbarui isi, opsi, dan pembahasan soal.'}
        meta={
          data && (
            <>
              <Chip size="sm" color="white" mono className="!shadow-none ring-1 ring-inset ring-mist-100">
                {shortCode(data.id, 'SOAL')}
              </Chip>
              <SubtestChip code={data.subtest} />
              <StatusPill status={data.status} />
              <Chip size="sm" color={data.used_in_packages ? 'cobalt' : 'mist'} icon={<FileStack />}>
                Dipakai di {data.used_in_packages} paket
              </Chip>
            </>
          )
        }
      />
      {loading && !data ? (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-12">
          <Skeleton className="h-64 lg:col-span-7" rounded="rounded-[20px]" />
          <Skeleton className="h-64 lg:col-span-5" rounded="rounded-[20px]" />
        </div>
      ) : error ? (
        <Panel padding="none">
          {error.status === 404 ? (
            <EmptyState icon={<FileQuestion />} title="Soal tidak ditemukan" description="Soal mungkin sudah dihapus." action={<Button href="/admin/soal">Kembali ke bank soal</Button>} />
          ) : (
            <ErrorState error={error} onRetry={() => reload()} />
          )}
        </Panel>
      ) : (
        <QuestionForm key={data.id} question={data} onSaved={(q) => q && setData((d) => ({ ...d, ...q }))} />
      )}
    </div>
  );
}

export default EditQuestionView;
