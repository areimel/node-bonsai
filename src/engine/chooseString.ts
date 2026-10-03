/**
 * Glyph selection for a branch step. Faithful port of cbonsai `chooseString()`
 * (cbonsai.c:379-417); table in STYLEGUIDE.md §2 / ALGORITHM.md §4.
 *
 * Note the `life < 4` override: a near-dead branch of ANY type renders as a leaf.
 * The leaf case draws one value from the shared PRNG (the random leaf pick), so
 * this must be called in the same order as the C source — after chooseColor.
 */
import type { BranchType } from '../config.js';
import { randInt } from './rng.js';

export function chooseString(
  type: BranchType,
  life: number,
  dx: number,
  dy: number,
  leaves: string[],
  rng: () => number,
): string {
  // near-dead branches of any type become leaves (cbonsai.c:387)
  if (life < 4) type = 'dying';

  switch (type) {
    case 'trunk':
      if (dy === 0) return '/~';
      if (dx < 0) return '\\|';
      if (dx === 0) return '/|\\';
      return '|/';
    case 'shootLeft':
      if (dy > 0) return '\\';
      if (dy === 0) return '\\_';
      if (dx < 0) return '\\|';
      if (dx === 0) return '/|';
      return '/';
    case 'shootRight':
      if (dy > 0) return '/';
      if (dy === 0) return '_/';
      if (dx < 0) return '\\|';
      if (dx === 0) return '/|';
      return '/';
    case 'dying':
    case 'dead':
      // random leaf (cbonsai.c:412); '?' fallback if somehow empty
      return leaves[randInt(rng, leaves.length)] ?? '?';
  }
}
