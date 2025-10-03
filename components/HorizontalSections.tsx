import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface HorizontalSectionsProps {
  labels: string[];
  sections: React.ReactNode[];
  type?: 'fullTab' | 'dotIdentifier';
  containerStyle?: ViewStyle;
  tabStyle?: ViewStyle;
  tabTextStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  activeTabTextStyle?: ViewStyle;
}

const { width } = Dimensions.get('window');

const HorizontalSections: React.FC<HorizontalSectionsProps> = ({
  labels,
  sections,
  type = 'dotIdentifier',
  containerStyle,
  tabStyle,
  tabTextStyle,
  activeTabStyle,
  activeTabTextStyle,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const opacityAnim = useRef(labels.map(() => new Animated.Value(0.3))).current;

  // Get secondary color from theme
  const secondaryColor = useThemeColor({}, 'secondary');

  useEffect(() => {
    Animated.timing(opacityAnim[activeIndex], {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    opacityAnim.forEach((anim, idx) => {
      if (idx !== activeIndex) {
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 0,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [activeIndex, opacityAnim]);

  const handleTabPress = (idx: number) => {
    setActiveIndex(idx);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: idx * width, animated: true });
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(newIndex);
  };

  const renderFullTab = () => (
    <ThemedView color='primary' style={[styles.fullTabRow, tabStyle]}> 
      {labels.map((label, idx) => (
        <TouchableOpacity
          key={label}
          style={[
            styles.fullTabButton,
            activeIndex === idx && activeTabStyle,
            { flex: 1 },
          ].filter(Boolean) as ViewStyle[]}
          onPress={() => handleTabPress(idx)}
          activeOpacity={0.7}
        >
          <View style={styles.fullTabInnerContainer}>
            <ThemedText style={[
              styles.fullTabText,
              tabTextStyle,
              activeIndex === idx && {
                color: secondaryColor, // Use secondary color for active tab text
              },
              activeIndex === idx && activeTabTextStyle,
            ].filter(Boolean) as TextStyle[]}>{label}</ThemedText>
          </View>
          <View style={[
            styles.fullTabUnderline,
            activeIndex === idx && {
              backgroundColor: secondaryColor, // Use secondary color for active underline
            },
          ].filter(Boolean) as ViewStyle[]} />
        </TouchableOpacity>
      ))}
    </ThemedView>
  );

  const renderDotIdentifier = () => (
    <View style={styles.dotsContainer}>
      {labels.map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.dot,
            activeIndex === idx ? styles.activeDot : styles.inactiveDot
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}> 
      {type === 'fullTab' && renderFullTab()}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        contentContainerStyle={{ width: width * labels.length }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={{ flex: 1 }}
        nestedScrollEnabled={true}
      >
        {sections.map((section, idx) => (
          <View key={idx} style={[styles.section, { width }]}> 
            <Animated.View style={{ flex: 1, opacity: opacityAnim[idx] }}>
              {section}
            </Animated.View>
          </View>
        ))}
      </ScrollView>
      {type === 'dotIdentifier' && renderDotIdentifier()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  section: {
    flex: 1,
    height: '100%',
    minHeight: '100%',
  },
  fullTabRow: {
    flexDirection: 'row',   
    justifyContent: 'space-between',
    alignItems: 'stretch',
    height: 48,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 1,
  },
  fullTabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  fullTabInnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  fullTabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  fullTabUnderline: {
    height: 3,
    width: '80%',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#00FFDE',
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
});

export default HorizontalSections;