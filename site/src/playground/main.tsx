import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import chalk from 'chalk';
import { InkXterm, Text } from 'ink-web';
import '@xterm/xterm/css/xterm.css';
import 'ink-web/css';
import App from '../../../src/app.js';
import { flagsToConfig } from '../../../src/config.js';

chalk.level = 2;
const termOptions = { fontSize: 13, disableStdin: true, theme: { background: '#1E2B26' } };

function Spike() {
  const [theme, setTheme] = useState('green');
  const [gen, setGen] = useState(0);
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const onReady = useCallback(() => setReady(true), []);
  useEffect(() => { (window as any).setTheme = setTheme; }, []);
  useEffect(() => {
    const el = box.current!;
    let last = `${el.clientWidth}x${el.clientHeight}`;
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      const now = `${el.clientWidth}x${el.clientHeight}`;
      if (now === last) return;
      last = now;
      clearTimeout(t);
      t = setTimeout(() => { setReady(false); setGen((g) => g + 1); }, 200);
    });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);
  const config = flagsToConfig({ live: true, infinite: true, seed: 42, time: 0.01, wait: 1, theme });
  return (
    <div ref={box} style={{ width: '100%', height: '100%' }}>
      <InkXterm key={gen} focus={false} termOptions={termOptions} onReady={onReady}>
        {ready ? <App config={config} interactive={false} /> : <Text> </Text>}
      </InkXterm>
    </div>
  );
}
createRoot(document.getElementById('playground')!).render(<Spike />);
