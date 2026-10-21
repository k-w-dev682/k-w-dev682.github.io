import React, {useMemo} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {parseFlashcardText} from './flashcard-math.mjs';
import './flashcard-math.css';

export default function FlashcardMath({text,subject='all'}){
 const segments=useMemo(()=>parseFlashcardText(text,{subject}),[text,subject]);
 return <span className="sc-rich-text">{segments.map((part,i)=>{
  if(part.kind==='text')return <React.Fragment key={i}>{part.value}</React.Fragment>;
  if(part.kind==='code')return <code className="sc-rich-code" key={i}>{part.value}</code>;
  try{
   const html=katex.renderToString(part.value,{throwOnError:true,trust:false,strict:'ignore',displayMode:!!part.display,maxExpand:100,maxSize:12,output:'htmlAndMathml'});
   return <span key={i} className={part.display?'sc-rich-equation sc-rich-equation--display':'sc-rich-equation'} role="math" aria-label={part.value} dangerouslySetInnerHTML={{__html:html}}/>;
  }catch{
   // Użytkownik widzi dosłowny błędny wzór; nie gubimy zapisanej treści.
   return <code key={i} className="sc-rich-invalid" title="Nie udało się wyrenderować tego wzoru">{part.source==='explicit'?`$${part.value}$`:part.value}</code>;
  }
 })}</span>;
}
