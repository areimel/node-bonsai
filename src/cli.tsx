#!/usr/bin/env node
/**
 * CLI entry point: parse flags (parity with the original cbonsai) and render
 * the Ink app. See README.md for the flag table.
 */
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App from './app.js';
import { flagsToConfig } from './config.js';
import { runEngine } from './engine/index.js';
import { resolveSeed } from './engine/rng.js';
import { foldSteps } from './render/fold.js';
import { gridToString } from './render/canvas.js';
import { makeColorizer } from './render/colors.js';
import { readSaveFile, writeSaveFile } from './engine/saveFile.js';

const cli = meow(
  `
  Usage
    $ bonsai [options]

  Options
    -l, --live            Live mode: show each step of growth
    -t, --time <secs>     Seconds between growth steps         [default: 0.03]
    -i, --infinite        Infinite mode: keep growing trees
    -w, --wait <secs>     Seconds between trees (infinite)     [default: 4]
    -S, --screensaver     Screensaver mode (-li, quit on any key)
    -m, --message <str>   Attach a message beside the tree
    -b, --base <int>      Base art (0 none, 1 wide, 2 narrow)  [default: 1]
    -c, --leaf <list>     Comma-separated leaf strings         [default: &]
    -k, --colors <list>   leafDark,woodDark,leafBright,woodBright [default: 2,3,10,11]
    -T, --theme <name>    green | cherry | maple | wisteria      [default: green]
    -M, --multiplier <n>  Branch multiplier (0-20)             [default: 5]
    -L, --life <n>        Life; higher = more growth (0-200)   [default: 32]
    -p, --print           Print the tree to stdout when finished
    -s, --seed <int>      Seed the RNG
    -W, --save <file>     Save progress to file
    -C, --load <file>     Load progress from file
    -v, --verbose         Increase verbosity
    -h, --help            Show this help

  Examples
    $ bonsai --live --life 40
    $ bonsai -p -s 42
`,
  {
    importMeta: import.meta,
    flags: {
      live: { type: 'boolean', shortFlag: 'l' },
      time: { type: 'number', shortFlag: 't' },
      infinite: { type: 'boolean', shortFlag: 'i' },
      wait: { type: 'number', shortFlag: 'w' },
      screensaver: { type: 'boolean', shortFlag: 'S' },
      message: { type: 'string', shortFlag: 'm' },
      base: { type: 'number', shortFlag: 'b' },
      leaf: { type: 'string', shortFlag: 'c' },
      colors: { type: 'string', shortFlag: 'k' },
      theme: { type: 'string', shortFlag: 'T' },
      multiplier: { type: 'number', shortFlag: 'M' },
      life: { type: 'number', shortFlag: 'L' },
      print: { type: 'boolean', shortFlag: 'p' },
      seed: { type: 'number', shortFlag: 's' },
      save: { type: 'string', shortFlag: 'W' },
      load: { type: 'string', shortFlag: 'C' },
      verbose: { type: 'boolean', shortFlag: 'v' },
    },
  },
);

let config = flagsToConfig(cli.flags);

// --load: restore the saved seed (the tree is replayed deterministically from it)
if (config.load) {
  const { seed } = readSaveFile(config.load);
  config = { ...config, seed };
}

// Resolve 0 -> a concrete clock seed once, so --print, --save, and the
// interactive render all agree on the same tree.
config = { ...config, seed: resolveSeed(config.seed) };

const size = {
  width: process.stdout.columns || 80,
  height: process.stdout.rows || 24,
};

// --print and/or --save run the engine once (no Ink) and exit/continue.
if (config.print || config.save) {
  const result = runEngine(config, size);
  if (config.save) writeSaveFile(config.save, result.seed, result.branchCount);
  if (config.print) {
    const grid = foldSteps(result.steps, result.width, result.height);
    console.log(gridToString(grid, makeColorizer(config.colors)));
    process.exit(0);
  }
}

render(<App config={config} />);
