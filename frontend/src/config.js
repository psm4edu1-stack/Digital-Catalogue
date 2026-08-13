// Centralized API configuration.
//
// In production the frontend and API are served from the SAME origin by the
// Node app (Hostinger / Phusion Passenger), so API_BASE is an empty string and
// requests resolve to the same host (e.g. "/api/products").
//
// In development the Vite dev server (default port 5173) must reach the backend
// on port 5000, so VITE_API_BASE is set to http://localhost:5000 in
// .env.development. Override either by setting VITE_API_BASE at build time.

export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// Build an absolute or same-origin API path, e.g. apiUrl("/api/products")
export const apiUrl = (p) => `${API_BASE}${p}`;

// Resolve a media/upload URL returned by the backend (e.g. "/uploads/x.png").
// Leaves absolute URLs (http/https/data) untouched; prefixes relative ones with API_BASE.
export const mediaUrl = (url) => {
  if (url == null) return url;
  if (typeof url !== "string") return url;
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url;
  return `${API_BASE}${url}`;
};
