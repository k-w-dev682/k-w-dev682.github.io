// StudyLab cloud sync: deterministic merge of independent device snapshots.
// No network or browser dependencies. Keep historical results; deletion markers
// prevent deleted personal content from returning when an offline device reconnects.
import { validate } from './engine.js';

const FIELDS = ['customCards', 'notes', 'exams', 'bookmarks'];
const stamp = x => Number.isFinite(Number(x)) ? Math.max(0, Number(x)) : 0;
const stable = x => JSON.stringify(x);
const ordered = x => Object.fromEntries(Object.entries(x).sort(([a],[b]) => a.localeCompare(b)));

function byHistoryKey(key, x) {
  if (key === 'attempts') return stable([x.date, x.id, x.mode, x.given, x.answer, x.ok, x.subject, x.topic]);
  if (key === 'reviews') return stable([x.date, x.cardId, x.rating]);
  return stable([x.date, x.mode, x.score, x.total]);
}
function mergeHistory(key, docs, limit) {
  const map = new Map();
  for (const d of docs) for (const x of d[key] || []) map.set(byHistoryKey(key, x), x);
  return [...map.values()].sort((a, b) => stamp(a.date) - stamp(b.date) || byHistoryKey(key,a).localeCompare(byHistoryKey(key,b))).slice(-limit);
}
function mergeDeleted(docs) {
  const deleted = Object.fromEntries(FIELDS.map(f => [f, {}]));
  for (const d of docs) for (const f of FIELDS) {
    for (const [id, when] of Object.entries(d.syncDeleted?.[f] || {})) {
      deleted[f][id] = Math.max(deleted[f][id] || 0, stamp(when));
    }
  }
  return Object.fromEntries(FIELDS.map(f=>[f,ordered(deleted[f])]));
}
function latestObjects(key, docs, deleted, max) {
  const result = new Map();
  for (const d of docs) for (const x of d[key] || []) {
    if (!x?.id) continue;
    const modified = stamp(d.syncAdded?.[key]?.[x.id]) || (key === 'notes' ? stamp(x.date) : 1);
    if (!result.has(x.id) || modified >= result.get(x.id).modified) result.set(x.id, {item:x, modified});
  }
  return [...result.values()].filter(x => stamp(deleted[key]?.[x.item.id]) < x.modified)
    .sort((a, b) => a.modified - b.modified || a.item.id.localeCompare(b.item.id)).slice(-max).map(x => x.item);
}
function mergeBookmarks(docs, deleted) {
  const added = {};
  for (const d of docs) for (const url of d.bookmarks || []) {
    added[url] = Math.max(added[url] || 0, stamp(d.syncAdded?.bookmarks?.[url]) || 1);
  }
  return { bookmarks: Object.entries(added).filter(([url, at]) => at > stamp(deleted.bookmarks?.[url])).map(([url]) => url).sort().slice(-500), added: ordered(added) };
}
function lastCardState(docs) {
  const picked = {};
  for (const d of docs) for (const [id, state] of Object.entries(d.cards || {})) {
    const prev = picked[id];
    if (!prev || stamp(state.last) > stamp(prev.last) ||
      (stamp(state.last) === stamp(prev.last) && stamp(state.due) > stamp(prev.due))) picked[id] = state;
  }
  return ordered(picked);
}
function latestSetting(docs, section) {
  let top = docs[0], best = -1;
  for (const d of docs) {
    const mod = stamp(d.syncModified?.[section]);
    const fallbackPref = mod === best && stable(d[section]) !== stable(docs[0][section]) && stable(top[section]) === stable(docs[0][section]);
    if (mod > best || fallbackPref) {best = mod; top = d;}
  }
  return top[section];
}
export function mergeStudyData(...input) {
  const docs = input.filter(Boolean).map(raw => {
    const doc = validate(raw);
    return doc;
  });
  if (!docs.length) throw new Error('Nie znaleziono danych do scalania.');
  const deleted = mergeDeleted(docs);
  const mark = section => Math.max(0, ...docs.map(d => stamp(d.syncModified?.[section])));
  const bookmarks = mergeBookmarks(docs, deleted);
  const merged = {
    version: 1,
    attempts: mergeHistory('attempts', docs, 5000),
    reviews: mergeHistory('reviews', docs, 5000),
    sessions: mergeHistory('sessions', docs, 600),
    cards: lastCardState(docs),
    customCards: latestObjects('customCards', docs, deleted, 600),
    notes: latestObjects('notes', docs, deleted, 500),
    exams: latestObjects('exams', docs, deleted, 150),
    bookmarks: bookmarks.bookmarks,
    planner: latestSetting(docs, 'planner'),
    settings: latestSetting(docs, 'settings'),
    syncDeleted: deleted,
    syncAdded: {bookmarks: bookmarks.added, ...Object.fromEntries(['customCards','notes','exams'].map(section => {
      const items={};
      for(const d of docs)for(const [id,when] of Object.entries(d.syncAdded?.[section]||{}))items[id]=Math.max(items[id]||0,stamp(when));
      return [section,ordered(items)];
    }))},
    syncModified: Object.fromEntries(['planner','settings','customCards','notes','exams'].map(x => [x, mark(x)]))
  };
  return validate(merged);
}
export function markDeleted(db, section, id, at = Date.now()) {
  if (!FIELDS.includes(section)) throw new Error('Nieznany typ danych');
  const syncDeleted = {...db.syncDeleted, [section]: {...(db.syncDeleted?.[section] || {}), [id]: Math.max(at, stamp(db.syncDeleted?.[section]?.[id]))}};
  return {...db, syncDeleted, [section]: db[section].filter(x => (typeof x === 'string' ? x !== id : x.id !== id))};
}
export function toggleCloudBookmark(db, href, at = Date.now()) {
  if (db.bookmarks.includes(href)) return markDeleted(db, 'bookmarks', href, at);
  return {
    ...db,
    bookmarks: [...db.bookmarks, href],
    syncAdded: {...db.syncAdded, bookmarks: {...(db.syncAdded?.bookmarks || {}), [href]: at}}
  };
}
export function bumpModified(db, section, at = Date.now()) {
  return {...db, syncModified: {...db.syncModified, [section]: at}};
}

export function addCloudItem(db, section, item, at=Date.now()) {
  if (!['customCards','notes','exams'].includes(section)) throw new Error('Nieznany typ danych');
  return {...db, [section]: [...db[section], item], syncAdded: {...db.syncAdded, [section]: {...(db.syncAdded?.[section] || {}), [item.id]: at}}};
}
