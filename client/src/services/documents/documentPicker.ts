import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/**
 * Getting a file onto a document record — camera, photo library or file browser.
 *
 * Every path returns the same {@link PickedFile}, which is the shape an upload
 * (and, later, an OCR pass) consumes. Text extraction would slot in behind
 * `PickedFile` without the upload screen changing: it already has the URI and
 * the MIME type an OCR service needs.
 */

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
}

/** Accepted upload types: images and PDFs. */
const ACCEPTED_TYPES = ['image/*', 'application/pdf'];

function inferMimeType(uri: string, fallback = 'application/octet-stream'): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'heic':
      return 'image/heic';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    default:
      return fallback;
  }
}

function fileNameFrom(uri: string, fallback: string): string {
  const name = uri.split('/').pop();
  return name && name.length > 0 ? decodeURIComponent(name) : fallback;
}

/**
 * Picker results do not always carry a size, and the local mock needs one for
 * the card, so it is read back off disk when missing.
 */
async function resolveSize(uri: string, known?: number | null): Promise<number | null> {
  if (typeof known === 'number') return known;
  try {
    const file = new File(uri);
    return file.exists ? file.size : null;
  } catch {
    // An unreadable or non-file URI simply has no size to show.
    return null;
  }
}

export const documentPicker = {
  /** Opens the system file browser, filtered to images and PDFs. */
  async pickFile(): Promise<PickedFile | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset) return null;

    return {
      uri: asset.uri,
      name: asset.name ?? fileNameFrom(asset.uri, 'document'),
      mimeType: asset.mimeType ?? inferMimeType(asset.uri),
      sizeBytes: await resolveSize(asset.uri, asset.size),
    };
  },

  async pickImage(): Promise<PickedFile | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset) return null;

    return {
      uri: asset.uri,
      name: asset.fileName ?? fileNameFrom(asset.uri, 'photo.jpg'),
      mimeType: asset.mimeType ?? inferMimeType(asset.uri, 'image/jpeg'),
      sizeBytes: await resolveSize(asset.uri, asset.fileSize),
    };
  },

  async takePhoto(): Promise<PickedFile | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset) return null;

    return {
      uri: asset.uri,
      name: asset.fileName ?? fileNameFrom(asset.uri, 'scan.jpg'),
      mimeType: asset.mimeType ?? inferMimeType(asset.uri, 'image/jpeg'),
      sizeBytes: await resolveSize(asset.uri, asset.fileSize),
    };
  },
};
