import { colors, fontFamily } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, type ColorValue } from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

/** Filled when active, outlined when not — so the state is not colour-only. */
function tabIcon(active: IconName, inactive: IconName) {
  function TabBarIcon({
    color,
    focused,
    size,
  }: {
    color: ColorValue;
    focused: boolean;
    size: number;
  }) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  }
  return TabBarIcon;
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: tabIcon('speedometer', 'speedometer-outline'),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: t('tabs.vehicles'),
          tabBarIcon: tabIcon('car-sport', 'car-sport-outline'),
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: t('tabs.maintenance'),
          tabBarIcon: tabIcon('construct', 'construct-outline'),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t('tabs.expenses'),
          tabBarIcon: tabIcon('wallet', 'wallet-outline'),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: t('tabs.documents'),
          tabBarIcon: tabIcon('folder-open', 'folder-outline'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    // Android draws no inset of its own, so the bar needs the height itself.
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  item: {
    paddingVertical: 4,
  },
});
