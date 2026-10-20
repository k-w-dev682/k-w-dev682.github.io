import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import {CHALLENGES_17,validateChallenges17,filterChallenges17} from '../src/components/studycenter/challenges17.mjs';
const roots={cpp:'programowanie',math1:'matematyka/matematyka-i',math2:'matematyka/matematyka-ii',ask:'ask',physics:'fizyka',electronics:'elektronika'};
const topics={cpp:['basic','flow','data','strings'],math1:['logic','sets','functions'],math2:['sequences','combinatorics','sets'],ask:['bases','signed','cpu'],physics:['motion','forces','momentum'],electronics:['charge','potential','cap']};
test('Nowy bank ma unikatowe ID, 3 podpowiedzi i rozwiązania',()=>{const result=validateChallenges17();assert.equal(result.ids,result.count);assert.ok(result.count>=40)});
test('Każdy z sześciu przedmiotów ma pięć poziomów trudności',()=>{
 for(const s of Object.keys(roots)){assert.deepEqual([...new Set(CHALLENGES_17.filter(q=>q.subject===s).map(q=>q.level))].sort(),[1,2,3,4,5],s);}
});
test('Wszystkie wzory KaTeX są poprawne, działają powiązania z lekcjami',()=>{
 for(const q of CHALLENGES_17){
  assert.ok(roots[q.subject],q.id);assert.ok(topics[q.subject].includes(q.topic),q.id);
  const file=path.join('src','content','docs',roots[q.subject],q.lesson+'.mdx');
  assert.ok(fs.existsSync(file),`${q.id}: ${file}`);
  if(q.formula)assert.doesNotThrow(()=>katex.renderToString(q.formula,{throwOnError:true,strict:'error'}),q.id);
 }
});
test('Filtr przedmiotu, działu i poziomu nie miesza kategorii',()=>{
 for(const q of CHALLENGES_17){assert.ok(filterChallenges17({subject:q.subject,topic:q.topic,level:String(q.level)}).some(x=>x.id===q.id))}
 assert.equal(filterChallenges17({subject:'nonsense'}).length,0);
});
test('Klucze odpowiedzi są indeksami dostępnych, różnych wariantów',()=>{
 for(const q of CHALLENGES_17){assert.ok(q.correct>=0&&q.correct<q.options.length);assert.equal(new Set(q.options).size,q.options.length,q.id)}
});
