import { Card } from '@/components/ui/Card';
import { DocumentStatusBadge } from '@/components/ui/StatusBadge';
import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import type { DocumentWithStatus } from '@/types';
import { fileKindLabel, formatFileSize } from '@/utils/documents';
import { formatDate } from '@/utils/format';
import { DOCUMENT_ICONS } from '@/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

interface DocumentCardProps {
  document: DocumentWithStatus;
  onPress?: () => void;
}

/**
 * A document in the vault. The expiry line is the point of the card, so it is
 * given its own row with a badge rather than being folded into the metadata.
 */
export function DocumentCard({ document, onPress }: DocumentCardProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const accent =
    document.status === 'EXPIRED'
      ? colors.danger
      : document.status === 'EXPIRING_SOON'
        ? colors.warning
        : undefined;

  const size = formatFileSize(document.fileSizeBytes);
  const meta = [fileKindLabel(document.mimeType), size].filter(Boolean).join(' • ');

  return (
    <Card onPress={onPress} accentColor={accent} accessibilityLabel={document.title}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={DOCUMENT_ICONS[document.type]}
            size={19}
            color={accent ?? colors.textSecondary}
          />
        </View>

        <View style={styles.body}>
          <Text variant="cardTitle" numberOfLines={1}>
            {document.title}
          </Text>
          <Text variant="secondary" color={colors.textSecondary} numberOfLines={1}>
            {t(`documentType.${document.type}`)} • {meta}
          </Text>

          <View style={styles.statusRow}>
            <DocumentStatusBadge status={document.status} size="sm" />
            <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {document.expiresAt
                ? `${t('documents.expires')} ${formatDate(document.expiresAt, language)}`
                : t('documents.noExpiry')}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElevated,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
});
