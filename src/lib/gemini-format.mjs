export const STUDYLAB_AI_ENDPOINT='http://127.0.0.1:4317';
export const STUDYLAB_AI_PAGE_LIMIT=15;
export const STUDYLAB_AI_PDF_LIMIT=11*1024*1024;

export function extractPagesForGemini(doc,start,end){
 const pageCount=Math.max(0,Number(doc.pageCount)||0);
 const from=Number(start),to=Number(end);
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from||to-from+1>STUDYLAB_AI_PAGE_LIMIT) throw new Error('Wybierz od 1 do 15 kolejnych stron.');
 if(pageCount && to>pageCount) throw new Error(`Dokument ma tylko ${pageCount} stron.`);
 const pages=(doc.pages||[]).filter(p=>p.page>=from&&p.page<=to);
 return pages.map(p=>`=== STRONA PDF ${p.page} ===\n${p.text||''}\n`).join('\n').trim();
}
export function cleanAiMarkdown(s){
 return String(s||'').replace(/^\s*```(?:markdown|md|mdx)?\s*\n/i,'').replace(/\n```\s*$/,'').trim();
}
export function formatStudyLabMdx({title,subject,filename,from,to,markdown}){
 const quoted=v=>JSON.stringify(String(v));
 const safeMarkdown=cleanAiMarkdown(markdown);
 if(!safeMarkdown)throw new Error('Brak treści do eksportu.');
 return `---\ntitle: ${quoted(title)}\ndescription: ${quoted(`Materiał przetworzony przez Gemini: ${filename}`)}\n---\n\n> **Źródło:** ${String(filename).replace(/[<>\r\n]/g,' ')} (strony ${from}–${to}). Materiał opracowany automatycznie; przed publikacją sprawdź wzory, definicje i wynik konwersji.\n\n${safeMarkdown}\n`;
}
export function filenameFromTitle(title){
 return (String(title).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'notatka')+'-gemini.mdx';
}
