import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildPrivateBookCourse,headingType,lessonPages,renameCoursePart} from '../src/lib/pdf-book-course.mjs';
const bookId='private:123e4567-e89b-42d3-a456-426614174000';
const source=[
 {page:1,text:'Przedmowa\nDziękujemy za lekturę.'},
 {page:2,text:'Rozdział 1. Zbiory\nW tym rozdziale zbiory.'},
 {page:3,text:'1.1 Pojęcie zbioru\nZbiór jest pojęciem pierwotnym.'},
 {page:4,text:'Przykłady\nA = {1, 2, 3}'},
 {page:5,text:'1.2 Działania na zbiorach\nSuma zbiorów.\nA ∪ B'},
 {page:6,text:'Rozdział 2. Logika\nZdania logiczne.'},
 {page:7,text:'2.1 Koniunkcja\np ∧ q'},
];
const make=(pages=source)=>buildPrivateBookCourse({bookId,title:'Matematyka dyskretna',subject:'matematyka-ii',pages,createdAt:100});
test('Chapter and lesson headings are conservatively distinguished',()=>{
 assert.equal(headingType('Rozdział 2. Logika'), 'chapter');
 assert.equal(headingType('1.2 Działania na zbiorach'),'lesson');
 assert.equal(headingType('1.2 Działania na zbiorach',{lineNo:11}),null);
 assert.equal(headingType('f(x) = 1 / (x+1)'),null);
});
test('Every chapter belongs to the selected book and none to generic notes',()=>{
 const c=make();assert.equal(c.kind,'book-course');assert.equal(c.bookId,bookId);
 assert.equal(c.title,'Matematyka dyskretna');assert.equal(c.subject,'matematyka-ii');
 assert.ok(c.chapters.some(x=>x.title==='Rozdział 1. Zbiory'));
 assert.ok(c.chapters.some(x=>x.title==='Rozdział 2. Logika'));
 assert.ok(c.chapters.every(x=>x.lessons.length>=1));
});
test('All source pages are preserved verbatim and in order',()=>{
 const c=make();assert.deepEqual(c.pages,source);
 assert.equal(c.extractedPageCount,7);
 assert.equal(c.lessonCount,c.chapters.reduce((s,ch)=>s+ch.lessons.length,0));
});
test('Lessons retain exact source ranges',()=>{
 const c=make();const l=c.chapters.flatMap(x=>x.lessons).find(x=>x.title.startsWith('1.1'));
 assert.deepEqual(lessonPages(c,l).map(x=>x.page),[3,4]);
});
test('No headings falls back to readable page groups instead of 200 loose lessons',()=>{
 const pages=Array.from({length:16},(_,i)=>({page:i+1,text:`Długi akapit na stronie numer ${i+1} zawiera tekst.`}));
 const c=make(pages);
 assert.equal(c.chapters.length,1);assert.equal(c.lessonCount,4);
 assert.deepEqual(c.chapters[0].lessons.map(l=>[l.startPage,l.endPage]),[[1,5],[6,10],[11,15],[16,16]]);
});
test('Scans without a text layer are not silently replaced by fabricated lessons',()=>{
 assert.throws(()=>make([{page:1,text:''},{page:2,text:'  '}]),/OCR/);
});
test('Existing book id is required, not a new or public course identity',()=>{
 assert.throws(()=>buildPrivateBookCourse({bookId:'public:fake',pages:source}),/identyfikator/);
});
test('Rename changes only the selected title, not original text',()=>{
 const c=make();const ch=c.chapters[1],l=ch.lessons[0];
 const changed=renameCoursePart(c,{chapterId:ch.id,lessonId:l.id,title:'Co to jest zbiór?'});
 assert.equal(changed.chapters[1].lessons[0].title,'Co to jest zbiór?');
 assert.equal(c.chapters[1].lessons[0].title,l.title);
 assert.deepEqual(changed.pages,c.pages);
});
test('Book course remains isolated from notes/editor and RLS path is owner-prefixed',()=>{
 const store=fs.readFileSync(new URL('../src/lib/studylab-private-book-courses.mjs',import.meta.url),'utf8');
 assert.match(store,/drafts\/books\/\$\{bookId\.slice\(8\)\}\.json/);
 assert.ok(!store.includes('putPrivateDraft'));
 assert.match(store,/authorizedPrivateUser/);
 assert.match(store,/PRIVATE_BOOK_BUCKET/);
});
test('UI shows a dedicated book table of contents and auto-conversion option',()=>{
 const component=fs.readFileSync(new URL('../src/components/private-books/PrivateSubjectBooks.jsx',import.meta.url),'utf8');
 const course=fs.readFileSync(new URL('../src/components/private-books/PrivateBookCourse.jsx',import.meta.url),'utf8');
 assert.match(component,/Automatycznie utwórz rozdziały i lekcje/);
 assert.match(component,/savePrivateBookCourse/);
 assert.match(course,/Rozdziały książki/);
 assert.match(course,/course\.title/);
});
