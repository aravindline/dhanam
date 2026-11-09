// Default categories (Aravind approved, 9 Nov 2026). Amma can add her own in Settings.
// type: expense | income | invest | loan. Sub-categories have a parent.
// "Loan" is kept out of the income vs expense totals (shown in its own section).
const C = (id, type, icon, ta, en, subs = []) => ({ id, type, icon, ta, en, subs });
export const DEFAULT_CATS = [
  C('groc', 'expense', '🛒', 'மளிகை', 'Groceries', [['rice', 'அரிசி & மளிகை சாமான்', 'Rice & provisions'], ['veg', 'காய்கறி & பழம்', 'Vegetables & fruits'], ['milk', 'பால் & தயிர்', 'Milk & curd'], ['meat', 'இறைச்சி, மீன் & முட்டை', 'Meat, fish & eggs']]),
  C('home', 'expense', '🏠', 'வீடு & கட்டணம்', 'Home & bills', [['elec', 'மின்சாரம்', 'Electricity'], ['gas', 'கேஸ் சிலிண்டர்', 'Gas cylinder'], ['water', 'தண்ணீர்', 'Water'], ['recharge', 'மொபைல் & டிவி ரீசார்ஜ்', 'Mobile & TV recharge'], ['helper', 'வேலையாள் சம்பளம்', 'Helper salary'], ['repair', 'பழுது பார்த்தல்', 'Repairs'], ['ptax', 'சொத்து வரி', 'Property tax']]),
  C('health', 'expense', '💊', 'மருத்துவம்', 'Health', [['medicine', 'மருந்து', 'Medicines'], ['tests', 'பரிசோதனை', 'Tests'], ['hospital', 'மருத்துவமனை', 'Hospital']]),
  C('travel', 'expense', '🚌', 'பயணம்', 'Travel', [['busrail', 'பேருந்து & ரயில்', 'Bus & train'], ['auto', 'ஆட்டோ & டாக்ஸி', 'Auto & taxi'], ['petrol', 'பெட்ரோல்', 'Petrol'], ['vservice', 'வாகன சர்வீஸ்', 'Vehicle service']]),
  C('temple', 'expense', '🛕', 'கோவில் & விசேஷம்', 'Temple & functions', [['pooja', 'கோவில் & பூஜை', 'Temple & pooja'], ['donation', 'காணிக்கை', 'Donation'], ['moi', 'மொய் & பரிசு', 'Moi & gifts'], ['festival', 'பண்டிகை', 'Festivals']]),
  C('clothes', 'expense', '👕', 'உடை & தனிப்பட்டவை', 'Clothes & personal', [['cloth', 'உடை', 'Clothes'], ['footwear', 'காலணி', 'Footwear'], ['personal', 'தனிப்பட்ட பொருட்கள்', 'Personal care']]),
  C('eatout', 'expense', '🍽️', 'வெளி உணவு', 'Eating out', [['hotel', 'ஹோட்டல்', 'Hotel'], ['tea', 'டீ & சிற்றுண்டி', 'Tea & snacks']]),
  C('other', 'expense', '📦', 'மற்றவை', 'Others'),
  C('salary', 'income', '💼', 'சம்பளம்', 'Salary'),
  C('rent', 'income', '🏘️', 'வாடகை', 'Rent', [['r_house', 'வீடு', 'House'], ['r_godown', 'குடோன்', 'Godown'], ['r_land', 'நிலம்', 'Land'], ['r_shop', 'கடை', 'Shop']]),
  C('interest', 'income', '🏦', 'வட்டி', 'Interest', [['i_fd', 'நிரந்தர வைப்பு (FD)', 'FD'], ['i_sav', 'சேமிப்பு கணக்கு', 'Savings account'], ['i_post', 'தபால் நிலையம்', 'Post office']]),
  C('children', 'income', '👨‍👩‍👦', 'பிள்ளைகள் அனுப்பியது', 'Money from children'),
  C('gifts', 'income', '🎁', 'பரிசு', 'Gifts'),
  C('i_other', 'income', '📦', 'மற்றவை', 'Others'),
  C('invest', 'invest', '📈', 'முதலீடு', 'Investment', [['chit', 'சீட்டு', 'Chit fund'], ['goldsch', 'தங்க சேமிப்பு திட்டம்', 'Gold scheme'], ['v_fd', 'நிரந்தர வைப்பு (FD)', 'FD'], ['v_rd', 'தொடர் வைப்பு (RD)', 'RD']]),
  C('loan', 'loan', '🤝', 'கடன்', 'Loans', [['l_repay', 'கடன் திருப்பி செலுத்துதல்', 'Loan repayment'], ['l_int', 'வட்டி செலுத்தியது', 'Interest paid'], ['l_lent', 'கடன் கொடுத்தது', 'Money lent']]),
];

// Flat rows, as stored in the app and in the Excel "Categories" table.
export function defaultRows() {
  const out = []; let order = 1;
  for (const c of DEFAULT_CATS) {
    out.push({ id: c.id, type: c.type, parent: '', ta: c.ta, en: c.en, icon: c.icon, order: order++, active: true });
    for (const [id, ta, en] of c.subs) out.push({ id, type: c.type, parent: c.id, ta, en, icon: '', order: order++, active: true });
  }
  return out;
}

export const MODES = [
  { id: 'cash', icon: '💵', ta: 'ரொக்கம்', en: 'Cash' },
  { id: 'bhim', icon: '📱', ta: 'BHIM', en: 'BHIM' },
  { id: 'card', icon: '💳', ta: 'கார்டு', en: 'Card' },
  { id: 'bank', icon: '🏦', ta: 'வங்கி பரிமாற்றம்', en: 'Bank transfer' },
];
export const TYPES = ['expense', 'income', 'invest', 'loan'];
export const TYPE_EN = { expense: 'Expense', income: 'Income', invest: 'Investment', loan: 'Loan' };
export const ICONS = ['🛒', '🥦', '🥛', '🐟', '🏠', '⚡', '🔥', '💧', '📱', '🧹', '🔧', '💊', '🏥', '🚌', '🛺', '⛽', '🚗', '🛕', '🙏', '🎁', '🪔', '👕', '👟', '💇', '🍽️', '☕', '📚', '🎓', '👶', '🐄', '🌾', '✈️', '📺', '🧾', '💼', '🏘️', '🏦', '📈', '🪙', '🤝', '💰', '📦'];
