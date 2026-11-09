# தனம் (Dhanam) — set-up guide

You do this once. It takes about 35 minutes. Do the parts in order.

**You need:** a laptop, Amma's Outlook email and password (for her phone sign-in), your GitHub login, and Amma's phone.
**At the end:** தனம் opens at **https://aravindline.github.io/dhanam/**, saves to an Excel file in your OneDrive (shared with Amma), and a small reminder app notifies Amma at 8 pm.

---

## Part A — Put the app on GitHub (10 min, on the laptop)

1. Unzip **dhanam-1.1.0.zip**. Open the **dhanam** folder inside it. You will upload what is inside this folder.
2. Go to **github.com** › top-right **+** › **New repository**.
   - Repository name: `dhanam`
   - Choose **Public**
   - Click **Create repository**
3. On the new page, click **uploading an existing file**.
4. Select everything inside the **dhanam** folder and drag it onto the page: `index.html`, `css`, `js`, `fonts`, `icons`, `vendor`, `android`, `.github` and the other files.
5. Wait for every file to finish uploading. Then click the green **Commit changes** button.
6. **Check the result:**
   - `index.html` must be visible on the repository's main page, not inside a sub-folder.
   - A folder named `.github` must be visible. If it is missing (some computers hide folders whose names start with a dot):
     **Add file** › **Create new file** › name it `.github/workflows/android.yml` › paste in the contents of that file from the zip › **Commit changes**.
7. **Settings** (top of the repository) › **Pages** (left menu) › Source: **Deploy from a branch** › Branch: **main**, folder **/ (root)** › **Save**.
8. After 1 to 2 minutes, open https://aravindline.github.io/dhanam/. You should see "வணக்கம்! / Welcome!". Don't set it up yet.

---

## Part B — Microsoft sign-in, in YOUR Azure account (3 min, on the laptop)

தனம் uses the same app registration as your Family Finance app. Its ID is already in `js/config.js`, so you don't need to type any ID.

1. Open **portal.azure.com** and sign in with **your** Outlook account.
2. Search **App registrations** › **All applications** › **Family Finance**.
3. **Authentication** (left menu) › under **Single-page application** › **Add URI** › `https://aravindline.github.io/dhanam/` (keep the `/` at the end) › **Save**.
   Leave the existing family-finance address as it is.

That's all. App registrations are free and don't use your Azure credit. Keep signing in to portal.azure.com every 3 months, as before.

---

## Part C — Excel file in YOUR OneDrive, shared with Amma (5 min, on the laptop)

1. Open **onedrive.live.com**, signed in as **you**, and upload **Dhanam_Tracker.xlsx** (already done).
2. Right-click the file › **Share** › choose **Specific people** (not "Anyone with the link") › type **Amma's Outlook email** › set it to **Can edit** › **Send**.
3. Right-click the file › **Copy link**. Send the link to Amma's phone by email or WhatsApp. You'll paste it in Part E.
   The link only opens for people you shared the file with, so it is safe to send.

---

## Part D — Get the reminder app (5 min, on the laptop, mostly waiting)

1. In the repository, open the **Actions** tab. A run called **Build Android reminder** started by itself after your upload.
2. Wait about 5 minutes for a **green tick**. If you see a red cross, click it, copy the error and send it to Claude.
3. Go back to the repository's main page › **Releases** (right side) › **தனம் நினைவூட்டல் 1.0.0**. The file `Dhanam-Reminder-1.0.0.apk` is there.
   Copy this page's address. You'll open it on Amma's phone.

---

## Part E — Amma's phone (10 min)

1. In **Chrome**, open https://aravindline.github.io/dhanam/
2. Tap the **⋮** menu › **Add to Home screen** › **Install**. A **தனம்** icon appears on the home screen. Open the app from that icon from now on.
3. Open தனம் › **தமிழ்** › Amma chooses a 4-digit PIN and enters it twice › **கைரேகையை இயக்கு** (turn on fingerprint).
4. **அமைப்பு** (Settings) › **Microsoft கணக்கில் உள்நுழை** › sign in with Amma's Outlook account › if Microsoft asks **"Stay signed in?"**, tick **Don't show this again** and tap **Yes** (this keeps her signed in) › tap **Accept** on the permission screen.
5. The app comes back by itself (no PIN needed if it is within 5 minutes).
6. **அமைப்பு** › paste the OneDrive link from Part C › **இணை**. The cloud badge at the top turns into a green tick ✓.
7. Reminder app: open the **Releases** page from Part D in Chrome › tap `Dhanam-Reminder-1.0.0.apk` › **Download**. Open it, allow Chrome to install apps if asked, and tap **Install**. (Android may warn that the app is from an unknown source. That's expected for an app you built yourself, so tap **Install anyway**.)
8. Open **தனம் நினைவூட்டல்** once › tap **Allow** for notifications › tap **🔔 இப்போது சோதி** (Test now) to see a sample. It will now notify every day at **8 pm**, and tapping the notification opens தனம். The time can be changed in that app.
   Until something is entered for the day, the தனம் Home screen also shows "இன்று இன்னும் பதிவு இல்லை".

---

## Part F — Your phone (5 min)

1. In Chrome, open https://aravindline.github.io/dhanam/ › **⋮** › **Add to Home screen** › **Install**.
2. Choose **English** or **தமிழ்**, set **your own** PIN.
3. **Settings** › **Sign in to Microsoft** with **your** account.
4. Paste the same link from Part C in **Settings** › **Link**.

---

## Quick help

| You see | Do this |
|---|---|
| ✓ green badge at the top | All entries are saved to Excel |
| ⏳ yellow badge | Entries are waiting. They will send when there is internet |
| ! red badge | Tap it to see why. If it says "Excel file is open", close the Excel file. If it says "sign in again", go to Settings › Sign in |
| Amma forgets the PIN | Lock screen › **PIN மறந்துவிட்டதா?** › erase › set up again and link the file again. Entries already in Excel are kept |
| Change categories | அமைப்பு › வகைகளை மாற்று / சேர் |
| Bigger text | அமைப்பு › எழுத்து அளவு |

**Updating later:** upload the changed files to the repository. The web app updates itself the next time it opens with internet.
If the reminder app is ever changed, uninstall the old one on the phone before installing the new .apk.
