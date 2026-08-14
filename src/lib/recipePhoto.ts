import { Directory, File, Paths } from 'expo-file-system';

/**
 * User-added recipe photos live in the document directory (not cache) so iOS
 * can't reclaim them under storage pressure — losing a photo the user chose
 * would look like data loss, whereas a re-downloadable import image would not.
 */
const PHOTO_DIR_NAME = 'recipe-photos';

function photoDir(): Directory {
  const dir = new Directory(Paths.document, PHOTO_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/**
 * True for URIs this module owns. Import images are remote https URLs, so this
 * is what keeps cleanup from trying to unlink something it didn't create.
 */
export function isLocalRecipePhoto(uri: string | null | undefined): boolean {
  return typeof uri === 'string' && uri.includes(`/${PHOTO_DIR_NAME}/`) && uri.startsWith('file://');
}

/** Delete a local photo. Safe to call with a remote URL, null, or a missing file. */
export function deleteRecipePhotoFile(uri: string | null | undefined): void {
  if (!isLocalRecipePhoto(uri)) return;
  try {
    const file = new File(uri as string);
    if (file.exists) file.delete();
  } catch (e) {
    // A leaked file wastes a few hundred KB; failing the user's action over it
    // would be worse. Log and move on.
    console.error('[recipePhoto] failed to delete', uri, e);
  }
}

/**
 * Move a processed JPEG into durable storage and return its `file://` URI.
 *
 * The filename carries a timestamp rather than being just the recipe id:
 * React Native's Image component caches by URI, so overwriting the same path
 * would keep showing the old photo until the app restarts. A fresh name per
 * save sidesteps the cache entirely — which is why deleting the previous file
 * is required rather than incidental.
 */
export function saveRecipePhoto(
  recipeId: string,
  processedUri: string,
  previousImageUrl: string | null,
): string {
  const dir = photoDir();
  const destination = new File(dir, `${recipeId}-${Date.now()}.jpg`);

  const source = new File(processedUri);
  source.move(destination);

  // Only after the new file is safely in place, so a failed move can't leave
  // the recipe with no photo at all.
  deleteRecipePhotoFile(previousImageUrl);

  return destination.uri;
}
