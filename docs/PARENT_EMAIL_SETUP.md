# Parent email delivery

The game’s rewards work without this setup. Automatic emails are not active in the current deployment. Parent corner provides a local preview until the backend is configured.

## Prerequisites

- Firebase Blaze billing enabled by the project owner. Scheduled Cloud Functions and Cloud Scheduler can incur charges; this repository does not enable billing.
- A Resend account, sending API key, and verified sending domain (or Resend’s limited account-owner test sender).
- One parent recipient address and the existing browser profile ID shown under Parent corner → Email setup information. Delivery only reads this explicitly configured profile; public anonymous visitors cannot enroll other recipients.

## Configure

Use Node 22 for the Firebase Functions runtime. Never put these secret values in the repository, client bundle, or chat. Enter them interactively:

```sh
npm --prefix functions ci
firebase functions:secrets:set RESEND_API_KEY --project mathfor3-53583
firebase functions:secrets:set PARENT_EMAIL --project mathfor3-53583
firebase functions:secrets:set EMAIL_FROM --project mathfor3-53583
firebase functions:secrets:set PARENT_PROFILE_UID --project mathfor3-53583
firebase deploy --only functions --project mathfor3-53583
```

`EMAIL_FROM` must be a verified sender, for example `MathQuest <updates@your-domain.example>`. Set `PARENT_PROFILE_UID` to the child’s existing production browser profile, not a localhost test profile.

After functions deploy successfully, enable the frontend integration locally (the `.env.local` file is ignored by Git):

```sh
printf 'VITE_EMAIL_BACKEND=true\n' > .env.local
npm run build
firebase deploy --only hosting --project mathfor3-53583
```

In that browser’s Parent corner, enable weekly email and save preferences. Preferences default to off. Other profiles get no connected settings. Recipient addresses cannot be set by the client, and service keys are server secrets. Stop emails in Parent corner, or disable its server preference if browser authentication is lost. Changing recipient/profile secrets requires redeploying functions.

## Behavior and verification

- Scheduler checks daily at 13:00 UTC. Weekly summaries are sent on Mondays. Optional support notes are limited to one per seven days; a weekly report containing concerns also resets that interval.
- Summaries compare the last seven days with the preceding seven. An improvement comparison needs six solved attempts in each period and a 20 percentage point increase. A support pattern needs at least six solved attempts in each period, under 50% independent currently, and no increase; repeated help also qualifies after six solved attempts with at most one independent answer across at least two UTC dates.
- These are descriptive practice heuristics, not curriculum assessments. Reports acknowledge changes in difficulty/representation and separate no recorded practice from insufficient evidence. Supported answers are celebrated as learning.
- The email contains aggregate skill practice, not raw child explanations, school reports, or assessment scores. Resend receives the parent address and that summary.
- One delivery record per profile/day, a transaction lease, and a stable Resend idempotency key limit duplicates. Failed requests release the lease for scheduler retry. Retries older than 23 hours stop for inspection because provider idempotency expires after 24 hours.
- Delivery records and preference writes are server-only; current Firestore rules deny direct client access. The authenticated callable checks the configured profile ID before reading/updating preferences.

Before calling email setup complete, verify the callable returns configured settings in the selected profile, preferences save, the deployed scheduler sends a real message to the configured parent, and the delivery record reports `sent`. Local tests verify summary/reward logic; they do not prove actual email delivery. Inspect Firebase function logs for delivery failures without logging keys or email payloads.

Official references: [scheduled functions](https://firebase.google.com/docs/functions/schedule-functions), [secret configuration](https://firebase.google.com/docs/functions/config-env), [Resend sending](https://resend.com/docs/api-reference/emails/send-email), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
