import {
  FormScreen,
  FormSection,
  NumberField,
  SelectField,
  TextField,
} from '@/components/form';
import { Text, useErrorMessage } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { Vehicle } from '@/types';
import { useFuelTypeOptions } from '@/utils/options';
import {
  vehicleSchema,
  type VehicleFormInput,
  type VehicleFormOutput,
} from '@/validation/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

interface VehicleFormProps {
  /** Present when editing; the odometer field is then hidden. */
  vehicle?: Vehicle;
  onSubmit: (values: VehicleFormOutput) => Promise<void>;
  submitLabel: string;
  secondaryAction?: ReactNode;
}

/**
 * One form for creating and editing a vehicle.
 *
 * The odometer only appears on create: afterwards it is a confirmed reading that
 * re-anchors the GPS estimate, which the API handles through its own endpoint.
 */
export function VehicleForm({
  vehicle,
  onSubmit,
  submitLabel,
  secondaryAction,
}: VehicleFormProps) {
  const { t } = useTranslation();
  const fuelTypes = useFuelTypeOptions();
  const toMessage = useErrorMessage();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(() => vehicleSchema(t), [t]);
  const { control, handleSubmit, formState } = useForm<
    VehicleFormInput,
    unknown,
    VehicleFormOutput
  >({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      make: vehicle?.make ?? '',
      model: vehicle?.model ?? '',
      year: vehicle ? String(vehicle.year) : '',
      fuelType: vehicle?.fuelType,
      engine: vehicle?.engine ?? '',
      licensePlate: vehicle?.licensePlate ?? '',
      vin: vehicle?.vin ?? '',
      odometerKm: vehicle ? String(vehicle.odometerKm) : '',
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(toMessage(error));
    }
  });

  return (
    <FormScreen
      submitLabel={submitLabel}
      onSubmit={() => void submit()}
      isSubmitting={formState.isSubmitting}
      secondaryAction={secondaryAction}
    >
      <FormSection>
        <TextField
          control={control}
          name="make"
          label={t('vehicle.make')}
          placeholder={t('vehicle.makePlaceholder')}
          autoCapitalize="words"
        />
        <TextField
          control={control}
          name="model"
          label={t('vehicle.model')}
          placeholder={t('vehicle.modelPlaceholder')}
          autoCapitalize="words"
        />
        <NumberField
          control={control}
          name="year"
          label={t('vehicle.year')}
          placeholder="2018"
          integer
        />
        <SelectField
          control={control}
          name="fuelType"
          label={t('vehicle.fuelType')}
          options={fuelTypes}
          placeholder={t('common.select')}
        />
      </FormSection>

      <FormSection title={t('vehicle.details')}>
        <TextField
          control={control}
          name="engine"
          label={t('vehicle.engine')}
          placeholder={t('vehicle.enginePlaceholder')}
          optional
        />
        <TextField
          control={control}
          name="licensePlate"
          label={t('vehicle.licensePlate')}
          placeholder={t('vehicle.licensePlatePlaceholder')}
          autoCapitalize="characters"
          optional
        />
        <TextField
          control={control}
          name="vin"
          label={t('vehicle.vin')}
          placeholder={t('vehicle.vinPlaceholder')}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={17}
          optional
        />

        {!vehicle ? (
          <NumberField
            control={control}
            name="odometerKm"
            label={t('vehicle.currentMileage')}
            placeholder="145320"
            suffix={t('common.km')}
            optional
          />
        ) : null}
      </FormSection>

      {submitError ? (
        <View style={styles.errorBox}>
          <Text variant="secondary" color={colors.primary}>
            {submitError}
          </Text>
        </View>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    padding: spacing.lg,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
});
