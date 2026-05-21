import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Birthday {
  id: string;
  name: string;
  day: number;
  month: number;
  year?: number;
  relationship?: string;
  notes?: string;
  calendarEventId?: string; // ← NEW: stores the iPhone calendar event ID
}

const BIRTHDAYS_KEY = "birthdays";

// Save all birthdays
export const saveBirthdays = async (birthdays: Birthday[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(BIRTHDAYS_KEY, JSON.stringify(birthdays));
  } catch (e) {
    console.error("Failed to save birthdays:", e);
  }
};

// Load all birthdays
export const loadBirthdays = async (): Promise<Birthday[]> => {
  try {
    const data = await AsyncStorage.getItem(BIRTHDAYS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load birthdays:", e);
    return [];
  }
};

// Add a single birthday
export const addBirthday = async (birthday: Birthday): Promise<void> => {
  const existing = await loadBirthdays();
  existing.push(birthday);
  await saveBirthdays(existing);
};

// Delete a birthday by id
export const deleteBirthday = async (id: string): Promise<void> => {
  const existing = await loadBirthdays();
  const updated = existing.filter((b) => b.id !== id);
  await saveBirthdays(updated);
};
