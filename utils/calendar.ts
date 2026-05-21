import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import { Birthday } from "./storage";

async function getBirthdayBuddyCalendarId() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== "granted") {
    console.log("Calendar permission denied");
    return null;
  }

  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );

  let birthdayCalendar = calendars.find((c) => c.title === "BirthdayBuddy");
  if (birthdayCalendar) return birthdayCalendar.id;

  const defaultCalendar =
    Platform.OS === "ios"
      ? await Calendar.getDefaultCalendarAsync()
      : calendars.find((c) => c.allowsModifications);

  if (!defaultCalendar) return null;

  const newCalendarId = await Calendar.createCalendarAsync({
    title: "BirthdayBuddy",
    color: "#00E5FF",
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultCalendar.source?.id,
    source: defaultCalendar.source,
    name: "BirthdayBuddy",
    ownerAccount: "personal",
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });

  return newCalendarId;
}

export const addBirthdayToCalendar = async (
  birthday: Birthday,
): Promise<string | null> => {
  try {
    const calendarId = await getBirthdayBuddyCalendarId();
    if (!calendarId) return null;

    // First delete any existing events for this person
    await removeBirthdayFromCalendar(birthday);

    const now = new Date();
    const year = now.getFullYear();
    const eventDate = new Date(year, birthday.month - 1, birthday.day);

    // Compare dates only, not time
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    if (eventDate < todayMidnight) {
      eventDate.setFullYear(year + 1);
    }

    const title = birthday.relationship
      ? `🎂 ${birthday.name}'s Birthday (${birthday.relationship})`
      : `🎂 ${birthday.name}'s Birthday`;

    const eventId = await Calendar.createEventAsync(calendarId, {
      title,
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

    // Fallback: search by exact title in BirthdayBuddy calendar only
    const now = new Date();
    const future = new Date(now.getFullYear() + 3, 11, 31);

    const events = await Calendar.getEventsAsync([calendarId], now, future);

    const expectedTitle1 = `🎂 ${birthday.name}'s Birthday`;
    const expectedTitle2 = `🎂 ${birthday.name}'s Birthday (${birthday.relationship})`;

    const matches = events.filter(
      (e) => e.title === expectedTitle1 || e.title === expectedTitle2,
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
