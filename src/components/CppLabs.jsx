import React, { useMemo, useState } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const readInt = (value, fallback, min, max) => {
  const result = Number(value);
  return Number.isFinite(result) ? clamp(Math.trunc(result), min, max) : fallback;
};

function Lab({ number, title, subtitle, children }) {
  return (
    <section className="not-content lab" aria-label={title}>
      <div className="lab__head">
        <span className="lab__eyebrow"><span className="lab__live" /> SYMULATOR {number}</span>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="lab__body">{children}</div>
    </section>
  );
}

function Controls({ step, max, onPrevious, onNext, onReset, previousLabel = 'Wstecz', nextLabel = 'Następny krok' }) {
  return (
    <div className="lab__controls">
      <button type="button" className="lab__button lab__button--subtle" onClick={onReset}>↺ Reset</button>
      <button type="button" className="lab__button lab__button--subtle" onClick={onPrevious} disabled={step <= 0}>{previousLabel}</button>
      <button type="button" className="lab__button lab__button--primary" onClick={onNext} disabled={step >= max}>{step >= max ? 'Zakończono ✓' : nextLabel + ' →'}</button>
      <span className="lab__progress">{step} / {max}</span>
    </div>
  );
}

function StepBar({ step, max }) {
  return <div className="lab__stepbar" aria-label={`Krok ${step} z ${max}`}>
    {Array.from({ length: max + 1 }, (_, i) => <span key={i} className={i <= step ? 'is-active' : ''} />)}
  </div>;
}

function Stat({ label, value, highlight = false }) {
  return <div className={'lab__stat' + (highlight ? ' lab__stat--accent' : '')}><span>{label}</span><strong>{value}</strong></div>;
}

