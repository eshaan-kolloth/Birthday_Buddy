import { DependencyList, useEffect } from "react";
import { Animated } from "react-native";

type Run = (animation: Animated.CompositeAnimation) => void;

/**
 * Like `useEffect`, but animations started through `run` are stopped when the
 * component unmounts or `deps` change, so loops never outlive their screen.
 */
export function useAnimations(
  setup: (run: Run) => void,
  deps: DependencyList = [],
) {
  useEffect(() => {
    const running: Animated.CompositeAnimation[] = [];
    setup((animation) => {
      running.push(animation);
      animation.start();
    });
    return () => running.forEach((animation) => animation.stop());
    // `deps` is supplied by the caller, exactly like useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
