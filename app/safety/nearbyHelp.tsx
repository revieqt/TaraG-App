import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSession } from '@/context/SessionContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function NearbyHelpSection() {
  const { session, updateSession } = useSession();

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView>
        <ThemedView color='secondary'>
          <View style={{marginHorizontal: 16, marginVertical: 40, zIndex: 3}}>
            <ThemedText type="title">Report Emergency</ThemedText>
          </View>
          <LinearGradient
            colors={['transparent', 'rgba(0, 255, 222, .5)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.headerOverlay}
            pointerEvents="none"
          >
            <ThemedView style={styles.headerBottom} />
          </LinearGradient>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  headerBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 16,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 30,
  },
  routeSummary: {
    marginVertical: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc4',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    marginTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  historyItem: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 16
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    opacity: 0.5,
  },
  historyButtons: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    right: 0,
    gap: 8,
  },
});