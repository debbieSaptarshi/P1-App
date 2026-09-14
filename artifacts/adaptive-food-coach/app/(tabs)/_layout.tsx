import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View style={[styles.dockContainer, { paddingBottom: insets.bottom || 24 }]} pointerEvents="box-none">
      <View style={styles.dockPill}>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('index');
          }}
          accessibilityLabel="Home tab"
          accessibilityRole="tab"
          testID="tab-home"
        >
          <Feather name="home" size={24} color={state.index === 0 ? '#ffffff' : '#8E8E93'} />
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => Haptics.selectionAsync()}
          accessibilityLabel="Charts tab"
          accessibilityRole="tab"
          testID="tab-charts"
        >
          <Feather name="bar-chart-2" size={24} color={'#8E8E93'} />
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => Haptics.selectionAsync()}
          accessibilityLabel="Search tab"
          accessibilityRole="tab"
          testID="tab-search"
        >
          <Feather name="search" size={24} color={'#8E8E93'} />
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => Haptics.selectionAsync()}
          accessibilityLabel="Profile tab"
          accessibilityRole="tab"
          testID="tab-profile"
        >
          <Feather name="user" size={24} color={'#8E8E93'} />
        </Pressable>
      </View>

      <Pressable
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        accessibilityLabel="Add meal"
        accessibilityRole="button"
        testID="tab-add"
      >
        <Feather name="plus" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  dockPill: {
    flex: 1,
    height: 64,
    backgroundColor: '#1C1C1E', // Black dock
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  tabItem: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A7AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
