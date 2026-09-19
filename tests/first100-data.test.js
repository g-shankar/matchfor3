import test from 'node:test';
import assert from 'node:assert/strict';
import { first100Shelves } from '../src/first100-data.js';

test('First 100 library has five complete shelves', () => {
  assert.equal(first100Shelves.length, 5);
  for (const shelf of first100Shelves) {
    assert.equal(shelf.words.length, 100, `${shelf.id} should contain 100 words`);
  }
});

test('every shelf and word has the required fields', () => {
  for (const shelf of first100Shelves) {
    for (const field of ['id', 'title', 'icon', 'color']) {
      assert.equal(typeof shelf[field], 'string');
      assert.ok(shelf[field].trim(), `${shelf.id || 'shelf'} is missing ${field}`);
    }
    for (const entry of shelf.words) {
      assert.deepEqual(Object.keys(entry).sort(), ['slug', 'word']);
      assert.ok(entry.word.trim(), `${shelf.id} contains an empty word`);
      assert.match(entry.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  }
});

test('word slugs are globally unique', () => {
  const slugs = first100Shelves.flatMap(shelf => shelf.words.map(entry => entry.slug));
  assert.equal(slugs.length, 500);
  assert.equal(new Set(slugs).size, 500);
});

test('terms are distinct within each shelf', () => {
  for (const shelf of first100Shelves) {
    const terms = shelf.words.map(entry => entry.word.toLowerCase());
    assert.equal(new Set(terms).size, 100, `${shelf.id} contains a repeated term`);
  }
});
