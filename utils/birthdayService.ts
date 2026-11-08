// Single place that changes birthdays. Every screen and the chat assistant go
// through here, so a change is always applied to local storage, reminders, the
// device calendar and the cloud together (previously each screen did a
// different subset, which left stale data behind).

import { addBirthdayToCalendar, removeBirthdayFromCalendar } from "./calendar";
import {
  deleteBirthdayFromCloud,
  flushPendingCloudOps,
  loadBirthdaysFromCloud,
  reconcileLocalToCloud,
  syncBirthdayToCloud,
} from "./cloudStorage";
import { validateDate } from "./dates";
import {
  checkAndSendBirthdayEmails,
  scheduleAllBirthdayNotifications,
} from "./notifications";
import {
  Birthday,
  hasStoredBirthdays,
  loadBirthdays,
  loadBirthdaysStrict,
  saveBirthdays,
  updateBirthdays,
} from "./storage";

export interface NewBirthday {
  name: string;
  day: number;
  month: number;
  relationship?: string;
  notes?: string;
}

export type BirthdayPatch = Partial<
  Pick<Birthday, "name" | "day" | "month" | "relationship" | "notes">
>;

const newId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function rescheduleNotifications() {
  try {
    await scheduleAllBirthdayNotifications(await loadBirthdaysStrict());
  } catch (e) {
    console.error("Failed to schedule notifications:", e);
  }
}

async function syncCalendarEvent(previous: Birthday | null, current: Birthday) {
  try {
    if (previous) await removeBirthdayFromCalendar(previous);
    const eventId = await addBirthdayToCalendar(current);
    if (eventId) {
      await updateBirthdays((list) =>
        list.map((b) =>
          b.id === current.id ? { ...b, calendarEventId: eventId } : b,
        ),
      );
    }
  } catch (e) {
    console.error("Failed to update calendar:", e);
  }
}

function assertValidDate(day: number, month: number) {
  const error = validateDate(String(day), String(month));
  if (error) throw new Error(error);
}

/** Saves locally (awaited), then updates reminders/calendar/cloud in the background. */
export async function createBirthday(input: NewBirthday): Promise<Birthday> {
  assertValidDate(input.day, input.month);
  const birthday: Birthday = {
    id: newId(),
    name: input.name.trim(),
    day: input.day,
    month: input.month,
    relationship: input.relationship?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
  };
  await updateBirthdays((list) => [...list, birthday]);
  void Promise.allSettled([
    rescheduleNotifications(),
    syncBirthdayToCloud(birthday),
    syncCalendarEvent(null, birthday),
  ]);
  return birthday;
}

export async function updateBirthday(
  id: string,
  patch: BirthdayPatch,
): Promise<Birthday | null> {
  if (patch.day !== undefined || patch.month !== undefined) {
    const existing = (await loadBirthdaysStrict()).find((b) => b.id === id);
    if (!existing) return null;
    assertValidDate(patch.day ?? existing.day, patch.month ?? existing.month);
  }

  const result: { previous?: Birthday; current?: Birthday } = {};
  await updateBirthdays((list) =>
    list.map((b) => {
      if (b.id !== id) return b;
      result.previous = b;
      result.current = {
        ...b,
        ...patch,
        name: patch.name?.trim() || b.name,
        relationship: patch.relationship?.trim() ?? b.relationship,
        notes: patch.notes?.trim() ?? b.notes,
      };
      return result.current;
    }),
  );

  const { previous, current } = result;
  if (!previous || !current) return null;

  void Promise.allSettled([
    rescheduleNotifications(),
    syncBirthdayToCloud(current),
    syncCalendarEvent(previous, current),
  ]);
  return current;
}

export async function removeBirthday(id: string): Promise<Birthday | null> {
  const result: { removed?: Birthday } = {};
  await updateBirthdays((list) => {
    result.removed = list.find((b) => b.id === id);
    return list.filter((b) => b.id !== id);
  });

  const { removed } = result;
  if (!removed) return null;

  void Promise.allSettled([
    rescheduleNotifications(),
    deleteBirthdayFromCloud(id),
    removeBirthdayFromCalendar(removed),
  ]);
  return removed;
}

/**
 * Runs before the app UI appears. Only a fresh install (nothing ever stored on
 * this device) restores from the cloud; an empty list the user created on
 * purpose is never "restored" back.
 */
export async function bootstrapBirthdays(): Promise<void> {
  try {
    if (await hasStoredBirthdays()) return;
    const restored = await loadBirthdaysFromCloud();
    await saveBirthdays(restored); // [] still marks the device as initialised
    if (restored.length > 0) {
      console.log("Restored", restored.length, "birthdays from cloud");
    }
  } catch (e) {
    // Leave storage untouched so the restore is attempted again next launch.
    console.warn("Cloud restore skipped:", e);
  }
}

/** Background housekeeping after each unlock. Never throws. */
export async function runPostUnlockTasks(): Promise<void> {
  try {
    await flushPendingCloudOps();
    const birthdays = await loadBirthdays();
    await Promise.allSettled([
      reconcileLocalToCloud(birthdays),
      scheduleAllBirthdayNotifications(birthdays),
    ]);
    await checkAndSendBirthdayEmails(birthdays);
  } catch (e) {
    console.error("Post-unlock tasks failed:", e);
  }
}
