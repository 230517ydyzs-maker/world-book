const DB_NAME = 'story-generator';
const DB_VERSION = 1;
const STORY_STORE = 'stories';

export interface StoryRecord<T> {
  id: string;
  value: T;
  updatedAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORY_STORE)) {
        db.createObjectStore(STORY_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORY_STORE, mode);
        const store = tx.objectStore(STORY_STORE);
        const request = run(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error);
      })
  );
}

export async function putRecord<T>(record: StoryRecord<T>): Promise<void> {
  await transaction('readwrite', (store) => store.put(record));
}

export function getRecord<T>(id: string): Promise<StoryRecord<T> | undefined> {
  return transaction('readonly', (store) => store.get(id));
}

export function getAllRecords<T>(): Promise<StoryRecord<T>[]> {
  return transaction('readonly', (store) => store.getAll());
}

export async function clearRecords(): Promise<void> {
  await transaction('readwrite', (store) => store.clear());
}
