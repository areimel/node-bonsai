# cbonsai Visual Style Guide

Reference document for porting cbonsai to Node.js/TypeScript.
Every claim is verified against `cbonsai.c` with line-number citations.

---

## 1. Colors

### 1.1 Color-pair macros

Defined at `cbonsai.c:17-21`:

```c
#define COLOR_WOOD_BRIGHT COLOR_PAIR(4)   // line 17
#define COLOR_WOOD_DARK   COLOR_PAIR(2)   // line 18
#define COLOR_LEAF_BRIGHT COLOR_PAIR(3)   // line 19
#define COLOR_LEAF_DARK   COLOR_PAIR(1)   // line 20
#define COLOR_TEXT        COLOR_PAIR(5)   // line 21
```

### 1.2 Default color indices (`-k` default `"2,3,10,11"`)

Set at `cbonsai.c:858`: `char colorsInput[128] = "2,3,10,11";`

The four comma-delimited values map to pairs 1–4 in order (`colors[id-1]`, `cbonsai.c:663`):

| ncurses pair | Macro            | `colors[]` index | Default index | Conventional terminal color |
|:------------:|------------------|:----------------:|:-------------:|----------------------------|
| 1            | `COLOR_LEAF_DARK`   | `colors[0]`   | **2**         | Green                       |
| 2            | `COLOR_WOOD_DARK`   | `colors[1]`   | **3**         | Yellow / Olive              |
| 3            | `COLOR_LEAF_BRIGHT` | `colors[2]`   | **10**        | Bright Green                |
| 4            | `COLOR_WOOD_BRIGHT` | `colors[3]`   | **11**        | Bright Yellow               |
| 5            | `COLOR_TEXT`        | (hardcoded)   | **7 or 8**    | see §1.4                    |

### 1.3 `chooseColor()` logic (`cbonsai.c:267-286`)

Called once per growth step immediately before drawing a glyph.

| `branchType`              | Color pair applied       | Bold? (A_BOLD)           |
|---------------------------|--------------------------|--------------------------|
| `trunk`                   | `COLOR_WOOD_BRIGHT` (4)  | 50 % — `rand()%2 == 0`  |
| `shootLeft`               | `COLOR_WOOD_BRIGHT` (4)  | 50 % — `rand()%2 == 0`  |
| `shootRight`              | `COLOR_WOOD_BRIGHT` (4)  | 50 % — `rand()%2 == 0`  |
| `trunk` (alt)             | `COLOR_WOOD_DARK` (2)    | never (else branch)      |
| `shootLeft` (alt)         | `COLOR_WOOD_DARK` (2)    | never (else branch)      |
| `shootRight` (alt)        | `COLOR_WOOD_DARK` (2)    | never (else branch)      |
| `dying`                   | `COLOR_LEAF_BRIGHT` (3)  | ~10 % — `rand()%10 == 0` |
| `dying` (non-bold)        | `COLOR_LEAF_BRIGHT` (3)  | never (else branch)      |
| `dead`                    | `COLOR_LEAF_DARK` (1)    | ~33 % — `rand()%3 == 0`  |
| `dead` (non-bold)         | `COLOR_LEAF_DARK` (1)    | never (else branch)      |

Condensed rule set from `cbonsai.c:269-285`:

- **Wood types** (`trunk`, `shootLeft`, `shootRight`): 1-in-2 chance of bold + `COLOR_WOOD_BRIGHT`; otherwise non-bold `COLOR_WOOD_DARK`.
- **`dying`**: always `COLOR_LEAF_BRIGHT`; bold only 1-in-10.
- **`dead`**: always `COLOR_LEAF_DARK`; bold 1-in-3.

`A_BOLD` is turned off after each glyph via `wattroff(treeWin, A_BOLD)` (`cbonsai.c:505`).

### 1.4 `COLOR_TEXT` pair initialization (`cbonsai.c:682-687`)

```c
if (COLORS < 256) init_pair(5, 7, bg);   // fg=7 (white/light-gray in 8-color)
else              init_pair(5, 8, bg);   // fg=8 (dark gray in 256-color)
```

