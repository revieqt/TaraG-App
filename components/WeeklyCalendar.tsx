import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, LayoutChangeEvent, StyleSheet } from "react-native";
import { ThemedView } from "./ThemedView";
import ThemedIcons from "./ThemedIcons";
import { ThemedText } from "./ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import EmptyMessage from "./EmptyMessage";

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
};

type WeeklyCalendarProps = {
  startOfWeek?: "sunday" | "monday";
  events?: CalendarEvent[];
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  startOfWeek = "monday",
  events = [],
}) => {
  const today = new Date();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const accentColor = useThemeColor({}, 'accent');  
  // calculate start of week
  const currentWeekStart = useMemo(() => {
    const day = today.getDay();
    const diff =
      startOfWeek === "monday"
        ? (day === 0 ? -6 : 1 - day)
        : -day;
    const d = new Date(today);
    d.setDate(today.getDate() + diff);
    return d;
  }, [startOfWeek]);

  // generate 7 days of the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  const [selectedIndex, setSelectedIndex] = useState(
    weekDays.findIndex((d) => d.toDateString() === today.toDateString())
  );

  const selectedDay = weekDays[selectedIndex];

  // filter events for selected day
  const dayEvents = events.filter((ev) => {
    const eventStartDate = new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate());
    const eventEndDate = new Date(ev.end.getFullYear(), ev.end.getMonth(), ev.end.getDate());
    const selectedDate = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
    
    return selectedDate >= eventStartDate && selectedDate <= eventEndDate;
  });

  // handle layout (for equal sizing)
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  // each box width
  const boxWidth = containerWidth > 0 ? containerWidth / 2 - 8 : 0;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Left Box - Day Display with Horizontal Scroll */}
      <ThemedView color='primary' shadow style={[styles.box, { width: boxWidth }]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const scrollX = event.nativeEvent.contentOffset.x;
            const dayWidth = boxWidth - 24; // Account for padding
            const newIndex = Math.round(scrollX / dayWidth);
            setSelectedIndex(Math.min(Math.max(0, newIndex), weekDays.length - 1));
          }}
        >
          {weekDays.map((day, index) => (
            <View key={index} style={[styles.dayContent, { width: boxWidth - 24 }]}>
              <ThemedText style={styles.dateText}>
                {day.toLocaleDateString("en-US", {
                  day: "numeric",
                })}
              </ThemedText>
              <ThemedText style={styles.dayText}>
                {day.toLocaleDateString("en-US", {
                  month: "long",
                })}, {day.toLocaleDateString("en-US", {
                  year: "numeric",
                })}
              </ThemedText>
              <ThemedText style={styles.dayText}>
                {day.toLocaleDateString("en-US", { weekday: "long" })}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Right Box - Events for Selected Day */}
      <ThemedView color='primary' shadow style={[styles.box, { width: boxWidth }]}>
        <ScrollView>
          {dayEvents.length > 0 ? (
            dayEvents.map((ev) => (
              <View
                key={ev.id}
                style={[styles.eventItem, { backgroundColor: accentColor }]}
              >
                <ThemedText style={styles.eventTitle}>{ev.title}</ThemedText>
                <ThemedText style={styles.eventTime}>
                  {ev.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                  {ev.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </ThemedText>
              </View>
            ))
          ) : (
            <View style={{ padding: 15 }}>
              <EmptyMessage
                iconLibrary='MaterialDesignIcons'
                iconName='camera-timer'
                title='No Events'
                description="scheduled for this day"
              />
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  box: {
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
  },
  dayContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    opacity: .5,
    textAlign: "center",
  },
  dateText: {
    fontSize: 40,
    marginBottom: -10,
    textAlign: "center",
  },
  eventItem: {
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    opacity: .7
  },
  eventTitle: {
    fontWeight: "600",
    color: "#333",
  },
  eventTime: {
    fontSize: 11,
    color: "#555",
  },
});

export default WeeklyCalendar;
