import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Birthday {
  id: string;
  name: string;
  day: number;
  month: number;
  year?: number;
  relationship?: string;
  notes?: string;
  /** Id of the matching event in the device calendar (local only, not synced). */
  calendarEventId?: string;
}

const BIRTHDAYS_KEY = "birthdays";
const CORRUPT_BACKUP_KEY = "birthdays_corrupt_backup";

// All writes go through one queue so concurrent read-modify-write cycles
// (chat actions, calendar id write-backs, edits) can never lose updates.
let writeQueue: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task);
  writeQueue = run.catch(() => undefined);
  return run;
}

function normalize(raw: unknown): Birthday | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = r.id == null ? "" : String(r.id);
  const day = Number(r.day);
  const month = Number(r.month);
  if (
    !id ||
    typeof r.name !== "string" ||
    !Number.isInteger(day) ||
    !Number.isInteger(month)
  ) {
    return null;
  }
  // day/month are coerced because older versions could store them as strings.
  return { ...(r as unknown as Birthday), id, day, month };
}

/** Reads everything; THROWS if the stored data cannot be read or parsed. */
async function readAll(): Promise<Birthday[]> {
  const data = await AsyncStorage.getItem(BIRTHDAYS_KEY);
  if (data === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    parsed = null;
  }
  if (!Array.isArray(parsed)) {
    // Keep the raw bytes so nothing is lost, and refuse to continue so a
    // later write cannot overwrite the damaged data with an empty list.
    await AsyncStorage.setItem(CORRUPT_BACKUP_KEY, data);
    throw new Error(
      `Stored birthdays are unreadable (raw copy kept under "${CORRUPT_BACKUP_KEY}").`,
    );
  }
  return parsed
    .map(normalize)
    .filter((b): b is Birthday => b !== null);
}

/** True once the app has ever saved a list (distinguishes a fresh install). */
export const hasStoredBirthdays = async (): Promise<boolean> =>
  (await AsyncStorage.getItem(BIRTHDAYS_KEY)) !== null;

/** Strict read for code that will write afterwards. Throws on failure. */
export const loadBirthdaysStrict = readAll;

/** Display-safe read: logs and returns [] if storage is unreadable. */
export const loadBirthdays = async (): Promise<Birthday[]> => {
  try {
    return await readAll();
  } catch (e) {
    console.error("Failed to load birthdays:", e);
    return [];
  }
};

/** Atomic read-modify-write. Throws (and writes nothing) if the read fails. */
export const updateBirthdays = (
  mutator: (current: Birthday[]) => Birthday[],
): Promise<Birthday[]> =>
  serialize(async () => {
    const next = mutator(await readAll());
    await AsyncStorage.setItem(BIRTHDAYS_KEY, JSON.stringify(next));
    return next;
  });

/** Replaces the whole list. Throws if the write fails. */
export const saveBirthdays = (birthdays: Birthday[]): Promise<void> =>
  serialize(() => AsyncStorage.setItem(BIRTHDAYS_KEY, JSON.stringify(birthdays)));

export const addBirthday = async (birthday: Birthday): Promise<void> => {
  await updateBirthdays((list) => [...list, birthday]);
};

export const deleteBirthday = async (id: string): Promise<void> => {
  await updateBirthdays((list) => list.filter((b) => b.id !== id));
};
