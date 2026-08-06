/* ============================================================================
   MIDNIGHT ARCADE · DAILY WING — the cabinet list
   One static file so the hub, the Daily Run and the League know every game
   without loading twenty scripts. Order here = order in the Daily Run.
   `family` groups the hub. `parMs` is the typical solve time (for "≈4 min left"
   estimates). `stamps` marks games that can stamp the passport.
   ========================================================================== */
window.AD_REGISTRY = [
  /* ── WORD WING ─────────────────────────────────────────────────────────── */
  {
    id: "wordish", name: "WORDISHA", icon: "🔤", accent: "--hot", family: "word",
    tagline: "five letters, six tries, one word a day",
    blurb: "Wordle, with the bits it's missing: a full archive, unlimited practice, " +
      "a Persian-loanword pack, and a duel where you both get the same word.",
    parMs: 150000, hasArchive: true, hasPractice: true,
    distLabel: "guesses used", stamps: false,
  },
  {
    id: "thirdle", name: "THIRDLE", icon: "🎰", accent: "--violet", family: "word",
    tagline: "three words, chained at the letters, six tries",
    blurb: "Three five-letter words interlock in a chain. Every guess must be three " +
      "real words — and a fourth colour tells you a letter belongs in one of the " +
      "OTHER words. Cross-referencing is the whole game.",
    parMs: 300000, hasArchive: true, hasPractice: true,
    distLabel: "guesses used", stamps: false,
  },
  {
    id: "mini", name: "MINI", icon: "▦", accent: "--cool", family: "word",
    tagline: "a 5×5 crossword against the clock",
    blurb: "Forty hand-clued 5×5s. Beat par and the tile lights up.",
    parMs: 90000, hasArchive: true, hasPractice: false,
    distLabel: "solve time", stamps: false,
  },
  {
    id: "midi", name: "MIDI", icon: "▧", accent: "--cool", family: "word",
    tagline: "the bigger one, with a theme",
    blurb: "A themed 7×7 with a title that's also a hint. Reveal a letter and you " +
      "keep the solve but lose the streak — same deal as the real thing.",
    parMs: 260000, hasArchive: true, hasPractice: false,
    distLabel: "solve time", stamps: false,
  },
  {
    id: "quartets", name: "QUARTETS", icon: "🟪", accent: "--mint", family: "word",
    tagline: "sixteen tiles, four groups, four mistakes",
    blurb: "Connections with packs: a general archive plus Persian, United, " +
      "AI, Jewish and four-cities boards. Purple is always the trick.",
    parMs: 200000, hasArchive: true, hasPractice: true,
    distLabel: "mistakes made", stamps: false,
  },
  {
    id: "boxed", name: "BOXED IN", icon: "▢", accent: "--gold", family: "word",
    tagline: "twelve letters, four sides, use them all",
    blurb: "Letter Boxed, plus the thing it never tells you: how good your solve " +
      "actually was, and what the two-word answer was.",
    parMs: 240000, hasArchive: true, hasPractice: true,
    distLabel: "words used", stamps: false,
  },

  /* ── TRADE WING ────────────────────────────────────────────────────────── */
  {
    id: "tradle", name: "TRADLE", icon: "📦", accent: "--gold", family: "trade",
    tagline: "guess the country from what it sells",
    blurb: "A treemap of a country's exports, six guesses, distance and direction " +
      "after each. Now with an economy hint you can spend.",
    parMs: 120000, hasArchive: true, hasPractice: true,
    distLabel: "guesses used", stamps: true,
  },
  {
    id: "pick5", name: "PICK 5", icon: "🏭", accent: "--mint", family: "trade",
    tagline: "name the five biggest exporters",
    blurb: "One product a day. Name the top five sellers — every pick scores what " +
      "it's actually worth, and you see each one's true rank as you go.",
    parMs: 150000, hasArchive: true, hasPractice: true,
    distLabel: "score band", stamps: true,
  },
  {
    id: "connectrade", name: "CONNECTRADE", icon: "🧭", accent: "--cool", family: "trade",
    tagline: "sixteen products, four economies",
    blurb: "You're told the four countries. Work out which four things each of them " +
      "is unusually good at selling. Six hearts.",
    parMs: 180000, hasArchive: true, hasPractice: true,
    distLabel: "mistakes made", stamps: true,
  },

  /* ── GEO WING ──────────────────────────────────────────────────────────── */
  {
    id: "flagle", name: "FLAGLE", icon: "🏳️", accent: "--hot", family: "geo",
    tagline: "six tiles of a flag, six guesses",
    blurb: "Real vector flags, revealed a tile at a time. Wrong guesses give you " +
      "distance, direction and — if you want it — what the flag has on it.",
    parMs: 90000, hasArchive: true, hasPractice: true,
    distLabel: "guesses used", stamps: true,
  },
  {
    id: "geogrid", name: "GEOGRID", icon: "⌗", accent: "--violet", family: "geo",
    tagline: "nine cells, ten guesses, no repeats",
    blurb: "Three criteria across, three down. Fill all nine — and score better " +
      "for picking the countries nobody thinks of.",
    parMs: 300000, hasArchive: true, hasPractice: true,
    distLabel: "cells filled", stamps: true,
  },
  {
    id: "globle", name: "GLOBLE", icon: "🌍", accent: "--cool", family: "geo",
    tagline: "hot and cold, on a spinning globe",
    blurb: "Guess any country; it lights up by how close it is. No guess limit — " +
      "but fewer is better, and the globe remembers.",
    parMs: 180000, hasArchive: true, hasPractice: true,
    distLabel: "guesses used", stamps: true,
  },
  {
    id: "outline", name: "OUTLINE", icon: "🗺️", accent: "--mint", family: "geo",
    tagline: "name the country from its shape",
    blurb: "Just the silhouette — rotated, unlabelled, no scale. Six guesses with " +
      "proximity feedback, and a rotating hard mode when you get cocky.",
    parMs: 100000, hasArchive: true, hasPractice: true,
    distLabel: "guesses used", stamps: true,
  },
  {
    id: "atlas", name: "ATLAS GYM", icon: "🎓", accent: "--gold", family: "geo",
    tagline: "flags, capitals, borders, shapes — your weak spots first",
    blurb: "The drill room. Twelve questions built from whatever you keep getting " +
      "wrong, across every geography game in the arcade.",
    parMs: 150000, hasArchive: false, hasPractice: true,
    distLabel: "score", stamps: true,
  },

  /* ── PHOTO WING (needs a connection) ──────────────────────────────────── */
  {
    id: "timeguessr", soon: true, name: "TIMEGUESSR", icon: "📷", accent: "--gold", family: "photo",
    tagline: "five photographs — when, and where?",
    blurb: "Real archive photography. Drop a pin, drag the year. Points for both, " +
      "and a caption afterwards telling you what you were looking at.",
    parMs: 300000, hasArchive: true, hasPractice: true, needsNet: true,
    distLabel: "score band", stamps: true,
  },
  {
    id: "placeguessr", name: "PLACEGUESSR", icon: "🛣️", accent: "--cool", family: "photo",
    tagline: "one photo, one pin, five rounds",
    blurb: "Not the monuments — the roadsides. Read the script on the signs, the " +
      "plants, the traffic side. Hints cost you points.",
    parMs: 300000, hasArchive: true, hasPractice: true, needsNet: true,
    distLabel: "score band", stamps: true,
  },
  {
    id: "foodguessr", name: "FOODGUESSR", icon: "🍲", accent: "--hot", family: "photo",
    tagline: "three dishes, three countries",
    blurb: "Guess where a dish is from. Wrong guesses tell you how warm you are and " +
      "point you the right way; the dish's name unlocks after two.",
    parMs: 200000, hasArchive: true, hasPractice: true,
    distLabel: "score band", stamps: true,
  },

  /* ── THE ONE YOU PLAY AGAINST EACH OTHER ──────────────────────────────── */
  {
    id: "decider", name: "THE DECIDER", icon: "🥊", accent: "--hot", family: "versus",
    tagline: "one device, two people, settle it",
    blurb: "General knowledge, head to head. Alternating questions, a steal round where a " +
      "miss hands it to the other one, and a final wager you can lose everything on. " +
      "Pass the phone back and forth — no accounts, no waiting.",
    parMs: 420000, hasArchive: true, hasPractice: true,
    distLabel: "margin", stamps: false, versus: true,
  },

  /* ── OFFLINE REINVENTIONS (work on a plane) ───────────────────────────── */
  {
    id: "chrono", name: "CHRONO", icon: "⏳", accent: "--violet", family: "offline",
    tagline: "five clues, falling in value — what year?",
    blurb: "TimeGuessr with no photographs. Five facts about one year, revealed one " +
      "at a time, each cheaper than the last. Guess early for the points.",
    parMs: 180000, hasArchive: true, hasPractice: true,
    distLabel: "clues used", stamps: false,
  },
  {
    id: "cluedrop", name: "CLUEDROP", icon: "🔎", accent: "--mint", family: "offline",
    tagline: "a country, described one detail at a time",
    blurb: "GeoGuessr's reasoning without the street view: traffic side, alphabet, " +
      "plug socket, what's on the money. Guess as soon as you dare.",
    parMs: 160000, hasArchive: true, hasPractice: true,
    distLabel: "clues used", stamps: true,
  },
  {
    id: "lingua", name: "LINGUAGUESSR", icon: "🗣️", accent: "--violet", family: "offline",
    tagline: "read the writing, place the language",
    blurb: "A real sentence in a real language. Which script is that, and where do " +
      "they write it? The hints teach you the tells.",
    parMs: 160000, hasArchive: true, hasPractice: true,
    distLabel: "guesses used", stamps: true,
  },

  /* ── SEMANTIC WING (meaning, measured) ────────────────────────────────── */
  {
    id: "linxicon", soon: true, name: "LINXICON", icon: "🔗", accent: "--cool", family: "sem",
    tagline: "chain two far-apart words through meaning",
    blurb: "Two words with nothing in common — until you build the bridge between " +
      "them, one genuine association at a time. Bolder steps, better score.",
    parMs: 240000, hasArchive: true, hasPractice: true,
    distLabel: "links", stamps: false,
  },
  {
    id: "oddone", soon: true, name: "ODD ONE OUT", icon: "🃏", accent: "--gold", family: "sem",
    tagline: "four share a thread. one is an impostor.",
    blurb: "Five words: four belong to a category thousands of people agree on, one " +
      "just sits nearby pretending. Call the impostor, then name the thread.",
    parMs: 150000, hasArchive: true, hasPractice: true,
    distLabel: "rounds", stamps: false,
  },

  /* ── THE LAB (life and machines) ──────────────────────────────────────── */
  {
    id: "phylo", soon: true, name: "PHYLO", icon: "🧬", accent: "--mint", family: "lab",
    tagline: "guess the organism — evolution tells you how close",
    blurb: "Globle on the tree of life. Each wrong species answers with how long ago " +
      "you and it last shared an ancestor, and the taxonomy you have pinned down.",
    parMs: 240000, hasArchive: true, hasPractice: true,
    distLabel: "guesses", stamps: false,
  },
  {
    id: "misaligned", soon: true, name: "MISALIGNED", icon: "📎", accent: "--violet", family: "lab",
    tagline: "the objective was met. that was the problem.",
    blurb: "Real, documented cases of systems gaming their own objectives. Given what " +
      "was asked for, pick what it actually did — then spot the invented incident.",
    parMs: 240000, hasArchive: true, hasPractice: true,
    distLabel: "rounds", stamps: false,
  },
];

window.AD_FAMILIES = {
  word:    { name: "WORD WING",   icon: "🔤", note: "letters, grids and grouping" },
  trade:   { name: "TRADE FLOOR", icon: "📦", note: "what the world sells" },
  geo:     { name: "GEO WING",    icon: "🌍", note: "flags, shapes and grids" },
  photo:   { name: "PICTURE HOUSE", icon: "📷", note: "real photographs — needs a connection" },
  offline: { name: "THE ANNEXE",  icon: "✈️", note: "reinvented to work with no internet at all" },
  sem:     { name: "SEMANTIC WING", icon: "🔗", note: "how words sit next to each other" },
  lab:     { name: "THE LAB",     icon: "🧬", note: "life, machines, and what went wrong" },
  versus:  { name: "THE RING",    icon: "🥊", note: "one device, two people, actually against each other" },
};
