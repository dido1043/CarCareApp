import { colors, fontFamily, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useController, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Text } from '../ui/Text';
import { FieldShell } from './FieldShell';
import type { FieldControlProps } from './types';

export interface TextFieldProps<TFieldValues extends FieldValues, TTransformed>
  extends
    Omit<TextInputProps, 'value' | 'onChangeText' | 'style'>,
    FieldControlProps<TFieldValues, TTransformed> {
  label: string;
  hint?: string;
  optional?: boolean;
  multiline?: boolean;
  /** Renders a show/hide toggle and masks the value. */
  secure?: boolean;
  /** Fixed text inside the frame, e.g. a currency code. */
  suffix?: string;
}

export function TextField<TFieldValues extends FieldValues, TTransformed>({
  control,
  name,
  label,
  hint,
  optional = false,
  multiline = false,
  secure = false,
  suffix,
  ...inputProps
}: TextFieldProps<TFieldValues, TTransformed>) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({ control, name });

  return (
    <FieldShell
      label={label}
      error={error?.message}
      hint={hint}
      optional={optional}
      focused={focused}
    >
      <View style={styles.row}>
        <TextInput
          {...inputProps}
          ref={ref}
          value={value == null ? '' : String(value)}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          multiline={multiline}
          secureTextEntry={secure && !revealed}
          accessibilityLabel={label}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          style={[styles.input, multiline && styles.multiline]}
        />

        {suffix ? (
          <Text variant="bodyMedium" color={colors.textSecondary} style={styles.suffix}>
            {suffix}
          </Text>
        ) : null}

        {secure ? (
          <Pressable
            onPress={() => setRevealed((current) => !current)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t(revealed ? 'auth.hidePassword' : 'auth.showPassword')}
            style={({ pressed }) => [styles.adornment, pressed && styles.pressed]}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
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
    fontFamily: fontFamily.regular,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  suffix: {
    paddingRight: spacing.lg,
  },
  adornment: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
});
