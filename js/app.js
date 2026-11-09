// தனம் — Amma's expense and income app. Start-up, lock, sync and navigation.
import { CONFIG } from './config.js';
import * as vault from './vault.js';
import * as bio from './bio.js';
import * as auth from './auth.js';
import { meta, records } from './db.js';
import { GraphFile } from './graph.js';
import { syncOnce } from './sync.js';
import { D, load, saveSet, takeRemote, inFlight } from './store.js';
import { t, setLang, lang, errText } from './i18n.js';
import { h, btn, pinPad, confirm, toast } from './ui.js';
import { renderView } from './views.js';

export const VERSION = '1.0.0';
export const S = { view: 'home', params: {}, stack: [], syncing: false, syncErr: null, needsSignIn: false, conflicts: [] };
const FONTS = [17, 19.5, 22];
const root = () => document.getElementById('app');

export async function applyPrefs() {
  setLang((await meta.get('lang')) || 'ta');
  document.documentElement.style.fontSize = FONTS[(await meta.get('font')) ?? 0] + 'px';
}
export async function setPref(k, v) { await meta.set(k, v); await applyPrefs(); render(); }

// ---------- navigation
export function go(view, params = {}, push = true) {
  if (push && S.view !== view) S.stack.push({ view: S.view, params: S.params });
  S.view = view; S.params = params; render(); window.scrollTo(0, 0);
}
export function back() { const p = S.stack.pop(); if (p) { S.view = p.view; S.params = p.params; } else { S.view = 'home'; S.params = {}; } render(); }
export function tab(view) { document.querySelector('.toast')?.remove(); S.stack = []; S.view = view; S.params = {}; render(); window.scrollTo(0, 0); }

export function render() {
  if (!vault.isUnlocked()) return;
  const r = root(); r.innerHTML = '';
  r.appendChild(renderView(S.view, S.params));
}

// ---------- first run and lock
async function setupFlow() {
  const r = root();
  const langStep = () => { r.innerHTML = ''; r.appendChild(h('main', { class: 'center setup' },
    h('div', { class: 'logo' }, 'தனம்'), h('h1', null, 'வணக்கம்! / Welcome!'), h('p', null, 'மொழியைத் தேர்ந்தெடுக்கவும் / Choose language'),
    btn('தமிழ்', async () => { await meta.set('lang', 'ta'); await applyPrefs(); pinStep(); }, 'btn primary big'),
    btn('English', async () => { await meta.set('lang', 'en'); await applyPrefs(); pinStep(); }, 'btn big'))); };
  const pinStep = () => {
    let first = null;
    const pad = pinPad(t('createPin'), async p => {
      if (!first) { first = p; pad.clear(); pad.setTitle(t('confirmPin')); pad.setMsg(''); return; }
      if (p !== first) { first = null; pad.clear(); pad.setTitle(t('createPin')); pad.setMsg(t('pinMismatch'), true); return; }
      await vault.setup('pin', p); await load(); fpStep(p);
    });
    r.innerHTML = ''; r.appendChild(h('main', { class: 'center setup' }, h('div', { class: 'logo' }, 'தனம்'), pad.el));
  };
  const fpStep = async p => {
    if (!(await bio.supported())) return started();
    r.innerHTML = ''; r.appendChild(h('main', { class: 'center setup' }, h('div', { class: 'logo' }, '👆'), h('h2', null, t('fpOffer')),
      btn(t('fpTurnOn'), async () => { try { await bio.enroll(await vault.rawKeyFor(p), 'Amma'); toast(t('fpDone')); } catch (e) { toast(e.message); } started(); }, 'btn primary big'),
      btn(t('later'), started, 'btn ghost big')));
  };
  langStep();
}

let lockTimer = null;
async function lockScreen() {
  const r = root(); vault.lock(); D.entries = []; D.ops = []; D.cats = []; D.set = {}; S.view = 'home'; S.stack = []; document.querySelector('.modal-wrap')?.remove(); r.innerHTML = '';
  const wait = await vault.waitRemaining();
  const hasFp = await bio.enrolled();
  const tryPin = async p => {
    const res = await vault.unlock(p);
    if (res.ok) return started();
    pad.clear();
    if (res.wait) { pad.setMsg(Math.ceil(res.wait / 1000) + ' ' + t('waitSec'), true); clearTimeout(lockTimer); lockTimer = setTimeout(() => pad.setMsg(''), res.wait); }
    else pad.setMsg(t('wrongPin'), true);
  };
  const fpKey = hasFp ? btn('👆', () => fp(), 'key key-fp', { 'aria-label': t('useFp') }) : null;
  const pad = pinPad(t('enterPin'), tryPin, fpKey);
  const fp = async () => { try { const raw = await bio.unlockKey(); await vault.unlockWithRaw(raw); started(); } catch (e) { pad.setMsg(e.message, true); } };
  r.appendChild(h('main', { class: 'center lock' }, h('div', { class: 'logo' }, 'தனம்'), pad.el,
    hasFp ? btn('👆 ' + t('useFp'), fp, 'btn big fp-btn') : null,
    btn(t('forgotPin'), async () => { if (await confirm(t('forgotMsg') + '\n\n' + t('resetConfirm'), t('delete'), true)) { await vault.resetDevice(); location.reload(); } }, 'link-btn')));
  if (wait > 0) pad.setMsg(Math.ceil(wait / 1000) + ' ' + t('waitSec'), true);
}
export function lockNow() { lockScreen(); }

