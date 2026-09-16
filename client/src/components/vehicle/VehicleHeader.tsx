import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import type { Vehicle } from '@/types';
import { formatMileage, formatMileageDelta } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

interface VehicleHeaderProps {
  vehicle: Vehicle;
  /** Opens the vehicle switcher; omitted when there is only one vehicle. */
  onSwitchVehicle?: () => void;
  onPressMileage?: () => void;
}

/**
 * The hero block: which car, and how far it has gone.
 *
 * The confirmed odometer is the headline; the GPS estimate appears beneath it as
 * a delta, never as the number itself — presenting an estimate as the odometer
 * would be a lie the driver could not check.
 */
export function VehicleHeader({
  vehicle,
  onSwitchVehicle,
  onPressMileage,
}: VehicleHeaderProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const estimatedDelta = Math.max(0, vehicle.estimatedMileageKm - vehicle.odometerKm);
  const hasEstimate = estimatedDelta >= 1;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleGroup}>
          <Text
            variant="display"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {vehicle.make} {vehicle.model}
          </Text>
          <Text variant="secondary" color={colors.textSecondary}>
            {vehicle.year} • {t(`fuelType.${vehicle.fuelType}`).toUpperCase()}
            {vehicle.engine ? ` • ${vehicle.engine}` : ''}
          </Text>
        </View>

        {onSwitchVehicle ? (
          <Pressable
            onPress={onSwitchVehicle}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.switchVehicle')}
            style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}
          >
            <Ionicons name="swap-horizontal" size={18} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onPressMileage}
        disabled={!onPressMileage}
        accessibilityRole={onPressMileage ? 'button' : undefined}
        accessibilityLabel={`${t('vehicle.odometer')}: ${formatMileage(vehicle.odometerKm, language)}`}
        accessibilityHint={onPressMileage ? t('vehicle.updateMileage') : undefined}
        style={({ pressed }) => [styles.mileageBlock, pressed && styles.pressed]}
      >
        <Text variant="overline" color={colors.textSecondary}>
          {t('vehicle.odometer')}
        </Text>
        <Text
          variant="display"
          numeric
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={styles.odometer}
        >
          {formatMileage(vehicle.odometerKm, language)}
        </Text>

        {hasEstimate ? (
          <View style={styles.estimateRow}>
            <Ionicons name="navigate-circle-outline" size={14} color={colors.primary} />
            <Text variant="caption" color={colors.textSecondary}>
              {t('mileage.estimatedDelta', {
                distance: formatMileageDelta(estimatedDelta, language),
              })}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  switchButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  mileageBlock: {
    gap: spacing.xs,
  },
  odometer: {
    marginTop: spacing.xs,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
