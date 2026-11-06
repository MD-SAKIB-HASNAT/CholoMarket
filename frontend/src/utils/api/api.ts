export const API_URL =
  typeof window === 'undefined'
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api')
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api');

export const TOKEN_KEY = 'cm_token';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>;

export function qs(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  token?: string | null;
  /** Next.js fetch cache hints for server components. */
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
}

/** Typed fetch wrapper for the NestJS API. Throws ApiError with the server's message. */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = opts.token !== undefined ? opts.token : getToken();
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}${qs(opts.query)}`, {
    method: opts.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(opts.body !== undefined && !isForm && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body:
      opts.body === undefined
        ? undefined
        : isForm
          ? (opts.body as FormData)
          : JSON.stringify(opts.body),
    ...(opts.next && { next: opts.next }),
    ...(opts.cache && { cache: opts.cache }),
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const raw = (data as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(raw) ? raw[0] : (raw ?? res.statusText ?? 'Something went wrong');
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cm:unauthorized'));
    }
    throw new ApiError(message, res.status);
  }
  return unwrap(data) as T;
}

/** Every API answer is `{ success, statusCode, message, data }`; callers only want `data`. */
function unwrap(body: unknown): unknown {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as { data: unknown }).data;
  }
  return body;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Server-component fetch for public catalogue data. Returns null on 404 instead of throwing. */
export async function serverApi<T>(path: string, query?: Query): Promise<T | null> {
  try {
    return await api<T>(path, { query, token: null, cache: 'no-store' });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
