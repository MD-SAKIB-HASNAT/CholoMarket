'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Download, FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingBlock, PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { EmptyState, StatusBadge } from '@/components/shared/Bits';
import { LoadMore } from '@/components/shared/LoadMore';
import { api, API_URL, getToken } from '@/utils/api/api';
import { formatDate } from '@/utils/helpers/format';
import { useCursorList } from '@/utils/hooks/useCursorList';
import { useShopId } from '@/app/(protected)/portal/shop/[shopId]/hooks/useshop';
import { ManagerOnly } from '@/app/(protected)/portal/shop/[shopId]/components/ManagerOnly';
import { PORTAL_ENDPOINTS } from '@/utils/endpoints/portal.endpoints';

interface ImportJob {
  id: number;
  fileName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errors: { row: number; error: string }[];
  createdAt: string;
  finishedAt: string | null;
}

const COLUMNS: [string, string][] = [
  ['name_en', 'Product name in English (required)'],
  ['name_bn', 'Name in Bangla'],
  ['category_slug', 'e.g. mens-fashion, audio, skincare (required)'],
  ['price', 'Price in taka (required)'],
  ['stock', 'How many you have'],
  ['sku', 'Your code — rows with an existing SKU update price & stock'],
  ['compare_at_price', 'Old price, shown crossed out'],
  ['size', 'Size of this variant'],
  ['color', 'Colour of this variant'],
  ['description', 'Short description'],
  ['negotiable', 'yes / no — allow bargaining'],
];

function ShopImportsPage() {
  const shopId = useShopId();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Polled so a running import shows its result without a reload.
  const jobs = useCursorList<ImportJob>(
    ['shop', shopId, 'imports'],
    PORTAL_ENDPOINTS.shop.imports(shopId),
    { limit: 10 },
    { refetchInterval: 5_000 }
  );

  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api<ImportJob>(PORTAL_ENDPOINTS.shop.imports(shopId), { method: 'POST', body: form });
    },
    onSuccess: () => {
      toast.success('Upload received — processing in the background');
      qc.invalidateQueries({ queryKey: ['shop', shopId, 'imports'] });
    },
    onSettled: () => {
      if (input.current) input.current.value = '';
    },
  });

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const res = await fetch(`${API_URL}${PORTAL_ENDPOINTS.shop.importTemplate(shopId)}`, {
        headers: { Authorization: `Bearer ${getToken() ?? ''}` },
      });
      if (!res.ok) throw new Error('Could not download the template');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-import-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk import"
        description="Upload many products at once from Excel or Google Sheets (save as CSV)."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={downloadTemplate} disabled={downloading}>
              {downloading ? <LoaderCircle className="animate-spin" /> : <Download />} Template
            </Button>
            <Button size="sm" onClick={() => input.current?.click()} disabled={upload.isPending}>
              {upload.isPending ? <LoaderCircle className="animate-spin" /> : <Upload />} Upload CSV
            </Button>
            <input
              ref={input}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) upload.mutate(file);
              }}
            />
          </>
        }
      />

      <Panel title="Columns">
        <p className="mb-3 text-sm text-muted-foreground">
          One row per variant. Each row creates a product, or updates it when the SKU already exists
          in your shop.
        </p>
        <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {COLUMNS.map(([col, desc]) => (
            <div key={col} className="flex gap-2">
              <dt className="w-36 shrink-0 font-mono text-xs leading-5">{col}</dt>
              <dd className="text-muted-foreground">{desc}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title="Recent imports">
        {jobs.isPending ? (
          <LoadingBlock rows={2} />
        ) : !jobs.items.length ? (
          <EmptyState icon={FileSpreadsheet} title="No imports yet" className="border-0 py-8" />
        ) : (
          <ul className="divide-y">
            {jobs.items.map(j => (
              <li key={j.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{j.fileName}</p>
                  <StatusBadge status={j.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(j.createdAt, true)}
                  {j.status === 'completed'
                    ? ` · ${j.totalRows} rows: ${j.createdCount} created, ${j.updatedCount} updated, ${j.failedCount} failed`
                    : ''}
                </p>
                {j.errors.length ? (
                  <details className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900">
                    <summary className="flex cursor-pointer list-none items-center gap-1 font-medium">
                      <ChevronDown className="size-3.5" /> {j.errors.length} row
                      {j.errors.length > 1 ? 's' : ''} need fixing
                    </summary>
                    <ul className="mt-2 space-y-0.5">
                      {j.errors.map((e, i) => (
                        <li key={i}>
                          {e.row ? `Row ${e.row}: ` : ''}
                          {e.error}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <LoadMore
          hasMore={!!jobs.hasMore}
          loading={jobs.isLoadingMore}
          onLoad={jobs.loadMore}
          label="Show older imports"
        />
      </Panel>
    </div>
  );
}

export default function ShopImportsPagePage() {
  return (
    <ManagerOnly>
      <ShopImportsPage />
    </ManagerOnly>
  );
}
