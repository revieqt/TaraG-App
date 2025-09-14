import Carousel from '@/components/Carousel'
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/context/SessionContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { renderGroupsSection } from '@/app/explore/groupsSection';
import { useLocation } from '@/hooks/useLocation';

export default function ExploreScreen() {
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const headerHeight = 80;
  const tabHeight = 40;
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const { suburb, city, loading, error, latitude, longitude } = useLocation();
  

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

  // Custom scroll handler to detect scroll direction
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


  // Render function for Tours section
  const renderToursSection = () => (
    <ScrollView 
      ref={activeTab === 0 ? scrollViewRef : null}
      showsVerticalScrollIndicator={false}
      style={{width: '100%', height: '100%'}}
      contentContainerStyle={{ paddingTop: stickyHeight }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
        <View style={styles.carouselContainer}>
          <Carousel
            images={[
              'https://scontent.fceb3-1.fna.fbcdn.net/v/t39.30808-6/538287052_640597579089569_295885445416347281_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHzobkTiFqG366kjW3egNIKYOy2-iXpenZg7Lb6Jel6dhN9OdRajCf2Vg6lBkpkhwFxPiwcR-4Qza5va6qonuHK&_nc_ohc=yYyv7nky0zoQ7kNvwGkj0Zl&_nc_oc=AdnLi8hmYoE9gILiE_savI_7teWdDLZg9lstw297nrTexeW66WNxhVnJHL7ELMOGgJI&_nc_zt=23&_nc_ht=scontent.fceb3-1.fna&_nc_gid=l9V7l8PgHfg9mPH3h9g00A&oh=00_AfVWFLIdDM-c4VaBohWb73xtjQkT3kcCCtiPbXzps19YPQ&oe=68B86435', 
              'https://scontent.fceb9-1.fna.fbcdn.net/v/t39.30808-6/527495542_623044884178172_2105755532645257880_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeFF3UqDwUsXzdpqcCxuYlqYLCEBkEEeRhYsIQGQQR5GFth6WBVe6MZ7D64MNAMu9ZaBzxz6a4A_fT-dkR1h-_Ks&_nc_ohc=9hKLBa_CYdEQ7kNvwFwwE6Q&_nc_oc=AdlbIjLg3P1xp7m5TEVLtSYW7S6AsGw6qTlEfdgQM3wxCFxYvw1Rv9YbiZpWoWNED7Q&_nc_zt=23&_nc_ht=scontent.fceb9-1.fna&_nc_gid=msOZePLq6CW-z9m_GEZoLw&oh=00_AfVDgTnSWOpydFJ23kvnusacLbA1Cv44PqB96Lgmc5lpcg&oe=68B88292',
              'https://scontent.fceb9-1.fna.fbcdn.net/v/t39.30808-6/506441581_584094611406533_1072900559871384123_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeEtoZq0Dv4VhuTKmKyJK52cmOP4GztRwN2Y4_gbO1HA3TBK8fGIxR6Julvv-BHnQ4n_1OLfQbMjE4abPk3WXcjv&_nc_ohc=0P9rrdvZS9AQ7kNvwGQogA-&_nc_oc=Adkiq6z3y4u8CJUHbMZ-09r8V9AGBOJ4f_6mi1buhKu7e_PgFmPePNQI5tIDHVe348g&_nc_zt=23&_nc_ht=scontent.fceb9-1.fna&_nc_gid=xK0JSBlj5uHsoyUsPKpPdA&oh=00_AfWtaVtyYM7wflgg7nUgtzZ7o-OWAJTJNqhoglw24V5UOQ&oe=68B8797C'
            ]}
            titles={['Mark Ken Yangyang', 'Ed Lorenz Quiroga', 'Joel Janzel Brigildo']}
            subtitles={['potangina', 'oh oh', 'fiesta stall']}
            buttonLabels={['View Tour', 'View Tour','View Tour']}
            buttonLinks={[() => alert('Next'), () => alert('Done'), () => alert('Done')]}
            darkenImage
            navigationArrows
          />
        </View>

        <ThemedText type='subtitle'>Tours Near You</ThemedText>
        <ThemedText type='subtitle'>Tours you might like</ThemedText>
        <ThemedText type='subtitle'>Popular in Cebu</ThemedText>
        <ThemedText type='subtitle'>Popular in Cebu</ThemedText>
       </ScrollView>
   );


  // Calculate the total height of sticky elements
  const stickyHeight = headerHeight + tabHeight;
  
  // Create a separate animated value for header visibility
  const headerVisible = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  
  // Use the headerVisible value for opacity
  const headerOpacity = headerVisible;

  return (
    <ThemedView style={{flex:1}}>
      {/* Sticky Header */}
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
            // 'Feed', 
            'Tours', 
            'Your Groups'
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
        {/* <View style={[styles.sectionContainer, { display: activeTab === 0 ? 'flex' : 'none' }]}>
          {renderExploreSection()}
        </View> */}
        <View style={[styles.sectionContainer, { display: activeTab === 0 ? 'flex' : 'none' }]}>
          {renderToursSection()}
        </View>
        <View style={[styles.sectionContainer, { display: activeTab === 1 ? 'flex' : 'none' }]}>
          <ScrollView 
            ref={activeTab === 1 ? scrollViewRef : null}
            showsVerticalScrollIndicator={false}
            style={{width: '100%', height: '100%'}}
            contentContainerStyle={{ paddingTop: stickyHeight }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {renderGroupsSection()}
          </ScrollView>
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
  tabContent: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  carouselContainer:{
    width: '100%',
    height: 350,
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
    fontSize: 16,
    fontWeight: '500',
  },
  tabUnderline: {
    height: 3,
    width: '80%',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  sectionContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});