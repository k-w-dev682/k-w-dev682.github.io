/** StudyLab 18.9: a conservative book -> chapters -> lessons index.
 * Source text is preserved verbatim per PDF page. No text is invented and this is NOT OCR/AI.
 * The resulting structure lives separately from lecture/exercise/user-note drafts.
 */
export const PDF_BOOK_COURSE_VERSION = 1;
const clean=s=>String(s||'').replace(/[\t\u00a0 ]+/g,' ').trim();
const dedupeTitle=s=>clean(s).replace(/^[\s.:–-]+|[\s.:–-]+$/g,'').slice(0,160);
const allowedTitle=s=>!!s&&s.length>=5&&s.length<140&&!/^[\d\s./–-]+$/.test(s)&&!/[=∑∫√<>]/.test(s);
export function headingType(line,{lineNo=0}={}){
 const s=clean(line);if(!allowedTitle(s)||lineNo>10)return null;
 if(/^(?:rozdzia[łl]|chapter|część|czesc|part)\s+(?:\d+|[ivxlcdm]+)\b/i.test(s))return 'chapter';
 if(/^\d{1,2}(?:\.\d{1,2}){1,3}\.?\s+\S.{3,}$/u.test(s))return 'lesson';
 if(lineNo<5&&/^\d{1,2}[.)]\s+[\p{Lu}][\p{L}\p{N}\s,;:()–-]{7,}$/u.test(s))return 'chapter';
 if(lineNo<4&&/^(?:wprowadzenie|podsumowanie|przedmowa|introduction|summary|conclusion)$/i.test(s))return 'lesson';
 return null;
}
function pageHeadings(text){
 return String(text||'').split(/\r?\n/).map(clean).filter(Boolean).slice(0,12)
   .map((title,i)=>({title,type:headingType(title,{lineNo:i})})).filter(x=>x.type);
}
export function buildPrivateBookCourse({bookId,subject,title,pages,createdAt=Date.now(),chunkSize=5}){
 if(!/^private:[0-9a-f-]{36}$/i.test(String(bookId)))throw Error('Nieprawidłowy identyfikator książki.');
 const source=(Array.isArray(pages)?pages:[]).filter(x=>Number.isSafeInteger(Number(x?.page))&&Number(x.page)>0)
   .map(x=>({page:Number(x.page),text:String(x.text||'')})).sort((a,b)=>a.page-b.page);
 const unique=source.filter((p,i)=>i===0||p.page!==source[i-1].page);
 if(!unique.some(p=>p.text.trim()))throw Error('PDF nie ma rozpoznawalnej warstwy tekstowej. Skan wymaga OCR.');
 if(unique.length>6000)throw Error('Dokument ma zbyt wiele stron do jednorazowej konwersji.');
 const chapters=[];let chapter=null;let lesson=null;
 const titleUsed=new Set();
 const addChapter=(name,at)=>{
   const label=dedupeTitle(name)||'Treść książki';
   chapter={id:`chapter-${chapters.length+1}`,title:label,sourcePage:at,lessons:[]};chapters.push(chapter);
   lesson=null;
 };
 const addLesson=(name,at)=>{
   if(!chapter)addChapter('Wprowadzenie',at);
   lesson={id:`lesson-${chapters.length}-${chapter.lessons.length+1}`,title:dedupeTitle(name)||`Strony od ${at}`,startPage:at,endPage:at};
   chapter.lessons.push(lesson);
 };
 let lastPage=0;
 for(const item of unique){
   const headings=pageHeadings(item.text);
   const newChapter=headings.find(h=>h.type==='chapter');
   const newLesson=headings.find(h=>h.type==='lesson');
   // Repeated page headers must not start new lessons on every page.
   const chapterKey=newChapter?.title.toLocaleLowerCase('pl');
   if(newChapter&&chapterKey!==chapter?.title.toLocaleLowerCase('pl')&&!titleUsed.has('c:'+chapterKey)){
     addChapter(newChapter.title,item.page);titleUsed.add('c:'+chapterKey);
   }
   const lessonKey=newLesson?.title.toLocaleLowerCase('pl');
   if(newLesson&&lessonKey!==lesson?.title.toLocaleLowerCase('pl')&&!titleUsed.has('l:'+lessonKey)){
     addLesson(newLesson.title,item.page);titleUsed.add('l:'+lessonKey);
   }
   if(!chapter)addChapter('Wprowadzenie',item.page);
   if(!lesson)addLesson(`Strony ${item.page}–${item.page}`,item.page);
   if(!newLesson&&item.page-lesson.startPage>=chunkSize&&/^Strony /u.test(lesson.title)){
     lesson.endPage=lastPage;
     lesson.title=`Strony ${lesson.startPage}–${lesson.endPage}`;
     addLesson(`Strony ${item.page}–${item.page}`,item.page);
   }
   if(item.page>lesson.endPage)lesson.endPage=item.page;
   lastPage=item.page;
 }
 for(const ch of chapters)for(const l of ch.lessons){
   if(/^Strony /u.test(l.title))l.title=`Strony ${l.startPage}–${l.endPage}`;
 }
 return {
   version:PDF_BOOK_COURSE_VERSION,kind:'book-course',bookId,subject:String(subject||'').slice(0,50),
   title:dedupeTitle(title)||'Podręcznik',createdAt,updatedAt:Date.now(),
   chapters,pages:unique,lessonCount:chapters.reduce((a,c)=>a+c.lessons.length,0),
   extractedPageCount:unique.filter(p=>p.text.trim()).length,
   method:'heuristic-text',warning:'Automatyczny podział na podstawie tekstu PDF. Nagłówki i wzory wymagają weryfikacji w oryginale. Bez AI/OCR.'
 };
}
export function lessonPages(course,lesson){
 if(!course||!lesson)return [];
 return (course.pages||[]).filter(p=>p.page>=lesson.startPage&&p.page<=lesson.endPage);
}
export function renameCoursePart(course,{chapterId,lessonId,title}){
 const next=structuredClone(course);const trimmed=dedupeTitle(title);
 if(!trimmed)throw Error('Tytuł nie może być pusty.');
 const ch=next.chapters?.find(c=>c.id===chapterId);if(!ch)throw Error('Nie znaleziono rozdziału.');
 if(lessonId){const lesson=ch.lessons.find(l=>l.id===lessonId);if(!lesson)throw Error('Nie znaleziono lekcji.');lesson.title=trimmed;}
 else ch.title=trimmed;
 next.updatedAt=Date.now();return next;
}
