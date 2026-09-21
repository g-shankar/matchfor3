import test from 'node:test';
import assert from 'node:assert/strict';
import { ISLANDS, islandById, makeQuestions, questionPool, PRAISE, tickMarksFor, markLabelRows, niceCeil } from '../src/number-line-voyage-engine.js';

const seeded = seed => () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);

const EXPECTED_IDS = ['rounding', 'addition', 'subtraction', 'estimate', 'pattern', 'property', 'plot', 'compare'];

test('all eight islands exist with full teacher-strategy content', () => {
  assert.deepEqual(ISLANDS.map(x => x.id), EXPECTED_IDS);
  for (const isl of ISLANDS) {
    assert.ok(isl.name && isl.icon && isl.tag, `${isl.id} metadata`);
    assert.ok(Array.isArray(isl.steps) && isl.steps.length >= 3, `${isl.id} steps`);
    assert.ok(isl.hint && isl.hint.length > 5, `${isl.id} hint`);
    assert.ok(isl.demo && isl.demo.kind, `${isl.id} demo`);
    assert.equal(islandById(isl.id), isl);
  }
});

test('every island yields 5 well-formed questions across many seeds', () => {
  for (const isl of ISLANDS) {
    for (let seed = 1; seed <= 40; seed += 1) {
      const qs = makeQuestions(isl.id, seeded(seed));
      assert.equal(qs.length, 5, `${isl.id} seed ${seed}`);
      for (const q of qs) {
        assert.ok(q.prompt && q.prompt.length > 3, `${isl.id} prompt`);
        assert.ok(q.hint && q.hint.length > 5, `${isl.id} hint on ${q.prompt}`);
        const vals = q.choices.map(c => String(c.value));
        assert.ok(vals.length >= 2, `${isl.id} choices on ${q.prompt}`);
        assert.ok(vals.includes(String(q.answer)), `${isl.id} answer present: ${q.prompt}`);
        assert.equal(new Set(vals).size, vals.length, `${isl.id} unique choices: ${q.prompt}`);
      }
    }
  }
});

function findQuestion(islandId, needle) {
  for (let seed = 1; seed <= 60; seed += 1) {
    for (const q of makeQuestions(islandId, seeded(seed))) {
      if (q.prompt.includes(needle)) return q;
    }
  }
  throw new Error(`never generated: ${islandId} / ${needle}`);
}

test('rounding: rhyme cases round exactly right', () => {
  const cases = [['Round 46', 50], ['Round 63', 60], ['Round 174', 200], ['Round 548', 500], ['Round 718', 700]];
  for (const [needle, ans] of cases) assert.equal(findQuestion('rounding', needle).answer, ans, needle);
});

test('addition: sums are exact, first-jump lands on the nearest ten', () => {
  const sums = [['43 + 28', 71], ['63 + 27', 90], ['57 + 15', 72], ['34 + 29', 63], ['48 + 36', 84]];
  for (const [needle, ans] of sums) assert.equal(findQuestion('addition', needle).answer, ans, needle);
  // 57+15 jump totals: +3, +10, +2 = 15, landing at 72
  const demo = islandById('addition').demo;
  assert.deepEqual(demo.jumps.map(j => j[2]), ['+3', '+10', '+2']);
  assert.equal(demo.jumps.reduce((t, j) => t + (j[1] - j[0]), 0), 15);
  assert.equal(demo.jumps.at(-1)[1], 72);
  // strategy-check questions: first jump from a lands on ceil(a/10)*10
  for (let seed = 1; seed <= 60; seed += 1) {
    for (const q of makeQuestions('addition', seeded(seed))) {
      if (!q.prompt.includes('first jump')) continue;
      const a = Number(q.prompt.match(/from (\d+)/)[1]);
      assert.equal(q.answer, Math.ceil(a / 10) * 10, q.prompt);
    }
  }
});

