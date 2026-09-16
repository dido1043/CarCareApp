import { colors, spacing } from '@/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { Text } from '../ui/Text';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

/** Groups related fields, with the optional explanation the group needs. */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <View style={styles.section}>
      {title ? <SectionHeader title={title} /> : null}
      {description ? (
        <Text variant="secondary" color={colors.textSecondary} style={styles.description}>
          {description}
        </Text>
      ) : null}
      <View style={styles.fields}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xs,
  },
  description: {
    marginBottom: spacing.md,
  },
  fields: {
    gap: spacing.lg,
  },
});
