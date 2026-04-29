export const API_BASE = "http://localhost:5000";

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("churnel_email");
}

export function getEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("churnel_email");
}

export function logout() {
  if (typeof window !== "undefined") localStorage.removeItem("churnel_email");
}
