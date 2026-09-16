import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import config from "./firebase-config.json";
import {
  encodeProgress,
  decodeProgress,
  mergeProgress,
} from "./progress-sync.js";
const app = initializeApp(config),
  auth = getAuth(app),
  db = getFirestore(app);
const chunkRef = (uid, i) =>
  doc(db, "players", uid, "progressChunks", String(i).padStart(4, "0"));
async function readState(tx, uid) {
  const ref = doc(db, "players", uid);
  const snap = await tx.get(ref);
  if (!snap.exists()) return { progress: null, count: 0 };
  const count = snap.data().chunkCount;
  if (!Number.isInteger(count) || count < 1 || count > 450)
    throw Error("Invalid cloud backup");
  const chunks = [];
  for (let i = 0; i < count; i++) {
    const c = await tx.get(chunkRef(uid, i));
    if (!c.exists()) throw Error("Incomplete cloud backup");
    chunks.push(c.data().data);
  }
  return { progress: decodeProgress(chunks), count };
}
export async function connectCloud() {
  await setPersistence(auth, browserLocalPersistence);
  await auth.authStateReady();
  const user = auth.currentUser || (await signInAnonymously(auth)).user;
  const state = await runTransaction(db, (tx) => readState(tx, user.uid));
  return {
    progress: state.progress,
    async save(progress) {
      return runTransaction(db, async (tx) => {
        const previous = await readState(tx, user.uid);
        const merged = mergeProgress(previous.progress, progress),
          chunks = encodeProgress(merged);
        for (let i = 0; i < chunks.length; i++)
          tx.set(chunkRef(user.uid, i), { data: chunks[i] });
        for (let i = chunks.length; i < previous.count; i++)
          tx.delete(chunkRef(user.uid, i));
        tx.set(doc(db, "players", user.uid), {
          schemaVersion: 1,
          chunkCount: chunks.length,
          updatedAt: serverTimestamp(),
        });
        return merged;
      });
    },
  };
}
export function withTimeout(promise, ms = 10000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error("Cloud connection timed out")), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
