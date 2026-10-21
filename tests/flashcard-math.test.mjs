import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFlashcardText} from '../src/components/studycenter/flashcard-math.mjs';
import {FLASHCARDS} from '../src/components/studycenter/bank.js';
const math = (text,subject='math2')=>parseFlashcardText(text,{subject}).filter(p=>p.kind==='math');
test('plain formulas are rendered with a true horizontal fraction',()=>{
 for(const [original,expected] of [
 ['C=Q/U',String.raw`C=\dfrac{Q}{U}`],
 ['n(n+1)/2',String.raw`\dfrac{n(n+1)}{2}`],
 ['E=CU²/2',String.raw`E=\dfrac{CU^2}{2}`],
 ['a=v²/r',String.raw`a=\dfrac{v^2}{r}`],
 ['C(5,2)=5!/(2!·3!)=10',String.raw`\binom{5}{2}=\dfrac{5!}{2!\,3!}=10`],
 ['Wynik 1/(x−4)',String.raw`\dfrac{1}{x-4}`],
 ])assert.ok(math(original).some(x=>x.value===expected),original);
});
test('mathematical TeX delimiters work inline and block',()=>{
 assert.deepEqual(math('Wzór $v=\\frac{s}{t}$ oraz $$\\sqrt{x}$$'),[
  {kind:'math',value:String.raw`v=\frac{s}{t}`,display:false,source:'explicit'},
  {kind:'math',value:String.raw`\sqrt{x}`,display:true,source:'explicit'}]);
 assert.equal(math(String.raw`\[\frac{a+b}{c+d}\]`)[0].display,true);
 assert.equal(math(String.raw`\(x^2\)`)[0].value,'x^2');
});
test('C++ division, backticks, code blocks and prose stay untouched',()=>{
 for(const source of ['7 / 3 daje 2','std::cout << x/y;', 'int/int'])assert.equal(math(source,'cpp').length,0);
 assert.equal(math('`7 / 3` bez skracania').length,0);
 assert.equal(math('```cpp\nint a = 7/3;\n```').length,0);
 assert.equal(math('AND/OR','ask').length,0);
 assert.equal(math('1/4','electronics')[0].value,String.raw`\dfrac{1}{4}`);
});
test('unsupported fields are never deleted or silently interpreted as HTML',()=>{
 assert.deepEqual(parseFlashcardText('<script>alert(1)</script>'),[{kind:'text',value:'<script>alert(1)</script>'}]);
 assert.deepEqual(parseFlashcardText(''),[]);
 assert.deepEqual(parseFlashcardText(null),[]);
 assert.equal(parseFlashcardText('Nazwa pliku: /src/docs', {subject:'math1'}).map(x=>x.value).join(''),'Nazwa pliku: /src/docs');
});
test('pre-existing flashcard records and study data are unchanged',()=>{
 assert.ok(FLASHCARDS.length>=100);
 const old=FLASHCARDS.find(c=>c.id==='mf204');
 assert.equal(old.back,'n(n+1)/2.');
 assert.ok(math(old.back,old.subject).some(x=>x.value.includes('\\dfrac')));
 assert.equal(FLASHCARDS.find(c=>c.id==='v2cf02').subject,'cpp');
});
