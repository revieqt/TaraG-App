import { ThemedView } from '@/components/ThemedView';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, Alert} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import {ThemedIcons} from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import SOSSection from './sos';
import DisasterMapSection from './disasterMap';
import ReportSection from './report';
import EarthquakeMap from '@/components/maps/EarthquakeMap';

export default function SafetyScreen() {
  const iconColor = useThemeColor({}, 'icon');
  const secondaryColor = useThemeColor({}, 'secondary');
  const [selectedTab, setSelectedTab] = useState('sos');

  return (
    <>
      <ThemedView style={{flex:1}}>
        {selectedTab === 'sos' && <EarthquakeMap />}
        {selectedTab === 'riskMap' && <DisasterMapSection />}
        {selectedTab === 'report' && <ReportSection />}
      </ThemedView>
      <ThemedView color='primary' style={styles.tabBar}>
        <TouchableOpacity style={styles.tabButton} onPress={() => setSelectedTab('sos')}>
          <ThemedIcons 
            library="MaterialDesignIcons" 
            name={selectedTab === 'sos' ? 'alert-circle' : 'alert-circle-outline'}
            size={20}
            color={selectedTab === 'sos' ? secondaryColor : iconColor}
          />
          <ThemedText style={[styles.tabButtonText, {color: selectedTab === 'sos' ? secondaryColor : iconColor}]}>
            SOS
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => setSelectedTab('riskMap')}>
        <ThemedIcons 
            library="MaterialDesignIcons" 
            name={selectedTab === 'riskMap' ? 'map-check' : 'map-check-outline'}
            size={20}
            color={selectedTab === 'riskMap' ? secondaryColor : iconColor}
          />
          <ThemedText style={[styles.tabButtonText, {color: selectedTab === 'riskMap' ? secondaryColor : iconColor}]}>
            Risk Map
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => setSelectedTab('report')}>
          <ThemedIcons 
            library="MaterialDesignIcons" 
            name={selectedTab === 'report' ? 'file-alert' : 'file-alert-outline'} 
            size={20}
            color={selectedTab === 'report' ? secondaryColor : iconColor}
          />
          <ThemedText style={[styles.tabButtonText, {color: selectedTab === 'report' ? secondaryColor : iconColor}]}>
            Report
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar:{
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  tabButton:{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabButtonText:{
    fontSize: 11,
    marginTop: 2,
    opacity: .7,
    textAlign: 'center',
  }
});