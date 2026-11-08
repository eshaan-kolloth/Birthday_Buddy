// Daily job (GitHub Actions): emails a reminder for every birthday that is
// today or tomorrow. Run with TZ set to the owner's time zone (the workflow
// uses Asia/Kolkata) so "today" is the owner's today.

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const MONTHS_FULL = [
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

const USER_ID = process.env.CLOUD_USER_ID || "eshaan";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// Same rule as the app: a Feb 29 birthday is observed on Feb 28 in non-leap years.
function occursOn(birthday, date) {
  let { month, day } = birthday;
  if (month === 2 && day === 29 && !isLeapYear(date.getFullYear())) day = 28;
  return month === date.getMonth() + 1 && day === date.getDate();
}

const dateKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

async function sendEmail(birthday, isToday) {
  const message = isToday
    ? `🎉 Today is ${birthday.name}'s birthday! Don't forget to wish them right now!`
    : `🎂 Tomorrow is ${birthday.name}'s birthday! Get ready to wish them!`;

  const body = JSON.stringify({
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      birthday_name: birthday.name,
      birthday_date: `${MONTHS_FULL[birthday.month - 1]} ${birthday.day}`,
      birthday_relationship: birthday.relationship
        ? `Relationship: ${birthday.relationship}`
        : "",
      birthday_message: message,
    },
  });

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    let retryable = true;
    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "http://localhost" },
        body,
      });
      if (response.ok) return;
      const text = await response.text();
      lastError = new Error(`EmailJS responded ${response.status}: ${text}`);
      // Bad credentials/template (4xx) will not fix themselves; 429/5xx might.
      retryable = response.status >= 500 || response.status === 429;
    } catch (error) {
      lastError = error;
    }
    if (!retryable || attempt === 3) break;
    await sleep(2000 * attempt);
  }
  throw lastError;
}

async function main() {
  const serviceAccount = JSON.parse(requireEnv("FIREBASE_SERVICE_ACCOUNT"));
  requireEnv("EMAILJS_SERVICE_ID");
  requireEnv("EMAILJS_TEMPLATE_ID");
  requireEnv("EMAILJS_PUBLIC_KEY");

  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();
  const userRef = db.collection("users").doc(USER_ID);

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const targets = [
    { kind: "today", date: now },
    { kind: "tomorrow", date: tomorrow },
  ];

  console.log(
    `Running for ${dateKey(now)} (TZ=${process.env.TZ || "system default"})...`,
  );

  const snapshot = await userRef.collection("birthdays").get();
  if (snapshot.empty) {
    console.log("No birthdays found.");
    return;
  }

  let failures = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const birthday = {
      id: String(data.id || doc.id),
      name: data.name,
      day: Number(data.day),
      month: Number(data.month),
      relationship: data.relationship || "",
    };
    if (
      typeof birthday.name !== "string" ||
      !Number.isInteger(birthday.day) ||
      !Number.isInteger(birthday.month)
    ) {
      console.warn(`Skipping malformed birthday document ${doc.id}`);
      continue;
    }

    for (const { kind, date } of targets) {
      if (!occursOn(birthday, date)) continue;

      // Shared with the app: whichever runs first sends, the other skips.
      const marker = userRef
        .collection("emailLog")
        .doc(`${kind}_${birthday.id}_${dateKey(date)}`);
      if ((await marker.get()).exists) {
        console.log(`↩️  Already sent (${kind}) for ${birthday.name}`);
        continue;
      }

      try {
        console.log(`📧 Sending ${kind} email for ${birthday.name}...`);
        await sendEmail(birthday, kind === "today");
        await marker.set({
          sentAt: new Date().toISOString(),
          source: "github-action",
        });
        console.log(`✅ Email sent for ${birthday.name}`);
      } catch (error) {
        failures += 1;
        console.error(`❌ Failed for ${birthday.name}:`, error.message || error);
      }
    }
  }

  if (failures > 0) {
    // A non-zero exit makes the workflow run fail visibly (and GitHub emails you).
    console.error(`${failures} email(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("Done.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
