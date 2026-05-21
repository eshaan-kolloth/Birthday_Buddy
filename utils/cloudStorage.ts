import { Birthday } from "./storage";

const PROJECT_ID = "birthdaybuddy-7ebac";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/eshaan/birthdays`;

export const syncBirthdayToCloud = async (
  birthday: Birthday,
): Promise<void> => {
  try {
    console.log("syncBirthdayToCloud called for:", birthday.name);
    const url = `${BASE_URL}/${birthday.id}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          id: { stringValue: birthday.id },
          name: { stringValue: birthday.name },
          day: { integerValue: String(birthday.day) },
          month: { integerValue: String(birthday.month) },
          relationship: { stringValue: birthday.relationship || "" },
          notes: { stringValue: birthday.notes || "" },
        },
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Firestore sync error:", JSON.stringify(result));
    } else {
      console.log("Synced to cloud:", birthday.name);
    }
  } catch (e) {
    console.error("Failed to sync to cloud:", e);
  }
};

export const deleteBirthdayFromCloud = async (id: string): Promise<void> => {
  try {
    const url = `${BASE_URL}/${id}`;
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json();
      console.error("Firestore delete error:", JSON.stringify(result));
    } else {
      console.log("Deleted from cloud:", id);
    }
  } catch (e) {
    console.error("Failed to delete from cloud:", e);
  }
};

export const loadBirthdaysFromCloud = async (): Promise<Birthday[]> => {
  try {
    const response = await fetch(BASE_URL);
    const data = await response.json();
    if (!response.ok) {
      console.error("Firestore load error:", JSON.stringify(data));
      return [];
    }
    if (!data.documents) return [];
    return data.documents.map((doc: any) => ({
      id: doc.fields.id.stringValue,
      name: doc.fields.name.stringValue,
      day: parseInt(doc.fields.day.integerValue),
      month: parseInt(doc.fields.month.integerValue),
      relationship: doc.fields.relationship?.stringValue || "",
      notes: doc.fields.notes?.stringValue || "",
    }));
  } catch (e) {
    console.error("Failed to load from cloud:", e);
    return [];
  }
};
