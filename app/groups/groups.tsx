import OptionsPopup from "@/components/OptionsPopup";
import TextField from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import ThemedIcons from "@/components/ThemedIcons";
import Button from '@/components/Button';
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import EmptyMessage from '@/components/EmptyMessage';
import { useSession } from "@/context/SessionContext";
import { groupsApiService, Group } from "@/services/groupsApiService";

export default function GroupsSection(){
    const primaryColor = useThemeColor({}, 'primary');
    const secondaryColor = useThemeColor({}, 'secondary');
    const { session } = useSession();
    
    // State management
    const [searchText, setSearchText] = useState("");
    const [groupName, setGroupName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);
    const [forceRefresh, setForceRefresh] = useState(false);

    // Cache configuration
    const CACHE_DURATION = 30000; // 30 seconds cache

    // Load user's groups on component mount
    useEffect(() => {
        loadUserGroups();
    }, [session]);

    // Check if data is stale and needs refresh
    const isDataStale = () => {
        const now = Date.now();
        return (now - lastFetchTime) > CACHE_DURATION || forceRefresh;
    };

    // Listen for focus events to refresh groups when returning from group actions
    useFocusEffect(
        useCallback(() => {
            // Only refresh if data is stale or force refresh is requested
            if (isDataStale()) {
                loadUserGroups();
                setForceRefresh(false);
            }
        }, [lastFetchTime, forceRefresh])
    );

    const loadUserGroups = async () => {
        if (!session?.accessToken || !session?.user?.id) {
            console.log('❌ No session or user ID available for loading groups');
            setGroupsLoading(false);
            return;
        }

        try {
            setGroupsLoading(true);
            console.log('🔍 Loading groups for user:', session.user.id);
            const groups = await groupsApiService.getGroups(session.accessToken, session.user.id);
            console.log('✅ Groups loaded:', groups.length, groups);
            setUserGroups(groups);
            setLastFetchTime(Date.now()); // Update cache timestamp
        } catch (error) {
            console.error('❌ Error loading groups:', error);
            Alert.alert('Error', 'Failed to load groups');
        } finally {
            setGroupsLoading(false);
        }
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

    const filteredGroups = userGroups.filter(group => 
        group.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const renderGroupItem = ({ item }: { item: Group }) => (
        
        <ThemedView color='primary' shadow style={styles.groupContainer} >
            {item.members.some(m => m.userID === session?.user?.id && !m.isApproved) ? (
                <>
                <OptionsPopup 
                    options={[
                    <View style={{justifyContent: 'center', alignItems: 'center', flex: 1, borderColor: 'rgba(0,0,0,.1)', borderBottomWidth: 1, paddingBottom: 10}}>
                        <ThemedText type="subtitle">{item.name}</ThemedText>
                        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                            Invite Code: {item.inviteCode}
                        </ThemedText>
                    </View>,
                    <View style={{flexDirection: 'row', justifyContent: 'space-between',alignItems: 'center', flex: 1}}>
                        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                            Invite Code: {item.inviteCode}
                        </ThemedText>
                        {item.members.some(m => m.userID === session?.user?.id && !m.isApproved) && (
                            <ThemedText style={{ fontSize: 12, color: 'orange', marginTop: 4 }}>
                                Pending approval
                            </ThemedText>
                        )}
                    </View>
                    ]}
                >
                    <View style={styles.groupHeader}>
                        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                        <View style={styles.memberCount}>
                            <ThemedIcons library='MaterialIcons' name='group' size={16} />
                            <ThemedText style={{ fontSize: 12, marginLeft: 4 }}>
                                {item.members.filter(m => m.isApproved).length}
                            </ThemedText>
                        </View>
                    </View>
                    <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        Invite Code: {item.inviteCode}
                    </ThemedText>
                    {item.members.some(m => m.userID === session?.user?.id && !m.isApproved) && (
                        <ThemedText style={{ fontSize: 12, color: 'orange', marginTop: 4 }}>
                            Pending approval
                        </ThemedText>
                    )}
                </OptionsPopup>
            </>):(<>
                <TouchableOpacity 
                    onPress={() => router.push({
                        pathname: '/groups/groups-view',
                        params: { groupID: item.id }
                    })}
                >
                    <View style={styles.groupHeader}>
                        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                        <View style={styles.memberCount}>
                            <ThemedIcons library='MaterialIcons' name='group' size={16} />
                            <ThemedText style={{ fontSize: 12, marginLeft: 4 }}>
                                {item.members.filter(m => m.isApproved).length}
                            </ThemedText>
                        </View>
                    </View>
                    <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        Invite Code: {item.inviteCode}
                    </ThemedText>
                </TouchableOpacity>
            </>)}
        </ThemedView>
    );

    return (
    <View style={{padding: 20}}>
        <View style={styles.options}>
            <View style={{flex: 1}}>
                <TextField
                placeholder="Search groups..."
                value={searchText}
                onChangeText={setSearchText}
                onFocus={() => {}}
                onBlur={() => {}}
                isFocused={false}
                autoCapitalize="none"
                />
            </View>

            <OptionsPopup
            key="joinGroup"
            style={[styles.addButton, {backgroundColor: primaryColor}]}
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
                <ThemedIcons library='MaterialIcons' name='group-add' size={20} />
            </OptionsPopup>

            <OptionsPopup
            key="createGroup"
            style={[styles.addButton, {backgroundColor: secondaryColor}]}
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
                <ThemedIcons library='MaterialIcons' name='add' size={25} color='white'/>
            </OptionsPopup>
            </View>

            <View style={{flex: 1}}>
                {groupsLoading ? (
                    <EmptyMessage iconLibrary='MaterialDesignIcons' iconName='note-remove'
                    title='Loading'
                    description="Please wait..."
                    loading
                    />
                ) : filteredGroups.length > 0 ? (
                    <View>
                        {filteredGroups.map((item) => (
                            <View key={item.id || ''}>
                                {renderGroupItem({ item })}
                            </View>
                        ))}
                    </View>
                ) : (
                    <>
                        { searchText ? (
                            <EmptyMessage iconLibrary='MaterialIcons' iconName='groups'
                            title='No groups match your search'
                            description="Try other keywords"
                            />
                        ):(
                            <EmptyMessage iconLibrary='MaterialIcons' iconName='groups'
                            title='No groups found'
                            description="You haven't joined any groups yet"
                            />
                        )}
                    </>
                )}
            </View>
    </View>
    
   ); 
}

const styles = StyleSheet.create({
    addButton: {
        marginTop: -12,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    options:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    groupContainer:{
        padding: 20,
        borderRadius: 10,
        marginBottom: 10,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    memberCount: {
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.7,
    },
});