# MathQuest

A math-only, gentle learning playground for an eight-year-old. Four open islands focus on shape properties, area and perimeter, fractions, and multiplication. React + Vite; deploys as a static site to Firebase Hosting. No paid API or live AI generation is needed.

## Run

```sh
npm ci
npm run dev
npm test
npm run build
```

## Publish to Firebase

The existing Firebase project is configured as `mathfor3-53583`.

```sh
firebase login
npm run build
firebase deploy --only hosting,auth,firestore:rules --project mathfor3-53583
```

Firebase Hosting serves the `dist` directory with a single-page fallback, following the [official hosting workflow](https://firebase.google.com/docs/hosting/quickstart). The default Firestore database is provisioned in `us-east1`. Anonymous Authentication and owner-only Firestore rules are configured in `firebase.json`; deploy them alongside Hosting. See the [official provider configuration workflow](https://firebase.google.com/docs/auth/configure-providers-cli).

## Learning behavior

- Eight discoveries per adventure, with a visible option to finish at any time. No countdowns, lives, streak pressure, or locked islands.
- Thirteen skill generators across four domains. Fraction circles, bars, number lines, visual arrays, shape rotation, and a resizable area garden.
- Each challenge has a fingerprint based on its actual prompt and relevant visual data. Seen challenges are excluded across sessions on the same browser. Concepts intentionally return in new variations: learning benefits from revisiting an idea. Pools are finite; after exhausting a world, the game asks the explorer to try another island rather than silently repeat a challenge.
- Mixed adventures initially prioritize unpracticed skills, starting with geometry. Weak independent performance receives more practice; recent skills receive a sequencing penalty. Three difficulty bands increase after at least three/eight independent answers and 65%/80% independent performance. This is a simple practice heuristic, not a validated assessment or curriculum mastery score. Representation diversity is provided by generators; future versions can track mastery per representation.
- A mistake opens a visual clue and allows unlimited retries. Clues and retries never deduct rewards. The parent corner distinguishes independent, supported, and skipped work.
- A school report informed the initial focus areas. The report and its assessment scores are not stored in the app or repository. Reference-document recommendations were treated as design input, not as authorization to act.

## Saved progress and limitations

Progress is saved locally under `mathquest-v1` in localStorage and backed up to Firestore using a persistent anonymous Firebase Auth identity. Existing browser history is migrated on connection. The parent corner shows connection/saving/backup status and offers a retry when saving fails. Cloud and browser histories merge without counting the same challenge twice. Browser saving lets play continue during connection failures; cloud connection times out so it cannot indefinitely block play. Reconnecting to the network retries cloud saving.

An anonymous identity belongs to this browser: cross-device access and recovery after clearing authentication data require a future parent account. Private browsing may not preserve it. Parent corner can export practice history as JSON. The parent corner is a navigation view, not a password-protected account.

Practice history is uploaded to your Firebase project: skills, challenge fingerprints, attempts, sessions, and generator state. School reports, assessment scores, names, and school details are not in the database payload. An anonymous account ID secures the profile; Firestore rules deny access to other users and unsigned visitors. The site displays a first name. Google Fonts requests font assets; system fonts are fallbacks.

Attempts retain skill, difficulty, fingerprint, representation, hint/retry/skip information, and duration. The latest 3,000 attempts and 365 sessions are retained; the seen-challenge list stays intact. Session time means elapsed time between beginning and ending an adventure, including pauses, not active learning time. Browser text-to-speech is optional and depends on device support.

This first version focuses on the four reported growth areas. Strong-skill warmups, cross-device parent accounts, and a full third-grade curriculum are future additions.

## Files

- `src/engine.js`: seeded question generators, challenge deduplication, adaptive sequencing, attempt records.
- `src/main.jsx`: island map, interactive activity screen, short-session ending, parent observations and export.
- `src/style.css`: responsive design, illustrated visual system, keyboard focus and reduced-motion support.
- `tests/engine.test.js`: generated-question correctness, deduplication, supported-answer handling, difficulty progression.
- `firebase.json` and `.firebaserc`: Hosting configuration.

## Firestore storage

`players/{authUid}` holds a versioned manifest and server update timestamp. `players/{authUid}/progressChunks/{index}` holds serialized progress in 90,000-character chunks. Reads and writes use transactions so partial backups cannot replace good progress. Chunks keep the growing seen-challenge history below the per-document size limit. Writes are debounced and serialized. Maximum backup size is 450 chunks; the app keeps local history and reports backup unavailable if it reaches this limit. This is a private backup model, not a queryable analytics warehouse.

`npm run test:cloud` explicitly runs live access-rule checks using two temporary anonymous users and a disposable chunk, then removes the test chunk and users. The normal `npm test` suite uses no live Firebase resources.
