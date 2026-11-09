// Microsoft sign-in uses the same app registration as the family finance app (this web address is added to it).
// The client ID is not a secret.
export const CONFIG = {
  clientId: '324b5935-2610-43d4-9186-12debef4b075',
  authority: 'https://login.microsoftonline.com/consumers', // personal Microsoft accounts (Outlook.com)
  scopes: ['Files.ReadWrite.All', 'User.Read'],
  graphBase: 'https://graph.microsoft.com/v1.0',
  dbName: 'dhanam',
  autoSyncMinutes: 5,
  lockAfterMs: 60000,
};
// Local test mode: only on this computer (localhost), never on the published site.
const local = ['127.0.0.1', 'localhost'].includes(location.hostname);
if (local) { try { const t = JSON.parse(localStorage.getItem('dh-test-config') || 'null'); if (t) Object.assign(CONFIG, t); } catch (e) { /* ignore */ } }
