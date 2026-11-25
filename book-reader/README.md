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
- **reads the book aloud**: tap the headphones button (or press L) and it reads from the page you're on, highlights the paragraph being read and turns the pages for you, with play/pause, skip paragraph, speed (0.75× to 2×) and a choice of voice
- **looks the way you like**: tap **Customise** (or the palette icon while reading) to choose a colour theme or your own colours, a reading font and title font, text size, line spacing, page margins, justified or left-aligned text, and a background picture
- **book covers**: the shelf shows each book's cover, made from the PDF's first page; tap **Picture** to use your own image or a plain cover
- has adjustable text size, keyboard shortcuts (← → to turn, B to bookmark, C for contents) and swipe gestures

Your PDF is read inside your browser with [PDF.js](https://mozilla.github.io/pdf.js/) and is never uploaded anywhere. The extracted text of each book is kept in your browser's IndexedDB, and bookmarks and reading positions in local storage, all on that device only.

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

## Limits

- Listening uses the voices built into your device, so it works offline. For a more natural voice on iPhone, download a Premium or Enhanced voice in Settings → Accessibility → Spoken Content → Voices. The app hides the novelty sound-effect voices some devices include (Bells, Bubbles, Organ and so on) and picks the most natural voice for your region automatically. On iPhone, reading stops if you lock the screen or switch apps (Safari doesn't allow web apps to talk in the background); the app keeps the screen awake while it reads, and you can press play to carry on.

- Books, places and bookmarks are kept per device and per browser. Books opened before version 2 need choosing once more, then they reopen by themselves. Clearing your browser's website data removes them. On iPhone, Safari can clear data for sites you haven't visited in a few weeks, so install it to your home screen to keep your shelf safe.

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
| `*.png` | App icons |
