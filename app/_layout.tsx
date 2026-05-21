import { Exo2_400Regular, Exo2_600SemiBold } from "@expo-google-fonts/exo-2";
import { Orbitron_700Bold } from "@expo-google-fonts/orbitron";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Tabs } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { COLORS } from "../constants/theme";
import {
  checkAndSendBirthdayEmails,
  scheduleAllBirthdayNotifications,
} from "../utils/notifications";
import { loadBirthdays } from "../utils/storage";
import LockScreen from "./LockScreen";

export default function Layout() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Exo2_400Regular,
    Exo2_600SemiBold,
  });

  const handleUnlock = async () => {
    setIsUnlocked(true);
    try {
      const birthdays = await loadBirthdays();
      if (birthdays.length > 0) {
        // Schedule push notifications
        await scheduleAllBirthdayNotifications(birthdays);

        // Check if any birthdays are today or tomorrow and send emails
        await checkAndSendBirthdayEmails(birthdays);
      }
    } catch (e) {
      console.error("Failed on unlock:", e);
    }
  };

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.bgDeep,
        }}
      >
        <ActivityIndicator color={COLORS.cyan} size="large" />
      </View>
    );
  }

  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.bgSurface,
          borderTopColor: COLORS.cyan,
          borderTopWidth: 1,
        },
        headerStyle: { backgroundColor: COLORS.bgSurface },
        headerTintColor: COLORS.cyan,
        headerTitleStyle: {
          fontFamily: "Orbitron_700Bold",
          fontSize: 14,
          letterSpacing: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "BIRTHDAY BUDDY",
          tabBarLabel: "Chat",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble-ellipses" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="BirthdaysScreen"
        options={{
          title: "BIRTHDAYS",
          tabBarLabel: "Birthdays",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="StatsScreen"
        options={{
          title: "STATS",
          tabBarLabel: "Stats",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="LockScreen" options={{ href: null }} />
    </Tabs>
  );
}
