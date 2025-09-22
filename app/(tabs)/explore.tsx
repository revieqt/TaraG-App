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
              'https://scontent.fceb3-1.fna.fbcdn.net/v/t39.30808-6/481925042_1058188923004845_1719553000271680775_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeH6KVqdbWNIBeuCANlStG2GGpV19-A21B0alXX34DbUHWDqX99QWlZ9gKJ8sbsL3j_QAGDVmlZ6J8H62ZkJ8pCN&_nc_ohc=UNystwMfczYQ7kNvwGw_4jn&_nc_oc=AdmVL5dY_cd8OnovDBVZZUkBVzyVh9SnnoumlEr5IUTqKZUIK7ya7z_YmFbJA-XEd_I&_nc_zt=23&_nc_ht=scontent.fceb3-1.fna&_nc_gid=aZFwUY7uXbmujxTFtITPcg&oh=00_AfYbHR1Rq-UdXK3pFpV7KsrrvLWFBsS24G9tn8giGU8vxg&oe=68D69479', 
              'https://scontent.fceb9-1.fna.fbcdn.net/v/t39.30808-6/300695256_621320363028355_910404220287332843_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFAf_a1e8sXzgmaaSWeERo_Hazek1R7MWYdrN6TVHsxZiGelmPX-EtOZS8HWzBwAvhWOhUYHjzyeQXuG0MssIJy&_nc_ohc=LNeSMfbTbpMQ7kNvwGqPWcr&_nc_oc=AdkVspznP2s9J-CwhZYkf49xBot3kYCvTMHm0pxSmO2FPvrN_Np9lD5dYfU5ze1Yqu8&_nc_zt=23&_nc_ht=scontent.fceb9-1.fna&_nc_gid=9tYS_4sTY7SyNEdTLT-N9Q&oh=00_AfYsX7ndsfcgBOQkKW_juw3-oqpix3Y2WnVl4YVCkNXtiQ&oe=68D6B644',
              'https://scontent.fceb3-1.fna.fbcdn.net/v/t1.6435-9/51441804_2258917914139788_8538702684495020032_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeFqAUmCxLfwDjtLiLgKhWDPVd7DJJX6jitV3sMklfqOK0ffGSLscR8uYdT4o5zAefJl-InTyzrMPO1TdU_0NHXE&_nc_ohc=decouDG6yIQQ7kNvwGxGVK2&_nc_oc=Admd1MXakUUwOxuuadSb1NiCZ7MyQLwb-7AM-P3moY_T4XDto20YdFryIEsLpRakpsM&_nc_zt=23&_nc_ht=scontent.fceb3-1.fna&_nc_gid=q1jp_lJUXtPPyF8WDOEr-A&oh=00_AfbFeKwFAyAJvjSClT7ZVfOShMwVY4AFfM79lWOMHg_CXg&oe=68F83323'
            ]}
            titles={['Anjo World Cebu', 'Moalboal Beach Invasion', 'Cebu Historical Tour']}
            subtitles={['Enjoy the first world-class theme park in the Visayas', 
              'Explore the beauty of Moalboal', 
              'Discover the rich history of Cebu']}
            buttonLabels={['View Tour', 'View Tour','View Tour']}
            buttonLinks={[() => alert('Next'), () => alert('Done'), () => alert('Done')]}
            darkenImage
            navigationArrows
          />
        </View>
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