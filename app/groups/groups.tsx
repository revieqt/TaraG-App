import OptionsPopup from "@/components/OptionsPopup";
import TextField from "@/components/TextField";
import { ThemedText } from "@/components/ThemedText";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import ThemedIcons from "@/components/ThemedIcons";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import EmptyMessage from '@/components/EmptyMessage';
import { useSession } from "@/context/SessionContext";
import { groupsApiService, Group } from "@/services/groupsApiService";
import { getUserTours, Tour } from "@/services/tourApiService";
import LoadingContainerAnimation from "@/components/LoadingContainerAnimation";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function GroupsSection({ activeTab ="all" }: {activeTab?: string}){
    const { session } = useSession();
    const [selectedTab, setSelectedTab] = useState<string>(activeTab);
    const primaryColor = useThemeColor({}, 'primary');
    const accentColor = useThemeColor({}, 'accent');  
    const textColor = useThemeColor({}, 'text');
    
    // State management
    const [searchText, setSearchText] = useState("");
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [userTours, setUserTours] = useState<Tour[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [toursLoading, setToursLoading] = useState(true);

    // Refetch groups and tours every time component loads/comes into focus
    useFocusEffect(
        useCallback(() => {
            loadUserGroups();
            loadUserTours();
        }, [session?.accessToken, session?.user?.id])
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
        } catch (error) {
            console.error('❌ Error loading groups:', error);
            Alert.alert('Error', 'Failed to load groups');
        } finally {
            setGroupsLoading(false);
        }
    };

    const loadUserTours = async () => {
        if (!session?.accessToken || !session?.user?.id) {
            console.log('❌ No session or user ID available for loading tours');
            setToursLoading(false);
            return;
        }

        try {
            setToursLoading(true);
            console.log('🔍 Loading tours for user:', session.user.id);
            const tours = await getUserTours(session.user.id, session.accessToken);
            console.log('✅ Tours loaded:', tours.length, tours);
            setUserTours(tours);
        } catch (error) {
            console.error('❌ Error loading tours:', error);
            Alert.alert('Error', 'Failed to load tours');
        } finally {
            setToursLoading(false);
        }
    };

    const filteredGroups = userGroups.filter(group => 
        group.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const filteredTours = userTours.filter(tour => 
        tour.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const filteredItems = selectedTab === 'groups' ? filteredGroups : 
                          selectedTab === 'tours' ? filteredTours : 
                          [...filteredGroups, ...filteredTours];

    const renderTourItem = ({ item }: { item: Tour }) => (
        <ThemedView color='primary' shadow style={styles.groupContainer}>
            <TouchableOpacity 
                onPress={() => router.push({
                    pathname: '/tours/tours-view',
                    params: { tourData: JSON.stringify(item) }
                })}
            >
                <View style={styles.groupHeader}>
                    <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                    <View style={styles.memberCount}>
                        <ThemedIcons library='MaterialIcons' name='tour' size={16} />
                        <ThemedText style={{ fontSize: 12, marginLeft: 4 }}>
                            {(item.participants?.members?.filter((m: any) => m.isApproved)?.length || 0)}
                        </ThemedText>
                    </View>
                </View>
                <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                    {item.description.substring(0, 50)}{item.description.length > 50 ? '...' : ''}
                </ThemedText>
            </TouchableOpacity>
        </ThemedView>
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
                {(groupsLoading || toursLoading) ? (
                    <ThemedView color='primary' shadow style={styles.groupContainer}>
                        <View style={styles.groupHeader}>
                            <View style={styles.cardTitleLoading}><LoadingContainerAnimation/></View>
                            <View style={styles.cardMemberCountLoading}><LoadingContainerAnimation/></View>
                        </View>
                        <View style={styles.cardInviteCodeLoading}><LoadingContainerAnimation/></View>
                    </ThemedView>
                ) : filteredItems.length > 0 ? (
                    <View>
                        {selectedTab === 'groups' && filteredGroups.map((item) => (
                            <View key={item.id || ''}>
                                {renderGroupItem({ item })}
                            </View>
                        ))}
                        {selectedTab === 'tours' && filteredTours.map((item) => (
                            <View key={item.tourID || ''}>
                                {renderTourItem({ item })}
                            </View>
                        ))}
                        {selectedTab === 'all' && (
                            <>
                                {filteredGroups.map((item) => (
                                    <View key={`group-${item.id}`}>
                                        {renderGroupItem({ item })}
                                    </View>
                                ))}
                                {filteredTours.map((item) => (
                                    <View key={`tour-${item.tourID}`}>
                                        {renderTourItem({ item })}
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                ) : (
                    <>
                        { searchText ? (
                            <EmptyMessage iconLibrary='MaterialIcons' 
                            iconName={selectedTab === 'tours' ? 'tour' : 'groups'}
                            title={`No ${selectedTab === 'tours' ? 'tours' : selectedTab === 'groups' ? 'groups' : 'items'} match your search`}
                            description="Try other keywords"
                            />
                        ):(
                            <EmptyMessage iconLibrary='MaterialIcons' 
                            iconName={selectedTab === 'tours' ? 'tour' : 'groups'}
                            title={`No ${selectedTab === 'tours' ? 'tours' : selectedTab === 'groups' ? 'groups' : 'groups or tours'} found`}
                            description={`You haven't joined any ${selectedTab === 'tours' ? 'tours' : selectedTab === 'groups' ? 'groups' : 'groups or tours'} yet`}
                            />
                        )}
                    </>
                )}
            </View>
    </View>
    
   ); 
}

const styles = StyleSheet.create({
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
        marginBottom: 10,
        gap: 8,
    }
});