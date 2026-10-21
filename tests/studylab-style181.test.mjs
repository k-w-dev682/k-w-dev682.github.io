import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STYLE_TOKENS, STUDYLAB_GEMINI_STYLE, STUDYLAB_MDX_EXAMPLE } from '../src/lib/studylab-style-guide.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(project, rel), 'utf8');

test('design tokens match the declared BLACK Edition theme', () => {
  assert.equal(STYLE_TOKENS.colors.background, '#000000');
  assert.match(STYLE_TOKENS.fonts.body, /Segoe UI/);
  assert.equal(STYLE_TOKENS.subjects.length, 6);
});
test('Gemini notes use fractions, KaTeX and differentiated sources', () => {
  assert.match(STUDYLAB_GEMINI_STYLE, /kreskę ułamkową/);
  assert.match(STUDYLAB_GEMINI_STYLE, /KaTeX/);
  assert.match(STUDYLAB_GEMINI_STYLE, /źródła/i);
  assert.match(STUDYLAB_GEMINI_STYLE, /kod C\+\+/i);
});
test('MDX template contains valid frontmatter and a fraction', () => {
  assert.match(STUDYLAB_MDX_EXAMPLE, /^---\n/);
  assert.match(STUDYLAB_MDX_EXAMPLE, /\\frac\{n\(n\+1\)\}\{2\}/);
});
test('the homepage includes both actions and the library anchor', () => {
  const home=read('src/components/StudyHome.astro');
  assert.match(home,/sm-quick-actions/);
  assert.match(home,/ksiazki\/#importuj-pdf/);
  assert.match(home,/o-studylab\/specyfikacja\//);
  assert.match(read('src/components/materials/BooksLibrary.jsx'),/id="importuj-pdf"/);
});
test('a linked guide exists and is visible in the sidebar', () => {
  assert.match(read('astro.config.mjs'), /slug: 'o-studylab\/specyfikacja'/);
  assert.match(read('src/content/docs/o-studylab/specyfikacja.mdx'), /<StudyLabDesignGuide client:load/);
});
test('Gemini formatter uses the shared guide without embedding an API key', () => {
  const server=read('tools/studylab-gemini-server.mjs');
  assert.match(server,/import \{ STUDYLAB_GEMINI_STYLE \}/);
  assert.match(server, /\+ STUDYLAB_GEMINI_STYLE;/);
  const json=JSON.parse(read('public/studylab-design-system.json'));
  assert.equal(json.version, '18.1');
  assert.equal(json.tokens.layout.contentWidth, '52rem');
  assert.ok(json.cssSourceFiles.length>0);
  assert.doesNotMatch(read('public/studylab-gemini-guide.txt'), /AIza[A-Za-z0-9_-]{20,}/);
});
test('CSS export is a snapshot, never automatically loaded', () => {
  const css=read('public/studylab-style-source.css');
  assert.match(css,/TYLKO DO ODCZYTU/);
  assert.match(css,/StudyHome.astro/);
  assert.match(css,/--sl-color-bg/);
});
