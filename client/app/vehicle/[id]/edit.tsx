import { ScreenHeader } from '@/components/brand';
import { Button, ErrorState, SkeletonCard, useConfirm } from '@/components/ui';
import { VehicleForm } from '@/components/vehicle';
import { useDeleteVehicle, useUpdateVehicle, useVehicle } from '@/hooks';
import { colors, spacing } from '@/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function EditVehicleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const confirm = useConfirm();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: vehicle, isLoading, isError, error, refetch } = useVehicle(id);
  const updateVehicle = useUpdateVehicle(id);
  const deleteVehicle = useDeleteVehicle();

  const onDelete = async (): Promise<void> => {
    if (!vehicle) return;

    const confirmed = await confirm({
      title: t('vehicle.deleteTitle'),
      message: t('vehicle.deleteMessage', { name: `${vehicle.make} ${vehicle.model}` }),
    });
    if (!confirmed) return;

    await deleteVehicle.mutateAsync(vehicle.id);
    router.replace('/(tabs)/vehicles');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('vehicle.editTitle')} />

      {isLoading ? (
        <View style={{ padding: spacing.xl }}>
          <SkeletonCard lines={5} />
        </View>
      ) : null}

      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {vehicle ? (
        <VehicleForm
          vehicle={vehicle}
          submitLabel={t('common.save')}
          onSubmit={async (values) => {
            // The odometer is re-anchored through its own endpoint, not here.
            const { odometerKm: _odometerKm, ...editable } = values;
            await updateVehicle.mutateAsync(editable);
            router.back();
          }}
          secondaryAction={
            <Button
              label={t('common.delete')}
              variant="danger"
              icon="trash-outline"
              onPress={() => void onDelete()}
            />
          }
        />
      ) : null}
    </View>
  );
}
