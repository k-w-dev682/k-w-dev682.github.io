// StudyLab 17.8 — formuly w fiszkach. Nie zmienia bazy ani zapisanych postepow.
// Automatyczne zamiany sa celowo ograniczone do dobrze rozpoznawalnych wyrazen.
// Własne wzory najlepiej zapisywać jako $...$, $$...$$, \(...\) lub \[...\].
const legacy = [
  ['(a+b)²=a²+2ab+b²',String.raw`(a+b)^2=a^2+2ab+b^2`],
  ['Fₜ,max=μₛN',String.raw`F_{t,\max}=\mu_s N`],
  ['√(x−2)',String.raw`\sqrt{x-2}`],
  ['2ⁿ⁻¹',String.raw`2^{n-1}`],
  ['2ⁿ',String.raw`2^n`],
  ['f⁻¹',String.raw`f^{-1}`],
  ['Σ(k od 1 do 3) k',String.raw`\sum_{k=1}^{3}k`],
  ['n! / (k! · (n−k)!)',String.raw`\dfrac{n!}{k!\,(n-k)!}`],
  ['n!/[k!(n−k)!]',String.raw`\dfrac{n!}{k!\,(n-k)!}`],
  ['n!/(k!(n−k)!)',String.raw`\dfrac{n!}{k!\,(n-k)!}`],
  ['C(5,0)=5!/(0!·5!)=1',String.raw`\binom{5}{0}=\dfrac{5!}{0!\,5!}=1`],
  ['C(5,2)=5!/(2!·3!)=10',String.raw`\binom{5}{2}=\dfrac{5!}{2!\,3!}=10`],
  ['n(n+1)/2',String.raw`\dfrac{n(n+1)}{2}`],
  ['vśr=(8−2)/3=2',String.raw`v_{\mathrm{śr}}=\dfrac{8-2}{3}=2`],
  ['Δx=v₀t+(at²)/2',String.raw`\Delta x=v_0t+\dfrac{at^2}{2}`],
  ['E=(CU²)/2',String.raw`E=\dfrac{CU^2}{2}`],
  ['E=CU²/2',String.raw`E=\dfrac{CU^2}{2}`],
  ['C=Q/U',String.raw`C=\dfrac{Q}{U}`],
  ['E=F/q₀',String.raw`E=\dfrac{F}{q_0}`],
  ['a=F/m',String.raw`a=\dfrac{F}{m}`],
  ['a=v²/r',String.raw`a=\dfrac{v^2}{r}`],
  ['v²/r',String.raw`\dfrac{v^2}{r}`],
  ['Δx / Δt',String.raw`\dfrac{\Delta x}{\Delta t}`],
  ['1/(x−4)',String.raw`\dfrac{1}{x-4}`],
  ['(8−2)/3',String.raw`\dfrac{8-2}{3}`],
  ['(at²)/2',String.raw`\dfrac{at^2}{2}`],
  ['m/s²',String.raw`\dfrac{\mathrm{m}}{\mathrm{s}^2}`],
  ['kg·m/s',String.raw`\dfrac{\mathrm{kg}\cdot\mathrm{m}}{\mathrm{s}}`],
  ['m/s',String.raw`\dfrac{\mathrm{m}}{\mathrm{s}}`],
  ['1 J/C',String.raw`\dfrac{1\,\mathrm J}{\mathrm C}`],
  ['N/C',String.raw`\dfrac{\mathrm N}{\mathrm C}`],
  ['6/2',String.raw`\dfrac{6}{2}`],
  ['4·5/2',String.raw`\dfrac{4\cdot5}{2}`],
  ['2·3²/2',String.raw`\dfrac{2\cdot3^2}{2}`],
  ['2·9/2',String.raw`\dfrac{2\cdot9}{2}`],
  ['36/3',String.raw`\dfrac{36}{3}`],
  ['1/4',String.raw`\dfrac{1}{4}`],
  ['5!/(0!·5!)',String.raw`\dfrac{5!}{0!\cdot5!}`],
  ['5!/(2!·3!)',String.raw`\dfrac{5!}{2!\cdot3!}`],
  ['Q/U',String.raw`\dfrac{Q}{U}`],
  ['F/m',String.raw`\dfrac{F}{m}`],
  ['F/q₀',String.raw`\dfrac{F}{q_0}`],
  ['v=s/t',String.raw`v=\dfrac{s}{t}`],
  ['C(n,k)',String.raw`\binom{n}{k}`],
  ['C(5,2)',String.raw`\binom{5}{2}`],
  ['v=v₀+at',String.raw`v=v_0+at`],
  ['ΣF=ma',String.raw`\sum F=ma`],
  ['f⁻¹(y)=y−2',String.raw`f^{-1}(y)=y-2`],
  ['f(x)=x²',String.raw`f(x)=x^2`],
  ['(a+b)²',String.raw`(a+b)^2`],
].sort((a,b)=>b[0].length-a[0].length);

function boundaryOK(text,pos,size){
  // Nie zamieniaj podciagow nazw, np. w fooC=Q/Ubar.
  const prev=text[pos-1]||'';
  const next=text[pos+size]||'';
  return !/[\p{L}\p{N}_]/u.test(prev)&&!/[\p{L}\p{N}_]/u.test(next);
}

function legacyPieces(text, subject){
 if(subject==='cpp'||!text)return text?[{kind:'text',value:text}]:[];
 const output=[];let buffer='';let i=0;
 const flush=()=>{if(buffer){output.push({kind:'text',value:buffer});buffer='';}};
 while(i<text.length){
  const match=legacy.find(([needle])=>text.startsWith(needle,i)&&boundaryOK(text,i,needle.length));
  if(match){flush();output.push({kind:'math',value:match[1],display:false,source:'legacy'});i+=match[0].length;continue;}
  // Krótki zapis liczbowy a/b i dosłowne v=s/t: tylko odosobnione działania.
  const tail=text.slice(i);
  const fraction=/^([a-zA-Z0-9])\s*\/\s*([a-zA-Z0-9])/.exec(tail);
  if(fraction && boundaryOK(text,i,fraction[0].length) && subject!=='ask'){
   flush();output.push({kind:'math',value:String.raw`\dfrac{${fraction[1]}}{${fraction[2]}}`,display:false,source:'legacy'});i+=fraction[0].length;continue;
  }
  buffer+=text[i++];
 }
 flush();return output;
}

// Tokenizuj bez HTML i bez interpretacji '/' w kodzie w ```...``` oraz `...`.
const TOKEN=/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)(?:\\.|[^$\n])+?\$|```[\s\S]*?```|`[^`\n]*`)/g;
export function parseFlashcardText(value,{subject='all'}={}){
 const input=String(value??'');let out=[];let end=0;
 for(const match of input.matchAll(TOKEN)){
  const pos=match.index;
  out.push(...legacyPieces(input.slice(end,pos),subject));
  const token=match[0];let kind='math',display=false,tex=token;
  if(token.startsWith('```')){kind='code';tex=token.slice(3,-3).replace(/^[^\n]*\n/,'');}
  else if(token.startsWith('`')){kind='code';tex=token.slice(1,-1);}
  else if(token.startsWith('$$')){tex=token.slice(2,-2);display=true;}
  else if(token.startsWith('\\[')){tex=token.slice(2,-2);display=true;}
  else if(token.startsWith('\\(')){tex=token.slice(2,-2);}
  else{tex=token.slice(1,-1);}
  out.push({kind,value:tex,display,source:'explicit'});end=pos+token.length;
 }
 out.push(...legacyPieces(input.slice(end),subject));
 return out.filter(x=>x.value.length);
}
