import { ScreenHeader } from '@/components/brand';
import { MaintenanceCard, MaintenanceTimeline } from '@/components/maintenance';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  SectionHeader,
  SkeletonList,
  Text,
  VehicleScopeNotice,
} from '@/components/ui';
import { useMaintenanceRecords, useSelectedVehicle } from '@/hooks';
import { colors, spacing } from '@/theme';
import type { MaintenanceRecord } from '@/types';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Service history for the active vehicle: what is coming, then what has been
 * done. Scheduled work is listed first because it is the only part that is
 * actionable.
 */
export default function MaintenanceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { vehicle, vehicles, vehicleId } = useSelectedVehicle();
  const {
    data: records,
    isLoading,
    isError,
    error,
    refetch,
  } = useMaintenanceRecords(vehicleId);

  const currentMileageKm = vehicle
    ? Math.max(vehicle.odometerKm, vehicle.estimatedMileageKm)
    : 0;

  const upcoming = (records ?? [])
    .filter((record) => record.status !== null)
    .sort(byUrgency);
  const history = records ?? [];

  return (
    <>
      <ScreenHeader
        title={t('maintenance.title')}
        showBack={false}
        subtitle={
          vehicle && vehicles.length > 1 ? `${vehicle.make} ${vehicle.model}` : undefined
        }
      />

      <Screen onRefresh={refetch} bottomInset={spacing.xxl}>
        <View style={styles.content}>
          {!vehicle && !isLoading ? (
            <EmptyState
              icon="car-sport-outline"
              title={t('vehicle.empty')}
              body={t('vehicle.emptyBody')}
              actionLabel={t('vehicle.add')}
              onAction={() => router.push('/vehicle/create')}
            />
          ) : null}

          {isLoading ? <SkeletonList count={3} /> : null}

          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {vehicle && !isLoading && !isError && history.length === 0 ? (
            <EmptyState
              icon="construct-outline"
              title={t('maintenance.empty')}
              body={t('maintenance.emptyBody')}
              actionLabel={t('maintenance.add')}
              onAction={() => router.push('/maintenance/create')}
            />
          ) : null}

          {vehicle && history.length > 0 ? (
            <>
              <View>
                <SectionHeader title={t('maintenance.upcoming')} />
                {upcoming.length > 0 ? (
                  <View style={styles.list}>
                    {upcoming.map((record) => (
                      <MaintenanceCard
                        key={record.id}
                        record={record}
                        mode="upcoming"
                        currentMileageKm={currentMileageKm}
                        onPress={() => router.push(`/maintenance/${record.id}`)}
                      />
                    ))}
                  </View>
                ) : (
                  <Card>
                    <Text variant="cardTitle">{t('maintenance.noUpcoming')}</Text>
                    <Text
                      variant="secondary"
                      color={colors.textSecondary}
                      style={styles.cardBody}
                    >
                      {t('maintenance.noNextDue')}
                    </Text>
                  </Card>
                )}
              </View>

              <View>
                <SectionHeader title={t('maintenance.history')} />
                <Card>
                  <MaintenanceTimeline
                    records={history}
                    onSelect={(record) => router.push(`/maintenance/${record.id}`)}
                  />
                </Card>
              </View>

              <Button
                label={t('maintenance.add')}
                icon="add"
                onPress={() => router.push('/maintenance/create')}
              />
            </>
          ) : null}

          {vehicle && vehicles.length > 1 ? (
            <VehicleScopeNotice vehicleName={`${vehicle.make} ${vehicle.model}`} />
          ) : null}
        </View>
      </Screen>
    </>
  );
}

/** Overdue first, then due, then upcoming; the API already scored each record. */
function byUrgency(a: MaintenanceRecord, b: MaintenanceRecord): number {
  const rank = { OVERDUE: 0, DUE: 1, UPCOMING: 2 } as const;
  const aRank = a.status ? rank[a.status] : 3;
  const bRank = b.status ? rank[b.status] : 3;
  return aRank - bRank;
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  list: {
    gap: spacing.md,
  },
  cardBody: {
    marginTop: spacing.xs,
  },
});
