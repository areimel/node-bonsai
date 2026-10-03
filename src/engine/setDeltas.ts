/**
 * Per-step movement (dx/dy) for a branch. Faithful port of cbonsai `setDeltas()`
 * (cbonsai.c:289-377); dice tables documented in ALGORITHM.md §3.
 *
 * RNG-order note: each case draws its rolls in the SAME order as the C source
 * (vertical roll before horizontal for shoots/dying/dead), because the whole
 * engine shares one PRNG stream and order determines the tree.
 */
import type { BranchType } from '../config.js';
import { randInt } from './rng.js';

export interface Deltas {
  dx: number;
  dy: number;
}

export function setDeltas(
  type: BranchType,
  life: number,
  age: number,
  multiplier: number,
  rng: () => number,
): Deltas {
  let dx = 0;
  let dy = 0;
  let dice: number;

  switch (type) {
    case 'trunk':
      // new or dead trunk (cbonsai.c:297)
      if (age <= 2 || life < 4) {
        dy = 0;
        dx = randInt(rng, 3) - 1;
      }
      // young trunk grows wide (cbonsai.c:302)
      else if (age < multiplier * 3) {
        // every (multiplier * 0.5) steps, raise to the next level (cbonsai.c:305)
        const step = Math.trunc(multiplier * 0.5) || 1;
        dy = age % step === 0 ? -1 : 0;

        dice = randInt(rng, 10);
        if (dice === 0) dx = -2;
        else if (dice <= 3) dx = -1;
        else if (dice <= 5) dx = 0;
        else if (dice <= 8) dx = 1;
        else dx = 2;
      }
      // middle-aged trunk (cbonsai.c:316)
      else {
        dice = randInt(rng, 10);
        dy = dice > 2 ? -1 : 0;
        dx = randInt(rng, 3) - 1;
      }
      break;

    case 'shootLeft': // trend left, little vertical movement (cbonsai.c:324)
      dice = randInt(rng, 10);
      if (dice <= 1) dy = -1;
      else if (dice <= 7) dy = 0;
      else dy = 1;

      dice = randInt(rng, 10);
      if (dice <= 1) dx = -2;
      else if (dice <= 5) dx = -1;
      else if (dice <= 8) dx = 0;
      else dx = 1;
      break;

    case 'shootRight': // trend right, little vertical movement (cbonsai.c:337)
      dice = randInt(rng, 10);
      if (dice <= 1) dy = -1;
      else if (dice <= 7) dy = 0;
      else dy = 1;

      dice = randInt(rng, 10);
      if (dice <= 1) dx = 2;
      else if (dice <= 5) dx = 1;
      else if (dice <= 8) dx = 0;
      else dx = -1;
      break;

    case 'dying': // discourage vertical, spread left/right (-3..3) (cbonsai.c:350)
      dice = randInt(rng, 10);
      if (dice <= 1) dy = -1;
      else if (dice <= 8) dy = 0;
      else dy = 1;

      dice = randInt(rng, 15);
      if (dice === 0) dx = -3;
      else if (dice <= 2) dx = -2;
      else if (dice <= 5) dx = -1;
      else if (dice <= 8) dx = 0;
      else if (dice <= 11) dx = 1;
      else if (dice <= 13) dx = 2;
      else dx = 3;
      break;

    case 'dead': // fill in surrounding area (cbonsai.c:366)
      dice = randInt(rng, 10);
      if (dice <= 2) dy = -1;
      else if (dice <= 6) dy = 0;
      else dy = 1;
      dx = randInt(rng, 3) - 1;
      break;
  }

  return { dx, dy };
}
