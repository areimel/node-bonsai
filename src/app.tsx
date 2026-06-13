/**
 * Ink root component.
 *
 * Runs the growth engine once for the current terminal size + seed (a pure,
 * deterministic GrowthResult), then hands the tape to `useGrowthAnimation`,
 * which controls how much is shown (instant for static, progressive for --live).
 * The finished frame is a single chalk-colored string rendered in one <Text>
 * (Ink is flexbox, not a 2D canvas — see render/canvas.ts).
 *
 * Modes wired here: static, --live, --infinite/--screensaver (loop new trees),
 * and the optional --message overlay. --print and --save/--load live in cli.tsx.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import type { Config } from './config.js';
import { runEngine, type TermSize } from './engine/index.js';
import { makeColorizer } from './render/colors.js';
import { useGrowthAnimation } from './app/useGrowthAnimation.js';
import MessageBox from './app/MessageBox.js';

interface AppProps {
  config: Config;
}

/** Current terminal size, re-read on resize so the tree refits. */
function useTermSize(): TermSize {
  const { stdout } = useStdout();
  const read = (): TermSize => ({ width: stdout.columns || 80, height: stdout.rows || 24 });
  const [size, setSize] = useState<TermSize>(read);
  useEffect(() => {
    const onResize = () => setSize(read());
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stdout]);
  return size;
}

/** Rough row budget for the message overlay (border + wrapped content). */
function messageRows(message: string | undefined): number {
  if (!message || !message.trim()) return 0;
  return Math.ceil(message.trim().length / 36) + 2;
}

export default function App({ config }: AppProps) {
  const { exit } = useApp();
  const size = useTermSize();
  const colorize = useMemo(() => makeColorizer(config.colors), [config.colors]);

  // each finished tree bumps treeKey, regenerating the next one in infinite mode
  const [treeKey, setTreeKey] = useState(0);

  // reserve rows for the quit hint and any message box so nothing scrolls
  const reserved = 1 + messageRows(config.message);
  const canvasWidth = size.width;
  const canvasHeight = Math.max(1, size.height - reserved);

  const result = useMemo(() => {
    // a concrete seed (cli resolves 0 -> clock) varies trees in infinite mode
    // while staying reproducible; an unset seed grows a fresh tree each loop
    const seedOverride = config.seed === 0 ? undefined : config.seed + treeKey;
    return runEngine(config, { width: canvasWidth, height: canvasHeight }, seedOverride);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, canvasWidth, canvasHeight, treeKey]);

  const { frame, done } = useGrowthAnimation(result, colorize, {
    live: config.live,
    timeStepSec: config.timeStep,
  });

  useInput((input) => {
    // screensaver quits on ANY key; otherwise only on 'q'
    if (config.screensaver) {
      exit();
      return;
    }
    if (input === 'q') exit();
  });

  // infinite mode: once a tree finishes, wait timeWait then grow the next
  useEffect(() => {
    if (!config.infinite || !done) return;
    const id = setTimeout(
      () => setTreeKey((k) => k + 1),
      Math.max(0, config.timeWait * 1000),
    );
    return () => clearTimeout(id);
  }, [config.infinite, config.timeWait, done]);

  const hint = config.screensaver ? 'Press any key to quit.' : "Press 'q' to quit.";

  return (
    <Box flexDirection="column">
      <Text>{frame}</Text>
      {config.message ? <MessageBox message={config.message} /> : null}
      <Text dimColor>{hint}</Text>
    </Box>
  );
}
