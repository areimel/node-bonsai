/**
 * Configuration types, defaults, and CLI-flag mapping.
 *
 * This is the single source of truth for runtime options and their defaults
 * (see STYLEGUIDE.md §6). Other modules should import `Config`/`DEFAULTS` from
 * here rather than hard-coding values.
 */

/** The five branch states that drive movement, glyph, and color. */
export type BranchType = 'trunk' | 'shootLeft' | 'shootRight' | 'dying' | 'dead';

/** The five logical color roles from the original (see STYLEGUIDE.md §1). */
export type ColorPair = 'leafDark' | 'woodDark' | 'leafBright' | 'woodBright' | 'text';

/** Fully-resolved runtime configuration. */
export interface Config {
  live: boolean;
  infinite: boolean;
  screensaver: boolean;
  print: boolean;
  verbose: number;
  life: number;
  multiplier: number;
  base: number;
  /** 0 means "seed from the clock at runtime". */
  seed: number;
  /** Seconds between growth steps in live mode. */
  timeStep: number;
  /** Seconds between trees in infinite mode. */
  timeWait: number;
  message?: string;
  leaves: string[];
  /** [leafDark, woodDark, leafBright, woodBright] color indices (0-255). */
  colors: [number, number, number, number];
  save?: string;
  load?: string;
}

/** Default values, mirroring the original cbonsai (STYLEGUIDE.md §6). */
export const DEFAULTS = {
  life: 32,
  multiplier: 5,
  base: 1,
  timeStep: 0.03,
  timeWait: 4,
  leaves: ['&'] as string[],
  colors: [2, 3, 10, 11] as [number, number, number, number],
};

/** Names of the built-in color themes selectable via `--theme`. */
export type ThemeName = 'green' | 'cherry' | 'maple' | 'wisteria';

/**
 * Named color themes: each resolves to the same four index roles as `--colors`
 * ([leafDark, woodDark, leafBright, woodBright]). The new themes share a natural
 * brown trunk and only re-color the foliage. `text` stays hardcoded (colors.ts).
 * This is a divergence from cbonsai (which has no themes) — see README.md.
 */
export const THEMES: Record<ThemeName, [number, number, number, number]> = {
  green: DEFAULTS.colors, // unchanged default — cbonsai parity
  cherry: [175, 94, 218, 130], // Cherry Blossom Pink: rose + light pink, brown trunk
  maple: [124, 94, 202, 130], // Maple Red: dark red + orange-red, brown trunk
  wisteria: [97, 94, 183, 130], // Wisteria Purple: muted purple + lavender, brown trunk
};

/** Raw flags as produced by meow (all optional; booleans default to false). */
export interface CliFlags {
  live?: boolean;
  time?: number;
  infinite?: boolean;
  wait?: number;
  screensaver?: boolean;
  message?: string;
  base?: number;
  leaf?: string;
  colors?: string;
  theme?: string;
  multiplier?: number;
  life?: number;
  print?: boolean;
  seed?: number;
  save?: string;
  load?: string;
  verbose?: boolean;
}

/** Split a comma-separated leaf list, falling back to the default. */
function parseLeaves(input?: string): string[] {
  if (!input) return [...DEFAULTS.leaves];
  const list = input.split(',').filter((s) => s.length > 0);
  return list.length > 0 ? list : [...DEFAULTS.leaves];
}

/** Parse and validate the 4 comma-separated color indices. */
function parseColors(input?: string): [number, number, number, number] {
  if (!input) return [...DEFAULTS.colors] as [number, number, number, number];
  const parts = input.split(',').map((s) => Number.parseInt(s.trim(), 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    throw new Error(`Invalid --colors "${input}": expected 4 indices 0-255, e.g. 2,3,10,11`);
  }
  return parts as [number, number, number, number];
}

/**
 * Resolve the four color indices: an explicit `--colors` list wins; otherwise a
 * named `--theme` is looked up; otherwise the default (green) palette is used.
 */
function resolveColors(flags: CliFlags): [number, number, number, number] {
  if (flags.colors) return parseColors(flags.colors);
  if (flags.theme) {
    const theme = flags.theme.trim().toLowerCase();
    if (!(theme in THEMES)) {
      const names = Object.keys(THEMES).join(', ');
      throw new Error(`Invalid --theme "${flags.theme}": expected one of ${names}`);
    }
    return [...THEMES[theme as ThemeName]] as [number, number, number, number];
  }
  return [...DEFAULTS.colors] as [number, number, number, number];
}

/** Resolve raw CLI flags into a complete `Config`, applying defaults. */
export function flagsToConfig(flags: CliFlags = {}): Config {
  const screensaver = flags.screensaver ?? false;
  return {
    // screensaver mode implies both live and infinite (cbonsai.c:893-901)
    live: (flags.live ?? false) || screensaver,
    infinite: (flags.infinite ?? false) || screensaver,
    screensaver,
    print: flags.print ?? false,
    verbose: flags.verbose ? 1 : 0,
    life: flags.life ?? DEFAULTS.life,
    multiplier: flags.multiplier ?? DEFAULTS.multiplier,
    base: flags.base ?? DEFAULTS.base,
    seed: flags.seed ?? 0,
    timeStep: flags.time ?? DEFAULTS.timeStep,
    timeWait: flags.wait ?? DEFAULTS.timeWait,
    message: flags.message,
    leaves: parseLeaves(flags.leaf),
    colors: resolveColors(flags),
    save: flags.save,
    load: flags.load,
  };
}
