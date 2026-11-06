'use client';

import { useQuery } from '@tanstack/react-query';
import { Field, NativeSelect } from '@/components/shared/FormBits';
import { api } from '@/utils/api/api';
import { useAllRows } from '@/app/(protected)/admin/utils/hooks';
import type { GeoOption, GeoRow } from '@/app/(protected)/admin/utils/types';
import { ADMIN_ENDPOINTS } from '@/utils/endpoints/admin.endpoints';

/** Selected ids as strings ("" = nothing chosen), so they bind straight to <select> values. */
export interface LocationValue {
  divisionId: string;
  districtId: string;
  areaId: string;
  subAreaId: string;
}

export const EMPTY_LOCATION: LocationValue = {
  divisionId: '',
  districtId: '',
  areaId: '',
  subAreaId: '',
};

type Level = keyof LocationValue;

const LEVELS: { key: Level; label: string; path: string; parent?: Level; param?: string }[] = [
  { key: 'divisionId', label: 'Division', path: 'divisions' },
  {
    key: 'districtId',
    label: 'District',
    path: 'districts',
    parent: 'divisionId',
    param: 'divisionId',
  },
  { key: 'areaId', label: 'Area', path: 'areas', parent: 'districtId', param: 'districtId' },
  { key: 'subAreaId', label: 'Sub-area', path: 'sub-areas', parent: 'areaId', param: 'areaId' },
];

/**
 * Cascading Division → District → Area → Sub-area selects.
 * `depth` is how many levels to show, `required` how many of them must be chosen.
 * `source="public"` lists only visible places (what customers see); `"admin"` also lists hidden ones.
 */
export function LocationSelects({
  value,
  onChange,
  depth = 4,
  required = 0,
  source = 'public',
  idPrefix = 'loc',
  emptyText,
  className,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  depth?: number;
  required?: number;
  source?: 'public' | 'admin';
  idPrefix?: string;
  /** Text of the empty option for levels that are not required (default: "Any <level>"). */
  emptyText?: string;
  className?: string;
}) {
  return (
    <div className={className ?? 'grid gap-4 sm:grid-cols-2'}>
      {LEVELS.slice(0, depth).map((level, i) => (
        <LevelSelect
          key={level.key}
          level={level}
          index={i}
          value={value}
          required={i < required}
          source={source}
          idPrefix={idPrefix}
          emptyText={emptyText}
          onPick={id => {
            // Choosing a parent clears everything below it.
            const next = { ...value, [level.key]: id };
            for (const lower of LEVELS.slice(i + 1)) next[lower.key] = '';
            onChange(next);
          }}
        />
      ))}
    </div>
  );
}

function LevelSelect({
  level,
  index,
  value,
  required,
  source,
  idPrefix,
  emptyText,
  onPick,
}: {
  level: (typeof LEVELS)[number];
  index: number;
  value: LocationValue;
  required: boolean;
  source: 'public' | 'admin';
  idPrefix: string;
  emptyText?: string;
  onPick: (id: string) => void;
}) {
  const parentId = level.parent ? value[level.parent] : '';
  const blocked = index > 0 && !parentId;
  const parentQuery = level.param && parentId ? { [level.param]: parentId } : {};
  // What customers see: the small unpaged public lists (visible places only).
  const visible = useQuery({
    queryKey: ['geo', 'public', level.path, parentId],
    enabled: !blocked && source === 'public',
    staleTime: 60_000,
    queryFn: () =>
      api<GeoOption[]>(
        ADMIN_ENDPOINTS.shared.geo.list(
          level.path,
          level.param && parentId ? `?${level.param}=${parentId}` : ''
        )
      ),
  });
  // Admin view, hidden places included: the cursor-paged admin list, read to its end.
  const all = useAllRows<GeoRow>(
    ['geo', 'admin', level.path, parentId],
    ADMIN_ENDPOINTS.geo.list(level.path),
    parentQuery,
    !blocked && source === 'admin'
  );
  const options =
    source === 'public'
      ? { data: visible.data, isLoading: visible.isLoading }
      : { data: all.data, isLoading: all.isLoading };
  const id = `${idPrefix}-${level.key}`;
  return (
    <Field label={level.label} htmlFor={id}>
      <NativeSelect
        id={id}
        required={required}
        disabled={blocked}
        value={value[level.key]}
        onChange={e => onPick(e.target.value)}
      >
        <option value="">
          {blocked
            ? `Choose ${LEVELS[index - 1].label.toLowerCase()} first`
            : options.isLoading
              ? 'Loading…'
              : required
                ? `Choose ${level.label.toLowerCase()}`
                : (emptyText ?? `Any ${level.label.toLowerCase()}`)}
        </option>
        {options.data?.map(o => (
          <option key={o.id} value={o.id}>
            {o.nameEn}
            {o.nameBn ? ` · ${o.nameBn}` : ''}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}
