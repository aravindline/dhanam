// App data on the phone (encrypted in the vault) and the queue of changes waiting to go to OneDrive.
import * as vault from './vault.js';
import { uuid } from './crypto.js';
import { defaultRows } from './cats.js';
import { stamp } from './sync.js';

export const D = { entries: [], cats: [], ops: [], set: {} };
export const inFlight = new Set(); // ops being sent right now: never merged into or removed
const free = o => !inFlight.has(o.opId);
const save = k => vault.put('data', k, D[k]);

export async function load() {
  D.entries = vault.get('data', 'entries') || [];
  D.cats = vault.get('data', 'cats') || [];
  D.ops = vault.get('data', 'ops') || [];
  D.set = vault.get('data', 'set') || {};
  if (!D.cats.length) { D.cats = defaultRows(); await save('cats'); }
}
export const saveSet = () => save('set');

export const activeEntries = () => D.entries.filter(e => e.status !== 'Deleted');
export const catById = id => D.cats.find(c => c.id === id);
export const topCats = (type, all = false) => D.cats.filter(c => c.type === type && !c.parent && (all || c.active)).sort((a, b) => a.order - b.order);
export const subCats = (parent, all = false) => D.cats.filter(c => c.parent === parent && (all || c.active)).sort((a, b) => a.order - b.order);

function enqueue(op) {
  op.opId = uuid(); op.at = stamp();
  if (op.kind === 'edit') {
    const add = D.ops.find(o => o.kind === 'add' && o.entry.id === op.id && free(o));
    if (add) { Object.assign(add.entry, op.changes); return; }
    const ed = D.ops.find(o => o.kind === 'edit' && o.id === op.id && free(o));
    if (ed) { Object.assign(ed.changes, op.changes); return; }
  } else if (op.kind === 'del') {
    const add = D.ops.find(o => o.kind === 'add' && o.entry.id === op.id && free(o));
    if (add) { D.ops = D.ops.filter(o => !free(o) || !((o.kind === 'add' && o.entry.id === op.id) || (o.kind === 'edit' && o.id === op.id))); return; }
  } else if (op.kind === 'cat') {
    const i = D.ops.findIndex(o => o.kind === 'cat' && o.cat.id === op.cat.id && free(o));
    if (i >= 0) { D.ops[i] = op; return; }
  }
  D.ops.push(op);
}

export async function addEntry(f) {
  const e = { id: uuid(), date: f.date, type: f.type, cat: f.cat, sub: f.sub || '', amount: Number(f.amount), mode: f.mode || '', notes: (f.notes || '').trim(), status: 'Active', by: '', createdAt: stamp(), updatedAt: stamp(), version: 1, local: true };
  D.entries.push(e); enqueue({ kind: 'add', entry: { ...e } });
  await save('entries'); await save('ops'); return e;
}
export async function editEntry(id, f) {
  const e = D.entries.find(x => x.id === id); if (!e) return;
  const changes = {};
  for (const k of ['date', 'type', 'cat', 'sub', 'amount', 'mode', 'notes', 'status']) if (k in f && String(f[k] ?? '') !== String(e[k] ?? '')) changes[k] = k === 'amount' ? Number(f[k]) : f[k];
  if (!Object.keys(changes).length) return;
  Object.assign(e, changes, { updatedAt: stamp() });
  enqueue({ kind: 'edit', id, changes, baseVersion: e.version });
  await save('entries'); await save('ops');
}
export async function deleteEntry(id) {
  const e = D.entries.find(x => x.id === id); if (!e) return;
  const wasLocal = D.ops.some(o => o.kind === 'add' && o.entry.id === id && free(o));
  enqueue({ kind: 'del', id, baseVersion: e.version });
  if (wasLocal) D.entries = D.entries.filter(x => x.id !== id); else e.status = 'Deleted';
  await save('entries'); await save('ops');
  return { e: { ...e, status: 'Active' }, wasLocal };
}
export async function undoDelete(snap) {
  if (snap.wasLocal) { const e = { ...snap.e }; D.entries.push(e); enqueue({ kind: 'add', entry: { ...e } }); }
  else {
    const di = D.ops.findIndex(o => o.kind === 'del' && o.id === snap.e.id && free(o));
    if (di >= 0) D.ops.splice(di, 1); else enqueue({ kind: 'edit', id: snap.e.id, changes: { status: 'Active' }, baseVersion: snap.e.version + 1 });
    const e = D.entries.find(x => x.id === snap.e.id); if (e) e.status = 'Active';
  }
  await save('entries'); await save('ops');
}

export async function putCat(c) {
  const i = D.cats.findIndex(x => x.id === c.id);
  if (i >= 0) D.cats[i] = { ...D.cats[i], ...c }; else D.cats.push({ order: Math.max(0, ...D.cats.map(x => x.order)) + 1, active: true, icon: '', parent: '', ...c, id: c.id || 'u' + uuid().slice(0, 8) });
  const saved = D.cats[i >= 0 ? i : D.cats.length - 1];
  enqueue({ kind: 'cat', cat: { ...saved } });
  await save('cats'); await save('ops'); return saved;
}

// After a sync: take the Excel file's data and re-apply any change made on the phone during the sync.
export async function takeRemote(res, sentIds) {
  const keep = D.ops.filter(o => !sentIds.has(o.opId));
  D.ops = keep;
  const entries = res.entries.map(e => ({ ...e }));
  const byId = new Map(entries.map(e => [e.id, e]));
  let cats = res.cats.length ? res.cats.map(c => ({ ...c })) : D.cats;
  for (const o of keep) {
    if (o.kind === 'add' && !byId.has(o.entry.id)) { const e = { ...o.entry }; entries.push(e); byId.set(e.id, e); }
    else if (o.kind === 'edit' && byId.has(o.id)) Object.assign(byId.get(o.id), o.changes);
    else if (o.kind === 'del' && byId.has(o.id)) byId.get(o.id).status = 'Deleted';
    else if (o.kind === 'cat') { const i = cats.findIndex(c => c.id === o.cat.id); if (i >= 0) cats[i] = { ...o.cat }; else cats.push({ ...o.cat }); }
  }
  // a category used on this phone but missing in Excel stays (it is still waiting to be sent)
  for (const c of D.cats) if (!cats.some(x => x.id === c.id) && keep.some(o => o.kind === 'cat' && o.cat.id === c.id)) cats.push(c);
  D.entries = entries; D.cats = cats;
  await save('entries'); await save('cats'); await save('ops');
}
