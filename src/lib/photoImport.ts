import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Longest edge of the uploaded image. Recipe text stays legible to the vision
 * model well below original camera resolution, and a 12MP iPhone shot is ~4000px
 * — sending that raw is several megabytes of base64 over cellular for no gain.
 */
const MAX_EDGE_PX = 1600;

/** JPEG quality. 0.8 is visually clean on text while roughly halving the payload. */
const JPEG_QUALITY = 0.8;

/**
 * Server's decoded-size cap is 5MB. Base64 inflates by 4/3, so we check the
 * encoded length against the same effective budget before spending a request.
 */
const MAX_DECODED_BYTES = 5 * 1024 * 1024;

export type PhotoSource = 'camera' | 'library';

export type PhotoResult =
  | { status: 'ok'; base64: string }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/**
 * Prompts for the permission this source needs. Returns false (after showing a
 * Settings alert) when the user has denied it and iOS will no longer re-prompt.
 */
async function ensurePermission(source: PhotoSource): Promise<boolean> {
  const result =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (result.granted) return true;

  // `canAskAgain: false` means the system dialog will never show again — the
  // only path forward is Settings, so say so rather than silently failing.
  const body =
    source === 'camera'
      ? 'Mesa needs camera access to photograph a recipe.'
      : 'Mesa needs photo access to import a recipe from your library.';

  Alert.alert(
    source === 'camera' ? 'Camera access needed' : 'Photo access needed',
    result.canAskAgain ? body : `${body}\n\nYou can turn it on in Settings.`,
    result.canAskAgain
      ? [{ text: 'OK' }]
      : [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ],
  );

  return false;
}

/**
 * Downscale + transcode to JPEG, then base64-encode.
 *
 * The transcode is load-bearing, not an optimization: iPhones shoot HEIC by
 * default and the Edge Function rejects it outright (Claude vision accepts only
 * JPEG/PNG/WebP/GIF). Saving through SaveFormat.JPEG normalizes every input —
 * HEIC, PNG, whatever the library hands back — to a format the server accepts.
 */
async function processImage(uri: string, width: number, height: number): Promise<string | null> {
  const context = ImageManipulator.manipulate(uri);

  // Resize only when the image exceeds the cap, and constrain the longer edge
  // so the aspect ratio is preserved (the other dimension is derived).
  const longestEdge = Math.max(width, height);
  if (longestEdge > MAX_EDGE_PX) {
    context.resize(width >= height ? { width: MAX_EDGE_PX } : { height: MAX_EDGE_PX });
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });

  return saved.base64 ?? null;
}

/** Decoded byte length of a base64 string, without allocating the buffer. */
function base64ByteLength(b64: string): number {
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/**
 * Full capture path: permission → picker → downscale/transcode → base64.
 * Every failure is returned as a user-facing message; nothing throws.
 */
export async function captureRecipePhoto(source: PhotoSource): Promise<PhotoResult> {
  try {
    const permitted = await ensurePermission(source);
    if (!permitted) return { status: 'cancelled' };

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      // Full quality here — compression happens once, during the resize pass
      // below, so we don't stack two lossy JPEG encodes on the same pixels.
      quality: 1,
      exif: false,
    };

    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (picked.canceled) return { status: 'cancelled' };

    const asset = picked.assets?.[0];
    if (!asset?.uri) {
      return { status: 'error', message: "We couldn't read that photo. Try taking it again." };
    }

    const base64 = await processImage(asset.uri, asset.width, asset.height);
    if (!base64) {
      return { status: 'error', message: "We couldn't process that photo. Try another one." };
    }

    // Belt and braces: the resize should always land well under the cap, but a
    // pathologically large source shouldn't burn a round trip to find out.
    if (base64ByteLength(base64) > MAX_DECODED_BYTES) {
      return { status: 'error', message: 'That photo is too large. Try a smaller one.' };
    }

    return { status: 'ok', base64 };
  } catch (e) {
    console.error('[photoImport] capture failed', e);
    return { status: 'error', message: "We couldn't process that photo. Try another one." };
  }
}
