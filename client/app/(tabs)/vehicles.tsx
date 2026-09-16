import { ScreenHeader } from '@/components/brand';
import { Button, EmptyState, ErrorState, Screen, SkeletonList } from '@/components/ui';
import { VehicleCard } from '@/components/vehicle';
import { useVehicles } from '@/hooks';
import { usePreferences } from '@/store/preferences';
import { spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export default function VehiclesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: vehicles, isLoading, isError, error, refetch } = useVehicles();
  const selectedVehicleId = usePreferences((state) => state.selectedVehicleId);
  const selectVehicle = usePreferences((state) => state.selectVehicle);

  return (
    <>
      <ScreenHeader title={t('vehicle.myVehicles')} showBack={false} />

      <Screen onRefresh={refetch} bottomInset={spacing.xxl}>
        <View style={styles.content}>
          {isLoading ? <SkeletonList count={3} /> : null}

          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {!isLoading && !isError && vehicles?.length === 0 ? (
            <EmptyState
              icon="car-sport-outline"
              title={t('vehicle.empty')}
              body={t('vehicle.emptyBody')}
              actionLabel={t('vehicle.add')}
              onAction={() => router.push('/vehicle/create')}
            />
          ) : null}

          {vehicles && vehicles.length > 0 ? (
            <>
              <View style={styles.list}>
                {vehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    selected={vehicle.id === selectedVehicleId}
                    onPress={() => {
                      // Opening a vehicle also makes it the active one.
                      selectVehicle(vehicle.id);
                      router.push(`/vehicle/${vehicle.id}`);
                    }}
                  />
                ))}
              </View>

              <Button
                label={t('vehicle.add')}
                icon="add"
                variant="secondary"
                onPress={() => router.push('/vehicle/create')}
              />
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
    gap: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
});