Index 7 is the standard 8-color "white" (often light gray); index 8 is the 256-color "dark gray" (first bright-black entry in the xterm-256 palette). Used for the base art text segments and message-box border.

### 1.5 8-color fallback (`cbonsai.c:667-678`)

When the terminal reports `COLORS < 256`, each color index is taken modulo 8 before being passed to `init_pair`:

```c
if (COLORS < 256) init_pair(id, color_id % 8, bg);
else              init_pair(id, color_id, bg);
```

Mapping of defaults under 8-color mode:

| Pair | Default index | `index % 8` | 8-color name     |
|:----:|:------------:|:-----------:|------------------|
| 1    | 2            | 2           | Green            |
| 2    | 3            | 3           | Yellow           |
| 3    | 10           | 2           | Green (same)     |
| 4    | 11           | 3           | Yellow (same)    |

A one-time warning `"Warning: defaulting to 8-color support.\n"` is printed when any index >= 8 is used on a sub-256-color terminal (`cbonsai.c:674`).

### 1.6 Background color

When `use_default_colors()` succeeds, `bg = -1` (transparent/native terminal background). Fallback is `COLOR_BLACK` (`cbonsai.c:658-659`).

---

## 2. Branch & Trunk Glyphs

### 2.1 `chooseString()` (`cbonsai.c:379-416`)

The function returns a `malloc`'d C string (freed by the caller each step, `cbonsai.c:506`). Maximum allocated length is 32 bytes (`cbonsai.c:383`). The fallback/default string is `"?"` (`cbonsai.c:385`).

**Life-override rule** (`cbonsai.c:387`): if `life < 4` the type is forced to `dying` regardless of the actual branch type, so the branch renders as a leaf.

### 2.2 Glyph lookup table

`dy` and `dx` are the current movement deltas from `setDeltas()`. Conditions are evaluated in the order shown (first match wins).

| `branchType` | Condition      | String rendered | Notes                          |
|--------------|---------------|-----------------|--------------------------------|
| `trunk`      | `dy == 0`     | `/~`            |                                |
| `trunk`      | `dx < 0`      | `\|`            | `dy != 0` implied              |
| `trunk`      | `dx == 0`     | `/|\`           | `dy != 0` implied              |
| `trunk`      | `dx > 0`      | `|/`            | `dy != 0` implied              |
| `shootLeft`  | `dy > 0`      | `\`             |                                |
| `shootLeft`  | `dy == 0`     | `\_`            |                                |
| `shootLeft`  | `dx < 0`      | `\|`            | `dy < 0` implied               |
| `shootLeft`  | `dx == 0`     | `/|`            | `dy < 0` implied               |
| `shootLeft`  | `dx > 0`      | `/`             | `dy < 0` implied               |
| `shootRight` | `dy > 0`      | `/`             |                                |
| `shootRight` | `dy == 0`     | `_/`            |                                |
| `shootRight` | `dx < 0`      | `\|`            | `dy < 0` implied               |
| `shootRight` | `dx == 0`     | `/|`            | `dy < 0` implied               |
| `shootRight` | `dx > 0`      | `/`             | `dy < 0` implied               |
| `dying`      | (any)         | random leaf     | also triggered when `life < 4` |
| `dead`       | (any)         | random leaf     |                                |

Note on rendering: `mvwprintw` is called only when `x % wcwidth(wc) == 0` to avoid splitting multi-column wide characters (`cbonsai.c:502-503`).

---

## 3. Leaves

### 3.1 Default leaf string

`cbonsai.c:857`: `char leavesInput[128] = "&";`

The default is a single-character ampersand `&`. This is the only leaf glyph unless the user supplies `-c`.

### 3.2 Parsing (`cbonsai.c:1023-1029`)

The `-c` argument is a comma-delimited list. Each token between commas becomes one entry in `conf.leaves[]`. The array holds up to 64 pointers (`cbonsai.c:44`), but the loop guard in `main()` actually checks `leavesSize < 100` (`cbonsai.c:1026`) — the effective limit is whichever is smaller (the array dimension of 64 is the hard cap).

### 3.3 Selection (`cbonsai.c:412`)

```c
strncpy(branchStr, conf->leaves[rand() % conf->leavesSize], maxStrLen - 1);
```

One entry is chosen uniformly at random from the populated portion of the leaves array each time a `dying` or `dead` glyph is drawn.

---

## 4. Bases (Pots)

### 4.1 Base selection

Controlled by `-b INT`. Default is `1` (`cbonsai.c:817`: `.baseType = 1`). `0` means no base is drawn. Only bases `1` and `2` are implemented.

### 4.2 Base 1 — wide bonsai pot

Dimensions: **31 columns × 4 rows** (`cbonsai.c:213-214`).

Drawn by `drawBase()` (`cbonsai.c:171-188`). Rows 1-3 are placed with `mvwprintw` at y=1, y=2, y=3; row 0 is written sequentially in segments with different colors.

**Row 0 — color-segmented rim line:**

```
:___________./~~~\.___________ :
```

| Segment    | Color applied              |
|------------|---------------------------|
| `:`        | `COLOR_TEXT` + `A_BOLD`   |
| `___________` | `COLOR_LEAF_BRIGHT` (pair 3) |
| `./~~~\.`  | `COLOR_WOOD_BRIGHT` (pair 4) |
| `___________` | `COLOR_LEAF_BRIGHT` (pair 3) |
| `:`        | `COLOR_TEXT`              |

**Rows 1–3 — pot body** (plain `COLOR_TEXT` + `A_BOLD`):

```
 \                           / 
  \_________________________/ 
  (_)                     (_)
