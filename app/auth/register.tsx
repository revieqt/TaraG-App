import Button from '@/components/Button';
import ContactNumberField from '@/components/ContactNumberField';
import DatePicker from '@/components/DatePicker';
import DropDownField from '@/components/DropDownField';
import PasswordField from '@/components/PasswordField';
import TextField from '@/components/TextField';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { registerUserViaBackend } from '@/services/authApiService';
import { useSession } from '@/context/SessionContext';
import { calculateAge } from '@/utils/calculateAge';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { openDocument } from '@/utils/documentUtils';
import GradientHeader from '@/components/GradientHeader';

export default function RegisterScreen() {
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [mname, setMname] = useState('');
  const [bdate, setBdate] = useState<Date | null>(null);
  const [gender, setGender] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [areaCode, setAreaCode] = useState('+63');
  const { updateSession } = useSession();

  const handleRegister = async () => {
    setErrorMsg('');
    if (
      !fname ||
      !lname ||
      !bdate ||
      !gender ||
      !contactNumber ||
      !username ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setErrorMsg('Required fields must not be empty.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const age = calculateAge(bdate as Date);
    if (age < 13) {
      setErrorMsg('You must be at least 13 years old to register.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setLoading(true);

    try {
      const response = await registerUserViaBackend({
        email,
        password,
        fname,
        lname,
        mname: mname || '',
        bdate: bdate!.toISOString(),
        gender,
        contactNumber: areaCode + contactNumber,
        username,
        status: 'active',
        type: 'traveler',
      });

      // Navigate to login after successful registration
      router.replace('/auth/login');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('Email is already in use.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMsg('Invalid email address.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else if (error.error) {
        setErrorMsg(error.error);
      } else {
        setErrorMsg('Registration failed.');
      }
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, width: '100%' }}
    >
      <GradientHeader/>
      <ThemedView>
        <ScrollView
          ref={scrollRef}
          style={{ width: '100%', padding: 20, zIndex: 2 }}
          contentContainerStyle={{ paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={{ marginTop: 50 }}>
            Create an Account
          </ThemedText>
          <ThemedText style={{ marginBottom: 20 }}>
            Fill up the form and join our growing community!
          </ThemedText>

          {errorMsg ? (
            <ThemedText type='error'>{errorMsg}</ThemedText>
          ) : null}

          <TextField
            placeholder="First Name"
            value={fname}
            onChangeText={setFname}
            autoCapitalize="words"
          />

          <TextField
            placeholder="Last Name"
            value={lname}
            onChangeText={setLname}
            autoCapitalize="words"
          />

          <TextField
            placeholder="Middle Name (optional)"
            value={mname}
            onChangeText={setMname}
            autoCapitalize="words"
          />

          <DatePicker
            placeholder="Birthdate"
            value={bdate}
            onChange={setBdate}
          />

          <DropDownField
            placeholder="Gender"
            value={gender}
            onValueChange={setGender}
            values={['Male', 'Female', 'Other']}
            style={{ marginBottom: 15 }}
          />

          <ContactNumberField
            areaCode={areaCode}
            onAreaCodeChange={setAreaCode}
            number={contactNumber}
            onNumberChange={setContactNumber}
            placeholder="Contact Number"
            style={{ marginBottom: 15 }}
          />

          <TextField
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <PasswordField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
          />

          <PasswordField
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginVertical: 7}}>
            <ThemedText style={{opacity: .5}}>By creating an account, you agree to our </ThemedText>
            <TouchableOpacity onPress={() => openDocument('terms-mobileApp')}>
              <ThemedText type='link'>Terms and Conditions</ThemedText>
            </TouchableOpacity>
          </View>

          <Button
            title={loading ? 'Registering...' : 'Register'}
            onPress={handleRegister}
            type="primary"
            buttonStyle={{ width: '100%', marginTop: 16 }}
            loading={loading}
          />

          <TouchableOpacity onPress={() => router.push('/auth/login')} style={{alignSelf: 'center', marginTop: 16}}>
            <ThemedText>
              Already have an account? <ThemedText type='link'>Login</ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
});