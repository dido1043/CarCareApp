import {
  DateField,
  FormScreen,
  FormSection,
  NumberField,
  SelectField,
  TextField,
} from '@/components/form';
import { Text, useErrorMessage } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { MaintenanceRecord } from '@/types';
import { fromApiDate } from '@/utils/date';
import { useMaintenanceTypeOptions } from '@/utils/options';
import {
  maintenanceSchema,
  type MaintenanceFormInput,
  type MaintenanceFormOutput,
} from '@/validation/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

interface MaintenanceFormProps {
  record?: MaintenanceRecord;
  /** Pre-fills the mileage field on a new record. */
  currentMileageKm?: number;
  onSubmit: (values: MaintenanceFormOutput) => Promise<void>;
  submitLabel: string;
  secondaryAction?: ReactNode;
}

export function MaintenanceForm({
  record,
  currentMileageKm,
  onSubmit,
  submitLabel,
  secondaryAction,
}: MaintenanceFormProps) {
  const { t } = useTranslation();
  const types = useMaintenanceTypeOptions();
  const toMessage = useErrorMessage();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(() => maintenanceSchema(t), [t]);
  const { control, handleSubmit, formState } = useForm<
    MaintenanceFormInput,
    unknown,
    MaintenanceFormOutput
  >({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      type: record?.type,
      title: record?.title ?? '',
      description: record?.description ?? '',
      cost: record?.cost !== undefined && record.cost !== null ? String(record.cost) : '',
      // Defaulting to today's odometer saves the most common keystrokes.
      mileageKm:
        record?.mileageKm !== undefined && record.mileageKm !== null
          ? String(record.mileageKm)
          : currentMileageKm !== undefined
            ? String(Math.round(currentMileageKm))
            : '',
      date: record ? fromApiDate(record.date) : new Date(),
      nextDueDate: record?.nextDueDate ? fromApiDate(record.nextDueDate) : null,
      nextDueMileageKm:
        record?.nextDueMileageKm !== undefined && record.nextDueMileageKm !== null
          ? String(record.nextDueMileageKm)
          : '',
      notes: record?.notes ?? '',
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
        <SelectField
          control={control}
          name="type"
          label={t('maintenance.type')}
          options={types}
          placeholder={t('common.select')}
        />
        <TextField
          control={control}
          name="title"
          label={t('maintenance.recordTitle')}
          placeholder={t('maintenance.recordTitlePlaceholder')}
        />
        <DateField
          control={control}
          name="date"
          label={t('maintenance.date')}
          maximumDate={new Date()}
        />
        <NumberField
          control={control}
          name="cost"
          label={t('maintenance.cost')}
          placeholder="0"
          optional
        />
        <NumberField
          control={control}
          name="mileageKm"
          label={t('maintenance.mileage')}
          placeholder="145320"
          suffix={t('common.km')}
          optional
        />
      </FormSection>

      <FormSection
        title={t('maintenance.scheduleSection')}
        description={t('maintenance.scheduleHint')}
      >
        <DateField
          control={control}
          name="nextDueDate"
          label={t('maintenance.nextDueDate')}
          optional
          clearable
        />
        <NumberField
          control={control}
          name="nextDueMileageKm"
          label={t('maintenance.nextDueMileage')}
          placeholder="155000"
          suffix={t('common.km')}
          optional
        />
      </FormSection>

      <FormSection>
        <TextField
          control={control}
          name="description"
          label={t('maintenance.description')}
          placeholder={t('maintenance.descriptionPlaceholder')}
          multiline
          optional
        />
        <TextField
          control={control}
          name="notes"
          label={t('maintenance.notes')}
          placeholder={t('maintenance.notesPlaceholder')}
          multiline
          optional
        />
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
