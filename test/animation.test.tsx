/**
 * Animation tests — infinite-mode tree rotation (live and static).
 * Runs via: npm test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import App from '../src/app.js';
import { flagsToConfig, swallowedFlagsNotice } from '../src/config.js';

const ANSI = /\u001b\[[0-9;]*m/g;

/** Visible tree cells in a frame: strip ANSI, drop the hint line, drop whitespace. */
function cellCount(frame: string): number {
  return frame
    .replace(ANSI, '')
    .split('\n')
    .filter((l) => !l.startsWith('Press '))
    .join('')
    .replace(/\s+/g, '').length;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function until(pred: () => boolean, ms: number): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (pred()) return true;
    await sleep(10);
  }
  return pred();
}

test('live + infinite: next tree restarts from pot-only, then grows', async () => {
  const config = flagsToConfig({ seed: 42, live: true, infinite: true, time: 0.001, wait: 0.05, life: 8 });
  const { frames, unmount } = render(<App config={config} />);
  try {
    await until(() => frames.length > 0, 2000);
    const potOnly = cellCount(frames[0]!);
    assert.ok(potOnly > 0, 'frame 0 should show the pot');

    // wait for the first tree to be fully grown (count stops rising and exceeds pot)
    const grown = await until(() => cellCount(frames[frames.length - 1]!) > potOnly, 10000);
    assert.ok(grown, 'first tree should grow');
    const firstMax = await (async () => {
      let max = 0;
      // let it reach its peak, then look for a return to pot-only
      const ok = await until(() => {
        max = Math.max(max, ...frames.map(cellCount));
        const counts = frames.map(cellCount);
        const peakIdx = counts.indexOf(max);
        return counts.slice(peakIdx + 1).includes(potOnly);
      }, 12000);
      assert.ok(ok, 'sequence should return to pot-only after the first tree ends');
      return max;
    })();

    // after the reset it must grow again
    const counts = frames.map(cellCount);
    const reset = counts.indexOf(potOnly, counts.indexOf(firstMax));
    const grewAgain = await until(
      () => frames.map(cellCount).slice(reset + 1).some((c) => c > potOnly),
      5000,
    );
    assert.ok(grewAgain, 'second tree should grow after the pot-only frame');
  } finally {
    unmount();
  }
});

test('static + infinite: keeps producing new trees', async () => {
  const config = flagsToConfig({ seed: 42, infinite: true, wait: 0.05 });
  const { frames, unmount } = render(<App config={config} />);
  try {
    const ok = await until(() => new Set(frames).size >= 3, 5000);
    assert.ok(ok, `expected >= 3 distinct frames, got ${new Set(frames).size}`);
  } finally {
    unmount();
  }
});

test('swallowedFlagsNotice: reports --live swallowed by npm', () => {
  const msg = swallowedFlagsNotice(flagsToConfig(), { npm_config_live: 'true' });
  assert.equal(msg, 'npm swallowed --live. Use: npm run dev -- --live');
});

test('swallowedFlagsNotice: reports -l from npm_config_long', () => {
  const msg = swallowedFlagsNotice(flagsToConfig(), { npm_config_long: 'true' });
  assert.ok(msg?.includes('-l'));
});

test('swallowedFlagsNotice: lists several flags', () => {
  const msg = swallowedFlagsNotice(flagsToConfig(), {
    npm_config_live: 'true',
    npm_config_infinite: 'true',
  });
  assert.equal(msg, 'npm swallowed --live, --infinite. Use: npm run dev -- --live --infinite');
});

test('swallowedFlagsNotice: undefined when the flag is active', () => {
  assert.equal(
    swallowedFlagsNotice(flagsToConfig({ live: true }), { npm_config_live: 'true' }),
    undefined,
  );
});

test('swallowedFlagsNotice: undefined for empty env', () => {
  assert.equal(swallowedFlagsNotice(flagsToConfig(), {}), undefined);
});

test('swallowedFlagsNotice: ignores unrelated npm settings', () => {
  assert.equal(swallowedFlagsNotice(flagsToConfig(), { npm_config_save: 'true' }), undefined);
});

test('App renders the notice on the hint line', () => {
  const { lastFrame, unmount } = render(
    <App config={flagsToConfig({ seed: 42 })} notice="npm swallowed --live. Use: npm run dev -- --live" />,
  );
  try {
    assert.ok(lastFrame()?.includes('npm swallowed --live. Use: npm run dev -- --live'));
  } finally {
    unmount();
  }
});
