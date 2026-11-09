# தனம் (Dhanam) — set-up guide

Web app: https://aravindline.github.io/dhanam/  ·  Excel: Dhanam_Tracker.xlsx in Amma's OneDrive

## 1. GitHub (once)
1. Create a new public repository named `dhanam` under aravindline.
2. Upload everything in this folder to the repository root (including the `.github` and `android` folders).
3. Settings › Pages › Deploy from a branch › `main` / root › Save. After a minute the site opens at the address above.

## 2. Microsoft sign-in (once)
Azure portal › App registrations › the Family Finance app › Authentication › Single-page application ›
Add URI `https://aravindline.github.io/dhanam/` (with the slash at the end) › Save.

## 3. Android reminder app (once)
1. Repository › Settings › Secrets and variables › Actions › New repository secret:
   - `DHANAM_KEYSTORE_BASE64` = the text in DHANAM_KEYSTORE_BASE64.txt
   - `DHANAM_KEYSTORE_PASSWORD` = the text in DHANAM_KEYSTORE_PASSWORD.txt
   Keep these two files and dhanam.jks safe: every future version must be signed with the same key.
2. Actions › Build Android reminder › Run workflow. When it finishes, Releases shows "தனம் நினைவூட்டல் 1.0.0" with the .apk.

## 4. Excel file in Amma's OneDrive (once)
1. Sign in to onedrive.live.com with Amma's Outlook account and upload Dhanam_Tracker.xlsx.
2. Share › with your Microsoft account email › Can edit. Also use "Copy link" to get a link for Amma's own phone.

## 5. Amma's phone (Motorola g67)
1. Chrome › open the web address › menu ⋮ › Add to Home screen › Install.
2. Open தனம் › தமிழ் › choose a 4-digit PIN twice › turn on fingerprint.
3. அமைப்பு › Microsoft கணக்கில் உள்நுழை › Amma's Outlook account › unlock with PIN again › paste the OneDrive link › இணை.
4. On the phone, open the GitHub release page, download the .apk, allow Chrome to install apps, install, open it once and allow notifications.

## 6. Your phone
Open the same address, set your own PIN, sign in with your Microsoft account, paste the link Amma's OneDrive shared with you.
Note: both your apps share the same web address host, so signing out of Microsoft in one also signs you out in the other.

## Updating later
Upload changed files to the repository. The web app updates itself the next time it opens with internet.
For the Android app, raise versionCode and versionName in android/app/build.gradle; the workflow builds a new release.
