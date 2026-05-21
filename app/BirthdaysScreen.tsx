import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Birthday, deleteBirthday, loadBirthdays } from "../utils/storage";

const { width } = Dimensions.get("window");

const MONTHS = [
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
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MONTH_COLORS = [
  "#00E5FF",
  "#A855F7",
  "#22C55E",
  "#FFB703",
  "#FF4D8D",
  "#38BDF8",
  "#F97316",
  "#14F195",
  "#E879F9",
  "#F43F5E",
  "#60A5FA",
  "#FACC15",
];

// ── Helpers ──────────────────────────────────────────────────
const daysUntil = (m: number, d: number) => {
  const now = new Date();
  const next = new Date(now.getFullYear(), m - 1, d);
  if (m === now.getMonth() + 1 && d === now.getDate()) return 0;
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  return Math.ceil((next.getTime() - now.getTime()) / 86400000);
};

const isTodayFn = (m: number, d: number) => {
  const t = new Date();
  return m === t.getMonth() + 1 && d === t.getDate();
};

const getStatus = (m: number, d: number) => {
  const du = daysUntil(m, d);
  if (du === 0) return "TODAY";
  if (du === 1) return "TOMORROW";
  if (du <= 7) return `${du} DAYS LEFT`;
  return `${du} DAYS`;
};

const getDaysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();
const getFirstDayOfMonth = (month: number, year: number) =>
  new Date(year, month - 1, 1).getDay();

// Wrap SVG Circle so Animated can drive its strokeDashoffset
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── SVG ARC PROGRESS RING ─────────────────────────────────────
const ProgressRing = ({
  month,
  day,
  color,
}: {
  month: number;
  day: number;
  color: string;
}) => {
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

  const dashOffset = useRef(new Animated.Value(CIRC)).current; // starts at 0% fill
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate arc fill on mount — satisfying "closing" effect
    Animated.timing(dashOffset, {
      toValue: targetOffset,
      duration: 1000,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (today) {
      Animated.loop(
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
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 380,
            useNativeDriver: false,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.25,
            duration: 380,
            useNativeDriver: false,
          }),
        ]),
      ).start();
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else if (du <= 3) {
      Animated.loop(
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
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.15,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    } else if (du <= 7) {
      Animated.loop(
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
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.7,
            duration: 550,
            useNativeDriver: false,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.15,
            duration: 550,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    } else if (du <= 30) {
      Animated.loop(
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
      ).start();
      Animated.timing(glowOpacity, {
        toValue: 0.2,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  }, []);

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
            fontSize: 6.5,
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
};

// ── Animated Background Glows ─────────────────────────────────
const AnimatedGlow = () => {
  const glow = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.85,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.35,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "#00E5FF1A",
          top: 50,
          right: -110,
          opacity: glow,
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: "#A855F71A",
          top: 320,
          left: -80,
          opacity: glow,
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 130,
          height: 130,
          borderRadius: 65,
          backgroundColor: "#FF4D8D12",
          bottom: 100,
          right: 10,
          opacity: glow,
        }}
      />
    </>
  );
};

