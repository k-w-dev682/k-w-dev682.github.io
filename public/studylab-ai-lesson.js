/* StudyLab 17.3: optional local AI tutor on lessons. No key, no persistence of questions. */
(()=>{
 'use strict';
 if(location.pathname.includes('/centrum-nauki') || location.pathname.includes('/ksiazki'))return;
 function boot(){
  const article=document.querySelector('main .sl-markdown-content, main article .sl-markdown-content');
  if(!article||document.getElementById('studylab-ai-open'))return;
  const shell=document.createElement('aside');shell.id='studylab-ai-shell';shell.hidden=true;
  shell.innerHTML=`<header class="sai-header"><div><span>STUDYLAB · AI</span><h2>Zapytaj o lekcję</h2></div><button type="button" id="sai-close" title="Zamknij" aria-label="Zamknij korepetytora">×</button></header>
  <div class="sai-content"><p>Gemini otrzyma fragment bieżącej lekcji oraz Twoje pytanie. Zaznacz tekst na stronie, aby skupić się na konkretnym wzorze.</p><label for="sai-selection">Zaznaczony fragment</label><textarea id="sai-selection" rows="3" maxlength="1800" placeholder="Zaznacz tekst w lekcji albo wpisz fragment wzoru..."></textarea>
  <label for="sai-question">Twoje pytanie</label><textarea id="sai-question" rows="3" maxlength="1200" placeholder="Dlaczego właśnie tutaj zmieniamy znak?"></textarea>
  <label class="sai-toggle"><input id="sai-guided" type="checkbox" checked/> Naprowadzaj mnie, nie zdradzaj od razu całego rozwiązania</label>
  <div class="sai-actions"><button id="sai-send" type="button">Zapytaj Gemini</button><button id="sai-clear" type="button">Wyczyść rozmowę</button></div>
  <p id="sai-status" role="status" aria-live="polite"></p><div id="sai-history" aria-live="polite"></div>
  <small>Wymaga uruchomienia lokalnego serwera <code>Start-StudyLab-AI.bat</code>. Fragment lekcji i pytanie są przesyłane do Google Gemini dopiero po kliknięciu przycisku.</small></div>`;
  const open=document.createElement('button');open.type='button';open.id='studylab-ai-open';open.textContent='✦ Zapytaj AI';open.setAttribute('aria-controls','studylab-ai-shell');open.setAttribute('aria-expanded','false');
  document.body.append(shell,open);
  const byId=id=>document.getElementById(id),selection=byId('sai-selection'),question=byId('sai-question'),status=byId('sai-status'),historyBlock=byId('sai-history');
  let history=[];
  function show(yes){shell.hidden=!yes;open.setAttribute('aria-expanded',String(yes));if(yes){const picked=window.getSelection()?.toString()?.trim()||'';if(picked&&picked.length<=1800&&article.contains(window.getSelection()?.anchorNode))selection.value=picked;question.focus();}else open.focus();}
  open.addEventListener('click',()=>show(shell.hidden));byId('sai-close').addEventListener('click',()=>show(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!shell.hidden)show(false);});
  byId('sai-clear').addEventListener('click',()=>{history=[];historyBlock.replaceChildren();status.textContent='Wyczyszczono historię tej sesji.';});
  document.addEventListener('mouseup',()=>{if(shell.hidden)return;const s=window.getSelection();if(s && article.contains(s.anchorNode)&&s.toString().trim())selection.value=s.toString().trim().slice(0,1800);});
  byId('sai-send').addEventListener('click',async()=>{
   const q=question.value.trim();if(q.length<3){status.textContent='Wpisz najpierw pytanie.';return;}
   const send=byId('sai-send');send.disabled=true;status.textContent='Gemini analizuje fragment lekcji…';
   const request={title:document.querySelector('main h1')?.textContent||document.title,context:article.innerText.slice(0,12000),selection:selection.value,question:q,guided:byId('sai-guided').checked,history:history.slice(-6)};
   try{
    const response=await fetch('http://127.0.0.1:4317/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Błąd serwera AI.');
    const part=document.createElement('section');part.className='sai-chat';
    const qEl=document.createElement('div');qEl.className='sai-user';qEl.textContent=q;
    const aEl=document.createElement('div');aEl.className='sai-answer';aEl.textContent=data.answer||'Brak odpowiedzi.';
    part.append(qEl,aEl);historyBlock.append(part);history.push({question:q,answer:data.answer});history=history.slice(-6);question.value='';status.textContent='Odpowiedź gotowa. Sprawdź ważne wyniki w materiałach źródłowych.';
   }catch(e){status.textContent=e instanceof TypeError?'Nie połączono z lokalnym serwerem AI. Uruchom Start-StudyLab-AI.bat.':e.message;}
   finally{send.disabled=false;}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
