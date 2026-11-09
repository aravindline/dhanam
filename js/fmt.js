// Indian number formats with English digits: ₹1,25,000.
import { monthName, dayName, lang } from './i18n.js';
const grp = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
export const inr = n => (n === null || n === undefined || isNaN(n) ? '–' : (n < 0 ? '−₹' : '₹') + grp.format(Math.abs(Math.round(Number(n) * 100) / 100)));
export function inrShort(n) {
  const a = Math.abs(n), s = n < 0 ? '−₹' : '₹';
  if (a >= 1e7) return s + +(a / 1e7).toFixed(1) + (lang() === 'ta' ? ' கோடி' : ' Cr');
  if (a >= 1e5) return s + +(a / 1e5).toFixed(1) + (lang() === 'ta' ? ' ல' : ' L');
  if (a >= 1e3) return s + +(a / 1e3).toFixed(1) + 'k';
  return s + Math.round(a);
}
const p2 = n => String(n).padStart(2, '0');
export const isoDate = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
export const todayISO = () => isoDate(new Date());
export const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const dateLong = s => { const d = parseISO(s); return d.getDate() + ' ' + monthName(d.getMonth()) + ' ' + d.getFullYear() + ', ' + dayName(d.getDay()); };
export const dateShort = s => { const d = parseISO(s); return d.getDate() + ' ' + monthName(d.getMonth(), true) + ' ' + d.getFullYear(); };
export const monthYear = (y, m) => monthName(m) + ' ' + y;
export const stampShort = s => { if (!s) return ''; const d = new Date(String(s).replace(' ', 'T')); if (isNaN(d)) return String(s); return dateShort(isoDate(d)) + ', ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); };
