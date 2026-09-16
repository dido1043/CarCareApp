import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';

export interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  /** True while the inner control has focus, to light up the border. */
  focused?: boolean;
}

/**
 * Label, frame and error line shared by every field, so a text input and a date
 * picker look like the same control and report problems the same way.
 */
export function FieldShell({
  label,
  error,
  hint,
  optional = false,
  children,
  focused = false,
}: FieldShellProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text variant="caption" color={colors.textSecondary}>
          {label.toUpperCase()}
        </Text>
        {optional ? (
          <Text variant="caption" color={colors.textTertiary}>
            {t('common.optional')}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.control,
          focused && styles.focused,
          Boolean(error) && styles.errored,
        ]}
      >
        {children}
      </View>

      {/* Errors get an icon as well as red, so the state is not colour-only. */}
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.primary} />
          <Text variant="caption" color={colors.primary} style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" color={colors.textTertiary}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  control: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 50,
    justifyContent: 'center',
  },
  focused: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.cardElevated,
  },
  errored: {
    borderColor: colors.primary,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
  },
});
