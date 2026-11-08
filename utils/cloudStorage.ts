import AsyncStorage from "@react-native-async-storage/async-storage";
import { CLOUD_USER_ID, FIREBASE_PROJECT_ID } from "../constants/config";
import { Birthday } from "./storage";

// Firestore REST access. The REST API is used (rather than the firebase SDK)
// to keep the bundle small. Every write goes through a persisted queue so a
// failed or offline request is retried later instead of being lost.

const USER_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${CLOUD_USER_ID}`;
const BIRTHDAYS_URL = `${USER_URL}/birthdays`;
const EMAIL_LOG_URL = `${USER_URL}/emailLog`;

const PENDING_KEY = "cloud_pending_ops";
const LAST_RECONCILE_KEY = "cloud_last_reconcile";
const JSON_HEADERS = { "Content-Type": "application/json" };

type FirestoreValue = { stringValue?: string; integerValue?: string };
type FirestoreDoc = { name?: string; fields?: Record<string, FirestoreValue> };

type PendingOp =
  | { type: "upsert"; birthday: Birthday }
  | { type: "delete"; id: string };

const opId = (op: PendingOp) =>
  op.type === "upsert" ? op.birthday.id : op.id;

// ── Mapping ────────────────────────────────────────────────
const toFields = (b: Birthday) => ({
  id: { stringValue: b.id },
  name: { stringValue: b.name },
  day: { integerValue: String(b.day) },
  month: { integerValue: String(b.month) },
  relationship: { stringValue: b.relationship || "" },
  notes: { stringValue: b.notes || "" },
});

function fromDoc(doc: FirestoreDoc): Birthday | null {
  const f = doc.fields;
  if (!f) return null;
  const id = f.id?.stringValue ?? doc.name?.split("/").pop();
  const name = f.name?.stringValue;
  const day = Number(f.day?.integerValue);
  const month = Number(f.month?.integerValue);
  if (!id || !name || !Number.isInteger(day) || !Number.isInteger(month)) {
    return null;
  }
  return {
    id,
    name,
    day,
    month,
    relationship: f.relationship?.stringValue ?? "",
    notes: f.notes?.stringValue ?? "",
  };
}

const differs = (a: Birthday, b: Birthday) =>
  a.name !== b.name ||
  a.day !== b.day ||
  a.month !== b.month ||
  (a.relationship || "") !== (b.relationship || "") ||
  (a.notes || "") !== (b.notes || "");

async function fail(context: string, res: Response): Promise<never> {
  const body = await res.text().catch(() => "");
  throw new Error(`${context}: HTTP ${res.status} ${body}`.trim());
}

// ── Persisted write queue ──────────────────────────────────
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task);
  chain = run.catch(() => undefined);
  return run;
}

async function readPending(): Promise<PendingOp[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PendingOp[]) : [];
  } catch {
    return [];
  }
}

const writePending = (ops: PendingOp[]) =>
  AsyncStorage.setItem(PENDING_KEY, JSON.stringify(ops));

async function sendOp(op: PendingOp): Promise<void> {
  if (op.type === "upsert") {
    const res = await fetch(
      `${BIRTHDAYS_URL}/${encodeURIComponent(op.birthday.id)}`,
      {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ fields: toFields(op.birthday) }),
      },
    );
    if (!res.ok) await fail("Firestore sync", res);
  } else {
    const res = await fetch(`${BIRTHDAYS_URL}/${encodeURIComponent(op.id)}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 404) await fail("Firestore delete", res);
  }
}

/** Sends queued operations in order; stops at the first failure. Never throws. */
async function drain(): Promise<boolean> {
  const pending = await readPending();
  while (pending.length > 0) {
    try {
      await sendOp(pending[0]);
    } catch (e) {
      console.warn("Cloud sync deferred (will retry):", e);
      await writePending(pending);
      return false;
    }
    pending.shift();
    await writePending(pending);
  }
  return true;
}

async function enqueue(op: PendingOp): Promise<void> {
  await serial(async () => {
    // One pending operation per birthday: the latest one wins.
    const pending = (await readPending()).filter((p) => opId(p) !== opId(op));
    pending.push(op);
    await writePending(pending);
    await drain();
  });
}

/** Retries anything that failed earlier. Resolves true when the queue is empty. */
export const flushPendingCloudOps = (): Promise<boolean> =>
  serial(drain).catch((e) => {
    console.warn("Cloud flush failed:", e);
    return false;
  });

export const syncBirthdayToCloud = async (birthday: Birthday): Promise<void> => {
  try {
    await enqueue({ type: "upsert", birthday });
  } catch (e) {
    console.error("Failed to queue cloud sync:", e);
  }
};

export const deleteBirthdayFromCloud = async (id: string): Promise<void> => {
  try {
    await enqueue({ type: "delete", id });
  } catch (e) {
    console.error("Failed to queue cloud delete:", e);
  }
};

// ── Reads ──────────────────────────────────────────────────
/** Loads every birthday (all pages). THROWS on failure so callers can tell
 *  "the cloud is empty" apart from "the cloud is unreachable". */
export const loadBirthdaysFromCloud = async (): Promise<Birthday[]> => {
  const result: Birthday[] = [];
  let pageToken: string | undefined;
  do {
    const url = `${BIRTHDAYS_URL}?pageSize=300${
      pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""
    }`;
    const res = await fetch(url);
    if (!res.ok) await fail("Firestore load", res);
    const data = (await res.json()) as {
      documents?: FirestoreDoc[];
      nextPageToken?: string;
    };
    for (const doc of data.documents ?? []) {
      const birthday = fromDoc(doc);
      if (birthday) result.push(birthday);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return result;
};

/**
 * Once a day, make the cloud match this device: upsert anything that is
 * missing or different. Heals entries that were never synced. It never deletes
 * cloud documents, so data from another install is never destroyed.
 */
export const reconcileLocalToCloud = async (local: Birthday[]): Promise<void> => {
  const today = new Date().toDateString();
  try {
    if ((await AsyncStorage.getItem(LAST_RECONCILE_KEY)) === today) return;
    if (!(await flushPendingCloudOps())) return;
    const cloud = new Map((await loadBirthdaysFromCloud()).map((b) => [b.id, b]));
    for (const birthday of local) {
      const remote = cloud.get(birthday.id);
      if (!remote || differs(birthday, remote)) {
        await syncBirthdayToCloud(birthday);
      }
    }
    await AsyncStorage.setItem(LAST_RECONCILE_KEY, today);
  } catch (e) {
    console.warn("Cloud reconcile skipped:", e);
  }
};

// ── Shared "email already sent" markers ────────────────────
// Both this app and the GitHub Action check/write these, so a birthday email
// is sent once no matter which of them runs first.
export const hasEmailBeenSent = async (key: string): Promise<boolean> => {
  const res = await fetch(`${EMAIL_LOG_URL}/${encodeURIComponent(key)}`);
  if (res.status === 404) return false;
  if (!res.ok) await fail("Email log check", res);
  return true;
};

export const markEmailSent = async (key: string): Promise<void> => {
  const res = await fetch(`${EMAIL_LOG_URL}/${encodeURIComponent(key)}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      fields: {
        sentAt: { stringValue: new Date().toISOString() },
        source: { stringValue: "app" },
      },
    }),
  });
  if (!res.ok) await fail("Email log write", res);
};
