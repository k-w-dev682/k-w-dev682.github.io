import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {parseNotesMarkdown,safeNoteUrl} from '../../lib/studylab-notes-markdown.mjs';

const INLINE=/(\\\([^\n]*?\\\)|\$[^$\n]+\$|`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|\[[^\]]+\]\([^\s)]+\))/g;
const math=(code,display)=>{
 try{return <span className={display?'sl-pnote-math-block':'sl-pnote-math'} dangerouslySetInnerHTML={{__html:katex.renderToString(code,{displayMode:display,throwOnError:true,trust:false,strict:'ignore',maxExpand:1000,maxSize:20})}}/>;}
 catch{return <code className="sl-pnote-math-error" title="Nie udało się wyrenderować wzoru">{code}</code>;}
};
function Inline({text}){
 const chunks=String(text||'').split(INLINE);
 return chunks.map((s,i)=>{
  if(!s)return null;
  if(s.startsWith('\\(')&&s.endsWith('\\)'))return <React.Fragment key={i}>{math(s.slice(2,-2),false)}</React.Fragment>;
  if(s.startsWith('$')&&s.endsWith('$')&&s.length>2)return <React.Fragment key={i}>{math(s.slice(1,-1),false)}</React.Fragment>;
  if(s.startsWith('`')&&s.endsWith('`'))return <code key={i}>{s.slice(1,-1)}</code>;
  if(s.startsWith('**')&&s.endsWith('**'))return <strong key={i}>{s.slice(2,-2)}</strong>;
  if(s.startsWith('__')&&s.endsWith('__'))return <strong key={i}>{s.slice(2,-2)}</strong>;
  if(s.startsWith('*')&&s.endsWith('*'))return <em key={i}>{s.slice(1,-1)}</em>;
  const link=/^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(s);
  if(link){const href=safeNoteUrl(link[2]);return href?<a key={i} href={href} target="_blank" rel="noopener noreferrer">{link[1]}</a>:<React.Fragment key={i}>{link[1]}</React.Fragment>;}
  return <React.Fragment key={i}>{s}</React.Fragment>;
 });
}
export default function PrivateMarkdown({value}){
 const blocks=parseNotesMarkdown(value);
 return <div className="sl-pnote-markdown">{blocks.map((block,i)=>{
  const content=<Inline text={block.text}/>;
  if(block.type==='paragraph')return <p key={i}>{content}</p>;
  if(block.type==='heading'){const H=`h${Math.min(6,block.level+1)}`;return <H key={i}>{content}</H>;}
  if(block.type==='math')return <div key={i} className="sl-pnote-equation">{math(block.text,true)}</div>;
  if(block.type==='code')return <pre key={i}><code data-language={block.lang}>{block.text}</code></pre>;
  if(block.type==='quote')return <blockquote key={i}>{content}</blockquote>;
  if(block.type==='hr')return <hr key={i}/>;
  if(block.type==='ul'||block.type==='ol'){const C=block.type;return <C key={i}>{block.entries.map((s,j)=><li key={j}><Inline text={s}/></li>)}</C>;}
  if(block.type==='table')return <div key={i} className="sl-pnote-table-scroll"><table><thead><tr>{block.headers.map((h,j)=><th key={j}><Inline text={h}/></th>)}</tr></thead><tbody>{block.rows.map((r,j)=><tr key={j}>{block.headers.map((_,k)=><td key={k}><Inline text={r[k]||''}/></td>)}</tr>)}</tbody></table></div>;
  return null;
 })}</div>;
}
