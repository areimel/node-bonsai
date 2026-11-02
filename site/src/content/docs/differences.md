---
title: How it differs from cbonsai
description: What node-bonsai keeps from cbonsai, and what it changes.
order: 5
---

node-bonsai is a rewrite of cbonsai, the original C program. It keeps the
cbonsai flags (plus one new one), and the growth engine is a port of the original.

## What stays the same

- The short flags and defaults match cbonsai's. The one long name that
  differs is `--colors`, which is `--color` in cbonsai.
- The original cbonsai also clears its tree on quit. So does node-bonsai.

## What is different

- **Named themes.** cbonsai has no themes. node-bonsai adds `--theme` (short form `-T`), a
  convenience layer over the same four colour roles. See the Themes and
  colours page.
- **Different trees.** node-bonsai does not reproduce glibc `rand()`. Its trees
  look like cbonsai's trees, but they are not identical to them.
- **Ink, not ncurses.** cbonsai is C with ncurses. node-bonsai draws with
  [Ink](https://github.com/vadimdemedes/ink), which is React for the terminal.
- **A notice for npm.** node-bonsai warns you when npm has swallowed a flag.
  See the All options page.

## Not done yet

- `--save` and `--load` have no default file. cbonsai picks one in your cache
  folder.
- `--load` does not skip ahead. It replays the tree from the seed.
