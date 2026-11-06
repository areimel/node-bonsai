/**
 * Build the `bonsai ...` command line for a set of flags, emitting only values
 * that differ from the defaults. Browser-safe (no node:* imports).
 */
import { FLAG_DEFAULTS, type CliFlags } from './config.js';
import { FLAGS } from './flags.js';

/** Quote one word for a POSIX shell, only when it needs it. */
export function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value) && !value.startsWith('-')) return value;
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

/** --colors beats --theme, so the default colour list still matters when a theme is set. */
const overridesTheme = (flags: CliFlags, key: string) =>
  key === 'colors' && (flags.theme ?? FLAG_DEFAULTS.theme) !== FLAG_DEFAULTS.theme;

/** `bonsai <flags>`: only flags that differ from the defaults, in table order. */
export function flagsToCommand(flags: CliFlags): string {
  const parts = ['bonsai'];
  for (const key of Object.keys(FLAGS) as (keyof typeof FLAGS)[]) {
    const value = flags[key];
    if (value === undefined) continue;
    const short = `-${FLAGS[key].shortFlag}`;
    const fallback = (FLAG_DEFAULTS as Partial<Record<string, string | number>>)[key];
    if (typeof value === 'boolean') {
      if (value) parts.push(short);
    } else if (typeof value === 'number') {
      if (value !== fallback) parts.push(short, String(value));
    } else if (value !== '' && (value !== fallback || overridesTheme(flags, key))) {
      // Attached, or the parser would read a value like --save=x as a flag of its own.
      if (value.startsWith('-')) parts.push(`--${key}=${shellQuote(value)}`);
      else parts.push(short, shellQuote(value));
    }
  }
  return parts.join(' ');
}
