const R2_BASE = (import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');

// Tracks are hosted on Cloudflare R2; falls back to the bare filename
// (resolved against public/) when no R2 base URL is configured.
export function trackUrl(filename) {
  return R2_BASE ? `${R2_BASE}/${filename}` : filename;
}
