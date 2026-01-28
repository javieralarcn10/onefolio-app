import { ArrowRightIcon } from "phosphor-react-native";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Icon from "react-native-remix-icon";

export const AnimatedArrow = ({ size, color, animate = true }: { size: number; color: string; animate?: boolean }) => {
  const offset = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  useEffect(() => {
    if (animate) {
      offset.value = withRepeat(withTiming(3, { duration: 850, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      offset.value = 0;
    }
  }, [animate]);

  return (
    <Animated.View style={animate ? animatedStyles : undefined}>
      <Icon name="arrow-right-line" size={size} color={color} fallback={null} />
      {/* <ArrowRightIcon color={color} size={size} /> */}
    </Animated.View>
  );
};
