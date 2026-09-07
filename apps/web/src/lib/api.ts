const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
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
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (response.status === 204) return undefined as T;
  const result = (await response.json()) as {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
  };
  if (!response.ok || !result.success)
    throw new ApiError(
      result.error?.code ?? 'REQUEST_FAILED',
      result.error?.message ?? 'Diçka shkoi keq.',
    );
  return result.data as T;
}

export async function uploadBusinessImage(
  file: File,
  tenantId: string,
): Promise<{ image: { id: string; url: string; alt: string | null } }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new ApiError('INVALID_IMAGE', 'Zgjidhni një foto JPG, PNG ose WebP.');
  if (file.size > 5 * 1024 * 1024)
    throw new ApiError('IMAGE_TOO_LARGE', 'Fotoja duhet të jetë maksimumi 5 MB.');
  const response = await fetch(`${baseUrl}/business/images`, {
    method: 'POST',
    headers: { 'Content-Type': file.type, 'x-business-id': tenantId },
    body: file,
    credentials: 'include',
  });
  const result = (await response.json()) as {
    success: boolean;
    data?: { image: { id: string; url: string; alt: string | null } };
    error?: { code: string; message: string };
  };
  if (!response.ok || !result.success || !result.data)
    throw new ApiError(
      result.error?.code ?? 'UPLOAD_FAILED',
      result.error?.message ?? 'Fotoja nuk u ngarkua.',
    );
  return result.data;
}
