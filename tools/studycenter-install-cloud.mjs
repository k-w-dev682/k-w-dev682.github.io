import fs from 'node:fs';
import path from 'node:path';

const project = path.resolve(process.argv[2] || process.cwd());
const center = path.join(project,'src/components/studycenter/StudyCenter.jsx');
const engine = path.join(project,'src/components/studycenter/engine.js');
const insist = (src, search, file) => {if (!src.includes(search)) throw new Error(`Incompatible StudyLab v3: missing marker in ${file}: ${search.slice(0,85)}`);};
function replaceOne(src, before, after, file){
  insist(src,before,file);
  if(src.split(before).length !== 2)throw new Error(`Duplicate marker in ${file}`);
  return src.replace(before,after);
}
function patchEngine(text) {
  if (text.includes('syncDeleted:{customCards:{}')) return text;
  text=replaceOne(text,
    "planner:{examDate:'',subject:'all',minutes:25},exams:[],settings:{goal:15,retention:0.9}});",
    "planner:{examDate:'',subject:'all',minutes:25},exams:[],settings:{goal:15,retention:0.9},syncDeleted:{customCards:{},notes:{},exams:{},bookmarks:{}},syncAdded:{bookmarks:{},customCards:{},notes:{},exams:{}},syncModified:{planner:0,settings:0,customCards:0,notes:0,exams:0}});", 'engine.js');
  text=replaceOne(text,
    " d.settings={goal:Math.min(100,Math.max(1,Number(value.settings?.goal)||15)),retention:Math.min(0.97,Math.max(0.7,Number(value.settings?.retention)||0.9))};\n return d;",
    ` d.settings={goal:Math.min(100,Math.max(1,Number(value.settings?.goal)||15)),retention:Math.min(0.97,Math.max(0.7,Number(value.settings?.retention)||0.9))};
 // Synchronizacja v4: nie przywracaj skasowanych danych z urzadzen offline.
 const stamps=x=>Object.fromEntries(Object.entries(x&&typeof x==='object'&&!Array.isArray(x)?x:{}).filter(([k])=>typeof k==='string'&&k.length<=200).slice(-1000).map(([k,v])=>[k,Number.isFinite(Number(v))?Math.max(0,Number(v)):0]));
 for(const name of ['customCards','notes','exams','bookmarks'])d.syncDeleted[name]=stamps(value.syncDeleted?.[name]);
 for(const name of ['bookmarks','customCards','notes','exams'])d.syncAdded[name]=stamps(value.syncAdded?.[name]);
 for(const name of ['planner','settings','customCards','notes','exams'])d.syncModified[name]=Number.isFinite(Number(value.syncModified?.[name]))?Math.max(0,Number(value.syncModified[name])):0;
 return d;`, 'engine.js');
  return text;
}
function patchCenter(text) {
  if (text.includes("from './useCloudSync.jsx'")) return text;
  text=replaceOne(text,
    "import { EXTRA_GENERATORS } from './generators-v3.js';",
    `import { EXTRA_GENERATORS } from './generators-v3.js';
import CloudAccount from './CloudAccount.jsx';
import { useCloudSync } from './useCloudSync.jsx';
import { markDeleted, toggleCloudBookmark, bumpModified, addCloudItem } from './cloud-merge.js';
import './cloud-styles.css';`, 'StudyCenter.jsx');
  text=replaceOne(text,
    "planner:'Plan nauki',library:'Moje materiały'};",
    "planner:'Plan nauki',library:'Moje materiały',sync:'Synchronizacja'};", 'StudyCenter.jsx');
  text=replaceOne(text,
    "calendar:'◷',library:'☆'};",
    "calendar:'◷',library:'☆',sync:'☁'};", 'StudyCenter.jsx');
  text=replaceOne(text,
    "['calendar','Kalendarz','Terminy i sesje przed zaliczeniami']",
    "['calendar','Kalendarz','Terminy i sesje przed zaliczeniami'],['sync','Chmura','Postępy na telefonie i komputerze']", 'StudyCenter.jsx');
  text=replaceOne(text,
    'function LibraryPanel({db,onAddCard,onRemoveCard,onAddNote,onRemoveNote,onImport,onClear})',
    'function LibraryPanel({db,onAddCard,onRemoveCard,onAddNote,onRemoveNote,onImport,onClear,cloudActive})', 'StudyCenter.jsx');
  text=replaceOne(text,
    "const accepted=window.confirm('Wczytanie zastąpi bieżące postępy w tej przeglądarce. Czy kontynuować?');",
    "const accepted=window.confirm(cloudActive?'Wczytanie zastąpi dane lokalne, a podczas synchronizacji historia zostanie połączona z danymi chmury. Kontynuować?':'Wczytanie zastąpi bieżące postępy w tej przeglądarce. Czy kontynuować?');", 'StudyCenter.jsx');
  text=replaceOne(text,
    '<p>Twoje wyniki, własne fiszki i notatki są przechowywane lokalnie na tym urządzeniu. Zrób kopię JSON, aby odtworzyć je np. na telefonie.</p>',
    '<p>StudyLab zawsze zapisuje wyniki lokalnie. Po zalogowaniu w zakładce „Synchronizacja” wysyła je też do prywatnej chmury. Kopia JSON jest dodatkowym zabezpieczeniem.</p>', 'StudyCenter.jsx');
  text=replaceOne(text,
    '<p className="sc-muted">Wczytanie pliku zastępuje aktualne dane. StudyLab nie przesyła postępów na żaden serwer.</p>',
    '<p className="sc-muted">Import zastępuje lokalny zapis, ale po synchronizacji historia może zostać scalona z chmurą. Eksport JSON nie zawiera tokenu logowania Supabase.</p>', 'StudyCenter.jsx');
  text=replaceOne(text,
    '<button className="sc-danger-minor" onClick={()=>setShowDelete(v=>!v)}>Reset postępów i materiałów</button>',
    '<button className="sc-danger-minor" disabled={cloudActive} title={cloudActive?"Wyloguj się, aby usunąć tylko dane lokalne":""} onClick={()=>setShowDelete(v=>!v)}>Reset lokalnych postępów</button>{cloudActive&&<p className="sc-muted">Gdy konto jest zalogowane, reset lokalny jest wyłączony: chmura i tak przywróciłaby dane. Wyloguj się przed resetem. Nie usuwa to danych chmury.</p>}', 'StudyCenter.jsx');
  text=replaceOne(text,
    " const [db,setDb]=useState(()=>DEFAULT_DB());const [ready,setReady]=useState(false);",
    " const [db,setDb]=useState(()=>DEFAULT_DB());const [ready,setReady]=useState(false);\n const cloud=useCloudSync(db,setDb,ready);", 'StudyCenter.jsx');
  text=replaceOne(text,
    ' function toggleBookmark(href){update(d=>({...d,bookmarks:d.bookmarks.includes(href)?d.bookmarks.filter(x=>x!==href):[...d.bookmarks,href]}));}',
    ' function toggleBookmark(href){update(d=>toggleCloudBookmark(d,href));}', 'StudyCenter.jsx');
  text=replaceOne(text,
    'Bez konta, bez abonamentu, bez kluczy API.',
    'Bez abonamentu. Konto e-mail opcjonalne do synchronizacji.', 'StudyCenter.jsx');
  text=replaceOne(text,
    '<strong>Tryb offline</strong><p>Odwiedzone lekcje i Centrum nauki są dostępne offline po zapisaniu ich przez przeglądarkę. Postępy pozostają lokalne.</p>',
    '<strong>Offline i chmura</strong><p>Możesz ćwiczyć bez internetu. Po zalogowaniu postępy zsynchronizują się po odzyskaniu połączenia.</p>', 'StudyCenter.jsx');
  text=replaceOne(text,
    "{tab==='cards'&&<FlashcardPanel db={db} onReview={rateCard} onRetention={retention=>update(d=>({...d,settings:{...d.settings,retention}}))} focus={focus}/>}",
    "{tab==='cards'&&<FlashcardPanel db={db} onReview={rateCard} onRetention={retention=>update(d=>bumpModified({...d,settings:{...d.settings,retention}},'settings'))} focus={focus}/>}", 'StudyCenter.jsx');
  text=replaceOne(text,
    "onAdd={exam=>update(d=>({...d,exams:[...(d.exams||[]),exam].slice(-150)}))} onRemove={id=>update(d=>({...d,exams:(d.exams||[]).filter(x=>x.id!==id)}))}",
    "onAdd={exam=>update(d=>addCloudItem(d,'exams',exam))} onRemove={id=>update(d=>markDeleted(d,'exams',id))}", 'StudyCenter.jsx');
  text=replaceOne(text,
    "onGoal={goal=>update(d=>({...d,settings:{...d.settings,goal}}))}",
    "onGoal={goal=>update(d=>bumpModified({...d,settings:{...d.settings,goal}},'settings'))}", 'StudyCenter.jsx');
  text=replaceOne(text,
    "onPlanner={planner=>update(d=>({...d,planner}))}",
    "onPlanner={planner=>update(d=>bumpModified({...d,planner},'planner'))}", 'StudyCenter.jsx');
  text=replaceOne(text,
    "onAddCard={c=>update(d=>({...d,customCards:[...d.customCards,c]}))} onRemoveCard={id=>update(d=>({...d,customCards:d.customCards.filter(x=>x.id!==id)}))} onAddNote={n=>update(d=>({...d,notes:[...d.notes,n]}))} onRemoveNote={id=>update(d=>({...d,notes:d.notes.filter(x=>x.id!==id)}))} onImport={setDb} onClear={()=>setDb(DEFAULT_DB())}",
    "onAddCard={c=>update(d=>addCloudItem(d,'customCards',c))} onRemoveCard={id=>update(d=>markDeleted(d,'customCards',id))} onAddNote={n=>update(d=>addCloudItem(d,'notes',n))} onRemoveNote={id=>update(d=>markDeleted(d,'notes',id))} onImport={setDb} onClear={()=>{if(!cloud.userId){setDb(DEFAULT_DB());cloud.clearAccountBindingIfSignedOut();}}} cloudActive={!!cloud.userId}", 'StudyCenter.jsx');
  text=replaceOne(text,
    "{tab==='overview'&&<Overview db={db} stats={stats} setTab={changeTab}/>}",
    "{tab==='overview'&&<Overview db={db} stats={stats} setTab={changeTab}/>}\n {tab==='sync'&&<CloudAccount cloud={cloud}/>}", 'StudyCenter.jsx');
  text=replaceOne(text,
    'PWA: odwiedzone strony dostępne offline · Postęp osobno na każdym urządzeniu',
    'PWA: odwiedzone strony dostępne offline · Synchronizacja opcjonalna przez Supabase', 'StudyCenter.jsx');
  return text;
}
const originalEngine=fs.readFileSync(engine,'utf8').replace(/\r\n/g,'\n');
const originalCenter=fs.readFileSync(center,'utf8').replace(/\r\n/g,'\n');
const newEngine=patchEngine(originalEngine);
const newCenter=patchCenter(originalCenter);
// Only write once every transformation has been validated (minimizes partial installs).
if (newEngine!==originalEngine)fs.writeFileSync(engine,newEngine,'utf8');
if (newCenter!==originalCenter)fs.writeFileSync(center,newCenter,'utf8');
console.log('StudyLab: Cloud Sync integration complete (idempotent).');
