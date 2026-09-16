import { env } from '@/lib/env';

/**
 * The single place that knows how to talk to the CarCare API: base URL, bearer
 * token, JSON encoding, timeouts and error shape. Feature modules in this
 * folder describe *what* to call; nothing above them touches `fetch`.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Field-level messages from the API's validation pipe, when present. */
    readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Nothing the user can do about it; worth offering a retry. */
  get isServerError(): boolean {
    return this.status >= 500;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends NetworkError {
  constructor() {
    super('Request timed out');
    this.name = 'TimeoutError';
  }
}

type TokenProvider = () => Promise<string | null>;

let getAccessToken: TokenProvider = async () => null;
let onUnauthorized: (() => void) | null = null;

/**
 * Wired up once by the auth provider. Keeping it a setter rather than an import
 * avoids a cycle between the API client and the auth layer that depends on it.
 */
export function setAuthTokenProvider(provider: TokenProvider): void {
  getAccessToken = provider;
}

/** Called when the API rejects a token the client still believed in. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skips the Authorization header — used by the unauthenticated endpoints. */
  anonymous?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = env.apiBaseUrl.replace(/\/+$/, '');
  const url = `${base}/${path.replace(/^\/+/, '')}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.append(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/** Nest's exception filter returns `message` as either a string or a string[]. */
function readErrorBody(body: unknown, status: number): ApiError {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message: unknown };
    if (Array.isArray(message)) {
      const details = message.filter((item): item is string => typeof item === 'string');
      return new ApiError(status, details[0] ?? `Request failed (${status})`, details);
    }
    if (typeof message === 'string') {
      return new ApiError(status, message);
    }
  }
  return new ApiError(status, `Request failed (${status})`);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, anonymous = false, signal } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.apiTimeoutMs);
  // Let a caller-supplied signal (React Query cancellation) abort us too.
  const abortFromCaller = (): void => controller.abort();
  signal?.addEventListener('abort', abortFromCaller);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (!anonymous) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) throw new TimeoutError();
    throw new NetworkError(error instanceof Error ? error.message : undefined);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const parsed: unknown = text.length > 0 ? safeParseJson(text) : null;

  if (!response.ok) {
    const error = readErrorBody(parsed, response.status);
    if (error.isUnauthorized && !anonymous) onUnauthorized?.();
    throw error;
  }

  return parsed as T;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T = void>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
