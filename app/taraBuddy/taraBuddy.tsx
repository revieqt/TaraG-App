import React from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import ThemedIcons from "@/components/ThemedIcons";
import Button from "@/components/Button";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { Foundation } from "@expo/vector-icons";
import { useSession } from "@/context/SessionContext";
import { useTaraBuddyApi } from "@/services/taraBuddyApiService";
import {LinearGradient} from "expo-linear-gradient";

export default function TaraBuddySection() {
  const primaryColor = useThemeColor({}, "primary");
  const { session } = useSession();
  const { createTaraBuddyProfile } = useTaraBuddyApi();
  const hasPreference = Boolean(session?.user?.taraBuddyPreference);

  return (
    <View style={{ flex: 1 }}>
      {!hasPreference ? (
        <View style={styles.cardContainer}>
          <ThemedView color="primary" shadow style={[styles.card, styles.welcomeCard]}>
            <ThemedText type="subtitle" style={{ marginTop: 20 }}>
              Meet new Friends with
            </ThemedText>
            <ThemedText type="title">TaraBuddy</ThemedText>
            <ThemedText style={{ opacity: 0.5, textAlign: "center", paddingVertical: 10 }}>
              Find fellow adventurers, plan trips together, and turn every journey into a story worth sharing.
            </ThemedText>
            <Button
              title="Start Matching"
              onPress={async () => {
                if (!session?.user?.publicSettings?.isProfilePublic) {
                  Alert.alert("Error", "Please make your profile public to start matching");
                }else{
                  try {
                    await createTaraBuddyProfile();
                  } catch (err: any) {
                    Alert.alert("Error", err.message || "Failed to start matching");
                  }
                }
              }}
            />
          </ThemedView>
        </View>
      ) : (
        <>
          <View style={styles.cardContainer}>
            <ThemedView color="primary" shadow style={[styles.card]}>
              <LinearGradient
                colors={['transparent', '#000']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.cardContent}
              > 
                <ThemedText type="title" style={{color: '#fff'}}>Name here</ThemedText>
                <ThemedText style={{color: '#fff'}}>Description here</ThemedText>
                <TouchableOpacity style={styles.moreButton}>
                  <ThemedText style={{color: '#fff'}}>More</ThemedText>
                  <ThemedIcons library="MaterialDesignIcons" name="arrow-down-drop-circle-outline" size={20} color='#fff' />
                </TouchableOpacity>
              </LinearGradient>
            </ThemedView>
          </View>

          <View style={styles.bottomOptionContainer}>
            <TouchableOpacity onPress={() => router.push("/account/viewProfile")}>
              <ThemedView color="primary" shadow style={styles.settings}>
                <ThemedIcons library="MaterialIcons" name="person" size={20} />
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bottomOption, { backgroundColor: "#B85C5C" }]}>
              <ThemedIcons library="MaterialIcons" name="close" size={40} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bottomOption, { backgroundColor: "#4CAF50" }]}>
              <Foundation name="like" size={40} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/taraBuddy/taraBuddy-settings")}>
              <ThemedView color="primary" shadow style={styles.settings}>
                <ThemedIcons library="MaterialIcons" name="settings" size={20} />
              </ThemedView>
            </TouchableOpacity>
          </View>
        </>
        
      )}
      <LinearGradient
        colors={['transparent', primaryColor]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.backgroundGradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomOptionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  backgroundGradient: {
    position: "absolute",
    height: 150,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomOption: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    aspectRatio: 1,
    borderRadius: 50,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 4,
  },
  settings: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    aspectRatio: 1,
    borderRadius: 50,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 4,
  },
  cardContainer: {
    flex: 1,
    margin: 5,
    marginBottom: 40,
    gap: 20,
    marginTop: 75,
    zIndex: 1,
  },
  card: {
    borderRadius: 15,
    zIndex: 2,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  welcomeCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  cardContent:{
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 45,
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    position: "absolute",
    bottom: 35,
    right: 16,
    opacity: .5,
  }
});