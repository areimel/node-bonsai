/**
 * Ink root component.
 *
 * Renders the bonsai canvas as a single <Text> (see render/canvas.ts) and wires
 * up quit-on-'q'. Until the growth engine is ported (src/engine/), it draws a
 * static placeholder sapling to prove the render + input loop works end to end.
 */
import { Box, Text, useApp, useInput } from 'ink';
import React, { useMemo } from 'react';
import type { Config } from './config.js';
import { Grid, gridToString, type Cell } from './render/canvas.js';
import { makeColorizer } from './render/colors.js';

interface AppProps {
  config: Config;
}

const PLACEHOLDER_WIDTH = 21;
const PLACEHOLDER_HEIGHT = 9;

/** A hand-placed sapling — temporary stand-in for the generated tree. */
function buildPlaceholder(): Grid {
  const grid = new Grid(PLACEHOLDER_WIDTH, PLACEHOLDER_HEIGHT);
  const cx = Math.floor(PLACEHOLDER_WIDTH / 2);
  const put = (x: number, y: number, char: string, pair: Cell['pair'], bold = false) =>
    grid.set(x, y, { char, pair, bold });

  // trunk
  for (let y = PLACEHOLDER_HEIGHT - 1; y >= 3; y--) put(cx, y, '|', 'woodBright', true);
  put(cx - 1, 4, '/', 'woodDark');
  put(cx + 1, 4, '\\', 'woodDark');

  // leaf canopy
  const leaves: Array<[number, number]> = [
    [cx, 2], [cx - 2, 3], [cx + 2, 3], [cx - 1, 1], [cx + 1, 1], [cx, 0],
  ];
  for (const [x, y] of leaves) put(x, y, '&', 'leafBright', true);

  return grid;
}

export default function App({ config }: AppProps) {
  const { exit } = useApp();
  useInput((input) => {
    if (input === 'q') exit();
  });

  const colorize = useMemo(() => makeColorizer(config.colors), [config.colors]);
  const frame = useMemo(() => gridToString(buildPlaceholder(), colorize), [colorize]);

  return (
    <Box flexDirection="column">
      <Text>{frame}</Text>
      <Text dimColor>node-bonsai — growth engine pending. Press &apos;q&apos; to quit.</Text>
    </Box>
  );
}
