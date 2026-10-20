import fs from 'node:fs';
import path from 'node:path';
import { SUBJECTS } from '../src/components/studycenter/bank.js';
const root = process.cwd();
const docsDir = path.join(root, 'src/content/docs');
const target = path.join(root, 'public/studylab-lecture-index.json');
const subjects = [...SUBJECTS].sort((a,b)=>b.root.length-a.root.length);
function files(dir) {
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?files(path.join(dir,f.name)):/\.mdx?$/.test(f.name)?[path.join(dir,f.name)]:[]);
}
function markdownToText(raw) {
  let text=String(raw).replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/,'');
  text=text.replace(/```[^\n]*\n([\s\S]*?)```/g,'$1');
  text=text.replace(/^import\s+.*?;?\s*$/gm,'').replace(/^export\s+.*?;?\s*$/gm,'');
  text=text.replace(/<([A-Za-z][\w.]*)\b[^>]*\/>/g,' ');
  text=text.replace(/<\/?[A-Za-z][\w.]*\b[^>]*>/g,' ');
  text=text.replace(/\{\/\*[\s\S]*?\*\/\}/g,' ').replace(/\{\s*\w+\s*\}/g,' ');
  text=text.replace(/!\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1');
  text=text.replace(/\$\$?/g,' ').replace(/\\(?:frac|dfrac|tfrac|sqrt|left|right|begin|end|text|mathrm|mathbf|mathbb|cdot|times|sum|prod|lim|forall|exists|in|cup|cap)\b/g,' ');
  text=text.replace(/(^|\n)\s{0,4}#{1,6}\s*/g,'$1').replace(/[*_`~|]/g,' ').replace(/^\s*:::\w*\[?[^\n]*\]?/gm,' ');
  text=text.replace(/\n{3,}/g,'\n\n').replace(/[ \t]{2,}/g,' ').trim();
  return text;
}
const lessons=[];
for(const file of files(docsDir)) {
 const relative=path.relative(docsDir,file).replace(/\\/g,'/');
 const subj=subjects.find(s=>relative.startsWith(s.root+'/'));
 if(!subj) continue;
 const raw=fs.readFileSync(file,'utf8');
 const titleMatch=raw.match(/^title:\s*['"]?([^\n'\"]+)/m);
 const title=(titleMatch?.[1]||path.basename(file).replace(/\.mdx?$/,'').replace(/-/g,' ')).trim();
 const body=markdownToText(raw);
 if(body.length<100) continue;
 const slug=relative.replace(/\.mdx?$/,'');
 lessons.push({slug,subject:subj.id,title,pages:[{page:null,text:body}],textLength:body.length});
}
lessons.sort((a,b)=>a.subject.localeCompare(b.subject)||a.title.localeCompare(b.title,'pl'));
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify({version:1,generatedAt:new Date().toISOString(),lessons})+'\n');
console.log('Indeks porównywania wykładów:',lessons.length,'lekcji,',Math.round(fs.statSync(target).size/1024),'KB.');