// ── TODAY BIRTHDAY BANNER ─────────────────────────────────────
const TodayBanner = ({ birthdays }: { birthdays: Birthday[] }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);
  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 1.2, width * 1.2],
  });
  const names = birthdays.map((b) => b.name).join(" & ");
  return (
    <Animated.View
      style={{
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 18,
        overflow: "hidden",
        opacity,
        transform: [{ scale }],
        borderWidth: 1.5,
        borderColor: "#FFD16666",
        backgroundColor: "#110D03",
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: 80,
          backgroundColor: "#ffffff",
          opacity: 0.045,
          transform: [{ translateX: shimmerX }, { skewX: "-20deg" }],
        }}
      />
      <View
        style={{
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: "#FFD16618",
            borderWidth: 1.5,
            borderColor: "#FFD16666",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 24 }}>🎂</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#FFD166",
              fontFamily: "Orbitron_700Bold",
              fontSize: 8,
              letterSpacing: 2.5,
              marginBottom: 4,
            }}
          >
            🎉 TODAY'S BIRTHDAY
          </Text>
          <Text
            style={{
              fontFamily: "Orbitron_700Bold",
              fontSize: 15,
              letterSpacing: 0.6,
              color: "#FFFAE8",
            }}
            numberOfLines={1}
          >
            {names}
          </Text>
          <Text
            style={{
              color: "#A08040",
              fontFamily: "Exo2_400Regular",
              fontSize: 11,
              marginTop: 3,
            }}
          >
            {birthdays.length === 1
              ? "Send them a wish! 🥳"
              : `${birthdays.length} people celebrate today!`}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "#FFD16618",
            borderWidth: 1,
            borderColor: "#FFD16655",
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              color: "#FFD166",
              fontFamily: "Orbitron_700Bold",
              fontSize: 10,
            }}
          >
            TODAY
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ── HEADER ────────────────────────────────────────────────────
const Header = ({
  total,
  activeMonths,
  nextBirthday,
  onCalendarOpen,
}: {
  total: number;
  activeMonths: number;
  nextBirthday?: Birthday;
  onCalendarOpen: () => void;
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-18)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const calScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.15,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(calScale, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(calScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ translateY: slide }],
        backgroundColor: "#05080F",
        borderBottomWidth: 1,
        borderBottomColor: "#141B2A",
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          height: 1.5,
          backgroundColor: "#00E5FF",
          left: sweepAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["-40%", "120%"],
          }),
          width: "30%",
          opacity: 0.45,
        }}
      />
      <View
        style={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 16 }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 5,
              }}
            >
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#00E5FF",
                }}
              />
              <Text
                style={{
                  color: "#00E5FF",
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 8,
                  letterSpacing: 3,
                }}
              >
                BIRTHDAY TRACKER
              </Text>
            </View>
            <View style={{ overflow: "hidden" }}>
              <Text
                style={{
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 22,
                  letterSpacing: 1,
                  color: "#E8EEFF",
                }}
              >
                Monthly List
              </Text>
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: 55,
                  backgroundColor: "#ffffff",
                  opacity: 0.06,
                  transform: [{ translateX: shimmerX }, { skewX: "-18deg" }],
                }}
              />
            </View>
          </View>
          <TouchableOpacity onPress={onCalendarOpen} activeOpacity={0.8}>
            <Animated.View
              style={{
                transform: [{ scale: calScale }],
                width: 50,
                height: 50,
                borderRadius: 16,
                backgroundColor: "#00E5FF14",
                borderWidth: 1.5,
                borderColor: "#00E5FF44",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 24 }}>📅</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {nextBirthday && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              marginBottom: 14,
            }}
          >
            <Animated.View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#00E5FF",
                opacity: blinkAnim,
              }}
            />
            <Text
              style={{
                color: "#6A6A88",
                fontFamily: "Exo2_400Regular",
                fontSize: 12.5,
              }}
            >
              Next:{" "}
              <Text
                style={{
                  color: "#00E5FF",
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 10,
                }}
              >
                {nextBirthday.name}
              </Text>
              {"  ·  "}
              <Text style={{ color: "#6A6A88" }}>
                {getStatus(nextBirthday.month, nextBirthday.day).toLowerCase()}
              </Text>
            </Text>
          </View>
        )}

        {total === 0 && (
          <Text
            style={{
              color: "#6A6A88",
              fontFamily: "Exo2_400Regular",
              fontSize: 13,
              lineHeight: 20,
              marginBottom: 14,
            }}
          >
            Saved birthdays appear here, grouped by month.
          </Text>
        )}

        <View style={{ flexDirection: "row", gap: 9 }}>
          {[
            { value: total, label: "Saved", color: "#00E5FF" },
            { value: activeMonths, label: "Months", color: "#A855F7" },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                borderRadius: 14,
                backgroundColor: s.color + "18",
                borderWidth: 1,
                borderColor: s.color + "55",
                paddingVertical: 11,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: s.color,
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 17,
                }}
              >
                {s.value}
              </Text>
              <Text
                style={{
                  color: "#6A6A88",
                  fontFamily: "Exo2_400Regular",
                  fontSize: 10,
                  marginTop: 3,
                }}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// ── MONTH SECTION ─────────────────────────────────────────────
