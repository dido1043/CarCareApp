import { ScreenHeader } from '@/components/brand';
import { DocumentCard } from '@/components/document';
import {
  Button,
  EmptyState,
  ErrorState,
  Screen,
  SectionHeader,
  SkeletonList,
  Text,
  VehicleScopeNotice,
} from '@/components/ui';
import { useDocuments, useSelectedVehicle } from '@/hooks';
import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * The document vault. Anything expired or about to expire is lifted to the top,
 * since that is the only reason to open this screen in a hurry.
 */
export default function DocumentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { vehicle, vehicles, vehicleId } = useSelectedVehicle();
  const { data: documents, isLoading, isError, error, refetch } = useDocuments(vehicleId);

  const { needsAttention, rest } = useMemo(() => {
    const all = documents ?? [];
    return {
      needsAttention: all.filter(
        (doc) => doc.status === 'EXPIRED' || doc.status === 'EXPIRING_SOON',
      ),
      rest: all.filter((doc) => doc.status === 'VALID' || doc.status === 'NO_EXPIRY'),
    };
  }, [documents]);

  return (
    <>
      <ScreenHeader
        title={t('documents.title')}
        showBack={false}
        subtitle={
          vehicle && vehicles.length > 1 ? `${vehicle.make} ${vehicle.model}` : undefined
        }
      />

      <Screen onRefresh={refetch} bottomInset={spacing.xxl}>
        <View style={styles.content}>
          {!vehicle && !isLoading ? (
            <EmptyState
              icon="car-sport-outline"
              title={t('vehicle.empty')}
              body={t('vehicle.emptyBody')}
              actionLabel={t('vehicle.add')}
              onAction={() => router.push('/vehicle/create')}
            />
          ) : null}

          {isLoading ? <SkeletonList count={3} /> : null}

          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {vehicle && !isLoading && !isError && (documents?.length ?? 0) === 0 ? (
            <EmptyState
              icon="folder-open-outline"
              title={t('documents.empty')}
              body={t('documents.emptyBody')}
              actionLabel={t('documents.upload')}
              onAction={() => router.push('/documents/upload')}
            />
          ) : null}

          {needsAttention.length > 0 ? (
            <View>
              <SectionHeader title={t('dashboard.attention')} />
              <View style={styles.list}>
                {needsAttention.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onPress={() => router.push(`/documents/${document.id}`)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {rest.length > 0 ? (
            <View>
              <SectionHeader title={t('documents.vault')} />
              <View style={styles.list}>
                {rest.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onPress={() => router.push(`/documents/${document.id}`)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {vehicle ? (
            <>
              <Button
                label={t('documents.upload')}
                icon="cloud-upload-outline"
                onPress={() => router.push('/documents/upload')}
              />

              {/* Documents live on the device until the API grows a module. */}
              <View style={styles.notice}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={14}
                  color={colors.textTertiary}
                />
                <View style={styles.noticeBody}>
                  <Text variant="caption" color={colors.textSecondary}>
                    {t('documents.storedLocally')}
                  </Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    {t('documents.storedLocallyBody')}
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {vehicle && vehicles.length > 1 ? (
            <VehicleScopeNotice vehicleName={`${vehicle.make} ${vehicle.model}`} />
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
  list: {
    gap: spacing.md,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  noticeBody: {
    flex: 1,
    gap: 2,
  },
});
