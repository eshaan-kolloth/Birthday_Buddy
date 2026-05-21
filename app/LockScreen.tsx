import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Line, Polygon } from "react-native-svg";
import { COLORS } from "../constants/theme";

const { width, height } = Dimensions.get("window");

const SYSTEM_LOGS = [
  "INITIALIZING NEURAL CORE...",
  "LOADING AI MATRIX v4.2.1...",
  "QUANTUM ENCRYPTION: ACTIVE",
  "BIOMETRIC MODULE: READY",
  "NEURAL NETWORK: SYNCHRONIZED",
  "DEEP SCAN PROTOCOL: ARMED",
  "MEMORY VAULT: SECURED",
  "AI ASSISTANT: ONLINE",
  "AWAITING IDENTITY SCAN...",
  "ALL SYSTEMS NOMINAL...",
];

const HEX_CHARS = "0123456789ABCDEF";
const randomHex = () =>
  "0x" +
  Array.from(
    { length: 4 },
    () => HEX_CHARS[Math.floor(Math.random() * 16)],
  ).join("");

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  angle: (i / 14) * 360,
  radius: 108 + (i % 3) * 22,
  size: i % 3 === 0 ? 7 : i % 3 === 1 ? 4 : 3,
  speed: 3000 + i * 500,
  color: i % 3 === 0 ? COLORS.cyan : i % 3 === 1 ? COLORS.purple : "#ff6600",
}));

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [status, setStatus] = useState<
    "idle" | "scanning" | "granted" | "denied"
  >("idle");
  const [showPopup, setShowPopup] = useState(false);
  const [currentLog, setCurrentLog] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const [hexCodes, setHexCodes] = useState([
    "0xA4F2",
    "0xB91C",
    "0xFF03",
    "0x7E2A",
  ]);
  const [signalBars, setSignalBars] = useState([1, 1, 1, 1, 1]);
  const [matrixChars, setMatrixChars] = useState<string[]>([]);
  const [dataStream, setDataStream] = useState<string[]>([]);

  // Core anims
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-40)).current;
  const btnScale = useRef(new Animated.Value(0)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const ring3Anim = useRef(new Animated.Value(0)).current;
  const coreScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const hexAnim = useRef(new Animated.Value(0.5)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const logAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const hexFade = useRef(new Animated.Value(1)).current;
  const signalAnim = useRef(new Animated.Value(0)).current;
  const dataAnim = useRef(new Animated.Value(1)).current;

  // Ripple — using scale instead of width/height to avoid the error
  const ripple1Scale = useRef(new Animated.Value(0.5)).current;
  const ripple1Opacity = useRef(new Animated.Value(0)).current;
  const ripple2Scale = useRef(new Animated.Value(0.5)).current;
  const ripple2Opacity = useRef(new Animated.Value(0)).current;
  const ripple3Scale = useRef(new Animated.Value(0.5)).current;
  const ripple3Opacity = useRef(new Animated.Value(0)).current;

  // Particle anims
  const particleAnims = useRef(
    PARTICLES.map(() => new Animated.Value(0)),
  ).current;

  // Popup anims
  const popupScale = useRef(new Animated.Value(0)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const popupGlow = useRef(new Animated.Value(0)).current;

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Log cycle
  useEffect(() => {
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(logAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(logAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentLog((p) => (p + 1) % SYSTEM_LOGS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // Hex codes flicker
  useEffect(() => {
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(hexFade, {
          toValue: 0.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(hexFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setHexCodes([randomHex(), randomHex(), randomHex(), randomHex()]);
    }, 700);
    return () => clearInterval(id);
  }, []);

  // Signal bars animate
  useEffect(() => {
    const id = setInterval(() => {
      setSignalBars((prev) => prev.map(() => (Math.random() > 0.3 ? 1 : 0.3)));
    }, 800);
    return () => clearInterval(id);
  }, []);

  // Data stream
  useEffect(() => {
    const chars = "01∑∆Ω∏√∞≈≠αβγδεζη";
    const gen = () =>
      Array.from({ length: 6 }, () =>
        Array.from(
          { length: 6 },
          () => chars[Math.floor(Math.random() * chars.length)],
        ).join(" "),
      );
    setDataStream(gen());
    const id = setInterval(() => {
      Animated.sequence([
        Animated.timing(dataAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dataAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setDataStream(gen());
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Matrix chars
  useEffect(() => {
    const chars = "01アイウエオカキクケコ∑∆Ω∏√∞≈≠";
    const gen = () =>
      Array.from(
        { length: 40 },
        () => chars[Math.floor(Math.random() * chars.length)],
      );
    setMatrixChars(gen());
    const id = setInterval(() => setMatrixChars(gen()), 600);
    return () => clearInterval(id);
  }, []);

  // Ripple helper using scale
  const makeRipple = (
    scaleAnim: Animated.Value,
    opacityAnim: Animated.Value,
    delay: number,
  ) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 2.2,
            duration: 2800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(titleSlide, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(btnScale, {
        toValue: 1,
        friction: 5,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Rings
    Animated.loop(
      Animated.timing(ring1Anim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.timing(ring2Anim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.timing(ring3Anim, {
        toValue: 1,
        duration: 13000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Core pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(coreScale, {
          toValue: 1.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coreScale, {
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
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.2,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Hex breathe
    Animated.loop(
      Animated.sequence([
        Animated.timing(hexAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(hexAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Blink
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Signal anim
    Animated.loop(
      Animated.sequence([
        Animated.timing(signalAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(signalAnim, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Ripples — fixed with scale
    makeRipple(ripple1Scale, ripple1Opacity, 0).start();
    makeRipple(ripple2Scale, ripple2Opacity, 900).start();
    makeRipple(ripple3Scale, ripple3Opacity, 1800).start();

    // Particles
    PARTICLES.forEach((p, i) => {
      Animated.loop(
        Animated.timing(particleAnims[i], {
          toValue: 1,
          duration: p.speed,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    });
  }, []);

  const showAccessGranted = () => {
    setShowPopup(true);
    Animated.parallel([
      Animated.spring(popupScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(popupOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(checkAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(popupGlow, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(popupGlow, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(popupOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(popupScale, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowPopup(false);
        onUnlock();
      });
    }, 3800);
  };

  const handleAuthenticate = async () => {
    setStatus("scanning");
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Enter your passcode to access BirthdayBuddy",
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
      ...(hasHardware && isEnrolled
        ? {
            authenticationType: [
              LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
            ],
          }
        : {}),
    });

    if (result.success) {
      setStatus("granted");
      showAccessGranted();
    } else {
      setStatus("denied");
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 15,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -15,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 12,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -12,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 8,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -8,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]).start(() => setTimeout(() => setStatus("idle"), 2000));
    }
  };

  const ring1Deg = ring1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const ring2Deg = ring2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });
  const ring3Deg = ring3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getColor = () => {
    if (status === "granted") return COLORS.green;
    if (status === "denied") return COLORS.red;
    if (status === "scanning") return "#ff6600";
    return COLORS.cyan;
  };
  const color = getColor();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#020208",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* ── GRID ── */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.07,
        }}
      >
        <Svg width={width} height={height}>
          {Array.from({ length: 30 }).map((_, i) => (
            <Line
              key={`v${i}`}
              x1={i * (width / 30)}
              y1={0}
              x2={i * (width / 30)}
              y2={height}
              stroke={COLORS.cyan}
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 60 }).map((_, i) => (
            <Line
              key={`h${i}`}
              x1={0}
              y1={i * (height / 60)}
              x2={width}
              y2={i * (height / 60)}
              stroke={COLORS.cyan}
              strokeWidth="0.5"
            />
          ))}
        </Svg>
      </View>

      {/* ── MATRIX RAIN ── */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: "row",
          flexWrap: "wrap",
          opacity: 0.03,
        }}
      >
        {matrixChars.map((char, i) => (
          <Text
            key={i}
            style={{
              color: COLORS.cyan,
              fontFamily: "Exo2_400Regular",
              fontSize: 9,
              width: width / 10,
              textAlign: "center",
              marginVertical: 3,
            }}
          >
            {char}
          </Text>
        ))}
      </View>

      {/* ── CORNER BRACKETS ── */}
      {[
        { top: 52, left: 20 },
        { top: 52, right: 20 },
        { bottom: 52, left: 20 },
        { bottom: 52, right: 20 },
      ].map((pos, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            ...pos,
            width: 36,
            height: 36,
            borderTopWidth: i < 2 ? 2 : 0,
            borderBottomWidth: i >= 2 ? 2 : 0,
            borderLeftWidth: i % 2 === 0 ? 2 : 0,
            borderRightWidth: i % 2 === 1 ? 2 : 0,
            borderColor: COLORS.cyan,
            opacity: glowOpacity,
          }}
        />
      ))}

      {/* ── TOP SECTION ── */}
      <Animated.View
        style={{
          position: "absolute",
          top: 68,
          alignItems: "center",
          opacity: fadeAnim,
          transform: [{ translateY: titleSlide }],
        }}
      >
        {/* AI online badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: COLORS.green,
              opacity: blinkAnim,
            }}
          />
          <Text
            style={{
              color: COLORS.green,
              fontFamily: "Orbitron_700Bold",
              fontSize: 9,
              letterSpacing: 3,
            }}
          >
            AI SYSTEM ONLINE
          </Text>
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: COLORS.green,
              opacity: blinkAnim,
            }}
          />
        </View>

        {/* Title */}
        <Text
          style={{
            color: COLORS.cyan,
            fontFamily: "Orbitron_700Bold",
            fontSize: 26,
            letterSpacing: 5,
            shadowColor: COLORS.cyan,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 15,
          }}
        >
          BIRTHDAY BUDDY
        </Text>

        <Text
          style={{
            color: COLORS.textMuted,
            fontFamily: "Exo2_400Regular",
            fontSize: 10,
            letterSpacing: 3,
            marginTop: 4,
          }}
        >
          NEURAL ACCESS TERMINAL v4.2
        </Text>

        {/* Clock */}
        <Animated.Text
          style={{
            color: COLORS.cyan,
            fontFamily: "Orbitron_700Bold",
            fontSize: 34,
            letterSpacing: 6,
            marginTop: 12,
            opacity: glowOpacity,
            shadowColor: COLORS.cyan,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 14,
          }}
        >
          {currentTime}
        </Animated.Text>

        <Text
          style={{
            color: COLORS.textSecondary,
            fontFamily: "Exo2_400Regular",
            fontSize: 10,
            letterSpacing: 2,
            marginTop: 4,
          }}
        >
          LAT 11.2588° N · LON 75.7804° E
        </Text>
      </Animated.View>

      {/* ── MAIN ORB ── */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: shakeAnim }],
          alignItems: "center",
          justifyContent: "center",
          marginTop: 20,
        }}
      >
        {/* Ripples — fixed using scale transform */}
        {[
          { scale: ripple1Scale, opacity: ripple1Opacity },
          { scale: ripple2Scale, opacity: ripple2Opacity },
          { scale: ripple3Scale, opacity: ripple3Opacity },
        ].map((r, i) => (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: 130,
              height: 130,
              borderRadius: 65,
              borderWidth: 1.5,
              borderColor: color,
              transform: [{ scale: r.scale }],
              opacity: r.opacity,
            }}
          />
        ))}

        {/* Outer glow */}
        <Animated.View
          style={{
            position: "absolute",
            width: 270,
            height: 270,
            borderRadius: 135,
            backgroundColor: color + "10",
            opacity: glowOpacity,
          }}
        />

        {/* Orbiting particles */}
        {PARTICLES.map((p, i) => {
          const rotate = particleAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [`${p.angle}deg`, `${p.angle + 360}deg`],
          });
          return (
            <Animated.View
              key={p.id}
              style={{
                position: "absolute",
                width: p.radius * 2,
                height: p.radius * 2,
                transform: [{ rotate }],
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: p.radius - p.size / 2,
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size / 2,
                  backgroundColor: p.color,
                  shadowColor: p.color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 8,
                }}
              />
            </Animated.View>
          );
        })}

        {/* Ring 3 — orange outermost */}
        <Animated.View
          style={{
            position: "absolute",
            width: 228,
            height: 228,
            transform: [{ rotate: ring3Deg }],
          }}
        >
          <Svg width={228} height={228} viewBox="0 0 228 228">
            <Circle
              cx="114"
              cy="114"
              r="110"
              stroke="#ff6600"
              strokeWidth="1"
              strokeDasharray="3 14"
              fill="none"
              opacity={0.4}
            />
          </Svg>
        </Animated.View>

        {/* Ring 1 — cyan */}
        <Animated.View
          style={{
            position: "absolute",
            width: 194,
            height: 194,
            transform: [{ rotate: ring1Deg }],
          }}
        >
          <Svg width={194} height={194} viewBox="0 0 194 194">
            <Circle
              cx="97"
              cy="97"
              r="92"
              stroke={COLORS.cyan}
              strokeWidth="1.5"
              strokeDasharray="10 5"
              fill="none"
              opacity={0.7}
            />
          </Svg>
        </Animated.View>

        {/* Ring 2 — purple reverse */}
        <Animated.View
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            transform: [{ rotate: ring2Deg }],
          }}
        >
          <Svg width={160} height={160} viewBox="0 0 160 160">
            <Circle
              cx="80"
              cy="80"
              r="76"
              stroke={COLORS.purple}
              strokeWidth="1"
              strokeDasharray="6 8"
              fill="none"
              opacity={0.6}
            />
          </Svg>
        </Animated.View>

        {/* Inner orb */}
        <View
          style={{
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: "#080816",
            borderWidth: 2,
            borderColor: color,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 30,
          }}
        >
          {/* Hex pattern */}
          <Animated.View style={{ position: "absolute", opacity: hexAnim }}>
            <Svg width={72} height={72} viewBox="0 0 72 72">
              <Polygon
                points="36,4 64,20 64,52 36,68 8,52 8,20"
                stroke={color}
                strokeWidth="1"
                fill="none"
                opacity={0.5}
              />
              <Line
                x1="36"
                y1="4"
                x2="36"
                y2="68"
                stroke={color}
                strokeWidth="0.5"
                opacity={0.4}
              />
              <Line
                x1="8"
                y1="20"
                x2="64"
                y2="52"
                stroke={color}
                strokeWidth="0.5"
                opacity={0.4}
              />
              <Line
                x1="8"
                y1="52"
                x2="64"
                y2="20"
                stroke={color}
                strokeWidth="0.5"
                opacity={0.4}
              />
            </Svg>
          </Animated.View>

          {/* Core */}
          <Animated.View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: color,
              transform: [{ scale: coreScale }],
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 20,
            }}
          />

          {/* Inner brackets */}
          {[
            { top: 12, left: 12 },
            { top: 12, right: 12 },
            { bottom: 12, left: 12 },
            { bottom: 12, right: 12 },
          ].map((pos, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                ...pos,
                width: 18,
                height: 18,
                borderTopWidth: i < 2 ? 1.5 : 0,
                borderBottomWidth: i >= 2 ? 1.5 : 0,
                borderLeftWidth: i % 2 === 0 ? 1.5 : 0,
                borderRightWidth: i % 2 === 1 ? 1.5 : 0,
                borderColor: color,
                opacity: 0.8,
              }}
            />
          ))}
        </View>
      </Animated.View>

      {/* ── BOTTOM SECTION ── */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 48,
          alignItems: "center",
          width: width - 48,
          opacity: fadeAnim,
          transform: [{ scale: btnScale }],
        }}
      >
        {/* ── SIGNAL BARS + STATUS ── */}
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            paddingHorizontal: 4,
          }}
        >
          {/* Signal bars */}
          <View
            style={{ flexDirection: "row", alignItems: "flex-end", gap: 3 }}
          >
            {signalBars.map((opacity, i) => (
              <View
                key={i}
                style={{
                  width: 5,
                  height: 6 + i * 4,
                  backgroundColor: COLORS.cyan,
                  borderRadius: 2,
                  opacity: opacity,
                }}
              />
            ))}
            <Text
              style={{
                color: COLORS.textMuted,
                fontFamily: "Exo2_400Regular",
                fontSize: 9,
                letterSpacing: 1,
                marginLeft: 6,
              }}
            >
              SIGNAL LOCKED
            </Text>
          </View>

          {/* Status indicators */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { label: "AI", color: COLORS.cyan },
              { label: "ENC", color: COLORS.green },
              { label: "VAULT", color: COLORS.purple },
            ].map((item) => (
              <View
                key={item.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Animated.View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: item.color,
                    opacity: blinkAnim,
                  }}
                />
                <Text
                  style={{
                    color: item.color,
                    fontFamily: "Exo2_400Regular",
                    fontSize: 8,
                    letterSpacing: 1,
                  }}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── STATUS TEXT ── */}
        <Animated.Text
          style={{
            color: color,
            fontFamily: "Orbitron_700Bold",
            fontSize: 10,
            letterSpacing: 3,
            marginBottom: 14,
            opacity: glowOpacity,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 8,
            textAlign: "center",
          }}
        >
          {status === "idle"
            ? "AWAITING BIOMETRIC INPUT"
            : status === "scanning"
              ? "SCANNING NEURAL PATTERN..."
              : status === "granted"
                ? "✓  IDENTITY CONFIRMED"
                : "✕  IDENTITY NOT RECOGNIZED"}
        </Animated.Text>

        {/* ── BUTTON ── */}
        <TouchableOpacity
          onPress={handleAuthenticate}
          disabled={status === "scanning" || status === "granted"}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#080816",
            borderWidth: 2,
            borderColor: color,
            borderRadius: 12,
            paddingVertical: 18,
            alignItems: "center",
            width: "100%",
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 25,
          }}
        >
          <Text
            style={{
              color: color,
              fontFamily: "Orbitron_700Bold",
              fontSize: 14,
              letterSpacing: 4,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 8,
            }}
          >
            {status === "scanning"
              ? "SCANNING..."
              : status === "granted"
                ? "ACCESS GRANTED"
                : status === "denied"
                  ? "RETRY SCAN"
                  : "UNLOCK SYSTEM"}
          </Text>
        </TouchableOpacity>

        {/* ── SYSTEM LOG ── */}
        <Animated.Text
          style={{
            color: COLORS.textMuted,
            fontFamily: "Exo2_400Regular",
            fontSize: 10,
            letterSpacing: 1,
            marginTop: 12,
            textAlign: "center",
            opacity: logAnim,
          }}
        >
          › {SYSTEM_LOGS[currentLog]}
        </Animated.Text>
      </Animated.View>

      {/* ── ACCESS GRANTED POPUP ── */}
      {showPopup && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#000000dd",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
            opacity: popupOpacity,
          }}
        >
          <Animated.View
            style={{
              width: width - 48,
              backgroundColor: "#050510",
              borderWidth: 2,
              borderColor: COLORS.green,
              borderRadius: 20,
              padding: 32,
              alignItems: "center",
              transform: [{ scale: popupScale }],
              shadowColor: COLORS.green,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 40,
            }}
          >
            {/* Top bar */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: COLORS.green,
                borderRadius: 20,
              }}
            />

            {/* Check circle */}
            <Animated.View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 2,
                borderColor: COLORS.green,
                backgroundColor: COLORS.greenGlow,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
                transform: [{ scale: checkAnim }],
                shadowColor: COLORS.green,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 20,
              }}
            >
              <Animated.Text
                style={{
                  color: COLORS.green,
                  fontSize: 36,
                  opacity: checkAnim,
                }}
              >
                ✓
              </Animated.Text>
            </Animated.View>

            <Text
              style={{
                color: COLORS.green,
                fontFamily: "Orbitron_700Bold",
                fontSize: 18,
                letterSpacing: 3,
                marginBottom: 8,
                shadowColor: COLORS.green,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 10,
              }}
            >
              ACCESS GRANTED
            </Text>

            <Text
              style={{
                color: COLORS.textBright,
                fontFamily: "Orbitron_700Bold",
                fontSize: 13,
                letterSpacing: 2,
                marginBottom: 6,
              }}
            >
              IDENTITY VERIFIED
            </Text>

            <Text
              style={{
                color: COLORS.textSecondary,
                fontFamily: "Exo2_400Regular",
                fontSize: 12,
                letterSpacing: 1,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Welcome back, Eshaan.{"\n"}Access to classified system confirmed.
            </Text>

            <View
              style={{
                width: "100%",
                height: 1,
                backgroundColor: COLORS.green,
                opacity: 0.3,
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: "row", gap: 20 }}>
              {[
                { label: "IDENTITY", status: "CONFIRMED" },
                { label: "VAULT", status: "UNLOCKED" },
                { label: "AI CORE", status: "ACTIVE" },
              ].map((item) => (
                <View key={item.label} style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      color: COLORS.green,
                      fontFamily: "Orbitron_700Bold",
                      fontSize: 9,
                      letterSpacing: 1,
                    }}
                  >
                    {item.status}
                  </Text>
                  <Text
                    style={{
                      color: COLORS.textMuted,
                      fontFamily: "Exo2_400Regular",
                      fontSize: 9,
                      letterSpacing: 1,
                      marginTop: 2,
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text
              style={{
                color: COLORS.textMuted,
                fontFamily: "Exo2_400Regular",
                fontSize: 10,
                letterSpacing: 2,
                marginTop: 20,
              }}
            >
              REDIRECTING TO SYSTEM...
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}
