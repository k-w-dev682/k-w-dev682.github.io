# StudyLab BLACK Edition — specyfikacja generowania notatek

W repozytorium istnieje jedna, wspólna specyfikacja wyglądu i notatek:

- Strona: `src/content/docs/o-studylab/specyfikacja.mdx` (link w lewym menu i na stronie głównej).
- Dane stylu: `src/lib/studylab-style-guide.mjs` oraz eksport `public/studylab-design-system.json`.
- Gotowe instrukcje dla AI: `public/studylab-gemini-guide.txt`.
- Wzorzec lekcji MDX: `public/studylab-mdx-szablon.mdx`.
- Referencyjna kopia wszystkich arkuszy CSS: `public/studylab-style-source.css` (migawka wykonana podczas instalacji).

## Dla Gemini / dowolnego modelu AI

1. Najpierw przeczytaj specyfikację, nie wymyślaj nowych kolorów i nie duplikuj CSS w treści.
2. Twórz tylko Markdown/MDX z KaTeX; nie dodawaj JSX, HTML, JavaScript ani frontmatter podczas lokalnego formatowania PDF (eksporter dołącza frontmatter).
3. Każdą literę we wzorze wyjaśniaj; pokazuj działanie formuł i pełne podstawienia.
4. Zapisz ułamki kreskowe `\\frac{...}{...}` zamiast niejednoznacznego ukośnika, ale nie ingeruj w kod C++.
5. Przedstawiaj poprawne, progresywne ćwiczenia i wyraźnie oznaczaj niepewne źródła.
6. Nie dotykaj `.env`, sekretów ani kont użytkownika. Nigdy nie publikuj klucza Gemini.

Interfejs generowania PDF w StudyLab 17.2+ korzysta z tego standardu automatycznie po aktualizacji serwera lokalnego. Po instalacji uruchom ponownie `tools/Start-StudyLab-AI.bat`.
