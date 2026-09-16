// Explicit live test: creates two temporary anonymous users and a disposable chunk.
// Run with npm run test:cloud after deploying the Firestore rules.
import assert from "node:assert/strict";
import fs from "node:fs";
const config = JSON.parse(
  fs.readFileSync(
    new URL("../src/firebase-config.json", import.meta.url),
    "utf8",
  ),
);
const identity = `https://identitytoolkit.googleapis.com/v1/accounts`,
  base = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`;
async function user() {
  const r = await fetch(`${identity}:signUp?key=${config.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  assert.equal(r.status, 200, "Anonymous sign-in must work");
  return r.json();
}
const a = await user(),
  b = await user(),
  path = `${base}/players/${a.localId}/progressChunks/integration-test`,
  headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${a.idToken}`,
  };
try {
  const write = await fetch(path, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      fields: { data: { stringValue: "disposable rule test" } },
    }),
  });
  assert.equal(
    write.status,
    200,
    `Owner can write: ${write.status === 200 ? "ok" : (await write.json()).error?.message}`,
  );
  assert.equal((await fetch(path, { headers })).status, 200, "Owner can read");
  assert.equal(
    (await fetch(path, { headers: { Authorization: `Bearer ${b.idToken}` } }))
      .status,
    403,
    "Another player cannot read",
  );
  assert.equal(
    (await fetch(path)).status,
    403,
    "Unsigned visitors cannot read",
  );
  const attack = await fetch(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${b.idToken}`,
    },
    body: JSON.stringify({
      fields: { data: { stringValue: "foreign write" } },
    }),
  });
  assert.equal(attack.status, 403, "Another player cannot write");
  const bad = await fetch(`${base}/players/${a.localId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      fields: {
        schemaVersion: { integerValue: "1" },
        chunkCount: { integerValue: "999" },
      },
    }),
  });
  assert.equal(bad.status, 403, "Malformed manifests cannot be written");
  console.log(
    "PASS: owner access, cross-player isolation, unsigned access denial, and manifest validation.",
  );
} finally {
  const removed = await fetch(path, { method: "DELETE", headers });
  if (![200, 404].includes(removed.status))
    console.warn("Test chunk cleanup response:", removed.status);
  for (const u of [a, b]) {
    const r = await fetch(`${identity}:delete?key=${config.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: u.idToken }),
    });
    assert.equal(r.status, 200, "Test user cleanup");
  }
}
