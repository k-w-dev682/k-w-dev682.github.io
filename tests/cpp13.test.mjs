import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SCENARIOS} from '../src/components/cpp13/steps.js';
import {CPP_LESSONS} from '../src/data/cppLessons.js';
test('stany symulacji opisują rzeczywiste wartości przykładowych programów',()=>{
 assert.equal(SCENARIOS.loop.steps.at(-1)[1].suma,6);
 assert.equal(SCENARIOS.function.steps.at(-1)[1]['main: y'],7);
 assert.equal(SCENARIOS.reference.steps.at(-1)[1]['x (także alias)'],7);
 assert.equal(SCENARIOS.reference.steps.at(-1)[1].kopia,15);
 assert.equal(SCENARIOS.pointer.steps.at(-1)[1].y,10);
 assert.equal(SCENARIOS.pointer.steps.at(-1)[1].p,'brak obiektu');
});
test('wszystkie 44 lekcje mają istniejący adres eksportu i sprawdzony pełny przykład',()=>{
 const examples=JSON.parse(fs.readFileSync(new URL('../src/data/cpp13Examples.json',import.meta.url)));
 assert.equal(examples.length,44);
 for(const {slug} of examples){
  assert.ok(CPP_LESSONS.some(l=>l.slug===slug),slug+' missing PDF entry');
  assert.ok(fs.existsSync(new URL('../src/content/docs/programowanie/'+slug+'.mdx',import.meta.url)));
 }
 assert.equal(new Set(CPP_LESSONS.map(l=>l.slug)).size,CPP_LESSONS.length);
});
