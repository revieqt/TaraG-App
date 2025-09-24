import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Alert } from '@/hooks/useAlerts';

interface AlertCardProps {
  alert: Alert;
  onPress: (alert: Alert) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return '#FF4444';
      case 'medium':
        return '#FF8800';
      case 'low':
        return '#44AA44';
      default:
        return '#888888';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={() => onPress(alert)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
          {alert.title}
        </ThemedText>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
          <ThemedText style={styles.severityText}>
            {getSeverityText(alert.severity)}
          </ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.note} numberOfLines={3}>
        {alert.note}
      </ThemedText>
      
      <View style={styles.footer}>
        <ThemedText style={styles.targetText} numberOfLines={1}>
          📍 {alert.target.slice(0, 2).join(', ')}
          {alert.target.length > 2 && '...'}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetText: {
    fontSize: 12,
    opacity: 0.6,
  },
});
