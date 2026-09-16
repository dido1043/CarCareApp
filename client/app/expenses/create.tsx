import { ScreenHeader } from '@/components/brand';
import { ExpenseForm } from '@/components/expense';
import { EmptyState } from '@/components/ui';
import { useCreateExpense, useSelectedVehicle } from '@/hooks';
import { usePreferences } from '@/store/preferences';
import { colors } from '@/theme';
import { toExpensePayload } from '@/utils/payload';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function CreateExpenseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { vehicle, vehicleId } = useSelectedVehicle();
  const createExpense = useCreateExpense(vehicleId ?? '');
  const setDefaultCurrency = usePreferences((state) => state.setDefaultCurrency);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('expenses.addTitle')}
        subtitle={vehicle ? `${vehicle.make} ${vehicle.model}` : undefined}
      />

      {vehicle ? (
        <ExpenseForm
          currentMileageKm={Math.max(vehicle.odometerKm, vehicle.estimatedMileageKm)}
          submitLabel={t('common.save')}
          onSubmit={async (values) => {
            await createExpense.mutateAsync(toExpensePayload(values));
            // Remember the currency so the next expense defaults to it.
            setDefaultCurrency(values.currency);
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
