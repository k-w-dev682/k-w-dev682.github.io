// StudyLab: educational C++ control-flow parser / layout / optional runtime tracing.
// NOT a complete compiler AST. Unknown constructs are flagged, never silently treated as correct.
const SIMPLE_TYPES = /^(return|break|continue|cin|cout|printf)\b/;
const asText = (s) => String(s || '').trim();

// Tokenize without splitting inside strings, char literals, nested parentheses or comments.
export function scanFlow(source) {
  const out = [];
  let i = 0;
  let start = -1;
  let quote = null;
  let block = false;
  let line = false;
  let escaped = false;
  let depth = 0;
  const emit = (end) => {
    if (start < 0) return;
    const value = source.slice(start, end).trim();
    if (value) {
      const lead = source.slice(start, end).search(/\S/);
      out.push({ text: value, start: start + Math.max(0,lead), end: end });
    }
    start = -1;
  };
  while (i < source.length) {
    const c = source[i], n = source[i+1];
    if (line) { if (c === '\n') line = false; i++; continue; }
    if (block) { if (c === '*' && n === '/') { block = false; i+=2; } else i++; continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = null;
      i++; continue;
    }
    if (c === '/' && n === '/') { emit(i); line = true; i+=2; continue; }
    if (c === '/' && n === '*') { emit(i); block = true; i+=2; continue; }
    if (c === '"' || c === "'") { if (start < 0) start=i; quote=c; i++; continue; }
    if (start < 0 && !/\s/.test(c)) start=i;
    if (c === '(' || c === '[') { depth++; i++; continue; }
    if (c === ')' || c === ']') { depth=Math.max(0,depth-1); i++; continue; }
    if (depth === 0 && (c === '{' || c === '}' || c === ';')) {
      if (c === ';') { emit(i+1); }
      else { emit(i); out.push({ text: c, start: i, end:i+1 }); }
      i++; continue;
    }
    // case/default labels, including multi-line switch bodies
    if (c === ':' && depth===0 && start >= 0) {
      const value = source.slice(start, i+1).trim();
      if (/^(?:case\b[\s\S]*|default):$/.test(value) && !value.includes('::')) { emit(i+1); i++; continue; }
    }
    i++;
  }
  emit(i);
  return out;
}

function cleanToken(t) { return asText(t?.text).replace(/;\s*$/, '').trim(); }
function subSpan(token, left = '(', right = ')') {
  const s = token.text, open = s.indexOf(left);
  if (open === -1) return null;
  let depth = 0, inQuote = null, escape=false;
  for(let i=open;i<s.length;i++) {
    if(inQuote) { if(escape) escape=false; else if(s[i]==='\\') escape=true; else if(s[i]===inQuote) inQuote=null; continue; }
    if(s[i]==='"'||s[i]==="'") {inQuote=s[i];continue;}
    if(s[i]===left) depth++;
    if(s[i]===right) {depth--; if(depth===0) return {start:token.start+open+1,end:token.start+i,text:s.slice(open+1,i)};}
  }
  return null;
}
function splitForHeader(span) {
  const sections=[]; let depth=0,quote=null,escape=false,last=0;
  for(let i=0;i<span.text.length;i++) {
    const c=span.text[i];
    if(quote) { if(escape) escape=false; else if(c==='\\') escape=true; else if(c===quote) quote=null; continue; }
    if(c==='"'||c==="'") { quote=c; continue; }
    if(c==='('||c==='[') depth++;
    if(c===')'||c===']') depth--;
    if(c===';'&&depth===0) { sections.push({text:span.text.slice(last,i),start:span.start+last,end:span.start+i});last=i+1; }
  }
  sections.push({text:span.text.slice(last),start:span.start+last,end:span.end});
  return sections;
}
const unsupported = (text) => /^(try|catch|goto|co_await|co_yield|throw|asm)\b/.test(text);

