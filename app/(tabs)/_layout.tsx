import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/colors';
import { Tabs } from 'expo-router';
import Icon from "react-native-remix-icon";
import React from 'react';
import { View } from 'react-native';


export default function TabLayout() {

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Tabs
        screenOptions={{
          animation: "none",
          tabBarActiveTintColor: Colors.background,
          tabBarInactiveTintColor: '#7a7c85',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: Colors.foreground,
            borderTopWidth: 0,
            paddingTop: 7,
            height: 90,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) =>
              <View className="relative">
                <Icon name="home-6-line" size="27" color={color} fallback={null} />
                <View style={{
                  backgroundColor: Colors.accent,
                  width: 6.5,
                  height: 6.5,
                  borderRadius: 9999,
                  position: 'absolute',
                  bottom: -11,
                  left: '50%',
                  opacity: focused ? 1 : 0,
                  transform: [{ translateX: -4.5 }],
                }} />
              </View>,
            tabBarLabelStyle: {
              display: "none",
              // fontSize: 11,
              // fontWeight: "400",
              // fontFamily: "TWKLausanne-400",
              // textAlign: "center",
              // marginTop: 2,
            }
          }}
        />
        <Tabs.Screen
          name="assets"
          options={{
            title: "Assets",
            tabBarIcon: ({ color, focused }) => (
              <View className="relative">
                <Icon name="apps-2-add-line" size="25" color={color} fallback={null} />
                <View style={{
                  backgroundColor: Colors.accent,
                  width: 6.5,
                  height: 6.5,
                  borderRadius: 9999,
                  position: 'absolute',
                  bottom: -11,
                  left: '50%',
                  opacity: focused ? 1 : 0,
                  transform: [{ translateX: -6 }],
                }} />
              </View>
            ),
            tabBarLabelStyle: {
              display: "none",
              // fontSize: 11,
              // fontWeight: "400",
              // fontFamily: "TWKLausanne-400",
              // textAlign: "center",
              // marginTop: 2,
            },
          }}
        />
        <Tabs.Screen
          name="analysis"
          options={{
            title: "Analysis",
            tabBarIcon: ({ color, focused }) => (
              <View className="relative">
                <Icon name="scan-2-line" size="26" color={color} fallback={null} />
                <View style={{
                  backgroundColor: Colors.accent,
                  width: 6.5,
                  height: 6.5,
                  borderRadius: 9999,
                  position: 'absolute',
                  bottom: -11,
                  left: '50%',
                  opacity: focused ? 1 : 0,
                  transform: [{ translateX: -5.5 }],
                }} />
              </View>
            ),
            tabBarLabelStyle: {
              display: "none",
              // fontSize: 11,
              // fontWeight: "400",
              // fontFamily: "TWKLausanne-400",
              // textAlign: "center",
              // marginTop: 2,
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) =>
              <View className="relative">
                <Icon name="user-3-line" size="25" color={color} fallback={null} />
                <View style={{
                  backgroundColor: Colors.accent,
                  width: 6.5,
                  height: 6.5,
                  borderRadius: 9999,
                  position: 'absolute',
                  bottom: -11,
                  left: '50%',
                  opacity: focused ? 1 : 0,
                  transform: [{ translateX: -6 }],
                }} />
              </View>,
            tabBarLabelStyle: {
              display: "none",
              // fontSize: 11,
              // fontWeight: "400",
              // fontFamily: "TWKLausanne-400",
              // textAlign: "center",
              // marginTop: 2,
            },
          }}
        />
      </Tabs>
    </View>
  );
}
