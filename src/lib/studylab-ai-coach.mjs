export const AI_BRIDGE_URL='http://127.0.0.1:4317';
export const AI_MAX_LESSON=12000;
const safeString=(value,length)=>String(value??'').slice(0,length);
export function tutorPayload({title,context,selection,question,history=[],guided=true}){
 return {title:safeString(title,180),context:safeString(context,AI_MAX_LESSON),selection:safeString(selection,1800),question:safeString(question,1200),guided:guided!==false,history:history.slice(-6).map(h=>({question:safeString(h.question,800),answer:safeString(h.answer,1800)}))};
}
export async function callAI(route,data,{fetcher=fetch}={}){
 const control=new AbortController();const abort=setTimeout(()=>control.abort(),120000);
 try{
  const response=await fetcher(`${AI_BRIDGE_URL}${route}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:control.signal});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(payload.error||`Odpowiedź serwera: HTTP ${response.status}`);
  return payload;
 }catch(e){if(e.name==='AbortError')throw Error('Przekroczono limit oczekiwania na odpowiedź.');
  if(e instanceof TypeError)throw Error('Lokalny serwer AI nie odpowiada. Uruchom tools/Start-StudyLab-AI.bat.');throw e;
 }finally{clearTimeout(abort);}
}
export function boundPages(pages,limit=15){return (Array.isArray(pages)?pages:[]).slice(0,limit).map(p=>({page:Number.isInteger(Number(p.page))?Number(p.page):null,text:String(p.text||'').slice(0,3000)}));}
export function aiComparePayload(sourcePages,bookPages,lectureTitle='',bookTitle=''){
 return {lectureTitle:String(lectureTitle).slice(0,180),bookTitle:String(bookTitle).slice(0,180),lecturePages:boundPages(sourcePages),bookPages:boundPages(bookPages)};
}
