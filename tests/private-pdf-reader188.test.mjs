import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyPdfLine,createPdfLessonBlocks,linesFromPdfItems,cleanPdfPageNumber,buildLessonFromPageText,isPotentialMathFormattingLoss,safeFormulaLatex} from '../src/lib/pdf-lesson-layout.mjs';
const base=new URL('../src/components/private-books/',import.meta.url);
const component=fs.readFileSync(new URL('PrivatePdfReader.jsx',base),'utf8');
const library=fs.readFileSync(new URL('PrivateSubjectBooks.jsx',base),'utf8');
test('Rozpoznanie nagłówka o większym rozmiarze czcionki',()=>{
 assert.equal(classifyPdfLine('Indukcja matematyczna',{size:19,normal:12}),'heading');
 assert.equal(classifyPdfLine('2.1 Zbiory i funkcje',{size:12,normal:12}),'heading');
});
test('Ostrożne rozpoznawanie wzorów bez zgadywania znaczenia ukośnika',()=>{
 assert.equal(classifyPdfLine('f(x) = 1 / 2x+1',{size:12,normal:12}),'formula');
 assert.ok(createPdfLessonBlocks([{text:'f(x) = 1 / 2x+1',size:12}])[0].text.includes('/'));
 assert.equal(isPotentialMathFormattingLoss([{type:'formula',text:'1 / 2x+1'}]),true);
});
test('Jednoznaczne ułamki LaTeX mają kreskę poziomą',()=>{
 assert.equal(safeFormulaLatex('f(x) = 1/(2x+1)'),String.raw`f(x)=\frac{1}{2x+1}`);
 assert.equal(safeFormulaLatex('C = Q/U'),String.raw`C=\frac{Q}{U}`);
 assert.equal(safeFormulaLatex('f(x)=1 / 2x+1'),null);
});
test('Przechowywanie tekstu PDF bez odgadywania LaTeX',()=>{
 const b=createPdfLessonBlocks([{text:'Definicja',size:20,gap:15},{text:'Każda liczba naturalna',size:12,gap:16},{text:'ma swojego następnika.',size:12,gap:2}]);
 assert.deepEqual(b.map(x=>x.type),['heading','paragraph']);
 assert.match(b[1].text,/następnika/);
});
test('Odczyt PDF.js zachowuje oddzielne wiersze i kolejność',()=>{
 const rows=linesFromPdfItems([
   {str:'Indukcja',transform:[12,0,0,12,10,90],height:18,width:55,hasEOL:true},
   {str:'Baza: n=1',transform:[12,0,0,12,10,65],height:12,width:90,hasEOL:true}
 ]);
 assert.equal(rows.length,2);assert.equal(rows[0].text,'Indukcja');assert.equal(rows[1].text,'Baza: n=1');
});
test('Zakres stron bez przekroczeń',()=>{
 assert.equal(cleanPdfPageNumber(0,15),1);assert.equal(cleanPdfPageNumber(50,15),15);assert.equal(cleanPdfPageNumber(3,15),3);
});
test('Wcześniejszy tekst książki działa jako awaryjny odczyt',()=>{
 const b=buildLessonFromPageText('1. Indukcja\nBazę indukcji sprawdzamy dla jeden.');assert.ok(b.length>=1);
});
test('Tryby czytnika i prywatność',()=>{
 for(const token of ['Oryginalny PDF','Ciemny PDF','Czytaj jak lekcję','getPdfEngine','getTextContent','localStorage','ownerId'])assert.ok(component.includes(token),token);
 assert.ok(component.includes('Tylko Twoje konto'));
 assert.ok(!component.includes('GEMINI_API_KEY'));
});
test('Zachowanie oryginalnego PDF bez nadpisywania Supabase',()=>{
 assert.ok(library.includes('<PrivatePdfReader'));
 assert.ok(library.includes('setSelected(result);'));
 assert.ok(!component.includes('putPrivateBook'));
 assert.ok(!component.includes('deletePrivateBook'));
});
