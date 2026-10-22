import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const subjects=[['programowanie','cpp'],['matematyka-i','math1'],['matematyka-ii','math2'],['fizyka','physics'],['elektronika','electronics'],['architektura','ask']];
const file=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('Sześć stron książek, każda przy przedmiocie, bez podtematów',()=>{
 for(const [slug,id] of subjects){
  const page=file(`../src/content/docs/moje-ksiazki/${slug}.mdx`);
  assert.match(page,new RegExp(`subjectId="${id}"`));
  assert.match(page,/PrivateSubjectBooks client:load/);
  assert.doesNotMatch(page,/prerender\s*=\s*false/);
 }
});
test('Menu umieszczone obok Moich notatek',()=>{
 const config=file('../astro.config.mjs');
 for(const [slug] of subjects){
  const note=config.indexOf(`slug: "moje-notatki/${slug}"`);
  const book=config.indexOf(`slug: "moje-ksiazki/${slug}"`);
  assert.ok(note>=0&&book>note&&book-note<200,'Nie znaleziono linków dla '+slug);
 }
});
test('Istniejący prywatny magazyn Supabase bez publicznych URL',()=>{
 const component=file('../src/components/private-books/PrivateSubjectBooks.jsx');
 for(const fn of ['listPrivateBooks','putPrivateBook','getPrivateBook','deletePrivateBook']) assert.ok(component.includes(fn));
 assert.match(component,/kind:'book'/);
 assert.match(component,/subject:subjectId/);
 assert.doesNotMatch(component,/createSignedUrl|getPublicUrl|GITHUB_TOKEN|service_role|prerender = false/);
});
test('Czytnik PDF, wyszukiwanie, limity oraz ochrona przez sesję',()=>{
 const c=file('../src/components/private-books/PrivateSubjectBooks.jsx');
 assert.match(c,/iframe title=/);
 assert.match(c,/type="search"/);
 assert.match(c,/MAX_PRIVATE_PDF_BYTES/);
 assert.match(c,/privateBooksAuthClient/);
 assert.match(c,/URL\.revokeObjectURL/);
 assert.match(c,/window\.confirm/);
});
