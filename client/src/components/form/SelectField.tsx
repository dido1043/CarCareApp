import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useController, type FieldValues } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { FieldShell } from './FieldShell';
import type { FieldControlProps } from './types';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SelectFieldProps<
  TFieldValues extends FieldValues,
  TTransformed,
  TValue extends string,
> extends FieldControlProps<TFieldValues, TTransformed> {
  label: string;
  options: SelectOption<TValue>[];
  placeholder: string;
  hint?: string;
  optional?: boolean;
}

/**
 * Opens a bottom sheet rather than a native picker wheel: the option lists here
 * are short, and a sheet gives every choice a full-width, thumb-sized target.
 */
export function SelectField<
  TFieldValues extends FieldValues,
  TTransformed,
  TValue extends string,
>({
  control,
  name,
  label,
  options,
  placeholder,
  hint,
  optional = false,
}: SelectFieldProps<TFieldValues, TTransformed, TValue>) {
  const [open, setOpen] = useState(false);
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name });

  const selected = options.find((option) => option.value === value);

  return (
    <>
      <FieldShell label={label} error={error?.message} hint={hint} optional={optional}>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityValue={{ text: selected?.label ?? placeholder }}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        >
          {selected?.icon ? (
            <Ionicons name={selected.icon} size={17} color={colors.primary} />
          ) : null}
          <Text
            variant="body"
            color={selected ? colors.text : colors.textTertiary}
            style={styles.triggerLabel}
            numberOfLines={1}
          >
            {selected?.label ?? placeholder}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </Pressable>
      </FieldShell>

      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View style={styles.options}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={option.label}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                {option.icon ? (
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                ) : null}
                <Text
                  variant="bodyMedium"
                  color={isSelected ? colors.text : colors.textSecondary}
                  style={styles.optionLabel}
                >
                  {option.label}
                </Text>
                {isSelected ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
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
  options: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  optionLabel: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
