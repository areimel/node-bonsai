/** The field-note controls. They edit a CliFlags object; the parent turns it into config and command. */
import { useState } from 'react';
import { DEFAULTS, THEMES, type CliFlags } from '../../../src/config.js';
import { MAX_TEXT, RANGES } from './query';
import { Radios, Select, Slider, TextField } from './fields';

const THEME_OPTIONS = Object.keys(THEMES).map((name) => ({ value: name, label: name[0].toUpperCase() + name.slice(1) }));
const POT_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Wide' },
  { value: 2, label: 'Narrow' },
];
const seconds = (n: number) => `${n} s`;

interface ControlsProps {
  flags: CliFlags;
  onChange: (patch: CliFlags) => void;
  onNewTree: () => void;
  /** Plain message when the colours field can't be used. */
  colorsError?: string;
}

export default function Controls({ flags, onChange, onNewTree, colorsError }: ControlsProps) {
  const [showColors, setShowColors] = useState(Boolean(flags.colors));
  const num = <K extends keyof typeof RANGES>(key: K, fallback: number) => ({
    ...RANGES[key],
    value: (flags[key] as number | undefined) ?? fallback,
    onChange: (value: number) => onChange({ [key]: value }),
  });
  return (
    <form className="controls" onSubmit={(e) => e.preventDefault()} aria-label="Tree settings">
      <Select label="Theme" value={flags.theme ?? 'green'} options={THEME_OPTIONS} onChange={(theme) => onChange({ theme })} />
      <Radios label="Pot" name="pot" value={flags.base ?? DEFAULTS.base} options={POT_OPTIONS} onChange={(base) => onChange({ base })} />
      <Slider label="Life" {...num('life', DEFAULTS.life)} hint="Longer life, bigger tree." />
      <Slider label="Branches" {...num('multiplier', DEFAULTS.multiplier)} />
      <Slider label="Speed" {...num('time', DEFAULTS.timeStep)} format={seconds} hint="Seconds per growth step. Lower is faster." />
      <Slider label="Pause between trees" {...num('wait', DEFAULTS.timeWait)} format={seconds} />
      <TextField label="Leaves" value={flags.leaf ?? ''} placeholder={DEFAULTS.leaves.join(',')} maxLength={MAX_TEXT.leaf}
        onChange={(leaf) => onChange({ leaf })} hint="Characters for leaves. Separate several with commas." />
      <TextField label="Message" value={flags.message ?? ''} maxLength={MAX_TEXT.message} onChange={(message) => onChange({ message })} />
      <div className="seed-row">
        <TextField label="Seed" type="number" min={0} max={999999} value={flags.seed ? String(flags.seed) : ''} placeholder="Random"
          onChange={(v) => onChange({ seed: Math.max(0, Math.floor(Number(v)) || 0) })} />
        <button type="button" className="btn" onClick={onNewTree}>New tree</button>
      </div>
      <details open={showColors} onToggle={(e) => setShowColors(e.currentTarget.open)}>
        <summary>Custom colours</summary>
        <TextField label="Colour numbers" value={flags.colors ?? ''} placeholder={DEFAULTS.colors.join(',')} maxLength={MAX_TEXT.colors}
          invalid={Boolean(colorsError)} onChange={(colors) => onChange({ colors })}
          hint="Four numbers from 0 to 255 for dark leaves, dark wood, light leaves and light wood. This replaces the theme." />
        {colorsError && <p className="field-error" role="alert">{colorsError}</p>}
      </details>
    </form>
  );
}
