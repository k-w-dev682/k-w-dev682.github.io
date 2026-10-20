/** Local-only Gemini bridge for StudyLab. Static Astro/GitHub Pages stay unchanged.
 * Node >= 22. Never serve .env, never log Gemini keys.
 */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
if (existsSync(envPath)) loadEnvFile(envPath);
const HOST = '127.0.0.1';
const PORT = Number(process.env.STUDYLAB_AI_PORT || 4317);
const MAX_BODY = 17 * 1024 * 1024;
const MAX_PDF = 11 * 1024 * 1024;
const MAX_TEXT = 100000;
const AI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const originAllowed = origin => {
  try {
    const uri = new URL(origin);
    return uri.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(uri.hostname) && ['4321','4322','4323','4324','4325','3000'].includes(uri.port);
  } catch { return false; }
};
function json(res, status, obj, origin) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (originAllowed(origin)) { headers['Access-Control-Allow-Origin'] = origin; headers['Vary'] = 'Origin'; headers['Access-Control-Allow-Private-Network']='true'; }
  res.writeHead(status, headers); res.end(JSON.stringify(obj));
}
function prompt(title, subject) {
  return `Pracujesz nad prywatnymi materiałami dydaktycznymi do StudyLab (Astro Starlight).\n`
    + `Źródło: ${String(title).slice(0,160)}. Przedmiot: ${String(subject).slice(0,80)}.\n\n`
    + `Przygotuj przejrzystą notatkę w języku polskim jako treść Markdown zgodną z MDX.\n`
    + `1. Zachowaj wszystkie ważne informacje z otrzymanego fragmentu (w tym z marginesów, rysunków i tabel, jeżeli są czytelne).\n`
    + `2. Zadbaj o sensowną hierarchię nagłówków ## i ###, krótkie akapity, listy i opisane przykłady. Nie dodawaj nagłówka # ani YAML frontmatter.\n`
    + `3. Stosuj poprawny KaTeX: $...$ w tekście i $$...$$ dla wzorów blokowych. Tam, gdzie właściwe, używaj \\frac{...}{...}, \\sqrt{...}, indeksów i poprawnych jednostek.\n`
    + `4. Wyjaśniaj każdy symbol i pokazuj przekształcenia krok po kroku. Nie zmieniaj operatorów dzielenia w blokach kodu C++ na ułamki.\n`
    + `5. Jeśli podajesz wyjaśnienia, których nie ma w źródle, umieść je w osobnej sekcji 'Dodatkowe objaśnienia'. Nie wymyślaj faktów.\n`
    + `6. Niejednoznaczności, braki lub niemożliwe do odczytania fragmenty opisz w sekcji 'Do weryfikacji' z lokalizacją. Nigdy nie zgaduj z pewnością.\n`
    + `7. Nie generuj instrukcji import, JavaScript, JSX, HTML, znaczników <...>, nieznanych komponentów ani bloków ::: — tylko zwykły Markdown, KaTeX i bloki kodu z językiem.\n`
    + `8. Nie dołączaj ani nie przepisuj całych podręczników: przetwórz tylko dostarczony fragment.\n`
    + `9. Zwróć tylko treść Markdown, bez opakowania w potrójne backticki.\n`;
}
export function makeGeminiBody(input) {
  if (!input || typeof input !== 'object' || !['text','pdf'].includes(input.mode)) throw new Error('Niepoprawny tryb przesyłania.');
  const parts = [];
  if (input.mode === 'pdf') {
    if (!/^[a-zA-Z0-9+/]+={0,2}$/.test(input.pdfBase64 || '')) throw new Error('Niepoprawne dane PDF.');
    const estimated = Buffer.byteLength(input.pdfBase64,'ascii') * 0.75;
    if (estimated > MAX_PDF) throw new Error('PDF jest za duży do bezpośredniej analizy. Wybierz dokument z warstwą tekstową.');
    const binary = Buffer.from(input.pdfBase64,'base64');
    if (binary.subarray(0,5).toString('ascii') !== '%PDF-') throw new Error('To nie jest poprawny plik PDF.');
    parts.push({inlineData:{mimeType:'application/pdf',data:input.pdfBase64}});
  } else {
    if (typeof input.content !== 'string' || input.content.trim().length < 20) throw new Error('Za mało odczytanego tekstu.');
    if (input.content.length > MAX_TEXT) throw new Error('Za dużo tekstu naraz. Zmniejsz zakres stron.');
    parts.push({text:'Odczytane strony dokumentu:\n\n'+input.content});
  }
  parts.push({text: prompt(input.title,input.subject)});
  return { contents:[{role:'user',parts}], generationConfig:{temperature:0.15,maxOutputTokens:24576} };
}
export function extractMarkdown(result) {
  const parts = result?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) throw new Error('Model nie zwrócił tekstu.');
  let text = parts.filter(p=>typeof p.text==='string').map(p=>p.text).join('\n').trim();
  text = text.replace(/^```(?:md|markdown|mdx)?\s*\n/i,'').replace(/\n```\s*$/,'').trim();
  if (!text) throw new Error('Otrzymano pustą odpowiedź.');
  return text;
}
export async function handleFormat(data, options={}) {
  const apiKey = options.apiKey ?? key;
  const fetchApi = options.fetchApi ?? fetch;
  if (!apiKey) return {status:503,error:'Nie znaleziono GEMINI_API_KEY w C:\\studylab\\.env (lub zmiennej środowiskowej).'};
  const request = makeGeminiBody(data);
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(),180000);
  try {
    const response = await fetchApi(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(AI_MODEL)}:generateContent`, {
      method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':apiKey}, body:JSON.stringify(request), signal:controller.signal
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return {status:502,error:'Klucz API jest niepoprawny albo nie ma uprawnień do Gemini.'};
      if (response.status === 429) return {status:429,error:'Osiągnięto limit Gemini API. Spróbuj później.'};
      return {status:502,error:`Gemini API zwróciło HTTP ${response.status}. Sprawdź model i limity w Google AI Studio.`};
    }
    return {status:200,markdown:extractMarkdown(await response.json())};
  } catch(e) {
    if(e.name === 'AbortError') return {status:504,error:'Limit 180 sekund odpowiedzi Gemini został przekroczony.'};
    if(e.message === 'Model nie zwrócił tekstu.' || e.message === 'Otrzymano pustą odpowiedź.') return {status:502,error:e.message};
    return {status:502,error:'Nie udało się połączyć z Gemini. Sprawdź sieć oraz konfigurację.'};
  } finally { clearTimeout(timeout); }
}
export function createServer() {
  return http.createServer(async(req,res)=>{
    const origin = req.headers.origin || '';
    const refererOrigin = req.headers.referer ? (()=>{try{return new URL(req.headers.referer).origin}catch{return ''}})() : '';
    if (!originAllowed(origin) || (refererOrigin && refererOrigin !== origin)) return json(res,403,{error:'Dozwolona jest tylko lokalna strona StudyLab na localhost:4321–4325.'},origin);
    if(req.method==='OPTIONS') {
      res.writeHead(204,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, GET, OPTIONS','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Private-Network':'true','Access-Control-Max-Age':'1800','Vary':'Origin'});
      return res.end();
    }
    if(req.method==='GET' && req.url==='/health') return json(res,200,{ok:true,geminiConfigured:!!key},origin);
    if(req.method!=='POST' || req.url!=='/format') return json(res,404,{error:'Nie znaleziono endpointu.'},origin);
    if(!String(req.headers['content-type']||'').startsWith('application/json')) return json(res,415,{error:'Wymagany JSON.'},origin);
    let length = 0; const chunks=[];
    try {
      for await (const chunk of req) {
        length+=chunk.length;
        if(length>MAX_BODY){return json(res,413,{error:'Plik przekracza limit serwera (około 11 MB PDF).'},origin);}
        chunks.push(chunk);
      }
      const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const reply=await handleFormat(data);
      return json(res,reply.status,reply,origin);
    } catch(e) {return json(res,400,{error:e instanceof SyntaxError?'Niepoprawny JSON.':(e.message||'Niepoprawne żądanie.')},origin);}
  });
}
const isMain = process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if (isMain) {
  if(!key){console.error('Brak klucza Gemini w pliku .env. Uzyj GEMINI_API_KEY=...'); process.exitCode=1;}
  else {const server=createServer();server.listen(PORT,HOST,()=>console.log(`StudyLab AI: lokalny serwer dziala na http://${HOST}:${PORT}. Klucz pozostaje po stronie Node.`));}
}
