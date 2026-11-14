/**
 * Photo intake: gallery (PHPicker – no full-library permission needed) or clipboard.
 * Photos are copied into the app's document directory so projects survive restarts.
 */
import * as Clipboard from 'expo-clipboard';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { newId } from '../model/factory';
import type { PhotoRef } from '../model/types';
import { putWebPhoto, resolveWebPhoto } from './webPhotos';

/** URI that Skia / <img> can load: file URIs on device, object URLs for web-stored photos. */
export async function resolvePhotoUri(uri: string): Promise<string | null> {
  return Platform.OS === 'web' ? resolveWebPhoto(uri) : uri;
}

async function storeWeb(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return putWebPhoto(newId(), blob);
}

function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function freshPhoto(uri: string, width: number, height: number, credit?: string): PhotoRef {
  return { uri, width, height, zoom: 1, cx: 0.5, cy: 0.4, credit, fade: 1 };
}

export async function pickPhotoFromLibrary(): Promise<PhotoRef | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
    exif: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  if (Platform.OS === 'web') return freshPhoto(await storeWeb(a.uri), a.width, a.height);
  const ext = (a.fileName?.split('.').pop() || a.uri.split('.').pop() || 'jpg').toLowerCase();
  const src = new File(a.uri);
  const dest = new File(photosDir(), `${newId()}.${ext.length <= 4 ? ext : 'jpg'}`);
  src.copySync(dest);
  return freshPhoto(dest.uri, a.width, a.height);
}

export async function clipboardHasImage(): Promise<boolean> {
  try {
    return await Clipboard.hasImageAsync();
  } catch {
    return false;
  }
}

export async function pastePhotoFromClipboard(): Promise<PhotoRef | null> {
  const img = await Clipboard.getImageAsync({ format: 'png' });
  if (!img?.data) return null;
  if (Platform.OS === 'web') return freshPhoto(await storeWeb(img.data), img.size.width, img.size.height);
  const base64 = img.data.replace(/^data:image\/\w+;base64,/, '');
  const dest = new File(photosDir(), `${newId()}.png`);
  dest.create({ overwrite: true });
  dest.write(base64, { encoding: 'base64' });
  return freshPhoto(dest.uri, img.size.width, img.size.height);
}

/** Remove photo files that no project references any more. */
export function prunePhotos(referenced: Set<string>) {
  if (Platform.OS === 'web') return;
  try {
    for (const entry of photosDir().list()) {
      if (entry instanceof File && !referenced.has(entry.uri)) entry.delete();
    }
  } catch {
    // Cleanup is best-effort.
  }
}
