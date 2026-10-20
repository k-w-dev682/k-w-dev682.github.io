import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compareDocuments,selectPages,normalizeText} from '../src/lib/materials-compare.mjs';
import {SUBJECTS_MATERIALS} from '../src/lib/materials-store.mjs';
const root=process.cwd();
test('Six subjects have distinct identifiers and sidebar routes',()=>{
 assert.equal(SUBJECTS_MATERIALS.length,6);
 assert.equal(new Set(SUBJECTS_MATERIALS.map(s=>s.id)).size,6);
 const config=fs.readFileSync(path.join(root,'astro.config.mjs'),'utf8');
 for(const s of SUBJECTS_MATERIALS)assert.ok(config.includes(`ksiazki/${s.slug}`));
 assert.ok(config.includes("label: 'Książki'"));
});
test('Comparison finds common segments and source-only segments',()=>{
 const a=[{page:1,text:'Indukcja matematyczna składa się z bazy oraz kroku indukcyjnego. W kroku indukcyjnym zakładamy prawdziwość tezy dla k i udowadniamy prawdziwość dla k plus jeden. Wykład zawiera dodatkowo ćwiczenie z układania dowodu dla sumy kolejnych liczb nieparzystych.'}];
 const b=[{page:13,text:'Indukcja matematyczna składa się z bazy oraz kroku indukcyjnego. W kroku indukcyjnym zakładamy prawdziwość tezy dla k i udowadniamy prawdziwość dla k plus jeden. Podręcznik omawia dodatkowo nierówność Bernoulliego i jej zastosowania w zadaniach dotyczących nierówności dla liczb rzeczywistych.'}];
 const result=compareDocuments(a,b);
 assert.ok(!result.error);
 assert.ok(result.lectureSegments>0);
 assert.ok(result.bookSegments>0);
 assert.ok(result.bookOnly.length>=1);
 assert.ok(result.bookOnly.some(x=>x.page===13));
});
test('Empty/scanned pages produce explicit error',()=>{
 assert.match(compareDocuments([{page:1,text:''}],[{page:1,text:'tekst'}]).error,/Za mało/);
});
test('Page range filtering keeps original PDF numbering',()=>{
 assert.deepEqual(selectPages([{page:3,text:'a'},{page:4,text:'b'},{page:5,text:'c'}],'4','4'),[{page:4,text:'b'}]);
 assert.equal(selectPages([{page:null,text:'lekcja'}],'15','30').length,1);
});
test('Lecture index has six subjects, real lessons, and no secrets',()=>{
 const data=JSON.parse(fs.readFileSync(path.join(root,'public/studylab-lecture-index.json'),'utf8'));
 assert.ok(data.lessons.length>=150);
 assert.deepEqual(new Set(data.lessons.map(x=>x.subject)),new Set(SUBJECTS_MATERIALS.map(x=>x.id)));
 for(const item of data.lessons){assert.ok(item.pages[0].text.length>=100);assert.ok(!Object.keys(item).includes('apiKey'));}
});
test('All new MDX entry points import actual React components',()=>{
 for(const s of [...SUBJECTS_MATERIALS.map(x=>x.slug),'porownanie']) {
  const page=fs.readFileSync(path.join(root,`src/content/docs/ksiazki/${s}.mdx`),'utf8');
  assert.match(page,/client:load/);
 }
 assert.match(fs.readFileSync(path.join(root,'src/content/docs/ksiazki.mdx'),'utf8'),/BooksLibrary client:load/);
});
test('Comparison library contains no API key/localStorage credential storage',()=>{
 const src=fs.readFileSync(path.join(root,'src/components/materials/BooksLibrary.jsx'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/components/materials/MaterialsCompare.jsx'),'utf8');
 assert.ok(!src.includes('localStorage.setItem'));
 assert.ok(!src.includes('apiKey'));
});
