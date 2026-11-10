// Microsoft sign-in. Uses the MSAL library bundled in /vendor (no CDN). MSAL keeps its sign-in tokens in this
// browser's local storage so closing the app does not sign you out; Sign out clears them. The app never sees
// or stores your Microsoft password.
import { CONFIG } from './config.js';
let pca = null, account = null;
let beforeRedirect = async () => {};
export function setBeforeRedirect(fn) { beforeRedirect = fn; }

function testMode() { return !!CONFIG.testToken; }

export async function init() {
  if (testMode()) { account = { username: CONFIG.testUser || 'test@example.com', name: CONFIG.testName || 'Test' }; return account; }
  if (!CONFIG.clientId) return null;
  if (!window.msal) throw new Error('Sign-in library missing.');
  pca = new window.msal.PublicClientApplication({ auth: { clientId: CONFIG.clientId, authority: CONFIG.authority, redirectUri: location.origin + location.pathname, navigateToLoginRequestUrl: false }, cache: { cacheLocation: 'localStorage' } });
  await pca.initialize();
  const r = await pca.handleRedirectPromise();
  account = (r && r.account) || pca.getAllAccounts()[0] || null;
  return account;
}
export const configured = () => testMode() || !!CONFIG.clientId;
export const currentAccount = () => account;
export async function signIn() {
  if (testMode()) return account;
  // Signing in again: go straight to the same account (no account picker). If Microsoft still remembers
  // the phone ("Stay signed in"), it comes straight back without asking for the password.
  const known = account || (pca.getAllAccounts()[0]) || null;
  await beforeRedirect();
  if (known) await pca.loginRedirect({ scopes: CONFIG.scopes, loginHint: known.username });
  else await pca.loginRedirect({ scopes: CONFIG.scopes, prompt: 'select_account' });
}
export async function signOut() { if (testMode()) { account = null; return; } if (pca && account) await pca.logoutRedirect({ account }); }
// Syncing NEVER leaves the app to sign in (leaving the page is what locked the app). If Microsoft needs a fresh
// sign-in, sync stops, needsSignIn turns on and the app shows the highlighted "Sign in" card. Only that button
// goes to the Microsoft page.
let needs = false;
export const needsSignIn = () => needs;
export async function getToken() {
  if (testMode()) { if (CONFIG.testExpired) { needs = true; throw Object.assign(new Error('Microsoft sign-in expired.'), { code: 'signin' }); } needs = false; return CONFIG.testToken; }
  if (!account) throw Object.assign(new Error('Not signed in to Microsoft.'), { code: 'nosignin' });
  try { const t = (await pca.acquireTokenSilent({ scopes: CONFIG.scopes, account })).accessToken; needs = false; return t; }
  catch (e) { needs = true; throw Object.assign(new Error('Microsoft sign-in expired.'), { code: 'signin' }); }
}
