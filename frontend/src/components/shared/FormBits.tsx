'use client';

/* eslint-disable @next/next/no-img-element */
import { ImagePlus, LoaderCircle, Minus, Plus, X } from 'lucide-react';
import { useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { api } from '@/utils/api/api';
import { cn } from '@/utils/helpers/cn';
import { STORE_ENDPOINTS } from '@/utils/endpoints/store.endpoints';

/** Styled native select: reliable on phones and simple to wire into forms. */
export function NativeSelect({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Decrease"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </Button>
      <span className="w-8 text-center text-sm tabular-nums">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Increase"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}

/** Uploads to /uploads/image and returns the public URL. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await api<{ url: string }>(STORE_ENDPOINTS.uploads.image, {
    method: 'POST',
    body: form,
  });
  return res.url;
}

export function ImageUploader({
  value,
  onChange,
  max = 6,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, max - value.length))
        urls.push(await uploadImage(file));
      onChange([...value, ...urls]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {value.map((url, i) => (
        <div key={url} className="group relative size-20 overflow-hidden rounded-lg border">
          <img src={url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(value.filter(u => u !== url))}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
            aria-label="Remove photo"
          >
            <X className="size-3" />
          </button>
          {i === 0 ? (
            <span className="absolute bottom-0 inset-x-0 bg-black/50 text-center text-[10px] text-white">
              Cover
            </span>
          ) : null}
        </div>
      ))}
      {value.length < max ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:bg-muted"
        >
          {busy ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          {busy ? 'Uploading' : 'Add photo'}
        </button>
      ) : null}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={e => onFiles(e.target.files)}
      />
    </div>
  );
}
