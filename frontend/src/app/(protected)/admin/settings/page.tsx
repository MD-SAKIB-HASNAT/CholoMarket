'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Save, Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader, Panel } from '@/components/dashboard/DashboardShell';
import { api } from '@/utils/api/api';
import { useAdminRole } from '@/app/(protected)/admin/utils/admin';
import { QueryState } from '@/app/(protected)/admin/components/AdminUi';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

const FIELDS: {
  key: string;
  label: string;
  hint: string;
  type: 'number' | 'text' | 'secret';
  suffix?: string;
  min?: number;
  max?: number;
  integer?: boolean;
}[] = [
  {
    key: 'pickup_fee',
    label: 'Customer pickup fee',
    hint: 'Optional per-order fee, always collected online. 0 = free.',
    type: 'number',
    suffix: '৳',
  },
  {
    key: 'payment_window_minutes',
    label: 'Payment window',
    hint: 'Unpaid online orders are cancelled and stock released after this.',
    type: 'number',
    suffix: 'min',
  },
  {
    key: 'no_show_deposit_threshold',
    label: 'No-show threshold',
    hint: 'Customers with this many uncollected pickup orders must pay an advance.',
    type: 'number',
    suffix: 'orders',
  },
  {
    key: 'no_show_deposit_percent',
    label: 'No-show deposit',
    hint: 'Deposit those customers pay online for cash orders.',
    type: 'number',
    suffix: '%',
  },
  {
    key: 'offer_validity_hours',
    label: 'Offer response time',
    hint: 'How long a shop has to answer a bargaining offer.',
    type: 'number',
    suffix: 'hours',
  },
  {
    key: 'accepted_offer_hours',
    label: 'Accepted offer validity',
    hint: 'How long a customer can use an agreed price at checkout.',
    type: 'number',
    suffix: 'hours',
  },
  {
    key: 'nearby_max_km',
    label: 'Nearby radius',
    hint: 'The farthest a customer can look when they tap Nearby, in kilometres. Customers can choose a smaller distance, never a larger one. 0.5 is walking distance, 5 is across a neighbourhood.',
    type: 'number',
    suffix: 'km',
    min: 0.1,
    max: 50,
  },
  {
    key: 'support_hotline',
    label: 'Support hotline',
    hint: 'Shown to customers across the app.',
    type: 'text',
  },
  {
    key: 'delivery_fee_inside_dhaka',
    label: 'Delivery charge — inside Dhaka',
    hint: 'Added per shop parcel for home delivery inside Dhaka city.',
    type: 'number',
    suffix: '৳',
  },
  {
    key: 'delivery_fee_outside_dhaka',
    label: 'Delivery charge — outside Dhaka',
    hint: 'Added per shop parcel for home delivery anywhere else.',
    type: 'number',
    suffix: '৳',
  },
  {
    key: 'steadfast_webhook_token',
    label: 'Steadfast webhook token',
    hint: 'Bearer token Steadfast sends with status webhooks. Shops enter the same token in their Steadfast panel.',
    type: 'secret',
  },
];

export default function SettingsPage() {
  const { can } = useAdminRole();
  const editable = can('settings');
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api<Record<string, unknown>>(ADMIN_ENDPOINTS.settings.list),
  });

  return (
    <>
      <PageHeader
        title="Platform settings"
        description={
          editable
            ? 'Changes apply immediately to new orders and offers.'
            : 'Read only — only a super admin can change these.'
        }
      />
      <QueryState isLoading={isLoading} error={error} emptyIcon={Settings} emptyTitle="No settings">
        <Panel>
          <div className="grid gap-4 divide-y">
            {FIELDS.map(f => (
              <SettingRow
                key={`${f.key}:${String(data?.[f.key])}`}
                field={f}
                value={data?.[f.key]}
                editable={editable}
              />
            ))}
          </div>
        </Panel>
      </QueryState>
    </>
  );
}

function SettingRow({
  field,
  value,
  editable,
}: {
  field: (typeof FIELDS)[number];
  value: unknown;
  editable: boolean;
}) {
  const qc = useQueryClient();
  const initial = value === undefined || value === null ? '' : String(value);
  const [v, setV] = useState(initial);
  const [reveal, setReveal] = useState(false);
  const secret = field.type === 'secret';
  const save = useMutation({
    mutationFn: () =>
      api<Record<string, unknown>>(ADMIN_ENDPOINTS.settings.byKey(field.key), {
        method: 'PUT',
        body: { value: field.type === 'number' ? Number(v) : v.trim() },
      }),
    onSuccess: all => {
      qc.setQueryData(['admin', 'settings'], all);
      toast.success(`${field.label} saved`);
    },
  });
  const dirty = v !== initial;
  const n = Number(v);
  const problem =
    field.type === 'number' && v !== ''
      ? field.integer && !Number.isInteger(n)
        ? 'Enter a whole number.'
        : field.min !== undefined && n < field.min
          ? `At least ${field.min.toLocaleString()}.`
          : field.max !== undefined && n > field.max
            ? `At most ${field.max.toLocaleString()}.`
            : null
      : null;
  return (
    <div className="grid gap-2 pt-4 first:pt-0 sm:grid-cols-[1fr_16rem_auto] sm:items-center">
      <div>
        <label htmlFor={`set-${field.key}`} className="text-sm font-medium">
          {field.label}
        </label>
        <p className="text-xs text-muted-foreground">{field.hint}</p>
        {problem ? <p className="mt-1 text-xs font-medium text-deal">{problem}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={`set-${field.key}`}
          type={secret ? (reveal ? 'text' : 'password') : field.type}
          autoComplete={secret ? 'off' : undefined}
          className={secret ? 'font-mono' : undefined}
          step={field.type === 'number' ? 'any' : undefined}
          min={field.type === 'number' ? (field.min ?? 0) : undefined}
          max={field.max}
          aria-invalid={!!problem}
          value={v}
          disabled={!editable}
          onChange={e => setV(e.target.value)}
        />
        {secret ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={reveal ? 'Hide token' : 'Show token'}
            onClick={() => setReveal(!reveal)}
          >
            {reveal ? <EyeOff /> : <Eye />}
          </Button>
        ) : null}
        {field.suffix ? (
          <span className="text-sm whitespace-nowrap text-muted-foreground">{field.suffix}</span>
        ) : null}
      </div>
      {editable ? (
        <Button
          size="sm"
          variant={dirty ? 'default' : 'outline'}
          disabled={!dirty || save.isPending || v === '' || !!problem}
          onClick={() => save.mutate()}
        >
          <Save /> Save
        </Button>
      ) : null}
    </div>
  );
}
