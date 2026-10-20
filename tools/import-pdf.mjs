import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Odczyt argumentów z wiersza poleceń
const args = process.argv.slice(2);
const fileArg = args.find(a => a.startsWith('--file='))?.split('=')[1];
const categoryArg = args.find(a => a.startsWith('--kat=') || a.startsWith('--category='))?.split('=')[1] || 'programowanie';
const titleArg = args.find(a => a.startsWith('--title='))?.split('=')[1];

if (!fileArg) {
  console.log(`
❌ Podaj plik PDF do konwersji!

Przykład użycia:
  npm run import-pdf -- --file=notatka.pdf --kat=programowanie --title="Nowa Lekcja"

Dostępne kategorie:
  - programowanie
  - fizyka
  - matematyka/matematyka-i
  - matematyka/matematyka-ii
  - elektronika
  - ask
`);
  process.exit(1);
}

const pdfPath = path.isAbsolute(fileArg) ? fileArg : path.join(PROJECT_ROOT, fileArg);

if (!fs.existsSync(pdfPath)) {
  console.error(`❌ Nie znaleziono pliku PDF pod ścieżką: ${pdfPath}`);
  process.exit(1);
}

const pdfFilename = path.basename(pdfPath, '.pdf');
const noteTitle = titleArg || pdfFilename.replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
const slug = noteTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const apiKey = process.env.GEMINI_API_KEY;

async function convertWithGemini(pdfBuffer, title) {
  console.log('🤖 Konwertowanie pliku PDF za pomocą AI (Gemini)...');
  const base64Data = pdfBuffer.toString('base64');

  const prompt = `Przekonwertuj poniższy dokument PDF na czysty, czytelny i ładnie sformatowany dokument MDX przeznaczony dla systemu Astro Starlight / StudyLab.

Zasady formatowania:
1. NIE dołączaj sekcji frontmatter (--- title: ... ---), wygeneruj tylko treść MDX od nagłówka pierwszego poziomu (# ${title}).
2. Używaj czytelnego formatu Markdown/MDX:
   - Sekcje i nagłówki: ##, ###
   - Wzory matematyczne: używaj składni KaTeX z pojedynczym dolarem $E=mc^2$ dla wzorów w linii lub dwoma $$ ... $$ dla wzorów blokowych.
   - Kod źródłowy: wstawiaj w bloki kodu z określeniem języka, np. \`\`\`cpp ... \`\`\`
   - Ramki wyróżnień Starlight: do ważnych uwag używaj :::note[Tytuł] ... ::: lub :::tip[Wskazówka] ... :::
3. Zachowaj wszystkie tabele, listy, ważne definicje oraz pojęcia.
4. Sformatuj treść przejrzyście i edukacyjnie.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64Data } },
          { text: prompt }
        ]
      }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Błąd API Gemini (${response.status}): ${errText}`);
  }

  const result = await response.json();
  let generatedMdx = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  generatedMdx = generatedMdx.replace(/^```mdx\n/, '').replace(/^```markdown\n/, '').replace(/\n```$/, '');

  return generatedMdx;
}

async function convertFallback(pdfBuffer, title) {
  console.log('📄 Odczytywanie tekstu z PDF (tryb lokalny)...');
  const parsed = await pdfParse(pdfBuffer);
  
  const lines = parsed.text.split('\n').map(l => l.trim()).filter(Boolean);
  const textBody = lines.join('\n\n');

  return `# ${title}\n\n:::note[Zaimportowano automatycznie]\nNotatka została stworzona na podstawie pliku PDF. Możesz ją wyedytować w pliku MDX.\n:::\n\n${textBody}`;
}

async function run() {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    let mdxBody = '';

    if (apiKey) {
      try {
        mdxBody = await convertWithGemini(pdfBuffer, noteTitle);
      } catch (err) {
        console.warn('⚠️ Problem z API Gemini, używam trybu lokalnego:', err.message);
        mdxBody = await convertFallback(pdfBuffer, noteTitle);
      }
    } else {
      console.log('ℹ️ Brak klucza GEMINI_API_KEY. Używam trybu lokalnego.');
      console.log('💡 Wskazówka: Ustaw GEMINI_API_KEY, aby AI automatycznie formatowała wzory KaTeX i kod C++!\n');
      mdxBody = await convertFallback(pdfBuffer, noteTitle);
    }

    const frontmatter = `---
title: "${noteTitle}"
description: "Notatka zaimportowana z pliku ${pdfFilename}.pdf"
sidebar:
  order: 99
---

import PdfTopicButton from '../../../components/PdfExport.jsx';

<PdfTopicButton client:load slug="${slug}" title="${noteTitle}" section="${categoryArg}" />

`;

    const fullMdxContent = frontmatter + mdxBody;

    const targetDir = path.join(PROJECT_ROOT, 'src', 'content', 'docs', categoryArg);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetFilePath = path.join(targetDir, `${slug}.mdx`);
    fs.writeFileSync(targetFilePath, fullMdxContent, 'utf-8');

    console.log(`\n🎉 SUKCES! Dodano nową notatkę:`);
    console.log(`📍 Ścieżka: src/content/docs/${categoryArg}/${slug}.mdx`);
    console.log(`🚀 Uruchom 'npm run dev', aby zobaczyć efekty na stronie!`);

  } catch (err) {
    console.error('❌ Błąd podczas konwersji:', err);
  }
}

run();