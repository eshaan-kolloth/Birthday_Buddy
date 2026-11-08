import { useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MONTH_COLORS } from "../constants/theme";
import { MONTHS_FULL as MONTHS, daysUntil } from "../utils/dates";
import { Birthday } from "../utils/storage";
import { useAnimations } from "../utils/animation";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const getDaysInMonth = (month: number, year: number) =>
  new Date(year, month, 0).getDate();
const getFirstDayOfMonth = (month: number, year: number) =>
  new Date(year, month - 1, 1).getDay();

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
          <Text style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 10 }}>
            {Object.keys(bdMap).length} BIRTHDAYS
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                color: "#7C7C9A",
                fontFamily: "Orbitron_700Bold",
                fontSize: 10,
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
                      color: isToday ? "#ffffff" : hasBd ? color : "#7C7C9A",
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
                      fontSize: 10,
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
  const [scaleA] = useState(() => new Animated.Value(0.88));
  const [fadeA] = useState(() => new Animated.Value(0));
  useAnimations((run) => {
    run(Animated.parallel([
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
    ]));
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
          <Text style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 10 }}>
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
                    fontSize: 10,
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
                  color: "#7C7C9A",
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
                color: "#7C7C9A",
                fontFamily: "Orbitron_700Bold",
                fontSize: 10,
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
          fontSize: 10,
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
                  color: "#7C7C9A",
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
                style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 10 }}
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
                color: active ? color : hasBday ? color + "99" : "#5A5A78",
                fontFamily: "Orbitron_700Bold",
                fontSize: 10,
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
              color: "#7C7C9A",
              fontFamily: "Exo2_400Regular",
              fontSize: 10,
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
  const [slideAnim] = useState(() => new Animated.Value(80));
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [contentFade] = useState(() => new Animated.Value(1));

  useAnimations((run) => {
    if (visible) {
      setSelectedDate(null);
      setCurrentMonthIdx(currentMonth);
      setViewMode("current");
      run(Animated.parallel([
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
      ]));
    } else {
      run(Animated.parallel([
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
      ]));
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
                    fontSize: 10,
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
                      color: viewMode === btn.mode ? "#00E5FF" : "#7C7C9A",
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
                          color: "#7C7C9A",
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
                            fontSize: 10,
                          }}
                        >
                          1
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: "#7C7C9A",
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


export default CalendarModal;
