import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import type { Vehicle } from '@/types';
import { formatMileage, vehicleInitials } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: () => void;
  /** Marks the vehicle the rest of the app is currently scoped to. */
  selected?: boolean;
  compact?: boolean;
}

/**
 * A vehicle at a glance. The plate-style initials stand in for a photo, which
 * keeps images optional without leaving the card looking unfinished.
 */
export function VehicleCard({
  vehicle,
  onPress,
  selected = false,
  compact = false,
}: VehicleCardProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const currentKm = Math.max(vehicle.odometerKm, vehicle.estimatedMileageKm);
  const name = `${vehicle.make} ${vehicle.model}`;

  return (
    <Card
      onPress={onPress}
      accentColor={selected ? colors.primary : undefined}
      accessibilityLabel={name}
      accessibilityHint={t('dashboard.viewVehicle')}
      style={selected ? styles.selected : undefined}
    >
      <View style={styles.row}>
        <View style={[styles.badge, compact && styles.badgeCompact]}>
          <Text
            variant={compact ? 'cardTitle' : 'heading'}
            color={colors.primary}
            numberOfLines={1}
          >
            {vehicleInitials(vehicle.make, vehicle.model)}
          </Text>
        </View>

        <View style={styles.details}>
          <Text variant="cardTitle" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="secondary" color={colors.textSecondary} numberOfLines={1}>
            {vehicle.year} • {t(`fuelType.${vehicle.fuelType}`)}
            {vehicle.licensePlate ? ` • ${vehicle.licensePlate}` : ''}
          </Text>
          <Text variant="bodyMedium" color={colors.text} numeric style={styles.mileage}>
            {formatMileage(currentKm, language)}
          </Text>
        </View>

        {onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  selected: {
    borderColor: colors.primaryBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  badge: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
  badgeCompact: {
    width: 44,
    height: 44,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  mileage: {
    marginTop: spacing.xs,
  },
});
