// Generuje WYŁĄCZNIE propozycje z lokalnych lekcji MDX; nigdy nie publikuj bez zatwierdzenia.
// Bez AI, sieci i klucza API; zadania wyboru wymagają czterech ręcznie zweryfikowanych opcji.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { FLASHCARDS } from '../src/components/studycenter/bank.js';
const root=path.resolve(process.argv[2]||process.cwd());
const docs=path.join(root,'src','content','docs');
const output=path.join(root,'study-center-drafts','propozycje.json');
const mapping=[
 ['programowanie/','cpp'],['matematyka/matematyka-i/','math1'],['matematyka/matematyka-ii/','math2'],
 ['ask/','ask'],['fizyka/','physics'],['elektronika/','electronics'],
];
const topicKey={cpp:'basic',math1:'logic',math2:'sequences',ask:'bases',physics:'motion',electronics:'charge'};
const skip=new Set(['index','wstep','spis-tresci','cwiczenia','wyklady','eksport','niejasnosci','zrodla','karta-wzorow','symbole','karta-pojec','przedmioty','programowanie']);
function walk(dir){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.mdx')?[path.join(dir,e.name)]:[]);}
function clean(value){return value.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\*\*/g,'').replace(/\\\(/g,'').replace(/\\\)/g,'').replace(/<[^>]*>/g,'').replace(/\{[^}]*\}/g,'').replace(/\s+/g,' ').trim();}
const approvedPath=path.join(root,'src/components/studycenter/approved-content.json');
const approved=fs.existsSync(approvedPath)?JSON.parse(fs.readFileSync(approvedPath,'utf8')):{cards:[],questions:[]};
const known=new Set([...(approved.cards||[]),...(approved.questions||[])].map(x=>x.id));
const coveredLessons=new Set(FLASHCARDS.map(c=>`${c.subject}|${c.lesson}`));
const drafts=[];
for(const file of walk(docs)){
 const relative=path.relative(docs,file).replaceAll('\\','/');
 const match=mapping.find(([prefix])=>relative.startsWith(prefix));if(!match)continue;
 const slug=relative.slice(match[0].length).replace(/\.mdx$/,'');
 if(skip.has(slug)||slug.includes('/')||coveredLessons.has(`${match[1]}|${slug}`))continue;
 const raw=fs.readFileSync(file,'utf8');
 const frontmatter=raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
 const title=clean(frontmatter?.[1].match(/^title:\s*['"]?(.+?)['"]?\s*$/m)?.[1]||slug.replaceAll('-',' '));
 let body=raw.slice(frontmatter?.[0].length||0);
 body=body.replace(/```[\s\S]*?```/g,'').replace(/\$\$[\s\S]*?\$\$/g,'').replace(/^[ \t]*import .*$/gm,'').replace(/<[^>]+(?:\/>|>[\s\S]*?<\/[^>]+>)/g,'');
 const paragraphs=body.split(/\n\s*\n/).map(clean).filter(x=>x.length>=55&&!x.startsWith('#')&&!/^(-|\d+\.)\s/.test(x)&&!x.includes('undefined')&&!x.includes('http')&&x.length<=900);
 const answer=paragraphs.find(p=>p.length>=75&&p.length<=420);
 if(!answer)continue;
 const subject=match[1];const id='draft:'+crypto.createHash('sha256').update(relative+'\0'+title).digest('hex').slice(0,12);
 if(known.has(id))continue;
 // Brak heurystyki rozpoznawania tematów dla arbitralnych nowych dokumentów:
 // pole topic jest PROPOZYCJĄ, recenzent powinien zweryfikować temat i odpowiedź.
 drafts.push({id,type:'flashcard-proposal',subject,topic:topicKey[subject],lesson:slug,source:relative,
  front:`Wyjaśnij zagadnienie: ${title}?`,back:answer.slice(0,400),
  warning:'WYMAGA WERYFIKACJI: pytanie, odpowiedź i identyfikator tematu.',status:'do-weryfikacji'});
}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({format:'studylab-proposals-v1',generatedAt:new Date().toISOString(),note:'Tylko szkice. Żaden z nich nie trafia na stronę bez jawnego zatwierdzenia.',drafts},null,2)+'\n');
console.log(`StudyLab: zapisano ${drafts.length} propozycji w ${path.relative(root,output)} (nie są publikowane).`);
