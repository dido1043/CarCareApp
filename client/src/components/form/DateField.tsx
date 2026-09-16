import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/utils/format';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useController, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { FieldShell } from './FieldShell';
import type { FieldControlProps } from './types';

interface DateFieldProps<
  TFieldValues extends FieldValues,
  TTransformed,
> extends FieldControlProps<TFieldValues, TTransformed> {
  label: string;
  hint?: string;
  optional?: boolean;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Shows a clear button, for next-due dates that can be unset. */
  clearable?: boolean;
}

/**
 * Date entry backed by the platform picker.
 *
 * Android's picker is a modal dialog that reports once and dismisses itself;
 * iOS's is an inline spinner that needs its own confirm. Both paths write a
 * `Date` (or null) into form state, so the schema sees one shape.
 */
export function DateField<TFieldValues extends FieldValues, TTransformed>({
  control,
  name,
  label,
  hint,
  optional = false,
  placeholder,
  minimumDate,
  maximumDate,
  clearable = false,
}: DateFieldProps<TFieldValues, TTransformed>) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date | null>(null);

  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name });

  // The field value is generic; only a Date is meaningful to this control.
  const currentValue: Date | null =
    (value as unknown) instanceof Date ? (value as Date) : null;

  const openPicker = (): void => {
    setDraft(currentValue ?? new Date());
    setOpen(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date): void => {
    setOpen(false);
    if (event.type === 'set' && selected) onChange(selected);
  };

  return (
    <>
      <FieldShell label={label} error={error?.message} hint={hint} optional={optional}>
        <View style={styles.row}>
          <Pressable
            onPress={openPicker}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityValue={{
              text: currentValue
                ? formatDate(currentValue, language)
                : t('common.notSet'),
            }}
            style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
          >
            <Ionicons name="calendar-outline" size={17} color={colors.textSecondary} />
            <Text
              variant="body"
              color={currentValue ? colors.text : colors.textTertiary}
              style={styles.triggerLabel}
              numberOfLines={1}
            >
              {currentValue
                ? formatDate(currentValue, language)
                : (placeholder ?? t('common.notSet'))}
            </Text>
          </Pressable>

          {clearable && currentValue ? (
            <Pressable
              onPress={() => onChange(null)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
              style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
            >
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </FieldShell>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={currentValue ?? new Date()}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS !== 'android' ? (
        <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
          <View style={styles.sheetBody}>
            <DateTimePicker
              value={draft ?? new Date()}
              mode="date"
              display="spinner"
              themeVariant="dark"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(_event, selected) => {
                if (selected) setDraft(selected);
              }}
              style={styles.picker}
            />
            <Button
              label={t('common.done')}
              onPress={() => {
                onChange(draft ?? new Date());
                setOpen(false);
              }}
            />
          </View>
        </Sheet>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  triggerLabel: {
    flex: 1,
  },
  clear: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  sheetBody: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  picker: {
    alignSelf: 'stretch',
  },
});
