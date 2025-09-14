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
      {/* Left Box - Day Display */}
      <ThemedView color='primary' shadow
        style={[styles.box, { width: boxWidth }]}
      >
        {/* Day + Date */}
        <View style={styles.dayContent}>
          <ThemedText style={styles.dateText}>
            {selectedDay.toLocaleDateString("en-US", {
              day: "numeric",
            })}
          </ThemedText>
          <ThemedText style={styles.dayText}>
            {selectedDay.toLocaleDateString("en-US", {
              month: "long",
            })}, {selectedDay.toLocaleDateString("en-US", {
              year: "numeric",
            })}
          </ThemedText>
          <ThemedText style={styles.dayText}>
            {selectedDay.toLocaleDateString("en-US", { weekday: "long" })}
          </ThemedText>
          {/* Navigation with Dot Indicators */}
          <View style={styles.navigationRow}>
            {/* Left Arrow */}
            <TouchableOpacity
              style={styles.arrowButtonInside}
              onPress={() =>
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
              }
              disabled={selectedIndex === 0}
            >
              <ThemedIcons 
                  library="MaterialIcons" 
                  name="arrow-back-ios" 
                  size={16}
              />
            </TouchableOpacity>

            {/* Dot Indicators */}
            <View style={styles.dotContainer}>
              {weekDays.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: index === selectedIndex ? accentColor : "#ccc" }
                  ]}
                />
              ))}
            </View>

            {/* Right Arrow */}
            <TouchableOpacity
              style={styles.arrowButtonInside}
              onPress={() =>
                setSelectedIndex((prev) =>
                  prev < weekDays.length - 1 ? prev + 1 : prev
                )
              }
              disabled={selectedIndex === weekDays.length - 1}
            >
              <ThemedIcons 
                  library="MaterialIcons" 
                  name="arrow-forward-ios" 
                  size={16}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>

      {/* Right Box - Events */}
      <ThemedView color='primary' shadow style={[styles.box, { width: boxWidth }]}>
        <ScrollView>
          {dayEvents.length > 0 ? (
            dayEvents.map((ev) => (
              <View
                key={ev.id}
                style={[styles.eventItem,{backgroundColor: accentColor}]}
              >
                <ThemedText style={styles.eventTitle}>{ev.title}</ThemedText>
                <ThemedText style={styles.eventTime}>
                  {ev.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                  {ev.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </ThemedText>
              </View>
            ))
          ) : (
            <View style={{padding: 15}}>
                <EmptyMessage iconLibrary='MaterialDesignIcons' iconName='camera-timer'
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
  arrowButton: {
    padding: 4,
    marginHorizontal: 8,
  },
  arrowButtonInside: {
    padding: 4,
    marginHorizontal: 8,
  },
  box: {
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
  },
  dayContent: {
    flex: 1,
  },
  dayText: {
    opacity: .5
  },
  dateText: {
    fontSize: 40,
    marginBottom: -10
  },
  navigationRow: {
    flexDirection: "row",
    alignItems: "center",
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    opacity: .5
  },
  dotContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
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
  noEventsText: {
    fontSize: 14,
    color: "#999",
  },
});

export default WeeklyCalendar;
