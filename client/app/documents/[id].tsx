import { HeaderIconButton, ScreenHeader } from '@/components/brand';
import {
  Card,
  Divider,
  DocumentStatusBadge,
  ErrorState,
  ListRow,
  Screen,
  SectionHeader,
  SkeletonCard,
  Text,
  useConfirm,
} from '@/components/ui';
import { useDeleteDocument, useDocument, useSelectedVehicle } from '@/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import { fileKindLabel, formatFileSize, isImage } from '@/utils/documents';
import { formatDate } from '@/utils/format';
import { DOCUMENT_ICONS } from '@/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

export default function DocumentDetailScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const confirm = useConfirm();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { vehicleId } = useSelectedVehicle();
  const {
    data: document,
    isLoading,
    isError,
    error,
    refetch,
  } = useDocument(vehicleId, id);
  const deleteDocument = useDeleteDocument(vehicleId ?? '');

  const onDelete = async (): Promise<void> => {
    if (!document) return;
    const confirmed = await confirm({
      title: t('documents.deleteTitle'),
      message: t('documents.deleteMessage', { title: document.title }),
    });
    if (!confirmed) return;

    await deleteDocument.mutateAsync(document.id);
    router.back();
  };

  /** Days-to-expiry in words, which is what the badge alone cannot say. */
  const expiryLine = (): string | null => {
    if (!document || document.daysUntilExpiry === null) return null;
    if (document.daysUntilExpiry === 0) return t('documents.expiresToday');
    return document.daysUntilExpiry < 0
      ? t('documents.expiredDaysAgo', { count: Math.abs(document.daysUntilExpiry) })
      : t('documents.expiresInDays', { count: document.daysUntilExpiry });
  };

  const details = document
    ? [
        { label: t('documents.type'), value: t(`documentType.${document.type}`) },
        {
          label: t('documents.issued'),
          value: document.issuedAt
            ? formatDate(document.issuedAt, language)
            : t('common.notSet'),
        },
        {
          label: t('documents.expires'),
          value: document.expiresAt
            ? formatDate(document.expiresAt, language)
            : t('documents.noExpiry'),
        },
        {
          label: t('documents.file'),
          value: [
            fileKindLabel(document.mimeType),
            formatFileSize(document.fileSizeBytes),
          ]
            .filter(Boolean)
            .join(' • '),
        },
      ]
    : [];

  return (
    <>
      <ScreenHeader
        title={document?.title ?? t('documents.detailTitle')}
        actions={
          document ? (
            <HeaderIconButton
              icon="trash-outline"
              label={t('common.delete')}
              tone="danger"
              onPress={() => void onDelete()}
            />
          ) : null
        }
      />

      <Screen onRefresh={refetch} bottomInset={spacing.xxl}>
        <View style={styles.content}>
          {isLoading ? <SkeletonCard lines={3} /> : null}
          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {document ? (
            <>
              <Card>
                <View style={styles.hero}>
                  <View style={styles.heroIcon}>
                    <Ionicons
                      name={DOCUMENT_ICONS[document.type]}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.heroBody}>
                    <Text variant="heading" numberOfLines={2}>
                      {document.title}
                    </Text>
                    <Text variant="secondary" color={colors.textSecondary}>
                      {t(`documentType.${document.type}`)}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusRow}>
                  <DocumentStatusBadge status={document.status} />
                  {expiryLine() ? (
                    <Text variant="secondary" color={colors.textSecondary}>
                      {expiryLine()}
                    </Text>
                  ) : null}
                </View>
              </Card>

              <View>
                <SectionHeader title={t('documents.preview')} />
                <Card padded={false}>
                  {isImage(document.mimeType) ? (
                    <Image
                      source={{ uri: document.fileUri }}
                      style={styles.preview}
                      resizeMode="contain"
                      accessibilityIgnoresInvertColors
                      accessibilityLabel={document.title}
                    />
                  ) : (
                    <View style={styles.previewFallback}>
                      <Ionicons
                        name="document-text-outline"
                        size={30}
                        color={colors.primary}
                      />
                      <Text variant="bodyMedium">{fileKindLabel(document.mimeType)}</Text>
                      <Text variant="caption" color={colors.textSecondary} align="center">
                        {t('documents.previewUnavailable')}
                      </Text>
                    </View>
                  )}
                </Card>
              </View>

              <View>
                <SectionHeader title={t('vehicle.details')} />
                <Card padded={false}>
                  {details.map((detail, index) => (
                    <Fragment key={detail.label}>
                      {index > 0 ? <Divider /> : null}
                      <ListRow label={detail.label} value={detail.value} />
                    </Fragment>
                  ))}
                </Card>
              </View>

              {document.notes ? (
                <View>
                  <SectionHeader title={t('documents.notes')} />
                  <Card>
                    <Text variant="body" color={colors.textSecondary}>
                      {document.notes}
                    </Text>
                  </Card>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
  heroBody: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexWrap: 'wrap',
  },
  preview: {
    width: '100%',
    height: 280,
    backgroundColor: colors.cardElevated,
  },
  previewFallback: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
});
