import { useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  MONTHS_FULL as MONTHS,
  daysUntil,
  isToday as isTodayFn,
} from "../utils/dates";
import { useAnimations } from "../utils/animation";

// Wrap SVG Circle so Animated can drive its strokeDashoffset
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── SVG ARC PROGRESS RING ─────────────────────────────────────
export default function ProgressRing({
  month,
  day,
  color,
}: {
  month: number;
  day: number;
  color: string;
}) {
  const du = daysUntil(month, day);
  const today = isTodayFn(month, day);

  // Map days → fill fraction (how much of the circle is drawn)
  let fillFraction: number;
  if (du === 0) fillFraction = 1.0;
  else if (du === 1) fillFraction = 0.97;
  else if (du <= 3) fillFraction = 0.93 - (du - 1) * 0.02;
  else if (du <= 7) fillFraction = 0.89 - (du - 3) * 0.02;
  else if (du <= 30) fillFraction = 0.81 - (du - 7) * 0.01;
  else if (du <= 90) fillFraction = 0.58 - (du - 30) * 0.004;
  else if (du <= 180) fillFraction = 0.34 - (du - 90) * 0.002;
  else fillFraction = Math.max(0.06, 0.16 - (du - 180) * 0.0005);

  const SIZE = 70;
  const STROKE = 4;
  const R = (SIZE - STROKE * 2) / 2;
  const CIRC = 2 * Math.PI * R;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // strokeDashoffset = CIRC means 0% drawn, 0 means 100% drawn
  const targetOffset = CIRC * (1 - fillFraction);

  const [dashOffset] = useState(() => new Animated.Value(CIRC)); // starts at 0% fill
  const [glowOpacity] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [rotateAnim] = useState(() => new Animated.Value(0));

  useAnimations((run) => {
    // Animate arc fill on mount — satisfying "closing" effect
    run(Animated.timing(dashOffset, {
      toValue: targetOffset,
      duration: 1000,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // strokeDashoffset cannot use the native driver
    }));

    if (today) {
      run(Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.14,
            duration: 520,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.94,
            duration: 520,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ));
      run(Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.25,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      ));
      run(Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ));
    } else if (du <= 3) {
      run(Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.09,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.97,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ));
      run(Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.15,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ));
    } else if (du <= 7) {
      run(Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.06,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ));
      run(Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.7,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.15,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
      ));
    } else if (du <= 30) {
      run(Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.03,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ));
      run(Animated.timing(glowOpacity, {
        toValue: 0.2,
        duration: 600,
        useNativeDriver: true,
      }));
    }
  }, [targetOffset, du, today]);

  const ringColor = today ? "#FFD166" : color;
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        width: SIZE + 10,
        height: SIZE + 10,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale: scaleAnim }],
      }}
    >
      {/* Outer animated glow rings — SVG based so they show on dark bg */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: SIZE + 10,
          height: SIZE + 10,
          opacity: glowOpacity,
        }}
      >
        <Svg width={SIZE + 10} height={SIZE + 10}>
          <Circle
            cx={(SIZE + 10) / 2}
            cy={(SIZE + 10) / 2}
            r={R + STROKE + 4}
            stroke={ringColor}
            strokeWidth={8}
            strokeOpacity={0.12}
            fill="none"
          />
          <Circle
            cx={(SIZE + 10) / 2}
            cy={(SIZE + 10) / 2}
            r={R + STROKE + 2}
            stroke={ringColor}
            strokeWidth={5}
            strokeOpacity={0.25}
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* The main arc ring — rotated so today spins, else starts from top */}
      <Animated.View
        style={{
          position: "absolute",
          transform: today ? [{ rotate: spin }] : [{ rotate: "-90deg" }],
        }}
      >
        <Svg width={SIZE} height={SIZE}>
          {/* Track ring — dim background */}
          <Circle
            cx={cx}
            cy={cy}
            r={R}
            stroke={today ? "#3D2E00" : "#1C1C2E"}
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Glow layer behind the arc (thicker, semi-transparent) */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={R}
            stroke={ringColor}
            strokeWidth={STROKE + 4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={dashOffset}
            strokeOpacity={0.25}
          />
          {/* Main bright arc */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={R}
            stroke={ringColor}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={dashOffset}
            strokeOpacity={1}
          />
          {/* Inner bright highlight (thin) */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={R}
            stroke="#FFFFFF"
            strokeWidth={1}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={dashOffset}
            strokeOpacity={0.3}
          />
        </Svg>
      </Animated.View>

      {/* Inner badge */}
      <View
        style={{
          width: SIZE - 16,
          height: SIZE - 16,
          borderRadius: 13,
          backgroundColor: today ? "#2A1E0010" : color + "14",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: today ? "#FFD16640" : color + "30",
        }}
      >
        <Text
          style={{
            color: ringColor,
            fontFamily: "Orbitron_700Bold",
            fontSize: 16,
            lineHeight: 18,
          }}
        >
          {String(day).padStart(2, "0")}
        </Text>
        <Text
          style={{
            color: ringColor,
            fontFamily: "Orbitron_700Bold",
            fontSize: 10,
            letterSpacing: 1,
            marginTop: 1,
            opacity: 0.8,
          }}
        >
          {MONTHS[month - 1].slice(0, 3).toUpperCase()}
        </Text>
      </View>

      {/* Today indicator badge */}
      {today && (
        <View
          style={{
            position: "absolute",
            top: -1,
            right: -1,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#FFD166",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: "#03040E",
          }}
        >
          <Text style={{ fontSize: 10 }}>🎂</Text>
        </View>
      )}
    </Animated.View>
  );
}
