import { useEffect, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";

// ── Floating Warning Toast ─────────────────────────────────
const FloatingWarningToast = ({
  visible,
  message,
  onHide,
  insideModal = false,
  title = "⚠ DATE ERROR",
}: {
  visible: boolean;
  message: string;
  onHide: () => void;
  insideModal?: boolean;
  title?: string;
}) => {
  const [slideX] = useState(() => new Animated.Value(-360));
  const [opacity] = useState(() => new Animated.Value(0));
  const [shake] = useState(() => new Animated.Value(0));

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
    // The effect only needs to re-run when `visible` flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {title}
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


export default FloatingWarningToast;
