/** The only way to build an internal link or asset path (respects the base). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const clean = path.replace(/^\/+/, '');
  if (!clean) return `${base}/`;
  const last = clean.split('/').pop() ?? '';
  const isFile = last.includes('.') || clean.includes('?') || clean.includes('#');
  return `${base}/${clean}${isFile || clean.endsWith('/') ? '' : '/'}`;
}
