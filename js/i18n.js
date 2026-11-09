// Tamil (default) and English text. Numbers always use English digits.
let LANG = 'ta';
export const setLang = l => { LANG = l === 'en' ? 'en' : 'ta'; document.documentElement.lang = LANG === 'ta' ? 'ta' : 'en-IN'; };
export const lang = () => LANG;

const S = {
  appName: ['தனம்', 'தனம்'],
  home: ['முகப்பு', 'Home'], entries: ['பதிவுகள்', 'Entries'], charts: ['வரைபடம்', 'Charts'], settings: ['அமைப்பு', 'Settings'],
  expense: ['செலவு', 'Expense'], income: ['வரவு', 'Income'], invest: ['முதலீடு', 'Investment'], loan: ['கடன்', 'Loan'], savings: ['சேமிப்பு', 'Savings'],
  addExpense: ['+ செலவு', '+ Expense'], addIncome: ['+ வரவு', '+ Income'], addInvest: ['+ முதலீடு', '+ Investment'], addLoan: ['+ கடன் பதிவு', '+ Loan entry'],
  thisMonth: ['இந்த மாதம்', 'This month'], recent: ['சமீபத்திய பதிவுகள்', 'Recent entries'], seeAll: ['எல்லாம் பார்க்க', 'See all'],
  noEntries: ['பதிவுகள் இல்லை', 'No entries yet'], loansTitle: ['கடன் பதிவுகள்', 'Loan entries'], loansNote: ['கடன் தொகைகள் வரவு செலவு கணக்கில் சேர்க்கப்படாது.', 'Loan amounts are kept out of the income and expense totals.'],
  savingsNote: ['சேமிப்பு = வரவு − செலவு − முதலீடு', 'Savings = Income − Expense − Investment'],
  // entry form
  newEntry: ['புதிய பதிவு', 'New entry'], editEntry: ['பதிவை மாற்று', 'Edit entry'], amount: ['தொகை', 'Amount'], category: ['வகை', 'Category'], sub: ['உட்பிரிவு', 'Sub-category'],
  optional: ['(விருப்பம்)', '(optional)'], date: ['தேதி', 'Date'], today: ['இன்று', 'Today'], yesterday: ['நேற்று', 'Yesterday'], pickDate: ['வேறு தேதி', 'Other date'],
  mode: ['செலுத்தும் முறை', 'Payment mode'], modeIn: ['பெற்ற முறை', 'Received by'], notes: ['குறிப்பு', 'Note'], notesPh: ['எ.கா. கடை பெயர்', 'e.g. shop name'],
  save: ['சேமி', 'Save'], edit: ['மாற்று', 'Edit'], cancel: ['ரத்து', 'Cancel'], delete: ['நீக்கு', 'Delete'], undo: ['திரும்பப் பெறு', 'Undo'], close: ['மூடு', 'Close'], back: ['பின்', 'Back'], ok: ['சரி', 'OK'], yes: ['ஆம்', 'Yes'], no: ['இல்லை', 'No'],
  saved: ['சேமிக்கப்பட்டது', 'Saved'], deleted: ['நீக்கப்பட்டது', 'Deleted'], updated: ['மாற்றப்பட்டது', 'Updated'],
  needAmount: ['தொகையை உள்ளிடவும்', 'Please enter the amount'], needCat: ['வகையைத் தேர்ந்தெடுக்கவும்', 'Please choose a category'], needDate: ['தேதியைத் தேர்ந்தெடுக்கவும்', 'Please choose a date'],
  confirmDelete: ['இந்த பதிவை நீக்கவா?', 'Delete this entry?'], all: ['எல்லாம்', 'All'],
  // voice
  speak: ['🎤 பேசி பதிவு செய்', '🎤 Speak to fill'], listening: ['கேட்கிறது… பேசுங்கள்', 'Listening… please speak'], youSaid: ['நீங்கள் சொன்னது', 'You said'],
  voiceHint: ['எ.கா. "பால் 60 ரூபாய் ரொக்கம்"', 'e.g. "Milk 60 rupees cash"'], voiceNo: ['இந்த போனில் குரல் பதிவு இயங்கவில்லை', 'Voice entry does not work on this phone'],
  voiceFail: ['சரியாக கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.', 'Did not catch that. Please try again.'], voiceCheck: ['சரிபார்த்து பின் சேமிக்கவும்', 'Please check, then save'],
  voiceNet: ['குரல் பதிவுக்கு இணையம் தேவை', 'Voice entry needs the internet'],
  // charts
  year: ['ஆண்டு', 'Year'], incVsExp: ['வரவு vs செலவு (மாதவாரியாக)', 'Income vs expense (by month)'], expTrend: ['மாதாந்திர செலவு', 'Monthly expense trend'],
  catWise: ['வகைவாரியான செலவு', 'Category-wise expense'], wholeYear: ['முழு ஆண்டு', 'Whole year'], showTable: ['அட்டவணையாக பார்க்க', 'Show as table'],
  month: ['மாதம்', 'Month'], total: ['மொத்தம்', 'Total'], noData: ['இந்த காலத்தில் பதிவுகள் இல்லை', 'No entries in this period'], tapBar: ['விவரம் பார்க்க தொடவும்', 'Tap a bar for details'],
  // settings
  language: ['மொழி', 'Language'], fontSize: ['எழுத்து அளவு', 'Text size'], fsNormal: ['சாதாரண', 'Normal'], fsLarge: ['பெரியது', 'Large'], fsXL: ['மிகப் பெரியது', 'Extra large'],
  categories: ['வகைகள்', 'Categories'], manageCats: ['வகைகளை மாற்று / சேர்', 'Add or change categories'], addCat: ['+ புதிய வகை', '+ New category'], addSub: ['+ புதிய உட்பிரிவு', '+ New sub-category'],
  nameTa: ['பெயர் (தமிழ்)', 'Name (Tamil)'], nameEn: ['பெயர் (ஆங்கிலம்)', 'Name (English)'], icon: ['படம்', 'Icon'], hide: ['மறை', 'Hide'], show: ['காட்டு', 'Show'], hidden: ['மறைக்கப்பட்டது', 'Hidden'],
  needName: ['பெயரை உள்ளிடவும்', 'Please enter a name'], subsOf: ['உட்பிரிவுகள்', 'Sub-categories'],
  lock: ['பூட்டு', 'Lock'], lockNow: ['இப்போது பூட்டு', 'Lock now'], changePin: ['PIN மாற்று', 'Change PIN'], fingerprint: ['கைரேகை திறப்பு', 'Fingerprint unlock'],
  fpOn: ['இயக்கத்தில்', 'On'], fpOff: ['இயக்கத்தில் இல்லை', 'Off'], fpTurnOn: ['கைரேகையை இயக்கு', 'Turn on fingerprint'], fpTurnOff: ['கைரேகையை நிறுத்து', 'Turn off fingerprint'],
  fpNone: ['இந்த போனில் கைரேகை வசதி இல்லை', 'Fingerprint is not available on this phone'], fpDone: ['கைரேகை இயக்கப்பட்டது', 'Fingerprint turned on'],
  autoLock: ['ஆப்பை விட்டு 1 நிமிடம் கழித்து தானாக பூட்டும்', 'Locks itself 1 minute after you leave the app'],
  sync: ['OneDrive இணைப்பு', 'OneDrive link'], syncNow: ['இப்போது ஒத்திசை', 'Sync now'], lastSync: ['கடைசி ஒத்திசைவு', 'Last synced'], never: ['இல்லை', 'never'],
  signIn: ['Microsoft கணக்கில் உள்நுழை', 'Sign in to Microsoft'], signOut: ['வெளியேறு', 'Sign out'], signedInAs: ['உள்நுழைந்தது', 'Signed in as'],
  fileLink: ['Excel கோப்பின் OneDrive இணைப்பு', 'OneDrive link of the Excel file'], linkFile: ['இணை', 'Link'], linked: ['இணைக்கப்பட்ட கோப்பு', 'Linked file'], changeFile: ['கோப்பை மாற்று', 'Change file'],
  pending: ['அனுப்ப வேண்டியவை', 'Waiting to send'], syncing: ['ஒத்திசைக்கிறது…', 'Syncing…'], syncedOk: ['ஒத்திசைக்கப்பட்டது', 'Synced'], offline: ['இணையம் இல்லை. பின்னர் அனுப்பப்படும்.', 'No internet. Will send later.'],
  notLinked: ['OneDrive இணைக்கப்படவில்லை', 'OneDrive not linked'], conflictsTitle: ['சேமிக்கப்படாத மாற்றங்கள்', 'Changes not saved'],
  conflictMsg: ['இந்த பதிவு Excel-ல் வேறு யாரோ மாற்றியுள்ளார். Excel-ல் உள்ளது வைக்கப்பட்டது.', 'This entry was changed in Excel by someone else. The Excel version was kept.'],
  reminder: ['தினசரி நினைவூட்டல் (இரவு 8 மணி)', 'Daily reminder (8 pm)'], reminderNote: ['Android ஆப் மூலம் வரும்', 'Comes from the Android app'],
  about: ['பற்றி', 'About'], version: ['பதிப்பு', 'Version'], resetPhone: ['இந்த போனிலிருந்து எல்லாம் அழி', 'Erase everything from this phone'],
  resetConfirm: ['இந்த போனில் உள்ள எல்லா பதிவுகளும் அழியும். OneDrive Excel-ல் உள்ளவை அழியாது. தொடரவா?', 'All data on this phone will be erased. The OneDrive Excel file is not touched. Continue?'],
  // lock / setup
  welcome: ['வணக்கம்!', 'Welcome!'], chooseLang: ['மொழியைத் தேர்ந்தெடுக்கவும்', 'Choose language'], createPin: ['4 இலக்க PIN உருவாக்கவும்', 'Create a 4-digit PIN'],
  confirmPin: ['அதே PIN-ஐ மீண்டும் உள்ளிடவும்', 'Enter the same PIN again'], pinMismatch: ['PIN பொருந்தவில்லை. மீண்டும் முயற்சிக்கவும்.', 'PINs did not match. Please try again.'],
  enterPin: ['PIN உள்ளிடவும்', 'Enter your PIN'], wrongPin: ['தவறான PIN', 'Wrong PIN'], waitSec: ['வினாடிகள் காத்திருக்கவும்', 'seconds, please wait'], useFp: ['கைரேகை', 'Fingerprint'],
  forgotPin: ['PIN மறந்துவிட்டதா?', 'Forgot PIN?'], forgotMsg: ['PIN இல்லாமல் திறக்க முடியாது. இந்த போனில் உள்ளதை அழித்து, OneDrive-லிருந்து மீண்டும் எடுக்கலாம் (அனுப்பப்படாத பதிவுகள் போய்விடும்).', 'The app cannot open without the PIN. You can erase this phone\'s copy and fetch it again from OneDrive (entries not yet sent will be lost).'],
  fpOffer: ['கைரேகை மூலம் திறக்க வேண்டுமா?', 'Unlock with fingerprint?'], later: ['பின்னர்', 'Later'], linkOffer: ['பதிவுகளை OneDrive Excel-ல் சேமிக்க இணைக்கவும்', 'Link OneDrive to save entries in the Excel file'],
  oldPin: ['இப்போதைய PIN', 'Current PIN'], newPin: ['புதிய PIN', 'New PIN'], pinChanged: ['PIN மாற்றப்பட்டது', 'PIN changed'],
  // errors
  err_net: ['இணையம் கிடைக்கவில்லை. பின்னர் முயற்சிக்கும்.', 'No internet. Will try again later.'], err_signin: ['Microsoft உள்நுழைவு காலாவதி. மீண்டும் உள்நுழையவும்.', 'Microsoft sign-in expired. Please sign in again.'],
  err_nosignin: ['Microsoft கணக்கில் உள்நுழையவில்லை', 'Not signed in to Microsoft'], err_notfound: ['Excel கோப்பு OneDrive-ல் இல்லை', 'The Excel file was not found in OneDrive'],
  err_locked: ['Excel கோப்பு திறந்துள்ளது. Excel-ஐ மூடினால் தானாக அனுப்பும்.', 'The Excel file is open in Excel. It will send once Excel is closed.'], err_busy: ['OneDrive பிஸியாக உள்ளது. சிறிது நேரத்தில் முயற்சிக்கும்.', 'OneDrive is busy. Will try again shortly.'],
  err_badlink: ['இந்த இணைப்பு இந்த கணக்கிற்கு திறக்கவில்லை', 'This link does not open for this account'], err_notxlsx: ['இது Excel (.xlsx) கோப்பு அல்ல', 'That is not an Excel (.xlsx) file'],
  err_notdhanam: ['இது தனம் Excel கோப்பு அல்ல', 'This is not the Dhanam Excel file'], err_od: ['OneDrive பிழை', 'OneDrive error'], err_signing: ['உள்நுழைகிறது…', 'Signing in…'],
};
export function t(k) { const v = S[k]; return v ? v[LANG === 'ta' ? 0 : 1] : k; }
export function errText(e) { return e && e.code && S['err_' + e.code] ? t('err_' + e.code) + (e.code === 'od' ? ' (' + (e.message.match(/\d+/) || [''])[0] + ')' : '') : (e && e.message) || String(e); }

const MON_TA = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
const MON_TA_S = ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'];
const MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON_EN_S = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_TA = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
const DAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const monthName = (m, short = false) => (LANG === 'ta' ? (short ? MON_TA_S : MON_TA) : (short ? MON_EN_S : MON_EN))[m];
export const dayName = d => (LANG === 'ta' ? DAY_TA : DAY_EN)[d];
// Category / mode label in the current language (English falls back to Tamil for Amma's own categories).
export const label = x => (x ? (LANG === 'ta' ? x.ta || x.en : x.en || x.ta) : '');
