import { HeaderIconButton, ScreenHeader } from '@/components/brand';
import { QuickActionGrid, type GridAction } from '@/components/dashboard';
import {
  Card,
  Divider,
  ErrorState,
  ListRow,
  Screen,
  SectionHeader,
  SkeletonCard,
  Text,
  useConfirm,
} from '@/components/ui';
import { VehicleHeader } from '@/components/vehicle';
import { useDeleteVehicle, useReminders, useVehicle } from '@/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing } from '@/theme';
import { formatDate, formatMileage } from '@/utils/format';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export default function VehicleDetailScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const confirm = useConfirm();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: vehicle, isLoading, isError, error, refetch } = useVehicle(id);
  const { reminders } = useReminders(vehicle ?? null);
  const deleteVehicle = useDeleteVehicle();

  const openReminders = reminders.filter((reminder) => reminder.severity !== 'UPCOMING');

  const onDelete = async (): Promise<void> => {
    if (!vehicle) return;

    const confirmed = await confirm({
      title: t('vehicle.deleteTitle'),
      message: t('vehicle.deleteMessage', {
        name: `${vehicle.make} ${vehicle.model}`,
      }),
    });
    if (!confirmed) return;

    await deleteVehicle.mutateAsync(vehicle.id);
    router.replace('/(tabs)/vehicles');
  };

  const actions: GridAction[] = vehicle
    ? [
        {
          key: 'maintenance',
          label: t('vehicle.actions.maintenance'),
          icon: 'construct-outline',
          onPress: () => router.push('/(tabs)/maintenance'),
        },
        {
          key: 'expenses',
          label: t('vehicle.actions.expenses'),
          icon: 'wallet-outline',
          onPress: () => router.push('/(tabs)/expenses'),
        },
        {
          key: 'documents',
          label: t('vehicle.actions.documents'),
          icon: 'folder-outline',
          onPress: () => router.push('/(tabs)/documents'),
        },
        {
          key: 'reminders',
          label: t('vehicle.actions.reminders'),
          icon: 'notifications-outline',
          badge: openReminders.length,
          onPress: () => router.push('/reminders'),
        },
        {
          key: 'statistics',
          label: t('vehicle.actions.statistics'),
          icon: 'stats-chart-outline',
          onPress: () => router.push('/statistics'),
        },
      ]
    : [];

  const specs = vehicle
    ? [
        { label: t('vehicle.year'), value: String(vehicle.year) },
        { label: t('vehicle.fuelType'), value: t(`fuelType.${vehicle.fuelType}`) },
        { label: t('vehicle.engine'), value: vehicle.engine ?? t('common.notSet') },
        {
          label: t('vehicle.licensePlate'),
          value: vehicle.licensePlate ?? t('common.notSet'),
        },
        { label: t('vehicle.vin'), value: vehicle.vin ?? t('common.notSet') },
      ]
    : [];

  return (
    <>
      <ScreenHeader
        title={vehicle ? `${vehicle.make} ${vehicle.model}` : t('vehicle.details')}
        actions={
          vehicle ? (
            <>
              <HeaderIconButton
                icon="create-outline"
                label={t('common.edit')}
                onPress={() => router.push(`/vehicle/${vehicle.id}/edit`)}
              />
              <HeaderIconButton
                icon="trash-outline"
                label={t('common.delete')}
                tone="danger"
                onPress={() => void onDelete()}
              />
            </>
          ) : null
        }
      />

      <Screen onRefresh={refetch} bottomInset={spacing.xxl}>
        <View style={styles.content}>
          {isLoading ? <SkeletonCard lines={4} /> : null}
          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {vehicle ? (
            <>
              <VehicleHeader
                vehicle={vehicle}
                onPressMileage={() => router.push(`/vehicle/${vehicle.id}/mileage`)}
              />

              <View>
                <SectionHeader title={t('dashboard.quickActions')} />
                <QuickActionGrid actions={actions} />
              </View>

              <View>
                <SectionHeader title={t('vehicle.details')} />
                <Card padded={false}>
                  {specs.map((spec, index) => (
                    <Fragment key={spec.label}>
                      {index > 0 ? <Divider /> : null}
                      <ListRow label={spec.label} value={spec.value} />
                    </Fragment>
                  ))}
                </Card>
              </View>

              <View>
                <SectionHeader title={t('mileage.title')} />
                <Card padded={false}>
                  <ListRow
                    label={t('mileage.official')}
                    value={formatMileage(vehicle.odometerKm, language)}
                    icon="speedometer-outline"
                    onPress={() => router.push(`/vehicle/${vehicle.id}/mileage`)}
                  />
                  <Divider />
                  <ListRow
                    label={t('mileage.estimated')}
                    value={formatMileage(vehicle.estimatedMileageKm, language)}
                    icon="navigate-circle-outline"
                  />
                  <Divider />
                  <ListRow
                    label={t('vehicle.lastConfirmed')}
                    value={
                      vehicle.odometerConfirmedAt
                        ? formatDate(vehicle.odometerConfirmedAt, language)
                        : t('vehicle.neverConfirmed')
                    }
                    icon="calendar-outline"
                  />
                </Card>

                <Text variant="caption" color={colors.textTertiary} style={styles.hint}>
                  {t('mileage.estimatedHint')}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  hint: {
    marginTop: spacing.md,
  },
});
