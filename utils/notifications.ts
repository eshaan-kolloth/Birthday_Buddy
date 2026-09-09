import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { sendBirthdayEmail } from "./email";
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

// ── Ask iPhone for permission ──────────────────────────────
export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
};

// ── Schedule notifications for one birthday ────────────────
export const scheduleBirthdayNotifications = async (birthday: Birthday) => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const now = new Date();
  const year = now.getFullYear();

  let birthdayDate = new Date(year, birthday.month - 1, birthday.day);
  if (birthdayDate <= now) {
    birthdayDate = new Date(year + 1, birthday.month - 1, birthday.day);
  }

  // ── Notification 1: Day before at 9:00 AM ──
  const dayBefore = new Date(birthdayDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(9, 0, 0, 0);

  if (dayBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `birthday-reminder-${birthday.id}`,
      content: {
        title: "🎂 Birthday Tomorrow!",
        body: `${birthday.name}'s birthday is tomorrow! Don't forget to wish them! 🎉`,
        sound: true,
        data: { birthdayId: birthday.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dayBefore,
      },
    });
  }

  // ── Notification 2: On the birthday at 12:00 AM ──
  const onDay = new Date(birthdayDate);
  onDay.setHours(0, 0, 0, 0);

  if (onDay > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `birthday-today-${birthday.id}`,
      content: {
        title: "🎉 Happy Birthday!",
        body: `Today is ${birthday.name}'s birthday! Send them a wish right now! 🎂`,
        sound: true,
        data: { birthdayId: birthday.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: onDay,
      },
    });
  }
};

// ── Check today's and tomorrow's birthdays and send emails ─
export const checkAndSendBirthdayEmails = async (
  birthdays: Birthday[],
): Promise<void> => {
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const todayKey = `${now.getFullYear()}-${todayMonth}-${todayDay}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowMonth = tomorrow.getMonth() + 1;
  const tomorrowDay = tomorrow.getDate();

  for (const birthday of birthdays) {
    // Send email if birthday is TODAY
    if (birthday.month === todayMonth && birthday.day === todayDay) {
      const sentKey = `email_sent_today_${birthday.id}_${todayKey}`;
      const alreadySent = await AsyncStorage.getItem(sentKey);
      if (!alreadySent) {
        try {
          await sendBirthdayEmail(birthday, true);
          await AsyncStorage.setItem(sentKey, "1");
          console.log("Sent today email for:", birthday.name);
        } catch (e) {
          console.error("Failed to send today email:", e);
        }
      }
    }

    // Send email if birthday is TOMORROW
    if (birthday.month === tomorrowMonth && birthday.day === tomorrowDay) {
      const tomorrowDateKey = `${tomorrow.getFullYear()}-${tomorrowMonth}-${tomorrowDay}`;
      const sentKey = `email_sent_tomorrow_${birthday.id}_${tomorrowDateKey}`;
      const alreadySent = await AsyncStorage.getItem(sentKey);
      if (!alreadySent) {
        try {
          await sendBirthdayEmail(birthday, false);
          await AsyncStorage.setItem(sentKey, "1");
          console.log("Sent tomorrow email for:", birthday.name);
        } catch (e) {
          console.error("Failed to send tomorrow email:", e);
        }
      }
    }
  }
};

// ── Cancel notifications for a deleted birthday ────────────
export const cancelBirthdayNotifications = async (birthdayId: string) => {
  await Notifications.cancelScheduledNotificationAsync(
    `birthday-reminder-${birthdayId}`,
  );
  await Notifications.cancelScheduledNotificationAsync(
    `birthday-today-${birthdayId}`,
  );
};

// ── Schedule ALL birthdays — groups same-day birthdays ─────
export const scheduleAllBirthdayNotifications = async (
  birthdays: Birthday[],
) => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const year = now.getFullYear();

  const groups: Record<string, Birthday[]> = {};
  birthdays.forEach((b) => {
    const key = `${b.month}-${b.day}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });

  for (const [key, people] of Object.entries(groups)) {
    const [month, day] = key.split("-").map(Number);

    let birthdayDate = new Date(year, month - 1, day);
    if (birthdayDate <= now) {
      birthdayDate = new Date(year + 1, month - 1, day);
    }

    const names =
      people.length === 1
        ? people[0].name
        : people
            .slice(0, -1)
            .map((p) => p.name)
            .join(", ") +
          " & " +
          people[people.length - 1].name;

    const groupId = people.map((p) => p.id).join("_");

    // ── Notification 1: Day before at 9:00 AM ──
    const dayBefore = new Date(birthdayDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(9, 0, 0, 0);

    if (dayBefore > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `birthday-reminder-${groupId}`,
        content: {
          title: "🎂 Birthday Tomorrow!",
          body: `${names}'s birthday is tomorrow! Don't forget to wish them! 🎉`,
          sound: true,
          data: { groupId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dayBefore,
        },
      });
    }

    // ── Notification 2: On the birthday at 12:00 AM ──
    const onDay = new Date(birthdayDate);
    onDay.setHours(0, 0, 0, 0);

    if (onDay > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `birthday-today-${groupId}`,
        content: {
          title: "🎉 Happy Birthday!",
          body: `Today is ${names}'s birthday! Send them a wish right now! 🎂`,
          sound: true,
          data: { groupId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: onDay,
        },
      });
    }
  }
};

// ── Get all scheduled notifications (for debugging) ────────
export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};
