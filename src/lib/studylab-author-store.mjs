/** StudyLab 18.5 — user-scoped private drafts in Supabase, legacy browser drafts preserved. */
import {listPrivateDrafts,putPrivateDraft,removePrivateDraft} from './studylab-private-drafts.mjs';
const NAME='studylab-author-drafts-v1',STORE='drafts';
let dbPromise;
function db(){
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
  const q=indexedDB.open(NAME,1);
  q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE,{keyPath:'id'});};
  q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
 }).catch(err=>{dbPromise=null;throw err;});
 return dbPromise;
}
async function request(type,cb){
 const database=await db();
 return new Promise((resolve,reject)=>{
  const tx=database.transaction(STORE,type),store=tx.objectStore(STORE);let output;
  try{const req=cb(store);req.onsuccess=()=>{output=req.result};req.onerror=()=>reject(req.error);}catch(e){reject(e);return;}
  tx.oncomplete=()=>resolve(output);tx.onerror=()=>reject(tx.error);
 });
}
export const listLegacyAuthorDrafts=async()=>(await request('readonly',s=>s.getAll())).sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0));
export const listAuthorDrafts=listPrivateDrafts;
export const saveAuthorDraft=putPrivateDraft;
// STUDYLAB-18-5-2: explicit emergency browser-only backup, never mislabelled as cloud sync.
export const saveEmergencyAuthorDraft=async draft=>{
 if(!draft||!['lecture','exercise','course'].includes(draft.kind))throw Error('Nieprawidłowy szkic.');
 if(!draft.id)throw Error('Brak identyfikatora szkicu.');
 const saved={...draft,updatedAt:Date.now(),emergencyLocal:true};
 await request('readwrite',s=>s.put(saved));
 return saved;
};
export const deleteAuthorDraft=removePrivateDraft;
