// Screens: Home, Add/Edit entry, Entries, Loans, Charts, Settings, Categories.
import { D, activeEntries, catById, topCats, subCats, addEntry, editEntry, deleteEntry, undoDelete, putCat } from './store.js';
import { t, lang, label, monthName, errText } from './i18n.js';
import { inr, todayISO, isoDate, parseISO, dateLong, dateShort, monthYear, stampShort } from './fmt.js';
import { h, btn, toast, dialog, confirm, alertBox, pinPad } from './ui.js';
import { MODES, ICONS } from './cats.js';
import { monthBars, monthLine, catBars, legend, monthTable } from './charts.js';
import { voiceSupported, listen, parseSpeech } from './voice.js';
import { S, go, back, tab, render, setPref, doSync, linkFile, linked, syncState, lockNow, VERSION, scheduleSync, FONTS, LOCKS } from './app.js';
import * as auth from './auth.js';
import * as vault from './vault.js';
import * as bio from './bio.js';
import { meta } from './db.js';

export function renderView(view, p) {
  const V = { home, form, entries, loans, charts, settings, cats, catEdit }[view] || home;
  return V(p);
}

// ---------- frame
function topbar(title, opts = {}) {
  const s = syncState();
  return h('header', { class: 'topbar' },
    opts.back ? btn('←', back, 'icon-btn', { 'aria-label': t('back') }) : h('span', { class: 'brand' }, 'தனம்'),
    h('h1', null, title),
    h('button', { type: 'button', class: 'sync-badge ' + s.cls, 'aria-label': s.text, title: s.text, onclick: () => { if (linked()) { doSync(true); toast(s.text); } else tab('settings'); } }, s.icon),
    btn(lang() === 'ta' ? 'English' : 'தமிழ்', () => setPref('lang', lang() === 'ta' ? 'en' : 'ta'), 'lang-btn', { 'aria-label': 'Language' }));
}
function nav(active) {
  const items = [['home', '🏠', t('home')], ['entries', '📋', t('entries')], ['charts', '📊', t('charts')], ['settings', '⚙️', t('settings')]];
  return h('nav', { class: 'bottom-nav' }, items.map(([v, i, l]) => h('button', { type: 'button', class: 'nav-item' + (v === active ? ' on' : ''), onclick: () => tab(v), 'aria-current': v === active ? 'page' : null }, h('span', { class: 'nav-ic' }, i), h('span', null, l))));
}
const page = (title, body, active, opts) => h('div', { class: 'page' + (active ? ' with-nav' : '') }, topbar(title, opts), h('main', { class: 'content' }, body), active ? nav(active) : null);

// ---------- sums
const ym = d => d.slice(0, 7);
function totals(list) { const o = { expense: 0, income: 0, invest: 0, loan: 0 }; for (const e of list) o[e.type] += e.amount; o.savings = o.income - o.expense - o.invest; return o; }
const inMonth = (y, m) => activeEntries().filter(e => ym(e.date) === y + '-' + String(m + 1).padStart(2, '0'));
const inYear = y => activeEntries().filter(e => e.date.startsWith(y + '-'));
const catName = (e, withSub = true) => { const c = catById(e.cat), s = e.sub && catById(e.sub); if (s && withSub && (e.type === 'loan' || e.type === 'invest') && topCats(e.type, true).length === 1) return label(s); return (c ? label(c) : e.cat) + (withSub && s ? ' › ' + label(s) : ''); };
const catIcon = e => (catById(e.cat) || {}).icon || '•';
const sign = type => (type === 'income' ? '+' : type === 'expense' ? '−' : '');

