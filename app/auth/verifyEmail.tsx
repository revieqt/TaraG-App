import Button from '@/components/Button';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { sendVerificationEmailViaBackend, checkEmailVerificationViaBackend } from '@/services/authApiService';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native';

const RESEND_COOLDOWN = 180; // seconds

export default function VerifyEmailScreen() {
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  const { session, updateSession } = useSession();
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendVerification = async () => {
    console.log('🔍 Frontend: handleSendVerification called');
    console.log('🔍 Frontend: Session data:', { 
      hasUser: !!session?.user, 
      hasToken: !!session?.accessToken,
      email: session?.user?.email 
    });
    
    if (!session?.user?.email) {
      console.log('❌ Frontend: Missing email data');
      Alert.alert('Error', 'Please log in again to send verification email.');
      return;
    }
    if (cooldown > 0) return;
    
    try {
      setSending(true);
      console.log('📤 Frontend: Calling sendVerificationEmailViaBackend...');
      await sendVerificationEmailViaBackend(session.user.email, session.accessToken);
      console.log('✅ Frontend: Email verification request successful');
      setEmailSent(true);
      setCooldown(RESEND_COOLDOWN);
      Alert.alert('Email Sent', 'Please check your inbox to verify your email.');
    } catch (error: any) {
      console.log('❌ Frontend: Email verification failed:', error);
      Alert.alert('Error', error.message || 'Failed to send verification email.');
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!session?.user?.email) return;
    try {
      setChecking(true);
      const result = await checkEmailVerificationViaBackend(session.user.id, session.user.email);
      if (result.emailVerified && result.tokens) {
        // Create session data with tokens and fetch full user profile
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/fetch-user-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.tokens.accessToken}`,
          },
          body: JSON.stringify({ email: session.user.email }),
        });

        if (response.ok) {
          const userData = await response.json();
          await updateSession({
            user: userData.user,
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
          });
          Alert.alert('Success', 'Your email has been verified.');
          router.replace('/auth/firstLogin');
        } else {
          throw new Error('Failed to fetch user profile');
        }
      } else {
        Alert.alert('Not Verified', 'Your email is still not verified.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check verification status.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <ThemedView style={styles.background}>
      {/* Floating back arrow */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {router.replace('/auth/login');
        }}
      >
        <ThemedView>
          <ThemedIcons library='MaterialIcons' name={'arrow-back'} size={20}></ThemedIcons>
        </ThemedView>
        
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ThemedText type="title">Verify Email</ThemedText>
        <ThemedText style={{ marginBottom: 20 }}>to fully enjoy TaraG and it's features!</ThemedText>

        {emailSent && (
          <ThemedText style={{ marginBottom: 10 }}>
            We've sent a verification link to your email: {session?.user?.email}
          </ThemedText>
        )}

        <Button
          title={
            sending
              ? 'Sending...'
              : cooldown > 0
                ? `Resend Verification Email (${cooldown}s)`
                : emailSent
                  ? 'Resend Verification Email'
                  : 'Send Verification Email'
          }
          onPress={handleSendVerification}
          type="primary"
          buttonStyle={{ width: '100%', marginTop: 16 }}
          disabled={sending || cooldown > 0}
        />

        <TouchableOpacity onPress={handleCheckVerification} disabled={checking} style={{ marginTop: 20 }}>
          <ThemedText style={{ textAlign: 'center', color: '#205781', textDecorationLine: 'underline' }}>
            {checking ? 'Checking...' : 'I’ve Verified My Email'}
          </ThemedText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});