export function parseCppFlow(source, focus = 'main') {
  const warnings = [];
  let head;
  const escaped = focus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('\\b'+escaped+'\\s*\\([^;{}]*\\)\\s*\\{', 'g');
  const found = [...source.matchAll(re)].at(0);
  if(!found) throw new Error(`Nie znaleziono funkcji ${focus}(). Wpisz funkcję w kodzie.`);
  const open = source.indexOf('{', found.index);
  const tokens = scanFlow(source.slice(open+1));
  // Exclude all code after the function's closing brace with brace depth.
  let depth=1,end=source.length;
  for(const t of tokens) {
    if(t.text==='{') depth++;
    else if(t.text==='}') { depth--; if(depth===0) {end=open+1+t.start;break;} }
  }
  if(depth!==0) throw new Error(`Nie znaleziono zamykającej klamry funkcji ${focus}().`);
  const inside=scanFlow(source.slice(open+1,end)).map(t=>({...t,start:t.start+open+1,end:t.end+open+1}));
  let i=0,nid=0;
  const make=(kind,text,start,end,extra={})=>({id:`n${++nid}`,kind,text:asText(text),start,end,...extra});
  function parseBlock(untilClose=false,stopOnCase=false) {
    const list=[];
    while(i<inside.length) {
      if(inside[i].text==='}') {if(untilClose) i++; return list;}
      if(stopOnCase && /^(?:case\b|default\s*:)/.test(inside[i].text)) return list;
      const statement=parseOne(); if(statement) list.push(statement);
    }
    return list;
  }
  function body() {
    if (i>=inside.length) return [];
    if (inside[i].text==='{') {i++;return parseBlock(true);}
    return [parseOne()].filter(Boolean);
  }
  function parseSwitchCases() {
    const groups=[];
    if(inside[i]?.text !== '{') {warnings.push('switch bez klamer — schemat niepełny.');return groups;}
    i++;
    while(i<inside.length && inside[i].text!=='}') {
      const t=inside[i];
      if (/^(case\b|default\s*:)/.test(t.text)) {
        i++;
        const group={ id:'n'+(++nid), label:t.text.replace(/:$/,'').trim(), start:t.start, end:t.end, body:parseBlock(false,true) };
        groups.push(group);
      } else {
        warnings.push('Instrukcja switch przed pierwszym case została pominięta.');
        parseOne();
      }
    }
    if(inside[i]?.text==='}') i++;
    return groups;
  }
  function parseOne() {
    const t=inside[i++]; if(!t) return null;
    if(t.text==='{') return make('group','blok',t.start,t.end,{body:parseBlock(true)});
    if(t.text==='}') return null;
    const text=cleanToken(t);
    if(!text) return null;
    if(/^if\s*\(/.test(text)) {
      const cond=subSpan(t);
      const yesBraced=inside[i]?.text==='{';
      const yes=body();
      let no=[], noBraced=true;
      if(inside[i] && /^else\b/.test(inside[i].text)) {
        const elseToken=inside[i++];
        const remaining=elseToken.text.replace(/^else\s*/, '').trim();
        if(remaining) { // Handles 'else if (...)' delivered in the same token.
          i--;inside[i]={text:remaining,start:elseToken.end-remaining.length,end:elseToken.end};
        }
        noBraced=inside[i]?.text==='{';
        no=body();
      }
      return make('if',text,t.start,t.end,{cond,yes,no,yesBraced,noBraced});
    }
    if(/^(for|while)\s*\(/.test(text)) {
      const cond=subSpan(t), isFor=/^for/.test(text);
      const sections=isFor&&cond ? splitForHeader(cond) : null;
      if(isFor && sections?.length !== 3) warnings.push('Pętla for zakresowa lub niestandardowa: schemat uproszczony, animacja niedostępna.');
      const braced=inside[i]?.text==='{';
      return make(isFor?'for':'while',text,t.start,t.end,{cond,parts:sections,body:body(),braced});
    }
    if(/^do\b/.test(text)) {
      const braced=inside[i]?.text==='{';
      const stmts=body();
      const tail=inside[i] && /^while\s*\(/.test(inside[i].text) ? inside[i++] : null;
      if(!tail) warnings.push('Pętla do bez while — schemat niepełny.');
      return make('do',tail?`do … ${cleanToken(tail)}`:'do … while (?)',t.start,tail?.end||t.end,{cond:tail?subSpan(tail):null,body:stmts,braced});
    }
    if(/^switch\s*\(/.test(text)) return make('switch',text,t.start,t.end,{cond:subSpan(t),cases:parseSwitchCases()});
    if(/^return\b/.test(text)) return make('return',text,t.start,t.end);
    if(/^break\b/.test(text)) return make('break',text,t.start,t.end);
    if(/^continue\b/.test(text)) return make('continue',text,t.start,t.end);
    if(unsupported(text) || /^#/.test(text)) warnings.push(`Nieobsługiwana konstrukcja: ${text.slice(0,55)}`);
    return make(/\b(?:std::)?cin\b/.test(text)?'input':/\b(?:std::)?cout\b|\bprintf\b/.test(text)?'output':'action',text,t.start,t.end);
  }
  const ast=parseBlock();
  return {ast,warnings,focus};
}

function label(s,max=64) {
  let r=asText(s).replace(/\s+/g,' ');
  return r.length<=max?r:r.slice(0,max-1)+'…';
}
export function buildFlowGraph(parsed) {
  let n=0;
  const nodes=[], edges=[];
  const create=(kind,text,span=null)=> {
    const id='g'+(++n);
    nodes.push({id,kind,text:label(text),start:span?.start ?? -1,end:span?.end ?? -1,astId:span?.id??null});
    return id;
  };
  const link=(a,b,tag='') => {if(a&&b) edges.push({from:a,to:b,label:tag});};
  const end=create('end','STOP');
  function seq(items,next,ctx) {
    let current=next;
    for(let j=items.length-1;j>=0;j--) current=stmt(items[j],current,ctx);
    return current;
  }
  function stmt(s,next,ctx) {
    if(s.kind==='group') return seq(s.body,next,ctx);
    const span={id:s.id,start:s.start,end:s.end};
    if(s.kind==='return') {const a=create('return',s.text,span);link(a,end);return a;}
    if(s.kind==='break') {const a=create('break',s.text,span);link(a,ctx.breakTarget||next);return a;}
    if(s.kind==='continue') {const a=create('continue',s.text,span);link(a,ctx.continueTarget||next);return a;}
    if(s.kind==='if') {
      const d=create('decision',s.text,span);
      const yes=seq(s.yes,next,ctx),no=seq(s.no,next,ctx);
      link(d,yes,'TAK');link(d,no,'NIE');
      return d;
    }
    if(s.kind==='while'||s.kind==='for') {
      const d=create('decision',s.kind==='for' ? `for: ${asText(s.parts?.[1]?.text)||'true'}`:s.text,span);
      let tail=d;
      if(s.kind==='for' && asText(s.parts?.[2]?.text)) {tail=create('action',`krok: ${asText(s.parts[2].text)}`,span);link(tail,d);}
      const b=seq(s.body,tail,{...ctx,breakTarget:next,continueTarget:tail});
      link(d,b,'TAK');link(d,next,'NIE');
      if(s.kind==='for' && asText(s.parts?.[0]?.text)) {const init=create('action',`start: ${asText(s.parts[0].text)}`,span);link(init,d);return init;}
      return d;
    }
    if(s.kind==='do') {
      const d=create('decision',s.text,span);
      const b=seq(s.body,d,{...ctx,breakTarget:next,continueTarget:d});
      link(d,b,'TAK');link(d,next,'NIE');
      return b;
    }
    if(s.kind==='switch') {
      const d=create('decision',s.text,span);
      let fallthrough=next;
      const entries=[];
      for(let k=s.cases.length-1;k>=0;k--) {
        const c=s.cases[k];
        const target=seq(c.body,fallthrough,{...ctx,breakTarget:next});
        const cNode=create('case',c.label,c);
        link(cNode,target);
        entries.unshift({label:c.label, id:cNode});
        fallthrough=cNode;
      }
      for(const c of entries) link(d,c.id,c.label);
      if(!entries.some(c=>/^default\b/.test(c.label))) link(d,next,'brak dopasowania');
      return d;
    }
    const kind=s.kind==='input'?'input':s.kind==='output'?'output':'process';
    const a=create(kind,s.text,span);link(a,next);return a;
  }
  const entry=seq(parsed.ast,end,{});
  const start=create('start',`START — ${parsed.focus}()`);link(start,entry);
  return {nodes,edges,start,end,warnings:[...parsed.warnings]};
}

// Layout: graph levels by shortest depth; back edges point upward through an outside lane.
// Lay branches in separate slots, preserving a readable, scrollable SVG viewport.
export function layoutFlowGraph(graph) {
  const nodes=graph.nodes.map(n=>({...n}));
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const outs=new Map(nodes.map(n=>[n.id,[]]));
  graph.edges.forEach(e=>outs.get(e.from)?.push(e));
  const levels=new Map([[graph.start,0]]),done=new Set(),queue=[graph.start];
  while(queue.length) {
    const id=queue.shift();if(done.has(id))continue;done.add(id);
    const base=levels.get(id)||0;
    for(const edge of outs.get(id)||[]) {
      if(edge.to===graph.start)continue;
      if(!levels.has(edge.to)) levels.set(edge.to,base+1);
      if(!done.has(edge.to) && !queue.includes(edge.to)) queue.push(edge.to);
    }
  }
  let high=Math.max(...levels.values(),0);
  for(const node of nodes) if(!levels.has(node.id)) levels.set(node.id,++high);
  // Pull any reachable STOP down to the final row.
  const stopLevel=Math.max(...[...levels.entries()].filter(([id])=>id!==graph.end).map(x=>x[1]),0)+1;
  levels.set(graph.end,stopLevel);
  const perLevel=new Map();
  for(const node of nodes) {const level=levels.get(node.id);if(!perLevel.has(level))perLevel.set(level,[]);perLevel.get(level).push(node);}
  const spacingX=315,rowH=126;
  const maxWidth=Math.max(1,...[...perLevel.values()].map(v=>v.length));
  const width=Math.max(960, maxWidth*spacingX+180);
  const height=(stopLevel+1)*rowH+110;
  for(const [level,row] of perLevel.entries()) {
    row.forEach((node,j)=>{
      const center=(row.length-1)/2;
      node.x=width/2 + (j-center)*spacingX;
      node.y=54+level*rowH;
      node.w=node.kind==='decision'?244:node.kind==='input'||node.kind==='output'?280:268;
      node.h=node.kind==='decision'?86:node.kind==='start'||node.kind==='end'?56:68;
      node.level=level;
    });
  }
  const edgePaths=graph.edges.map((e,index)=> {
    const a=byId.get(e.from),b=byId.get(e.to);
    if(!a||!b)return null;
    const start={x:a.x,y:a.y+a.h/2},finish={x:b.x,y:b.y-b.h/2};
    // Routing repeated/control-back edges through a dedicated outer margin.
    let d,tagX,tagY;
    if(b.level <= a.level) {
      // Iteration/continue: exit right side, re-enter target from its right side.
      const lane=width-45+(index%3)*20;
      d=`M ${a.x+a.w/2} ${a.y} H ${lane} V ${b.y} H ${b.x+b.w/2}`;
      tagX=lane-46;tagY=(a.y+b.y)/2;
    } else if(b.level-a.level>1) {
      // Return/break/loop exit should never pass through unrelated later nodes.
      const lane=40-(index%3)*13;
      d=`M ${a.x-a.w/2} ${a.y} H ${lane} V ${b.y} H ${b.x-b.w/2}`;
      tagX=lane+10;tagY=(a.y+b.y)/2;
    } else if(Math.abs(start.x-finish.x)<8) {
      d=`M ${start.x} ${start.y} V ${finish.y}`;
      tagX=start.x+10;tagY=(start.y+finish.y)/2;
    } else {
      const mid=start.y+Math.min(28,Math.max(10,(finish.y-start.y)/2));
      d=`M ${start.x} ${start.y} V ${mid} H ${finish.x} V ${finish.y}`;
      tagX=(start.x+finish.x)/2;tagY=mid-8;
    }
    return {...e,d,tagX,tagY};
  }).filter(Boolean);
  return {nodes,edges:edgePaths,width:width+120,height,graph};
}

export function compileFlow(source,focus='main') {
  const parsed=parseCppFlow(source,focus);
  const layout=layoutFlowGraph(buildFlowGraph(parsed));
  return {...layout,parsed,warnings:parsed.warnings};
}

export function findNodeAtOffset(layout,offset) {
  if(!layout?.nodes) return null;
  const matching=layout.nodes.filter(n=>n.start>=0 && offset>=n.start && offset<=n.end);
  matching.sort((a,b)=>(a.end-a.start)-(b.end-b.start));
  return matching[0]?.id||null;
}

// Restrict trace compilation to braced control bodies (otherwise inserted markers could
// affect statement binding). Record real runtime path via stderr trace events.
export function instrumentCpp(source,focus='main') {
  const parsed=parseCppFlow(source,focus);
  if(parsed.warnings.length) throw new Error('Śledzenie niedostępne dla nieobsługiwanych konstrukcji. '+parsed.warnings[0]);
  const replacements=[];
  const note=(at,str)=>replacements.push({start:at,end:at,text:str});
  const condition=(s)=> {
    if(!s?.cond) throw new Error('Brak poprawnego warunku dla animacji.');
    let span=s.cond;
    if(s.kind==='for') span=s.parts?.[1];
    if(!span) throw new Error('Nie można śledzić tego warunku.');
    const raw=source.slice(span.start,span.end).trim() || 'true';
    replacements.push({start:span.start,end:span.end,text:`__sl_flow_cond(${Number(s.id.slice(1))}, (${raw}))`});
  };
  function walk(seq) {
    for(const s of seq) {
      if(s.kind==='group') {walk(s.body);continue;}
      if(['if','while','for','do'].includes(s.kind)) {
        if(s.kind==='do' && !s.cond) throw new Error('Nie można śledzić do-while bez poprawnego warunku.');
        condition(s);
        const nested=[...(s.yes||[]),...(s.no||[]),...(s.body||[])];
        walk(nested);
      } else if(s.kind==='switch') {
        if(!s.cond) throw new Error('Nie można śledzić switch bez poprawnego wyrażenia.');
        const span=s.cond;
        const raw=source.slice(span.start,span.end).trim();
        replacements.push({start:span.start,end:span.end,text:`__sl_flow_switch(${Number(s.id.slice(1))}, (${raw}))`});
        for(const c of s.cases) {
          note(c.end,` __sl_flow_trace(${Number(c.id.slice(1))}); `);
          walk(c.body);
        }
      } else {
        if(s.start<0) continue;
        // Avoid instrumenting statements nested in unbraced single-statement controls.
        note(s.start,`__sl_flow_trace(${Number(s.id.slice(1))}); `);
      }
    }
  }
  function validateBraces(seq) {
    for(const s of seq) {
      if(s.kind==='if' && (!s.yesBraced || !s.noBraced)) {
        throw new Error('Do animacji dodaj klamry { } wokół gałęzi if / else.');
      }
      if(['while','for','do'].includes(s.kind) && !s.braced) {
        throw new Error('Do animacji dodaj klamry { } wokół ciała pętli.');
      }
      validateBraces(s.yes||[]);validateBraces(s.no||[]);validateBraces(s.body||[]);
    }
  }
  validateBraces(parsed.ast);
  walk(parsed.ast);
  let instrumented=source;
  replacements.sort((a,b)=>b.start-a.start || b.end-a.end);
  for(const r of replacements) instrumented=instrumented.slice(0,r.start)+r.text+instrumented.slice(r.end);
  const tracePrelude=`#include <iostream>\nstatic inline void __sl_flow_trace(int n){std::cerr << "STUDYLAB_TRACE:" << n << "\\n";}\nstatic inline bool __sl_flow_cond(int n,bool value){std::cerr << "STUDYLAB_TRACE:" << n << ":" << (value ? "1":"0") << "\\n";return value;}\ntemplate<class T> static inline T __sl_flow_switch(int n,T value){std::cerr << "STUDYLAB_TRACE:" << n << "\\n";return value;}\n`;
  return {code:tracePrelude+instrumented, parsed};
}

export function extractTrace(stderr, source, focus='main') {
  const parsed=parseCppFlow(source,focus);
  const map=new Map();
  const visit=(ss)=>ss.forEach(s=>{map.set(Number(s.id.slice(1)),s);visit(s.yes||[]);visit(s.no||[]);visit(s.body||[]);for(const g of s.cases||[]){map.set(Number(g.id.slice(1)),{...g,text:g.label});visit(g.body||[]);}});
  visit(parsed.ast);
  const trace=[];
  const rest=String(stderr||'').split(/\r?\n/).filter(line=>{
    const m=line.match(/^STUDYLAB_TRACE:(\d+)(?::([01]))?$/);
    if(!m)return true;
    const node=map.get(Number(m[1]));
    if(node && trace.length<1000) trace.push({astId:node.id,text:node.text,branch:m[2]==null?null:m[2]==='1',start:node.start,end:node.end});
    return false;
  }).join('\n').trim();
  return {trace,stderr:rest,truncated:trace.length>=1000};
}

export function describeAlgorithm(parsed) {
  const lines=[`Schemat algorytmu: ${parsed.focus}()`, ''];
  function emit(stmts,depth=0) {
    const pad='  '.repeat(depth);
    for(const s of stmts) {
      if(s.kind==='group') {emit(s.body,depth);continue;}
      if(s.kind==='if') {lines.push(pad+'JEŚLI '+s.text);emit(s.yes,depth+1);if(s.no.length){lines.push(pad+'W PRZECIWNYM RAZIE');emit(s.no,depth+1);}lines.push(pad+'KONIEC JEŚLI');}
      else if(['for','while','do'].includes(s.kind)) {lines.push(pad+'PĘTLA '+s.text);emit(s.body,depth+1);lines.push(pad+'KONIEC PĘTLI');}
      else if(s.kind==='switch') {lines.push(pad+'WYBÓR '+s.text);for(const c of s.cases){lines.push(pad+'  '+c.label);emit(c.body,depth+2);}lines.push(pad+'KONIEC WYBORU');}
      else lines.push(pad+s.text);
    }
  }
  emit(parsed.ast);
  if(parsed.warnings.length) lines.push('', 'UWAGI:',...parsed.warnings.map(x=>'• '+x));
  return lines.join('\n')+'\n';
}
