/**
 * The one seeded PRNG that drives the whole engine.
 *
 * cbonsai relies on C's srand()/rand(); we deliberately do NOT reproduce glibc's
 * stream byte-for-byte (see ALGORITHM.md). Instead we use mulberry32 — a fast,
 * well-distributed 32-bit seeded generator — so a given --seed produces the same
 * tree across node-bonsai runs (self-determinism), visually equivalent to the
 * original but not identical to it.
 *
 * Determinism rule: every random decision in the engine MUST draw from a single
 * shared rng instance, in a fixed call order. Never call Math.random().
 */

/**
 * Resolve a config seed to a concrete 32-bit seed. `0` means "seed from the
 * clock" (matching cbonsai's `if (seed == 0) seed = time(NULL)`); the resolved
 * value is what gets persisted by --save so --load can reproduce it.
 */
export function resolveSeed(seed: number): number {
  if (seed && seed > 0) return seed >>> 0;
  // Date.now() is fine here — this is the one intentionally non-deterministic
  // point (picking a fresh seed), and the chosen seed is then recorded.
  return (Date.now() >>> 0) || 1;
}

/**
 * mulberry32: returns a function producing floats in [0, 1). Deterministic for a
 * given seed.
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Integer in [0, mod), mirroring C's `rand() % mod`. The single primitive every
 * dice roll goes through, so the RNG call order is easy to keep faithful.
 */
export function randInt(rng: () => number, mod: number): number {
  return Math.floor(rng() * mod);
}
