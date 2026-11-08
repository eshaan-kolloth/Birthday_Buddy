// Pure date helpers shared by every screen, the notification scheduler and the
// tests. Keep this file free of imports so it can run under plain Node.

export const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const MS_PER_DAY = 86_400_000;

export const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export function getMaxDay(month: number): number {
  if (month < 1 || month > 12) return 31;
  return DAYS_IN_MONTH[month - 1];
}

/** Returns an error message, or "" when day/month form a real calendar date. */
export function validateDate(
  day: string,
  month: string,
  friendlyName?: string,
): string {
  const d = Number(day);
  const m = Number(month);
  if (!day || !month) return "Please enter both day and month.";
  if (!Number.isInteger(d) || d < 1) return "That day is not valid.";
  if (!Number.isInteger(m) || m < 1 || m > 12) return "That month is not valid.";
  const maxDay = getMaxDay(m);
  if (d > maxDay) {
    const greeting = friendlyName ? `Hey ${friendlyName} 😅 ` : "";
    return `${greeting}${MONTHS_SHORT[m - 1]} has only ${maxDay} days. Day ${d} does not exist.`;
  }
  return "";
}

/** The month/day a birthday is observed on in `year` (Feb 29 → Feb 28 in non-leap years). */
export function observedDate(
  month: number,
  day: number,
  year: number,
): { month: number; day: number } {
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return { month: 2, day: 28 };
  }
  return { month, day };
}

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Local-midnight date of the next time this birthday is observed (today counts). */
export function nextOccurrence(
  month: number,
  day: number,
  now: Date = new Date(),
): Date {
  const today = startOfDay(now);
  const year = today.getFullYear();
  const thisYear = observedDate(month, day, year);
  const candidate = new Date(year, thisYear.month - 1, thisYear.day);
  if (candidate.getTime() >= today.getTime()) return candidate;
  const nextYear = observedDate(month, day, year + 1);
  return new Date(year + 1, nextYear.month - 1, nextYear.day);
}

/** Whole calendar days until the next occurrence: 0 = today, 1 = tomorrow. */
export function daysUntil(
  month: number,
  day: number,
  now: Date = new Date(),
): number {
  const today = startOfDay(now);
  const next = nextOccurrence(month, day, now);
  return Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
}

export const isToday = (month: number, day: number, now: Date = new Date()) =>
  daysUntil(month, day, now) === 0;

/** True when the birthday is observed on the calendar day of `date`. */
export function occursOn(
  birthday: { month: number; day: number },
  date: Date,
): boolean {
  const observed = observedDate(
    birthday.month,
    birthday.day,
    date.getFullYear(),
  );
  return (
    observed.month === date.getMonth() + 1 && observed.day === date.getDate()
  );
}

const addMonthsClamped = (base: Date, months: number) => {
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(base.getDate(), lastDay));
  return target;
};

/** Calendar-accurate countdown (real months + leftover days) to the next occurrence. */
export function countdown(
  month: number,
  day: number,
  now: Date = new Date(),
): { months: number; days: number; total: number } {
  const today = startOfDay(now);
  const next = nextOccurrence(month, day, now);
  let months =
    (next.getFullYear() - today.getFullYear()) * 12 +
    (next.getMonth() - today.getMonth());
  if (addMonthsClamped(today, months).getTime() > next.getTime()) months -= 1;
  const anchor = addMonthsClamped(today, months);
  return {
    months,
    days: Math.round((next.getTime() - anchor.getTime()) / MS_PER_DAY),
    total: daysUntil(month, day, now),
  };
}