```

`A_BOLD` is turned off after the entire base-1 block (`cbonsai.c:187`).

Full verbatim art (all 4 rows together):

```
:___________./~~~\.___________ :
 \                           / 
  \_________________________/ 
  (_)                     (_)
```

Position: horizontally centered on screen, anchored to the bottom (`cbonsai.c:225-226`):

```c
int baseOriginY = (rows - baseHeight);
int baseOriginX = (cols / 2) - (baseWidth / 2);
```

### 4.3 Base 2 — narrow bonsai pot

Dimensions: **15 columns × 3 rows** (`cbonsai.c:216-219`).

Drawn by `drawBase()` (`cbonsai.c:189-203`). Row 0 is color-segmented; rows 1-2 use `mvwprintw`.

**Row 0 — color-segmented rim line:**

```
(---./~~~\.---)
```

| Segment  | Color applied           |
|----------|------------------------|
| `(`      | `COLOR_TEXT`           |
| `---`    | `COLOR_LEAF_BRIGHT` (pair 3) |
| `./~~~\.`| `COLOR_WOOD_BRIGHT` (pair 4) |
| `---`    | `COLOR_LEAF_BRIGHT` (pair 3) |
| `)`      | `COLOR_TEXT`           |

**Rows 1–2 — pot body** (drawn with `mvwprintw`, no explicit color set — inherits last active attribute):

```
 (           ) 
  (_________)  
```

Full verbatim art (all 3 rows together):

```
(---./~~~\.---)
 (           ) 
  (_________)  
