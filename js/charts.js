// Small SVG charts. Each returns an element; tapping a month or bar shows its exact numbers in a line
// above the chart (easier than floating tooltips on a phone).
import { inr, inrShort } from './fmt.js';
import { monthName, t, lang } from './i18n.js';
// Tamil month names are wider: label every other month so they never overlap.
const showLab = m => lang() !== 'ta' || m % 2 === 0;

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, kids = []) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); for (const k of kids) e.appendChild(k); return e; };
const div = (cls, text) => { const d = document.createElement('div'); if (cls) d.className = cls; if (text !== undefined) d.textContent = text; return d; };
function niceMax(v) { if (v <= 0) return 1000; const p = 10 ** Math.floor(Math.log10(v)); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }

// series: [{key, name, cls, values[12]}]
export function monthBars(series, onPick) {
  const W = 360, H = 200, L = 44, R = 6, T = 10, B = 26;
  const max = niceMax(Math.max(0, ...series.flatMap(s => s.values)));
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img' });
  const pw = (W - L - R) / 12, n = series.length, bw = Math.min(10, (pw - 6) / n);
  for (let i = 0; i <= 4; i++) { const y = T + (H - T - B) * (1 - i / 4); svg.appendChild(el('line', { x1: L, x2: W - R, y1: y, y2: y, class: 'grid' })); const tx = el('text', { x: L - 6, y: y + 4, class: 'axis', 'text-anchor': 'end' }); tx.textContent = inrShort(max * i / 4).replace('₹', ''); svg.appendChild(tx); }
  const sel = el('rect', { x: 0, y: T, width: pw, height: H - T - B, class: 'sel', visibility: 'hidden' }); svg.appendChild(sel);
  for (let m = 0; m < 12; m++) {
    const x0 = L + m * pw, gx = x0 + (pw - n * bw - (n - 1) * 2) / 2;
    series.forEach((s, k) => { const v = s.values[m]; if (v > 0) { const h = Math.max(2, (H - T - B) * v / max); svg.appendChild(el('path', { d: barPath(gx + k * (bw + 2), H - B - h, bw, h), class: 'bar ' + s.cls })); } });
    const lab = el('text', { x: x0 + pw / 2, y: H - 8, class: 'axis', 'text-anchor': 'middle' }); lab.textContent = showLab(m) ? monthName(m, true) : ''; svg.appendChild(lab);
    const hit = el('rect', { x: x0, y: 0, width: pw, height: H, fill: 'transparent', class: 'hit' });
    hit.addEventListener('click', () => { sel.setAttribute('x', x0); sel.setAttribute('visibility', 'visible'); onPick && onPick(m); });
    svg.appendChild(hit);
  }
  return svg;
}
function barPath(x, y, w, h) { const r = Math.min(3, w / 2, h); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; }

export function monthLine(values, cls, onPick) {
  const W = 360, H = 180, L = 44, R = 10, T = 12, B = 26;
  const max = niceMax(Math.max(0, ...values));
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img' });
  for (let i = 0; i <= 4; i++) { const y = T + (H - T - B) * (1 - i / 4); svg.appendChild(el('line', { x1: L, x2: W - R, y1: y, y2: y, class: 'grid' })); const tx = el('text', { x: L - 6, y: y + 4, class: 'axis', 'text-anchor': 'end' }); tx.textContent = inrShort(max * i / 4).replace('₹', ''); svg.appendChild(tx); }
  const pw = (W - L - R) / 12; const X = m => L + pw * m + pw / 2, Y = v => H - B - (H - T - B) * v / max;
  const last = values.reduce((a, v, i) => (v > 0 ? i : a), -1);
  const pts = values.slice(0, last + 1).map((v, m) => [X(m), Y(v)]);
  if (pts.length > 1) svg.appendChild(el('path', { d: 'M' + pts.map(p => p.join(',')).join('L'), class: 'line ' + cls }));
  const cross = el('line', { x1: 0, x2: 0, y1: T, y2: H - B, class: 'cross', visibility: 'hidden' }); svg.appendChild(cross);
  pts.forEach(([x, y]) => svg.appendChild(el('circle', { cx: x, cy: y, r: 4.5, class: 'dot ' + cls })));
  for (let m = 0; m < 12; m++) {
    const lab = el('text', { x: X(m), y: H - 8, class: 'axis', 'text-anchor': 'middle' }); lab.textContent = showLab(m) ? monthName(m, true) : ''; svg.appendChild(lab);
    const hit = el('rect', { x: L + pw * m, y: 0, width: pw, height: H, fill: 'transparent', class: 'hit' });
    hit.addEventListener('click', () => { cross.setAttribute('x1', X(m)); cross.setAttribute('x2', X(m)); cross.setAttribute('visibility', 'visible'); onPick && onPick(m); });
    svg.appendChild(hit);
  }
  return svg;
}

// items: [{id, icon, name, value}] sorted. Horizontal bars with the amount and share written on each row.
export function catBars(items, onPick) {
  const wrap = div('hbars'); const max = Math.max(...items.map(i => i.value), 1); const total = items.reduce((a, i) => a + i.value, 0);
  for (const it of items) {
    const row = document.createElement('button'); row.type = 'button'; row.className = 'hbar';
    const top = div('hbar-top'); top.append(div('hbar-name', it.icon + ' ' + it.name), div('hbar-val', inr(it.value) + '  ·  ' + Math.round(it.value * 100 / (total || 1)) + '%'));
    const track = div('hbar-track'); const fill = div('hbar-fill'); fill.style.width = Math.max(1.5, it.value * 100 / max) + '%'; track.appendChild(fill);
    row.append(top, track); row.addEventListener('click', () => onPick && onPick(it, row)); wrap.appendChild(row);
  }
  return wrap;
}

export function legend(series) { const d = div('legend'); for (const s of series) { const i = div('lg'); const sw = div('sw ' + s.cls); i.append(sw, document.createTextNode(s.name)); d.appendChild(i); } return d; }

export function monthTable(series) {
  const tbl = document.createElement('table'); tbl.className = 'tbl';
  const hr = tbl.insertRow(); [t('month'), ...series.map(s => s.name)].forEach(h => { const th = document.createElement('th'); th.textContent = h; hr.appendChild(th); });
  for (let m = 0; m < 12; m++) { const r = tbl.insertRow(); r.insertCell().textContent = monthName(m, true); series.forEach(s => { const c = r.insertCell(); c.textContent = s.values[m] ? inr(s.values[m]) : '–'; }); }
  const r = tbl.insertRow(); r.className = 'sum'; r.insertCell().textContent = t('total'); series.forEach(s => { r.insertCell().textContent = inr(s.values.reduce((a, b) => a + b, 0)); });
  return tbl;
}
