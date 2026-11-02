# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
npm run dev          # tsx src/cli.tsx — run from source
npm run live         # dev with --live
npm run screensaver  # dev with --screensaver
npm run build        # tsc -> dist/
npm start            # node dist/cli.js
npm test             # node --import tsx --test test/*.test.tsx
npm run typecheck    # tsc --noEmit

# flags need the `--` separator, or npm consumes them
npm run dev -- --live --life 40

# single test file / single test by name
node --import tsx --test test/engine.test.tsx
node --import tsx --test --test-name-pattern="deterministic" test/*.test.tsx
```

Requires Node >= 22. No linter or formatter is configured.

Tests use `node:test` + `node:assert/strict`; Ink components are tested with `ink-testing-library`. Use a fixed `seed` in tests so output is reproducible. `npm test` only matches `test/*.test.tsx`, so name new test files accordingly. `tsconfig.json` includes only `src/`, so `npm run typecheck` does **not** check tests, and `tsx` strips types without checking them.

Press `q` to quit the running app (any key in `--screensaver`).

## Architecture

Ink is **flexbox-based, not a 2D canvas** — there is no per-cell absolute grid. The bonsai is therefore modeled as a `Grid` of colored cells and **serialized to a single multi-line string** (with chalk color codes baked in) rendered inside one `<Text>`. Re-render by updating state.

### The growth tape (big picture)

The engine runs **once** per tree (and again if the terminal resizes, which restarts the animation) and returns a deterministic `GrowthResult` (`engine/types.ts`): an ordered `Step[]` "tape" of single-cell writes in draw order, plus `tickStops` (frame boundaries for `--live`) and `branchStops`. Every output mode is just a different consumer of that one tape:

- **static** → fold the whole tape onto a `Grid` (`render/fold.ts`) → `gridToString()`.
- **`--live`** → `app/useGrowthAnimation.ts` reveals a growing prefix, one `tickStop` per `timeStep`, applying only new steps to a persistent Grid.
- **`--print`** → handled in `cli.tsx` *before* Ink renders: run the engine, fold, `console.log`, exit.
- **`--save` / `--load`** → `--save` writes `"<seed> <branchCount>"` (`engine/saveFile.ts`) from `cli.tsx`, then continues into the normal render unless `--print` is also set. `--load` restores **only the seed**: other flags aren't persisted and must match to reproduce the tree. `branchCount` is parsed but unused, and nothing consumes `branchStops` yet, so the fast-forward described in `engine/types.ts` isn't implemented.
- **`--infinite` / `--screensaver`** → `app.tsx` bumps a `treeKey` after `timeWait`, re-running the engine with `seed + treeKey`.

`--live`, `--infinite` and `--screensaver` render on the terminal's alternate screen (the `render()` options in `cli.tsx`), so the tree disappears on quit.

`engine/index.ts` (`runEngine`) is the composition root: draws the pot (`base.ts`) into the bottom rows, grows the tree (`grow.ts`) above it, and concatenates the tapes (pot first, so frame 0 shows the pot).

**Determinism rule:** every random decision draws from the single shared mulberry32 PRNG in `engine/rng.ts` via `randInt`, in a fixed call order that mirrors the C code. Never use `Math.random()`, and don't reorder RNG calls when refactoring — that changes every seeded tree. (We intentionally don't reproduce glibc `rand()`, so trees match the original visually, not byte-for-byte.) `cli.tsx` resolves seed `0` → clock seed once, so all modes agree on the same tree.

Source layout (`src/`):

- `flags.ts` — the meow flag table (browser-safe); `command.ts` — flags back to a `bonsai ...` command.
- `cli.tsx` — shebang entry; meow flag parsing → `flagsToConfig` → `--load`/seed resolution → `--print`/`--save` fast path → `render(<App/>)`.
- `config.ts` — `Config`, `DEFAULTS`, `THEMES`, `flagsToConfig()`; also the `BranchType` and `ColorPair` types.
- `app.tsx` — Ink root: terminal-size tracking, quit input, infinite loop, `MessageBox` overlay.
- `render/canvas.ts` — `Grid` cell model + `gridToString()` (the one renderer all modes share).
- `render/colors.ts` — the five color roles → chalk ANSI-256 (the one place color logic lives).
- `render/fold.ts` — tape → Grid bridge (`foldSteps`, incremental `applySteps`).
- `engine/` — port of cbonsai's growth: `grow.ts` (recursive `branch()`), `setDeltas.ts`, `chooseString.ts`, `chooseColor.ts`, `base.ts`. Comments cite `cbonsai.c` line ranges; keep them accurate when editing.

## Website (`site/`)

A separate npm package (no workspaces: the CLI needs Ink 7, `ink-web` bundles Ink 6). See `README-TECHNICAL.md` for commands and `docs/superpowers/specs/2026-11-02-microsite-design.md` for why. It reuses `src/` directly, so changes there affect the site. Things that look removable but aren't:

- `App` keeps its hint row reserved when `interactive={false}`: output filling the terminal takes Ink's full-redraw path, and `ink-web` strips the clear, leaving old trees on screen.
- `site/src/playground/Terminal.tsx` starts `App` only after the font loads and `onReady` fires, and remounts on size change; changing size under a running app garbles output.
- `src/` must stay browser-safe except `cli.tsx` and `engine/saveFile.ts`.
- Build every internal link with `site/src/lib/url.ts`, since the site is served under `/node-bonsai/`.
- Never fill `site/src/data/contact.ts` from git config or guesses; the owner supplies those values.

## DRY mode (always on)

Work in DRY mode at all times:

- Reuse existing components/utilities before writing new ones.
- If an element is repeated **3 or more times**, factor it into a single central reusable module.
- Goal: fewer components, fewer lines of code, consistent styling, easier maintenance.

Concretely: all rendering goes through `render/canvas.ts`; all color decisions go through `render/colors.ts`; all defaults live in `config.ts`. Add new shared logic to these central modules rather than duplicating it.

## Documentation

Keep both READMEs up to date. `README.md` is the concise guide for non-technical readers; `README-TECHNICAL.md` holds the full technical details. When a change affects how the project is installed, run or used, update both in the same change: `README.md` in plain language with copyable commands, and `README-TECHNICAL.md` with the complete reference. Changes that only affect internals, or the flag table and cbonsai divergences, go in `README-TECHNICAL.md` alone.

## Conventions

- TypeScript strict mode; keep the build type-clean (`npm run typecheck`).
- Respect the module boundaries above — don't reach around the central renderer/color/config modules.
- Keep parity with the original's CLI flags and visual output unless intentionally diverging; note any divergence in `README-TECHNICAL.md`.
- When adding/changing a CLI flag, keep these in sync: the `FLAGS` table in `flags.ts`, help text in `cli.tsx`, `CliFlags`/`flagsToConfig` in `config.ts`, the defaults in `command.ts`, the flag table in `README-TECHNICAL.md`, and the options page in `site/src/content/docs/`.
