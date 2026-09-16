import { Sheet } from '@/components/ui/Sheet';
import { colors, spacing } from '@/theme';
import type { Vehicle } from '@/types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button } from '../ui/Button';
import { VehicleCard } from './VehicleCard';

interface VehiclePickerProps {
  visible: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelect: (vehicleId: string) => void;
  onAddVehicle: () => void;
}

/** Switches the vehicle the whole app is scoped to. */
export function VehiclePicker({
  visible,
  onClose,
  vehicles,
  selectedVehicleId,
  onSelect,
  onAddVehicle,
}: VehiclePickerProps) {
  const { t } = useTranslation();

  return (
    <Sheet visible={visible} onClose={onClose} title={t('vehicle.selectVehicle')}>
      <View style={styles.list}>
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            compact
            selected={vehicle.id === selectedVehicleId}
            onPress={() => {
              onSelect(vehicle.id);
              onClose();
            }}
          />
        ))}

        <Button
          label={t('vehicle.add')}
          icon="add"
          variant="secondary"
          onPress={() => {
            onClose();
            onAddVehicle();
          }}
          style={styles.add}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  add: {
    marginTop: spacing.sm,
    borderColor: colors.border,
  },
});
