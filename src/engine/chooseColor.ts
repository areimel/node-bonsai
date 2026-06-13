/**
 * Color/weight selection for a branch step. Faithful port of cbonsai
 * `chooseColor()` (cbonsai.c:267-286); probabilities in STYLEGUIDE.md §1 /
 * ALGORITHM.md §5.
 *
 * Maps the C COLOR_PAIR macros onto our logical roles:
 *   - trunk / shoots : 50% bold woodBright, else woodDark
 *   - dying          : 10% bold leafBright, else leafBright
 *   - dead           : 33% bold leafDark,  else leafDark
 *
 * Called with the ORIGINAL branch type (not the chooseString `life < 4`
 * override) — so a near-dead trunk draws a leaf GLYPH in WOOD color, exactly as
 * the original does. Draws one PRNG value (the bold roll); order matters.
 */
import type { BranchType, ColorPair } from '../config.js';
import { randInt } from './rng.js';

export interface ColorChoice {
  pair: ColorPair;
  bold: boolean;
}

export function chooseColor(type: BranchType, rng: () => number): ColorChoice {
  switch (type) {
    case 'trunk':
    case 'shootLeft':
    case 'shootRight':
      return randInt(rng, 2) === 0
        ? { pair: 'woodBright', bold: true }
        : { pair: 'woodDark', bold: false };
    case 'dying':
      return randInt(rng, 10) === 0
        ? { pair: 'leafBright', bold: true }
        : { pair: 'leafBright', bold: false };
    case 'dead':
      return randInt(rng, 3) === 0
        ? { pair: 'leafDark', bold: true }
        : { pair: 'leafDark', bold: false };
  }
}
