// Run with: npm test   (Node's built-in test runner; no extra dependencies)
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  countdown,
  daysUntil,
  isLeapYear,
  nextOccurrence,
  observedDate,
  occursOn,
  validateDate,
} from "./dates.ts";

const at = (y, m, d, h = 15) => new Date(y, m - 1, d, h, 30);

test("today is 0 days away, even late in the day", () => {
  assert.equal(daysUntil(11, 8, at(2026, 11, 8, 23)), 0);
  assert.equal(daysUntil(11, 8, at(2026, 11, 8, 0)), 0);
});

test("tomorrow is 1 day away regardless of the time of day", () => {
  assert.equal(daysUntil(11, 9, at(2026, 11, 8, 23)), 1);
  assert.equal(daysUntil(11, 9, at(2026, 11, 8, 0)), 1);
});

test("a birthday that already passed rolls over to next year", () => {
  assert.equal(daysUntil(11, 7, at(2026, 11, 8)), 364);
  assert.equal(nextOccurrence(1, 1, at(2026, 12, 31)).getFullYear(), 2027);
  assert.equal(daysUntil(1, 1, at(2026, 12, 31)), 1);
});

test("Feb 29 is observed on Feb 28 in non-leap years only", () => {
  assert.equal(isLeapYear(2028), true);
  assert.equal(isLeapYear(2027), false);
  assert.deepEqual(observedDate(2, 29, 2027), { month: 2, day: 28 });
  assert.deepEqual(observedDate(2, 29, 2028), { month: 2, day: 29 });
  assert.equal(occursOn({ month: 2, day: 29 }, new Date(2027, 1, 28)), true);
  assert.equal(occursOn({ month: 2, day: 29 }, new Date(2027, 2, 1)), false);
  assert.equal(occursOn({ month: 2, day: 29 }, new Date(2028, 1, 29)), true);
});

test("a birthday today is reported as today, not a year away", () => {
  // Regression: the stats screen used `next <= now` and counted today as ~365 days.
  assert.equal(daysUntil(3, 14, at(2026, 3, 14)), 0);
});

test("countdown uses real calendar months", () => {
  const c = countdown(12, 25, at(2026, 11, 8));
  assert.deepEqual(c, { months: 1, days: 17, total: 47 });
  assert.deepEqual(countdown(11, 8, at(2026, 11, 8)), { months: 0, days: 0, total: 0 });
});

test("validateDate accepts real dates and explains bad ones", () => {
  assert.equal(validateDate("29", "2"), "");
  assert.equal(validateDate("31", "12"), "");
  assert.match(validateDate("31", "4"), /Apr has only 30 days/);
  assert.match(validateDate("30", "2", "Sam"), /^Hey Sam/);
  assert.equal(validateDate("", "3"), "Please enter both day and month.");
  assert.match(validateDate("0", "3"), /not valid/);
  assert.match(validateDate("5", "13"), /not valid/);
});
