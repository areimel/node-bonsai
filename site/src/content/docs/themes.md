---
title: Themes and colours
description: The four built-in themes, and how to set colours by hand.
order: 4
---

## Built-in themes

Use `--theme` with a name. Each theme sets four colours. The default is
`green`. Names are not case-sensitive. An unknown name stops the app with an
error that lists the valid names.

| Theme | Look | Same as `--colors` |
| --- | --- | --- |
| `green` | Classic green and yellow, the cbonsai default | `2,3,10,11` |
| `cherry` | Cherry blossom pink, with a brown trunk | `175,94,218,130` |
| `maple` | Maple red, with a brown trunk | `124,94,202,130` |
| `wisteria` | Wisteria purple, with a brown trunk | `97,94,183,130` |

Try one with:

```bash
npm run live -- --theme wisteria
```

## Set colours by hand

`--colors` takes four numbers separated by commas. Each number is an ANSI
256-colour index, from 0 to 255. The order matters:

| Position | Role | Used for |
| --- | --- | --- |
| 1 | `leafDark` | Dead branches |
| 2 | `woodDark` | Trunk and shoots, when not bold |
| 3 | `leafBright` | Dying branches |
| 4 | `woodBright` | Trunk and shoots, when bold |

```bash
npm run dev -- --colors 175,94,218,130
```

An explicit `--colors` overrides `--theme`. The text colour is fixed. You
cannot change it with these options.