function tile(type, amount, note) { return h('div', { class: 'tile t-' + type }, h('div', { class: 'tile-lbl' }, t(type)), h('div', { class: 'tile-val' }, inr(amount)), note ? h('div', { class: 'tile-note' }, note) : null); }
function entryRow(e) {
  const mode = MODES.find(m => m.id === e.mode);
  return h('button', { type: 'button', class: 'row', onclick: () => go('form', { id: e.id }) },
    h('span', { class: 'row-ic' }, catIcon(e)),
    h('span', { class: 'row-main' }, h('span', { class: 'row-title' }, catName(e)), h('span', { class: 'row-sub' }, [dateShort(e.date), mode ? label(mode) : null, e.notes || null].filter(Boolean).join(' · '))),
    h('span', { class: 'row-amt a-' + e.type }, sign(e.type) + inr(e.amount)));
}
function banners() {
  const out = [];
  if (!linked()) out.push(h('button', { type: 'button', class: 'banner warn', onclick: () => tab('settings') }, '☁️ ' + t('notLinked') + ' ›'));
  else if (S.needsSignIn) out.push(h('button', { type: 'button', class: 'banner warn', onclick: () => auth.signIn() }, '🔑 ' + t('err_signin')));
  if (S.conflicts.length) out.push(h('button', { type: 'button', class: 'banner err', onclick: showConflicts }, '⚠️ ' + t('conflictsTitle') + ' (' + S.conflicts.length + ')'));
  return out;
}
async function showConflicts() {
  const list = h('div', { class: 'conf-list' }, S.conflicts.map(c => h('p', null, (c.remote ? dateShort(c.remote.date) + ' · ' + inr(c.remote.amount) + ' · ' + catName(c.remote) : c.op.id || '') )));
  await dialog(t('conflictsTitle'), h('div', null, h('p', null, t('conflictMsg')), list), [{ label: t('ok'), cls: 'btn primary', value: true }]);
  S.conflicts = []; render();
}

// ---------- Home
function home() {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const tt = totals(inMonth(y, m));
  const recent = activeEntries().filter(e => e.type !== 'loan').sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, 5);
  const todayList = activeEntries().filter(e => e.date === todayISO());
  const nudge = todayList.length
    ? h('div', { class: 'today-card done' }, '✅ ' + t('todayDone') + ': ' + todayList.length)
    : h('div', { class: 'today-card' }, h('strong', null, '📝 ' + t('todayNone')), h('span', { class: 'small' }, t('todayHint')));
  return page(t('home'), [
    ...banners(),
    nudge,
    h('section', { class: 'card' },
      h('h2', { class: 'card-title' }, t('thisMonth') + ' · ' + monthYear(y, m)),
      h('div', { class: 'tiles' }, tile('income', tt.income), tile('expense', tt.expense), tile('invest', tt.invest), tile('savings', tt.savings)),
      h('p', { class: 'muted small' }, t('savingsNote'))),
    h('div', { class: 'add-row' }, btn(t('addExpense'), () => go('form', { type: 'expense' }), 'btn add-exp'), btn(t('addIncome'), () => go('form', { type: 'income' }), 'btn add-inc')),
    btn(t('addInvest'), () => go('form', { type: 'invest' }), 'btn add-inv'),
    h('section', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { class: 'card-title' }, t('recent')), recent.length ? btn(t('seeAll') + ' ›', () => tab('entries'), 'link-btn') : null),
      recent.length ? h('div', { class: 'rows' }, recent.map(entryRow)) : h('p', { class: 'muted' }, t('noEntries'))),
    btn('🤝 ' + t('loansTitle') + ' ›', () => go('loans'), 'btn ghost wide'),
  ], 'home');
}