```

---

## 5. Message Box

### 5.1 Window creation (`cbonsai.c:529-554`)

`createMessageWindows()` creates two overlapping windows:

- **Border window** (`messageBorderWin`): placed at `(maxY * 0.7 - 1, maxX * 0.7 - 2)`, sized `(boxHeight + 2) × (boxWidth + 4)` (`cbonsai.c:545`).
- **Text window** (`messageWin`): placed at `(maxY * 0.7, maxX * 0.7)`, sized `boxHeight × (boxWidth + 1)` (`cbonsai.c:546`).

### 5.2 Width capping logic (`cbonsai.c:536-542`)

```c
if (strlen(message) + 3 <= (0.25 * maxX)) {
    boxWidth = strlen(message) + 1;
    boxHeight = 1;
} else {
    boxWidth = 0.25 * maxX;                                    // cap at 25% of screen width
    boxHeight = (strlen(message) / boxWidth) + (strlen(message) / boxWidth);
}
```

If the message fits on one line at 25% screen width, the box is single-row and exactly as wide as needed. Otherwise the width is capped at 25% of terminal columns, and height is estimated (note: the formula double-counts — it adds `strlen/boxWidth` twice).

### 5.3 Border characters (`cbonsai.c:550`)

```c
wborder(messageBorderWin, '|', '|', '-', '-', '+', '+', '+', '+');
```

`wborder` arguments: left-side, right-side, top, bottom, top-left-corner, top-right-corner, bottom-left-corner, bottom-right-corner.

| Position      | Character |
|---------------|-----------|
| Left side     | `\|`      |
| Right side    | `\|`      |
| Top           | `-`       |
| Bottom        | `-`       |
| All corners   | `+`       |

Style applied to the border window: `COLOR_TEXT | A_BOLD` (`cbonsai.c:549`).

### 5.4 Text rendering (`cbonsai.c:557-642`)

`drawMessage()` performs simple word-wrap: words are accumulated in a 512-byte buffer (`cbonsai.c:568`) and flushed when a space or null terminator is encountered. Lines break when the next word would exceed `maxWidth = getmaxx(messageWin) - 2` (`cbonsai.c:562`). Tab characters are treated as a single space (`cbonsai.c:598-599`). Explicit newlines (`\n`) are passed through verbatim (`cbonsai.c:601-604`).

---

## 6. Growth Parameters (Defaults Summary)

All defaults are set in `main()` at `cbonsai.c:809-832`:

| Parameter        | Default   | CLI flag | Meaning                                       |
|------------------|-----------|----------|-----------------------------------------------|
| `lifeStart`      | `32`      | `-L`     | Starting life counter for trunk branch        |
| `multiplier`     | `5`       | `-M`     | Controls branching frequency (0–20)           |
| `timeStep`       | `0.03` s  | `-t`     | Delay between steps in live mode              |
| `timeWait`       | `4.0` s   | `-w`     | Delay between trees in infinite mode          |
| `baseType`       | `1`       | `-b`     | Base art variant (0=none, 1=wide, 2=narrow)   |
| `leaves` default | `"&"`     | `-c`     | Comma-delimited leaf glyph(s)                 |
| `colors` default | `2,3,10,11` | `-k`  | dark-leaf, dark-wood, light-leaf, light-wood  |
| `live`           | `0` (off) | `-l`     | Show growth step-by-step                      |
| `infinite`       | `0` (off) | `-i`     | Loop tree generation indefinitely             |
| `screensaver`    | `0` (off) | `-S`     | Equivalent to `-li`; quit on any keypress     |
| `printTree`      | `0` (off) | `-p`     | Emit ANSI-escaped tree to stdout on exit      |
| `seed`           | `0`       | `-s`     | 0 means `time(NULL)` (`cbonsai.c:1061`)       |

---

## 7. Tree Growth Entry Point

`growTree()` (`cbonsai.c:697-716`) starts the trunk at:

- **y** = `maxY - 1` (bottom row of the tree window)
- **x** = `maxX / 2` (horizontal center of the tree window)
- **type** = `trunk`
- **life** = `conf->lifeStart` (default 32)

The tree window fills all rows above the base: height = `rows - baseHeight`, width = `cols` (`cbonsai.c:233`).

---

## 8. ANSI Print Mode (`--print`)

`printstdscr()` (`cbonsai.c:719-768`) reads every `cchar_t` from `stdscr` after all windows are overlaid onto it and emits raw ANSI codes:

| Condition         | ANSI escape emitted      |
|-------------------|--------------------------|
| `A_BOLD` set      | `\033[1m`                |
| `A_BOLD` not set  | `\033[0m`                |
| `fg == 0`         | `\033[0m` (reset)        |
| `fg >= 16`        | `\033[38;5;{fg}m` (256-color) |
| `fg <= 7`         | `\033[3{fg}m` (standard) |
| `fg >= 8`         | `\033[9{fg-8}m` (bright) |

A final `\033[0m\n` is emitted after the last row (`cbonsai.c:767`). Wide characters are handled by skipping `x` forward by `cwidth - 1` to avoid double-printing (`cbonsai.c:762-763`).
