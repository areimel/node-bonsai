/**
 * Smoke test: the render pipeline (config -> grid -> colored string -> <Text>)
 * works end to end and the placeholder frame is drawn. Runs via:
 *   npm test   (node --import tsx --test)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import App from '../src/app.js';
import { flagsToConfig } from '../src/config.js';

test('renders the placeholder sapling and quit hint', () => {
  const { lastFrame } = render(<App config={flagsToConfig({})} />);
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('&'), 'expected a leaf glyph in the frame');
  assert.ok(frame.includes('quit'), 'expected the quit hint in the frame');
});
