import test from 'node:test';
import assert from 'node:assert/strict';
import { makeGeminiBody, extractMarkdown, handleFormat, createServer } from '../tools/studylab-gemini-server.mjs';
import { extractPagesForGemini, formatStudyLabMdx, filenameFromTitle, cleanAiMarkdown } from '../src/lib/gemini-format.mjs';

test('request only includes document text and prompt, never key',()=>{
 const body=makeGeminiBody({mode:'text',content:'Treść ze wzorami x^2, abc test',title:'Funkcje',subject:'Matematyka'});
 assert.match(JSON.stringify(body),/Treść ze wzorami/);assert.match(JSON.stringify(body),/\\\\frac/);assert.equal(JSON.stringify(body).includes('AIza'),false);
});
test('rejects fake PDFs before sending',()=>assert.throws(()=>makeGeminiBody({mode:'pdf',pdfBase64:Buffer.from('not pdf').toString('base64')}),/PDF/));
test('accepts small PDF',()=>assert.equal(makeGeminiBody({mode:'pdf',pdfBase64:Buffer.from('%PDF-1.7\nHello').toString('base64')}).contents[0].parts[0].inlineData.mimeType,'application/pdf'));
test('rejects oversized AI text',()=>assert.throws(()=>makeGeminiBody({mode:'text',content:'x'.repeat(100001)}),/Za dużo/));
test('extracts and unwraps Markdown',()=>assert.equal(extractMarkdown({candidates:[{content:{parts:[{text:'```markdown\n## Podstawy\n```'}]}}]}),'## Podstawy'));
test('page scope is limited to 15 pages',()=>{
 const doc={pageCount:20,pages:[{page:1,text:'A'},{page:2,text:'B'},{page:17,text:'C'}]};
 assert.match(extractPagesForGemini(doc,1,2),/STRONA PDF 2/);
 assert.doesNotMatch(extractPagesForGemini(doc,1,2),/STRONA PDF 17/);
 assert.throws(()=>extractPagesForGemini(doc,1,16),/15 kolejnych/);
 assert.throws(()=>extractPagesForGemini(doc,20,21),/20 stron/);
});
test('MDX export keeps safe frontmatter and user-editable content',()=>{
 const mdx=formatStudyLabMdx({title:'Cytat: "xyz"',subject:'M',filename:'notatki.pdf',from:1,to:3,markdown:'## Dział\n\n$\\frac{a}{b}$'});
 assert.match(mdx,/title: "Cytat: \\"xyz\\""/);assert.match(mdx,/## Dział/);assert.equal(filenameFromTitle('Analiza matematyczna'),'analiza-matematyczna-gemini.mdx');assert.equal(cleanAiMarkdown('```mdx\nabc\n```'),'abc');
});
test('fake upstream does not expose key to caller',async()=>{
 const result=await handleFormat({mode:'text',content:'Dane ze zbiorów różnorodne',title:'T',subject:'M'}, {apiKey:'DUMMY_API_KEY',fetchApi:async(url,opts)=>{
  assert.equal(opts.headers['x-goog-api-key'],'DUMMY_API_KEY');
  assert.equal(url.includes('DUMMY_API_KEY'),false);
  return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'## Wstęp'}]}}]})};
 }});
 assert.equal(result.status,200);assert.equal(result.markdown,'## Wstęp');assert.equal(JSON.stringify(result).includes('DUMMY_API_KEY'),false);
});
test('HTTP CORS disallows remote sites',async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const url=`http://127.0.0.1:${server.address().port}/health`;
  const blocked=await fetch(url,{headers:{Origin:'https://evil.example'}});
  assert.equal(blocked.status,403);
  const good=await fetch(url,{headers:{Origin:'http://localhost:4321'}});
  assert.equal(good.status,200);assert.equal(good.headers.get('access-control-allow-origin'),'http://localhost:4321');
 }finally{server.close();}
});
