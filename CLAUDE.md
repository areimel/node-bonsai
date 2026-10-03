# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## What this is

**node-bonsai** is a terminal bonsai-tree generator: procedurally-generated, per-character-colored ASCII art that grows in your terminal. It is a TypeScript rewrite of **cbonsai** (originally ~1100 lines of C/ncurses), built on **Ink** (React for the terminal).

The original C project is preserved verbatim under `original-cbonsai/` for reference. Two derived specs live at the repo root and are the source of truth when porting behavior:

- `STYLEGUIDE.md` — every glyph, color, and default the original uses.
- `ALGORITHM.md` — the extracted growth algorithm as a language-agnostic spec.

When porting, treat those two docs (and `original-cbonsai/cbonsai.c`) as canonical.

## Stack & tooling

- Node.js (ESM, `"type": "module"`) + TypeScript (strict, `NodeNext` modules).
- **Ink 7** + React 19 for terminal rendering; **meow** for CLI parsing; **chalk** for color.
- `@inkjs/ui` is installed and reserved for later interactive chrome (menus/status); not used yet.
- npm for installs, **tsx** for dev runs, **tsc** for type-check/build.

**ESM note:** because modules are `NodeNext`, intra-project imports must use explicit `.js` extensions (e.g. `import { Grid } from './render/canvas.js'`), even though the source files are `.ts`/`.tsx`.

## Build & run

```bash
npm install
npm run dev        # tsx src/cli.tsx — run from source
npm run build      # tsc -> dist/
npm start          # node dist/cli.js
npm test           # node --import tsx --test
npm run typecheck  # tsc --noEmit
```

Press `q` to quit the running app.

## Architecture

Ink is **flexbox-based, not a 2D canvas** — there is no per-cell absolute grid. The bonsai is therefore modeled as a `Grid` of colored cells and **serialized to a single multi-line string** (with chalk color codes baked in) rendered inside one `<Text>`. Re-render by updating state.

Source layout (`src/`):

- `cli.tsx` — shebang entry; meow flag parsing (parity with the original flags) → `render(<App/>)`.
- `config.ts` — `Config` type, `DEFAULTS` (single source of defaults), `flagsToConfig()`.
- `app.tsx` — Ink root component; `useInput` quit-on-`q`; renders the canvas string.
- `render/canvas.ts` — `Grid` cell model + `gridToString()` (the one renderer all modes share).
- `render/colors.ts` — the five color roles → chalk mapping (the one place color logic lives).
- `engine/` — growth algorithm port (`grow.ts`, `setDeltas.ts`, `chooseString.ts`). Currently **typed stubs**; implementation is tracked for a later session (see `ALGORITHM.md`).

## DRY mode (always on)

Work in DRY mode at all times:

- Reuse existing components/utilities before writing new ones.
- If an element is repeated **3 or more times**, factor it into a single central reusable module.
- Goal: fewer components, fewer lines of code, consistent styling, easier maintenance.

Concretely: all rendering goes through `render/canvas.ts`; all color decisions go through `render/colors.ts`; all defaults live in `config.ts`. Add new shared logic to these central modules rather than duplicating it.

## Conventions

- TypeScript strict mode; keep the build type-clean (`npm run typecheck`).
- Respect the module boundaries above — don't reach around the central renderer/color/config modules.
- Keep parity with the original's CLI flags and visual output unless intentionally diverging; note any divergence in `README.md`.
- When adding/changing a CLI flag, keep these in sync: the meow `flags` table and help text in `cli.tsx`, `CliFlags`/`flagsToConfig` in `config.ts`, and the flag table in `README.md`.
