// Shared constants for StudyLab authoring. All credentials stay on the local Node server.
export const PUBLISH_ENDPOINT = 'http://127.0.0.1:4318';
export const AUTHORING_KINDS = Object.freeze([
  {id:'lecture',label:'Wykład / notatka'},
  {id:'exercise',label:'Ćwiczenia / zadania'},
  {id:'course',label:'Kurs z podręcznika'}
]);
export function safeSlug(value) {
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70) || 'material';
}
export function makeCourse({title,subject,sourceTitle}) {
  return {id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`course-${Date.now()}`,kind:'course',title:String(title).slice(0,160),subject,sourceTitle:String(sourceTitle||'').slice(0,160),createdAt:Date.now(),chapters:[]};
}
export function appendCourseChapter(course,{title,markdown,from,to}) {
  if(!course||course.kind!=='course') throw new Error('Niepoprawny kurs.');
  if(!String(markdown).trim())throw new Error('Rozdział jest pusty.');
  return {...course,chapters:[...(course.chapters||[]),{id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`chapter-${Date.now()}`,title:String(title||`Rozdział ${(course.chapters||[]).length+1}`).slice(0,160),markdown:String(markdown),sourcePages:`${from}–${to}`}],updatedAt:Date.now()};
}
