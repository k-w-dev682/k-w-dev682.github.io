import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './studylab-cpp-runner.css';
import StudyLabFlowchart from './StudyLabFlowchart.jsx';
import {compileFlow,findNodeAtOffset,instrumentCpp,extractTrace} from './studylab-flow-engine.mjs';
import {COURSE_MODULES, COURSE_TASKS, COURSE_CODE_PREFIX, COURSE_PROGRESS_KEY, makeCourseHarness, readCourseResults, loadCourseProgress, updateCourseProgress} from './studylab-cpp-course.mjs';

const DEFAULT_PROGRAM = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cout << "Podaj dwie liczby: ";
    cin >> a >> b;
    cout << "Suma: " << a + b << '\\n';
    if (a > b) {
        cout << "Pierwsza jest większa\\n";
    } else {
        cout << "Druga jest większa lub równa\\n";
    }
    return 0;
}
`;

const TASKS = [
  { id: 'sum', title: 'Suma liczb od 1 do n', description: 'Napisz funkcję int suma(int n). Dla n >= 0 zwróć sumę liczb całkowitych od 1 do n.', template: 'int suma(int n) {\n    int wynik = 0;\n    for (int i = 1; i <= n; i++) {\n        wynik += i;\n    }\n    return wynik;\n}\n', tip: 'Zacznij od int wynik = 0. Dodawaj kolejne liczby od 1 do n i zwróć wynik.', tests: [{ args: '0', expected: '0' }, { args: '1', expected: '1' }, { args: '3', expected: '6' }, { args: '10', expected: '55' }] },
  { id: 'even', title: 'Parzysta czy nie?', description: 'Napisz funkcję bool czyParzysta(int n).', template: 'bool czyParzysta(int n) {\n    return n % 2 == 0;\n}\n', tip: 'Jeśli n % 2 == 0, liczba jest parzysta. Zwróć wynik porównania.', tests: [{ args: '0', expected: '1' }, { args: '2', expected: '1' }, { args: '7', expected: '0' }, { args: '-4', expected: '1' }] },
  { id: 'max', title: 'Maksimum dwóch liczb', description: 'Napisz funkcję int maksimum(int a, int b).', template: 'int maksimum(int a, int b) {\n    if (a > b) {\n        return a;\n    }\n    return b;\n}\n', tip: 'Użyj if (a > b) return a; a w przeciwnym razie return b;', tests: [{ args: '2, 5', expected: '5' }, { args: '8, 3', expected: '8' }, { args: '4, 4', expected: '4' }, { args: '-7, -2', expected: '-2' }] },
  { id: 'factorial', title: 'Silnia', description: 'Napisz funkcję long long silnia(int n), przyjmując 0 <= n <= 20.', template: 'long long silnia(int n) {\n    long long wynik = 1;\n    for (int i = 2; i <= n; i++) {\n        wynik *= i;\n    }\n    return wynik;\n}\n', tip: 'Wynik rozpocznij od 1. Dla i od 2 do n mnoż wynik przez i.', tests: [{ args: '0', expected: '1' }, { args: '1', expected: '1' }, { args: '4', expected: '24' }, { args: '7', expected: '5040' }, { args: '10', expected: '3628800' }] },
];

const FUNCTION_NAMES = { sum: 'suma', even: 'czyParzysta', max: 'maksimum', factorial: 'silnia' };
const STANDARDS = ['gnu++11', 'gnu++14', 'gnu++17', 'gnu++20', 'gnu++23'];
const RUN_LIMIT_MS = 60000;
const safeLoad = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const safeSave = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
const codeKey = (view, id) => `studylab-cpp-wasm-v2:${view}:${id}`;

function makeHarness(code, task) {
  if (/\b(?:int|auto|void)\s+main\s*\(/.test(code)) throw new Error('W zadaniu wpisz tylko funkcję (bez main). StudyLab sam doda main() do testów.');
  const fname = FUNCTION_NAMES[task.id];
  if (!fname) throw new Error('Nieznane zadanie.');
  const tests = task.tests.map((item, index) => `    std::cout << "STUDYLAB_TEST_${index}:" << (${fname}(${item.args})) << "\\n";`).join('\n');
  return `${code}\n#include <iostream>\nint main() {\n${tests}\n    return 0;\n}\n`;
}
function readTestResults(stdout, task) {
  const outputs = new Map();
  for (const line of String(stdout).split(/\r?\n/)) {
    const m = line.trim().match(/^STUDYLAB_TEST_(\d+):(.*)$/);
    if (m) outputs.set(Number(m[1]), m[2].trim());
  }
  return task.tests.map((test, index) => ({ ...test, received: outputs.get(index) ?? 'brak wyniku', pass: outputs.get(index) === test.expected }));
}

