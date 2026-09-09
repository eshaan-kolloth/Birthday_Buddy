import { Birthday } from "./storage";

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

export const sendBirthdayEmail = async (
  birthday: Birthday,
  isToday: boolean,
): Promise<void> => {
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
      service_id: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
      template_id: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
      user_id: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,
      template_params: templateParams,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`EmailJS send failed: ${error}`);
  }
};
