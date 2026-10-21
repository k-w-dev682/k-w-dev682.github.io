// Pure, testable publication rules. No user-provided MDX is executed as JSX.
export const SUBJECT_FOLDERS=Object.freeze({
  cpp:'programowanie', math1:'matematyka/matematyka-i', math2:'matematyka/matematyka-ii',
  physics:'fizyka', electronics:'elektronika', ask:'ask'
});
export function slug(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'material';}
export function safeText(value,limit=160){
  const s=String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
  if(!s||s.length>limit)throw new Error(`Wymagana niepusta treść (maks. ${limit} znaków).`);
  return s;
}
export function assertMaterial(material){
  if(!material||typeof material!=='object'||!['lecture','exercise','course'].includes(material.kind))throw new Error('Niepoprawny typ materiału.');
  if(!SUBJECT_FOLDERS[material.subject])throw new Error('Niepoprawny przedmiot.');
  safeText(material.title); if(material.kind==='course'){
    if(!Array.isArray(material.chapters)||!material.chapters.length||material.chapters.length>50)throw new Error('Kurs musi mieć od 1 do 50 rozdziałów.');
    for(const c of material.chapters){safeText(c.title);validateMarkdown(c.markdown);}
  }else validateMarkdown(material.markdown);
  return material;
}
function validateMarkdown(markdown){if(typeof markdown!=='string'||markdown.trim().length<15||markdown.length>160000)throw new Error('Notatka jest pusta lub zbyt długa.');}
export function safeMdxContent(raw){
  validateMarkdown(raw);
  let text=raw.replace(/^\uFEFF?---\s*\r?\n[\s\S]{0,4000}?\r?\n---\s*\r?\n/,'');
  // Remove fenced JSX scripts or executable MDX directives; do not execute generated code.
  text=text.replace(/^(?:import|export)\s+/gm,'\\$&');
  const math=[];
  const save=(value,display)=>{const token=`ZXMATHPLACEHOLDER${math.length}ZX`;math.push({token,value,display});return token;};
  // Find true displayed and inline math, leaving ordinary code fences intact.
  const blocks=text.split(/(```[\s\S]*?```)/g);
  text=blocks.map((block,i)=>{
    if(i%2===1)return block;
    return block.replace(/\$\$([\s\S]*?)\$\$/g,(_,s)=>save(s.trim(),true))
      .replace(/(?<!\$)\$([^$\n]{2,300})\$(?!\$)/g,(_,s)=>save(s.trim(),false));
  }).join('');
  // The content cannot introduce JSX tags, JavaScript expressions or HTML. Escape before injecting our own trusted Eq nodes.
  text=text.replace(/</g,'&lt;').replace(/\{/g,'&#123;').replace(/\}/g,'&#125;');
  text=text.replace(/\]\(\s*(?:javascript|data):/gi,'](#blocked-');
  for(const m of math){
    const tex=JSON.stringify(m.value.slice(0,2000));
    text=text.replace(m.token,m.display?`\n\n<Eq tex={${tex}} display />\n\n`:`<Eq tex={${tex}} />`);
  }
  return text.trim();
}
export function createLessonMdx({title,markdown,description='',order=99,eqImport='../../../../../components/MathEquation.astro'}){
  const t=safeText(title); const body=safeMdxContent(markdown);
  return `---\ntitle: ${JSON.stringify(t)}\ndescription: ${JSON.stringify(String(description).slice(0,200))}\nsidebar:\n  order: ${Number(order)||99}\n---\n\nimport Eq from '${eqImport}';\n\n${body}\n`;
}
export function publicationFiles(input,existing=[]){
  const item=assertMaterial(input);
  const stamp=slug(item.id||item.title).slice(0,40);const name=slug(item.title);
  const documents=[];let route,chapters=0;
  if(item.kind==='course'){
    const base=`kursy-z-podrecznikow/${item.subject}/${name}-${stamp}`;
    route=`${base}/`;
    chapters=item.chapters.length;
    item.chapters.forEach((c,i)=>{
      const chapterRoute=`${base}/rozdzial-${String(i+1).padStart(2,'0')}`;
      const mdx=createLessonMdx({eqImport:'../../../../../components/MathEquation.astro',title:`${i+1}. ${c.title}`,markdown:c.markdown,description:`Kurs: ${item.title}. Źródło: ${String(item.sourceTitle||'podręcznik').slice(0,100)}. Strony: ${String(c.sourcePages||'nie podano')}`,order:i+1});
      documents.push({path:`src/content/docs/${chapterRoute}.mdx`,content:mdx});
    });
    const links=item.chapters.map((c,i)=>`- [${i+1}. ${safeText(c.title).replace(/[\[\]{}<>]/g,'')}](./rozdzial-${String(i+1).padStart(2,'0')}/)`).join('\n');
    documents.push({path:`src/content/docs/${base}/index.mdx`,content:`---\ntitle: ${JSON.stringify(item.title)}\ndescription: ${JSON.stringify('Samodzielny kurs z podręcznika — rozdziały oddzielone od wykładów i ćwiczeń')}\nsidebar:\n  order: 1\n---\n\n> Kurs opracowano na podstawie: **${safeText(item.sourceTitle||'podręcznika').replace(/[<>{}\[\]`]/g,' ')}**. Treści zostały sprawdzone i zatwierdzone do publikacji przez administratora.\n\n## Rozdziały\n\n${links}\n`});
  }else{
    const group=item.kind==='exercise'?'cwiczenia':'wyklady';
    const base=`materialy-importowane/${item.subject}/${group}/${name}-${stamp}`;
    route=`${base}/`;documents.push({path:`src/content/docs/${base}.mdx`,content:createLessonMdx({title:item.title,markdown:item.markdown,description:`${item.kind==='lecture'?'Wykład':'Ćwiczenia'} — materiał importowany przez administratora`,eqImport:'../../../../../components/MathEquation.astro'})});
  }
  const others=existing.filter(x=>x.id!==item.id);
  const record={id:String(item.id||stamp),kind:item.kind,subject:item.subject,title:item.title,route,chapters,publishedAt:new Date().toISOString()};
  return {documents,record,catalog:{version:1,items:[record,...others].slice(0,2000)}};
}
