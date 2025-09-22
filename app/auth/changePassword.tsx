import Button from '@/components/Button';
import BackButton from '@/components/custom/BackButton';
import PasswordField from '@/components/PasswordField';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { changePasswordViaBackend } from '@/services/authApiService';
import { useSession } from '@/context/SessionContext';
import Header from '@/components/Header';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { session } = useSession();

  const handleChangePassword = async () => {
    setFormError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (!session?.accessToken) {
      setFormError('Please log in again to change your password.');
      return;
    }

    setLoading(true);
    try {
      await changePasswordViaBackend(session.accessToken, currentPassword, newPassword);
      Alert.alert('Success', 'Your password has been changed.');
      navigation.goBack();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to change password.');
    }
    setLoading(false);
  };

    return (
    
      <ThemedView style={{flex:1}}>
        <Header label="Change Password"/>
        <KeyboardAvoidingView
          style={{ flex: 1}} // Center the container
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <View style={{padding: 20}}>
          <ThemedText style={{marginVertical: 10, marginBottom: 20}}>
            Make your account secure by changing your password regularly.
          </ThemedText>

          {formError ? (
            <ThemedText type='error'>
              {formError}
            </ThemedText>
          ) : null}

          <PasswordField
            placeholder="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            onFocus={() => setFocusedInput('current')}
            onBlur={() => setFocusedInput(null)}
            isFocused={focusedInput === 'current'}
          />

          <PasswordField
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            onFocus={() => setFocusedInput('new')}
            onBlur={() => setFocusedInput(null)}
            isFocused={focusedInput === 'new'}
          />

          <PasswordField
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setFocusedInput('confirm')}
            onBlur={() => setFocusedInput(null)}
            isFocused={focusedInput === 'confirm'}
          />
          <View>
            <Button
              title="Submit"
              onPress={handleChangePassword}
              type="primary"
              loading={loading}
            />
          </View>
        </View>
        </KeyboardAvoidingView>
      </ThemedView>
  );
}