import { Alert, Platform } from "react-native";

/** Promise-based confirmation dialog that also works on web. */
export function confirmAsync(
  title: string,
  message: string,
  confirmLabel = "Delete",
  destructive = true,
): Promise<boolean> {
  if (Platform.OS === "web") {
    const ask = typeof window !== "undefined" ? window.confirm : undefined;
    return Promise.resolve(ask ? ask(`${title}\n\n${message}`) : true);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
