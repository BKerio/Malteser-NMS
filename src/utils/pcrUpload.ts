import * as ImageManipulator from 'expo-image-manipulator';
import { getPcrFileKind } from '@/utils/pcrFiles';

const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.55;

export type PcrFileInput = {
  uri: string;
  name: string;
  mimeType: string;
};

/**
 * Shrink camera/gallery photos before PCR upload to avoid HTTP 413.
 * PDFs/DOCX are returned unchanged.
 */
export async function preparePcrUploadFile(file: PcrFileInput): Promise<PcrFileInput> {
  const kind = getPcrFileKind(file.mimeType);
  if (kind !== 'image') return file;

  const result = await ImageManipulator.manipulateAsync(
    file.uri,
    [{ resize: { width: MAX_IMAGE_EDGE } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'pcr';
  return {
    uri: result.uri,
    name: `${baseName}.jpg`,
    mimeType: 'image/jpeg',
  };
}
