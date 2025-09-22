import OptionsPopup from "@/components/OptionsPopup";
import { ThemedText } from "@/components/ThemedText";
import { TouchableOpacity } from "react-native";
import { ThemedIcons } from "@/components/ThemedIcons";
import { StyleSheet, Animated, Modal } from "react-native";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useColorScheme } from "@/hooks/useThemeColor";

export const renderSystemTheme = () => {
  const { theme: selectedTheme, setTheme, THEME_TYPES } = useTheme();
  const deviceColorScheme = useColorScheme();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [transitioningTheme, setTransitioningTheme] = useState<string>('');
  const [modalAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(300)); // Start from bottom
  const [iconAnimation] = useState(new Animated.Value(0));
  const [rotationAnimation] = useState(new Animated.Value(0));
  
  // Get theme colors for modal
  const getThemeColors = (themeType: string) => {
    switch (themeType) {
      case THEME_TYPES.LIGHT:
        return {
          overlay: 'rgba(244,244,244,.95)',
          icon: '#FFB74D',
          text: '#000000',
          contentBg: '#FFFFFF'
        };
      case THEME_TYPES.DARK:
        return {
          overlay: 'rgba(2,13,25,.95)',
          icon: '#C0C0C0',
          text: '#FFFFFF',
          contentBg: '#001C30'
        };
      case THEME_TYPES.DEVICE:
        // Use device's actual theme colors
        if (deviceColorScheme === 'light') {
          return {
            overlay: 'rgba(244,244,244,.95)',
            icon: '#FFB74D',
            text: '#000000',
            contentBg: '#FFFFFF'
          };
        } else {
          return {
            overlay: 'rgba(2,13,25,.95)',
            icon: '#C0C0C0',
            text: '#FFFFFF',
            contentBg: '#001C30'
          };
        }
      default:
        // Fallback to system theme colors
        return {
          overlay: 'rgba(0, 0, 0, 0.9)',
          icon: '#007AFF',
          text: '#FFFFFF',
          contentBg: '#1C1C1E'
        };
    }
  };

  const handleThemeSelect = async (themeType: string) => {
    try {
      // Set the transitioning theme and show modal
      setTransitioningTheme(themeType);
      setShowThemeModal(true);
      
      // Start modal animations
      Animated.parallel([
        Animated.timing(modalAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(iconAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotationAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          { iterations: 3 }
        )
      ]).start();

      // Set the theme directly without animation
      await setTheme(themeType as any);

      // Hide modal after theme transition completes
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(modalAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnimation, {
            toValue: 300,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          setShowThemeModal(false);
          setTransitioningTheme('');
          // Reset animations
          modalAnimation.setValue(0);
          slideAnimation.setValue(300);
          iconAnimation.setValue(0);
          rotationAnimation.setValue(0);
        });
      }, 2000); // Show modal for 2 seconds
    } catch (error) {
      console.error('Error saving theme:', error);
      setShowThemeModal(false);
    }
  };

  // Get theme display info
  const getThemeInfo = (themeType: string) => {
    switch (themeType) {
      case THEME_TYPES.DEVICE:
        return { icon: 'phone-android', name: 'Device Theme' };
      case THEME_TYPES.LIGHT:
        return { icon: 'light-mode', name: 'Light Mode' };
      case THEME_TYPES.DARK:
        return { icon: 'dark-mode', name: 'Dark Mode' };
      default:
        return { icon: 'palette', name: 'Theme' };
    }
  };

  const themeInfo = getThemeInfo(transitioningTheme);
  const themeColors = getThemeColors(transitioningTheme);

  return(
    <>
      {/* Theme Transition Modal */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
      >
        <Animated.View 
          style={[
            styles.themeModalOverlay,
            {
              backgroundColor: themeColors.overlay,
              opacity: modalAnimation,
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.themeModalContent,
              {
                transform: [
                  {
                    translateY: slideAnimation
                  },
                  {
                    scale: iconAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    })
                  }
                ]
              }
            ]}
          >
            <Animated.View
              style={{
                transform: [{
                  rotate: rotationAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }]
              }}
            >
              <ThemedIcons 
                library='MaterialIcons' 
                name={themeInfo.icon} 
                size={80} 
                color={themeColors.icon} 
              />
            </Animated.View>
            <ThemedText style={[styles.themeModalSubtitle, { color: themeColors.text }]}>
              Switching to
            </ThemedText>
            <ThemedText type="title" style={[styles.themeModalTitle, { color: themeColors.text }]}>
              {themeInfo.name}
            </ThemedText>
          </Animated.View>
        </Animated.View>
      </Modal>

      <OptionsPopup
        key="systemTheme"
        style={styles.optionsChild}
        options={[
          <TouchableOpacity 
            key="device" 
            style={styles.themeOption}
            onPress={() => handleThemeSelect(THEME_TYPES.DEVICE)}
          >
            <ThemedIcons library='MaterialIcons' name='phone-android' size={20} />
            <ThemedText>Device Theme</ThemedText>
            {selectedTheme === THEME_TYPES.DEVICE && (
              <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
            )}
          </TouchableOpacity>,
          <TouchableOpacity 
            key="light" 
            style={styles.themeOption}
            onPress={() => handleThemeSelect(THEME_TYPES.LIGHT)}
          >
            <ThemedIcons library='MaterialIcons' name='light-mode' size={20} />
            <ThemedText>Light Mode</ThemedText>
            {selectedTheme === THEME_TYPES.LIGHT && (
              <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
            )}
          </TouchableOpacity>,
          <TouchableOpacity 
            key="dark" 
            style={styles.themeOption}
            onPress={() => handleThemeSelect(THEME_TYPES.DARK)}
          >
            <ThemedIcons library='MaterialIcons' name='dark-mode' size={20} />
            <ThemedText>Dark Mode</ThemedText>
            {selectedTheme === THEME_TYPES.DARK && (
              <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
            )}
          </TouchableOpacity>,
        ]}
          >

            <ThemedIcons library='MaterialIcons' name='palette' size={15} />
            <ThemedText>App Theme</ThemedText>
          </OptionsPopup>
    </>
  )
}

const styles = StyleSheet.create({
    optionsChild: {
        padding: 10,
        fontSize: 15,
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    themeOption: {
      flexDirection: 'row',
      gap: 15,
      alignItems: 'center',
      flex: 1,
    },
    themeModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    themeModalContent: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 250,
    },
    themeModalTitle: {
      textAlign: 'center',
    },
    themeModalSubtitle: {
      marginTop: 30,
      textAlign: 'center',
      fontSize: 16,
    },
  });