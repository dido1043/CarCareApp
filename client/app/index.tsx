import { colors } from '@/theme';
import { Redirect } from 'expo-router';
import { View } from 'react-native';

/**
 * The entry route exists only to hand off to the tab navigator; the root
 * layout's guard decides whether the user gets there or is sent to sign in.
 */
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Redirect href="/(tabs)" />
    </View>
  );
}
