/**
 * The live terminal: the real App inside ink-web's xterm. The mechanics below
 * were proven in the Phase 0 spike; keep them as they are.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import chalk from 'chalk';
import { InkXterm, Text } from 'ink-web';
import '@xterm/xterm/css/xterm.css';
import 'ink-web/css';
import App from '../../../src/app.js';
import type { Config } from '../../../src/config.js';
import { terminalTheme } from '../lib/palette';

// render/colors.ts calls chalk.ansi256; without a level chalk emits no colour here.
chalk.level = 2;
// Constant on purpose: ink-web recreates the terminal if termOptions, focus or onReady change.
// disableStdin because the demo takes no keyboard input.
const FONT_SIZE = 13;
const FONT_FAMILY = 'IBM Plex Mono';
const termOptions = {
  fontSize: FONT_SIZE,
  fontFamily: `'${FONT_FAMILY}', monospace`,
  disableStdin: true,
  theme: terminalTheme,
};

/** xterm measures its cell size on mount, so the font must have loaded by then. */
function useFontLoaded() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let live = true;
    const done = () => { if (live) setLoaded(true); };
    document.fonts.load(`${FONT_SIZE}px '${FONT_FAMILY}'`).then(done, done);
    return () => { live = false; };
  }, []);
  return loaded;
}

/** xterm's hidden textarea is a Tab stop that would trap keyboard users. */
function useUntabbable(box: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fix = () =>
      el.querySelectorAll('textarea').forEach((t) => t.getAttribute('tabindex') !== '-1' && t.setAttribute('tabindex', '-1'));
    fix();
    const mo = new MutationObserver(fix);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [box]);
}

/** Remount key that changes (debounced) when the container's size does. */
function useSizeKey(box: React.RefObject<HTMLElement | null>, onChange: () => void) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const el = box.current!;
    let last = `${el.clientWidth}x${el.clientHeight}`;
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      const now = `${el.clientWidth}x${el.clientHeight}`;
      if (now === last) return;
      last = now;
      clearTimeout(t);
      // Changing the size under a running app garbled output in Firefox, so remount.
      t = setTimeout(() => { onChange(); setKey((k) => k + 1); }, 200);
    });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [box, onChange]);
  return key;
}

interface TerminalProps {
  config: Config;
  label: string;
}

export default function Terminal({ config, label }: TerminalProps) {
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const onReady = useCallback(() => setReady(true), []);
  const onResize = useCallback(() => setReady(false), []);
  const gen = useSizeKey(box, onResize);
  const fontLoaded = useFontLoaded();
  useUntabbable(box);
  return (
    <div ref={box} className="home-term" role="img" aria-label={label} data-testid="terminal" data-ready={ready}>
      {fontLoaded && (
        <InkXterm key={gen} focus={false} termOptions={termOptions} onReady={onReady}>
          {/* App starts only after onReady; the placeholder fills the gap. */}
          {ready ? <App config={config} interactive={false} /> : <Text> </Text>}
        </InkXterm>
      )}
    </div>
  );
}
