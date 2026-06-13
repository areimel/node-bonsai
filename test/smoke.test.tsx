/**
 * Smoke test: the full render pipeline (config -> engine -> tape -> grid ->
 * colored string -> <Text>) mounts in Ink and draws a real, finished tree in
 * static mode. Runs via: npm test (node --import tsx --test).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import App from '../src/app.js';
import { flagsToConfig } from '../src/config.js';

test('renders a generated tree, the pot, and the quit hint', () => {
  const { lastFrame } = render(<App config={flagsToConfig({ seed: 42 })} />);
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('&'), 'expected a leaf glyph in the frame');
  assert.ok(frame.includes('~'), 'expected the pot rim in the frame');
  assert.ok(frame.includes('quit'), 'expected the quit hint in the frame');
});
