import Header from '@/components/Header';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function RoutesHistoryScreen() {

  return (
    <ThemedView style={{ flex: 1 }}>
      <Header 
        label="History"
      />
      
      <View style={{padding: 20}}>
        
      </View>
    </ThemedView>
  );
}