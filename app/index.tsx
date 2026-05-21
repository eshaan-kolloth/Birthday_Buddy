import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AIOrb from "../components/AIOrb";
import { COLORS } from "../constants/theme";
import {
  addBirthdayToCalendar,
  removeBirthdayFromCalendar,
} from "../utils/calendar";
import {
  deleteBirthdayFromCloud,
  loadBirthdaysFromCloud,
  syncBirthdayToCloud,
} from "../utils/cloudStorage";
import {
  cancelBirthdayNotifications,
  scheduleBirthdayNotifications,
} from "../utils/notifications";
import {
  addBirthday,
  Birthday,
  deleteBirthday,
  loadBirthdays,
  saveBirthdays,
} from "../utils/storage";

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const RELATIONSHIP_OPTIONS = [
  { label: "Friend", emoji: "🤝" },
  { label: "Mom", emoji: "👩" },
  { label: "Dad", emoji: "👨" },
  { label: "Sister", emoji: "👧" },
  { label: "Brother", emoji: "👦" },
  { label: "Partner", emoji: "💝" },
  { label: "Spouse", emoji: "💍" },
  { label: "Colleague", emoji: "💼" },
  { label: "Cousin", emoji: "👫" },
  { label: "Dog", emoji: "🐶" },
  { label: "Cat", emoji: "🐱" },
  { label: "Other", emoji: "⭐" },
  { label: "+ Custom", emoji: "✏️" },
];

function getMaxDay(month: number) {
  if (month < 1 || month > 12) return 31;
  return DAYS_IN_MONTH[month - 1];
}

function validateDate(day: string, month: string) {
  const d = Number(day);
  const m = Number(month);
  if (!day || !month) return "Please enter both day and month.";
  if (Number.isNaN(d) || d < 1) return "That day is not valid.";
  if (Number.isNaN(m) || m < 1 || m > 12) return "That month is not valid.";
  const maxDay = getMaxDay(m);
  const monthName = MONTHS_SHORT[m - 1];
  if (d > maxDay) {
    return `Hey Eshaan 😅 ${monthName} has only ${maxDay} days. Day ${d} does not exist.`;
  }
  return "";
}

const buildSystemPrompt = (birthdays: Birthday[]) => {
  const list =
    birthdays.length === 0
      ? "No birthdays saved yet."
      : birthdays
          .map(
            (b) =>
              `- ${b.name} | ${b.day}/${b.month}${b.relationship ? ` | ${b.relationship}` : ""}`,
          )
          .join("\n");

  return `You are Buddy, a simple and friendly birthday assistant inside BirthdayBuddy app. The user is Eshaan.

CURRENT SAVED BIRTHDAYS:
${list}

YOUR JOB:
- Help Eshaan add, update, or delete birthdays.
- Answer questions about saved birthdays.
- Be short, friendly and clear.
- Use the list above as the only source of truth.

WHEN SAVING:
SAVE_BIRTHDAY:{"name":"Name","day":5,"month":3,"relationship":"friend"}

WHEN UPDATING:
DELETE_BIRTHDAY:{"name":"OldName"}
SAVE_BIRTHDAY:{"name":"Name","day":NEW_DAY,"month":NEW_MONTH,"relationship":"friend"}

WHEN DELETING:
DELETE_BIRTHDAY:{"name":"Name"}

RULES:
- month is always a number.
- only use tags when sure.
- never make up birthday data.`;
};

const labelStyle = {
  color: COLORS.textMuted,
  fontFamily: "Orbitron_700Bold",
  fontSize: 9,
  letterSpacing: 2,
  marginBottom: 8,
} as const;

const inputStyle = {
  backgroundColor: "#0a0a18",
  borderWidth: 1.5,
  borderColor: COLORS.borderSubtle,
  borderRadius: 12,
  padding: 14,
  color: COLORS.textPrimary,
  fontFamily: "Exo2_400Regular",
  fontSize: 15,
  marginBottom: 20,
} as const;

