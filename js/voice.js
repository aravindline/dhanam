// Voice entry: the phone's own speech recognition (Chrome on Android, Tamil or Indian English).
// It only fills the form; Amma checks it and taps Save. Needs the internet (the browser's speech service).
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
export const voiceSupported = () => !!Rec;

export function listen(langCode) {
  return new Promise((resolve, reject) => {
    const r = new Rec(); r.lang = langCode === 'ta' ? 'ta-IN' : 'en-IN'; r.interimResults = false; r.maxAlternatives = 3;
    let done = false;
    r.onresult = e => { done = true; const alts = [...e.results[0]].map(a => a.transcript); resolve(alts); };
    r.onerror = e => { done = true; reject(Object.assign(new Error(e.error || 'voice'), { code: e.error === 'network' ? 'voicenet' : 'voicefail' })); };
    r.onend = () => { if (!done) reject(Object.assign(new Error('no speech'), { code: 'voicefail' })); };
    r.start();
  });
}

// Tamil number words that speech recognition sometimes returns instead of digits.
const UNITS = { 'ஒன்று': 1, 'ஒரு': 1, 'இரண்டு': 2, 'ரெண்டு': 2, 'மூன்று': 3, 'மூணு': 3, 'நான்கு': 4, 'நாலு': 4, 'ஐந்து': 5, 'அஞ்சு': 5, 'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10, 'இருபது': 20, 'முப்பது': 30, 'நாற்பது': 40, 'ஐம்பது': 50, 'அறுபது': 60, 'எழுபது': 70, 'எண்பது': 80, 'தொண்ணூறு': 90 };
const HUND = { 'நூறு': 100, 'நூற்று': 100, 'இருநூறு': 200, 'இருநூற்று': 200, 'முந்நூறு': 300, 'முன்னூறு': 300, 'முந்நூற்று': 300, 'நானூறு': 400, 'நானூற்று': 400, 'ஐநூறு': 500, 'ஐந்நூறு': 500, 'ஐநூற்று': 500, 'அறுநூறு': 600, 'அறுநூற்று': 600, 'எழுநூறு': 700, 'எழுநூற்று': 700, 'எண்ணூறு': 800, 'எண்ணூற்று': 800, 'தொள்ளாயிரம்': 900, 'தொள்ளாயிரத்து': 900 };
const STEMS = { 'ஒர': 1, 'இரண்ட': 2, 'ரெண்ட': 2, 'மூவ': 3, 'மூண': 3, 'நால': 4, 'நான்க': 4, 'ஐய': 5, 'ஐந்த': 5, 'அஞ்ச': 5, 'ஆற': 6, 'ஏழ': 7, 'எட்ட': 8, 'ஒன்பத': 9, 'பத்த': 10 };
const BIG = { 'ஆயிரம்': 1000, 'ஆயிரத்து': 1000, 'லட்சம்': 100000, 'லட்சத்து': 100000, 'thousand': 1000, 'lakh': 100000, 'lakhs': 100000, 'hundred': 100 };
function wordsToNumber(text) {
  // e.g. "இரண்டாயிரம்" (2 thousand), "ஐநூறு" (500), "2 ஆயிரம்"
  let total = 0, cur = 0, seen = false;
  const toks = text.replace(/ா?யிரத்து/g, ' ஆயிரத்து ').replace(/ா?யிரம்/g, ' ஆயிரம் ').replace(/ஆ ஆயிர/g, 'ஆயிர').split(/\s+/).filter(Boolean);
  for (let w of toks) {
    w = w.replace(/[.,]/g, '');
    if (/^\d+$/.test(w)) { cur += Number(w); seen = true; continue; }
    if (STEMS[w]) { cur += STEMS[w]; seen = true; continue; } // from "இரண்டாயிரம்" split into "இரண்ட" + "ஆயிரம்"
    const stem = Object.keys(UNITS).find(k => w === k || (w.length > 2 && k.startsWith(w)));
    if (UNITS[w] !== undefined || stem) { cur += UNITS[w] ?? UNITS[stem]; seen = true; continue; }
    if (HUND[w]) { cur += HUND[w]; seen = true; continue; }
    if (BIG[w.toLowerCase()]) { const b = BIG[w.toLowerCase()]; if (b === 100) cur = (cur || 1) * 100; else { total += (cur || 1) * b; cur = 0; } seen = true; continue; }
  }
  return seen ? total + cur : null;
}

export function parseAmount(text) {
  const t = text.replace(/₹/g, ' ');
  const m = t.match(/\d[\d,]*(\.\d+)?/);
  if (m) {
    let n = Number(m[0].replace(/,/g, ''));
    const after = t.slice(m.index + m[0].length).trim().split(/\s+/)[0] || '';
    if (/^(ஆயிரம்|ஆயிரத்து|thousand|k)$/i.test(after)) n *= 1000; else if (/^(லட்சம்|லட்சத்து|lakh|lakhs)$/i.test(after)) n *= 100000;
    return n > 0 ? n : null;
  }
  const w = wordsToNumber(t);
  return w && w > 0 ? w : null;
}

const MODE_WORDS = { cash: ['ரொக்கம்', 'கேஷ்', 'காசு', 'cash'], bhim: ['bhim', 'பீம்', 'upi', 'யுபிஐ', 'gpay', 'ஜிபே', 'phonepe', 'போன்பே', 'paytm'], card: ['கார்டு', 'கார்ட்', 'card'], bank: ['வங்கி', 'பேங்க்', 'bank', 'transfer', 'neft'] };
const EXTRA = { milk: ['பால்', 'தயிர்', 'milk', 'curd'], veg: ['காய்கறி', 'பழம்', 'vegetable', 'fruit', 'தக்காளி', 'வெங்காயம்'], rice: ['அரிசி', 'மளிகை', 'எண்ணெய்', 'rice', 'oil', 'provision'], meat: ['மீன்', 'கறி', 'சிக்கன்', 'முட்டை', 'fish', 'chicken', 'mutton', 'egg'],
  elec: ['கரண்ட்', 'மின்', 'current', 'eb', 'electricity'], gas: ['கேஸ்', 'சிலிண்டர்', 'gas', 'cylinder'], recharge: ['ரீசார்ஜ்', 'recharge', 'டிவி', 'மொபைல்'], medicine: ['மருந்து', 'மாத்திரை', 'medicine', 'tablet'], hospital: ['ஆஸ்பத்திரி', 'மருத்துவமனை', 'hospital'],
  petrol: ['பெட்ரோல்', 'petrol', 'diesel', 'டீசல்'], auto: ['ஆட்டோ', 'டாக்ஸி', 'auto', 'taxi', 'cab'], busrail: ['பஸ்', 'பேருந்து', 'ரயில்', 'ட்ரெயின்', 'bus', 'train'], pooja: ['கோவில்', 'பூஜை', 'temple', 'pooja'], moi: ['மொய்', 'moi'],
  tea: ['டீ', 'காபி', 'tea', 'coffee', 'snacks'], hotel: ['ஹோட்டல்', 'hotel', 'restaurant'], chit: ['சீட்டு', 'chit'], salary: ['சம்பளம்', 'salary'], rent: ['வாடகை', 'rent'], interest: ['வட்டி', 'interest'], children: ['பிள்ளை', 'மகன்', 'மகள்', 'son', 'daughter'] };

// cats: active category rows. Returns {amount, mode, cat, sub, type} with whatever could be recognised.
export function parseSpeech(alts, cats, preferType) {
  const out = {}; const text = alts[0] || ''; const low = alts.join(' | ').toLowerCase();
  for (const a of alts) { const n = parseAmount(a); if (n) { out.amount = n; break; } }
  for (const [id, ws] of Object.entries(MODE_WORDS)) if (ws.some(w => low.includes(w))) { out.mode = id; break; }
  const score = c => { const names = [c.ta, c.en, ...(EXTRA[c.id] || [])].filter(Boolean).map(s => s.toLowerCase()); let best = 0; for (const n of names) { for (const part of n.split(/\s*[&,]\s*|\s+/)) if (part.length >= 2 && low.includes(part)) best = Math.max(best, part.length + (c.parent ? 1 : 0)); } return best; };
  const ranked = cats.map(c => ({ c, s: score(c) + (c.type === preferType ? 0.5 : 0) })).filter(x => x.s > 0.5).sort((a, b) => b.s - a.s);
  if (ranked.length) { const c = ranked[0].c; out.type = c.type; if (c.parent) { out.sub = c.id; out.cat = c.parent; } else out.cat = c.id; }
  out.text = text;
  return out;
}
