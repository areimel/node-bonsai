/**
 * Tree growth — the recursive core. Faithful port of cbonsai `growTree()` /
 * `branch()` (cbonsai.c:419-513, 697-716); spawn rules in ALGORITHM.md §6.
 *
 * Instead of drawing into an ncurses window, this emits an ordered "growth tape"
 * (`Step[]`) in draw order — one Step per character. Static/print fold the whole
 * tape; --live reveals it a tick at a time. The recursion order *is* the
 * animation order, so it is preserved exactly, as is the RNG call order (the
 * single shared PRNG is what makes a seed reproducible).
 */
import type { BranchType, Config } from '../config.js';
import type { GrowthResult, Step } from './types.js';
import { makeRng, randInt, resolveSeed } from './rng.js';
import { setDeltas } from './setDeltas.js';
import { chooseColor } from './chooseColor.js';
import { chooseString } from './chooseString.js';

/** Mutable state threaded through the recursion (mirrors the C structs). */
interface GrowthContext {
  width: number;
  height: number;
  multiplier: number;
  lifeStart: number;
  leaves: string[];
  rng: () => number;
  steps: Step[];
  /** Step-prefix length after each branch-loop iteration (live cadence). */
  tickStops: number[];
  /** Step-prefix length at each branch() entry (for --load fast-forward). */
  branchStops: number[];
  counters: { branches: number; shoots: number; shootCounter: number };
}

/** Display width of a code point — 1 for ASCII, 2 for common wide ranges. */
function charWidth(ch: string): number {
  const cp = ch.codePointAt(0) ?? 0;
  if (
    (cp >= 0x1100 && cp <= 0x115f) || // Hangul Jamo
    (cp >= 0x2e80 && cp <= 0xa4cf) || // CJK & radicals
    (cp >= 0xac00 && cp <= 0xd7a3) || // Hangul syllables
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK compatibility
    (cp >= 0xfe30 && cp <= 0xfe4f) || // CJK compatibility forms
    (cp >= 0xff00 && cp <= 0xff60) || // fullwidth forms
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1fbff) // emoji & symbols
  ) {
    return 2;
  }
  return 1;
}

/**
 * Emit one Step per character of `glyph`, starting at column x. Mirrors cbonsai's
 * `mvwprintw(win, y, x, str)` plus the `x % wcwidth == 0` overlap guard
 * (cbonsai.c:502): a wide glyph is only drawn when x aligns to its width.
 */
function drawGlyph(
  ctx: GrowthContext,
  x: number,
  y: number,
  glyph: string,
  pair: Step['pair'],
  bold: boolean,
): void {
  const chars = [...glyph];
  const firstWidth = charWidth(chars[0] ?? ' ');
  if (firstWidth > 0 && x % firstWidth !== 0) return; // overlap guard
  let col = x;
  for (const ch of chars) {
    ctx.steps.push({ x: col, y, char: ch, pair, bold });
    col += charWidth(ch);
  }
}

/** The recursive walk. Port of cbonsai `branch()` (cbonsai.c:419-513). */
function branch(ctx: GrowthContext, y: number, x: number, type: BranchType, life: number): void {
  ctx.counters.branches++;
  ctx.branchStops.push(ctx.steps.length);
  let shootCooldown = ctx.multiplier;

  while (life > 0) {
    life--; // decrement remaining life
    const age = ctx.lifeStart - life;

    let { dx, dy } = setDeltas(type, life, age, ctx.multiplier, ctx.rng);

    // reduce dy if too close to the ground (cbonsai.c:436)
    if (dy > 0 && y > ctx.height - 2) dy--;

    // --- child spawning (cbonsai.c:439-477); children draw before this cell ---
    if (life < 3) {
      // near-dead branch bursts into leaves
      branch(ctx, y, x, 'dead', life);
    } else if (type === 'trunk' && life < ctx.multiplier + 2) {
      // dying trunk bursts into leaves
      branch(ctx, y, x, 'dying', life);
    } else if (
      (type === 'shootLeft' || type === 'shootRight') &&
      life < ctx.multiplier + 2
    ) {
      // dying shoot bursts into leaves
      branch(ctx, y, x, 'dying', life);
    } else if (type === 'trunk' && (randInt(ctx.rng, 3) === 0 || life % ctx.multiplier === 0)) {
      // trunk re-branches: occasionally a new trunk, otherwise a shoot
      if (randInt(ctx.rng, 8) === 0 && life > 7) {
        shootCooldown = ctx.multiplier * 2;
        branch(ctx, y, x, 'trunk', life + (randInt(ctx.rng, 5) - 2));
      } else if (shootCooldown <= 0) {
        shootCooldown = ctx.multiplier * 2;
        const shootLife = life + ctx.multiplier;
        ctx.counters.shoots++;
        ctx.counters.shootCounter++;
        // alternate shoot direction: 1 = left, 2 = right (cbonsai.c:475)
        const dir = (ctx.counters.shootCounter % 2) + 1;
        const shootType: BranchType = dir === 1 ? 'shootLeft' : 'shootRight';
        branch(ctx, y, x, shootType, shootLife);
      }
    }
    shootCooldown--;

    // move, then choose color + glyph and draw this cell (cbonsai.c:488-503)
    x += dx;
    y += dy;

    const { pair, bold } = chooseColor(type, ctx.rng);
    const glyph = chooseString(type, life, dx, dy, ctx.leaves, ctx.rng);
    drawGlyph(ctx, x, y, glyph, pair, bold);

    // one frame per iteration (matches one updateScreen() call in live mode)
    ctx.tickStops.push(ctx.steps.length);
  }
}

/**
 * Grow one tree into a step tape. `height` is the TREE region height (the pot is
 * composited below it by the caller); the trunk seeds at bottom-center
 * (cbonsai.c:711). Deterministic for `config.seed` (0 ⇒ clock-derived, returned
 * in the result for --save).
 */
export function growTree(config: Config, width: number, height: number): GrowthResult {
  const seed = resolveSeed(config.seed);
  const rng = makeRng(seed);

  const ctx: GrowthContext = {
    width,
    height,
    multiplier: config.multiplier,
    lifeStart: config.life,
    leaves: config.leaves,
    rng,
    steps: [],
    tickStops: [],
    branchStops: [],
    // shootCounter seeded pseudo-randomly — the first RNG draw (cbonsai.c:704)
    counters: { branches: 0, shoots: 0, shootCounter: randInt(rng, 0x7fffffff) },
  };

  branch(ctx, height - 1, Math.floor(width / 2), 'trunk', config.life);

  return {
    steps: ctx.steps,
    width,
    height,
    branchCount: ctx.counters.branches,
    seed,
    tickStops: ctx.tickStops,
    branchStops: ctx.branchStops,
  };
}
