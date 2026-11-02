/**
 * Build the `bonsai ...` command line for a set of flags, emitting only values
 * that differ from the defaults. Browser-safe (no node:* imports).
 */
import { DEFAULTS, type CliFlags } from './config.js';
import { FLAGS } from './flags.js';

/** Numeric flags and the default each is compared with. */
const NUMBER_DEFAULTS: Partial<Record<keyof CliFlags, number>> = {
  time: DEFAULTS.timeStep,
  wait: DEFAULTS.timeWait,
  base: DEFAULTS.base,
  multiplier: DEFAULTS.multiplier,
  life: DEFAULTS.life,
  seed: 0,
};

/** String flags and the default each is compared with. */
const STRING_DEFAULTS: Partial<Record<keyof CliFlags, string>> = {
  leaf: DEFAULTS.leaves.join(','),
  colors: DEFAULTS.colors.join(','),
  theme: 'green',
};

/** Quote one word for a POSIX shell, only when it needs it. */
export function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value) && !value.startsWith('-')) return value;
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

/** `bonsai <flags>`: only flags that differ from the defaults, in table order. */
export function flagsToCommand(flags: CliFlags): string {
  const parts = ['bonsai'];
  for (const key of Object.keys(FLAGS) as (keyof typeof FLAGS)[]) {
    const value = flags[key];
    if (value === undefined) continue;
    const short = `-${FLAGS[key].shortFlag}`;
    if (typeof value === 'boolean') {
      if (value) parts.push(short);
    } else if (typeof value === 'number') {
      if (value !== (NUMBER_DEFAULTS[key] ?? NaN)) parts.push(short, String(value));
    } else if (value !== '' && value !== STRING_DEFAULTS[key]) {
      parts.push(short, shellQuote(value));
    }
  }
  return parts.join(' ');
}