test('subtraction: differences are exact; 62-39 count-up demo totals 23', () => {
  const diffs = [['74 − 38', 36], ['52 − 25', 27], ['86 − 49', 37], ['63 − 27', 36], ['91 − 56', 35]];
  for (const [needle, ans] of diffs) assert.equal(findQuestion('subtraction', needle).answer, ans, needle);
  const demo = islandById('subtraction').demo;
  assert.deepEqual(demo.jumps.map(j => j[2]), ['+10', '+10', '+3']);
  assert.equal(demo.jumps.reduce((t, j) => t + (j[1] - j[0]), 0), 23);
});

test('estimate: exact answers are distractors, estimates are the sensible pick', () => {
  const cases = [
    ['65 + 23', 90, 88], ['642 − 287', 300, 355], ['432 + 489', 900, 921],
    ['376 − 148', 250, 228], ['304 + 494', 800, 798],
  ];
  for (const [needle, est, exact] of cases) {
    const q = findQuestion('estimate', needle);
    assert.equal(q.answer, est, needle);
    assert.ok(q.choices.map(c => c.value).includes(exact), `${needle} exact distractor`);
  }
});

test('pattern: rules and the even/odd check are exact', () => {
  const byChips = chips => {
    for (let seed = 1; seed <= 60; seed += 1) {
      for (const q of makeQuestions('pattern', seeded(seed))) {
        if (q.kind === 'pattern' && q.line.chips.join(',').includes(chips)) return q;
      }
    }
    throw new Error(`pattern chips never generated: ${chips}`);
  };
  assert.equal(byChips('32,36,40').answer, 44); // 32,36,40,?,48
  assert.equal(byChips('87,82').answer, 77); // 87,82,?,72
  assert.equal(byChips('17,23,29,35').answer, 41);
  assert.equal(byChips('58,52,46,40').answer, 34);
  const chipsOf = q => q.line.chips.map(c => (c === '?' ? q.answer : Number(c)));
  for (let seed = 1; seed <= 20; seed += 1) {
    for (const q of makeQuestions('pattern', seeded(seed))) {
      if (q.kind !== 'pattern') {
        assert.ok(q.prompt.includes('even or odd'));
        assert.equal(q.answer, 'Odd');
        continue;
      }
      const nums = chipsOf(q);
      const step = nums[1] - nums[0];
      for (let i = 2; i < nums.length; i += 1) assert.equal(nums[i] - nums[i - 1], step, q.prompt);
    }
  }
});

test('property: the five equations classify correctly', () => {
  const byEquation = eq => {
    for (let seed = 1; seed <= 60; seed += 1) {
      for (const q of makeQuestions('property', seeded(seed))) {
        if (q.line && q.line.equation === eq) return q;
      }
    }
    throw new Error(`property equation never generated: ${eq}`);
  };
  const cases = [
    ['16 + 9 = 9 + 16', 'Commutative'], ['(16 + 7) + 23 = 16 + (7 + 23)', 'Associative'],
    ['7 + 0 = 7', 'Identity'], ['4 + (6 + 8) = (4 + 6) + 8', 'Associative'], ['32 + 15 = 15 + 32', 'Commutative'],
  ];
  for (const [eq, ans] of cases) {
    const q = byEquation(eq);
    assert.equal(q.answer, ans, eq);
    assert.deepEqual(q.choices.map(c => c.value).sort(), ['Associative', 'Commutative', 'Identity']);
  }
});

