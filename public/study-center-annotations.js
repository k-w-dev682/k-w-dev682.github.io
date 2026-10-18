/* StudyLab 7.0 — notatki przy lekcjach: wyłącznie lokalny zapis, bez modyfikacji MDX. */
(()=>{
 'use strict';
 const KEY='studylab.workshop.v1';
 const script=new URL(document.currentScript?.src||location.href,location.href);
 const base=new URL('.',script).pathname;
 const lesson=decodeURI(location.pathname).replace(new RegExp('^'+base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),'').replace(/^\/+|\/+$/g,'');
 function load(){try{const d=JSON.parse(localStorage.getItem(KEY));return d?.version===1&&Array.isArray(d.annotations)?d:null}catch{return null}}
 function original(){return {version:1,annotations:[],drafts:[],diagnoses:{},stepSessions:[],settings:{focus:false}}}
 let selected='';
 document.addEventListener('selectionchange',()=>{const s=window.getSelection();if(!s||!s.toString().trim())return;const node=s.anchorNode?.parentElement;const main=node?.closest?.('main .sl-markdown-content');if(main)selected=s.toString().trim().slice(0,750)});
 function init(){const isCenter=lesson==='centrum-nauki';const main=document.querySelector('main .sl-markdown-content');if(!main||!lesson||main.querySelector('.scl7-annotation-bar'))return;
 const bar=document.createElement('section');bar.className='scl7-annotation-bar';bar.setAttribute('aria-label','Adnotacje i tryb skupienia');
 const title=document.createElement('span');title.textContent=isCenter?'Tryb czytania':'Własne adnotacje';bar.append(title);
 const save=document.createElement('button');save.type='button';save.textContent='Zaznacz / Dodaj komentarz';
 if(!isCenter)bar.append(save);
 const focus=document.createElement('button');focus.type='button';focus.textContent='Tryb skupienia';focus.setAttribute('aria-pressed','false');bar.append(focus);
 const editor=document.createElement('div');editor.className='scl7-editor';editor.hidden=true;
 const quote=document.createElement('blockquote');editor.append(quote);
 const field=document.createElement('textarea');field.rows=3;field.maxLength=1500;field.placeholder='Twoje wyjaśnienie, uwaga lub pytanie...';field.setAttribute('aria-label','Treść adnotacji');editor.append(field);
 const accept=document.createElement('button');accept.textContent='Zapisz adnotację';editor.append(accept);
 const cancel=document.createElement('button');cancel.textContent='Anuluj';editor.append(cancel);
 const list=document.createElement('div');list.className='scl7-notes';
 function highlightQuotes(notes){
   if(!globalThis.CSS?.highlights||!globalThis.Highlight)return;
   const ranges=[];const quotes=notes.map(x=>x.quote?.trim()).filter(Boolean).slice(0,40);
   for(const text of quotes){
     const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);
     let node;let remaining=0;
     while((node=walker.nextNode())&&remaining<1000){remaining++;if(node.parentElement?.closest('.scl7-annotation-bar,.scl7-editor,.scl7-notes'))continue;
       const index=node.textContent?.indexOf(text)??-1;if(index<0)continue;
       const range=document.createRange();range.setStart(node,index);range.setEnd(node,index+text.length);ranges.push(range);break;
     }
   }
   CSS.highlights.set('studylab-user-highlights',new Highlight(...ranges));
 }
 function render(){list.replaceChildren();const data=load()||original();const notes=data.annotations.filter(x=>x.lesson===lesson).slice(-20).reverse();highlightQuotes(notes);if(notes.length){const h=document.createElement('strong');h.textContent=`Twoje adnotacje (${notes.length})`;list.append(h)}for(const item of notes){const entry=document.createElement('div');entry.className='scl7-note';const text=document.createElement('blockquote');text.textContent=item.quote;const extra=document.createElement('p');extra.textContent=item.note;entry.append(text,extra);const del=document.createElement('button');del.textContent='Usuń';del.addEventListener('click',()=>{const current=load()||original();current.annotations=current.annotations.filter(x=>x.id!==item.id);try{localStorage.setItem(KEY,JSON.stringify(current));render()}catch{alert('Nie udało się zapisać zmian.')}});entry.append(del);list.append(entry)}}
 save.addEventListener('click',()=>{const x=window.getSelection()?.toString().trim()||selected;if(!x){alert('Najpierw zaznacz fragment tekstu w treści lekcji.');return}quote.textContent=x.slice(0,750);field.value='';editor.hidden=false;field.focus()});
 accept.addEventListener('click',()=>{if(!quote.textContent.trim())return;const db=load()||original();db.annotations.push({id:`ann-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,lesson,quote:quote.textContent,note:field.value.slice(0,1500),color:'mint',date:Date.now()});db.annotations=db.annotations.slice(-1000);try{localStorage.setItem(KEY,JSON.stringify(db));editor.hidden=true;selected='';render()}catch{alert('Nie udało się zapisać adnotacji.')}});
 cancel.addEventListener('click',()=>{editor.hidden=true});
 focus.addEventListener('click',()=>{
  const active=document.body.classList.toggle('scl7-focus');
  focus.textContent=active?'Wyłącz skupienie':'Tryb skupienia';
  focus.setAttribute('aria-pressed',String(active));
 });
 if(!isCenter){main.prepend(list);main.prepend(editor);}main.prepend(bar);if(!isCenter)render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 document.addEventListener('astro:page-load',init);
})();