// ---------- Add / edit entry
function form(p) {
  const old = p.id ? D.entries.find(e => e.id === p.id) : null;
  const f = old ? { ...old } : { type: p.type || 'expense', date: todayISO(), amount: '', cat: '', sub: '', mode: '', notes: '' };
  if (!old && (f.type === 'invest' || f.type === 'loan')) { const tc = topCats(f.type); if (tc.length === 1) f.cat = tc[0].id; }
  const body = h('div', { class: 'form' });
  const err = h('p', { class: 'form-err', role: 'alert' });
  let heard = null;
  const draw = () => {
    body.innerHTML = ''; err.textContent = '';
    if (f.type !== 'loan') body.appendChild(h('div', { class: 'seg', role: 'tablist' }, ['expense', 'income', 'invest'].map(ty => btn(t(ty), () => { if (f.type === ty) return; f.type = ty; f.cat = ''; f.sub = ''; const tc = topCats(ty); if (tc.length === 1) f.cat = tc[0].id; draw(); }, 'seg-btn s-' + ty + (f.type === ty ? ' on' : ''), { role: 'tab', 'aria-selected': f.type === ty ? 'true' : 'false' }))));
    if (voiceSupported()) body.appendChild(h('div', { class: 'voice' }, btn(t('speak'), speak, 'btn voice-btn'), heard ? h('p', { class: 'heard' }, t('youSaid') + ': "' + heard + '" · ' + t('voiceCheck')) : h('p', { class: 'muted small' }, t('voiceHint'))));
    const amt = h('input', { class: 'amount', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': t('amount'), placeholder: '0', value: f.amount === '' ? '' : String(f.amount), oninput: e => { const v = e.target.value.replace(/[^\d.]/g, ''); e.target.value = v; f.amount = v; } });
    body.appendChild(h('label', { class: 'fld' }, h('span', { class: 'fld-lbl' }, t('amount') + ' (₹)'), h('div', { class: 'amount-wrap' }, h('span', { class: 'rupee' }, '₹'), amt)));
    const tops = topCats(f.type).concat(old && f.cat && !topCats(f.type).some(c => c.id === f.cat) && catById(f.cat) ? [catById(f.cat)] : []);
    if (tops.length > 1 || !f.cat) {
      body.appendChild(h('div', { class: 'fld' }, h('span', { class: 'fld-lbl' }, t('category')), h('div', { class: 'cat-grid' }, tops.map(c => btn([h('span', { class: 'cat-ic' }, c.icon || '•'), h('span', { class: 'cat-nm' }, label(c))], () => { f.cat = c.id; f.sub = ''; draw(); }, 'cat-tile' + (f.cat === c.id ? ' on' : ''), { 'aria-pressed': f.cat === c.id ? 'true' : 'false' })))));
    }
    if (f.cat) {
      const subs = subCats(f.cat).concat(old && f.sub && !subCats(f.cat).some(s => s.id === f.sub) && catById(f.sub) ? [catById(f.sub)] : []);
      if (subs.length) body.appendChild(h('div', { class: 'fld' }, h('span', { class: 'fld-lbl' }, (tops.length > 1 ? t('sub') + ' ' + t('optional') : label(catById(f.cat)) + ' — ' + t('sub'))), h('div', { class: 'chips' }, subs.map(s => btn(label(s), () => { f.sub = f.sub === s.id ? '' : s.id; draw(); }, 'chip' + (f.sub === s.id ? ' on' : ''), { 'aria-pressed': f.sub === s.id ? 'true' : 'false' })))));
    }
    const yest = isoDate(new Date(Date.now() - 86400000));
    const dateIn = h('input', { type: 'date', class: 'date-in', value: f.date, max: todayISO(), 'aria-label': t('pickDate'), onchange: e => { if (e.target.value) { f.date = e.target.value; draw(); } } });
    body.appendChild(h('div', { class: 'fld' }, h('span', { class: 'fld-lbl' }, t('date') + ': ' + dateLong(f.date)), h('div', { class: 'chips' },
      btn(t('today'), () => { f.date = todayISO(); draw(); }, 'chip' + (f.date === todayISO() ? ' on' : '')),
      btn(t('yesterday'), () => { f.date = yest; draw(); }, 'chip' + (f.date === yest ? ' on' : '')),
      h('label', { class: 'chip date-chip' + (f.date !== todayISO() && f.date !== yest ? ' on' : '') }, '📅 ' + t('pickDate'), dateIn))));
    body.appendChild(h('div', { class: 'fld' }, h('span', { class: 'fld-lbl' }, (f.type === 'income' ? t('modeIn') : t('mode')) + ' ' + t('optional')), h('div', { class: 'chips' }, MODES.map(m => btn(m.icon + ' ' + label(m), () => { f.mode = f.mode === m.id ? '' : m.id; draw(); }, 'chip' + (f.mode === m.id ? ' on' : ''), { 'aria-pressed': f.mode === m.id ? 'true' : 'false' })))));
    body.appendChild(h('label', { class: 'fld' }, h('span', { class: 'fld-lbl' }, t('notes') + ' ' + t('optional')), h('input', { type: 'text', class: 'txt', value: f.notes || '', placeholder: t('notesPh'), maxlength: 200, oninput: e => { f.notes = e.target.value; } })));
    body.appendChild(err);
    body.appendChild(h('div', { class: 'form-actions' }, old ? btn('🗑 ' + t('delete'), del, 'btn danger-ghost') : null, btn('✓ ' + t('save'), saveIt, 'btn primary big save-btn')));
  };
  const saveIt = async () => {
    const a = Number(f.amount);
    if (!f.amount || !(a > 0)) { err.textContent = t('needAmount'); body.querySelector('.amount')?.focus(); return; }
    if (!f.cat) { err.textContent = t('needCat'); return; }
    if (!f.date) { err.textContent = t('needDate'); return; }
    if (old) { await editEntry(old.id, f); toast(t('updated')); back(); }
    else { const e = await addEntry(f); back(); toast(t('saved') + ' · ' + inr(e.amount), { label: t('undo'), run: async () => { await deleteEntry(e.id); render(); scheduleSync(); } }); }
    scheduleSync();
  };
  const del = async () => {
    if (!(await confirm(t('confirmDelete') + '\n' + inr(old.amount) + ' · ' + catName(old), t('delete'), true))) return;
    const snap = await deleteEntry(old.id); back();
    toast(t('deleted'), { label: t('undo'), run: async () => { await undoDelete(snap); render(); scheduleSync(); } }); scheduleSync();
  };
  const speak = async () => {
    const vb = body.querySelector('.voice-btn'); vb.textContent = t('listening'); vb.classList.add('listening');
    try {
      const alts = await listen(lang());
      const r = parseSpeech(alts, D.cats.filter(c => c.active), f.type);
      heard = r.text;
      if (r.type && r.type !== f.type && f.type !== 'loan' && r.type !== 'loan') { f.type = r.type; f.cat = ''; f.sub = ''; }
      if (r.cat && r.type === f.type) { f.cat = r.cat; f.sub = r.sub || ''; }
      if (r.amount) f.amount = String(r.amount);
      if (r.mode) f.mode = r.mode;
      draw();
    } catch (e) { draw(); err.textContent = e.code === 'voicenet' ? t('voiceNet') : e.message === 'not-allowed' ? t('voiceNo') : t('voiceFail'); }
  };
  draw();
  const title = old ? t('editEntry') : f.type === 'loan' ? t('loan') : t('newEntry');
  return page(title, body, null, { back: true });
}

// ---------- Entries list
function monthNav(y, m, onChange) {
  const now = new Date(); const isNow = y === now.getFullYear() && m === now.getMonth();
  return h('div', { class: 'month-nav' },
    btn('◀', () => onChange(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1), 'icon-btn big', { 'aria-label': 'previous' }),
    h('strong', null, monthYear(y, m)),
    btn('▶', () => onChange(m === 11 ? y + 1 : y, m === 11 ? 0 : m + 1), 'icon-btn big', { 'aria-label': 'next', disabled: isNow }));
}
function grouped(list) {
  const out = []; let last = null;
  for (const e of list.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))) {
    if (e.date !== last) { out.push(h('h3', { class: 'day' }, dateLong(e.date))); last = e.date; }
    out.push(entryRow(e));
  }
  return out;
}
function entries(p) {
  const now = new Date(); const y = p.y ?? now.getFullYear(), m = p.m ?? now.getMonth(), ty = p.ty || 'all';
  const list = inMonth(y, m).filter(e => e.type !== 'loan' && (ty === 'all' || e.type === ty));
  const tt = totals(list);
  const set = q => { S.params = { y, m, ty, ...q }; render(); };
  return page(t('entries'), [
    monthNav(y, m, (yy, mm) => set({ y: yy, m: mm })),
    h('div', { class: 'chips filters' }, ['all', 'expense', 'income', 'invest'].map(k => btn(t(k), () => set({ ty: k }), 'chip' + (ty === k ? ' on' : '')))),
    h('p', { class: 'sum-line' }, ty === 'all' ? [t('income') + ' ' + inr(tt.income), t('expense') + ' ' + inr(tt.expense), t('invest') + ' ' + inr(tt.invest)].join('  ·  ') : t('total') + ': ' + inr(tt[ty])),
    list.length ? h('div', { class: 'rows' }, grouped(list)) : h('p', { class: 'muted center-text' }, t('noEntries')),
  ], 'entries');
}

