/** StudyLab 18.8: conservative, local-only PDF reading layout.
 * This is not OCR and never invents fractions or LaTeX from ambiguous text.
 */
const squash=s=>String(s??'').replace(/[\t\u00a0 ]+/g,' ').trim();
const trimLine=s=>squash(s).slice(0,1400);
const listRx=/^(?:[•●▪◦]|[-–*](?=\s)|\d{1,2}[.)](?=\s))\s*/u;
const headingNumber=/^\d{1,2}(?:\.\d{1,2}){0,3}[.)]?\s+\S/u;
const formulaLike=s=>s.length<145&&/[=≈≤≥∑∫√]|\\(?:frac|sum|sqrt|int)\b/u.test(s)&&/[0-9A-Za-zα-ωΑ-Ω]/u.test(s);
function median(values){if(!values.length)return 12;const x=[...values].sort((a,b)=>a-b);return x[Math.floor(x.length/2)];}
export function classifyPdfLine(text,{size=12,normal=12,bold=false,afterGap=0}={}){
 const s=trimLine(text);
 if(!s)return 'empty';
 if(listRx.test(s))return 'list';
 if(s.length<130&&(size>=normal*1.30||(bold&&s.length<90&&afterGap>normal*.45)||headingNumber.test(s)&&size>=normal*.96))return 'heading';
 if(formulaLike(s))return 'formula';
 return 'text';
}
export function createPdfLessonBlocks(lines){
 const entries=(Array.isArray(lines)?lines:[]).map(l=>typeof l==='string'?{text:l,size:12}:{...l,text:trimLine(l.text),size:Number(l.size)||12}).filter(l=>l.text);
 const normal=median(entries.flatMap(l=>l.text.length>12?[l.size]:[]));
 const blocks=[];
 for(const l of entries){
  const kind=classifyPdfLine(l.text,{size:l.size,normal,bold:Boolean(l.bold),afterGap:l.gap||0});
  if(kind==='text'&&blocks.at(-1)?.type==='paragraph'&&Number(l.gap||0)<normal*.65){
   const prev=blocks.at(-1);prev.text+=(/[-‐‑]$/.test(prev.text)?'':' ')+l.text;continue;
  }
  blocks.push({type:kind==='text'?'paragraph':kind,text:l.text});
 }
 return blocks;
}
export function linesFromPdfItems(items){
 const result=[];let line=null;
 function finish(){if(line&&squash(line.text)){result.push({...line,text:trimLine(line.text)});}line=null;}
 for(const item of items||[]){
  if(typeof item?.str!=='string'||!item.str.trim()){
   if(item?.hasEOL)finish();continue;
  }
  const x=Number(item.transform?.[4])||0,y=Number(item.transform?.[5])||0;
  const size=Math.max(5,Math.min(80,Math.abs(Number(item.height)||Number(item.transform?.[3])||12)));
  const txt=squash(item.str);
  if(line&&Math.abs(y-line.y)>Math.max(2,size*.4))finish();
  if(!line){line={text:txt,y,x,size,bold:/bold|black|semibold/i.test(item.fontName||''),gap:result.length?Math.max(0,result.at(-1).y-y-result.at(-1).size):0,endX:x+(Number(item.width)||0)};}
  else{
   const gap=x-line.endX;
   line.text+=(gap>Math.max(1.2,size*.12)&&!line.text.endsWith(' ')?' ':'')+txt;
   line.size=Math.max(line.size,size);line.bold=line.bold||/bold|black|semibold/i.test(item.fontName||'');
   line.endX=x+(Number(item.width)||0);
  }
  if(item.hasEOL)finish();
 }
 finish();return result;
}
export function buildLessonFromPageText(text){
 return createPdfLessonBlocks(String(text||'').split(/\r?\n/).filter(Boolean).map(s=>({text:s,size:12,gap:12})));
}
export function cleanPdfPageNumber(page,total){
 const count=Math.max(1,Math.floor(Number(total)||1));
 return Math.max(1,Math.min(count,Math.floor(Number(page)||1)));
}
export function isPotentialMathFormattingLoss(blocks){
 return (blocks||[]).some(b=>b.type==='formula'&&/[\/⁄]|\^|_/u.test(b.text));
}

/** Render only an unambiguous fraction with a complete denominator.
 * A slash followed by a product or extra terms (e.g. 1 / 2x+1) is left unchanged.
 */
export function safeFormulaLatex(line){
 const value=squash(line);
 if(value.length>130||/[;{}#]|\b(?:return|cout|printf)\b/.test(value))return null;
 if(/\\(?:frac|dfrac|sqrt|sum|int)\b/.test(value))return value.replace(/^\$|\$$/g,'');
 const m=/^([A-Za-z]\w*(?:\([A-Za-z]\))?)\s*=\s*([A-Za-z0-9]+(?:\([^()]*\))?|\([^()]+\))\s*\/\s*(\([^()]+\)|[A-Za-z]+|\d+)$/u.exec(value);
 if(!m)return null;
 const strip=x=>x.startsWith('(')&&x.endsWith(')')?x.slice(1,-1):x;
 return `${m[1]}=\\frac{${strip(m[2])}}{${strip(m[3])}}`;
}
