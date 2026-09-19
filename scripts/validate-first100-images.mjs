#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { first100Shelves } from '../src/first100-data.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const PHOTO_ROOT = path.join(ROOT, 'public', 'first100');
const ATTRIBUTION_FILE = path.join(PHOTO_ROOT, 'attribution.json');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  }));
  return nested.flat();
}

function allowedLicense(value) {
  return /^(?:cc0|public domain|pd(?:\s|$|-)|cc by(?:\s*[- ]?\d+(?:\.\d+)?)?|attribution(?:\s|$|-))/i.test(value) && !/(?:\bnc\b|noncommercial|\bnd\b|no.?derivatives|\bsa\b|share.?alike|editorial)/i.test(value);
}

async function main() {
  const attribution = JSON.parse(await readFile(ATTRIBUTION_FILE, 'utf8'));
  const files = (await walk(PHOTO_ROOT)).filter((file) => /\.jpe?g$/i.test(file)).sort();
  const errors = [];
  const expected = new Set(first100Shelves.flatMap((shelf) => shelf.words.map((word) => `${shelf.id}/${word.slug}.jpg`)));
  const attributedFiles = new Map(Object.entries(attribution).map(([key, value]) => [value.file, { key, value }]));

  for (const absolute of files) {
    const relative = path.relative(PHOTO_ROOT, absolute).split(path.sep).join('/');
    expected.delete(relative);
    const record = attributedFiles.get(relative);
    if (!record) { errors.push(`${relative}: missing attribution record`); continue; }
    const { value } = record;
    if (!value.sourceUrl || !/^https:\/\/commons\.wikimedia\.org\//.test(value.sourceUrl)) errors.push(`${relative}: invalid Commons sourceUrl`);
    if (!value.author) errors.push(`${relative}: missing author`);
    if (!allowedLicense(value.license || '')) errors.push(`${relative}: disallowed or missing license (${value.license || 'none'})`);
    if (!value.licenseUrl) errors.push(`${relative}: missing licenseUrl`);
    if ((await stat(absolute)).size < 1024) errors.push(`${relative}: file is unexpectedly small`);
    attributedFiles.delete(relative);
  }

  for (const { key, value } of attributedFiles.values()) errors.push(`${key}: attribution points to missing file ${value.file}`);
  for (const relative of expected) errors.push(`${relative}: required dataset photo is missing`);
  if (files.length !== 500) errors.push(`expected exactly 500 photos, found ${files.length}`);
  if (errors.length) {
    console.error(`First 100 image validation failed (${errors.length}):\n${errors.map((error) => `- ${error}`).join('\n')}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Validated ${files.length} First 100 photos; every file has allowed-license attribution.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
