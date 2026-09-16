import test from "node:test";
import assert from "node:assert/strict";
import {
  reflectionSchedule,
  hasThought,
  saveReflection,
} from "../src/reflection.js";
import { initialProgress, nextQuestion, record } from "../src/engine.js";
import { mergeProgress } from "../src/progress-sync.js";
test("two surprise reflection stops occur in different halves of the adventure", () => {
  for (let i = 0; i < 100; i++) {
    const stops = reflectionSchedule();
    assert.equal(stops.length, 2);
    assert.ok(stops[0] >= 0 && stops[0] < 4);
    assert.ok(stops[1] >= 4 && stops[1] < 8);
  }
});
test("blank and punctuation-only answers cannot advance, math sentences can", () => {
  assert.equal(hasThought("     "), false);
  assert.equal(hasThought("....."), false);
  assert.equal(hasThought("4+4=8"), true);
  assert.equal(hasThought("I counted the rows"), true);
});
test("an explanation added after a cloud save survives merging without changing evidence", () => {
  const p = initialProgress(),
    q = nextQuestion(p, "area"),
    remote = record(p, q, {}),
    local = saveReflection(remote, q, "I multiplied the rows by the columns.");
  const merged = mergeProgress(remote, local);
  assert.equal(merged.attempts.length, 1);
  assert.equal(
    merged.attempts[0].reflection.text,
    "I multiplied the rows by the columns.",
  );
  assert.deepEqual(merged.skills, remote.skills);
  assert.deepEqual(mergeProgress(merged, remote), merged);
});
