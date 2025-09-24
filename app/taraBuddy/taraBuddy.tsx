import { ThemedText } from "@/components/ThemedText";
import { View, StyleSheet, TouchableOpacity, Alert, FlatList, ActivityIndicator } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import ThemedIcons from "@/components/ThemedIcons";
import Button from '@/components/Button';
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "@/context/SessionContext";
import {LinearGradient} from "expo-linear-gradient";
import {Foundation} from '@expo/vector-icons';

export default function TaraBuddySection(){
    const primaryColor = useThemeColor({}, 'primary');
    const secondaryColor = useThemeColor({}, 'secondary');
    const { session } = useSession();
    

    return (
    <View style={{flex: 1}}>
        <TouchableOpacity onPress={() => router.push('/taraBuddy/taraBuddy-settings')}>
            <ThemedView color="primary" shadow style={styles.settings}>
                <ThemedIcons library='MaterialIcons' name="settings" size={20}/>
            </ThemedView>
        </TouchableOpacity>
        <View style={styles.bottomOptionContainer}>
            <LinearGradient
            colors={['transparent', primaryColor]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientOverlay}
            pointerEvents="none"
            />
            <TouchableOpacity style={[styles.bottomOption, {backgroundColor: '#4CAF50'}]}>
                <ThemedIcons library='MaterialIcons' name="close" size={40} color="white"/>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bottomOption, {backgroundColor: '#4CAF50'}]}>
                <Foundation name="like" size={40} color="white" />
            </TouchableOpacity>
        </View>
        

    </View>
    
   ); 
}

const styles = StyleSheet.create({
    gradientOverlay: {
        height: 100,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 3,
        pointerEvents: 'none',
      },
    bottomOptionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 3,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    bottomOption: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        aspectRatio: 1,
        borderRadius: 50,
        backgroundColor: 'white',
        shadowColor: '#000',
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
        position: 'absolute',
        top: 135,
        right: 15,
        zIndex: 4,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 50,
        opacity: 0.5,
    },

});