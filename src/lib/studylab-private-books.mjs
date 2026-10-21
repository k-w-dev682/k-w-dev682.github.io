/** StudyLab 18.5: cloud-private library for every signed-in user.
 * Privacy boundary: Supabase private bucket + per-owner storage.objects RLS.
 * No service-role token, GitHub token, or private user files are shipped with the site.
 */
import {createClient} from '@supabase/supabase-js';
export const PRIVATE_BOOK_BUCKET='studylab-private-books';
export const MAX_PRIVATE_PDF_BYTES=50*1024*1024;
const URL=(import.meta.env.PUBLIC_SUPABASE_URL||'').trim();
const KEY=(import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY||'').trim();
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
let client;
export const isPrivateBookId=id=>typeof id==='string'&&id.startsWith('private:')&&UUID.test(id.slice(8));
export const newPrivateId=()=>{if(typeof crypto==='undefined'||!crypto.randomUUID)throw Error('Ta przeglądarka nie obsługuje bezpiecznych identyfikatorów UUID.');return crypto.randomUUID();};
export function privateBookPaths(uid,id){
 if(!UUID.test(uid)||!UUID.test(id))throw Error('Nieprawidłowe UUID dokumentu lub użytkownika.');
 return {pdf:`${uid}/${id}.pdf`,json:`${uid}/${id}.json`};
}
function supabase(){
 if(!/^https:\/\/[\w-]+\.supabase\.co\/?$/.test(URL)||KEY.length<15)throw Error('Brak PUBLIC_SUPABASE_URL lub PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
 if(!client)client=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return client;
}
// STUDYLAB-18-5-1: a single shared Supabase auth client for the private library and publisher.
export const privateBooksAuthClient=()=>supabase();
export async function authorizedPrivateUser(){
 const sb=supabase(),{data,error}=await sb.auth.getUser();
 if(error||!data?.user?.id||!UUID.test(data.user.id))throw Error('Zaloguj się w Centrum nauki → Synchronizacja, aby otworzyć prywatną bibliotekę.');
 return {sb,uid:data.user.id};
}
export async function privateBooksAccess(){
 try{const {uid}=await authorizedPrivateUser();return {allowed:true,uid,error:''};}
 catch(e){return {allowed:false,uid:null,error:e.message||String(e)};}
}
function docFromMetadata(meta,id){
 if(!meta||meta.id!==id||!['book','lecture'].includes(meta.kind))throw Error('Uszkodzone metadane PDF.');
 return {...meta,id:`private:${id}`,isCloudPrivate:true};
}
async function loadJson(bucket,path){
 const {data,error}=await bucket.download(path);
 if(error)throw Error('Nie można odczytać prywatnych metadanych: '+error.message);
 return JSON.parse(await data.text());
}
export async function listPrivateDocuments(){
 const {sb,uid}=await authorizedPrivateUser(),bucket=sb.storage.from(PRIVATE_BOOK_BUCKET);
 const {data,error}=await bucket.list(uid,{limit:1000,sortBy:{column:'name',order:'asc'}});
 if(error)throw Error('Nie udało się odczytać biblioteki Supabase. Uruchom SQL z aktualizacji 18.5: '+error.message);
 const entries=(data||[]).filter(x=>UUID.test(x.name.slice(0,-5))&&x.name.endsWith('.json'));
 const docs=[];
 for(let i=0;i<entries.length;i+=5){
  const batch=await Promise.all(entries.slice(i,i+5).map(async ({name})=>{
   const id=name.slice(0,-5);
   try{return docFromMetadata(await loadJson(bucket,`${uid}/${name}`),id);}catch{return null;}
  }));
  docs.push(...batch.filter(Boolean));
 }
 return docs.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
}
export async function listPrivateBooks(){return (await listPrivateDocuments()).filter(doc=>doc.kind==='book');}
export async function putPrivateDocument(doc){
 const {sb,uid}=await authorizedPrivateUser();
 if(!doc||!['book','lecture'].includes(doc.kind))throw Error('Obsługiwane są książki oraz wykłady/notatki PDF.');
 if(!(doc.blob instanceof Blob))throw Error('Wybierz prawidłowy plik PDF.');
 if(!doc.blob.size||doc.blob.size>MAX_PRIVATE_PDF_BYTES)throw Error('Plik PDF musi mieć od 1 bajtu do 50 MB.');
 const header=new TextDecoder().decode(await doc.blob.slice(0,5).arrayBuffer());
 if(header!=='%PDF-')throw Error('Plik nie jest poprawnym PDF (brak nagłówka %PDF-).');
 const id=UUID.test(doc.id||'')?doc.id:newPrivateId();
 const paths=privateBookPaths(uid,id),bucket=sb.storage.from(PRIVATE_BOOK_BUCKET);
 const meta={id,kind:doc.kind,title:String(doc.title||'Dokument').trim().slice(0,160),subject:String(doc.subject||'').slice(0,50),
  filename:String(doc.filename||'dokument.pdf').slice(0,250),createdAt:doc.createdAt||Date.now(),
  legacyId:typeof doc.id==='string'&&!UUID.test(doc.id)?doc.id.slice(0,120):(doc.legacyId||undefined),
  size:doc.blob.size,pageCount:Number(doc.pageCount)||0,extractedCharacters:Number(doc.extractedCharacters)||0,
  extractionError:String(doc.extractionError||'').slice(0,500),pages:Array.isArray(doc.pages)?doc.pages:[]};
 const {error:uploadError}=await bucket.upload(paths.pdf,doc.blob,{contentType:'application/pdf',upsert:false});
 if(uploadError)throw Error('Nie można wysłać PDF (sprawdź reguły RLS i limit Storage): '+uploadError.message);
 const json=new Blob([JSON.stringify(meta)],{type:'application/json'});
 if(json.size>MAX_PRIVATE_PDF_BYTES){await bucket.remove([paths.pdf]);throw Error('Metadane PDF przekraczają limit 50 MB.');}
 const {error:metaError}=await bucket.upload(paths.json,json,{contentType:'application/json',upsert:false});
 if(metaError){await bucket.remove([paths.pdf]);throw Error('Nie zapisano metadanych, PDF cofnięto: '+metaError.message);}
 return `private:${id}`;
}
export const putPrivateBook=putPrivateDocument; // Compatibility with version 18.4.
export async function getPrivateBook(id){
 if(!isPrivateBookId(id))throw Error('Nieprawidłowy identyfikator PDF.');
 const {sb,uid}=await authorizedPrivateUser(),raw=id.slice(8),paths=privateBookPaths(uid,raw),bucket=sb.storage.from(PRIVATE_BOOK_BUCKET);
 const [meta,pdf]=await Promise.all([loadJson(bucket,paths.json),bucket.download(paths.pdf)]);
 if(pdf.error)throw Error('Nie można pobrać PDF: '+pdf.error.message);
 return {...docFromMetadata(meta,raw),blob:pdf.data};
}
export async function deletePrivateBook(id){
 if(!isPrivateBookId(id))throw Error('Nieprawidłowy identyfikator PDF.');
 const {sb,uid}=await authorizedPrivateUser(),paths=privateBookPaths(uid,id.slice(8));
 const {error}=await sb.storage.from(PRIVATE_BOOK_BUCKET).remove([paths.pdf,paths.json]);
 if(error)throw Error('Nie udało się usunąć PDF: '+error.message);
}
