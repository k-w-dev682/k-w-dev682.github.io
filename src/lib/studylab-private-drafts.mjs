/** StudyLab 18.5: private synced notes, exercises and textbook course drafts. */
import {authorizedPrivateUser,PRIVATE_BOOK_BUCKET,newPrivateId} from './studylab-private-books.mjs';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const allowed=new Set(['course','lecture','exercise']);
function paths(uid,id){if(!UUID.test(uid)||!UUID.test(id))throw Error('Niepoprawny identyfikator szkicu.');return `${uid}/drafts/${id}.json`;}
export async function listPrivateDrafts(){
 const {sb,uid}=await authorizedPrivateUser(),bucket=sb.storage.from(PRIVATE_BOOK_BUCKET);
 const {data,error}=await bucket.list(`${uid}/drafts`,{limit:1000,sortBy:{column:'name',order:'asc'}});
 if(error)throw Error('Nie udało się pobrać szkiców z konta: '+error.message);
 const selected=(data||[]).filter(x=>x.name.endsWith('.json')&&UUID.test(x.name.slice(0,-5)));
 const output=[];
 for(let i=0;i<selected.length;i+=5){
  const batch=await Promise.all(selected.slice(i,i+5).map(async entry=>{
   try{
    const id=entry.name.slice(0,-5),{data,error}=await bucket.download(paths(uid,id));
    if(error)throw error;
    const draft=JSON.parse(await data.text());
    return draft.id===id&&allowed.has(draft.kind)?draft:null;
   }catch{return null;}
  }));output.push(...batch.filter(Boolean));
 }
 return output.sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0));
}
export async function putPrivateDraft(draft){
 const {sb,uid}=await authorizedPrivateUser();
 if(!draft||!allowed.has(draft.kind))throw Error('Nieznany rodzaj szkicu.');
 const id=UUID.test(draft.id||'')?draft.id:newPrivateId();
 const saved={...draft,id,legacyId:UUID.test(draft.id||'')?(draft.legacyId||undefined):String(draft.id||'').slice(0,120),updatedAt:Date.now()};
 // STUDYLAB-18-5-3-RAW-JSON: raw ArrayBuffer bypasses multipart/form-data encoding.
 // The previous Blob upload was wrapped as multipart by storage-js; proxies can reject such requests.
 const bytes=new TextEncoder().encode(JSON.stringify(saved));
 if(bytes.byteLength>5*1024*1024)throw Error('Szkic przekracza 5 MB. Zapisz go jako osobne części.');
 const {error}=await sb.storage.from(PRIVATE_BOOK_BUCKET).upload(paths(uid,id),bytes.buffer,{contentType:'application/json',upsert:true});
 if(error){
   const status=error.statusCode||error.status||'';
   const msg=error.message||String(error);
   throw Error(`Nie zapisano szkicu w Supabase Storage${status?' (HTTP '+status+')':''}: ${msg}`);
 }
 return saved;
}
export async function removePrivateDraft(id){
 const {sb,uid}=await authorizedPrivateUser();
 const {error}=await sb.storage.from(PRIVATE_BOOK_BUCKET).remove([paths(uid,id)]);
 if(error)throw Error('Nie udało się usunąć szkicu: '+error.message);
}
