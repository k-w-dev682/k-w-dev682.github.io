import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {QUESTIONS} from '../src/components/studycenter/bank.js';
const dir=path.dirname(fileURLToPath(import.meta.url));
const dest=path.resolve(dir,'../public/studylab-microchecks-72.json');
const safe=QUESTIONS.filter(q=>q.id&&q.subject&&q.topic&&Array.isArray(q.options)&&Number.isInteger(q.correct)).map(q=>({id:q.id,subject:q.subject,topic:q.topic,lesson:q.lesson||'',stem:q.stem,options:q.options,correct:q.correct,why:q.why||'',hint:q.hint||''}));
fs.writeFileSync(dest,JSON.stringify({version:1,questions:safe},null,0));
console.log(`StudyLab 7.2: przygotowano ${safe.length} pytań mikrotestów.`);
