// Zatwierdzaj tylko sprawdzone propozycje: node tools/studycenter-approve.mjs <id>
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const file=path.join(root,'study-center-drafts/propozycje.json');
const accepted=path.join(root,'src/components/studycenter/approved-content.json');
if(!fs.existsSync(file))throw new Error('Brak propozycji. Uruchom najpierw npm run studycenter:drafts.');
const drafts=JSON.parse(fs.readFileSync(file,'utf8')).drafts||[];
const id=process.argv[2];
if(!id||id==='--list'){
 console.log('Propozycje (ID → plik):');for(const c of drafts)console.log(`${c.id} → ${c.source} (${c.front})`);
 console.log('Sprawdź treść w study-center-drafts/propozycje.json, następnie: npm run studycenter:approve -- draft:XXXX');process.exit(0);
}
const found=drafts.find(x=>x.id===id);if(!found)throw new Error('Brak propozycji o takim ID.');
const approval=JSON.parse(fs.readFileSync(accepted,'utf8'));
if((approval.cards||[]).some(x=>x.id===id)) {console.log('Już zatwierdzono.');process.exit(0);}
if(!found.front||!found.back||found.back.length>400||!found.topic)throw new Error('Niekompletna propozycja.');
const card={id,subject:found.subject,topic:found.topic,lesson:found.lesson,front:found.front,back:found.back};
approval.cards.push(card);
fs.writeFileSync(accepted,JSON.stringify(approval,null,2)+'\n');
console.log(`Dodano zatwierdzoną fiszkę: ${card.front}. Sprawdź git diff, wykonaj npm run build.`);
