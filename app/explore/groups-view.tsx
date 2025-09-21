import Button from '@/components/Button';
import BottomSheet from '@/components/BottomSheet';
import { BackButton } from '@/components/custom/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedIcons from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { Group, GroupMember, groupsApiService, PromoteUserRequest, KickUserRequest } from '@/services/groupsApiService';
import { useSession } from '@/context/SessionContext';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import OptionsPopup from '@/components/OptionsPopup';
import { getItinerariesById } from '@/services/itinerariesApiService';
import ViewItinerary from '@/components/custom/ViewItinerary';
import EmptyMessage from '@/components/EmptyMessage';
import ItineraryMap from '@/components/maps/ItineraryMap';

export default function GroupView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const { session } = useSession();
  const [selectedButton, setSelectedButton] = useState('members');
  const [itineraryData, setItineraryData] = useState(null);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [groupData, setGroupData] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [lastGroupFetchTime, setLastGroupFetchTime] = useState<number>(0);
  const [forceGroupRefresh, setForceGroupRefresh] = useState(false);

  // Cache configuration
  const GROUP_CACHE_DURATION = 30000; // 30 seconds cache
  
  // Get group ID from params
  const groupID = params.groupID as string;

  // Check if group data is stale and needs refresh
  const isGroupDataStale = () => {
    const now = Date.now();
    return (now - lastGroupFetchTime) > GROUP_CACHE_DURATION || forceGroupRefresh;
  };

  // Function to fetch group data
  const fetchGroupData = async (forceRefresh = false) => {
    if (!groupID || !session?.accessToken) return;
    
    // Skip fetch if data is fresh and not forcing refresh
    if (!forceRefresh && !isGroupDataStale() && groupData) {
      console.log('📋 Using cached group data');
      return;
    }
    
    setLoadingGroup(true);
    try {
      console.log('🔍 Fetching group data for ID:', groupID);
      const group = await groupsApiService.getGroupData(session.accessToken, groupID);
      console.log('✅ Group data fetched:', group);
      setGroupData(group);
      setLastGroupFetchTime(Date.now()); // Update cache timestamp
      setForceGroupRefresh(false);
    } catch (error) {
      console.error('❌ Error fetching group data:', error);
      Alert.alert('Error', 'Failed to load group data');
    } finally {
      setLoadingGroup(false);
    }
  };

  // Load group data on component mount
  useEffect(() => {
    fetchGroupData();
  }, [groupID, session]);

  // Listen for focus events to refresh data when returning from other screens
  useFocusEffect(
    useCallback(() => {
      // Clear itinerary data and refetch group data only if stale
      setItineraryData(null);
      if (isGroupDataStale()) {
        fetchGroupData(true);
      }
    }, [lastGroupFetchTime, forceGroupRefresh])
  );

  // Function to fetch itinerary data
  const fetchItinerary = async () => {
    if (!groupData?.itineraryID || !session?.accessToken) return;
    
    setLoadingItinerary(true);
    try {
      const result = await getItinerariesById(groupData.itineraryID, session.accessToken);
      if (result.success) {
        setItineraryData(result.data);
      } else {
        console.error('Failed to fetch itinerary:', result.errorMessage);
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
    } finally {
      setLoadingItinerary(false);
    }
  };

  // Auto-fetch itinerary when group data changes and has an itinerary ID
  useEffect(() => {
    if (groupData?.itineraryID && selectedButton === 'itinerary' && !itineraryData) {
      fetchItinerary();
    }
  }, [groupData?.itineraryID, selectedButton]);

  // Handle button selection and fetch itinerary if needed
  const handleButtonPress = (buttonType: string) => {
    setSelectedButton(buttonType);
    if (buttonType === 'itinerary' && groupData?.itineraryID && !itineraryData) {
      fetchItinerary();
    }
  };

  // Handle join request response (approve/reject)
  const handleJoinRequestResponse = async (userID: string, response: boolean) => {
    if (!session?.accessToken || !session?.user?.id || !groupData) return;
    
    const member = groupData.members.find(m => m.userID === userID);
    const memberName = member?.name || 'User';
    
    try {
      await groupsApiService.respondJoinRequest(session.accessToken!, {
        groupID: groupData.id!,
        userID: userID,
        response: response,
        adminID: session.user!.id
      });
      
      // Force refresh group data to get updated state
      setForceGroupRefresh(true);
      
      Alert.alert(
        'Success',
        `${memberName} has been ${response ? 'approved' : 'rejected'} successfully!`
      );
    } catch (error) {
      console.error('Error responding to join request:', error);
      Alert.alert('Error', 'Failed to respond to join request. Please try again.');
    }
  };

  // Handle promoting a user to admin
  const handlePromoteUser = async (userID: string) => {
    if (!session?.accessToken || !session?.user?.id || !groupData) return;
    
    const member = groupData.members.find(m => m.userID === userID);
    const memberName = member?.name || 'User';
    
    Alert.alert(
      'Promote to Admin',
      `Are you sure you want to promote ${memberName} to admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              await groupsApiService.promoteUserToAdmin(session.accessToken!, {
                groupID: groupData.id!,
                userID: userID,
                adminID: session.user!.id
              });
              
              // Force refresh group data to get updated state
              setForceGroupRefresh(true);
              
              Alert.alert('Success', `${memberName} has been promoted to admin!`);
            } catch (error) {
              console.error('Error promoting user:', error);
              Alert.alert('Error', 'Failed to promote user. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle kicking a user from the group
  const handleKickUser = async (userID: string) => {
    if (!session?.accessToken || !session?.user?.id || !groupData) return;
    
    const member = groupData.members.find(m => m.userID === userID);
    const memberName = member?.name || 'User';
    
    Alert.alert(
      'Kick User',
      `Are you sure you want to kick ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Kick',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsApiService.kickUserFromGroup(session.accessToken!, {
                groupID: groupData.id!,
                userID: userID,
                adminID: session.user!.id
              });
              
              // Force refresh group data to get updated state
              setForceGroupRefresh(true);
              
              Alert.alert('Success', `${memberName} has been kicked from the group.`);
            } catch (error) {
              console.error('Error kicking user:', error);
              Alert.alert('Error', 'Failed to kick user. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle leaving the group
  const handleLeaveGroup = async () => {
    if (!session?.accessToken || !session?.user?.id || !groupData) return;
    
    // Check if current user is admin and if there are other admins
    const isCurrentUserAdmin = groupData.admins.includes(session.user?.id || "");
    const otherAdmins = groupData.admins.filter(admin => admin !== session.user?.id);
    const approvedMembers = groupData.members.filter(m => m.isApproved);
    const otherMembers = approvedMembers.filter(m => m.userID !== session.user?.id);
    
    // If user is the only admin and there are no other members, offer to delete the group
    if (isCurrentUserAdmin && otherAdmins.length === 0 && otherMembers.length === 0) {
      Alert.alert(
        'Delete Group',
        'You are the only member in this group. Leaving will delete the entire group. Are you sure you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Group',
            style: 'destructive',
            onPress: async () => {
              try {
                await groupsApiService.deleteGroup(session.accessToken!, {
                  groupID: groupData.id!,
                  adminID: session.user!.id
                });
                
                Alert.alert(
                  'Success',
                  'The group has been deleted successfully.',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back()
                    }
                  ]
                );
              } catch (error) {
                console.error('Error deleting group:', error);
                Alert.alert('Error', 'Failed to delete group. Please try again.');
              }
            }
          }
        ]
      );
      return;
    }
    
    // If user is the only admin but there are other members, prevent leaving
    if (isCurrentUserAdmin && otherAdmins.length === 0 && otherMembers.length > 0) {
      Alert.alert(
        'Cannot Leave Group',
        'You are the only admin in this group. Please promote another member to admin before leaving.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    // Normal leave group flow
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsApiService.leaveGroup(session.accessToken!, {
                groupID: groupData.id!,
                userID: session.user!.id,
                adminID: session.user!.id
              });
              
              Alert.alert(
                'Success',
                'You have left the group successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle linking itinerary to group
  const handleLinkItinerary = () => {
    if (!session?.user?.id || !groupData) return;
    
    // Check if current user is admin
    const isCurrentUserAdmin = groupData.admins.includes(session.user.id);
    if (!isCurrentUserAdmin) {
      Alert.alert('Access Denied', 'Only admins can link itineraries to the group.');
      return;
    }
    
    router.push({
      pathname: '/explore/groups-linkItinerary',
      params: { groupID: groupData.id }
    });
  };

  // Handle editing itinerary
  const handleEditItinerary = () => {
    if (!itineraryData) {
      Alert.alert('Error', 'No itinerary data available to edit.');
      return;
    }
    
    router.push({
      pathname: '/home/itineraries/itineraries-update',
      params: { 
        itineraryData: JSON.stringify(itineraryData),
        returnTo: 'groups-view',
        groupID: groupData?.id
      }
    });
  };

  // Handle deleting/unlinking itinerary from group
  const handleDeleteItinerary = async () => {
    if (!session?.accessToken || !session?.user?.id || !groupData) return;
    
    // Check if current user is admin
    const isCurrentUserAdmin = groupData.admins.includes(session.user.id);
    if (!isCurrentUserAdmin) {
      Alert.alert('Access Denied', 'Only admins can unlink itineraries from the group.');
      return;
    }
    
    Alert.alert(
      'Unlink Itinerary',
      'Are you sure you want to unlink this itinerary from the group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsApiService.deleteGroupItinerary(session.accessToken!, {
                groupID: groupData!.id!,
                adminID: session.user!.id
              });
              
              // Force refresh group data to get updated state
              setForceGroupRefresh(true);
              setItineraryData(null);
              
              Alert.alert('Success', 'Itinerary has been unlinked from the group.');
            } catch (error) {
              console.error('Error unlinking itinerary:', error);
              Alert.alert('Error', 'Failed to unlink itinerary. Please try again.');
            }
          }
        }
      ]
    );
  };

  
  if (loadingGroup) {
    return (
      <ThemedView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
        <ThemedText style={{marginTop: 10}}>Loading group data...</ThemedText>
      </ThemedView>
    );
  }

  if (!groupData) {
    return (
      <ThemedView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ThemedText>Group data not found</ThemedText>
      </ThemedView>
    );
  }

  const isCurrentUserAdmin = groupData.admins.includes(session?.user?.id || "");
  const isAdmin = (userID: string) => groupData.admins.includes(userID);
  const approvedMembers = groupData.members.filter(m => m.isApproved);
  const pendingMembers = groupData.members.filter(m => !m.isApproved);

  const renderMemberItem = (member: GroupMember, isPending: boolean = false) => (
    <View key={member.userID} style={styles.memberItem}>
      <Image
        source={{ uri: member.profileImage || 'https://ui-avatars.com/api/?name=User' }}
        style={styles.memberImage}
      />
      <View style={styles.memberInfo}>
        <ThemedText type="defaultSemiBold">{member.name}</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>@{member.username}</ThemedText>
        {isAdmin(member.userID) ? (<>
          <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Admin</ThemedText>
          </>):(<>
            <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>Member</ThemedText>
          </>)}
      </View>
      {isPending && isCurrentUserAdmin && (
        <>
          <TouchableOpacity 
            style={{padding: 5}}
            onPress={() => handleJoinRequestResponse(member.userID, false)}
          >
            <ThemedIcons library="MaterialIcons" name="close" size={27} color="red"/>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{padding: 5}}
            onPress={() => handleJoinRequestResponse(member.userID, true)}
          >
            <ThemedIcons library="MaterialIcons" name="check" size={27} color="green"/>
          </TouchableOpacity>
        
        </>
      )}

      {!isPending && (member.userID !== session?.user?.id) && isCurrentUserAdmin &&(
        <OptionsPopup options={[
          <TouchableOpacity style={styles.options} onPress={() => handlePromoteUser(member.userID)}>
            <ThemedIcons library="MaterialIcons" name="admin-panel-settings" size={20} />
            <ThemedText>Give Group Admin Privileges</ThemedText>
          </TouchableOpacity>,
          <TouchableOpacity style={styles.options} onPress={() => handleKickUser(member.userID)}>
          <ThemedIcons library="MaterialIcons" name="person-off" size={20} />
          <ThemedText>Kick User</ThemedText>
        </TouchableOpacity>,
        ]}> 
          <ThemedIcons library="MaterialCommunityIcons" name="dots-vertical" size={22} color="#222" />
        </OptionsPopup>
      )}

    </View>
  );

  return (
    <ThemedView style={{flex: 1}}>
      <BackButton type='floating' />
      {itineraryData && selectedButton === 'itinerary' && (
        <ItineraryMap itinerary={itineraryData} />
      )}
      <BottomSheet snapPoints={[0.3, 0.6, 0.9]} defaultIndex={1}>
        <OptionsPopup options={[
          <TouchableOpacity style={styles.options} onPress={handleLeaveGroup}>
            <ThemedIcons library="MaterialIcons" name="person-off" size={20} />
            <ThemedText>Leave Group</ThemedText>
          </TouchableOpacity>,
        ]} style={styles.optionsButton}> 
          <ThemedIcons library="MaterialCommunityIcons" name="dots-vertical" size={22} color="#222" />
        </OptionsPopup>
  
        

        <ScrollView>
          <View style={styles.groupHeader}>
            <View style={styles.groupTitleSection}>
              <ThemedText type="title">{groupData.name}</ThemedText>
              <View style={styles.groupStats}>
                <View style={styles.statItem}>
                  <ThemedIcons library='MaterialIcons' name='code' size={16} />
                  <ThemedText style={styles.statText}>Invite Code: {groupData.inviteCode}</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedIcons library='MaterialIcons' name='group' size={16} />
                  <ThemedText style={styles.statText}>
                    {approvedMembers.length} member{approvedMembers.length !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
              </View>
            </View>

            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.buttonRow}
            >
              <TouchableOpacity style={[styles.button, {backgroundColor: selectedButton === 'members' ? accentColor : backgroundColor}]} onPress={() => handleButtonPress('members')}>
                <ThemedText>Members</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, {backgroundColor: selectedButton === 'itinerary' ? accentColor : backgroundColor}]} onPress={() => handleButtonPress('itinerary')}>
                <ThemedText>Itinerary</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, {backgroundColor: selectedButton === 'bills' ? accentColor : backgroundColor}]} onPress={() => []}>
                <ThemedText>Bill Split</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, {backgroundColor: selectedButton === 'chat' ? accentColor : backgroundColor}]} onPress={() => handleButtonPress('chat')}>
                <ThemedText>Chat</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={{flex: 1}}>
            {selectedButton === 'members' && (
              <>
                {approvedMembers.map(member => renderMemberItem(member))}
              
                {pendingMembers.length > 0 && (
                  <>
                    <ThemedText type="defaultSemiBold" style={{ marginTop: 20, marginBottom: 10, opacity: 0.7 }}>
                      Pending Approval ({pendingMembers.length})
                    </ThemedText>
                    {pendingMembers.map(member => renderMemberItem(member, true))}
                  </>
                )}
              </>
            )}

            {selectedButton === 'itinerary' && (
              <>
                {groupData.itineraryID ? (
                  <View>
                    {loadingItinerary ? (
                      <ActivityIndicator size="small" />
                    ) : itineraryData ? (
                      <View style={styles.itineraryContainer}>
                        <ViewItinerary json={itineraryData} />
                        <View style={styles.itineraryButtonContainer}>
                          <TouchableOpacity 
                            style={[styles.itineraryButton, {backgroundColor: backgroundColor}]}
                            onPress={handleEditItinerary}
                          >
                            <ThemedIcons library='MaterialDesignIcons' name='pencil' size={20}/>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.itineraryButton, {backgroundColor: 'red'}]}
                            onPress={handleDeleteItinerary}
                          >
                            <ThemedIcons library='MaterialIcons' name='delete' size={20} color='white'/>
                          </TouchableOpacity>
                          
                        </View>
                        
                      </View>
                      
                    ) : (
                      <EmptyMessage iconLibrary='MaterialDesignIcons' iconName='note-remove'
                      title='Error Loading Itinerary'
                      description="Failed to load itinerary details."
                      />
                    )}
                  </View>
                ) : (
                  <View>
                    <EmptyMessage iconLibrary='MaterialDesignIcons' iconName='note-remove'
                    title='No Itinerary Linked'
                    description="This group doesn't have an associated itinerary yet."
                    />
                    {isCurrentUserAdmin && (
                      <Button
                        title="Link Itinerary"
                        onPress={() => router.push({
                          pathname: '/explore/groups-linkItinerary',
                          params: { groupID: groupData.id }
                        })}
                        buttonStyle={{ marginTop: 15 }}
                      />
                    )}
                  </View>
                  
                )}
              </>
            )}
            
          </View>

          
        </ScrollView>
        
      </BottomSheet>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  groupHeader: {
    paddingBottom: 15,
    marginBottom: 20,
  },
  groupTitleSection: {
    marginBottom: 15,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    opacity: 0.7,
  },
  inviteCodeContainer: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  memberImage:{
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 15
  },
  memberInfo: {
    flex: 1,
  },
  buttonRow:{
    flexDirection: 'row',
    gap: 10,
  },
  button:{
    borderRadius: 30,
    paddingVertical: 7,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsButton:{
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5,
    zIndex: 100
  },
  options:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itineraryContainer:{
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  itineraryButtonContainer:{
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10
  },
  itineraryButton:{
    padding: 10,
    borderRadius: 30
  }
});