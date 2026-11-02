/**
 * Playground defaults, ranges, and the `?seed=42&theme=cherry` helpers.
 * Browser-safe and free of React and ink, so Astro pages can import it
 * (the Examples page builds its "Try it" links with `flagsToQuery`).
 */
import { FLAG_DEFAULTS, THEMES, type CliFlags } from '../../../src/config.js';

/** Slider and field limits, shared by the controls and the query-string clamp. */
export const RANGES = {
  // Below the CLI's documented 200: tree size grows exponentially, and 100 can run out of memory.
  life: { min: 0, max: 80, step: 1 },
  multiplier: { min: 0, max: 20, step: 1 },
  time: { min: 0.01, max: 0.2, step: 0.01 },
  wait: { min: 0, max: 20, step: 1 },
  base: { min: 0, max: 2, step: 1 },
} as const;
export const MAX_TEXT = { leaf: 24, message: 140, colors: 24 } as const;

/** Backstop for rare runaway trees, so a seed can't freeze the tab. */
export const MAX_STEPS = 200_000;

/** The tree the page starts with (and the one the static HTML shows). */
export const START_FLAGS: CliFlags = { seed: 42, theme: 'cherry' };

/** The playground always runs live and looping; this is what the command shows. */
export function commandFlags(flags: CliFlags, screensaver: boolean): CliFlags {
  return screensaver ? { ...flags, screensaver: true } : { ...flags, live: true, infinite: true };
}

/** Links can carry anything; control characters could reach the terminal or a copied command. */
const cleanText = (text: string) => text.replace(/[\p{Cc}\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu, '');

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

type Param = [name: keyof typeof RANGES | 'seed', integer: boolean];
const NUMBER_PARAMS: Param[] = [
  ['seed', true], ['life', true], ['multiplier', true], ['base', true], ['time', false], ['wait', true],
];

/**
 * Flags from a query string. Unknown or invalid values are ignored; numbers are
 * clamped. Anything the query leaves out takes the CLI default, so a link means
 * the same as its command; a URL with none of these settings gets the START_FLAGS tree.
 */
export function flagsFromQuery(search: string): { flags: CliFlags; screensaver: boolean } {
  const q = new URLSearchParams(search);
  const known = [...NUMBER_PARAMS.map(([name]) => name), 'theme', 'leaf', 'message', 'colors'];
  const flags: CliFlags = known.some((name) => q.has(name)) ? {} : { ...START_FLAGS };
  for (const [name, integer] of NUMBER_PARAMS) {
    const raw = q.get(name);
    if (raw === null || raw.trim() === '' || !Number.isFinite(Number(raw))) continue;
    const range = name === 'seed' ? { min: 0, max: 999999 } : RANGES[name];
    let n = clamp(Number(raw), range.min, range.max);
    n = integer ? Math.round(n) : Math.round(n * 100) / 100;
    flags[name] = n;
  }
  const theme = q.get('theme')?.trim().toLowerCase();
  if (theme && Object.hasOwn(THEMES, theme)) flags.theme = theme;
  const leaf = cleanText(q.get('leaf') ?? '').slice(0, MAX_TEXT.leaf);
  if (leaf) flags.leaf = leaf;
  const message = cleanText(q.get('message') ?? '').slice(0, MAX_TEXT.message);
  if (message) flags.message = message;
  const colors = q.get('colors') ?? '';
  if (/^\d{1,3}(,\d{1,3}){3}$/.test(colors) && colors.split(',').every((n) => Number(n) <= 255)) flags.colors = colors;
  return { flags, screensaver: q.get('screensaver') === '1' || q.get('screensaver') === 'true' };
}

/** `?seed=...` for flags that differ from the defaults ('' if none). */
export function flagsToQuery(flags: CliFlags): string {
  const q = new URLSearchParams();
  for (const name of ['seed', 'theme', 'base', 'life', 'multiplier', 'time', 'wait', 'leaf', 'message', 'colors'] as const) {
    const value = flags[name];
    if (value !== undefined && value !== '' && value !== (FLAG_DEFAULTS as Record<string, unknown>)[name]) q.set(name, String(value));
  }
  if (flags.screensaver) q.set('screensaver', '1');
  const text = q.toString();
  return text ? `?${text}` : '';
}
