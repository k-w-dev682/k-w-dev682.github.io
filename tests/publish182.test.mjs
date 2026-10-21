import test from 'node:test';
import assert from 'node:assert/strict';
import {safeMdxContent,publicationFiles,assertMaterial} from '../src/lib/studylab-publish-safety.mjs';
import {makeCourse,appendCourseChapter} from '../src/lib/studylab-publish-client.mjs';
import {verifyAdmin} from '../tools/studylab-publish-server.mjs';
const lesson={id:'d-1',kind:'lecture',title:'Ułamki',subject:'math1',markdown:'## Jak działają ułamki\n\n$$\\frac{a+b}{2}$$\n\nWzór $x^2+y^2$ i koniec.'};
test('render math safely and preserve fractions',()=>{const out=safeMdxContent(lesson.markdown);assert.match(out,/<Eq tex=.*\\\\frac/);assert.match(out,/display/);assert.match(out,/x\^2/);});
test('MDX cannot inject JSX or JS braces',()=>{const out=safeMdxContent('## Wstęp\n\n<script>alert(1)</script> i {process.exit()}');assert.doesNotMatch(out,/<script>/);assert.doesNotMatch(out,/(?<!&)\{process/);});
test('invalid subject and course without chapter rejected',()=>{assert.throws(()=>assertMaterial({...lesson,subject:'../private'}));assert.throws(()=>assertMaterial({...lesson,kind:'course',chapters:[]}));});
test('notes are not mixed with textbook courses',()=>{const a=publicationFiles(lesson);assert.match(a.documents[0].path,/materialy-importowane\/math1\/wyklady/);const c={kind:'course',subject:'math1',title:'Matematyka kurs',id:'c-1',sourceTitle:'Podręcznik',chapters:[{title:'Zbiory',markdown:'## Zbiory\n\nDefinicja zbiorów z przykładami i zadaniami.',sourcePages:'1–10'}]};const b=publicationFiles(c);assert.equal(b.documents.length,2);assert(b.documents.every(x=>x.path.includes('kursy-z-podrecznikow')));assert.match(b.documents[0].content,/MathEquation/);});
test('append course chapter does not change original',()=>{const c=makeCourse({title:'Kurs A',subject:'cpp',sourceTitle:'Książka'});const next=appendCourseChapter(c,{title:'Wstęp',markdown:'Opis minimum piętnaście znaków',from:1,to:10});assert.equal(c.chapters.length,0);assert.equal(next.chapters.length,1);});
test('no administrator configured means no access',async()=>{const result=await verifyAdmin('pretend',{config:{adminId:'',supabaseUrl:'',supabaseKey:''},fetchApi:()=>{throw new Error('Should never call');}});assert.equal(result,false);});
test('only matching verified Supabase UID is authorized',async()=>{const uuid='aabbccdd-1122-4333-8999-aabbccddeeff';const cfg={adminId:uuid,supabaseUrl:'https://demo.supabase.co',supabaseKey:'sb_publishable_example'};const token='a'.repeat(50);const fetchApi=async()=>({ok:true,json:async()=>({id:'other-user'})});assert.equal(await verifyAdmin(token,{config:cfg,fetchApi}),false);const fetch2=async()=>({ok:true,json:async()=>({id:uuid})});assert.equal(await verifyAdmin(token,{config:cfg,fetchApi:fetch2}),true);});

test('published paths never escape courses or imported notes',()=>{
 const x=publicationFiles({...lesson,title:'../../private/server.js',id:'../root'});
 assert(x.documents.every(d=>d.path.startsWith('src/content/docs/materialy-importowane/')));
 assert(x.documents.every(d=>!d.path.includes('../')));
});

test('publisher rejects foreign origins and unauthenticated users',async()=>{
  const {createServer}=await import('../tools/studylab-publish-server.mjs');
  const server=createServer({config:{adminId:'',supabaseUrl:'',supabaseKey:'',githubToken:'',repo:''}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const url=`http://127.0.0.1:${server.address().port}/publish`;
    const foreign=await fetch(url,{method:'POST',headers:{origin:'https://untrusted.example','content-type':'application/json'},body:'{}'});
    assert.equal(foreign.status,403);
    const local=await fetch(url,{method:'POST',headers:{origin:'http://localhost:4321','content-type':'application/json'},body:JSON.stringify(lesson)});
    assert.equal(local.status,403);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
