import React, { useEffect, useRef, useState } from "react";
import Button from '@/components/Button';
import PasswordField from '@/components/PasswordField';
import TextField from '@/components/TextField';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/context/SessionContext';
import { loginUserViaBackend } from '@/services/authApiService';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform,Animated, Dimensions,Easing, StyleSheet, TouchableOpacity, View, Image, ScrollView } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import {LinearGradient} from 'expo-linear-gradient';

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  const translateY = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -height,
        duration: 3000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, 2000);
  
    return () => clearTimeout(timer);
  }, []);
  
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
  

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { updateSession } = useSession();
  const primaryColor = useThemeColor({}, 'primary');

  const handleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      setLoading(false);
      return;
    }
    try {
      const response = await loginUserViaBackend(email, password);
      
      await updateSession({ 
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      });
      
      if (response.user.isFirstLogin) {
        router.replace('/auth/firstLogin');
        setLoading(false);
        return;
      }
      
      router.replace('/');
    } catch (error: any) {
      if (error.requiresVerification) {
        await updateSession({ 
          user: { email } as any,
          accessToken: undefined,
          refreshToken: undefined
        });
        router.replace('/auth/verifyEmail');
        setLoading(false);
        return;
      }
      
      if (error.code === 'auth/user-not-found') {
        setErrorMsg('No account found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMsg('Incorrect password.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMsg('Invalid email address.');
      } else if (error.error) {
        setErrorMsg(error.error);
      } else {
        setErrorMsg('Login failed. Please check your credentials.');
      }
    }
    setLoading(false);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >

      <ThemedView color='secondary' style={[styles.page, styles.splash]}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logoImage}
        />
      </ThemedView>

      <View style={styles.page}>
        <ThemedView color='secondary' style={{flex: 1}}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            contentContainerStyle={{flexGrow: 1}}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.contentSpacer}>
              <View style={styles.textContainer}>
                <ThemedText type='title' style={styles.title}>Smart Plans</ThemedText>
                <ThemedText type='defaultSemiBold' style={styles.subtitle}>Safer Journeys, Travel with TaraG!</ThemedText>
              </View>
              <ThemedView color='primary' style={[styles.circle, {width: 400, aspectRatio: 1, marginBottom: -250}]}>
                <ThemedView color='primary' style={styles.circle}>
                  <ThemedView color='primary' style={styles.circle}>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
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
              <LinearGradient
                colors={['transparent', primaryColor]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.gradientOverlay}
                pointerEvents="none"
              />
            </View>
            
            <ThemedView color='primary' style={{padding: 16}}>
              <TextField
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                isFocused={focusedInput === 'email'}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <PasswordField
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                isFocused={focusedInput === 'password'}
              />
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <ThemedText style={{ textAlign: 'right', color: 'red', fontSize: 13 }}>{errorMsg || ''}</ThemedText>
                <TouchableOpacity
                  onPress={() => router.push('/auth/forgotPassword')}
                >
                  <ThemedText style={{ textAlign: 'right', color: '#205781', fontSize: 13 }}>
                    Forgot Password?
                  </ThemedText>
                </TouchableOpacity>
              </View>
              

              <Button
                title={loading ? 'Logging in...' : 'Login'}
                onPress={handleLogin}
                type="primary"
                loading={loading}
                buttonStyle={{ width: '100%', marginTop: 16 }}
              />

              <View style={styles.options}>
                <TouchableOpacity
                  onPress={() => router.push('/auth/register')}>
                  <ThemedText>Dont have an account yet? Register</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    height: height * 2,
  },
  page: {
    width: "100%",
    height: height,
  },
  splash: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 80,
    resizeMode: 'contain',
  },
  contentSpacer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  options: {
    alignItems: 'center',
    marginTop: 17,
  },
  taraImage: {
    width: '62%',
    position: 'absolute',
    resizeMode: 'contain',
    borderRadius: 50,
    marginLeft: 20,
    bottom: -200,
  },
  gradientOverlay: {
    height: 100,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    pointerEvents: 'none',
  },
  textContainer:{
    top: '20%',
    gap: 3,
    position: 'absolute',
    padding: 16
  },
  title:{
    fontSize: 30,
    color: '#fff',
    textAlign: 'center'
  },
  subtitle:{
    fontSize: 14,
    color: '#fff',
    textAlign: 'center'
  },
  circle:{
    padding: 50,
    width: '100%',
    height: '100%',
    borderRadius: 500,
    opacity: 0.5
  }
});
