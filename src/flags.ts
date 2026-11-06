/**
 * The CLI flag table, shared by the CLI (meow) and the website.
 * Browser-safe: plain data only, no `node:*` and no meow import.
 */
export const FLAGS = {
  live: { type: 'boolean', shortFlag: 'l' },
  time: { type: 'number', shortFlag: 't' },
  infinite: { type: 'boolean', shortFlag: 'i' },
  wait: { type: 'number', shortFlag: 'w' },
  screensaver: { type: 'boolean', shortFlag: 'S' },
  message: { type: 'string', shortFlag: 'm' },
  base: { type: 'number', shortFlag: 'b' },
  leaf: { type: 'string', shortFlag: 'c' },
  colors: { type: 'string', shortFlag: 'k' },
  theme: { type: 'string', shortFlag: 'T' },
  multiplier: { type: 'number', shortFlag: 'M' },
  life: { type: 'number', shortFlag: 'L' },
  print: { type: 'boolean', shortFlag: 'p' },
  seed: { type: 'number', shortFlag: 's' },
  save: { type: 'string', shortFlag: 'W' },
  load: { type: 'string', shortFlag: 'C' },
  verbose: { type: 'boolean', shortFlag: 'v' },
} as const;
