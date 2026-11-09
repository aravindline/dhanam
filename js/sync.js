// Sync: the phone's pending changes (outbox) -> the Dhanam Excel file in OneDrive. The Excel file is the
// source of truth. The app writes only its own tables (Entries, Categories, Sync Log, App Meta); it never
// touches the Summary sheet's formulas and never removes rows (a deleted entry is marked "Deleted").
import { Workbook, serialToISO, isoToSerial } from './xlsx.js';
import { TYPE_EN, MODES } from './cats.js';

export class PreconditionFailed extends Error {}
export const T_ENTRIES = 'tblEntries', T_CATS = 'tblCategories', T_LOG = 'tblSyncLog', T_META = 'tblAppMeta';
const TYPE_ID = Object.fromEntries(Object.entries(TYPE_EN).map(([k, v]) => [v, k]));
const MODE_EN = Object.fromEntries(MODES.map(m => [m.id, m.en])), MODE_ID = Object.fromEntries(MODES.map(m => [m.en, m.id]));

const p2 = n => String(n).padStart(2, '0');
export const stamp = (d = new Date()) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
const str = v => (v === null || v === undefined ? '' : String(v));

export function rowToEntry(r) {
  return { id: str(r['Entry ID']), date: typeof r.Date === 'number' ? serialToISO(r.Date) : str(r.Date).slice(0, 10), type: TYPE_ID[r.Type] || 'expense',
    cat: str(r['Category ID']), sub: str(r['Sub ID']), amount: Number(r.Amount) || 0, mode: MODE_ID[r['Payment mode']] || str(r['Payment mode']),
    notes: str(r.Notes), status: str(r.Status) || 'Active', by: str(r['Entered by']), createdAt: str(r['Created at']), updatedAt: str(r['Updated at']), version: Number(r.Version) || 1 };
}
export function rowToCat(r) {
  return { id: str(r.ID), type: TYPE_ID[r.Type] || 'expense', parent: str(r['Parent ID']), ta: str(r.Tamil), en: str(r.English), icon: str(r.Icon),
    order: Number(r.Order) || 0, active: str(r.Active) !== 'No' };
}
const catRow = c => ({ ID: c.id, Type: TYPE_EN[c.type], 'Parent ID': c.parent || null, Tamil: c.ta, English: c.en || null, Icon: c.icon || null, Order: c.order, Active: c.active === false ? 'No' : 'Yes', 'Updated at': stamp() });

// names: id -> {ta, en} for categories, used to write readable names next to the IDs
function entryValues(e, names) {
  const c = names.get(e.cat) || {}, s = names.get(e.sub) || {};
  return { 'Entry ID': e.id, Date: isoToSerial(e.date), Type: TYPE_EN[e.type], 'Category ID': e.cat, Category: c.ta || e.cat, 'Category (English)': c.en || c.ta || null,
    'Sub ID': e.sub || null, 'Sub-category': e.sub ? s.ta || e.sub : null, 'Sub-category (English)': e.sub ? s.en || s.ta || null : null,
    Amount: Number(e.amount), 'Payment mode': e.mode ? MODE_EN[e.mode] || e.mode : null, Notes: e.notes || null };
}

export function isDhanam(wb) { return !!(wb.tables[T_ENTRIES] && wb.tables[T_CATS]); }

