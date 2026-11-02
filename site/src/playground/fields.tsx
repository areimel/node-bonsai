/**
 * Control primitives for the playground: every control is a real <label> around
 * a native input, so keyboard and screen readers work without extra code.
 */
import { useId, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  /** Shown beside the label (a slider's current value). */
  value?: ReactNode;
  hint?: ReactNode;
  children: (id: string) => ReactNode;
}

/** Label + control + optional hint; the one shape every control shares. */
export function Field({ label, value, hint, children }: FieldProps) {
  const id = useId();
  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        {value !== undefined && <output htmlFor={id}>{value}</output>}
      </div>
      {children(id)}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  hint?: ReactNode;
}

export function Slider({ label, value, min, max, step, onChange, format, hint }: SliderProps) {
  return (
    <Field label={label} value={format ? format(value) : value} hint={hint}>
      {(id) => (
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )}
    </Field>
  );
}

interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <Field label={label}>
      {(id) => (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </Field>
  );
}

interface RadiosProps {
  label: string;
  name: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (value: number) => void;
}

export function Radios({ label, name, value, options, onChange }: RadiosProps) {
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="radios">
        {options.map((o) => (
          <label key={o.value} className="radio">
            <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  maxLength?: number;
  hint?: ReactNode;
  invalid?: boolean;
  min?: number;
  max?: number;
}

export function TextField({ label, value, onChange, type = 'text', hint, invalid, ...rest }: TextFieldProps) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input
          id={id}
          type={type}
          value={value}
          aria-invalid={invalid || undefined}
          inputMode={type === 'number' ? 'numeric' : undefined}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
      )}
    </Field>
  );
}

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: ReactNode;
}

export function Checkbox({ label, checked, onChange, hint }: CheckboxProps) {
  const id = useId();
  return (
    <div className="field">
      <label className="check" htmlFor={id}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
