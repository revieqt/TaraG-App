import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, Image, Animated, PanResponder, Dimensions } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { useThemeColor } from "@/hooks/useThemeColor";
import ThemedIcons from "@/components/ThemedIcons";
import Button from "@/components/Button";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { Foundation } from "@expo/vector-icons";
import { useSession } from "@/context/SessionContext";
import { useTaraBuddyApi, PotentialMatch } from "@/services/taraBuddyApiService";
import { LinearGradient } from "expo-linear-gradient";
import GradientBlobs from "@/components/GradientBlobs";
import EmptyMessage from "@/components/EmptyMessage";

export default function TaraBuddySection() {
  const primaryColor = useThemeColor({}, "primary");
  const backgroundColor = useThemeColor({}, 'background');
  const { session } = useSession();
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<PotentialMatch | null>(null);
  
  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  // Always call hooks - conditional logic comes after
  const taraBuddyApi = useTaraBuddyApi();
  const hasPreference = Boolean(session?.user?.taraBuddyPreference);
  
  // Check if we have valid session for API calls
  const canUseApi = session?.accessToken && session?.user?.id;
  
  // Clear matches when preference is disabled
  useEffect(() => {
    if (!hasPreference) {
      setPotentialMatches([]);
      setCurrentIndex(0);
    }
  }, [hasPreference]);

  // Only fetch matches when the screen is focused (actively being viewed)
  useFocusEffect(
    React.useCallback(() => {
      if (hasPreference && canUseApi && potentialMatches.length === 0) {
        fetchPotentialMatches();
      }
    }, [hasPreference, canUseApi])
  );

  // Fetch more matches when we're down to the last 2 cards (only when screen is focused)
  useFocusEffect(
    React.useCallback(() => {
      if (hasPreference && canUseApi && potentialMatches.length - currentIndex <= 2) {
        fetchPotentialMatches();
      }
    }, [currentIndex, potentialMatches.length, hasPreference, canUseApi])
  );

  const fetchPotentialMatches = async () => {
    if (!canUseApi || loading) return;
    
    try {
      setLoading(true);
      const matches = await taraBuddyApi.getPotentialMatches();
      setPotentialMatches(prev => [...prev, ...matches]);
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      Alert.alert('Error', error.message || 'Failed to fetch potential matches');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!canUseApi || currentIndex >= potentialMatches.length) return;
    
    const currentUser = potentialMatches[currentIndex];
    
    try {
      const result = await taraBuddyApi.likeUser(currentUser.id);
      
      if (result.matched) {
        setMatchedUser(currentUser);
        setShowMatchModal(true);
      }
      
      // Animate card out to the right
      animateCardOut('right');
    } catch (error: any) {
      console.error('Error liking user:', error);
      Alert.alert('Error', error.message || 'Failed to like user');
    }
  };

  const handlePass = async () => {
    if (!canUseApi || currentIndex >= potentialMatches.length) return;
    
    const currentUser = potentialMatches[currentIndex];
    
    try {
      await taraBuddyApi.passUser(currentUser.id);
      // Animate card out to the left
      animateCardOut('left');
    } catch (error: any) {
      console.error('Error passing user:', error);
      // Still animate out even if API call fails
      animateCardOut('left');
    }
  };

  const animateCardOut = (direction: 'left' | 'right') => {
    const screenWidth = Dimensions.get('window').width;
    const toValue = direction === 'right' ? screenWidth : -screenWidth;
    
    Animated.parallel([
      Animated.timing(pan.x, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Reset animations and move to next card
      pan.setValue({ x: 0, y: 0 });
      rotate.setValue(0);
      opacity.setValue(1);
      setCurrentIndex(prev => prev + 1);
    });
  };

  // Create PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Respond to any horizontal movement
        return Math.abs(gestureState.dx) > 2;
      },
      onPanResponderGrant: () => {
        pan.setValue({ x: 0, y: 0 });
        rotate.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow horizontal movement
        pan.setValue({ x: gestureState.dx, y: 0 });
        
        // Update rotation based on horizontal movement
        const rotation = gestureState.dx / 10;
        rotate.setValue(rotation);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const screenWidth = Dimensions.get('window').width;
        // Much lower threshold - 15% of screen width or 50px minimum
        const swipeThreshold = Math.max(screenWidth * 0.15, 50);
        
        if (Math.abs(gestureState.dx) > swipeThreshold) {
          if (gestureState.dx > 0) {
            // Swipe right - Like
            handleLike();
          } else {
            // Swipe left - Pass
            handlePass();
          }
        } else {
          // Snap back to center
          Animated.parallel([
            Animated.spring(pan.x, {
              toValue: 0,
              useNativeDriver: false,
            }),
            Animated.spring(rotate, {
              toValue: 0,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        // Reset if gesture is terminated
        Animated.parallel([
          Animated.spring(pan.x, {
            toValue: 0,
            useNativeDriver: false,
          }),
          Animated.spring(rotate, {
            toValue: 0,
            useNativeDriver: false,
          }),
        ]).start();
      },
    })
  ).current;

  const getCurrentUser = () => {
    if (currentIndex >= potentialMatches.length) return null;
    return potentialMatches[currentIndex];
  };

  const getNextUser = () => {
    if (currentIndex + 1 >= potentialMatches.length) return null;
    return potentialMatches[currentIndex + 1];
  };

  // Don't render if no session
  if (!session?.accessToken || !session?.user?.id) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      
      
      {!hasPreference ? (<>
        
        <View style={styles.cardContainer}>
          <ThemedView color="primary" shadow style={[styles.card, styles.welcomeCard]}>
            <GradientBlobs/>
            <ThemedText type="subtitle" style={{ marginTop: 20 }}>
              Meet new Friends with
            </ThemedText>
            <ThemedText type="title">TaraBuddy</ThemedText>
            <ThemedText style={{ opacity: 0.5, textAlign: "center", paddingVertical: 10 }}>
              Find fellow adventurers, plan trips together, and turn every journey into a story worth sharing.
            </ThemedText>
            <Button
              title="Start Matching"
              onPress={async () => {
                if (!session?.user?.publicSettings?.isProfilePublic) {
                  Alert.alert("Error", "Please make your profile public to start matching");
                }else{
                  try {
                    await taraBuddyApi?.createTaraBuddyProfile();
                  } catch (err: any) {
                    Alert.alert("Error", err.message || "Failed to start matching");
                  }
                }
              }}
            />
          </ThemedView>
        </View>
        </>
      ) : (
        <>
          <TouchableOpacity 
            onPress={() => router.push("/account/viewProfile")}
            style={styles.settingsContainer}
          >
            <ThemedView color="primary" shadow style={styles.settings}>
              <ThemedIcons library="MaterialIcons" name="person" size={16} color="white"/>
              <ThemedText style={{ color: 'white', fontSize: 10 }}>Your Profile</ThemedText>
            </ThemedView>
          </TouchableOpacity>
          <View style={styles.cardContainer}>
            {/* Current Card */}
            {getCurrentUser() && (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.card,
                  {
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { rotate: rotate.interpolate({
                          inputRange: [-300, 0, 300],
                          outputRange: ['-30deg', '0deg', '30deg'],
                        })
                      }
                    ],
                    opacity: opacity,
                  },
                ]}
              >
                <ThemedView color="primary" shadow style={styles.cardInner}>
                  {getCurrentUser()?.profileImage ? (
                    <Image 
                      source={{ uri: getCurrentUser()!.profileImage }} 
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.profileImage, styles.placeholderImage]}>
                      <ThemedIcons library="MaterialIcons" name="person" size={100} color="#ccc" />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgb(0,0,0)']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.cardContent}
                  >
                    <ThemedText type="title" style={{color: '#fff'}}>
                      {getCurrentUser()!.fname} {getCurrentUser()!.lname}, {getCurrentUser()!.age}
                    </ThemedText>
                    <ThemedText style={{color: '#fff', opacity: 0.8}}>
                      {getCurrentUser()!.zodiac} • {getCurrentUser()!.gender}
                    </ThemedText>
                    {getCurrentUser()!.bio && (
                      <ThemedText style={{color: '#fff', marginTop: 8, fontSize: 14}}>
                        {getCurrentUser()!.bio}
                      </ThemedText>
                    )}
                  </LinearGradient>
                </ThemedView>
              </Animated.View>
            )}
            
            {/* Next Card (Behind) */}
            {getNextUser() && (
              <View style={[styles.card, styles.nextCard]}>
                <ThemedView color="primary" shadow style={styles.cardInner}>
                  {getNextUser()?.profileImage ? (
                    <Image 
                      source={{ uri: getNextUser()!.profileImage }} 
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.profileImage, styles.placeholderImage]}>
                      <ThemedIcons library="MaterialIcons" name="person" size={100} color="#ccc" />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgb(0,0,0)']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.cardContent}
                  >
                    <ThemedText type="title" style={{color: '#fff'}}>
                      {getNextUser()!.fname} {getNextUser()!.lname}, {getNextUser()!.age}
                    </ThemedText>
                    <ThemedText style={{color: '#fff', opacity: 0.8}}>
                      {getNextUser()!.zodiac} • {getNextUser()!.gender}
                    </ThemedText>
                  </LinearGradient>
                </ThemedView>
              </View>
            )}
            
            {/* Loading Card */}
            {loading && (
              <View style={styles.card}>
                <ThemedView color="primary" shadow style={styles.cardInner}>
                  <View style={styles.loadingCard}>
                    <GradientBlobs/>
                    <EmptyMessage
                      title="Finding potential matches..."
                      description="Please wait while we search for people you might like!"
                      loading
                      isSolid
                    />
                  </View>
                </ThemedView>
              </View>
            )}
            
            {/* No more cards */}
            {!getCurrentUser() && !loading && (
              <View style={styles.card}>
                <ThemedView color="primary" shadow style={styles.cardInner}>
                  <View style={styles.noMoreCards}>
                    <GradientBlobs/>
                    <EmptyMessage
                      title="No more potential matches"
                      description="Check back later for new people!"
                      iconLibrary="MaterialDesignIcons"
                      iconName="robot-excited"
                      isSolid
                      buttonLabel="Refresh"
                      buttonAction={fetchPotentialMatches}
                    />
                  </View>
                </ThemedView>
              </View>
            )}
          </View>

          <View style={styles.bottomOptionContainer}>
            <TouchableOpacity 
              style={[styles.bottomOption, { backgroundColor: "#B85C5C" }]}
              onPress={handlePass}
              disabled={!getCurrentUser()}
            >
              <ThemedIcons library="MaterialIcons" name="close" size={35} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bottomOption, { backgroundColor: "#4CAF50" }]}
              onPress={handleLike}
              disabled={!getCurrentUser()}
            >
              <Foundation name="like" size={35} color="white" />
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={() => router.push("/taraBuddy/taraBuddy-settings")}>
              <ThemedView color="primary" shadow style={styles.settings}>
                <ThemedIcons library="MaterialIcons" name="settings" size={20} />
              </ThemedView>
            </TouchableOpacity> */}
          </View>
          
          {/* Match Modal */}
          {showMatchModal && matchedUser && (
            <View style={styles.matchModal}>
              <View style={{ flex: 1, backgroundColor: primaryColor, 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.9, zIndex: 1000 }} />
              <View style={styles.matchModalContent}>
                <View style={styles.matchUsers}>
                  <Image 
                    source={{ uri: session?.user?.profileImage || '' }} 
                    style={styles.matchUserImage}
                  />
                  <ThemedIcons library="MaterialIcons" name="link" size={30}/>
                  <Image 
                    source={{ uri: matchedUser.profileImage }} 
                    style={styles.matchUserImage}
                  />
                </View>
                <ThemedText type="title" style={{ color: '#00CAFF', textAlign: 'center' }}>
                  It's a Match! 🎉
                </ThemedText>
                <ThemedText style={{ textAlign: 'center', marginTop: 8 }}>
                  You and {matchedUser.fname} liked each other!
                </ThemedText>
                
                <View style={{ marginTop: 20 }}>
                  <Button 
                    title="Start Chatting"
                    onPress={() => {
                      setShowMatchModal(false);
                      router.push('/(tabs)/explore');
                    }}
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => setShowMatchModal(false)}
                  style={{ marginTop: 10 }}
                >
                  <ThemedText style={{ textAlign: 'center', opacity: 0.7 }}>Keep Swiping</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
        
      )}
      <LinearGradient
        colors={['transparent', primaryColor]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.backgroundGradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomOptionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    paddingBottom: 6,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  backgroundGradient: {
    position: "absolute",
    height: 150,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomOption: {
    alignItems: "center",
    justifyContent: "center",
    width: 55,
    aspectRatio: 1,
    borderRadius: 50,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 4,
  },
  settingsContainer: {
    position: "absolute",
    top: 70,
    right: 10,
    zIndex: 999999,
    elevation: 999999, // For Android
  },
  settings: {
    alignItems: "center",
    justifyContent: "center",
    padding: 7,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,.7)",
    borderColor: "#fff",
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    opacity: 0.6
  },
  cardContainer: {
    flex: 1,
    margin: 5,
    marginBottom: 30,
    gap: 20,
    marginTop: 65,
    zIndex: 1,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
    zIndex: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc4",
  },
  nextCard: {
    zIndex: 1,
    transform: [{ scale: 0.95 }],
  },
  cardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 45,
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    position: "absolute",
    bottom: 35,
    right: 16,
    opacity: .5,
  },
  noMoreCards: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  matchModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  matchModalContent: {
    margin: 20,
    position: 'absolute',
    zIndex: 1001,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 35,
  },
  matchUserImage: {
    width: 75,
    height: 75,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#ccc",
  },
});