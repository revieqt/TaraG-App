import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView } from "react-native";
import Carousel from '@/components/Carousel';
import TextField from '@/components/TextField';
import { router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedIcons } from "@/components/ThemedIcons";
import { useSession } from "@/context/SessionContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { LinearGradient } from "expo-linear-gradient";
import { getAgencyById, Agency } from "@/services/agencyApiService";

interface TourGuideSectionProps {
  agencyID?: string;
}

export default function TourGuideSection({ agencyID }: TourGuideSectionProps){
  const { session } = useSession();
  const backgroundColor = useThemeColor({}, 'background');
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agencyID) {
      fetchAgency();
    }
  }, [agencyID]);

  const fetchAgency = async () => {
    if (!agencyID || !session?.accessToken) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getAgencyById({ agencyID }, session.accessToken);
      setAgency(data);
    } catch (err: any) {
      console.error('Error fetching agency:', err);
      setError(err.message || 'Failed to load agency details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ marginTop: 10 }}>Loading agency details...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedIcons library="MaterialIcons" name="error-outline" size={48} />
        <ThemedText style={{ marginTop: 10, opacity: 0.7 }}>{error}</ThemedText>
      </View>
    );
  }

  // Get user's agency data from session (user info, not full agency)
  const userAgencyData = session?.user?.agency;

  return(
    <ScrollView>
      {/* Header with cover image */}
      <ThemedView color='secondary' style={styles.header}>
        {agency?.coverImage && (
          <Image 
            source={{ uri: agency.coverImage }} 
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}
        <LinearGradient
          colors={['transparent', backgroundColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.agencyNameContainer}
        >
          <View style={styles.agencyHeaderContent}>
            {agency?.logo && (
              <Image 
                source={{ uri: agency.logo }} 
                style={styles.agencyLogo}
                resizeMode="contain"
              />
            )}
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">
                {agency?.name || 'Agency Name'}
              </ThemedText>
              {agency?.verified && (
                <View style={styles.verifiedBadge}>
                  <ThemedIcons library="MaterialIcons" name="verified" size={16} color="#4CAF50" />
                  <ThemedText style={styles.verifiedText}>Verified</ThemedText>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </ThemedView>

      {/* Agency Details */}
      {agency && (
        <View style={styles.detailsContainer}>
          {/* Rating */}
          {agency?.rating && (
            <View style={styles.ratingContainer}>
              <ThemedIcons library="MaterialIcons" name="star" size={20} color="#FFD700" />
              <ThemedText type="defaultSemiBold">{agency.rating.toFixed(1)}</ThemedText>
              <ThemedText style={{ opacity: 0.7 }}>({agency.reviewCount || 0} reviews)</ThemedText>
            </View>
          )}

          {/* Description */}
          {agency?.description && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>About</ThemedText>
              <ThemedText style={{ opacity: 0.8 }}>{agency.description}</ThemedText>
            </View>
          )}

          {/* Contact Information */}
          <ThemedView shadow color='primary' style={styles.tourGuideProfile}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Contact Information</ThemedText>
            
            {agency?.email && (
              <ThemedText style={styles.contactText}>
                Business Email: {agency.email}
              </ThemedText>
            )}

            {agency?.phone && (
              <ThemedText style={styles.contactText}>
                Business Contact Number: {agency.phone}
              </ThemedText>
            )}

            {agency?.address && (
              <View style={styles.contactItem}>
                <ThemedIcons library="MaterialIcons" name="location-on" size={20} />
                <ThemedText style={styles.contactText}>{agency.address}</ThemedText>
              </View>
            )}

            {agency?.website && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => {/* Open website */}}
              >
                <ThemedIcons library="MaterialIcons" name="language" size={20} />
                <ThemedText style={[styles.contactText, { textDecorationLine: 'underline' }]}>
                  {agency.website}
                </ThemedText>
              </TouchableOpacity>
            )}

          </ThemedView>

          {/* User's Agency Profile */}
          {userAgencyData && (
            <ThemedView shadow color='primary' style={styles.tourGuideProfile}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Your Profile</ThemedText>
              
              <ThemedText style={styles.contactText}>
                Role: {userAgencyData.role}
              </ThemedText>
              
              <ThemedText style={styles.contactText}>
                Permissions: {userAgencyData.permissions}
              </ThemedText>
              
              {userAgencyData.businessEmail && (
                <ThemedText style={styles.contactText}>
                  Contact: {userAgencyData.businessEmail}
                </ThemedText>
              )}
              
              {userAgencyData.businessContactNumber && (
                <ThemedText style={styles.contactText}>
                  Phone: {userAgencyData.businessContactNumber}
                </ThemedText>
              )}
              
              {userAgencyData.documents && userAgencyData.documents.length > 0 && (
                <ThemedText style={styles.contactText}>
                  Documents: {userAgencyData.documents.length} file(s) on record
                </ThemedText>
              )}
            </ThemedView>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header:{
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  agencyNameContainer:{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  agencyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agencyLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  detailsContainer: {
    padding: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  contactText: {
    flex: 1,
    opacity: 0.8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tourGuideProfile:{
    width: '100%',
    padding: 10,
    borderRadius: 14,

  }
});
