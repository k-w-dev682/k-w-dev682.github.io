/** Public, non-secret StudyLab design/content contract. Used by the style page and the local Gemini bridge. */
export const STYLE_VERSION = '18.1';
export const STYLE_TOKENS = Object.freeze({
  theme: 'StudyLab BLACK Edition',
  framework: 'Astro 7 + Starlight + React; Markdown/MDX and KaTeX',
  fonts: {
    body: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
    code: "'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
  },
  colors: {
    background: '#000000',
    navigation: '#060709',
    sidebar: '#050607',
    surface: '#070707',
    card: '#0B0B0B',
    cardBorder: '#292929',
    accent: '#5ce2d1',
    homeAccent: '#76E2D1',
    accentHigh: '#c8fff6',
    text: '#eaf2f7',
    muted: '#A5ADB3',
    codeBackground: '#111923',
  },
  layout: {
    contentWidth: '52rem', sidebarWidth: '18rem', homeMaxWidth: '1200px',
    cardRadius: '14px', homeHeroRadius: '20px', bodyLineHeight: '1.78',
    homeColumns: '3 / 2 / 1 kolumny dla desktop / tablet / mobile',
  },
  subjects: [
    {name:'Programowanie C++',color:'#76E2D1'},
    {name:'Matematyka I',color:'#BEADFF'},
    {name:'Matematyka II',color:'#D9B3F7'},
    {name:'Architektura systemów komputerowych',color:'#A1DDB3'},
    {name:'Fizyka dla informatyków',color:'#98CFFF'},
    {name:'Podstawy elektroniki',color:'#F5C891'},
  ],
});

/** Inserted into the existing Gemini /format prompt. No CSS, JSX or private API keys are sent. */
export const STUDYLAB_GEMINI_STYLE = [
  'STANDARD STUDYLAB BLACK EDITION — STOSUJ OBOWIĄZKOWO:',
  'Przygotuj polską, dydaktyczną lekcję przeznaczoną dla osoby, która zaczyna temat od zera.',
  'Zwróć WYŁĄCZNIE treść Markdown zgodną z MDX używanym w Astro/Starlight, bez frontmatter, bez pierwszego nagłówka #, bez JSX, HTML, skryptów i nieznanych komponentów. Wygląd zapewnia istniejący CSS StudyLab: nie dodawaj inline style, kolorów ani własnych klas.',
  'Sugerowany porządek: ## O co chodzi? → ## Co trzeba wiedzieć? → ## Definicje i oznaczenia → ## Dlaczego to działa? → ## Przykład krok po kroku → ## Typowe błędy → ## Zadania od podstaw do trudniejszych → ## Podsumowanie. Dopasuj działy do treści; nie wstawiaj pustych sekcji.',
  'Każdy symbol matematyczny wyjaśnij przy pierwszym użyciu. Rozbij trudne rozumowanie na czytelne etapy i pokaż rzeczywiste podstawienia liczb.',
  'Formuły: $...$ w tekście oraz $$...$$ w osobnych liniach. Zamiast / we wzorach stosuj tam, gdzie ma to sens, poziomą kreskę ułamkową: \\frac{licznik}{mianownik} lub \\dfrac{licznik}{mianownik}; zachowuj nawiasy i jednoznaczność. Dla indeksów ^ i _, pierwiastków \\sqrt{}, symbolu Newtona \\binom{n}{k}, układów równań i jednostek używaj poprawnego KaTeX. Kod C++ pozostaw w blokach ```cpp; nigdy nie zmieniaj operatora / w kodzie.',
  'Nie upraszczaj tekstu kosztem prawidłowości i nie pomijaj ważnych uwag, diagramów czy marginesów ze źródła. Rozróżniaj wiedzę pochodzącą ze źródła i nowe objaśnienia.',
  'Jeżeli w źródle są niejasności, błędy lub brakujące fragmenty, dodaj ## Do weryfikacji z lokalizacją (np. numer strony); niczego nie odgaduj z pewnością.',
  'Zadania mają mieć sensowną progresję, poprawne wyniki i pełne rozwiązania po próbie samodzielnej pracy; nie generuj zadań na wyrost, jeśli źródło nie obejmuje potrzebnych pojęć.',
  'Nie ujawniaj kluczy API, nie twórz automatycznie plików i nie wykonuj operacji na repozytorium; oddaj tylko materiał gotowy do sprawdzenia przez użytkownika.',
].join('\n');

export const STUDYLAB_MDX_EXAMPLE = String.raw`---
title: "Przykładowa lekcja — tytuł tematu"
description: "Od podstaw: definicje, wyjaśnienia i zadania"
---

## O co chodzi?

Wyjaśnij zagadnienie najprostszym możliwym językiem. Zacznij od intuicji.

## Co oznaczają symbole?

- $n$ — liczba rozważanych elementów.
- $k$ — indeks lub licznik, którego rolę należy wyjaśnić.

## Przykład krok po kroku

Suma pierwszych $n$ liczb naturalnych:

$$
1+2+\ldots+n=\frac{n(n+1)}{2}
$$

Dla $n=5$:

$$
\frac{5(5+1)}{2}=\frac{5\cdot 6}{2}=15
$$

Wyjaśnij, dlaczego wolno wykonać każdy krok.

## Typowe błędy

Nie pomijaj nawiasów w ułamkach i zapisuj jednoznaczne wzory.

## Sprawdź się

Spróbuj samodzielnie obliczyć sumę liczb od 1 do 10 przed sprawdzeniem wyniku.

## Do weryfikacji

Wymień fragmenty źródła nieczytelne lub niepewne. Usuń sekcję, jeżeli nic takiego nie wystąpiło.
`;
