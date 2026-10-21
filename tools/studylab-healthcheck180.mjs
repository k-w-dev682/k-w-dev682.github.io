// StudyLab 18.0 readiness check (no secrets loaded or printed).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const findings=[];
function report(status,name,detail=''){findings.push({status,name,detail});console.log(`[${status}] ${name}${detail?' — '+detail:''}`);}
function exists(p){return fs.existsSync(path.join(root,p));}
function walk(dir){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
report(exists('astro.config.mjs')?'OK':'ERROR','Konfiguracja Astro');
report(exists('src/components/studycenter/StudyCenter.jsx')?'OK':'ERROR','Centrum nauki');
report(exists('src/components/studycenter/Learning176.jsx')?'OK':'ERROR','Moduły 17.6 i 17.7');
const routes=walk(path.join(root,'src','pages')).filter(f=>/\.(astro|jsx?|tsx?|mjs)$/.test(f));
const ssr=routes.filter(f=>/export\s+const\s+prerender\s*=\s*false\b/.test(fs.readFileSync(f,'utf8')));
if(ssr.length)report('ERROR','Statyczny hosting a trasy SSR',ssr.map(f=>path.relative(root,f)).join(', '));
else report('OK','Brak jawnych tras z prerender=false');
if(exists('package.json')){
 try {const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  report(pkg.scripts?.build?'OK':'ERROR','Skrypt npm run build');
  report(pkg.scripts?.prebuild?'OK':'WARN','Generator prebuild');
 }catch{report('ERROR','Niepoprawny package.json');}
}
if(exists('.env'))report('OK','Plik .env obecny (treści nie odczytano)');
else report('INFO','Brak .env w katalogu — opcjonalny dla lokalnego Gemini');
try {const tracked=execFileSync('git',['ls-files','--error-unmatch','.env'],{cwd:root,stdio:'ignore'});
 report('ERROR','.env jest śledzony przez Git! — sprawdź sekrety');void tracked;
}catch{report(exists('.git')?'OK':'INFO',exists('.git')?'.env nie jest śledzony przez Git':'Nie można potwierdzić stanu Git w tym katalogu');}
const errors=findings.filter(f=>f.status==='ERROR').length;
console.log(`StudyLab readiness check: ${errors} błędów, ${findings.filter(f=>f.status==='WARN').length} ostrzeżeń. To NIE zastępuje npm run build.`);
process.exitCode=errors?1:0;
