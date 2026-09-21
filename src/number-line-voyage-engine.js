/* Number Line Voyage — pure content + question engine (no React).
 * Star convention (documented): each island has 5 questions; a question earns
 * 1 star only when answered correctly on the FIRST tap. A retry that lands the
 * right answer earns 0 stars (still encouraging, still moves on). After two
 * wrong taps the answer is shown kindly and play continues — no star lost,
 * because mistakes are part of the voyage.
 */

export const PRAISE = ['Smooth sailing!', 'Star navigator!', 'You cracked it!', 'Brilliant!'];

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const q = (rng, prompt, answer, choices, kind, line = null, hint = '') => ({
  prompt,
  answer,
  choices: shuffle(choices.map(c => (typeof c === 'object' ? c : { label: String(c), value: c })), rng),
  kind,
  line,
  hint,
});

/* ---------- tick generation (shared by the SVG renderer) ----------
 * Ticks snap to multiples of `step`; labeled ("major") ticks snap to
 * multiples of `majorEvery` (default: step). Every major tick is labeled
 * with its exact integer value — the old renderer only labeled a tick when
 * min happened to be a multiple of the step, leaving whole axes bare.
 * Wide ranges adapt: the major spacing grows through nice multiples of
 * step until at most MAX_MAJOR_LABELS labels remain. */
export const MAX_MAJOR_LABELS = 12;

const NICE_MULTS = [1, 2, 2.5, 5];

