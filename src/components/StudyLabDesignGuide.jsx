import React, { useState } from 'react';
import { STYLE_TOKENS, STUDYLAB_GEMINI_STYLE, STUDYLAB_MDX_EXAMPLE } from '../lib/studylab-style-guide.mjs';
import './studylab-design-guide.css';

const rootHref = (path) => `${(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')}${path.replace(/^\/+/, '')}`;

export default function StudyLabDesignGuide() {
  const [copied, setCopied] = useState('');
  async function copy(data, kind) {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(kind);
    } catch {
      setCopied('error');
    }
  }
  return <div className="sl-style-guide not-content">
    <section className="sl-style-hero" aria-label="Narzędzia specyfikacji">
      <div className="sl-style-kicker">STUDYLAB / BLACK EDITION / STANDARD 18.1</div>
      <h2>Jedna stylistyka. Każda nowa notatka.</h2>
      <p>Skopiuj kompletną instrukcję dla Gemini albo pobierz szablon MDX. Kolory, typografia i odstępy są zdefiniowane w istniejących stylach strony — nie trzeba generować CSS osobno dla każdej lekcji.</p>
      <div className="sl-style-actions">
        <button type="button" onClick={() => copy(STUDYLAB_GEMINI_STYLE, 'prompt')}>
          {copied === 'prompt' ? 'Skopiowano instrukcję ✓' : 'Kopiuj instrukcję dla Gemini'}
        </button>
        <button type="button" className="secondary" onClick={() => copy(STUDYLAB_MDX_EXAMPLE, 'mdx')}>
          {copied === 'mdx' ? 'Skopiowano szablon ✓' : 'Kopiuj szablon MDX'}
        </button>
        <a href={rootHref('studylab-design-system.json')} download>Pobierz parametry JSON ↗</a>
        <a href={rootHref('studylab-style-source.css')} download>Pobierz komplet stylów CSS ↗</a>
      </div>
      {copied === 'error' && <p className="sl-style-error" role="status">Schowek jest niedostępny. Skorzystaj z wersji tekstowej poniżej.</p>}
    </section>
    <section className="sl-style-palette" aria-labelledby="sl-style-palette-title">
      <h3 id="sl-style-palette-title">Kolory interfejsu</h3>
      <div className="sl-style-swatches">
        {Object.entries(STYLE_TOKENS.colors).map(([key, value]) =>
          <div className="sl-style-color" key={key}>
            <span className="sl-style-swatch" style={{background:value}} aria-hidden="true" />
            <div><strong>{key}</strong><code>{value}</code></div>
          </div>
        )}
      </div>
    </section>
    <section className="sl-style-meta" aria-label="Parametry układu i typografii">
      <div><small>FONT PODSTAWOWY</small><strong>Segoe UI Variable</strong><p>Fallback: Segoe UI / system-ui</p></div>
      <div><small>KOD</small><strong>Cascadia Code</strong><p>Fallback: JetBrains Mono / Consolas</p></div>
      <div><small>TREŚĆ</small><strong>{STYLE_TOKENS.layout.contentWidth}</strong><p>Szerokość artykułów</p></div>
      <div><small>PASEK BOCZNY</small><strong>{STYLE_TOKENS.layout.sidebarWidth}</strong><p>Starlight</p></div>
      <div><small>FORMUŁY</small><strong>KaTeX / LaTeX</strong><p>Ułamki, indeksy, pierwiastki</p></div>
      <div><small>REAKTYWNOŚĆ</small><strong>3 → 2 → 1</strong><p>Karty na desktopie / tablecie / telefonie</p></div>
    </section>
    <details className="sl-style-text"><summary>Pełna instrukcja tekstowa dla Gemini</summary><pre>{STUDYLAB_GEMINI_STYLE}</pre></details>
    <details className="sl-style-text"><summary>Przykładowy plik MDX</summary><pre>{STUDYLAB_MDX_EXAMPLE}</pre></details>
  </div>;
}
