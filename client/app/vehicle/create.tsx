import { ScreenHeader } from '@/components/brand';
import { VehicleForm } from '@/components/vehicle';
import { useCreateVehicle } from '@/hooks';
import { colors } from '@/theme';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function CreateVehicleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createVehicle = useCreateVehicle();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('vehicle.addTitle')} />

      <VehicleForm
        submitLabel={t('vehicle.add')}
        onSubmit={async (values) => {
          await createVehicle.mutateAsync(values);
          // Straight to the garage: the new vehicle is already selected.
          router.replace('/(tabs)');
        }}
      />
    </View>
  );
}