// ── Floating Warning Toast ─────────────────────────────────
const FloatingWarningToast = ({
  visible,
  message,
  onHide,
  insideModal = false,
}: {
  visible: boolean;
  message: string;
  onHide: () => void;
  insideModal?: boolean;
}) => {
  const slideX = useRef(new Animated.Value(-360)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (visible) {
      slideX.setValue(-360);
      opacity.setValue(0);
      shake.setValue(0);

      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.sequence([
          Animated.timing(shake, {
            toValue: 7,
            duration: 45,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: -7,
            duration: 45,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: 4,
            duration: 45,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: 0,
            duration: 45,
            useNativeDriver: true,
          }),
        ]).start();
      });

      timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideX, {
            toValue: -360,
            duration: 220,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start(onHide);
      }, 2800);

      return () => {
        clearTimeout(timer);
        slideX.stopAnimation();
        opacity.stopAnimation();
        shake.stopAnimation();
      };
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: insideModal ? 32 : 50,
        left: 14,
        right: 14,
        zIndex: 999999,
        elevation: 999,
        opacity,
        transform: [{ translateX: slideX }, { translateX: shake }],
      }}
    >
      <View
        style={{
          backgroundColor: "#190009",
          borderRadius: 18,
          borderWidth: 2,
          borderColor: "#ff3355",
          padding: 14,
          shadowColor: "#ff0033",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.45,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <Text
          style={{
            color: "#ff3355",
            fontFamily: "Orbitron_700Bold",
            fontSize: 11,
            letterSpacing: 2,
            marginBottom: 5,
          }}
        >
          ⚠ DATE ERROR
        </Text>
        <Text
          style={{
            color: "#ffe2e8",
            fontFamily: "Exo2_400Regular",
            fontSize: 13,
            lineHeight: 19,
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

// ── Message Bubble ─────────────────────────────────────────
const MessageBubble = ({ item }: { item: any }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(item.isFromUser ? 16 : -16)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
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
    ]).start();
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
          fontSize: 8,
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
const TypingBubble = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
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
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ marginHorizontal: 12, marginVertical: 6 }}>
      <Text
        style={{
          fontSize: 8,
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

// ── Add Birthday Modal ─────────────────────────────────────
const AddBirthdayModal = ({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, day: string, month: string, rel: string) => void;
}) => {
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [rel, setRel] = useState("");
  const [customRel, setCustomRel] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");

  const cardPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cardPulse, {
          toValue: 1.015,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(cardPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    if (visible) loop.start();
    return () => loop.stop();
  }, [visible]);

  const showModalWarning = (msg: string) => {
    setWarningMsg(msg);
    setWarningVisible(false);
    setTimeout(() => setWarningVisible(true), 20);
  };

  const reset = () => {
    setName("");
    setDay("");
    setMonth("");
    setRel("");
    setCustomRel("");
    setShowCustom(false);
    setWarningVisible(false);
  };

  const finalRel = rel === "+ Custom" ? customRel : rel;
  const isValid = name.trim().length > 0 && day.length > 0 && month.length > 0;

  const handleDayChange = (t: string) => {
    const clean = t.replace(/[^0-9]/g, "");
    if (clean.length <= 2) {
      setDay(clean);
      if (clean && month) {
        const error = validateDate(clean, month);
        if (error) showModalWarning(error);
      }
    }
  };

  const handleMonthSelect = (m: string) => {
    setMonth(m);
    if (day) {
      const error = validateDate(day, m);
      if (error) showModalWarning(error);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showModalWarning("Please enter the person's name first.");
      return;
    }
    if (!day || !month) {
      showModalWarning("Please enter the birthday day and select a month.");
      return;
    }
    const error = validateDate(day, month);
    if (error) {
      showModalWarning(error);
      return;
    }
    onSave(name.trim(), day, month, finalRel.trim().toLowerCase());
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, position: "relative" }}>
        <FloatingWarningToast
          visible={warningVisible}
          message={warningMsg}
          onHide={() => setWarningVisible(false)}
          insideModal
        />
        <KeyboardAvoidingView
          style={{
            flex: 1,
            backgroundColor: "#000000cc",
            justifyContent: "flex-end",
          }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={{
              backgroundColor: "#050510",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              borderTopWidth: 2,
              borderColor: COLORS.cyan,
              height: "92%",
              shadowColor: "#00e5ff",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.25,
              shadowRadius: 14,
              elevation: 12,
            }}
          >
            <View
              style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
            >
              <View
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: COLORS.cyan + "77",
                }}
              />
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 22, paddingBottom: 70 }}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 22,
                }}
              >
                <View>
                  <Text
                    style={{
                      color: COLORS.cyan,
                      fontFamily: "Orbitron_700Bold",
                      fontSize: 15,
                      letterSpacing: 2,
                    }}
                  >
                    ADD BIRTHDAY
                  </Text>
                  <Text
                    style={{
                      color: COLORS.textMuted,
                      fontFamily: "Exo2_400Regular",
                      fontSize: 10,
                      marginTop: 3,
                    }}
                  >
                    Save someone important
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    reset();
                    onClose();
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: "#ffffff11",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={labelStyle}>NAME</Text>
              <TextInput
                style={[
                  inputStyle,
                  {
                    borderColor: name ? COLORS.cyan : COLORS.borderSubtle,
                    shadowColor: name ? "#00e5ff" : "transparent",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: name ? 4 : 0,
                  },
                ]}
                placeholder="Enter name..."
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>DAY</Text>
                  <TextInput
                    style={[
                      inputStyle,
                      {
                        textAlign: "center",
                        fontSize: 24,
                        fontFamily: "Orbitron_700Bold",
                        borderColor: day ? COLORS.cyan : COLORS.borderSubtle,
                      },
                    ]}
                    placeholder="--"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    value={day}
                    onChangeText={handleDayChange}
                    maxLength={2}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={labelStyle}>MONTH</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ height: 56 }}
                    contentContainerStyle={{ gap: 8, alignItems: "center" }}
                    keyboardShouldPersistTaps="always"
                  >
                    {MONTHS_SHORT.map((m, i) => {
                      const selected = month === String(i + 1);
                      return (
                        <TouchableOpacity
                          key={m}
                          onPress={() => handleMonthSelect(String(i + 1))}
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            borderColor: selected
                              ? COLORS.cyan
                              : COLORS.borderSubtle,
                            backgroundColor: selected
                              ? COLORS.cyanGlow
                              : "#0a0a18",
                            justifyContent: "center",
                            alignItems: "center",
                            shadowColor: selected ? "#00e5ff" : "transparent",
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            elevation: selected ? 3 : 0,
                          }}
                        >
                          <Text
                            style={{
                              color: selected ? COLORS.cyan : COLORS.textMuted,
                              fontFamily: "Orbitron_700Bold",
                              fontSize: 9,
                              letterSpacing: 1,
                            }}
                          >
                            {m.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              <Text style={labelStyle}>RELATIONSHIP</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: showCustom ? 12 : 24,
                }}
              >
                {RELATIONSHIP_OPTIONS.map((r) => {
                  const selected = rel === r.label;
                  return (
                    <TouchableOpacity
                      key={r.label}
                      onPress={() => {
                        if (r.label === "+ Custom") {
                          setRel("+ Custom");
                          setShowCustom(true);
                        } else {
                          setRel(selected ? "" : r.label);
                          setShowCustom(false);
                          setCustomRel("");
                        }
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor: selected
                          ? COLORS.purple
                          : COLORS.borderSubtle,
                        backgroundColor: selected
                          ? COLORS.purpleGlow
                          : "#0a0a18",
                      }}
                    >
                      <Text style={{ fontSize: 14 }}>{r.emoji}</Text>
                      <Text
                        style={{
                          color: selected ? COLORS.purple : COLORS.textMuted,
                          fontFamily: "Exo2_400Regular",
                          fontSize: 12,
                        }}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {showCustom && (
                <TextInput
                  style={[inputStyle, { borderColor: COLORS.purple }]}
                  placeholder="Type your own relationship..."
                  placeholderTextColor={COLORS.textMuted}
                  value={customRel}
                  onChangeText={setCustomRel}
                  autoCapitalize="words"
                  autoFocus
                />
              )}

              {isValid && (
                <Animated.View
                  style={{
                    transform: [{ scale: cardPulse }],
                    backgroundColor: "#080815",
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: COLORS.cyan + "55",
                    marginBottom: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    shadowColor: "#00e5ff",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.16,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{ fontSize: 30 }}>🎂</Text>
                  <View>
                    <Text
                      style={{
                        color: COLORS.cyan,
                        fontFamily: "Orbitron_700Bold",
                        fontSize: 14,
                        letterSpacing: 1,
                      }}
                    >
                      {name}
                    </Text>
                    <Text
                      style={{
                        color: COLORS.textSecondary,
                        fontFamily: "Exo2_400Regular",
                        fontSize: 12,
                        marginTop: 3,
                      }}
                    >
                      {month ? MONTHS_SHORT[Number(month) - 1] : "?"}{" "}
                      {day || "?"}
                      {finalRel ? ` · ${finalRel}` : ""}
                    </Text>
                  </View>
                </Animated.View>
              )}

              <TouchableOpacity
                onPress={handleSave}
                style={{
                  backgroundColor: isValid ? COLORS.cyanGlow : "#0a0a18",
                  borderWidth: 2,
                  borderColor: isValid ? COLORS.cyan : COLORS.borderSubtle,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  shadowColor: isValid ? "#00e5ff" : "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: isValid ? 4 : 0,
                }}
              >
                <Text
                  style={{
                    color: isValid ? COLORS.cyan : COLORS.textMuted,
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 14,
                    letterSpacing: 2,
                  }}
                >
                  {isValid ? "SAVE BIRTHDAY ✓" : "FILL IN DETAILS"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ── View All Modal ─────────────────────────────────────────
// ── View All Modal ─────────────────────────────────────────
function ViewAllModal({
  visible,
  onClose,
  birthdays,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  birthdays: Birthday[];
  onDelete: (id: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000cc",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#06060f",
            height: "80%",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 2,
            borderColor: COLORS.purple,
          }}
        >
          <View
            style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
          >
            <View
              style={{
                width: 42,
                height: 4,
                borderRadius: 2,
                backgroundColor: COLORS.purple + "66",
              }}
            />
          </View>
          <View
            style={{
              paddingHorizontal: 22,
              paddingVertical: 14,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{
                  color: COLORS.purple,
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 14,
                  letterSpacing: 2,
                }}
              >
                ALL BIRTHDAYS
              </Text>
              <Text
                style={{
                  color: COLORS.textMuted,
                  fontFamily: "Exo2_400Regular",
                  fontSize: 10,
                }}
              >
                {birthdays.length} saved · sorted by date
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: COLORS.textMuted, fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[...birthdays].sort((a, b) =>
              a.month !== b.month ? a.month - b.month : a.day - b.day,
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🎂</Text>
                <Text
                  style={{
                    color: COLORS.textMuted,
                    fontFamily: "Exo2_400Regular",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  No birthdays yet. Tap ADD to start.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#0a0a18",
                  borderRadius: 14,
                  padding: 13,
                  marginBottom: 9,
                  borderWidth: 1,
                  borderColor: COLORS.borderSubtle,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    backgroundColor: "#060614",
                    borderWidth: 1.5,
                    borderColor: COLORS.cyan + "44",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 13,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.cyan,
                      fontFamily: "Orbitron_700Bold",
                      fontSize: 16,
                    }}
                  >
                    {String(item.day).padStart(2, "0")}
                  </Text>
                  <Text
                    style={{
                      color: COLORS.cyan + "77",
                      fontFamily: "Orbitron_700Bold",
                      fontSize: 8,
                      letterSpacing: 1,
                    }}
                  >
                    {MONTHS_SHORT[item.month - 1]}
                  </Text>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "Exo2_400Regular",
                      fontSize: 15,
                    }}
                  >
                    {item.name}
                  </Text>
                  {item.relationship ? (
                    <Text
                      style={{
                        color: COLORS.purple + "cc",
                        fontFamily: "Exo2_400Regular",
                        fontSize: 11,
                        textTransform: "capitalize",
                        marginTop: 2,
                      }}
                    >
                      {item.relationship}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    console.log("DELETE BUTTON PRESSED", item.id);
                    onDelete(item.id);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ff335544",
                    borderRadius: 8,
                    padding: 14,
                    backgroundColor: "#ff000011",
                  }}
                >
                  <Text
                    style={{
                      color: "#ff3355",
                      fontFamily: "Orbitron_700Bold",
                      fontSize: 13,
                    }}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

// ── Edit Birthday Modal ────────────────────────────────────
const EditBirthdayModal = ({
  visible,
  onClose,
  birthdays,
  onUpdate,
}: {
  visible: boolean;
  onClose: () => void;
  birthdays: Birthday[];
  onUpdate: (id: string, day: string, month: string) => void;
}) => {
  const [selected, setSelected] = useState<Birthday | null>(null);
  const [newDay, setNewDay] = useState("");
  const [newMonth, setNewMonth] = useState("");
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");

  const showModalWarning = (msg: string) => {
    setWarningMsg(msg);
    setWarningVisible(false);
    setTimeout(() => setWarningVisible(true), 20);
  };

  const reset = () => {
    setSelected(null);
    setNewDay("");
    setNewMonth("");
    setWarningVisible(false);
  };

  const handleUpdate = () => {
    if (!selected) return;
    const error = validateDate(newDay, newMonth);
    if (error) {
      showModalWarning(error);
      return;
    }
    onUpdate(selected.id, newDay, newMonth);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, position: "relative" }}>
        <FloatingWarningToast
          visible={warningVisible}
          message={warningMsg}
          onHide={() => setWarningVisible(false)}
          insideModal
        />
        <KeyboardAvoidingView
          style={{
            flex: 1,
            backgroundColor: "#000000cc",
            justifyContent: "flex-end",
          }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={{
              backgroundColor: "#06060f",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 2,
              borderColor: COLORS.green,
              height: "85%",
            }}
          >
            <ScrollView
              contentContainerStyle={{ padding: 22, paddingBottom: 60 }}
              keyboardShouldPersistTaps="always"
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 22,
                }}
              >
                <View>
                  <Text
                    style={{
                      color: COLORS.green,
                      fontFamily: "Orbitron_700Bold",
                      fontSize: 15,
                      letterSpacing: 2,
                    }}
                  >
                    EDIT BIRTHDAY
                  </Text>
                  <Text
                    style={{
                      color: COLORS.textMuted,
                      fontFamily: "Exo2_400Regular",
                      fontSize: 10,
                    }}
                  >
                    Select a person to update
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    reset();
                    onClose();
                  }}
                >
                  <Text style={{ color: COLORS.textMuted, fontSize: 20 }}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={labelStyle}>SELECT PERSON</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                {birthdays.map((b) => {
                  const sel = selected?.id === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => {
                        setSelected(b);
                        setNewDay(String(b.day));
                        setNewMonth(String(b.month));
                      }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: sel ? COLORS.green : COLORS.borderSubtle,
                        backgroundColor: sel ? COLORS.greenGlow : "#0a0a18",
                      }}
                    >
                      <Text
                        style={{
                          color: sel ? COLORS.green : COLORS.textMuted,
                          fontFamily: "Exo2_400Regular",
                          fontSize: 13,
                        }}
                      >
                        {b.name}
                      </Text>
                      <Text
                        style={{
                          color: sel ? COLORS.green + "aa" : COLORS.textMuted,
                          fontFamily: "Orbitron_700Bold",
                          fontSize: 8,
                          marginTop: 2,
                        }}
                      >
                        {MONTHS_SHORT[b.month - 1]} {b.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selected && (
                <>
                  <View
                    style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={labelStyle}>NEW DAY</Text>
                      <TextInput
                        style={[
                          inputStyle,
                          {
                            textAlign: "center",
                            fontSize: 24,
                            fontFamily: "Orbitron_700Bold",
                            borderColor: newDay
                              ? COLORS.green
                              : COLORS.borderSubtle,
                          },
                        ]}
                        placeholder="--"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="number-pad"
                        value={newDay}
                        onChangeText={(t) => {
                          const clean = t.replace(/[^0-9]/g, "");
                          if (clean.length <= 2) {
                            setNewDay(clean);
                            if (clean && newMonth) {
                              const error = validateDate(clean, newMonth);
                              if (error) showModalWarning(error);
                            }
                          }
                        }}
                        maxLength={2}
                      />
                    </View>
                    <View style={{ flex: 2 }}>
                      <Text style={labelStyle}>NEW MONTH</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ height: 56 }}
                      >
                        {MONTHS_SHORT.map((m, i) => {
                          const sel = newMonth === String(i + 1);
                          return (
                            <TouchableOpacity
                              key={m}
                              onPress={() => {
                                const val = String(i + 1);
                                setNewMonth(val);
                                if (newDay) {
                                  const error = validateDate(newDay, val);
                                  if (error) showModalWarning(error);
                                }
                              }}
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 12,
                                marginRight: 8,
                                borderWidth: 1.5,
                                borderColor: sel
                                  ? COLORS.green
                                  : COLORS.borderSubtle,
                                backgroundColor: sel
                                  ? COLORS.greenGlow
                                  : "#0a0a18",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={{
                                  color: sel ? COLORS.green : COLORS.textMuted,
                                  fontFamily: "Orbitron_700Bold",
                                  fontSize: 9,
                                }}
                              >
                                {m.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleUpdate}
                    style={{
                      backgroundColor: COLORS.greenGlow,
                      borderWidth: 2,
                      borderColor: COLORS.green,
                      borderRadius: 14,
                      padding: 16,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: COLORS.green,
                        fontFamily: "Orbitron_700Bold",
                        fontSize: 14,
                        letterSpacing: 2,
                      }}
                    >
                      UPDATE DATE ✓
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ── Main Screen ────────────────────────────────────────────
export default function Index() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [messages, setMessages] = useState([
    {
      id: "1",
      content:
        "Hey Eshaan! 👋 Add birthdays, view saved people, edit dates, or chat with me anytime. 🎂",
      isFromUser: false,
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { role: string; content: string }[]
  >([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [chatMode, setChatMode] = useState(false);
  const [menuPeekVisible, setMenuPeekVisible] = useState(true);

  const [mainWarningVisible, setMainWarningVisible] = useState(false);
  const [mainWarningMsg, setMainWarningMsg] = useState("");

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const activeDotOpacity = useRef(new Animated.Value(1)).current;
  const sendScale = useRef(new Animated.Value(1)).current;
  const menuAnim = useRef(new Animated.Value(1)).current;
  const chipAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      fetchBirthdays();
    }, []),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(activeDotOpacity, {
          toValue: 0.25,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(activeDotOpacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(menuAnim, {
        toValue: menuPeekVisible ? 1 : 0,
        duration: 230,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(chipAnim, {
        toValue: chatMode && !menuPeekVisible ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [menuPeekVisible, chatMode]);

  const fetchBirthdays = async () => {
    const local = await loadBirthdays();

    if (local.length === 0) {
      try {
        const cloudData = await loadBirthdaysFromCloud();
        if (cloudData.length > 0) {
          await saveBirthdays(cloudData);
          setBirthdays(cloudData);
          console.log("Restored", cloudData.length, "birthdays from cloud");
          return;
        }
      } catch (e) {
        console.error("Cloud restore failed:", e);
      }
    }

    setBirthdays(local);
  };

  const showMainWarning = (msg: string) => {
    setMainWarningMsg(msg);
    setMainWarningVisible(false);
    setTimeout(() => setMainWarningVisible(true), 20);
  };

  const openChatMode = () => {
    setChatMode(true);
    setMenuPeekVisible(false);
    setTimeout(() => inputRef.current?.focus(), 120);
  };
  const closeChatMode = () => {
    Keyboard.dismiss();
    setChatMode(false);
    setMenuPeekVisible(true);
  };
  const showMenuPeek = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
    setMenuPeekVisible(true);
  };
  const hideMenuPeek = () => {
    if (chatMode) {
      setMenuPeekVisible(false);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  };

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;
    lastScrollY.current = y;
    if (chatMode && diff > 4) setMenuPeekVisible(false);
    if (!chatMode) {
      if (y <= 4) setMenuPeekVisible(true);
      else if (diff > 8) setMenuPeekVisible(false);
      else if (diff < -10) setMenuPeekVisible(true);
    }
  };

  // ── handleDirectAdd (FIXED) ────────────────────────────
  const handleDirectAdd = async (
    name: string,
    day: string,
    month: string,
    rel: string,
  ) => {
    const existing = await loadBirthdays();
    const alreadyExists = existing.find(
      (b) => b.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

    const birthdayObj: Birthday = {
      id: alreadyExists ? alreadyExists.id : Date.now().toString(),
      name,
      day: Number(day),
      month: Number(month),
      relationship: rel,
    };

    if (alreadyExists) {
      await saveBirthdays(
        existing.map((b) => (b.id === alreadyExists.id ? birthdayObj : b)),
      );
    } else {
      await addBirthday(birthdayObj);
    }

    await fetchBirthdays();

    try {
      await scheduleBirthdayNotifications(birthdayObj);
    } catch (e) {
      console.error("Failed to schedule notification:", e);
    }

    try {
      console.log("Attempting calendar add for:", birthdayObj.name);
      const eventId = await Promise.race([
        addBirthdayToCalendar(birthdayObj),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);
      if (eventId) {
        const existing2 = await loadBirthdays();
        await saveBirthdays(
          existing2.map((b) =>
            b.id === birthdayObj.id ? { ...b, calendarEventId: eventId } : b,
          ),
        );
        await fetchBirthdays();
      }
    } catch (e) {
      console.error("Failed to add to calendar:", e);
    }

    console.log("REACHED CLOUD SYNC BLOCK");
    try {
      await syncBirthdayToCloud(birthdayObj);
    } catch (e) {
      console.error("Failed to sync to cloud:", e);
    }
    console.log("CLOUD SYNC BLOCK DONE");

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: alreadyExists
          ? `Updated! ✨ ${name}'s birthday is now ${MONTHS_SHORT[Number(month) - 1]} ${day}.`
          : `Done! 🎂 ${name}'s birthday on ${MONTHS_SHORT[Number(month) - 1]} ${day} is saved!`,
        isFromUser: false,
      },
    ]);
  };

  // ── handleDelete (FIXED - removed duplicate log) ───────
  const handleDelete = async (id: string) => {
    const existing = await loadBirthdays();
    const person = existing.find((b) => b.id === id);

    console.log("Deleting:", person?.name, "eventId:", person?.calendarEventId);

    try {
      if (person) await removeBirthdayFromCalendar(person);
    } catch (e) {
      console.error("Failed to remove from calendar:", e);
    }

    await deleteBirthday(id);
    await fetchBirthdays();

    try {
      await cancelBirthdayNotifications(id);
    } catch (e) {
      console.error("Failed to cancel notification:", e);
    }

    try {
      await deleteBirthdayFromCloud(id);
    } catch (e) {
      console.error("Failed to delete from cloud:", e);
    }
  };

  const handleUpdate = async (id: string, day: string, month: string) => {
    const existing = await loadBirthdays();
    const person = existing.find((b) => b.id === id);
    if (!person) return;

    const updated: Birthday = {
      ...person,
      day: Number(day),
      month: Number(month),
    };

    await saveBirthdays(existing.map((b) => (b.id === id ? updated : b)));
    await fetchBirthdays();

    try {
      await cancelBirthdayNotifications(id);
      await scheduleBirthdayNotifications(updated);
    } catch (e) {
      console.error("Failed to reschedule notification:", e);
    }

    try {
      if (person) await removeBirthdayFromCalendar(person);
      const newEventId = await addBirthdayToCalendar(updated);
      if (newEventId) {
        const existing2 = await loadBirthdays();
        await saveBirthdays(
          existing2.map((b) =>
            b.id === updated.id ? { ...b, calendarEventId: newEventId } : b,
          ),
        );
        await fetchBirthdays();
      }
    } catch (e) {
      console.error("Failed to update calendar:", e);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: `Updated! ✏️ ${person.name}'s birthday changed to ${MONTHS_SHORT[Number(month) - 1]} ${day}.`,
        isFromUser: false,
      },
    ]);
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    if (!GROQ_API_KEY) {
      showMainWarning(
        "Groq API key is missing. Add EXPO_PUBLIC_GROQ_API_KEY in your .env file.",
      );
      return;
    }

    setMenuPeekVisible(false);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), content: text, isFromUser: true },
    ]);
    setInputText("");
    setIsTyping(true);

    const updatedHistory = [...chatHistory, { role: "user", content: text }];
    setChatHistory(updatedHistory);

    try {
      const freshBirthdays = await loadBirthdays();
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: buildSystemPrompt(freshBirthdays) },
              ...updatedHistory,
            ],
            max_tokens: 250,
            temperature: 0.7,
          }),
        },
      );

      const data = await response.json();
      const rawReply =
        data.choices?.[0]?.message?.content || "Something went wrong 😅";
      let displayReply = rawReply;

      if (rawReply.includes("DELETE_BIRTHDAY:")) {
        const parts = rawReply.split("DELETE_BIRTHDAY:");
        for (let i = 1; i < parts.length; i++) {
          try {
            const jsonStr = parts[i]
              .trim()
              .split("\n")[0]
              .replace(/SAVE_BIRTHDAY:.*/g, "")
              .trim();
            const del = JSON.parse(jsonStr);
            const ex = await loadBirthdays();
            const toDelete = ex.find(
              (b) => b.name.toLowerCase() === del.name.toLowerCase(),
            );
            if (toDelete) {
              await saveBirthdays(ex.filter((b) => b.id !== toDelete.id));
              try {
                await cancelBirthdayNotifications(toDelete.id);
              } catch {}
            }
          } catch {}
        }
      }

      if (rawReply.includes("SAVE_BIRTHDAY:")) {
        const parts = rawReply.split("SAVE_BIRTHDAY:");
        displayReply = parts[0]
          .replace(/DELETE_BIRTHDAY:\{[^}]+\}/g, "")
          .trim();

        for (let i = 1; i < parts.length; i++) {
          try {
            const bd = JSON.parse(parts[i].trim().split("\n")[0].trim());
            const error = validateDate(String(bd.day), String(bd.month));
            if (!error) {
              const ex = await loadBirthdays();
              const duplicate = ex.find(
                (b) => b.name.toLowerCase() === bd.name.toLowerCase(),
              );
              const birthdayObj: Birthday = {
                id: duplicate ? duplicate.id : (Date.now() + i).toString(),
                name: bd.name,
                day: bd.day,
                month: bd.month,
                relationship: bd.relationship || "",
              };
              if (duplicate) {
                await saveBirthdays(
                  ex.map((b) => (b.id === duplicate.id ? birthdayObj : b)),
                );
              } else {
                await addBirthday(birthdayObj);
              }
              try {
                await scheduleBirthdayNotifications(birthdayObj);
              } catch {}
            } else {
              showMainWarning(error);
            }
          } catch {}
        }
      } else {
        displayReply = rawReply
          .replace(/DELETE_BIRTHDAY:\{[^}]+\}/g, "")
          .trim();
      }

      await fetchBirthdays();
      setChatHistory([
        ...updatedHistory,
        { role: "assistant", content: rawReply },
      ]);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: displayReply || "Done.",
          isFromUser: false,
        },
      ]);
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Connection lost 😬 Try again!",
          isFromUser: false,
        },
      ]);
    }
  };

  const animateSend = () => {
    Animated.sequence([
      Animated.timing(sendScale, {
        toValue: 0.85,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(sendScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    sendMessage();
  };

  const actionButtons = [
    {
      label: "ADD",
      emoji: "➕",
      color: COLORS.cyan,
      bg: COLORS.cyanGlow,
      border: COLORS.cyan,
      onPress: () => {
        Keyboard.dismiss();
        setShowAdd(true);
      },
    },
    {
      label: "VIEW",
      emoji: "📋",
      color: COLORS.purple,
      bg: COLORS.purpleGlow,
      border: COLORS.purple,
      onPress: () => {
        Keyboard.dismiss();
        setShowAll(true);
      },
    },
    {
      label: chatMode ? "CLOSE" : "CHAT",
      emoji: chatMode ? "✕" : "💬",
      color: chatMode ? "#ff6600" : COLORS.cyan,
      bg: chatMode ? "#ff660022" : COLORS.cyanGlow,
      border: chatMode ? "#ff6600" : COLORS.cyan,
      onPress: () => {
        if (chatMode) closeChatMode();
        else openChatMode();
      },
    },
    {
      label: "EDIT",
      emoji: "✏️",
      color: COLORS.green,
      bg: COLORS.greenGlow,
      border: COLORS.green,
      onPress: () => {
        Keyboard.dismiss();
        setShowEdit(true);
      },
    },
  ];

  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-82, 0],
  });
  const chipTranslateY = chipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  const composerTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 90],
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        {/* ── HEADER ── */}
        <Animated.View
          style={{
            backgroundColor: COLORS.bgSurface,
            paddingHorizontal: 16,
            paddingVertical: 13,
            borderBottomWidth: 2,
            borderBottomColor: COLORS.cyan,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: fadeAnim,
            zIndex: 20,
            elevation: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <AIOrb />
            <View>
              <Text
                style={{
                  color: COLORS.cyan,
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 15,
                  letterSpacing: 1,
                }}
              >
                BUDDY
              </Text>
              <Text
                style={{
                  color: COLORS.textMuted,
                  fontFamily: "Exo2_400Regular",
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                {birthdays.length} birthday{birthdays.length !== 1 ? "s" : ""}{" "}
                saved
              </Text>
            </View>
          </View>
          <View
            style={{
              backgroundColor: COLORS.greenGlow,
              borderWidth: 1,
              borderColor: COLORS.green,
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 5,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Animated.Text
              style={{
                color: COLORS.green,
                fontSize: 9,
                opacity: activeDotOpacity,
              }}
            >
              ●
            </Animated.Text>
            <Text
              style={{
                color: COLORS.green,
                fontSize: 9,
                fontFamily: "Exo2_400Regular",
              }}
            >
              ACTIVE
            </Text>
          </View>
        </Animated.View>

        {/* ── ACTION BAR ── */}
        <Animated.View
          pointerEvents={menuPeekVisible ? "auto" : "none"}
          style={{
            position: "absolute",
            top: 66,
            left: 0,
            right: 0,
            zIndex: 15,
            elevation: 15,
            opacity: menuAnim,
            transform: [{ translateY: menuTranslateY }],
            backgroundColor: COLORS.bgSurface,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.borderSubtle,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {actionButtons.map((btn) => (
              <TouchableOpacity
                key={btn.label}
                onPress={btn.onPress}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  backgroundColor: btn.bg,
                  borderWidth: 1.5,
                  borderColor: btn.border,
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: "center",
                  gap: 4,
                  shadowColor: btn.color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.16,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 16 }}>{btn.emoji}</Text>
                <Text
                  style={{
                    color: btn.color,
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 7,
                    letterSpacing: 1,
                  }}
                >
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── MESSAGES ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => <MessageBubble item={item} />}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: menuPeekVisible ? 82 : 12,
            paddingBottom: chatMode ? 110 : 90,
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={isTyping ? <TypingBubble /> : null}
        />

        {/* ── CHAT INPUT ── */}
        {chatMode && (
          <Animated.View
            pointerEvents={menuPeekVisible ? "none" : "auto"}
            style={{
              backgroundColor: COLORS.bgSurface,
              borderTopWidth: 2,
              borderTopColor: COLORS.purple,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              opacity: menuPeekVisible ? 0 : 1,
              transform: [{ translateY: composerTranslateY }],
            }}
          >
            <TextInput
              ref={inputRef}
              style={{
                flex: 1,
                backgroundColor: "#0d001a",
                borderWidth: 1.5,
                borderColor: COLORS.purple + "88",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: COLORS.textPrimary,
                fontFamily: "Exo2_400Regular",
                fontSize: 14,
              }}
              placeholder="Ask Buddy anything..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={animateSend}
              returnKeyType="send"
              autoFocus
              onFocus={() => setMenuPeekVisible(false)}
            />
            <Animated.View style={{ transform: [{ scale: sendScale }] }}>
              <TouchableOpacity
                onPress={animateSend}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: COLORS.cyan,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: COLORS.cyanGlow,
                }}
              >
                <Text style={{ color: COLORS.cyan, fontSize: 17 }}>➤</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {/* ── FLOATING MENU CHIP ── */}
        {chatMode && (
          <Animated.View
            pointerEvents={!menuPeekVisible ? "auto" : "none"}
            style={{
              position: "absolute",
              right: 16,
              bottom: 88,
              zIndex: 30,
              elevation: 30,
              opacity: chipAnim,
              transform: [{ translateY: chipTranslateY }],
            }}
          >
            <TouchableOpacity
              onPress={showMenuPeek}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#09091a",
                borderWidth: 1.5,
                borderColor: COLORS.cyan,
                borderRadius: 24,
                paddingHorizontal: 14,
                paddingVertical: 10,
                shadowColor: "#00e5ff",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 7,
              }}
            >
              <Text
                style={{
                  color: COLORS.cyan,
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 11,
                  letterSpacing: 1,
                }}
              >
                ✨ MENU
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {chatMode && menuPeekVisible && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={hideMenuPeek}
            style={{
              position: "absolute",
              top: 150,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "transparent",
              zIndex: 5,
            }}
          />
        )}

        {/* ── MODALS ── */}
        <AddBirthdayModal
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onSave={handleDirectAdd}
        />
        <ViewAllModal
          visible={showAll}
          onClose={() => setShowAll(false)}
          birthdays={birthdays}
          onDelete={handleDelete}
        />
        <EditBirthdayModal
          visible={showEdit}
          onClose={() => setShowEdit(false)}
          birthdays={birthdays}
          onUpdate={handleUpdate}
        />
      </KeyboardAvoidingView>

      <FloatingWarningToast
        visible={mainWarningVisible}
        message={mainWarningMsg}
        onHide={() => setMainWarningVisible(false)}
      />
    </View>
  );
}
