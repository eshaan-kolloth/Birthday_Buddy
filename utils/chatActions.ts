// Parses the SAVE_BIRTHDAY / DELETE_BIRTHDAY tags the chat model may emit.
// Pure and import-free so it can be unit-tested under plain Node.

export type ChatAction =
  | {
      type: "save";
      name: string;
      day: number;
      month: number;
      relationship: string;
    }
  | { type: "delete"; name: string };

export interface ParsedReply {
  actions: ChatAction[];
  /** The reply with every action tag removed. */
  text: string;
  /** Tags that were malformed, truncated or missing required fields. */
  invalidTags: number;
}

// The JSON payloads are flat objects, so [^{}]* is enough to capture them.
const TAG = /\b(SAVE|DELETE)_BIRTHDAY:\s*(\{[^{}]*\})/g;
const LEFTOVER_TAG = /\b(?:SAVE|DELETE)_BIRTHDAY:[^\n]*/g;

function toAction(kind: string, json: string): ChatAction | null {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  const name = typeof d.name === "string" ? d.name.trim() : "";
  if (!name) return null;
  if (kind === "DELETE") return { type: "delete", name };

  const day = Number(d.day);
  const month = Number(d.month);
  if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
  const relationship =
    typeof d.relationship === "string" ? d.relationship.trim().toLowerCase() : "";
  return { type: "save", name, day, month, relationship };
}

export function parseChatActions(reply: string): ParsedReply {
  const actions: ChatAction[] = [];
  let invalidTags = 0;

  const withoutValid = reply.replace(TAG, (_match, kind: string, json: string) => {
    const action = toAction(kind, json);
    if (action) actions.push(action);
    else invalidTags += 1;
    return "";
  });

  const text = withoutValid
    .replace(LEFTOVER_TAG, () => {
      invalidTags += 1;
      return "";
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { actions, text, invalidTags };
}