export function BuildLab() {
  const [step, setStep] = useState(0);
  const [broken, setBroken] = useState(false);
  const stages = [
    ['Plik źródłowy', 'Piszesz kod w pliku main.cpp. Komputer jeszcze go nie wykonuje.'],
    ['Kompilacja', broken ? 'Kompilator znalazł brakujący średnik. Proces jest zatrzymany.' : 'Kompilator tłumaczy kod C++ do kodu obiektowego.'],
    ['Linkowanie', 'Linker dołącza potrzebne elementy i tworzy program wykonywalny.'],
    ['Uruchomienie', 'System uruchamia program, a instrukcje są wykonywane.'],
    ['Wynik', 'Na ekranie pojawia się napis: Witaj, StudyLab!'],
  ];
  const failed = broken && step === 1;
  const actualMax = broken ? 1 : 4;
  return <Lab number="01" title="Od .cpp do uruchomionego programu" subtitle="Sprawdź, co robi kompilator, linker i co się stanie, gdy w kodzie jest błąd.">
    <label className="lab__toggle"><input type="checkbox" checked={broken} onChange={e => { setBroken(e.target.checked); setStep(0); }} /> Symuluj brak średnika w kodzie</label>
    <div className="lab__stages">
      {stages.map(([label], i) => <div key={label} className={'lab__stage' + (step === i ? ' is-current' : '') + (i < step ? ' is-done' : '') + (failed && i === 1 ? ' is-error' : '')}>
        <small>0{i + 1}</small><span>{label}</span>
      </div>)}
    </div>
    <div className={'lab__notice' + (failed ? ' lab__notice--error' : '')} aria-live="polite"><strong>{stages[step][0]}</strong><p>{stages[step][1]}</p></div>
    <StepBar step={step} max={actualMax} />
    <Controls step={step} max={actualMax} onPrevious={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onReset={() => setStep(0)} />
    <p className="lab__hint">To uproszczony model budowania zwykłej aplikacji C++. Prawdziwy proces może mieć więcej etapów.</p>
  </Lab>;
}

export function WhileLab() {
  const [source, setSource] = useState('4 7 -2 0 9');
  const [step, setStep] = useState(0);
  const parsed = useMemo(() => source.trim().split(/[\s,;]+/).filter(Boolean), [source]);
  const valid = parsed.length > 0 && parsed.length <= 14 && parsed.every(n => /^[-+]?\d+$/.test(n) && Number.isSafeInteger(Number(n)));
  const numbers = valid ? parsed.map(Number) : [];
  const stopAt = numbers.indexOf(0);
  const max = stopAt >= 0 ? stopAt + 1 : numbers.length;
  const consumed = numbers.slice(0, step);
  const total = consumed.reduce((sum, value) => sum + value, 0);
  const ended = consumed.includes(0);
  return <Lab number="02" title="Pętla while — sumowanie do zera" subtitle="Zmieniaj dane wejściowe i wykonuj kolejne obroty pętli.">
    <label className="lab__label" htmlFor="while-values">Liczby oddzielone spacją (0 kończy wczytywanie)</label>
    <input id="while-values" className="lab__input" type="text" value={source} onChange={e => { setSource(e.target.value); setStep(0); }} />
    {!valid ? <p className="lab__error">Podaj od 1 do 14 poprawnych liczb całkowitych.</p> : <>
      <div className="lab__tokens">{numbers.map((v, i) => <span key={i} className={(i < step ? 'is-read' : '') + (i === step ? ' is-next' : '') + (v === 0 ? ' is-sentinel' : '')}>{v}</span>)}</div>
      <div className="lab__stats"><Stat label="Wczytane liczby" value={step} /><Stat label="Suma" value={total} highlight /></div>
      <div className="lab__notice" aria-live="polite">{ended ? 'Wczytano 0 — pętla kończy pracę. Zero nie zmienia sumy.' : step === max ? 'Koniec danych — w tym przykładzie warto dodać 0, aby zakończyć wczytywanie.' : step === 0 ? 'Naciśnij „Następny krok”, aby wczytać pierwszą liczbę.' : `Po wczytaniu ${consumed[step - 1]} suma wynosi ${total}.`}</div>
      <StepBar step={step} max={max} />
      <Controls step={step} max={max} onPrevious={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onReset={() => setStep(0)} />
    </>}
  </Lab>;
}

export function ForLab() {
  const [x, setX] = useState(3);
  const [y, setY] = useState(4);
  const [step, setStep] = useState(0);
  const count = Math.abs(x);
  const added = x >= 0 ? y : -y;
  const result = Array.from({ length: step }, () => added).reduce((a, b) => a + b, 0);
  return <Lab number="03" title="Mnożenie bez operatora *" subtitle="Zobacz, jak pętla for oblicza iloczyn przez wielokrotne dodawanie lub odejmowanie.">
    <div className="lab__fields">
      <label>Wartość x (liczba powtórzeń)<input className="lab__input" type="number" min="-10" max="10" value={x} onChange={e => { setX(readInt(e.target.value, 0, -10, 10)); setStep(0); }} /></label>
      <label>Wartość y<input className="lab__input" type="number" min="-50" max="50" value={y} onChange={e => { setY(readInt(e.target.value, 0, -50, 50)); setStep(0); }} /></label>
    </div>
    <div className="lab__formula">iloczyn = iloczyn {x < 0 ? '−' : '+'} ({y})</div>
    <div className="lab__stats"><Stat label="Iteracja" value={`${step} / ${count}`} /><Stat label="iloczyn" value={result} highlight /><Stat label="Wynik docelowy" value={x * y} /></div>
    <div className="lab__notice" aria-live="polite">{count === 0 ? 'Zero powtórzeń, więc wynik jest równy 0.' : step === 0 ? `Zaczynamy od iloczyn = 0. Wykonamy ${count} powtórzeń.` : `Po ${step} ${step === 1 ? 'powtórzeniu' : 'powtórzeniach'} mamy ${result}.`}</div>
    <StepBar step={step} max={count} />
    <Controls step={step} max={count} onPrevious={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onReset={() => setStep(0)} />
    <p className="lab__hint">Dla ujemnego x odejmujemy y odpowiednią liczbę razy. To dydaktyczna wersja algorytmu, ograniczona do małych danych.</p>
  </Lab>;
}

export function DebugLab() {
  const [maxN, setMaxN] = useState(4);
  const [step, setStep] = useState(0);
  const trace = useMemo(() => {
    const states = [{ line: 1, i: '—', sum: 0, note: 'Utworzono zmienną suma i ustawiono ją na 0.' }];
    for (let i = 1; i <= maxN; i++) {
      states.push({ line: 2, i, sum: (i - 1) * i / 2, note: `Sprawdzamy warunek: ${i} <= ${maxN} (prawda).` });
      states.push({ line: 3, i, sum: i * (i + 1) / 2, note: `Dodajemy ${i} do zmiennej suma.` });
    }
    states.push({ line: 2, i: maxN + 1, sum: maxN * (maxN + 1) / 2, note: `Warunek ${maxN + 1} <= ${maxN} jest fałszywy. Koniec pętli.` });
    states.push({ line: 5, i: 'poza zakresem', sum: maxN * (maxN + 1) / 2, note: 'Program wypisuje wynik.' });
    return states;
  }, [maxN]);
  const now = trace[step];
  const lines = [
    `int suma = 0;`,
    `for (int i = 1; i <= ${maxN}; i++) {`,
    `    suma += i;`,
    `}`,
    `std::cout << suma;`,
  ];
  return <Lab number="04" title="Debugger — wykonuj instrukcje krok po kroku" subtitle="Aktywna linia jest podświetlona; obok widać aktualny stan zmiennych.">
    <label className="lab__label" htmlFor="debug-n">Górna granica pętli: {maxN}</label>
    <input id="debug-n" className="lab__range" type="range" min="2" max="7" value={maxN} onChange={e => { setMaxN(Number(e.target.value)); setStep(0); }} />
    <div className="lab__split"><div className="lab__code" aria-label="Kod z wyróżnioną linią">{lines.map((line, index) => <div key={index} className={'lab__code-line' + (now.line === index + 1 ? ' is-current' : '')}><span>{index + 1}</span><code>{line}</code></div>)}</div>
      <div className="lab__watch"><strong>WATCH · zmienne</strong><Stat label="i" value={now.i} /><Stat label="suma" value={now.sum} highlight /></div>
    </div>
    <div className="lab__notice" aria-live="polite">{now.note}</div>
    <StepBar step={step} max={trace.length - 1} />
    <Controls step={step} max={trace.length - 1} onPrevious={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onReset={() => setStep(0)} />
    <p className="lab__hint">Wyświetlany kod to fragment wnętrza funkcji main. Zmienna i jest lokalna dla pętli for, więc po pętli wychodzi poza zakres. To model śledzenia, nie prawdziwy debugger.</p>
  </Lab>;
}

export function FloatLab() {
  const [source, setSource] = useState('0.1');
  const typed = Number(source);
  const valid = source.trim() !== '' && Number.isFinite(typed);
  const data = useMemo(() => {
    if (!valid) return null;
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    view.setFloat32(0, typed, false);
    const bits = view.getUint32(0, false).toString(2).padStart(32, '0');
    const actual = view.getFloat32(0, false);
    return { sign: bits.slice(0, 1), exponent: bits.slice(1, 9), mantissa: bits.slice(9), actual, bits };
  }, [typed, valid]);
  return <Lab number="05" title="IEEE 754 — co komputer przechowuje w float?" subtitle="Wpisz liczbę i zobacz jej rzeczywiste 32-bitowe kodowanie.">
    <div className="lab__fields lab__fields--single"><label>Wartość dziesiętna<input className="lab__input" value={source} onChange={e => setSource(e.target.value)} inputMode="decimal" placeholder="Np. 0.1" /></label></div>
    <div className="lab__chips">{['0.1', '0.3', '0.5', '1.5', '-2.75'].map(v => <button key={v} type="button" className={'lab__chip' + (source === v ? ' is-active' : '')} onClick={() => setSource(v)}>{v}</button>)}</div>
    {!valid ? <p className="lab__error">Wpisz poprawną, skończoną liczbę. Do oddzielania części dziesiętnej użyj kropki.</p> : <>
      <div className="lab__bits" role="group" aria-label="32 bity liczby float">
        <div><small>Znak · 1 bit</small><code className="lab__bit lab__bit--sign">{data.sign}</code></div>
        <div><small>Wykładnik · 8 bitów</small><code className="lab__bit lab__bit--exp">{data.exponent}</code></div>
        <div><small>Ułamek · 23 bity</small><code className="lab__bit lab__bit--mantissa">{data.mantissa}</code></div>
      </div>
      <div className="lab__stats"><Stat label="Wpisano" value={source} /><Stat label="Wartość po zaokrągleniu do float" value={Number.isFinite(data.actual) ? data.actual.toPrecision(9) : String(data.actual)} highlight /></div>
      <div className="lab__notice">{!Number.isFinite(data.actual) ? 'Przekroczono zakres float32: wynik jest nieskończonością.' : Object.is(data.actual, typed) ? 'Liczba ma dokładną reprezentację w formacie float32 (dla podanego wejścia).' : 'Wystąpiło zaokrąglenie: liczba nie jest dokładnie zapisana w 32 bitach.'}</div>
    </>}
    <p className="lab__hint">Korzystamy z JavaScript DataView i formatu IEEE 754 binary32. Zapis ułamka nie jest tu mantysą w potocznym znaczeniu — to 23-bitowe pole ułamkowe.</p>
  </Lab>;
}

export function AsciiLab() {
  const [char, setChar] = useState('A');
  const code = char.length ? char.charCodeAt(0) : null;
  const ascii = code !== null && code >= 0 && code <= 127;
  return <Lab number="06" title="ASCII — litera jako liczba" subtitle="Zobacz, jak pojedynczy znak odpowiada kodowi liczbowemu.">
    <div className="lab__fields lab__fields--single"><label>Pojedynczy znak<input className="lab__input" value={char} maxLength={1} onChange={e => setChar(e.target.value)} /></label></div>
    <div className="lab__chips">{['A', 'B', 'a', '0', '9', '?'].map(ch => <button key={ch} type="button" className="lab__chip" onClick={() => setChar(ch)}>{ch}</button>)}</div>
    <div className="lab__stats"><Stat label="Znak" value={char ? `'${char}'` : '—'} /><Stat label="Kod dziesiętny" value={code === null ? '—' : code} highlight /><Stat label="Kod binarny" value={ascii ? code.toString(2).padStart(8, '0') : '—'} /></div>
    <div className="lab__notice">{code === null ? 'Wprowadź jeden znak.' : ascii ? `Znak ${char} ma kod ASCII ${code}.` : `Znak ${char} nie należy do podstawowego ASCII (0–127). Pokazany kod to jednostka UTF-16, a nie kod ASCII.`}</div>
    <p className="lab__hint">W C++ znak zapisujemy w apostrofach, np. <code>'A'</code>, a napis w cudzysłowach, np. <code>"A"</code>.</p>
  </Lab>;
}

export function StringLab() {
  const [source, setSource] = useState('STUDYLAB');
  const [selected, setSelected] = useState(2);
  const valid = /^[\x20-\x7E]*$/.test(source) && source.length <= 22;
  const index = Math.min(selected, Math.max(0, source.length - 1));
  return <Lab number="07" title="string — indeksowanie znaków" subtitle="Kliknij dowolną literę i odczytaj jej indeks oraz wartość.">
    <label className="lab__label" htmlFor="string-text">Napis (maks. 22 znaki podstawowego ASCII)</label>
    <input id="string-text" className="lab__input" value={source} onChange={e => { setSource(e.target.value); setSelected(0); }} />
    {!valid ? <p className="lab__error">Podaj tekst do 22 znaków ASCII; w tym demonstratorze pomijamy problem kodowania polskich liter.</p> : <>
      <div className="lab__string">{source.length ? [...source].map((ch, i) => <button type="button" onClick={() => setSelected(i)} key={i} className={'lab__character' + (i === index ? ' is-selected' : '')} aria-label={`Indeks ${i}: ${ch === ' ' ? 'spacja' : ch}`} aria-pressed={i === index}><strong>{ch === ' ' ? '␣' : ch}</strong><span>[{i}]</span></button>) : <span className="lab__muted">Pusty napis.</span>}</div>
      <div className="lab__stats"><Stat label="napis.size()" value={source.length} /><Stat label="Wybrany indeks" value={source.length ? index : '—'} /><Stat label="napis[indeks]" value={source.length ? (source[index] === ' ' ? 'spacja' : `'${source[index]}'`) : '—'} highlight /></div>
      <div className="lab__notice">{source.length ? `Dostępne indeksy: od 0 do ${source.length - 1}. Odczyt poza zakresem za pomocą operatora [] jest niebezpieczny.` : 'Napis pusty ma długość 0 i nie ma żadnego poprawnego indeksu.'}</div>
    </>}
    <p className="lab__hint">Uwaga: w C++ <code>std::string::size()</code> liczy bajty, nie zawsze znaki Unicode. Dlatego w tej symulacji ograniczyliśmy się do ASCII.</p>
  </Lab>;
}
