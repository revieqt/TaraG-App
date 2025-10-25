import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ThemedIcons from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import BackButton from '@/components/custom/BackButton';
import Button from '@/components/Button';
import PaymentPortal from '@/components/modals/PaymentPortal';
import { useSession } from '@/context/SessionContext';
import { joinTour } from '@/services/tourApiService';
import { Tour } from '@/services/tourApiService';

export default function TourAvailPage() {
  const params = useLocalSearchParams();
  const { session } = useSession();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');

  const [showPaymentPortal, setShowPaymentPortal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Parse tour data from params
  const tourData: Tour = params.tourData ? JSON.parse(params.tourData as string) : null;

  if (!tourData) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Tour data not found</ThemedText>
      </ThemedView>
    );
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePaymentComplete = async () => {
    if (!session?.user || !session?.accessToken) {
      Alert.alert('Error', 'You must be logged in to join a tour');
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinTour(
        tourData.tourID,
        session.user.id,
        `${session.user.fname} ${session.user.lname}`,
        session.user.username,
        session.user.profileImage || '',
        session.accessToken
      );

      if (result.success) {
        Alert.alert(
          'Success!',
          'You have successfully joined the tour!',
          [
            {
              text: 'View Tour',
              onPress: () => {
                router.replace({
                  pathname: '/tours/tours-view',
                  params: { tourData: JSON.stringify(tourData) }
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to join tour');
      }
    } catch (error) {
      console.error('Error joining tour:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsJoining(false);
    }
  };

  const currentMembers = tourData.participants?.members?.filter((m: any) => m.isApproved)?.length || 0;
  const maxCapacity = tourData.participants?.maxCapacity || 0;
  const spotsLeft = maxCapacity - currentMembers;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView>
        {/* Header Image */}
        {tourData.images && tourData.images.length > 0 && (
          <Image
            source={{ uri: tourData.images[0] }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        )}

        <BackButton type="close-floating" style={styles.backButton} />

        {/* Tour Details */}
        <ThemedView color="primary" style={styles.container}>
          <ThemedText type="title">{tourData.name}</ThemedText>
          
          {/* Price */}
          <View style={styles.priceContainer}>
            <ThemedText type="subtitle" style={{ color: accentColor }}>
              {tourData.pricing.currency} {tourData.pricing.price.toFixed(2)}
            </ThemedText>
            <ThemedText style={{ opacity: 0.7 }}> per person</ThemedText>
          </View>

          {/* Date Range */}
          {tourData.itineraryData && (
            <View style={styles.infoRow}>
              <ThemedIcons library="MaterialIcons" name="calendar-today" size={20} color={textColor} />
              <ThemedText style={{ marginLeft: 8 }}>
                {formatDate(tourData.itineraryData.startDate)} - {formatDate(tourData.itineraryData.endDate)}
              </ThemedText>
            </View>
          )}

          {/* Capacity */}
          <View style={styles.infoRow}>
            <ThemedIcons library="MaterialIcons" name="people" size={20} color={textColor} />
            <ThemedText style={{ marginLeft: 8 }}>
              {currentMembers}/{maxCapacity} participants • {spotsLeft} spots left
            </ThemedText>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
              Description
            </ThemedText>
            <ThemedText style={{ opacity: 0.8 }}>{tourData.description}</ThemedText>
          </View>

          {/* Inclusions */}
          {tourData.pricing.inclusions && tourData.pricing.inclusions.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
                Inclusions
              </ThemedText>
              {tourData.pricing.inclusions.map((item: string, index: number) => (
                <View key={index} style={styles.listItem}>
                  <ThemedIcons library="MaterialIcons" name="check-circle" size={16} color={accentColor} />
                  <ThemedText style={{ marginLeft: 8, opacity: 0.8 }}>{item}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Exclusions */}
          {tourData.pricing.exclusions && tourData.pricing.exclusions.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
                Exclusions
              </ThemedText>
              {tourData.pricing.exclusions.map((item: string, index: number) => (
                <View key={index} style={styles.listItem}>
                  <ThemedIcons library="MaterialIcons" name="cancel" size={16} color="#ff4444" />
                  <ThemedText style={{ marginLeft: 8, opacity: 0.8 }}>{item}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Tour Guides */}
          {tourData.participants?.tourGuides && tourData.participants.tourGuides.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
                Tour Guides
              </ThemedText>
              {tourData.participants.tourGuides.map((guide: any, index: number) => (
                <View key={index} style={styles.guideItem}>
                  <Image
                    source={{ uri: guide.profileImage || 'https://ui-avatars.com/api/?name=' + guide.name }}
                    style={styles.guideImage}
                  />
                  <View>
                    <ThemedText type="defaultSemiBold">{guide.name}</ThemedText>
                    <ThemedText style={{ opacity: 0.7, fontSize: 12 }}>@{guide.username}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ThemedView>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <ThemedView color="primary" shadow style={styles.bottomBar}>
        <View>
          <ThemedText style={{ opacity: 0.7, fontSize: 12 }}>Total Price</ThemedText>
          <ThemedText type="subtitle" style={{ color: accentColor }}>
            {tourData.pricing.currency} {tourData.pricing.price.toFixed(2)}
          </ThemedText>
        </View>
        <Button
          title={isJoining ? "Joining..." : "Book Now"}
          onPress={() => setShowPaymentPortal(true)}
          disabled={isJoining || spotsLeft === 0}
          buttonStyle={{ paddingHorizontal: 32 }}
        />
      </ThemedView>

      {/* Payment Portal */}
      <PaymentPortal
        visible={showPaymentPortal}
        onClose={() => setShowPaymentPortal(false)}
        productName={tourData.name}
        productDescription={`Tour booking for ${tourData.name}`}
        price={tourData.pricing.price.toString()}
        onPaymentComplete={handlePaymentComplete}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: '100%',
    height: 300,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
  },
  container: {
    padding: 16,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  section: {
    marginTop: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
