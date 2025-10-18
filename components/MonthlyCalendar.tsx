import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewStyle,
  PanResponder,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { ThemedView } from "./ThemedView";
import ThemedIcons from "./ThemedIcons";
import {ThemedText} from "./ThemedText";
import { useItinerary, Itinerary } from "@/context/ItineraryContext";
import { useSession } from "@/context/SessionContext";
import { router } from "expo-router";

interface MonthlyCalendarProps {
  style?: ViewStyle;
  highlightColor?: string;
  itineraryHighlightColor?: string;
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
  itineraryHighlightColor = "#FF6B6B",
}) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const translateX = useSharedValue(0);
  const { itineraries } = useItinerary();
  const { session } = useSession();

  // Debug: Log itineraries when they change
  useEffect(() => {
    console.log('📅 MonthlyCalendar - Total itineraries:', itineraries.length);
    console.log('👤 Current user ID:', session?.user?.id);
    const userItineraries = itineraries.filter(itinerary => 
      session?.user?.id && itinerary.userID === session.user.id
    );
    console.log('🎯 User itineraries:', userItineraries.length);
  }, [itineraries, session?.user?.id]);

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

  // Helper function to check if a date has an itinerary for current user
  const getItinerariesForDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return itineraries.filter(itinerary => {
      // Filter by current user
      if (!session?.user?.id || itinerary.userID !== session.user.id) {
        return false;
      }
      
      const startDate = new Date(itinerary.startDate);
      const endDate = new Date(itinerary.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      
      return date >= startDate && date <= endDate;
    });
  };

  // Get user itineraries for current month (ongoing and upcoming)
  const getCurrentMonthItineraries = () => {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    return itineraries.filter(itinerary => {
      if (!session?.user?.id || itinerary.userID !== session.user.id) {
        return false;
      }
      
      const startDate = new Date(itinerary.startDate);
      const endDate = new Date(itinerary.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Only show ongoing and upcoming itineraries
      const isOngoing = today >= startDate && today <= endDate && itinerary.status === 'pending';
      const isUpcoming = today < startDate && itinerary.status === 'pending';
      
      if (!isOngoing && !isUpcoming) return false;
      
      // Check if itinerary overlaps with current month
      return (startDate <= monthEnd && endDate >= monthStart);
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  // Get itineraries for selected date
  const getSelectedDateItineraries = () => {
    if (!selectedDate) return getCurrentMonthItineraries();
    
    const selectedDay = selectedDate.getDate();
    return getItinerariesForDate(selectedDay);
  };

  // Helper function to determine if day is at row end/start for connection logic
  const isRowEnd = (dayIndex: number) => (dayIndex + 1) % 7 === 0;
  const isRowStart = (dayIndex: number) => dayIndex % 7 === 0;

  // Helper function to determine highlight style for multi-day itineraries
  const getHighlightStyle = (day: number, dayIndex: number, itinerariesForDay: Itinerary[]) => {
    if (itinerariesForDay.length === 0) return null;
    
    const date = new Date(currentYear, currentMonth, day);
    const itinerary = itinerariesForDay[0]; // Use first itinerary for styling
    const startDate = new Date(itinerary.startDate);
    const endDate = new Date(itinerary.endDate);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    date.setHours(12, 0, 0, 0);
    
    const isStart = date.toDateString() === startDate.toDateString();
    const isEnd = date.toDateString() === endDate.toDateString();
    const isSingleDay = startDate.toDateString() === endDate.toDateString();
    
    // Check if next/prev day has same itinerary for connection
    const nextDay = day + 1;
    const prevDay = day - 1;
    const nextDayItineraries = nextDay <= new Date(currentYear, currentMonth + 1, 0).getDate() ? 
      getItinerariesForDate(nextDay) : [];
    const prevDayItineraries = prevDay >= 1 ? getItinerariesForDate(prevDay) : [];
    
    const hasNextDayConnection = !isRowEnd(dayIndex) && 
      nextDayItineraries.some(it => it.id === itinerary.id);
    const hasPrevDayConnection = !isRowStart(dayIndex) && 
      prevDayItineraries.some(it => it.id === itinerary.id);
    
    if (isSingleDay) {
      return {
        backgroundColor: itineraryHighlightColor,
        borderRadius: 16,
        width: 32,
        height: 32,
      };
    }
    
    // Multi-day styling with connections
    const borderTopLeftRadius = (isStart || !hasPrevDayConnection) ? 16 : 0;
    const borderBottomLeftRadius = (isStart || !hasPrevDayConnection) ? 16 : 0;
    const borderTopRightRadius = (isEnd || !hasNextDayConnection) ? 16 : 0;
    const borderBottomRightRadius = (isEnd || !hasNextDayConnection) ? 16 : 0;
    
    const marginLeft = hasPrevDayConnection ? -8 : 0;
    const marginRight = hasNextDayConnection ? -8 : 0;
    const width = 32 + (hasPrevDayConnection ? 8 : 0) + (hasNextDayConnection ? 8 : 0);
    
    return {
      backgroundColor: itineraryHighlightColor + '80', // Semi-transparent for multi-day
      borderTopLeftRadius,
      borderBottomLeftRadius,
      borderTopRightRadius,
      borderBottomRightRadius,
      marginLeft,
      marginRight,
      width,
      height: 32,
    };
  };

  // Handle date selection
  const handleDatePress = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDate(date);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate days difference
  const getDaysDifference = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays + 1;
  };

  return (
    <>
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
              renderItem={({ item, index }) => {
                const isToday =
                  item === today.getDate() && currentMonth === today.getMonth();
                
                const itinerariesForDay = item ? getItinerariesForDate(item) : [];
                const highlightStyle = item ? getHighlightStyle(item, index, itinerariesForDay) : null;
                const hasItinerary = itinerariesForDay.length > 0;
                const isSelected = selectedDate && item === selectedDate.getDate() && 
                  currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();

                return (
                  <View style={styles.dayContainer}>
                    {item ? (
                      <TouchableOpacity 
                        style={styles.dayWrapper}
                        onPress={() => handleDatePress(item)}
                        activeOpacity={0.7}
                      >
                        {/* Itinerary highlight background */}
                        {highlightStyle && (
                          <View style={[styles.itineraryHighlight, highlightStyle]} />
                        )}
                        {/* Day circle */}
                        <View
                          style={[
                            styles.dayCircle,
                            isToday && { backgroundColor: highlightColor },
                            hasItinerary && !isToday && { backgroundColor: 'transparent' },
                          ]}
                        >
                          <ThemedText
                            style={[
                              (isToday || hasItinerary) && { color: "#fff" },
                              isSelected && { fontFamily: 'PoppinsBold' },
                              { zIndex: 5 }, // Ensure text is always on top
                            ]}
                          >
                            {item}
                          </ThemedText>
                        </View>
                        {/* Itinerary indicator dots - show count */}
                        {hasItinerary && (
                          <View style={styles.itineraryIndicator}>
                            {Array.from({ length: Math.min(itinerariesForDay.length, 3) }).map((_, idx) => (
                              <View key={idx} style={styles.indicatorDot} />
                            ))}
                            {itinerariesForDay.length > 3 && (
                              <ThemedText style={styles.moreIndicator}>+</ThemedText>
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
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

    {/* Itineraries Horizontal ScrollView */}
      <View style={{marginTop: 10}}>
        <View style={styles.titleRow}>
          <ThemedText type='defaultSemiBold' style={{marginBottom: 10, opacity: 0.8}}>
            {selectedDate ? `Itineraries for ${formatDate(selectedDate)}` : 'Your Next Itineraries'}
          </ThemedText>
          {selectedDate && (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selected = new Date(selectedDate);
            selected.setHours(0, 0, 0, 0);
            return selected >= today;
          })() && (
            <TouchableOpacity
              style={styles.createIconButton}
              onPress={() => {
                const dateParam = selectedDate.toISOString().split('T')[0];
                router.push(`/itineraries/itineraries-create?startDate=${dateParam}`);
              }}
              activeOpacity={0.7}
            >
              <ThemedIcons library='MaterialIcons' name='add' size={23} />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{gap: 8}}
        >
          {getSelectedDateItineraries().length === 0 ? (
            selectedDate ? (
              <View style={styles.emptyStateContainer}>
                <ThemedText style={styles.emptyStateText}>
                  No itineraries for this date
                </ThemedText>
              </View>
            ) : null
          ) : (
            getSelectedDateItineraries().map((itinerary) => {
              const startDate = new Date(itinerary.startDate);
              const endDate = new Date(itinerary.endDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              return (
                <TouchableOpacity
                  key={itinerary.id}
                  style={styles.itineraryCard}
                  onPress={() => router.push(`/itineraries/itineraries-view?id=${itinerary.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <ThemedText numberOfLines={2}>
                        {itinerary.title}
                      </ThemedText>
                      
                    </View>
                    
                    <View style={styles.cardDuration}>
                      <ThemedIcons library='MaterialIcons' name='schedule' size={14} />
                      <ThemedText style={{opacity: 0.7, marginLeft: 4, fontSize: 12}}>
                        {formatDate(startDate)} - {formatDate(endDate)}
                      </ThemedText>
                    </View>

                    <View style={[styles.cardDuration, {opacity: 0.7}]}>
                      <ThemedIcons library='MaterialIcons' name='arrow-forward' size={14} />
                      <ThemedText style={{opacity: 0.7, marginLeft: 4, fontSize: 12}}>
                        View Itinerary Details
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
            
        </ScrollView>
      </View>
    </>
    
);
};

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
  dayWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    position: 'relative',
  },
  dayPlaceholder: {
    width: 32,
    height: 32,
    overflow: 'hidden',
  },
  itineraryHighlight: {
    position: 'absolute',
    zIndex: 0,
  },
  itineraryIndicator: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 3,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF6B6B',
    marginHorizontal: 1,
  },
  moreIndicator: {
    fontSize: 8,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 2,
  },
  itinerariesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  noItinerariesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  noItinerariesText: {
    opacity: 0.6,
    textAlign: 'center',
  },
  itineraryCard: {
    minWidth: 150,
  },
  cardContent: {
    padding: 12,
    borderRadius: 8,
    position: 'relative',
    borderColor: '#ccc7',
    borderWidth: 1,
  },
  cardDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    minWidth: 200,
  },
  emptyStateText: {
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  createIconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    padding: 2,
    right: 0,
    top: -3,
  },
});

export default MonthlyCalendar;
