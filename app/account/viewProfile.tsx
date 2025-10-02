import BackButton from '@/components/custom/BackButton';
import ProBadge from '@/components/custom/ProBadge';
import ViewImageModal from '@/components/custom/ViewImage';
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
import { ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Carousel from '@/components/Carousel';
import EmptyMessage from '@/components/EmptyMessage';

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { session, updateSession } = useSession();
  const router = useRouter();
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
      {user ? (
        <>
          <ScrollView style={{flex:1}}>
            <View style={styles.header}>
              <BackButton type='floating'/>
              <OptionsPopup
                style={styles.profileImageOption}
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
                <ThemedIcons library="MaterialCommunityIcons" name="dots-vertical" size={22}/>
              </OptionsPopup>
              <Carousel
                images={[
                  user?.profileImage || '',
                ]}
                navigationArrows
                showDotIndicator={false}
              />
              <LinearGradient
                colors={['transparent', '#000']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.headerContent}
                pointerEvents="none"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 }}>
                  <ThemedText type="title" style={{color: '#fff'}}>{user.fname} {user.mname ? user.mname : ''} {user.lname}</ThemedText>
                  <ProBadge/>
                </View>
                <ThemedText type="defaultSemiBold" style={{color: '#fff'}}>@{user.username}</ThemedText>
                <ThemedText style={{opacity: .5, color: '#fff'}}>{userDescription}</ThemedText>
                <View style={styles.bio}>
                  {(user?.bio?.trim() !== "") && (
                    <View style={{flex: 1}}>
                      <ThemedText style={{color: '#fff'}}>{user?.bio}</ThemedText>
                    </View>
                  )}
                  { isCurrentUser && (
                    <TouchableOpacity 
                      style={{padding: 5}}
                      onPress={() => setEditBioVisible(true)}
                    >
                      <ThemedIcons library="MaterialIcons" name="edit" size={15}/>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
              <ThemedView style={styles.headerBottom} />
            </View>

            { !isCurrentUser && !user?.publicSettings?.isProfilePublic ? (
              <View style={{marginTop: 20}}>
                <EmptyMessage
                  iconLibrary='MaterialIcons'
                  iconName='lock'
                  title="Profile is private"
                  description="This profile is private."
                />
              </View>
            ) : (
            <View style={{paddingHorizontal: 20}}>
              <ThemedText style={{marginBottom: 5}}>Likes</ThemedText>
              <View style={styles.likesContainer}>
                {user.likes.map((like, index) => (
                  <ThemedView shadow color='primary' key={index} style={styles.likesBox}>
                    <ThemedText style={styles.likesBoxText}>
                      {like.charAt(0).toUpperCase() + like.slice(1).toLowerCase()}
                    </ThemedText>
                  </ThemedView>
                ))}
              </View>
            </View>
            )}
          
        </ScrollView>

        { isCurrentUser && !user?.publicSettings?.isProfilePublic && (
          <ThemedView color="primary" shadow style={styles.noteContainer}>
            <ThemedText style={{opacity: .7, fontSize: 11}}>Only you can see your profile.</ThemedText>
            <TouchableOpacity onPress={() => router.push('/account/settings-visibility')}>
              <ThemedText style={{opacity: .7, textDecorationLine: 'underline', fontSize: 11}}>Change Visibility</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
        </>
      ):(
        <ThemedText type="error">User not found.</ThemedText>
      )}

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

      <ViewImageModal
        visible={viewImageVisible}
        imageUrl={user?.profileImage || ''}
        onClose={() => setViewImageVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header:{
    width: '100%',
    height: 500,
  },
  headerContent: {
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    padding: 16,
    marginBottom: 20,
    pointerEvents: 'box-none',
  },
  profileImageOption: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 3,
    padding: 5,
  },
  headerBottom: {
    height: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bio:{
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 5
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  noteContainer: {
    borderRadius: 10,
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 12,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8
  },
  likesBox: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 16,
  },
  likesBoxText: {
    fontSize: 12,
    fontWeight: '500',
  },
});