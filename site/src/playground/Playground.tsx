/** The Home playground: state, debounce, the terminal frame, controls and the command plate. */
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { flagsToConfig, type CliFlags, type Config } from '../../../src/config.js';
import { flagsToCommand } from '../../../src/command.js';
import Terminal from './Terminal';
import Controls from './Controls';
import { Checkbox } from './fields';
import { MAX_STEPS, commandFlags, flagsFromQuery } from './query';

const COLOURS_ERROR =
  "Those colour numbers don't work, so the last good tree is still showing. Use four numbers from 0 to 255, like 2,3,10,11.";

/** The app always runs live and looping; the screensaver box only changes the printed command. */
function toConfig(flags: CliFlags): Config {
  return { ...flagsToConfig({ ...flags, live: true, infinite: true, screensaver: false }), maxSteps: MAX_STEPS };
}

function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

/** The static tree, from the page's own HTML, so nothing jumps if the terminal can't run. */
function StaticTree({ html }: { html: string }) {
  return <pre className="home-tree" role="img" aria-label="A bonsai tree (a still picture)" dangerouslySetInnerHTML={{ __html: html }} />;
}

const FAILED = "The live terminal couldn't load, so the tree shown here is a still picture. The command below still works in a terminal.";

class TerminalBoundary extends Component<{ html: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (<><StaticTree html={this.props.html} /><p className="home-fail" role="status">{FAILED}</p></>);
  }
}

export default function Playground({ staticHtml }: { staticHtml: string }) {
  const initial = useMemo(() => flagsFromQuery(window.location.search), []);
  const [flags, setFlags] = useState<CliFlags>(initial.flags);
  const [screensaver, setScreensaver] = useState(initial.screensaver);
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [playing, setPlaying] = useState(!reduced);

  const parsed = useMemo(() => {
    try { return { config: toConfig(flags) }; } catch { return { config: undefined }; }
  }, [flags]);
  const lastGood = useRef(parsed.config ?? toConfig(initial.flags));
  const lastGoodFlags = useRef(flags);
  if (parsed.config) {
    lastGood.current = parsed.config;
    lastGoodFlags.current = flags;
  }
  const config = useDebounced(parsed.config ?? lastGood.current, 150);

  // Always the command for the tree on screen, even while the colours field is invalid.
  const command = flagsToCommand(commandFlags(lastGoodFlags.current, screensaver));
  // Reduced motion: the finished tree for the current settings, with no growth or looping.
  const stillConfig = useMemo(() => ({ ...config, live: false, infinite: false }), [config]);
  const patch = (p: CliFlags) => setFlags((f) => ({ ...f, ...p }));

  return (
    <>
      <div className="home-stage">
        <div className="home-frame">
          <TerminalBoundary html={staticHtml}>
            <Terminal
              config={playing ? config : stillConfig}
              label={`A bonsai tree ${playing ? 'growing in the terminal' : 'in the terminal'}. Command: ${command}`}
            />
            {!playing && <button type="button" className="btn home-play-btn" onClick={() => setPlaying(true)}>Play</button>}
          </TerminalBoundary>
        </div>
      </div>
      <div className="home-side">
        <Controls flags={flags} onChange={patch} colorsError={parsed.config ? undefined : COLOURS_ERROR}
          onNewTree={() => patch({ seed: 1 + Math.floor(Math.random() * 9999) })} />
        <Checkbox label="Screensaver" checked={screensaver} onChange={setScreensaver}
          hint="Only changes the printed command, to the one that runs as a screensaver." />
      </div>
      <div className="plate plate-overlap">
        <code className="plate-cmd" data-testid="command">{command}</code>
        <button type="button" className="plate-copy" data-copy>Copy</button>
      </div>
    </>
  );
}
