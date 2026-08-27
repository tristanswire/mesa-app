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

/**
 * Delete photos left behind by recipes that no longer exist — a delete that
 * failed partway, or a database restored without its files.
 *
 * Filenames are `${recipeId}-${timestamp}.jpg` and a recipe id contains dashes
 * of its own, so ownership is decided by prefix-matching the live id set rather
 * than by splitting the name apart. A file is removed only when no live recipe
 * claims it; a photo belonging to a real recipe is never touched.
 *
 * Returns the number of files removed. Never throws — a failed sweep costs a
 * few stale kilobytes, which is not worth interrupting a launch over.
 */
export function sweepOrphanPhotos(liveRecipeIds: ReadonlySet<string>): number {
  let removed = 0;

  try {
    // Deliberately not photoDir(): the sweep should never create the directory
    // it is cleaning.
    const dir = new Directory(Paths.document, PHOTO_DIR_NAME);
    if (!dir.exists) return 0;

    for (const entry of dir.list()) {
      if (!(entry instanceof File)) continue;
      // The same guard the single-file delete uses, so this can only ever
      // unlink something inside the directory this module owns.
      if (!isLocalRecipePhoto(entry.uri)) continue;

      let owned = false;
      for (const id of liveRecipeIds) {
        if (entry.name.startsWith(`${id}-`)) {
          owned = true;
          break;
        }
      }
      if (owned) continue;

      try {
        entry.delete();
        removed += 1;
      } catch (e) {
        console.error('[recipePhoto] failed to remove orphan', entry.uri, e);
      }
    }
  } catch (e) {
    console.error('[recipePhoto] orphan sweep failed', e);
  }

  return removed;
}
