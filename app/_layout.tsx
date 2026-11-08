import { Exo2_400Regular, Exo2_600SemiBold } from "@expo-google-fonts/exo-2";
import { Orbitron_700Bold } from "@expo-google-fonts/orbitron";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Tabs } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import LockScreen from "../components/LockScreen";
import { RELOCK_AFTER_MS } from "../constants/config";
import { COLORS } from "../constants/theme";
import { useAutoUpdate } from "../utils/appUpdates";
import {
  bootstrapBirthdays,
  runPostUnlockTasks,
} from "../utils/birthdayService";

// React Navigation may hand back a non-string colour; icons need a plain string.
const tint = (color: unknown) =>
  typeof color === "string" ? color : COLORS.cyan;

// A slow network must never be able to hang the unlock.
const BOOTSTRAP_TIMEOUT_MS = 5000;

export default function Layout() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    Orbitron_700Bold,
    Exo2_400Regular,
    Exo2_600SemiBold,
  });

  // Downloads over-the-air updates and applies them while the lock screen is up.
  useAutoUpdate(!isUnlocked);

  // Lock again after the app has been in the background for a while.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        backgroundedAt.current = Date.now();
      } else if (state === "active" && backgroundedAt.current !== null) {
        if (Date.now() - backgroundedAt.current > RELOCK_AFTER_MS) {
          setIsUnlocked(false);
        }
        backgroundedAt.current = null;
      }
    });
    return () => subscription.remove();
  }, []);

  const handleUnlock = async () => {
    // A fresh install restores from the cloud before the screens load.
    await Promise.race([
      bootstrapBirthdays(),
      new Promise((resolve) => setTimeout(resolve, BOOTSTRAP_TIMEOUT_MS)),
    ]);
    setIsUnlocked(true);
    void runPostUnlockTasks();
  };

  // Don't spin forever if a font fails to load; fall back to system fonts.
  if (!fontsLoaded && !fontError) {
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
            <Ionicons name="chatbubble-ellipses" size={24} color={tint(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="BirthdaysScreen"
        options={{
          title: "BIRTHDAYS",
          tabBarLabel: "Birthdays",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={24} color={tint(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="StatsScreen"
        options={{
          title: "STATS",
          tabBarLabel: "Stats",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart" size={24} color={tint(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
