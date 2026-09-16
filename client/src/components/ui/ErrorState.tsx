import { ApiError, NetworkError, TimeoutError } from '@/api/client';
import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button } from './Button';
import { Text } from './Text';

/**
 * Turns a thrown error into a sentence the driver can act on. Falls back to the
 * generic message rather than surfacing a stack trace or an HTTP status.
 */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();

  return (error: unknown): string => {
    if (error instanceof TimeoutError) return t('errors.timeout');
    if (error instanceof NetworkError) return t('errors.network');
    if (error instanceof ApiError) {
      if (error.isUnauthorized) return t('errors.unauthorized');
      if (error.isNotFound) return t('errors.notFound');
      if (error.isServerError) return t('errors.server');
      return error.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return t('errors.generic');
  };
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ error, onRetry, compact = false }: ErrorStateProps) {
  const { t } = useTranslation();
  const toMessage = useErrorMessage();

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="warning-outline"
          size={compact ? 22 : 26}
          color={colors.primary}
        />
      </View>

      <Text variant={compact ? 'cardTitle' : 'heading'} align="center">
        {t('errors.title')}
      </Text>
      <Text
        variant="secondary"
        color={colors.textSecondary}
        align="center"
        style={styles.body}
      >
        {toMessage(error)}
      </Text>

      {onRetry ? (
        <Button
          label={t('common.retry')}
          onPress={onRetry}
          variant="secondary"
          size="md"
          fullWidth={false}
          icon="refresh"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  compact: {
    paddingVertical: spacing.xl,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  body: {
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.xl,
  },
});
