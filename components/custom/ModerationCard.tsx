import React from 'react';
import { StyleSheet, View, Image, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedView } from '../ThemedView';
import { LinearGradient } from 'expo-linear-gradient';
import { ModerationLog } from '@/services/moderationApiService';

interface ModerationCardProps {
  moderationLog: ModerationLog;
}

export const ModerationCard: React.FC<ModerationCardProps> = ({ moderationLog }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const severityColor = moderationLog.type === 'ban' ? '#FF4444' : '#FF8800';
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView color='secondary' style={[styles.header, { backgroundColor: severityColor }]}>
        <LinearGradient
          colors={['transparent', backgroundColor]}
          style={styles.titleContainer}
        >
          <ThemedText type="subtitle" style={{ paddingRight: 80, color: '#fff' }}>
            {moderationLog.type === 'ban' ? '🚫 Account Banned' : '⚠️ Account Warning'}
          </ThemedText>
          <ThemedText style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
            {formatDate(moderationLog.createdOn)}
          </ThemedText>
          {moderationLog.endsOn && (
            <ThemedText style={{ color: '#fff', fontSize: 12 }}>
              Ends: {formatDate(moderationLog.endsOn)}
            </ThemedText>
          )}
        </LinearGradient>

        <LinearGradient
          colors={[backgroundColor, backgroundColor, 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={styles.circle}
        >
          <LinearGradient
            colors={[backgroundColor, backgroundColor, 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.innerCircle}
          />
        </LinearGradient>

        <Image 
          source={require('@/assets/images/tara-worried.png')} 
          style={styles.taraImage} 
        />
      </ThemedView>

      <LinearGradient
        colors={['transparent', backgroundColor, backgroundColor]}
        style={styles.overlay}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.contentContainer}>
        <View style={styles.section}>
          <ThemedText type="subtitle" style={{ fontSize: 16, marginBottom: 8 }}>
            Reason
          </ThemedText>
          <ThemedText style={{ fontSize: 14, opacity: 0.8 }}>
            {moderationLog.reason}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={{ fontSize: 16, marginBottom: 8 }}>
            Message
          </ThemedText>
          <ThemedText style={{ fontSize: 14, opacity: 0.8 }}>
            {moderationLog.message}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={{ fontSize: 16, marginBottom: 8 }}>
            Details
          </ThemedText>
          <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
            Type: {moderationLog.type.charAt(0).toUpperCase() + moderationLog.type.slice(1)}
          </ThemedText>
          <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
            Created: {formatDate(moderationLog.createdOn)}
          </ThemedText>
          {moderationLog.endsOn && (
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
              Expires: {formatDate(moderationLog.endsOn)}
            </ThemedText>
          )}
          <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
            Last Updated: {formatDate(moderationLog.updatedOn)}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden'
  },
  header: {
    width: '100%',
    height: 220,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  contentContainer: {
    padding: 16,
    flex: 1,
    zIndex: 100
  },
  section: {
    marginBottom: 20,
  },
  circle: {
    position: 'absolute',
    top: 10,
    right: '-50%',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 1000,
    overflow: 'hidden',
    opacity: 0.4,
    padding: 30,
  },
  innerCircle: {
    flex: 1,
    borderRadius: 1000,
    overflow: 'hidden',
    opacity: 0.5,
    padding: 30,
  },
  taraImage: {
    position: 'absolute',
    bottom: -110,
    right: -30,
    width: '35%',
    height: 300,
    resizeMode: 'contain',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 2
  },
});
