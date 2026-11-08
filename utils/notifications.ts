import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { hasEmailBeenSent, markEmailSent } from "./cloudStorage";
import { daysUntil, observedDate, occursOn } from "./dates";
import { isEmailConfigured, sendBirthdayEmail } from "./email";
import { Birthday } from "./storage";

// ── Configure how notifications appear when app is open ────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// iOS keeps at most 64 pending local notifications; two per date → 30 dates.
const MAX_DATES = Platform.OS === "ios" ? 30 : 200;
// A non-leap reference year turns Feb 29 into Feb 28 and makes "day before" safe.
const REFERENCE_YEAR = 2023;

// ── Ask for permission ─────────────────────────────────────
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
};

const joinNames = (names: string[]) =>
  names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;

/**
 * Re-creates every reminder from scratch. Reminders are grouped by calendar
 * date (one notification for everyone who shares it) and use YEARLY repeating
 * triggers, so they keep firing every year even if the app is never opened.
 * Because the whole set is rebuilt after every change, ids can never go stale.
 */
export const scheduleAllBirthdayNotifications = async (
  birthdays: Birthday[],
): Promise<void> => {
  if (Platform.OS === "web") return;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const groups = new Map<string, Birthday[]>();
  for (const b of birthdays) {
    const key = `${b.month}-${b.day}`;
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }

  const ordered = [...groups.entries()]
    .sort(
      ([, a], [, b]) =>
        daysUntil(a[0].month, a[0].day) - daysUntil(b[0].month, b[0].day),
    )
    .slice(0, MAX_DATES);

  for (const [key, people] of ordered) {
    const { month, day } = observedDate(
      people[0].month,
      people[0].day,
      REFERENCE_YEAR,
    );
    const names = joinNames(people.map((p) => p.name));
    const data = { birthdayIds: people.map((p) => p.id) };

    // Day before at 9:00 AM
    const eve = new Date(REFERENCE_YEAR, month - 1, day - 1);
    await Notifications.scheduleNotificationAsync({
      identifier: `birthday-reminder-${key}`,
      content: {
        title: "🎂 Birthday Tomorrow!",
        body: `${names}'s birthday is tomorrow! Don't forget to wish them! 🎉`,
        sound: true,
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.YEARLY,
        month: eve.getMonth() + 1,
        day: eve.getDate(),
        hour: 9,
        minute: 0,
      },
    });

    // On the birthday at 12:00 AM
    await Notifications.scheduleNotificationAsync({
      identifier: `birthday-today-${key}`,
      content: {
        title: "🎉 Happy Birthday!",
        body: `Today is ${names}'s birthday! Send them a wish right now! 🎂`,
        sound: true,
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.YEARLY,
        month,
        day,
        hour: 0,
        minute: 0,
      },
    });
  }
};

// ── Emails for today's and tomorrow's birthdays ────────────
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

async function pruneOldEmailKeys(keep: string[]) {
  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter(
    (k) => k.startsWith("email_sent_") && !keep.some((d) => k.endsWith(`_${d}`)),
  );
  if (stale.length > 0) await AsyncStorage.multiRemove(stale);
}

export const checkAndSendBirthdayEmails = async (
  birthdays: Birthday[],
): Promise<void> => {
  if (!isEmailConfigured()) {
    console.warn("Birthday emails skipped: EmailJS is not configured.");
    return;
  }

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const targets = [
    { kind: "today" as const, date: now },
    { kind: "tomorrow" as const, date: tomorrow },
  ];

  try {
    await pruneOldEmailKeys(targets.map((t) => dateKey(t.date)));
  } catch (e) {
    console.warn("Could not prune email markers:", e);
  }

  for (const birthday of birthdays) {
    for (const { kind, date } of targets) {
      if (!occursOn(birthday, date)) continue;

      const marker = `${kind}_${birthday.id}_${dateKey(date)}`;
      const localKey = `email_sent_${marker}`;
      if (await AsyncStorage.getItem(localKey)) continue;

      try {
        // The GitHub Action may already have sent it (shared marker in Firestore).
        const alreadySent = await hasEmailBeenSent(marker).catch(() => false);
        if (!alreadySent) {
          await sendBirthdayEmail(birthday, kind === "today");
          console.log(`Sent ${kind} email for:`, birthday.name);
          await markEmailSent(marker).catch((e) =>
            console.warn("Could not record email marker:", e),
          );
        }
        await AsyncStorage.setItem(localKey, "1");
      } catch (e) {
        console.error(`Failed to send ${kind} email:`, e);
      }
    }
  }
};

// ── Get all scheduled notifications (for debugging) ────────
export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};
