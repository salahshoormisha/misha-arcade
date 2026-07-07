// MISHA-MAN maze — the walls spell M·I·S·H·A (Google-doodle style).
// Legend:
//   #        generic wall (ribs, borders, house shell, islands)
//   M I S H A  letter wall cells (stroked in that letter's neon colour)
//   V        void — impassable hole inside a letter (dark fill, stroked edge)
//   .        pellet path
//   o        power pellet (lip-gloss kiss)
//   (space)  open path, no pellet (tunnel mouths, house surroundings, spawn)
//   =        ghost-house door (ghosts only)
//   g        ghost-house interior
// Grid: 40 cols x 26 rows. Row 17 is the wrap tunnel.
const MAZE_ROWS = [
"########################################",
"#o....................................o#",
"#.#######..##..#######..######..######.#",
"#......................................#",
"#.MM...MM..II..SSSSSSS..HH..HH..AAAAAA.#",
"#.M..M..M..II..SSSSSSS..HH..HH..AAAAAA.#",
"#.M..M..M..II..SS.......HH..HH..AAVVAA.#",
"#.M..M..M..II..SS.......HH..HH..AAVVAA.#",
"#.M..M..M..II..SSSSSSS..HH..HH..AAVVAA.#",
"#.M..M..M..II..SSSSSSS..HHHHHH..AAVVAA.#",
"#.M..M..M..II.......SS..HH..HH..AAAAAA.#",
"#.M..M..M..II.......SS..HH..HH..AA..AA.#",
"#.M..M..M..II.......SS..HH..HH..AA..AA.#",
"#.M..M..M..II..SSSSSSS..HH..HH..AA..AA.#",
"#.M..M..M..II..SSSSSSS..HH..HH..AA..AA.#",
"#......................................#",
"#.#######..##..#######..######..######.#",
"     ..............................     ",
"#.######.######.###==###.######.######.#",
"#.######.######.#gggggg#.######.######.#",
"#.######.######.#gggggg#.######.######.#",
"#.######.######.########.######.######.#",
"#..................  ..................#",
"#.#####..######..######..######..#####.#",
"#o....................................o#",
"########################################",
];

// Letter column stripes (used for the light-up-MISHA meter):
// a letter lights up when every pellet in its column stripe is eaten.
const LETTER_SPANS = { M:[2,8], I:[11,12], S:[15,21], H:[24,29], A:[32,37] };
const LETTER_COLORS = {
  M:"#ff4fd8", I:"#b18cff", S:"#4fd8ff", H:"#ffd84f", A:"#7dffa8",
  wall:"#5b4ee0", void:"#171038",
};
const MAZE_META = {
  tunnelRow: 17,
  door: { row: 18, cols: [19, 20] },
  houseInside: { row: 19.5, cols: [18, 19.7, 21.4] }, // Inbox, Meetings, Budget
  houseExit: { col: 19.5, row: 17 },                  // just above the door
  pacStart: { col: 19.5, row: 22 },
  fruitSpot: { col: 19.5, row: 15 },
};
window.MM_MAZE = { MAZE_ROWS, LETTER_SPANS, LETTER_COLORS, MAZE_META };
