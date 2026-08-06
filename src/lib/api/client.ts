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

async function refreshAccessToken(): Promise<boolean> {
  const response = await fetch("/api/v1/auth/refresh", {
    method: "POST",
  });

  return response.ok;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  options?: { retryOnUnauthorized?: boolean }
): Promise<T> {
  const headers = new Headers(init?.headers);
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    code?: string;
  };

  if (response.status === 413) {
    throw new ApiError(
      "File troppo grandi per l'upload. Prova con meno foto o immagini più piccole.",
      "PAYLOAD_TOO_LARGE",
      413
    );
  }

  if (
    response.status === 401 &&
    options?.retryOnUnauthorized !== false &&
    path !== "/api/v1/auth/refresh" &&
    path !== "/api/v1/auth/login"
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, init, { retryOnUnauthorized: false });
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data.error ?? "Richiesta non riuscita.",
      data.code ?? "REQUEST_FAILED",
      response.status
    );
  }

  return data;
}
