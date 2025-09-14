import Button from '@/components/Button';
import TextField from '@/components/TextField';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { sendPasswordResetViaBackend } from '@/services/authApiService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native';

const RESEND_COOLDOWN = 180; // seconds

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendReset = async () => {
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (cooldown > 0) return;
    try {
      setSending(true);
      await sendPasswordResetViaBackend(email);
      setEmailSent(true);
      setCooldown(RESEND_COOLDOWN);
      Alert.alert('Email Sent', 'Please check your inbox for password reset instructions.');
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to send password reset email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ThemedView style={styles.background}>
      {/* Floating back arrow */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/auth/login');
          }
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
        <ThemedText type="title">Forgot Password</ThemedText>
        <ThemedText style={{ marginBottom: 20 }}>Enter your email to reset your password.</ThemedText>

        {emailSent && (
          <ThemedText style={{ marginBottom: 10 }}>
            We've sent a password reset link to: {email}
          </ThemedText>
        )}

        {errorMsg ? (
          <ThemedText type='error' style={{ marginBottom: 10 }}>{errorMsg}</ThemedText>
        ) : null}

        {!emailSent && (
          <TextField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ marginBottom: 16, opacity: (sending || cooldown > 0) ? 0.5 : 1 }}
            onFocus={() => {
              if (sending || cooldown > 0) return false;
            }}
          />
        )}

        <Button
          title={
            sending
              ? 'Sending...'
              : cooldown > 0
                ? `Resend Email (${cooldown}s)`
                : emailSent
                  ? 'Resend Password Reset Email'
                  : 'Send Password Reset Email'
          }
          onPress={handleSendReset}
          type="primary"
          buttonStyle={{ width: '100%', marginTop: 16 }}
          disabled={sending || cooldown > 0}
        />
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
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});