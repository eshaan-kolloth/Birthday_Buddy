import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Circle, Line, Polygon } from "react-native-svg";
import { COLORS } from "../constants/theme";

export default function AIOrb() {
  const corePulse = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const hexPulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Core dot pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, {
          toValue: 1.35,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(corePulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Glow breathe
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.75,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Ring spin
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Hex breathe
    Animated.loop(
      Animated.sequence([
        Animated.timing(hexPulse, {
          toValue: 1,
          duration: 1250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(hexPulse, {
          toValue: 0.6,
          duration: 1250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const ringRotateDeg = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: COLORS.bgDeep,
        borderWidth: 2,
        borderColor: COLORS.cyan,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Glow Background */}
      <Animated.View
        style={{
          position: "absolute",
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: COLORS.cyanGlow,
          opacity: glowOpacity,
        }}
      />

      {/* Spinning Ring */}
      <Animated.View
        style={{
          position: "absolute",
          width: 30,
          height: 30,
          transform: [{ rotate: ringRotateDeg }],
        }}
      >
        <Svg width={30} height={30} viewBox="0 0 30 30">
          <Circle
            cx="15"
            cy="15"
            r="13"
            stroke={COLORS.cyan}
            strokeWidth="1"
            strokeDasharray="3 4"
            fill="none"
            opacity={0.6}
          />
        </Svg>
      </Animated.View>

      {/* Hex Pattern */}
      <Animated.View
        style={{
          position: "absolute",
          opacity: hexPulse,
        }}
      >
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Polygon
            points="10,2 17,6 17,14 10,18 3,14 3,6"
            stroke={COLORS.cyan}
            strokeWidth="0.8"
            fill="none"
            opacity={0.5}
          />
          <Line
            x1="10"
            y1="2"
            x2="10"
            y2="18"
            stroke={COLORS.cyan}
            strokeWidth="0.4"
            opacity={0.3}
          />
          <Line
            x1="3"
            y1="6"
            x2="17"
            y2="14"
            stroke={COLORS.cyan}
            strokeWidth="0.4"
            opacity={0.3}
          />
          <Line
            x1="3"
            y1="14"
            x2="17"
            y2="6"
            stroke={COLORS.cyan}
            strokeWidth="0.4"
            opacity={0.3}
          />
        </Svg>
      </Animated.View>

      {/* Core Glowing Dot */}
      <Animated.View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: COLORS.cyan,
          shadowColor: COLORS.cyan,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 6,
          transform: [{ scale: corePulse }],
        }}
      />
    </View>
  );
}
