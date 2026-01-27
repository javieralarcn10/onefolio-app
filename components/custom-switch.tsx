import { Colors } from "@/constants/colors";
import { CheckIcon, XIcon } from "phosphor-react-native";
import React, { FC, useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolateColor, ZoomIn } from "react-native-reanimated";

// discord-custom-switch-animation 🔽

// Switch dimensions - Discord's compact 40x26 switch design
const SWITCH_WIDTH = 40;
const SWITCH_THUMB_SIZE = 20;
const SWITCH_HORIZONTAL_PADDING = 3; // Creates 3px margin from track edges
const SWITCH_VERTICAL_PADDING = 3; // Creates 3px margin from top/bottom
const SWITCH_HEIGHT = SWITCH_THUMB_SIZE + SWITCH_VERTICAL_PADDING * 2;
// Maximum thumb travel distance: total width minus thumb size minus both side paddings
const SWITCH_MAX_OFFSET = SWITCH_WIDTH - SWITCH_THUMB_SIZE - SWITCH_HORIZONTAL_PADDING * 2;

// Discord brand colors for track states
const TRACK_DEFAULT_COLOR = "#a6a6a6"; // Off state - muted gray
const TRACK_ACTIVE_COLOR = Colors.foreground; // On state - Discord's blurple
const THUMB_COLOR = Colors.background; // Light gray thumb maintains contrast on both states

type Props = {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
};

export const CustomSwitch: FC<Props> = ({ value = false, onValueChange }) => {
  // Thumb position: 0 (left/off) to SWITCH_MAX_OFFSET (right/on)
  const offset = useSharedValue(value ? SWITCH_MAX_OFFSET : 0);
  // Internal state tracking for consistent animations
  const isOn = useSharedValue(value);

  // Sync internal state with prop value changes from parent
  useEffect(() => {
    isOn.set(value);
    offset.set(
      withSpring(value ? SWITCH_MAX_OFFSET : 0, {
        damping: 100,
        stiffness: 1200,
      }),
    );
  }, [value]);

  const toggleSwitch = () => {
    const newValue = !isOn.get();
    isOn.set(newValue);

    // Spring animation for smooth thumb slide with Discord-like feel
    offset.set(
      withSpring(newValue ? SWITCH_MAX_OFFSET : 0, {
        damping: 100, // Moderate bounce - not too springy
        stiffness: 1200, // Fast response for immediate feedback
      }),
    );
    onValueChange?.(newValue);
  };

  // Thumb position animation - translates from left (0) to right (SWITCH_MAX_OFFSET)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.get() }], // Horizontal slide animation
    };
  });

  // Track background color animation synchronized with thumb movement
  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      offset.get(), // Input: current thumb position
      [0, SWITCH_MAX_OFFSET], // Range: off position to on position
      [TRACK_DEFAULT_COLOR, TRACK_ACTIVE_COLOR], // Output: gray to Discord blurple
    );

    return {
      backgroundColor, // Smooth color transition as thumb slides
    };
  });

  return (
    <Pressable onPress={toggleSwitch}>
      <Animated.View style={[styles.track, backgroundStyle]}>
        <Animated.View style={[styles.thumb, animatedStyle]} className="items-center justify-center">
          {value ? (
            // Key prop ensures ZoomIn animation triggers on state change
            // Icons provide clear visual feedback matching Discord's design language
            <Animated.View key="check" entering={ZoomIn}>
              <CheckIcon size={13} color={TRACK_ACTIVE_COLOR} weight="bold" />
            </Animated.View>
          ) : (
            <Animated.View key="x" entering={ZoomIn}>
              <XIcon size={14} color={TRACK_DEFAULT_COLOR} weight="bold" />
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: SWITCH_HEIGHT / 2,
    paddingHorizontal: SWITCH_HORIZONTAL_PADDING,
    paddingVertical: SWITCH_VERTICAL_PADDING,
  },
  thumb: {
    width: SWITCH_THUMB_SIZE,
    height: SWITCH_THUMB_SIZE,
    borderRadius: SWITCH_THUMB_SIZE / 2,
    backgroundColor: THUMB_COLOR,
  },
});
