import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://k-w-dev682.github.io',

  integrations: [
    starlight({
      // StudyLab Centrum nauki v2.
      head: [
        { tag: 'script', attrs: { src: '/study-center-lesson-bridge.js', defer: true } },
        { tag: 'script', attrs: { src: '/studylab-ai-lesson.js', defer: true } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: '/studylab-ai-lesson.css' } },
        { tag: 'script', attrs: { src: '/study-center-annotations.js', defer: true } },
        { tag: 'script', attrs: { src: '/studylab-lesson-72.js', defer: true } },
        { tag: 'script', attrs: { src: '/studylab-studytime-72.js', defer: true } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: '/studylab-lesson-72.css' } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: '/study-center-lesson-tools.css' } },
        { tag: 'link', attrs: { rel: 'manifest', href: '/study-center-manifest.webmanifest' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#090c0b' } },
      ],
      title: 'StudyLab',

      customCss: ['./src/styles/custom.css'],

      sidebar: [
        { label: 'Centrum nauki', slug: 'centrum-nauki' },
        { label: 'Materiały importowane', slug: 'materialy-importowane' },
        { label: 'Specyfikacja StudyLab', slug: 'o-studylab/specyfikacja' },
  {
    label: "Programowanie C++",
    collapsed: true,
    items: [
      {
        label: 'Wykład 1 — podstawy programowania i algorytmów',
        collapsed: true,
        items: [
          { label: 'Przewodnik wykładu', slug: 'programowanie/wyklad-1/start' },
          { label: 'Informacja i programowanie', slug: 'programowanie/wyklad-1/informacja-i-programowanie' },
          { label: 'Akcje i abstrakcja', slug: 'programowanie/wyklad-1/akcje-i-abstrakcja' },
          { label: 'Algorytm i jego własności', slug: 'programowanie/wyklad-1/algorytmy-i-poprawnosc' },
          { label: 'Od problemu do programu', slug: 'programowanie/wyklad-1/od-problemu-do-programu' },
          { label: 'Komputer i pamięć', slug: 'programowanie/wyklad-1/komputer-i-pamiec' },
          { label: 'Bity i kodowanie znaków', slug: 'programowanie/wyklad-1/kodowanie-znakow' },
          { label: 'Języki programowania', slug: 'programowanie/wyklad-1/jezyki-programowania' },
          { label: 'Kompilacja i interpretacja', slug: 'programowanie/wyklad-1/kompilacja-i-interpretacja' },
          { label: 'Schematy blokowe', slug: 'programowanie/wyklad-1/schematy-blokowe' },
          { label: 'Zadania i sprawdzian', slug: 'programowanie/wyklad-1/zadania' }
        ]
      },
      {
        label: 'Skrypt — Rozdział 5: instrukcje C++',
        collapsed: true,
        items: [
          { label: 'Przewodnik po rozdziale', slug: 'programowanie/skrypt-r5/start' },
          { label: 'Przypisanie i bloki', slug: 'programowanie/skrypt-r5/przypisanie-i-bloki' },
          { label: 'if, else i ?:', slug: 'programowanie/skrypt-r5/if-i-operator-warunkowy' },
          { label: 'Instrukcja switch', slug: 'programowanie/skrypt-r5/switch' },
          { label: 'Petla for', slug: 'programowanie/skrypt-r5/petla-for' },
          { label: 'while i do...while', slug: 'programowanie/skrypt-r5/while-do-while' },
          { label: 'break, continue i goto', slug: 'programowanie/skrypt-r5/skoki' },
          { label: 'Przyklady prowadzone', slug: 'programowanie/skrypt-r5/przyklady' },
          { label: 'Bank 45 zadan', slug: 'programowanie/skrypt-r5/zadania' }
        ]
      },
      { label: "Moje notatki (prywatne)", slug: "moje-notatki/programowanie" },
      { label: "Moje książki (prywatne)", slug: "moje-ksiazki/programowanie" },
      {"label": "Dane, funkcje i pamięć", "collapsed": true, "items": [{"label": "Tablice — wiele wartości pod jedną nazwą", "slug": "programowanie/tablice"}, {"label": "Funkcje — parametry, wynik i wywołanie", "slug": "programowanie/funkcje"}, {"label": "Referencje — druga nazwa tego samego obiektu", "slug": "programowanie/referencje"}, {"label": "Wskaźniki, adresy i czas życia pamięci", "slug": "programowanie/wskazniki-pamiec"}]},
      {
        label: "Spis treści",
        slug: "programowanie/spis-tresci"
      },
      {
        label: "Wprowadzenie",
        slug: "programowanie/wstep"
      },
      {
        label: "Na początek",
        collapsed: true,
        items: [
          {
            label: "Kompilacja, linkowanie i błędy",
            slug: "programowanie/kompilacja"
          },
          {
            label: "Code::Blocks i pliki projektu",
            slug: "programowanie/codeblocks"
          },
          {
            label: "Zmienne, inicjalizacja i `int`",
            slug: "programowanie/zmienne"
          },
          {
            label: "Wejście `cin` i wyjście `cout`",
            slug: "programowanie/wejscie-wyjscie"
          },
          {
            label: "Operatory i instrukcja `if`",
            slug: "programowanie/operatory-warunki"
          },
          {
            label: "Pseudokod i schematy blokowe",
            slug: "programowanie/pseudokod"
          }
        ]
      },
      {
        label: "Pętle i algorytmy",
        collapsed: true,
        items: [
          {
            label: "Pętle — wybierz temat",
            slug: "programowanie/petle"
          },
          {
            label: "Pętla `for` — znana liczba powtórzeń",
            slug: "programowanie/petla-for"
          },
          {
            label: "Pętla while krok po kroku",
            slug: "programowanie/petla-while"
          },
          {
            label: "Pętle zagnieżdżone",
            slug: "programowanie/petle-zagniezdzone"
          },
          {
            label: "Mnożenie bez operatora `*`",
            slug: "programowanie/mnozenie-dodawaniem"
          },
          {
            label: "Potęgowanie przez pętlę",
            slug: "programowanie/potegowanie"
          },
          {
            label: "Liczby pseudolosowe i przedziały",
            slug: "programowanie/losowanie"
          },
          {
            label: "Sumowanie w pętli",
            slug: "programowanie/stoper"
          }
        ]
      },
      {
        label: "Testowanie",
        collapsed: true,
        items: [
          {
            label: "Jak testować program?",
            slug: "programowanie/testowanie"
          },
          {
            label: "Debugger: praca krok po kroku",
            slug: "programowanie/debugger"
          },
          {
            label: "Bank zadań — algorytmy i debugger",
            slug: "programowanie/zadania-algorytmy"
          }
        ]
      },
      {
        label: "Liczby i pamięć",
        collapsed: true,
        items: [
          {
            label: "Liczby zmiennoprzecinkowe — mapa",
            slug: "programowanie/liczby-zmiennoprzecinkowe"
          },
          {
            label: "Typy float i double",
            slug: "programowanie/float-double"
          },
          {
            label: "Zapis pozycyjny i potęgi podstawy",
            slug: "programowanie/zapis-pozycyjny"
          },
          {
            label: "Ułamki binarne: skąd błędy?",
            slug: "programowanie/ulamki-binarne"
          },
          {
            label: "IEEE 754: zapis liczby w bitach",
            slug: "programowanie/ieee754"
          },
          {
            label: "Przekroczenie zakresu i wartości specjalne",
            slug: "programowanie/overflow"
          },
          {
            label: "Błędy zaokrągleń",
            slug: "programowanie/bledy-obliczen"
          },
          {
            label: "Jak bezpieczniej porównywać `double`",
            slug: "programowanie/porownanie-float"
          },
          {
            label: "Typy i konwersje: `int` kontra `double`",
            slug: "programowanie/rzutowanie"
          },
          {
            label: "`setprecision` i formatowanie wyniku",
            slug: "programowanie/formatowanie"
          },
          {
            label: "Biblioteka `<cmath>` i funkcje matematyczne",
            slug: "programowanie/cmath"
          },
          {
            label: "Bank zadań — liczby rzeczywiste",
            slug: "programowanie/zadania-float"
          }
        ]
      },
      {
        label: "Znaki i tekst",
        collapsed: true,
        items: [
          {
            label: "Znaki i napisy — wprowadzenie",
            slug: "programowanie/znaki-i-napisy"
          },
          {
            label: "`char` i ASCII — pojedynczy znak",
            slug: "programowanie/char-ascii"
          },
          {
            label: "Wczytywanie pojedynczego znaku",
            slug: "programowanie/wczytywanie-char"
          },
          {
            label: "`std::string` — napisy",
            slug: "programowanie/string-podstawy"
          },
          {
            label: "`getline` i napisy ze spacjami",
            slug: "programowanie/getline"
          },
          {
            label: "Indeksowanie napisu — pierwszy znak ma numer 0",
            slug: "programowanie/indeksy-string"
          },
          {
            label: "Najważniejsze metody string",
            slug: "programowanie/metody-string"
          },
          {
            label: "Konwersja napisu na liczbę",
            slug: "programowanie/konwersja-napisow"
          },
          {
            label: "Zliczanie liter, cyfr i innych znaków",
            slug: "programowanie/analiza-tekstu"
          },
          {
            label: "Palindrom i odwracanie napisu",
            slug: "programowanie/palindrom"
          },
          {
            label: "Szyfr Cezara i metoda płotu",
            slug: "programowanie/szyfr"
          },
          {
            label: "Bank zadań — znaki i `string`",
            slug: "programowanie/zadania-string"
          }
        ]
      },
      {
        label: "Zadania i laboratoria",
        collapsed: true,
        items: [
          {
            label: "Bank zadań — podstawy i pętle",
            slug: "programowanie/zadania-podstawy"
          },
          {
            label: "Laboratorium C++ — 11 symulatorów",
            slug: "programowanie/laboratorium"
          }
        ]
      },
      {
        label: "Materiały pomocnicze",
        collapsed: true,
        items: [
          {
            label: "Eksport PDF",
            slug: "programowanie/eksport"
          }
        ]
      },
      {
        label: "Pozostałe tematy",
        collapsed: true,
        items: [
          {
            label: "programowanie",
            slug: "programowanie/programowanie"
          }
        ]
      }
    ]
  },
  {
    label: "Matematyka I",
    collapsed: true,
    items: [
      { label: "Moje notatki (prywatne)", slug: "moje-notatki/matematyka-i" },
      { label: "Moje książki (prywatne)", slug: "moje-ksiazki/matematyka-i" },
      {
        label: "Spis treści",
        slug: "matematyka/matematyka-i/spis-tresci"
      },
      {
        label: "Wprowadzenie",
        slug: "matematyka/matematyka-i/wstep"
      },
      {
        label: "Wykłady",
        slug: "matematyka/matematyka-i/wyklady"
      },
      {
        label: "Ćwiczenia",
        slug: "matematyka/matematyka-i/cwiczenia"
      },
      {
        label: "Logika matematyczna",
        collapsed: true,
        items: [
          {
            label: "Zdania i spójniki logiczne",
            slug: "matematyka/matematyka-i/zdania-i-spojniki"
          },
          {
            label: "Implikacja i równoważność",
            slug: "matematyka/matematyka-i/implikacja"
          },
          {
            label: "Prawa logiczne i prawa de Morgana",
            slug: "matematyka/matematyka-i/prawa-logiczne"
          },
          {
            label: "Tabele prawdy od podstaw",
            slug: "matematyka/matematyka-i/tabele-prawdy"
          },
          {
            label: "Kwantyfikatory",
            slug: "matematyka/matematyka-i/kwantyfikatory"
          },
          {
            label: "Ćwiczenia z logiki",
            slug: "matematyka/matematyka-i/cw-logika"
          }
        ]
      },
      {
        label: "Zbiory i relacje",
        collapsed: true,
        items: [
          {
            label: "Zbiory, element, podzbiór i zbiory liczbowe",
            slug: "matematyka/matematyka-i/zbiory"
          },
          {
            label: "Suma, przecięcie, różnica i dopełnienie zbiorów",
            slug: "matematyka/matematyka-i/dzialania-na-zbiorach"
          },
          {
            label: "Przedziały i nierówności z wartością bezwzględną",
            slug: "matematyka/matematyka-i/przedzialy"
          },
          {
            label: "Wartość bezwzględna, otoczenie i sąsiedztwo",
            slug: "matematyka/matematyka-i/wartosc-bezwzgledna"
          },
          {
            label: "Relacje i ich własności",
            slug: "matematyka/matematyka-i/relacje"
          },
          {
            label: "Dowody dotyczące zbiorów",
            slug: "matematyka/matematyka-i/dowody-zbiorowe"
          },
          {
            label: "Ćwiczenia ze zbiorów",
            slug: "matematyka/matematyka-i/cw-zbiory"
          }
        ]
      },
      {
        label: "Funkcje",
        collapsed: true,
        items: [
          {
            label: "Funkcja, dziedzina, przeciwdziedzina i obraz",
            slug: "matematyka/matematyka-i/funkcje"
          },
          {
            label: "Własności funkcji",
            slug: "matematyka/matematyka-i/wlasnosci-funkcji"
          },
          {
            label: "Funkcje elementarne",
            slug: "matematyka/matematyka-i/funkcje-elementarne"
          },
          {
            label: "Funkcja odwrotna — podstawy",
            slug: "matematyka/matematyka-i/funkcje-odwrotne"
          },
          {
            label: "Ćwiczenia: funkcja odwrotna",
            slug: "matematyka/matematyka-i/cw-odwrotne"
          }
        ]
      },
      {
        label: "Dziedziny funkcji",
        collapsed: true,
        items: [
          {
            label: "Jak wyznaczać dziedzinę funkcji",
            slug: "matematyka/matematyka-i/dziedzina-zasady"
          },
          {
            label: "Ćwiczenia: dziedzina (a–d)",
            slug: "matematyka/matematyka-i/cw-dziedzina-1"
          },
          {
            label: "Ćwiczenia: dziedzina (e–g)",
            slug: "matematyka/matematyka-i/cw-dziedzina-2"
          },
          {
            label: "Ćwiczenia: trudniejsze dziedziny",
            slug: "matematyka/matematyka-i/cw-dziedzina-3"
          }
        ]
      },
      {
        label: "Ćwiczenia i zadania domowe",
        collapsed: true,
        items: [
          {
            label: "Zadanie domowe: funkcja odwrotna",
            slug: "matematyka/matematyka-i/praca-domowa"
          }
        ]
      },
      {
        label: "Materiały pomocnicze",
        collapsed: true,
        items: [
          {
            label: "Karta wzorów",
            slug: "matematyka/matematyka-i/karta-wzorow"
          },
          {
            label: "Słownik symboli",
            slug: "matematyka/matematyka-i/symbole"
          },
          {
            label: "Niejasności",
            slug: "matematyka/matematyka-i/niejasnosci"
          },
          {
            label: "Eksport PDF",
            slug: "matematyka/matematyka-i/eksport"
          }
        ]
      }
    ]
  },
  {
    label: "Matematyka II",
    collapsed: true,
    items: [
      { label: "Moje notatki (prywatne)", slug: "moje-notatki/matematyka-ii" },
      { label: "Moje książki (prywatne)", slug: "moje-ksiazki/matematyka-ii" },
      {
        label: "Spis treści",
        slug: "matematyka/matematyka-ii/spis-tresci"
      },
      {
        label: "Wprowadzenie",
        slug: "matematyka/matematyka-ii/wstep"
      },
      {
        label: "Wykłady",
        slug: "matematyka/matematyka-ii/wyklady"
      },
      {
        label: "Ćwiczenia",
        slug: "matematyka/matematyka-ii/cwiczenia"
      },
      {
        label: "Podstawy i ciągi",
        collapsed: true,
        items: [
          {
            label: "Słownik symboli matematycznych",
            slug: "matematyka/matematyka-ii/symbole"
          },
          {
            label: "Liczby naturalne — aksjomaty Peana",
            slug: "matematyka/matematyka-ii/aksjomaty-peana"
          },
          {
            label: "Ciągi: wyraz jawny i rekurencja",
            slug: "matematyka/matematyka-ii/ciagi"
          },
          {
            label: "Sigma — zapis sumy",
            slug: "matematyka/matematyka-ii/sigma"
          },
          {
            label: "Silnia",
            slug: "matematyka/matematyka-ii/silnia"
          }
        ]
      },
      {
        label: "Zbiory i funkcje",
        collapsed: true,
        items: [
          {
            label: "Zbiory liczbowe: element i podzbiór",
            slug: "matematyka/matematyka-ii/zbiory-podstawy"
          },
          {
            label: "Suma, część wspólna i różnica zbiorów",
            slug: "matematyka/matematyka-ii/dzialania-na-zbiorach"
          },
          {
            label: "Zbiór potęgowy",
            slug: "matematyka/matematyka-ii/zbior-potegowy"
          },
          {
            label: "Iloczyn kartezjański",
            slug: "matematyka/matematyka-ii/iloczyn-kartezjanski"
          },
          {
            label: "Funkcje różnowartościowe",
            slug: "matematyka/matematyka-ii/funkcje-roznawartosciowe"
          }
        ]
      },
      {
        label: "Indukcja matematyczna",
        collapsed: true,
        items: [
          {
            label: "Indukcja matematyczna",
            slug: "matematyka/matematyka-ii/indukcja"
          },
          {
            label: "Dowód: 1 + 2 + … + n",
            slug: "matematyka/matematyka-ii/suma-naturalnych"
          }
        ]
      },
      {
        label: "Kombinatoryka",
        collapsed: true,
        items: [
          {
            label: "Reguła mnożenia i wariacje",
            slug: "matematyka/matematyka-ii/regula-mnozenia"
          },
          {
            label: "Symbol Newtona (n po k)",
            slug: "matematyka/matematyka-ii/symbol-newtona"
          },
          {
            label: "Trójkąt Pascala",
            slug: "matematyka/matematyka-ii/pascal"
          },
          {
            label: "Dwumian Newtona",
            slug: "matematyka/matematyka-ii/dwumian-newtona"
          },
          {
            label: "Dowód dwumianu Newtona",
            slug: "matematyka/matematyka-ii/dowod-dwumianu"
          },
          {
            label: "Multizbiory i kombinacje z powtórzeniami",
            slug: "matematyka/matematyka-ii/multizbiory"
          },
          {
            label: "Iniekcja, suriekcja i bijekcja",
            slug: "matematyka/matematyka-ii/funkcje-iniekcja-suriekcja"
          },
          {
            label: "Wariacje bez powtórzeń — rozszerzenie",
            slug: "matematyka/matematyka-ii/wariacje-bez-powtorzen-rozszerzenie"
          },
          {
            label: "Permutacje bez powtórzeń",
            slug: "matematyka/matematyka-ii/permutacje-bez-powtorzen"
          },
          {
            label: "Kombinacje bez powtórzeń — rozszerzenie",
            slug: "matematyka/matematyka-ii/kombinacje-bez-powtorzen-rozszerzenie"
          },
          {
            label: "Zastosowania kombinatoryki",
            slug: "matematyka/matematyka-ii/zastosowania-kombinatoryki"
          }
        ]
      },
      {
        label: "Ćwiczenia — dowody",
        collapsed: true,
        items: [
          {
            label: "Ćwiczenia z indukcji — zadanie a–e",
            slug: "matematyka/matematyka-ii/zadanie-indukcja"
          },
          {
            label: "Ćwiczenie a: suma kwadratów",
            slug: "matematyka/matematyka-ii/cw-suma-kwadratow"
          },
          {
            label: "Ćwiczenie b: suma sześcianów",
            slug: "matematyka/matematyka-ii/cw-suma-szescianow"
          },
          {
            label: "Ćwiczenie c: suma geometryczna",
            slug: "matematyka/matematyka-ii/cw-geometryczny"
          },
          {
            label: "Ćwiczenie d: suma naprzemienna",
            slug: "matematyka/matematyka-ii/cw-naprzemienne"
          },
          {
            label: "Ćwiczenie e: suma sinusów",
            slug: "matematyka/matematyka-ii/cw-sinusy"
          },
          {
            label: "Indukcja — nowe przykłady dowodów",
            slug: "matematyka/matematyka-ii/indukcja-przyklady-2"
          }
        ]
      },
      {
        label: "Materiały pomocnicze",
        collapsed: true,
        items: [
          {
            label: "Karta wzorów",
            slug: "matematyka/matematyka-ii/karta-wzorow"
          },
          {
            label: "Eksport PDF",
            slug: "matematyka/matematyka-ii/eksport"
          }
        ]
      }
    ]
  },
  {
    label: "Fizyka dla informatyków",
    collapsed: true,
    items: [
      {
        label: "Zeszyt — płyny, siły i grawitacja",
        collapsed: true,
        items: [
          { label: "Start i mapa materiału", slug: "fizyka/zeszyt-plyny/start" },
          { label: "Praca i energia", slug: "fizyka/zeszyt-plyny/praca-energia" },
          { label: "Opór ośrodka i spadanie", slug: "fizyka/zeszyt-plyny/opor-osrodka" },
          { label: "Ciśnienie i hydrostatyka", slug: "fizyka/zeszyt-plyny/cisnienie-hydrostatyka" },
          { label: "Prawo Pascala i Archimedesa", slug: "fizyka/zeszyt-plyny/pascal-archimedes" },
          { label: "Lepkość dynamiczna i kinematyczna", slug: "fizyka/zeszyt-plyny/lepkosc" },
          { label: "Przepływy i liczba Reynoldsa", slug: "fizyka/zeszyt-plyny/rodzaje-przeplywu" },
          { label: "Równanie ciągłości", slug: "fizyka/zeszyt-plyny/ciaglosc" },
          { label: "Równanie Bernoulliego", slug: "fizyka/zeszyt-plyny/bernoulli" },
          { label: "Równanie Naviera–Stokesa", slug: "fizyka/zeszyt-plyny/navier-stokes" },
          { label: "Oddziaływania fundamentalne", slug: "fizyka/zeszyt-plyny/oddzialywania" },
          { label: "Grawitacja Newtona", slug: "fizyka/zeszyt-plyny/grawitacja-newtona" },
          { label: "6 przykładów krok po kroku", slug: "fizyka/zeszyt-plyny/przyklady" },
          { label: "30 zadań z odpowiedziami", slug: "fizyka/zeszyt-plyny/zadania" },
          { label: "Niepewności i poprawki", slug: "fizyka/zeszyt-plyny/niepewnosci" }
        ]
      },
      { label: "Moje notatki (prywatne)", slug: "moje-notatki/fizyka" },
      { label: "Moje książki (prywatne)", slug: "moje-ksiazki/fizyka" },
      {
        label: "Spis treści",
        slug: "fizyka/spis-tresci"
      },
      {
        label: "Wprowadzenie",
        slug: "fizyka/wstep"
      },
      {
        label: "Podstawy mechaniki",
        collapsed: true,
        items: [
          {
            label: "Jednostki SI i wektory",
            slug: "fizyka/jednostki-wektory"
          },
          {
            label: "Droga i przemieszczenie",
            slug: "fizyka/polozenie-droga"
          },
          {
            label: "Prędkość",
            slug: "fizyka/predkosc"
          },
          {
            label: "Przyspieszenie",
            slug: "fizyka/przyspieszenie"
          }
        ]
      },
      {
        label: "Ruch i wykresy",
        collapsed: true,
        items: [
          {
            label: "Ruch jednostajny prostoliniowy",
            slug: "fizyka/ruch-jednostajny"
          },
          {
            label: "Ruch jednostajnie przyspieszony",
            slug: "fizyka/ruch-przyspieszony"
          },
          {
            label: "Wykresy ruchu: x(t), v(t), a(t)",
            slug: "fizyka/wykresy-ruchu"
          }
        ]
      },
      {
        label: "Ruch w dwóch wymiarach",
        collapsed: true,
        items: [
          {
            label: "Wektory w dwóch wymiarach",
            slug: "fizyka/wektory-2d"
          },
          {
            label: "Rzut ukośny — równania i tor",
            slug: "fizyka/rzut-ukosny"
          },
          {
            label: "Rzut ukośny: czas i zasięg",
            slug: "fizyka/rzut-maksimum"
          },
          {
            label: "Ruch jednostajny po okręgu",
            slug: "fizyka/okrag"
          },
          {
            label: "Siła dośrodkowa",
            slug: "fizyka/dosrodkowe"
          }
        ]
      },
      {
        label: "Siły i zasady Newtona",
        collapsed: true,
        items: [
          {
            label: "Siła i zasady Newtona",
            slug: "fizyka/sila-i-newton"
          },
          {
            label: "I zasada Newtona",
            slug: "fizyka/pierwsza-zasada"
          },
          {
            label: "II zasada Newtona",
            slug: "fizyka/druga-zasada"
          },
          {
            label: "III zasada Newtona",
            slug: "fizyka/trzecia-zasada"
          },
          {
            label: "Siła ciężkości",
            slug: "fizyka/grawitacja"
          },
          {
            label: "Siła normalna (reakcja podłoża)",
            slug: "fizyka/sila-normalna"
          },
          {
            label: "Siła naciągu nici",
            slug: "fizyka/napiecie-nici"
          },
          {
            label: "Tarcie statyczne i kinetyczne",
            slug: "fizyka/tarcie"
          },
          {
            label: "Jak rozrysować siły?",
            slug: "fizyka/metoda-sil"
          }
        ]
      },
      {
        label: "Pęd i ruch obrotowy",
        collapsed: true,
        items: [
          {
            label: "Pęd i jego jednostka",
            slug: "fizyka/ped"
          },
          {
            label: "Zasada zachowania pędu",
            slug: "fizyka/zasada-pedu"
          },
          {
            label: "Moment pędu punktu materialnego",
            slug: "fizyka/moment-pedu"
          },
          {
            label: "Moment bezwładności",
            slug: "fizyka/moment-bezwladnosci"
          },
          {
            label: "Moment siły i równowaga obrotowa",
            slug: "fizyka/moment-sily"
          }
        ]
      },
      {
        label: "Ćwiczenia",
        collapsed: true,
        items: [
          {
            label: "Ćwiczenia: ruch prostoliniowy",
            slug: "fizyka/cw-kinematyka"
          },
          {
            label: "Ćwiczenia: rzut ukośny",
            slug: "fizyka/cw-rzut"
          },
          {
            label: "Ćwiczenia: ruch po okręgu",
            slug: "fizyka/cw-ruch-okrag"
          },
          {
            label: "Ćwiczenia: równania Newtona",
            slug: "fizyka/cw-dynamika"
          },
          {
            label: "Ćwiczenie: układ trzech mas",
            slug: "fizyka/cw-uklad-mas"
          }
        ]
      },
      {
        label: "Materiały pomocnicze",
        collapsed: true,
        items: [
          {
            label: "Karta wzorów",
            slug: "fizyka/karta-wzorow"
          },
          {
            label: "Niejasności",
            slug: "fizyka/niejasnosci"
          },
          {
            label: "Eksport PDF",
            slug: "fizyka/eksport"
          }
        ]
      }
    ]
  },
  {
    label: "Podstawy elektroniki",
    collapsed: true,
    items: [
      {
        label: "Zeszyt — obwody i elementy",
        collapsed: true,
        items: [
          { label: "Start i mapa tematów", slug: "elektronika/zeszyt-obwody/start" },
          { label: "Prąd i gęstość prądu", slug: "elektronika/zeszyt-obwody/prad-i-ladunek" },
          { label: "Opór i właściwości materiału", slug: "elektronika/zeszyt-obwody/opor-i-materialy" },
          { label: "Prawo Ohma i rezystory", slug: "elektronika/zeszyt-obwody/prawo-ohma-rezystory" },
          { label: "Praca, energia i moc", slug: "elektronika/zeszyt-obwody/energia-i-moc" },
          { label: "Podział elementów", slug: "elektronika/zeszyt-obwody/podzial-elementow" },
          { label: "Cewka i indukcyjność", slug: "elektronika/zeszyt-obwody/cewka-indukcyjnosc" },
          { label: "Prawo Faradaya i samoindukcja", slug: "elektronika/zeszyt-obwody/faraday-samoindukcja" },
          { label: "Energia i łączenie cewek", slug: "elektronika/zeszyt-obwody/energia-polaczenia-cewek" },
          { label: "Kondensator i RLC", slug: "elektronika/zeszyt-obwody/kondensator-rlc" },
          { label: "Przykłady krok po kroku", slug: "elektronika/zeszyt-obwody/przyklady" },
          { label: "30 zadań z odpowiedziami", slug: "elektronika/zeszyt-obwody/zadania" },
          { label: "Niepewności i uzupełnienia", slug: "elektronika/zeszyt-obwody/niepewnosci" }
        ]
      },
      { label: "Moje notatki (prywatne)", slug: "moje-notatki/elektronika" },
      { label: "Moje książki (prywatne)", slug: "moje-ksiazki/elektronika" },
      {
        label: "Spis treści",
        slug: "elektronika/spis-tresci"
      },
      {
        label: "Wprowadzenie",
        slug: "elektronika/wstep"
      },
      {
        label: "Podstawy i ładunki",
        collapsed: true,
        items: [
          {
            label: "Symbole i jednostki",
            slug: "elektronika/symbole-i-jednostki"
          },
          {
            label: "Ładunek elektryczny: dodatni i ujemny",
            slug: "elektronika/ladunek"
          },
          {
            label: "Prawo Coulomba",
            slug: "elektronika/prawo-coulomba"
          },
          {
            label: "Zasada superpozycji",
            slug: "elektronika/superpozycja"
          }
        ]
      },
      {
        label: "Pole elektryczne",
        collapsed: true,
        items: [
          {
            label: "Natężenie pola elektrycznego",
            slug: "elektronika/pole-elektryczne"
          },
          {
            label: "Linie pola elektrycznego",
            slug: "elektronika/linie-pola"
          },
          {
            label: "Strumień pola",
            slug: "elektronika/strumien-pola"
          },
          {
            label: "Prawo Gaussa",
            slug: "elektronika/prawo-gaussa"
          }
        ]
      },
      {
        label: "Energia, potencjał, napięcie",
        collapsed: true,
        items: [
          {
            label: "Energia potencjalna ładunku",
            slug: "elektronika/energia-potencjalna"
          },
          {
            label: "Potencjał elektryczny",
            slug: "elektronika/potencjal"
          },
          {
            label: "Napięcie elektryczne",
            slug: "elektronika/napiecie"
          },
          {
            label: "Potencjał a natężenie pola",
            slug: "elektronika/gradient"
          }
        ]
      },
      {
        label: "Kondensatory",
        collapsed: true,
        items: [
          {
            label: "Budowa kondensatora",
            slug: "elektronika/kondensator"
          },
          {
            label: "Pojemność kondensatora płaskiego",
            slug: "elektronika/pojemnosc-plytkowego"
          },
          {
            label: "Dielektryki",
            slug: "elektronika/dielektryki"
          },
          {
            label: "Kondensatory szeregowo",
            slug: "elektronika/lacznie-szeregowe"
          },
          {
            label: "Kondensatory równolegle",
            slug: "elektronika/lacznie-rownolegle"
          },
          {
            label: "Energia kondensatora",
            slug: "elektronika/energia-kondensatora"
          },
          {
            label: "Prąd kondensatora",
            slug: "elektronika/prad-kondensatora"
          }
        ]
      },
      {
        label: "Pomiary i ćwiczenia",
        collapsed: true,
        items: [
          {
            label: "Przyrządy i pomiary",
            slug: "elektronika/elementy-pomiary"
          },
          {
            label: "Ćwiczenia: ładunki i Coulomb",
            slug: "elektronika/cw-ladunek-coulomb"
          },
          {
            label: "Ćwiczenia: pole i prawo Gaussa",
            slug: "elektronika/cw-pole-gauss"
          },
          {
            label: "Ćwiczenia: potencjał i napięcie",
            slug: "elektronika/cw-potencjal"
          },
          {
            label: "Ćwiczenia: kondensatory",
            slug: "elektronika/cw-kondensatory"
          }
        ]
      },
      {
        label: "Materiały pomocnicze",
        collapsed: true,
        items: [
          {
            label: "Karta wzorów",
            slug: "elektronika/karta-wzorow"
          },
          {
            label: "Niejasności",
            slug: "elektronika/niejasnosci"
          },
          {
            label: "Źródła",
            slug: "elektronika/zrodla"
          },
          {
            label: "Eksport PDF",
            slug: "elektronika/eksport"
          }
        ]
      }
    ]
  },
  {
    label: "Guides",
    collapsed: true,
    items: [
      {
        "autogenerate": {
          "directory": "guides"
        }
      }
    ]
  },
  {
    label: "Reference",
    collapsed: true,
    items: [
      {
        "autogenerate": {
          "directory": "reference"
        }
      }
    ]
  },
        {
          label: "Architektura systemów komputerowych",
          collapsed: true,
          items: [
            { label: "Moje notatki (prywatne)", slug: "moje-notatki/architektura" },
            { label: "Moje książki (prywatne)", slug: "moje-ksiazki/architektura" },
            {
              label: "Start",
              collapsed: true,
              items: [
                {
                  label: "Spis treści",
                  slug: "ask/spis-tresci"
                },
                {
                  slug: "ask/wstep"
                }
              ]
            },
            {
              label: "01 · Systemy liczbowe",
              collapsed: true,
              items: [
                {
                  slug: "ask/bity-bajty"
                },
                {
                  slug: "ask/system-pozycyjny"
                },
                {
                  slug: "ask/dwojkowy-dziesietny"
                },
                {
                  slug: "ask/dziesietny-dwojkowy"
                },
                {
                  slug: "ask/szesnastkowy"
                },
                {
                  slug: "ask/hex-bin"
                },
                {
                  slug: "ask/jednostki-pamieci"
                }
              ]
            },
            {
              label: "02 · Liczby ze znakiem",
              collapsed: true,
              items: [
                {
                  slug: "ask/liczby-ze-znakiem"
                },
                {
                  slug: "ask/zm"
                },
                {
                  slug: "ask/u1"
                },
                {
                  slug: "ask/u2"
                },
                {
                  slug: "ask/porownanie-zm-u1-u2"
                },
                {
                  slug: "ask/dodawanie-u2"
                }
              ]
            },
            {
              label: "03 · Procesor i pamięć",
              collapsed: true,
              items: [
                {
                  slug: "ask/cpu-ogolnie"
                },
                {
                  slug: "ask/cykl-rozkazu"
                },
                {
                  slug: "ask/rejestry-pamiec"
                },
                {
                  slug: "ask/magistrala-cache"
                }
              ]
            },
            {
              label: "04 · Podstawy asemblera",
              collapsed: true,
              items: [
                {
                  slug: "ask/asm-start"
                },
                {
                  slug: "ask/asm-zmienne"
                }
              ]
            },
            {
              label: "05 · Ćwiczenia — laboratorium 1",
              collapsed: true,
              items: [
                {
                  slug: "ask/cw10-2"
                },
                {
                  slug: "ask/cw2-10"
                },
                {
                  slug: "ask/cw16-10"
                },
                {
                  slug: "ask/cw10-16"
                },
                {
                  slug: "ask/cw16-2"
                },
                {
                  slug: "ask/cw2-16"
                }
              ]
            },
            {
              label: "06 · Ćwiczenia — laboratorium 2",
              collapsed: true,
              items: [
                {
                  slug: "ask/cw-zm-zapis"
                },
                {
                  slug: "ask/cw-zm-odczyt"
                },
                {
                  slug: "ask/cw-u1-zapis"
                },
                {
                  slug: "ask/cw-u1-odczyt"
                },
                {
                  slug: "ask/cw-u2-zapis"
                },
                {
                  slug: "ask/cw-u2-odczyt"
                }
              ]
            },
            {
              label: "Narzędzia",
              collapsed: true,
              items: [
                {
                  label: "Eksport PDF",
                  slug: "ask/eksport"
                },
                {
                  label: "Karta pojęć",
                  slug: "ask/karta-pojec"
                },
                {
                  label: "Niejasności",
                  slug: "ask/niejasnosci"
                }
              ]
            }
          ]
        },
        // STUDYLAB-18-4-PRIVATE-NAV: brak publicznego menu książek.
      ],
    }),
    react(),
  ],
});
