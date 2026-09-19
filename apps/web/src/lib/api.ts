const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

// Bound network waits, including response-body reads. Never retry mutations automatically.
async function request<T>(path: string, options: RequestInit): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, 60_000);
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...options, signal: controller.signal, credentials: 'include' });
    if (response.status === 204) return undefined as T;
    const result = await response.json().catch(() => null) as { success?: boolean; data?: T; error?: { code?: string; message?: string } } | null;
    if (!response.ok || !result?.success) throw new ApiError(result?.error?.code ?? 'REQUEST_FAILED', result?.error?.message ?? 'Shërbimi nuk është i disponueshëm tani. Provoni përsëri pas pak.', response.status);
    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError('REQUEST_TIMEOUT', 'Kërkesa zgjati shumë. Kontrolloni nëse veprimi u krye para se ta përsërisni.');
    throw new ApiError('NETWORK_ERROR', 'Nuk mund të lidhemi me serverin. Kontrolloni internetin dhe provoni përsëri.');
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  tenantId?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (tenantId) headers.set('x-business-id', tenantId);
  return request<T>(path, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export async function uploadBusinessImage(
  file: File,
  tenantId: string,
): Promise<{ image: { id: string; url: string; alt: string | null } }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new ApiError('INVALID_IMAGE', 'Zgjidhni një foto JPG, PNG ose WebP.');
  if (file.size > 5 * 1024 * 1024)
    throw new ApiError('IMAGE_TOO_LARGE', 'Fotoja duhet të jetë maksimumi 5 MB.');
  return request('/business/images', {
    method: 'POST',
    headers: { 'Content-Type': file.type, 'x-business-id': tenantId },
    body: file,
    credentials: 'include',
  });
}
