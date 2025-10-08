import React from "react";
import { View, StyleSheet } from "react-native";
import Carousel from '@/components/Carousel';
import TextField from '@/components/TextField';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import SOSButton from "@/components/custom/SOSButton";
import ThemedIcons from "@/components/ThemedIcons";

export default function SOSSection(){
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Emergency</ThemedText>
      <SOSButton/>
      <ThemedText></ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  }
});
