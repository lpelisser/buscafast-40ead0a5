export const API_URL = "https://buscafast-2-0.onrender.com";

const TOKEN_KEY = "bf_token";
export const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// "Acordando o servidor" store
let slow = false;
let pending = 0;
const listeners = new Set<(v: boolean) => void>();
const setSlow = (v: boolean) => {
  slow = v;
  listeners.forEach((l) => l(v));
};
export const subscribeSlow = (fn: (v: boolean) => void) => {
  listeners.add(fn);
  fn(slow);
  return () => listeners.delete(fn);
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  pending++;
  const timer = setTimeout(() => setSlow(true), 4000);
  try {
    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : null,
      });
    } catch {
      throw new ApiError(0, "O servidor não respondeu ou teve um erro interno. Tente novamente em instantes.");
    }
    if (res.status === 401 && token) {
      clearToken();
      if (!location.pathname.startsWith("/login")) location.href = "/login";
      throw new ApiError(401, "Sua sessão terminou. Entre novamente.");
    }
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      let msg = "Ocorreu um erro. Tente novamente.";
      if (data?.detail) {
        msg = typeof data.detail === "string"
          ? data.detail
          : Array.isArray(data.detail)
            ? data.detail.map((d: any) => d.msg ?? String(d)).join(". ")
            : msg;
      }
      throw new ApiError(res.status, msg);
    }
    return data as T;
  } finally {
    clearTimeout(timer);
    pending--;
    if (pending <= 0) { pending = 0; setSlow(false); }
  }
}

export type Image = { url: string; position: number };
export type Product = {
  id: number; title: string; description: string; price: number;
  outlet_link: string; seller_id: number; category_id: number;
  images: Image[]; created_at: string;
};
export type Category = { id: number; name: string; icon: string };
export type Comment = { id: number; user_id: number; content: string; created_at: string };
export type Me = { id: number; username: string; full_name: string; email: string; is_verified_seller?: boolean };
