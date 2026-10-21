/** StudyLab 18.6 — untrusted private Markdown -> structured blocks, no HTML injection. */
const sourceLimit=240000;
const item=/^\s*([-+*])\s+(.+)$/;
const numbered=/^\s*\d+[.)]\s+(.+)$/;
const separator=/^\|?\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)*\s*\|?$/;
const clean=part=>String(part||'').trim();
const tableCells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(clean);
export function privateNotesLink(subject){
 const path={cpp:'programowanie',math1:'matematyka-i',math2:'matematyka-ii',physics:'fizyka',electronics:'elektronika',ask:'architektura'}[subject];
 return path?`/moje-notatki/${path}/`:null;
}
export function safeNoteUrl(href){
 const h=clean(href);
 if(h.startsWith('#')||h.startsWith('/'))return h.startsWith('//')?'':h;
 try{const u=new URL(h);return (u.protocol==='https:'||u.protocol==='http:'||u.protocol==='mailto:')?h:'';}catch{return '';}
}
export function parseNotesMarkdown(input){
 let lines=String(input||'').slice(0,sourceLimit).replace(/\r\n?/g,'\n').split('\n');
 // Markdown frontmatter from an external AI is metadata, not lesson content.
 if(lines[0]==='---'){
  const end=lines.findIndex((s,i)=>i>0&&s==='---');
  if(end>0&&end<35)lines=lines.slice(end+1);
 }
 const blocks=[];
 const isSpecial=line=>/^\s*(```|~~~|\$\$|\\\[|#{1,6}\s|>|[-+*]\s|\d+[.)]\s|\|)/.test(line)||/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
 for(let i=0;i<lines.length;){
  const current=lines[i],line=current.trim();
  if(!line){i++;continue;}
  const fence=current.match(/^\s*(`{3,}|~{3,})([^`]*)$/);
  if(fence){
   const endMark=fence[1][0],count=fence[1].length,content=[];
   i++;
   while(i<lines.length&&!new RegExp(`^\\s*${endMark}{${count},}\\s*$`).test(lines[i]))content.push(lines[i++]);
   if(i<lines.length)i++;
   blocks.push({type:'code',lang:fence[2].trim(),text:content.join('\n')});continue;
  }
  if(line.startsWith('$$')||line.startsWith('\\[')){
   const delim=line.startsWith('$$')?'$$':'\\]',start=line.startsWith('$$')?'$$':'\\[';
   let text=line.slice(start.length),closed=false;
   if(text.includes(delim)){text=text.slice(0,text.lastIndexOf(delim));closed=true;}
   i++;
   while(!closed&&i<lines.length){
    const part=lines[i++];if(part.includes(delim)){text+='\n'+part.slice(0,part.lastIndexOf(delim));closed=true;}else{text+='\n'+part;}
   }
   blocks.push({type:'math',text:text.trim()});continue;
  }
  const header=current.match(/^\s*(#{1,6})\s+(.+)$/);
  if(header){blocks.push({type:'heading',level:header[1].length,text:header[2].replace(/\s+#+\s*$/,'')});i++;continue;}
  if(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(current)){blocks.push({type:'hr'});i++;continue;}
  if(/^\s*>/.test(current)){
   const chunk=[];while(i<lines.length&&/^\s*>/.test(lines[i]))chunk.push(lines[i++].replace(/^\s*>\s?/,''));
   blocks.push({type:'quote',text:chunk.join(' ')});continue;
  }
  const row=item.exec(current),num=numbered.exec(current);
  if(row||num){
   const type=row?'ul':'ol',entries=[];
   while(i<lines.length){
    const m=(type==='ul'?item:numbered).exec(lines[i]);if(!m)break;
    entries.push(m[type==='ul'?2:1]);i++;
   }
   blocks.push({type,entries});continue;
  }
  if(current.trim().includes('|')&&i+1<lines.length&&separator.test(lines[i+1])){
   const headers=tableCells(lines[i]);i+=2;
   const rows=[];
   while(i<lines.length&&lines[i].trim()&&lines[i].includes('|'))rows.push(tableCells(lines[i++]));
   blocks.push({type:'table',headers,rows});continue;
  }
  const chunk=[current.trim()];i++;
  while(i<lines.length&&lines[i].trim()&&!isSpecial(lines[i]))chunk.push(lines[i++].trim());
  blocks.push({type:'paragraph',text:chunk.join(' ')});
 }
 return blocks;
}
export const allowedSubjectNote = draft=>draft&&['lecture','exercise'].includes(draft.kind)&&typeof draft.markdown==='string'&&typeof draft.title==='string';
