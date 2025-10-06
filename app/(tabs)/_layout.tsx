import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import {ThemedIcons} from '@/components/ThemedIcons';

function TabBarLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Text
      style={{
        fontFamily: 'Poppins',
        fontSize: 11,
        color,
        textAlign: 'center',
        opacity: .7,
      }}
    >
      {children}
    </Text>
  );
}

export default function TabLayout() {
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: secondaryColor,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabel: ({ children, color }) => <TabBarLabel color={color}>{children}</TabBarLabel>,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            paddingHorizontal: 24,
            paddingTop: 5,
            height: 70,
            backgroundColor: primaryColor,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          default: {
            paddingHorizontal: 10,
            paddingTop: 5,
            height: 70,
            backgroundColor: primaryColor,
            borderTopWidth: 0,
            elevation: 0,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <ThemedIcons
              library="MaterialDesignIcons"
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: 'Maps',
          tabBarIcon: ({ color, focused }) => (
            <ThemedIcons
              library="MaterialDesignIcons"
              name={focused ? 'map' : 'map-outline'}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <ThemedIcons
              library="MaterialDesignIcons"
              name={focused ? 'compass' : 'compass-outline'}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <ThemedIcons
              library="MaterialDesignIcons"
              name={focused ? 'account' : 'account-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}