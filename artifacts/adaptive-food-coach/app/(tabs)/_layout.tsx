import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type AddAction = { label: string; icon: keyof typeof Feather.glyphMap; href: Href };

const ADD_ACTIONS: AddAction[] = [
  { label: 'AI Coach & Meal Ideas', icon: 'message-circle', href: '/coach' },
  { label: 'Scan Food', icon: 'maximize', href: '/scan/food-camera' },
  { label: 'Food Database', icon: 'search', href: '/log-food' },
  { label: 'Log Exercise', icon: 'activity', href: '/exercise' },
  { label: 'Saved Foods', icon: 'bookmark', href: '/log-food/saved' },
];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const closeMenu = () => {
    Haptics.selectionAsync();
    setIsAddMenuOpen(false);
  };

  const handleMenuAction = (href: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAddMenuOpen(false);
    router.push(href);
  };

  return (
    <View style={[styles.dockContainer, { paddingBottom: insets.bottom || 24 }]} pointerEvents="box-none">
      <Modal
        visible={isAddMenuOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <View style={styles.addMenuScreen}>
          <Pressable
            style={styles.addMenuBackdrop}
            accessibilityLabel="Close add menu"
            accessibilityRole="button"
            onPress={closeMenu}
          />
          <View style={[styles.addMenu, { bottom: (insets.bottom || 24) + 88 }]}>
            {ADD_ACTIONS.map((action) => (
              <AddMenuAction
                key={action.label}
                icon={action.icon}
                label={action.label}
                onPress={() => handleMenuAction(action.href)}
              />
            ))}
          </View>
          <Pressable
            style={[
              styles.modalCloseButton,
              {
                bottom: insets.bottom || 24,
                right: 20,
                backgroundColor: colors.primary,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close add menu"
            testID="close-add-menu"
            onPress={closeMenu}
          >
            <RotatingAddIcon isOpen />
          </Pressable>
        </View>
      </Modal>
      <BlurView
        intensity={8}
        tint="light"
        pointerEvents="none"
        style={styles.dockBlurPlate}
      />
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
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('progress');
          }}
          accessibilityLabel="Charts tab"
          accessibilityRole="tab"
          testID="tab-charts"
        >
          <Feather name="bar-chart-2" size={24} color={state.index === 1 ? '#ffffff' : '#8E8E93'} />
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('community');
          }}
          accessibilityLabel="Community tab"
          accessibilityRole="tab"
          testID="tab-community"
        >
          <Feather name="users" size={24} color={state.index === 2 ? '#ffffff' : '#8E8E93'} />
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('profile');
          }}
          accessibilityLabel="Profile tab"
          accessibilityRole="tab"
          testID="tab-profile"
        >
          <Feather name="user" size={24} color={state.index === 3 ? '#ffffff' : '#8E8E93'} />
        </Pressable>
      </View>

      <Pressable
        style={[
          styles.addButton,
          { backgroundColor: colors.primary, opacity: isAddMenuOpen ? 0 : 1 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setIsAddMenuOpen((open) => !open);
        }}
        accessibilityLabel={isAddMenuOpen ? 'Close add menu' : 'Open add menu'}
        accessibilityRole="button"
        accessibilityState={{ expanded: isAddMenuOpen }}
        testID="tab-add"
      >
        <RotatingAddIcon isOpen={isAddMenuOpen} />
      </Pressable>
    </View>
  );
}

function RotatingAddIcon({ isOpen }: { isOpen: boolean }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(isOpen ? 45 : 0, {
      duration: 220,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isOpen, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Feather name="plus" size={25} color="#ffffff" />
    </Animated.View>
  );
}

function AddMenuAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      style={({ pressed }) => [styles.addMenuAction, pressed && styles.addMenuActionPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`add-menu-${label.toLowerCase().replace(' ', '-')}`}
      onPress={onPress}
    >
      <View style={[styles.addMenuIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={20} color={colors.foreground} />
      </View>
      <Text style={[styles.addMenuLabel, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="profile" />
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
  dockBlurPlate: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 88,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  addMenuScreen: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  addMenuBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  addMenu: {
    position: 'absolute',
    right: 20,
    width: 200,
    gap: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 16,
    height: 64,
    width: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A7AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addMenuAction: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 8,
  },
  addMenuActionPressed: {
    opacity: 0.74,
    transform: [{ scale: 0.98 }],
  },
  addMenuIcon: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMenuLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  dockPill: {
    flex: 1,
    height: 64,
    backgroundColor: '#1C1C1E',
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