// ---------- Loans (kept separate)
function loans() {
  const list = activeEntries().filter(e => e.type === 'loan');
  const y = new Date().getFullYear();
  const bySub = {}; for (const e of list.filter(e => e.date.startsWith(y + '-'))) { const k = e.sub || e.cat; bySub[k] = (bySub[k] || 0) + e.amount; }
  return page(t('loansTitle'), [
    h('p', { class: 'muted' }, t('loansNote')),
    btn(t('addLoan'), () => go('form', { type: 'loan' }), 'btn primary big wide'),
    Object.keys(bySub).length ? h('section', { class: 'card' }, h('h2', { class: 'card-title' }, String(y)), h('div', { class: 'kv' }, Object.entries(bySub).map(([k, v]) => h('div', { class: 'kv-row' }, h('span', null, label(catById(k)) || k), h('strong', null, inr(v)))))) : null,
    list.length ? h('div', { class: 'rows' }, grouped(list)) : h('p', { class: 'muted center-text' }, t('noEntries')),
  ], null, { back: true });
}

// ---------- Charts
function charts(p) {
  const now = new Date(); const y = p.y ?? now.getFullYear();
  const cm = p.cm ?? (y === now.getFullYear() ? now.getMonth() : -1);
  const list = inYear(y);
  const months = ty => { const v = Array(12).fill(0); for (const e of list) if (e.type === ty) v[parseISO(e.date).getMonth()] += e.amount; return v; };
  const inc = months('income'), exp = months('expense'), inv = months('invest');
  const yt = totals(list);
  const set = q => { S.params = { y, cm, ...q }; render(); };
  const s1 = [{ key: 'income', name: t('income'), cls: 'c-inc', values: inc }, { key: 'expense', name: t('expense'), cls: 'c-exp', values: exp }];
  const pick1 = h('p', { class: 'pick' }, t('tapBar'));
  const b1 = monthBars(s1, m => { pick1.textContent = monthName(m) + ': ' + t('income') + ' ' + inr(inc[m]) + ' · ' + t('expense') + ' ' + inr(exp[m]) + ' · ' + t('savings') + ' ' + inr(inc[m] - exp[m] - inv[m]); });
  const pick2 = h('p', { class: 'pick' }, t('tapBar'));
  const l2 = monthLine(exp, 'c-exp', m => { const prev = m > 0 ? exp[m - 1] : null; pick2.textContent = monthName(m) + ': ' + inr(exp[m]) + (prev ? '  (' + (exp[m] >= prev ? '▲ ' : '▼ ') + inr(Math.abs(exp[m] - prev)) + ')' : ''); });
  // category-wise
  const sel = list.filter(e => e.type === 'expense' && (cm < 0 || parseISO(e.date).getMonth() === cm));
  const byCat = new Map(); for (const e of sel) byCat.set(e.cat, (byCat.get(e.cat) || 0) + e.amount);
  const items = [...byCat.entries()].map(([id, v]) => { const c = catById(id); return { id, icon: c ? c.icon : '•', name: c ? label(c) : id, value: v }; }).sort((a, b) => b.value - a.value);
  const subBox = (it, row) => {
    const nx = row.nextElementSibling; if (nx && nx.classList.contains('sub-break')) { nx.remove(); return; }
    const bs = new Map(); for (const e of sel.filter(e => e.cat === it.id)) { const k = e.sub || ''; bs.set(k, (bs.get(k) || 0) + e.amount); }
    row.after(h('div', { class: 'sub-break' }, [...bs.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => h('div', { class: 'kv-row' }, h('span', null, k ? label(catById(k)) || k : '—'), h('strong', null, inr(v))))));
  };
  return page(t('charts'), [
    h('div', { class: 'month-nav' }, btn('◀', () => set({ y: y - 1, cm: -1 }), 'icon-btn big', { 'aria-label': 'previous year' }), h('strong', null, t('year') + ' ' + y), btn('▶', () => set({ y: y + 1, cm: y + 1 === now.getFullYear() ? now.getMonth() : -1 }), 'icon-btn big', { 'aria-label': 'next year', disabled: y >= now.getFullYear() })),
    h('div', { class: 'tiles' }, tile('income', yt.income), tile('expense', yt.expense), tile('invest', yt.invest), tile('savings', yt.savings)),
    h('section', { class: 'card' }, h('h2', { class: 'card-title' }, t('incVsExp')), legend(s1), b1, pick1, h('details', null, h('summary', null, t('showTable')), monthTable([...s1, { name: t('invest'), values: inv }, { name: t('savings'), values: inc.map((v, i) => v - exp[i] - inv[i]) }]))),
    h('section', { class: 'card' }, h('h2', { class: 'card-title' }, t('expTrend')), l2, pick2),
    h('section', { class: 'card' }, h('h2', { class: 'card-title' }, t('catWise')),
      h('select', { class: 'sel-big', 'aria-label': t('month'), onchange: e => set({ cm: Number(e.target.value) }) }, [h('option', { value: -1, selected: cm < 0 }, t('wholeYear') + ' ' + y), ...Array.from({ length: 12 }, (_, i) => h('option', { value: i, selected: cm === i }, monthName(i) + ' ' + y))]),
      items.length ? [h('p', { class: 'muted small' }, t('total') + ': ' + inr(items.reduce((a, i) => a + i.value, 0)) + ' · ' + t('tapBar')), catBars(items, subBox)] : h('p', { class: 'muted' }, t('noData'))),
  ], 'charts');
}

