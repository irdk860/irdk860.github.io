# Book Reader

Turn any PDF into a book you can actually read.

**Use it:** https://irdk860.github.io/book-reader/

Drop in a PDF and Book Reader reflows the text into real book pages, with a two-page spread on wide screens and one page on phones. It:

- removes running headers and page numbers
- rebuilds paragraphs and joins words split by hyphens at line ends
- finds chapter headings and builds a contents list
- lets you bookmark pages with a ribbon and jump back to them
- keeps each book on your device, so **Continue reading** reopens it at your page without choosing the PDF again
- remembers where you stopped and shows your books on a shelf (with Remove to clear one off)
- **an account for all your devices** (optional): tap **Account** on the home screen and sign in with an email and password. Books you add, your place, bookmarks, covers and settings then appear on every phone and computer you sign in on
- **reads the book aloud**: tap the headphones button (or press L) and it reads from the page you're on, highlights the paragraph being read and turns the pages for you, with play/pause, skip paragraph, speed (0.75× to 2×) and a choice of voice
- **voice settings inside the app**: choose the voice, speed, pitch and volume, and tap **Test voice** to hear it, all from the player. If a book's language has no voice on the device, the app offers voices from other languages instead
- **voice library**: tap **Get more voices** (in Voice settings, or in the globe menu) to download extra voices straight into the app, in dozens of languages including Swahili and Arabic. They're free, work offline afterwards and sound the same on every phone and computer. Voices are open-source [Piper](https://github.com/rhasspy/piper) voices, run in the browser with [vits-web](https://github.com/diffusionstudio/vits-web)
- **looks the way you like**: tap **Customise** (or the palette icon while reading) to choose a colour theme or your own colours, a reading font and title font, text size, line spacing, page margins, justified or left-aligned text, and a background picture
- **book covers**: the shelf shows each book's cover, made from the PDF's first page; tap **Picture** to use your own image or a plain cover
- **in your language**: the app comes in English, Spanish, French, German, Portuguese, Italian, Chinese, Hindi, Japanese, Arabic (right to left), Swahili, Amharic, Hausa and Irish. It starts in your device's language; change it with the globe button
- **books in any language**: it recognises the book's language, reads it aloud in a matching voice, lays out Chinese and Japanese correctly and turns Arabic and Hebrew books right to left
- **translate a book** (Chrome or Edge on a computer): pick a language and the book is translated on your device, chapter by chapter, and read aloud in that language. Translations are saved, so they don't need redoing
- has adjustable text size, keyboard shortcuts (← → to turn, B to bookmark, C for contents) and swipe gestures

