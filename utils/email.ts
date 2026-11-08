import { EMAILJS } from "../constants/config";
import { MONTHS_FULL } from "./dates";
import { Birthday } from "./storage";

export const isEmailConfigured = () =>
  Boolean(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);

export const sendBirthdayEmail = async (
  birthday: Birthday,
  isToday: boolean,
): Promise<void> => {
  if (!isEmailConfigured()) {
    throw new Error("EmailJS is not configured (EXPO_PUBLIC_EMAILJS_* missing).");
  }

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
      service_id: EMAILJS.serviceId,
      template_id: EMAILJS.templateId,
      user_id: EMAILJS.publicKey,
      template_params: templateParams,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`EmailJS send failed: ${error}`);
  }
};