test('plot: 375 sits between 300 and 400; star spots are unambiguous', () => {
  const warm = findQuestion('plot', '375 is between');
  assert.equal(warm.answer, '300 and 400');
  for (let seed = 1; seed <= 40; seed += 1) {
    for (const q of makeQuestions('plot', seeded(seed))) {
      if (q.kind !== 'candidates') continue;
      const n = Number(q.prompt.match(/Where does (\d+) belong/)[1]);
      const cands = q.line.candidates;
      assert.equal(cands.length, 3);
      assert.equal(new Set(cands.map(c => c.value)).size, 3, `distinct spots for ${n}`);
      const right = cands.find(c => c.value === n);
      assert.ok(right, `star spot exists for ${n}`);
      assert.equal(q.answer, right.label);
      // distractors: one hundred off, and the wrong side of the halfway point
      const lo = Math.floor(n / 100) * 100;
      const others = cands.map(c => c.value).filter(v => v !== n);
      assert.ok(others.includes(n - 100), `${n}: hundred-off distractor`);
      const mirrored = others.find(v => v !== n - 100);
      assert.ok((n > lo + 50 && mirrored < lo + 50) || (n < lo + 50 && mirrored > lo + 50), `${n}: mirrored distractor`);
    }
  }
});

test('compare: 472 > 458 and the pirate rules hold', () => {
  const q = findQuestion('compare', '472');
  assert.equal(q.answer, '>');
  const cases = [['625', '389', '>'], ['836', '832', '>'], ['350', '575', '<'], ['444', '444', '=']];
  for (const [a, b, ans] of cases) {
    let found = null;
    for (let seed = 1; seed <= 60 && !found; seed += 1) {
      for (const cand of makeQuestions('compare', seeded(seed))) {
        if (cand.prompt.includes(a) && cand.prompt.includes(b)) { found = cand; break; }
      }
    }
    assert.ok(found, `${a} vs ${b} generated`);
    assert.equal(found.answer, ans, `${a} vs ${b}`);
  }
});

test('demo specs are drawable number lines', () => {
  for (const isl of ISLANDS) {
    const d = isl.demo;
    if (d.kind === 'line') {
      assert.ok(d.min < d.max, `${isl.id} bounds`);
      assert.ok(d.step > 0, `${isl.id} step`);
      for (const m of d.marks || []) assert.ok(m.value >= d.min && m.value <= d.max, `${isl.id} mark in bounds`);
      for (const [a, b] of d.jumps || []) assert.ok(a >= d.min && b <= d.max && b > a, `${isl.id} jump in bounds`);
    }
  }
});

test('praise pool is non-empty and pirate island cheers like a pirate', () => {
  assert.ok(PRAISE.length >= 3);
  assert.equal(islandById('compare').cheer, 'You’ve got it, Matie!');
});

test('unknown island id throws', () => {
  assert.throws(() => makeQuestions('atlantis'), /Unknown island/);
});

test('tickMarksFor: subtraction-style axes label every multiple of the step', () => {
  // min=44 is not a multiple of 5 — the old 1e-9 test labeled zero ticks
  const { ticks } = tickMarksFor({ min: 44, max: 91, step: 5 });
  const majors = ticks.filter(t => t.major);
  assert.ok(majors.length >= 8, `labeled ticks, got ${majors.length}`);
  for (const m of majors) {
    assert.ok(Number.isInteger(m.v), `integer tick ${m.v}`);
    assert.equal(m.v % 5, 0, `multiple of step: ${m.v}`);
    assert.equal(m.label, String(m.v), 'clean integer label');
  }
  assert.ok(majors.some(m => m.v === 60), '60 is labeled');
  assert.ok(majors.some(m => m.v === 45), 'first tick 45 is labeled');
});

test('tickMarksFor: addition first-jump landings sit on labeled ticks', () => {
  const t1 = tickMarksFor({ min: 40, max: 81, step: 5 });
  assert.ok(t1.ticks.some(t => t.major && t.v === 50), '43+28: 50 labeled');
  const t3 = tickMarksFor({ min: 40, max: 94, step: 5 });
  assert.ok(t3.ticks.some(t => t.major && t.v === 50), '48+36: 50 labeled');
  assert.ok(t3.ticks.some(t => t.major && t.v === 85), '48+36: 85 labeled');
});

