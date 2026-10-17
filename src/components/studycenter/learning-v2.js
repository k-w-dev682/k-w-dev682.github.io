// StudyLab v2: jawny, lokalny dobór pytań. Nie udaje modelu AI ani FSRS.
import { QUESTIONS } from './bank.js';
import { shuffled } from './engine.js';

export function availableLessonItems(items, focus) {
  if (!focus?.subject || !focus?.lesson) return [];
  return items.filter(item => item.subject === focus.subject && item.lesson === focus.lesson);
}
export function filterLessonItems(items, focus) {
  if (!focus?.subject || !focus?.lesson) return items;
  return items.filter(item => item.subject === focus.subject && item.lesson === focus.lesson);
}
export function explainFocus(items, focus) {
  const count = availableLessonItems(items, focus).length;
  if (count) return `Powiązano z otwartą lekcją: ${count} ${count === 1 ? 'materiał' : 'materiały'} dokładnie o tym temacie. Możesz też przełączyć się na cały rozdział.`;
  return 'Ta lekcja nie ma jeszcze własnego zestawu w bazie. Pokazujemy dostępne materiały z rozdziału lub przedmiotu — nie są automatycznie tworzone z tekstu lekcji.';
}
export function pickAdaptiveQuestions(db, subject = 'all', topic = 'all', count = 10, rng = Math.random) {
  const candidates = QUESTIONS.filter(q => (subject === 'all' || q.subject === subject) && (topic === 'all' || q.topic === topic));
  const attempts = Array.isArray(db?.attempts) ? db.attempts : [];
  const perId = new Map();
  for (const a of attempts) {
    const row = perId.get(a.id) || {total:0, wrong:0, last:0, latestOK:false};
    row.total++;
    if (!a.ok) row.wrong++;
    if (Number(a.date) >= row.last) {row.last=Number(a.date);row.latestOK=!!a.ok;}
    perId.set(a.id,row);
  }
  // Błędy i nowe pytania mają wyższy priorytet. Losowość zapobiega zawsze tej samej kolejności.
  const weighted = candidates.map(q => {
    const prev=perId.get(q.id);
    const penalty=prev?.latestOK?0.5:prev?2.5:2;
    const errorRate=prev ? prev.wrong / prev.total : 0;
    const weight=Math.max(0.2, penalty+2*errorRate);
    const uniform=Math.max(0.0000001,Math.min(0.9999999,Number(rng())||0.0000001));
    return {q,priority:-Math.log(uniform)/weight};
  }).sort((a,b)=>a.priority-b.priority);
  return weighted.slice(0,Math.max(0,Math.min(100,Number(count)||0))).map(({q})=>({
    ...q,
    shuffledOptions:shuffled(q.options.map((value,index)=>({value,index})))
  }));
}
