# QUARTETS batch brief — read this AND `_build/AUTHORING_QUARTETS.md` before writing a line

Repo root: `/Users/mishasalahshoor/cbai-ops/misha-arcade` (static site, no build step,
Python stdlib only, no pip). You write exactly ONE file: `_build/<your module>.py`.

---

## 0. THE CHECKPOINT RULE — this is the rule that has cost this project the most work

**Write your file to disk as soon as it holds 4 boards. Then keep appending and
re-saving after every 1-2 further boards.** Never hold a whole batch in your head to
write in one shot. A usage limit can kill you at any moment; whatever is on disk
survives and whatever is in your head does not. A dozen previous authoring agents died
mid-batch — the ones who checkpointed left usable boards, the ones who didn't left
nothing.

Practical shape:
1. Write the file with the header + 4 finished boards. Run the validator. Fix.
2. Append boards 5-6. Re-save. Run the validator.
3. Append 7-8. Re-save. Validate. Then 9-10.

A 6-board file that validates is a WIN. A 10-board file that only exists in your
reasoning is a total loss.

---

## 1. What you produce

A module defining exactly one list `BOARDS`, per `_build/AUTHORING_QUARTETS.md`. Read
that file in full — it is the binding spec (schema, trap/uniqueness rules, voice).

**Target: 10 boards.** Stop at 10.

## 2. Validate — this is the real gate

```bash
cd /Users/mishasalahshoor/cbai-ops/misha-arcade
python3 _build/gen_connections2.py --check-module <your_module_name>
```

It must print `OK`. Run it after every checkpoint, not just at the end.

Limits the validator actually enforces: title <= 24, category name <= 40,
note <= 95, epilogue <= 150, tile <= 14 chars UPPERCASE. The authoring spec asks for
tighter numbers (22 / 34 / 75 / 115) — **aim for the spec's tighter numbers**, they read
better on a phone. Notes and epilogues should be punchy, not thorough.

`--check-module` validates your batch in isolation. It does NOT see dataset-wide tile
reuse — that is checked at the end by the coordinator, so use the collision tools below.

## 3. Collision tools (other agents are writing other modules right now)

```bash
python3 _build/conn_tools.py counts             # boards per pack currently on disk
python3 _build/conn_tools.py cats <pack>        # every category name already used
python3 _build/conn_tools.py titles <pack>      # every board title already used
python3 _build/conn_tools.py freq LEAD SPRING   # dataset-wide use of a tile, headroom
python3 _build/conn_tools.py hot 3              # tiles at or near the reuse cap
```

- **Board titles must be new.** Check `titles` for your pack AND `titles` with no
  argument (titles are informally global).
- **Category names must be new.** Check `cats <pack>` before you commit to a group.
- A tile string may appear in at most **6 boards dataset-wide**. Check `freq` for
  anything that feels common. Prefer fresh tile strings — repetition across the archive
  is the thing that makes it feel small, even when every board is legal.

## 4. The players and the bar

Two strong daily solvers who play together every morning: **Misha** (she/her,
Persian-American, from Houston) and **David** (from London). Six years together in
**Edinburgh**, now in **Cambridge, Massachusetts**. Both Manchester United fans.

Difficulty sits between "solid daily players" and "genuinely strong". Calibrate so a
good day scores **~70-75 out of 100** and an excellent one **~90**.

**Never name a real colleague, an employer, or build office/work content — they
explicitly declined it.** No romance clichés, no "aww you two" voice. Warm and dry.

### The two board-killing failures

1. **A tile that could defensibly sit in two groups without being declared as a trap.**
   These players spot it instantly and it ruins the board. Be ruthless: for every tile,
   ask "could a smart person argue this into another group here?" If yes, either
   declare it in `traps` or change the tile. Undeclared ambiguity is the #1 defect.

2. **A group whose four tiles are transparently one category.** Four stadiums, four
   countries, four elements — the *kind* of thing labels the group before any thought
   happens, and the board solves itself on sight. The players called this "spiky" and
   rejected a whole cabinet over it. **Every group should need a moment of work.**
   Mix registers on every board: one wordplay group, one `___ WORD` compound, one
   hidden-word / homophone / anagram group, one knowledge group.

### Purple is always the trick
The fourth group should **reframe the other three** — it should steal a tile that
looked settled, or reveal that three innocuous words were doing something else all
along. Purple is not "the most obscure knowledge"; it is the reframe.

### Traps
Every board declares at least one. Re-read the uniqueness section of the authoring
spec: **never declare a 2-cycle** (a tile in group 0 that also fits 1 PLUS a tile in
group 1 that also fits 0) and never a 3-cycle. Safe pattern: several tiles from
different groups all pointing at the SAME other group, or all pointing outward in
different directions with no cycle.

### Difficulty spread across your 10 boards
Roughly: **1-2 at diff 1-2, 3 at diff 3, 3-4 at diff 4, 1 at diff 5.** Do not write ten
diff-4 boards. Day 300 must not be harder than day 5.

### Facts
Facts in notes must be **true**. WebSearch is available — verify anything checkable
rather than guessing. Do not invent etymologies. If you are not certain, cut the claim
or rewrite the group. No slurs, no punching down, no turning a living conflict into a
punchline.

## 5. Read for the bar before you write

Read `_build/conn_general14.py` (10 boards, the most recent and among the strongest) and
one existing batch from **your own pack**. Match that voice: dry, specific, one beat of
surprise per note.

## 6. Hard don'ts

- **Do not run `git add -A`, `git add .`, `git commit -a`, or commit or push at all.**
  A background loop handles commits. Several Claude sessions work in this repo.
- Do not edit any file except your own `_build/<module>.py`. Not `gen_connections2.py`,
  not other `conn_*.py`, not `core/data/connections.js` (it is generated).
- No pip, no dependencies.

## 7. Report back

Module path, final board count, difficulty spread, the validator's last line, and any
board you were unsure about (name it honestly — the coordinator will re-check it).
