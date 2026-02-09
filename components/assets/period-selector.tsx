import { Colors } from "@/constants/colors";
import React, { createContext, useState, useCallback, use } from "react";
import { View, Pressable, Text, type LayoutChangeEvent } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";

export type PeriodOption = {
	id: string;
	label: string;
};

type ItemMeasurements = {
	width: number;
	height: number;
	x: number;
};

type PeriodSelectorContextValue = {
	selected: string;
	onSelect: (id: string) => void;
	measurements: Record<string, ItemMeasurements>;
	setMeasurements: (key: string, measurements: ItemMeasurements) => void;
};

const PeriodSelectorContext = createContext<PeriodSelectorContextValue>({
	selected: "",
	onSelect: () => { },
	measurements: {},
	setMeasurements: () => { },
});

const SPRING_CONFIG = {
	damping: 25,
	stiffness: 250,
	mass: 0.8,
};

// ------------------------------------------
// Root Component
// ------------------------------------------

type Props = {
	options: PeriodOption[];
	selected: string;
	onSelect: (id: string) => void;
};

export function PeriodSelector({ options, selected, onSelect }: Props) {
	// Architecture: Root owns item measurements and selected value, exposes both
	// via context so indicator can animate to measured width/x. This avoids
	// prop-drilling and keeps animation inputs close to where they are needed.
	const [measurements, setMeasurementsState] = useState<
		Record<string, ItemMeasurements>
	>({});

	const setMeasurements = useCallback(
		(key: string, newMeasurements: ItemMeasurements) => {
			setMeasurementsState((prev) => ({
				...prev,
				[key]: newMeasurements,
			}));
		},
		[],
	);

	const contextValue: PeriodSelectorContextValue = {
		selected,
		onSelect,
		measurements,
		setMeasurements,
	};

	return (
		<PeriodSelectorContext value={contextValue}>
			<View
				className="bg-secondary flex-row relative overflow-hidden mt-2"
			>
				{/* Animated sliding indicator */}
				<PeriodIndicator />

				{/* Tab buttons */}
				{options.map((option) => (
					<PeriodItem key={option.id} option={option} />
				))}
			</View>
		</PeriodSelectorContext>
	);
}

// ------------------------------------------
// Item Component
// ------------------------------------------

type ItemProps = {
	option: PeriodOption;
};

const PeriodItem = ({ option }: ItemProps) => {
	const { onSelect, setMeasurements, selected } = use(PeriodSelectorContext);

	const isActive = selected === option.id;

	// Measure each item once it lays out so the indicator can animate to
	// exact width and x. Using RN layout avoids guessing text widths.
	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height, x } = event.nativeEvent.layout;
			setMeasurements(option.id, { width, height, x });
		},
		[option.id, setMeasurements],
	);

	const handlePress = useCallback(() => {
		onSelect(option.id);
	}, [option.id, onSelect]);

	return (
		<Pressable
			onLayout={handleLayout}
			onPress={handlePress}
			className="flex-1 items-center justify-center py-3"
			style={{ zIndex: 1 }}
			accessibilityState={{ selected: isActive }}
		>
			<Text
				className={`text-xs font-lausanne-medium ${isActive ? "text-background" : "text-muted-foreground"}`}
			>
				{option.label}
			</Text>
		</Pressable>
	);
};

// ------------------------------------------
// Indicator Component
// ------------------------------------------

const PeriodIndicator = () => {
	const { selected, measurements } = use(PeriodSelectorContext);

	const activeMeasurements = measurements[selected];
	// Shared flag to skip the first animation: prevents the indicator from
	// animating in from 0 on initial mount which can look janky.
	const hasMeasured = useSharedValue(false);

	// Animated style is the single source of truth for indicator geometry.
	// It animates width/height/left to follow currently active item's
	// measurements at 60fps on the UI thread.
	const animatedStyle = useAnimatedStyle(() => {
		if (!activeMeasurements) {
			// No target yet → hide indicator entirely to avoid flicker.
			return {
				width: 0,
				height: 0,
				left: 0,
				opacity: 0,
			};
		}

		if (!hasMeasured.value) {
			// Avoid initial animate-in: snap to measured geometry once.
			hasMeasured.value = true;
			return {
				width: activeMeasurements.width,
				height: activeMeasurements.height,
				left: activeMeasurements.x,
				opacity: 1,
			};
		}

		return {
			width: withSpring(activeMeasurements.width, SPRING_CONFIG),
			height: withSpring(activeMeasurements.height, SPRING_CONFIG),
			left: withSpring(activeMeasurements.x, SPRING_CONFIG),
			opacity: 1,
		};
	}, [activeMeasurements]);

	return (
		<Animated.View
			style={[
				{
					position: "absolute",
					backgroundColor: Colors.foreground,
				},
				animatedStyle,
			]}
		/>
	);
};