export default function StudyLabCppRunner({ onAttempt }) {
  const [view, setView] = useState('free');
  const [taskId, setTaskId] = useState('sum');
  const [courseId, setCourseId] = useState('dodaj');
  const [courseModule, setCourseModule] = useState(1);
  const [courseProgress, setCourseProgress] = useState(() => typeof window !== 'undefined' ? loadCourseProgress(window.localStorage) : {version:1,completed:{},attempts:{}});
  const [code, setCode] = useState(() => safeLoad(codeKey('free', 'main'), DEFAULT_PROGRAM));
  const [stdin, setStdin] = useState(() => safeLoad('studylab-cpp-wasm-v2:stdin', '5 7\n'));
  const [standard, setStandard] = useState(() => safeLoad('studylab-cpp-wasm-v2:standard', 'gnu++17'));
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Wybierz „Uruchom kod”, aby skompilować go w przeglądarce.');
  const [result, setResult] = useState(null);
  const [showTip, setShowTip] = useState(false);
  const workerRef = useRef(null);
  const timerRef = useRef(null);
  const serialRef = useRef(0);
  const currentRef = useRef(null);
  const onAttemptRef = useRef(onAttempt);
  const editorRef = useRef(null);
  const [selectedAstId, setSelectedAstId] = useState(null);
  const [trace, setTrace] = useState([]);
  const [traceStep, setTraceStep] = useState(-1);
  const [tracePlaying, setTracePlaying] = useState(false);
  const [traceIssue, setTraceIssue] = useState('');
  const [showCourseFlow, setShowCourseFlow] = useState(false);
  onAttemptRef.current = onAttempt;
  const active = ['loading', 'compiling', 'running'].includes(phase);
  const task = TASKS.find((t) => t.id === taskId) || TASKS[0];
  const courseTask = COURSE_TASKS.find((t) => t.id === courseId) || COURSE_TASKS[0];
  const courseDone = Object.keys(courseProgress.completed || {}).length;
  const courseNext = COURSE_TASKS.find((item) => !courseProgress.completed?.[item.id]);

  useEffect(() => {
    const key = view === 'course' ? COURSE_CODE_PREFIX + courseId : codeKey(view, view === 'free' ? 'main' : taskId);
    safeSave(key, code);
  }, [code, view, taskId, courseId]);
  useEffect(() => { safeSave('studylab-cpp-wasm-v2:stdin', stdin); }, [stdin]);
  useEffect(() => { safeSave('studylab-cpp-wasm-v2:standard', standard); }, [standard]);
  useEffect(() => () => { serialRef.current += 1; clearTimeout(timerRef.current); workerRef.current?.terminate(); workerRef.current = null; }, []);

  useEffect(() => {setTrace([]);setTraceStep(-1);setTracePlaying(false);setTraceIssue('');}, [code,view,taskId]);
  useEffect(() => {
    if (!tracePlaying || !trace.length) return undefined;
    if (traceStep >= trace.length - 1) { setTracePlaying(false); return undefined; }
    const id = setTimeout(() => setTraceStep(i => Math.min(i + 1, trace.length - 1)), 730);
    return () => clearTimeout(id);
  }, [tracePlaying, trace.length, traceStep]);

  const terminate = useCallback((status = 'stopped') => {
    serialRef.current += 1;
    clearTimeout(timerRef.current);
    workerRef.current?.terminate();
    workerRef.current = null;
    currentRef.current = null;
    setPhase(status);
    setMessage(status === 'timeout'
      ? 'Przekroczono limit 60 sekund od rozpoczęcia kompilacji. Proces został zatrzymany. Możesz uruchomić go ponownie.'
      : 'Zatrzymano kompilację lub program.');
  }, []);

  const switchTo = (nextView, nextTaskId = taskId, nextCourseId = courseId) => {
    if (active) terminate();
    setView(nextView);
    setTaskId(nextTaskId);
    setCourseId(nextCourseId);
    const chosen = TASKS.find((t) => t.id === nextTaskId) || TASKS[0];
    const chosenCourse = COURSE_TASKS.find(t => t.id === nextCourseId) || COURSE_TASKS[0];
    setCode(nextView === 'course'
      ? safeLoad(COURSE_CODE_PREFIX + chosenCourse.id, chosenCourse.starter)
      : safeLoad(codeKey(nextView, nextView === 'free' ? 'main' : nextTaskId), nextView === 'free' ? DEFAULT_PROGRAM : chosen.template));
    setShowTip(false);
    setResult(null);
    setPhase('idle');
    setMessage('Kod gotowy do uruchomienia.');
  };

  const run = useCallback((withTrace = false) => {
    if (active) return;
    if (withTrace && view === 'course') setShowCourseFlow(true);
    if (!code.trim()) { setPhase('error'); setMessage('Najpierw wpisz kod C++.'); return; }
    let source = code;
    let effectiveTrace = false;
    try {
      if(withTrace) {
        const traced = instrumentCpp(code, view === 'task' ? FUNCTION_NAMES[task.id] : view === 'course' ? courseTask.fn : 'main');
        source = traced.code;
        effectiveTrace = true;
        setTraceIssue('');
      }
      if(view === 'task') source = makeHarness(source, task);
      if(view === 'course') source = makeCourseHarness(source, courseTask);
    } catch(e) {
      setPhase('error'); setMessage(e.message || String(e));
      if(withTrace) setTraceIssue(e.message || String(e));
      return;
    }
    setTrace([]); setTraceStep(-1); setTracePlaying(false);
    if (!withTrace) setTraceIssue('');

    const runId = serialRef.current + 1;
    serialRef.current = runId;
    clearTimeout(timerRef.current);
    workerRef.current?.terminate();
    workerRef.current = null;
    currentRef.current = { view, task, courseTask, onAttempt: onAttemptRef.current, effectiveTrace, sourceSnapshot:code };
    setResult(null);
    setPhase('loading');
    setProgress(0);
    setMessage('Przygotowywanie kompilatora Clang w WebAssembly… przy pierwszym uruchomieniu pobierze około 29 MB.');
    try {
      const base = import.meta.env.BASE_URL || '/';
      const workerUrl = new URL(`${base.replace(/\/$/, '')}/clang/studylab-cpp.worker.js`, window.location.origin);
      const worker = workerRef.current || new Worker(workerUrl);
      workerRef.current = worker;
      worker.onmessage = (event) => {
        if (serialRef.current !== runId) return;
        const msg = event.data || {};
        if (msg.type === 'progress') {
          setProgress(Number(msg.value) || 0);
          setMessage('Pobieranie i inicjalizacja kompilatora: ' + Math.round((Number(msg.value) || 0) * 100) + '%');
        } else if (msg.type === 'ready') {
          setPhase('compiling');
          setMessage('Kompilowanie kodu przez Clang…');
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => terminate('timeout'), RUN_LIMIT_MS);
        } else if (msg.type === 'finished') {
          clearTimeout(timerRef.current);
          const data = { ...(msg.result || {}) };
          const runInfo=currentRef.current;
          if (runInfo?.effectiveTrace && Number.isInteger(data.exitCode)) {
            try {
              const output=extractTrace(data.stderr,runInfo.sourceSnapshot,runInfo.view === 'task' ? FUNCTION_NAMES[runInfo.task.id] : runInfo.view === 'course' ? runInfo.courseTask.fn : 'main');
              data.stderr=output.stderr;
              setTrace(output.trace);
              setTraceStep(output.trace.length ? 0 : -1);
              setTracePlaying(output.trace.length>1);
              if(output.truncated) setTraceIssue('Zapisano maksymalnie 1000 kroków wykonania.');
            }catch(e){setTraceIssue('Nie udało się odczytać śledzenia: '+(e.message||String(e)));}
          }
          const compiled = Number.isInteger(data.exitCode);
          const tests = runInfo?.view === 'task' && compiled ? readTestResults(data.stdout, runInfo.task) : runInfo?.view === 'course' && compiled ? readCourseResults(data.stdout, runInfo.courseTask) : null;
          const allPass = Array.isArray(tests) && tests.every((item) => item.pass);
          setResult({ ...data, tests, allPass });
          setPhase(compiled ? 'done' : 'error');
          setMessage(!compiled ? 'Błąd kompilacji lub linkowania — sprawdź komunikaty poniżej.' : tests ? `Testy: ${tests.filter((t) => t.pass).length}/${tests.length} poprawnych.` : 'Program wykonany. Kod wyjścia: ' + data.exitCode);
          if (tests && runInfo?.view === 'course') {
            setCourseProgress((previous) => {
              const next = updateCourseProgress(previous, runInfo.courseTask.id, allPass && data.exitCode === 0);
              safeSave(COURSE_PROGRESS_KEY, JSON.stringify(next));
              return next;
            });
          }
          if (tests && typeof currentRef.current?.onAttempt === 'function') {
            const info = currentRef.current;
            try {
              const relevant = info.view === 'course' ? info.courseTask : info.task;
              info.onAttempt({ id: `plus-cpp-wasm-${relevant.id}-${Date.now()}-${runId}`, subject: 'cpp', topic: `cpp-course-${relevant.id}`, question: relevant.description, given: tests.map((t, i) => `${i + 1}:${t.received}`).join(', ').slice(0, 400), answer: tests.map((t, i) => `${i + 1}:${t.expected}`).join(', ').slice(0, 400), why: `Rzeczywisty Clang/WASM, testy: ${tests.filter((t) => t.pass).length}/${tests.length}`, ok: allPass && data.exitCode === 0, mode: info.view === 'course' ? 'cpp-learning-path' : 'plus-cpp-wasm', hints: showTip ? 1 : 0, date: Date.now() });
            } catch {}
          }
        } else if (msg.type === 'failed') {
          clearTimeout(timerRef.current);
          setPhase('error');
          setMessage(String(msg.message || 'Nie udało się uruchomić kompilatora.'));
        }
      };
      worker.onerror = (event) => {
        if (serialRef.current !== runId) return;
        clearTimeout(timerRef.current);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        setPhase('error');
        setMessage('Błąd ładowania Workera: ' + (event.message || 'Sprawdź, czy public/clang/ zostało zainstalowane.'));
      };
      worker.postMessage({ type: 'run', source, stdin: view === 'free' ? stdin : '', standard });
    } catch (e) {
      clearTimeout(timerRef.current);
      workerRef.current?.terminate();
      workerRef.current = null;
      setPhase('error');
      setMessage('Nie można uruchomić kompilatora: ' + (e.message || String(e)));
    }
  }, [active, code, view, task, courseTask, stdin, standard, terminate, showTip]);

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/x-c++src;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = view === 'free' ? 'main.cpp' : view === 'course' ? `${courseId}.cpp` : `${taskId}.cpp`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const onCodeKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      run();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.currentTarget;
      const { selectionStart: a, selectionEnd: b } = target;
      const next = code.slice(0, a) + '    ' + code.slice(b);
      setCode(next);
      requestAnimationFrame(() => { try { target.setSelectionRange(a + 4, a + 4); } catch {} });
    }
  };

  const flow = useMemo(() => {
    try {return compileFlow(code,view==='task'?FUNCTION_NAMES[task.id]:view==='course'?courseTask.fn:'main');}
    catch(error) {return {error:error.message||String(error)};}
  }, [code,view,task,courseTask]);
  const selectionFromEditor = () => {
    if(!editorRef.current || flow.error)return;
    const caret=editorRef.current.selectionStart;
    const item=flow.nodes.find(n=>n.id===findNodeAtOffset(flow,caret));
    setSelectedAstId(item?.astId||null);
  };
  const jumpToCode = (node) => {
    if(node.start<0 || !editorRef.current)return;
    const textarea=editorRef.current;
    textarea.focus();
    textarea.setSelectionRange(node.start,node.end);
    const line=code.slice(0,node.start).split('\n').length-1;
    textarea.scrollTop=Math.max(0,(line-3)*24);
    setSelectedAstId(node.astId||null);
  };
  const traceNext=()=>{setTracePlaying(false);setTraceStep(i=>Math.min(trace.length-1,i+1));};
  const tracePrevious=()=>{setTracePlaying(false);setTraceStep(i=>Math.max(0,i-1));};
  const traceReset=()=>{setTracePlaying(false);setTraceStep(trace.length?0:-1);};
  const openCourse = (id) => {
    const item = COURSE_TASKS.find((t) => t.id === id);
    if (!item) return;
    setCourseModule(item.module);
    switchTo('course', taskId, item.id);
  };

  return <section className="slcpp" aria-label="Laboratorium C++ — kompilator WebAssembly i schematy blokowe">
    <div className="slcpp-heading"><div><span className="slcpp-eyebrow">STUDYLAB · C++ 6.0</span><h3>Laboratorium C++</h3><p>Rzeczywista kompilacja i uruchamianie kodu lokalnie w przeglądarce. Diagram pod konsolą, pełnoekranowy podgląd, zoom, powiązanie z kodem i prawdziwa animacja przebiegu.</p></div><span className="slcpp-chip">KOD + SCHEMAT</span></div>
    <div className="slcpp-modes" role="group" aria-label="Tryb programowania">
      <button type="button" className={view === 'free' ? 'active' : ''} aria-pressed={view === 'free'} onClick={() => switchTo('free')}>Własny program</button>
      <button type="button" className={view === 'task' ? 'active' : ''} aria-pressed={view === 'task'} onClick={() => switchTo('task')}>Zadania z testami</button>
      <button type="button" className={view === 'course' ? 'active' : ''} aria-pressed={view === 'course'} onClick={() => switchTo('course')}>Ścieżka nauki · 60 zadań</button>
    </div>
    {view === 'course' ? <div className="slcpp-course">
      <div className="slcpp-course-hero">
        <div><span className="slcpp-course-eyebrow">KURS C++ · 10 DZIAŁÓW</span><h4>Ucz się programując</h4><p>Zadania rosną stopniowo. Kod kompiluje się w przeglądarce, a postęp zapisuje się lokalnie. Każdy dział możesz otworzyć w dowolnym momencie.</p></div>
        <div className="slcpp-course-stat"><strong>{courseDone} / {COURSE_TASKS.length}</strong><span>ukończonych zadań</span><div className="slcpp-course-progress"><span style={{width:`${Math.round(100*courseDone/COURSE_TASKS.length)}%`}} /></div></div>
      </div>
      {courseNext ? <button className="slcpp-course-next" type="button" disabled={active} onClick={() => openCourse(courseNext.id)}>↗ Następne nieukończone: <strong>{courseNext.title}</strong></button> : <p className="slcpp-course-next">✓ Wszystkie ćwiczenia ukończone! Możesz je powtarzać.</p>}
      <div className="slcpp-course-modules">{COURSE_MODULES.map((section) => { const total=COURSE_TASKS.filter(t=>t.module===section.id).length; const done=COURSE_TASKS.filter(t=>t.module===section.id && courseProgress.completed?.[t.id]).length; return <button type="button" key={section.id} disabled={active} className={section.id === courseModule ? 'selected' : ''} onClick={() => setCourseModule(section.id)}><span>{String(section.id).padStart(2,'0')} · {section.title}</span><small>{done}/{total}</small></button>; })}</div>
      <p className="slcpp-course-topic">{COURSE_MODULES.find(x=>x.id===courseModule)?.description}</p>
      <div className="slcpp-course-exercises">{COURSE_TASKS.filter(t=>t.module===courseModule).map((item,index) => <button type="button" key={item.id} disabled={active} className={courseId===item.id ? 'current' : ''} onClick={() => openCourse(item.id)}><span className="slcpp-course-number">{courseProgress.completed?.[item.id] ? '✓' : index+1}</span><span className="slcpp-course-exercise-title">{item.title}<small>{item.level===1?'Podstawowy':item.level===2?'Średni':'Trudniejszy'} · {item.tests.length} testów</small></span></button>)}</div>
      <div className="slcpp-course-current"><span>AKTUALNE ĆWICZENIE</span><h4>{courseTask.title}</h4><p>{courseTask.description}</p><p><strong>Funkcja:</strong> <code>{courseTask.fn}(…)</code> · próby: {courseProgress.attempts?.[courseId] || 0} {courseProgress.completed?.[courseId] ? '· ✓ Ukończone' : ''}</p>{courseTask.why ? <p>{courseTask.why}</p> : null}</div>
    </div> : null}
    {view === 'task'
      ? <div className="slcpp-task"><label>Zadanie<select disabled={active} value={taskId} onChange={(e) => switchTo('task', e.target.value)}>{TASKS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><p>{task.description}</p><p className="slcpp-small">Wpisz samą funkcję, bez <code>main()</code>. Po kliknięciu „Uruchom testy” StudyLab skompiluje funkcję razem z przypadkami testowymi.</p></div>
      : view === 'course' ? <div className="slcpp-course-help">{showTip ? <p><strong>Podpowiedź:</strong> {courseTask.hint}</p> : <button type="button" onClick={() => setShowTip(true)}>Pokaż podpowiedź</button>}<span>Wpisz funkcję — bez <code>main()</code>. StudyLab doda program testujący.</span></div> : <p className="slcpp-small">Własny program powinien zawierać funkcję <code>main()</code>. Dane dla <code>cin</code> wpisz poniżej przed uruchomieniem. Schemat blokowy aktualizuje się automatycznie, gdy zmieniasz kod.</p>}
    <div className="slcpp-editor-bar"><span>● &nbsp;{view === 'free' ? 'main.cpp' : view === 'course' ? `${courseId}.cpp` : `${taskId}.cpp`}</span><label>Standard <select disabled={active} value={standard} onChange={(e) => setStandard(e.target.value)}>{STANDARDS.map((x) => <option key={x} value={x}>{x.replace('gnu', 'C++')}</option>)}</select></label></div>
    <label className="slcpp-code-label" htmlFor="slcpp-code-input">Kod C++</label>
    <textarea id="slcpp-code-input" ref={editorRef} className="slcpp-editor" value={code} disabled={active} onChange={(e) => setCode(e.target.value)} onKeyDown={onCodeKeyDown} onClick={selectionFromEditor} onKeyUp={selectionFromEditor} spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-label="Edytor kodu C++" rows={15} />
    {view === 'free'
      ? <label className="slcpp-input-label">Dane wejściowe — stdin / cin<textarea value={stdin} disabled={active} onChange={(e) => setStdin(e.target.value)} spellCheck={false} rows={2} placeholder="np. 5 7" /></label>
      : view === 'task' ? <div className="slcpp-tests-hint">{task.tests.length} przypadków testowych · {showTip ? <span>{task.tip}</span> : <button type="button" onClick={() => setShowTip(true)}>Pokaż podpowiedź</button>}</div> : <div className="slcpp-tests-hint">Testy uruchomią funkcję z różnymi argumentami. Ukończenie zadania wymaga zaliczenia wszystkich testów.</div>}
    <div className="slcpp-actions">
      <button type="button" className="slcpp-primary" onClick={() => run(false)} disabled={active}>{active ? 'Trwa kompilacja…' : view !== 'free' ? '▶ Sprawdź rozwiązanie' : '▶ Uruchom kod'}</button>
      <button type="button" className="slcpp-secondary" onClick={() => run(true)} disabled={active}>◉ Uruchom z animacją</button>
      {active ? <button type="button" className="slcpp-stop" onClick={() => terminate()}>■ Zatrzymaj</button> : null}
      <button type="button" className="slcpp-secondary" disabled={active} onClick={downloadCode}>↓ Pobierz .cpp</button>
      <button type="button" className="slcpp-secondary" disabled={active} onClick={() => { if (window.confirm('Zastąpić bieżący kod szablonem?')) { setCode(view === 'free' ? DEFAULT_PROGRAM : view === 'course' ? courseTask.starter : task.template); setResult(null); setMessage('Przywrócono przykładowy kod.'); } }}>Przywróć przykład</button>
    </div>
    <div className="slcpp-lab-grid">
      <div className="slcpp-console" aria-live="polite"><div className="slcpp-console-header"><span>⌁ Konsola i diagnostyka</span><span className={`slcpp-state slcpp-${phase}`}>{active ? phase === 'loading' ? 'Ładowanie' : 'Kompilowanie / wykonywanie' : phase === 'done' ? 'Zakończono' : phase === 'error' || phase === 'timeout' ? 'Błąd' : phase === 'stopped' ? 'Zatrzymano' : 'Gotowość'}</span></div>
        {phase === 'loading' ? <div className="slcpp-progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin="0" aria-valuemax="100"><div style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }} /></div> : null}
        <p className="slcpp-status" role="status">{message}</p>
        {result ? <><div className="slcpp-meta"><span>Kompilacja: {Number.isFinite(result.compileMs) ? Math.round(result.compileMs) + ' ms' : '—'}</span><span>Uruchomienie: {Number.isFinite(result.runMs) ? Math.round(result.runMs) + ' ms' : '—'}</span><span>Kod wyjścia: {result.exitCode ?? 'nie uruchomiono'}</span></div>{result.errors?.length > 0 ? <div className="slcpp-block slcpp-error"><strong>Błędy kompilacji</strong><pre>{result.errors.join('\n')}</pre></div> : null}{result.stdout ? <div className="slcpp-block"><strong>stdout</strong><pre>{result.stdout}</pre></div> : null}{result.stderr ? <div className="slcpp-block slcpp-error"><strong>stderr</strong><pre>{result.stderr}</pre></div> : null}{!result.stdout && !result.stderr && !(result.errors?.length) ? <p className="slcpp-small">Program nie wypisał nic do konsoli.</p> : null}{result.tests ? <div className="slcpp-test-list"><h4>Testy automatyczne: {result.tests.filter((t) => t.pass).length}/{result.tests.length}</h4>{result.tests.map((test, i) => <div className={test.pass ? 'slcpp-pass' : 'slcpp-fail'} key={i}><span>{test.pass ? '✓' : '✕'} Test {i + 1}: ({test.args})</span><span>oczekiwano: <code>{test.expected}</code> · otrzymano: <code>{test.received}</code></span></div>)}</div> : null}</> : null}
      </div>
      {view === 'course' ? <button type="button" className="slcpp-course-flow-toggle" onClick={() => setShowCourseFlow((previous) => !previous)}>{showCourseFlow ? 'Ukryj schemat blokowy ↑' : 'Pokaż schemat blokowy (opcjonalnie) ↓'}</button> : null}
      {view !== 'course' || showCourseFlow ? <StudyLabFlowchart flow={flow} sourceName={view === 'free' ? 'main.cpp' : view === 'course' ? `${courseId}.cpp` : `${taskId}.cpp`} source={code} onSelect={jumpToCode} selectedAstId={selectedAstId} trace={trace} traceStep={traceStep} tracePlaying={tracePlaying} onPlay={() => {if(traceStep>=trace.length-1)setTraceStep(0);setTracePlaying(true);}} onPause={() => setTracePlaying(false)} onNext={traceNext} onPrevious={tracePrevious} onReset={traceReset} /> : null}
      {traceIssue ? <p className="slcpp-trace-note" role="status">{traceIssue}</p> : null}
      {view === 'course' && result?.allPass && result.exitCode === 0 ? <div className="slcpp-course-success">✓ Zadanie zaliczone. Wynik zapisany w postępach kursu. {courseNext ? <button type="button" onClick={() => openCourse(courseNext.id)}>Przejdź do następnego →</button> : null}</div> : null}
    </div>
    <p className="slcpp-disclaimer">Wykonywanie w odizolowanym Web Workerze; kod C++ nie jest przesyłany do zewnętrznego API. Schemat blokowy generuje się lokalnie w przeglądarce i najlepiej działa dla prostych, edukacyjnych programów lub funkcji. Dane dla <code>cin</code> są podawane przed startem, nie podczas działania programu. Nie wszystkie biblioteki systemowe, wyjątki C++ i wielowątkowość są dostępne w WASI. Kod edytora jest zapisywany lokalnie na tym urządzeniu.</p>
  </section>;
}

export { makeHarness, readTestResults, TASKS, DEFAULT_PROGRAM };
