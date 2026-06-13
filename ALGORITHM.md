# cbonsai — Procedural-Generation Algorithm

> Language-agnostic extraction of the tree-growth algorithm from `cbonsai.c`,
> suitable as a specification for a TypeScript (or any other language) port.
> All line citations refer to `cbonsai.c`.

---

## Table of Contents

1. [Overview and Data Types](#1-overview-and-data-types)
2. [Entry Point — `growTree`](#2-entry-point--growtree)
3. [Movement Tables — `setDeltas`](#3-movement-tables--setdeltas)
4. [Glyph Selection — `chooseString`](#4-glyph-selection--choosestring)
5. [Color Selection — `chooseColor`](#5-color-selection--choosecolor)
6. [Recursive Core — `branch`](#6-recursive-core--branch)
7. [Determinism and Save/Load](#7-determinism-and-saveload)
8. [Tuning Reference Table](#8-tuning-reference-table)

---

## 1. Overview and Data Types

### 1.1 Branch type enum (`cbonsai.c:23`)

```
enum branchType {
    trunk      = 0,
    shootLeft  = 1,
    shootRight = 2,
    dying      = 3,
    dead       = 4
}
```

`branchType` is the single most important discriminant in the algorithm. It
controls:

- **Movement** (`setDeltas`): which dice tables are consulted for `dx`/`dy`.
- **Glyph** (`chooseString`): which ASCII characters are drawn at each step.
- **Color** (`chooseColor`): which ncurses color pair (wood vs. leaf, bright
  vs. dark) is used.
- **Spawn rules** (inside `branch`): what child branches are created and when.

Conceptually the lifecycle runs:

```
trunk  →  shoots (shootLeft / shootRight)  →  dying  →  dead
```

`dead` branches produce the leaf-burst clusters at branch tips.

### 1.2 Key configuration parameters

| Parameter       | CLI flag | Default | Role                                     |
|-----------------|----------|---------|------------------------------------------|
| `lifeStart`     | `-L`     | `32`    | Initial life counter for the trunk       |
| `multiplier`    | `-M`     | `5`     | Branching density and shoot timing       |
| `seed`          | `-s`     | `time()`| RNG seed; same seed → identical tree     |
| `leaves[]`      | `-c`     | `["&"]` | Strings used for leaf glyphs             |
| `leavesSize`    | —        | `1`     | Number of entries in `leaves[]`          |

### 1.3 Runtime counters (`cbonsai.c:62–66`)

```
struct counters {
    branches      // total branch() invocations so far (used for save/load)
    shoots        // total shoots spawned
    shootCounter  // parity counter: which side the next shoot goes
}
```

`shootCounter` is initialized to `rand()` at the start of each tree
(`cbonsai.c:704`), so even with the same seed the first shoot direction can
vary based on preceding RNG calls.

---

## 2. Entry Point — `growTree`

`cbonsai.c:697–716`

```
function growTree(treeWindowWidth, treeWindowHeight):
    counters.shoots       = 0
    counters.branches     = 0
    counters.shootCounter = rand()          // random parity seed

    startX = treeWindowWidth  / 2          // horizontal centre
    startY = treeWindowHeight - 1          // bottom row

    branch(y=startY, x=startX, type=trunk, life=lifeStart)

    compositeAndRefreshDisplay()
```

The trunk always starts at the bottom-centre of the tree window.

---

## 3. Movement Tables — `setDeltas`

`cbonsai.c:289–377`

At each step of its life loop, a branch calls `setDeltas` to obtain integer
offsets `dx` (horizontal) and `dy` (vertical). The coordinate system is
**screen-space**: positive `y` moves **down**, negative `y` moves **up**.
Therefore `dy = -1` means the branch grows upward.

`roll(dice, mod)` means: set `dice = rand() % mod`  (`cbonsai.c:243`).

---

### 3.1 `trunk` (`cbonsai.c:294–321`)

Three age-based sub-cases; `age = lifeStart - life`.

#### Case A — New or near-dead trunk (`age <= 2` OR `life < 4`)

```
dy = 0
dx = rand() % 3 - 1      // uniform from {-1, 0, +1}
```

#### Case B — Young trunk (`age < multiplier * 3`)

Raises one level every `floor(multiplier * 0.5)` steps:

```
if age % floor(multiplier * 0.5) == 0:
    dy = -1
else:
    dy = 0
```

Horizontal movement from a 10-sided die:

| dice (0–9) | dx |
|------------|----|
| 0          | -2 |
| 1–3        | -1 |
| 4–5        |  0 |
| 6–8        | +1 |
| 9          | +2 |

> Note: the source comment at `cbonsai.c:305` says "every (multiplier * 0.8)
> steps" but the actual code uses `multiplier * 0.5` (`cbonsai.c:305`).

#### Case C — Middle-aged trunk (`age >= multiplier * 3`)

```
roll(dice, 10)
if dice > 2:  dy = -1
else:         dy = 0

dx = rand() % 3 - 1      // uniform from {-1, 0, +1}
```

---

### 3.2 `shootLeft` (`cbonsai.c:324–335`)

Trends **left** with little vertical movement.

**Vertical** — 10-sided die:

| dice (0–9) | dy |
|------------|----|
| 0–1        | -1 |
| 2–7        |  0 |
| 8–9        | +1 |

**Horizontal** — 10-sided die:

| dice (0–9) | dx |
|------------|----|
| 0–1        | -2 |
| 2–5        | -1 |
| 6–8        |  0 |
| 9          | +1 |

---

### 3.3 `shootRight` (`cbonsai.c:337–348`)

Mirror of `shootLeft`; trends **right**.

**Vertical** — identical to `shootLeft`:

| dice (0–9) | dy |
|------------|----|
| 0–1        | -1 |
| 2–7        |  0 |
| 8–9        | +1 |

**Horizontal** — 10-sided die (mirrored):

| dice (0–9) | dx |
|------------|----|
| 0–1        | +2 |
| 2–5        | +1 |
| 6–8        |  0 |
| 9          | -1 |

---

### 3.4 `dying` (`cbonsai.c:350–364`)

Mostly horizontal; wide lateral spread (-3 to +3).

**Vertical** — 10-sided die:

| dice (0–9) | dy |
|------------|----|
| 0–1        | -1 |
| 2–8        |  0 |
| 9          | +1 |

**Horizontal** — 15-sided die:

| dice (0–14) | dx |
|-------------|----|
| 0           | -3 |
| 1–2         | -2 |
| 3–5         | -1 |
| 6–8         |  0 |
| 9–11        | +1 |
| 12–13       | +2 |
| 14          | +3 |

---

### 3.5 `dead` (`cbonsai.c:366–372`)

Fills in surrounding area in all directions equally.

**Vertical** — 10-sided die:

| dice (0–9) | dy |
|------------|----|
| 0–2        | -1 |
| 3–6        |  0 |
| 7–9        | +1 |

**Horizontal**:

```
dx = rand() % 3 - 1      // uniform from {-1, 0, +1}
```

---

## 4. Glyph Selection — `chooseString`

`cbonsai.c:379–417`

A glyph string is chosen each step based on `(type, life, dx, dy)`.
If `life < 4`, the type is **overridden to `dying`** regardless of actual
branch type (`cbonsai.c:387`).

```
if life < 4: effective_type = dying

switch effective_type:

  trunk:
    if dy == 0:  glyph = "/~"
    if dx < 0:   glyph = "\\|"
    if dx == 0:  glyph = "/|\\"
    if dx > 0:   glyph = "|/"

  shootLeft:
    if dy > 0:   glyph = "\\"
    if dy == 0:  glyph = "\\_"
    if dx < 0:   glyph = "\\|"
    if dx == 0:  glyph = "/|"
    if dx > 0:   glyph = "/"

  shootRight:
    if dy > 0:   glyph = "/"
    if dy == 0:  glyph = "_/"
    if dx < 0:   glyph = "\\|"
    if dx == 0:  glyph = "/|"
    if dx > 0:   glyph = "/"

  dying | dead:
    glyph = leaves[ rand() % leavesSize ]   // random leaf string
```

The `shootLeft` and `shootRight` `dy` checks take priority over `dx`; the
conditions are tested in the order shown above (top to bottom). In C, the
first `strcpy` that executes wins because there is no `break` between some
cases — however each branch of the switch only ever executes one `strcpy`.
A TypeScript port should use `if / else if` chains in the order shown.

**Wide-character guard** (`cbonsai.c:502`): after computing `(x, y)`, the
glyph is only printed when `x % wcwidth(firstWideChar) == 0`. For all ASCII
glyphs `wcwidth` is 1, so the guard is always true; it only matters for
multi-column Unicode leaf strings.

---

## 5. Color Selection — `chooseColor`

`cbonsai.c:267–286`

```
switch type:
  trunk | shootLeft | shootRight:
    if rand() % 2 == 0:  use BOLD + COLOR_WOOD_BRIGHT
    else:                 use COLOR_WOOD_DARK

  dying:
    if rand() % 10 == 0: use BOLD + COLOR_LEAF_BRIGHT
    else:                 use COLOR_LEAF_BRIGHT

  dead:
    if rand() % 3 == 0:  use BOLD + COLOR_LEAF_DARK
    else:                 use COLOR_LEAF_DARK
```

Default color pair indices (`cbonsai.c:17–21`):

| Pair constant       | Index | Default terminal color |
|---------------------|-------|------------------------|
| `COLOR_LEAF_DARK`   | 1     | 2 (dark green)         |
| `COLOR_WOOD_DARK`   | 2     | 3 (dark yellow/brown)  |
| `COLOR_LEAF_BRIGHT` | 3     | 10 (bright green)      |
| `COLOR_WOOD_BRIGHT` | 4     | 11 (bright yellow)     |
| `COLOR_TEXT`        | 5     | 8 (grey)               |

All four leaf/wood colors are user-configurable via `-k`.

---

## 6. Recursive Core — `branch`

`cbonsai.c:419–513`

This is the heart of the algorithm. It is **iterative inside** (a `while`
loop over the life counter) but **recursive outward** (child branches are
spawned by calling `branch` again during the loop).

### 6.1 Pseudocode

```
function branch(y, x, type, life):
    counters.branches++
    age           = 0
    shootCooldown = multiplier          // cbonsai.c:424

    while life > 0:
        life--
        age = lifeStart - life          // cbonsai.c:430

        // --- Movement ---
        (dx, dy) = setDeltas(type, life, age, multiplier)

        // Near-ground clamp: if moving downward near the bottom, reduce dy
        // cbonsai.c:436
        maxY = treeWindowHeight
        if dy > 0 AND y > (maxY - 2):
            dy--

        // --- Recursive spawn rules ---

        // (A) Near-dead: burst into leaves
        if life < 3:                                        // cbonsai.c:439
            branch(y, x, dead, life)

        // (B) Dying trunk: shed dying branches
        else if type == trunk AND life < (multiplier + 2): // cbonsai.c:443
            branch(y, x, dying, life)

        // (C) Dying shoot: shed dying branches
        else if (type == shootLeft OR type == shootRight)   // cbonsai.c:447
             AND life < (multiplier + 2):
            branch(y, x, dying, life)

        // (D) Trunk branching
        else if type == trunk
             AND (rand() % 3 == 0 OR life % multiplier == 0): // cbonsai.c:455

            // (D1) Rare sub-trunk
            if rand() % 8 == 0 AND life > 7:               // cbonsai.c:458
                shootCooldown = multiplier * 2
                branch(y, x, trunk, life + (rand() % 5 - 2))

            // (D2) New shoot (if cooldown expired)
            else if shootCooldown <= 0:                     // cbonsai.c:464
                shootCooldown = multiplier * 2
                shootLife = life + multiplier
                counters.shoots++
                counters.shootCounter++
                // alternate left/right via parity of shootCounter
                shootType = (counters.shootCounter % 2) + 1  // 1=shootLeft, 2=shootRight
                branch(y, x, shootType, shootLife)

        // Decrement shoot cooldown every step regardless of what happened above
        shootCooldown--                                     // cbonsai.c:479

        // --- Move position ---
        x += dx
        y += dy                                             // cbonsai.c:488–489

        // --- Draw ---
        color  = chooseColor(type)
        glyph  = chooseString(type, life, dx, dy)
        if x % wcwidth(glyph[0]) == 0:                     // cbonsai.c:502
            drawAt(y, x, glyph, color)

        // --- Live-mode screen refresh ---
        if liveMode AND NOT (loading AND counters.branches < targetBranchCount):
            updateScreen(timeStep)                          // cbonsai.c:510
```

### 6.2 Spawn rule commentary

**Rule A** fires when a branch is almost out of life (`life < 3`). It spawns a
`dead` branch at the *current position before moving*, creating a spray of
leaf characters around the tip. This is what produces the dense leaf clusters
at the end of every branch.

**Rules B and C** fire when trunk or shoot life drops below `multiplier + 2`.
They spawn `dying` branches, which fan out widely (see `setDeltas` §3.4) and
use leaf colors, creating the transition zone between wood and foliage.

**Rule D** applies only to trunks and fires when either a random 1-in-3 chance
hits, or when `life` is an exact multiple of `multiplier`. Within rule D:

- **D1** (sub-trunk): 1-in-8 chance, only when `life > 7`. Spawns a new trunk
  with `life + rand(-2..+2)`, effectively forking the main trunk. The `+/-2`
  jitter means sub-trunks are slightly longer or shorter than the parent.
- **D2** (shoot): fires when the shoot cooldown has reached zero, using
  `shootLife = life + multiplier`. The +multiplier bonus means shoots start
  with *more* life than the trunk had at spawn time, so they can spread widely.
  `shootCooldown` is reset to `multiplier * 2` after every shoot or sub-trunk
  spawn, preventing a burst of shoots in quick succession.

**Cooldown**: `shootCooldown` starts at `multiplier` and decrements every step
(`cbonsai.c:479`). It is reset to `multiplier * 2` whenever a shoot or
sub-trunk is spawned. This enforces a minimum spacing of `multiplier * 2` steps
between consecutive shoots on the same trunk segment.

**Shoot parity** (`cbonsai.c:475`): `shootType = (shootCounter % 2) + 1`.
Since `shootCounter` is incremented before every shoot, consecutive shoots
alternate: if `shootCounter` is even the result is 1 (`shootLeft`), if odd the
result is 2 (`shootRight`). The initial value of `shootCounter` is `rand()`
(`cbonsai.c:704`), so the first shoot direction is randomized.

**Position update order** (`cbonsai.c:488–489`): position is updated *after*
spawning children but *before* drawing. Children therefore start at the
pre-move position.

---

## 7. Determinism and Save/Load

`cbonsai.c:89–124`, `cbonsai.c:1057–1062`

### 7.1 RNG seeding

```
if seed == 0:
    seed = time(NULL)      // cbonsai.c:1061
srand(seed)                // cbonsai.c:1062
```

Every random number in the algorithm flows through a single call stream on the
C standard `rand()` — `setDeltas`, `chooseColor`, `chooseString`, and the
spawn-decision rolls all consume from the same sequence. The tree is therefore
**fully deterministic** given the same `seed`, `lifeStart`, `multiplier`, and
`leaves` list.

### 7.2 Save format

`cbonsai.c:89–101`

The save file contains exactly two integers separated by a space:

```
<seed> <branchCount>
```

`branchCount` is the value of `counters.branches` at the end of the growth run
(`cbonsai.c:131`). No pixel/cell data is stored.

### 7.3 Load and replay

`cbonsai.c:104–124`, `cbonsai.c:510`

On load, `seed` and `targetBranchCount` are read from the file and stored in
`conf`. Growth is then replayed **identically** from scratch by re-seeding with
the same `seed` and calling `growTree` normally. Screen updates are **skipped**
while `counters.branches < targetBranchCount` (`cbonsai.c:510`), so the
display jumps immediately to the saved state.

```
// Load sequence:
loadFromFile()             // sets conf.seed, conf.targetBranchCount
srand(conf.seed)
growTree()                 // full replay; drawing suppressed until branch == target
```

Because the RNG sequence is deterministic, replaying to branch N produces
exactly the same tree state as the original run had at branch N, including all
subsequent growth from that point.

---

## 8. Tuning Reference Table

> Source note (`cbonsai.c` architecture comment in CLAUDE.md): "Growth tuning
> constants (life, multiplier, the dice thresholds in `setDeltas`) are
> hand-tuned to look best at the **default size** — large trees look less
> bonsai-like by design."

| Variable / constant                       | Where defined / changed     | Visual effect                                                                                                                                        |
|-------------------------------------------|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `lifeStart` (`-L`, default `32`)          | `cbonsai.c:815`             | Overall size of the tree. Higher → taller, more branching, denser. Lower → short, sparse, shrub-like.                                               |
| `multiplier` (`-M`, default `5`)          | `cbonsai.c:816`             | Branching density and shoot spacing. Higher → more branching nodes, larger cooldown gaps between shoots, shoots start with more life (+multiplier).  |
| `seed` (`-s`, default `time()`)           | `cbonsai.c:1061–1062`       | Full determinism. Identical seed + identical params → pixel-identical tree. Different seeds produce different shapes, leans, and leaf placements.    |
| Trunk case B `dy` cadence (`mult * 0.5`)  | `cbonsai.c:305`             | How steeply the young trunk rises. Smaller divisor → rises faster (more vertical). Larger → more lateral spread before ascending.                   |
| Trunk case B `dx` table (10-sided)        | `cbonsai.c:309–313`         | Lateral lean of young trunk. Shifting probabilities left → tree leans left; right → leans right.                                                    |
| Trunk case C `dy` threshold (`dice > 2`)  | `cbonsai.c:318`             | Upward growth rate of the mature trunk. Lower threshold → more steps go upward; higher threshold → more lateral drift.                              |
| `shootLeft`/`shootRight` `dy` table       | `cbonsai.c:326–329, 339–342`| Vertical behavior of shoots. Currently biased flat; increasing upward weight makes shoots arc upward.                                               |
| `shootLeft`/`shootRight` `dx` table       | `cbonsai.c:331–334, 344–347`| How strongly shoots spread laterally. Wider dx values → more horizontal spread.                                                                     |
| `dying` `dx` table (15-sided, span -3..3) | `cbonsai.c:357–363`         | Width of the dying/leaf transition zone. Wider table → leaves spread further from branch tips.                                                       |
| `dead` `dy` table (10-sided)              | `cbonsai.c:367–371`         | Vertical scatter of leaf-burst clusters. Currently balanced (-1/0/+1 at 30/40/30%); skewing upward makes leaves float.                             |
| Sub-trunk probability (`rand() % 8 == 0`) | `cbonsai.c:458`             | How often the trunk forks into a secondary trunk (vs. a shoot). Currently 12.5%. Lowering the modulus → more forked trunks.                        |
| Sub-trunk life jitter (`rand() % 5 - 2`)  | `cbonsai.c:460`             | Size variation among sub-trunks relative to the parent trunk's remaining life. Range is -2..+2.                                                     |
| `shootLife = life + multiplier`            | `cbonsai.c:467`             | How long shoots live. Larger bonus → longer, more curved shoots. Setting to `life` alone produces very short stub shoots.                           |
| Shoot-trigger probability (`rand() % 3`)  | `cbonsai.c:455`             | How often the trunk *considers* spawning a shoot at each step. Currently 1-in-3 (or forced at every `multiplier` steps). Lower modulus → denser.   |
| `shootCooldown` initial (`multiplier`)     | `cbonsai.c:424`             | Minimum gap before the first shoot can appear. Larger → shoots start further up the trunk.                                                          |
| `shootCooldown` reset (`multiplier * 2`)   | `cbonsai.c:459, 465`        | Minimum gap between consecutive shoots. Larger → sparser, more evenly spaced branching.                                                             |
| `leaves[]` strings (`-c`, default `"&"`)  | `cbonsai.c:857`             | The character(s) used for all leaf/tip glyphs. Multi-character or multi-column Unicode strings are handled by the wide-char guard.                  |
| `baseType` (`-b`, default `1`)            | `cbonsai.c:817`             | ASCII art base pot under the tree; purely cosmetic, does not affect growth.                                                                          |
