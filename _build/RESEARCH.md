

==========================================================================================
## NYT Mini Crossword   [confidence: high]
https://www.nytimes.com/crosswords/game/mini

### CORE LOOP
Open a tiny crossword and fill every white square with one letter. You tap/click a square (or a clue) to place the cursor; the active square highlights yellow and the rest of the current entry highlights blue, with the matching clue highlighted in the clue list/clue bar. You type letters and the cursor auto-advances along the current direction (Across or Down); the direction toggles by pressing Space, by pressing an arrow key perpendicular to the current direction, or by re-tapping the square you are already on. Because the grid is 5x5 (7x7 Saturdays) with only 3-5 letter answers, almost every square is a crossing, so you solve by ping-ponging between an Across you know and the Downs it feeds. A timer runs from the moment you enter the puzzle. When the last square is filled correctly the puzzle auto-validates itself: music plays and a congratulatory message appears with your time. There is no submit button and no guess limit - you cannot 'lose'. The only competitive dimension is elapsed time, which is posted to the NYT Games multi-game Leaderboard where friends' times sit side by side.

### RULES
- Grid: 5x5 on Sunday through Friday; 7x7 on Saturday (Wikipedia, corroborated by third-party puzzle sites). One claim that it 'occasionally expands to 6x6' exists (Beebom) but I found no verified 6x6 example - treat 6x6 as unverified.
- Verified weekday example (Wed 22 Jul 2026, 5x5): exactly 10 clues - 5 Across + 5 Down. Across answer lengths 3,4,5,4,3; Down lengths 5,4,3,4,3; therefore 19 white squares and 6 black squares in a diamond-ish pattern. This 5A+5D/10-clue shape is the canonical weekday Mini.
- Verified Saturday example (Sat 25 Jul 2026, 7x7): 18 clues - 7 Across + 11 Down, highest clue number 16, answers 3 to 7 letters. So Saturday roughly doubles the clue count, not just the area.
- One letter per square. No guess limit, no lives, no penalty for wrong letters - you simply cannot finish until every square is right.
- Completion is auto-detected: the puzzle validates the instant the final square is correct. No manual submit.
- Autocheck (toggle): checks each square as you type it. When on, incorrect letters are flagged immediately with a slash / red line through the square. Reported behaviour (Pratt design critique, single source): with Autocheck on, backspacing skips over letters already confirmed correct and only deletes the wrong ones.
- Check: available as Check Square, Check Word, Check Puzzle. Correct letters that have been confirmed turn BLUE. Incorrect letters get the slash mark.
- Reveal: available as Reveal Square, Reveal Word, Reveal Puzzle - fills in the correct letters. A revealed square is left with a red indicator marking that you took help (single source, medium confidence).
- Clear: clears the whole puzzle to start again; clearing the entire puzzle restarts the timer.
- Pencil mode: a pencil icon toggles pen (black letters) vs pencil (grey letters) for tentative fill. Documented for the Mini as well as the full Crossword.
- Timer: displayed above the grid. Pauses when you hit pause OR when you leave the puzzle, resumes on Continue, and restarts if the whole puzzle is cleared. Can be hidden via the gear icon > turn off Show Timer.
- NO STREAK: the NYT Help Center states explicitly that 'The Mini Crossword does not have a streak feature.' Gold-star/blue-star streaks apply to the full Crossword and the Midi, not the Mini. Time stats live in the Leaderboard instead.
- Leaderboard time is recorded once: 'Solve time is calculated the first time that you solve a puzzle' - re-solving does not improve your posted time.
- Rebus: Escape enters Rebus mode and this shortcut is listed on the Mini help page, but that shortcut block appears to be boilerplate shared across all NYT crossword help pages. I found no evidence of an actual rebus square ever appearing in a Mini - assume one letter per square for a clone (low confidence on rebus ever occurring).
- Minis are occasionally lightly themed with a revealer-style clue. Verified example, 22 Jul 2026: 5A 'Just peachy ... or a hint to the two letters that appear most often in this grid' (DANDY, in a grid stuffed with D and Y).
- Difficulty is roughly flat across the week rather than escalating Mon-Sat like the full Crossword; the only structural change is the bigger Saturday grid. (Claims that a specific weekday is 'easiest' are SEO filler - unverified.)

