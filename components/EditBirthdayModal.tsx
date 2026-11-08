import { useState } from "react";
import {
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

export interface BirthdayEdit {
  name: string;
  day: number;
  month: number;
  relationship: string;
  notes: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  birthdays: Birthday[];
  onUpdate: (id: string, edit: BirthdayEdit) => void;
}

export default function EditBirthdayModal({
  visible,
  onClose,
  birthdays,
  onUpdate,
}: Props) {
  const [selected, setSelected] = useState<Birthday | null>(null);
  const [name, setName] = useState("");
  const [newDay, setNewDay] = useState("");
  const [newMonth, setNewMonth] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");

  const showModalWarning = (msg: string) => {
    setWarningMsg(msg);
    setWarningVisible(false);
    setTimeout(() => setWarningVisible(true), 20);
  };

  const reset = () => {
    setSelected(null);
    setName("");
    setNewDay("");
    setNewMonth("");
    setRelationship("");
    setNotes("");
    setWarningVisible(false);
  };

  const choose = (b: Birthday) => {
    setSelected(b);
    setName(b.name);
    setNewDay(String(b.day));
    setNewMonth(String(b.month));
    setRelationship(b.relationship ?? "");
    setNotes(b.notes ?? "");
  };

  const checkDate = (day: string, month: string) => {
    if (!day || !month) return;
    const error = validateDate(day, month, USER_NAME);
    if (error) showModalWarning(error);
  };

  const handleUpdate = () => {
    if (!selected) return;
    if (!name.trim()) {
      showModalWarning("The name can't be empty.");
      return;
    }
    const error = validateDate(newDay, newMonth, USER_NAME);
    if (error) {
      showModalWarning(error);
      return;
    }
    onUpdate(selected.id, {
      name: name.trim(),
      day: Number(newDay),
      month: Number(newMonth),
      relationship: relationship.trim().toLowerCase(),
      notes: notes.trim(),
    });
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
              height: "88%",
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
                  accessibilityRole="button"
                  accessibilityLabel="Close"
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
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${b.name}`}
                      onPress={() => choose(b)}
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
                          fontSize: 10,
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
                  <Text style={labelStyle}>NAME</Text>
                  <TextInput
                    style={[inputStyle, { borderColor: COLORS.green }]}
                    placeholder="Name"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />

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
                            checkDate(clean, newMonth);
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
                        keyboardShouldPersistTaps="always"
                      >
                        {MONTHS_SHORT.map((m, i) => {
                          const sel = newMonth === String(i + 1);
                          return (
                            <TouchableOpacity
                              key={m}
                              accessibilityRole="button"
                              accessibilityLabel={m}
                              onPress={() => {
                                const val = String(i + 1);
                                setNewMonth(val);
                                checkDate(newDay, val);
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
                                  fontSize: 10,
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
                  <TextInput
                    style={[inputStyle, { borderColor: COLORS.purple }]}
                    placeholder="friend, mom, colleague…"
                    placeholderTextColor={COLORS.textMuted}
                    value={relationship}
                    onChangeText={setRelationship}
                    autoCapitalize="none"
                  />

                  <Text style={labelStyle}>NOTES</Text>
                  <TextInput
                    style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
                    placeholder="Gift ideas, favourite cake…"
                    placeholderTextColor={COLORS.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Save changes"
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
                      SAVE CHANGES ✓
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
}
