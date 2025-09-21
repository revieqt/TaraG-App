import BackButton from '@/components/custom/BackButton';
import ProBadge from '@/components/custom/ProBadge';
import ViewImageModal from '@/components/custom/ViewImage';
import GradientHeader from '@/components/GradientHeader';
import HorizontalSections from '@/components/HorizontalSections';
import OptionsPopup from '@/components/OptionsPopup';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import InputModal from '@/components/modals/InputModal';
import { useSession } from '@/context/SessionContext';
import { updateUserStringField } from '@/services/userApiService';
import { useImageUpload } from '@/hooks/useImageUpload';
import { BACKEND_URL } from '@/constants/Config';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';


export default function ProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { session, updateSession } = useSession();
  const sessionUser = session?.user;
  
  let user = sessionUser;
  let isCurrentUser = true;
  const userType = (user?.type === "traveler") ? "Traveler" : ((user?.type === "tourGuide") ? "Tour Guide" : "Admin");
  const userDescription = ((user?.isProUser) ? "Pro" : "Basic") + " " + userType;

  // If userId is provided and does not match session user, prepare to fetch from Firebase (not implemented yet)
  if (userId && userId !== sessionUser?.id) {
    // TODO: Fetch user from Firebase by userId
    user = undefined; // Placeholder for fetched user
    isCurrentUser = false;
  }

  const [viewImageVisible, setViewImageVisible] = useState(false);
  const [editBioVisible, setEditBioVisible] = useState(false);
  const [isUpdatingBio, setIsUpdatingBio] = useState(false);
  const { uploadImage, loading: uploadingImage } = useImageUpload(`${BACKEND_URL}/user/update-profile-image`);

  const handleBioUpdate = async (newBio: string | { areaCode: string; number: string }) => {
    if (typeof newBio !== 'string' || !sessionUser?.id || !session?.accessToken) {
      Alert.alert('Error', 'Unable to update bio. Please try again.');
      return;
    }

    setIsUpdatingBio(true);
    try {
      await updateUserStringField(
        sessionUser.id,
        'bio',
        newBio,
        session.accessToken
      );
      
      // Update the local session user data
      if (session.user) {
        await updateSession({
          user: {
            ...session.user,
            bio: newBio
          }
        });
      }
      
      Alert.alert('Success', 'Bio updated successfully!');
    } catch (error) {
      console.error('Error updating bio:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update bio');
    } finally {
      setIsUpdatingBio(false);
    }
  };

  // Add this function
  const handleUpdateProfileImage = async () => {
    if (!sessionUser?.id || !session?.accessToken) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }
    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      try {
        const uploadResult = await uploadImage(uri, sessionUser.id, session.accessToken);
        if (uploadResult.success && uploadResult.url) {
          // Update SessionContext with new profile image using proper updateSession method
          if (session.user) {
            await updateSession({
              user: {
                ...session.user,
                profileImage: uploadResult.url
              }
            });
          }
          Alert.alert('Success', 'Profile image updated!');
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to upload image');
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to upload image');
      }
    }
  };

  return (
    <ThemedView style={{flex:1}}>
      <ScrollView style={{flex:1}}>
        <ThemedView color='primary'>
          <View style={styles.header}>
            <BackButton/>
          </View>
          <GradientHeader/>
          
          {user && (
            <OptionsPopup
              style={styles.profileImage}
              options={[
                <TouchableOpacity
                  key="viewImage"
                  onPress={() => setViewImageVisible(true)}
                  style={styles.optionButton}
                >
                  <ThemedIcons library="MaterialIcons" name="visibility" size={20} />
                  <ThemedText>View Image</ThemedText>
                </TouchableOpacity>,
                <TouchableOpacity
                  key="updateImage"
                  onPress={handleUpdateProfileImage}
                  style={styles.optionButton}
                >
                  <ThemedIcons library="MaterialIcons" name="edit" size={20} />
                  <ThemedText>{uploadingImage ? "Uploading..." : "Update Profile Image"}</ThemedText>
                </TouchableOpacity>
              ]}
            >
              <Image
                source={{ uri: session?.user?.profileImage || 'https://ui-avatars.com/api/?name=User' }}
                style={{flex: 1}}
              />
            </OptionsPopup>
          )}
          <ViewImageModal
            visible={viewImageVisible}
            imageUrl={user?.profileImage || ''}
            onClose={() => setViewImageVisible(false)}
          />

          <InputModal
            visible={editBioVisible}
            onClose={() => setEditBioVisible(false)}
            onSubmit={handleBioUpdate}
            label="Edit Bio"
            description="Tell others about yourself"
            type="text"
            initialValue={user?.bio || ''}
            placeholder="Enter your bio..."
          />

          <View style={{marginTop: 120, alignItems: 'center'}}>
            {user ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ThemedText type="subtitle">{user.fname} {user.mname ? user.mname : ''} {user.lname}</ThemedText>
                  <ProBadge/>
                </View>
                
                <ThemedText type="defaultSemiBold" style={{opacity: .5}}>@{user.username}</ThemedText>
                <ThemedText style={{opacity: .5, marginBottom: 10}}>{userDescription}</ThemedText>
              </>
              ) : (
                <ThemedText type="error">User not found.</ThemedText>
              )
            }
          </View>

          <View style={styles.bio}>
            {(user?.bio?.trim() !== "") && (
              <ThemedText>{user?.bio}</ThemedText>
            )}
            { isCurrentUser && (
              <TouchableOpacity 
                style={styles.editBio}
                onPress={() => setEditBioVisible(true)}
              >
                <ThemedIcons library="MaterialIcons" name="edit" size={15}/>
                <ThemedText>Edit Bio</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>
        
        <HorizontalSections
          labels={['Travels', 'About']}
          type="fullTab"
          containerStyle={{ flex: 1}}
          sections={[
          <View key="travels" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 1000}}>
            <View>
            </View>
          </View>,
          <View key="about" style={{ flex: 1, padding: 20}}>
            {user ? (
              <>
                <ThemedView color="secondary" shadow style={styles.badgeContainer}>
                  <GradientHeader/>
                  <View style={{flex: 1, padding: 20}}>
                    { user?.isProUser ? ( <ProBadge/> ):(<ThemedText>Basic</ThemedText>) }
                  </View>
                </ThemedView>

                <ThemedText>Email: {user.email}</ThemedText>
                <ThemedText>Gender: {user.gender}</ThemedText>
                <ThemedText>Contact Number: {user.contactNumber}</ThemedText>
                <ThemedText>Type: {user.type}</ThemedText>
              </>
            ) : (
              <ThemedText type="error">User not found.</ThemedText>
            )}
          </View>]}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header:{
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    zIndex: 100
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'white',
    alignSelf: 'center',
    position: 'absolute',
    marginTop: -20,
    zIndex: 100,
    overflow: 'hidden',
  },
  bio:{
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  editBio: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical:5,
    paddingHorizontal: 10,
    borderRadius: 30,
    backgroundColor: '#ccc4',
  },
  badgeContainer: {
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  }
});