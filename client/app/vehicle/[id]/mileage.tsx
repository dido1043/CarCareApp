import { ScreenHeader } from '@/components/brand';
import { FormScreen, FormSection, NumberField } from '@/components/form';
import {
  Card,
  ErrorState,
  ListRow,
  Divider,
  SkeletonCard,
  Text,
  useErrorMessage,
} from '@/components/ui';
import { useTrips, useUpdateMileage, useVehicle } from '@/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing } from '@/theme';
import { formatDate, formatMileage, formatMileageDelta } from '@/utils/format';
import {
  mileageSchema,
  type MileageFormInput,
  type MileageFormOutput,
} from '@/validation/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Confirming the odometer.
 *
 * The two mileage figures are shown side by side and never merged: the reading
 * off the dashboard is the official number, and the GPS estimate is presented as
 * a delta on top of it. Saving re-anchors the estimate to the new reading.
 */
export default function MileageScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toMessage = useErrorMessage();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: vehicle, isLoading, isError, error, refetch } = useVehicle(id);
  const { data: trips } = useTrips(id, 5);
  const updateMileage = useUpdateMileage(id);

  const schema = useMemo(() => mileageSchema(t), [t]);
  const { control, handleSubmit, formState } = useForm<
    MileageFormInput,
    unknown,
    MileageFormOutput
  >({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    // Pre-filled with the estimate: it is the closest guess at the real number,
    // which makes confirming a correct estimate a single tap.
    values: {
      odometerKm: vehicle ? String(Math.round(vehicle.estimatedMileageKm)) : '',
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await updateMileage.mutateAsync(values.odometerKm);
      router.back();
    } catch (mutationError) {
      setSubmitError(toMessage(mutationError));
    }
  });

  const estimatedDelta = vehicle
    ? Math.max(0, vehicle.estimatedMileageKm - vehicle.odometerKm)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('vehicle.updateMileageTitle')} />

      {isLoading ? (
        <View style={{ padding: spacing.xl }}>
          <SkeletonCard lines={4} />
        </View>
      ) : null}

      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {vehicle ? (
        <FormScreen
          submitLabel={t('mileage.confirm')}
          onSubmit={() => void submit()}
          isSubmitting={formState.isSubmitting}
        >
          <Card>
            <Text variant="overline" color={colors.textSecondary}>
              {t('mileage.official')}
            </Text>
            <Text variant="display" numeric style={styles.headline}>
              {formatMileage(vehicle.odometerKm, language)}
            </Text>
            <Text variant="caption" color={colors.textTertiary}>
              {vehicle.odometerConfirmedAt
                ? t('vehicle.confirmedOn', {
                    date: formatDate(vehicle.odometerConfirmedAt, language),
                  })
                : t('vehicle.neverConfirmed')}
            </Text>

            {estimatedDelta >= 1 ? (
              <View style={styles.estimate}>
                <Text variant="caption" color={colors.textSecondary}>
                  {t('mileage.estimated').toUpperCase()}
                </Text>
                <Text variant="cardTitle" numeric color={colors.primary}>
                  {formatMileageDelta(estimatedDelta, language)}
                </Text>
              </View>
            ) : null}
          </Card>

          <FormSection description={t('vehicle.updateMileageBody')}>
            <NumberField
              control={control}
              name="odometerKm"
              label={t('vehicle.newReading')}
              placeholder="145320"
              suffix={t('common.km')}
            />
          </FormSection>

          {submitError ? (
            <View style={styles.errorBox}>
              <Text variant="secondary" color={colors.primary}>
                {submitError}
              </Text>
            </View>
          ) : null}
          <View>
            <Text
              variant="overline"
              color={colors.textSecondary}
              style={styles.tripsLabel}
            >
              {t('mileage.recentTrips')}
            </Text>

            <Card padded={!trips || trips.items.length === 0}>
              {trips && trips.items.length > 0 ? (
                trips.items.map((trip, index) => (
                  <Fragment key={trip.id}>
                    {index > 0 ? <Divider /> : null}
                    <ListRow
                      label={formatDate(trip.startedAt, language)}
                      value={formatMileage(trip.distanceKm, language, {
                        maximumFractionDigits: 1,
                      })}
                      icon="navigate-outline"
                    />
                  </Fragment>
                ))
              ) : (
                <Text variant="secondary" color={colors.textSecondary}>
                  {t('mileage.noTrips')}
                </Text>
              )}
            </Card>

            {/* Automatic tracking is architected for, but deliberately not in the MVP. */}
            <View style={styles.trackingNote}>
              <Ionicons
                name="navigate-circle-outline"
                size={14}
                color={colors.textTertiary}
              />
              <Text
                variant="caption"
                color={colors.textTertiary}
                style={styles.trackingText}
              >
                {t('mileage.tripTrackingOff')}
              </Text>
            </View>
          </View>
        </FormScreen>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headline: {
    marginVertical: spacing.xs,
  },
  estimate: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBox: {
    padding: spacing.lg,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
  tripsLabel: {
    marginBottom: spacing.md,
  },
  trackingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  trackingText: {
    flex: 1,
  },
});
