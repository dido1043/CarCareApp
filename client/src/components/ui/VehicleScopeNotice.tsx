import { colors, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

/**
 * Shown on the list tabs so it is never ambiguous which vehicle's records are
 * on screen when the garage holds more than one.
 */
export function VehicleScopeNotice({ vehicleName }: { vehicleName: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name="car-sport-outline" size={13} color={colors.textTertiary} />
      <Text variant="caption" color={colors.textTertiary} numberOfLines={1}>
        {vehicleName.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