// Apply pending changes to the workbook. Returns {applied:[opId], conflicts:[{op, remote}], logCount}.
export function applyOutbox(wb, ops, who, localCats) {
  const now = stamp(), log = [], applied = [], conflicts = [];
  const byId = new Map(wb.tableObjects(T_ENTRIES).filter(r => r['Entry ID']).map(r => [String(r['Entry ID']), r]));
  const catsById = new Map(wb.tableObjects(T_CATS).filter(r => r.ID).map(r => [String(r.ID), r]));
  const names = new Map([...catsById.values()].map(r => [String(r.ID), { ta: str(r.Tamil), en: str(r.English) }]));
  for (const c of localCats || []) if (!names.has(c.id)) names.set(c.id, { ta: c.ta, en: c.en });
  for (const op of ops) {
    if (op.kind === 'cat') {
      const c = op.cat; names.set(c.id, { ta: c.ta, en: c.en });
      const r = catsById.get(c.id); const vals = catRow(c);
      if (r) { for (const [k, v] of Object.entries(vals)) if (k !== 'ID' && str(r[k]) !== str(v) && k !== 'Updated at') wb.setTableCell(T_CATS, r._row, k, v); wb.setTableCell(T_CATS, r._row, 'Updated at', now); }
      else { const row = wb.appendTableRow(T_CATS, vals); catsById.set(c.id, { ...vals, _row: row }); }
      log.push([now, who, r ? 'Category changed' : 'Category added', (c.parent ? c.parent + ' › ' : '') + c.ta + (c.en ? ' / ' + c.en : '') + (c.active === false ? ' (hidden)' : '')]);
      applied.push(op.opId);
    } else if (op.kind === 'add') {
      const e = op.entry;
      if (byId.has(e.id)) { applied.push(op.opId); continue; } // already sent on an earlier try
      const vals = { ...entryValues(e, names), Status: 'Active', 'Entered by': e.by || who, 'Created at': e.createdAt || now, 'Updated at': now, Version: 1 };
      const row = wb.appendTableRow(T_ENTRIES, vals);
      byId.set(e.id, { ...vals, _row: row });
      log.push([now, who, 'New ' + TYPE_EN[e.type].toLowerCase(), e.date + ' · ₹' + e.amount + ' · ' + (names.get(e.cat) || {}).ta + (e.sub ? ' › ' + (names.get(e.sub) || {}).ta : '')]);
      applied.push(op.opId);
    } else if (op.kind === 'edit' || op.kind === 'del') {
      const r = byId.get(op.id);
      if (!r) { conflicts.push({ op, reason: 'missing', remote: null }); continue; }
      const remote = rowToEntry(r);
      if (remote.version !== op.baseVersion) { conflicts.push({ op, reason: 'changed', remote }); continue; }
      if (op.kind === 'del') { wb.setTableCell(T_ENTRIES, r._row, 'Status', 'Deleted'); log.push([now, who, 'Entry deleted', op.id.slice(0, 8) + ' · ' + remote.date + ' · ₹' + remote.amount]); }
      else {
        const vals = entryValues({ ...(remote || {}), ...op.changes, id: op.id }, names);
        const changed = [];
        for (const [k, v] of Object.entries(vals)) { if (k === 'Entry ID') continue; if (str(r[k]) !== str(v)) { wb.setTableCell(T_ENTRIES, r._row, k, v); changed.push(k + ': ' + str(r[k]) + ' → ' + str(v)); } }
        if (op.changes.status && str(r.Status) !== op.changes.status) { wb.setTableCell(T_ENTRIES, r._row, 'Status', op.changes.status); changed.push('Status: ' + str(r.Status) + ' → ' + op.changes.status); }
        log.push([now, who, op.changes.status === 'Active' && r.Status === 'Deleted' ? 'Entry restored' : 'Entry changed', op.id.slice(0, 8) + ' · ' + changed.join('; ')]);
      }
      const nv = remote.version + 1;
      wb.setTableCell(T_ENTRIES, r._row, 'Updated at', now);
      wb.setTableCell(T_ENTRIES, r._row, 'Version', nv);
      // keep our copy of the row current, so a later change to the same entry in this batch builds on this one
      if (op.kind === 'del') r.Status = 'Deleted'; else { Object.assign(r, entryValues({ ...remote, ...op.changes, id: op.id }, names)); if (op.changes.status) r.Status = op.changes.status; }
      r.Version = nv;
      applied.push(op.opId);
    }
  }
  for (const l of log) wb.appendTableRow(T_LOG, { When: l[0], Who: l[1], What: l[2], Details: l[3] });
  if (log.length) {
    const m = wb.tableObjects(T_META).find(x => x.Key === 'lastAppWrite');
    if (m) { wb.setTableCell(T_META, m._row, 'Value', who); wb.setTableCell(T_META, m._row, 'Updated at', now); }
    else wb.appendTableRow(T_META, { Key: 'lastAppWrite', Value: who, 'Updated at': now });
  }
  return { applied, conflicts, logCount: log.length };
}

// One sync round: download, apply, upload (retry if someone saved meanwhile), and read everything back.
// With nothing to send and an unchanged file, nothing is downloaded (saves mobile data).
export async function syncOnce({ transport, ops, who, localCats, lastEtag = null, maxTries = 3 }) {
  if (!ops.length && lastEtag && transport.meta) {
    const m = await transport.meta();
    if (m && m.eTag === lastEtag) return { applied: [], conflicts: [], unchanged: true, etag: lastEtag };
  }
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    const { bytes, etag } = await transport.download();
    const wb = await Workbook.open(bytes);
    if (!isDhanam(wb)) throw Object.assign(new Error('Not the Dhanam Excel file'), { code: 'notdhanam' });
    const res = ops.length ? applyOutbox(wb, ops, who, localCats) : { applied: [], conflicts: [], logCount: 0 };
    let finalWb = wb, newEtag = etag;
    if (res.logCount) {
      const out = await wb.save();
      try { newEtag = (await transport.upload(out, etag)).etag; }
      catch (e) { if (e instanceof PreconditionFailed && attempt < maxTries) continue; throw e; }
      finalWb = await Workbook.open(out);
    }
    const entries = finalWb.tableObjects(T_ENTRIES).filter(r => r['Entry ID']).map(rowToEntry);
    const cats = finalWb.tableObjects(T_CATS).filter(r => r.ID).map(rowToCat);
    return { ...res, entries, cats, etag: newEtag, attempts: attempt };
  }
}
