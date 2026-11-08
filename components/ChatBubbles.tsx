import { useState } from "react";
import { Animated, Text, View } from "react-native";
import { COLORS } from "../constants/theme";
import { useAnimations } from "../utils/animation";

export interface ChatMessage {
  id: string;
  content: string;
  isFromUser: boolean;
}

// ── Message Bubble ─────────────────────────────────────────
export const MessageBubble = ({ item }: { item: ChatMessage }) => {
  const [fade] = useState(() => new Animated.Value(0));
  const [slide] = useState(() => new Animated.Value(item.isFromUser ? 16 : -16));
  const [scale] = useState(() => new Animated.Value(0.97));

  useAnimations((run) => {
    run(Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]));
  }, []);

  return (
    <Animated.View
      style={{
        marginVertical: 6,
        marginHorizontal: 12,
        alignItems: item.isFromUser ? "flex-end" : "flex-start",
        opacity: fade,
        transform: [{ translateX: slide }, { scale }],
      }}
    >
      <Text
        style={{
          fontSize: 10,
          letterSpacing: 1,
          marginBottom: 3,
          fontFamily: "Orbitron_700Bold",
          color: item.isFromUser ? COLORS.purple : COLORS.cyan,
        }}
      >
        {item.isFromUser ? "YOU" : "BUDDY"}
      </Text>
      <View
        style={{
          backgroundColor: item.isFromUser ? "#0e0018" : "#000b14",
          borderWidth: 1.5,
          borderColor: item.isFromUser ? COLORS.purple : COLORS.cyan,
          borderRadius: 15,
          padding: 12,
          maxWidth: "82%",
          shadowColor: item.isFromUser ? "#9b2cff" : "#00e5ff",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.18,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <Text
          style={{
            color: COLORS.textPrimary,
            fontSize: 13,
            lineHeight: 21,
            fontFamily: "Exo2_400Regular",
            textAlign: item.isFromUser ? "right" : "left",
          }}
        >
          {item.content}
        </Text>
      </View>
    </Animated.View>
  );
};

// ── Typing Bubble ──────────────────────────────────────────
export const TypingBubble = () => {
  const [dots] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  useAnimations((run) => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: -6,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.delay(420),
        ]),
      ),
    );
    animations.forEach(run);
  });

  return (
    <View style={{ marginHorizontal: 12, marginVertical: 6 }}>
      <Text
        style={{
          fontSize: 10,
          letterSpacing: 1,
          marginBottom: 3,
          fontFamily: "Orbitron_700Bold",
          color: COLORS.cyan,
        }}
      >
        BUDDY
      </Text>
      <View
        style={{
          backgroundColor: "#000b14",
          borderWidth: 1.5,
          borderColor: COLORS.cyan,
          borderRadius: 13,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          gap: 6,
          alignSelf: "flex-start",
        }}
      >
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: COLORS.cyan,
              transform: [{ translateY: dot }],
            }}
          />
        ))}
      </View>
    </View>
  );
};

