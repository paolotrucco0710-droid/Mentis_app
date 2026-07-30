export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new ApiError(
      data.error ?? "Richiesta non riuscita.",
      data.code ?? "REQUEST_FAILED",
      response.status
    );
  }

  return data;
}
