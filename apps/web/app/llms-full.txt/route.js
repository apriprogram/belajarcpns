import { getSite } from '@/lib/site-server';
import { llmsFull, textResponse } from '@/lib/llms';

// /llms-full.txt — kepala llms.txt + teks lengkap semua artikel panduan dalam Markdown.
export const dynamic = 'force-dynamic';

export async function GET() {
  return textResponse(await llmsFull(await getSite()));
}
