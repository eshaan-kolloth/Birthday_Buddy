// Central runtime configuration.
//
// NOTE: every EXPO_PUBLIC_* value is inlined into the app bundle at build time,
// so it is readable by anyone who has the app. Do not put secrets you cannot
// afford to leak here — see "Security notes" in the README.

/** Name used in greetings and in the chat assistant's system prompt. */
export const USER_NAME = "Eshaan";

/** Firestore document id under `users/` that holds this person's birthdays. */
export const CLOUD_USER_ID = process.env.EXPO_PUBLIC_CLOUD_USER_ID || "eshaan";

export const FIREBASE_PROJECT_ID =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "birthdaybuddy-7ebac";

// ── Chat assistant ─────────────────────────────────────────
/**
 * Point this at your own proxy (which holds the real API key) to keep the key
 * out of the app bundle. When unset, the app calls Groq directly.
 */
export const CHAT_API_URL =
  process.env.EXPO_PUBLIC_CHAT_API_URL ||
  "https://api.groq.com/openai/v1/chat/completions";
export const USING_DEFAULT_CHAT_API = !process.env.EXPO_PUBLIC_CHAT_API_URL;
export const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";
export const CHAT_MODEL =
  process.env.EXPO_PUBLIC_CHAT_MODEL || "openai/gpt-oss-120b";
/** How many of the latest chat messages are sent to the model. */
export const CHAT_HISTORY_LIMIT = 20;

// ── EmailJS ────────────────────────────────────────────────
export const EMAILJS = {
  serviceId: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
  templateId: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
  publicKey: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,
};

// ── App lock ───────────────────────────────────────────────
/** Re-lock the app if it stayed in the background longer than this. */
export const RELOCK_AFTER_MS = 30_000;
