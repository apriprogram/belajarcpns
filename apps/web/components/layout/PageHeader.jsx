import { cn } from '@/lib/cn';
import { PageTitle } from '@/components/ui/PageTitle';

/**
 * Header halaman standar (Style UI v2) — pembungkus <PageTitle> sebagai <header> dengan jarak bawah.
 *
 * title · description · actions (tombol, elemen) · eyebrow (label kecil di atas judul)
 * back: { href, label } → tautan kembali kecil di atas · meta: chip/badge di bawah deskripsi
 * breadcrumb: [{ label, href }] | string[] · children: konten di bawah header (mis. <Tabs>) · size: 'md' | 'lg'
 */
export function PageHeader({ title, description, actions, eyebrow, back, meta, breadcrumb, size = 'md', className, children }) {
  return (
    <PageTitle
      as="header"
      title={title}
      description={description}
      actions={actions}
      eyebrow={eyebrow}
      back={back}
      meta={meta}
      breadcrumb={breadcrumb}
      size={size}
      className={cn('mb-8', className)}
    >
      {children}
    </PageTitle>
  );
}

export default PageHeader;
