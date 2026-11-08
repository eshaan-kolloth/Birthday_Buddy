import { useEffect, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { USER_NAME } from "../constants/config";
import { COLORS } from "../constants/theme";
import { MONTHS_SHORT, validateDate } from "../utils/dates";
import { Birthday } from "../utils/storage";
import FloatingWarningToast from "./FloatingWarningToast";
import { inputStyle, labelStyle } from "./formStyles";

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


const validate = (day: string, month: string) =>
  validateDate(day, month, USER_NAME);

// ── Add Birthday Modal ─────────────────────────────────────
const AddBirthdayModal = ({
  visible,
  onClose,
  birthdays,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  birthdays: Birthday[];
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

  const [cardPulse] = useState(() => new Animated.Value(1));

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
    // cardPulse is a stable Animated.Value; only `visible` should restart the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const error = validate(clean, month);
        if (error) showModalWarning(error);
      }
    }
  };

  const handleMonthSelect = (m: string) => {
    setMonth(m);
    if (day) {
      const error = validate(day, m);
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
    const error = validate(day, month);
    if (error) {
      showModalWarning(error);
      return;
    }
    const alreadySaved = birthdays.some(
      (b) =>
        b.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        b.day === Number(day) &&
        b.month === Number(month),
    );
    if (alreadySaved) {
      showModalWarning(
        `${name.trim()} (${MONTHS_SHORT[Number(month) - 1]} ${Number(day)}) is already saved.`,
      );
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
                  accessibilityRole="button"
                  accessibilityLabel="Close"
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
                              fontSize: 10,
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
                accessibilityRole="button"
                accessibilityLabel="Save birthday"
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


export default AddBirthdayModal;
