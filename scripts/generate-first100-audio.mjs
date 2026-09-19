import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { first100Shelves } from '../src/first100-data.js';

const run = promisify(execFile);
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDir = join(root, 'public', 'first100-audio');
const manifestPath = join(outputDir, 'manifest.json');
const tempDir = mkdtempSync(join(tmpdir(), 'first100-audio-'));
const voice = 'Flo (English (US))';
const rate = '165';
const concurrency = Math.max(1, Number(process.env.FIRST100_AUDIO_JOBS || 6));

mkdirSync(outputDir, { recursive: true });

const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function findReusableClips() {
  const configured = (process.env.FIRST100_REUSE_DIRS || '')
    .split(':')
    .filter(Boolean);
  const roots = configured.length ? configured : [
    join(process.env.HOME || '', 'Library', 'Developer', 'CoreSimulator', 'Devices'),
    join(process.env.HOME || '', 'Documents'),
  ];
  const availableRoots = roots.filter(existsSync);
  if (!availableRoots.length) return new Map();

  const result = execFileSync('/usr/bin/find', [
    ...availableRoots,
    '-type', 'f', '-name', 'heart_word_*.mp3',
  ], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

  const clips = new Map();
  for (const path of result.split('\n').filter(Boolean)) {
    const key = normalize(basename(path).replace(/^heart_word_/, '').replace(/\.mp3$/, ''));
    if (!clips.has(key) || path.includes('/Containers/Bundle/Application/')) clips.set(key, path);
  }
  return clips;
}

const reusable = findReusableClips();
const previous = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : { version: 1, generatedAt: null, clips: {} };
const manifest = { version: 1, generatedAt: new Date().toISOString(), clips: { ...(previous.clips || {}) } };

const extras = [
  ...first100Shelves.map(shelf => ({
    slug: `shelf-intro-${shelf.id}`,
    text: `Let's explore ${shelf.title}!`,
    kind: 'shelf-intro',
  })),
  { slug: 'quiz-find-it', text: 'Can you find it?', kind: 'quiz-prompt' },
  { slug: 'quiz-listen-again', text: 'Listen again.', kind: 'quiz-prompt' },
  { slug: 'quiz-try-again', text: "Let's look again.", kind: 'quiz-prompt' },
  { slug: 'quiz-great-job', text: 'You found it!', kind: 'quiz-prompt' },
  { slug: 'quiz-next-one', text: 'Ready for the next one?', kind: 'quiz-prompt' },
];

const jobs = [
  ...first100Shelves.flatMap(shelf => shelf.words.map(entry => ({
    slug: entry.slug,
    text: entry.word,
    kind: 'word',
  }))),
  ...extras,
];

function saveManifest() {
  const temporary = `${manifestPath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  renameSync(temporary, manifestPath);
}

async function createClip(job) {
  const relativePath = `/first100-audio/${job.slug}.m4a`;
  const outputPath = join(outputDir, `${job.slug}.m4a`);
  const old = manifest.clips[job.slug];
  if (existsSync(outputPath) && old?.text === job.text && old?.path === relativePath) {
    return 'skipped';
  }

  const reusablePath = job.kind === 'word' ? reusable.get(normalize(job.text)) : null;
  if (reusablePath) {
    await run('/usr/bin/afconvert', [reusablePath, outputPath, '-f', 'm4af', '-d', 'aac', '-b', '64000']);
    manifest.clips[job.slug] = {
      path: relativePath,
      source: 'fun-learning',
      voice: 'Fun-Learning NaturalVoice',
      text: job.text,
      kind: job.kind,
    };
    saveManifest();
    return 'reused';
  }

  const aiffPath = join(tempDir, `${job.slug}.aiff`);
  await run('/usr/bin/say', ['-v', voice, '-r', rate, '-o', aiffPath, job.text]);
  await run('/usr/bin/afconvert', [aiffPath, outputPath, '-f', 'm4af', '-d', 'aac', '-b', '64000']);
  manifest.clips[job.slug] = {
    path: relativePath,
    source: 'generated',
    voice,
    text: job.text,
    kind: job.kind,
  };
  saveManifest();
  return 'generated';
}

const counts = { reused: 0, generated: 0, skipped: 0 };
let cursor = 0;
async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    const result = await createClip(job);
    counts[result] += 1;
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
manifest.generatedAt = new Date().toISOString();
saveManifest();

const missing = jobs.filter(job => {
  const entry = manifest.clips[job.slug];
  return !entry || !existsSync(join(outputDir, `${job.slug}.m4a`));
});
if (missing.length) throw new Error(`Missing ${missing.length} clips: ${missing.map(item => item.slug).join(', ')}`);

console.log(JSON.stringify({
  total: jobs.length,
  words: 500,
  shelfIntros: 5,
  quizPrompts: extras.length - 5,
  ...counts,
  manifest: manifestPath,
}, null, 2));
