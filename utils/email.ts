import { Birthday } from "./storage";

const SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || "";
const TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || "";
const PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || "";

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

export const sendBirthdayEmail = async (birthday: Birthday): Promise<void> => {
  try {
    console.log("SERVICE_ID:", SERVICE_ID);
    console.log("TEMPLATE_ID:", TEMPLATE_ID);
    console.log("PUBLIC_KEY:", PUBLIC_KEY);
    const isToday =
      new Date().getMonth() + 1 === birthday.month &&
      new Date().getDate() === birthday.day;

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

    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          service_id: SERVICE_ID,
          template_id: TEMPLATE_ID,
          user_id: PUBLIC_KEY,
          template_params: templateParams,
        }),
      },
    );

    if (response.ok) {
      console.log("Birthday email sent for:", birthday.name);
    } else {
      const errorText = await response.text();
      console.error("Email failed:", errorText);
    }
  } catch (e) {
    console.error("Failed to send email:", e);
  }
};

export const sendTestEmail = async (): Promise<void> => {
  const testBirthday: Birthday = {
    id: "test",
    name: "Arjun",
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    relationship: "friend",
  };
  await sendBirthdayEmail(testBirthday);
};
