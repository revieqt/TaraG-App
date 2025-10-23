import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Carousel from '@/components/Carousel';
import TextField from '@/components/TextField';
import { router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSession } from "@/context/SessionContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { LinearGradient } from "expo-linear-gradient";

export default function TourGuideSection(){
  const { session } = useSession();
  const backgroundColor = useThemeColor({}, 'background');
  return(
    <View>
      <ThemedView color='secondary' style={styles.header}>
        <LinearGradient
          colors={['transparent', backgroundColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.agencyNameContainer}
        >
          <ThemedText type="subtitle">Agency Name Here</ThemedText>
        </LinearGradient>
      </ThemedView>
    </View>
  );
};

const styles = StyleSheet.create({
  header:{
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agencyNameContainer:{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
});
