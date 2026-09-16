import { ScreenHeader } from '@/components/brand';
import { FilePicker } from '@/components/document';
import {
  DateField,
  FormScreen,
  FormSection,
  SelectField,
  TextField,
} from '@/components/form';
import { EmptyState, Text, useErrorMessage } from '@/components/ui';
import { useCreateDocument, useSelectedVehicle } from '@/hooks';
import type { PickedFile } from '@/services/documents/documentPicker';
import { colors, spacing } from '@/theme';
import { toApiDate } from '@/utils/date';
import { useDocumentTypeOptions } from '@/utils/options';
import {
  documentSchema,
  type DocumentFormInput,
  type DocumentFormOutput,
} from '@/validation/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Uploading a document.
 *
 * The file is picked first and described second, which matches how people think
 * about it ("here is my insurance policy" then "it expires in October"). Zod
 * validates the description; the file is validated separately because it is not
 * a form field the resolver can see.
 */
export default function UploadDocumentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const types = useDocumentTypeOptions();
  const toMessage = useErrorMessage();

  const { vehicle, vehicleId } = useSelectedVehicle();
  const createDocument = useCreateDocument(vehicleId ?? '');

  const [file, setFile] = useState<PickedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(() => documentSchema(t), [t]);
  const { control, handleSubmit, formState } = useForm<
    DocumentFormInput,
    unknown,
    DocumentFormOutput
  >({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      type: undefined,
      title: '',
      issuedAt: null,
      expiresAt: null,
      notes: '',
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);

    if (!file) {
      setFileError(t('documents.fileRequired'));
      return;
    }
    setFileError(null);

    try {
      await createDocument.mutateAsync({
        type: values.type,
        title: values.title,
        fileUri: file.uri,
        mimeType: file.mimeType,
        fileSizeBytes: file.sizeBytes,
        issuedAt: values.issuedAt ? toApiDate(values.issuedAt) : null,
        expiresAt: values.expiresAt ? toApiDate(values.expiresAt) : null,
        notes: values.notes ?? null,
      });
      router.back();
    } catch (error) {
      setSubmitError(toMessage(error));
    }
  });

  if (!vehicle) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t('documents.uploadTitle')} />
        <EmptyState
          icon="car-sport-outline"
          title={t('vehicle.empty')}
          body={t('vehicle.emptyBody')}
          actionLabel={t('vehicle.add')}
          onAction={() => router.replace('/vehicle/create')}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('documents.uploadTitle')}
        subtitle={`${vehicle.make} ${vehicle.model}`}
      />

      <FormScreen
        submitLabel={t('common.save')}
        onSubmit={() => void submit()}
        isSubmitting={formState.isSubmitting}
      >
        <FilePicker file={file} onChange={setFile} error={fileError ?? undefined} />

        <FormSection>
          <SelectField
            control={control}
            name="type"
            label={t('documents.type')}
            options={types}
            placeholder={t('common.select')}
          />
          <TextField
            control={control}
            name="title"
            label={t('documents.documentTitle')}
            placeholder={t('documents.documentTitlePlaceholder')}
          />
          <DateField
            control={control}
            name="issuedAt"
            label={t('documents.issuedAt')}
            optional
            clearable
          />
          <DateField
            control={control}
            name="expiresAt"
            label={t('documents.expiresAt')}
            optional
            clearable
          />
          <TextField
            control={control}
            name="notes"
            label={t('documents.notes')}
            multiline
            optional
          />
        </FormSection>

        {submitError ? (
          <View style={styles.errorBox}>
            <Text variant="secondary" color={colors.primary}>
              {submitError}
            </Text>
          </View>
        ) : null}
      </FormScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    padding: spacing.lg,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
});
