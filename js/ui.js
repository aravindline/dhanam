// Tiny DOM helpers, dialogs, toast and the PIN pad.
import { t } from './i18n.js';

export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) e.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return e;
}
export const btn = (text, onclick, cls = 'btn', extra = {}) => h('button', { type: 'button', class: cls, onclick, ...extra }, text);

let toastTimer = null;
export function toast(msg, action, ms = 5000) {
  document.querySelector('.toast')?.remove(); clearTimeout(toastTimer);
  const el = h('div', { class: 'toast', role: 'status' }, h('span', null, msg), action ? btn(action.label, () => { el.remove(); action.run(); }, 'toast-btn') : null);
  document.body.appendChild(el); toastTimer = setTimeout(() => el.remove(), ms);
}

// Modal dialog. buttons: [{label, cls, value}]. Resolves with the value of the pressed button.
export function dialog(title, body, buttons) {
  return new Promise(res => {
    const close = v => { wrap.remove(); res(v); };
    const wrap = h('div', { class: 'modal-wrap', onclick: e => { if (e.target === wrap) close(null); } },
      h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
        title ? h('h2', null, title) : null,
        typeof body === 'string' ? h('p', null, body) : body,
        h('div', { class: 'modal-btns' }, buttons.map(b => btn(b.label, () => close(b.value), b.cls || 'btn')))));
    wrap._close = () => close(null); // phone Back button
    document.body.appendChild(wrap);
    wrap.querySelector('.modal-btns button:last-child')?.focus();
  });
}
export const confirm = (msg, yes = t('yes'), danger = false) => dialog(null, msg, [{ label: t('no'), cls: 'btn ghost', value: false }, { label: yes, cls: danger ? 'btn danger' : 'btn primary', value: true }]);
export const alertBox = msg => dialog(null, msg, [{ label: t('ok'), cls: 'btn primary', value: true }]);

// PIN pad: calls onDone(pin) after 4 digits. Returns {el, clear, shake, setMsg}.
export function pinPad(title, onDone, extraKey) {
  let pin = '';
  const dots = h('div', { class: 'dots', 'aria-live': 'polite' });
  const msg = h('p', { class: 'pin-msg' });
  const draw = () => { dots.innerHTML = ''; for (let i = 0; i < 4; i++) dots.appendChild(h('span', { class: 'dot' + (i < pin.length ? ' on' : '') })); };
  const press = d => { if (pin.length >= 4) return; pin += d; draw(); if (pin.length === 4) { const p = pin; setTimeout(() => onDone(p), 120); } };
  const keys = h('div', { class: 'keys' });
  for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) keys.appendChild(btn(d, () => press(d), 'key', { 'aria-label': d }));
  keys.appendChild(extraKey || h('span'));
  keys.appendChild(btn('0', () => press('0'), 'key', { 'aria-label': '0' }));
  keys.appendChild(btn('⌫', () => { pin = pin.slice(0, -1); draw(); }, 'key key-del', { 'aria-label': t('back') }));
  draw();
  const titleEl = h('h2', { class: 'pin-title' }, title);
  const el = h('div', { class: 'pinpad' }, titleEl, dots, msg, keys);
  const onKey = e => { if (!el.isConnected) { document.removeEventListener('keydown', onKey); return; } if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') { pin = pin.slice(0, -1); draw(); } };
  document.addEventListener('keydown', onKey);
  return { el, clear: () => { pin = ''; draw(); }, setMsg: (m, bad) => { msg.textContent = m || ''; msg.className = 'pin-msg' + (bad ? ' bad' : ''); if (bad) { dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake'); } }, setTitle: s => { titleEl.textContent = s; } };
}
