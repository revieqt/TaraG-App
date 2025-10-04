import Button from '@/components/Button';
import GradientHeader from '@/components/GradientHeader';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';import { useSession } from '@/context/SessionContext';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert,  ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import RangeBar from '@/components/RangeBar';
import { useTaraBuddyApi } from '@/services/taraBuddyApiService';

export default function TaraBuddySettingsScreen() {
  const { session} = useSession();
  const user = session?.user;
const pref = user?.taraBuddyPreference;
  const {
    createTaraBuddyProfile,
    updateGenderPreference,
    updateMaxDistancePreference,
    updateAgePreference,
    updateZodiacPreference,
    disableTaraBuddyProfile,
  } = useTaraBuddyApi();

  const [gender, setGender] = useState<string>(pref?.gender ?? '');
  const [maxDistance, setMaxDistance] = useState<number>(pref?.maxDistance ?? 25);
  const [ageRange, setAgeRange] = useState<[number, number]>((pref?.ageRange ?? [22, 35]) as [number, number]);
  const [zodiacArr, setZodiacArr] = useState<string[]>(pref?.zodiac ?? []);

  useEffect(() => {
    if (!pref) {
      createTaraBuddyProfile().then(prefData => {
        setGender(prefData.gender);
        setMaxDistance(prefData.maxDistance);
        setAgeRange(prefData.ageRange as [number, number]);
        setZodiacArr(prefData.zodiac || []);
      });
    }
  }, []);
  
  const selectGender = (g: string) => {
    setGender(g);
    updateGenderPreference(g);
  };

const selectDistance = (val: number | [number, number]) => {
  const distanceValue = Array.isArray(val) ? val[0] : val;
  setMaxDistance(distanceValue);
  updateMaxDistancePreference(distanceValue);
};

  const selectAge = (val: number | [number, number]) => {
    const ageValues: [number, number] = Array.isArray(val)
      ? (val as [number, number])
      : ageRange;
    setAgeRange(ageValues);
    updateAgePreference(ageValues);
  };
const toggleZodiac = (sign: string) => {
    const updated = zodiacArr.includes(sign)
      ? zodiacArr.filter(z => z !== sign)
      : [...zodiacArr, sign];
    setZodiacArr(updated);
    updateZodiacPreference(updated);
  };
  const fullName = [user?.fname, user?.mname, user?.lname].filter(Boolean).join(' ');
  return (
    <ThemedView style={{ flex: 1 }}>
      <GradientHeader/>
      <ScrollView
        style={{ width: '100%', zIndex: 1000}}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
      >
        <ThemedText type='title'>TaraBuddy Settings</ThemedText>
        
        
        {/* Options */}
        <View style={styles.options}>
          
          
          <ThemedText style={styles.warning}>
            We’ll always try to match you with people who fit your preferences first. But if no one nearby fits the bill, we might show you other users in the area—you never know where a great connection might pop up!
          </ThemedText>
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Gender Preference
          </ThemedText>
          <ThemedText>
            Choose a gender preference for your buddy search.
          </ThemedText>
          <View style={styles.buttonOptionsContainer}>
            <TouchableOpacity onPress={() => selectGender('Male')}>
              <ThemedView color={gender === 'Male' ? 'secondary' : 'primary'} style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='gender-male' size={20} />
                <ThemedText>Male</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectGender('Female')}>
              <ThemedView color={gender === 'Female' ? 'secondary' : 'primary'} style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='gender-female' size={20} />
                <ThemedText>Female</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectGender('Other')}>
              <ThemedView color={gender === 'Other' ? 'secondary' : 'primary'} style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='gender-male-female-variant' size={20} />
                <ThemedText>Other</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectGender('Open to All')}>
              <ThemedView color={gender === 'Open to All' ? 'secondary' : 'primary'} style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='gender-male-female' size={20} />
                <ThemedText>Open to All</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Distance Preference
          </ThemedText>
          <ThemedText>
            Choose a distance preference for your buddy search.
          </ThemedText>
          <RangeBar
            range={[1, 100]}
            displayValue
            label="km"
            description="Maximum distance"
            initialValue={maxDistance}
            step={1}
            onValueChange={selectDistance}
          />
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Age Preference
          </ThemedText>
          <ThemedText>
            Choose an age preference for your buddy search.
          </ThemedText>
          <RangeBar
            range={[18, 80]}
            rangeBar
            displayValue
            label="years"
            description="Age range"
            initialValues={ageRange}
            step={1}
            onValueChange={selectAge}
          />
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Zodiac Sign Preference
          </ThemedText>
          <ThemedText>
            You can choose one or more zodiac sign(s) for your buddy search.
          </ThemedText>
          <View style={styles.buttonOptionsContainer}>
            {[
              'Aries',
              'Taurus',
              'Gemini',
              'Cancer',
              'Leo',
              'Virgo',
              'Libra',
              'Scorpio',
              'Sagittarius',
              'Capricorn',
              'Aquarius',
              'Pisces',
            ].map(sign => {
              const iconName = `zodiac-${sign.toLowerCase()}` as const;
              return (
                <TouchableOpacity key={sign} onPress={() => toggleZodiac(sign)}>
                  <ThemedView
                    color={zodiacArr.includes(sign) ? 'secondary' : 'primary'}
                    style={styles.buttonOption}
                  >
                    <ThemedIcons library='MaterialDesignIcons' name={iconName} size={15} />
                    <ThemedText>{sign}</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              );
            })}
          </View>

          <View>
            <Button
              title="Disable TaraBuddy"
              onPress={() => {
                Alert.alert(
                  "Disable TaraBuddy",
                  "Are you sure you want to disable your TaraBuddy profile?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Disable",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await disableTaraBuddyProfile();
                          Alert.alert("Disabled", "Your TaraBuddy profile has been disabled.");
          +               router.replace('/(tabs)/home');
                        } catch (err: any) {
                          Alert.alert("Error", err.message || "Failed to disable TaraBuddy");
                        }
                      },
                    },
                  ]
                );
              }}
              buttonStyle={{ marginTop: 30 }}
            />
            <ThemedText style={{marginVertical: 20, textAlign: 'center', opacity: .5}}>
              If you disable your TaraBuddy profile, other travelers won’t be able to find or connect with you. You can always re-enable it later if you change your mind.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    zIndex: 1000,
  },
  options: {
    gap: 10,
    width: '100%',
  },
  optionsTitle: {
    marginTop: 20,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  warning: {
    opacity: .5,
    marginVertical: 10,
  },
  buttonOptionsContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  buttonOption: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
