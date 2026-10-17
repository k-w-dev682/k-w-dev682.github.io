/* StudyLab Lesson Tools v2.0 - interfejs do istniejących lekcji; bez AI lub śledzenia użytkownika. */
(() => {
  'use strict';
  const origin = new URL(document.currentScript?.src || location.href, location.href);
  const base = new URL('.',origin).pathname;
  const href = path => base + String(path).replace(/^\/+/, '');
  async function init() {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register(href('study-center-sw.js'),{scope:base}).catch(()=>{});
    }
    const relative = decodeURI(location.pathname).replace(new RegExp('^'+base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),'').replace(/^\/+|\/+$/g,'');
    const target = document.querySelector('main .sl-markdown-content') || document.querySelector('.sl-markdown-content');
    if (!target || !relative || target.querySelector('.scl2-lesson-bar')) return;
    let index;
    try {const res=await fetch(href('study-center-lesson-index.json')); if(!res.ok) return;index=await res.json();}catch{return;}
    const item=index?.lessons?.[relative];
    if (!item) return;
    const panel=document.createElement('section');panel.className='scl2-lesson-bar';panel.setAttribute('aria-label','Narzędzia nauki dla lekcji');
    const content=document.createElement('div');content.className='scl2-lesson-text';
    const heading=document.createElement('strong');heading.textContent='Ćwicz ten temat';
    const text=document.createElement('small');
    const exact=item.exactQuestions+item.exactCards;
    const form=(n,one,few,many)=>n===1?one:(n%10>=2&&n%10<=4&&(n%100<12||n%100>14))?few:many;
    text.textContent=exact?`${item.exactQuestions} ${form(item.exactQuestions,'pytanie','pytania','pytań')} i ${item.exactCards} ${form(item.exactCards,'fiszka','fiszki','fiszek')} przypisanych do tej lekcji`:'Brak materiałów przypisanych wprost do lekcji — dostępny jest zestaw z rozdziału/przedmiotu';
    content.append(heading,text);
    const controls=document.createElement('div');controls.className='scl2-lesson-controls';
    for(const [mode,label] of [['quiz','Quiz'],['cards','Fiszki'],['tasks','Zadania']]){
      const a=document.createElement('a');a.textContent=label;
      const params=new URLSearchParams({subject:item.subject,topic:item.topic,lesson:item.lesson,mode});
      a.href=href('centrum-nauki/')+'?'+params.toString()+'#'+mode;
      if ((mode==='quiz' && item.topicQuestions===0) || (mode==='cards' && item.topicCards===0)) {
        a.setAttribute('aria-label',`${label} — zestaw przedmiotowy`);
      }
      controls.append(a);
    }
    panel.append(content,controls);target.prepend(panel);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  document.addEventListener('astro:page-load',init);
})();