Your PDF is read inside your browser with [PDF.js](https://mozilla.github.io/pdf.js/) and the PDF file itself is never uploaded anywhere. The extracted text of each book is kept in your browser's IndexedDB, and bookmarks and reading positions in local storage. Without an account, all of that stays on that device only.

## Your account (keep books on every device)

1. On the home screen, tap **Account** (the person icon).
2. Type an email and a password (at least 8 characters) and tap **Create account**. On your other devices, tap **Sign in** with the same details.
3. That's it. Books you've already added are saved to your account straight away, and from then on:
   - a book you add on one device shows on the shelf of the others, marked **Open from your account →**. Tapping it downloads the book. No PDF is needed.
   - your page, bookmarks, book language and translation choice follow you. If you read on your phone, your computer opens at the same page.
   - book pictures, the colour theme, fonts, layout, text size, reading speed and app language follow you too. Voices and the background picture stay per device, because each device has different voices.
   - removing a book from the shelf removes it from your account and your other devices.

Saving happens by itself a moment after you turn a page, and when you go back to the shelf or switch apps. Without internet, everything carries on working on the device and catches up the next time it's online. **Sync now** in the Account panel saves and fetches straight away. If two devices read the same book, the most recent reading wins.

**What's stored:** the text of each book (not the PDF file), covers, reading places, bookmarks and settings. It's kept with [Supabase](https://supabase.com) (a hosted database in the UK/EU), and every row and file is locked to your account, so no one else can see or change it. Sign out any time; your books stay on that device.

## Install it

It's a web app (PWA), so there's nothing to download from an app store.

**iPhone / iPad**
1. Open https://irdk860.github.io/book-reader/ in **Safari** (it has to be Safari on iOS).
2. Tap the **Share** button (square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**, then **Add**.
4. Open Book Reader from your home screen. Tap the cover to pick a PDF from the **Files** app (iCloud Drive, Downloads, or "On My iPhone").

Tip: to get a PDF into Files, open it in Safari or Mail, tap Share, then **Save to Files**.

**Android**
1. Open the link in **Chrome**.
2. Tap **⋮**, then **Install app** or **Add to Home screen**.

**Computer**
- In Chrome or Edge, click the install icon in the address bar, or
- download [`book-reader.html`](book-reader.html) and open it in any browser (it needs an internet connection the first time to load PDF.js and the fonts).

## Add more voices to your phone

The easiest way is inside the app: open the player, tap the **Voice settings** button (the sliders) and then **Get more voices**. Voices you download there live inside Book Reader. If you'd also like better voices for your whole phone, you can add them in your phone's settings:

Book Reader reads aloud with the voices already on your phone or computer. Adding a better voice, or a voice for another language, takes a couple of minutes. Voices only ever come from your phone's own settings or official app store, never from a website, so you don't need to download anything from the internet.

**iPhone or iPad**
1. Open the **Settings** app and go to **Accessibility → Spoken Content → Voices**.
2. Tap the language you want (for example **English**, **Español** or **العربية**), then tap a voice.
3. Tap the download button next to a voice marked **Enhanced** or **Premium**. These sound the most natural. They can be 100 MB or more, so use Wi-Fi.
4. Close Book Reader fully and open it again. The new voice appears in the player under **Voice settings** (the sliders button).

Apple's official guide: [Adjust voice and speed on iPhone and iPad](https://support.apple.com/111798)

**Android**
1. Open the **Settings** app and go to **Accessibility → Text-to-speech output**. On some phones it's under **System → Languages & input**.
2. Next to the speech engine (usually **Speech Services by Google**), tap the settings ⚙ button.
3. Tap **Install voice data**, choose the language you want and download it. Use Wi-Fi.
4. Close Book Reader fully and open it again. The new voice appears under **Voice settings** in the player.

If your phone doesn't have Google's voices, or they need updating, get the official app from Google Play: [Speech Services by Google](https://play.google.com/store/apps/details?id=com.google.android.tts). Google's guide: [Text-to-speech output](https://support.google.com/accessibility/android/answer/6006983)

**Computer**
- **Windows:** Settings → Time & language → Speech → Manage voices → Add voices. In Microsoft Edge, Book Reader can also use Microsoft's natural online voices without installing anything.
- **Mac:** System Settings → Accessibility → Spoken Content → System voice → Manage Voices.

Voices for Swahili, Amharic, Hausa and Irish are often not available on phones. When a book's language has no voice, Book Reader lets you pick a voice from another language instead.

## Limits

- Book translation needs Chrome 138+ or Edge on a computer; phones and Safari can't translate books yet. Reading aloud needs a voice for that language on the device: Swahili, Amharic, Hausa and Irish voices are rare, and the app says when one is missing.
- The app's translations were written with AI help; corrections from native speakers are welcome.

- Listening uses the voices built into your device, so it works offline. The app hides the novelty sound-effect voices some devices include (Bells, Bubbles, Organ and so on) and picks the most natural voice for your region automatically. On iPhone, reading stops if you lock the screen or switch apps (Safari doesn't allow web apps to talk in the background); the app keeps the screen awake while it reads, and you can press play to carry on.

- Without an account, books, places and bookmarks are kept per device and per browser. Books opened before version 2 need choosing once more, then they reopen by themselves. Clearing your browser's website data removes them. On iPhone, Safari can clear data for sites you haven't visited in a few weeks, so install it to your home screen to keep your shelf safe.

- Accounts: there's no email check and no "forgot password" yet (that needs an email-sending service), so keep your password somewhere safe. The free Supabase plan allows 1 GB of book files in total, and pauses the project after a week with no use: the owner gets an email first, and can wake it again with **Resume project** in the Supabase dashboard.

- Works with PDFs that contain real text. Scanned books (photos of pages) have no text to reflow.
- Images in the PDF aren't shown.
- Chapter detection is a best guess from text size and words like "Chapter" or "Prologue".

## Updates

The app checks for a newer version whenever it opens. From the home screen it updates itself; while you're reading it shows an **Update now** button so your page isn't interrupted. The version number is shown at the bottom of the home screen. When releasing a new version, raise the number in both `version.json` and `APP_VERSION` in `index.html`.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole app: layout, styles and script in one file |
| `book-reader.html` | A copy for downloading and opening on its own |
| `manifest.webmanifest` | App name, colours and icons for installing |
| `version.json` | The latest version number, used by the update check |
| `sw.js` | Service worker that caches the app so it works offline |
| `supabase/` | The account setup: database tables and rules, and the sign-up function |
| `*.png` | App icons |
