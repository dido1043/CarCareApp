import { ScreenHeader } from '@/components/brand';
import { MaintenanceForm } from '@/components/maintenance';
import { EmptyState } from '@/components/ui';
import { useCreateMaintenance, useSelectedVehicle } from '@/hooks';
import { colors } from '@/theme';
import { toMaintenancePayload } from '@/utils/payload';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function CreateMaintenanceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { vehicle, vehicleId } = useSelectedVehicle();
  const createMaintenance = useCreateMaintenance(vehicleId ?? '');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('maintenance.addTitle')}
        subtitle={vehicle ? `${vehicle.make} ${vehicle.model}` : undefined}
      />

      {vehicle ? (
        <MaintenanceForm
          currentMileageKm={Math.max(vehicle.odometerKm, vehicle.estimatedMileageKm)}
          submitLabel={t('common.save')}
          onSubmit={async (values) => {
            await createMaintenance.mutateAsync(toMaintenancePayload(values));
            router.back();
          }}
        />
      ) : (
        <EmptyState
          icon="car-sport-outline"
          title={t('vehicle.empty')}
          body={t('vehicle.emptyBody')}
          actionLabel={t('vehicle.add')}
          onAction={() => router.replace('/vehicle/create')}
        />
      )}
    </View>
  );
}
