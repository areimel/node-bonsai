# Repository Guidelines

## Project Structure & Module Organization

`node-bonsai` is a TypeScript/Ink terminal bonsai generator. `src/cli.tsx` handles CLI parsing; `src/app.tsx` and `src/app/` manage interaction and animation. `src/engine/` produces the deterministic growth tape; `src/render/` folds it into a colored grid. Keep defaults and flag conversion in `src/config.ts`.

`site/` is the separate website package (Astro plus an `ink-web` terminal bundle) and reuses `src/` directly; see `CLAUDE.md` before changing `src/app.tsx` or the terminal wrapper. Tests live in `test/`; compiled output goes to `dist/`. ASCII artwork is defined in source. Preserve `original-cbonsai/` as reference code. Consult `ALGORITHM.md` and `STYLEGUIDE.md` when porting growth behavior, glyphs, colors, or defaults.

## Build, Test, and Development Commands

Use Node.js 22 or newer and npm.

- `npm ci` — install dependencies from the lockfile.
- `npm run dev` — draw a tree from source; press `q` to quit.
- `npm run live` / `npm run screensaver` — run the animated modes from source (any key quits the screensaver).
- `npm run dev -- --seed 42 --live` — run reproducible animated growth; flags need the `--` separator, or npm consumes them.
- `npm run build` — compile TypeScript into `dist/`.
- `npm start` — run the compiled CLI after building.
- `npm run typecheck` — check source types without emitting files.
- `npm test` — run all test files.
- `node --import tsx --test test/engine.test.tsx` — run one test file.

## Coding Style & Naming Conventions

Follow existing two-space indentation, single quotes, semicolons, and trailing commas in multiline structures. Use strict TypeScript and explicit `.js` extensions for local ESM imports. Use camelCase for functions and variables, PascalCase for types and React components, and uppercase names for constants such as `DEFAULTS`. No formatter or linter is configured.

Reuse the central configuration, color, and rendering modules. Preserve the shared PRNG and RNG call order; do not introduce `Math.random()` into growth logic.

## Testing Guidelines

Tests use `node:test`, `node:assert/strict`, and `ink-testing-library`. Name files `test/*.test.tsx` and give cases descriptive behavior names. Use fixed seeds and terminal dimensions for reproducible assertions. Cover changed configuration, engine behavior, or terminal output; no numeric coverage threshold is configured. Run tests, type checking, and a build before submitting.

## Commit & Pull Request Guidelines

Git history uses short imperative subjects, such as “Add tests for color theme resolution”; no mandatory prefix convention is evident. Keep commits focused. Pull requests should explain the behavior change and validation commands, link relevant issues, and include terminal captures for visual changes. When changing flags, synchronize CLI help, configuration mapping, and the flag table in `README-TECHNICAL.md`. Document intentional departures from cbonsai in `README-TECHNICAL.md`.

## Documentation

Keep both READMEs up to date. `README.md` is the concise guide for non-technical readers; `README-TECHNICAL.md` holds the full technical details. When a change affects how the project is installed, run or used, update both in the same change: `README.md` in plain language with copyable commands, and `README-TECHNICAL.md` with the complete reference. Changes that only affect internals, or the flag table and cbonsai divergences, go in `README-TECHNICAL.md` alone.
