import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import TextField from "@/components/TextField";
import ThemedIcons from "@/components/ThemedIcons";
import Button from '@/components/Button';
import TaraBuddySection from '@/app/taraBuddy/taraBuddy';
import GroupsSection from '@/app/groups/groups';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import OptionsPopup from '@/components/OptionsPopup';
import { groupsApiService, Group } from "@/services/groupsApiService";
import { useSession } from "@/context/SessionContext";
import ToursSection from '../tours/tours';
import { useLocalSearchParams } from 'expo-router';

export default function ExploreScreen() {
  const params = useLocalSearchParams();
  const initialTab = params.tab ? parseInt(params.tab as string) : 0;
  const [activeTab, setActiveTab] = useState(initialTab);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabHeight = 60;
  const secondaryColor = useThemeColor({}, 'secondary');
  const primaryColor = useThemeColor({}, 'primary');
  const { session } = useSession();
  
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  

  useEffect(() => {
    lastScrollY.current = 0;
  }, []);

  // Handle tab parameter from navigation
  useEffect(() => {
    if (params.tab) {
      const tabIndex = parseInt(params.tab as string);
      if (tabIndex >= 0 && tabIndex <= 2) {
        setActiveTab(tabIndex);
      }
    }
  }, [params.tab]);

  const handleTabPress = (idx: number) => {
    if (idx === activeTab) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      setActiveTab(idx);
    }
  };

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const isScrollingUp = currentScrollY < lastScrollY.current;
    const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);
    
    scrollY.setValue(currentScrollY);
    
    if (isScrollingUp && scrollDifference > 10) {
      Animated.parallel([
        Animated.timing(headerVisible, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else if (!isScrollingUp && currentScrollY > stickyHeight) {
      Animated.parallel([
        Animated.timing(headerVisible, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: -stickyHeight,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
    
    lastScrollY.current = currentScrollY;
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
        Alert.alert('Error', 'Please enter a group name');
        return;
    }

    if (!session?.accessToken || !session?.user) {
        Alert.alert('Error', 'Please log in to create a group');
        return;
    }

    try {
        setLoading(true);
        
        // Combine name parts
        const fullName = [
            session.user.fname,
            session.user.mname,
            session.user.lname
        ].filter(Boolean).join(' ');

        const createGroupData = {
            groupName: groupName.trim(),
            userID: session.user.id,
            username: session.user.username,
            name: fullName,
            profileImage: session.user.profileImage || '',
        };

        const result = await groupsApiService.createGroup(session.accessToken, createGroupData);
        
        Alert.alert(
            'Group Created!', 
            `Group "${groupName}" has been created successfully!\n\nInvite Code: ${result.inviteCode}\n\nShare this code with friends to invite them to your group.`,
            [
                {
                    text: 'Copy Code',
                    onPress: () => {
                        // You can implement clipboard functionality here if needed
                        console.log('Invite code:', result.inviteCode);
                    }
                },
                { text: 'OK' }
            ]
        );
        
        setGroupName('');
        setForceRefresh(true); // Force refresh to get updated groups list
    } catch (error) {
        console.error('Error creating group:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create group');
    } finally {
        setLoading(false);
    }
};

const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
        Alert.alert('Error', 'Please enter an invite code');
        return;
    }

    if (!session?.accessToken || !session?.user) {
        Alert.alert('Error', 'Please log in to join a group');
        return;
    }

    try {
        setLoading(true);
        
        // Combine name parts
        const fullName = [
            session.user.fname,
            session.user.mname,
            session.user.lname
        ].filter(Boolean).join(' ');

        const joinGroupData = {
            inviteCode: inviteCode.trim().toUpperCase(),
            userID: session.user.id,
            username: session.user.username,
            name: fullName,
            profileImage: session.user.profileImage || '',
        };

        await groupsApiService.joinGroup(session.accessToken, joinGroupData);
        
        Alert.alert(
            'Join Request Sent!', 
            'Your request to join the group has been sent. You will be notified when an admin approves your request.'
        );
        
        setInviteCode('');
        setForceRefresh(true); // Force refresh to get updated groups list
    } catch (error) {
        console.error('Error joining group:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join group');
    } finally {
        setLoading(false);
    }
};

  const stickyHeight = tabHeight;
  const headerVisible = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = headerVisible;

  return (
    <ThemedView style={{flex:1}}>
      <Animated.View 
        style={[
          styles.stickyHeader,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          }
        ]}
      >
        <ThemedView color='primary' style={styles.tabRow}>
          {[
            'Tours',
            'Rooms',
            'TaraBuddy', 
          ].map((label, idx) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.tabButton,
                activeTab === idx && styles.activeTabButton,
                { flex: 1 },
              ]}
              onPress={() => handleTabPress(idx)}
              activeOpacity={0.7}
            >
              <View style={styles.tabInnerContainer}>
                <ThemedText style={[
                  styles.tabText,
                  activeTab === idx && {color: secondaryColor, opacity: 1},
                ]}>{label}</ThemedText>
              </View>
              <View style={[
                styles.tabUnderline,
                activeTab === idx && {backgroundColor: secondaryColor},
              ]} />
            </TouchableOpacity>
          ))}
        </ThemedView>
      </Animated.View>

      {/* Content */}
      <View style={{flex: 1}}>
      <View style={[styles.sectionContainer, { display: activeTab === 0 ? 'flex' : 'none' }]}>
          <ScrollView 
            ref={activeTab === 0 ? scrollViewRef : null}
            showsVerticalScrollIndicator={false}
            style={{width: '100%', height: '100%'}}
            contentContainerStyle={{ paddingTop: stickyHeight }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <ToursSection/>
          </ScrollView>
        </View>
        {/* Your Groups */}
        <View style={[styles.sectionContainer, { display: activeTab === 1 ? 'flex' : 'none' }]}>
          <ScrollView 
            ref={activeTab === 1 ? scrollViewRef : null}
            showsVerticalScrollIndicator={false}
            style={{width: '100%', height: '100%'}}
            contentContainerStyle={{ paddingTop: stickyHeight }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <GroupsSection/>
          </ScrollView>
          <OptionsPopup
          key="joinGroup"
          style={[styles.addButton, {backgroundColor: primaryColor, bottom: 75}]}
          options={[
              <View key="header">
              <ThemedText type='subtitle'>Join A Group</ThemedText>
              <ThemedText>Input a valid invite code</ThemedText>
              
              </View>,
              <View style={{flex: 1}} key="form">
              <TextField
                  placeholder="Enter Invite Code"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  onFocus={() => {}}
                  onBlur={() => {}}
                  isFocused={false}
                  autoCapitalize="characters"
              />
              <Button
                  title={loading ? 'Joining...' : 'Join'}
                  type='primary'
                  onPress={handleJoinGroup}
                  disabled={loading}
              />
              </View>
          ]}>
              <ThemedIcons library='MaterialIcons' name='group-add' size={25} />
          </OptionsPopup>

          <OptionsPopup
            key="createGroup"
            style={[styles.addButton, {backgroundColor: secondaryColor, bottom: 10}]}
            options={[
                <View key="header">
                <ThemedText type='subtitle'>Create a Group</ThemedText>
                <ThemedText>Create a group name and invite your friends</ThemedText>
                </View>,
                <View style={{flex: 1}} key="form">
                <TextField
                placeholder="Enter Group Name"
                value={groupName}
                onChangeText={setGroupName}
                onFocus={() => {}}
                onBlur={() => {}}
                isFocused={false}
                autoCapitalize="words"
                />
                <Button
                title={loading ? 'Creating...' : 'Create'}
                type='primary'
                onPress={handleCreateGroup}
                disabled={loading}
                />
            </View>
            ]}>
                <ThemedIcons library='MaterialIcons' name='add' size={30} color='white'/>
            </OptionsPopup>
        </View>
        <View style={[styles.sectionContainer, { display: activeTab === 2 ? 'flex' : 'none' }]}>
          <TaraBuddySection/>
        </View>
        
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  tabRow: {
    flexDirection: 'row',   
    justifyContent: 'space-between',
    alignItems: 'stretch',
    height: 60,
    paddingTop: 16,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 1,
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  activeTabButton: {
    backgroundColor: 'transparent',
  },
  tabInnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: .6
  },
  tabUnderline: {
    height: 2,
    width: '80%',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  sectionContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  addButton: {
    width: 57,
    aspectRatio: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
    shadowColor: 'rgba(0,0,0,.3)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
},
});