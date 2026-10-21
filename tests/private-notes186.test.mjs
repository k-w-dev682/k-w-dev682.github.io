import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseNotesMarkdown,privateNotesLink,safeNoteUrl,allowedSubjectNote} from '../src/lib/studylab-notes-markdown.mjs';
const {equal,ok,deepEqual}=assert;
test('Six subject-only private pages, no subtopic assignment',()=>{
 const ids=['cpp','math1','math2','physics','electronics','ask'];
 equal(ids.length,6);for(const key of ids)ok(privateNotesLink(key)?.startsWith('/moje-notatki/'));
 equal(privateNotesLink('functions'),null);
});
test('Existing Supabase draft schema is supported',()=>{
 ok(allowedSubjectNote({kind:'lecture',title:'Indukcja',markdown:'$$n^2$$'}));
 ok(allowedSubjectNote({kind:'exercise',title:'Dowody',markdown:'Tekst'}));
 equal(allowedSubjectNote({kind:'course',title:'Kurs',markdown:'xx'}),false);
});
test('Math fractions are preserved for KaTeX rendering',()=>{
 deepEqual(parseNotesMarkdown('$$\\frac{n(n+1)}{2}$$'),[{type:'math',text:'\\frac{n(n+1)}{2}'}]);
 equal(parseNotesMarkdown('$\\frac{a}{b}$')[0].text,'$\\frac{a}{b}$');
 deepEqual(parseNotesMarkdown('\\[\n\\sum_{k=1}^n k\n\\]'),[{type:'math',text:'\\sum_{k=1}^n k'}]);
});
test('Markdown exercise headings, lists, code, table',()=>{
 const blocks=parseNotesMarkdown('# Nagłówek\n\n1. Pierwszy\n2. Drugi\n\n```cpp\nint a=1/2;\n```\n\n| symbol | znaczenie |\n|---|---|\n| n | liczba |');
 deepEqual(blocks.map(x=>x.type),['heading','ol','code','table']);
 equal(blocks[2].text,'int a=1/2;');
});
test('No HTML injection, javascript links blocked',()=>{
 equal(safeNoteUrl('javascript:alert(1)'),'');
 equal(safeNoteUrl('data:text/html,hi'),'');
 equal(safeNoteUrl('//host.example'),'');
 equal(safeNoteUrl('https://example.com'),'https://example.com');
 equal(parseNotesMarkdown('<img src=x onerror=alert(1)>')[0].type,'paragraph');
});
test('external frontmatter is not displayed in notes',()=>{
 const b=parseNotesMarkdown('---\ntitle: "Indukcja"\n---\n\n# Rozdział');
 equal(b[0].type,'heading');
});
test('per-subject MDX pages import client-side private component',()=>{
 const dir=new URL('../src/content/docs/moje-notatki/',import.meta.url);
 for(const slug of ['programowanie','matematyka-i','matematyka-ii','fizyka','elektronika','architektura']){
  const content=readFileSync(new URL(slug+'.mdx',dir),'utf8');
  ok(content.includes('<PrivateSubjectNotes client:load subjectId='));
  ok(!content.includes('prerender = false'));
 }
});
