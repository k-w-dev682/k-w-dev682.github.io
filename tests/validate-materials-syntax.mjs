// Optional parser validation: if @babel/parser is already installed by Astro.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {parse}=require('@babel/parser');
for (const file of [
 'astro.config.mjs',
 'src/components/studycenter/StudyCenter.jsx',
 'src/components/materials/BooksLibrary.jsx',
 'src/components/materials/MaterialsCompare.jsx',
 'src/lib/materials-compare.mjs',
 'src/lib/materials-store.mjs',
 'src/lib/pdf-text.mjs',
 'tools/generate-lecture-comparison-index.mjs',
]){
 test('Syntax '+file,()=>assert.ok(parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']})));
}
