import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parabola,inverseBranch,domainForBranch,parabolaPoints} from '../src/components/inverse-branch-model.mjs';
test('parabola: postać kanoniczna i minimum',()=>{
 assert.equal(parabola(2),-4);assert.equal(parabola(0),0);assert.equal(parabola(4),0);
});
test('obie gałęzie odwracają pierwotną funkcję',()=>{
 for(const branch of ['left','right'])for(const [x] of parabolaPoints(branch)){
  assert.ok(Math.abs(inverseBranch(parabola(x),branch)-x)<1e-9,`${branch}, x=${x}`);
 }
});
test('nie podaje wyniku dla argumentów odwrotnej spoza dziedziny',()=>{
 assert.equal(inverseBranch(-4.001,'left'),null);assert.equal(inverseBranch(Infinity,'right'),null);
 assert.deepEqual(domainForBranch('left'),[-2,2]);assert.deepEqual(domainForBranch('right'),[2,6]);
});