/** Smallest "nice" number >= x (1/2/2.5/5 × power of 10). */
export function niceCeil(x) {
  if (!(x > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(x));
  for (const m of NICE_MULTS) {
    if (m * p >= x * (1 - 1e-9)) return m * p;
  }
  return 10 * p;
}

function nextNiceMult(k) {
  if (!(k > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(k));
  for (const m of NICE_MULTS) {
    if (m * p > k * (1 + 1e-9)) return m * p;
  }
  return 10 * p;
}

const snapTick = v => {
  const s = Math.round(v * 1e6) / 1e6;
  return s === 0 ? 0 : s; // normalize -0
};

/** Returns { ticks: [{ v, label, major }], majorEvery } for a line spec. */
export function tickMarksFor(spec) {
  const step = spec.step > 0 ? spec.step : 1;
  let majorEvery = spec.majorEvery || step;
  if (!(majorEvery > 0)) majorEvery = step;
  // keep majors aligned to the minor grid
  majorEvery = step * Math.max(1, Math.round(majorEvery / step));
  const span = spec.max - spec.min;
  let guard = 0;
  while (span / majorEvery > MAX_MAJOR_LABELS + 1e-9 && guard < 24) {
    majorEvery = step * nextNiceMult(majorEvery / step);
    guard += 1;
  }
  const majors = [];
  for (let v = Math.ceil(spec.min / majorEvery - 1e-9) * majorEvery;
    v <= spec.max + 1e-9; v += majorEvery) {
    majors.push(snapTick(v));
  }
  const majorSet = new Set(majors);
  const ticks = [];
  for (let v = Math.ceil(spec.min / step - 1e-9) * step;
    v <= spec.max + 1e-9; v += step) {
    const sv = snapTick(v);
    ticks.push({ v: sv, label: String(sv), major: majorSet.has(sv) });
  }
  // never draw a forest of minor ticks on dense lines
  const dense = ticks.length - majors.length > 120;
  return { ticks: dense ? ticks.filter(t => t.major) : ticks, majorEvery };
}

/* Assign mark/candidate labels to vertical rows so neighbors closer than one
 * label-width don't collide. xs must be sorted ascending; returns a row
 * index per entry (0 = default row). */
export function markLabelRows(xs, widths, gap = 6) {
  const rows = new Array(xs.length).fill(0);
  const placed = [];
  xs.forEach((x, i) => {
    let row = 0;
    for (;;) {
      const clash = placed.some(p =>
        p.row === row && Math.abs(p.x - x) < (p.w + widths[i]) / 2 + gap);
      if (!clash) break;
      row += 1;
    }
    rows[i] = row;
    placed.push({ x, w: widths[i], row });
  });
  return rows;
}

export const ISLANDS = [
  {
    id: 'rounding', name: 'Rounding Reef', icon: '⚓', tag: 'Round to the nearest ten or hundred',
    accent: '#cc6b42', hint: 'Check the rhyme: five or more, raise the score!',
    rhyme: 'Four or less? Let it rest. Five or more? Raise the score!',
    steps: [
      'Find which two tens (or hundreds) the number is between.',
      'Mark it on the number line — which ten is it closer to?',
      'Four or less? Let it rest. Five or more? Raise the score!',
    ],
    demo: {
      kind: 'line', min: 30, max: 60, step: 10, mid: 45,
      marks: [{ value: 46, label: '46' }],
      caption: '46 sits between 40 and 50. It is past the middle red mark — closer to 50! So 46 rounds to 50.',
    },
  },
  {
    id: 'addition', name: 'Jumping Jetty', icon: '➕', tag: 'Addition with jumps',
    accent: '#1687a7', hint: 'Jump to the nearest ten first!',
    steps: [
      'Start at the first number.',
      'Jump to the nearest ten.',
      'Jump by tens.',
      'Jump by ones.',
      'Add the jumps!',
    ],
    demo: {
      kind: 'line', min: 55, max: 75, step: 5,
      marks: [{ value: 57, label: '57' }],
      jumps: [[57, 60, '+3'], [60, 70, '+10'], [70, 72, '+2']],
      caption: '57 + 15: hop to 60 (+3), then by tens to 70 (+10), then ones to 72 (+2). 3 + 10 + 2 = 15!',
    },
  },
  {
    id: 'subtraction', name: 'Hop-Back Harbor', icon: '➖', tag: 'Subtraction with jumps',
    accent: '#5e7d4f', hint: 'Start at the smaller number and count up!',
    steps: [
      'Start at the SMALLER number.',
      'Jump up by tens, then ones, to the bigger number.',
      'Add the jumps — that’s the difference!',
    ],
    remember: 'Another way: start at 62, take away 30, then 9: 62 → 32 → 23.',
    demo: {
      kind: 'line', min: 35, max: 65, step: 5,
      marks: [{ value: 39, label: '39' }],
      jumps: [[39, 49, '+10'], [49, 59, '+10'], [59, 62, '+3']],
      caption: '62 − 39: start at 39, count up to 62. 10 + 10 + 3 = 23. The difference is 23!',
    },
  },
  {
    id: 'estimate', name: 'Estimate Cove', icon: '🔍', tag: 'Estimate sums and differences',
    accent: '#bd7c19', hint: 'Round to friendly numbers first!',
    steps: [
      'You don’t need the exact answer — just “about how much.”',
      'Round each number, or pick friendly compatible numbers.',
      'Add or subtract the friendly numbers.',
    ],
    demo: {
      kind: 'equation', equation: '432 + 489 ≈ 400 + 500 = about 900',
      caption: 'Round 432 to 400 and 489 to 500. 400 + 500 = 900. About 900 — no exact math needed!',
    },
  },
  {
    id: 'pattern', name: 'Pattern Port', icon: '🌀', tag: 'Find and continue number patterns',
    accent: '#8d5b9d', hint: 'What changes from one number to the next?',
    steps: [
      'Look at how each number changes to the next.',
      'Say the rule, like “add 4.”',
      'Use the rule to find the missing number.',
    ],
    demo: {
      kind: 'sequence', chips: ['1', '4', '7', '10', '13', '16'], rule: 'Rule: add 3 each time',
      caption: 'Each hop adds 3. After 13 comes 16!',
    },
  },
  {
    id: 'property', name: 'Property Pier', icon: '⚖️', tag: 'Addition properties',
    accent: '#4471b6', hint: 'Read the property cards again: order, grouping, or adding zero?',
    steps: [
      'Commutative: order doesn’t matter. 16 + 9 = 9 + 16.',
      'Associative: grouping doesn’t matter. (16 + 7) + 23 = 16 + (7 + 23).',
      'Identity: adding 0 changes nothing. 7 + 0 = 7.',
    ],
    demo: {
      kind: 'cards',
      cards: [
        ['Order', '8 + 3 = 3 + 8'],
        ['Grouping', '(2 + 5) + 4 = 2 + (5 + 4)'],
        ['Zero', '9 + 0 = 9'],
      ],
      caption: 'Three friendly properties: swap the order, regroup, or add zero.',
    },
  },
  {
    id: 'plot', name: 'Treasure Plot Point', icon: '⭐', tag: 'Plot a 3-digit number',
    accent: '#c58a17', hint: 'Find the hundreds, then use the 50s to help you!',
    steps: [
      'Look! — Look at the number you want to plot. Example: 375.',
      'Find the hundreds! — Find the two hundreds the number is between.',
      'Think! — See how far the number is past the first hundred.',
      'Plot! — Put a point where the number belongs. Label it with the number!',
    ],
    remember: 'Remember: Find the hundreds. Use the 50s to help you. See how far past the first hundred. Plot it. Label it!',
    demo: {
      kind: 'line', min: 0, max: 1000, step: 50, majorEvery: 100,
      marks: [{ value: 375, label: '⭐ 375', star: true }],
      caption: '375 is between 300 and 400 — past the halfway mark 350, closer to 400. Plot the star and label it!',
    },
  },
  {
    id: 'compare', name: 'Pirate Compare Cove', icon: '🏴‍☠️', tag: 'Compare and order numbers',
    accent: '#b7473e', hint: 'Start with the hundreds! Same hundreds? Check the tens. Left on the line means less!',
    cheer: 'You’ve got it, Matie!',
    steps: [
      'Look at the hundreds — the number with more hundreds is greater. (625 > 389)',
      'Look at the tens — if hundreds are the same. (472 > 458)',
      'Look at the ones — if hundreds and tens are the same. (836 > 832)',
      'Use the symbols — > is GREATER THAN, < is LESS THAN, = is EQUAL TO.',
    ],
    remember: 'Pirate tip: 350 is left of 575 on the number line, so 350 < 575.',
    demo: {
      kind: 'equation', equation: '472 > 458',
      line: { min: 400, max: 500, step: 10, marks: [{ value: 458, label: '458' }, { value: 472, label: '472' }] },
      caption: 'Hundreds tie (4 = 4). Tens decide: 7 > 5. So 472 > 458 — and 458 sits left of 472 on the line!',
    },
  },
];

/* ---------------- question makers (all math hand-verified) ---------------- */

function roundQs(rng) {
  // [number, rounded answer, two plausible neighbors, lineMin, lineMax, tickStep]
  const data = [
    [46, 50, 40, 60, 30, 60, 10],
    [63, 60, 70, 50, 50, 80, 10],
    [174, 200, 100, 300, 0, 300, 100],
    [548, 500, 600, 400, 400, 700, 100],
    [718, 700, 800, 600, 600, 900, 100],
  ];
  return shuffle(data, rng).map(([n, ans, w1, w2, min, max, step]) => {
    const place = step === 100 ? 'hundred' : 'ten';
    const lo = Math.floor(n / step) * step, hi = lo + step;
    return q(rng, 
      `Round ${n} to the nearest ${place}.`, ans, [ans, w1, w2], 'line',
      { min, max, step, mid: (lo + hi) / 2, marks: [{ value: n, label: String(n) }] },
    );
  });
}

function addQs(rng) {
  const pairs = [[43, 28], [63, 27], [57, 15], [34, 29], [48, 36]];
  return shuffle(pairs, rng).map(([a, b], i) => {
    const sum = a + b;
    const lo = Math.floor(a / 10) * 10;
    if (i === 0) {
      // strategy check: where does the FIRST jump land?
      const first = Math.ceil(a / 10) * 10;
      const second = first + 10;
      return q(rng,
        `What does the first jump from ${a} land on?`, first, [first, a + 10, sum], 'jumps',
        {
          min: lo, max: sum + 10, step: 5,
          marks: [{ value: a, label: String(a) }],
          jumps: [[a, first, `+${first - a}`], [first, second, `+${second - first}`], [second, sum, `+${sum - second}`]],
        },
        'Jump to the nearest ten first!',
      );
    }
    const first = Math.ceil(a / 10) * 10;
    return q(rng,
      `What is ${a} + ${b}?`, sum, [sum, sum - 10, sum + 10], 'jumps',
      {
        min: lo, max: sum + 10, step: 5,
        marks: [{ value: a, label: String(a) }],
        jumps: [[a, first, `+${first - a}`], [first, sum, `+${sum - first}`]],
      },
    );
  });
}

function subQs(rng) {
  const pairs = [[74, 38], [52, 25], [86, 49], [63, 27], [91, 56]];
  return shuffle(pairs, rng).map(([a, b]) => {
    const d = a - b;
    const up = b + 10;
    return q(rng,
      `What is ${a} − ${b}?`, d, [d, d + 10, d - 10], 'jumps',
      {
        min: b - 5, max: a + 5, step: 5,
        marks: [{ value: b, label: String(b) }],
        jumps: [[b, up, `+${up - b}`], [up, a, `+${a - up}`]],
      },
    );
  });
}

function estimateQs(rng) {
  // [a, signed b, estimate answer, exact (distractor), wild miss, friendly a, friendly b]
  const data = [
    [65, 23, 90, 88, 100, 70, 20],
    [642, -287, 300, 355, 400, 600, 300],
    [432, 489, 900, 921, 800, 400, 500],
    [376, -148, 250, 228, 100, 375, 125],
    [304, 494, 800, 798, 700, 300, 500],
  ];
  return shuffle(data, rng).map(([a, b, ans, exact, wild, fa, fb]) => {
    const op = b < 0 ? '−' : '+';
    return q(rng, 
      `About how much is ${a} ${op} ${Math.abs(b)}?`, ans, [ans, exact, wild], 'equation',
      { equation: `${fa} ${op} ${fb} ≈ ?` },
      'Round to friendly numbers first — the exact answer is a trap!',
    );
  });
}

function patternQs(rng) {
  const arr = [
    q(rng, 'What number is missing?', 44, [44, 42, 46], 'pattern', { chips: ['32', '36', '40', '?', '48'] }),
    q(rng, 'What number is missing?', 77, [77, 78, 82], 'pattern', { chips: ['87', '82', '?', '72'] }),
    q(rng, 'What comes next?', 41, [41, 40, 42], 'pattern', { chips: ['17', '23', '29', '35', '?'] }),
    q(rng, 'Is 5 + 8 even or odd?', 'Odd', ['Even', 'Odd'], 'equation', { equation: '5 + 8 = 13' }),
    q(rng, 'What comes next?', 34, [34, 35, 36], 'pattern', { chips: ['58', '52', '46', '40', '?'] }),
  ];
  return shuffle(arr, rng);
}

function propertyQs(rng) {
  const data = [
    ['16 + 9 = 9 + 16', 'Commutative'],
    ['(16 + 7) + 23 = 16 + (7 + 23)', 'Associative'],
    ['7 + 0 = 7', 'Identity'],
    ['4 + (6 + 8) = (4 + 6) + 8', 'Associative'],
    ['32 + 15 = 15 + 32', 'Commutative'],
  ];
  return shuffle(data, rng).map(([eq, ans]) =>
    q(rng, 'Which property is this?', ans, ['Commutative', 'Associative', 'Identity'], 'equation', { equation: eq }));
}

function plotQs(rng) {
  const warmup = 375; // the report's worked example, always the warm-up
  const low = Math.floor(warmup / 100) * 100, high = low + 100;
  const between = `${low} and ${high}`;
  const out = [
    q(rng, `${warmup} is between which two hundreds?`, between,
      [between, `${low - 100} and ${low}`, `${high} and ${high + 100}`],
      'line', { min: 0, max: 1000, step: 50, majorEvery: 100 }),
  ];
  const rest = shuffle([175, 325, 475, 625, 875], rng).slice(0, 4);
  for (const n of rest) {
    const lo2 = Math.floor(n / 100) * 100;
    // wrong side of the halfway point: mirror n across lo2+50
    const mirrored = lo2 + (100 - (n % 100));
    const vals = shuffle([n, n - 100, mirrored], rng);
    const labels = ['A', 'B', 'C'];
    out.push(q(rng, 
      `Where does ${n} belong?`, labels[vals.indexOf(n)],
      labels.map((l, j) => ({ label: `⭐ ${l}`, value: l })),
      'candidates',
      {
        min: 0, max: 1000, step: 50, majorEvery: 100,
        candidates: vals.map((v, j) => ({ value: v, label: labels[j] })),
      },
    ));
  }
  return out;
}

function compareQs(rng) {
  const pairs = [[625, 389], [472, 458], [836, 832], [350, 575], [444, 444]];
  return shuffle(pairs, rng).map(([a, b], i) => {
    const ans = a > b ? '>' : a < b ? '<' : '=';
    const min = Math.max(0, Math.floor((Math.min(a, b) - 50) / 50) * 50);
    const max = Math.min(1000, Math.ceil((Math.max(a, b) + 50) / 50) * 50);
    // every question gets a line (odd ones used to render nothing); the step
    // snaps to a nice number so ticks land on clean, labelable values.
    const lineSpec = {
      min,
      max,
      step: niceCeil(Math.max(10, (max - min) / 5)),
      marks: [{ value: a, label: String(a) }, { value: b, label: String(b) }],
    };
    return q(rng,
      i % 2 ? `Which symbol makes this true: ${a} __ ${b}?` : `Compare ${a} and ${b}.`,
      ans, ['>', '<', '='], 'compare', lineSpec,
    );
  });
}

const MAKERS = {
  rounding: roundQs, addition: addQs, subtraction: subQs, estimate: estimateQs,
  pattern: patternQs, property: propertyQs, plot: plotQs, compare: compareQs,
};

/* ---------- difficulty pools (medium / hard) ----------
 * Simple is today's exact 5-question behavior (the makers above, untouched).
 * Medium/hard are fresh 16-question pools per island; makeQuestions draws
 * 5 unique questions per call, preferring ones not seen recently. Pool makers
 * keep data order fixed so tests are deterministic — only the draw shuffles.
 * All jump labels are `+${b-a}`, the convention the demos teach. */

// Decompose b into unit-friendly jumps starting at a (addition).
function addJumps(a, b, unit) { // unit 10 (medium) or 100 (hard)
  const jumps = []; let from = a;
  const first = Math.ceil(a / unit) * unit;
  if (first > from) { jumps.push([from, first, `+${first - from}`]); from = first; }
  let rest = b - (first - a);
  for (const u of (unit >= 100 ? [100, 10] : [10])) { while (rest >= u) { jumps.push([from, from + u, `+${u}`]); from += u; rest -= u; } }
  if (rest > 0) jumps.push([from, from + rest, `+${rest}`]);
  return jumps;
}

// Count up from b to a in unit-friendly jumps (subtraction).
function countUpJumps(b, a, unit) {
  const jumps = []; let from = b;
  const first = Math.ceil(b / unit) * unit;
  if (first > from) { jumps.push([from, first, `+${first - from}`]); from = first; }
  for (const u of (unit >= 100 ? [100, 10] : [10])) { while (from + u <= a) { jumps.push([from, from + u, `+${u}`]); from += u; } }
  if (from < a) jumps.push([from, a, `+${a - from}`]);
  return jumps;
}

// Number-line spec for compare questions; float-safe via 1e-9 epsilons and a 6-decimal snap.
function compareLine(a, b, pad, minStep) {
  const loV = Math.min(a, b) - pad, hiV = Math.max(a, b) + pad;
  const step = niceCeil(Math.max(minStep, (hiV - loV) / 5));
  const snap6 = v => Math.round(v * 1e6) / 1e6;
  const min = snap6(Math.floor(loV / step + 1e-9) * step);
  const max = snap6(Math.ceil(hiV / step - 1e-9) * step);
  return { min, max, step, marks: [{ value: a, label: String(a) }, { value: b, label: String(b) }] };
}

function roundingPool(rng, difficulty) {
  // [number, place]; 3-digit to nearest ten/hundred (medium), 4-digit to nearest hundred/thousand (hard)
  const data = difficulty === 'medium'
    ? [[246, 10], [472, 100], [381, 10], [529, 100], [164, 10], [736, 100], [295, 10], [618, 100],
      [447, 10], [883, 100], [129, 10], [354, 100], [576, 10], [941, 100], [208, 10], [667, 100]]
    : [[2431, 100], [5876, 1000], [3150, 100], [7492, 1000], [1864, 100], [9218, 1000], [4375, 100], [6548, 1000],
      [1289, 100], [8364, 1000], [5712, 100], [2946, 1000], [6837, 100], [4159, 1000], [9524, 100], [1785, 1000]];
  return data.map(([n, place]) => {
    const ans = Math.round(n / place) * place;
    const lo = Math.floor(n / place) * place, hi = lo + place;
    const placeName = place === 1000 ? 'thousand' : place === 100 ? 'hundred' : 'ten';
    return q(rng,
      `Round ${n} to the nearest ${placeName}.`, ans, [ans, ans - place, ans + place], 'line',
      { min: lo - place, max: hi + place, step: place === 100 ? 100 : 10, mid: (lo + hi) / 2, marks: [{ value: n, label: String(n) }] },
    );
  });
}

function additionPool(rng, difficulty) {
  const medium = difficulty === 'medium';
  const unit = medium ? 10 : 100, step = medium ? 10 : 50;
  const pairs = medium
    ? [[58, 47], [76, 58], [49, 86], [67, 75], [84, 39], [56, 97], [93, 68], [45, 78],
      [79, 84], [68, 59], [87, 46], [59, 95], [96, 57], [74, 88], [65, 69], [88, 77]]
    : [[145, 236], [327, 158], [486, 274], [253, 389], [518, 246], [394, 187], [672, 158], [245, 467],
      [538, 293], [186, 475], [427, 356], [765, 187], [348, 524], [596, 238], [473, 369], [289, 546]];
  const unitWord = medium ? 'ten' : 'hundred';
  return pairs.map(([a, b], i) => {
    const sum = a + b;
    const jumps = addJumps(a, b, unit);
    const line = {
      min: Math.floor(a / unit) * unit, max: sum + unit, step,
      marks: [{ value: a, label: String(a) }], jumps,
    };
    if (i % 4 === 0) {
      // strategy check: where does the FIRST jump land?
      const first = jumps[0][1];
      return q(rng,
        `What does the first jump from ${a} land on?`, first, [first, first + unit, first - unit], 'jumps',
        line, `Jump to the nearest ${unitWord} first!`,
      );
    }
    return q(rng, `What is ${a} + ${b}?`, sum, [sum, sum - unit, sum + unit], 'jumps', line);
  });
}

function subtractionPool(rng, difficulty) {
  const medium = difficulty === 'medium';
  const unit = medium ? 10 : 100, step = medium ? 10 : 50;
  const pairs = medium
    ? [[92, 34], [85, 27], [74, 38], [96, 58], [83, 45], [71, 29], [98, 36], [87, 49],
      [94, 57], [76, 18], [89, 63], [97, 29], [82, 54], [75, 47], [91, 68], [86, 59]]
    : [[452, 187], [736, 258], [624, 376], [815, 467], [543, 289], [928, 574], [467, 198], [853, 386],
      [675, 297], [942, 658], [538, 274], [786, 498], [459, 183], [834, 456], [697, 349], [915, 637]];
  return pairs.map(([a, b]) => {
    const d = a - b;
    const jumps = countUpJumps(b, a, unit);
    return q(rng,
      `What is ${a} − ${b}?`, d, [d, d + unit, d - unit], 'jumps',
      {
        min: Math.floor(b / unit) * unit - unit, max: a + unit, step,
        marks: [{ value: b, label: String(b) }], jumps,
      },
    );
  });
}

function estimatePool(rng, difficulty) {
  // [a, signed b, estimate answer, exact (distractor), wild miss, friendly a, friendly b]
  const data = difficulty === 'medium'
    ? [[248, 391, 650, 639, 700, 250, 400], [562, -218, 400, 344, 500, 600, 200],
      [175, 284, 500, 459, 600, 200, 300], [436, -159, 200, 277, 100, 400, 200],
      [329, 468, 800, 797, 700, 300, 500], [714, -286, 400, 428, 500, 700, 300],
      [156, 342, 500, 498, 400, 200, 300], [683, -347, 400, 336, 300, 700, 300],
      [425, 368, 800, 793, 900, 400, 400], [291, -134, 200, 157, 100, 300, 100],
      [548, 246, 700, 794, 800, 500, 200], [836, -418, 400, 418, 500, 800, 400],
      [264, 519, 800, 783, 900, 300, 500], [475, -286, 200, 189, 300, 500, 300],
      [382, 417, 800, 799, 700, 400, 400], [629, -345, 300, 284, 200, 600, 300]]
    : [[2431, 5876, 8000, 8307, 9000, 2000, 6000], [5204, -1876, 3000, 3328, 4000, 5000, 2000],
      [3185, 4214, 7000, 7399, 8000, 3000, 4000], [7642, -2954, 5000, 4688, 4000, 8000, 3000],
      [1836, 5927, 8000, 7763, 7000, 2000, 6000], [4578, -2134, 3000, 2444, 2000, 5000, 2000],
      [6234, 2816, 9000, 9050, 10000, 6000, 3000], [8921, -3478, 6000, 5443, 5000, 9000, 3000],
      [2748, 5362, 8000, 8110, 9000, 3000, 5000], [6315, -1842, 4000, 4473, 5000, 6000, 2000],
      [1492, 6678, 8000, 8170, 9000, 1000, 7000], [5864, -3918, 2000, 1946, 1000, 6000, 4000],
      [4327, 3186, 7000, 7513, 8000, 4000, 3000], [7156, -4284, 3000, 2872, 2000, 7000, 4000],
      [2963, 5841, 9000, 8804, 8000, 3000, 6000], [8437, -5216, 3000, 3221, 4000, 8000, 5000]];
  return data.map(([a, b, ans, exact, wild, fa, fb]) => {
    const op = b < 0 ? '−' : '+';
    return q(rng,
      `About how much is ${a} ${op} ${Math.abs(b)}?`, ans, [ans, exact, wild], 'equation',
      { equation: `${fa} ${op} ${fb} ≈ ?` },
      'Round to friendly numbers first — the exact answer is a trap!',
    );
  });
}

// arithmetic sequence chips: [start, step, len, missing]
function arithmeticQ(rng, start, step, len, missing) {
  const ans = start + step * missing;
  const chips = [];
  for (let i = 0; i < len; i += 1) chips.push(i === missing ? '?' : String(start + step * i));
  return q(rng, missing === 4 ? 'What comes next?' : 'What number is missing?',
    ans, [ans, ans - step, ans + step], 'pattern', { chips });
}

// doubling/halving sequence chips: vals are start * mult^i
function multQ(rng, start, mult, len, missing) {
  const vals = [];
  for (let i = 0; i < len; i += 1) vals.push(start * mult ** i);
  const ans = vals[missing];
  const chips = vals.map((v, i) => (i === missing ? '?' : String(v)));
  return q(rng, missing === 4 ? 'What comes next?' : 'What number is missing?',
    ans, [ans, ans / 2, ans * 2], 'pattern', { chips });
}

function eoQ(rng, a, b) {
  const sum = a + b;
  return q(rng, `Is ${a} + ${b} even or odd?`, sum % 2 ? 'Odd' : 'Even',
    ['Even', 'Odd'], 'equation', { equation: `${a} + ${b} = ${sum}` });
}

function patternPool(rng, difficulty) {
  const out = [];
  const arith = difficulty === 'medium'
    ? [[12, 4, 5, 3], [25, 5, 5, 4], [100, 10, 5, 2], [36, 6, 5, 3], [15, 7, 5, 1], [200, 25, 5, 4],
      [48, 8, 5, 0], [90, 12, 5, 2], [7, 9, 5, 4], [150, 15, 5, 3], [60, 11, 5, 1], [33, 13, 5, 4],
      [80, 16, 5, 2], [5, 14, 5, 3]]
    : [[120, 25, 5, 4], [350, 50, 5, 2], [75, 125, 5, 3], [480, 60, 5, 1], [95, 85, 5, 4],
      [220, 140, 5, 2], [60, 220, 5, 3], [1000, 150, 5, 4], [310, 90, 5, 0], [45, 175, 5, 2]];
  for (const [start, step, len, missing] of arith) out.push(arithmeticQ(rng, start, step, len, missing));
  if (difficulty === 'hard') {
    out.push(multQ(rng, 3, 2, 5, 4), multQ(rng, 5, 2, 5, 3),
      multQ(rng, 160, 0.5, 5, 4), multQ(rng, 96, 0.5, 5, 2));
    out.push(eoQ(rng, 125, 248), eoQ(rng, 360, 214));
  } else {
    out.push(eoQ(rng, 24, 35), eoQ(rng, 46, 28));
  }
  return out;
}

function propertyPool(rng, difficulty) {
  // [equation, answer]; medium 6 commutative / 6 associative / 4 identity
  const data = difficulty === 'medium'
    ? [['24 + 35 = 35 + 24', 'Commutative'], ['58 + 17 = 17 + 58', 'Commutative'],
      ['46 + 29 = 29 + 46', 'Commutative'], ['73 + 38 = 38 + 73', 'Commutative'],
      ['19 + 64 = 64 + 19', 'Commutative'], ['87 + 25 = 25 + 87', 'Commutative'],
      ['(18 + 22) + 30 = 18 + (22 + 30)', 'Associative'], ['(45 + 15) + 25 = 45 + (15 + 25)', 'Associative'],
      ['(36 + 14) + 50 = 36 + (14 + 50)', 'Associative'], ['(27 + 33) + 40 = 27 + (33 + 40)', 'Associative'],
      ['(52 + 18) + 30 = 52 + (18 + 30)', 'Associative'], ['(64 + 26) + 14 = 64 + (26 + 14)', 'Associative'],
      ['46 + 0 = 46', 'Identity'], ['0 + 83 = 83', 'Identity'],
      ['57 + 0 = 57', 'Identity'], ['0 + 92 = 92', 'Identity']]
    : [['125 + 340 = 340 + 125', 'Commutative'], ['486 + 214 = 214 + 486', 'Commutative'],
      ['357 + 243 = 243 + 357', 'Commutative'], ['618 + 182 = 182 + 618', 'Commutative'],
      ['249 + 751 = 751 + 249', 'Commutative'],
      ['(150 + 250) + 300 = 150 + (250 + 300)', 'Associative'], ['(345 + 155) + 200 = 345 + (155 + 200)', 'Associative'],
      ['(420 + 180) + 250 = 420 + (180 + 250)', 'Associative'], ['(275 + 125) + 400 = 275 + (125 + 400)', 'Associative'],
      ['(132 + 268) + 300 = 132 + (268 + 300)', 'Associative'], ['(560 + 140) + 160 = 560 + (140 + 160)', 'Associative'],
      ['308 + 0 = 308', 'Identity'], ['0 + 475 = 475', 'Identity'], ['629 + 0 = 629', 'Identity'],
      ['0 + 814 = 814', 'Identity'], ['950 + 0 = 950', 'Identity']];
  return data.map(([eq, ans]) =>
    q(rng, 'Which property is this?', ans, ['Commutative', 'Associative', 'Identity'], 'equation', { equation: eq }));
}

function plotPool(rng, difficulty) {
  const medium = difficulty === 'medium';
  // sparser labels (medium) and widest range (hard)
  const spec = medium
    ? { min: 0, max: 1000, step: 100, majorEvery: 200 }
    : { min: 0, max: 2000, step: 100, majorEvery: 500 };
  const blockSize = medium ? 100 : 200;
  const warmups = medium ? [412, 758, 236, 895] : [1125, 1460, 1780, 1330];
  const numbers = medium
    ? [215, 340, 480, 525, 610, 745, 830, 960, 275, 455, 690, 875]
    : [215, 480, 625, 890, 1040, 1290, 1525, 1710, 380, 760, 1180, 1640];
  const out = warmups.map(n => {
    const lo = Math.floor(n / 100) * 100;
    const between = `${lo} and ${lo + 100}`;
    return q(rng, `${n} is between which two hundreds?`, between,
      [between, `${lo - 100} and ${lo}`, `${lo + 100} and ${lo + 200}`],
      'line', { min: spec.min, max: spec.max, step: spec.step, majorEvery: spec.majorEvery });
  });
  const labels = ['A', 'B', 'C'];
  for (const n of numbers) {
    const block = Math.floor(n / blockSize) * blockSize;
    // wrong side of the halfway point: mirror n across block+blockSize/2
    const mirrored = block + (blockSize - (n % blockSize));
    const off = n - blockSize;
    const vals = shuffle([n, off, mirrored], rng);
    out.push(q(rng,
      `Where does ${n} belong?`, labels[vals.indexOf(n)],
      labels.map((l, j) => ({ label: `⭐ ${l}`, value: l })),
      'candidates',
      { ...spec, candidates: vals.map((v, j) => ({ value: v, label: labels[j] })) },
    ));
  }
  return out;
}

function comparePool(rng, difficulty) {
  const medium = difficulty === 'medium';
  const pad = medium ? 150 : 0.15, minStep = medium ? 10 : 0.01;
  const pairs = medium
    ? [[1234, 1324], [2456, 2416], [3789, 3789], [5102, 4988], [2874, 2874], [6345, 6435],
      [1998, 2008], [7765, 7756], [4509, 4509], [8234, 8324], [5671, 5617], [3128, 3218],
      [9087, 9078], [1456, 1546], [6890, 6890], [2743, 2734]]
    : [[2.7, 2.65], [0.6, 0.59], [3.45, 3.54], [1.2, 1.25], [4.8, 4.8], [0.75, 0.8],
      [5.3, 5.29], [2.25, 2.25], [7.6, 7.56], [1.05, 1.5], [3.3, 3.3], [9.4, 9.39],
      [0.45, 0.54], [6.7, 6.7], [8.15, 8.2], [4.44, 4.4]];
  return pairs.map(([a, b], i) => {
    const ans = a > b ? '>' : a < b ? '<' : '=';
    return q(rng,
      i % 2 ? `Which symbol makes this true: ${a} __ ${b}?` : `Compare ${a} and ${b}.`,
      ans, ['>', '<', '='], 'compare', compareLine(a, b, pad, minStep),
    );
  });
}

const POOL_MAKERS = {
  rounding: roundingPool, addition: additionPool, subtraction: subtractionPool, estimate: estimatePool,
  pattern: patternPool, property: propertyPool, plot: plotPool, compare: comparePool,
};

const KNOWN_DIFFICULTIES = ['simple', 'medium', 'hard'];
const normDifficulty = d => (KNOWN_DIFFICULTIES.includes(d) ? d : 'simple');

/* Full question pool for an island + difficulty: today's exact 5 questions for
 * 'simple', 16 fresh ones for 'medium'/'hard'. Every question carries a stable
 * key `${islandId}:${difficulty}:${i}` so draws can avoid recently-seen ones. */
export function questionPool(islandId, difficulty = 'simple', rng = Math.random) {
  if (typeof difficulty === 'function') { rng = difficulty; difficulty = 'simple'; }
  difficulty = normDifficulty(difficulty);
  const maker = MAKERS[islandId];
  if (!maker) throw new Error(`Unknown island: ${islandId}`);
  const island = ISLANDS.find(x => x.id === islandId);
  const pool = difficulty === 'simple' ? maker(rng) : POOL_MAKERS[islandId](rng, difficulty);
  return pool.map((question, i) => ({
    ...question,
    key: `${islandId}:${difficulty}:${i}`,
    hint: question.hint || island.hint,
  }));
}

export function makeQuestions(islandId, difficulty = 'simple', rng = Math.random, recent = []) {
  if (typeof difficulty === 'function') { rng = difficulty; difficulty = 'simple'; recent = []; }
  difficulty = normDifficulty(difficulty);
  // simple: today's exact 5 questions, untouched — no draw, no reorder
  if (difficulty === 'simple') return questionPool(islandId, 'simple', rng);
  // medium/hard: draw 5 unique questions from the 16-pool, preferring
  // questions whose key hasn't been seen recently in this session
  const seen = new Set(recent);
  const pool = questionPool(islandId, difficulty, rng);
  const fresh = shuffle(pool.filter(qq => !seen.has(qq.key)), rng);
  const stale = shuffle(pool.filter(qq => seen.has(qq.key)), rng);
  return [...fresh, ...stale].slice(0, 5);
}

export function islandById(id) {
  return ISLANDS.find(x => x.id === id);
}
