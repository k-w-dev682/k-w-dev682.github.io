// src/pages/api/process-pdf.js
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export const prerender = false;

// Inteligentny parser dodający elementy ZAWSZE na samym dole sekcji
function appendToConfigAtBottom(subject, chapter, title, slug, isNewChapter) {
  const configPath = path.join(process.cwd(), 'astro.config.mjs');
  let content = fs.readFileSync(configPath, 'utf8');

  const subjectMap = {
    'programowanie': 'Programowanie C++', 'fizyka': 'Fizyka dla informatyków',
    'matematyka/matematyka-i': 'Matematyka I', 'matematyka/matematyka-ii': 'Matematyka II',
    'elektronika': 'Podstawy elektroniki', 'ask': 'Architektura systemów komputerowych'
  };
  
  const subjectLabel = subjectMap[subject];
  if (!subjectLabel) return;

  const newEntry = `{\n            label: "${title}",\n            slug: "${slug}"\n          }`;
  const newChapterBlock = `{\n        label: "${chapter}",\n        collapsed: true,\n        items: [\n          ${newEntry}\n        ]\n      }`;

  const subjectRegex = new RegExp(`label:\\s*["']${subjectLabel}["']`);
  const subjectMatch = content.match(subjectRegex);
  if (!subjectMatch) return;

  let idx = subjectMatch.index;

  if (isNewChapter === 'true') {
    // SZUKAMY KOŃCA LISTY Z PRZEDMIOTEM I DODAJEMY NOWY ROZDZIAŁ NA SAMYM DOLE
    const itemsMatch = content.indexOf('items: [', idx);
    idx = itemsMatch + 8;
    let depth = 1;
    
    // Algorytm śledzenia nawiasów
    while (depth > 0 && idx < content.length) {
      if (content[idx] === '[') depth++;
      if (content[idx] === ']') depth--;
      idx++;
    }
    const insertPos = idx - 1; // Pozycja dokładnie przed zamykającym ']' przedmiotu
    
    let beforeStr = content.slice(0, insertPos);
    let prefix = beforeStr.trim().endsWith('[') ? '\n      ' : ',\n      ';
    
    content = beforeStr + prefix + newChapterBlock + '\n    ' + content.slice(insertPos);

  } else {
    // SZUKAMY KOŃCA ISTNIEJĄCEGO ROZDZIAŁU I DODAJEMY NOTATKĘ NA DOLE
    const itemsMatch = content.indexOf('items: [', idx);
    let searchStart = itemsMatch;
    let depth = 1;
    let searchEnd = itemsMatch + 8;
    
    while (depth > 0 && searchEnd < content.length) {
      if (content[searchEnd] === '[') depth++;
      if (content[searchEnd] === ']') depth--;
      searchEnd++;
    }
    
    const subjectScope = content.slice(searchStart, searchEnd);
    const chapterRegex = new RegExp(`label:\\s*["']${chapter}["']`);
    const chapterMatch = subjectScope.match(chapterRegex);
    
    if (chapterMatch) {
      let chapIdx = searchStart + chapterMatch.index;
      let chapItemsMatch = content.indexOf('items: [', chapIdx);
      let cIdx = chapItemsMatch + 8;
      let cDepth = 1;
      
      while (cDepth > 0 && cIdx < content.length) {
        if (content[cIdx] === '[') cDepth++;
        if (content[cIdx] === ']') cDepth--;
        cIdx++;
      }
      
      const insertPos = cIdx - 1; // Pozycja przed zamykającym ']' rozdziału
      let beforeStr = content.slice(0, insertPos);
      let prefix = beforeStr.trim().endsWith('[') ? '\n          ' : ',\n          ';
      
      content = beforeStr + prefix + newEntry + '\n        ' + content.slice(insertPos);
    }
  }
  
  fs.writeFileSync(configPath, content, 'utf8');
}

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const subject = formData.get('subject');
    const chapter = formData.get('chapter');
    const isNewChapter = formData.get('isNewChapter');
    const userApiKey = formData.get('apiKey');

    if (!file) return new Response(JSON.stringify({ error: 'Brak pliku PDF' }), { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const cleanString = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const finalSlug = `${subject}/${cleanString(chapter)}/${cleanString(title)}`.replace(/\/\//g, '/');

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    let mdxBody = '';

    if (apiKey) {
      const base64Data = buffer.toString('base64');
      const prompt = `Przekonwertuj dokument PDF na MDX dla systemu edukacyjnego. Zaczynaj od "# ${title}". Używaj $$i$ dla wzorów KaTeX oraz bloków \`\`\`cpp dla kodu. Ważne notatki dawaj w :::note[Ważne] ... :::`;

      const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ inlineData: { mimeType: 'application/pdf', data: base64Data } }, { text: prompt }] }]
        })
      });

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        mdxBody = (aiResult.candidates?.[0]?.content?.parts?.[0]?.text || '').replace(/^```mdx\n/i, '').replace(/^```markdown\n/i, '').replace(/\n```$/, '');
      } else {
        throw new Error('Błąd klucza API Gemini.');
      }
    } else {
      const parsed = await pdfParse(buffer);
      mdxBody = `# ${title}\n\n:::note[Tryb lokalny]\nNotatka bez asysty AI.\n:::\n\n${parsed.text}`;
    }

    const frontmatter = `---
title: "${title}"
description: "Notatka dla rozdziału: ${chapter}"
sidebar:
  order: 99
---

import PdfTopicButton from '../../../components/PdfExport.jsx';

<PdfTopicButton client:load slug="${finalSlug}" title="${title}" section="${subject}" />

`;

    const targetDir = path.join(process.cwd(), 'src', 'content', 'docs', subject, cleanString(chapter));
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    fs.writeFileSync(path.join(targetDir, `${cleanString(title)}.mdx`), frontmatter + mdxBody, 'utf-8');

    // Modyfikacja paska bocznego na samym dole!
    appendToConfigAtBottom(subject, chapter, title, finalSlug, isNewChapter);

    return new Response(JSON.stringify({ success: true, url: `/${finalSlug}`, title }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}