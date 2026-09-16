import test from "node:test";
import assert from "node:assert/strict";
import { initialProgress, nextQuestion, record } from "../src/engine.js";
import {
  mergeProgress,
  encodeProgress,
  decodeProgress,
} from "../src/progress-sync.js";
test("merging browser and cloud histories preserves evidence without counting twice", () => {
  const empty = initialProgress(),
    q = nextQuestion(empty, "area"),
    cloud = record(empty, q, {});
  const browser = record(cloud, nextQuestion(cloud, "fractions"), {
    hinted: true,
  });
  const merged = mergeProgress(cloud, browser);
  assert.equal(merged.attempts.length, 2);
  assert.equal(merged.seen.length, 2);
  assert.deepEqual(mergeProgress(merged, browser), merged);
  assert.equal(merged.skills[q.skill].total, 1);
});
test("independent branches merge attempts and school-free practice statistics", () => {
  const empty = initialProgress(),
    cloud = record(empty, nextQuestion(empty, "area"), {}),
    browser = record(empty, nextQuestion(empty, "fractions"), { retries: 1 });
  const merged = mergeProgress(cloud, browser);
  assert.equal(merged.attempts.length, 2);
  assert.equal(
    Object.values(merged.skills).reduce((n, s) => n + s.total, 0),
    2,
  );
});
test("large Unicode histories round-trip through bounded Firestore chunks", () => {
  const p = initialProgress();
  p.seen = Array.from(
    { length: 5000 },
    (_, i) => `${i} 🌻 ${"garden ".repeat(15)}`,
  );
  const chunks = encodeProgress(p);
  assert.ok(chunks.length > 1);
  for (const c of chunks) assert.ok(Buffer.byteLength(c, "utf8") < 360000);
  assert.deepEqual(decodeProgress(chunks), p);
});
test("corrupt cloud payloads are rejected rather than replacing browser progress", () => {
  assert.throws(() => decodeProgress(['{"version":2}']));
  assert.throws(() => decodeProgress(["not json"]));
  assert.deepEqual(mergeProgress(null, initialProgress()), initialProgress());
});
