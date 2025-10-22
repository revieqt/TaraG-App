import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/context/SessionContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import WeatherCard from '@/components/custom/WeatherCard';
import { LinearGradient } from 'expo-linear-gradient';
import HomeMap from '@/components/maps/HomeMap';
import { router } from 'expo-router';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View, Animated, Image } from 'react-native';
import { useEffect,  useRef, useState } from 'react';
import AlertsContainer from '@/components/custom/AlertsContainer';
import ActiveRouteButton from '@/components/custom/ActiveRouteButton';
import ActiveSOSButton from '@/components/custom/ActiveSOSButton';
import ThemedIcons from '@/components/ThemedIcons';
import MonthlyCalendar from '@/components/MonthlyCalendar';

import { TARA_MESSAGES } from '@/constants/Config';

export default function HomeScreen() {
  const { session } = useSession();
  const user = session?.user;
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const accentColor = useThemeColor({}, 'accent');
  const floatAnimation = useRef(new Animated.Value(0)).current;
  
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [showBubble, setShowBubble] = useState(false);
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  // Function to get random message
  const getRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * TARA_MESSAGES.length);
    return TARA_MESSAGES[randomIndex];
  };

  // Typewriter effect function
  const typewriterEffect = (message: string) => {
    setDisplayedMessage('');
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayedMessage(message.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50); // 50ms delay between each character
    
    return typeInterval;
  };

  // Function to show message bubble
  const showMessageBubble = () => {
    const message = getRandomMessage();
    setShowBubble(true);

    // Fade in
    Animated.timing(bubbleOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Start typewriter effect after fade in completes
      typewriterEffect(message);
    });

    // Auto hide after message is fully typed + 5 seconds
    const hideDelay = (message.length * 50) + 5000; // typewriter time + 5 seconds
    setTimeout(() => {
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowBubble(false);
        setDisplayedMessage('');
      });
    }, hideDelay);
  };

  // Function to handle Tara image tap
  const handleTaraPress = () => {
    if (showBubble) {
      // If bubble is already showing, hide it and show new message
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => showMessageBubble(), 100);
      });
    } else {
      showMessageBubble();
    }
  };

  useEffect(() => {
    const startFloatingAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startFloatingAnimation();
  }, [floatAnimation]);

  // Show initial message bubble when screen first appears
  useEffect(() => {
    const timer = setTimeout(() => {
      showMessageBubble();
    }, 1000); // Show after 1 second delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView style={{zIndex: 5}}>
        <View>
          <View style={styles.mapHeaderContainer}>
            <HomeMap/>
          </View>

          <View style={styles.headerContent}>
            <LinearGradient
              colors={['transparent', backgroundColor]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.gradientOverlay}
              pointerEvents="none"
            />
            
            <View style={styles.textContainer}>
              <ThemedText type='title' style={{color: secondaryColor}}>
                Hello {user?.fname ? `${user.fname}` : ''}!
              </ThemedText>
              <ThemedText type='defaultSemiBold' style={{opacity: 0.7}}>Welcome to TaraG!</ThemedText>
            </View>
            <View style={styles.taraContainer}>
              <TouchableOpacity onPress={handleTaraPress} activeOpacity={1}>
                <Animated.Image 
                  source={require('@/assets/images/tara-cheerful.png')} 
                  style={[
                    styles.taraImage,
                    {
                      transform: [
                        {
                          translateY: floatAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -10],
                          }),
                        },
                        {
                          rotate: floatAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '-3deg'],
                          }),
                        },
                        
                      ],
                    }
                  ]} 
                />
              </TouchableOpacity>
              
              {/* Message Bubble */}
              {showBubble && (
                <Animated.View 
                  style={[
                    styles.messageBubble,
                    {
                      opacity: bubbleOpacity,
                      transform: [
                        {
                          translateY: floatAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -10],
                          }),
                        },
                      ],
                      backgroundColor: primaryColor,
                    }
                  ]}
                >
                  <ThemedText style={styles.bubbleText}>
                    {displayedMessage}
                  </ThemedText>
                </Animated.View>
              )}
            </View>
          </View>
        </View>
        <LinearGradient
          colors={['transparent', backgroundColor, backgroundColor]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.menuGradient}
          pointerEvents="none"
        />
        <View style={{ paddingHorizontal: 16, marginBottom: 20, zIndex: 1000 }}>
          <View style={styles.menu}>
            <TouchableOpacity style={[styles.menuOptions, {backgroundColor: accentColor}]} onPress={() => router.push('/routes/routes')}>
              <ThemedIcons library="MaterialIcons" name="route" size={25} color='#fff'/>
              <ThemedText style={styles.menuOptionText}>Routes</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuOptions, {backgroundColor: accentColor}]} onPress={() => router.push('/itineraries/itineraries')}>
              <ThemedIcons library="MaterialDesignIcons" name="calendar" size={25} color='#fff'/>
              <ThemedText style={styles.menuOptionText}>Itineraries</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuOptions, {backgroundColor: accentColor}]} onPress={() => router.push('/safety/safety')}>
              <ThemedIcons library="MaterialIcons" name="health-and-safety" size={25} color='#fff'/>
              <ThemedText style={styles.menuOptionText}>Safety</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuOptions, {backgroundColor: accentColor}]} onPress={() => router.push('/home/aiChat')}>
              <ThemedIcons library="MaterialDesignIcons" name="robot" size={25} color='#fff'/>
              <ThemedText style={styles.menuOptionText}>TaraAI</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.gridContainer}>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/(tabs)/explore',
                params: { tab: '2' }
              })}
              activeOpacity={0.8}
            >
              <ThemedView color='primary' shadow style={[styles.gridChildContainer, styles.leftGridContainer]}>
                <ThemedText style={{opacity: .5, fontSize: 12}}>Meet new friends with</ThemedText>
                <ThemedText type='defaultSemiBold' style={{opacity: .85}}>TaraBuddy</ThemedText>
                <LinearGradient
                  colors={['rgba(0, 255, 222,.4)', 'transparent']}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={styles.gridCircle}
                  pointerEvents="none"
                />
                <Image source={require('@/assets/images/slide3-img.png')} style={styles.taraBuddyImage} />
                <View style={styles.bottomArrow}>
                  <ThemedIcons library="MaterialIcons" name="arrow-forward-ios" size={15}/>
                </View>
              </ThemedView>
            </TouchableOpacity>
            <View style={[styles.gridChildContainer, {gap: '4%'}]}>
              <ThemedView color='primary' shadow style={styles.rightGridContainer}>
                <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '/(tabs)/explore',
                  params: { tab: '1' }
                })}
                activeOpacity={0.8} style={{flex:1, padding: 12}}
                >
                  <ThemedText style={{opacity: .5, fontSize: 12}}>Seamless group</ThemedText>
                  <ThemedText type='defaultSemiBold' style={{opacity: .85, fontSize: 15}}>Rooms</ThemedText>
                  <LinearGradient
                    colors={['rgba(0, 255, 222,.45)', 'transparent']}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 0 }}
                    style={styles.rightGridCircle}
                    pointerEvents="none"
                  />
                  <Image source={require('@/assets/images/slide4-img.png')} style={styles.rightGridImage} />
                  <View style={styles.bottomArrow}>
                    <ThemedIcons library="MaterialIcons" name="arrow-forward-ios" size={10}/>
                  </View>
                </TouchableOpacity>
              </ThemedView>
              <ThemedView color='primary' shadow style={styles.rightGridContainer}>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '/(tabs)/explore',
                  params: { tab: '0' }
                })}
                activeOpacity={0.8} style={{flex: 1, padding: 12}}
              >
                  <ThemedText style={{opacity: .5, fontSize: 12}}>Join Organized</ThemedText>
                  <ThemedText type='defaultSemiBold' style={{opacity: .85, fontSize: 15}}>Tours</ThemedText>
                  <LinearGradient
                    colors={['rgba(0, 255, 222,.45)', 'transparent']}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 0 }}
                    style={styles.rightGridCircle}
                    pointerEvents="none"
                  />
                  <Image source={require('@/assets/images/slide2-img.png')} style={styles.rightGridImage} />
                  <View style={styles.bottomArrow}>
                    <ThemedIcons library="MaterialIcons" name="arrow-forward-ios" size={10}/>
                  </View>
                </TouchableOpacity>
              </ThemedView>
            </View>
          </View>
          <WeatherCard current />
          <MonthlyCalendar/>
        </View>
      </ScrollView>
      
      <AlertsContainer>
         {session?.activeRoute && (<ActiveRouteButton/>)}
         {session?.user?.safetyState?.isInAnEmergency && (<ActiveSOSButton/>)}
      </AlertsContainer>

      <LinearGradient
        colors={['transparent', primaryColor]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mapHeaderContainer: {
    height: 200,
    backgroundColor: 'blue',
  },
  circle:{
    width: 150,
    height: 150,
    borderRadius: 1000,
    backgroundColor: 'blue',
    position: 'absolute',
    top: 100,
    left: 100,
    zIndex: 2,
  },
  taraContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1000,
    width: '100%',
    height: Dimensions.get('window').width * 0.45,
    overflow: 'visible',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  taraImage: {
    position: 'absolute',
    bottom: -75,
    right: '-10%',
    width: '43%',              
    height: 200,        
    resizeMode: 'contain',
    zIndex: 1100,     
    opacity: 1,
    alignSelf: 'flex-end',
  },
  gradientOverlay: {
    height: 120,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    pointerEvents: 'none',
  },
  headerContent: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    padding: 16,
    zIndex: 3,
    pointerEvents: 'box-none', // This allows touches to pass through except for the actual content
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    zIndex: 3,
  },
  menuGradient: {
    height: 70,
    position: 'absolute',
    top: 195,
    left: 0,
    right: 0,
    zIndex: 3,
    pointerEvents: 'none',
  },
  menu:{
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingTop: 25,
    marginBottom: 16,
    zIndex: 5
  },
  menuOptions:{
    width: Dimensions.get('window').width * 0.21,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 202, 255,.8)',
    borderRadius: 10,
    paddingTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 40,
  },
  menuOptionText:{
    fontSize: 12,
    marginTop: 5,
    color: '#fff'
  },
  gridContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridChildContainer:{
    width: Dimensions.get('window').width * 0.45,
    aspectRatio: 1,
    borderRadius: 12,
  },
  leftGridContainer:{
    padding: 14,
    overflow: 'hidden',
  },
  rightGridContainer:{
    height: '48%',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bottomGradient: {
    height: 120,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  gridCircle:{
    height: '150%',
    aspectRatio: 1,
    borderRadius: 1000,
    position: 'absolute',
    bottom: '-75%',
    right: '-50%',
  },
  rightGridCircle:{
    height: '170%',
    aspectRatio: 1,
    borderRadius: 1000,
    position: 'absolute',
    bottom: '-60%',
    right: '-20%',
  },
  taraBuddyImage:{
    width: '120%',
    height: '120%',
    position: 'absolute',
    bottom: '-40%',
    right: '-20%',
    opacity: .9,
  },
  rightGridImage:{
    width: '55%',
    height: '150%',
    position: 'absolute',
    bottom: '-45%',
    right: '-15%',
    opacity: .8,
  },
  bottomArrow:{
    position: 'absolute',
    bottom: 10,
    left: 10,
    zIndex: 3,
    pointerEvents: 'none',
    opacity: .5,
  },
  supportContainer:{
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 30,
    borderWidth: 1,
    borderColor: '#ccc4',
  },
  
  messageBubble: {
    position: 'absolute',
    bottom: -17,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderTopRightRadius: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100000,
    borderWidth: 1,
    borderColor: '#ccc4',
  },
  bubbleText: {
    textAlign: 'center',
    flexWrap: 'wrap',
    wordWrap: 'wrap',
  },
});