// Local PDF library. Blobs and extracted pages never leave the user's browser.
const DB_NAME = 'studylab-books-v1';
const STORE = 'documents';
let handle;
export function openLibrary() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Przeglądarka nie udostępnia IndexedDB.'));
  if (!handle) handle = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('subject', 'subject');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Nie udało się otworzyć biblioteki.'));
  }).catch(err => { handle = null; throw err; });
  return handle;
}
async function transaction(mode, fn) {
  const db = await openLibrary();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error || req?.error || new Error('Operacja na bibliotece nie powiodła się.'));
    tx.onabort = () => reject(tx.error || new Error('Operacja została przerwana.'));
  });
}
export const listDocuments = () => transaction('readonly', store => store.getAll());
export const getDocument = id => transaction('readonly', store => store.get(id));
export const putDocument = doc => transaction('readwrite', store => store.put(doc));
export const deleteDocument = id => transaction('readwrite', store => store.delete(id));
export const makeDocumentId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pdf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const SUBJECTS_MATERIALS = Object.freeze([
  { id: 'cpp', label: 'Programowanie C++', slug: 'programowanie' },
  { id: 'math1', label: 'Matematyka I', slug: 'matematyka-i' },
  { id: 'math2', label: 'Matematyka II', slug: 'matematyka-ii' },
  { id: 'physics', label: 'Fizyka dla informatyków', slug: 'fizyka' },
  { id: 'electronics', label: 'Podstawy elektroniki', slug: 'elektronika' },
  { id: 'ask', label: 'Architektura systemów komputerowych', slug: 'architektura' },
]);
