/**
 * import.meta.env.BASE_URL is NOT guaranteed to end with a trailing slash
 * (it doesn't in production builds here, even though it does in dev) --
 * string-concatenating it directly with a path produced broken links like
 * "/SmartMCroadmap". Always go through this helper instead.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${base}/${cleanPath}`;
}
