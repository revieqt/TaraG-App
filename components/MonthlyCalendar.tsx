import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewStyle,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { ThemedView } from "./ThemedView";
import ThemedIcons from "./ThemedIcons";
import {ThemedText} from "./ThemedText";

interface MonthlyCalendarProps {
  style?: ViewStyle;
  highlightColor?: string;
}

const { width } = Dimensions.get("window");

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
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

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  style,
  highlightColor = "#007AFF",
}) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const translateX = useSharedValue(0);

  const getDaysInMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) daysArray.push(null);
    for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);
    return daysArray;
  };

  const handleChangeMonth = useCallback(
    (direction: "next" | "prev") => {
      const nextMonth =
        direction === "next"
          ? (currentMonth + 1) % 12
          : (currentMonth + 11) % 12;

      translateX.value = withTiming(direction === "next" ? -width : width, {
        duration: 200,
      });

      setTimeout(() => {
        setCurrentMonth(nextMonth);
        translateX.value = withTiming(0, { duration: 200 });
      }, 200);
    },
    [currentMonth]
  );

  // PanResponder for swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      translateX.value = gestureState.dx;
    },
    onPanResponderRelease: (evt, gestureState) => {
      const swipeThreshold = 50;
      
      if (gestureState.dx > swipeThreshold) {
        // Swipe right - go to previous month
        handleChangeMonth("prev");
      } else if (gestureState.dx < -swipeThreshold) {
        // Swipe left - go to next month
        handleChangeMonth("next");
      } else {
        // Return to original position
        translateX.value = withTiming(0, { duration: 200 });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const days = getDaysInMonth(currentMonth, currentYear);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => handleChangeMonth("prev")}>
          <ThemedIcons library="MaterialIcons" name="arrow-back-ios" size={15}/>
        </TouchableOpacity>
        <ThemedText type='defaultSemiBold'>
          {monthNames[currentMonth]} {currentYear}
        </ThemedText>
        <TouchableOpacity onPress={() => handleChangeMonth("next")}>
          <ThemedIcons library="MaterialIcons" name="arrow-forward-ios" size={15}/>
        </TouchableOpacity>
      </View>

      {/* Days of Week */}
      <View style={styles.daysOfWeekContainer}>
        {daysOfWeek.map((day) => (
          <ThemedText key={day} style={styles.dayOfWeek}>
            {day}
          </ThemedText>
        ))}
      </View>

      {/* Animated Month View with Swipe Gestures */}
      <View {...panResponder.panHandlers}>
        <Animated.View style={[animatedStyle]}>
          <FlatList
            data={days}
            numColumns={7}
            keyExtractor={(_, index) => index.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const isToday =
                item === today.getDate() && currentMonth === today.getMonth();

              return (
                <View style={styles.dayContainer}>
                  {item ? (
                    <View
                      style={[
                        styles.dayCircle,
                        isToday && { backgroundColor: highlightColor },
                      ]}
                    >
                      <ThemedText
                        style={[
                          isToday && { color: "#fff"},
                        ]}
                      >
                        {item}
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.dayPlaceholder} />
                  )}
                </View>
              );
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
};

export default MonthlyCalendar;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  daysOfWeekContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  dayOfWeek: {
    width: 32,
    textAlign: "center",
    opacity: 0.5,
  },
  dayContainer: {
    flex: 1 / 7,
    alignItems: "center",
    marginVertical: 6,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  dayPlaceholder: {
    width: 32,
    height: 32,
  },
});
