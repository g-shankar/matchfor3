#!/usr/bin/env node

import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA_FILE = path.join(ROOT, 'src', 'first100-data.js');
const OUTPUT_ROOT = path.join(ROOT, 'public', 'first100');
const ATTRIBUTION_FILE = path.join(OUTPUT_ROOT, 'attribution.json');
const REPORT_FILE = path.join(OUTPUT_ROOT, 'fetch-report.json');
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'MathQuestFirst100/1.0 (educational photo downloader; https://github.com/g-shankar/matchfor3)';
const DELAY_MS = Number.parseInt(process.env.FIRST100_DELAY_MS || '700', 10);
const LIMIT = Number.parseInt(process.env.FIRST100_LIMIT || '0', 10);
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.FIRST100_IMAGE_JOBS || '6', 10));
const FORCE = process.argv.includes('--force');
const SHELF_FILTER = process.env.FIRST100_SHELF || '';

const ALLOWED_LICENSES = [
  /^cc0(?:\s|$|-)/i,
  /^public domain$/i,
  /^pd(?:\s|$|-)/i,
  /^cc by(?:\s|$|-)/i,
  /^attribution(?:\s|$|-)/i,
];
const REJECTED_LICENSE = /(?:\bnc\b|noncommercial|\bnd\b|no.?derivatives|\bsa\b|share.?alike|editorial|fair use|copyrighted|all rights reserved)/i;
const NON_PHOTO = /(?:illustration|drawing|painting|engraving|etching|lithograph|diagram|map|chart|logo|icon|clip.?art|poster|stamp|flag|coat of arms|screenshot|render|vector|silhouette|coloring|colouring|page|book cover|scan|sculpture|statue|artwork|museum object)/i;
const PHOTO_EVIDENCE = /(?:photograph|photo by|digital camera|camera location|taken (?:on|with|by)|flickr)/i;
const STOP_WORDS = new Set(['a', 'an', 'and', 'the', 'of', 'in', 'on', 'to', 'with']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cleanHtml = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const slugify = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const safeName = (value, fallback) => slugify(value) || fallback;
const metaValue = (metadata, key) => cleanHtml(metadata?.[key]?.value ?? '');

function extractShelves(module) {
  const source = module.FIRST100_SHELVES || module.first100Shelves || module.SHELVES || module.shelves || module.default;
  const list = Array.isArray(source) ? source : Array.isArray(source?.shelves) ? source.shelves : null;
  if (!list) throw new Error('src/first100-data.js must export a shelf array (FIRST100_SHELVES, first100Shelves, shelves, or default).');
  return list.map((shelf, shelfIndex) => {
    const shelfName = shelf.id || shelf.slug || shelf.title || shelf.name || `shelf-${shelfIndex + 1}`;
    const rawWords = shelf.words || shelf.cards || shelf.items;
    if (!Array.isArray(rawWords)) throw new Error(`Shelf ${shelfName} has no words/cards/items array.`);
    return {
      id: safeName(shelf.id || shelf.slug || shelf.title || shelf.name, `shelf-${shelfIndex + 1}`),
      title: shelf.title || shelf.name || shelfName,
      words: rawWords.map((entry, wordIndex) => {
        const word = typeof entry === 'string' ? entry : entry.word || entry.label || entry.name;
        if (!word) throw new Error(`Shelf ${shelfName}, item ${wordIndex + 1} has no word/label/name.`);
        return {
          word: String(word),
          query: typeof entry === 'object' && entry.imageQuery ? String(entry.imageQuery) : String(word),
          slug: safeName(typeof entry === 'object' && entry.slug ? entry.slug : word, `word-${wordIndex + 1}`),
        };
      }),
    };
  });
}

async function loadJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function requestJson(params, attempt = 0) {
  const url = new URL(COMMONS_API);
  url.search = new URLSearchParams({ origin: '*', format: 'json', formatversion: '2', ...params });
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (response.status === 429 && attempt < 5) {
    const retrySeconds = Number(response.headers.get('retry-after')) || Math.pow(2, attempt + 1);
    await sleep(Math.min(30000, retrySeconds * 1000));
    return requestJson(params, attempt + 1);
  }
  if (!response.ok) throw new Error(`Commons API returned ${response.status}`);
  return response.json();
}

function licenseIsAllowed(shortName, usageTerms, licenseUrl) {
  const combined = `${shortName} ${usageTerms} ${licenseUrl}`;
  const exactCcBy = /^cc by(?:\s*[- ]?\d+(?:\.\d+)?)?$/i;
  return !REJECTED_LICENSE.test(combined) && (exactCcBy.test(shortName) || ALLOWED_LICENSES.slice(0, 3).some((rule) => rule.test(shortName) || rule.test(usageTerms)));
}

function wordTokens(value) {
  return slugify(value).split('-').filter((token) => token && !STOP_WORDS.has(token));
}

function assessCandidate(page, requestedWord, allowSemantic = false) {
  const info = page.imageinfo?.[0];
  const metadata = info?.extmetadata || {};
  const title = cleanHtml(page.title).replace(/^File:/i, '').replace(/\.[^.]+$/, '');
  const description = metaValue(metadata, 'ImageDescription');
  const categories = metaValue(metadata, 'Categories');
  const license = metaValue(metadata, 'LicenseShortName');
  const usageTerms = metaValue(metadata, 'UsageTerms');
  const licenseUrl = metaValue(metadata, 'LicenseUrl');
  const source = metaValue(metadata, 'Credit') || metaValue(metadata, 'Source');
  const searchable = `${title} ${description} ${categories}`;
  const tokens = wordTokens(requestedWord);
  const titleSlug = `-${slugify(title)}-`;
  const matched = tokens.filter((token) => titleSlug.includes(`-${token}-`) || new RegExp(`\\b${token}\\b`, 'i').test(searchable));
  const reasons = [];
  if (info?.mime !== 'image/jpeg') reasons.push(`unsupported MIME ${info?.mime || 'unknown'}`);
  if (!licenseIsAllowed(license, usageTerms, licenseUrl)) reasons.push(`license not allowed: ${license || usageTerms || 'missing'}`);
  if (NON_PHOTO.test(searchable)) reasons.push('metadata suggests non-photographic artwork');
  // Commons often omits the word “photograph” from otherwise valid JPEG photo
  // metadata. We still reject known artwork above and require a JPEG thumbnail.
  if (!allowSemantic && tokens.length && matched.length !== tokens.length) reasons.push('title/metadata does not match every requested word');
  if (!info?.thumburl || !info?.descriptionurl) reasons.push('missing thumbnail or Commons source URL');
  if (!metaValue(metadata, 'Artist') && !metaValue(metadata, 'Author')) reasons.push('missing credited author');

  let score = matched.length * 20;
  if (slugify(title) === slugify(requestedWord)) score += 100;
  if (titleSlug.includes(`-${slugify(requestedWord)}-`)) score += 40;
  if (/quality images|featured pictures/i.test(categories)) score += 8;
  if (/photographs? of/i.test(categories)) score += 4;
  return { page, info, metadata, title, license, usageTerms, licenseUrl, score, reasons };
}

function contextualQuery(item, shelf) {
  if (shelf.id === 'animals') {
    const word = item.query.toLowerCase();
    const groups = [
      [['dog', 'puppy'], 'canine pet'],
      [['cat', 'kitten'], 'feline pet'],
      [['horse', 'pony'], 'equine'],
      [['cow', 'calf'], 'cattle'],
      [['chicken', 'rooster', 'duck', 'goose', 'turkey', 'owl', 'eagle', 'hawk', 'parrot', 'flamingo', 'peacock', 'penguin', 'swan', 'sparrow', 'robin', 'crow', 'hummingbird', 'woodpecker', 'ostrich'], 'bird'],
      [['crocodile', 'alligator', 'turtle', 'tortoise', 'snake', 'lizard'], 'reptile'],
      [['frog', 'toad'], 'amphibian'],
      [['fish', 'shark', 'whale', 'dolphin', 'octopus', 'squid', 'crab', 'lobster', 'seahorse', 'starfish', 'jellyfish'], 'marine animal'],
      [['ant', 'bee', 'butterfly', 'ladybug', 'grasshopper', 'caterpillar', 'spider', 'worm', 'dragonfly', 'beetle', 'moth', 'firefly'], 'invertebrate'],
    ];
    const hint = groups.find(([members]) => members.includes(word))?.[1] || 'animal wildlife';
    return `${item.query} ${hint}`;
  }
  if (shelf.id === 'food') return `fresh whole ${item.query} food close-up`;
  if (shelf.id === 'moving') return `${item.query} vehicle`;
  if (shelf.id === 'words') return `${item.query} object`;
  if (shelf.id === 'concepts') {
    if (/^\d+$/.test(item.query)) return `number ${item.query} sign`;
    const examples = {
      Red:'red apple', Blue:'blue sky', Yellow:'yellow sunflower', Green:'green leaf', 'Orange Color':'orange fruit', Purple:'purple flower', Pink:'pink flower', Brown:'brown bear', Black:'black cat', White:'white snow', Gray:'gray stone', Gold:'gold jewelry', Silver:'silver spoon', Turquoise:'turquoise water', Beige:'beige sand',
      Circle:'circle plate', Square:'square window', Triangle:'triangle road sign', Rectangle:'rectangle door', Oval:'oval egg', Star:'starfish', Heart:'heart shape', Diamond:'diamond gemstone', Crescent:'crescent moon', Pentagon:'Pentagon building', Hexagon:'honeycomb hexagon', Octagon:'octagon stop sign', Cube:'wooden cube', Sphere:'ball sphere', Cylinder:'cylinder can',
      Big:'big elephant', Small:'small mouse', Tall:'tall giraffe', Short:'short stool', Long:'long road', Wide:'wide river', Narrow:'narrow path', Thick:'thick book', Thin:'thin paper', Heavy:'heavy weights', Light:'light feather', Full:'full cup', Empty:'empty cup', Open:'open door', Closed:'closed door', Same:'matching twins', Different:'different socks', More:'many apples', Less:'few apples', Many:'many balloons', Few:'few balloons', First:'first place medal', Last:'last runner', Top:'top shelf', Bottom:'bottom shelf', Middle:'middle child', Inside:'inside box', Outside:'outside house', Above:'bird above tree', Below:'boat below bridge', Over:'plane over city', Under:'cat under table', 'In Front':'child in front of house', Behind:'child behind tree', Near:'objects near each other', Far:'far mountain', Left:'left hand', Right:'right hand', Up:'up arrow sign', Down:'down arrow sign', Fast:'fast race car', Slow:'slow snail', Hot:'hot soup', Cold:'cold ice', Wet:'wet dog', Dry:'dry towel', Soft:'soft pillow', Hard:'hard rock', Day:'day sky', Night:'night sky',
    };
    return `${examples[item.query] || item.query} photograph`;
  }
  return item.query;
}

async function findPhoto(item, shelf) {
  const queries = [...new Set([contextualQuery(item, shelf), `${item.query} photograph`, item.query])];
  const candidates = [];
  let search = '';
  for (const query of queries) {
    search = `filetype:bitmap filemime:jpeg ${query}`;
    const payload = await requestJson({
      action: 'query',
      generator: 'search',
      gsrsearch: search,
      gsrnamespace: '6',
      gsrlimit: '50',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '900',
    });
    const conceptMatch = /^\d+$/.test(item.query)
      ? item.query
      : query.replace(/ photograph$/i, '').trim().split(/\s+/).at(-1);
    candidates.push(...(payload.query?.pages || []).map((page) => assessCandidate(page, shelf.id === 'concepts' ? conceptMatch : item.query)));
    if (candidates.some((candidate) => candidate.reasons.length === 0)) break;
  }
  const accepted = candidates.filter((candidate) => candidate.reasons.length === 0)
    .sort((a, b) => b.score - a.score || (a.page.index ?? 9999) - (b.page.index ?? 9999) || a.page.pageid - b.page.pageid || a.title.localeCompare(b.title));
  if (!accepted.length) {
    return { status: 'missing', query: search, rejected: candidates.slice(0, 8).map((candidate) => ({ title: candidate.title, reasons: candidate.reasons })) };
  }
  const chosen = accepted[0];
  const alternatives = accepted.slice(1, 6).map((candidate) => ({ title: candidate.title, sourceUrl: candidate.info.descriptionurl, score: candidate.score }));
  return { status: 'found', candidate: chosen, alternatives };
}

async function downloadJpeg(url, destination) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'image/jpeg' } });
  if (!response.ok) throw new Error(`Image download returned ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error('Downloaded file is not a JPEG');
  const temporary = `${destination}.part`;
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
  return bytes.length;
}

function attributionFor(candidate, item, shelf, relativePath, bytes) {
  const { info, metadata } = candidate;
  return {
    word: item.word,
    shelf: shelf.id,
    file: relativePath,
    sourceUrl: info.descriptionurl,
    imageUrl: info.url,
    author: metaValue(metadata, 'Artist') || metaValue(metadata, 'Author') || 'Unknown (see source)',
    license: candidate.license || candidate.usageTerms,
    licenseUrl: candidate.licenseUrl || info.descriptionurl,
    title: metaValue(metadata, 'ObjectName') || candidate.title,
    bytes,
  };
}

async function main() {
  if (!existsSync(DATA_FILE)) throw new Error('Missing src/first100-data.js. Create the approved 500-word dataset before fetching photos.');
  const data = await import(`${pathToFileURL(DATA_FILE).href}?v=${Date.now()}`);
  const shelves = extractShelves(data);
  const allItems = shelves.flatMap((shelf) => shelf.words.map((item) => ({ shelf, item })));
  const filteredItems = SHELF_FILTER ? allItems.filter(({ shelf }) => shelf.id === SHELF_FILTER) : allItems;
  const selectedItems = LIMIT > 0 ? filteredItems.slice(0, LIMIT) : filteredItems;
  await mkdir(OUTPUT_ROOT, { recursive: true });
  const attribution = await loadJson(ATTRIBUTION_FILE, {});
  const report = { generatedAt: new Date().toISOString(), totalDatasetItems: allItems.length, attempted: selectedItems.length, downloaded: [], skipped: [], missing: [], ambiguous: [], errors: [] };

  let cursor = 0;
  async function worker() {
    while (cursor < selectedItems.length) {
    const index = cursor++;
    const { shelf, item } = selectedItems[index];
    const relativePath = `${shelf.id}/${item.slug}.jpg`;
    const destination = path.join(OUTPUT_ROOT, relativePath);
    const key = `${shelf.id}/${item.slug}`;
    await mkdir(path.dirname(destination), { recursive: true });

    if (!FORCE && existsSync(destination) && attribution[key]?.sourceUrl && attribution[key]?.license) {
      const fileStat = await stat(destination);
      report.skipped.push({ key, reason: 'already downloaded with attribution', bytes: fileStat.size });
      console.log(`[${index + 1}/${selectedItems.length}] skip ${key}`);
      continue;
    }

    console.log(`[${index + 1}/${selectedItems.length}] search ${key}: ${item.query}`);
    try {
      const result = await findPhoto(item, shelf);
      if (result.status !== 'found') {
        report[result.status].push({ key, word: item.word, ...result });
        console.warn(`  ${result.status}; review ${path.relative(ROOT, REPORT_FILE)}`);
      } else {
        const bytes = await downloadJpeg(result.candidate.info.thumburl, destination);
        attribution[key] = attributionFor(result.candidate, item, shelf, relativePath, bytes);
        report.downloaded.push({ key, sourceUrl: attribution[key].sourceUrl, bytes, alternatives: result.alternatives });
        await writeFile(ATTRIBUTION_FILE, `${JSON.stringify(attribution, null, 2)}\n`);
        console.log(`  saved ${relativePath} (${Math.round(bytes / 1024)} KB)`);
      }
    } catch (error) {
      try { await unlink(`${destination}.part`); } catch {}
      report.errors.push({ key, message: error.message });
      console.error(`  error: ${error.message}`);
    }
    if (index < selectedItems.length - 1) await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selectedItems.length) }, () => worker()));

  await writeFile(ATTRIBUTION_FILE, `${JSON.stringify(attribution, null, 2)}\n`);
  await writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Done: ${report.downloaded.length} downloaded, ${report.skipped.length} resumed, ${report.missing.length} missing, ${report.ambiguous.length} ambiguous, ${report.errors.length} errors.`);
  if (report.errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
