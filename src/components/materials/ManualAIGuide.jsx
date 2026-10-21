import React,{useMemo,useRef,useState} from 'react';
import {SUBJECTS_MATERIALS} from '../../lib/materials-store.mjs';
import {STYLE_TOKENS} from '../../lib/studylab-style-guide.mjs';
import './manual-ai-guide.css';

const AUDIENCE='Osoba początkująca, ucząca się do ćwiczeń i kolokwiów na studiach informatycznych.';
const CONTENT_RULES=[
  'Przeczytaj WSZYSTKIE przekazane zdjęcia/strony wskazanego zakresu, również dopiski na marginesach. Nie pomijaj informacji, nie streszczaj mechanicznie.',
  'Rozdziel treści pochodzące ze źródła od dodatkowych wyjaśnień. Jeśli źródło zawiera błąd, oznacz go i wyjaśnij poprawkę. Gdy coś jest nieczytelne, podaj numer strony lub zdjęcia i napisz, co wymaga sprawdzenia — nie zgaduj.',
  'Tłumacz od podstaw. Zanim użyjesz nowego symbolu, podaj jego znaczenie; przed wzorem opisz intuicję, po wzorze pokaż podstawienie danych i wyjaśnij, dlaczego każdy krok jest poprawny.',
  'Przykłady mają być szczegółowe i różnorodne. Uwzględnij co najmniej kilka zadań o rosnącej trudności, od wprowadzenia aż do poziomu typowego kolokwium; dodaj naprowadzające podpowiedzi i osobne poprawne rozwiązania.',
  'Matematyka musi być czytelna: używaj LaTeX/KaTeX i \\frac{...}{...}, zamiast niejednoznacznych zapisów a/b. Korzystaj z nawiasów, indeksów i jednostek. Nie zmieniaj dzielenia w przykładach kodu C++.',
  'Dodaj sekcje „Typowe błędy”, „Sprawdź się” i „Fragmenty wymagające weryfikacji” tam, gdzie są potrzebne. Zwracaj uwagę na prawa do reprodukcji podręcznika: opracuj temat własnymi słowami, bez długich cytatów.',
];
const CONTENT_BY_KIND={
  lecture:'To jest wykład/notatki. Zachowaj kolejność i zakres zagadnień ze źródła, ale uzupełnij niezbędne definicje oraz brakujące kroki. Nie mieszaj tego z kursem z podręcznika.',
  exercise:'To są ćwiczenia. Każde zadanie zapisz jednoznacznie z danymi, metodą, rozwiązaniem krok po kroku, uzasadnieniem i wynikiem. Nie pomijaj trudniejszych zadań.',
  book:'To jest ROZDZIAŁ osobnego KURSU Z PODRĘCZNIKA. Nie umieszczaj go w działach „Wykłady” ani „Ćwiczenia”. Zachowaj spójność z poprzednimi rozdziałami i nie powielaj identycznych treści.',
};
export function buildManualAIPrompt({subject='math2',kind='lecture',format='pdf',title='',pages='' }={}){
  const subjectLabel=SUBJECTS_MATERIALS.find(s=>s.id===subject)?.label||'Wybrany przedmiot';
  const theme=STYLE_TOKENS;
  const sourceLine=pages.trim()?`Zakres materiału źródłowego: ${pages.trim()}.`:'Przerób tylko załączony zakres materiału. Długą książkę opracowuj rozdziałami, w osobnych odpowiedziach.';
  const heading=title.trim()||'Temat z przesłanych materiałów';
  const output=format==='pdf'
    ? `WYNIK: Przygotuj KOMPLETNY dokument PDF gotowy do pobrania, jeżeli Twoje narzędzie umożliwia tworzenie plików PDF. Projektuj sam dokument jako BLACK Edition, nie tylko tło witryny: tło ${theme.colors.background}, karty ${theme.colors.card}, tekst ${theme.colors.text}, drugi plan ${theme.colors.muted}, akcent ${theme.colors.accent}. Czytelne, kontrastowe tabele, wykresy i schematy; polskie znaki; estetyczne odstępy i podział na strony. Zachowaj wzory jako prawdziwe ułamki z poziomą kreską. Jeśli nie możesz wygenerować pliku PDF, zwróć kompletne opracowanie w formacie, który można wydrukować/zapisać do PDF — nie udawaj, że utworzono plik.`
    : 'WYNIK: Zwróć samą treść Markdown przeznaczoną do edytora StudyLab, bez frontmatter, bez nadrzędnego nagłówka #, bez HTML, JSX, importów, własnego CSS i potrójnego bloku kodu otaczającego cały tekst. Używaj ## i ###, list, tabel, bloków ```cpp tylko dla kodu C++, oraz LaTeX $...$ i $$...$$ dla matematyki. Unikaj surowych nawiasów klamrowych poza poprawnym zapisem LaTeX; przed publikacją trzeba sprawdzić renderowanie w MDX/KaTeX.';
  return [
    `Jesteś dydaktykiem przygotowującym materiały do StudyLab BLACK Edition. Język odpowiedzi: polski. Przedmiot: ${subjectLabel}. Tytuł: ${heading}. Odbiorca: ${AUDIENCE}`,
    sourceLine,
    CONTENT_BY_KIND[kind]||CONTENT_BY_KIND.lecture,
    ...CONTENT_RULES.map((x,i)=>`${i+1}. ${x}`),
    `STYL: StudyLab BLACK Edition — tło ${theme.colors.background}, akcent ${theme.colors.accent}, kolor tekstu ${theme.colors.text}, kod ${theme.colors.codeBackground}, maks. szerokość kolumny tekstu ${theme.layout.contentWidth}; pisz szczegółowo, używając wyraźnej hierarchii nagłówków i dużej czytelności matematyki. Dla Markdown/MDX styl narzuca sama strona; nie kopiuj kolorów jako CSS.`,
    output,
    'Nie twórz plików w repozytorium i nie publikuj niczego samodzielnie. Przekaż użytkownikowi gotowy materiał do weryfikacji i ręcznego importu.',
  ].join('\n\n');
}
export default function ManualAIGuide(){
  const [subject,setSubject]=useState('math2');
  const [kind,setKind]=useState('lecture');
  const [format,setFormat]=useState('pdf');
  const [title,setTitle]=useState('');
  const [pages,setPages]=useState('');
  const [message,setMessage]=useState('');
  const boxRef=useRef(null);
  const prompt=useMemo(()=>buildManualAIPrompt({subject,kind,format,title,pages}),[subject,kind,format,title,pages]);
  async function copyPrompt(){
    try{await navigator.clipboard.writeText(prompt);setMessage('Skopiowano instrukcję. Wklej ją w Gemini lub ChatGPT i dołącz plik PDF albo zdjęcia.');}
    catch{boxRef.current?.focus();boxRef.current?.select();setMessage('Zaznaczono prompt. Użyj Ctrl+C, aby go skopiować.');}
  }
  return <section id="studylab-manual-ai" className="sl-manual-ai" aria-labelledby="sl-manual-title">
    <div className="sl-manual-top"><span className="sl-mat-eyebrow">STUDYLAB / BEZ WYMAGANEGO API</span><h2 id="sl-manual-title">Notatki z zewnętrznego AI</h2><p>Skopiuj gotową instrukcję ze specyfikacją BLACK Edition. Prześlij swoje zdjęcia lub PDF do Gemini, ChatGPT albo innego narzędzia. Wynik zaimportujesz z powrotem do StudyLab.</p></div>
    <div className="sl-manual-grid">
      <label>Przedmiot<select value={subject} onChange={e=>setSubject(e.target.value)}>{SUBJECTS_MATERIALS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label>Rodzaj materiału<select value={kind} onChange={e=>setKind(e.target.value)}><option value="lecture">Notatki z wykładu</option><option value="exercise">Ćwiczenia / zadania</option><option value="book">Kurs z podręcznika</option></select></label>
      <label>Format wyniku<select value={format} onChange={e=>setFormat(e.target.value)}><option value="pdf">PDF w stylu BLACK Edition</option><option value="mdx">Markdown do edytora StudyLab</option></select></label>
      <label>Temat (opcjonalnie)<input value={title} maxLength="160" placeholder="np. Indukcja matematyczna" onChange={e=>setTitle(e.target.value)}/></label>
      <label className="sl-manual-wide">Zakres stron / zdjęć (opcjonalnie)<input value={pages} maxLength="180" placeholder="np. strony 20–34, zdjęcia 1–8" onChange={e=>setPages(e.target.value)}/></label>
    </div>
    <label className="sl-manual-prompt-label" htmlFor="sl-manual-prompt-text">Gotowy prompt do skopiowania</label>
    <textarea id="sl-manual-prompt-text" ref={boxRef} readOnly rows={9} value={prompt} aria-label="Instrukcja dla zewnętrznego AI"/>
    <div className="sl-manual-actions"><button className="sl-manual-primary" type="button" onClick={copyPrompt}>Kopiuj prompt</button><a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer">Otwórz Gemini ↗</a><a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer">Otwórz ChatGPT ↗</a></div>
    {message&&<p role="status" className="sl-manual-status">{message}</p>}
    <div className="sl-manual-instructions"><h3>Co zrobić z gotowym materiałem?</h3><p><strong>Wynik PDF:</strong> wgraj go powyżej do biblioteki jako „Wykład / notatki PDF” lub „Podręcznik”. PDF zachowa własny wygląd — StudyLab nie przemaluje automatycznie jego wnętrza. Aby otrzymać ciemny PDF, poproś AI, by wygenerowało go od razu w stylu BLACK.</p><p><strong>Wynik Markdown:</strong> wklej do edytora „Dodaj do StudyLab” poniżej. W kursie z podręcznika możesz ręcznie dodać kolejne rozdziały bez wywoływania API. Przed publikacją sprawdź wzory i kompilację MDX.</p><p><strong>Duże książki:</strong> możesz przechowywać jeden pełny PDF, ale opracowuj go mniejszymi partiami. Każdy wygenerowany rozdział dodawaj do osobnego kursu; nie mieszaj go z wykładami.</p></div>
  </section>;
}
