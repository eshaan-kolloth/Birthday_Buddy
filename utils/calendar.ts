// SDK 58 moved the function-based API to `expo-calendar/legacy` and made the root
// import an object-oriented API (the old names remain at the root only as
// deprecated wrappers that are due to be removed). Importing the legacy entry
// point explicitly keeps this stable.
import * as Calendar from "expo-calendar/legacy";
import { Platform } from "react-native";
import { observedDate } from "./dates";
import { Birthday } from "./storage";

const CALENDAR_TITLE = "BirthdayBuddy";

async function resolveCalendarId(): Promise<string | null> {
  let { status } = await Calendar.getCalendarPermissionsAsync();
  if (status !== "granted") {
    ({ status } = await Calendar.requestCalendarPermissionsAsync());
  }
  if (status !== "granted") {
    console.log("Calendar permission denied");
    return null;
  }

  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );

  const existing = calendars.find((c) => c.title === CALENDAR_TITLE);
  if (existing) return existing.id;

  const defaultCalendar =
    Platform.OS === "ios"
      ? await Calendar.getDefaultCalendarAsync()
      : calendars.find((c) => c.allowsModifications);

  if (!defaultCalendar) return null;

  return Calendar.createCalendarAsync({
    title: CALENDAR_TITLE,
    color: "#00E5FF",
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultCalendar.source?.id,
    source: defaultCalendar.source,
    name: CALENDAR_TITLE,
    ownerAccount: "personal",
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

// One in-flight lookup is shared, so two quick calls can never each decide the
// calendar is missing and create it twice.
let calendarIdPromise: Promise<string | null> | null = null;
function getBirthdayBuddyCalendarId(): Promise<string | null> {
  if (!calendarIdPromise) {
    calendarIdPromise = resolveCalendarId().then(
      (id) => {
        if (!id) calendarIdPromise = null; // permission denied: ask again next time
        return id;
      },
      (e) => {
        calendarIdPromise = null;
        throw e;
      },
    );
  }
  return calendarIdPromise;
}

const titleFor = (birthday: Birthday) =>
  birthday.relationship
    ? `🎂 ${birthday.name}'s Birthday (${birthday.relationship})`
    : `🎂 ${birthday.name}'s Birthday`;

export const addBirthdayToCalendar = async (
  birthday: Birthday,
): Promise<string | null> => {
  if (Platform.OS === "web") return null;
  try {
    const calendarId = await getBirthdayBuddyCalendarId();
    if (!calendarId) return null;

    // First delete any existing events for this person
    await removeBirthdayFromCalendar(birthday);

    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    // Feb 29 repeats yearly on Feb 28 so it still appears in non-leap years.
    const { month, day } = observedDate(birthday.month, birthday.day, 2023);
    let eventDate = new Date(now.getFullYear(), month - 1, day);
    if (eventDate < todayMidnight) {
      eventDate = new Date(now.getFullYear() + 1, month - 1, day);
    }

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: titleFor(birthday),
      startDate: eventDate,
      endDate: eventDate,
      allDay: true,
      recurrenceRule: {
        frequency: Calendar.Frequency.YEARLY,
      },
      alarms: [{ relativeOffset: -780 }, { relativeOffset: 0 }],
      notes: "BirthdayBuddy Event",
    });

    console.log("Added calendar event:", eventId, "for", birthday.name);
    return eventId;
  } catch (e) {
    console.log("Add error:", e);
    return null;
  }
};

export const removeBirthdayFromCalendar = async (
  birthday: Birthday,
): Promise<void> => {
  if (Platform.OS === "web") return;
  try {
    const calendarId = await getBirthdayBuddyCalendarId();
    if (!calendarId) return;

    // Try deleting by stored ID first
    if (birthday.calendarEventId) {
      try {
        await Calendar.deleteEventAsync(birthday.calendarEventId, {
          futureEvents: true,
        });
        console.log("Deleted by ID:", birthday.calendarEventId);
        return;
      } catch {
        console.log("ID delete failed, searching by name...");
      }
    }

    // Fallback: search the dedicated BirthdayBuddy calendar by title. The
    // prefix match also finds events saved with an older relationship label.
    const now = new Date();
    const future = new Date(now.getFullYear() + 3, 11, 31);
    const events = await Calendar.getEventsAsync([calendarId], now, future);

    const prefix = `🎂 ${birthday.name}'s Birthday`;
    const matches = events.filter(
      (e) => e.title === prefix || e.title.startsWith(`${prefix} (`),
    );

    console.log(
      `Found ${matches.length} BirthdayBuddy events for "${birthday.name}"`,
    );

    for (const event of matches) {
      await Calendar.deleteEventAsync(event.id, { futureEvents: true });
      console.log("Deleted:", event.id, event.title);
    }
  } catch (e) {
    console.log("Delete error:", e);
  }
};
