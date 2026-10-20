// Transparent lexical support for a reading comparison, NOT an AI fact checker.
const STOP = new Set(('oraz które który która jakie jest są także więc czyli tego tych tychże tylko ale aby albo albo albo podczas przy przez które tym że czy się dla jako jego jej można mamy mamy więc może istnieje gdzie jeśli wtedy bardzo warto tutaj należy przykład przykładu otrzymamy przed oraz mieć mają ponadto jeden jedna jedno każde każdy podobnie innym przypadku kiedy tego tam nie tak takiej już niż raz zadanie funkcja funkcji wyrażenie liczba liczby zostało został oblicz wyznacz należy równanie równania wykorzystując pokazano stronie opisuje wynosi odpowiedz odpowiedź').split(/\s+/));
export const normalizeText = text => String(text || '').toLocaleLowerCase('pl').normalize('NFKC').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
function tokens(text) {
  return [...new Set(normalizeText(text).split(' ').filter(w => w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w)))];
}
function splitSegments(pages) {
  const results = [];
  for (const page of pages || []) {
    const content = String(page?.text || '').replace(/\s+/g, ' ').trim();
    if (!content) continue;
    const pieces = content.match(/[^.!?;]+(?:[.!?;]+|$)/g) || [content];
    let buffer = '';
    const add = () => {
      const t = buffer.trim();
      if (t.length >= 65 && tokens(t).length >= 3) results.push({text:t.slice(0,1500),page:page.page ?? null,tokens:tokens(t)});
      buffer = '';
    };
    for (const part of pieces) {
      if (part.length > 700) {
        add();
        for(let i=0;i<part.length;i+=350) {buffer=part.slice(i,i+350);add();}
      } else {
        buffer += `${part} `;
        if (buffer.length >= 135) add();
      }
    }
    add();
  }
  return results;
}
function invertedIndex(segments) {
  const index = new Map();
  segments.forEach((segment, i) => {
    for(const token of segment.tokens) {
      if(!index.has(token)) index.set(token, []);
      index.get(token).push(i);
    }
  });
  return index;
}
function match(src, dest, index) {
  const candidates = new Map();
  for(const word of src.tokens) {
    const hits=index.get(word) || [];
    // Very common terms have almost no discriminatory value.
    if(hits.length>Math.max(15, dest.length*0.24)) continue;
    for(const i of hits.slice(0,140)) candidates.set(i,(candidates.get(i)||0)+1);
  }
  const total = src.tokens.length;
  let best = 0, bestIndex = -1;
  for(const [i,count] of [...candidates].sort((a,b)=>b[1]-a[1]).slice(0,65)) {
    const other = dest[i];
    const intersection = src.tokens.reduce((acc,w)=>acc+(other.tokens.includes(w)?1:0),0);
    const precision = intersection/Math.max(1,total);
    const recall = intersection/Math.max(1,other.tokens.length);
    const score = 0.7*precision + 0.3*recall;
    if(score>best){best=score;bestIndex=i;}
  }
  return {score: best, matched: bestIndex < 0 ? null : {text:dest[bestIndex].text,page:dest[bestIndex].page}};
}
function difference(from, to, max = 24) {
  const idx = invertedIndex(to);
  return from.map(item => ({text:item.text,page:item.page,...match(item,to,idx)}))
    .sort((a,b)=>a.score-b.score)
    .filter(item=>item.score<0.35)
    .slice(0,max);
}
export function compareDocuments(lecturePages, bookPages, max=24) {
  const lecture = splitSegments(lecturePages);
  const book = splitSegments(bookPages);
  if(!lecture.length || !book.length) return {error:'Za mało tekstu do porównania. Sprawdź, czy PDF ma warstwę tekstową (skan wymaga OCR), oraz czy wybrany zakres stron nie jest pusty.',lectureSegments:lecture.length,bookSegments:book.length};
  const lectureOnly = difference(lecture,book,max);
  const bookOnly = difference(book,lecture,max);
  const lectureIndex = invertedIndex(lecture);
  const shared = book.map(s=>({text:s.text,page:s.page,...match(s,lecture,lectureIndex)})).filter(x=>x.score>=0.48).sort((a,b)=>b.score-a.score).slice(0,Math.min(max,12));
  return {lectureOnly,bookOnly,shared,lectureSegments:lecture.length,bookSegments:book.length,method:'Powiązanie podobnych fragmentów przez wspólne charakterystyczne słowa; nie wykrywa wszystkich parafraz ani sprzeczności merytorycznych.'};
}
export function selectPages(pages,start,end) {
  const lo=start === '' || start == null ? 1 : Math.max(1,Number(start)||1);
  const hi=end === '' || end == null ? Infinity : Math.max(1,Number(end)||1);
  return (pages||[]).filter(p=>p.page == null || (p.page>=lo&&p.page<=hi));
}
