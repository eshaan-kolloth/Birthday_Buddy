import assert from "node:assert/strict";
import { test } from "node:test";
import { parseChatActions } from "./chatActions.ts";

test("extracts a save action and strips the tag from the text", () => {
  const { actions, text, invalidTags } = parseChatActions(
    'Saved! 🎂\nSAVE_BIRTHDAY:{"name":"Asha","day":5,"month":3,"relationship":"Friend"}',
  );
  assert.deepEqual(actions, [
    { type: "save", name: "Asha", day: 5, month: 3, relationship: "friend" },
  ]);
  assert.equal(text, "Saved! 🎂");
  assert.equal(invalidTags, 0);
});

test("coerces numeric strings and keeps text that follows a tag", () => {
  const { actions, text } = parseChatActions(
    'SAVE_BIRTHDAY:{"name":"Ravi","day":"12","month":"7"} All set — see you then!',
  );
  assert.deepEqual(actions, [
    { type: "save", name: "Ravi", day: 12, month: 7, relationship: "" },
  ]);
  assert.equal(text, "All set — see you then!");
});

test("handles a rename (delete + save) in one reply", () => {
  const { actions } = parseChatActions(
    'DELETE_BIRTHDAY:{"name":"Bob"}\nSAVE_BIRTHDAY:{"name":"Robert","day":1,"month":2}',
  );
  assert.deepEqual(
    actions.map((a) => a.type),
    ["delete", "save"],
  );
});

test("counts malformed and truncated tags instead of throwing", () => {
  const { actions, text, invalidTags } = parseChatActions(
    'Okay. SAVE_BIRTHDAY:{"name":"Cut","day":5\nDELETE_BIRTHDAY:{"day":1}',
  );
  assert.deepEqual(actions, []);
  assert.equal(invalidTags, 2);
  assert.equal(text, "Okay.");
});

test("rejects non-integer dates", () => {
  const { actions, invalidTags } = parseChatActions(
    'SAVE_BIRTHDAY:{"name":"X","day":"soon","month":3}',
  );
  assert.deepEqual(actions, []);
  assert.equal(invalidTags, 1);
});

test("plain replies pass through untouched", () => {
  const { actions, text, invalidTags } = parseChatActions("Hi there! 👋");
  assert.deepEqual(actions, []);
  assert.equal(text, "Hi there! 👋");
  assert.equal(invalidTags, 0);
});
