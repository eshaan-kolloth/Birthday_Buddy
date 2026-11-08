import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/theme";
import { MONTHS_SHORT } from "../utils/dates";
import { Birthday } from "../utils/storage";

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
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
            >
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
                      fontSize: 10,
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
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.name}`}
                  onPress={() => onDelete(item.id)}
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


export default ViewAllModal;
