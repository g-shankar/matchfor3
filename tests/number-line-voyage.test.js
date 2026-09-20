import test from 'node:test';
import assert from 'node:assert/strict';
import { ISLANDS, islandById, makeQuestions, PRAISE } from '../src/number-line-voyage-engine.js';

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
