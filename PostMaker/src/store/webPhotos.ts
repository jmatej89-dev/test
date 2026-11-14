/**
 * Web-only photo storage (IndexedDB). On the web there is no app sandbox file system, so picked
 * photos are stored as blobs and referenced from projects as `idb:<id>`.
 */
const DB = 'postmaker-photos';
const STORE = 'photos';
const urls = new Map<string, string>();

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putWebPhoto(id: string, blob: Blob): Promise<string> {
  const uri = `idb:${id}`;
  urls.set(uri, URL.createObjectURL(blob));
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Storage may be unavailable (private mode) – the photo still works for this session.
  }
  return uri;
}

/** idb:<id> → object URL (null when the photo is gone). Other URIs pass through. */
export async function resolveWebPhoto(uri: string): Promise<string | null> {
  if (!uri.startsWith('idb:')) return uri;
  const cached = urls.get(uri);
  if (cached) return cached;
  try {
    const db = await open();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(uri.slice(4));
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urls.set(uri, url);
    return url;
  } catch {
    return null;
  }
}
