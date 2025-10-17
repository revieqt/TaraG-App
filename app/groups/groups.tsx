import OptionsPopup from "@/components/OptionsPopup";
import TextField from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import ThemedIcons from "@/components/ThemedIcons";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import EmptyMessage from '@/components/EmptyMessage';
import { useSession } from "@/context/SessionContext";
import { groupsApiService, Group } from "@/services/groupsApiService";
import LoadingContainerAnimation from "@/components/LoadingContainerAnimation";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function GroupsSection({ activeTab ="tours" }: {activeTab?: string}){
    const { session } = useSession();
    const [selectedTab, setSelectedTab] = useState<string>(activeTab);
    const primaryColor = useThemeColor({}, 'primary');
    const accentColor = useThemeColor({}, 'accent');  
    const textColor = useThemeColor({}, 'text');
    
    // State management
    const [searchText, setSearchText] = useState("");
    const [userGroups, setUserGroups] = useState<Group[]>([]);
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
    <View style={{padding: 16}}>
        <View style={{flex: 1}}>
            <TextField
            placeholder="Search rooms..."
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => {}}
            onBlur={() => {}}
            isFocused={false}
            autoCapitalize="none"
            />
        </View>

        <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tabButton, {backgroundColor: selectedTab === "all" ? accentColor : primaryColor}]} onPress={() => setSelectedTab("all")}>
                <ThemedText style={{color: selectedTab === "all" ? 'white' : textColor, opacity: selectedTab === "all" ? 1 : 0.7}}>All</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, {backgroundColor: selectedTab === "groups" ? accentColor : primaryColor}]} onPress={() => setSelectedTab("groups")}>
                <ThemedText style={{color: selectedTab === "groups" ? 'white' : textColor, opacity: selectedTab === "groups" ? 1 : 0.7}}>Groups</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, {backgroundColor: selectedTab === "tours" ? accentColor : primaryColor}]} onPress={() => setSelectedTab("tours")}>
                <ThemedText style={{color: selectedTab === "tours" ? 'white' : textColor, opacity: selectedTab === "tours" ? 1 : 0.7}}>Tours</ThemedText>
            </TouchableOpacity>
        </View>

            <View style={{flex: 1}}>
                {groupsLoading ? (
                    <ThemedView color='primary' shadow style={styles.groupContainer}>
                        <View style={styles.groupHeader}>
                            <View style={styles.cardTitleLoading}><LoadingContainerAnimation/></View>
                            <View style={styles.cardMemberCountLoading}><LoadingContainerAnimation/></View>
                        </View>
                        <View style={styles.cardInviteCodeLoading}><LoadingContainerAnimation/></View>
                    </ThemedView>
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
    cardTitleLoading: {
        width: 150,
        height: 23,
        borderRadius: 100,
        overflow: 'hidden',
    },
    cardMemberCountLoading: {
        width: 35,
        height: 20,
        borderRadius: 100,
        overflow: 'hidden',
    },
    cardInviteCodeLoading: {
        width: 100,
        height: 17,
        marginTop: 5,
        borderRadius: 100,
        overflow: 'hidden',
    },
    tabButton:{
        paddingVertical: 7,
        paddingHorizontal: 15,
        borderRadius: 100,
    },
    tabRow:{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    }
});