// Lazy-load matching versions of Mozilla PDF.js. Library files are never uploaded.
// The CDN only supplies JS; PDF bytes stay inside the browser.
const VERSION = '4.10.38';
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${VERSION}`;
let libPromise;
export async function getPdfEngine() {
  if (!libPromise) {
    libPromise = import(/* @vite-ignore */ `${CDN}/pdf.min.mjs`).then(lib => {
      lib.GlobalWorkerOptions.workerSrc = `${CDN}/pdf.worker.min.mjs`;
      return lib;
    }).catch(e => { libPromise = null; throw new Error('Nie można załadować modułu PDF.js. Sprawdź połączenie internetowe lub blokadę CDN. ' + e.message); });
  }
  return libPromise;
}
export async function extractPdfPages(blob, onProgress = () => {}) {
  if (!blob || !blob.size) throw new Error('Plik PDF jest pusty.');
  if (blob.size > 250 * 1024 * 1024) throw new Error('Plik jest większy niż 250 MB. Dodaj mniejszy PDF lub podziel go na części.');
  const pdfjs = await getPdfEngine();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const task = pdfjs.getDocument({data: bytes, useSystemFonts: true});
  let pdf;
  try {
    pdf = await task.promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // hasEOL helps retain paragraph boundaries and makes comparisons readable.
      let text = '';
      for (const item of content.items) {
        if (typeof item.str !== 'string') continue;
        text += item.str + (item.hasEOL ? '\n' : ' ');
      }
      pages.push({page:i,text:text.replace(/[ \t]{2,}/g,' ').trim()});
      page.cleanup();
      if (i === 1 || i % 4 === 0 || i === pdf.numPages) onProgress(i, pdf.numPages);
      // Let the browser update the progress indicator during long imports.
      if (i % 6 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    return {pages, pageCount:pdf.numPages, extractedCharacters: pages.reduce((acc,p)=>acc+p.text.length,0)};
  } finally {
    if (pdf) await pdf.destroy(); else await task.destroy();
  }
}
