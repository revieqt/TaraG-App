import { BackButton } from '@/components/custom/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function AlertView() {
  const params = useLocalSearchParams();
  const backgroundColor = useThemeColor({}, 'background');
  
  // Get alert data from params
  const title = params.title as string || 'Be Alert';
  const note = params.note as string || 'No details available';
  const severity = params.severity as string || 'medium';
  const target = params.target as string || 'Unknown location';

  // Determine colors and content based on severity
  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return {
          fadeColor: '#FF4444',
          taraImage: require('@/assets/images/tara-worried.png'),
          subtitle: 'High priority alert in your area'
        };
      case 'medium':
        return {
          fadeColor: '#FF8800',
          taraImage: require('@/assets/images/tara-worried.png'),
          subtitle: 'Medium priority alert in your area'
        };
      case 'low':
        return {
          fadeColor: '#44AA44',
          taraImage: require('@/assets/images/tara-cheerful.png'),
          subtitle: 'Low priority alert in your area'
        };
      default:
        return {
          fadeColor: '#FF8800',
          taraImage: require('@/assets/images/tara-worried.png'),
          subtitle: 'Alert in your area'
        };
    }
  };

  const severityConfig = getSeverityConfig(severity);

  return (
    <ThemedView style={{flex: 1, padding: 20}}>
      <BackButton type='floating' />
      <View style={{position: 'absolute', top: 0, left: 0, right: 0, height: 200}}>
        <LinearGradient
          colors={[severityConfig.fadeColor, 'transparent']}
          style={{flex: 1, opacity: 0.5}}
        />
      </View>

      <Image
        source={severityConfig.taraImage}
        style={styles.taraWorried}
      />

      <View style={{position: 'absolute', top:110, left: 0, right: 0, height: 500, zIndex: 10}}>
        <LinearGradient
          colors={['transparent', backgroundColor]}
          style={{width: '100%', height: 120}}
        />
        <View style={{position: 'absolute', top: 120, left: 0, right: 0, height: 500, backgroundColor: backgroundColor}}/>
          
      </View>

      <View style={styles.titleContainer}>
        <ThemedText type='title'>
          {title}
        </ThemedText>
        <ThemedText type='defaultSemiBold'>
          {severityConfig.subtitle}
        </ThemedText>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.alertDetails}>
          <View style={styles.detailSection}>
            <ThemedText type='defaultSemiBold' style={styles.sectionTitle}>
              Alert Details
            </ThemedText>
            <ThemedText style={styles.noteText}>
              {note}
            </ThemedText>
          </View>

          <View style={styles.detailSection}>
            <ThemedText type='defaultSemiBold' style={styles.sectionTitle}>
              Severity Level
            </ThemedText>
            <View style={[styles.severityBadge, { backgroundColor: severityConfig.fadeColor }]}>
              <ThemedText style={styles.severityText}>
                {severity.toUpperCase()}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailSection}>
            <ThemedText type='defaultSemiBold' style={styles.sectionTitle}>
              Affected Areas
            </ThemedText>
            <ThemedText style={styles.targetText}>
              📍 {target}
            </ThemedText>
          </View>

          <View style={styles.detailSection}>
            <ThemedText type='defaultSemiBold' style={styles.sectionTitle}>
              What to do
            </ThemedText>
            <ThemedText style={styles.noteText}>
              • Stay informed about the situation{'\n'}
              • Follow local authorities' instructions{'\n'}
              • Keep emergency contacts handy{'\n'}
              • Monitor weather updates if applicable
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 0,
    height: 500,
    zIndex: 10,
  },
  taraWorried:{
    position: 'absolute',
    top: 20,
    right: -27,
    width: 150,
    height: 300,
    resizeMode: 'contain',
    zIndex: 4,
  },
  contentContainer: {
    marginTop: 200,
    zIndex: 10,
  },
  alertDetails: {
    paddingBottom: 40,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 16,
  },
  noteText: {
    lineHeight: 22,
    opacity: 0.8,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  targetText: {
    opacity: 0.8,
  },
});