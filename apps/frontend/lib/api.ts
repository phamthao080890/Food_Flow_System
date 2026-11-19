// Keep local browser requests on the same origin. Next.js proxies /api to the
// backend, which also works when the UI is opened through 127.0.0.1 or a LAN IP.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = response.status === 204
    ? null
    : contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() || `Request failed (${response.status})` };
  if (!response.ok) throw new Error(body?.message ?? "Request failed");
  return body as T;
}

export { API_URL };
