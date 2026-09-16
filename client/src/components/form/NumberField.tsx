import { colors, fontFamily, numericStyle, spacing, typography } from '@/theme';
import { useState } from 'react';
import { useController, type FieldValues } from 'react-hook-form';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../ui/Text';
import { FieldShell } from './FieldShell';
import type { FieldControlProps } from './types';

interface NumberFieldProps<
  TFieldValues extends FieldValues,
  TTransformed,
> extends FieldControlProps<TFieldValues, TTransformed> {
  label: string;
  hint?: string;
  optional?: boolean;
  placeholder?: string;
  /** Leading unit, e.g. a currency symbol. */
  prefix?: string;
  /** Trailing unit, e.g. `km`. */
  suffix?: string;
  /** Whole numbers only — used for the year field. */
  integer?: boolean;
}

/**
 * Numeric entry that keeps the raw string in form state.
 *
 * Parsing on every keystroke would fight the user mid-typing ("1." is not a
 * number yet, and neither is an empty field), so the value stays a string and
 * the Zod schema coerces it once, on submit.
 */
export function NumberField<TFieldValues extends FieldValues, TTransformed>({
  control,
  name,
  label,
  hint,
  optional = false,
  placeholder,
  prefix,
  suffix,
  integer = false,
}: NumberFieldProps<TFieldValues, TTransformed>) {
  const [focused, setFocused] = useState(false);
  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({ control, name });

  /** Strips anything that cannot appear in a number the user is still typing. */
  const sanitise = (raw: string): string => {
    const normalised = raw.replace(',', '.');
    const allowed = integer ? /[^0-9]/g : /[^0-9.]/g;
    const cleaned = normalised.replace(allowed, '');
    if (integer) return cleaned;

    // Keep only the first decimal point.
    const [whole, ...rest] = cleaned.split('.');
    return rest.length > 0 ? `${whole}.${rest.join('')}` : cleaned;
  };

  return (
    <FieldShell
      label={label}
      error={error?.message}
      hint={hint}
      optional={optional}
      focused={focused}
    >
      <View style={styles.row}>
        {prefix ? (
          <Text variant="bodyMedium" color={colors.textSecondary} style={styles.prefix}>
            {prefix}
          </Text>
        ) : null}

        <TextInput
          ref={ref}
          value={value == null ? '' : String(value)}
          onChangeText={(raw) => onChange(sanitise(raw))}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          // `decimal-pad` has no minus sign, which is right for money and mileage.
          keyboardType={
            integer ? 'number-pad' : Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'
          }
          inputMode={integer ? 'numeric' : 'decimal'}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          accessibilityLabel={label}
          style={[styles.input, prefix ? styles.inputWithPrefix : null]}
        />

        {suffix ? (
          <Text variant="bodyMedium" color={colors.textSecondary} style={styles.suffix}>
            {suffix}
          </Text>
        ) : null}
      </View>
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...typography.body,
    ...numericStyle,
    fontFamily: fontFamily.medium,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  inputWithPrefix: {
    paddingLeft: spacing.sm,
  },
  prefix: {
    paddingLeft: spacing.lg,
  },
  suffix: {
    paddingRight: spacing.lg,
  },
});
