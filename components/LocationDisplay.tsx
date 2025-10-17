// LocationDisplay.tsx
import { ThemedIcons } from "@/components/ThemedIcons";
import React, { useState, useEffect } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

type LocationDisplayProps = {
  content: React.ReactNode[];
};

const LocationDisplay: React.FC<LocationDisplayProps> = ({ content }) => {
  const [topOffset, setTopOffset] = useState<number | null>(null);
  const [bottomOffset, setBottomOffset] = useState<number | null>(null);
  const primaryColor = useThemeColor({}, 'primary');

  // Reset offsets when content changes, but only if we have fewer items
  useEffect(() => {
    if (content.length <= 1) {
      setTopOffset(null);
      setBottomOffset(null);
    }
  }, [content.length]);

  const handleLayout = (e: LayoutChangeEvent, index: number) => {
    const { y } = e.nativeEvent.layout;
    if (index === 0) {
      setTopOffset(y + 10);
    }
    if (index === content.length - 1) {
      setBottomOffset(y + 10);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.itemsContainer}>
        {topOffset !== null && bottomOffset !== null && content.length > 1 && (
          <View
            style={[
              styles.timeline,
              { top: topOffset, height: bottomOffset - topOffset },
            ]}
          />
        )}

        {content.map((child, index) => (
          <View
            key={index}
            style={styles.itemRow}
            onLayout={(e) => handleLayout(e, index)}
          >
            {/* Pin + Connector */}
            <View style={styles.pinColumn}>
              <View style={{backgroundColor: primaryColor, borderRadius: 50, width: 20, height: 20, justifyContent: 'center', alignItems: 'center'}}>
                <ThemedIcons
                  library="MaterialIcons"
                  name="location-on"
                  size={18}
                  color="green"
                />
              </View>
            </View>

            {/* Content */}
            <View style={styles.contentBox}>{child}</View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default LocationDisplay;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  itemsContainer: {
    flex: 1,
    position: "relative",
  },
  timeline: {
    position: "absolute",
    width: 2,
    backgroundColor: "transparent",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ccc",
    left: 13,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pinColumn: {
    width: 30,
    flexDirection: "row",
    alignItems: "flex-start",
    position: "relative",
    marginLeft: 5,
  },
  contentBox: {
    flex: 1,
    paddingVertical: 2,
  },
});
