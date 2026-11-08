import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Text,
  TextInput,
  TextInputInstance,
  TouchableOpacity,
  View,
} from "react-native";
import AddBirthdayModal from "../components/AddBirthdayModal";
import AIOrb from "../components/AIOrb";
import {
  ChatMessage,
  MessageBubble,
  TypingBubble,
} from "../components/ChatBubbles";
import EditBirthdayModal, {
  BirthdayEdit,
} from "../components/EditBirthdayModal";
import FloatingWarningToast from "../components/FloatingWarningToast";
import ViewAllModal from "../components/ViewAllModal";
import {
  CHAT_API_URL,
  CHAT_HISTORY_LIMIT,
  CHAT_MODEL,
  GROQ_API_KEY,
  USER_NAME,
  USING_DEFAULT_CHAT_API,
} from "../constants/config";
import { COLORS } from "../constants/theme";
import { useAnimations } from "../utils/animation";
import {
  createBirthday,
  removeBirthday,
  updateBirthday,
} from "../utils/birthdayService";
import { ChatAction, parseChatActions } from "../utils/chatActions";
import { confirmAsync } from "../utils/confirm";
import { MONTHS_SHORT, validateDate } from "../utils/dates";
import { Birthday, loadBirthdays } from "../utils/storage";

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

  return `You are Buddy, a simple and friendly birthday assistant inside BirthdayBuddy app. The user is ${USER_NAME}.

CURRENT SAVED BIRTHDAYS (name | day/month | relationship):
${list}

YOUR JOB:
- Help ${USER_NAME} add, update, or delete birthdays.
- Answer questions about saved birthdays.
- Be short, friendly and clear.
- Use the list above as the only source of truth.

WHEN SAVING A NEW BIRTHDAY:
SAVE_BIRTHDAY:{"name":"Name","day":5,"month":3,"relationship":"friend"}

WHEN CHANGING THE DATE OR RELATIONSHIP OF SOMEONE ALREADY SAVED:
Use SAVE_BIRTHDAY with the same name. The app updates the existing entry.

WHEN RENAMING SOMEONE:
DELETE_BIRTHDAY:{"name":"OldName"}
SAVE_BIRTHDAY:{"name":"NewName","day":5,"month":3,"relationship":"friend"}

WHEN DELETING:
DELETE_BIRTHDAY:{"name":"Name"}

RULES:
- day and month are always numbers (month 1-12).
- only use tags when sure.
- never make up birthday data.`;
};

