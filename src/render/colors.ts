/**
 * Color logic — the single place that maps the five color roles to chalk.
 *
 * All color decisions in the app should go through `makeColorizer` so the
 * palette stays consistent and configurable (STYLEGUIDE.md §1).
 */
import chalk, { type ChalkInstance } from 'chalk';
import type { ColorPair } from '../config.js';

/** A function that wraps a single character in the right ANSI color codes. */
export type Colorize = (pair: ColorPair, bold: boolean, char: string) => string;

/**
 * Build a colorizer bound to the four configurable wood/leaf indices.
 *
 * @param colors [leafDark, woodDark, leafBright, woodBright] (0-255)
 */
export function makeColorizer(colors: [number, number, number, number]): Colorize {
  const [leafDark, woodDark, leafBright, woodBright] = colors;
  const index: Record<ColorPair, number> = {
    leafDark,
    woodDark,
    leafBright,
    woodBright,
    text: 8, // matches the 256-color text pair (STYLEGUIDE.md §1.4)
  };

  return (pair, bold, char) => {
    let c: ChalkInstance = chalk.ansi256(index[pair]);
    if (bold) c = c.bold;
    return c(char);
  };
}