### SCORING
No points system at all - the Mini's only score is elapsed solve time, in mm:ss, and the binary fact of completion. There is no guess limit, no deduction for wrong letters, and (uniquely among NYT games) no streak. Comparison happens on the NYT Games multi-game Leaderboard, which lists friends' Mini times alongside Wordle/Connections/Spelling Bee results, with invite links and some celebrity solvers. Only your FIRST solve of a given puzzle sets your recorded time. Colour semantics carry the only other 'scoring' signal: yellow = active square, blue highlight = active entry, black letters = pen, grey letters = pencil, blue letters = confirmed correct by Check, slash/red line = confirmed incorrect, red corner indicator = revealed (i.e. helped). The help-tool penalty is social/streak-based rather than numeric: for the full Crossword and the Midi, Check or Reveal resets the streak; for the Mini there is no streak to reset, and the only claim of a penalty is a secondary source saying revealing 'disqualifies your time on the leaderboard' (medium-low confidence, not in NYT's own documentation).

### DAILY
One puzzle per day, seven days a week. Weekday and Saturday puzzles go live at 10 p.m. ET the previous day; Sunday puzzles go live at 6 p.m. ET on Saturday (per NYT Help Center). Puzzle of the day is fixed by calendar date, not randomised. Subscribers also get an archive of past Minis on web and in the Games app (how far back it reaches is not documented - the Mini started 2014, so plausibly ~4,300 puzzles, unverified). Since 27 Aug 2025 the Mini is subscriber-only (it had been free since 2014), bundled with Tiles and Letter Boxed going behind the same paywall.

### SHARE
The Mini has no Wordle-style emoji grid. I found no documented copy-to-clipboard share string. Sharing happens two ways: (1) the in-app/web Leaderboard, where friends you have invited see each other's daily Mini times in a list, and (2) people screenshotting the congratulations panel showing their time. For a clone, this is a gap worth filling deliberately: a text share is easy to design here, e.g. a compact time + help-usage line plus an optional square-by-square emoji trail of solve order or of which squares needed a check. Treat any emoji-grid format as your invention, not a copy of NYT.

### UI
- WHAT GOOD CROSSWORD UIs DO: keep the active clue permanently visible without covering the grid. On phones the clue sits in a fixed bar directly above the on-screen keyboard, and the bar should let you swipe or tap arrows to move to the previous/next clue. A bad app hides the clue behind the keyboard or requires scrolling to read it.
- Highlight two levels, not one: active square in a strong colour (NYT uses yellow) and the rest of the active entry in a weaker tint (NYT uses blue), plus reciprocal highlighting of the clue in the list. Bad apps highlight only the cursor, so you lose track of direction.
- Label the clue with number AND direction in the clue bar ('4-Down'). The Pratt design critique flags NYT for omitting this, hurting discoverability of where the clue points.
- Direction toggle must be reachable three ways: tapping the already-active square, Space, and pressing an arrow key perpendicular to the current direction (perpendicular arrow flips direction in place; parallel arrow moves one square). NYT documents arrow keys and Space; the exact perpendicular-flip semantics are standard across implementations but I did not find NYT documenting it explicitly - medium confidence.
- Backspace semantics are where bad apps fail. Correct behaviour: if the current square has a letter, delete it and stay; if it is empty, move backwards one square and delete that. NYT additionally skips over Check-confirmed-correct letters when Autocheck is on. Never let backspace jump across a black square into the previous entry unpredictably.
- Auto-advance at the end of an entry needs to be configurable, and NYT does exactly this: cursor options are 'Skip filled squares', 'Jump back to the first blank', and 'Jump to the next clue'. Speed solvers want skip-filled + jump-to-next-blank; beginners want the cursor to stop. Shipping one hardcoded behaviour is the single most common clone mistake.
- Tab / Shift+Tab must jump to next/previous clue; Escape (or a long-press) enters rebus/multi-letter mode even if you never use it for 5x5.
- Auto-validate on completion with a real reward moment (NYT plays music and shows a congratulations panel with the time). Do not make the user press 'submit'. Equally, do not show a nag/error when the grid is merely incomplete.
- Make help tools granular and honest: separate Check Square / Check Word / Check Puzzle and Reveal Square / Word / Puzzle, and mark helped squares permanently (NYT leaves a red indicator on revealed squares) so a time is never silently inflated by help.
- Never re-render or resize the grid when the keyboard opens. iPad users specifically complain that the Mini's on-screen keyboard covers the bottom row of the grid in landscape - lay out with the keyboard height reserved from the start.
- Use a custom in-page A-Z keyboard rather than the native one on mobile: no autocorrect, no autocapitalise, no suggestion strip, no numeric row, big touch targets, and letters do not trigger viewport zoom. This also kills the 'wrong keyboard layout appears' class of bug reported for the NYT app.
- Touch targets: on a 5x5 the squares are huge and this is easy; on a 7x7 or a 9x9 keep cells >=40 CSS px and add a light 1px grid line rather than heavy borders. Support pinch-zoom/pan on larger grids without breaking cursor hit-testing.
- Timer honesty: pause on blur/visibility change and on an explicit pause button, resume on Continue, reset if the grid is cleared, and let the timer be hidden entirely - anxiety about the clock is a real reason people quit. NYT does all four.
- Persist every keystroke immediately (localStorage) so a refresh or a phone lock never loses fill, cursor position, direction, or elapsed time.
- Keep pen/pencil (grey) mode but give it a clearer affordance than a bare pencil icon - the Pratt critique notes the pencil reads as 'edit' rather than 'tentative', and the Autocheck icon is unrecognisable (it was mistaken for a life raft).
- Dark mode and a colourblind-safe palette: the yellow/blue pair is fine, but the incorrect-letter cue must not be colour-only - use the slash/strikethrough shape so it survives greyscale.
- Do not fragment stats. Users complain the NYT app gives each game its own stats screen, streak and leaderboard with no unified 'you played 6 puzzles this week' view. One clone, one stats page.
- Offer the archive up front. Zero free archive access is the loudest structural complaint about NYT Games; an offline clone should open with a calendar/grid of every past puzzle and no gating.

### DATA NEEDED
- A puzzle corpus. Per puzzle: date, grid size (5 or 7), a 25- or 49-cell layout string marking black squares, the answer letter for each white cell, computed clue numbering, and clue text for each entry keyed by number+direction. Roughly 0.8-2 KB of JSON per puzzle, so a full year is ~0.5-1 MB and is fine to inline or lazy-load as one JSON file per year.
- Clue numbering can be derived at build time from the layout (standard rule: a cell is numbered if it is white and has no white neighbour above, or none to the left), so you only need to store layout + answers + clue text, not numbering.
- If you want to GENERATE puzzles rather than transcribe them: a scored word list of 3-7 letter entries (~15-30k entries is plenty for 5x5; the binding constraint is a good 5-letter list, ~5-8k common words) plus a clue bank mapping each answer to one or more clues at a chosen difficulty. Clue writing is the real cost - a 5x5 needs 10 clues, and a generator that fills grids but has no clues is useless.
- A black-square pattern library. Hand-collect 15-30 valid 5x5 patterns (the classic being 6 black squares giving 3/4/5/4/3 rows) and 10-20 7x7 patterns, so generated grids look like real Minis instead of random noise.
- For head-to-head: nothing server-side, but you need a stable per-puzzle id (the date) and a compact result encoding you can paste to each other, plus localStorage schema for results history, per-square timing, and settings.
- Optional theme data: revealer clue + the letters/entries it points at, if you want to reproduce the occasional mini-theme.
- Optional: a custom-pack format (JSON blob importable via paste or file) so users can author packs of personal clues.

### WEAKNESSES
- The Mini went behind the paywall on 27 Aug 2025 after ~11 years free (along with Tiles and Letter Boxed), and the reaction was overwhelmingly negative - Kotaku catalogued replies like 'GIVE US THE MINI CROSSWORD BACK YOU GREEDY SCUMBAGS' and 'Ask your bosses how it feels to ruin a small part of thousands of people's daily routines.' Reported price is about $6/month or $50/year for NYT Games (medium confidence on the figures). This alone is the strongest argument for an offline clone.
- No streak feature, unlike Wordle/Connections/the full Crossword/the Midi. For a daily-ritual game that is a strange omission and removes the main reason to come back on a bad day.
- Your leaderboard time is only recorded on your FIRST solve, so there is no way to re-attempt for a better time - and no practice mode at all.
- Only one puzzle per day and no free archive, so if you want more you are stuck. Third-party scrapers and clones exist precisely because of this.
- Difficulty is fixed and un-tunable. Experienced solvers find it trivially easy (a Slate piece called the Mini an 'Utter Disgrace to the NYT Crossword Brand'), while newcomers hit walls on specific squares - and neither group can adjust anything.
- Heavy dependence on pop-culture and sports trivia in a 3-5 letter grid: with only 10 clues, one unknown name (an SNL cast member, a team abbreviation like NYY) can hard-block the whole puzzle, and there is no crossing rich enough to rescue you. Reviewers repeatedly note that if you don't know the album/mascot you are simply stuck.
- iPad landscape: the on-screen keyboard can cover the bottom row of the grid; the Crossword's keyboard sometimes appears in the wrong layout (App Store review reports).
- Fragmented stats and profile - separate stats screen, streak and leaderboard per game, no unified cross-game view.
- Interface nits from a formal design critique: clues are not labelled with number+direction, the Autocheck icon is unrecognisable, and the pencil icon reads as 'edit' rather than 'tentative'.
- Reported bugs in shared/party solving: a recent update made Across clues display as duplicated Down clues in party mode, and users report the app being effectively unplayable over AirPlay (App Store reviews, medium confidence).
- Bug reporting and support are described as obtuse, with no simple in-app way to report a broken clue or puzzle.
- No head-to-head mode. Two people who want to race must both solve separately and then compare numbers on a leaderboard - there is no shared board, no live race, no rematch.

### IMPROVEMENT IDEAS
- LIVE HEAD-TO-HEAD RACE for two: same puzzle, one screen each, a shared start countdown, and a slim opponent progress bar showing squares-filled count (not letters) so you feel them gaining without being able to copy. Ends with a split of who filled which square first, rendered as a two-colour ownership map of the grid - by far the most fun thing an offline clone can do that NYT cannot.
- GHOST RACE (works offline, no networking, no server): when one partner solves, store a timestamped keystroke trace. The other partner then races the ghost, watching squares light up at exactly the pace the first solver managed. This gives real head-to-head with zero infrastructure and works even when they solve hours apart.
- Per-square timing autopsy after each solve: 'you lost 41s on 4-Down' with a heatmap of time-per-square, and a two-player diff showing which clues each of you was faster on. Couples compare times endlessly; give them something to compare beyond one number.
- Shared/couple streak: a streak that only advances if BOTH solved that day. It converts a solo habit into a joint one and is the single cleanest fix for the Mini's missing streak. Track three streaks - hers, his, and the joint one - plus a 'grace token' each per month so one bad travel day doesn't nuke a 200-day run.
- Handicap system so an uneven pair stays competitive: automatic per-player time handicap derived from the trailing 10-puzzle median, shown transparently, plus an ELO-style rating and a weekly/monthly scoreboard with a season reset.
- Difficulty dial the original refuses to offer: Easy/Normal/Hard clue sets for the SAME grid (store 2-3 clues per answer at different obliqueness), plus a DOWNS-ONLY mode (hide all Across clues) which is the standard way strong solvers make a Mini interesting again.
- Hard mode variants for variety on a tiny grid: no-Autocheck, hidden timer, one-letter-only reveal budget, or 'sudden death' where the puzzle locks for 10s on a wrong letter. Also an untimed Zen mode for anxious mornings.
- Full offline archive with a calendar heatmap - every past puzzle, unlimited replays, and a separate 'best re-solve' time distinct from your official first-solve time, so practising is rewarded instead of being pointless.
- Unlimited practice via a generator: procedurally fill 5x5 and 7x7 patterns from the word list and reuse banked clues, so there is always another puzzle. Tag generated puzzles distinctly so they never pollute the daily head-to-head stats.
- CUSTOM PACKS as a love-letter feature: a small in-app constructor where one partner writes a 5x5 for the other, with clues referencing their own life ('where we met', a friend's nickname, the cat's name). Export as a single paste-able JSON/base64 string or a URL fragment so it can be sent by text with no server. Anniversary and birthday packs write themselves.
- Co-op mode variants: (a) alternate turns, one entry each; (b) split the clue set - she gets all Acrosses, he gets all Downs, on one shared grid, which forces actual talking; (c) 'phone a partner' where one hint request per puzzle reveals a clue to the other person only, who must describe it without saying the answer.
- Fix the archive/first-solve rigidity: keep an honest 'assisted' flag rather than silently voiding results. Show time plus a help badge (0 checks, 1 reveal), so an assisted solve still counts for the joint streak but is visibly marked in the head-to-head log.
- Better share text than NYT has (it has none): a compact copyable block with date, both times, help badges, and the winner - designed to be pasted into their own chat thread rather than a public feed.
- Robustness the original doesn't need but a clone does: keystroke-level localStorage autosave, an explicit Export/Import backup of all history (this matters a lot given no server copy), a custom A-Z keyboard that never triggers autocorrect, and reserved keyboard space so the 7x7 Saturday grid is never covered on a phone or iPad.
- Accessibility as a feature, not an afterthought: full keyboard-only solving on desktop, cursor-behaviour settings exposed on the first run instead of buried, colourblind-safe incorrect marks using a slash shape, adjustable cell size, and a genuine dark mode.


==========================================================================================
## NYT Midi Crossword   [confidence: medium]
https://www.nytimes.com/crosswords/game/midi

### CORE LOOP
A mid-size themed crossword sitting between the Mini and the full 15x15. Same solving mechanics as the Mini - click a square or clue, active square yellow, active entry blue, type letters with auto-advance, Space or a perpendicular arrow to flip Across/Down, Tab to jump clues - but on a 9x9 grid with about 30-35 entries and answers up to 9 letters, which means real long entries and real crossing chains rather than the Mini's all-crossings scramble. Crucially the Midi is titled and themed: every puzzle carries a title that hints at a theme, so part of the loop is cracking the theme and then using it to guess the remaining theme entries, which is the 'aha' that the Mini has no room for. Difficulty is deliberately held around Monday/Tuesday level every day rather than escalating through the week. A timer runs and pauses when you leave; the puzzle auto-validates when the last square is right. Unlike the Mini, the Midi has a real streak with gold and blue stars, and using Check or Reveal resets it - so the tension in the loop is whether to check a shaky crossing and lose the streak or risk being stuck.

### RULES
- Grid: 9x9 is the default and is verified for a weekday example (Mon 20 Jul 2026: stated 9x9, longest answers 9 letters - DISAPPEAR, PALMOLIVE). Wikipedia describes the Midi as 'between 9x9 and 11x11 daily, with 9x9 as default', with larger 11x11 Midis sometimes offered as bonuses; secondary sources claim it stretches to 10x10 or 11x11 later in the week and at weekends. The day-of-week size pattern is NOT reliably verified - medium/low confidence.
- Verified clue counts: Mon 20 Jul 2026 had 30 clues (17 Across + 13 Down) on a 9x9. Sat 25 Jul 2026 had 35 clues (16 Across + 19 Down, highest number 30), which is consistent with a larger weekend grid but I could not confirm that day's dimensions directly. Plan for 28-36 entries.
- Every puzzle is titled, and the title reflects the theme (verified example: 'Low-Hanging Fruit', Mon 20 Jul 2026). Themes are the Midi's defining feature versus the Mini.
- The Midi deliberately breaks some conventions of the flagship crossword: grids are sometimes ASYMMETRICAL, and constructors occasionally use two-letter words or repeated answers (medium confidence - consistent across two secondary sources, not NYT's own words).
- Roughly once a week a puzzle includes a visual flourish - an animation or coloured cell shading that fires when you open it or after you solve (medium confidence, secondary source).
- Difficulty is held at about Monday/Tuesday level every day - flat, not escalating Mon-Sat like the flagship.
- Timer: displayed above the grid, pauses on the pause button or on leaving the puzzle, resumes on Continue, restarts if the entire puzzle is cleared, and can be hidden via gear > Show Timer.
- Help tools identical to the flagship: Autocheck toggle; Check Square / Word / Puzzle; Reveal Square / Word / Puzzle; Clear puzzle. Letters confirmed by Check turn BLUE; incorrect letters are marked with a slash.
- STREAK RULES (this is the big difference from the Mini): 'Using Check or Reveal will result in your Midi Crossword Streak being reset.' Gold stars mark consecutive puzzles solved up to 48 hours after the publication date without using Check or Reveal. Blue stars mark puzzles solved but not streak-qualifying - i.e. solved more than 48 hours late, or solved with Check/Reveal.
- Pencil mode: pen = black letters (default), pencil = grey letters.
- Rebus mode is reachable with Escape and rebus support is described for the Midi by a secondary source, but I saw no verified example of a rebus square in an actual Midi - low confidence that it is ever used in practice.
- Statistics are on the web 'Your Statistics' page. NO leaderboard is mentioned on the Midi help page - the NYT friends leaderboard covers Wordle, Connections, Spelling Bee and the Mini, and I found no evidence the Midi is on it (medium confidence).
- No guess limit, no lives, no wrong-answer penalty; completion is auto-detected when the last square is correct.
- Subscriber-only: requires an NYT subscription that includes Games (All Access, Home Delivery, or Games).
- Launch: announced late February 2026 (Nieman Lab, Feb 2026) with the first daily puzzle reported as 2 March 2026 (a Monday). One source claims a February 2025 debut with 'official rollout in early 2026', which conflicts - treat the exact launch date as medium confidence and the 2025 claim as unverified.
- Editing/bylines: reported to be edited by Ian Livengood, who constructs about 3 puzzles a week, with a roster of ~15 contributors across 13 bylines covering the other 4 days. Single SEO-grade source - low/medium confidence.

### SCORING
No points. Two scored dimensions: (1) solve time from the timer, mm:ss, and (2) a streak measured in consecutive puzzles. Streak arithmetic is exact and worth copying: a puzzle earns a GOLD star and extends the streak only if it is solved within 48 hours of its publication date AND without using Check or Reveal; otherwise it earns a BLUE star (solved, but not streak-qualifying) and the streak breaks. A single use of Check - even Check Square on one letter - resets the Midi streak, which is much harsher than it sounds on a 30-35 entry themed grid. Autocheck counts as checking. Colour semantics as elsewhere in NYT crosswords: yellow active square, blue entry highlight, black pen letters, grey pencil letters, blue letters = confirmed by Check, slash = confirmed incorrect. No per-clue scoring, no time bonus, no difficulty multiplier.

### DAILY
Daily, seven days a week, keyed to calendar date. Per NYT Help Center: Tuesday through Saturday puzzles are available at 10 p.m. ET the previous day, and Sunday and Monday puzzles at 6 p.m. ET the previous day. Streak credit is available up to 48 hours after the publication date. Archive available on web and in the Games app, but because the Midi is new the archive is short - roughly 5 months of puzzles as of late July 2026. Subscriber-only from launch; there was never a free era.

### SHARE
No documented share string or emoji grid for the Midi. Comparison is private: gold/blue star history and stats on the 'Your Statistics' page. Unlike the Mini, the Midi does not appear to be on the NYT friends leaderboard at all (medium confidence), so there is effectively no built-in way to compare with another person - a clone has a completely open field here. Sensible clone share: date, title, time, gold/blue equivalent, and optionally a 9x9 emoji grid encoding solve order by band or which entries needed help - but note that is your design, not a copy of an existing NYT format.

### UI
- At 9x9 the clue list becomes a first-class UI element, unlike the Mini. Desktop wants a two-column Across/Down list beside the grid with the active clue highlighted and auto-scrolled into view; mobile wants a single fixed clue bar above the keyboard with prev/next arrows plus a full-screen clue list view. Bad apps make you hunt for clue 23-Down in an unscrolled list.
- Show the TITLE prominently. The theme is the point of the Midi, and a clone that hides the title throws away the puzzle's best mechanic. Consider a 'theme cracked?' affordance that lets a solver mark when they got it.
- 30-35 entries means navigation efficiency matters much more than at 5x5: Tab/Shift+Tab between clues, jump-to-next-blank, skip-filled-squares, and a 'go to first blank in the grid' action all become genuinely load-bearing. Expose the cursor-behaviour settings (skip filled / jump back to first blank / jump to next clue) rather than burying them.
- Reserve keyboard height and never resize the grid: a 9x9 on a phone is already tight, and the reported NYT bug where the keyboard covers the bottom row of the grid in iPad landscape is much worse at 9x9 than at 5x5. Support pinch-zoom and pan without breaking cell hit-testing.
- Cell size >= 36-40 CSS px with a two-digit clue number rendered small in the top-left corner without crowding the letter. Numbers run to ~30, so plan the typography for two digits.
- The harsh streak rule creates a UI obligation: warn before Check/Reveal ('this will end your 34-day streak - continue?'), and offer softer help tiers so the user has a way to get unstuck that isn't all-or-nothing. A nudge tier (confirm 'this entry is a theme answer', or reveal only the first letter) is the obvious improvement.
- Distinguish assisted solves visibly and permanently (NYT's gold vs blue star is a good pattern worth copying wholesale) - it keeps stats honest without refusing to record the solve.
- Themed visual effects on solve are cheap to implement with CSS transitions on cell background colour and are a real delight moment - but gate them behind a reduced-motion check.
- Everything from the Mini's UI list still applies: two-level highlighting (yellow square / blue entry), number+direction labelling in the clue bar, backspace that deletes-then-moves, perpendicular-arrow direction flip, custom A-Z keyboard on mobile, keystroke-level autosave, pausable and hideable timer, pen/pencil modes with clearer affordances than a bare pencil icon, colourblind-safe slash marks for errors, dark mode, and one unified stats page instead of the NYT app's fragmented per-game screens.

### DATA NEEDED
- A puzzle corpus with more structure than the Mini needs: date, title (themes are central), grid dimensions (9x9 default, allow 10x10 and 11x11), a layout string marking black squares (allow ASYMMETRIC patterns), answer letters per cell, clue text per entry, and a flag marking which entries are theme entries so a clone can offer theme-specific hints.
- Roughly 2-5 KB of JSON per puzzle at 9x9. A year of daily Midis is ~1-2 MB - still fine for a static app, but split by month/year and lazy-load rather than inlining everything.
- Optional visual-effect metadata if you want to mirror the weekly flourish: a list of cells to shade plus a colour, and whether it fires on open or on solve.
- For generation at 9x9 you need a much stronger word list than the Mini: a scored list of 3-9 letter entries (~100-250k entries with quality scores) plus a fill algorithm, because 9x9 with a themed pair of long entries is a genuinely constrained search. This is the point where transcribing/curating puzzles beats generating them.
- A theme framework if you want original content: sets of 2-4 long thematically linked answers plus a title, which is the hardest data to synthesise and the best candidate for hand-authoring.
- Per-clue difficulty variants (easy/normal/hard clue text per answer) if you want the difficulty dial, since the Midi's flat Monday-level cluing is its main creative limitation.
- Streak/stats schema in localStorage: per-puzzle record of solved-at timestamp, time, help used (check count, reveal count), and derived gold/blue status - plus the 48-hour window logic if you copy it.

### WEAKNESSES
- Reception was distinctly cynical: Nieman Lab headlined its coverage 'The New York Times is adding another daily crossword, because why not', framing the Midi as a margin/engagement play - games are far more profitable than newsrooms - rather than something solvers asked for. It adds another daily obligation to a portfolio that already has eight-plus games.
- Subscriber-only from day one, with no free tier ever - and it arrived months after the Mini itself was paywalled in August 2025, which shaped how the audience read it.
- The archive is tiny. Launched around March 2026, so there are only ~5 months of puzzles as of late July 2026 - no deep back catalogue to binge, which is exactly what a clone can fix.
- Flat Monday/Tuesday-level difficulty every single day. Pleasant for habit-building, but it means experienced solvers plateau fast and there is no ramp, no Saturday-style challenge, and no difficulty setting.
- The streak rule is punishing and blunt: a single Check Square - one letter, one crossing - resets the whole Midi streak, and the 48-hour window means a busy weekend can also break it. There is no partial-credit or grace mechanism.
- Effectively no social layer. The Midi does not appear on the NYT friends leaderboard (which covers Wordle, Connections, Spelling Bee and the Mini), so two people who both solve it have no in-product way to compare times (medium confidence).
- No share format at all, so results stay siloed in a private stats page.
- Convention-breaking may irritate purists: asymmetric grids, two-letter words and repeated answers are things the flagship crossword does not permit, and themes on a 9x9 are constrained enough that the 'aha' can feel thin (medium confidence).
- Published solve-time expectations are wildly inconsistent across sources - 1.5-4 minutes, 3-10 minutes, 5-10 minutes, and 5-15 minutes all appear - which suggests the Midi's positioning is genuinely fuzzy. I could not verify a real figure; treat any single number as unreliable.
- Inherits the NYT Games app's general problems: iPad keyboard covering the bottom row of the grid, keyboard sometimes rendering in the wrong layout, per-game fragmented stats with no unified view, no free archive access, an unrecognisable Autocheck icon, a pencil icon that reads as 'edit', clues not labelled with number+direction, and an obtuse route to reporting bugs.

### IMPROVEMENT IDEAS
- Fix the streak cruelty for a couple: a JOINT streak that advances when both partners solve, plus a monthly allowance of grace tokens, plus tiered help that costs something less than everything - e.g. 3 'nudges' per puzzle that cost seconds on your time instead of killing the streak, and only a full Reveal downgrades you to a blue star. Keep NYT's gold/blue distinction, drop its all-or-nothing trigger.
- Head-to-head on a 9x9 is far richer than on a 5x5 because the grid is big enough to split: DRAFT MODE, where partners alternate picking clues to own, then race to fill their own entries on a shared board - each completed entry hands the other person crossing letters, so you cooperate and compete in the same grid. This is impossible in the original and is the standout idea for two players.
- Theme race: both solve independently, but the first person to correctly name the theme (typed free-text, fuzzy-matched against a stored theme key) earns bonus points. It makes the Midi's actual selling point competitive rather than incidental.
- Ghost race using a stored keystroke trace, same as for the Mini but more interesting at 9x9 - and asynchronous, so it works when one of them solves at 7am and the other at 11pm. No server needed.
- Entry-level analytics and a two-player diff: time-per-entry, which crossings unblocked you, and a side-by-side of who solved which entries faster. Show a 'you were 40s behind until 22-Across' narrative rather than a bare pair of times.
- Difficulty dial the original refuses: store 2-3 clue variants per answer and offer Easy / Normal / Hard, plus DOWNS-ONLY mode (hide all Across clues) which turns a Monday-level 9x9 into a real challenge for the stronger solver - and lets an uneven couple play the same puzzle at different difficulties and still compare fairly via handicap.
- Handicaps and a season: rolling per-player handicap from the trailing 10 solves, ELO, weekly and monthly scoreboards, season resets, and head-to-head records by category (theme-cracking vs raw speed vs fewest nudges).
- Full offline archive plus unlimited generated practice at 9x9, with practice results kept separate from ranked daily results. The original's ~5-month archive is its weakest point and the easiest to beat.
- Custom themed packs: a constructor UI where one partner builds a titled 9x9 around a private theme (their trip itinerary, in-jokes, the other's year in review), exportable as a paste-able string with no server. A themed grid is a far better gift than a 5x5 because the title can carry the joke.
- Escalating week: reproduce what NYT chose not to do and ramp difficulty Monday to Sunday within the Midi size, so the same 9x9 format serves both a gentle Monday and a genuinely tough Sunday. Also allow 11x11 'bonus' days as an explicit weekly event.
- Co-op variants: split the clue set (one takes Across, one takes Down, shared grid), or turn-based alternating entries, or a 'one hint transfer' where one person can send the other a clue's first letter at a cost to their own time.
- Better sharing than none: a compact copyable result block (date, title, both times, nudges used, who cracked the theme first) designed for their own chat thread, plus an optional emoji grid encoding which entries each person filled.
- Practical clone advantages to build in: works offline and free forever, keystroke-level localStorage autosave with explicit Export/Import backup, no 48-hour expiry so a late solve still counts (flagged, not voided), reduced-motion-respecting theme animations, keyboard-only desktop solving, colourblind-safe error marks, dark mode, and a single unified stats page across both the Mini and Midi clones instead of NYT's fragmented per-game screens.


==========================================================================================
## NYT Wordle   [confidence: high]
https://www.nytimes.com/games/wordle

### CORE LOOP
One hidden 5-letter word per day, same for every player worldwide. The player types a 5-letter word into the top empty row and presses Enter; the guess must be in the allowed-guess dictionary or it is rejected (row shakes, no attempt consumed). On submit, the five tiles flip one at a time and each is coloured green / yellow / grey, and the corresponding on-screen keyboard keys take the same colour. The player deduces from accumulated colour information and guesses again, up to 6 total attempts. Solving reveals a stats modal (games played, win %, current streak, max streak, guess distribution) and a Share button that copies a spoiler-free emoji grid. Losing after 6 reveals the answer and breaks the streak. There is no second puzzle until local midnight.

### RULES
- Exactly 6 guesses, exactly 5 letters, one puzzle per calendar day. Board is a 6-row x 5-column grid.
- Every guess must be a real word from the allowed-guess dictionary (~12,972 five-letter words in the original source). Invalid words are rejected without consuming an attempt — this is important: rejection is free, so there is no penalty for probing.
- The answer is drawn from a much smaller curated 'common word' subset (2,315 in the original source; Wikipedia reports 2,309 after NYT removals). The guess dictionary is a superset that includes the answers.
- Colour semantics: GREEN = correct letter in correct position; YELLOW = letter is in the answer but in a different position; GREY/DARK = letter does not appear in the answer at all.
- Duplicate-letter algorithm (multiset, two-pass — clones get this wrong constantly): PASS 1, mark every exact positional match green and decrement that letter's remaining count in the answer. PASS 2, left to right over the non-green tiles, mark a tile yellow only if that letter still has remaining count > 0, then decrement; otherwise mark grey. Consequence: guessing a letter twice when the answer contains it once yields one coloured tile and one grey tile.
- Keyboard colouring uses a highest-known-state-wins rule and never downgrades: once a key is green it stays green even if a later guess puts that letter in a wrong slot. Priority green > yellow > grey.
- HARD MODE: every revealed hint must be reused. Green letters must be replayed in the same position; yellow letters must appear somewhere in the guess. Violating guesses are rejected with a message and cost no attempt.
- HARD MODE does NOT ban grey letters — you may freely re-guess a letter you already know is absent. This is the single most-misimplemented rule in clones.
- Hard mode can only be switched on before the first guess of a puzzle; it cannot be enabled mid-puzzle. (Whether it can be switched OFF mid-puzzle I could not verify — treat as unknown.)
- High-contrast / colourblind mode swaps the palette to ORANGE (for correct position, replacing green) and BLUE (for present-wrong-position, replacing yellow). Grey is unchanged.
- Puzzle numbering is date-derived: N = whole days since 1 June... precisely, since 2021-06-19, with 2021-06-19 = #0. Verified: puzzle #1,862 = 2026-07-25 (arithmetic checked against Tom's Guide's published number for that date).
- Reset is at local midnight on the player's device clock, not a fixed UTC hour.
- Archive plays (subscriber feature) explicitly do NOT affect streaks or stats.

### SCORING
No points and no score. Wordle's only outputs are (a) the per-tile ternary feedback and (b) the attempt count 1-6, reported as 'n/6' or 'X/6' for a loss. Persistent stats are: games played (integer), win percentage (rounded integer), current streak, max streak, and a 6-bucket guess distribution histogram. A loss sets current streak to 0. Nothing weights an early solve beyond the smaller n in n/6.

### DAILY
Strictly one puzzle per day, identical for all players worldwide, resetting at local midnight on the device clock. Puzzle number N = days since 2021-06-19 (that date = #0); verified anchor #1,862 = 2026-07-25. Answers were originally a fixed ordered list from Josh Wardle's source; since September 2022 the NYT has tooling to remove and reorder, and since November 2022 a dedicated editor (Tracy Bennett) selects each answer roughly six weeks ahead — using a random-number generator over the original list, then vetting secondary meanings and the week's overall mix. Net effect for a clone: the modern answer ORDER is not publicly derivable, so a clone must define its own date-to-answer mapping. Archive of 1,000+ past puzzles exists but is subscriber-only and archive plays do not touch streaks.

### SHARE
Line 1: 'Wordle <number> <n>/6' where n is the winning attempt or 'X' for a loss. Hard mode appends an asterisk directly after the fraction: 'Wordle 1,862 4/6*'. Four-digit puzzle numbers are rendered with a thousands comma in NYT-era output (high confidence but not primary-source verified — the press consistently writes '#1,862'). Then a blank line. Then one line per guess actually made (so 1-6 lines), five emoji each, no separators. Absent = white large square in light theme and black large square in dark theme; present-wrong-position = yellow large square; correct = green large square. In high-contrast mode correct becomes the orange square and present becomes the blue square. Nothing else is included — no URL, no letters, no timing. Example: 'Wordle 1,862 4/6*' / blank / four rows such as grey-grey-yellow-grey-grey, then all green on the last row.

### UI
- 6x5 grid centred above a QWERTY on-screen keyboard with Enter on the left of the bottom row and a backspace key on the right; physical keyboard input works in parallel.
- Typing pops each tile briefly; submitting flips tiles sequentially left to right with a short stagger, so the reveal is dramatic rather than instant. Keyboard keys recolour after the flip completes.
- Invalid word or a hard-mode violation shakes the active row horizontally and shows a transient toast near the top ('Not in word list', or a message naming the required letter/position). No attempt is consumed.
- Win triggers a bounce/jump animation on the solved row and then the stats modal with the guess-distribution histogram and a countdown to the next puzzle; loss shows the answer in a toast.
- Settings gear exposes Hard Mode, Dark Theme, and High Contrast Mode. Hard Mode is disabled (greyed) once a guess has been made on the current puzzle.
- Colour semantics are the whole UI language, which is why the high-contrast palette matters: green/yellow are indistinguishable for red-green colourblind players and the orange/blue swap is the only mitigation.

### DATA NEEDED
- Answer list: ~2,300 curated common 5-letter words. The original ordered list of 2,315 is widely mirrored (e.g. cfreshman's gist, deedy/wordle-solver official_wordle_common.txt). ~16 KB raw, trivial gzipped.
- Allowed-guess list: 12,972 five-letter words from the original source (tabatkins/wordle-list, LaurentLessard/wordlesolver nonsolutions.txt = 10,657 non-answers + 2,315 answers). ~90 KB raw, ~30-40 KB gzipped. Best shipped as one concatenated string chunked in 5s and loaded into a Set.
- Optional: a word-frequency ranking (e.g. Google Books or SUBTLEX unigrams) to power a difficulty dial and to bucket answers common-vs-obscure. A few thousand rows is enough since it only needs to cover the answer list.
- Optional: offline definitions for the post-game reveal (Wiktionary/WordNet extract limited to the ~2,300 answers keeps this small, low tens of KB).
- Nothing else — no images, no audio, no per-day answer schedule needed if the clone derives its own date-to-answer mapping from a seeded shuffle of the answer list.

### WEAKNESSES
- Streak fragility is the dominant complaint. The streak is the emotional core but is stored per-browser and keyed to the device clock, so a timezone change while travelling, a cleared cache, a new device, or a service outage silently destroys it. One TechRadar writer reports 800 unbeaten games but an official streak of only 49 because of timezone handling. An AWS outage in 2025 broke play mid-day and left players hoping their streaks would be restored.
- Hard answers wipe streaks en masse and it feels arbitrary rather than earned — NYT data cited by AOL says a single 2024 puzzle ended 5.6 million streaks. Players experience this as the puzzle punishing them for a coin-flip between equally valid candidates (the classic ratchet: -IGHT, -OUND, -ATCH families where 5 candidates remain and only 2 guesses are left).
- Exactly one puzzle per day, no practice mode. If you enjoy it, you cannot have more; if you fail, you cannot try again. There is no legitimate free way to warm up.
- The archive (1,000+ past puzzles, back to June 2021) is locked behind a NYT Games or All Access subscription. Free players cannot revisit or catch up on missed days.
- WordleBot post-game analysis is also subscriber-only, so free players get feedback colours but never learn whether a guess was good.
- Duplicate-letter colouring genuinely confuses people (the widely-discussed 'PENCE' style case where one E is grey and another is yellow), and the keyboard makes it worse: the key shows one aggregate colour that cannot express 'this letter appears exactly twice' or 'you have already found all instances'.
- Perceived word-quality drift since the NYT acquisition — complaints about TACIT, SWILL, CAULK and about removed British spellings (FIBRE) and removed sensitive words. NYT counters that it only removed and reordered Josh Wardle's original list and never added words, so difficulty is statistically unchanged, but the perception persists.
- Accessibility is weak. Even the high-contrast palette fails the 3:1 non-text contrast minimum, and the emoji share grid is hostile to screen readers — it announces up to 30 colour names with no semantic content, taking close to a minute. Third-party tools (wa11y.co) exist purely to generate accessible share text.
- Single-profile by design. Two people sharing a household have to use separate browsers or devices, and there is no built-in comparison, no head-to-head record, and no shared history.

### IMPROVEMENT IDEAS
- Two-profile board with a blind hand-off. Store both partners' state under separate keys for the same daily word and interpose a 'pass the phone' screen that hides player 1's grid until player 2 has also finished, then reveal both grids side by side. This is the single highest-value change for a couple and the original cannot do it at all.
- A couple's ledger as a first-class screen: cumulative head-to-head record, per-person guess distribution overlaid on one histogram, rolling 7- and 30-day average guesses, average-guess differential, 'who solved it in fewer' tally, longest run of days one partner beat the other, and days where both got it in the same count (ties). This turns a solo ritual into a season-long rivalry with zero server.
- A joint streak alongside the two individual streaks — 'we both solved it' days — plus streak-forgiveness tokens (say one per month, plus a manual 'we were travelling' backfill). This directly fixes the most-hated property of the original: a 400-day couple streak should not die to a timezone change or a flu.
- Timezone-proof and clock-proof streak accounting: key days by an explicit local date string chosen once at setup, store the full per-day result history rather than just a counter, and recompute streaks from history on every load. Streaks then become repairable instead of destructible, and an Export/Import JSON button makes them portable across devices — which the original still cannot do.
- Free full offline archive by date. Ship a deterministic date-to-answer mapping and every past day is instantly playable head-to-head, including 'play the puzzle from the day we met'. This is the paywalled feature, and it is nearly free to build.
- Difficulty tuning per player, which enables handicapping: word length 4-7, guesses 4-7, and an answer-rarity band (common / standard / obscure) driven by a frequency list. A stronger player takes 5 guesses to the weaker player's 6 and the daily stays genuinely competitive instead of one-sided.
- Extra hard-mode tiers beyond NYT's: 'True Hard' also forbids replaying known-grey letters (the constraint players wrongly assume NYT has), and 'Consistent' only accepts guesses that are still viable candidates given all feedback so far. Let each partner pick their own tier and record it on the result so the ledger is honest about who played handicapped.
- Offline WordleBot: after each game, compute for every guess how many candidates remained before and after, and split performance into skill (information extracted) versus luck (favourable draws). Then compare the two players on skill rather than raw guess count — the fairest possible couple metric, and a paywalled feature in the original.
- Async duel by URL hash, no backend: encode {date, mode, handicap, and your result} into a compact base64url fragment. Partner opens the link on their own phone, plays the identical puzzle, and their client merges your result into the shared ledger locally. Preserves the no-server constraint while enabling separate devices.
- Custom word packs and 'make a puzzle for your partner': pet names, in-jokes, street names, anniversary words, an advent-style sequence. Authoring UI emits a shareable link/hash. Wordle structurally cannot do this and it is the feature couples actually ask for.
- Co-op mode: one board, 6 guesses, partners alternate turns and may not speak between turns (or may, as a toggle). Same puzzle, completely different social ritual, and a good fallback on days when competing would be unpleasant.
- Fix the duplicate-letter ambiguity with an optional precision keyboard: annotate each key with the exact deduced constraint (E >=2, O exactly 1, S absent, A found-all) derived from accumulated feedback. Keeps the classic look by default, removes the most common source of misplays when enabled.
- Share output that is actually comparable: emit both partners' grids in one block with names and counts, plus an accessible plain-text description alongside the emoji, plus copy-as-image. Also keep the exact NYT-compatible single-player string so results can still be pasted into an existing group chat without looking alien.
- Unlimited practice mode that is quarantined from stats and streaks, so warming up cannot pollute the ledger — and a 'rematch today's word' option that is recorded separately as an exhibition game.


==========================================================================================
## Thirdle (thirdle.org — the intersecting mini-crossword; this is the real Thirdle)   [confidence: high]
https://thirdle.org/

### CORE LOOP
A daily mini crossword of THREE intersecting words — not a 3-letter Wordle. Normal Daily uses three 5-letter words (15 letter slots, 13 distinct cells because two cells are shared at the intersections). Two intersecting letters are pre-revealed and locked at the start. The player fills in ALL THREE words and submits them as a single attempt; each attempt therefore burns one of only 6 tries but yields feedback across the whole grid. Every tile then takes one of FOUR colours, including a purple state unique to this format meaning 'this letter belongs in one of the other words'. The keyboard is coloured with the same four states. The player reasons across words — a letter ruled out of word 2 may be exactly what word 3 needs — and submits again, up to 6 attempts. On finish the game shows the answers with Wiktionary definitions, streak stats, and a compact emoji share. Guesses are POSTed to the server for validation, so the answers are never in the client.

### RULES
- 6 attempts total. Verified from the shipped client: the score line renders as '<level> / 6'.
- Three words per puzzle, and EVERY attempt must contain three valid dictionary words — the client's own tips text reads: 'Each guess needs three valid words'. You cannot submit one word at a time, and an invalid word costs you the attempt cycle rather than being a free probe.
- Normal Daily = three 5-letter words. Internal state confirms maxTiles = 15 (5+5+5) and a 15-slot guess array laid out word-major: indices 0-4 = word 1, 5-9 = word 2, 10-14 = word 3, with the shared intersection letters stored TWICE (once per word).
- Bonus Daily = one 4-letter, one 5-letter and one 6-letter word. Unlimited = endless non-daily puzzles. There is also a history/archive route for previously played games.
- GEOMETRY (decoded from the live app state) is a CHAIN of two intersections, not a three-way star: word1 crosses word2, and word2 crosses word3. It is stored as pos = [[i1_w1, i1_w2], [i2_w2, i2_w3], [len1, len2, len3]]. For puzzle #1571 pos = [[2,1],[3,1],[5,5,5]], i.e. word1[2] = word2[1] = 'R' and word2[3] = word3[1] = 'C'. The code defaults the third element to [5,5,5] when absent, confirming element 3 is the word lengths. Intersection indices vary per puzzle, so a clone must store geometry per puzzle rather than hard-coding it.
- Two intersecting letters are revealed at the start and are immutable — the client emits 'Can't change the start letters.' and 'Can't remove the start letters.' They also render as green on the keyboard.
- FOUR colour semantics (internal codes X / - / # / 0 map to CSS classes hit / miss / missout / nots): GREEN = correct letter, correct position, in the right word ('Perfect match - Letter is in the correct position in the right word'). ORANGE = letter exists in THIS word but in a different position ('Right word, wrong spot'). PURPLE = the letter belongs in a DIFFERENT word. BLACK = the letter is not used in any word, OR all of its instances have already been found.
- That last clause matters: BLACK is overloaded. It means either 'absent everywhere' or 'you have already located every instance of it', which are very different pieces of information presented identically.
- Letters may repeat across the puzzle ('Letters can appear multiple times across the puzzle'), so the feedback resolution is per-word multiset plus a cross-word 'belongs elsewhere' signal — materially more complex than Wordle's single-word two-pass.
- HARD MODE is stricter than Wordle's on both axes: (a) you must reuse all hint letters already found (tracked internally as hardMissing), and (b) you cannot type known-black letters at all — the client blocks the keypress with 'Can't play black tiles in hard mode.' Wordle by contrast permits grey letters in hard mode.
- Hard mode can only be turned on at the start of a round: 'Can only be activated at the start of a round.' The setting persists in a cookie with a one-year max-age.
- High Contrast Mode exists ('For improved color visibility') and changes green to blue in the share output. Dark theme can follow device settings or be set manually.
- A give-up action exists (the submit payload carries a giveup flag).
- Everyone gets the same daily puzzle ('Everyone gets the same puzzle so you can compete against your friends'), and there is a per-day countdown ('New Thirdle in'). Daily number #1571 on 2026-07-25.
- Guess validation and answers are SERVER-SIDE: each submission POSTs {guess, type, giveup, dailyNr, level, timestamp, gid, hardMode, contrast, lang, unlimited, token}. Nothing in the client reveals the solution, so an offline clone cannot mirror the official answers and must generate its own puzzles.
- Published by Avionista AB. Sibling games on the same codebase: Swapdle, TravelGuessr; there is also a Polygonle crossover.
- IMPORTANT DISAMBIGUATION: a completely different hobby game also called 'Thirdle' is a 3-letter, 3-guess Wordle with a points system. Many SEO aggregator pages (dordlegame.io/thirdle, wordle-nyt.org/thirdle, wordlewordle.org/thirdle, wordle-unlimited.io/thirdle) and even review round-ups conflate the two and describe thirdle.org as 'easier because it's only 3 letters'. That description is wrong for thirdle.org. See the separate entry below.

### SCORING
No points. Like Wordle, the outcome is the attempt count out of 6 plus per-tile colour feedback. Persisted stats, confirmed from the client's own labels: 'Current streak', 'Longest streak', 'Number of guesses' (a distribution), 'Average result', 'Daily Statistics', and 'All players result' (a global comparison, which requires the server and is the one stat an offline clone must either drop or fake honestly). The share line renders the level as the numeral, or 'X' on a loss, or '?' when the outcome is unknown.

### DAILY
One shared daily puzzle per stream, with three parallel streams: Normal Daily (three 5-letter words), Bonus Daily (4/5/6-letter words), and Unlimited (endless, non-daily). Daily number observed: #1571 on 2026-07-25, so the series began roughly mid-2022; I did not verify the exact epoch date, and the day index is assigned server-side rather than derived in the client. A 'New Thirdle in' countdown drives the reset and a history route exposes previously played games, so an archive exists and is not obviously paywalled the way NYT's is. The answer for a given day is only knowable via the server.

### SHARE
Decoded directly from the shipped bundle. Default (compact summary) share text is: line 1 '#thirdle #thirdle<dailyNr>' — or '#thirdle #bonusthirdle<dailyNr>' for Bonus Daily; blank line; then the trophy line, template '<trophy> <level> / 6' where level is the winning attempt, 'X' on a loss, or '?' if unknown, with ' *' appended when hard mode was on, followed by ' <fire> streak <current>' when the puzzle was solved; blank line; then one line per guess, each line being two emoji per word with a single space between words (so three groups of two, e.g. green-green space orange-black space purple-black); blank line; then the literal 'thirdle.org'. Emoji mapping: green square = X/hit, orange square = -/miss, purple square = #/missout, black square = 0/nots, and in high-contrast mode the green is replaced by a blue square. Note the compaction: for each word in each guess the code picks an ORDERED PAIR of two states via a priority chain (purple beats orange, then orange/green, with average-letter-position tiebreaks), so a 5-letter word's five results are squashed into two emoji — the share is a summary, not a transcript. A separate full-grid share is available behind the 'Share options' toggle; it renders the real 2-D grid and pads non-cells with a white square. There are also 'Result copied to clipboard', 'Image copied to clipboard' and 'Result share link' paths, so image and link sharing exist alongside text.

### UI
- Crossword layout rather than a stack of rows: words carry a direction flag (0 = horizontal, matched on row, 1 = vertical) plus an origin and an offset into the flat 15-slot guess array. Non-cells are blank, so the board reads as an irregular crossword, not a rectangle.
- Four-colour tiles plus a four-colour QWERTY keyboard, Enter on the bottom-left area, backspace at top-right of the keyboard block. Physical keyboard works. Keyboard state derives from the same hit/miss/missout/nots codes, and the two pre-revealed start letters are forced to green.
- The two revealed intersection letters render as locked green tiles and reject edit or delete attempts with a toast.
- Active-cell highlight with a 'fakeActive' state for animation; wrong/invalid words get a distinct 'wrong' style, and hard-mode violations surface a toast rather than consuming the attempt.
- Attempt counter renders as '<n> / 6' near the board, with a 'Start the puzzle!' call to action before the first guess.
- Settings expose Hard Mode, High Contrast Mode, and Dark Theme (Automatic follows device settings, or Manual).
- Post-game screen shows the correct words with Wiktionary definitions, a streak/stats panel (Current streak, Longest streak, Average result, Number of guesses, All players result), and a next-puzzle countdown.
- Heavy commercial furniture around the board: an ads wrapper, a hamburger menu listing sibling games, an exit interstitial, and support/upsell panels.

### DATA NEEDED
- A 5-letter validation dictionary — the Wordle 12,972-word list works directly for Normal Daily (~90 KB raw, ~30-40 KB gzipped).
- For Bonus Daily, 4-letter and 6-letter word lists as well. Sizes need measuring rather than guessing; expect a few thousand 4-letter words and roughly 10-20k 6-letter words from a standard Scrabble/ENABLE/SOWPODS extract. Filter hard for recognisability or the crossword becomes unfair.
- A PUZZLE GENERATOR plus its index, not an answer list. Because the official answers are server-side only, the clone must build its own: pick word2, then for each intersection index find words whose letter at the required index matches. Precompute a map from (position, letter) -> word bucket for each length; that is the whole generator. Store generated dailies as {date, words[3], pos[[a,b],[c,d],[l1,l2,l3]], revealedLetters}.
- A curated 'nice answer' subset per length so generated puzzles use recognisable words — reuse the ~2,300 Wordle common list for 5-letter, plus a frequency list to filter 4- and 6-letter words.
- Offline definitions for the post-game reveal, since the original shows 'Definitions from Wiktionary' and losing that on a plane would be a real regression. Scope it to the curated answer subsets to keep it small.
- No images or audio needed. Note the live site loads Facebook Pixel, Google Analytics and a Playlight cross-promo SDK — none of which a clone should reproduce.

### WEAKNESSES
- Six attempts for three simultaneous words is brutally tight, and because every attempt must contain three valid words, a single unknown word can waste an entire attempt across the whole grid. There is no cheap probing the way Wordle lets you burn invalid words for free.
- BLACK is overloaded — 'not in any word' and 'all instances already found' render identically, which can actively mislead you into abandoning a letter you still need elsewhere.
- PURPLE is deliberately vague: it says 'belongs in a different word' but not WHICH word. With three words in play that can feel arbitrary rather than deductive, especially late in a puzzle.
- The default share is a lossy summary, not a grid. It compresses each word down to just two emoji per guess (an ordered pair chosen by an internal priority: purple over orange over green/black, with average-position tiebreaks), so two very different attempts can share identical output. Comparing two people's shares tells you almost nothing about how they actually solved it. The full grid exists only behind a secondary 'Share options' toggle.
- Requires network for every single guess — validation and the answer both live server-side. No offline play, and every keystroke-to-feedback cycle costs a round trip.
- Commercially cluttered: Facebook Pixel and GA trackers, an ads wrapper, a Playlight 'show other games on exit' interstitial, cross-promotion for Swapdle/TravelGuessr/Scrabble/Sudoku pages, and a 'Buy me a coffee' upsell that unlocks an upgraded game tier.
- Entering 13 letters across a two-dimensional crossword before submitting is fiddly, and the shared intersection cells mean typing in one word silently rewrites a letter in another.
- Severe name-collision problem. The 3-letter 'Thirdle' and a swarm of SEO clone sites republish or mis-describe the game, so players arrive with the wrong mental model and reviewers publish incorrect rules. Two of my own searches returned confidently wrong descriptions.
- Streaks and stats are tied to the site/browser session with an optional email-based upgrade, so the same cross-device fragility as Wordle applies.
- 'All players result' and global comparisons depend entirely on the backend, so there is no way to self-host the social layer.
- Much smaller player base than Wordle, so the 'everyone did today's puzzle' network effect that makes daily sharing fun is largely absent.

### IMPROVEMENT IDEAS
- The server dependency is the clone's biggest opportunity, not an obstacle. Ship a seeded local generator: date -> deterministic PRNG -> three intersecting words + geometry. Both partners' devices then produce byte-identical puzzles for any date with no backend at all, which simultaneously unlocks a free unlimited archive back to day one and a true unlimited practice mode.
- Make PURPLE tunable, because it is the format's signature mechanic and its main frustration. Offer 'Vague' (current behaviour), 'Directed' (purple tells you which word the letter belongs to), and 'Counted' (shows how many other words want it). This is the single best difficulty dial for a couple with mismatched skill — one partner plays Directed, the other Vague, same puzzle, and the ledger records the setting.
- Split the overloaded BLACK into two distinct states: 'absent everywhere' versus 'all instances already located'. A fourth-and-a-half colour or a small check-mark glyph on the key removes a genuinely misleading signal at zero cost to difficulty.
- Per-word validation BEFORE the attempt is spent. Show a live per-word indicator ('word 2 is not in the dictionary') and refuse submission, exactly as Wordle refuses invalid words for free. This removes the format's most unfair failure mode without making the puzzle easier.
- Asymmetric starting reveals as a handicap: 0/1/2/3 pre-revealed intersection letters, set independently per player. Combined with a guess-count handicap (5 vs 6) this makes a mismatched couple's daily competitive in a way the original's fixed two-letter reveal never can.
- Geometry difficulty dial: 2, 3 or 4 words; chain versus star versus ladder topology; and intersection count. More intersections means more cross-constraints and easier deduction, so this is a real and continuous difficulty axis that the original exposes only as Normal versus Bonus.
- A co-op mode that is uniquely suited to two people and impossible in the original: partition the grid so each partner sees the feedback for only some of the words (one sees word 1's colours, the other sees word 3's, both see word 2's), on one shared 6-attempt budget. Purple becomes a genuine communication channel — 'this letter belongs in YOUR word' — and the puzzle can only be solved by talking. This is the best idea in this list for a couple.
- Head-to-head with per-word attribution. Because there are three words, the comparison is richer than Wordle's single number: who cracked word 1 first, who got the intersection, who finished with attempts to spare. Show both completed grids overlaid as a diff after both have submitted, with a blind hand-off screen so the second player is not spoiled.
- Replace the lossy 2-emoji-per-word share with a full-grid share by default, and add a combined two-player share block. Keep the original compact format as an option for compatibility. Also keep copy-as-image and copy-as-link, both of which the original does well.
- Joint and individual streaks with forgiveness tokens, plus streaks recomputed from a stored per-day history keyed by an explicit local date string, and Export/Import JSON. Same reasoning as for Wordle: a shared streak is the thing a couple actually cares about and the thing browser storage most reliably destroys.
- Bundle offline definitions and keep the post-game Wiktionary-style reveal. It is one of the nicer touches on the original and it is the first thing a naive offline clone would lose.
- Better crossword input: tap a cell to jump, arrow keys to move, a per-word lock affordance, an explicit 'clear this word' button, and a visible highlight showing which cell is shared so partners stop accidentally overwriting an intersection.
- Reveal-a-letter and give-up hints with a recorded penalty, so a stuck partner has an exit that keeps the shared streak alive instead of abandoning the day. Log the hint on the result line, exactly as hard mode is logged, so the ledger stays honest.
- Custom couple packs: author your own three-word crossword (names, in-jokes, places you have been) and hand it over as a link or QR. The generator machinery is already there; authoring is a thin UI on top, and the original has nothing like it.
- Strip all of it — no Facebook Pixel, no GA, no Playlight exit interstitial, no cross-promo, no coffee upsell. A single quiet HTML file is a materially better daily ritual than the ad-laden original, and that is worth stating as a feature.


==========================================================================================
## Thirdle (web-dev-dan namesake — 3-letter, 3-guess variant; NOT thirdle.org)   [confidence: low]
https://web-dev-dan.github.io/Thirdle/

### CORE LOOP
A minimal Wordle reskin on a much smaller board: one hidden 3-letter word, guessed in at most 3 attempts. Type three letters, submit, receive per-tile colour feedback, and try again. A hint button is available at a scoring penalty. Unlike the real Thirdle at thirdle.org, this has a points system. I am listing it purely as disambiguation: several aggregator sites and review round-ups describe THIS game's mechanic while linking to thirdle.org, which is why the brief flagged the ambiguity. If the intent is 'the Thirdle people play', build the thirdle.org spec above instead.

### RULES
- One 3-letter target word; 3 guesses maximum.
- Colour semantics differ from both Wordle and thirdle.org: BLUE = correct letter in the correct place; ORANGE = letter is in the answer but in the wrong place; BLACK = letter is not in the answer.
- A hint button exists and costs points.
- No intersecting words, no crossword, no purple state, and no third colour beyond the standard present/absent pair.

### SCORING
Explicit points, unlike either Wordle or thirdle.org: 100 for a first-guess win, 75 for a second-guess win, 50 for a third-guess win, and 25 for a loss. Using the hint button applies -25. I have these numbers from a single fetch of the game page and have not cross-verified them against the source, so treat the exact values as unconfirmed.

### DAILY
No daily cadence verified. It presents as a play-anytime hobby game rather than a once-per-day puzzle; I found no evidence of a daily reset, a puzzle number, streaks, or an archive.

### SHARE
No share grid verified. I found no evidence of an emoji-share feature, which is consistent with it being a small hobby build rather than a social daily.

### UI
- Standard small Wordle-style grid (3 columns, 3 rows) with an on-screen keyboard.
- A visible score readout and a hint button, both absent from Wordle and from thirdle.org.
- Colour palette is blue / orange / black rather than green / yellow / grey.

### DATA NEEDED
- A 3-letter word list — roughly 1,000-1,300 common English three-letter words depending on how aggressively you filter abbreviations and interjections. Tiny, single-digit KB, and the whole reason this variant is thin: with only ~1,000 candidates and 3 guesses, information theory makes it nearly trivial for a practised player.
- Optionally a frequency filter, because unfiltered 3-letter Scrabble lists are full of words like ZAX and JEU that make a 3-guess limit feel arbitrary.

### WEAKNESSES
- The search space is far too small for the format to be interesting. Three letters over ~1,000 candidates with three guesses collapses to near-guaranteed wins for a strong player and coin flips for everyone else, with little room for genuine deduction.
- Ambiguous 3-letter words with shared skeletons (CAT/CAR/CAN/CAP/CAB) reduce the endgame to a pure lottery — the same complaint people level at Wordle's -IGHT families, but far worse because there are fewer letters to gather information with.
- Only 3 guesses gives almost no room to probe, and there is no evidence of a hard mode or accessibility options.
- It uses BLUE for the correct-position state, which collides with Wordle's high-contrast convention where blue means present-but-wrong-position. Anyone who plays both will misread the board.
- Appears to be a hobby project with no daily cadence, no archive, no streaks, and no share grid that I could verify — so the social ritual that makes these games work is absent.
- Its main practical effect is polluting search results for the real Thirdle.

### IMPROVEMENT IDEAS
- Honestly, do not clone this one — fold it in as a difficulty setting. Since a good clone should already have a word-length dial, '3 letters, 3 guesses' becomes a 60-second warm-up mode inside the Wordle clone rather than its own app. That is strictly better for a couple than a separate thin game.
- If it is built, make it a speed format: same 3-letter word for both partners, timed, and score on time-to-solve rather than guess count, because guess count carries too little signal at this size. Best-of-five rounds in under two minutes is a genuinely different daily ritual from Wordle's slow single puzzle.
- Keep its points idea and generalise it across the whole suite. Neither Wordle nor thirdle.org has a points system, but a couple tracking results over months benefits from one number that folds in guess count, hints used, hard mode, and handicap — that gives you a season leaderboard instead of three incomparable stats.
- Recolour to match the rest of the suite (green/yellow, blue/orange only in high-contrast mode) so the two games do not teach contradictory colour semantics.
- Filter the word list hard to common words only, and surface the candidate count after each guess so the endgame lottery at least feels acknowledged rather than arbitrary.


==========================================================================================
## Tradle (OEC)   [confidence: high]
https://oec.world/en/games/tradle  (app also served at /en/tradle/; official source: https://github.com/alexandersimoes/tradle — a fork of Worldle by @teuteuf. NOTE: tradle.io is NOT this game, it is a fintech company; tradle.net, tradle.world, tradle-game.com, wordleplay.com/tradle etc. are unofficial clones/mirrors.)

### CORE LOOP
You are shown one country's export treemap for a single year (OEC 'hs92 / export / all products / 2023' embed, hard-coded to 2023) with the prompt 'Guess which country exports these products!' — no name, no flag, no map. You type a country into a Mantine autocomplete (flag emoji + name, max 5 suggestions, matches on name or ISO2 code, already-guessed countries are removed from the list) and press the '🌍 Guess' button. Each submitted guess is scored purely geographically: the app computes great-circle distance between the two countries' centroids, a compass direction from your guess toward the target, and a proximity percentage, then animates a row of 5 proximity squares followed by the numbers. You get 6 guesses; the game ends immediately on distance === 0 (exact country) or when the 6th guess lands. So round 1 is a pure trade-knowledge read of the treemap, and rounds 2-6 degenerate into geographic bisection (this is the game's core design flaw and the most common player complaint). On loss the answer is revealed as a persistent uppercase toast; on either ending a share modal auto-opens after 3 seconds with the emoji grid, a copy-to-clipboard share string, cross-promos to ConnecTrade and Pick 5, and an AdSense unit.

### RULES
- MAX_TRY_COUNT = 6 (verified constant in src/components/Game.tsx line 62). Game ends when guesses.length === 6 OR last guess distance === 0.
- Guessable pool = 248 countries/territories (src/domain/countries.ts), each an object {code: ISO2, latitude, longitude, name, oecCode?}. Only Taiwan carries an oecCode override ('XXB'). Lat/lon are Google's canonical countries CSV centroids.
- Eligible-answer set is narrower: `countriesWithImage` = the 246 ISO2 codes listed in countryCodesWithImage (a Worldle leftover). The actual answer each day is NOT random — it is read from a hand-authored CSV at /en/tradle/data.new.csv (repo: public/data.new.csv) that maps date -> ISO2. That file currently holds 1,663 dated rows from 2022-06-14 through 2026-12-31 using 222 distinct countries. Because it is a plain public CSV, every future answer is spoilable.
- Every country in the CSV repeats: appearances per country range 2 to 13 (histogram: 2x:1, 3x:3, 4x:12, 5x:17, 6x:32, 7x:45, 8x:48, 9x:31, 10x:20, 11x:8, 12x:4, 13x:1). Most-repeated: Brazil 13; Cayman Islands, Ukraine, Zambia, Denmark 12 each.
- Data bug in the schedule: there is a row for '2025-02-29', which is not a real date (2025 is not a leap year) — that Central African Republic entry can never be served. No other gaps or duplicate dates exist in the file.
- A guess must resolve via getCountryByName(): the typed string is normalised (NFD, diacritics stripped, spaces/hyphens/apostrophes/parentheses removed, lowercased) and compared to country names. Unresolvable input triggers toast.error('unknownCountry') and does NOT consume a guess.
- Feedback per guess is three values: (1) distance = geolib.getDistance(guessCentroid, targetCentroid) in metres, displayed as rounded km with a thousands separator, or miles = round(km * 0.621371); clicking the distance cell toggles km/miles and persists it in settings. (2) direction = geolib.getRhumbLineBearing(guess -> target), bucketed by Math.round(bearing/45): 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW, default(0/8)=N; rendered as ⬆️ N, ↗️ NE, ➡️ E, ↘️ SE, ⬇️ S, ↙️ SW, ⬅️ W, ↖️ NW. On a correct guess the direction cell shows 🎉 instead. (3) proximity percent (formula in scoring).
- The treemap is not generated by the game — it is an iframe of OEC's own renderer: https://oec.world/en/visualize-legacy/embed/tree_map/hs92/export/{oecCode|iso3}/all/show/2023/?controls=false&title=false&click=false . Classification HS92, flow = exports, all products, year 2023 hard-coded, controls/title/click disabled.
- Rectangle area = that product's share of the country's total exports ('Each rectangle represents the share of a given product proportional to its percentage of exports for that country' — in-game How to play). Colour = the product's HS92 Section. OEC's HS92 hierarchy is Section -> HS2 -> HS4 -> HS6, and there are exactly 21 sections (verified live from https://oec.world/api/olap-proxy/members?cube=trade_i_baci_a_92&level=Section): 1 Animal Products, 2 Vegetable Products, 3 Animal and Vegetable Bi-Products, 4 Foodstuffs, 5 Mineral Products, 6 Chemical Products, 7 Plastics and Rubbers, 8 Animal Hides, 9 Wood Products, 10 Paper Goods, 11 Textiles, 12 Footwear and Headwear, 13 Stone And Glass, 14 Precious Metals, 15 Metals, 16 Machines, 17 Transportation, 18 Instruments, 19 Weapons, 20 Miscellaneous, 21 Arts and Antiques. All products in the same section share one colour, so the treemap reads as coloured blocks per section with HS4 product labels inside.
- Archive access is undocumented but real: Game.tsx parses a `?date=YYYY-MM-DD` query param (Luxon-validated) and plays that day's puzzle, showing an amber banner 'You are playing a historical puzzle from {date}'. There is also a `?theme=light|dark` override and a `?consent=` param.
- No official unlimited/practice mode (the 'unlimited' pages are on clone sites, not OEC).
- April Fools variant: if the day string ends in '04-01' the target is swapped for a fictional planet and the pool becomes 12 Dune planets (Caladan, Giedi Prime, Kaitain, Salusa Secundus, Ix, Richese, Wallach IX, Lankiveil, ...); distance and direction cells show '⁇', proximity always counts up to 100%, direction is replaced by a per-row emoji (🪱 🌶️ 🏜️ 💧 🔪 👁️), the treemap iframe is swapped for /aprilfools.html, and share squares become 🟧 🟫 ⬛.
- Persistence is localStorage only, keys: `guesses` ({ 'YYYY-MM-DD': Guess[] }), `settings` ({noImageMode, rotationMode, distanceUnit, theme}), `hideImageMode`, `rotationMode` (both per-day maps).
- Loss reveal: after the 6th wrong guess, toast.info(countryName.toUpperCase(), {autoClose: false, delay: 2000}). Both endings also render a link to the answer's OEC country profile (https://oec.world/en/profile/country/{iso3}).
- Server side-effects (worth stripping in a clone): if consent is granted, the app GETs https://geolocation-db.com/json/ for IP data and POSTs {game:'tradle', meta:{user: ipData, userId}, answer:{country}, submission:{guesses}, won} to https://oec.world/api/games/score.

### SCORING
There are no points — feedback only. Proximity % (src/domain/geography.ts, verified verbatim): MAX_DISTANCE_ON_EARTH = 20,000,000 m; proximity = Math.max(20_000_000 - distance_m, 0); pct = Math.round(proximity / 20_000_000 * 100); then `if (distance > 0 && pct >= 100) return 99`. So a wrong guess can never display 100%; only the exact answer (distance 0) shows 100%. Emoji/square meter (generateSquareCharacters): 5 squares per guess; greenSquareCount = Math.floor(pct / 20); yellowSquareCount = (pct - 20*greenSquareCount) >= 10 ? 1 : 0; remaining squares are white. i.e. each 🟩 = 20 proximity points, a 🟨 = a leftover >= 10, ⬜ = nothing. Examples from the in-game How-to-play: Chile at 13,557 km => 32% (🟩⬜⬜⬜⬜ + no yellow since 32-20=12 >= 10 actually gives 🟩🟨⬜⬜⬜); Finland at 3,206 km => 84%; correct answer => 100% and 🎉. Distance uses centroids, so neighbours look far apart — the panel itself warns 'the computed distance between United States and Canada is around 2,260 km even if they have a common border'. Local stats (src/domain/stats.ts): played = number of day-keys with any guesses, winRatio = wins/played, currentStreak, maxStreak, guessDistribution for 1..6, averageBestDistance = mean of each day's minimum guess distance.

### DAILY
One puzzle per UTC day: dayString = DateTime.now().toUTC().toFormat('yyyy-MM-dd'), so rollover is 00:00 UTC. The country is looked up in the public data.new.csv schedule (hand-curated, filled through 2026-12-31 — 159 days still queued as of 2026-07-25). Puzzle number shown in the share text = Math.floor(days between START_DATE 2022-03-06 and the day being played) — cross-checked against OEC's own tweet 'Today's #Tradle Of The Day Answer #15' posted 2022-03-21 (15 days after 2022-03-06). Archive replay via ?date=YYYY-MM-DD; guesses are stored per day-string, so replays and archive days both count toward local stats.

### SHARE
Copied text is exactly three lines-blocks joined by newlines: `#Tradle #<puzzleNumber> <guessCount>/6<modifier>` then the emoji grid (one line of 5 squares per guess made, newline-separated) then the literal URL `https://oec.world/en/games/tradle`. guessCount is the number of guesses used, or the letter `X` if lost. modifier is ' 🙈' when hideImageMode was on, else ' 🌀' when rotationMode was on, else ''. Squares are 🟩 / 🟨 / ⬜ (see scoring for the 20%-per-green rule). Example for a 3-guess win on 2026-07-25: `#Tradle #1602 3/6` / `🟩🟨⬜⬜⬜` / `🟩🟩🟩🟨⬜` / `🟩🟩🟩🟩🟩` / `https://oec.world/en/games/tradle`. The modal above the button additionally shows 'Congratulations!' or 'Try again next time...', the word 'Tradle', 'Puzzle #<n>', and the same grid.

### UI
- Guess table = CSS grid, `grid-cols-7 gap-1`, 6 rows. An unplayed row is one grey `col-span-7 h-8` bar (clicking it focuses the input).
- Reveal animation per row: state RUNNING renders the 5 squares (col-span-6) + the % (col-span-1); each square fades in with animationDelay = 250 ms * index (SQUARE_ANIMATION_LENGTH = 250); the % counts up via react-countup over 1.25 s; the row flips to its ENDED layout after 250 * 6 = 1500 ms.
- ENDED row layout, left to right: country name + external-link icon (col-span-3, name truncated with ellipsis), distance (col-span-2, clickable to toggle km/miles, role=button, Enter/Space supported), direction arrow (col-span-1), proximity % (col-span-1, with an extra 'animate-pop').
- Colour semantics: the winning row is `bg-oec-yellow` with dark text; all other rows are slate-200 (light) / slate-800 (dark). OEC brand colours in the theme are oec-orange #FF9D2B-ish family (share button) and oec-yellow #FCC419-ish family (win row) — Tailwind tokens `oec-orange` / `oec-yellow`.
- Treemap container: `relative h-0 pt-[25px] pb-96 md:pb-[70%]` — fixed ~384 px tall on mobile, 70 % aspect on desktop; iframe is absolutely positioned to fill it.
- Autocomplete: Mantine `Autocomplete`, 48 px tall, radius 12, `limit={5}`, custom item row = flag emoji + country name, filter matches diacritic-stripped substring of the name OR substring of the ISO2 code.
- Dark mode is a first-class setting (settings panel offers only two controls: distance unit KM/Miles and theme Light/Dark; default theme follows prefers-color-scheme).
- The 🙈 (no-image) and 🌀 (rotation) difficulty modifiers exist in state and in the share string but are NOT exposed anywhere in the settings UI in the current code — they can only be turned on by editing localStorage. Rotation is also not implemented for a treemap: rotationMode only renders a 'cancel rotation' button, nothing rotates.
- Bug worth not copying: the dark-theme share square is `theme === 'light' ? '⬜' : '⬜'` — both branches are the same white square, so dark-mode shares never use ⬛.
- UNVERIFIED / DO NOT COPY BLINDLY: the exact hex colour per HS section. The mapping is applied at runtime inside OEC's own visualisation service; it is not in the embed HTML nor in any of the 139 JS chunks I downloaded and grepped, and the live embed refused to render in an automation browser (blank d3plus SVG + Cloudflare challenge + consent dialog). The only long categorical palette shipped in OEC's bundle is d3plus's default 18-colour scale (#4281A4, #F6AE2D, #C44536, #2A9D8F, #6A994E, #CEB54A, #5E548E, #C08497, #99582A, #8C8C99, #1D3557, #D08C60, #6D2E46, #8BB19C, #52796F, #5E60CE, #985277, #5C374C) — 18 < 21 sections, so I cannot claim that is the section palette. A clone must define its own 21-hue palette keyed on Section ID anyway (an offline clone cannot use the iframe).
- The original shows no colour legend at all — players learn the section colours only by osmosis. Big, cheap win for a clone.

### DATA NEEDED
- Country table: ~248 rows of {iso2, iso3, name, latitude, longitude} — lift directly from https://raw.githubusercontent.com/alexandersimoes/tradle/main/src/domain/countries.ts (Google canonical countries centroids) or regenerate. ~25 KB.
- Export composition per country: OEC's OLAP API works unauthenticated and is the cleanest source. Recipe (verified live): https://oec.world/api/olap-proxy/data.jsonrecords?cube=trade_i_baci_a_92&drilldowns=Section,HS4&measures=Trade+Value&Year=2023&Exporter+Country=<key> where <key> is a member key from https://oec.world/api/olap-proxy/members?cube=trade_i_baci_a_92&level=Exporter%20Country (231 exporters; keys look like 'nausa' = United States, 'afgmb' = Gambia). Columns returned: Section ID, Section, HS4 ID, HS4, Trade Value. Row counts per country: 1,217 for the USA (133 KB), 398 for Gambia (43 KB).
- Trimmed for a static clone: keep the top ~40 HS4 products per country (or everything >= 0.3 % share) plus a lumped 'Other' remainder, storing {sectionId, hs4Name, share}. 231 countries x ~40 rows is roughly 9-10 k records — about 300-500 KB minified JSON, comfortably inlined or lazy-loaded in a single-page app, and it removes the iframe entirely.
- HS92 section table: 21 rows {id, name} from https://oec.world/api/olap-proxy/members?cube=trade_i_baci_a_92&level=Section, plus your own 21-colour palette and (optionally) a per-section icon.
- Optional full product tree with slugs (Section -> HS2 -> HS4 -> HS6) is server-rendered inside https://oec.world/en/product-landing/hs (~2.7 MB HTML) if you want proper product hierarchy/labels.
- Optional: the official answer schedule https://raw.githubusercontent.com/alexandersimoes/tradle/main/public/data.new.csv (1,663 date->ISO2 rows, 2022-06-14 to 2026-12-31, 222 distinct countries) if you want to replay the exact historical dailies for parity/archive.
- Optional headline number for a hint or reveal card: total export value per country (sum of Trade Value) — free from the same API call.

### WEAKNESSES
- The feedback is 100 % geographic, so trade knowledge only matters for guess 1; after that it is Worldle-with-extra-steps. Reviewers put it bluntly: the country 'can be narrowed down through the location hints' and 'the country's exports and trade becomes obsolete after the first guess'.
- Country clusters make 6 guesses structurally insufficient. A long-time daily player: 'trouble spots for both of us are the Caribbean, west Africa, and the Balkans' because they 'comprise areas with a lot of small countries so you can end up playing a game of guessing hopscotch, getting slightly closer but never quite arriving in your six guesses'. OEC itself tweeted 'Remote country islands are always the hardest!'
- The answer pool is stuffed with micro/near-uninhabited territories whose 'exports' are re-export noise: the schedule includes Tokelau x9, Saint Barthélemy x9, Nauru x8, Kiribati x8, French Southern Territories x7, Cocos Islands x7, Pitcairn Islands x6, Niue x6, Norfolk Island x6, Christmas Island x4, Tuvalu x4, Montserrat x4. Same player: 'Really Tradle? I checked, nobody lives there!' and 'some days the automated system throws some genuine bullshit our way'.
- Heavy repetition: only 222 distinct answers across 1,663 scheduled days (2-13 appearances each). The same player notes the sting: 'when you get repeats…you do worse when the same place shows up'.
- Zero spoiler protection: the entire future schedule to 2026-12-31 is a public CSV (/en/tradle/data.new.csv), and ?date=YYYY-MM-DD replays any day, so streaks and 'X/6' claims are unverifiable.
- Treemap is a remote iframe frozen at 2023 data: requires network, is slow, has no colour legend, truncates HS4 labels in small rectangles, and can silently fail to render (I observed a completely blank embed on both the games page and the direct embed URL).
- Dead / undiscoverable features: the 🙈 no-image and 🌀 rotation difficulty modifiers appear in the share string but have no UI toggle; rotation does nothing to a treemap; dark-mode share squares were never implemented (both ternary branches emit ⬜).
- Monetisation friction: a modal auto-pops 3 s after the game ends carrying an AdSense unit plus cross-promos to ConnecTrade and Pick 5.
- Privacy: with consent it calls a third-party IP-geolocation service (geolocation-db.com) and POSTs your IP data, session id, the answer and all your guesses to oec.world/api/games/score.
- Fragile stats: streaks are computed by walking localStorage object keys in insertion order, 'played' counts any day where you made a single guess, and playing archive dates interleaves day-keys — so streaks are easy to corrupt by accident.
- Schedule contains an impossible date (2025-02-29), quietly dropping one puzzle from the rotation.
- The loss reveal is only a toast, and the only 'learning' payoff is an outbound link to oec.world — nothing explains why the treemap looked the way it did.

### IMPROVEMENT IDEAS
- Two-player daily duel as a first-class mode, not a share-string ritual: both players play the same puzzle-of-day blind on their own device, and each result encodes to a short base64 'result code' (puzzleId + guess ISO2 sequence + elapsed ms). Paste your partner's code and the app renders both boards side by side and re-verifies their score locally (deterministic, so no cheating and no server needed).
- Two-person season scoreboard: points per round (1 guess = 6 pts … 6 = 1, miss = 0), bonus for the better first guess (higher proximity), running head-to-head record, weekly and monthly winners, longest 'beat-your-partner' streak, and a rivalry chart. All localStorage, with JSON export/import so a browser wipe or a low-RAM crash cannot delete the season.
- Fix the #1 design flaw with trade-shaped feedback: alongside (or instead of) distance/direction, show trade similarity between your guess and the target — cosine similarity of their 21-dimension HS-section export vectors as a %, plus the two sections you most over- and under-weighted ('too much Machines, not enough Mineral Products'). Trade knowledge then keeps paying off for all 6 guesses. Offer Geo / Trade / Both feedback modes so a couple can pick their shared house rules.
- Kill the Caribbean hopscotch: replace raw centroid distance with rank feedback ('27 countries in the pool are closer than your guess' Globle-style) and/or a region-lock hint once you land in the right sub-region; optionally grant a 7th guess automatically when the target is in a dense micro-state cluster. Also drop centroid weirdness by using a real nearest-border distance when you want 'neighbour' to feel like neighbour.
- Difficulty tuning the original cannot do: answer-pool selector (Top 60 exporters / Top 120 / all 222 / micro-states only), a 'no uninhabited territories' switch, hard mode (squares only, % hidden), expert mode (only the top 5 products shown), and easy mode (continent hint or total-export-value hint). A nervous player and a confident player can then share a puzzle at different difficulties and still compare on a normalised score.
- Full archive + unlimited practice offline: 1,663 historical dates already exist in the public schedule, and all the data is bundled, so ship (a) daily, (b) archive-by-date with a calendar of your and your partner's results, (c) endless random practice, (d) per-country drills ('show me all 40 African treemaps in a row'). Keep practice results in a separate bucket so the daily streak stays honest.
- Custom packs authored for each other: one person picks 20 countries (or a theme — 'places we want to visit', 'coffee exporters') and the app emits a pack code; the other plays it and the results come back as a code. Asymmetric, personal content is the single biggest thing a two-person clone can do that a global daily cannot.
- Progressive-reveal hint economy built on the local treemap: start with only the largest 3-5 rectangles visible and reveal another slice of the treemap after each wrong guess (or let a player spend one of two daily 'peeks' to unlock the next slice, recorded in the share string as a modifier so scores stay comparable). Impossible with OEC's fixed iframe, trivial with bundled data.
- Always-on legend + a real reveal card: a compact key for the 21 HS sections, and on game end a card with the country, total 2023 exports, its top 5 products with shares, its dominant section, one surprising line, and a ranked list of your guesses by trade similarity. Turns a loss into the thing the OEC actually wants (learning) instead of a link out.
- Render the treemap locally (squarified treemap in SVG/canvas from the bundled JSON) so the game is instant, works on a plane, is tappable for labels, is theme-aware, and scales properly on mobile — this also removes the iframe, the ads, the IP-geolocation call and the score POST entirely.
- Anti-spoiler daily selection: derive the day's country from a seeded hash of the date over a shuffle-bag permutation (no repeats until the pool is exhausted) instead of a readable CSV, so neither player can peek and Brazil does not show up 13 times.
- Polish the original's rough edges: reveal the answer in a card rather than a toast, keyboard-first play (type-ahead + Enter, no mouse), remember km/miles, correct dark-mode share squares (⬛), a 'copy for iMessage' variant with both players' rows in one block, and one-tap localStorage backup/restore.


==========================================================================================
## Pick 5 (OEC)   [confidence: high]
https://oec.world/en/games/pick-5 — the playable app is iframed from https://prod.oec.world/en/games/game/pick-5

### CORE LOOP
One HS4 product per day (e.g. today, 2026-07-25, is puzzle #809, 'Rare-Earth Metal Compounds', HS4 2846). The product name sits in a full-width banner over a date-seeded neon gradient. Your job: name the five countries that export the most of it. You pick one country at a time from a large searchable dropdown of 226 countries (flag thumbnails from flagcdn.com) and press the orange-to-pink 'Pick' button. Each pick is instantly and irrevocably scored: the row types out the country name, then its dollar export value for that product, then a circled badge fades in showing that country's TRUE world rank for the product, colour-coded green/yellow/red. Simultaneously a coloured segment is appended to a horizontal bar whose total width is your running score, and a big count-up number above it ticks to your new percentage with 2 decimals. Three tick marks with trophy glyphs sit on the bar at 50/75/90%. After exactly 5 picks the game ends (no undo, no skip, no 6th pick) and a results modal opens with the true top 5 and their values, your selection with ranks, the trophy you earned, and a read-only textarea holding the share text plus a copy button. Takes 1–3 minutes.

### RULES
- selectionLimit = 5. Endgame fires when selection.length === 5. There is no other guess limit, no undo, no skip, no give-up.
- Countries you have already picked are set disabled in the dropdown, so no duplicates.
- The answer set is EVERY country that exported that HS4 product in 2023, sorted descending by trade value and ranked 1..N. N varies by product (today's product had 83 exporters; commodity products can have 150+).
- Every pick earns partial credit, not just top-5 hits. Score contribution = that country's export value for the product / (sum of the true top-5 countries' export values) x 100.
- Per-pick feedback colour: rank <= 5 -> green #69db7c + 🟢; present in the exporter list but rank > 5 -> yellow #fab005 + 🟡; absent from the list entirely (zero recorded exports) -> red #ff8787 + 🔴 and 0 points.
- Bar segment colour is by pick ORDER, not correctness: Mantine blue[2..6] = #a5d8ff, #74c0fc, #4dabf7, #339af0, #228be6. Segment width = Math.round(that pick's percentage), with a 0.5% minimum sliver so a 0-point pick is still visible.
- Because each pick's rank and value are revealed immediately, later picks are informed: you learn whether you are on track before you have spent all five.
- New product every day at 00:00 UTC. The header shows a live 'Next in HH:MM hs' countdown computed to the next UTC midnight, plus a 'Built at <UTC datetime>' stamp.
- Archive: ?date=YYYY-MM-DD loads a past puzzle and shows an alert 'You are playing a historical puzzle from <date>'. ?date=-N (negative integer) is also accepted as an N-days-ago offset. 61 recent days are embedded in the page; older dates trigger a lazy fetch from the Google Sheet + CMS + API.
- Other URL params: ?theme=light|dark forces the colour scheme; ?consent=true is what enables the score POST and the third-party IP-geolocation lookup (without it, nothing is sent).
- Progress is saved per date in localStorage AND mirrored to a cookie on domain .oec.world (Secure; SameSite=None), key 'oec-game-pick-5-history', shape {"YYYY-MM-DD": {selection: [countryIds], progress: number}}.
- On the 5th pick (consent only) it POSTs to https://oec.world/api/games/score with {game:'pick-5', meta:{user: <ip geo blob>, userId}, answer:{product:{date,level,hs,name}, top5:[ids]}, submission:{selection, progress}, won: progress >= 50}.
- Login is optional and arrives by postMessage from the parent oec.world frame (requestSession / session); logged in you get 'Hi, <name>!' and a userId on the score post. Not logging in shows a nag alert.
- The stats dialog offers a per-date list with 'Play Now!' / 'Continue!' links, and the results modal nags 'Did you miss some Pick5 past days?' / 'You have pending games!' if any of the 61 embedded dates is unplayed.

### SCORING
score% = SUM over your 5 picks of ( country's 2023 export value of that HS4 product / SUM of the true top-5 countries' export values ) x 100. Maximum is 100.00% and is achieved only by naming the exact top 5 (any substitute is by definition smaller than the country it replaces). Displayed to 2 decimals. Trophy tiers, exactly as coded (thresholds array [50,75,90]): < 50% = 'no_prize', colour lightgray, NO medal emoji in the share text; >= 50% = bronze #cd7f32 🥉; >= 75% = silver #C0C0C0 🥈; >= 90% = gold #FFD700 🥇; exactly 100% = 🏅. End-of-game heading: progress < 50 -> 'You can do better! Try again tomorrow!'; progress >= 50 -> 'Good Job! You won a trophy today!'. Official in-game help text verbatim: 'If your selection sum is bigger than 50% of the top 5 exporters total, you win a bronze cup. Bigger than 75%, silver and bigger than 90%, gold cup. Depending on the product, you can win a gold cup even if you don`t guess the exact top 5.' Worked example (today's real data, HS4 2846 Rare-Earth Metal Compounds, top-5 total $2,978,775,613): Burma 48.41%, China 17.26%, Malaysia 17.11%, USA 9.08%, Japan 8.14%. Rank 6 Laos would give 3.48%, rank 7 France 3.05%. The stats dialog's 'Record' row shows a count of past games per medal tier (no_prize / bronze / silver / gold) and nothing else — no streak, no win rate.

### DAILY
Strictly one HS4 product per day, rolling over at 00:00 UTC (unlike Connectrade, which uses local midnight). The schedule is fixed in advance in a PUBLISHED GOOGLE SHEET CSV: 911 rows, columns order,date,level,hs,name,img,emoji, running order #1 = 2024-05-08 through order #911 = 2026-11-04, all level HS4, 906 distinct products (a handful repeat: Monofilament, Glycerol, House Linens, Sound Recording Equipment, Artificial Monofilament each appear twice). order = days since 2024-05-08 + 1. Archive access is real and unlimited by URL (?date=YYYY-MM-DD or ?date=-N) with one stored result per date; the stats dialog lists every date it knows about with a Play/Continue link. Only 97 of 911 rows have a product image and only 120 have an emoji.

### SHARE
Five lines in a read-only 5-row textarea with a copy icon (tooltip flips 'Copy' -> 'Copied'). There is no Web Share sheet and no image. Template: line 1 = `Pick5 #{order} - {product name} {product emoji}` (the emoji column is empty on ~87% of days, so you usually get a trailing space); line 2 = `{medal }{score.toFixed(2)}%` where the medal and its trailing space are omitted entirely below 50%; line 3 = the five result emoji joined by SINGLE SPACES, then a space, then `{hits}/5`; line 4 = `Play #oecGames today!`; line 5 = `https://oec.world/en/games/pick-5`. Concrete example: "Pick5 #809 - Rare-Earth Metal Compounds \n🥇 92.63%\n🟢 🟢 🟡 🟢 🔴 3/5\nPlay #oecGames today!\nhttps://oec.world/en/games/pick-5". Note there is no emoji grid — it is one row of five dots, so it carries far less information than a Wordle/Connections share.

### UI
- Product banner: full-width Box whose background is a 45deg gradient between two of ['#ff00ff','#00ffff','#ff9900','#ff0066','#00ff99'], index = (Y+M+D summed as integers) mod 5 — so the colour pair is deterministic per date. On top, a BackgroundImage of the product photo (usually absent) behind a 50%-opacity black overlay, min-height 100px, with the product name as a centred white h1 (Mantine order 2 / size h1) and a tiny white 'HS4 2846' label beneath it. Post-endgame an external-link icon appears next to the name pointing at the OEC product profile.
- Header: theme-specific Pick-5 logo SVG (160x60), a subtle '?' help icon button and a bar-chart stats icon button, the 'Next in HH:MM hs' countdown, and a 'Built at <UTC datetime>' line.
- Score row: a trophy icon (a different glyph below vs at/above 50%, tinted with your tier colour — lightgray/#cd7f32/#C0C0C0/#FFD700) at 3rem, next to a bold count-up number, 2 decimals, '%' suffix, 2-second animation from the previous value.
- Score bar: 2rem-tall grey track (gray[2] light / gray[8] dark), 0.25rem radius. Your picks are left-aligned Mantine Badges, each labelled with the flag+country name, width transitioning over 1s ease. Overlaid absolutely are three 2px vertical tick lines at left:50%/75%/90% with a trophy glyph hanging below each, coloured for that tier.
- Pick list: five rows, unfilled slots rendered as pale full-width placeholder pills. A filled row is: circled pick number (1–5, in that pick's blue), then the country name typed out character-by-character, then — only once the name finishes — the export value typed out ('$1.4B'-style), then a circled rank badge fading in from the left in green/yellow/red. The staged animation is the game's signature beat.
- Input: 56px-tall Mantine Select, radius xl, searchable, amber 2px border (rgba(245,158,11,0.4)), flag thumbnail in the left slot once a country is chosen, dropdown opens UPWARD with 16px radius and 12px-radius options, 'Nothing found...' empty state, placeholder 'Pick an exporter'. Right section is a 40px gradient button (#ea580c -> #db2777, 135deg) labelled 'Pick', disabled until something is selected.
- Historic play shows a bordered info alert: 'You are playing a historical puzzle from 2026-06-05'. Date switching uses history.pushState so the URL stays shareable.
- Light/dark aware throughout (Mantine colour scheme, forceable via ?theme=). Mobile: modals go fullScreen below 768px, results columns stack.
- Results modal contents in order: greeting, trophy verdict heading, the score bar again, 'Top 5 exporters of <product>' + the true five with values and profile links, 'Your selection' + your five, 'Share your results with your friends!' + the textarea and copy button, the pending-games nag with a 'Play NOW' button, an AdSense slot, then 'Have more fun with OEC Games!' with Play Tradle / Play Connectrade buttons.
- Stats modal: 'Record' — one column per medal tier showing a trophy rendered at that tier's threshold and your count; then 'History' — one row per date with the date, a proportional bar, the percentage to 2 dp, a trophy icon, and a Play Now!/Continue! link for unplayed dates. Today's row is bold.
- Stack: Next.js App Router, Mantine v7 (standard palette, unmodified), react-countup, react-type-animation. Rendered inside an iframe that posts its height to the parent (sentinel:'amp', type:'embed-size').

### DATA NEEDED
- Daily product schedule: 911 rows {order, date, level:'HS4', hs, name, img, emoji}, 2024-05-08 to 2026-11-04, 906 unique products. Source is a public Google Sheet CSV (docs.google.com/spreadsheets/d/e/2PACX-1vR8WG1lMf-bj_5iw61Oob1TtfoZL9vuo-4U10ZA1HBrawXWySQHoc5lWesQ4EUQSyHBFE37RzZIb38U/pub?gid=0&single=true&output=csv). ~48 KB.
- Per product, the FULL ranked exporter table for Year 2023: {Exporter Country ID, Exporter Country, Trade Value, rank}. Source: OEC Tesseract, cube trade_i_baci_a_22 (CEPII BACI, table 'HS6 REV. 2022 (2022–2024)'), drilldowns=Exporter+Country, measures=Trade+Value, include=HS4:<hs>;Year:2023. The production game calls api-v2-dev.oec.world (a dev host) for this. Typical 40–200 rows per product.
- Size estimate for an offline clone: full exporter lists for all 906 products ≈ 100k rows ≈ 4–6 MB raw JSON (well under 1 MB gzipped if you emit compact arrays). Trimming to the top 25 per product (enough to score any realistic pick, with everything else scored as 0) gets you to ~600 KB–1 MB raw. Keep the full list if you want honest 'rank 61 of 83' feedback.
- Country picker list: 226 entries {code (e.g. 'nausa'), label with flag emoji}. ISO2 codes only needed if you want raster flags; flag emoji alone works offline (the original hits flagcdn.com, which a clone must not).
- Optional product art: https://cdn-stories.oec.world/pick-5/hs4/{hs}.webp, present for only 97 of 911 days; and OEC CMS thumbnails via /api/cms/member/image. An offline clone should inline its own emoji/icon per HS4 chapter instead.
- For the extra 'why' layer suggested below: each top-5 country's RCA for that product and the product's share of that country's total exports — same BACI cube plus /complexity/rca endpoint. Adds ~5 numbers per product-country pair.

### WEAKNESSES
- IMPORTANT CAVEAT: there is no meaningful public complaint corpus for this game — no Reddit threads, no reviews with cons, nothing on dles.gg/playlin beyond promo copy. Almost everything below is a defect or design limit I verified directly in the shipped bundle and against the live API, not something players have written up. The only independent commentary I found is an academic teaching write-up (economicsnetwork.ac.uk/showcase/riano_games).
- The score is dominated by rank 1 and is therefore low-agency and wildly variable day to day. On today's product, naming ONLY Burma and whiffing the other four scores 48.41% — one country away from bronze. A player who nails ranks 2–5 but misses #1 gets 51.59%. On a flatter product all five picks matter; on a concentrated one nothing else does, and you can't tell which kind of day it is until it's over.
- VERIFIED BUG: a country with zero recorded exports of the product gets rank = 0, and the share line counts hits with `rank <= 5`. So 0 <= 5 is true and a complete whiff is counted as a top-5 hit in the '{n}/5' you share. Picking Tokelau or Wallis and Futuna silently inflates your posted score line while the red 🔴 dot correctly shows you got nothing.
- VERIFIED BUG: the 🏅 perfect-game badge is gated on `100 === progress` with exact float equality. Summing the five ratios for today's product yields 100.00000000000001, so a genuinely perfect answer displays '100.00%' and still awards 🥇, not 🏅. The 🏅 tier is effectively unreachable. (There is also a dead final branch that would emit the literal string 'lightgray' as an emoji.)
- No streak, no win rate, no average, no head-to-head, nothing social. 'Record' is four medal counts plus a list of per-date bars. For two people comparing results daily this is the single biggest gap.
- Sharing is copy-out-of-a-textarea. No Web Share sheet, no image, no deep link back to the same puzzle, and one row of five dots conveys almost nothing compared to a Wordle grid.
- Half the difficulty is vocabulary, not trade knowledge. Products are raw HS4 labels — 'Wadding', 'Stranded Iron Wire', 'Semi-Finished Iron', 'Silicates', 'Scent Sprays' — with no definition, and on ~90% of days no picture either. The Economics Network write-up flags exactly this: learners need prior Harmonized System familiarity and instructors have to explain unfamiliar products.
- The Economics Network write-up also notes players default to guessing China, USA and Germany. The scoring rewards that habit (those three are top-5 for a huge share of HS4 lines) without teaching anything.
- The input is a searchable dropdown of all 226 countries, so it is a recognition test with a browsable answer key rather than a recall test. You can scroll the list.
- You are never told N (how many countries export this product), so you cannot calibrate whether 'top 5 of 40' or 'top 5 of 180' is the task.
- Data is frozen at Year 2023 and, for Pick 5 specifically, served from api-v2-dev.oec.world — a dev host in production. Nothing works offline; a slow API leaves a spinner.
- Runs in a cross-origin iframe on oec.world and stores history in a .oec.world cookie plus localStorage. Private browsing, cookie blocking or third-party-cookie restrictions lose your whole record. There is no export.
- Google AdSense units in the results modal, the stats modal and the help modal, plus a call to geolocation-db.com (a third-party IP lookup) before every score post.
- Difficulty is entirely fixed — the only variable is which product the sheet happened to schedule. No easy/hard mode, no practice mode, no category filter.
- The schedule runs out on 2026-11-04. Nothing in the app handles the end of the list.

### IMPROVEMENT IDEAS
- Blind simultaneous duel on the same seed. Both players pick on their own device/tab; each side's picks stay hidden until BOTH have locked all five, then reveal a two-column diff: her 5 vs his 5, each with the true rank badge, per-pick percentage, and the score delta. This solves the real problem of playing on the same sofa — right now one person's screen spoils the other's.
- A proper head-to-head ledger, which the original has nothing like: running record (e.g. 41–37–5), current and longest win streak, mean score each, biggest single-day blowout, and per-category splits (agriculture / minerals / chemicals / machinery / textiles / transport, derivable straight from the HS chapter) so you learn who is better at what and can trash-talk with evidence.
- Co-op mode: pool the five picks between you (she takes 3, he takes 2, alternating who leads each day) and chase 100% together, with a shared streak. Genuinely different from solo play and impossible in the original.
- Complement score: a bonus for picks your partner did NOT think of, so the incentive is to cover different ground rather than both naming China.
- Ship the whole 911-day archive locally. The original preloads only 61 days and lazily fetches the rest from a Google Sheet plus a dev API. Offline you get instant random-day practice, a 'both of us bombed this' retry queue, and unlimited replays — none of which the original allows without re-fetching.
- Difficulty dials the original cannot offer: HARD = free-text country entry with fuzzy match instead of a browsable dropdown; BRUTAL = no per-pick feedback until all five are locked (removes the mid-game information leak); EASY = show N (how many countries export it) and a continent breakdown of the answer set; PRACTICE = unlimited picks until you find all five, scored on attempts.
- Fix the two verified bugs and add a tiebreaker that makes similar scores distinguishable: rank-distance = sum of |your pick's rank − 1..5|, so two 92% days can be ranked, and a 5-for-5 day is unambiguously better than a lucky one-whale day.
- Anti-whale scoring option: a second score line that gives 20 points per correct top-5 country regardless of size, shown alongside the value-weighted percentage. Report BOTH so the concentrated days stop feeling like coin flips, and let the couple agree which one the ledger uses.
- Custom packs — the highest-value thing an offline clone can add: 'food only', 'no China/USA/Germany in the top 5', 'things we own', 'HS chapters one of us studied', 'the 40 hardest days by our own historical scores'. Also let one partner hand-pick tomorrow's product for the other.
- A real learning layer after the reveal, precomputed once offline: one line per top-5 country giving its RCA and what share of its own exports this product is, plus a one-sentence 'why' (Burma -> rare-earth ore feeding Chinese processing). The original just links out to oec.world, which is useless offline and breaks flow.
- Show a plain-language definition and a picture or icon for the product on ALL days, not the 10% that have art. Bundle a small HS4 gloss; it removes the pure-vocabulary failure mode without making the trade question easier.
- Share as one compact line that names both players and their scores, plus an optional PNG card. And a 'rematch this product in 30 days' scheduler so you can see whether you actually learned it.
- Store everything in one exportable JSON blob with import/export buttons and an obvious 'back up now' nudge. The original depends on a .oec.world cookie that any privacy setting can wipe; a couple's multi-year ledger must not be that fragile.
- Handle the schedule ending: fall back to a deterministic seeded shuffle of the 906-product pool so daily play never stops.


==========================================================================================
## Connectrade (OEC ConnecTrade)   [confidence: high]
https://oec.world/en/games/connectrade — the playable app is iframed from https://prod.oec.world/en/connectrade

### CORE LOOP
An NYT-Connections-shaped grid, but with the categories shown. Four countries of the day are listed by name and flag in a grey strip above a 4x4 grid of 16 HS4 product names; each country owns exactly four of them (its top four exports by Revealed Comparative Advantage). Tap four tiles — the selected ones go grey — then Submit. A correct set animates away and is replaced by a full-width coloured band showing that country's name and its four products; a wrong set makes the tiles jitter horizontally, costs you a heart, and if you had exactly three of four right you get a 'One off!' toast. Every attempt is appended to a numbered log at the bottom with a ✅ or ❌, and in Easy mode (the default) each product in that log is prefixed with the emoji of its true group, so the log itself becomes a slowly-filling answer key. Solve all four groups before six mistakes. On the sixth mistake the grid is replaced by 'Sorry, try again tomorrow!' and the answers are never spelled out. 2–5 minutes.

### RULES
- Grid is 16 tiles = 4 countries x their top 4 products, Fisher–Yates shuffled on load. Four columns, four rows; each tile is 23.5% x 23.5% of a 400px-tall relatively-positioned container, absolutely placed at left = 25.5 * col %, top = 25.5 * row %.
- The four countries of the day ARE SHOWN by name with flag emoji, always, in both Easy and Hard mode. This is the biggest rules difference from NYT Connections: you know WHO, you only have to work out WHICH products. The strip is uncoloured, so it does not tell you which country maps to which emoji/colour.
- Exactly four tiles selectable. Tapping a fifth is ignored (you must deselect first). Tiles already locked into a solved band cannot be selected.
- Submit is disabled unless exactly four are selected AND that exact four-set has not been submitted before — duplicate guesses are blocked, not punished.
- Six mistakes allowed. A read-only Mantine Rating renders six hearts, value = 6 − (number of attempts with correct === 0). Filled heart = gray-7 (#495057), empty = gray-4 (#ced4da) in light mode; the two are swapped in dark mode.
- 'One off!' warning toast fires when your guess shares exactly 3 of 4 products with a real group (intersection count === 3).
- Correct guess: the four tiles reposition (1s spring) and a full-width band (100% wide, 23.5% tall, radius 4px, background = that country's colour) fades in over 1s with an h3 of the country name and a comma-joined list of its four products. Solved bands stack from the top and push remaining tiles down.
- Wrong guess animation: 'jitter' — the four tiles shuffle ±2% horizontally over 0.3s flashing lightgray; then after a 1s pause a 'jitter2' vertical bounce plays per tile at 200ms intervals as they settle back to their own colour.
- Easy/Hard Switch, yellow, size lg, DEFAULT = Easy (checked), NOT persisted — it silently resets to Easy on every page load. Easy mode's only effect is in the attempts log: each product is prefixed with its true group emoji (🟥/🟨/🟩/🟦). Hard mode shows the guess as plain comma-joined text.
- Group colour and emoji are assigned by the country's INDEX in the day's list, not by difficulty: 1st country = 🟥 #FA5656, 2nd = 🟨 #F4CD10, 3rd = 🟩 #A0D447, 4th = 🟦 #2F97FF. Unlike NYT Connections, the colours carry no difficulty signal at all.
- How the four products per country are chosen, per the in-game help: sort that country's HS4 exports by RCA descending (top 100 fetched); discard any product worth less than 0.5% of the country's total exports; if two countries share a product, the country listed FIRST keeps it and the later one loses it; then take the first four remaining.
- On the sixth mistake the entire grid, controls and hearts are unmounted and replaced with a centred 'Sorry, try again tomorrow!'. The correct groupings are never revealed in place.
- Archive: ?date=MM/DD/YYYY looks the date up in a hardcoded schedule of 977 keys spanning 2024-02-21 to 2026-12-31 (220 distinct countries). There is NO UI for this — no date picker, no next/prev, no date label anywhere. Unknown dates fall back to a hardcoded default puzzle: 🇨🇱 Chile / 🇺🇸 United States / 🇫🇷 France / 🇦🇷 Argentina.
- Persistence: localStorage key 'attempts', a flat object keyed by MM/DD/YYYY, value = array of {guess:[4 product names], correct: 0 or 1 (actually the count of matching groups), description, color}. Plus 'scorePosted_<date>' flags. No versioning, no export.
- Score POST (only with ?consent=true) to https://oec.world/api/games/score with {game:'connectrade', meta:{user: <ip geo>, userId}, answer:{answers}, submission:{attempts, easy_mode, mistakes_remaining, num_correct}, won: 4 === num_correct}. It also fetches geolocation-db.com first.
- Optional login via postMessage from the parent oec.world frame; the subtitle becomes 'Hi, <name>! Group Each Country's Exports'.
- No countdown timer, no next-puzzle clock, no date shown, no reveal button, no give-up button.

### SCORING
There is no point score. The outcome is binary win/lose plus a mistakes-remaining figure from 0 to 6. End-modal headline logic, exactly as coded: 'Better luck next time!' if you lost; '👌 PERFECT! ' if answers.length === attempts.length (i.e. exactly 4 attempts, zero mistakes); otherwise 'Congratulations!'. Stats modal ('Statistics') shows three figures and a histogram: (1) 'Games' = the number of stored dates where either the attempt array has length exactly 6 OR 4 of the attempts were correct; (2) 'Victories' = (games with 4 correct / Games) x 100, rounded to 0 dp, or '-' with no games; (3) 'Average Mistakes' = 6 − mean(hearts remaining), computed over only those games with at least 1 heart remaining, and printed UNROUNDED (so you see things like 1.6666666666666667). Then 'Victories Distribution:' — a six-bucket histogram indexed 1..6 by hearts remaining, each row drawn as a read-only 6-heart Rating plus a bar (flex-basis = count/max x 100%, gray-4) and the raw count. Games finished with 0 hearts left are excluded from both the histogram and the average.

### DAILY
One puzzle per calendar day, keyed by the browser's LOCAL en-US MM/DD/YYYY date via Intl.DateTimeFormat — so it rolls at local midnight, not UTC (Pick 5 rolls at 00:00 UTC; the two OEC games disagree). The schedule is a hardcoded JSON map of 977 date keys, 2024-02-21 through 2026-12-31, each mapping to an ordered array of four {name with flag emoji, OEC country code}; 220 distinct countries appear, from China and the USA down to Montserrat, Tokelau and Northern Mariana Islands. Today (07/25/2026) is 🇧🇭 Bahrain / 🇲🇽 Mexico / 🇱🇧 Lebanon / 🇳🇬 Nigeria. Past dates are playable only by hand-editing ?date=MM/DD/YYYY, and because attempts are stored per date, revisiting a date resumes your old attempt log rather than starting fresh. The independently-computed 'Puzzle #' is unrelated to the schedule's start date, so the two numbering systems disagree by ~260.

### SHARE
A yellow 'Share' button in the end modal copies to clipboard and toasts 'Copied!'. Format: line 1 'ConnecTrade'; line 2 'Puzzle #<N>'; then ONE LINE PER ATTEMPT in the order you made them, each line being the four emoji of the TRUE group each of your four selected products belongs to (so a correct guess renders as four identical emoji, a scattered guess as a mix); then the URL https://oec.world/en/games/connectrade. Example: "ConnecTrade\nPuzzle #995\n🟥🟨🟩🟦\n🟨🟨🟨🟨\n🟥🟥🟩🟥\n🟥🟥🟥🟥\n🟩🟩🟩🟩\n🟦🟦🟦🟦\nhttps://oec.world/en/games/connectrade". Puzzle number = Math.ceil(|today − 2023-11-03| / 86400000) with both dates floored to local midnight — that is #995 on 2026-07-25. There is a second grey button 'Play Tradle' and an AdSense unit in the same modal. No image share, no Web Share sheet.

### UI
- Header: a 3-column Mantine Grid with a 2rem filled help-circle icon on the left, the Connectrade wordmark PNG (302x38) centred, and a 2rem outlined bar-chart stats icon on the right, with a solid 2px gray-4 bottom border. Two decorative background PNGs are pinned to the left (290x691) and right (215x621) edges of the page.
- Subtitle h2: 'Hi{, name}! Group Each Country's Exports' — centred, 24px with a tight 22px line-height on desktop, 20px on mobile, and forced to #f5f5f5 in dark mode.
- Country strip: centred #f5f5f5 rounded (4px) block, 10px padding, country names as inline spans with 10px side margins (12px font and 4px margins on mobile), text always #000. Uncoloured — it does not map countries to group colours.
- Grid: 400px-tall relative container, transparent. Tiles are #ebebeb, radius 4px, bold, centred, `overflow-wrap: anywhere`, vertically centred via display:table plus a display:table-cell span, 12px font on mobile, with a 1px black border and #000 text in one theme. A selected tile's background becomes 'gray'. Solved bands are 100% x 23.5%, radius 4px, 10px padding, background = the country colour, containing an h3 country name and a 14px/1.2 paragraph of the four products.
- Motion (framer-motion): positions animate via left/top percentages with a 1s default transition. 'jitter' (wrong guess) = left keyframes at ±2% over 0.3s with backgroundColor lightgray. 'jitter2' (settling) = top keyframes at ±2% over 0.5s returning to the tile's own colour, fired per tile at 200ms intervals after a 1s delay. Solved bands fade opacity 0 -> 1 over 1s at z-index 2 while tiles sit at z-index 1.
- Controls: a 3-column SimpleGrid (10px gap on mobile, xs on desktop) holding [six read-only hearts | 'Clear' and 'Submit' buttons | the Easy/Hard Switch]. Switch is size lg, radius lg, colour yellow, with the label rendered inside the track ('Easy' when on, 'Hard' when off) and the body right-justified.
- Attempts log: h2 'Attempts' then an ordered list with list-style-position inside, a −20px text-indent hanging indent and 20px left margin; the ✅/❌ is an inline-block span pushed 25px to the right. In Easy mode each product is rendered as '<emoji> <product> '.
- Toasts: react-toastify defaults, position top-center. Warning colour #f1c40f for 'One off!'.
- End modal: no close button, escape disabled, no scroll lock. Contents = headline ('👌 PERFECT! ' / 'Congratulations!' / 'Better luck next time!'), blank line, 'ConnecTrade', 'Puzzle #N', the emoji rows one per div, then a grey pill 'Play Tradle' link-button and a yellow pill 'Share' button, then an AdSense unit.
- Stats modal: h3 'Statistics', a centred 3-column Grid of big-number/small-label pairs (Games / Victories / Average Mistakes), then h4 'Victories Distribution:' and a list where each row is [a read-only 6-heart Rating showing that bucket's value] [a gray-4 bar with flex-basis proportional to the bucket count] [the count].
- Footer: 'OEC • Tradle • Buy Merch'. Font: Open Sans. Stack: Next.js pages router, Mantine v7, framer-motion, react-toastify, Tabler icons. Rendered in an iframe that posts its height to the parent.

### DATA NEEDED
- Date -> four countries schedule: 977 entries, 2024-02-21 to 2026-12-31, each {name (with flag emoji), code}. 220 distinct countries. Roughly 90 KB of JSON — trivially bundleable.
- Per country: RCA-ranked HS4 export list (the original pulls the top 100 by RCA descending) AND that country's total 2023 export value, so the 0.5%-of-total filter can be applied. Source: OEC Tesseract on api-v2.oec.world, cube trade_i_baci_a_92 (BACI HS92 — note this is a DIFFERENT HS revision from Pick 5's trade_i_baci_a_22, so product names and codes are not interchangeable between the two games), endpoints /complexity/rca.jsonrecords (location=Exporter Country, activity=HS4, sort=RCA.desc, limit=100, cuts=Year:2023) and /tesseract/data.jsonrecords for the country total.
- For an offline clone the smart move is to precompute: either (a) the top ~12 qualifying HS4 products per country for all 220 countries — about 2,600 rows, well under 300 KB — and run the dedupe/slice logic locally, or (b) precompute all 977 finished puzzles outright (977 x 4 country names x 4 product strings ≈ 250 KB) so the grid is deterministic and guaranteed solvable.
- Optional for a learning layer: each chosen product's RCA value and its share of that country's total exports (both already in the same query), so the solved band can show WHY those four products are that country's signature.
- No product images or emoji are used at all — Connectrade is pure text tiles.

### WEAKNESSES
- IMPORTANT CAVEAT: there is essentially no public player-complaint corpus for Connectrade — no Reddit threads, no reviews listing cons. Everything below is a defect or design limit I verified directly in the shipped bundle, or a structural observation, not a user report.
- The puzzle is computed CLIENT-SIDE from live API calls on every page load. Consequences: the grid shows only 'Loading...' if the API is slow, the whole game is dead if api-v2.oec.world is down, and the 'answer' can drift between sessions or between two players if OEC's underlying RCA data or ordering changes. There is no server-side fixed answer for a given date.
- VERIFIED DEFECT — unwinnable puzzles are possible. The product list per country is filtered (>0.5% of total exports), deduped, then sliced to 4. A country that yields only 1–3 qualifying products produces a group with fewer than 4 words, and Submit requires exactly 4 selected tiles matching a group exactly — so that group can never be solved and the day is unwinnable. The schedule includes plenty of one-commodity micro-territories (Tokelau, Wallis and Futuna, Montserrat, Northern Mariana Islands, Saint Barthélemy) where this is a live risk. A country yielding zero qualifying products gets filtered out of the array entirely, after which the index-aligned lookup into that array is undefined and the component throws.
- VERIFIED BUG: the shared 'Puzzle #' is always computed from new Date() (today), never from the puzzle you actually played — so any archive play shares a wrong puzzle number, and two people comparing an archived puzzle will see mismatched IDs.
- VERIFIED BUG in stats: 'Games' counts stored dates where the attempt array has length exactly 6, as a proxy for 'lost'. But a loss can have more than 6 attempts (6 wrong plus any correct ones), so a loss in which you solved one or two groups is silently dropped from Games, from Victories and from the distribution. Win rate is therefore inflated.
- VERIFIED BUG in stats: 'Average Mistakes' is printed as a raw float (e.g. 1.6666666666666667) and is computed only over games with at least one heart remaining, so it excludes exactly the worst games it is meant to describe.
- The failure state is the worst possible for a learning game: on the sixth mistake the grid vanishes and is replaced by 'Sorry, try again tomorrow!'. The correct country-to-product mapping is never shown. You lose and learn nothing.
- The four colours carry no difficulty meaning (they are just country index), and because the countries are already listed above the grid, the share emoji don't even identify which country is which. The result is a share grid that looks like Connections' but conveys far less.
- Easy mode is ON by default, is not persisted (resets on every load), is labelled only 'Easy'/'Hard' with no inline explanation, and its actual effect — emoji-tagging the attempts log so it becomes an incremental answer key — is explained only inside the help modal. Many players will never realise they are playing with hints on, or will be silently reset to hints-on after a session in Hard.
- Difficulty is badly calibrated in both directions. Six mistakes is 50% more generous than NYT Connections' four, and showing the four country names removes most of the Connections-style ambiguity — so well-known countries make for a trivial puzzle. Meanwhile a day of four obscure territories is a pure lookup exercise with no deducible structure.
- No streak, no timer, no next-puzzle countdown, no date displayed, no archive UI, no reveal, no give-up, nothing social. Stats live in a single un-versioned 'attempts' localStorage key with no export.
- Products are raw HS4 labels with no images and no definitions, so as with Pick 5 a large part of the difficulty is HS vocabulary rather than trade knowledge.
- AdSense in the end modal, and a call to the third-party geolocation-db.com before posting a score.
- The hardcoded schedule ends 2026-12-31, after which every day falls through to the same hardcoded Chile/USA/France/Argentina puzzle.

### IMPROVEMENT IDEAS
- Blind simultaneous duel on the same seeded grid: both play independently, results unlock only when both have finished. Compare emoji ladders side by side, hearts remaining, wall-clock time, and which group each of you cracked first. Right now two people on the same sofa spoil each other instantly.
- Head-to-head ledger with real numbers: record, current/longest streak, perfect-game count each, mean mistakes, mean solve time, and 'who cracks which continent first' splits — the original tracks none of this and even miscounts its own losses.
- Turn-based co-op on one device, the mode this game most obviously wants and does not have: alternate submissions from a shared pool of six hearts, plus one 'veto' token each so you can block your partner's bad guess once per puzzle. Turns a solitaire into a conversation.
- Race mode with auto-handicap: identical grid, separate timers, first to four groups; the ledger sets the handicap (stronger player starts with 4 hearts instead of 6, or plays with country names hidden while the weaker player sees them).
- Fix the failure state properly: always reveal all four groups with country names, each product's RCA and its share of that country's exports, and offer an instant 'retry this exact puzzle' — something the original structurally cannot do because it burns the day.
- Precompute puzzles offline so they are deterministic and verified solvable. Reject any country that yields fewer than four qualifying products (the original's unwinnable-day bug), guarantee 16 tiles, and never show 'Loading...'. Ship the whole 977-day archive with an actual date picker plus a 'random puzzle' button.
- Difficulty dials the original doesn't offer: HIDE the country names for genuine Connections-grade difficulty (reveal them one at a time as hints you pay for); 4 mistakes instead of 6; a no-emoji hard mode that is actually remembered; and a country-obscurity slider (top-40 exporters only ... anything in the 220) so you can tune whether tonight is deduction or lookup.
- Make the colours mean something: assign 🟥/🟨/🟩/🟦 by measured difficulty (from your own two-player solve-order history), so the share grid finally carries information the way Connections' does.
- A shared hint economy: after a wrong guess, optionally reveal how many of your four belong to the same country without saying which. Give the couple a fixed nightly hint budget they have to negotiate over — a mechanic that only makes sense with two players.
- Custom packs, the highest-leverage offline-only feature: the four countries you have both visited, all-one-continent nights, commodity-vs-manufacturing nights, or a puzzle one partner authors by choosing the four countries for the other to solve. Ship a tiny country picker and the RCA table and this is nearly free.
- Repeat-country memory: countries recur across the 977-day schedule (Lebanon, Mexico, Malaysia all appear multiple times). Show 'you've seen Lebanon twice before, you missed it both times' and keep a per-country mastery score for each player, so play compounds into knowledge instead of resetting nightly.
- Persist the Easy/Hard toggle, show an inline legend for what Easy actually does, count losses correctly, round Average Mistakes to 1 dp, and derive the puzzle number from the puzzle you played rather than from today.
- Store the ledger in one exportable JSON blob with import/export, versioned, so a multi-year couple's record survives a browser wipe — the original's single un-versioned 'attempts' key does not.


==========================================================================================
## Trade Bingo — NAME DOES NOT RESOLVE (no such OEC game); closest is Export Hold'em   [confidence: low]
No such game exists. Closest OEC game: https://oec.world/en/games/export-holdem, app at https://export9.oec.world

### CORE LOOP
There is no OEC game called Trade Bingo. I read the OEC games hub directly on 2026-07-25 and it lists exactly six games: World Trade Cup (new), TradeSwipe (new), Export Hold'em, Pick 5, Tradle, Connectrade. Searches for 'OEC Trade Bingo' return nothing. The closest OEC game by format — the only one built around dealt cards and a table of opponents, i.e. the nearest thing to a bingo/party game — is EXPORT HOLD'EM, whose page title is literally 'Export Game - Real-time Multiplayer'. Its core loop, from strings in its shipped bundle: each round reveals one product with an emoji ('This Round's Product: 🚗 Cars'); you hold a hand of country cards ('Your Cards - Pick the Best Exporter'); you pick the country you believe exports the most of that product; the highest actual exporter wins the round ('Germany exports the most cars! You win this round. 🏆'). The onboarding is three steps: 'See the product' -> 'Pick best exporter' -> 'Win the round!'. It is live multiplayer against other humans, not a daily puzzle — there is no daily product, no share grid and no archive.

### RULES
- CONFIRMED from the bundle: one product per round, shown with an emoji; you choose from a hand of country cards; the country with the highest actual export value of that product wins the round. A 'Best Choice!' label marks the correct card in the tutorial.
- CONFIRMED: lobby offers two identities — 'Guest Play (Choose Name)' with a display-name field validated to 'Letters, numbers, and spaces only', or 'Sign in with OEC Account'. There is a 'Switch Account' option.
- CONFIRMED: private rooms exist — 'Create New Private Room', 'Create a private room and share the link with your friends to play together.', plus 'Your Active Rooms' and 'Resume game'. This is the only OEC game with an explicit invite-a-friend link, which is why it is the closest thing to a two-player party format.
- CONFIRMED: the leaderboard tracks ELO Rating, Games Played, Wins, Losses and Draws — the only OEC game with a rating system.
- NOT VERIFIED — I could not confirm any of these numbers and will not invent them: cards per hand, rounds per match, per-round timer length, points awarded per round, minimum/maximum players per room, tie-breaking, or whether there is any share text. The rules text is rendered from a component I could not fully resolve, and the game requires a live socket session to observe.
- NOT a daily game: no daily puzzle, no 00:00 rollover, no archive, no streak — it is unlimited real-time multiplayer.

### SCORING
Round-level: highest actual export value of the round's product wins the round. Match-level scoring is UNVERIFIED — I found no points-per-round constant. Across matches, players carry an ELO Rating alongside Games Played / Wins / Losses / Draws. I am deliberately not stating a points formula because I did not see one.

### DAILY
Not daily. Real-time multiplayer, unlimited play, matched against other players or inside a private room. Nothing rolls over at midnight.

### SHARE
No share grid or copy-text found. The only sharing mechanic is a private-room invite link ('Create a private room and share the link with your friends to play together'). Confidence low — I did not observe a live match.

### UI
- Export Hold'em uses a warm poker-table palette — border #d4b896, text #452610, cream card surfaces, Tailwind utility classes — distinct from the Mantine look of Pick 5 and Connectrade.
- Tutorial layout observed in the bundle: 'This Round's Product:' with a large emoji and the product name, then 'Your Cards - Pick the Best Exporter:' with two example country cards (Germany, Brazil), the correct one flagged 'Best Choice!', then the outcome line. Three numbered steps beneath: Step 1 See the product / Step 2 Pick best exporter / Step 3 Win the round!
- How-to-play opens as a fixed full-screen overlay (black at 50% opacity) with a max-w-2xl white rounded card, max-height 80vh and internal scrolling.
- Lobby: 'Choose how you'd like to play' with Guest Play vs OEC Account, a display-name field, 'Start Playing', plus Leaderboard, Private Rooms, Your Active Rooms and Resume game entries.
- Confidence on all UI details is low-to-medium — these come from static strings and class names, not from an observed live match. I did not join a game.

### DATA NEEDED
- Same core table as Pick 5: per HS4 product, the ranked exporter list with trade values. Cube trade_i_baci_a_22 (BACI, HS6 Rev. 2022), Year 2023, drilldowns=Exporter+Country, measures=Trade+Value. For a card game you only need the top ~30 exporters per product plus a lookup of value(country, product) to adjudicate any pair.
- Per-country total exports and per-country top-product lists, so country cards can be dealt with known strength — same cube, drilldowns=HS4,Exporter+Country.
- A curated product deck: ~200–400 recognisable HS4 products with an emoji each (the original shows '🚗 Cars'), because unrecognisable products kill a fast card game.
- For a 2-player offline 'Trade Bingo' as literally named: a 5x5 card of country names plus a shuffled deck of product prompts, and the value(country, product) matrix to decide which squares a prompt legitimately marks. That matrix trimmed to ~60 well-known countries x ~300 products is 18,000 numbers — under 200 KB, easily bundled with no server.
- Note: an ELO or head-to-head rating needs no data at all beyond match results, and is cheap to add locally.

### WEAKNESSES
- The requested name 'Trade Bingo' does not resolve to anything at OEC — treat any spec under that name as a design brief, not a description. Everything below applies to Export Hold'em, the closest existing game, at LOW confidence.
- Export Hold'em is server-dependent real-time multiplayer, which is exactly what a static no-server clone cannot reproduce. Any clone must reinterpret it as hot-seat, async-by-shared-link, or bot-opponent play.
- It requires other humans to be online. For a couple, matchmaking against strangers is beside the point, and I could not confirm whether a private room supports as few as two players.
- No daily puzzle, so there is no shared daily talking point and nothing to compare — the whole reason a couple plays these games together.
- No share text, no emoji grid, no archive, no offline mode.
- I could not verify hand size, round count, timer, or scoring. An engineer building from this spec must decide those numbers themselves rather than trust a reconstruction.
- 'Highest exporter wins' is a single-bit outcome per round, so it teaches much less per unit time than Pick 5's partial credit or Connectrade's grouping — and it is heavily won by whoever knows that China is the answer more often.
- Bingo as a format is nearly luck-only: if a clone is literally built as bingo, the trade knowledge risks becoming decorative. Any design needs a decision the player actually makes (see below).

### IMPROVEMENT IDEAS
- Say plainly in the build plan that 'Trade Bingo' is not an existing OEC game, then design it deliberately rather than cloning something. The best two-player, no-server interpretation is a hot-seat card duel, not bingo.
- Hot-seat Export Hold'em for two: deal each player 5 country cards from a deck weighted by export size, flip one product per round, both commit a card face-down, reveal simultaneously, higher actual export value takes the round, best of 7. Cards are spent when played, so you must decide when to burn China — that is the real decision bingo lacks, and it needs zero server.
- If you do want an actual bingo: give each player a 5x5 card of countries and draw product prompts; a prompt marks a square only if that country is in the product's top 5 (or top 10 on easy). Then add the decision bingo is missing — each player gets three 'steals' per game to claim a square on the opponent's card if they can name a top-5 country the opponent's card doesn't cover.
- Local ELO plus a permanent head-to-head ledger (record, streaks, ELO history sparkline). Export Hold'em is the only OEC game with a rating, and it is the single most couple-friendly feature in the whole OEC lineup — bring it offline and make it two-player-specific.
- Async 'daily match' via a copyable seed string: the app encodes today's deck seed and your plays into a short string you paste to your partner, who plays the identical deck and gets a diff. That reproduces the multiplayer feel with no server at all.
- Difficulty tuning the original cannot do: restrict the country deck to top-40 exporters (approachable) or open it to all 220 (brutal); toggle a hint that shows each country's total export size on the card; add an Endurance-style per-round timer as an option rather than a fixed rule.
- Bot opponents with tunable knowledge (plays the true best card X% of the time) so one partner can practise between shared sessions without burning the daily match.
- Custom decks: only food products, only the countries you have both been to, only things in your kitchen right now. Same trick as for Pick 5 and Connectrade, and it is what actually keeps a couple playing past week three.
- Teach on reveal: after each round show the actual values for both played cards and the product's true top 3. Export Hold'em's binary win/lose round teaches very little; two extra numbers per round fix that at zero cost offline.


==========================================================================================
## Growth Tree — NAME DOES NOT RESOLVE (no such OEC game); closest game is TradeSwipe, closest feature is OEC's Growth Forecasts / treemap tools   [confidence: low]
No such game exists. Closest OEC game: TradeSwipe, https://oec.world/en/games (hub entry) / app at https://prod.oec.world/en/games/game/swipe. Closest non-game OEC features: the Tree map visualization (oec.world/en/visualize/tree_map), Growth Forecasts, and Trend Explorer.

### CORE LOOP
There is no OEC game called Growth Tree. The words map onto OEC TOOLS rather than games: the 'Tree map' visualization (the treemap of a country's export basket), 'Growth Forecasts' and 'Trend Explorer' all exist under Tools/Visualizations on oec.world, but none is a game and none has a daily puzzle, guesses or a share grid. The closest actual OEC game is TRADESWIPE (badged 'New' on the hub, subtitled 'Tinder for trade? Guess and match countries based on their trade information'). Its verbatim in-game help, which I read from the shipped bundle: 'Compare export values between countries and products. Swipe RIGHT if you think the next card has HIGHER exports, or LEFT if LOWER.' It is a higher/lower streak game on a card stack, with lives, hints and a timer — unlimited play, not daily.

### RULES
- TradeSwipe, all CONFIRMED verbatim from the game's help data. Core: 'Compare export values between countries and products. Swipe RIGHT if you think the next card has HIGHER exports, or LEFT if LOWER.'
- Four modes: Classic 🌍 'Random products from any country. Quick start!'; Countries 🏳️ 'Compare total exports between different countries.'; Single Country 🎯 'Compare products exported by one country.'; Endurance ⏱️ '15 seconds per swipe. No hints. Hardest mode!'
- Lives ❤️: 'You have 5 lives. Wrong answer = lose a life.'
- Hints 💡: '3 hints per game to reveal the world rank (not in Endurance).'
- Streak 🔥: 'Chain correct answers for bonus points!'
- Timer ⏱️: 'Race against time. In Endurance, 15s per swipe resets each turn.'
- Frequency: 'Play unlimited games anytime with different product/country combinations!' — explicitly NOT a daily puzzle.
- NOT VERIFIED: the exact streak multiplier curve, the non-Endurance timer length, how the next card is sampled, whether there is a share text or a leaderboard. The help text states 10 points per correct answer and 'bonus multipliers' but gives no multiplier numbers, and I will not invent them.
- For 'Growth Tree' itself there are no rules to report — it does not exist. If the intent was OEC's Growth Forecasts or the export treemap, those are read-only data tools with no game layer at all.

### SCORING
TradeSwipe, verbatim: 'Earn 10 points per correct guess. Build streaks for bonus multipliers. Compete for the highest score!' So the base rate is 10 points per correct swipe, confirmed. The multiplier schedule is NOT stated anywhere I could find and I did not observe a run, so treat any specific streak curve as unknown. Game ends when 5 lives are gone (or on timeout in Endurance). Growth Tree: no scoring, no such game.

### DAILY
TradeSwipe is unlimited and on-demand — 'Play unlimited games anytime with different product/country combinations!' There is no daily puzzle, no midnight rollover, no archive and no streak-across-days. Growth Tree does not exist; OEC's Growth Forecasts are an annual/periodic data product, not a daily anything.

### SHARE
None found for TradeSwipe — no share string, no emoji grid, no copy button in the strings I read. It posts scores to the same https://oec.world/api/games/score endpoint pattern under game:'swipe' and requests a session with history:true, suggesting a server-side leaderboard rather than a copy-paste share. Confidence low. Growth Tree: not applicable.

### UI
- TradeSwipe runs inside the same Next.js app as Pick 5 (route /en/games/game/swipe) and reuses its shell: theme via ?theme=, consent via ?consent=true, optional postMessage login, help and stats icon buttons, AdSense slots, and a TradeSwipe logo (logo_tradeswipe.webp) rather than the per-theme SVGs the other games use.
- Its help modal renders a Game Modes grid (1 column mobile, 2 desktop) of bordered Papers, each with a 24px emoji, a bold name and a dimmed description, and a Mechanics grid (2 columns mobile, 4 desktop) of centred Papers with a 20px emoji, an extra-small bold label and a 10px description — the four mechanics being Lives, Hints, Streak, Timer.
- Card interaction is swipe-based (left/right), with a per-swipe timer; the Endurance variant resets a 15-second clock each turn. I did not observe the card visuals or animations live, so treat layout specifics beyond the help modal as unverified.
- For a 'Growth Tree' original, the obvious visual is OEC's own treemap of the export basket plus a force or radial layout of the product-space neighbourhood — both renderable as inline SVG with no external library, which suits a static single-page clone.

### DATA NEEDED
- TradeSwipe: per-country HS4 export lists — the shipped helper builds {id, country, iso, product, export_value, rank, hsCode} filtered to export_value > 0, from cube trade_i_baci_a_22, Year 2023, drilldowns=HS4,Exporter+Country, filtered to one Exporter Country. Plus a 300-row country-totals query (drilldowns=Exporter+Country, include=Year:2023, limit=300) to drive the Countries mode and to resolve a country from its ISO3.
- In other words: the country x HS4 export-value matrix for 2023. A clone only needs enough of it to sample comparable pairs — say 60 countries x 300 products of value, ~18k numbers, under 200 KB.
- An ISO3 -> ISO2 map for flags (the original hardcodes ~50 pairs and falls back to the first two letters — a bug source for the rest); offline, use flag emoji instead.
- IF the goal is a genuine 'Growth Tree' game rather than TradeSwipe, the data OEC actually publishes for it is: ECI (Economic Complexity Index) by country and year, PCI (Product Complexity Index) by product, the product-space adjacency/proximity matrix, and OEC's growth projections. All are downloadable from oec.world (Complexity: ECI Countries, PCI Products, Growth Forecasts). The product space is ~1,200 HS4 nodes with a proximity matrix — that is ~700k pairs, so ship a thresholded edge list (top ~15 neighbours per product ≈ 18k edges, a few hundred KB) rather than the dense matrix.
- Country totals over time (2000–2023) if you want a growth/diversification arc rather than a single snapshot.

### WEAKNESSES
- The requested name 'Growth Tree' does not resolve to any OEC game. The OEC games hub on 2026-07-25 lists exactly six games — World Trade Cup, TradeSwipe, Export Hold'em, Pick 5, Tradle, Connectrade — and nothing named Growth Tree appears anywhere on oec.world or in search results. Anything under that name should be treated as a new design, not a clone. Confidence low by construction.
- TradeSwipe (the closest game) is not daily, so it gives a couple nothing to compare each morning — the exact thing daily-puzzle play is for.
- TradeSwipe has no share format I could find, so there is no artefact to send each other.
- Higher/lower on export values is a very thin decision. With 5 lives and 10 points a swipe it becomes an endurance grind whose skill ceiling is mostly 'is this country big'. The Endurance mode's 15-second clock adds pressure, not depth.
- Hints are capped at 3 per game and reveal only a world rank, which is a weak hint for a binary question.
- I could not verify the streak multiplier, the standard timer, or the card-sampling logic — a clone built on this spec is partly guesswork.
- It shares Pick 5's structural problems: frozen 2023 data, an iframe on oec.world, a dev-host API, AdSense, HS4 product labels with no definitions, and an ISO3->ISO2 flag map that hardcodes ~50 countries and guesses the rest by truncation.
- OEC's actual growth/treemap features are read-only visualisations with no game loop, no scoring and no daily cadence, so there is nothing to clone there either — only source material.

### IMPROVEMENT IDEAS
- First, tell the user plainly that Growth Tree is not an OEC game, and offer the two honest paths: clone TradeSwipe (higher/lower, exists, verified rules) or design an original product-space game using the ECI/PCI/product-space data OEC does publish. Do not present a fabricated Growth Tree as a description of something real.
- If designing an original 'Growth Tree' for two people: the product space is a real graph — give each player a starting country and a budget of moves, and have them climb from its current export basket to adjacent, higher-PCI products (a real diversification path). Score = complexity gained. Both players get the same starting country each day and compare paths. This is a genuinely good daily puzzle and it is entirely static-data.
- Same-seed daily duel for either game: a shared deterministic seed so both players get an identical card sequence (TradeSwipe) or identical starting country (Growth Tree), then a side-by-side comparison with a persistent head-to-head ledger — record, streaks, best score, per-mode splits. TradeSwipe has none of this.
- Make TradeSwipe daily as well as unlimited: one fixed 'daily run' with a shared seed that both players get exactly one attempt at, plus unlimited practice runs that don't count. That single change turns it from a time-killer into something a couple compares over coffee.
- Add the share artefact TradeSwipe lacks: a compact emoji ladder of your swipes (🟩/🟥 per card) with the score and streak, copyable in one tap.
- Difficulty tuning offline: a 'closeness' dial that only serves pairs within X% of each other (the hard, interesting comparisons) instead of random pairs where one side is obviously China; and a per-player adaptive difficulty driven by the ledger so a mismatched couple stays competitive.
- Turn hints into a shared economy: one hint pool per couple per day, so spending one is a negotiation. Cheap to build, and it is the kind of mechanic only a two-player clone can have.
- Custom packs again: only your two countries of origin, only food, only the products in the room. Plus an 'our misses' deck built automatically from every pair either of you got wrong, resurfaced on a spaced-repetition schedule — the clearest thing an offline clone can do that a server-side daily cannot.
- Show the two actual values after every swipe (not just right/wrong) and, once per run, the treemap slice the product came from. That is where the 'growth tree' idea can legitimately live inside a swipe game: you see the basket, not just the number.
- Precompute everything (country x product matrix, thresholded product-space edges, ECI/PCI) into a single bundled JSON so there is no API, no dev host, no flag CDN, and no ISO3->ISO2 guessing.


==========================================================================================
## NYT Connections   [confidence: high]
https://www.nytimes.com/games/connections

### CORE LOOP
A 4x4 grid of 16 tiles (words, occasionally images) hides exactly four categories of four. The player taps four tiles they believe share a hidden thread and presses Submit. A correct set lifts out of the grid into a coloured banner showing the category title, and the remaining tiles reflow upward. A wrong set shakes, burns one of four mistake bubbles, and — only if exactly three of the four submitted tiles belong to a single true category — surfaces the toast "One away...". No other information is ever given: a wrong guess with 2/2 or 2/1/1 splits gets nothing. The player can Shuffle to re-randomise positions or Deselect All to clear the selection, neither of which costs anything. The game ends in a win when all four groups are submitted correctly (the last group is NOT auto-solved — you must still submit it), or in a loss the instant the fourth mistake lands, at which point the unsolved categories auto-reveal in difficulty order. The whole game is a single-shot daily; there is no timer and no partial credit.

### RULES
- Board: 16 tiles in a 4x4 grid forming exactly 4 categories of 4. The engine reads cardsPerCategory from categories[0].cards.length and categoryCount from categories.length, both defaulting to 4, and it also has palettes for 3-, 5- and 6-category variants (used by special/Sports editions).
- MISTAKE LIMIT = 4, and it is hardcoded, not derived: in the production bundle the selector is `createSelector(u, e => (e && e.categories, 4))` — a comma expression that always returns 4.
- The loss condition is `mistakeCount >= maxMistakes` (i.e. >= 4). The submit guard is `guesses.filter(g => !g.correct).length < maxMistakes`. So the FOURTH mistake ends the game — a player can make at most 3 mistakes and still win. Several third-party guides claim you get four wrong guesses and a fifth ends it; that is wrong.
- Official in-game wording, verbatim: "Select four items and tap 'Submit' to check if your guess is correct." and "Find the groups without making 4 mistakes!" The counter is labelled "Mistakes Remaining:" with 4 bubbles; the screen-reader string is "{n} mistakes remaining out of 4".
- Submit is enabled only when exactly cardsPerCategory (4) tiles are selected and the game is not over.
- ONE-AWAY SEMANTICS: the "One away..." toast fires only on an INCORRECT guess in which exactly 3 of the 4 submitted tiles share a single true category. It does not tell you which tile is wrong, nor which colour the trio belongs to.
- ALREADY-GUESSED: re-submitting a set of four you have already submitted shows the toast "Already guessed!" and does NOT consume a mistake. A clone must dedupe guesses by tile set.
- Difficulty level is simply the category's index in the API array: 0 = yellow (easiest), 1 = green, 2 = blue, 3 = purple (hardest). Exactly one category per level per puzzle.
- WIN = solvedCategories.length === categoryCount. The player submits all four groups; the fourth is not auto-completed on a win.
- LOSS = on the 4th mistake, the remaining unsolved categories are auto-revealed, iterating levels from the lowest unsolved index upward.
- Shuffle re-randomises tile positions. Implementation is Fisher-Yates with a guarantee guard: if any element would remain at its original index, the shuffle recurses. So no tile ever keeps its position.
- Deselect All clears the current selection. Neither Shuffle nor Deselect costs a mistake or a turn.
- Tiles may carry images instead of text (cards have optional image_url and image_alt_text), used for pictorial categories and the April Fools emoji board.
- Displayed puzzle number = round(days between local midnight today and local midnight 2023-06-12) + 1. The base date constant in the bundle is literally "2023-06-12T00:00:00". IMPORTANT: this is NOT the API's `id` field — the two were identical until roughly late 2024 and have since diverged (2026-07-25 returns id 1221 but displays as Puzzle #1140, and ids are not even monotonic by date: 2026-07-24 is id 1223 while 2026-07-26 is id 1219). A clone must compute the number from the date, never from id.
- Because the four groups partition the 16 tiles exactly, solving any three groups makes the fourth logically forced — the hardest (purple) category can always be obtained as leftovers.
- Editor: Wyna Liu. Beta launch 2023-06-12.

### SCORING
There are no points. Grading is a single rank title keyed on the final mistake count, taken verbatim from the bundle: {0: "Perfect", 1: "Great", 2: "Solid", 3: "Phew", 4: "Next Time"}, with an alternate map used in some contexts where 4 maps to "Thanks for Playing". 0-3 mistakes = win, 4 = loss. The rank title is shown as a toast at game end and in the congrats modal. Persistent stats (account required) are: puzzles_completed, puzzles_won, win_percentage (computed as (won/completed*100).toFixed(0), with NaN/Infinity coerced to "0"), current_streak, max_streak, and a MISTAKE DISTRIBUTION histogram with exactly five buckets keyed 0,1,2,3,4. Badges/achievements found in the bundle: cx5 "First Perfect Puzzle" (zero mistakes); cx2 "Perfect Puzzle" milestone ("completing {LEVEL} Connections puzzles without any mistakes"); cx4 awarded when the first solved category is level 3 (purple first) — there is also a server stat cxns_prpl_frst.purple_first_wins; cx7 awarded for zero mistakes AND solving in exact reverse difficulty order (levels 3,2,1,0); cx8 for puzzle #1000; plus streak badges. Note the rank system has no tiebreak: two players who both go 0-mistake are both simply "Perfect".

### DAILY
One puzzle per calendar day, keyed by print_date. Rollover is at LOCAL midnight — the bundle computes the index with `new Date().setHours(0,0,0,0) - baseDate.setHours(0,0,0,0)`, i.e. local time, not ET. Free to play. A subscriber-only archive covers every puzzle back to 2023-06-12 (launched Oct 8, medium confidence on the exact date), with resume-in-progress and per-puzzle history; the bundle exposes an `isPlayingArchive` flag driven by window.connectionsArchiveDate / gameData.connectionsShortzDate, and archive shares are prefixed "Archive <date>". Adjacent products: Connections Bot at nytimes.com/interactive/2024/upshot/connections-bot.html?date=YYYY-MM-DD for post-game analysis, a daily "Connections Companion" column, a Connections Leaderboard, and a separate Connections: Sports Edition (launched 2025-02-09, medium confidence).

### SHARE
Plain text copied to clipboard, toast "Copied results to clipboard" (failure toast "Share failed"). Format is exactly:

Connections
Puzzle #1140
🟩🟩🟩🟩
🟨🟨🟨🟨
🟦🟦🟦🟪
🟦🟦🟦🟦
🟪🟪🟪🟪

Built as `"Connections\n" + "Puzzle #" + (index+1) + "\n" + rows.join("\n")`. For an archive play it is instead `"Archive " + formattedDate + "\nConnections Puzzle #" + N + "\n" + rows`.

CRITICAL ROW SEMANTICS: there is one row per GUESS, correct and incorrect alike, in chronological order — not one row per category. Each of the four squares in a row is coloured by the TRUE category level of that tile, so a wrong guess renders as a mixed row. The mapper is `level -> emoji` via {yellow:🟨, green:🟩, blue:🟦, purple:🟪, red:🟥, orange:🟧} indexed by a per-category-count list; the fallback square is ⬜. Consequence: a perfect game is 4 uniform rows; a game with 3 mistakes is 7 rows. Row count minus 4 equals the mistake count, so the grid leaks nothing about the answers but fully encodes performance.

### UI
- 4x4 grid of equal-size tiles; text auto-shrinks for long entries. Solved categories stack above the shrinking grid as full-width coloured banners containing the uppercase title and its four members.
- Level-to-colour lists are keyed by category count: 3 -> [yellow, blue, purple], 4 -> [yellow, green, blue, purple], 5 -> [orange, yellow, green, blue, purple], 6 -> [red, orange, yellow, green, blue, purple]. Note extra colours are PREPENDED as EASIER levels, so purple is always the hardest.
- Three controls in a row: Shuffle, Deselect All, Submit. Submit is disabled unless exactly four tiles are selected.
- Animations named in the bundle: cardBounce on submit (correct uses a longer timeout than incorrect), cardShake on a wrong guess, cardShuffle on shuffle, categoryPulse when a banner reveals (2x the base timeout). There is an explicit `onPotentialLoss` after-effect fired when mistakes === maxMistakes-1 and the latest guess was wrong.
- Mistake indicator: text "Mistakes Remaining:" followed by four dot bubbles that animate out one at a time (400ms exit transition).
- Toasts are a single centred <h2> with aria-live="assertive": "One away...", "Already guessed!", the rank title, "Copied results to clipboard", "Share failed".
- Selected tiles get a dark filled state; the grid is a form so Enter submits.
- End screen: congrats modal with the rank title, today's puzzle number, a stats toggle, the emoji share block, "Share Your Results", badge row, and a link to Connections Bot / the Companion column.

### DATA NEEDED
- Public JSON, no auth: https://www.nytimes.com/svc/connections/v2/YYYY-MM-DD.json (curl works with a normal browser User-Agent; Claude's WebFetch is blocked on nytimes.com so use curl). Shape: {status, id, print_date, editor, categories: [ {title, cards: [{content, position}] } x4 ]}.
- Categories arrive IN DIFFICULTY ORDER — array index == level == colour (0 yellow, 1 green, 2 blue, 3 purple). Nothing else needs to be inferred.
- `position` is 0-15 and gives the authentic initial (pre-shuffle) grid layout. Preserve it so a clone's day-1 board matches the original.
- Puzzle #1 is 2023-06-12; today (2026-07-25) is #1140. Measured average payload ~801 bytes, so the ENTIRE archive of ~1140 puzzles is roughly 890 KB raw and well under ~200 KB gzipped — trivially shippable as one static JSON file with zero server.
- No dictionary or word list is required at all. Connections needs only the puzzle set.
- Titles are uppercase strings and may contain the literal characters `"` and `___` (e.g. 'START TO CRY, WITH "UP"', 'STRIP ___'); escape properly.
- Optional per-card image_url / image_alt_text if you want to support pictorial boards.
- For localStorage, the NYT's own persisted shape is a good model (schemaVersion "0.49.0"): {puzzleComplete, puzzleWon, mistakes, guesses: [{cards: "p,p,p,p", correct, solvedLevel|null}], solvedCategories, isPlayingArchive}.
- Authentic palette (exact hex from the bundle): yellow #f9df6d, green #a0c35a, blue #b0c4ef, purple #ba81c5; plus red #e5695b and orange #f5a623 for 5/6-category variants.

### WEAKNESSES
- The purple category is structurally a freebie. Because four groups exactly partition 16 tiles, solving yellow/green/blue leaves the last four forced — you win without ever understanding the hardest connection. Erik Kain (Forbes) calls this "fundamentally broken on a design level": the hardest group should not be the leftovers.
- Ambiguity can exceed the mistake budget. Game designer Raph Koster's core critique: "A well-designed puzzle of this sort should have fewer red herrings than the number of mistakes it allows." With only 4 mistakes and deliberately planted overlap words, it is entirely possible to construct a wholly defensible alternative partition and lose on valid reasoning. No editor can anticipate every grouping a knowledgeable player will find.
- Feedback is information-poor. Koster: "A missed guess doesn't help you prune the logic space, only the trivia space." A wrong guess with a 2/2 split tells you literally nothing, and "One away..." never says which tile or which colour.
- It rewards crystallised knowledge over reasoning, and the knowledge is heavily US-centric (NBA teams, American game shows, US brands), so difficulty is wildly uneven by nationality and age rather than by puzzle craft.
- Notorious deliberate traps generate real anger — e.g. the board where TINDER/BUMBLE/GRINDER/HINGE looked like dating apps and returned not even "one away".
- A word appearing inside its own category name is allowed and players hate it; an NYT editor has publicly acknowledged this as a recurring complaint.
- Difficulty is unrated and inconsistent day to day, unlike the crossword's Monday-to-Saturday ramp, so a couple can't tell whether a bad day was them or the board.
- The rank system has no resolution at the top: two 0-mistake solves are both "Perfect", with no tiebreak on solve order, speed, or elegance.
- Zero multiplayer or comparison features. Stats are strictly single-player and require an NYT account; the only way to compare is manually pasting emoji grids at each other, which also risks spoiling.
- Archive access is paywalled, so unlimited practice and replaying old boards costs money.
- The April Fools all-emoji board was widely disliked, illustrating how little tolerance the daily-ritual audience has for variation.

### IMPROVEMENT IDEAS
- FIX THE PURPLE FREEBIE (biggest single win): when only one group remains, don't auto-award it. Require the player to pick the purple category's actual description from 3-4 plausible decoys before it counts as solved. Now the hardest group carries real risk, and it gives a couple something genuinely different to compare: "did you actually GET purple, or did you just have it left over?"
- HEAD-TO-HEAD DUEL on the same board with a spoiler gate. Both play the identical daily puzzle independently; each result is written to localStorage keyed by date+player and stays sealed until BOTH have finished. Then a reveal screen stacks the two emoji grids side by side. This kills the accidental-spoiler problem that makes couples play at separate times today.
- RICHER SCORING SO TIES BREAK. The NYT collapses every clean solve to "Perfect". Score instead on: 4 - mistakes as a base, plus a purple-first bonus, plus a reverse-order (purple->yellow) bonus, minus a small time factor. Now two flawless solves still produce a winner, which is exactly what a competitive couple needs daily.
- PER-PLAYER HANDICAPS — impossible on nytimes.com and the thing that keeps a lopsided pairing playing. Independently tune each player's mistake budget (e.g. 3 for the stronger, 5 for the weaker) and each player's feedback tier: strict (no one-away at all), standard ("One away..."), or generous ("One away, and the trio is blue"). Directly answers Koster's red-herrings-exceed-the-budget critique too.
- CO-OP MODE, one shared board and one shared budget of 4, with players alternating submissions. Turns parallel solitaire into an actual two-person game — the single biggest experiential upgrade for a couple, and something the NYT will never build.
- POST-GAME TRAP DIFF. The clone knows the true level of every tile in every guessed row, so it can say exactly which red herring each partner fell for: "you both submitted the reed-instrument trap on guess 2". Far more interesting to talk about than two emoji blocks.
- FREE UNLIMITED ARCHIVE. All ~1140 puzzles are available from the public JSON endpoint and compress to well under 200 KB — ship the lot in the static bundle. Instantly beats the NYT's paywalled archive and gives unlimited post-daily practice, a random-puzzle button, and a "best-of" curated ladder.
- CUSTOM PACKS / PUZZLE EDITOR — the killer feature for a couple. A simple form to author 16 tiles and 4 titles, encoded into a shareable URL hash or a copy-paste string, so they can build boards from in-jokes, friends' names, holidays, and each other's habits. Birthday and anniversary puzzles are something the NYT structurally cannot offer.
- DIFFICULTY TUNING the source data makes free: because every category carries an explicit level, you can synthesise a "purple gauntlet" board from four level-3 categories drawn from four different past puzzles, or an easy warm-up from four level-0s. Instant difficulty dial with no new content.
- PASS-AND-PLAY ON ONE DEVICE with a position re-shuffle between players, so watching your partner solve doesn't leak the layout (the API `position` field is fixed, which is a genuine cheat vector for two people sharing a phone or a breakfast table).
- SEASON LEDGER: running head-to-head record, current and best streaks for each player, per-colour accuracy ("she cracks purple first 3x more often than he does"), and a rolling 30-day chart. The NYT tracks one person in isolation and needs an account; a local ledger for two needs neither.
- SYNC WITHOUT A SERVER: export/import the whole two-player history as a JSON blob behind a copy button or a QR code, so results move between two phones with no backend, no account, and no paywall — while staying fully offline-capable.
- OPTIONAL PRACTICE/ZEN MODE with unlimited mistakes and undo, kept strictly separate from ranked daily stats, so a nervous player can learn the archetypes (compound-word groups, hidden words, homophones, ___-suffix) without burning a streak.


==========================================================================================
## NYT Letter Boxed   [confidence: high]
https://www.nytimes.com/puzzles/letter-boxed

### CORE LOOP
Twelve distinct letters sit three-per-side around a square drawn on a canvas. The player builds a word by clicking/dragging from letter to letter — lines are drawn across the square as they go — or simply types it. Pressing Enter submits. A submitted word must be at least 3 letters and must appear in that puzzle's word list; on success it drops into a running word list, a praise toast fires, every letter it used is marked as used, and the next word is automatically SEEDED with the accepted word's final letter, which is how the chaining rule is enforced rather than validated. The player keeps adding chained words until every one of the 12 letters has been used at least once, at which point the puzzle is won. A soft target called `par` ("Try to solve in 5 words") is displayed throughout, but it is NOT a cap: exceeding it still wins, with a different, gently consoling end screen. There is no mistake limit, no timer, and — notably — no share feature of any kind.

### RULES
- Board: 12 distinct letters, 4 sides x 3 letters. The API field `sides` is an array of four 3-character strings, and the side index maps to geometry as 0 = NORTH (top), 1 = EAST (right), 2 = SOUTH (bottom), 3 = WEST (left) — confirmed by a switch in the bundle that throws on any other index.
- MINIMUM WORD LENGTH = 3. The validator is literally `activeWord.length && activeWord.length > 2`; failing it shows the error toast "Too short".
- SAME-SIDE RULE: consecutive letters may not come from the same side of the square. Verbatim in-game text: "Consecutive letters cannot be from the same side".
- A corollary the official rules list separately but which actually falls out of the same-side rule: no word may contain an immediately doubled letter, since a letter is trivially on the same side as itself. I verified 0 adjacent-repeat words in a shipped dictionary.
- Letters MAY be reused, both within a word and across words, as long as no two CONSECUTIVE letters share a side. Verified examples from a live dictionary: OVO, AGAIN, AGHAST, INITIO.
- CHAINING: "The last letter of a word becomes the first letter of the next word eg. THY > YES > SINCE". This is not validated — the ADD_WORD reducer sets `activeWord = activeLetter` (the accepted word's final letter), so the next word is pre-seeded and the rule cannot be broken.
- WIN CONDITION = every board letter appears in at least one submitted word. The check flattens submittedWords to a unique letter set and asserts `sides.flat().every(letter => used.includes(letter))`. There is NO word-count cap in the win condition.
- `par` IS A SOFT TARGET, NOT A LIMIT. This is the most widely mis-reported rule about this game: many guides state you must finish "within five turns". The end-screen logic is `wordsUsed <= par ? heading "Congratulations!" : heading "Super solving!"`, and you win either way. Exceeding par is explicitly accommodated, not penalised.
- par VARIES BY DAY. Across 30 consecutive days I sampled (2026-06-26 to 2026-07-25) the values were par 4 on 11 days, par 5 on 12 days, par 6 on 7 days. I never observed a value outside 4-6, but 30 days cannot rule one out.
- VALIDATION IS ONLY TWO CHECKS: length > 2, and membership in that puzzle's shipped `dictionary` array. Nothing else is tested at submit time. Failure gives "Not in word list".
- Because the shipped dictionary is PRE-FILTERED, the same-side rule is enforced implicitly. I verified on the 2026-07-25 puzzle (1030 words) that 0 words used an off-board letter, 0 words violated the same-side rule, none was shorter than 3, and none had an adjacent repeat. A consequence worth knowing: if you TYPE a same-side word, you get the generic "Not in word list" rather than an explanation.
- Word-validity editorial rules, verbatim: "Words cannot be proper nouns or hyphenated" and "No cussing either, sorry".
- BACKSPACE HAS A HIDDEN SUPERPOWER: if the active word is one letter long and at least one word has been submitted, backspace UN-SUBMITS the previous word, popping it back into the active buffer (`activeWord = submittedWords.pop()`). Otherwise it just deletes the last letter. There is no explicit undo-word button.
- Restart wipes to the initial state (empty active word, empty word list) and is gated behind a confirmation.
- NYT always publishes a two-word `ourSolution` for the day — it was exactly 2 words on 30/30 days I sampled — and shows the previous day's board and solution under a Yesterday view. So the honest hard target is 2 words, not par.
- Editor: Sam Ezersky. Officially published 2019-02-01 after a 2018 soft launch (medium confidence, from Wikipedia).

### SCORING
There is no points system at all — the only metric is the number of words used versus `par`. Two end states, both wins, taken verbatim from the bundle: if wordsUsed <= par, heading "Congratulations!" and subheading "You solved within {par} word(s)."; if wordsUsed > par, heading "Super solving!" and subheading "You solved in {wordsUsed} word(s). For an extra challenge, try to solve in {par} word(s) or less." Per-word praise toasts follow a length rule: for a word shorter than 7 letters, "Nice!" if the previous submission also succeeded, otherwise "Awesome!"; for a word of 7+ letters, "Savant!" if it completes the puzzle, otherwise "Genius!". Error toasts are "Too short" and "Not in word list". There is no streak counter, no win percentage, no mistake tally, and no persistent stats surface comparable to Connections' — the game keeps only local progress (the bundle logs "could not parse local progress:" on corrupt state).

### DAILY
One puzzle per day, released at 3 a.m. ET — stated verbatim in the how-to modal ("New puzzles are released daily at 3 a.m. ET.") and independently confirmed by the payload's `expiration` field: puzzle 2790 (2026-07-25) expires at 1785049200 = 2026-07-26 07:00 UTC = 3:00 a.m. EDT. Puzzle ids increment about one per day (2762 on 2026-06-26 to 2790 on 2026-07-25) but are not strictly date-ordered, so key on printDate rather than id. NOW PAYWALLED: the payload carries is_free: false, the bundle contains "Subscribe to play Letter Boxed." and "No plays left today." with "Log In or Subscribe to Play:", implying a small free-play allowance then a hard gate. Reporting puts the tightening at 2025-08-27, when Letter Boxed, Tiles and the Mini Crossword moved fully behind the NYT Games subscription (~$39.99/yr) — medium confidence on that date. There is no user-facing archive; the only historical content is the single Yesterday view.

### SHARE
NONE. I grepped the entire Letter Boxed application bundle for share/clipboard/copy-result strings and found zero hits, versus six in the Connections bundle ("Share Your Results", "Copied results to clipboard", "Share failed"). The Letter Boxed congrats modal offers only Play again, Log In, Subscribe, and View all games. There is no emoji grid, no copy button, and no shareable result string whatsoever. For a couple who compare results daily this is the single largest gap versus Connections, and the most obvious thing for a clone to invent — e.g. a spoiler-free line like `Letter Boxed #2790  2 words (par 5)  12/12 letters` plus optional per-word length blocks.

### UI
- The square is a <canvas> scaled by devicePixelRatio, redrawn each frame: clearSquare, drawSquare, drawLines, drawSquareOutline, drawPoints. Letters are dots on the four edges and selections are drawn as straight lines chaining across the interior — that criss-cross figure IS the game's visual signature and is worth reproducing.
- On each accepted word the whole square plays a scale tween down to 0.85 and back to 1.0, then the praise toast fires; error toasts clear after 800ms (1200ms for the success variant).
- Above the square: a large auto-shrinking text field showing the word in progress with a blinking caret (font size and line height are computed from length, and it becomes scrollable past a breakpoint), an underline rule, and the message box for toasts.
- The submitted-word list highlights the JOIN letters — the first letter of every word after the first, and the last letter of every word before the last — which visually teaches the chaining rule.
- The par hint renders as "Try to solve in {par} word(s)" and is styled differently before any word is submitted (class `lb-par no-words`) versus after.
- Used letters are visibly marked, but the original never displays a count of letters REMAINING — a real usability gap.
- Two buttons under the square: Restart (confirmation-gated) and Delete. Full keyboard support: any letter key adds, Backspace deletes (or un-submits), Enter submits.
- Theme colour token is `$letter-boxed-pink`. Reduced-motion is respected (the caret gets a `reduced-motion` class).

### DATA NEEDED
- Public JSON, no auth: https://www.nytimes.com/svc/letter-boxed/v1/YYYY-MM-DD.json — this is an undocumented but working DATE-ADDRESSABLE ARCHIVE even though the site exposes no archive UI. Shape: {id, printDate, expiration, par, sides:[4 strings of 3], dictionary:[...], ourSolution:[...], editor, editorImage, is_free}. The page-embedded window.gameData additionally carries yesterdaysSides and yesterdaysSolution. Use curl with a browser User-Agent; WebFetch is blocked on nytimes.com. Note the ?date= query param on the HTML page does NOT work — it always serves today; only the /svc/ endpoint honours the date.
- Per-puzzle dictionaries are large and highly variable: across 30 sampled days they ranged 242 to 2405 words, mean ~1064. Shipping one dictionary per puzzle does not scale (a year is on the order of 20 MB raw).
- MUCH BETTER APPROACH: ship ONE global word list and filter per board at runtime. The filter is three cheap predicates — length >= 3, every letter on the board, and no two consecutive letters on the same side. I measured that the UNION of just 30 days of NYT dictionaries is 20,646 unique words, which is 189 KB raw and only 53 KB gzipped. Harvesting a year of endpoints would yield an NYT-authentic curated list of roughly 60-90k words at a wholly practical size — and it inherits the NYT's editorial filtering (no proper nouns, no hyphens, no profanity) for free, which no off-the-shelf Scrabble list gives you.
- A solver is needed if you want par/optimality features, and it is cheap: DFS/BFS over the filtered word list, state = (last letter, 12-bit mask of letters used), chaining on last->first. This yields the true minimum word count, all 2-word solutions, and lets you auto-compute par for user-authored boards.
- Board geometry: sides[0]=top, [1]=right, [2]=bottom, [3]=left. Per-letter render state in the original is {letter, side, isActiveLetter, isInActiveWord, isUsed}.
- The 12 letters are always distinct, and puzzles routinely include awkward letters (J, Q, X, Z appear frequently in the sample — e.g. 2026-07-19 sides URB/OAE/JXS/ICP solving BIJOUX + XERISCAPE).
- For localStorage a clone needs very little: {printDate, submittedWords[], activeWord, isCompleted}. The original persists an equivalent local progress blob.

### WEAKNESSES
- No share format at all, verified by grep — so two people literally cannot compare results without screenshots or typing their word list out. Compared with Connections' emoji grid this is a glaring omission and the main reason it has less social pull.
- No stats, no streaks, no history. Nothing accumulates, so there is no sense of progress across days and no basis for comparison over time.
- No archive UI: exactly one puzzle exists per day and yesterday's is view-only. Miss a day and it's gone (even though the /svc/ endpoint quietly holds every past board).
- par is misleadingly soft and widely misunderstood — most third-party guides wrongly state a five-word limit — while the real challenge (a 2-word solution exists essentially every day) is never surfaced to the player. The stated goal is neither the real floor nor a real ceiling.
- The dictionary is opaque and its rejections are uninformative. Every failure collapses to "Not in word list", so a same-side violation, an off-board letter, and a genuinely unlisted word are indistinguishable. Players regularly report perfectly ordinary words being refused.
- Conversely, official solutions lean on obscure vocabulary — players single out entries like AZURITE, ERYTHROCYTE, TUBIFEXES and AKIMBO — which makes chasing the optimum feel like a vocabulary lottery rather than a puzzle.
- par is not a difficulty rating, and actual difficulty swings wildly: dictionary size alone ranged 242 to 2405 words across 30 days, so some boards have an order of magnitude more room than others with no warning to the player.
- The un-submit-via-backspace behaviour is genuinely useful and completely undiscoverable; there is no visible undo-word affordance.
- No count of remaining letters, so late in a puzzle you are squinting at the square to work out what you still owe.
- Now paywalled behind an NYT Games subscription (with a daily free-play cutoff for logged-out users), a change that drew broadly negative reaction.
- Fully single-player with no competitive or cooperative dimension of any kind.

### IMPROVEMENT IDEAS
- INVENT THE SHARE GRID IT NEVER HAD — the highest-value addition by far. A spoiler-free line plus a block-per-word length bar, e.g. `Letter Boxed #2790 — 2 words, par 5 ▇▇▇▇▇▇▇ ▇▇▇▇▇▇▇▇`, encoding word count and word lengths but never letters. Suddenly the game is comparable at a glance, which is the whole ritual for a couple.
- HEAD-TO-HEAD ON A NATURALLY COMPETITIVE METRIC. Unlike Connections, this game has a continuous score built in: fewest words wins, tiebreak on fewest total letters typed, then on time. That is a cleaner daily contest than anything Connections offers, and the NYT simply doesn't expose it.
- SHOW THE TRUE FLOOR, NOT JUST par. Bundle the solver and display "a 2-word solution exists" (true on 30/30 days I sampled) alongside par. Give tiered outcomes — par / under par / minimum found — so a strong solver has something left to chase after clearing par, which today is anticlimactic.
- POST-GAME SOLVER REVEAL so the losing partner actually learns: list every 2-word solution and the shortest chains, with each word's letter coverage. NYT shows one canned solution and nothing else.
- ALTERNATING CO-OP MODE, which this game's chaining rule makes uniquely elegant: A plays word 1, and its last letter becomes the first letter B must start from. The constraint passes physically between two people. No other daily puzzle has a mechanic this naturally two-player.
- FIX THE ERROR MESSAGES the original conflates. Because a clone filters its own dictionary, it can distinguish the actual failure: "S is on the same side as your last letter", "that letter isn't on this board", "too short (3 letter minimum)", "valid chain, but not in the word list". This removes the game's single most-complained-about frustration.
- LIVE REMAINING-LETTER COUNTER plus dimming of used letters, and an optional coverage hint ("4 letters left: Q, V, Y, Z"). Cheap, and fixes a real usability gap.
- HANDICAPS AND ASYMMETRIC TARGETS: give each player their own par (say 4 vs 6), or grant the weaker player one free hint that reveals a single word from a valid solution. Keeps a mismatched pair honestly competitive day after day.
- FREE UNLIMITED ARCHIVE using the undocumented date-addressable endpoint — thousands of past boards, replayable, versus the original's zero. Combined with runtime dictionary filtering (one ~50-90 KB gzipped word list, not one dictionary per puzzle) the whole thing stays a genuinely small static single-page app.
- CUSTOM BOARD BUILDER: enter any 12 letters, and the bundled solver instantly verifies solvability, computes par automatically, and encodes the board into a URL hash to send to your partner. Set each other bespoke challenges — including boards spelling out names or in-jokes in their solutions.
- VISIBLE UNDO-WORD BUTTON exposing the hidden backspace behaviour, plus a full move history you can rewind — turning a buried quirk into a real planning tool.
- GENEROUS-DICTIONARY TOGGLE: run strict NYT-harvested mode for ranked duels, and a permissive larger list for casual play, so "my word should have counted" arguments stop being unresolvable.
- PRACTICE MODE with no par pressure and a hint ladder (reveal the first letter of a solution word, then the whole word), kept out of ranked stats — good for the more nervous player.
- SERVERLESS TWO-PLAYER LEDGER: both results sealed in localStorage until both finish, then a reveal screen; running season record, average words-per-solve, and best finishes per player; export/import as a JSON blob or QR so two phones stay in sync with no backend and no subscription.


==========================================================================================
## GeoGrid (TeuTeuf Games) — daily 3×3 geography immaculate-grid   [confidence: high]
https://www.geogridgame.com/  (the brief said "geogrid.game"; that domain is NXDOMAIN from 8.8.8.8 and unfetchable. Live game = geogridgame.com, API = api.geogridgame.com/api, board+asset CDN = cdn-assets.teuteuf.fr/data/. Everything below is verified against the shipped Vue bundle /js/app.8d1c7208.js plus live API and CDN payloads — third-party SEO clone sites are wrong about several numbers, notably the guess limit.)

### CORE LOOP
One 3×3 grid: three column criteria across the top, three row criteria down the left, so each of the 9 cells is the intersection of two geography criteria (board #840, 2026-07-25 — rows: "GDP per capita under $30k", "Land border length greater than 1,000 km", "Arable land under 20%"; columns: "Protected waters under 20%", "Forest cover over 50%", "Has a metro system"). Tap an empty cell; a type-ahead search popup opens over ~250 countries/territories (Antarctica excluded); name one place. If it is in that cell's precomputed answer list it is placed with its flag plus a coloured rarity chip reading e.g. "⚡️ 4.8%" — the share of all other players who put that same country in that same cell today. If it is wrong the cell shakes and the row header and column header flash green/red for 1.2 s so you learn which of the two criteria you did satisfy. Either way the guess is spent. You get 10 guesses for 9 cells, so exactly one miss is affordable, and each country may be used only once on the board. Score starts at 900 (every empty cell = 100) and each correct answer replaces that 100 with its rarity percentage, so the whole game is a tug-of-war between "fill all nine" (a blank costs a flat 100) and "find the country nobody else thought of" (a mythical pick costs <0.5). Game ends when the board is full or guesses hit 0; then you get rank/percentile vs everyone who played that board, a score-distribution histogram, star achievements, and per-cell popularity breakdowns.

### RULES
- Grid is exactly 3×3 = 9 cells. Internal cell index is row*3 + col + 1 → keys "match_box_1" … "match_box_9" (row-major).
- GUESS LIMIT = 10, NOT 9. Verbatim from the in-game About panel: "Players have 10 guesses to fill out the grid, but can enable infinite mode for unlimited. A country can only be used once per game board." Confirmed in code: resetState sets guesses = 10, board = [["","",""],["","",""],["","",""]], score = 900. The side panel renders "{n}/10 left". (Several aggregator sites say 9 — they are wrong.)
- BOTH correct and wrong guesses decrement the counter — the decrement is unconditional (`infiniteMode ? markInfinite() : guesses--`). 10 guesses / 9 cells = exactly one permitted miss.
- NO-REPEAT rule applies to countries already PLACED on the board: re-entering one is silently rejected and does NOT cost a guess, and the search list shows it with a disabled "Guessed" button. A country you guessed WRONG is not locked out — you can try it again elsewhere (verified: the dup check tests board.flat(), and the search popup is passed board.flat(), not the wrong-guess log).
- FREE-MISS EXCEPTION: if the dataset has null data for that country on that criterion, a "No data" popup appears and the function returns BEFORE the guess is charged.
- Correctness is not computed live: each daily board ships precomputed answer lists — GET cdn-assets.teuteuf.fr/data/geogrid/boards/{n}.json → {grid_id, rows[3], columns[3], answers{match_box_1..9: [countryName,…]}}. The client ALSO contains a complete local predicate engine (a large switch over ~110 category ids evaluated against countries.json) used for the wrong-guess partial feedback and for the custom-board builder — i.e. an offline clone can generate boards itself.
- Answer sets are LARGE. Board #840 per-cell answer counts: 106, 43, 37, 74, 22, 51, 108, 51, 40. Board #839: 90, 100, 61, 83, 97, 53, 32, 32, 16. The FAQ's JSON-LD claim "Each square on a given board has a minimum of 5 and up to 30 unique answers" does NOT match shipped data — treat it as stale.
- Answers include dependencies/territories (American Samoa, Anguilla, Aruba, Cayman Islands, Cook Islands, French Guiana all appear on #840); the search placeholder term is literally "country/territory".
- INFINITY MODE: a "Unlimited guesses" side-panel toggle. While on, guesses never decrement. Toggleable any time before the game ends, but once you register a guess in infinite mode it locks permanently and the game is ranked in a separate infinite-mode leaderboard. Toast at 1 guess left: "Heads up! You only have one guess left. Make sure to turn on Infinity Mode if you want to continue playing."
- GIVE UP: button reads "Finish & reveal"; confirm toast "Are you sure you want to give up?" / "If you give up, you will see the answers, but will not be able to finish this game." Post-game the button becomes "Restart", which deletes the local save for that board.
- EXTENDED PLAY: after game over, one button sets guesses = 99, forces infinite mode on and un-ends the game (saved under a separate key, boardId + "e").
- STREAKS only count Daily Mode. Archive games earn achievements but never streaks (explicit FAQ policy).
- PERSISTENCE is localStorage only, keyed per board under "userData": {guessedCountries, guesses, previousGuesses, isGameOver, board, rarityPercentages, score, wrongGuesses, infiniteMode, hasMadeGuessInInfiniteMode, archiveMode}; plus stats_data and leaderboard_data_{board} caches.
- CRITERIA CATEGORIES — the in-game "Categories Atlas" has 10 sections, each category with a prose definition and cited sources (Wikipedia/World Bank/USDA/EIA etc.), and some credited to community suggesters. World game, ~110 category ids: FLAG — colour present / colour absent, has star or sun, only red-white-blue, no red/white/blue, coat of arms, animal, plant, crescent moon, exactly N colours / N+ colours, horizontal stripes, vertical stripes. GEOGRAPHY — island nation, landlocked, coastline length over/under X, coastline on a named ocean/sea, part of a named river system, continent, touches the Eurasian Steppe, touches the Equator, touches the Sahara, average elevation over/under X, average temperature over/under X, annual rainfall over/under X, hemisphere, has a river border, land-border length over/under X, forest cover over X, arable land under X, protected waters under X, touches/doesn't touch the tropics, Pacific Ring of Fire, has a desert, has rainforest, has a Holocene volcano. ECONOMIC — HDI over/under X, GDP per capita over/under X, produces nuclear power, top-20 wheat / oil / renewable-share. NAME — starts/ends with letter, name is N letters (or N+), multi-word name, starts and ends with same letter, capital city starts with letter. BORDERS — borders between X and Y countries, borders X or more, borders a specific named country. FACTS — drives on the left, 50+ skyscrapers, top-20 obesity / alcohol consumption / chocolate per capita / rail network / population density (top and bottom 20) / tourist arrivals / World Heritage sites, air pollution over/under X µg/m³, CO₂ per capita over/under X, top-10 by number of lakes, has a UNESCO natural site, has a metro system, official Google Street View coverage, has had a citizen in space, Eurovision. SPORTS — Olympic medals over/under X, never won an Olympic medal, hosted the Olympics, hosted / played in / won the men's FIFA World Cup, hosted an F1 Grand Prix. POLITICAL — EU member, Commonwealth member, former USSR, monarchy, dependency/territory, has nuclear weapons, official language is / is not X, same-sex marriage legal, same-sex activity illegal, CPI over/under X, more than one time zone, observes a given UTC offset, observes DST, majority religion, former colony of X, part of the Roman / Ottoman / Mongol Empire, more than X living languages, urban population over X%, largest city holds X% of urban population, Arab League, APEC, NATO, mandatory military service, no standing army, has had a female head of state/government, Antarctic Treaty party, national space agency. POPULATION — population over/under X, capital-city population over/under X, capital is not the most populous city. SIZE — area over/under X km².
- The USA sibling game (/usa, 3×3 of US states, epoch 2026-05-05) reuses the same engine with its own atlas: region, Bible/Corn/Salt/Sun Belt, mountain range, river system, national parks count, no income tax, top-5 producer of corn/oil/cheese/coal/maple syrup, toll roads, birthplace of a US president, Route 66, Pony Express, Lewis & Clark, Louisiana Purchase, original colony, ski resort, Big Ten / SEC / Ivy League, multiple NFL teams, electoral votes, order/year of statehood, state motto language, last presidential vote, Civil War, NASA facility, death penalty, minimum wage above federal, snowfall, farmland, etc.
- LIVE 1v1 (server-side, /challenge/:id): "60-second turns · lower score wins". Coin-flip decides who starts; players alternate — pick a cell, name a country, reduce your score; auto-pass when the 60 s timer expires; WebSocket-synced; spectators counted and shareable ("Watch my live GeoGrid challenge!"); onlookers can join a queue to "play the winner"; forfeit, claim-win when the opponent leaves, and rematch/next-game flows exist.
- OTHER ROUTES: / (today), /board/:id (any past board by number), /archive, /usa, /usa/:id, /create and /create/:code (custom board = 6 category codes joined by hyphens, first 3 = columns, last 3 = rows, optional "usa-" prefix, e.g. shareable as /create/aB-cD-eF-gH-iJ-kL), /community, /gazette/:id (current-events boards), /stats and /stats/:board_id, /faq, /changelog. "Play another" after a game picks Math.floor(Math.random()*(today-1))+1.

### SCORING
EXACT FORMULA (from the guess handler, verbatim semantics). Score starts at 900. On each CORRECT guess in cell m: n = liveRarity["match_box_"+m]["total"]; t = liveRarity["match_box_"+m][countryName]; pct = (t / n * 100).toFixed(1)  (NaN → 0); score = (score - (100 - pct)).toFixed(1). Equivalently: FINAL SCORE = Σ over the 9 cells of (rarity% of your pick, 1 decimal) for filled cells + 100 for every empty cell. Range 0.0–900.0; LOWER IS BETTER; a perfect-in-count-but-obvious grid can still score ~200 while a full grid of mythicals scores ~2. The in-game About text states it plainly: "The score is calculated by the sum of the rarities of each box on the board. Empty cells are scored as 100. The rarer the guess, the lower the score. The lower the score, the better." — DENOMINATOR: the rarity percentage is per-CELL, not global — it is (players who put that country in THAT box) / (total correct guesses logged in THAT box). Live example, board #840 box 1 at 2026-07-25 mid-afternoon: total = 8,991 correct guesses; Somalia 429 (4.8%), Mozambique 255 (2.8%), Bangladesh 209 (2.3%), Angola 195 (2.2%), Yemen 191 (2.1%), Haiti 189 (2.1%), India 170 (1.9%), 106 distinct countries used. Note that even the MODAL answer in that cell is only 4.8% ("Rare" tier) because the cell has 106 valid answers. — SNAPSHOT SEMANTICS: the client GETs /api/game/rarity/{board} once on load and scores every guess against that frozen snapshot, then POSTs its own guess back (…/game/rarity/{board}?guess=NAME&index=M) to increment the shared counters. So (a) your own pick never inflates your own percentage, and (b) the percentages drift all day — the same pick scores differently depending on when you play. — RARITY TIERS (exact, from the RARITY_TIERS constant; label text is what the in-game key shows): 🟩 Common ≥ 25% rgb(101,208,101); 🔷 Uncommon ≥ 10% rgb(60,100,180); ⚡️ Rare ≥ 5% rgb(150,112,221); 🌈 Epic ≥ 2% rgb(221,112,197); 💎 Legendary ≥ 0.5% rgb(30,160,220), fires confetti + 2 sparkles; 🦄 Mythical < 0.5% rgb(90,30,120), fires confetti + 4 sparkles. Tier lookup is the first tier whose minPct ≤ your pct. A cell chip reads "{emoji} {pct}%", except pct == 0 which renders "🦄 First" (you are the first player to use that answer in that cell). — RANK: POST /api/game/stats/{board}?score=S&gim=0|1&flag=0&rarity=…&rarity=… returns {plays, rank, num_scores, rank_for_mode, num_scores_for_mode}; percentile = round((1 - rank/plays)*1000)/10. Normal and infinite modes are ranked SEPARATELY. GET /api/game/stats/{board} returns plays plus scores_by_bucket with keys total, total_inf, top_1, top_2, top_3, num_legendary (each with "_divisor": 9) — the histogram is bucketed in 9-point bands (bucket k = scores 9k … 9k+8), buckets 0–100. Live: board #840 had plays = 13,089 by mid-afternoon. — ACHIEVEMENT STARS (FAQ, verbatim thresholds): beating 50-59% of players = ⭐, 60-69% = ⭐⭐, 70-79% = ⭐⭐⭐, 80-89% = ⭐⭐⭐⭐, 90-100% = ⭐⭐⭐⭐⭐. Titles include Top Brass (overall percentile), Peak Performance (best single square), Dynamic Duo (best 2 squares), Triple Threat (best 3 squares), Mythical Hunter and Legendary Hunter (2 = ⭐ … 6+ = ⭐⭐⭐⭐⭐), Top Tier Tactician (beat 50% of players N days running) and Daily Devotion (play N days running) with day thresholds [2, 5, 7, 15, 30] and a 90-day cap, plus Elite Among Mortals and Beyond the Grid (custom board).

### DAILY
One shared daily board worldwide, released at LOCAL device midnight — FAQ verbatim: "GeoGrid is a daily game. A new game is released every day at 0:00 am (midnight), local time of your device!" The board number is purely date-derived: boardNumber = dayjs(localDate).diff(EPOCH, 'day') + 1, with EPOCH = 2024-04-07 for the world game and 2026-05-05 for the /usa game. Verified: 2025-09-08 → #520 (matches published answer guides) and 2026-07-25 → #840, which is exactly what cdn-assets.teuteuf.fr/data/geogrid/boards/840.json returns. Board #1 exists and is fetchable, so the full archive is 840 boards deep and is exposed at /archive and /board/:id; a 1-second interval timer detects the date rollover and reloads. Because rollover is device-local, players in different time zones are on different boards at the same instant. Same-day replay of the daily board is not offered (only Restart, which wipes your local record, or Extended Play).

### SHARE
Copy-to-clipboard (navigator.clipboard.writeText), newline-joined, with TWO selectable grid styles — "rarity" (default) or "flags". Exact structure from the game-over modal:

Line 1-3: the 3×3 emoji grid, one row per line, 3 glyphs each, no separators. Rarity mode uses the tier emoji per cell (🟩/🔷/⚡️/🌈/💎/🦄); flags mode uses that country's regional-indicator flag emoji (fallback 🏳️). Any empty cell renders ❌ in either mode.
Line 4: "Score: {score}" and, if rank data exists, " | Rank: {rank}/{plays}" with thousands separators.
Line 5: "Board #{boardId} | ♾️ Mode: {On|Off}"
Line 6: the share URL — https://geogridgame.com/board/{boardId} for the daily, else https://geogridgame.com

Worked example:
🦄💎⚡️
🔷🟩❌
🌈💎🦄
Score: 137.4 | Rank: 1,204/13,089
Board #840 | ♾️ Mode: Off
https://geogridgame.com/board/840

Achievement shares are a separate format: emoji grid (achievement icon on the achievement's key cells, 🟩 on other filled cells, ❌ on blanks) then "Score: X | Rank: r/p", then "{icon} {Achievement title} | ★★★", then the achievement's long description, then "Board #{id} | ♾️ Mode: {…}", then the URL. The 1v1 share is: 3 emoji lines, then "My score: X | Opponent: Y", then "🏆 1v1 Challenge", then https://geogridgame.com/challenge/{id}. There is also a WhatsApp deep-link share and an in-game board-invite text "Up for a daily geography challenge? Try this board!"

### UI
- Layout: 3×3 grid with column criteria as header cells across the top and row criteria down the left; a corner cell shows "🌍 Board #840". Header cells are CLICKABLE and open the Categories Atlas entry (definition + sources) for that criterion — the FAQ calls this out as a deliberate comprehension fix TeuTeuf added after acquiring the game. A right-hand side panel (stacks below on mobile) shows Score (large), Guesses "{n}/10 left" or ∞, an "Unlimited guesses" toggle with tooltip "Once you make a guess in infinite mode, you cannot turn it back off.", and the Rarity key legend.
- Empty cell on a brand-new player's first board shows a "Start here +" affordance on the top-left cell only, and only until they have completed a board.
- Guess entry: cell tap opens a modal search popup; input autofocuses; debounced type-ahead; ArrowUp/ArrowDown move a focused index and Enter commits; already-placed countries render with a disabled "Guessed" pill; empty result shows a "no results" message. The popup is passed both the row and the column category names so they stay visible while you type.
- Filled cell: a coloured rarity chip in the tier colour reading "{emoji} {pct}%" (or "🦄 First"), the country flag image, and the country name. The cell is a flip-card — tap flips flag → country outline SVG; a `touch_app` hint badge shows until the user has flipped once.
- Wrong guess: cell gets `wrong animate-shake` for 500 ms, AND the corresponding row header and column header get `prompt-satisfied` (green) or `prompt-unsatisfied` (red) for 1200 ms — a genuine partial-information mechanic that most write-ups miss.
- Legendary and Mythical picks fire canvas-confetti made of the tier emoji, launched from that cell's centre (particleCount 20, spread 50, scalar 2), and the cell keeps 2 or 4 persistent ✦ sparkle elements plus a `rarity-legendary` / `rarity-mythical` CSS class.
- Game over: full-screen confetti (200 particles), then a modal with score, rank/percentile, and a share button with a rarity-grid ↔ flag-grid toggle. "View board insights" opens tabbed panes: Score Distribution (bar chart of the 9-point buckets, with an ♾️ Mode On/Off toggle and KPI lines "Total plays (at least 1 guess submitted)", "Total scores", "Game completion % (won, gave up, or ran out of guesses)", "Est. all-9 completion % — upper bound"), Achievements (star cards, each individually shareable, with locked "next level" cards), and Game Details with four views — Most Popular, Least Popular, Answer frequency (per-cell %), Your Wrong Guesses ("Here is the relevant data we have on file for your guesses") — plus a per-cell "Show Answers (N)" popup listing every valid country.
- Colour semantics are rarity, never correctness: green 🟩 = COMMON = the worst outcome, purple 🦄 = mythical = the best. This inverts the Wordle instinct and is worth restating loudly in any clone's UI.
- Menu contains "Suggest a category" and "Submit Feedback" — categories in the atlas carry a suggestedBy credit, so the category set is community-extended.
- The page is ad-supported: Google AdSense + GTM + Snigel adengine + an obfuscated anti-adblock loader (html-load.com / error-report.com) that can pop a "There was a problem loading the page" confirm() and redirect; plus a consent banner with a "Manage Consent" button.

### DATA NEEDED
- countries.json: ~250 entries (sovereign states + dependencies/territories; Antarctica present in data but filtered out of the picker) with the ~40 attribute families the ~110 predicates read — population, area, GDP, GDP per capita, HDI, CPI, coastline length, landlocked flag, island flag, list of bordering country codes, land-border length, official languages, majority religion, flag colour list + flag feature booleans (star/sun, coat of arms, animal, plant, crescent, stripe orientations, colour count), continent/hemisphere/region, average elevation, average temperature, annual rainfall, forest cover %, arable land %, protected waters %, river systems, deserts/rainforest/volcano/steppe/equator/tropics/ring-of-fire booleans, Olympic medal count + hosting, World Cup played/hosted/won, F1 hosting, Eurovision, EU/NATO/Commonwealth/Arab League/APEC/Antarctic Treaty membership, USSR/Roman/Ottoman/Mongol history, former-coloniser codes, monarchy, territory flag, nuclear weapons, nuclear power, drives-on-left, metro system, Street View coverage, space agency, citizen-in-space, DST + time-zone list, same-sex marriage/criminalisation, female head of state, mandatory service / no standing army, urban population %, living-language count, capital name + capital population + capital-is-not-largest flag, and the various top-10/top-20 league tables (wheat, oil, renewables, obesity, alcohol, chocolate, rail, population density top+bottom, tourism, World Heritage, lakes). Realistically 250–500 KB of JSON hand-assembled from Wikipedia/World Bank — this is the single biggest build cost.
- A rendered-name index for fuzzy matching: the original normalises with trim → NFD → strip combining marks → strip [- '()] → lowercase, plus an explicit alias map (Ivory Coast↔Côte d'Ivoire, Aland Islands↔Åland, East Timor↔Timor-Leste, Micronesia…). Budget an alias table of ~40 entries.
- Flag images: ~250 SVGs (originals at cdn-assets.teuteuf.fr/data/common/flags/{cc}.svg). For a no-network clone, either inline flag emoji via regional-indicator codepoints (2 lines of code, zero bytes) or bundle an SVG sprite (~300–600 KB minified).
- Country outline shapes: ~250 SVGs (…/common/country-shapes/{cc}.svg) — needed only if you want the original's tap-to-flip flag→silhouette feature. Simplified outlines can be got down to ~1–3 KB each, so ~400 KB total; optional.
- Category definitions: id → human label template (with the numeric variant substituted, e.g. "population_over_x" + variantId → "Population over 50 million"), a prose explanation, and a source citation — the original ships all of this in-bundle as the Categories Atlas. ~110 world + ~60 USA entries, maybe 60 KB.
- Board generation: either (a) precomputed board list — the original's per-board JSON is 11–12 KB each, so 365 days ≈ 4 MB, too big to bundle naively; or (b) generate at runtime from a date-seeded PRNG over the predicate set and intersect the answer sets in-browser, which is what you should do (the predicate engine is ~500 lines and the whole 250-country cross-product is trivial to compute client-side).
- For rarity WITHOUT a server you need a popularity prior. Cheapest credible option: bundle one "salience" number per country (e.g. Wikipedia-pageview rank or log population rank, ~250 floats, <5 KB) and derive an expected-pick distribution per cell via softmax over the cell's valid answers. Second option: seed from real GeoGrid data — GET api.geogridgame.com/api/game/rarity/{n} returns actual per-cell pick counts for any past board (8.6 KB for board #840) and is unauthenticated, so ~840 fetches ≈ 7 MB gives you a genuine empirical popularity model you can compress into a single per-country salience score plus per-category adjustments.
- Two-player state: nothing but localStorage — per-date records of {player, board, picks[9], rarity[9], score, guessesUsed, wrongGuesses[], durationMs} plus a lifetime H2H ledger. Under 1 KB/day/player, so a decade fits comfortably; still add a JSON export button given how easily localStorage is wiped.

### WEAKNESSES
- Rarity is scored against a mid-day snapshot, so the SAME pick yields a different score depending on when you play. The client fetches /game/rarity/{board} once at load, scores everything against that frozen copy, and POSTs its own guesses back. Two people playing the same board hours apart are not measured on the same denominator — fatal for a couple who compare totals. (Verified from code; the FAQ never discloses it.)
- Cells are frequently far too broad, which turns rarity into a lottery rather than a knowledge test. Board #840 had cells with 106 and 108 valid answers; in the 106-answer cell the single most popular answer was only 4.8%, meaning essentially any answer you can recall lands in Rare/Epic/Legendary and the difference between a well-reasoned pick and a half-remembered one is noise. The FAQ's "minimum of 5 and up to 30 unique answers" per square is contradicted by shipped data.
- The 100-per-blank penalty dominates the rarity signal: one empty cell costs more than the other eight cells combined in most games. So the optimal strategy is almost always "fill all nine safely", and the advertised skill (hunting obscure answers) is a rounding error unless you already know you can complete the grid.
- Fundamentally server-dependent: correctness comes from a CDN board file and the entire score comes from an API. No offline play, and if api.geogridgame.com is slow or down you can still guess but rarity/score/rank break.
- Infinite mode forks the game into two incomparable populations. The FAQ itself concedes infinite-mode players "achieve much better scores", which is why ranks were split in June 2025 — so if one partner flips the toggle their numbers are meaningless against the other's, and the toggle is irreversible once used.
- Answer sets mix sovereign states with dependencies (American Samoa, Anguilla, Aruba, Cayman Islands, Cook Islands, French Guiana on board #840). Whether "a country" includes territories is a dataset judgement players cannot see in advance, and the picker's own label hedges to "country/territory".
- Category truth is dataset truth, and the data has holes: the client has an explicit checkForNullCategoryData path that pops a "No data" modal instead of adjudicating. Threshold categories ("Arable land under 20%", "Protected waters under 20%", "Forest cover over 50%") hinge on one cited source, so a player who knows a different figure has no recourse. The Categories Atlas with per-category source links exists precisely because this needed defending.
- Only 10 guesses for 9 cells means a single mis-remembered fact ends the run, and there is no undo, no hint, and no way to skip a cell you can't solve without burning the whole turn budget. Give-up is all-or-nothing ("you will see the answers, but will not be able to finish this game").
- Daily rollover is device-local midnight, so two players in different time zones — or one who travels — are on different boards, and there is no way to select "yesterday's board that my partner played" other than manually navigating /board/:id.
- All progress, streaks and achievements live in localStorage with no default account sync; "Restart" deletes the board's local record outright. A cleared browser wipes a 90-day streak.
- Scores are 1-decimal floats summed over nine cells (e.g. 137.4 vs 141.9), which is precise but hard to read, hard to remember, and produces near-ties that feel arbitrary given the snapshot drift above.
- Head-to-head only exists as a live, real-time, server-hosted room with 60-second turns and a coin flip. There is no asynchronous "we each played today's board, show us side by side" mode — exactly the mode two people who play daily actually want.
- Ad-heavy delivery: AdSense + GTM + Snigel plus an obfuscated anti-adblock loader that can throw a modal and redirect. On a slow or memory-constrained machine the game itself is a small fraction of what loads.
- Note on sourcing: I could not reach Reddit or any player forum from this environment (reddit.com is blocked for both the fetch tool and the search tool, and searches for complaints returned only SEO clone sites). Every weakness above is derived from the shipped code, the game's own FAQ admissions, or live API/CDN data I measured — none of it is second-hand player sentiment, and I have not verified which of these players actually complain about most.

### IMPROVEMENT IDEAS
- Replace crowd rarity with a DETERMINISTIC obscurity index, computed from bundled data, so both partners get identical scores no matter when they play. Suggested formula: cellScore = round(100 * softmax_share(salience(country)) over that cell's valid answers), where salience is a single bundled per-country number (Wikipedia-pageview rank works well, or seed it once from GeoGrid's own public /game/rarity/{n} endpoints for boards 1–840 and regress a salience score you then ship as a static table). Same 0–100-per-cell, blank=100, lower-is-better shape, so scores stay comparable to the original's feel — but reproducible, offline, and drift-free. This single change fixes the original's worst structural flaw.
- SEALED SIMULTANEOUS DUEL as the default daily mode: both play the same board on the same device or two devices; neither sees the other's picks until both have finished; then reveal a side-by-side 3×3 with per-cell winner highlighting, the cell-by-cell margin, and a one-tap "who won today" verdict. This is what the couple actually wants and the original cannot do without a live server room.
- Score the duel CELL BY CELL, not just by total. Award each cell to whoever picked the rarer valid country and report "6–3 on cells, 41.2 vs 58.9 on points". A 6–3 is a story you can talk about over breakfast; a 41.2-vs-58.9 is not. Add a tiebreak on total for equal cells.
- COLLISION PENALTY: if both partners picked the same country for the same cell, both take a penalty (or the cell is voided). This makes the two of them each other's rarity denominator — a far better and more personal signal than an anonymous global crowd — and immediately creates the fun metagame of guessing what your partner will guess.
- AUTO-HANDICAP so the daily stays competitive: track the last 14 days' margin and give the stronger player fewer guesses (10 vs 9 vs 8) or a rarity multiplier, shown openly as "M plays off 9 today". Golf-style handicaps are the proven fix for asymmetric skill in a two-person daily ritual, and the original has no concept of it.
- DIFFICULTY / BOARD-QUALITY DIAL, which the original badly needs: because you generate boards locally you can constrain generation to cells with, say, 8–25 valid answers instead of 106. Expose it as Easy/Standard/Cruel (min answers per cell 20+/8–25/4–10). Also let them exclude category families they dislike (a "no flag trivia" or "physical geography only" switch) and bias toward regions they are learning.
- FULL ARCHIVE plus unlimited practice, with three separate ledgers so practice never pollutes the rivalry: Daily H2H (the ranked one), Archive Co-op, and Solo Practice. The original gates streaks to daily play for exactly this reason but doesn't separate the stats.
- CO-OP mode for the nights they'd rather play together than against each other: one shared grid, alternating cell picks, a shared score target and a shared streak. Add a "consult" rule where the non-picker may veto once per game.
- Local PASS-AND-PLAY with the original's 60-second turn timer, on one phone, no server. The original's turn-based duel is its best mode and it is the one thing that requires their WebSocket backend; an offline clone gets it for free.
- PERSISTENT RIVALRY DASHBOARD: lifetime H2H record, current daily-win streak, longest streak, rolling 30-day Elo, average score by weekday, and "nemesis categories" — the criteria families where each player loses most often (trivially computable since every board records its 6 category ids). This is the retention mechanic for a two-person game; the original's stats page is solo-only.
- POST-GAME LEARNING PANE, expanded well past the original's "Show Answers (N)": for each cell list every valid country with its obscurity index, mark the ones neither of you found, and surface "the rarest country you both missed" plus a one-line fact about it. Two people who play a geography game daily are really there to learn geography; make that the payoff screen rather than a leaderboard.
- CUSTOM PACK BUILDER with URL-hash sharing, no server: board = 6 category codes + a seed, exactly like the original's board_code (3 columns then 3 rows), so a birthday board or a "countries on our trip list" board is just a link they text each other. Add curated packs: Europe deep-cut, Africa, small islands, flags-only, "places we've been".
- NEVER charge a guess for a data gap, and keep the partial-credit feedback permanently instead of for 1.2 s: maintain a visible per-cell "near miss" log showing which of the two criteria each wrong guess satisfied. Make the criteria definition and its source readable inline at all times, not behind a modal.
- SHAREABLE COUPLE'S CARD in addition to the emoji grid: two rows, e.g. "Misha 41.2 (9/9) vs David 58.9 (8/9) — cells 6–3 — M leads the week 4–2", generated as text for their chat plus an optional PNG. Also add a JSON/CSV export and an import button, because localStorage on a memory-pressured Mac cannot be trusted to hold a year of history.
- JOINT STREAK as the headline number: "both played today" — 47 days. A shared streak is a much stronger daily commitment device for a couple than two separate individual streaks, and it is the kind of thing only a two-player clone can offer.
- Pure offline wins worth stating plainly: instant load, zero ads, no consent banner, no anti-adblock modal, no account, works on a plane or in a dead zone, and a fixed rollover time (pick one shared timezone for the pair rather than device-local midnight, so they are always on the same board even when one of them travels).


==========================================================================================
## TimeGuessr   [confidence: high]
https://timeguessr.com/

### CORE LOOP
Five rounds. Each round shows one real historical photograph full-screen (pan/zoom-able: mouse wheel or pinch zooms into the image, drag to pan, max 7x the fitted size — this is undiscoverable and a top complaint). Overlaid in a corner is an Apple Maps world map plus a year slider. The player scrolls/pinches the map to zoom, single-taps anywhere to drop (or move) a single pin, and drags the year slider (or taps the ◀/▶ nudge buttons, which hold-to-repeat) to pick a year. Pressing Space or the 'Make guess' button submits both halves at once — you cannot lock in the year and location separately. On submit the round resolves immediately: the map re-renders showing a red marker at the true location, a black marker at your guess, and an animated dashed line between them; the panel shows distance ('Your guess was 4.2 km'), years off ('You were 3 years off' / 'You got it spot on!'), and a three-line score breakdown Year / Location / Total. A 'Street view' tab swaps the photo for a Google Street View embed of the exact spot today, and the photo's description and license/attribution are revealed. Space or 'Next Round' advances; after round 5 you land on the final-score screen with a percentile ('Top 12%'), an emoji/detailed share sheet, a countdown to the next daily, and (if logged in) a leaderboard and a friend-comparison overlay that draws both players' pins on one map, round by round.

### RULES
- Exactly 5 rounds per game. Max 10,000 points per round = 5,000 for the year + 5,000 for the location. Max total 50,000. Verified from the shipped share string, which hardcodes '/50,000'.
- There are no guesses in the Wordle sense — one submission per round, no retries, no feedback loop within a round. You get one shot at year and one shot at location, submitted together.
- Year input is a range slider, min=1900, max=2026 (the current year; hardcoded in the built template). It initialises at 1962 every round — a fixed midpoint default, NOT your previous guess. So the answer set is bounded to 1900–present; there are no 19th-century photos in the main game.
- Location input: single pin on an Apple MapKit JS map (v6.0.120). Initial region is a CoordinateSpan of 1000 degrees — i.e. clamped to the whole world — centred near {lat:51.486, lng:3.692} (or {lat:25, lng:3.69} depending on the mount). isRotationEnabled=false, showsZoomControl=false, so zooming is scroll/pinch/double-tap only, with no +/− buttons.
- Distance is great-circle haversine with R = 6371 km, returned in METRES: a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2); d = 6371 · 2·atan2(√a, √(1−a)) · 1000. Displayed rounded to 0.1 m, and shown as 'exact' if under 1 m.
- Optional per-round timer. Game settings offer 'No timer' or 'Time limit' with a slider min=0 max=40 step=1, where seconds = sliderValue × 15. So the options are: no limit, then 15s, 30s, 45s, 1:00 … up to 10:00. The chosen value is written to five separate keys (timerRoundOne … timerRoundFive), so the SAME limit applies to EACH round independently — it is not one clock for the whole game. Timer text turns 'urgent' at ≤5 seconds.
- Timeout behaviour (an important, non-obvious rule): if the timer expires you get 'You ran out of time!' and the round is scored with distanceScoreValue = 0, distanceMeters = 0, guessCoords = {0,0}, noGuess = true — but yearScoreValue is STILL computed from wherever the year slider happens to be sitting. You keep your year points and forfeit only the location points. Since the slider defaults to 1962, a timeout on a 1950s–70s photo can still bank 3,400–5,000 points.
- Map has 4 size states (CSS classes size-1, size-2, size-3, size-collapsed); default is size-2, persisted in sessionStorage as windowSize.
- Modes: (1) Daily challenge — one shared 5-round puzzle per day, same for everyone, numbered (#1151 on 2026-07-25). (2) 'Play' — an unlimited random game, replayable as often as you like. (3) Community games — 5-round sets built and published by other users. (4) 'Challenge a friend' — generates a link that serves your exact 5 rounds (with your timer setting) to someone else.
- No public archive of past dailies. The route table is only /, /play, /play?mode=daily, /community, /game-settings, /login, /finalscore, /account-settings — there is no per-date daily route and no 'archive' string anywhere in the bundle. Miss a day and it is gone.
- In-progress games resume: the homepage shows 'Daily in progress' / 'Game in progress' with a 'Continue' button, backed by localStorage key tg_progress_play.
- Units setting is global: 'Metric (km/m)' or 'Imperial (mi/ft)'. Metric shows metres under 1 km then km to 1 dp; imperial shows feet under 5280 ft then miles to 1 dp.
- Leaderboards, lifetime stats, percentile curve and friend comparison all require an account. Anonymous play works fully but keeps nothing.
- Monetisation: ad-supported (an 'Advertisement' slot sits in the game UI), with an ad-free IAP on mobile (reported ~$3.99/month or ~$24.99/year — from store listing, not verified in code).

### SCORING
Both halves are pure lookup/piecewise functions of error — no time bonus, no streak multiplier, no round weighting. Extracted verbatim from the production bundle (chunk ITA7NTGc.js) and verified numerically.

YEAR SCORE (max 5,000) — a coarse staircase on n = |guessYear − actualYear|:
n=0 → 5000; n=1 → 4950; n=2 → 4800; n=3 → 4600; n=4 → 4300; n=5 → 3900; n=6..7 → 3400; n=8..10 → 2500; n=11..15 → 2000; n=16..20 → 1000; n≥21 → 0.
Note the plateaus: 6 and 7 years off score identically; so do 8/9/10, 11–15, and 16–20. And 21 years off is a hard zero — no partial credit at all.

LOCATION SCORE (max 5,000) — piecewise linear in d = distance in METRES:
d ≤ 50        → 5000
d ≤ 1000      → round(5000 − d × 0.02)
d ≤ 5000      → round(4980 − d × 0.016)
d ≤ 100000    → round(4900 − d × 0.004)
d ≤ 1000000   → round(4500 − d × 0.001)
d ≤ 2000000   → round(3500 − d × 0.0005)
d ≤ 3000000   → round(2500 − d × 0.00033333)
d ≤ 6000000   → round(1500 − d × 0.0002)
d > 6000000   → 12   (flat floor — a wrong hemisphere and a wrong continent both score 12)

Verified sample points: 50 m→5000, 1 km→4980, 5 km→4900, 10 km→4860, 50 km→4700, 100 km→4500, 250 km→4250, 500 km→4000, 1000 km→3500, 1500 km→2750, 2000 km→2500, 3000 km→1500, 4000 km→700, 6000 km→300, >6000 km→12.

The piecewise segments are DISCONTINUOUS: each segment's start constant equals the previous segment's end value, then immediately subtracts, so crossing a breakpoint costs points for one extra metre. Measured drops: 50 m→−1, 1 km→−16, 5 km→−20, 100 km→−100, 1000 km→−500, 2000 km→−667, 3000 km→−600, 6000 km→−288. Being 2,000,001 m out scores 1833 while 2,000,000 m scores 2500. This is a bug a clone should not reproduce.

ROUND TOTAL = yearScoreValue + distanceScoreValue. GAME TOTAL = sum of 5 rounds, capped naturally at 50,000.

SEPARATE 'ACCURACY %' METRIC (used only for lifetime stats on the final-score screen, not for points):
• yearAccuracy% = mean(yearScoreValue) / 5000 × 100
• locationAccuracy% = mean over rounds of  max(0, 100 − 6.58 × (log10(max(d,50)/50))^1.6)
That log-scale curve gives 100% at ≤50 m, 90% at 1 km, 55.5% at 100 km, 32.1% at 1000 km, 11.4% at 6000 km, 0% at 20,000 km — i.e. it is far harsher than the points formula, which is why the score feels generous but the stats page feels honest.

### DAILY
One daily puzzle of 5 rounds, identical for all players, sequentially numbered. Daily #1151 ran on 2026-07-25, which back-dates day #1 to roughly 2023-06-01 (assuming no skipped days — medium confidence). Each daily has its own DailyId (UUID) and each of the 5 photos its own ImageId. The final-score screen counts down 'Xh Ym Zs until next daily' from a server-supplied countdownEndsAt timestamp, so the rollover boundary is server-defined and not derivable from the client (probably UTC midnight — unverified). Alongside the daily there is an unlimited 'Play' random mode with no cap, plus community-made games. There is no archive: past dailies are unreachable once the day rolls over.

### SHARE
Two formats, toggled by a 'Detailed' / 'Emoji' switch in a 'Share Results' modal, copied via navigator.clipboard with a 'Copied!' confirmation for 2 s. Score is formatted with toLocaleString('en'), e.g. 43,215.

EMOJI (5 lines, one per round; note the single space between the globe block and the calendar block):
TimeGuessr #1151 43,215/50,000
🌎🟩🟩🟩 📅🟩🟩🟨
🌎🟩🟩⬛ 📅🟩🟩⬛
🌎🟩🟨⬛ 📅🟩🟨⬛
🌎🟩⬛⬛ 📅🟩⬛⬛
🌎🟨⬛⬛ 📅⬛⬛⬛
https://timeguessr.com

DISTANCE blocks (🌎 + 3 squares) keyed on distanceScoreValue:
=5000 → 🟩🟩🟩 | >4750 → 🟩🟩🟨 | >4500 → 🟩🟩⬛ | >4250 → 🟩🟨⬛ | >3500 → 🟩⬛⬛ | >2500 → 🟨⬛⬛ | else → ⬛⬛⬛

YEAR blocks (📅 + 3 squares) keyed on the exact yearScoreValue, so they map cleanly onto years-off bands:
5000 (spot on) → 🟩🟩🟩 | 4950/4800 (1–2y) → 🟩🟩🟨 | 4600/4300 (3–4y) → 🟩🟩⬛ | 3900/3400 (5–7y) → 🟩🟨⬛ | 2500/2000 (8–15y) → 🟩⬛⬛ | 1000 (16–20y) → 🟨⬛⬛ | 0 (21y+) → ⬛⬛⬛

DETAILED (blank line after the header and before the URL):
TimeGuessr #1151 — 43,215/50,000

1️⃣ 🏆9,850 · 📅 1y · 🌍 2.3 km
2️⃣ 🏆7,120 · 📅 4y · 🌍 418.7 km
3️⃣ 🏆10,000 · 📅 0y · 🌍 12m
4️⃣ 🏆5,400 · 📅 9y · 🌍 1,204.0 km
5️⃣ 🏆3,412 · 📅 17y · 🌍 3,880.2 km

https://timeguessr.com

Distance in the detailed format uses a compact formatter: metric → whole metres under 1 km, else km to 1 dp; imperial → whole metres under 1609.34, else miles to 1 dp. The '#1151' and 'Daily #' prefix are omitted entirely in non-daily modes ('TimeGuessr 43,215/50,000'). Separately, 'Challenge a friend' copies a link that replays your exact 5 rounds for someone else.

### UI
- Photo fills the screen; the map and year slider float over it. Map has four size states (CSS size-1 / size-2 / size-3 / size-collapsed, default 2, persisted as sessionStorage 'windowSize') so you can expand it to pin precisely then shrink it to study the photo.
- Result map colours are semantic and worth copying: true location = red marker #DB5049 titled 'Location'; your guess = black marker #000000 titled 'Your guess'. Connecting line is a PolylineOverlay, lineWidth 1.5, lineJoin round, dashed [8, 6], stroke #000000, animated by ramping strokeEnd from 0 to 1 over 400 ms via requestAnimationFrame. Longitudes are normalised by ±360 when the gap exceeds 180° so the line takes the short way round instead of across the whole map.
- Map is Apple MapKit JS 6.0.120 loaded from cdn.apple-mapkit.com with libraries map,annotations,overlays, light colour scheme, isRotationEnabled false, showsZoomControl false. Pin placement listens for MapKit's 'single-tap' and converts with convertPointOnPageToCoordinate. The provider is abstracted behind a store defaulting to 'apple', but only Apple is implemented in the web build. Firefox userAgents get _forcedRenderingMode:'SERVER' (raster tiles) as a compatibility workaround.
- Year control: '◀ 1962 ▶' with a range slider beneath. The nudge buttons hold-to-repeat — 400 ms initial delay, then one year every 80 ms. Value clamps to 1900–2026. You cannot type a year.
- Photo viewer is a custom background-image pan/zoom (not an <img> transform): wheel to zoom with no modifier key, mousedown-drag to pan, touchstart/touchmove for pinch and drag, zoom step 0.06, maxZoom 7× the fitted size.
- Keyboard: Space submits the guess when a pin exists (with a 'HIT SPACE' hint), and Space also advances from the result screen to the next round. Enter confirms in the year-picker modal, Escape closes it.
- Round result panel shows Round / Score in the header, then a Year / Location / Total three-row breakdown, the distance ('Your guess was 4.2 km' — or 'exact' under 1 m), a years-off sentence ('You got it spot on!' / 'You were 1 year off' / 'You were N years off'), the photo's Description and License, and tabs to switch between 'Photo' and 'Street view' (a Google Maps Street View embed of the true coordinates). Button reads 'Next Round' for rounds 1–4 and 'Final Score' on round 5.
- Timer pill is 22px semibold with font-variant-numeric: tabular-nums so the countdown doesn't jitter, min-width 100px, and gains 'urgent' styling at ≤5 s and 'expired' at 0.
- Final-score screen: total out of 50,000, a percentile block ('Top 12%' / 'Bottom 30%'), a distribution curve rendered as inline SVG, per-round rows with 'Show answers' / 'Hide answers', a countdown 'Xh Ym Zs until next daily', a friends/global leaderboard, a 'Compare with <username>' overlay that draws both players' pins and lines on one map and can focus a single round, and a tap-a-round photo detail modal (full-size image with a blurred backdrop, license, description, and a year badge). Stats panel says 'Not enough games played yet for stats' until you have enough games.
- Share modal is titled 'Share Results' with a Detailed / Emoji segmented switch, a <pre> live preview of the exact text, and a Copy button that flips to 'Copied!' for 2 seconds.
- Homepage is three cards — 'Play the daily challenge', 'Play a random game', 'Play games made by the community' — which switch to 'Daily in progress' / 'Game in progress' with a 'Continue' button when a game is unfinished. Cream background #f0ece4.
- Community/create flow: five slots in a strip with per-slot completion dots (states: complete when it has both year and GPS, incomplete otherwise), drag-and-drop photo upload with EXIF auto-extraction of DateTimeOriginal and GPS coordinates, a year picker (1900 to min(2030, current year); the standalone upload form allows from 1800), a description field, and an attribution choice including 'Anonymous'. There is a report/abuse modal for user content.
- There is an 'Advertisement' slot inside the game UI, and a modal apologising for privacy extensions blocking Apple Maps tiles ('DuckDuckGo Privacy Essentials and Disconnect are known to do this') shown once and remembered via localStorage key 'mapBlockedNoticeShown'.
- Useful storage keys to mirror in a clone: sessionStorage playArray, yearStorage (default '1962'), windowSize ('2'), dailyFlag, timerRoundOne…timerRoundFive, timerSetting, latestChallengeLink, challengeRA; localStorage tg_final_score, tg_progress_play, dailyReplay, mapBlockedNoticeShown.

### DATA NEEDED
- Per round, exactly this record (taken verbatim from the live daily payload): { No: "1151" (daily number), DailyId: uuid, ImageId: uuid, URL: image URL, Year: "1978" (string), Location: {lat: 35.690016, lng: 139.696427}, StreetView: a Google Maps Street View embed URL for the true location, Description: one-to-three-sentence caption, License: attribution string, Country: "Japan" }. A clone needs image + year + lat/lng + description + attribution at minimum; Country is used for grouping and StreetView for the 'see it today' tab.
- 5 photos per puzzle. A one-year archive is ~1,825 images; a satisfying launch pack for two people playing daily is 200–400 rounds (40–80 days) which is a few thousand curated images at most. At ~120–200 KB per WebP that is roughly 30–70 MB — too much to inline as data URIs, so ship a puzzles.json manifest plus an images/ folder and lazy-load, keeping the app itself a single HTML file.
- Legal warning for sourcing: TimeGuessr's own daily mixes LICENSED commercial stock with public-domain material. Today's five licenses were 'Nicola Kota / Alamy Stock Photo', 'Dr Julius Neubronner, Public domain, via Wikimedia Commons', 'Hackenberg-Photo-Cologne / Alamy Stock Photo', 'George A. Grant, Public domain, via Wikimedia Commons', '한국저작권위원회, CC BY 4.0, via Wikimedia Commons'. A clone must NOT scrape their Alamy images. Build the pack from freely licensed sources only.
- Recommended free sources, all of which carry both a date and coordinates or a geocodable place: Wikimedia Commons (categories intersecting a year with 'Photographs taken on' + coordinate templates), Library of Congress (esp. FSA/OWI 1935–45 and Detroit Publishing Co.), Flickr Commons, NYPL Digital Collections, Europeana, national archives (NARA, Nationaal Archief, State Library of NSW), and Geograph for the UK. Store the attribution string alongside each image and display it on reveal exactly as the original does.
- An offline world map that needs no tile server. Ship one equirectangular world raster (Natural Earth, downsampled) and project with x = (lng + 180)/360 · W, y = (90 − lat)/180 · H. That gives pin-drop, zoom and pan with zero network, plus haversine scoring in pure JS. Optionally bundle a small country-polygon GeoJSON (Natural Earth 1:110m, ~200 KB simplified) so you can name the country of a guess and support labels-off hard mode.
- Two-player state in localStorage: per-player per-puzzle {guessLat, guessLng, guessYear, yearScore, distScore, distMeters, timeTakenMs}, plus a head-to-head ledger of daily results for streaks and lifetime records.
- Optional: a per-photo difficulty tag and a decade/continent tag, so difficulty tuning and themed packs are possible without re-curating.

### WEAKNESSES
- Distance scoring is far too forgiving, and the numbers prove it. 500 km off still banks 4,000/5,000 (80%); 1,000 km still banks 3,500 (70%). An HN commenter's example — guessing Taiwan instead of South Korea, ~1,500 km — scores 2,750/5,000, i.e. you keep 55% of the location points for missing the country, the sea and the culture. The result is that scores compress: two players of quite different skill land within a few thousand points of each other, which is exactly the wrong property for a couple keeping score.
- Year scoring is simultaneously too harsh and too coarse, and players say so. Straight Dope regulars complain 'the time penalties are a little steep' — 6–7 years off already costs 1,600 points. Worse, it is a staircase with wide plateaus: 6 and 7 years off score identically, as do 8/9/10 and 11–15 and 16–20. Improving your guess from 15 years off to 11 years off earns you literally nothing. And 21 years off is a cliff-edge zero.
- The piecewise distance function is discontinuous at every breakpoint. 2,000,000 m scores 2500 but 2,000,001 m scores 1833 — one extra metre costs 667 points. Similar cliffs at 1 km (−16), 5 km (−20), 100 km (−100), 1000 km (−500), 3000 km (−600). It is not monotonically smooth, so a marginally better guess can score much worse.
- Heavy geographic bias toward the US and Western Europe. This is the single most consistent complaint across HN and forums: 'most of the images were from the US and Western Europe, and every single picture so far has been from a rich country'; one Straight Dope player estimates 'about 75% of the answers are in Europe'. Asia, Africa and South America are badly under-represented, which both narrows the learning value and lets players win by defaulting to Europe.
- Many rounds are recognition, not deduction. Players flag famous landmarks (Eiffel Tower, the Pyramids) and iconic photographs (Iwo Jima) that you either instantly know or don't — no reasoning involved. Some photos even contain legible dates, signage or place names, which trivialises them.
- The year slider is genuinely bad UX and has been for years. 'It took me 4 rounds to realise the time input was a slider, as you couldn't click to type.' It is 'not very obvious nor easy to use on mobile' and hitting an exact year on a phone-width slider is fiddly. Ironically the game's own photo-upload form DOES accept a typed year — the play surface still doesn't.
- Zooming into the photograph is undiscoverable. Plain mouse-scroll over the image zooms (no modifier), but nothing tells you, and HN commenters describe trying 'Open image in new tab' instead. On mobile, an accidental pinch zooms the page instead of the photo.
- Performance and reliability problems. 'The API is super slow and sometimes the images don't load.' Firefox is bad enough that the code force-enables MapKit's server-side raster rendering mode specifically for Firefox userAgents. Privacy extensions (uBlock Origin, DuckDuckGo Privacy Essentials, Disconnect, ClearURLs) block the Apple Maps tiles outright — the game ships a dedicated apology modal telling you to allowlist the site. Players also report the map and images became laggy after a redesign.
- No archive whatsoever. Miss a day and that puzzle is unreachable — there is no dated daily route in the app at all. For two people who want to catch up after a holiday, or replay a day one of them missed, this is a hard wall.
- Everything social is gated behind accounts. Leaderboards, lifetime stats, the percentile curve and the friend-comparison map all require signup plus mutual friending, which is heavy ceremony for two people who share a sofa.
- Ad-supported, with ad removal only as a mobile subscription (~$3.99/mo or ~$24.99/yr). An 'Advertisement' slot sits inside the game UI itself.
- Mobile app gripes: no way to quit a game mid-play without force-restarting, progress lost if the app is closed, map won't zoom far enough to distinguish small towns, and at least one report of the score breakdown showing the wrong years-off ('12 years off instead of 1'). Store-listing derived, so treat as medium confidence.
- Coarse feedback. Reviewers asked for a location-vs-year score split; the game now shows it per round, but there is still no calibration feedback — nothing tells you that you systematically guess too recent, or that you are strong on Europe and hopeless on Asia.
- Occasional unfair-by-construction rounds: repeated photos within one session, and locations like Pyongyang that are effectively indistinguishable from Seoul to a non-expert while carrying a full 5,000-point location swing.

### IMPROVEMENT IDEAS
- Fix the scoring curve so a better guess always scores better. Replace the discontinuous staircase with a smooth monotonic function — e.g. distance points = 5000 · exp(−d_km / k) with k ≈ 1400 for normal and k ≈ 500 for hard mode, and year points = 5000 · exp(−(Δyears/τ)^1.3) with τ ≈ 6. That kills the 667-point cliff at exactly 2,000 km, removes the dead plateaus where improving from 15 to 11 years off earns nothing, and — critically for a couple — decompresses scores so the better player actually wins. Keep the original formula available as a 'Classic scoring' toggle so their historical scores stay comparable.
- Score the day as ten head-to-head duels, not one number. Each round has two sub-contests (closer year, closer location), so a day ends 7–3 rather than 42,880 vs 42,120. Two people with near-identical totals still get a decisive winner, and 'you won the years, I won the map' is a much better conversation than a 760-point gap.
- Blind simultaneous submission with a real lock. On one shared device, hide each player's pin and year until both have locked in (store a hash of the first guess so a peek is impossible); on two devices, sync via a copy-pasteable code. Then reveal both on the same result map — her pin, his pin, the true location, two dashed lines in her/his colours — and both year guesses on one year axis with the truth marked. The original can do a version of this only after mutual account friending; a local clone should make it the default.
- Ship the full archive and make it the point of difference. Every past puzzle playable, plus 'catch-up mode' for days one of you missed, plus unlimited random practice from the same pack. Add a 'Rematch the ones we bombed' queue that resurfaces any round where their combined score was under, say, 12,000 — that is a genuinely better daily habit than a puzzle you can never see again.
- Real difficulty knobs the original has none of: era packs (pre-1950 only, or 1900–1939 where players say dating is hardest), continent packs, a labels-off map for hard mode, a 'no landmarks' filter to strip the recognition-not-deduction rounds, and a hard distance curve so 500 km no longer pays 80%. Let each partner set their own difficulty and normalise scores — she plays labels-off, he plays with a tighter distance curve, and the duel is still fair.
- Per-category handicap so the rivalry stays alive. Track separate year-Elo and location-Elo. If one of them is reliably better at dating photographs and the other at geography, apply a rolling handicap to each half independently. This is the single highest-value couple feature: it stops the stronger player winning 300 days running and the weaker one quietly quitting.
- Rivalry history worth looking at: lifetime record, current and longest win streak, biggest blowout, closest finish, and a 'nemesis' breakdown by decade and continent ('you are 4–19 against her on 1920s Europe'). Rendered as a small chart from localStorage, no server needed.
- Calibration coaching, which the original completely lacks. Show each player's year bias — 'you guess 4.2 years too recent on average, she guesses 1.1 too old' — and an accuracy-by-decade and accuracy-by-continent heat strip. Reuse the original's own honest log-scale accuracy metric, max(0, 100 − 6.58·(log10(max(d,50)/50))^1.6), for the location axis rather than the flattering points formula, so progress is visible even when scores plateau.
- Custom packs from their own photo library. Read EXIF DateTimeOriginal and GPS with a small in-browser parser (the original already bundles exifr for exactly this on its upload form) and auto-build a 'Us' pack from holiday photos, old family scans, and places they have lived. Guessing the year and location of a photo one of you took is a fundamentally better couple game than guessing stock photography, and it is impossible on the hosted original because uploads are public and moderated.
- Genuinely offline and instant. Equirectangular world raster plus a JS haversine means no MapKit, no tile requests, no Apple auth token, no privacy-extension apology modal, no Firefox raster fallback, no 'the API is super slow', no ads and no $24.99/yr. It works on a plane and on a phone with one bar, which is where a nightly ritual actually gets played.
- Fix both input controls. Year: a typed numeric input AND a slider AND ◀/▶ nudges AND arrow-key support, with a visible decade tick scale — the original's own upload form accepts typing while the game does not. Photo zoom: a visible zoom control and an on-first-play hint that scrolling zooms, since nobody discovers it. Map: allow zooming in far enough to distinguish small towns, which mobile reviewers say you currently cannot.
- A shared chess clock as an alternative to the original's five identical per-round timers. Give each player one total budget for the whole game (say 6 minutes) so they can spend 3 minutes on a hard round and 20 seconds on an obvious one — more interesting than a flat 90 seconds per round, and it produces a natural tiebreak: equal score, faster clock wins.
- Do not copy the timeout rule uncritically. In the original, running out of time still awards year points from wherever the slider happens to sit — and since it defaults to 1962, a timeout on a mid-century photo can bank 3,400–5,000 free points. Either default the slider to no-value and require an explicit pick, or zero both halves on timeout, but be deliberate about it.
- Couple-flavoured share text: one block showing both players' rows side by side plus the day's rubber-match tally, so pasting it into a group chat tells the whole story. Since the clone has the archive, also allow sharing a specific past round as a challenge ('bet you can't beat my 9,850 on #1043 round 3').


==========================================================================================
## Flagle (flagle.io) — the original, by Teuteuf Games   [confidence: high]
https://www.flagle.io/

### CORE LOOP
A national flag is hidden behind a 3-wide × 2-tall grid of six opaque tiles. You type a country or territory into an autocomplete box and submit. Every submission — including the winning one — flips exactly one tile face-up, revealing that sixth of the flag, and adds a feedback row showing your guess name in caps, the great-circle distance from your guess's centroid to the target's centroid (rounded km or mi), a single direction arrow emoji, and a proximity percentage. You get six guesses total, so tiles and guesses are consumed 1:1 and you never see the whole flag until the game is over. On a win the grid's 2px gaps collapse to 0 so the flag becomes seamless, confetti fires, a green pill reads "Flag: PANAMA", and Wikipedia/Google Maps links plus a Share button appear. Winning also unlocks a chain of five bonus rounds (Shape → Emblem → Capital flag → Neighbours → Population & Currency), each a multiple-choice picture/text quiz with its own small attempt budget, walked through via a "Next bonus round" button. Bonus rounds add emoji to your share string but do not change your 6-guess score. Lose and you get nothing but an all-red share grid.

### RULES
- Six guesses maximum. Counter renders as "GUESS 1 / 6". Verified in code: module exports Vc = 6 (tiles), Ox = 0, m = Vc - Ox = 6 (max guesses). guessDistribution is a 6-element array.
- The flag is split into exactly 6 tiles laid out as CSS `grid-template-columns: repeat(3, 1fr)` × `grid-template-rows: auto 1fr` — i.e. 3 columns × 2 rows. Tile indices 0,1,2 = top row left→right; 3,4,5 = bottom row.
- All 6 tiles start hidden. Status line before the first guess: "Make a guess to reveal the first tile".
- TILE REVEAL ORDER IS A SEEDED SHUFFLE, NOT SEQUENTIAL. The code computes shuffle([0,1,2,3,4,5], dayString) once and pops one index per guess. The shuffle is a seeded Fisher-Yates-ish draw: `const rng = seededPRNG(seed); const pool = [0..n-1]; for i in 0..n-1 { const k = Math.floor(rng()*pool.length); out.push(arr[pool[k]]); pool.splice(k,1) }`. Same order for every player on a given day, but unpredictable within the day. Observed on 2026-07-25: order 0 (top-left), 2 (top-right), 5 (bottom-right), 3 (bottom-left)…
- Every guess flips one tile, including the correct final guess. Verified in localStorage: the winning PANAMA entry carries `"tile":3`.
- Guesses must be a valid country or territory from the ISO 3166-1 list. countries.json contains exactly 249 entries. FAQ: "I use the ISO 3166-1 standard as reference for the country code list… Scotland is not a valid answer, because, according to this standard, this country is part of the United Kingdom."
- Input is a typed autocomplete; you must select a suggestion before the Guess button submits. There is no on-screen keyboard.
- Distance is measured centroid-to-centroid using the lat/lon in the country data, stored in metres and formatted with Intl.NumberFormat({style:'unit', unit:'kilometer'|'mile', maximumFractionDigits:0}). Miles conversion divides km by 1.6093. FAQ admits: "the computed distance between United States and Canada is around 2260km even if they have a common border" — chosen because it is easier and because "you can deduce information about the size of the target country".
- Direction is geolib's 16-point compass (`Math.round(bearing/22.5)` → N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW), then collapsed to 8 arrow emoji (see scoring for the exact table). Stored raw in localStorage as e.g. "ESE".
- A correct guess (distance === 0) shows 🎉 instead of an arrow, and 100%.
- Five bonus rounds, unlocked only by winning the flag round. FAQ: "To get bonus round 1 (shape), you simply need to guess the country correct." Round list from code, in order, with name/emoji/seed: Flag 🎉 (main), Shape 🗺️ 'shape', Emblem 🛡️ 'emblem', Capital flag ⛳ 'capital-flags', Neighbours 🧭 'border-flag', Population & Currency 👫🪙 'quiz'.
- Bonus round attempt budgets, observed live: Shape = 4 silhouette choices in a 2×2 grid, "You have 2 guesses remaining". Emblem = 8 shield choices, 3 guesses. Capital flag = 8 city-flag choices, 3 guesses. Neighbours = 8 country-flag choices, 3 guesses. Population & Currency = two separate 4-option questions with ONE attempt each (a wrong pick immediately highlights the right answer green, shakes the wrong one, and reveals the real figure, e.g. "Population: 4,337,768", "Currency: Balboa (PAB)").
- Population buckets are chosen per country-size class. Verified i18n keys: micro ("Less than 25" … "Over 2000"), small (<50 thousand / 50–500 thousand / 500k–1 million / 1+ million), medium (<3 million / 3–5 million / 5–8 million / 8+ million), large (<15 million / 15–25 million / 25–35 million / 35+ million), massive (<60 million / 60–80 million / 80–100 million / 100+ million).
- Currency round decoys come from the country data itself: pa.json has `currencyData: {code:'PAB', name:'Balboa', nameChoices:['Cordoba','Dollar','Peso']}`.
- Neighbours-round decoys also come from the country data: pa.json has `flags: ['co','cr','ni','hn','sv','jm','ec','pa']` — the 8 options, correct answer included.
- A new puzzle appears at 00:00 LOCAL DEVICE TIME, not UTC. FAQ: "A new game is available every day at 0:00 am, local time of your device!"
- The answer of the day is a static JSON file on a public CDN: `https://cdn-assets.teuteuf.fr/data/flagle/games/{YYYY}/{YYYY-MM-DD}.json` → `{"countryCode":"PA"}`. Verified: 2026-07-25 → PA, 2026-07-24 → JP.
- Country-selection rules (FAQ, verbatim): "Everyday, a country or territory is picked randomly!" plus (a) "it doesn't pick a country or territory of less than 5,000 km2 when one has already been picked less than 7 days ago", (b) "it doesn't pick a country that has already been picked less than 100 days ago", (c) "it doesn't pick a country from the same continent as yesterday, (only applies for Africa and Asia)".
- Settings offer: Unit of distance (km / miles), Theme, Language, and one "Difficulty modifiers" toggle — "Grayscale flag", implemented as `filter: grayscale(100%)` on the whole tile grid.
- Archive and Replay are paywalled: "Access to the game archive is an exclusive feature for Premium Members." Premium benefits listed: No ads, Replay games, Play the archive, Dedicated support. There is NO free unlimited/practice mode on flagle.io.
- Stats stored in localStorage under `stats`: {currentStreak, maxStreak, played, winCount, guessDistribution[6], previousDate}. Per-day guesses under `guesses` keyed `YYYY-MM-DD-D` where D is the day-of-week index from dayjs().day() (0=Sun…6=Sat) — e.g. "2026-07-25-6". Bonus rounds under `{dayString}-{seed}-bonus-round`, completed rounds under `flagle-rounds-completed`, current tab under `current-round`. Archive variants prefix with "archive". Stats only sync across devices if you create a Teuteuf Games account.

### SCORING
Score = number of guesses used (1–6), or X on a loss. Proximity percent, exact code: `const MAX = 2e7 /* 20,000,000 metres */; percent = Math.floor(Math.max(MAX - distanceMetres, 0) / MAX * 100)`. So it is a strictly LINEAR rescale of distance: 0 km → 100%, 10,000 km → 50%, ≥20,000 km → 0%. It carries no information the km figure doesn't. Direction arrows, exact mapping table from the bundle: {N:⬆️, NNE:↗️, NE:↗️, ENE:↗️, E:➡️, ESE:↘️, SE:↘️, SSE:↘️, S:⬇️, SSW:↙️, SW:↙️, WSW:↙️, W:⬅️, WNW:↖️, NW:↖️, NNW:↖️} — note this is NOT an even 8-way split: ➡️ covers only E (one 22.5° sector) and ⬆️ only N, while ↗️/↘️/↙️/↖️ each cover three sectors. `distance === 0` → 🎉. Per-guess 5-square proximity bar (used in the share of sibling games and in animations here), exact code: `const n = percent, greens = Math.floor(n/20), yellow = (n - 20*greens >= 10) ? 1 : 0; fill('🟩',0,greens); fill('🟨',greens,greens+yellow); fill(theme==='light' ? '⬜' : '⬛', greens+yellow)`. FAQ confirms: "🟩 = 20%, 🟨 = 10%". Puzzle number = `Math.floor(dayjs(date).diff(dayjs('2022-02-21'), 'day'))` — epoch 2022-02-21 = #0; verified 2026-07-25 = #1615. Bonus rounds contribute no points, only share emoji.

### DAILY
Daily only — no free unlimited or practice mode. New puzzle at 00:00 local device time (per the FAQ), keyed on a day string of `YYYY-MM-DD-{dayOfWeek}`. The answer is fetched from a prebuilt static file `cdn-assets.teuteuf.fr/data/flagle/games/{YYYY}/{YYYY-MM-DD}.json` containing just `{"countryCode":"XX"}`; the whole year is already published. Selection is described as random with three cooldown rules (no sub-5,000 km² territory within 7 days of another, no repeat within 100 days, no same continent as yesterday for Africa and Asia only). Puzzle number = days since 2022-02-21 (#1615 on 2026-07-25). Archive (all past days) and Replay are Premium-only; there is a special April Fools override baked in for 2026-04-01 that substitutes a fictional "World Government" (code WG).

### SHARE
Verified verbatim from the live share button's props on 2026-07-25:

#Flagle #1615 (25.07.2026) 4/6
🟥🟩🟥
🟩🟩🟥
🗺️🛡️🪙
https://www.flagle.io

Exact construction: `#Flagle #{puzzleNumber} ({DD.MM.YYYY}) {tries|X}/6\n{grid}{bonusEmoji}\nhttps://www.flagle.io`. Grid logic: start with `Array(6).fill('🟩')`, then for each guess EXCEPT the last set `grid[guess.tile] = '🟥'`, then append '\n' after indices where `(i+1) % 3 === 0` (i.e. after index 2 and index 5) and join. Result: 3 columns × 2 rows, red = a tile you burned on a wrong guess, green = a tile you never needed. So the count of red squares equals your wrong-guess count, and their positions reveal that day's shuffle order. On a loss the whole grid is replaced by the literal string '🟥🟥🟥\n🟥🟥🟥\n' and the score is 'X/6'. Bonus emoji line appends, in round order, only for rounds where at least one answer was CORRECT: 🗺️ Shape, 🛡️ Emblem, ⛳ Capital flag, 🧭 Neighbours, and for the quiz round 👫 (population) and/or 🪙 (currency) independently. In my run Shape+Emblem+currency were right and population was wrong, giving exactly 🗺️🛡️🪙. Because the squares grid always ends in '\n' and the bonus string may be empty, a bonus-free share has a blank line before the URL. Copy is via react-copy-to-clipboard (text/plain) with a toast; mobile uses navigator.share({title:'Flagle', text}) except on Firefox/Android.

### UI
- Vertical single-column layout, max ~600px wide, centred: header (Account · How to play · FLAGLE wordmark · Statistics) → 3×2 tile grid → status line → autocomplete input + green "Guess" button → six guess rows → ads/social icons → footer with "🇺🇦 Donate to Ukraine ❤️" on the stats page.
- Tile grid: `display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:auto 1fr; grid-gap:2px; border:2px solid #dddddd; width:fit-content`. The gap animates to 0px when the game ends so the six pieces fuse into one flag — a small touch that is worth copying.
- Each tile is a 3D card flip: `transition: transform 1s` with `rotateY(180deg)`, `backface-visibility:hidden`, and a staggered `transition-delay`. The cover face is `#dddddd` (light) / `#121212` (dark) and is explicitly z-indexed above the flag with the comment "Prevent Safari tab preview from spoiling flag".
- Guess row = four rounded pills in a row: COUNTRY NAME (uppercase), distance ("5,016km"), the direction arrow as a Twemoji IMAGE (not a font glyph — twemoji 12.0.4 72×72 PNG), and the percentage.
- Colour is barely used as signal in the main game: green is only chrome (buttons, the "Flag: PANAMA" answer pill). The strong colour semantics live in the bonus rounds — correct option turns solid green `#289535` with white text, the wrong pick gets `animate-shake` and red, and unpicked options drop to `opacity-70`.
- Win animation: canvas-confetti burst over the grid plus a floating "🎉 Panama 🎉" toast. Each completed bonus round stacks another toast, which piles up untidily.
- Bonus-round shells reuse a carousel/zoom-out widget ("Zoom out icon / Previous icon / Next icon") over a 2×2 or 2×4 grid of image choices; the Shape round is a 2×2 of black silhouettes.
- Full dark mode (`dark:bg-[#121212]`, `dark:invert` on some icons); the share-square filler emoji switches between ⬜ and ⬛ based on `prefers-color-scheme`.
- Grayscale difficulty modifier is a single checkbox in Settings that applies `filter: grayscale(100%)` to the entire tile grid — cheap to implement, and worth generalising to blur/mirror/rotate in a clone.
- No on-screen keyboard and no keyboard-only submit path: pressing Enter with text typed does not submit — you must click/tap a suggestion from the dropdown, then Guess. Mildly annoying on desktop, worse on mobile.
- While the game is in progress the guess rows render newest-at-top; once solved they re-render oldest-at-top.

### DATA NEEDED
- Country list: 249 ISO 3166-1 entries with {code, name, localised names map, latitude, longitude}. Real file is ~60–100 KB of JSON; the minimum for the main game (code, name, lat, lon) is ~15–25 KB.
- 249 flag images. Teuteuf serves SVG at `cdn-assets.teuteuf.fr/data/common/flags/{iso2}.svg`. An optimised public-domain SVG set is roughly 1–3 MB total; a single-file clone should either inline them as data URIs, ship one sprite sheet PNG/WebP (~200–600 KB at 300×200 per flag), or draw the simple ones in CSS.
- Per-country extras for bonus rounds: continent code, borders list, population, area in km² (`size`), currencyData {code, name, nameChoices[3]}, and a `flags` decoy array of 8 similar/nearby codes. All present in `common/countries/{code}.json` (~1–2 KB per country, so ~300–500 KB for all 249).
- 249 country-shape silhouette SVGs (`common/country-shapes/{iso2}.svg`) for the Shape round — these are the biggest assets; simplified outlines can be ~2–10 KB each.
- 249 national emblem/shield SVGs (`common/shields/{iso2}.svg`) for the Emblem round — heraldry SVGs are large (10–80 KB each); a clone is better off with small PNGs.
- Capital-city flag SVGs keyed by numeric city id (`common/city-flags/{id}.svg`) plus `common/cities.json` mapping city→country→capital flag. Only ~200 capitals have usable city flags, so this round needs a curated subset.
- A date→country schedule, or better a deterministic generator: seeded permutation of the 249 codes honouring the three cooldown rules (no <5,000 km² territory within 7 days of another, no repeat within 100 days, no same-continent-as-yesterday for Africa/Asia). Generating offline avoids any network dependency and guarantees both players get the same flag.
- Emoji assets: the site pulls Twemoji (12.0.4 PNG for the guess-row arrows, 14.0.2 SVG elsewhere) from cdnjs. An offline clone must use native emoji glyphs or inline a handful of arrow SVGs.

### WEAKNESSES
- The archive and replay are paywalled behind Teuteuf Premium (search results indicate a ~$1.99/month or ~$23.88/year basic tier and a ~$3.99/month all-games tier — price not confirmed on-site). Miss a day and it is gone unless you pay.
- The entire year of answers is published in advance on a public CDN. I confirmed HTTP 200 for 2026-07-26, 2026-08-25 and 2026-12-31 at `flagle/games/2026/{date}.json` without reading the values. Anyone can look up tomorrow's flag in one fetch, which quietly ruins competitive comparison.
- The statistics are demonstrably wrong. After a single, clean 4-guess win the Statistics page read Played 2, Win % 50, Current Streak 0, and put the tally in the "3" row of the guess distribution. localStorage held `{played:2, winCount:1, guessDistribution:[0,0,1,0,0,0]}` with `previousDate:"2026-07-25T00:00:00.000-04:00"`. There is a correct recompute function in the bundle (it derives everything from the guesses history and would write dist[3]) alongside a buggy incremental writer whose output is what the UI shows.
- Stats and streaks live in per-browser localStorage. Clearing site data, using a second device, or a private window loses everything unless you register a Teuteuf account.
- The three feedback columns carry only two facts. Proximity % = floor((20,000km − distance)/20,000km × 100) is a pure linear restatement of the km figure, so one third of the feedback UI is decorative.
- Centroid-to-centroid distance is actively misleading for large or adjacent countries — the FAQ has to pre-empt the complaint with the US↔Canada 2,260 km example. Guessing a neighbour of a huge country can look "far".
- Random tile order makes daily difficulty wildly uneven. On a flag like Panama, drawing the tile containing the star effectively ends the puzzle; drawing three tiles of flat colour tells you nothing. Two players' skill is not what separates a 2/6 from a 5/6 day.
- The 249-entry ISO list includes territories most players have never seen, while sub-national flags people DO know (Scotland, Wales, Texas) are rejected as invalid.
- Ads are intrusive. A dismissable promo card covered the tile grid on load, banner ads sit above and inside the game, and during a single test session an ad opened an unrequested pop-under tab to an unrelated site (oec.world).
- The five bonus rounds — the best content in the game — are locked behind winning the main round. Lose the flag and you see none of them. They are also one-and-done, contribute nothing to the score, and one of them is effectively an ad ("Sponsored by WORLDLE / Like this round? Try WORLDLE").
- Rollover is at device-local midnight, so two people in different timezones are on different puzzles at the same moment, and changing your device clock/timezone rotates the puzzle.
- The winning guess consumes a tile, so you never see the complete flag until after you have already answered — the reveal you "earned" is spent on the answer.
- The share grid says which tiles you burned but nothing about how close you were, and because tile order is shared across all players it leaks that day's order to anyone who sees your post.
- Exactly one difficulty modifier exists (Grayscale flag). No tile-count, guess-count, pool-size or blur options; no practice mode.
- Small UI inconsistency: while playing, the guess list renders newest-first (JAPAN above ICELAND above CHILE); after the win it re-renders oldest-first. Confusing when you are scanning for your last clue.

### IMPROVEMENT IDEAS
- Build a true two-player daily duel into the single file: two named profiles (localStorage keys `p1`/`p2`), a blind "pass the device" curtain between turns so player 2 cannot see player 1's revealed tiles or feedback rows, and a joint results card at the end showing both grids side by side. This is the single biggest thing the original cannot do.
- Give the duel richer tiebreakers than "who used fewer guesses", which ties constantly. Because both players see the identical seeded tile order, these are perfectly fair: (1) guesses used, (2) total km travelled across all guesses (sum of distances — rewards efficient triangulation), (3) best first-guess distance, (4) bonus-round emoji count. Show all four so a 4/6 with a brilliant opening guess can still win the day.
- Add a combined "couple streak" that only advances when BOTH solve it, alongside individual streaks. Optionally a "rescue" token: whoever finishes first can donate one extra tile (not an extra guess) to the partner, at the cost of the joint bonus.
- Ship the whole archive free and offline — every date from your chosen epoch to today, plus "this day last year", plus a random-date shuffle. The original charges a subscription for exactly this and it costs a clone nothing.
- Generate the schedule deterministically offline instead of fetching a per-date file: seeded permutation of the 249 codes with the same three cooldown rules, and a single fixed rollover the couple agrees on (e.g. 04:00 in THEIR timezone, so a late-night session still counts as yesterday) rather than device-local midnight. Guarantees both devices always agree.
- Make difficulty tunable and still comparable, because the seed is shared: pool tier (UN members only / +territories / all 249), tile count (4 / 6 / 9 / 12), guess count (4 / 6 / 8), and stackable modifiers — grayscale, blur, mirrored, rotated, emblem-blanked, and "colours only" (each tile flattened to its dominant colours). Let both players commit to the same modifier set for the day so results stay meaningful.
- Fix the redundant feedback. Drop the linear proximity % and put something additive in that column: same-continent ✅/❌, a hotter/colder arrow versus your own previous guess, or population/area comparison chevrons (↑↑ / ↑ / ↓). Offer a "pure vexillology" mode with NO geography feedback at all — tiles only — which is a genuinely different and harder game the original cannot offer.
- Replace random tile order with an information-ranked reveal: score each tile offline by unique-colour count, edge density and whether it contains an emblem/charge, then reveal least-informative first so the difficulty curve is monotonic. Keep "classic random" as an option, and label which mode the day used in the share text so the couple isn't comparing across modes.
- Recompute all statistics from the stored history on every render (never increment counters), so the numbers are always right. Then add what the original lacks: a per-continent accuracy heatmap per player, so the couple can see at a glance that one of them is weak on Oceania and the other on West Africa — instant friendly rivalry material.
- Keep the bonus rounds available even after a loss, make them worth duel points, and let a player who lost the flag round still play them for partial credit. Add a fourth-wall-friendly one the original doesn't have: "whose guess was closer" head-to-head on capital, population and area.
- Add spaced-repetition drill built from the couple's own history: any flag either player got wrong resurfaces as an unlimited practice deck after the daily is done. Only possible because a clone holds the entire dataset locally.
- Design the share text for the way they actually compare — a single copy button that emits BOTH players' grids in one block with the duel winner marked, plus a spoiler-free variant. Also add an in-app history view so they don't need to paste anything at all when they're on the same sofa.
- Handle the spoiler problem honestly: derive the answer at runtime from a hash of the date and a seed rather than shipping a plain date→country table, and provide an explicit "reveal answer" button so peeking is a deliberate act rather than one devtools query.
- Make it genuinely offline and low-RAM: one HTML file, all 249 flags as a single sprite sheet or inlined optimised SVGs, and tiles rendered as CSS `background-position` crops of ONE flag image rather than six separate `<img>` elements. Add localStorage export/import (a downloadable JSON of both profiles) so a browser wipe isn't fatal.
- Add custom packs so the couple can make their own: "flags we always confuse", "places we've been", "Europe only", or a hand-picked 30-flag pack as a birthday puzzle set. Pack = a JSON array of ISO codes pasted into a settings box.


==========================================================================================
## Flagle Explorer (flagle.fun)   [confidence: high]
https://flagle.fun/

### CORE LOOP
Structurally the same tile game as flagle.io, with one important difference: you start with one tile already revealed for free. A 3×2 grid of six tiles hides a flag; one random tile is face-up before you guess anything. You pick a region from a react-select combobox and hit Guess. Each guess adds a compact result row — name · distance in whole km · 8-way arrow emoji · proximity to one decimal place — and flips one more tile. Six attempts, so by your sixth guess the entire flag is visible (1 free + 5 revealed), which makes the endgame much softer than the original. Two separate scenes: the homepage is Unlimited (refresh for a brand-new random puzzle, instant retries allowed) and /daily is the shared daily challenge with a puzzle number and a countdown to the next round.

### RULES
- Six attempts. The site states it twice: "You have 6 attempts to identify the correct region" and "In the daily challenge, you have six attempts". The UI lists slots 1/6 through 6/6.
- 3 columns × 2 rows = 6 tiles, same as the original. Observed live: exactly one tile (bottom-left) was already revealed before any guess, and the second reveal was top-left — so reveal order is shuffled here too.
- Feedback per guess, observed verbatim: "Chile | 5517 km ⬆️ | 72.4%". Distance is whole km, direction is one of eight arrow emoji, proximity is shown to one decimal place.
- Arrow-to-bearing mapping is documented explicitly on the site as an EVEN 8-way split (unlike flagle.io): ⬆️ North 337.5°–22.5°, ↗️ Northeast 22.5°–67.5°, ➡️ East 67.5°–112.5°, ↘️ Southeast 112.5°–157.5°, ⬇️ South 157.5°–202.5°, ↙️ Southwest 202.5°–247.5°, ⬅️ West 247.5°–292.5°, ↖️ Northwest 292.5°–337.5°, and "🟢 indicates you've hit the exact location".
- Daily mode resets at UTC 00:00 (stated repeatedly), unlike flagle.io's local-midnight rollover. The daily page shows a puzzle number and a live countdown — observed "Flagle Explorer Daily Challenge #565" and "Next Round: 5h 8m" on 2026-07-25.
- Daily is one attempt per day: "You have only one chance per day. Make your six guesses count, as you cannot retry until tomorrow's challenge." Progress is saved so you can resume if interrupted.
- Unlimited mode: "Start a new round anytime by refreshing the page" and "Failed a challenge? Try again immediately. Note that wins from retried challenges won't count towards your statistics."
- Stats (total wins, current streak, best streak) are stored in browser localStorage only: "Flagle Explorer securely stores your game statistics locally in your browser… These statistics persist until you choose to clear your browser cache." No account, no server.
- Open source at github.com/horushe93/flagle-explorer. Built with Next.js (app router, `_next/static/chunks`).

### SCORING
Score is guesses used out of 6; no points system. Proximity uses the SAME formula as flagle.io — a linear rescale against a 20,000 km maximum — just printed with one decimal. Verified numerically: a guess at 5,517 km displayed 72.4%, and (20000 − 5517) / 20000 = 0.72415 → 72.4%. So percent = (20000 − km) / 20000 × 100, floored/rounded to 1 dp, 0% at ≥20,000 km and 100% at 0 km.

### DAILY
Both modes exist as separate pages. Unlimited (the homepage): a fresh random puzzle on every page refresh, instant retries, wins from retries excluded from stats. Daily (/daily): one puzzle for everyone, resets at UTC 00:00, numbered (#565 on 2026-07-25 → epoch roughly 2025-01-07), with a countdown timer and resume-on-reload. No archive of past dailies.

### SHARE
Not verified — no emoji-grid share text exists in the shipped JavaScript (I searched every loaded chunk for 🟩/🟥/🟨 and for '#Flagle'-style templates and found none). There is a generic share icon in the header, which appears to be plain social/link sharing of the site rather than a result string. Treat any claim of a Wordle-style grid here as unsupported.

### UI
- Dark-first design: near-black background with a purple/violet gradient wordmark and a soft radial glow behind the title. Distinctly moodier than the original's white card.
- Same 3×2 tile grid, light-grey (#d5d8dc-ish) covers, thin dividers, no flip animation observed — tiles simply appear.
- Result rows are one dense line each — a small coloured dot, the region name, then `5517 km ⬆️` and the percentage in mint green, separated by thin vertical rules. Compact and readable; nicer than the original's four fat pills.
- Empty guess slots are pre-rendered as "2 / 6", "3 / 6" … which makes the remaining budget obvious at a glance — a genuinely good touch worth copying.
- Input is a react-select combobox ("Type or Select …") with a dropdown caret, so you can browse the whole region list as well as type. Enter alone does not submit; you must pick the option then press Guess.
- Header carries Services · Daily · Blog · a language switcher (English) · a help "?" · a share icon.

### DATA NEEDED
- 249-ish region list with centroid lat/lon and display names (same shape as the original's countries.json) — the game calls them "regions", so the pool may include territories.
- One flag image per region, croppable into 6 tiles.
- A daily schedule or a date-seeded index into the region list (the daily is numbered — #565 on 2026-07-25, implying an epoch around early January 2025).
- Nothing else — there are no bonus rounds, no shapes, no emblems, no capitals. This is the leanest of the tile games to clone.

### WEAKNESSES
- The page is dominated by SEO filler. The phrase "Flagle Explorer" appears dozens of times in near-identical marketing paragraphs, and the actual rules are buried below three screens of "Exclusive Features That Make Flagle Explorer Outstanding"-style copy.
- No Wordle-style emoji share grid could be found — I grepped all 15 loaded JS chunks for 🟩/🟥/🟨 and the share-text patterns and got zero hits. The site promises "one-click sharing" and "Challenge friends to beat your score" but there is no compact, spoiler-free result string to compare with a partner. This is the single worst thing about it for two people playing together.
- It advertises a "global leaderboard", "global rankings" and "Compare your progress with other Flagle Explorer players worldwide" while simultaneously stating all stats are local-only. There is no server-side comparison; the claim is marketing.
- Unlimited mode does not appear to persist anything — after a guess, localStorage held only Google ad keys and no game state. Refreshing to get a new puzzle also throws away the current one with no confirmation.
- The free starting tile front-loads the reveal curve: by guess 6 the whole flag is visible, so late guesses become trivial and the game rarely ends in a genuine near-miss.
- Showing proximity to 0.1% implies precision that isn't there — it is a linear rescale of a centroid-to-centroid distance, so the decimal is noise.
- No archive of past dailies, no replay, no difficulty settings, no grayscale/blur/hide modes, no unit switch.
- "Wins from retried challenges won't count" is silently enforced, so the stats can diverge from what the player believes they achieved.
- Cross-promo cards for unrelated games (Pips, Poople) and an "Embed for Free" block sit directly between the game and the instructions.

### IMPROVEMENT IDEAS
- The obvious fix first: give it a real share string. A 6-square emoji grid plus a per-guess proximity bar (the ⬜🟨🟩 5-square scheme its cousins use) would let two people compare a day's solve in one glance.
- Steal its best idea — the free opening tile — but make it a toggle, and let the couple choose "1 free tile (gentle)" vs "0 free tiles (classic)" vs "start with the WORST tile revealed" so the difficulty is a deliberate joint choice rather than a fixed design.
- Its even 8-way arrow split (each arrow = one 45° sector) is genuinely better than flagle.io's lopsided table where ➡️ covers 22.5° and ↗️ covers 67.5°. Adopt the even split, and document the sectors in-game so both players can reason about it identically.
- Keep the UTC rollover idea but make it configurable, and add a visible countdown to the next puzzle plus a puzzle number — a shared number is what lets a couple say "did you do #565 yet?" without spoiling anything.
- Build the unlimited mode as a proper session that persists and can be resumed, with a "new puzzle" button rather than a page refresh, and a separate practice-stats ledger so practice never pollutes the daily record.
- Add the free archive it lacks: because a clone owns the schedule generator, every past daily is playable, and the couple can race an old one head-to-head when they want a second round in an evening.
- Drop the fake decimal on proximity and use the space for something real — same-continent yes/no, or a hotter/colder marker versus the player's own previous guess.
- Add head-to-head: because Explorer's puzzles are cheap (no bonus assets), a clone can run a "best of five random flags" duel in one sitting, with a shared seed so both players get the identical five flags and the identical tile orders.


==========================================================================================
## Flagdle (flagdle.org)   [confidence: high]
https://www.flagdle.org/

### CORE LOOP
A different premise from the tile games: the target flag is shown to you in full, and the puzzle is NAMING it. Six guess rows sit under a small flag image. You type a country or territory; each guess is scored by how visually similar YOUR guessed country's flag is to the target's, expressed as a percentage and as a five-square proximity bar. So the similarity number is a hint for players who can't place the flag — 'you're close on colours but wrong on layout'. Two optional difficulty modes invert the premise: hide-image mode 🙈 conceals the flag entirely so the similarity score becomes your only information, and rotation mode 🌀 shows the flag rotated. It is a fork of the Worldle codebase (geolib is still bundled) and explicitly credits Worldle and Wordle.

### RULES
- Six guesses. How-to-play verbatim: "Guess the FLAGDLE in 6 guesses. Each guess must be a valid country or territory."
- Feedback verbatim: "After each guess, you will see the flag and how similar that flag is to the flag you are trying to guess."
- The target flag is displayed by default — verified: before any guess the page rendered a Twemoji flag image (`twemoji/.../1f1e7-1f1e6.svg` = 🇧🇦 Bosnia and Herzegovina). The existence of an opt-in `hideImageMode` confirms visible-by-default.
- Two difficulty modifiers exist as share-string flags in the code: `hideImageMode` → appends " 🙈" to the share, `rotationMode` → appends " 🌀". Only one is appended (hide takes precedence).
- Displayed similarity is NOT the raw similarity. Exact code: `function pct(d){ const t = Math.max(100-d, 0); return Math.round(Math.log(100/t)*t + t) }` where `d` is an internal distance and `t = 100 - d` is the raw similarity. So displayed = round(ln(100/s)·s + s) for raw similarity s. This reconciles the site's own confusing examples: the badge reads "45% similar" while the text says "16% similar" — and pct with s=16 gives ln(6.25)·16+16 = 45.3 → 45. Second example, text says 62% and badge says 92%: ln(100/62)·62+62 = 91.6 → 92. Confirmed exactly.
- A correct guess has internal distance 0 → raw similarity 100 → displayed 100%.
- Daily: "a new FLAGDLE will be available every day!" There is a settings gear and a trophy/stats button in the header.
- Guess input is a free-text box, placeholder "Type country or territory", with a separate GUESS button.
- Bundle still contains geolib (getDistance, getCompassDirection, getRoughCompassDirection with the N/E/S/W collapse) — leftovers from the Worldle fork, not used for flag similarity.

### SCORING
Score = guesses used out of 6, or X on a loss, plus your BEST similarity in parentheses. Exact share-string code: `puzzleNumber = floor(days between (2022-01-21 minus 33 days) and dayString)` — i.e. numbering epoch is effectively 2021-12-19. `best = Math.min(...guesses.map(g => g.distance))` (lowest distance = highest similarity). Per-guess five-square bar, identical scheme to Worldle/Flagle: `greens = floor(pct/20); yellow = (pct - 20*greens >= 10) ? 1 : 0; fill('🟩',0,greens); fill('🟨',greens,greens+yellow); fill(theme==='light' ? '⬜' : '⬛', rest)` — so 🟩 = 20 percentage points, 🟨 = 10, filler squares are theme-dependent. Note an edge-case bug: at raw similarity 0 the formula computes Math.log(100/0)*0 = Infinity*0 = NaN.

### DAILY
Daily. Header has info, trophy (stats) and gear (settings) buttons. Puzzle number = days since 2021-12-19 (computed as 2022-01-21 minus 33 days). No archive or unlimited mode was found.

### SHARE
Exact code, verbatim from the bundle:

`#Flagdle #{n} {tries|X}/6 ({bestPct}%){modeSuffix}` then one line per guess, each line being five squares, then `https://www.flagdle.org` — all joined with newlines. Example shape:

#Flagdle #1678 3/6 (100%)
🟩⬜⬜⬜⬜
🟩🟩🟩🟨⬜
🟩🟩🟩🟩🟩
https://www.flagdle.org

where modeSuffix is " 🙈" in hide-image mode, " 🌀" in rotation mode, else empty; bestPct is the best (highest) displayed similarity across all guesses; tries is the guess count on a win and the literal "X" on a loss; each row is `floor(pct/20)` × 🟩 then one 🟨 if the remainder ≥ 10, padded with ⬜ (light theme) or ⬛ (dark). Copy is via react-copy-to-clipboard as text/plain with a "copy" toast.

### UI
- Very plain white layout, Google-coloured FLAGDLE wordmark with a flag glyph. Header: ⓘ info · wordmark · 🏆 stats · ⚙️ settings.
- The target flag renders small (~180×110) at the TOP LEFT of the play area, not centred — an odd, slightly broken-looking alignment.
- Six empty light-grey guess rows are pre-rendered below the flag so the budget is visible, then the text input, then a full-width GUESS button.
- In-game colour semantics are carried entirely by the five-square proximity bar (🟩 20 points each, 🟨 10, ⬜/⬛ filler) plus a "NN% similar" badge per row.
- Light/dark themes swap the share filler square between ⬜ and ⬛.
- Uses Twemoji 12.0.4 SVGs for the flag images and SVGRepo icons for the header buttons.
- A green marquee-style promo line for the author's other game sits inside the game column, between the input and the Guess button, which is easy to mistake for game feedback.

### DATA NEEDED
- A flag image per country/territory. Flagdle uses Twemoji SVGs addressed by regional-indicator codepoints (e.g. 1f1e7-1f1e6 for BA), which limits it to ISO region flags and gives stylised rather than accurate flag art.
- A pairwise flag-similarity source. This is the one genuinely non-trivial dataset: for 249 flags a full matrix is 249² = 62,001 values, ~62 KB as uint8 or ~31 KB exploiting symmetry. How Flagdle computes it is NOT visible in the bundle — a clone would generate it offline (rasterise each flag to e.g. 32×21, quantise colours, then score colour-histogram overlap plus per-cell colour match) and ship the matrix, or compute it at runtime from a small quantised bitmap per flag.
- A valid-answer name list with aliases for the free-text input.
- A date→flag schedule (numbered from 2021-12-19 in the original).

### WEAKNESSES
- Showing the target flag makes the core task trivial for any flag the player recognises, and the similarity hint is then pure decoration. The interesting version of the game (hide-image mode) is buried in settings rather than being the default.
- The displayed percentage is a boosted transform of the real similarity, so "45% similar" actually means 16% similar. The site's own how-to-play prints both numbers side by side without explaining the discrepancy, which reads as a bug even though it is intentional.
- The transform produces NaN at raw similarity 0 (Math.log(100/0) × 0).
- Similarity is a single scalar: it tells you how wrong you were but never WHERE — no indication whether you missed on colour, layout or charge. Flaggle's positional mask is strictly more informative.
- Twemoji flag art is stylised and only covers ISO regional-indicator flags, so the visual detail players actually reason about (exact shades, emblem detail) is lost, and territories outside that set can't be represented at all.
- Heavy cross-promotion for the author's other game (Warbl) — a green scrolling banner sits inside the game column between the input and the Guess button, plus a large logo block below the game.
- Stats live behind a trophy icon in localStorage; no account, no cross-device sync, no archive of past days observed.
- Bundle is ~1.76 MB of minified JS for what is fundamentally a lookup-table game — it carries a full geo library it no longer needs.

### IMPROVEMENT IDEAS
- Make hide-image the DEFAULT and the shown-flag version the easy mode. The similarity mechanic only has teeth when the flag is hidden, and a couple wants a puzzle, not a recall test.
- Replace the scalar similarity with a positional mask (Flaggle's idea) or at least decompose it into three sub-scores — colour set, layout/geometry, charge/emblem — each with its own bar. Three independent signals make deduction possible and give partners something to argue about.
- Show the honest percentage, or show both ("16% raw / 45% score") with a one-line explanation. A clone playing head-to-head cannot afford a feedback number that means something other than what it says.
- Its share format is the best of the four for couples: a five-square bar PER GUESS shows the whole shape of the solve, not just the count. Adopt that and add the partner's rows underneath in a duel block.
- Precompute the similarity matrix offline and ship it — then add a "confusion pack" mode built from the pairs with the highest similarity (Chad/Romania, Indonesia/Monaco, Netherlands/Luxembourg, Ireland/Côte d'Ivoire), which is the flag content people genuinely want to practise and which the original can't offer.
- Add rotation, mirroring and colour-blind-simulation as first-class stackable modifiers (rotation mode already exists, unheralded), with the modifier set recorded in the share text so the couple only compares like with like.
- Give it an archive and an unlimited mode, both free, and let one partner hand-pick a flag to challenge the other with (a "gauntlet" they set for each other) — a two-player mode no daily site offers.


==========================================================================================
## Flaggle (flaggle.net, by Duc Vu)   [confidence: medium]
https://www.flaggle.net/

### CORE LOOP
The most mechanically interesting of the family and the one worth stealing from. Nothing is shown at the start. You guess a country or territory, and instead of a distance or a scalar similarity, the game re-renders YOUR guess's flag as a mask: every pixel region where your flag has the correct colour in that position turns green, everything else goes black. So a guess of Vietnam (red field, yellow star) against Burkina Faso comes back as a green top half with a green star outline over a black bottom half — telling you the answer is red on top and has a yellow star in the middle. To make this tractable every flag is quantised to a shared 10-colour palette. There is no guess limit; your score is simply how many guesses you needed, and a GIVE UP button ends the round. A DAILY MODE toggle switches between the flag-of-the-day and free play.

### RULES
- No fixed guess limit. How-to-play verbatim: "Your goal is to guess a country or territory's flag within as few tries as possible." There is a GIVE UP button with a confirm dialog, which is the only fail state.
- Feedback verbatim: "After each guess, you will be shown a similarity flag that displays which portion of your guess shares the same colour as the answer."
- Colour semantics verbatim: "GREEN means the correct colour is in this location." Non-matching regions render black.
- The palette is deliberately reduced: "To make guessing more feasible, the palette has been reduced to 10 common colours (below). Apologies if some flags become inaccurate as a result." The ten swatches shown are red, dark blue, green, black, purple, yellow, white, brown, orange and light blue.
- Worked example from the how-to-play, verbatim: "In this example, the guessed flag is Vietnam's. Judging by the result (middle), the answer is red on the top half, and also has a yellow star in the middle, albeit a smaller one. The answer is Burkina Faso."
- A DAILY MODE toggle exists alongside free play.
- Flag pool is crowdsourced and admittedly partial: "List of flags has been compiled with suggestions and additions from players. This list may be used as reference, albeit incomplete."
- Feedback masks and answer flags are served as pre-rendered server images (`/static/images/flags/{code}-f.png` for the answer; result masks come back as `<img>` elements with class `result-flag result-progress`), so the comparison is done server-side, not in the browser.
- Score is the number of guesses, surfaced in the UI as "pts" (lower is better).
- Runs on Raptive ads with a consent/"Do not sell or share my personal information" prompt; the game itself is a small hand-written app (a single ~7 KB `interaction.js`), not a framework build.

### SCORING
Score = total number of guesses, labelled "N pts" (lower is better). There is no distance, no bearing and no percentage anywhere — all information comes from the positional colour mask. Exact share code: on a win it emits one ⬛ per guess EXCEPT the last, then 🟩, then ` ${guesses.length} pts`; on give-up it emits one ⬛ per guess, then 🟥, then ` gave up...`.

### DAILY
Has a DAILY MODE toggle for a flag-of-the-day plus free/unlimited play; the underlying selection method for the daily flag was not verified. No archive observed.

### SHARE
Exact construction from `interaction.js`:

`#Flaggle {D} {Mon}\n\n` + (⬛ repeated guesses.length−1) + `🟩` + ` ${guesses.length} pts` + `\n\nhttps://ducc.pythonanywhere.com/flaggle/`

so a 4-guess win reads:

#Flaggle 26 Jul

⬛⬛⬛🟩 4 pts

https://ducc.pythonanywhere.com/flaggle/

On give-up it is (⬛ repeated guesses.length) + `🟥` + ` gave up...` in place of the win line. Two defects: the date uses `today.getDate() + 1` so it prints tomorrow's day-of-month, and the URL is the author's old pythonanywhere host, not flaggle.net. Copy is `navigator.clipboard.writeText` with a blocking `window.alert("Copied!")` and a fallback alert telling the user to screenshot instead.

### UI
- Serif-heavy, almost editorial styling — a HOW TO PLAY modal in a large serif face over a light grey card, quite unlike the other three games' sans-serif Wordle look.
- The 10-colour palette is displayed as a row of coloured dots inside the instructions, which is a clear and copyable way to teach a constrained-palette mechanic.
- The worked example is three flags side by side — your guess, the returned mask, the answer — which explains the mechanic in one glance far better than any prose.
- Feedback masks accumulate as a vertical stack of small flag images (class `result-flag result-progress`), so your solve history is a visual column of increasingly green masks. This is the most attractive progress display of the four games.
- Play UI is minimal: a DAILY MODE toggle, the FLAGGLE wordmark, a "Search for a flag..." box, GUESS and GIVE UP buttons.
- Win and lose states are separate modal overlays (`win-menu`, `lose-menu`) with the answer flag and score; sharing copies to clipboard behind a `window.alert`, which feels dated.
- No keyboard, no dark mode observed. Raptive consent footer pinned at the bottom.

### DATA NEEDED
- A flag bitmap per country/territory, quantised to a fixed 10-colour palette at a fixed resolution. To do the masking client-side (which an offline clone must), you need those quantised bitmaps locally: at 60×40 = 2,400 cells per flag × 249 flags ≈ 600 KB raw, ~300 KB at 4 bits per cell, and typically 50–100 KB run-length encoded since flags are mostly large flat regions.
- The 10-colour palette definition plus a nearest-colour mapping for every distinct colour in the source flag set.
- A name/alias list for the search box.
- A daily schedule if daily mode is wanted.
- Notably NO geographic data at all — no centroids, no bearings, no continents. This is by far the smallest dataset of the four games and the most naturally offline.

### WEAKNESSES
- No guess limit plus a give-up button means there is no real fail state and no tension. "Points" are unbounded, so a bad day just costs you a bigger number rather than a loss, which makes daily comparison feel low-stakes.
- The 10-colour quantisation is acknowledged by the author to corrupt some flags ("Apologies if some flags become inaccurate as a result"), so the feedback mask can be actively wrong for flags whose real colours fall between palette entries.
- The share string has a genuine off-by-one date bug: `var dd = String(today.getDate() + 1)` puts TOMORROW's day number in your shared result, and breaks entirely at month boundaries (e.g. 32 Jul).
- The share string also links to a stale host — `https://ducc.pythonanywhere.com/flaggle/` rather than flaggle.net.
- The emoji share conveys only the guess count (N−1 black squares then one green). None of the actual solve — which is the interesting part of this game — survives into the share, so two people can't compare anything but a number.
- The flag list is crowdsourced and self-described as incomplete, so coverage and correctness are uneven.
- Masks are generated server-side and delivered as images, so it cannot work offline as built and every guess costs a round trip.
- Raptive ad wall plus consent prompts wrap the game.

### IMPROVEMENT IDEAS
- Take Flaggle's positional colour mask as the core feedback for an improved clone and combine it with a fixed guess budget (6) and a tile reveal. Positional feedback is strictly more informative than either distance or scalar similarity, and it makes flag knowledge — not geography trivia — the skill being tested.
- Do the masking entirely client-side from small quantised bitmaps so it works offline and instantly: store each flag as a run-length-encoded palette-index grid, compare index-by-index, and paint the mask on a canvas. No server, no round trip, and the whole flag set fits in tens of KB.
- Fix the share so it actually shows the solve: emit one row per guess where each cell is the fraction of the mask that came back green, bucketed into 🟩/🟨/⬜. Then a partner can see that you nailed the layout on guess 2 and flailed on the charge — which is the conversation the game deserves.
- Fix the date bug (drop the `+1`) and point the share URL at the live site.
- Make the palette a difficulty setting: 10 colours (forgiving) / 16 colours (accurate) / exact colours (brutal). Because the palette choice changes the game materially, record it in the share text so the couple compares like with like.
- Add a guess cap with a chosen difficulty (4 / 6 / 8) so there is a real fail state and a real streak, and keep unlimited as an explicit "practice" mode that doesn't touch stats.
- Two-player format this mechanic is perfect for: alternating turns on ONE puzzle, where each player sees the masks from BOTH players' guesses. It becomes a cooperative deduction game rather than two people playing solo in parallel — genuinely better for a couple on one sofa, and impossible on any of the live sites.
- Add a "confusion drill" built from the palette-quantised bitmaps: automatically find the flag pairs with the highest mask overlap and serve them as a targeted practice pack.


==========================================================================================
## Flagle (amckenna41 / flagle.vercel.app) — open-source Worldle-style variant   [confidence: low]
https://github.com/amckenna41/flagle

### CORE LOOP
An open-source flag game explicitly derived from Worldle rather than from flagle.io. A flag appears each day and you name it, with direction-and-distance feedback pointing you toward the correct place after each wrong guess, and a daily streak to maintain. Its distinguishing feature is scope: the pool is not limited to sovereign states — the README says the daily flag may be "one of a country, territory or city", and the repo contains scripts for scraping country AND subdivision flags. Useful mainly as a reference implementation and as a source of the 'wider flag pool' idea.

### RULES
- Five guesses, not six. README verbatim: "You have 5 guesses to get the correct flag, after each guess if it's not right you will be pointed to the direction and distance of the correct place in kilometres."
- Feedback is direction plus distance in kilometres. No tile-reveal mechanic is described anywhere in the README, and no proximity percentage is mentioned.
- Pool includes non-sovereign entities: "Every day a new World flag will appear, be it one of a country, territory or city." The repo has a `/scripts` directory "for getting various country and subdivision flags".
- Daily, with a streak: "Guess the correct flag and share with your friends, maintaining a streak of daily correct guesses."
- Self-described lineage: "inspired from @teuteuf's Worldle based game".
- Stack: React app under `/src`, static assets under `/public`, playable at flagle.vercel.app.

### SCORING
Score = guesses used out of 5. Distance in kilometres plus a direction indicator, Worldle-style. No proximity-percentage formula, no points system and no share-string template are documented in the README — do not assume it matches flagle.io's 20,000 km linear formula, that was not verified for this project.

### DAILY
Daily with a streak. Selection method not documented. No archive or unlimited mode mentioned.

### SHARE
Not verified. The README only says results can be shared with friends and that a streak is maintained; no template, emoji grid or example string is documented, and the live app was not inspected.

### UI
- Not inspected — the live deployment (flagle.vercel.app) was not loaded during this research, so no layout, colour or animation claims can be made.
- Structure per README: React source in `/src`, static assets in `/public`, flag-scraping scripts in `/scripts`.

### DATA NEEDED
- A flag set that extends beyond the 249 ISO countries to territories, subdivisions and city flags — this is the interesting part, and the repo's scraping scripts are the pointer to where such a set comes from.
- Centroid lat/lon for every entity in that extended pool (harder than for countries; cities and subdivisions need their own coordinates).
- A daily schedule over the extended pool.
- A name/alias list, which gets significantly messier once subdivisions and cities are included.

### WEAKNESSES
- Only the README was verifiable; the live deployment was not inspected, so guess count and feedback are documented-not-observed and everything else is unknown.
- Five guesses with no tile reveal means the flag is presumably shown outright, which makes it a recall test rather than a deduction puzzle — much thinner than the tile games.
- Including cities and subdivisions massively widens the answer space, which is great for variety and terrible for fairness: an unrecognised city flag is unguessable from a direction arrow.
- No proximity percentage, no bonus rounds, no archive, no difficulty modifiers documented.
- Being a hobby Vercel deployment, it has no ads but also no maintenance guarantee.

### IMPROVEMENT IDEAS
- Borrow the extended pool as an OPT-IN pack rather than the default: "sovereign states only (193)" / "+ territories (249)" / "+ subdivisions and cities (hundreds)". Two people who both play daily will exhaust 249 flags in under a year, so a legitimate route to a bigger pool is genuinely valuable — the original flagle.io only guarantees no repeat within 100 days.
- If subdivision and city flags are included, gate them behind a per-player difficulty tier and mark them in the share string, so a partner playing the easier pool isn't compared against a Faroese municipality.
- Being open source and MIT-ish makes it the most useful starting point for asset provenance — its scripts show where to source a wider flag set, which is the hardest part of building the extended pool offline.
- Five guesses on a 6-tile grid is arguably a better ratio than 6-of-6, because it means you can never see the whole flag before answering. Offer 4/5/6 guesses as a difficulty knob.


==========================================================================================
## GeoGuessr (Classic + Daily Challenge)   [confidence: high]
https://www.geoguessr.com/ (daily: https://www.geoguessr.com/daily-challenges)

### CORE LOOP
Each round drops you into a Google Street View panorama at an unknown spot on Earth with no captions. You look around (pan/zoom, and walk down the road if the mode allows Moving), reading the visible evidence: language and script on signs, licence-plate shapes, road markings and bollard styles, driving side, vegetation and soil colour, sun angle, architecture, utility poles, brand names, and camera 'meta' (blur pattern, resolution, antenna) that identifies which Google camera generation shot it. You then pan/zoom a world map in the corner, drop a pin, and press Guess. The result screen draws a line from your pin to the truth, states the distance, and awards 0-5000 points for that round. Five rounds make a game (max 25,000). The Daily Challenge is the same thing with one fixed set of 5 locations shared by every player that day, refreshed daily, with a play-every-day streak; the social loop is comparing your 25,000-scale total against your friends' and the community average.

### RULES
- Classic game = 5 rounds; one guess per round; no partial or repeat guesses. Max total 25,000 (5 x 5000).
- Score per round is a pure function of great-circle distance and map size - direction and continent do not matter, only kilometres.
- Distance is haversine on a sphere of radius 6371 km, so the maximum possible distance (antipode) is 6371*pi = ~20,015 km, which scores ~0.
- Every map (location pack) has a size factor D: GeoGuessr takes the lat/lng bounding rectangle of all locations in the map and computes the great-circle distance between two opposite corners. D for a Europe-ish demo map was ~4014 km; a worldwide map is ~14,900 km (see scoring notes).
- Perfect-5000 radius scales with the map: roughly D/100,000 (e.g. 40.14 m on a D=4014 km map). Hard floor: a guess within 25 m always scores 5000 no matter how small the map, so on tiny city maps you lose hundreds of points just past 25 m.
- Difficulty toggles (classic/custom games): Moving (full Street View controls), No Move (pan + zoom only), No Move/Pan/Zoom (a single frozen frame). Optional round time limits exist in classic/custom games.
- Daily Challenge: 5 locations, refreshed daily, identical for all players, and playable on the free tier; keeping a daily streak requires an account. It is one attempt - there is no in-product archive or replay of missed or past dailies (an open community feature request), and I could not verify whether the daily itself imposes a per-round timer (assume none).
- Free tier is now essentially Daily Challenge only: the official free page lists maps/multiplayer/party/custom-map creation as 'Included in subscription'.
- Other official modes for reference: Duels (1v1, 6000 HP health bar, each round the loser takes damage equal to the round-score difference, escalating damage multipliers in later rounds so games end - the exact 2026 multiplier schedule changed to a per-player 'Individual Multiplier' and I did not verify the numbers), Team Duels, Battle Royale, Country/US-State Streaks, Explorer with per-country medals, and Quiz mode.
- Challenge links let you send a friend the exact same 5 locations so scores are comparable - this is the original's answer to head-to-head play.

### SCORING
S_round = round(5000 * exp(-10 * d / D)) where d = haversine distance (km) from guess to truth and D = the map's bounding-rectangle diagonal (km); additionally S_round = 5000 whenever d < 25 m. Game total = sum of 5 rounds, max 25,000. Worked example from a D = 4014 km map: 5000 pts at <=40.14 m, 4999 at 120.43 m, 4950 at 4.07 km, 4900 at 8.15 km, 4500 at 42.33 km, 4000 at 89.61 km, 3500 at 143.21 km, 3000 at 205.09 km, 2000 at 367.86 km, 1000 at 646.16 km, 1 point at 3696.66 km. Rule of thumb: the 5000 threshold is ~D/100,000 and rises ~2/100,000 of D per point lost over the first few hundred points. For a worldwide pack, D ~ 14,900 km, which is consistent with the widely quoted '5000 points if within about 150 m' for the standard world game (14,900 km / 100,000 = 149 m) - but treat the exact world-map D (community value 14,916.862 km) as unverified and just compute D from your own pack's bounding box.

### DAILY
One Daily Challenge per day, 5 shared locations, refreshed daily (resets appear to be midnight UTC; unverified), plus a daily-play streak. Unlimited classic/custom play and all other modes sit behind the Pro subscription; there is no archive of past dailies. For a clone: seed a deterministic PRNG with the UTC date to pick 5 panoramas from the pack, and keep every past date playable.

### SHARE
No Wordle-style emoji grid. GeoGuessr's social layer is (a) the daily result screen with per-round distance + points and a total out of 25,000, compared against friends and the global community, and (b) challenge links that hand a friend the identical 5 locations. Treat this as medium confidence on current UI details - and note it as a genuine gap a clone can beat with a compact copyable grid.

### UI
- Full-bleed panorama with a compass/north indicator, round counter (Round n/5) and running score in a top bar; a collapsible map pinned bottom-right that expands on hover/tap; a big Guess button that is disabled until a pin is dropped.
- Between rounds: a result map with a straight line from pin to truth, the distance in km/miles, points as an animated count-up, and a Next Round button; after round 5 a summary of all five rounds and the 25,000 total.
- Colour semantics are minimal and functional - your pin vs the true location vs the connecting line. There is no colour-coded proximity ladder to copy (unlike FoodGuessr); a clone should invent one and document it.
- Restriction badges (Move / No Move / No Zoom) are shown as icons so players know the ruleset at a glance.
- Mobile: the panorama takes the whole screen and the map is a drawer; a clone must make pin-dropping precise (long-press to place, drag to fine-tune, then confirm) or the scoring curve feels unfair.

### DATA NEEDED
- A panorama pack you are legally allowed to ship offline. Google Street View imagery cannot be cached/redistributed under its ToS, so the clone must use equirectangular photos from Wikimedia Commons (CC), Mapillary/KartaView (CC-BY-SA, bulk-downloadable), Flickr CC 'equirectangular', or the couple's own phone 360 shots.
- Per panorama: file, exact lat/lng, country + subdivision code, initial heading, difficulty 1-5, licence/attribution string (mandatory for CC), and 2-4 'what gave it away' clue notes for the post-round learning card.
- Storage budget: equirectangular WebP at 2048x1024 is ~120-250 KB, at 4096x2048 ~0.6-1.2 MB (needed if you want to read shop signs). 300-600 panoramas (~40-150 MB) is enough for a year of 5-round dailies plus an archive and unlimited practice if you allow reuse across modes.
- An offline panorama viewer: no CDN, so either a vendored single-file three.js sphere/skybox, or a hand-rolled canvas/CSS-3D cube - plus drag-to-pan, wheel-to-zoom, and touch support.
- An offline guess map: simplified world-countries TopoJSON/GeoJSON (~100 KB at 1:110m, ~500 KB at 1:50m) drawn to SVG/canvas with your own projection + pan/zoom. No tile server, no Leaflet CDN.
- Pure-JS haversine (R = 6371 km) plus a precomputed D per pack (bounding-rectangle corner distance) so scoring matches the original's feel.
- Optional: country centroid + name/flag table for a Country Streak mode, and point-in-polygon so you can score 'right country' bonuses.

### WEAKNESSES
- Hard paywall: free play is effectively the Daily Challenge only; maps, multiplayer, party and custom maps require a subscription. The Steam edition drew an Overwhelmingly Negative rating largely because a paid purchase still gated content behind a subscription.
- Location repetition for non-subscribers, which kills replay value.
- No archive and no replay: if you miss a day it is gone, you cannot practise past dailies, and you cannot watch back your own or others' rounds - both are long-standing community feature requests.
- Streaks are fragile and unforgiving (streak-freeze is a requested feature), which punishes exactly the kind of couple who travels or gets busy.
- The high-level skill ceiling is 'meta' memorisation - camera generations, blur patterns, bollard designs, car parts - rather than geography, which many players find alienating and which also makes cheating nearly impossible to distinguish from expertise.
- Total dependency on Google Street View: needs a live connection, is heavy on low-RAM machines, and coverage is skewed toward countries Google has driven, so the same regions recur.
- Scoring is opaque in-product: nothing tells you the map's D or how big the 5000 radius is, so players cannot calibrate how much a 40 km error should cost.
- Comparing with a specific person requires accounts, friending, and the daily leaderboard; there is no simple two-player ledger.

### IMPROVEMENT IDEAS
- Two-player daily with a fair reveal: both play the same 5 seeded panoramas on their own phones, and neither sees the other's guesses until both have submitted. With no server, exchange results as a short base64 'score code' (or URL hash) that the partner pastes in - then render a full head-to-head board with per-round distances, closest-guess trophies and a season W/L ledger.
- Golf-style handicap, auto-tuned: track the rolling 10-game score margin and give the trailing player a handicap (bonus points, an extra 15 s, or a slightly larger 5k radius) so the daily stays a real contest instead of the same person winning every night. This is the single biggest fix for a mismatched couple.
- Offline Duels: same 5 panoramas, 6000 HP each, damage = round-score difference with a published multiplier ladder (1x, 1.5x, 2x, 3x), hot-seat on one device or async by code. Gives a decisive winner instead of two abstract numbers.
- Co-op mode for nights when competing is not fun: one person drives the panorama and calls out clues, the other places the pin, roles swapping each round, with a shared score and a shared streak - something the original cannot do at all.
- Full archive plus unlimited practice: every past date replayable forever, and a practice mode with continent/difficulty/no-move filters. Free of Google's ToS you can also allow re-plays of a round you botched, flagged as 'practice' so it does not pollute the ledger.
- Transparent scoring: show the pack's D and the live 5000-radius on the map as a circle, and after each guess print 'you were 84 km out; 40 km would have been 4500'. Players learn the curve instead of resenting it.
- Difficulty tuning per pack: because D is just the bounding box, a Europe-only or Boston-only pack automatically rescales. Ship several packs (World, Europe, Our Trips, Boston) and let them pick nightly; add a manual D override for when the auto value feels punishing.
- Blind-spot engine: log per-country accuracy for both players, show a shared heat map of where you are jointly weak, and auto-generate tomorrow's practice pack from the worst cells. A couple improving together is far stickier than a leaderboard.
- A real share grid the original lacks: 5 rows of 5 squares banded by distance (e.g. green <1 km, yellow <25 km, orange <200 km, red <1000 km, black beyond) so a screenshot-free result can be pasted into any chat.
- Custom packs as gifts: let them build a pack from their own 360 photos or geotagged holiday shots with a JSON import and a 'clue notes' field - 'guess where we were' beats any random Brazilian roadside.
- Honest timers and hard modes that only work offline: no network latency means a 30 s round timer is fair; add No-Move/No-Zoom/No-Compass and a 'blank map' mode (borders hidden) as togglable difficulty.
- Learning card after each round: the answer, a mini map, and the 3 clues that identified it, saved to a reviewable 'clue library' so the couple builds a shared vocabulary of meta.


==========================================================================================
## FoodGuessr (foodguessr.com)   [confidence: high]
https://www.foodguessr.com/ (daily: https://www.foodguessr.com/game/daily)

### CORE LOOP
A round shows you one dish: photo(s), an ingredient list, and a prose description of how it is made and served - plus, on many dishes, a deliberately vague AI-written 'free hint'. The dish's NAME is hidden. You pick the country (or food-culture region) it comes from via a picker organised by continent then alphabetically. If you are right, the round ends and you bank points. If you are wrong, the guess is added to a visible guess trail annotated with a warmth word and a compass arrow pointing along the great-circle bearing from your guessed country's centre toward the answer's - so wrong guesses teach you geographically, not culinarily. You get up to 5 guesses per round and each extra guess costs points; after 2 wrong guesses the dish's name is revealed. The daily is 3 rounds (max 15,000); Free Play is 5 rounds (max 25,000). At the end you get a rating title, a score distribution against everyone else who played today, and a copyable moon-phase share block. Companion daily modes: Cuisine Match (given a country, pick which of 3 dishes is its), Plate-Off (which of two dishes is more liked worldwide), and a real-time 1v1 Multiplayer duel.

### RULES
- Daily = exactly 3 rounds, each capped at 5000, total capped at 15,000 (server-side validation: round 0-5000, total 0-15000, 'Must be 3 rounds', round numbers exactly 1,2,3). Free Play / Quick Play / Random = 5 rounds, max 25,000.
- MAX_GUESSES = 5 per round. Guesses must be unique countries (server rejects duplicates) and at most one can be correct. The round ends immediately on a correct guess, or after the 5th guess.
- A dish can have MULTIPLE correct countries; any of them scores as correct ('Some dishes belong to multiple places, and any correct location is a correct answer').
- Hint schedule is guess-count-driven, not opt-in: ingredients and description are visible from guess 0 (REVEAL_GUESSES.ingredients = 0, .description = 0), and the dish NAME unlocks after 2 guesses (REVEAL_GUESSES.name = 2). All three reveal costs are currently ZERO (REVEAL_COSTS = {name:0, ingredients:0, description:0}) - the UI still renders a '-0' deduction line, so reveals used to cost points and the penalty hook is still wired up.
- Wrong-guess feedback = warmth word + colour + compass bearing, computed from country CENTRE points on a sphere. Exact ladder: shares a border with the answer -> 'Borders' with three flame emoji (red-600); else <500 km -> 'Very Hot' + two flames (red-500); <1000 km -> 'Hot' + one flame (orange-500); <3000 km -> 'Warm' (yellow-500); <5000 km -> 'Cool' (green-500); <8000 km -> 'Cold' + snowflake (blue-500); otherwise 'Ice Cold' + two snowflakes (indigo-500).
- In the V2 scoring beta only: subdivision-level answers exist (GB-ENG/SCT/WLS/NIR and US-48/AK/HI), a guess in the right country but wrong subdivision is tagged 'Same country' in emerald, and enclave pairs report 'Inside' or 'Surrounds' instead of a distance.
- A 'Random Guess' button will pick a country for you. There is no round timer in single player - elapsed time is recorded (used for leaderboard tie-breaks/stats) but never limits you.
- Daily resets at midnight UTC and is the same 3 dishes for everyone; results include your score vs today's community mean and a per-round score-distribution histogram, plus per-round scores of friends you have added.
- Images can carry content warnings (animal carcass, insects, spiders, worms, snakes, dog/cat meat, trypophobia, graphic) and are blurred behind a click-to-reveal until dismissed.
- Rating titles by percentage of the mode's max: exactly max -> one of 5 joke grandmaster titles; >=85% 'Gastronomical Genius'; >=70% 'Super Foodie'; >=50% 'Apprentice Foodie'; <=3 points -> a joke booby title; otherwise 'Newbie Foodie'.
- Companion modes with verified constants: Cuisine Match = 8 rounds, 5000 for a first-guess hit and 2000 for a second-guess hit, max 40,000, daily launched 13 Jul 2026. Plate-Off = 10 binary picks, 1 point each, max 10. Multiplayer duel = 6000 starting HP, 120 s rounds, 15 s 'snipe' window, timed hint reveals at 20 s (ingredients) / 45 s (description) / 75 s (name), 5000 for a correct guess, damage multipliers 1x from round 1, 1.5x from round 6, 2x from round 9, 3x from round 12, 5x from round 15. Daily Double is premium-only and 'replay(s) the daily challenge from exactly one year ago'.
- Non-premium players get ad slots injected between rounds (round 2 in the daily; rounds 2 and 4 in Free Play).

### SCORING
Two scoring engines ship in the bundle; V1 is the live default and V2 ('border-distance scoring') is behind a beta flag plus a cutover date, so the daily's engine comes from the server per day.

V1 (current): round_score = max(best_guess_score - guess_penalty(n_guesses) - reveal_cost, 0). best_guess_score = the MAXIMUM score over all your guesses that round: 5000 for the correct country, otherwise f(d) where d = ceil(great-circle km between your guessed country's centre point and the NEAREST correct country's centre point) and f(d) = 0 if d > 5000, else ceil(max(0.0002 * (d - 5000)^2, 0)). So f(0 km)=5000, f(500)=4050, f(1000)=3200, f(2000)=1800, f(3000)=800, f(4000)=200, f(>=5000)=0. guess_penalty by number of guesses used: 1 -> 0, 2 -> 500, 3 -> 1000, 4 -> 1500, 5 or more -> 2000. reveal_cost is currently 0 for all three reveals. Consequences: correct on guess 1 = 5000, guess 2 = 4500, guess 3 = 4000, guess 4 = 3500, guess 5 = 3000; a fully missed round still pays f(nearest guess) - 2000 (this is why real posted totals are odd numbers like 11,799 and 10,982 rather than multiples of 500 - e.g. 11,799 = 5000 + 5000 + (f(642 km) - 2000)).

V2 (beta): distances are precomputed BORDER-to-border km per country/subdivision pair (0 for neighbours, 99999 if a pair is missing), the per-guess curve is g(d) = ceil(max(4750 - 0.001 * d^2, 0)) (so 4750 at d=0, zero at ~2179 km), and the round total is rebuilt as: 1000 for being correct at all + 1000 per UNUSED guess (MAX_GUESSES - guesses_used) + a 'near-miss refund' of 1000 * clamp(g(d),0,5000)/5000 summed over each wrong guess, minus reveal costs, floored at 0. Correct on guess 1 = 1000 + 4x1000 = 5000, same cap as V1, but wrong guesses now earn credit for being close.

Distance maths: haversine on a 6371 km sphere; country centre points are coarse integers in the shipped dataset (e.g. Ukraine is stored as [49, 32]).

### DAILY
One 3-round daily per UTC day, identical for all players, resetting at midnight UTC ('The daily challenge resets every day at midnight UTC'). Free Play / Quick Play is unlimited 5-round random games from the 5000+ dish pool. Cuisine Match (8 rounds) and Plate-Off (10 picks) each have their own separate daily. The only access to old dailies is Daily Double, a premium mode that replays the daily from exactly one year ago. There is no general archive.

### SHARE
Copy-to-clipboard text (two variants, user-selectable, no image). Each round renders as a 5-glyph moon-phase bar built from ['new moon','waning crescent','last quarter','waning gibbous','full moon']: t = ceil(score/5000*20) and glyph i = bar[clamp(t - 4i, 0, 4)], so 5000 = five full moons and 0 = five new moons; a 5000 round also gets a '100' emoji. Compact variant:
'FoodGuessr - <date> UTC' / one line per round '<5 moons> 3,200 . Round 2' / 'Total score: 11,000/15,000' / optional '(+1,234 above today's average!)' / 'Play here: https://www.foodguessr.com/'.
Friendly variant: 'I got 11,000 on the FoodGuessr Daily!' + optional above-average line + one '<5 moons> 5,000 (Round 1)' line per round + date + play link. Daily Double adds ' - was 4,500' per round and a '+/- from last time' line. Plate-Off shares a tick/cross string; Cuisine Match shares tick (1st guess) / yellow square (2nd guess) / cross per round. (The 2024-era share was plainer: 'FoodGuessr - 13 Sep 2024 GMT / Round 1 / Round 2 / Round 3 / Total score: 13,500 / 15,000 / Can you beat my score? New game daily!')

### UI
- Layout: photo card (multiple images swipeable) with ingredients + description panel beside it on desktop, stacked on mobile; a fixed bottom guess bar with a type-ahead search box, a 'Random Guess' button, a 'Guesses remaining' counter (MAX_GUESSES - guesses.length), and the growing guess trail above it. A pill in the top-right shows 'Round n/3' and the running score.
- Country picker is grouped by continent then alphabetical - and this is the most-cited annoyance; the V2 beta switches it to a 'grouped' variant that includes subdivisions.
- Wrong-guess rows show flag + country name on the left and the warmth word + animated compass needle on the right; the needle spins for enclave cases and animates into position otherwise. Colour ladder is the warmth ladder above (red-600 borders, red-500, orange-500, yellow-500, green-500, blue-500, indigo-500).
- Results map: react-simple-maps, geoEqualEarth projection, /world-countries.json, zoom 1.2 on desktop, with a legend whose colour semantics are exactly - Answer(s) = blue-600, Correct guess = yellow-500, Misses = stone-500, everything else = slate-300 (light) / slate-700 (dark), graticule same slate.
- Round-results screen: reveals the dish name, native names (up to 3 flagged for in-game reveal), a trivia blurb with 'Read more', a Wikipedia link, yum/yuck voting, the score breakdown as itemised lines ('Ingredients revealed  -0', 'Correct country  +1,000', '3 unused guesses  +3,000' in V2), the community score histogram with your bar highlighted, today's most-common wrong guess, and your friends' scores for that round.
- Achievements exist and are worth copying as a spec: Early Bird (first player in the world to finish a daily), Perfect Daily (15,000; bronze 1 / silver 10 / gold 50), Perfect Day (perfect in Daily + Plate-Off + Cuisine Match same day), Streak Keeper (7/30/100/365), Regular (10/100/500 dailies), Clean Plate, On a Roll, Duelist.

### DATA NEEDED
- Dish table - the whole game. Per dish: display name (hidden until 2 misses), 1-3 photos, comma-separated main ingredients, a prose description of preparation/serving, an answer SET of country/region codes (not one code), a vague one-line 'free hint', an optional post-answer trivia blurb, a Wikipedia URL, native-name variants with a 'reveal in game' flag, and an optional content-warning enum. FoodGuessr advertises 'over 5000 unique dishes'; a clone needs roughly 300-800 to run a year of 3-a-day dailies plus practice (1095 dish-slots per year).
- Dish photos: 800x600 WebP is ~60-100 KB, so 400 dishes with 2 photos each is ~60-80 MB of static files. Sources you can actually ship: Wikimedia Commons food categories (CC-BY-SA, attribution required), Openverse, or the couple's own photos.
- Country/region table, exactly as the original ships it: 249 rows with name, ISO alpha-2 code, flag emoji, centre lat/lng, region and subregion, language list, and a sharedBorders array of neighbour ids. Regional split in the shipped data: Africa 59, Americas 57, Europe 56, Asia 50, Oceania 27, including non-sovereign food cultures (Taiwan, Hong Kong, Macau, Greenland, Puerto Rico, Palestine) and 7 subdivision rows (GB-ENG/SCT/WLS/NIR, US-48/AK/HI). Rebuildable from restcountries.com + Natural Earth; ~60-120 KB of JSON.
- For honest 'Borders / Very Hot' feedback, a pairwise border-distance matrix: 249 countries is ~31k unordered pairs, storable as a Uint16 km array (~62 KB) - cheap, and it fixes the centroid-distance weirdness the original apologises for in its own how-to-play.
- A simplified world-countries GeoJSON/TopoJSON (~100-300 KB) for the results map, drawn in an equal-earth projection with a graticule - no tile server needed.
- A deterministic date -> dish-index seed (PRNG on the UTC date) so the daily needs no server, plus localStorage keys for the day's state, historical scores, streaks and per-country accuracy.

### WEAKNESSES
- The geography clues overwhelm the food knowledge. A real player complaint: 'I think the clues are a little too good, particularly when it points you towards the country of origin when you've missed. I'd rather this stick to culinary/cultural knowledge.' With 5 guesses, a compass bearing and a warmth band, you can triangulate a country you know nothing about - competent players routinely post 21-23k out of 25k in Free Play.
- Single-country attribution of regional dishes feels arbitrary. Players report guessing a paprika pork stew as Hungary, getting 'Borders', and only reaching Romania by elimination, with 'nothing in the written clues or picture that would identify it as Romanian as opposed to Hungarian'. Multi-answer dishes exist but are inconsistently applied.
- Warmth is computed from country CENTRE points, which the game itself admits distorts things ('large countries can feel further away than expected, and the compass sometimes points across the poles'). Players say they were 'a bit misled by the warm indicator'. Coarse integer centroids make it worse.
- The 500-point-per-guess ladder plus near-miss credit means the difference between a foodie and a novice is often only 1500-3000 points out of 15,000 - scores compress, so daily comparisons between two people are frequently ties or near-ties.
- Obscure or unrepresentative dishes ('Toast Sandwich' for the UK, 'Bagel Toast' for Israel) and visually generic ones (gnocchi mistaken for spaetzle) feel like gotchas rather than culture.
- Country picker organised by continent then alphabet is 'the most time-consuming part' and 'tedious'.
- No archive: 'I can't see a way to get back to it once I've closed the window' - and the only replay path, Daily Double, is premium-only and locked to exactly one year ago.
- Only 3 rounds a day for the flagship mode, and the rest of the loop is fragmented across four separate dailies (Classic, Cuisine Match, Plate-Off, Plate-Off Streak) each with its own scale (15,000 / 40,000 / 10).
- Ads between rounds for free users, sign-in required for Plate-Off streak and for friends' round scores, and premium gating on Daily Double.
- Scoring is a moving target: two engines (V1 centroid, V2 border-distance) with different curves shipped simultaneously behind env flags, so historical scores are not strictly comparable.
- Head-to-head is thin: friends' per-round SCORES are shown, but not their guess trails - which is exactly what forum threads spend their time reconstructing by hand ('my progression was India, Pakistan, Bangladesh...').

### IMPROVEMENT IDEAS
- Split the two skills with a mode toggle. 'Culinary mode' drops the compass entirely and replaces it with cuisine-family hints (staple starch, fat used, spice palette, cooking vessel, meal context); 'Atlas mode' keeps warmth + bearing. Or delay the bearing until guess 3 so the first two guesses must be food reasoning. This directly answers the loudest complaint about the original.
- Make warmth honest: ship the border-distance matrix (~62 KB) instead of centroid distance, print the actual km band beside the label ('Warm - 1,000-3,000 km'), and show the answer set on the map so nobody feels cheated by Hungary vs Romania. Tag genuinely regional dishes with a 'regional dish' badge and accept every plausible country, with a note on which one the source calls home.
- Full head-to-head guess trails, not just totals: both play the same 3 dishes, then a side-by-side reveal showing each person's exact progression with warmth annotations. Async exchange as a short paste code so it works with zero server, and a rule that neither trail unlocks until both have submitted.
- Calibration wager to neutralise a skill gap: before round 1 each person privately predicts their own total; whoever is closer to their own prediction gets +500. A weaker but self-aware player can win the night, which keeps a couple playing.
- Rolling handicap: track the 10-day score gap and give the trailing player one extra guess, or an early name reveal, or a 1.1x multiplier. Tunable, visible, and switchable off.
- Local duel mode using the original's own multiplayer constants but hot-seat: 6000 HP each, 120 s per dish, timed reveals at 20/45/75 s, damage = score difference with the 1x/1.5x/2x/3x ladder. Gives a winner rather than two numbers, on one phone on the sofa.
- Custom dish packs as the killer offline feature: JSON (or a folder of photos + a CSV) they author for each other - 'Persian & Levantine week', 'things we actually cooked in 2025', 'street food from our Japan trip'. Import/export means the pack is a gift, and it makes their own photos the content.
- Cook-it loop: every answer card gets a 'add to cook list' button; the list lives in localStorage and exports a grouped shopping list. A daily game that produces Saturday's dinner beats one that produces a score.
- Fix the picker properly: fuzzy type-ahead over country names AND cuisine adjectives ('thai', 'persian', 'ivory'), recently-guessed chips, a flag grid fallback, full keyboard operation, and Enter-to-confirm. This alone removes the original's most-mentioned friction.
- Unlimited archive + practice: every past date replayable, unlimited random rounds, difficulty filters (common vs obscure dishes, continent lock, hide-the-photo hard mode), and a 'redo the round I blew' practice flag that does not touch the ledger.
- Shared blind-spot tracking: per-country and per-cuisine accuracy for both players combined, a heat map of joint weak spots, and an auto-generated practice pack from the worst cells ('you two are 0/6 on the Caucasus').
- Household streak + ledger: a combined streak that only advances when both have played, a season scoreboard with cumulative margin, 'first to lock it in' and 'clutch on guess 5' badges, and a monthly recap card. Plus an export button, because the original's localStorage-only history is a known loss risk.
- Scoring transparency and choice: show the deduction ledger live as you guess, and let them pick the engine - V1 (best guess minus guess penalty) or V2 (1000 correct + 1000 per unused guess + near-miss refunds). V2 rewards decisiveness and spreads scores out more, which makes two-player nights less tie-prone.
- No ads, no sign-in, no premium wall - and put the four modes (Classic 3, Cuisine Match 8, Plate-Off 10, Streak) on one page with one combined daily total so a couple compares a single number.