// ---------- Settings
function settings() {
  const curFont = Math.max(0, FONTS.indexOf(parseFloat(document.documentElement.style.fontSize)));
  const curLock = S.lockMs || 60000;
  const acct = auth.currentAccount();
  const fs = D.set; const st = syncState();
  const linkIn = h('input', { type: 'url', class: 'txt', placeholder: 'https://1drv.ms/x/…', 'aria-label': t('fileLink') });
  const doLink = async () => { const v = linkIn.value.trim(); if (!v) return; try { await linkFile(v); toast(t('syncedOk')); render(); } catch (e) { alertBox(errText(e)); } };
  const fpSec = h('div', { class: 'set-row' }, h('span', null, t('fingerprint')), h('span', { class: 'muted' }, '…'));
  (async () => {
    const sup = await bio.supported(), on = await bio.enrolled();
    fpSec.innerHTML = '';
    fpSec.append(h('span', null, t('fingerprint') + ': ' + (on ? t('fpOn') : t('fpOff'))));
    if (!sup) fpSec.append(h('span', { class: 'muted small' }, t('fpNone')));
    else if (on) fpSec.append(btn(t('fpTurnOff'), async () => { await bio.disable(); render(); }, 'btn small'));
    else fpSec.append(btn(t('fpTurnOn'), () => askPin(async p => { await bio.enroll(await vault.rawKeyFor(p), 'Amma'); toast(t('fpDone')); render(); }), 'btn small'));
  })();
  return page(t('settings'), [
    h('section', { class: 'card' }, h('h2', { class: 'card-title' }, t('language')),
      h('div', { class: 'seg' }, btn('தமிழ்', () => setPref('lang', 'ta'), 'seg-btn' + (lang() === 'ta' ? ' on' : '')), btn('English', () => setPref('lang', 'en'), 'seg-btn' + (lang() === 'en' ? ' on' : '')))),
    h('section', { class: 'card' }, h('h2', { class: 'card-title' }, t('fontSize')),
      h('div', { class: 'fs-row' },
        btn('அ −', () => setPref('font', Math.max(0, curFont - 1)), 'btn fs-btn fs-minus', { 'aria-label': t('smaller'), disabled: curFont <= 0 }),
        h('div', { class: 'fs-level' }, h('strong', null, (curFont + 1) + ' / ' + FONTS.length), h('div', { class: 'fs-dots' }, FONTS.map((_, i) => h('span', { class: 'fs-dot' + (i <= curFont ? ' on' : '') })))),
        btn('அ +', () => setPref('font', Math.min(FONTS.length - 1, curFont + 1)), 'btn fs-btn fs-plus', { 'aria-label': t('bigger'), disabled: curFont >= FONTS.length - 1 })),
      h('p', { class: 'muted small' }, t('fsHint'))),
    h('section', { class: 'card' }, h('h2', { class: 'card-title' }, t('categories')), btn('🗂 ' + t('manageCats') + ' ›', () => go('cats', { type: 'expense' }), 'btn wide')),
    h('section', { class: 'card' }, h('h2', { class: 'card-title' }, '☁️ ' + t('sync')),
      !auth.configured() ? h('p', { class: 'muted' }, 'Sign-in not set up') :
        acct ? h('div', { class: 'set-row' }, h('span', null, t('signedInAs') + ': ' + (acct.username || acct.name)), btn(t('signOut'), () => askPin(async () => { if (await confirm(t('signOutWarn'), t('signOut'), true)) auth.signOut(); }), 'btn small ghost'))
          : btn('🔑 ' + t('signIn'), () => auth.signIn(), 'btn primary wide'),
      acct && linked() ? [h('div', { class: 'set-row' }, h('span', null, t('linked') + ': ' + (fs.fileName || '')), h('span', { class: 'pill ' + st.cls }, st.icon + ' ' + st.text)),
        h('p', { class: 'muted small' }, t('lastSync') + ': ' + (fs.lastSync ? stampShort(fs.lastSync) : t('never')) + (D.ops.length ? ' · ' + D.ops.length + ' ' + t('pending') : '')),
        btn('⟳ ' + t('syncNow'), async () => { await doSync(true); }, 'btn wide'),
        h('details', null, h('summary', null, t('changeFile')), h('div', { class: 'link-box' }, linkIn, btn(t('linkFile'), doLink, 'btn')))] : null,
      acct && !linked() ? [h('p', { class: 'muted small' }, t('linkOffer')), h('div', { class: 'link-box' }, h('span', { class: 'fld-lbl' }, t('fileLink')), linkIn, btn(t('linkFile'), doLink, 'btn primary'))] : null,
      S.needsSignIn ? btn('🔑 ' + t('signIn'), () => auth.signIn(), 'btn primary wide') : null),
    h('section', { class: 'card' }, h('h2', { class: 'card-title' }, '🔒 ' + t('lock')), h('span', { class: 'fld-lbl' }, t('autoLockQ')),
      h('div', { class: 'chips' }, LOCKS.map(ms => btn(ms < 60000 ? ms / 1000 + ' ' + t('sec') : ms / 60000 + ' ' + t('min'), async () => { await meta.set('lockMs', ms); S.lockMs = ms; await setPref('lockMs', ms); }, 'chip' + (curLock === ms ? ' on' : '')))), fpSec,
      h('div', { class: 'btn-row' }, btn(t('changePin'), changePin, 'btn'), btn(t('lockNow'), lockNow, 'btn'))),
    h('section', { class: 'card' }, h('h2', { class: 'card-title' }, '⏰ ' + t('reminder')), h('p', { class: 'muted small' }, t('reminderNote'))),
    h('section', { class: 'card' }, h('h2', { class: 'card-title' }, t('about')), h('p', { class: 'muted small' }, 'தனம் · ' + t('version') + ' ' + VERSION),
      btn(t('resetPhone'), async () => { if (await confirm(t('resetConfirm'), t('delete'), true)) { await vault.resetDevice(); location.reload(); } }, 'btn danger-ghost small')),
  ], 'settings');
}
function askPin(then) {
  return new Promise(res => {
    const wrap = h('div', { class: 'modal-wrap' });
    const pad = pinPad(t('enterPin'), async p => { try { await vault.rawKeyFor(p); } catch (e) { pad.clear(); pad.setMsg(t('wrongPin'), true); return; } wrap.remove(); try { await then(p); } catch (e) { alertBox(e.message); } res(true); });
    wrap.appendChild(h('div', { class: 'modal' }, pad.el, btn(t('cancel'), () => { wrap.remove(); res(false); }, 'btn ghost wide')));
    document.body.appendChild(wrap);
  });
}
function changePin() {
  askPin(async oldPin => {
    let first = null;
    const wrap = h('div', { class: 'modal-wrap' });
    const pad = pinPad(t('newPin'), async p => {
      if (!first) { first = p; pad.clear(); pad.setTitle(t('confirmPin')); return; }
      if (p !== first) { first = null; pad.clear(); pad.setTitle(t('newPin')); pad.setMsg(t('pinMismatch'), true); return; }
      await vault.changeSecret(oldPin, 'pin', p); wrap.remove(); toast(t('pinChanged')); render();
    });
    wrap.appendChild(h('div', { class: 'modal' }, pad.el, btn(t('cancel'), () => wrap.remove(), 'btn ghost wide')));
    document.body.appendChild(wrap);
  });
}

