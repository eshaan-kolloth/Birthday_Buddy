const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

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

async function sendEmail(birthday, isToday) {
  const message = isToday
    ? `🎉 Today is ${birthday.name}'s birthday! Don't forget to wish them right now!`
    : `🎂 Tomorrow is ${birthday.name}'s birthday! Get ready to wish them!`;

  const templateParams = {
    birthday_name: birthday.name,
    birthday_date: `${MONTHS_FULL[birthday.month - 1]} ${birthday.day}`,
    birthday_relationship: birthday.relationship
      ? `Relationship: ${birthday.relationship}`
      : "",
    birthday_message: message,
  };

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: templateParams,
    }),
  });

  if (response.ok) {
    console.log(`✅ Email sent for ${birthday.name}`);
  } else {
    const error = await response.text();
    console.error(`❌ Failed for ${birthday.name}:`, error);
  }
}

async function main() {
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowMonth = tomorrowDate.getMonth() + 1;
  const tomorrowDay = tomorrowDate.getDate();

  console.log(`Running for ${todayMonth}/${todayDay}...`);

  const snapshot = await db.collection("birthdays").get();

  if (snapshot.empty) {
    console.log("No birthdays found.");
    return;
  }

  for (const doc of snapshot.docs) {
    const birthday = doc.data();

    const isToday = birthday.month === todayMonth && birthday.day === todayDay;
    const isTomorrow =
      birthday.month === tomorrowMonth && birthday.day === tomorrowDay;

    if (isToday || isTomorrow) {
      console.log(`📧 Sending email for ${birthday.name}...`);
      await sendEmail(birthday, isToday);
    }
  }

  console.log("Done.");
}

main().catch(console.error);