test('tickMarksFor: plot 0–1000 keeps every hundred labeled', () => {
  const { ticks } = tickMarksFor({ min: 0, max: 1000, step: 50, majorEvery: 100 });
  const majors = ticks.filter(t => t.major).map(t => t.v);
  assert.deepEqual(majors, [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
});

test('tickMarksFor: adaptive density caps labels on wide ranges', () => {
  const { ticks, majorEvery } = tickMarksFor({ min: 0, max: 10000, step: 50, majorEvery: 100 });
  const majors = ticks.filter(t => t.major);
  assert.ok(majors.length <= 12, `got ${majors.length} labels`);
  assert.ok(majors.length >= 2, 'still has labels');
  assert.ok(majorEvery % 50 === 0, 'major spacing stays on the minor grid');
  for (const m of majors) assert.ok(Number.isInteger(m.v), `integer ${m.v}`);
});

test('tickMarksFor: no decimal labels ever leak through', () => {
  const { ticks } = tickMarksFor({ min: 33, max: 79, step: 5 });
  for (const t of ticks.filter(x => x.major)) {
    assert.match(t.label, /^-?\d+$/, `clean label: ${t.label}`);
  }
});

test('niceCeil snaps compare steps to friendly numbers', () => {
  assert.equal(niceCeil(30), 50);
  assert.equal(niceCeil(80), 100);
  assert.equal(niceCeil(70), 100);
  assert.equal(niceCeil(10), 10);
});

test('markLabelRows: coincident labels stagger, separated ones share a row', () => {
  assert.notDeepEqual(markLabelRows([100, 100], [40, 40]), [0, 0]);
  assert.deepEqual(markLabelRows([100, 300], [40, 40]), [0, 0]);
  // three in a pile cascade to three rows
  assert.deepEqual(markLabelRows([50, 52, 54], [40, 40, 40]), [0, 1, 2]);
});

test('quiz jumps carry the +N labels the demo teaches', () => {
  for (const isl of ['addition', 'subtraction']) {
    for (let seed = 1; seed <= 25; seed += 1) {
      for (const qq of makeQuestions(isl, seeded(seed))) {
        for (const [a, b, label] of qq.line.jumps) {
          assert.equal(label, `+${b - a}`, `${isl}: ${qq.prompt} jump ${a}→${b}`);
        }
      }
    }
  }
});

test('compare: every question now renders a labeled number line', () => {
  for (let seed = 1; seed <= 30; seed += 1) {
    for (const qq of makeQuestions('compare', seeded(seed))) {
      assert.ok(qq.line, `line present: ${qq.prompt}`);
      assert.ok(qq.line.min < qq.line.max && qq.line.step > 0, `sane spec: ${qq.prompt}`);
      const { ticks } = tickMarksFor(qq.line);
      const majors = ticks.filter(t => t.major);
      assert.ok(majors.length >= 2, `labeled ticks: ${qq.prompt}`);
      for (const m of majors) {
        assert.ok(Number.isInteger(m.v), `integer tick ${m.v}: ${qq.prompt}`);
      }
      // both compared numbers sit inside the axis
      for (const mk of qq.line.marks) {
        assert.ok(mk.value >= qq.line.min && mk.value <= qq.line.max, `mark in bounds: ${qq.prompt}`);
      }
    }
  }
});

test('every generated number line has labeled, integer tick labels', () => {
  const lineKinds = new Set(['line', 'jumps', 'candidates', 'compare']);
  for (const isl of ISLANDS) {
    for (let seed = 1; seed <= 30; seed += 1) {
      for (const qq of makeQuestions(isl.id, seeded(seed))) {
        if (!lineKinds.has(qq.kind) || !qq.line || qq.line.min == null) continue;
        const { ticks } = tickMarksFor(qq.line);
        const majors = ticks.filter(t => t.major);
        assert.ok(majors.length >= 2, `${isl.id}: ${qq.prompt} has labeled ticks`);
        for (const m of majors) {
          assert.ok(Number.isInteger(m.v), `${isl.id}: ${qq.prompt} tick ${m.v} is integer`);
        }
      }
    }
  }
});

/* ---------------- difficulty: Simple / Medium / Hard ---------------- */

test('difficulty: simple is identical with or without the difficulty argument', () => {
  for (const isl of ISLANDS) {
    for (let s = 1; s <= 10; s += 1) {
      assert.deepEqual(makeQuestions(isl.id, 'simple', seeded(s)), makeQuestions(isl.id, seeded(s)), `${isl.id} seed ${s}`);
    }
  }
});

test('difficulty: unknown difficulty falls back to simple', () => {
  for (const isl of ISLANDS) {
    for (const s of [2, 7, 13]) {
      assert.deepEqual(makeQuestions(isl.id, 'nonsense', seeded(s)), makeQuestions(isl.id, seeded(s)), `${isl.id} seed ${s}`);
      assert.deepEqual(questionPool(isl.id, 'nonsense', seeded(s)), questionPool(isl.id, 'simple', seeded(s)), `${isl.id} pool seed ${s}`);
    }
  }
});

test('difficulty: medium/hard draws are well-formed across many seeds', () => {
  for (const isl of ISLANDS) {
    for (const d of ['medium', 'hard']) {
      for (let s = 1; s <= 15; s += 1) {
        const qs = makeQuestions(isl.id, d, seeded(s));
        assert.equal(qs.length, 5, `${isl.id}/${d} seed ${s}`);
        for (const qq of qs) {
          assert.ok(qq.prompt && qq.prompt.length > 3, `${isl.id}/${d} prompt`);
          assert.ok(qq.hint && qq.hint.length > 5, `${isl.id}/${d} hint`);
          assert.ok(qq.key && qq.key.startsWith(`${isl.id}:${d}:`), `${isl.id}/${d} key: ${qq.key}`);
          const vals = qq.choices.map(c => String(c.value));
          assert.ok(vals.includes(String(qq.answer)), `${isl.id}/${d} answer present: ${qq.prompt}`);
          assert.equal(new Set(vals).size, vals.length, `${isl.id}/${d} unique choices: ${qq.prompt}`);
          if (qq.line && qq.line.min != null && qq.line.max != null) {
            assert.ok(qq.line.min < qq.line.max, `${isl.id}/${d} bounds: ${qq.prompt}`);
            assert.ok(qq.line.step > 0, `${isl.id}/${d} step: ${qq.prompt}`);
            const majors = tickMarksFor(qq.line).ticks.filter(t => t.major);
            assert.ok(majors.length >= 2, `${isl.id}/${d} labeled ticks: ${qq.prompt}`);
          }
        }
      }
    }
  }
});

test('difficulty: medium and hard pools have exactly 16 questions per island', () => {
  for (const isl of ISLANDS) {
    assert.equal(questionPool(isl.id, 'medium', seeded(4)).length, 16, `${isl.id} medium`);
    assert.equal(questionPool(isl.id, 'hard').length, 16, `${isl.id} hard`);
    assert.equal(questionPool(isl.id).length, 5, `${isl.id} simple`);
  }
});

test('difficulty: medium/hard pools use bigger numbers than simple', () => {
  // rounding: medium 3-digit, hard 4-digit
  for (const qq of questionPool('rounding', 'medium')) {
    const n = Number(qq.prompt.match(/Round (\d+)/)[1]);
    assert.ok(n >= 100 && n <= 999, `medium rounding ${n}`);
  }
  for (const qq of questionPool('rounding', 'hard')) {
    const n = Number(qq.prompt.match(/Round (\d+)/)[1]);
    assert.ok(n >= 1000, `hard rounding ${n}`);
  }
  // addition: medium sums ≤ 200 with 2-digit operands; hard first operand ≥ 100
  for (const qq of questionPool('addition', 'medium')) {
    const add = qq.prompt.match(/What is (\d+) \+ (\d+)/);
    const strat = qq.prompt.match(/from (\d+)/);
    if (add) {
      assert.ok(Number(add[1]) < 100 && Number(add[2]) < 100, `medium operands: ${qq.prompt}`);
      assert.ok(Number(add[1]) + Number(add[2]) <= 200, `medium sum: ${qq.prompt}`);
    } else {
      assert.ok(strat, `expected strategy prompt: ${qq.prompt}`);
      assert.ok(Number(strat[1]) < 100, `medium strategy operand: ${qq.prompt}`);
    }
  }
  for (const qq of questionPool('addition', 'hard')) {
    const m = qq.prompt.match(/What is (\d+)/) || qq.prompt.match(/from (\d+)/);
    assert.ok(Number(m[1]) >= 100, `hard first operand: ${qq.prompt}`);
  }
  // subtraction: medium 2-digit minuends with a real gap; hard 3-digit minuends
  const minus = /What is (\d+) − (\d+)/; // U+2212, matches the simple questions
  for (const qq of questionPool('subtraction', 'medium')) {
    const m = qq.prompt.match(minus);
    assert.ok(Number(m[1]) < 100, `medium minuend: ${qq.prompt}`);
    assert.ok(Number(m[1]) - Number(m[2]) >= 20, `medium difference: ${qq.prompt}`);
  }
  for (const qq of questionPool('subtraction', 'hard')) {
    const m = qq.prompt.match(minus);
    assert.ok(Number(m[1]) >= 100, `hard minuend: ${qq.prompt}`);
  }
  // estimate: medium starts in the hundreds, hard in the thousands
  for (const qq of questionPool('estimate', 'medium')) {
    assert.ok(Number(qq.prompt.match(/About how much is (\d+)/)[1]) >= 100, `medium estimate: ${qq.prompt}`);
  }
  for (const qq of questionPool('estimate', 'hard')) {
    assert.ok(Number(qq.prompt.match(/About how much is (\d+)/)[1]) >= 1000, `hard estimate: ${qq.prompt}`);
  }
  // pattern: pool-level max answers scale up
  const maxNum = pool => Math.max(...pool.map(qq => (typeof qq.answer === 'number' ? qq.answer : 0)));
  assert.ok(maxNum(questionPool('pattern', 'medium')) >= 200, 'medium pattern max');
  assert.ok(maxNum(questionPool('pattern', 'hard')) >= 1000, 'hard pattern max');
  // property: medium equations use 2-digit numbers, hard use 3-digit numbers
  for (const qq of questionPool('property', 'medium')) {
    assert.ok(/(\d\d)/.test(qq.line.equation), `medium 2-digit: ${qq.line.equation}`);
  }
  for (const qq of questionPool('property', 'hard')) {
    assert.ok(/(\d\d\d)/.test(qq.line.equation), `hard 3-digit: ${qq.line.equation}`);
  }
  // plot: medium has sparser labels, hard the widest range
  for (const qq of questionPool('plot', 'medium')) {
    assert.equal(qq.line.max, 1000, `medium plot max: ${qq.prompt}`);
    assert.equal(qq.line.majorEvery, 200, `medium plot majors: ${qq.prompt}`);
  }
  for (const qq of questionPool('plot', 'hard')) {
    assert.equal(qq.line.max, 2000, `hard plot max: ${qq.prompt}`);
    assert.equal(qq.line.majorEvery, 500, `hard plot majors: ${qq.prompt}`);
  }
  // compare: medium compares 4-digit numbers; hard compares decimals, signs exact
  const checkCompare = (d, floor) => {
    for (const qq of questionPool('compare', d)) {
      const [a, b] = qq.prompt.match(/(\d+(?:\.\d+)?)/g).map(Number);
      assert.ok(a >= floor && b >= floor, `${d} compare magnitude: ${qq.prompt}`);
      assert.equal(qq.answer, a > b ? '>' : a < b ? '<' : '=', `${d} compare sign: ${qq.prompt}`);
    }
  };
  checkCompare('medium', 1000);
  checkCompare('hard', 0);
  const hardCompare = questionPool('compare', 'hard');
  assert.ok(hardCompare.some(qq => /(\d+\.\d+)/.test(qq.prompt)), 'hard compare has decimals');
  const gt = hardCompare.find(qq => qq.prompt.includes('2.7') && qq.prompt.includes('2.65'));
  assert.ok(gt, 'found 2.7 vs 2.65');
  assert.equal(gt.answer, '>');
  const lt = hardCompare.find(qq => qq.prompt.includes('1.05') && qq.prompt.includes('1.5'));
  assert.ok(lt, 'found 1.05 vs 1.5');
  assert.equal(lt.answer, '<');
});

test('difficulty: medium/hard pools differ from the simple pool', () => {
  const sig = pool => pool.map(qq => qq.prompt + JSON.stringify(qq.line)).join('\n');
  for (const isl of ISLANDS) {
    const simple = sig(questionPool(isl.id, 'simple', seeded(9)));
    for (const d of ['medium', 'hard']) {
      assert.notDeepEqual(sig(questionPool(isl.id, d, seeded(9))), simple, `${isl.id}/${d} distinct`);
    }
  }
});

test('difficulty: session draws avoid recently-seen questions', () => {
  const keys = qs => qs.map(qq => qq.key);
  for (const isl of ISLANDS) {
    for (const d of ['medium', 'hard']) {
      const d1 = makeQuestions(isl.id, d, seeded(101), []);
      const d2 = makeQuestions(isl.id, d, seeded(102), keys(d1));
      const d3 = makeQuestions(isl.id, d, seeded(103), keys(d1).concat(keys(d2)));
      for (const [i, dd] of [[1, d1], [2, d2], [3, d3]]) {
        assert.equal(new Set(keys(dd)).size, 5, `${isl.id}/${d} draw ${i} unique`);
      }
      assert.equal(new Set([...keys(d1), ...keys(d2), ...keys(d3)]).size, 15, `${isl.id}/${d} no repeats across draws`);
    }
  }
});

test('difficulty: medium/hard quiz jumps carry the +N labels the demo teaches', () => {
  for (const isl of ['addition', 'subtraction']) {
    for (const d of ['medium', 'hard']) {
      for (const qq of questionPool(isl, d)) {
        const js = qq.line.jumps;
        assert.ok(js.length >= 2, `${isl}/${d}: ${qq.prompt} has jumps`);
        for (const [a, b, label] of js) {
          assert.equal(label, `+${b - a}`, `${isl}/${d}: ${qq.prompt} jump ${a}→${b}`);
        }
        for (let i = 1; i < js.length; i += 1) {
          assert.equal(js[i][0], js[i - 1][1], `${isl}/${d}: jumps chain: ${qq.prompt}`);
        }
        if (isl === 'addition') {
          const strat = qq.prompt.match(/from (\d+)/);
          if (strat) {
            assert.equal(qq.answer, js[0][1], `${isl}/${d}: first jump landing: ${qq.prompt}`);
          } else {
            const m = qq.prompt.match(/What is (\d+) \+ (\d+)/);
            const sum = Number(m[1]) + Number(m[2]);
            assert.equal(qq.answer, sum, `${isl}/${d}: sum: ${qq.prompt}`);
            assert.equal(js.at(-1)[1], sum, `${isl}/${d}: jumps land on the sum: ${qq.prompt}`);
          }
        } else {
          const m = qq.prompt.match(/What is (\d+) − (\d+)/); // U+2212
          const [a, b] = [Number(m[1]), Number(m[2])];
          assert.equal(qq.answer, a - b, `${isl}/${d}: difference: ${qq.prompt}`);
          assert.equal(js[0][0], b, `${isl}/${d}: count-up starts at ${b}: ${qq.prompt}`);
          assert.equal(js.at(-1)[1], a, `${isl}/${d}: count-up lands on ${a}: ${qq.prompt}`);
        }
      }
    }
  }
});