// ── Main Screen ────────────────────────────────────────────
export default function Index() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: `Hey ${USER_NAME}! 👋 Add birthdays, view saved people, edit dates, or chat with me anytime. 🎂\n\nHeads-up: when you chat, your saved birthdays are sent to the AI provider so I can answer.`,
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
  const [mainWarningTitle, setMainWarningTitle] = useState("⚠ DATE ERROR");

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInputInstance>(null);
  const messageCounter = useRef(0);
  const lastScrollY = useRef(0);

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [activeDotOpacity] = useState(() => new Animated.Value(1));
  const [sendScale] = useState(() => new Animated.Value(1));
  const [menuAnim] = useState(() => new Animated.Value(1));
  const [chipAnim] = useState(() => new Animated.Value(0));

  const fetchBirthdays = useCallback(async () => {
    setBirthdays(await loadBirthdays());
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBirthdays();
    }, [fetchBirthdays]),
  );

  useAnimations((run) => {
    run(
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
    );
    run(
      Animated.loop(
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
      ),
    );
  });

  useAnimations(
    (run) => {
      run(
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
        ]),
      );
    },
    [menuPeekVisible, chatMode],
  );

  const showMainWarning = (msg: string, title = "⚠ DATE ERROR") => {
    setMainWarningTitle(title);
    setMainWarningMsg(msg);
    setMainWarningVisible(false);
    setTimeout(() => setMainWarningVisible(true), 20);
  };

  const addMessage = (content: string, isFromUser = false) => {
    messageCounter.current += 1;
    const id = `${Date.now()}-${messageCounter.current}`;
    setMessages((prev) => [...prev, { id, content, isFromUser }]);
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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
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

  // ── Changes made from the modals ───────────────────────
  // All of these go through birthdayService, which keeps local storage,
  // reminders, the device calendar and the cloud in step.
  const handleDirectAdd = async (
    name: string,
    day: string,
    month: string,
    rel: string,
  ) => {
    try {
      const created = await createBirthday({
        name,
        day: Number(day),
        month: Number(month),
        relationship: rel,
      });
      await fetchBirthdays();
      addMessage(
        `Done! 🎂 ${created.name}'s birthday on ${MONTHS_SHORT[created.month - 1]} ${created.day} is saved!`,
      );
    } catch (e) {
      console.error("Failed to add birthday:", e);
      showMainWarning("Couldn't save that birthday. Please try again.", "⚠ SAVE FAILED");
    }
  };

  const handleDelete = async (id: string) => {
    const person = birthdays.find((b) => b.id === id);
    const ok = await confirmAsync(
      "Delete birthday?",
      `Remove ${person?.name ?? "this birthday"}? This can't be undone.`,
    );
    if (!ok) return;
    try {
      await removeBirthday(id);
    } catch (e) {
      console.error("Failed to delete birthday:", e);
      showMainWarning("Couldn't delete that birthday. Please try again.", "⚠ DELETE FAILED");
    }
    await fetchBirthdays();
  };

  const handleUpdate = async (id: string, edit: BirthdayEdit) => {
    try {
      const updated = await updateBirthday(id, edit);
      await fetchBirthdays();
      if (updated) {
        addMessage(
          `Updated! ✏️ ${updated.name}'s birthday is now ${MONTHS_SHORT[updated.month - 1]} ${updated.day}.`,
        );
      }
    } catch (e) {
      console.error("Failed to update birthday:", e);
      showMainWarning("Couldn't save those changes. Please try again.", "⚠ SAVE FAILED");
    }
  };

  // ── Changes requested by the AI ────────────────────────
  const applyChatActions = async (actions: ChatAction[]): Promise<string[]> => {
    const notes: string[] = [];
    const savedNames = new Set(
      actions.filter((a) => a.type === "save").map((a) => a.name.toLowerCase()),
    );

    for (const action of actions) {
      try {
        const lower = action.name.toLowerCase();
        const matches = (await loadBirthdays()).filter(
          (b) => b.name.toLowerCase() === lower,
        );

        if (action.type === "delete") {
          // A delete paired with a save of the same name is an "update": the
          // save changes the existing entry in place.
          if (savedNames.has(lower)) continue;
          if (matches.length === 0) {
            notes.push(`I couldn't find "${action.name}" to delete.`);
            continue;
          }
          if (matches.length > 1) {
            notes.push(
              `There are ${matches.length} people named "${action.name}". Use VIEW to delete the right one.`,
            );
            continue;
          }
          const ok = await confirmAsync(
            "Delete birthday?",
            `Buddy wants to delete ${matches[0].name}. Delete it?`,
          );
          if (!ok) {
            notes.push(`Kept ${matches[0].name}.`);
            continue;
          }
          await removeBirthday(matches[0].id);
          continue;
        }

        const error = validateDate(
          String(action.day),
          String(action.month),
          USER_NAME,
        );
        if (error) {
          showMainWarning(error);
          notes.push(`Couldn't save ${action.name}: ${error}`);
          continue;
        }
        if (matches.length > 1) {
          notes.push(
            `There are ${matches.length} people named "${action.name}". Use EDIT to change the right one.`,
          );
          continue;
        }
        if (matches.length === 1) {
          await updateBirthday(matches[0].id, {
            day: action.day,
            month: action.month,
            relationship: action.relationship || matches[0].relationship,
          });
        } else {
          await createBirthday({
            name: action.name,
            day: action.day,
            month: action.month,
            relationship: action.relationship,
          });
        }
      } catch (e) {
        console.error("Chat action failed:", e);
        notes.push(`Something went wrong with "${action.name}".`);
      }
    }
    return notes;
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    if (USING_DEFAULT_CHAT_API && !GROQ_API_KEY) {
      showMainWarning(
        "Groq API key is missing. Add EXPO_PUBLIC_GROQ_API_KEY in your .env file.",
        "⚠ SETUP NEEDED",
      );
      return;
    }

    setMenuPeekVisible(false);
    addMessage(text, true);
    setInputText("");
    setIsTyping(true);

    const updatedHistory = [...chatHistory, { role: "user", content: text }];
    setChatHistory(updatedHistory);

    try {
      const freshBirthdays = await loadBirthdays();
      const response = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(GROQ_API_KEY ? { Authorization: `Bearer ${GROQ_API_KEY}` } : {}),
        },
        body: JSON.stringify({
          model: CHAT_MODEL,
          reasoning_effort: "low",
          messages: [
            { role: "system", content: buildSystemPrompt(freshBirthdays) },
            ...updatedHistory.slice(-CHAT_HISTORY_LIMIT),
          ],
          // Reasoning models spend part of this budget on hidden thinking.
          max_completion_tokens: 1024,
          temperature: 0.7,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || data?.error) {
        const detail = data?.error?.message ?? `HTTP ${response.status}`;
        console.error("Chat API error:", detail);
        addMessage(`Buddy hit an API error (${detail}). Try again in a moment.`);
        return;
      }

      const rawReply: string = data?.choices?.[0]?.message?.content ?? "";
      const { actions, text: displayText, invalidTags } =
        parseChatActions(rawReply);
      const notes = await applyChatActions(actions);
      if (invalidTags > 0) {
        notes.push(
          "I couldn't read part of that request, so nothing was changed for it.",
        );
      }

      await fetchBirthdays();
      setChatHistory([
        ...updatedHistory,
        { role: "assistant", content: rawReply },
      ]);

      const reply = [displayText, ...notes].filter(Boolean).join("\n\n");
      addMessage(
        reply ||
          (actions.length > 0
            ? "Done."
            : "I didn't get a reply that time. Try again?"),
      );
    } catch (e) {
      console.error("Chat request failed:", e);
      addMessage("Connection lost 😬 Try again!");
    } finally {
      setIsTyping(false);
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
                fontSize: 10,
                opacity: activeDotOpacity,
              }}
            >
              ●
            </Animated.Text>
            <Text
              style={{
                color: COLORS.green,
                fontSize: 10,
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
            {/* eslint-disable-next-line react-hooks/refs -- the action handlers only touch the input ref when pressed, never during render */}
            {actionButtons.map((btn) => (
              <TouchableOpacity
                key={btn.label}
                onPress={btn.onPress}
                accessibilityRole="button"
                accessibilityLabel={btn.label}
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
                    fontSize: 10,
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
          ListFooterComponent={isTyping ? <TypingBubble /> : undefined}
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
                accessibilityRole="button"
                accessibilityLabel="Send message"
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
              accessibilityRole="button"
              accessibilityLabel="Show menu"
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
          birthdays={birthdays}
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
        title={mainWarningTitle}
        onHide={() => setMainWarningVisible(false)}
      />
    </View>
  );
}
