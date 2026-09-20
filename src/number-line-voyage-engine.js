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

export function makeQuestions(islandId, rng = Math.random) {
  const maker = MAKERS[islandId];
  if (!maker) throw new Error(`Unknown island: ${islandId}`);
  const island = ISLANDS.find(x => x.id === islandId);
  return maker(rng).map(question => ({ ...question, hint: question.hint || island.hint }));
}

export function islandById(id) {
  return ISLANDS.find(x => x.id === id);
}
