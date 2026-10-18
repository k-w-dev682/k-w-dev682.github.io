import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyWorkshop,validateWorkshop,numericAnswer,topicProgress,createGuidedProblem,FORMULAS,formulaSubstitution} from '../src/components/studycenter/workshop-engine.mjs';

test('stary stan i uszkodzony stan nie powodują awarii',()=>{
 assert.equal(validateWorkshop(null).version,1);
 assert.deepEqual(validateWorkshop({version:8}),emptyWorkshop());
 assert.equal(validateWorkshop({version:1,annotations:[null,{}, {id:'x',lesson:'fizyka/predkosc',quote:'Długość'}]}).annotations.length,1);
});
test('sanityzacja notatek i danych z importu',()=>{
 const db=validateWorkshop({version:1,annotations:[{id:'x',lesson:'l',quote:'a'.repeat(1000),color:'bad'}],drafts:[{id:'y',body:'a'.repeat(20000),title:'hello'}],settings:{focus:1},diagnoses:{bad:{reason:'formula',comment:'x'}}});
 assert.equal(db.annotations[0].quote.length,750);
 assert.equal(db.annotations[0].color,'mint');
 assert.equal(db.drafts[0].body.length,12000);
 assert.equal(db.settings.focus,true);
});
test('sprawdzenie liczbowych odpowiedzi obsługuje przecinek i odrzuca dowolny JS',()=>{
 assert.equal(numericAnswer('1,25',1.25).ok,true);
 assert.equal(numericAnswer('-2',-2).ok,true);
 assert.equal(numericAnswer('1+2',3).valid,false);
 assert.equal(numericAnswer('Infinity',5).valid,false);
});
test('tematy bez prób nie udają opanowania',()=>{
 const a=[{subject:'math2',topic:'sets',ok:true},{subject:'math2',topic:'sets',ok:false}];
 assert.equal(topicProgress(a,'math2','logic').score,0);
 assert.equal(topicProgress(a,'math2','sets').count,2);
 assert(topicProgress(a,'math2','sets').score<50);
});
test('każdy typ i każdy poziom trenera ma liczbowe kroki z wyjaśnieniem',()=>{
 for(const kind of ['linear','combinatorics','motion','ohm','binary'])for(const difficulty of ['easy','standard','hard']){
  const task=createGuidedProblem(kind,()=>0.6,difficulty);
  assert(task.question&&task.steps.length>0,`${kind}:${difficulty}`);
  for(const step of task.steps){assert(Number.isFinite(step.answer),`${kind}: liczba`);assert(step.formula&&step.meaning);}
 }
});
test('karty wzorów pokazują podstawienie i dają liczbowe wyniki',()=>{
 for(const f of FORMULAS){const defaults=f.vars.map(v=>v[2]);assert(Number.isFinite(f.calc(defaults)),f.id);assert(formulaSubstitution(f,defaults).includes('='),f.id)}
});
test('złe jednostki i dzielenie przez zero są odrzucane',()=>{
 assert(Number.isNaN(FORMULAS.find(f=>f.id==='density').calc([5,0])));
 assert(Number.isNaN(FORMULAS.find(f=>f.id==='combinations').calc([2,3])));
});
