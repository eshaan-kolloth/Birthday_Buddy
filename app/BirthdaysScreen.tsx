import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CalendarModal from "../components/CalendarModal";
import { COLORS, MONTH_COLORS } from "../constants/theme";
import ProgressRing from "../components/ProgressRing";
import { removeBirthday } from "../utils/birthdayService";
import { confirmAsync } from "../utils/confirm";
import {
  MONTHS_FULL as MONTHS,
  daysUntil,
  isToday as isTodayFn,
} from "../utils/dates";
import { Birthday, loadBirthdays } from "../utils/storage";
import { useAnimations } from "../utils/animation";

const { width } = Dimensions.get("window");

const getStatus = (m: number, d: number) => {
  const du = daysUntil(m, d);
  if (du === 0) return "TODAY";
  if (du === 1) return "TOMORROW";
  if (du <= 7) return `${du} DAYS LEFT`;
  return `${du} DAYS`;
};

// ── Animated Background Glows ─────────────────────────────────
const AnimatedGlow = () => {
  const [glow] = useState(() => new Animated.Value(0.35));
  useAnimations((run) => {
    run(Animated.loop(
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
    ));
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
  const [shimmer] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.92));
  const [opacity] = useState(() => new Animated.Value(0));
  useAnimations((run) => {
    run(Animated.parallel([
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
    ]));
    run(Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ));
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
              fontSize: 10,
              letterSpacing: 2.5,
              marginBottom: 4,
            }}
          >
            🎉 TODAY&apos;S BIRTHDAY
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
  const [fade] = useState(() => new Animated.Value(0));
  const [slide] = useState(() => new Animated.Value(-18));
  const [shimmer] = useState(() => new Animated.Value(0));
  const [blinkAnim] = useState(() => new Animated.Value(1));
  const [sweepAnim] = useState(() => new Animated.Value(0));
  const [calScale] = useState(() => new Animated.Value(1));

  useAnimations((run) => {
    run(Animated.parallel([
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
    ]));
    run(Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ));
    run(Animated.loop(
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
    ));
    run(Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ));
    run(Animated.loop(
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
    ));
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
          left: 0,
          width: width * 0.3,
          transform: [
            {
              translateX: sweepAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-width * 0.4, width * 1.2],
              }),
            },
          ],
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
                  fontSize: 10,
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
          <TouchableOpacity
            onPress={onCalendarOpen}
            accessibilityRole="button"
            accessibilityLabel="Open calendar"
            activeOpacity={0.8}
          >
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
                color: "#7C7C9A",
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
              <Text style={{ color: "#7C7C9A" }}>
                {getStatus(nextBirthday.month, nextBirthday.day).toLowerCase()}
              </Text>
            </Text>
          </View>
        )}

        {total === 0 && (
          <Text
            style={{
              color: "#7C7C9A",
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
                  color: "#7C7C9A",
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
                fontSize: 10,
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
        <Text style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 10 }}>
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
  const [fade] = useState(() => new Animated.Value(0));
  const [slideY] = useState(() => new Animated.Value(16));
  const [scale] = useState(() => new Animated.Value(0.96));

  useAnimations((run) => {
    run(Animated.parallel([
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
    ]));
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
              color: "#7C7C9A",
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
                  fontSize: 10,
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
                fontSize: 10,
                letterSpacing: 0.5,
              }}
            >
              {getStatus(item.month, item.day)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.name}`}
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
                fontSize: 10,
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

// ── MAIN SCREEN ───────────────────────────────────────────────
type ListItem =
  | { type: "month"; id: string; monthIndex: number; count: number }
  | { type: "card"; id: string; birthday: Birthday; animationIndex: number };

export default function BirthdaysScreen() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [query, setQuery] = useState("");

  const fetchBirthdays = useCallback(async () => {
    setBirthdays(await loadBirthdays());
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBirthdays();
    }, [fetchBirthdays]),
  );

  // removeBirthday updates local storage, reminders, the calendar and the cloud.
  const handleDelete = async (id: string) => {
    const person = birthdays.find((b) => b.id === id);
    const ok = await confirmAsync(
      "Remove birthday?",
      `Remove ${person?.name ?? "this birthday"}? This can't be undone.`,
      "Remove",
    );
    if (!ok) return;
    try {
      await removeBirthday(id);
    } catch (e) {
      console.error("Failed to remove birthday:", e);
    }
    await fetchBirthdays();
  };

  const todayBirthdays = birthdays.filter((b) => isTodayFn(b.month, b.day));

  const needle = query.trim().toLowerCase();
  const sortedBirthdays = birthdays
    .filter(
      (b) =>
        !needle ||
        b.name.toLowerCase().includes(needle) ||
        (b.relationship ?? "").toLowerCase().includes(needle),
    )
    .sort((a, b) => (a.month !== b.month ? a.month - b.month : a.day - b.day));

  const groupedByMonth = MONTHS.map((_, index) =>
    sortedBirthdays.filter((b) => b.month === index + 1),
  );
  const activeMonths = new Set(birthdays.map((b) => b.month)).size;
  const nextBirthday = [...birthdays].sort(
    (a, b) => daysUntil(a.month, a.day) - daysUntil(b.month, b.day),
  )[0];

  const listData: ListItem[] = [];
  groupedByMonth.forEach((group, monthIndex) => {
    if (group.length === 0) return;
    listData.push({
      type: "month",
      id: `month-${monthIndex + 1}`,
      monthIndex,
      count: group.length,
    });
    group.forEach((birthday, index) => {
      listData.push({
        type: "card",
        id: birthday.id,
        birthday,
        animationIndex: index,
      });
    });
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
              color: "#7C7C9A",
              fontFamily: "Exo2_400Regular",
              fontSize: 13.5,
              marginTop: 12,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {
              "Add birthdays from the Chat tab (➕ ADD, or just ask Buddy) and they'll appear here, sorted month by month."
            }
          </Text>
        </View>
      ) : (
        <>
          <View style={{ marginHorizontal: 16, marginTop: 12 }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search name or relationship…"
              placeholderTextColor={COLORS.textMuted}
              accessibilityLabel="Search birthdays"
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              style={{
                backgroundColor: "#090C15",
                borderWidth: 1,
                borderColor: "#141B2A",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: COLORS.textPrimary,
                fontFamily: "Exo2_400Regular",
                fontSize: 14,
              }}
            />
          </View>
          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 6, paddingBottom: 36 }}
            ListEmptyComponent={
              <Text
                style={{
                  color: COLORS.textMuted,
                  fontFamily: "Exo2_400Regular",
                  fontSize: 13,
                  textAlign: "center",
                  marginTop: 32,
                }}
              >
                {`No matches for “${query.trim()}”.`}
              </Text>
            }
            renderItem={({ item }) =>
              item.type === "month" ? (
                <MonthSection monthIndex={item.monthIndex} count={item.count} />
              ) : (
                <BirthdayCard
                  item={item.birthday}
                  index={item.animationIndex}
                  onDelete={handleDelete}
                />
              )
            }
          />
        </>
      )}
      <CalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        birthdays={birthdays}
      />
    </View>
  );
}
