import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Animated, Modal, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAlerts } from '@/context/AlertsContext';
import { AlertCard } from './AlertCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AlertsContainerProps {
  children?: React.ReactNode;
}

const AlertsContainer: React.FC<AlertsContainerProps> = ({
  children,
}) => {
  const [hideAlert, setHideAlert] = useState(false);
  
  // Alert modal state
  const { globalAlerts, localAlerts, markAsRead } = useAlerts();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const allAlerts = [...globalAlerts, ...localAlerts];
  const hasUnreadAlerts = allAlerts.some(alert => alert.state === 'unread');
  
  console.log('🔍 AlertsContainer Debug:');
  console.log('📊 All alerts:', allAlerts.length);
  console.log('🔴 Has unread alerts:', hasUnreadAlerts);
  console.log('👁️ Alert button should show:', allAlerts.length > 0);
  
  
  // Animation values
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(0.8)).current;
  const contentSlide = useRef(new Animated.Value(-50)).current;
  const openContainerOpacity = useRef(new Animated.Value(0)).current;
  const openContainerScale = useRef(new Animated.Value(0.5)).current;
  const hideButtonScale = useRef(new Animated.Value(0)).current;
  const hideButtonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset current index when alerts change
    if (currentIndex >= allAlerts.length && allAlerts.length > 0) {
      setCurrentIndex(0);
      slideAnim.setValue(0);
    }
  }, [allAlerts.length, currentIndex]);

  // Handle animations when hideAlert state changes
  useEffect(() => {
    if (hideAlert) {
      // Animate container out and open container in
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlide, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(hideButtonScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(hideButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(openContainerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(openContainerScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate open container out and container in
      Animated.sequence([
        // First, hide the open container
        Animated.parallel([
          Animated.timing(openContainerOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(openContainerScale, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Then show the container and grow the hide button from the open container position
        Animated.parallel([
          Animated.timing(containerOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(containerScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(contentSlide, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          // Hide button grows out from the open container position
          Animated.timing(hideButtonScale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(hideButtonOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [hideAlert]);

  // Initial animation when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(hideButtonScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(hideButtonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const openModal = () => {
    console.log('🔔 Alert button clicked!');
    console.log('📊 All alerts count:', allAlerts.length);
    console.log('📋 Alerts data:', allAlerts);
    
    if (allAlerts.length === 0) {
      console.log('❌ No alerts to display');
      return;
    }
    
    console.log('✅ Opening alert modal');
    setIsModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      console.log('🎬 Modal animation completed');
    });
  };
  
  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setIsModalVisible(false));
  };
  
  const goToAlert = (index: number) => {
    if (index < 0 || index >= allAlerts.length) return;
    
    // Mark as read when viewing
    if (allAlerts[index].state === 'unread' && allAlerts[index].id) {
      markAsRead(allAlerts[index].id!);
    }
    
    setCurrentIndex(index);
    Animated.timing(slideAnim, {
      toValue: -index * SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const goToNext = () => {
    if (currentIndex < allAlerts.length - 1) {
      goToAlert(currentIndex + 1);
    }
  };
  
  const goToPrev = () => {
    if (currentIndex > 0) {
      goToAlert(currentIndex - 1);
    }
  };
  
  return (
    <>
      {/* Open Container (Hidden State) */}
      <Animated.View
        style={[
          styles.openContainer,
          {
            opacity: openContainerOpacity,
            transform: [{ scale: openContainerScale }],
          }
        ]}
        pointerEvents={hideAlert ? 'auto' : 'none'}
      >
        <ThemedView style={styles.openContainerInner} shadow color='secondary'>
          <TouchableOpacity onPress={() => setHideAlert(false)}>
            <ThemedIcons library='MaterialIcons' name="notifications" size={20} color='white'/>
          </TouchableOpacity>
        </ThemedView>
      </Animated.View>

      {/* Main Container (Visible State) */}
      <Animated.View
        style={[
          styles.container,
          {
            opacity: containerOpacity,
            transform: [{ scale: containerScale }],
          }
        ]}
        pointerEvents={hideAlert ? 'none' : 'auto'}
      >
        
        <Animated.View
          style={{
            transform: [{ translateY: contentSlide }],
          }}
        >
          {children}
        </Animated.View>
        
        {/* Alert Button - Only show if there are alerts */}
        {allAlerts.length > 0 && (
          <Animated.View
            style={{
              transform: [{ translateY: contentSlide }],
            }}
          >
            <ThemedView style={styles.alertButton} shadow>
              <TouchableOpacity 
                onPress={openModal} 
                style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5}}
              >
                <Image source={require('@/assets/images/tara-worried.png')} style={styles.taraImage} />
                {hasUnreadAlerts && <View style={styles.unreadBadge} />}
              </TouchableOpacity> 
            </ThemedView>
          </Animated.View>
        )}

        <Animated.View
          style={{
            transform: [
              { translateY: contentSlide },
              { scale: hideButtonScale }
            ],
            opacity: hideButtonOpacity,
            alignSelf: 'center',
          }}
        >
          <ThemedView style={styles.hideButton} shadow color='primary'>
            <TouchableOpacity onPress={() => setHideAlert(true)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5}}>
              <ThemedIcons library='MaterialIcons' name="keyboard-arrow-down" size={25}/>
            </TouchableOpacity>
          </ThemedView>
        </Animated.View>
      </Animated.View>
      
      {/* Alert Modal */}
      {console.log('🎭 Modal render - visible:', isModalVisible, 'alerts:', allAlerts.length)}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
          <Animated.View style={{flex: 1}}>
              <View style={{flex: 1}}>
                {/* Close Button */}
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <ThemedIcons library='MaterialIcons' name="close" size={25} color='white'/>
                </TouchableOpacity>
                
                <Animated.View 
                  style={[
                    styles.alertCarousel,
                    { transform: [{ translateX: slideAnim }] }
                  ]}
                >
                  {allAlerts.map((alert, index) => (
                    <View key={alert.id || index} style={styles.alertWrapper}>
                      <AlertCard 
                        alert={alert} 
                        onPress={() => {}}
                      />
                    </View>
                  ))}
                </Animated.View>
                
                {/* Navigation Dots */}
                <View style={styles.dotsContainer}>
                  {allAlerts.map((alert, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dot,
                        index === currentIndex && styles.activeDot,
                        alert.state === 'unread' && styles.unreadDot
                      ]}
                      onPress={() => goToAlert(index)}
                    />
                  ))}
                </View>
                
                {/* Navigation Arrows */}
                {allAlerts.length > 1 && (
                  <>
                    {currentIndex > 0 && (
                      <TouchableOpacity 
                        style={[styles.arrowButton, styles.arrowLeft]}
                        onPress={goToPrev}
                      >
                        <ThemedIcons library="MaterialIcons" name="chevron-left" size={24} />
                      </TouchableOpacity>
                    )}
                    {currentIndex < allAlerts.length - 1 && (
                      <TouchableOpacity 
                        style={[styles.arrowButton, styles.arrowRight]}
                        onPress={goToNext}
                      >
                        <ThemedIcons library="MaterialIcons" name="chevron-right" size={24} />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
          </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    pointerEvents: 'box-none',
    position: 'absolute',
    bottom: 10,
    right: 10,
    top: 10,
    zIndex: 1000,
    width: 70,
    alignItems: 'flex-end',
    flexDirection: 'column-reverse',
    gap: 7,
  },
  openContainer:{
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 1000,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  openContainerInner:{
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  hideButton:{
    width: '100%',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,.2)',
    opacity: .7,
  },
  alertButton:{
    width: '100%',
    aspectRatio: 1,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#FFB74D',
    borderWidth: 3,
    borderColor: '#fff'
  },
  taraImage:{
    width: 120,
    height: 120,
    marginLeft: 10,
    objectFit: 'contain',
  },
  unreadBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    borderWidth: 2,
    borderColor: 'white',
  },
  modalContent: {
    flex: 1
  },
  alertCarousel: {
    flexDirection: 'row',
    flex: 1
  },
  alertWrapper: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#007AFF',
  },
  unreadDot: {
    backgroundColor: 'red',
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  arrowLeft: {
    left: 10,
  },
  arrowRight: {
    right: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    padding: 8,
  },
});

export default AlertsContainer;