async function started() {
  await load();
  render();
  scheduleSync(500);
}

// Lock 60 s after leaving the app.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') hiddenAt = Date.now();
  else if (vault.isUnlocked() && hiddenAt && Date.now() - hiddenAt > CONFIG.lockAfterMs) lockScreen();
  else if (vault.isUnlocked()) scheduleSync(1000);
});

// ---------- sync
let syncTimer = null;
export function scheduleSync(ms = 2500) { clearTimeout(syncTimer); syncTimer = setTimeout(() => doSync(false), ms); }
export const linked = () => !!(D.set.driveId && D.set.itemId);
export function transport(interactive) { return new GraphFile({ base: CONFIG.graphBase, getToken: () => auth.getToken(interactive), driveId: D.set.driveId, itemId: D.set.itemId }); }
export async function linkFile(link) {
  const f = await GraphFile.fromShareLink({ base: CONFIG.graphBase, getToken: () => auth.getToken(true), link });
  Object.assign(D.set, { driveId: f.driveId, itemId: f.itemId, fileName: f.name, etag: null, lastSync: null }); await saveSet();
  // the phone's own entries are replaced by the file's (anything not yet sent is sent first)
  await doSync(true, true);
}
export async function doSync(interactive = false, throwErr = false) {
  if (!vault.isUnlocked() || !auth.configured() || !auth.currentAccount() || !linked()) return;
  if (S.syncing) { scheduleSync(3000); return; }
  if (!navigator.onLine) { S.syncErr = { code: 'net' }; refreshBadge(); return; }
  S.syncing = true; refreshBadge();
  const ops = D.ops.slice(); ops.forEach(o => inFlight.add(o.opId));
  try {
    const acct = auth.currentAccount();
    const res = await syncOnce({ transport: transport(interactive), ops, who: acct.name || acct.username, localCats: D.cats, lastEtag: D.set.etag });
    if (!res.unchanged) {
      const sent = new Set([...res.applied, ...res.conflicts.map(c => c.op.opId)]);
      await takeRemote(res, sent);
      if (res.conflicts.length) S.conflicts.push(...res.conflicts);
    }
    D.set.etag = res.etag; D.set.lastSync = new Date().toISOString(); await saveSet();
    S.syncErr = null; S.needsSignIn = false;
  } catch (e) {
    S.syncErr = e; S.needsSignIn = auth.needsSignIn() || e.code === 'signin';
    if (e.locked) scheduleSync(120000);
    if (throwErr) throw e;
  } finally {
    ops.forEach(o => inFlight.delete(o.opId)); S.syncing = false;
    if (D.ops.some(o => !ops.includes(o)) && !S.syncErr) scheduleSync(1500);
    if (['home', 'entries', 'loans', 'charts', 'settings'].includes(S.view) && !document.querySelector('.modal-wrap') && !document.activeElement?.matches('input, textarea')) render(); else refreshBadge();
  }
}
export function syncState() {
  if (!linked()) return { cls: 'off', text: t('notLinked'), icon: '○' };
  if (S.syncing) return { cls: 'busy', text: t('syncing'), icon: '⟳' };
  if (S.syncErr) return { cls: 'err', text: errText(S.syncErr), icon: '!' };
  if (D.ops.length) return { cls: 'wait', text: D.ops.length + ' ' + t('pending'), icon: '⏳' };
  return { cls: 'ok', text: t('syncedOk'), icon: '✓' };
}
export function refreshBadge() { const b = document.querySelector('.sync-badge'); if (!b) return; const s = syncState(); b.className = 'sync-badge ' + s.cls; b.textContent = s.icon; b.setAttribute('aria-label', s.text); b.title = s.text; }
setInterval(() => { if (document.visibilityState === 'visible' && vault.isUnlocked()) doSync(false); }, CONFIG.autoSyncMinutes * 60000);
window.addEventListener('online', () => scheduleSync(1000));

// ---------- start
(async function boot() {
  await applyPrefs();
  try { await auth.init(); } catch (e) { console.warn('sign-in init', e); }
  if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (await vault.isSetUp()) lockScreen(); else setupFlow();
})();
export { records };