const MonthSection = ({
  monthIndex,
  count,
}: {
  monthIndex: number;
  count: number;
}) => {
  const color = MONTH_COLORS[monthIndex];
  const isCurrent = monthIndex === new Date().getMonth();
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 22,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
          }}
        />
        <Text
          style={{
            color,
            fontFamily: "Orbitron_700Bold",
            fontSize: 13,
            letterSpacing: 1.7,
          }}
        >
          {MONTHS[monthIndex].toUpperCase()}
        </Text>
        {isCurrent && (
          <View
            style={{
              backgroundColor: "#00E5FF18",
              borderWidth: 1,
              borderColor: "#00E5FF55",
              borderRadius: 6,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                color: "#00E5FF",
                fontFamily: "Orbitron_700Bold",
                fontSize: 7,
                letterSpacing: 1,
              }}
            >
              NOW
            </Text>
          </View>
        )}
      </View>
      <View
        style={{
          backgroundColor: color + "22",
          borderWidth: 1,
          borderColor: color + "66",
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
      >
        <Text style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 9 }}>
          {count}
        </Text>
      </View>
    </View>
  );
};

// ── BIRTHDAY CARD ─────────────────────────────────────────────
const BirthdayCard = ({
  item,
  index,
  onDelete,
}: {
  item: Birthday;
  index: number;
  onDelete: (id: string) => void;
}) => {
  const color = MONTH_COLORS[item.month - 1];
  const today = isTodayFn(item.month, item.day);
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 320,
        delay: index * 40,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideY, {
        toValue: 0,
        duration: 320,
        delay: index * 40,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay: index * 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ translateY: slideY }, { scale }],
        marginHorizontal: 16,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          backgroundColor: "#090C15",
          borderRadius: 18,
          borderWidth: today ? 1.8 : 1.3,
          borderColor: today ? "#FFD166" : color,
          padding: 14,
          paddingLeft: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View style={{ marginRight: 8 }}>
          <ProgressRing month={item.month} day={item.day} color={color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              color: "#EEEEFF",
              fontFamily: "Exo2_400Regular",
              fontSize: 16,
              marginBottom: 4,
            }}
          >
            {item.name}
          </Text>
          <Text
            style={{
              color: "#555570",
              fontFamily: "Exo2_400Regular",
              fontSize: 12,
            }}
          >
            {MONTHS[item.month - 1]} {item.day}
          </Text>
          {item.relationship ? (
            <View
              style={{
                marginTop: 6,
                alignSelf: "flex-start",
                backgroundColor: color + "22",
                borderWidth: 1,
                borderColor: color,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  color,
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 8,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {item.relationship}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
          <View
            style={{
              backgroundColor: today ? "#FFD16622" : color + "22",
              borderWidth: 1,
              borderColor: today ? "#FFD166" : color,
              borderRadius: 999,
              paddingHorizontal: 9,
              paddingVertical: 5,
              marginBottom: 9,
            }}
          >
            <Text
              style={{
                color: today ? "#FFD166" : color,
                fontFamily: "Orbitron_700Bold",
                fontSize: 8.5,
                letterSpacing: 0.5,
              }}
            >
              {getStatus(item.month, item.day)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            activeOpacity={0.75}
            style={{
              backgroundColor: "#1A0808",
              borderWidth: 1,
              borderColor: "#FF3355",
              paddingHorizontal: 9,
              paddingVertical: 6,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: "#FF4D6D",
                fontFamily: "Orbitron_700Bold",
                fontSize: 8,
                letterSpacing: 1,
              }}
            >
              REMOVE
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ── CALENDAR MONTH GRID ───────────────────────────────────────
const CalendarMonthGrid = ({
  monthIndex,
  year,
  birthdays,
  selectedDate,
  onDatePress,
}: {
  monthIndex: number;
  year: number;
  birthdays: Birthday[];
  selectedDate: { month: number; day: number } | null;
  onDatePress: (month: number, day: number) => void;
}) => {
  const color = MONTH_COLORS[monthIndex];
  const month = monthIndex + 1;
  const totalDays = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const now = new Date();
  const isThisMonth =
    now.getMonth() + 1 === month && now.getFullYear() === year;
  const todayDate = now.getDate();
  const bdMap: Record<number, Birthday[]> = {};
  birthdays
    .filter((b) => b.month === month)
    .forEach((b) => {
      if (!bdMap[b.day]) bdMap[b.day] = [];
      bdMap[b.day].push(b);
    });
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          paddingHorizontal: 4,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
          <Text
            style={{
              color,
              fontFamily: "Orbitron_700Bold",
              fontSize: 13,
              letterSpacing: 2,
            }}
          >
            {MONTHS[monthIndex].toUpperCase()}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: color + "22",
            borderWidth: 1,
            borderColor: color + "66",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 9 }}>
            {Object.keys(bdMap).length} BIRTHDAYS
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                color: "#333350",
                fontFamily: "Orbitron_700Bold",
                fontSize: 7,
                letterSpacing: 1,
              }}
            >
              {d}
            </Text>
          </View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }).map((_, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: "row", marginBottom: 4 }}>
          {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
            if (!day) return <View key={colIdx} style={{ flex: 1 }} />;
            const hasBd = !!bdMap[day];
            const isToday = isThisMonth && day === todayDate;
            const isSel =
              selectedDate?.month === month && selectedDate?.day === day;
            return (
              <TouchableOpacity
                key={colIdx}
                onPress={() => hasBd && onDatePress(month, day)}
                activeOpacity={hasBd ? 0.7 : 1}
                style={{ flex: 1, alignItems: "center", paddingVertical: 3 }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSel
                      ? color + "33"
                      : isToday
                        ? "#ffffff14"
                        : "transparent",
                    borderWidth: isSel || isToday ? (isSel ? 1.5 : 1) : 0,
                    borderColor: isSel
                      ? color
                      : isToday
                        ? "#ffffff55"
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: isToday ? "#ffffff" : hasBd ? color : "#2E2E50",
                      fontFamily: hasBd
                        ? "Orbitron_700Bold"
                        : "Exo2_400Regular",
                      fontSize: 12,
                    }}
                  >
                    {day}
                  </Text>
                </View>
                {hasBd && (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: color,
                      marginTop: 2,
                    }}
                  />
                )}
                {hasBd && bdMap[day].length > 1 && (
                  <Text
                    style={{
                      color,
                      fontFamily: "Orbitron_700Bold",
                      fontSize: 6,
                      marginTop: 1,
                    }}
                  >
                    ×{bdMap[day].length}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// ── DATE DETAIL CARD ──────────────────────────────────────────
const DateDetailCard = ({
  month,
  day,
  birthdays,
}: {
  month: number;
  day: number;
  birthdays: Birthday[];
}) => {
  const color = MONTH_COLORS[month - 1];
  const people = birthdays.filter((b) => b.month === month && b.day === day);
  const scaleA = useRef(new Animated.Value(0.88)).current;
  const fadeA = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleA, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeA, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [month, day]);
  if (!people.length) return null;
  return (
    <Animated.View
      style={{
        marginTop: 12,
        marginHorizontal: 4,
        backgroundColor: "#07091A",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1.5,
        borderColor: color,
        opacity: fadeA,
        transform: [{ scale: scaleA }],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: color,
          }}
        />
        <Text
          style={{
            color,
            fontFamily: "Orbitron_700Bold",
            fontSize: 11,
            letterSpacing: 2,
          }}
        >
          {MONTHS[month - 1].toUpperCase()} {day}
        </Text>
        <View
          style={{
            marginLeft: "auto",
            backgroundColor: color + "22",
            borderWidth: 1,
            borderColor: color,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 9 }}>
            IN {daysUntil(month, day)} DAYS
          </Text>
        </View>
      </View>
      {people.map((person, i) => (
        <View
          key={person.id}
          style={{
            paddingVertical: 10,
            borderTopWidth: i > 0 ? 1 : 0,
            borderTopColor: color + "28",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: color + "22",
              borderWidth: 1.5,
              borderColor: color,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 14 }}
            >
              {person.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#EEEEFF",
                fontFamily: "Exo2_400Regular",
                fontSize: 15,
                marginBottom: 3,
              }}
            >
              {person.name}
            </Text>
            {person.relationship ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: color + "22",
                  borderWidth: 1,
                  borderColor: color,
                  borderRadius: 5,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color,
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 8,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {person.relationship}
                </Text>
              </View>
            ) : (
              <Text
                style={{
                  color: "#333350",
                  fontFamily: "Exo2_400Regular",
                  fontSize: 11,
                }}
              >
                No relationship set
              </Text>
            )}
          </View>
          <View style={{ alignItems: "center" }}>
            <Text
              style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 20 }}
            >
              {daysUntil(month, day)}
            </Text>
            <Text
              style={{
                color: "#333350",
                fontFamily: "Orbitron_700Bold",
                fontSize: 7,
                letterSpacing: 1,
              }}
            >
              DAYS
            </Text>
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

// ── UPCOMING STRIP ────────────────────────────────────────────
const UpcomingStrip = ({ birthdays }: { birthdays: Birthday[] }) => {
  const upcoming = [...birthdays]
    .filter((b) => {
      const du = daysUntil(b.month, b.day);
      return du > 0 && du <= 30;
    })
    .sort((a, b) => daysUntil(a.month, a.day) - daysUntil(b.month, b.day))
    .slice(0, 5);
  if (!upcoming.length) return null;
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 18,
        backgroundColor: "#0A0D18",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#1A2035",
      }}
    >
      <Text
        style={{
          color: "#A855F7",
          fontFamily: "Orbitron_700Bold",
          fontSize: 9,
          letterSpacing: 2,
          marginBottom: 12,
        }}
      >
        🔔 COMING UP — NEXT 30 DAYS
      </Text>
      {upcoming.map((b, i) => {
        const color = MONTH_COLORS[b.month - 1];
        return (
          <View
            key={b.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
              borderTopWidth: i > 0 ? 1 : 0,
              borderTopColor: "#12162A",
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: color + "22",
                borderWidth: 1,
                borderColor: color,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text
                style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 13 }}
              >
                {b.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#DDDDF0",
                  fontFamily: "Exo2_400Regular",
                  fontSize: 14,
                }}
              >
                {b.name}
              </Text>
              <Text
                style={{
                  color: "#444460",
                  fontFamily: "Exo2_400Regular",
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {MONTHS[b.month - 1]} {b.day}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: color + "22",
                borderWidth: 1,
                borderColor: color,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 9 }}
              >
                {daysUntil(b.month, b.day)}d
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ── MONTH DOT NAVIGATOR ───────────────────────────────────────
const MonthDotNav = ({
  current,
  birthdays,
  onSelect,
}: {
  current: number;
  birthdays: Birthday[];
  onSelect: (idx: number) => void;
}) => {
  const hasBd = (idx: number) => birthdays.some((b) => b.month === idx + 1);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 4,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
      }}
    >
      {MONTHS.map((m, idx) => {
        const active = current === idx;
        const hasBday = hasBd(idx);
        const color = MONTH_COLORS[idx];
        return (
          <TouchableOpacity
            key={idx}
            onPress={() => onSelect(idx)}
            activeOpacity={0.75}
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: active ? color + "22" : "transparent",
              borderWidth: active ? 1.2 : 0,
              borderColor: color,
            }}
          >
            <Text
              style={{
                color: active ? color : hasBday ? color + "99" : "#1E1E38",
                fontFamily: "Orbitron_700Bold",
                fontSize: 8,
                letterSpacing: 1,
              }}
            >
              {m.slice(0, 3).toUpperCase()}
            </Text>
            {hasBday && (
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: active ? color : color + "66",
                  marginTop: 3,
                }}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// ── CALENDAR STATS ROW ────────────────────────────────────────
const CalendarStatsRow = ({ birthdays }: { birthdays: Birthday[] }) => {
  const totalDates = new Set(birthdays.map((b) => `${b.month}-${b.day}`)).size;
  const thisMonth = new Date().getMonth() + 1;
  const thisMonthBd = birthdays.filter((b) => b.month === thisMonth).length;
  const nextDu = birthdays.length
    ? Math.min(...birthdays.map((b) => daysUntil(b.month, b.day)))
    : null;
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
      {[
        { value: birthdays.length, label: "TOTAL", color: "#00E5FF" },
        { value: totalDates, label: "DATES", color: "#A855F7" },
        { value: thisMonthBd, label: "THIS MON", color: "#FF4D8D" },
        { value: nextDu ?? "—", label: "NEXT (D)", color: "#FFB703" },
      ].map((s) => (
        <View
          key={s.label}
          style={{
            flex: 1,
            backgroundColor: s.color + "18",
            borderWidth: 1,
            borderColor: s.color + "55",
            borderRadius: 12,
            paddingVertical: 8,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: s.color,
              fontFamily: "Orbitron_700Bold",
              fontSize: 14,
            }}
          >
            {s.value}
          </Text>
          <Text
            style={{
              color: "#333350",
              fontFamily: "Exo2_400Regular",
              fontSize: 7.5,
              letterSpacing: 0.8,
              marginTop: 2,
            }}
          >
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

// ── FULL CALENDAR MODAL ───────────────────────────────────────
const CalendarModal = ({
  visible,
  onClose,
  birthdays,
}: {
  visible: boolean;
  onClose: () => void;
  birthdays: Birthday[];
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const [viewMode, setViewMode] = useState<"current" | "all">("current");
  const [currentMonthIdx, setCurrentMonthIdx] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<{
    month: number;
    day: number;
  } | null>(null);
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setSelectedDate(null);
      setCurrentMonthIdx(currentMonth);
      setViewMode("current");
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 14,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 80,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      contentFade.setValue(1);
    }
  }, [visible]);

  const switchTab = (mode: "current" | "all") => {
    if (mode === viewMode) return;
    Animated.timing(contentFade, {
      toValue: 0,
      duration: 90,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setViewMode(mode);
      setSelectedDate(null);
      requestAnimationFrame(() => {
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    });
  };

  const changeMonth = (newIdx: number) => {
    if (newIdx === currentMonthIdx) return;
    setSelectedDate(null);
    Animated.timing(contentFade, {
      toValue: 0,
      duration: 80,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setCurrentMonthIdx(newIdx);
      requestAnimationFrame(() => {
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    });
  };

  const handleDatePress = (month: number, day: number) => {
    if (selectedDate?.month === month && selectedDate?.day === day)
      setSelectedDate(null);
    else setSelectedDate({ month, day });
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={{ flex: 1, backgroundColor: "#000000EE", opacity: fadeAnim }}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "#03040E",
            marginTop: 44,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            borderTopWidth: 1.5,
            borderColor: "#00E5FF44",
            transform: [{ translateY: slideAnim }],
            overflow: "hidden",
          }}
        >
          <View
            style={{
              backgroundColor: "#04060F",
              borderBottomWidth: 1,
              borderBottomColor: "#0F1525",
              paddingTop: 16,
              paddingBottom: 12,
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <View>
                <Text
                  style={{
                    color: "#00E5FF",
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 9,
                    letterSpacing: 2.5,
                    marginBottom: 4,
                  }}
                >
                  BIRTHDAY CALENDAR
                </Text>
                <Text
                  style={{
                    color: "#EEEEFF",
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 18,
                  }}
                >
                  {currentYear}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  backgroundColor: "#1A0508",
                  borderWidth: 1,
                  borderColor: "#FF3355",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                }}
              >
                <Text
                  style={{
                    color: "#FF4D6D",
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 10,
                    letterSpacing: 1,
                  }}
                >
                  CLOSE
                </Text>
              </TouchableOpacity>
            </View>
            <CalendarStatsRow birthdays={birthdays} />
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                backgroundColor: "#080B16",
                borderRadius: 13,
                padding: 4,
                marginTop: 4,
              }}
            >
              {[
                { mode: "current" as const, label: "📆  THIS MONTH" },
                { mode: "all" as const, label: "🗓️  ALL MONTHS" },
              ].map((btn) => (
                <TouchableOpacity
                  key={btn.mode}
                  onPress={() => switchTab(btn.mode)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderRadius: 11,
                    backgroundColor:
                      viewMode === btn.mode ? "#00E5FF1E" : "transparent",
                    borderWidth: viewMode === btn.mode ? 1.2 : 0,
                    borderColor: "#00E5FF",
                  }}
                >
                  <Text
                    style={{
                      color: viewMode === btn.mode ? "#00E5FF" : "#333355",
                      fontFamily: "Orbitron_700Bold",
                      fontSize: 9,
                      letterSpacing: 1,
                    }}
                  >
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Animated.View style={{ flex: 1, opacity: contentFade }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
            >
              <UpcomingStrip birthdays={birthdays} />
              {viewMode === "current" ? (
                <View key={`month-${currentMonthIdx}`}>
                  <MonthDotNav
                    current={currentMonthIdx}
                    birthdays={birthdays}
                    onSelect={(idx) => changeMonth(idx)}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginVertical: 14,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        changeMonth(
                          currentMonthIdx === 0 ? 11 : currentMonthIdx - 1,
                        )
                      }
                      style={{
                        backgroundColor: "#00E5FF18",
                        borderWidth: 1,
                        borderColor: "#00E5FF",
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                      }}
                    >
                      <Text
                        style={{
                          color: "#00E5FF",
                          fontFamily: "Orbitron_700Bold",
                          fontSize: 14,
                        }}
                      >
                        ◀
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={{
                        color: "#DDDDF0",
                        fontFamily: "Orbitron_700Bold",
                        fontSize: 15,
                        letterSpacing: 2,
                      }}
                    >
                      {MONTHS[currentMonthIdx].toUpperCase()}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        changeMonth(
                          currentMonthIdx === 11 ? 0 : currentMonthIdx + 1,
                        )
                      }
                      style={{
                        backgroundColor: "#00E5FF18",
                        borderWidth: 1,
                        borderColor: "#00E5FF",
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                      }}
                    >
                      <Text
                        style={{
                          color: "#00E5FF",
                          fontFamily: "Orbitron_700Bold",
                          fontSize: 14,
                        }}
                      >
                        ▶
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <CalendarMonthGrid
                    monthIndex={currentMonthIdx}
                    year={currentYear}
                    birthdays={birthdays}
                    selectedDate={selectedDate}
                    onDatePress={handleDatePress}
                  />
                  {selectedDate &&
                    selectedDate.month === currentMonthIdx + 1 && (
                      <DateDetailCard
                        month={selectedDate.month}
                        day={selectedDate.day}
                        birthdays={birthdays}
                      />
                    )}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 18,
                      marginTop: 18,
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: MONTH_COLORS[currentMonthIdx],
                        }}
                      />
                      <Text
                        style={{
                          color: "#333355",
                          fontFamily: "Exo2_400Regular",
                          fontSize: 11,
                        }}
                      >
                        Birthday
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 1,
                          borderColor: "#ffffff55",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#ffffff",
                            fontFamily: "Exo2_400Regular",
                            fontSize: 9,
                          }}
                        >
                          1
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: "#333355",
                          fontFamily: "Exo2_400Regular",
                          fontSize: 11,
                        }}
                      >
                        Today
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View key="all-months">
                  {MONTHS.map((_, monthIdx) => (
                    <View key={monthIdx}>
                      <CalendarMonthGrid
                        monthIndex={monthIdx}
                        year={currentYear}
                        birthdays={birthdays}
                        selectedDate={selectedDate}
                        onDatePress={handleDatePress}
                      />
                      {selectedDate && selectedDate.month === monthIdx + 1 && (
                        <DateDetailCard
                          month={selectedDate.month}
                          day={selectedDate.day}
                          birthdays={birthdays}
                        />
                      )}
                      {monthIdx < 11 && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: "#0F1525",
                            marginBottom: 22,
                          }}
                        />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────
export default function BirthdaysScreen() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const fetchBirthdays = async () => {
    const s = await loadBirthdays();
    setBirthdays(s);
  };

  useFocusEffect(
    useCallback(() => {
      fetchBirthdays();
    }, []),
  );

  const handleDelete = async (id: string) => {
    console.log("BirthdaysScreen deleting:", id);
    await deleteBirthday(id);
    await fetchBirthdays();
    try {
      const { cancelBirthdayNotifications } =
        await import("../utils/notifications");
      await cancelBirthdayNotifications(id);
    } catch (e) {
      console.error(e);
    }
    try {
      const { deleteBirthdayFromCloud } = await import("../utils/cloudStorage");
      await deleteBirthdayFromCloud(id);
      console.log("Deleted from cloud:", id);
    } catch (e) {
      console.error(e);
    }
  };

  const todayBirthdays = birthdays.filter((b) => isTodayFn(b.month, b.day));
  const sortedBirthdays = [...birthdays].sort((a, b) =>
    a.month !== b.month ? a.month - b.month : a.day - b.day,
  );
  const groupedByMonth = MONTHS.map((_, index) =>
    sortedBirthdays.filter((b) => b.month === index + 1),
  );
  const activeMonths = new Set(birthdays.map((b) => b.month)).size;
  const nextBirthday = [...birthdays].sort(
    (a, b) => daysUntil(a.month, a.day) - daysUntil(b.month, b.day),
  )[0];

  const listData: any[] = [];
  groupedByMonth.forEach((group, monthIndex) => {
    if (group.length > 0) {
      listData.push({
        type: "month",
        id: `month-${monthIndex + 1}`,
        monthIndex,
        count: group.length,
      });
      group.forEach((birthday, index) => {
        listData.push({ ...birthday, type: "card", animationIndex: index });
      });
    }
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#03040E" }}>
      <AnimatedGlow />
      <Header
        total={birthdays.length}
        activeMonths={activeMonths}
        nextBirthday={nextBirthday}
        onCalendarOpen={() => setCalendarVisible(true)}
      />
      {todayBirthdays.length > 0 && <TodayBanner birthdays={todayBirthdays} />}
      {birthdays.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 90,
              height: 90,
              borderRadius: 26,
              backgroundColor: "#00E5FF12",
              borderWidth: 1.5,
              borderColor: "#00E5FF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 40 }}>🎂</Text>
          </View>
          <Text
            style={{
              color: "#DDDDF0",
              fontFamily: "Orbitron_700Bold",
              fontSize: 13,
              letterSpacing: 2,
              textAlign: "center",
            }}
          >
            NO BIRTHDAYS YET
          </Text>
          <Text
            style={{
              color: "#6A6A88",
              fontFamily: "Exo2_400Regular",
              fontSize: 13.5,
              marginTop: 12,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Add birthdays from Buddy chat and they'll appear here, sorted month
            by month.
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: 36 }}
          renderItem={({ item }) =>
            item.type === "month" ? (
              <MonthSection monthIndex={item.monthIndex} count={item.count} />
            ) : (
              <BirthdayCard
                item={item}
                index={item.animationIndex}
                onDelete={handleDelete}
              />
            )
          }
        />
      )}
      <CalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        birthdays={birthdays}
      />
    </View>
  );
}
