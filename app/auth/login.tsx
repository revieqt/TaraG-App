import Button from '@/components/Button';
import GradientHeader from '@/components/GradientHeader';
import PasswordField from '@/components/PasswordField';
import TextField from '@/components/TextField';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/context/SessionContext';
import { loginUserViaBackend } from '@/services/authApiService';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { updateSession } = useSession();
  // const { signIn: googleSignIn, ready: googleReady } = useGoogleLogin();

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
      
      // Update session with user data and tokens
      await updateSession({ 
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      });
      
      // Check if this is the user's first login
      if (response.user.isFirstLogin) {
        router.replace('/auth/firstLogin');
        setLoading(false);
        return;
      }
      
      router.replace('/');
    } catch (error: any) {
      if (error.requiresVerification) {
        // Store partial session data for email verification
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
    <ThemedView style={styles.background}>
      <GradientHeader/>
      <KeyboardAvoidingView
        style={{width: '100%'}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.formContainer}>
          <ThemedText type='title'>Smart Plans,</ThemedText>
          <ThemedText style={{ marginBottom: 30 }}>Safer Journeys. Join TaraG!</ThemedText>

          {errorMsg ? (
            <ThemedText type='error'>{errorMsg}</ThemedText>
          ) : null}

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

          <Button
            title={loading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            type="primary"
            loading={loading}
            buttonStyle={{ width: '100%', marginTop: 16 }}
          />

          <View style={styles.options}>
            <ThemedText>or</ThemedText>
            {/* <TouchableOpacity
              onPress={googleSignIn}
              disabled={!googleReady}
            >
              <ThemedView style={styles.circularButton} color='primary'>
                <FontAwesome name="google" size={30} color="#4285F4" />
              </ThemedView>
            </TouchableOpacity> */}
            <TouchableOpacity
              onPress={() => router.push('/auth/forgotPassword')}
              style={{ marginTop: 20, marginBottom: 10 }}
            >
              <ThemedText style={{ textAlign: 'center', color: '#205781', textDecorationLine: 'underline' }}>
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/auth/register')}
              style={{ marginVertical: 20 }}>
              <ThemedText>Dont have an account yet? Register</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    marginTop: 150,
    padding: 20
  },
  options: {
    alignItems: 'center',
    marginTop: 17,
  },
  // circularButton: {
  //   width: 60,
  //   height: 60,
  //   marginTop: 10,
  //   marginBottom: 50,
  //   borderRadius: 30,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.25,
  //   shadowRadius: 3.84,
  //   elevation: 5,
  // },
});