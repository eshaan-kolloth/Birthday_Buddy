import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, Text, View } from "react-native";
import { COLORS } from "../constants/theme";
import { Birthday, loadBirthdays } from "../utils/storage";

const MONTHS_SHORT = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const MONTHS_FULL = [
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

const getDaysUntil = (month: number, day: number) => {
  const now = new Date();
  const next = new Date(now.getFullYear(), month - 1, day);
  if (next <= now) next.setFullYear(now.getFullYear() + 1);
  return Math.ceil((next.getTime() - now.getTime()) / 86400000);
};

const isToday = (month: number, day: number) => {
  const t = new Date();
  return month === t.getMonth() + 1 && day === t.getDate();
};

const groupByDate = (birthdays: Birthday[]) => {
  const groups: Record<string, Birthday[]> = {};
  birthdays.forEach((b) => {
    const key = `${b.month}-${b.day}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });
  return groups;
};

const getUpcomingGroups = (birthdays: Birthday[]) => {
  const groups = groupByDate(birthdays);
  return Object.entries(groups)
    .map(([key, people]) => ({
      key,
      people,
      daysUntil: getDaysUntil(people[0].month, people[0].day),
      month: people[0].month,
      day: people[0].day,
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
};

// ── Section Header ─────────────────────────────────────────
const SectionHeader = ({
  title,
  subtitle,
  color,
  icon,
}: {
  title: string;
  subtitle?: string;
  color: string;
  icon: string;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 10,
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: color + "22",
            borderWidth: 1.5,
            borderColor: color,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 15 }}>{icon}</Text>
        </View>
        <View>
          <Text
            style={{
              color,
              fontFamily: "Orbitron_700Bold",
              fontSize: 12,
              letterSpacing: 2,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                color: COLORS.textMuted,
                fontFamily: "Exo2_400Regular",
                fontSize: 10,
                letterSpacing: 1,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Animated.View
        style={{ height: 1, backgroundColor: color, opacity: glowAnim }}
      />
    </Animated.View>
  );
};

// ── Stat Card ──────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  color,
  delay = 0,
}: {
  label: string;
  value: number;
  color: string;
  delay?: number;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        margin: 5,
        backgroundColor: COLORS.bgSurface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: "center",
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      }}
    >
      <Animated.Text
        style={{
          color,
          fontFamily: "Orbitron_700Bold",
          fontSize: 32,
          letterSpacing: 2,
          opacity: glowAnim,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 8,
        }}
      >
        {value}
      </Animated.Text>
      <Text
        style={{
          color: COLORS.textSecondary,
          fontFamily: "Exo2_400Regular",
          fontSize: 9,
          marginTop: 4,
          textAlign: "center",
          letterSpacing: 1.5,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

// ── Next Birthday Banner ───────────────────────────────────
const NextBirthdayBanner = ({
  groups,
}: {
  groups: ReturnType<typeof getUpcomingGroups>;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  if (!groups[0]) {
    return (
      <Animated.View
        style={{
          marginHorizontal: 16,
          marginTop: 4,
          backgroundColor: COLORS.bgSurface,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: COLORS.borderSubtle,
          alignItems: "center",
          opacity: fadeAnim,
        }}
      >
        <Text
          style={{
            color: COLORS.textMuted,
            fontFamily: "Exo2_400Regular",
            fontSize: 13,
          }}
        >
          No birthdays saved yet 🎂
        </Text>
      </Animated.View>
    );
  }

  const { people, daysUntil, month, day } = groups[0];
  const todayB = isToday(month, day);
  const months = Math.floor(daysUntil / 30);
  const days = daysUntil % 30;
  const isGroup = people.length > 1;

  // ── EXACT replica of your old banner — hot pink + orange + cyan ──
  return (
    <Animated.View
      style={{
        marginHorizontal: 16,
        marginTop: 4,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
      }}
    >
      {/* Outer glow layer */}
      <Animated.View
        style={{
          position: "absolute",
          top: -4,
          left: -4,
          right: -4,
          bottom: -4,
          borderRadius: 20,
          backgroundColor: "#ff008015",
          opacity: glowAnim,
        }}
      />

      <View
        style={{
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: "#ff0080",
          backgroundColor: "#08000d",
          shadowColor: "#ff0080",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 20,
        }}
      >
        {/* Orange top accent line */}
        <View style={{ height: 3, backgroundColor: "#ff6600" }} />

        <View style={{ padding: 16 }}>
          {/* Top labels row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <View
              style={{
                backgroundColor: "#ff008022",
                borderWidth: 1,
                borderColor: "#ff0080",
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Animated.View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: "#ff0080",
                  opacity: blinkAnim,
                }}
              />
              <Text
                style={{
                  color: "#ff0080",
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 9,
                  letterSpacing: 2,
                }}
              >
                {isGroup ? `${people.length} PEOPLE · NEXT` : "NEXT BIRTHDAY"}
              </Text>
            </View>

            <Animated.View
              style={{
                backgroundColor: todayB ? "#ffcc0022" : "#ff660022",
                borderWidth: 1,
                borderColor: todayB ? "#ffcc00" : "#ff6600",
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 4,
                opacity: blinkAnim,
              }}
            >
              <Text
                style={{
                  color: todayB ? "#ffcc00" : "#ff6600",
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 9,
                  letterSpacing: 2,
                }}
              >
                {todayB ? "🎉 TODAY" : "INCOMING"}
              </Text>
            </Animated.View>
          </View>

          {/* ── People list — stacked one below the other ── */}
          {people.map((person, i) => (
            <View
              key={person.id}
              style={{
                paddingVertical: i > 0 ? 10 : 0,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: "#ff008025",
                marginTop: i > 0 ? 4 : 0,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "Orbitron_700Bold",
                  fontSize: isGroup ? 16 : 20,
                  letterSpacing: 2,
                  shadowColor: "#ff0080",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 8,
                }}
              >
                {person.name.toUpperCase()}
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontFamily: "Exo2_400Regular",
                  fontSize: 11,
                  letterSpacing: 1,
                  marginTop: 2,
                }}
              >
                {MONTHS_FULL[person.month - 1]} {person.day}
                {person.relationship ? `  ·  ${person.relationship}` : ""}
              </Text>
            </View>
          ))}

          {/* Divider */}
          <Animated.View
            style={{
              height: 1,
              backgroundColor: "#ff0080",
              opacity: glowAnim,
              marginTop: 14,
              marginBottom: 14,
            }}
          />

          {/* Countdown numbers — cyan like old banner */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            {[
              {
                value: todayB ? "00" : String(months).padStart(2, "0"),
                label: "MONTHS",
              },
              {
                value: todayB ? "00" : String(days).padStart(2, "0"),
                label: "DAYS",
              },
              { value: String(daysUntil), label: "TOTAL DAYS" },
            ].map((item, index) => (
              <View key={item.label} style={{ alignItems: "center", flex: 1 }}>
                <Animated.Text
                  style={{
                    color: COLORS.cyan,
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 28,
                    letterSpacing: 2,
                    opacity: glowAnim,
                    shadowColor: COLORS.cyan,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 1,
                    shadowRadius: 12,
                  }}
                >
                  {item.value}
                </Animated.Text>
                <Text
                  style={{
                    color: "#ff6600",
                    fontFamily: "Orbitron_700Bold",
                    fontSize: 7,
                    letterSpacing: 2,
                    marginTop: 4,
                  }}
                >
                  {item.label}
                </Text>
                {index < 2 && (
                  <Animated.Text
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 2,
                      color: "#ff0080",
                      fontFamily: "Orbitron_700Bold",
                      fontSize: 22,
                      opacity: blinkAnim,
                    }}
                  >
                    :
                  </Animated.Text>
                )}
              </View>
            ))}
          </View>

          {/* Bottom scan line */}
          <Animated.View
            style={{
              marginTop: 14,
              height: 1,
              backgroundColor: "#ff6600",
              opacity: glowAnim,
            }}
          />
          <Text
            style={{
              color: COLORS.textMuted,
              fontFamily: "Exo2_400Regular",
              fontSize: 9,
              letterSpacing: 2,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            SYSTEM TRACKING ACTIVE
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ── This Month Spotlight ───────────────────────────────────
const ThisMonthSpotlight = ({ birthdays }: { birthdays: Birthday[] }) => {
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisMonthB = birthdays.filter((b) => b.month === thisMonth);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const groups = groupByDate(thisMonthB);
  const sortedGroups = Object.entries(groups).sort(
    (a, b) => a[1][0].day - b[1][0].day,
  );

  return (
    <Animated.View
      style={{
        marginHorizontal: 16,
        marginTop: 4,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          backgroundColor: COLORS.bgSurface,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: COLORS.purple,
          overflow: "hidden",
          shadowColor: COLORS.purple,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
        }}
      >
        <View style={{ height: 2, backgroundColor: COLORS.purple }} />
        <View style={{ padding: 14 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                color: COLORS.purple,
                fontFamily: "Orbitron_700Bold",
                fontSize: 11,
                letterSpacing: 2,
              }}
            >
              🌙 {MONTHS_FULL[thisMonth - 1].toUpperCase()}
            </Text>
            <View
              style={{
                backgroundColor: COLORS.purple + "22",
                borderWidth: 1,
                borderColor: COLORS.purple,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  color: COLORS.purple,
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 9,
                }}
              >
                {thisMonthB.length} BIRTHDAYS
              </Text>
            </View>
          </View>

          {thisMonthB.length === 0 ? (
            <Text
              style={{
                color: COLORS.textMuted,
                fontFamily: "Exo2_400Regular",
                fontSize: 12,
                textAlign: "center",
                paddingVertical: 8,
              }}
            >
              No birthdays this month 🌙
            </Text>
          ) : (
            sortedGroups.map(([dateKey, people], gi) => {
              const today = isToday(people[0].month, people[0].day);
              const daysLeft = getDaysUntil(people[0].month, people[0].day);
              const isShared = people.length > 1;
              return (
                <View
                  key={dateKey}
                  style={{
                    paddingVertical: 8,
                    borderTopWidth: gi > 0 ? 1 : 0,
                    borderTopColor: COLORS.borderSubtle,
                  }}
                >
                  {isShared && (
                    <View
                      style={{
                        backgroundColor: "#ffcc0015",
                        borderWidth: 1,
                        borderColor: "#ffcc0060",
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        marginBottom: 6,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          color: "#ffcc00",
                          fontFamily: "Orbitron_700Bold",
                          fontSize: 8,
                          letterSpacing: 1,
                        }}
                      >
                        🎊 {people.length} SHARE THIS DAY
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      {people.map((person, pi) => (
                        <View
                          key={person.id}
                          style={{ marginTop: pi > 0 ? 4 : 0 }}
                        >
                          <Text
                            style={{
                              color: COLORS.textBright,
                              fontFamily: "Exo2_400Regular",
                              fontSize: 14,
                            }}
                          >
                            {person.name}
                          </Text>
                          <Text
                            style={{
                              color: COLORS.textMuted,
                              fontFamily: "Exo2_400Regular",
                              fontSize: 10,
                              marginTop: 1,
                            }}
                          >
                            {MONTHS_FULL[person.month - 1]} {person.day}
                            {person.relationship
                              ? `  ·  ${person.relationship}`
                              : ""}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <View
                      style={{
                        backgroundColor: today
                          ? "#ffcc0022"
                          : COLORS.purple + "22",
                        borderWidth: 1,
                        borderColor: today ? "#ffcc00" : COLORS.purple,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        alignItems: "center",
                        minWidth: 54,
                        marginLeft: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: today ? "#ffcc00" : COLORS.purple,
                          fontFamily: "Orbitron_700Bold",
                          fontSize: 14,
                        }}
                      >
                        {today ? "🎉" : daysLeft}
                      </Text>
                      <Text
                        style={{
                          color: today ? "#ffcc00" : COLORS.purple,
                          fontFamily: "Orbitron_700Bold",
                          fontSize: 7,
                          letterSpacing: 1,
                        }}
                      >
                        {today ? "TODAY" : "DAYS"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// ── Quick Facts ────────────────────────────────────────────
const QuickFacts = ({
  birthdays,
  groups,
}: {
  birthdays: Birthday[];
  groups: ReturnType<typeof getUpcomingGroups>;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const now = new Date();
  const thisMonth = now.getMonth() + 1;

  const nextGroup = groups[0];
  const todayBirthdays = birthdays.filter((b) => isToday(b.month, b.day));

  const busyMonthIdx = MONTHS_SHORT.map(
    (_, i) => birthdays.filter((b) => b.month === i + 1).length,
  ).indexOf(
    Math.max(
      ...MONTHS_SHORT.map(
        (_, i) => birthdays.filter((b) => b.month === i + 1).length,
      ),
    ),
  );

  // ── NEXT UP: show all people on the nearest date, stacked ──
  const nextUpPeople = nextGroup ? nextGroup.people : [];
  const nextUpDays = nextGroup ? nextGroup.daysUntil : 0;

  // TODAY: all people
  const todayValue =
    todayBirthdays.length > 0
      ? todayBirthdays.map((b) => b.name).join("\n")
      : "No birthdays today";

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{ marginHorizontal: 16, marginTop: 4, opacity: fadeAnim }}
    >
      {/* ── NEXT UP card — stacked names ── */}
      <View
        style={{
          backgroundColor: COLORS.bgSurface,
          borderRadius: 12,
          padding: 12,
          marginBottom: 7,
          borderWidth: 1,
          borderColor: "#ff008044",
          shadowColor: "#ff0080",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: nextUpPeople.length > 0 ? 10 : 0,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              backgroundColor: "#ff008018",
              borderWidth: 1,
              borderColor: "#ff008066",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>🎯</Text>
          </View>
          <View>
            <Text
              style={{
                color: COLORS.textMuted,
                fontFamily: "Exo2_400Regular",
                fontSize: 9,
                letterSpacing: 1.5,
                marginBottom: 2,
              }}
            >
              NEXT UP
            </Text>
            {nextUpPeople.length === 0 && (
              <Text
                style={{
                  color: "#ff0080",
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 11,
                  letterSpacing: 0.5,
                }}
              >
                None saved
              </Text>
            )}
          </View>
          {nextUpPeople.length > 0 && (
            <View
              style={{
                marginLeft: "auto",
                backgroundColor: "#ff008022",
                borderWidth: 1,
                borderColor: "#ff0080",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  color: "#ff0080",
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 9,
                }}
              >
                IN {nextUpDays}D
              </Text>
            </View>
          )}
        </View>

        {/* Stacked people — one below the other */}
        {nextUpPeople.map((person, i) => (
          <View
            key={person.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 6,
              borderTopWidth: i > 0 ? 1 : 1,
              borderTopColor: "#ff008020",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#ff0080",
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#ff0080",
                  fontFamily: "Orbitron_700Bold",
                  fontSize: 12,
                  letterSpacing: 0.5,
                }}
              >
                {person.name}
              </Text>
              <Text
                style={{
                  color: COLORS.textMuted,
                  fontFamily: "Exo2_400Regular",
                  fontSize: 10,
                  marginTop: 1,
                }}
              >
                {MONTHS_FULL[person.month - 1]} {person.day}
                {person.relationship ? `  ·  ${person.relationship}` : ""}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Other fact cards ── */}
      {[
        {
          icon: "📅",
          label: "BUSIEST MONTH",
          value: birthdays.length > 0 ? MONTHS_FULL[busyMonthIdx] : "—",
          color: COLORS.cyan,
        },
        {
          icon: "🎉",
          label: "TODAY",
          value: todayValue,
          color: "#ffcc00",
        },
        {
          icon: "👥",
          label: "TOTAL PEOPLE",
          value: `${birthdays.length} saved`,
          color: COLORS.green,
        },
        {
          icon: "🗓️",
          label: "THIS MONTH",
          value: `${birthdays.filter((b) => b.month === thisMonth).length} birthday${birthdays.filter((b) => b.month === thisMonth).length !== 1 ? "s" : ""}`,
          color: COLORS.purple,
        },
      ].map((fact) => (
        <View
          key={fact.label}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.bgSurface,
            borderRadius: 12,
            padding: 12,
            marginBottom: 7,
            borderWidth: 1,
            borderColor: fact.color + "44",
            shadowColor: fact.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              backgroundColor: fact.color + "18",
              borderWidth: 1,
              borderColor: fact.color + "66",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 16 }}>{fact.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: COLORS.textMuted,
                fontFamily: "Exo2_400Regular",
                fontSize: 9,
                letterSpacing: 1.5,
                marginBottom: 2,
              }}
            >
              {fact.label}
            </Text>
            <Text
              style={{
                color: fact.color,
                fontFamily: "Orbitron_700Bold",
                fontSize: 11,
                letterSpacing: 0.5,
              }}
            >
              {fact.value}
            </Text>
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

// ── Relationship Bar ───────────────────────────────────────
const RelationshipBar = ({
  label,
  count,
  pct,
  color,
  delay,
  emoji,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
  delay: number;
  emoji: string;
}) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct,
      duration: 900,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={{ marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 5,
        }}
      >
        <Text
          style={{
            color: COLORS.textBright,
            fontFamily: "Exo2_400Regular",
            fontSize: 13,
          }}
        >
          {emoji} {label.charAt(0).toUpperCase() + label.slice(1)}
        </Text>
        <Text style={{ color, fontFamily: "Orbitron_700Bold", fontSize: 11 }}>
          {count} · {Math.round(pct * 100)}%
        </Text>
      </View>
      <View
        style={{
          height: 7,
          backgroundColor: COLORS.bgDeep,
          borderRadius: 4,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: COLORS.borderSubtle,
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 4,
            backgroundColor: color,
            width: barAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
          }}
        />
      </View>
    </View>
  );
};

// ── Relationship Breakdown ─────────────────────────────────
const RelationshipBreakdown = ({ birthdays }: { birthdays: Birthday[] }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const groups: Record<string, number> = {};
  birthdays.forEach((b) => {
    const key = b.relationship ? b.relationship.toLowerCase() : "other";
    groups[key] = (groups[key] || 0) + 1;
  });

  const sorted = Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const total = birthdays.length || 1;
  const colorsList = [
    COLORS.cyan,
    COLORS.purple,
    "#ff6600",
    COLORS.green,
    "#ff0080",
  ];
  const emojis: Record<string, string> = {
    friend: "🤝",
    mom: "👩",
    dad: "👨",
    sister: "👧",
    brother: "👦",
    partner: "💝",
    spouse: "💍",
    colleague: "💼",
    cousin: "👫",
    dog: "🐶",
    cat: "🐱",
    other: "⭐",
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  if (birthdays.length === 0) return null;

  return (
    <Animated.View
      style={{
        marginHorizontal: 16,
        marginTop: 4,
        backgroundColor: COLORS.bgSurface,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: COLORS.borderSubtle,
        padding: 14,
        opacity: fadeAnim,
      }}
    >
      {sorted.map(([key, count], i) => (
        <RelationshipBar
          key={key}
          label={key}
          count={count}
          pct={count / total}
          color={colorsList[i] || COLORS.cyan}
          delay={i * 100}
          emoji={emojis[key] || "⭐"}
        />
      ))}
    </Animated.View>
  );
};

// ── Bar Chart ──────────────────────────────────────────────
const BarChart = ({ birthdays }: { birthdays: Birthday[] }) => {
  const monthCounts = MONTHS_SHORT.map(
    (_, i) => birthdays.filter((b) => b.month === i + 1).length,
  );
  const maxCount = Math.max(...monthCounts, 1);
  const animValues = useRef(
    MONTHS_SHORT.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    Animated.parallel(
      monthCounts.map((count, index) =>
        Animated.timing(animValues[index], {
          toValue: count / maxCount,
          duration: 900,
          delay: index * 60,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [birthdays.length]);

  return (
    <View
      style={{
        backgroundColor: COLORS.bgSurface,
        borderRadius: 14,
        padding: 14,
        marginHorizontal: 16,
        marginTop: 4,
        borderWidth: 1.5,
        borderColor: COLORS.borderSubtle,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          height: 80,
          gap: 2,
        }}
      >
        {monthCounts.map((count, index) => (
          <View
            key={MONTHS_SHORT[index]}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text
              style={{
                color: count > 0 ? COLORS.cyan : "transparent",
                fontSize: 7,
                fontFamily: "Orbitron_700Bold",
                marginBottom: 2,
              }}
            >
              {count > 0 ? count : "·"}
            </Text>
            <Animated.View
              style={{
                width: "70%",
                borderRadius: 3,
                height: animValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, 58],
                }),
                backgroundColor:
                  count === 0 ? COLORS.borderSubtle : COLORS.cyan,
                shadowColor: COLORS.cyan,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: count > 0 ? 0.8 : 0,
                shadowRadius: 5,
              }}
            />
            <Text
              style={{
                color: COLORS.textMuted,
                fontSize: 6,
                fontFamily: "Exo2_400Regular",
                marginTop: 4,
              }}
            >
              {MONTHS_SHORT[index]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Main Screen ────────────────────────────────────────────
export default function StatsScreen() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadBirthdays().then(setBirthdays);
    }, []),
  );

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const total = birthdays.length;
  const todayCount = birthdays.filter((b) => isToday(b.month, b.day)).length;
  const upcomingCount = birthdays.filter(
    (b) => getDaysUntil(b.month, b.day) <= 30,
  ).length;
  const thisMonthCount = birthdays.filter((b) => b.month === thisMonth).length;
  const upcomingGroups = getUpcomingGroups(birthdays);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDeep }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 50, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── OVERVIEW ── */}
        <SectionHeader
          title="OVERVIEW"
          subtitle="Your birthday universe"
          color={COLORS.cyan}
          icon="📡"
        />
        <View style={{ flexDirection: "row", marginHorizontal: 10 }}>
          <StatCard
            label="TOTAL SAVED"
            value={total}
            color={COLORS.cyan}
            delay={0}
          />
          <StatCard
            label="THIS MONTH"
            value={thisMonthCount}
            color={COLORS.purple}
            delay={100}
          />
        </View>
        <View style={{ flexDirection: "row", marginHorizontal: 10 }}>
          <StatCard
            label="NEXT 30 DAYS"
            value={upcomingCount}
            color={"#ff6600"}
            delay={200}
          />
          <StatCard
            label="TODAY"
            value={todayCount}
            color={"#ffcc00"}
            delay={300}
          />
        </View>

        {/* ── NEXT BIRTHDAY ── */}
        <SectionHeader
          title="NEXT BIRTHDAY"
          subtitle="Countdown to the next celebration"
          color={"#ff0080"}
          icon="🎯"
        />
        <NextBirthdayBanner groups={upcomingGroups} />

        {/* ── THIS MONTH ── */}
        <SectionHeader
          title="THIS MONTH"
          subtitle={`Birthdays in ${MONTHS_FULL[now.getMonth()]}`}
          color={COLORS.purple}
          icon="🌙"
        />
        <ThisMonthSpotlight birthdays={birthdays} />

        {/* ── QUICK FACTS ── */}
        <SectionHeader
          title="QUICK FACTS"
          subtitle="Smart insights about your people"
          color={"#ffcc00"}
          icon="⚡"
        />
        <QuickFacts birthdays={birthdays} groups={upcomingGroups} />

        {/* ── RELATIONSHIP BREAKDOWN ── */}
        {birthdays.length > 0 && (
          <>
            <SectionHeader
              title="WHO YOU TRACK"
              subtitle="Relationship breakdown"
              color={COLORS.green}
              icon="👥"
            />
            <RelationshipBreakdown birthdays={birthdays} />
          </>
        )}

        {/* ── DISTRIBUTION CHART ── */}
        <SectionHeader
          title="YEARLY DISTRIBUTION"
          subtitle="Birthdays spread across months"
          color={COLORS.cyan}
          icon="📈"
        />
        <BarChart birthdays={birthdays} />

        {/* ── EMPTY STATE ── */}
        {total === 0 && (
          <View
            style={{ alignItems: "center", paddingTop: 20, paddingBottom: 40 }}
          >
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎂</Text>
            <Text
              style={{
                color: COLORS.textMuted,
                fontFamily: "Orbitron_700Bold",
                fontSize: 11,
                letterSpacing: 2,
                textAlign: "center",
              }}
            >
              NO DATA YET
            </Text>
            <Text
              style={{
                color: COLORS.textMuted,
                fontFamily: "Exo2_400Regular",
                fontSize: 12,
                marginTop: 8,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Add birthdays from the Chat tab{"\n"}and they'll appear here! 😊
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
