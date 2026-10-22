/** Per-user book courses stored under <uid>/drafts/books/<book-UUID>.json.
 * This path is covered by existing StudyLab 18.5 RLS (drafts/%) and never
 * enumerated by the general drafts editor. No new bucket, SQL or secrets.
 */
import {authorizedPrivateUser,PRIVATE_BOOK_BUCKET,isPrivateBookId} from './studylab-private-books.mjs';
import {PDF_BOOK_COURSE_VERSION} from './pdf-book-course.mjs';
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const MAX_JSON_BYTES=45*1024*1024;
export function bookCoursePath(uid,bookId){
 if(!ID.test(uid)||!isPrivateBookId(bookId))throw Error('Nieprawidłowy identyfikator książki lub konta.');
 return `${uid}/drafts/books/${bookId.slice(8)}.json`;
}
function validate(course,bookId){
 if(!course||course.kind!=='book-course'||course.version!==PDF_BOOK_COURSE_VERSION||course.bookId!==bookId||!Array.isArray(course.chapters)||!Array.isArray(course.pages))throw Error('Nieprawidłowa struktura prywatnych lekcji książki.');
 return course;
}
export async function savePrivateBookCourse(course){
 const {sb,uid}=await authorizedPrivateUser();
 validate(course,course?.bookId);
 const path=bookCoursePath(uid,course.bookId);
 const bytes=new TextEncoder().encode(JSON.stringify(course));
 if(bytes.byteLength>MAX_JSON_BYTES)throw Error('Tekst tej książki jest zbyt duży do zapisania jako jeden kurs (45 MB). Oryginalny PDF pozostaje dostępny.');
 const {error}=await sb.storage.from(PRIVATE_BOOK_BUCKET).upload(path,bytes,{contentType:'application/json',upsert:true});
 if(error)throw Error('Nie udało się zsynchronizować lekcji książki z Supabase: '+error.message);
 return course;
}
export async function getPrivateBookCourse(bookId){
 const {sb,uid}=await authorizedPrivateUser(),{data,error}=await sb.storage.from(PRIVATE_BOOK_BUCKET).download(bookCoursePath(uid,bookId));
 if(error){if(error.status===404||error.statusCode==='404')return null;throw Error('Nie udało się odczytać lekcji książki: '+error.message);}
 return validate(JSON.parse(await data.text()),bookId);
}
export async function listPrivateBookCourses(){
 const {sb,uid}=await authorizedPrivateUser(),bucket=sb.storage.from(PRIVATE_BOOK_BUCKET);
 const {data,error}=await bucket.list(`${uid}/drafts/books`,{limit:1000,sortBy:{column:'name',order:'asc'}});
 if(error)throw Error('Nie udało się pobrać spisu lekcji książek: '+error.message);
 const entries=(data||[]).filter(f=>ID.test(f.name.replace(/\.json$/,''))&&f.name.endsWith('.json'));
 const courses=[];
 for(let i=0;i<entries.length;i+=4){
   const batch=await Promise.all(entries.slice(i,i+4).map(async f=>{
     const bookId=`private:${f.name.slice(0,-5)}`;
     try{const {data,error}=await bucket.download(bookCoursePath(uid,bookId));if(error)return null;
       return validate(JSON.parse(await data.text()),bookId);
     }catch{return null;}
   }));courses.push(...batch.filter(Boolean));
 }
 return courses;
}
export async function deletePrivateBookCourse(bookId){
 const {sb,uid}=await authorizedPrivateUser();
 const {error}=await sb.storage.from(PRIVATE_BOOK_BUCKET).remove([bookCoursePath(uid,bookId)]);
 if(error)throw Error('Nie można usunąć lekcji książki: '+error.message);
}
