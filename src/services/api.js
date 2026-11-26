const API_ROOT = String(import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export async function api(path, options = {}) {
  const token = localStorage.getItem("queuecare-token");
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_ROOT}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") localStorage.removeItem("queuecare-token");
    throw new Error(payload.message || "Something went wrong. Please try again.");
  }
  return payload;
}

export const get = (path) => api(path);
export const post = (path, data) => api(path, { method: "POST", body: JSON.stringify(data) });
export const put = (path, data) => api(path, { method: "PUT", body: JSON.stringify(data) });
export const patch = (path, data) => api(path, { method: "PATCH", body: JSON.stringify(data) });
export const remove = (path) => api(path, { method: "DELETE" });
