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
                try {
                  await createTaraBuddyProfile();
                } catch (err: any) {
                  Alert.alert("Error", err.message || "Failed to start matching");
                }
              }}
            />
          </ThemedView>
        </View>
      ) : (
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
      )}
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
    padding: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
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
    margin: 20,
    zIndex: 0,
    marginBottom: 40,
    gap: 20,
    marginTop: 135,
  },
  card: {
    padding: 20,
    borderRadius: 15,
    zIndex: 2,
    width: "100%",
    height: "100%",
  },
  welcomeCard: {
    alignItems: "center",
    justifyContent: "center",
  },
});