# MathQuest

A gentle family learning playground with separate profiles: an adaptive math world for eight-year-old Shivani and short preschool play for Pranav, who is turning four. Six open worlds cover 50 skills in shapes, area and perimeter, fractions, multiplication and division, number sense, and measurement. The first four worlds remain the main practice focus. React + Vite; deploys as a static site to Firebase Hosting. No paid API or live AI generation is needed.

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

- Choose four or eight discoveries per adventure, with a visible option to finish at any time. No countdowns, lives, streak pressure, or locked islands.
- Fifty skill generators across six domains. Activities include painting fractions, placing fractions on a line, ordering numbers, selecting all matching shape clues, typing answers, and building gardens. Every skill is available directly from its world’s Explore, Connect, and Stretch trail.
- Each challenge has a fingerprint based on its actual prompt and relevant visual data. Seen challenges are excluded across sessions on the same browser. Concepts intentionally return in new variations: learning benefits from revisiting an idea. Pools are finite; after exhausting a world, the game asks the explorer to try another island rather than silently repeat a challenge.
- Mixed adventures include number and measurement warmups while prioritizing the four focus domains. Automatic practice follows gentle prerequisite recommendations; direct skill selection remains open. Recent independent performance, practice spacing, and varied representations guide sequencing. Difficulty uses the last 12 attempts and can become easier after struggles. These are practice heuristics, not validated assessment or curriculum mastery scores. Parent corner distinguishes evidence across representations and suggests practice from recorded patterns.
- Free-play Workshop offers an area/perimeter garden, fraction painter, array splitter, and clock explorer. These experiments do not affect practice statistics. Ten keepsake stickers celebrate exploration and sharing thoughts without daily streaks or time pressure. Discoveries earn six play sparkles equally for independent and supported answers. A companion cottage offers 24 collectible friends; selected buddies travel with the explorer. Purchases and buddy selection survive local/cloud backups. Mistakes never deduct sparkles. Confetti celebrates discoveries and explanations, respects reduced motion, and can be turned off in Parent corner.
- Two random reflection stops per adventure ask her to explain her thinking in a short text box; several retries also trigger a reflection. Next remains disabled until she shares a few words or a math sentence. The worked explanation is shown after sharing so it cannot simply be copied. Writing is not graded, and finishing for now remains available. The latest six explanations appear in Parent corner and are included in browser/cloud backups and exports.
- A mistake opens a visual clue and allows unlimited retries. Clues and retries never deduct rewards. The parent corner distinguishes independent, supported, and skipped work.
- A school report informed the initial focus areas. The report and its assessment scores are not stored in the app or repository. Reference-document recommendations were treated as design input, not as authorization to act.

## Child profiles

Use the child selector in the header to switch profiles. Shivani’s existing 50-skill math progress remains at the top level for backward compatibility. Pranav’s separate `preschool` record includes 30 early-learning skills across counting, shapes and colors, patterns, sorting, sound play, and everyday sequencing. His visits contain four large, visual activities with optional text-to-speech, gentle retries, stars, and a separate toy shelf. His Parent view uses age-appropriate language and does not treat inconsistent preschool answers as an assessment. Both profiles share the same private browser/Firestore backup but never share attempts, adaptive evidence, sessions, or rewards. The selected child is remembered only on the current browser.

## Saved progress and limitations

Progress is saved locally under `mathquest-v1` in localStorage and backed up to Firestore using a persistent anonymous Firebase Auth identity. Existing browser history is migrated on connection. The parent corner shows connection/saving/backup status and offers a retry when saving fails. Cloud and browser histories merge without counting the same challenge twice. Browser saving lets play continue during connection failures; cloud connection times out so it cannot indefinitely block play. Reconnecting to the network retries cloud saving.

An anonymous identity belongs to this browser: cross-device access and recovery after clearing authentication data require a future parent account. Private browsing may not preserve it. Parent corner can export practice history as JSON. The parent corner is a navigation view, not a password-protected account.

Practice history is uploaded to your Firebase project: skills, challenge fingerprints, attempts, sessions, generator state, and submitted explanations. School reports, assessment scores, names, and school details are not in the database payload. An anonymous account ID secures the profile; Firestore rules deny access to other users and unsigned visitors. The site displays a first name. Google Fonts requests font assets; system fonts are fallbacks.

Attempts retain skill, difficulty, fingerprint, representation, hint/retry/skip information, and duration. The latest 3,000 attempts and 365 sessions are retained; the seen-challenge list stays intact. Session time means elapsed time between beginning and ending an adventure, including pauses, not active learning time. Browser text-to-speech is optional and depends on device support.

This expansion includes strong-skill warmups and broader number, time, money, length, and graph practice. It is not a complete formally mapped third-grade curriculum. Cross-device parent accounts are not implemented.

## Files

- `src/curriculum.js`: 50 skills, prerequisites, world metadata, practice stages, and keepsakes.
- `src/engine.js` and `src/extended-generators.js`: seeded generators, challenge deduplication, adaptive sequencing, and attempt records.
- `src/activities.jsx` and `src/visuals.jsx`: mathematical models and interactive answers.
- `src/learning-pages.jsx`: skill trails, free-play workshop, keepsakes, and parent practice suggestions.
- `src/main.jsx`: island map, interactive activity screen, short-session ending, parent observations and export.
- `src/style.css`: responsive design, illustrated visual system, keyboard focus and reduced-motion support.
- `tests/*.test.js`: generated-question invariants, deduplication, supported answers, adaptive sequencing, reflection gates, progress merging, and rendering of all skill/difficulty combinations.
- `firebase.json` and `.firebaserc`: Hosting configuration.

## Firestore storage

`players/{authUid}` holds a versioned manifest and server update timestamp. `players/{authUid}/progressChunks/{index}` holds serialized progress in 90,000-character chunks. Reads and writes use transactions so partial backups cannot replace good progress. Chunks keep the growing seen-challenge history below the per-document size limit. Writes are debounced and serialized. Maximum backup size is 450 chunks; the app keeps local history and reports backup unavailable if it reaches this limit. This is a private backup model, not a queryable analytics warehouse.

`npm run test:cloud` explicitly runs live access-rule checks using two temporary anonymous users and a disposable chunk, then removes the test chunk and users. The normal `npm test` suite uses no live Firebase resources.

## Parent emails

Parent corner includes a weekly report preview. The server implementation supports weekly summaries and optional repeated-support notes; automatic delivery is **not yet connected**. It requires a parent recipient, Firebase Blaze, and a configured email service. See [setup and delivery verification](docs/PARENT_EMAIL_SETUP.md). The client cannot choose arbitrary recipients. Email only includes aggregate practice observations, never raw child explanations or school records.
