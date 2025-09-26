import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedIcons } from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import Header from '@/components/Header';

interface RouteSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  alarmNearStop: boolean;
  onAlarmToggle: (value: boolean) => void;
}

export default function RouteSettingsModal({ 
  visible, 
  onClose, 
  alarmNearStop, 
  onAlarmToggle 
}: RouteSettingsModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Route Settings</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedIcons library="MaterialIcons" name="close" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText type="defaultSemiBold">Alarm Near Stop</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Get notified when you're approaching your destination
                </ThemedText>
              </View>
              <Switch 
                value={alarmNearStop}
                onValueChange={onAlarmToggle}
                trackColor={{ false: '#767577', true: primaryColor }}
                thumbColor={alarmNearStop ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText type="defaultSemiBold">Voice Navigation</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Enable turn-by-turn voice instructions
                </ThemedText>
              </View>
              <Switch 
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: '#767577', true: primaryColor }}
                thumbColor={'#fff'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText type="defaultSemiBold">Auto Re-route</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Automatically find new route when off-track
                </ThemedText>
              </View>
              <Switch 
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: '#767577', true: primaryColor }}
                thumbColor={'#fff'}
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.doneButton, { backgroundColor: primaryColor }]} 
              onPress={onClose}
            >
              <ThemedText style={styles.doneButtonText}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View> */}
      <ThemedView style={{flex: 1}}>
        <Header label="Route Settings" />
        <View style={{padding: 20}}>
          <ThemedText type='defaultSemiBold' style={styles.sectionTitle}>Route Alarm</ThemedText>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionItem}>
              <ThemedText>Alarm Near Stop</ThemedText>
              <Switch 
                value={alarmNearStop}
                onValueChange={onAlarmToggle}
                trackColor={{ false: '#767577', true: primaryColor }}
                thumbColor={alarmNearStop ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
          <ThemedText type='defaultSemiBold' style={styles.sectionTitle}>Auto Re-route</ThemedText>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionItem}>
              <ThemedText>Automatically find new route when off-track</ThemedText>
              <Switch 
                value={alarmNearStop}
                onValueChange={onAlarmToggle}
                trackColor={{ false: '#767577', true: primaryColor }}
                thumbColor={alarmNearStop ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sectionContainer:{
    paddingVertical: 8,
  },
  sectionItem:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
});
