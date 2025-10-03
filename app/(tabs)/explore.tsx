import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
// import ToursSection from '@/app/tours/tours';
import TaraBuddySection from '@/app/taraBuddy/taraBuddy';
import GroupsSection from '@/app/groups/groups';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const headerHeight = 80;
  const tabHeight = 40;
  const secondaryColor = useThemeColor({}, 'secondary');
  

  useEffect(() => {
    lastScrollY.current = 0;
  }, []);

  const handleTabPress = (idx: number) => {
    if (idx === activeTab) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      setActiveTab(idx);
    }
  };

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const isScrollingUp = currentScrollY < lastScrollY.current;
    const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);
    
    scrollY.setValue(currentScrollY);
    
    if (isScrollingUp && scrollDifference > 10) {
      Animated.parallel([
        Animated.timing(headerVisible, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else if (!isScrollingUp && currentScrollY > stickyHeight) {
      Animated.parallel([
        Animated.timing(headerVisible, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: -stickyHeight,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
    
    lastScrollY.current = currentScrollY;
  };

  const stickyHeight = headerHeight + tabHeight;
  const headerVisible = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = headerVisible;

  return (
    <ThemedView style={{flex:1}}>
      <Animated.View 
        style={[
          styles.stickyHeader,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          }
        ]}
      >
        <ThemedView style={styles.header} color='primary'>
          <ThemedText type='subtitle'>Explore</ThemedText>
        </ThemedView>

        <ThemedView color='primary' style={styles.tabRow}>
          {[
            'Your Groups',
            'TaraBuddy', 
          ].map((label, idx) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.tabButton,
                activeTab === idx && styles.activeTabButton,
                { flex: 1 },
              ]}
              onPress={() => handleTabPress(idx)}
              activeOpacity={0.7}
            >
              <View style={styles.tabInnerContainer}>
                <ThemedText style={[
                  styles.tabText,
                  activeTab === idx && {color: secondaryColor},
                ]}>{label}</ThemedText>
              </View>
              <View style={[
                styles.tabUnderline,
                activeTab === idx && {backgroundColor: secondaryColor},
              ]} />
            </TouchableOpacity>
          ))}
        </ThemedView>
      </Animated.View>

      {/* Content */}
      <View style={{flex: 1}}>
        <View style={[styles.sectionContainer, { display: activeTab === 0 ? 'flex' : 'none' }]}>
          <ScrollView 
            ref={activeTab === 1 ? scrollViewRef : null}
            showsVerticalScrollIndicator={false}
            style={{width: '100%', height: '100%'}}
            contentContainerStyle={{ paddingTop: stickyHeight }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <GroupsSection/>
          </ScrollView>
        </View>
        <View style={[styles.sectionContainer, { display: activeTab === 1 ? 'flex' : 'none' }]}>
          <TaraBuddySection/>
        </View>
        
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header:{
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    alignItems: 'center',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  tabRow: {
    flexDirection: 'row',   
    justifyContent: 'space-between',
    alignItems: 'stretch',
    height: 48,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 1,
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  activeTabButton: {
    backgroundColor: 'transparent',
  },
  tabInnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabUnderline: {
    height: 2,
    width: '80%',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  sectionContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});