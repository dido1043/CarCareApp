import { colors, spacing } from '@/theme';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';

interface FormScreenProps {
  children: ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  /** Secondary action pinned beside submit, e.g. delete on an edit form. */
  secondaryAction?: ReactNode;
}

/**
 * Form body with the submit button pinned above the keyboard.
 *
 * Keeping the action visible is what makes "add an expense in a few seconds"
 * possible — the user never has to dismiss the keyboard to find the button.
 */
export function FormScreen({
  children,
  submitLabel,
  onSubmit,
  isSubmitting = false,
  disabled = false,
  secondaryAction,
}: FormScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {secondaryAction}
        <Button
          label={submitLabel}
          onPress={onSubmit}
          loading={isSubmitting}
          disabled={disabled}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
