import { Text } from '@/components/ui/Text';
import { documentPicker, type PickedFile } from '@/services/documents/documentPicker';
import { colors, radius, spacing } from '@/theme';
import { fileKindLabel, formatFileSize, isImage } from '@/utils/documents';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, View } from 'react-native';

interface FilePickerProps {
  file: PickedFile | null;
  onChange: (file: PickedFile | null) => void;
  error?: string;
}

type Source = 'camera' | 'library' | 'files';

/**
 * Camera, photo library or file browser — whichever the document happens to be.
 *
 * The chosen file is held in component state and only attached to the record on
 * save, so backing out of the form leaves nothing behind.
 */
export function FilePicker({ file, onChange, error }: FilePickerProps) {
  const { t } = useTranslation();

  const pick = async (source: Source): Promise<void> => {
    const picked =
      source === 'camera'
        ? await documentPicker.takePhoto()
        : source === 'library'
          ? await documentPicker.pickImage()
          : await documentPicker.pickFile();

    // Null means the user cancelled or declined the permission; keep what we had.
    if (picked) onChange(picked);
  };

  const sources: { key: Source; label: string; icon: keyof typeof Ionicons.glyphMap }[] =
    [
      { key: 'camera', label: t('documents.takePhoto'), icon: 'camera-outline' },
      { key: 'library', label: t('documents.pickImage'), icon: 'image-outline' },
      { key: 'files', label: t('documents.pickDocument'), icon: 'document-outline' },
    ];

  return (
    <View style={styles.container}>
      <Text variant="caption" color={colors.textSecondary}>
        {t('documents.file').toUpperCase()}
      </Text>

      {file ? (
        <View style={styles.preview}>
          {isImage(file.mimeType) ? (
            <Image
              source={{ uri: file.uri }}
              style={styles.thumbnail}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailFallback]}>
              <Text variant="caption" color={colors.primary}>
                {fileKindLabel(file.mimeType)}
              </Text>
            </View>
          )}

          <View style={styles.previewBody}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {file.name}
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              {[fileKindLabel(file.mimeType), formatFileSize(file.sizeBytes)]
                .filter(Boolean)
                .join(' • ')}
            </Text>
          </View>

          <Pressable
            onPress={() => onChange(null)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
            style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sources}>
        {sources.map((source) => (
          <Pressable
            key={source.key}
            onPress={() => void pick(source.key)}
            accessibilityRole="button"
            accessibilityLabel={source.label}
            style={({ pressed }) => [
              styles.source,
              Boolean(error) && styles.errored,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name={source.icon} size={19} color={colors.primary} />
            <Text
              variant="caption"
              color={colors.textSecondary}
              numberOfLines={2}
              align="center"
            >
              {source.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.primary} />
          <Text variant="caption" color={colors.primary}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.cardElevated,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
  previewBody: {
    flex: 1,
    gap: 2,
  },
  remove: {
    padding: spacing.sm,
  },
  sources: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  source: {
    flex: 1,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  errored: {
    borderColor: colors.primary,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
