import { getSite } from '@/lib/site-server';
import { llmsHeader, textResponse } from '@/lib/llms';

// /llms.txt — ringkasan situs untuk mesin pencari AI (https://llmstxt.org). Lihat docs/SEO.md.
export const dynamic = 'force-dynamic';

export async function GET() {
  return textResponse(llmsHeader(await getSite()));
}