// ---------- Categories
function cats(p) {
  const type = p.type || 'expense';
  const set = ty => { S.params = { type: ty }; render(); };
  const list = topCats(type, true);
  return page(t('categories'), [
    h('div', { class: 'seg four' }, ['expense', 'income', 'invest', 'loan'].map(ty => btn(t(ty), () => set(ty), 'seg-btn' + (ty === type ? ' on' : '')))),
    h('div', { class: 'rows' }, list.map(c => h('button', { type: 'button', class: 'row' + (c.active ? '' : ' dim'), onclick: () => go('catEdit', { id: c.id }) },
      h('span', { class: 'row-ic' }, c.icon || '•'), h('span', { class: 'row-main' }, h('span', { class: 'row-title' }, label(c)), h('span', { class: 'row-sub' }, [c.active ? null : t('hidden'), subCats(c.id, true).map(label).join(', ')].filter(Boolean).join(' · '))), h('span', { class: 'row-amt' }, '›')))),
    btn(t('addCat'), async () => { const r = await nameDialog(t('addCat'), {}, true); if (r) { const c = await putCat({ type, parent: '', ta: r.ta, en: r.en, icon: r.icon || '📦' }); scheduleSync(); go('catEdit', { id: c.id }); } }, 'btn primary wide'),
  ], null, { back: true });
}
function catEdit(p) {
  const c = catById(p.id); if (!c) return cats({ type: 'expense' });
  const subs = subCats(c.id, true);
  return page(label(c), [
    h('section', { class: 'card' }, h('div', { class: 'cat-head' }, h('span', { class: 'big-ic' }, c.icon || '•'), h('div', null, h('div', { class: 'row-title' }, c.ta), h('div', { class: 'muted' }, c.en || ''))),
      h('div', { class: 'btn-row' }, btn('✏️ ' + t('edit'), async () => { const r = await nameDialog(label(c), c, true); if (r) { await putCat({ ...c, ...r }); scheduleSync(); render(); } }, 'btn'),
        btn(c.active ? '🙈 ' + t('hide') : '👁 ' + t('show'), async () => { await putCat({ ...c, active: !c.active }); scheduleSync(); render(); }, 'btn'))),
    h('h3', { class: 'day' }, t('subsOf')),
    h('div', { class: 'rows' }, subs.map(s => h('div', { class: 'row static' + (s.active ? '' : ' dim') }, h('span', { class: 'row-main' }, h('span', { class: 'row-title' }, s.ta), h('span', { class: 'row-sub' }, [s.en, s.active ? null : t('hidden')].filter(Boolean).join(' · '))),
      btn('✏️', async () => { const r = await nameDialog(label(s), s, false); if (r) { await putCat({ ...s, ...r }); scheduleSync(); render(); } }, 'icon-btn', { 'aria-label': 'edit' }),
      btn(s.active ? '🙈' : '👁', async () => { await putCat({ ...s, active: !s.active }); scheduleSync(); render(); }, 'icon-btn', { 'aria-label': s.active ? t('hide') : t('show') })))),
    btn(t('addSub'), async () => { const r = await nameDialog(t('addSub'), {}, false); if (r) { await putCat({ type: c.type, parent: c.id, ta: r.ta, en: r.en, icon: '' }); scheduleSync(); render(); } }, 'btn primary wide'),
  ], null, { back: true });
}
async function nameDialog(title, c, withIcon) {
  const ta = h('input', { type: 'text', class: 'txt', value: c.ta || '', maxlength: 40 }), en = h('input', { type: 'text', class: 'txt', value: c.en || '', maxlength: 40 });
  let icon = c.icon || ''; const err = h('p', { class: 'form-err' });
  const grid = withIcon ? h('div', { class: 'icon-grid' }) : null;
  const drawIcons = () => { grid.innerHTML = ''; ICONS.forEach(i => grid.appendChild(btn(i, () => { icon = i; drawIcons(); }, 'icon-pick' + (icon === i ? ' on' : '')))); };
  if (grid) drawIcons();
  const body = h('div', { class: 'form' }, h('label', { class: 'fld' }, h('span', { class: 'fld-lbl' }, t('nameTa')), ta), h('label', { class: 'fld' }, h('span', { class: 'fld-lbl' }, t('nameEn') + ' ' + t('optional')), en), grid ? h('div', { class: 'fld' }, h('span', { class: 'fld-lbl' }, t('icon')), grid) : null, err);
  for (;;) {
    const v = await dialog(title, body, [{ label: t('cancel'), cls: 'btn ghost', value: false }, { label: t('save'), cls: 'btn primary', value: true }]);
    if (!v) return null;
    if (!ta.value.trim() && !en.value.trim()) { err.textContent = t('needName'); continue; }
    return { ta: ta.value.trim() || en.value.trim(), en: en.value.trim(), ...(withIcon ? { icon: icon || '📦' } : {}) };
  }
}
