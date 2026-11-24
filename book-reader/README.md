# Book Reader

Turn any PDF into a book you can actually read.

**Use it:** https://irdk860.github.io/book-reader/

Drop in a PDF and Book Reader reflows the text into real book pages, with a two-page spread on wide screens and one page on phones. It:

- removes running headers and page numbers
- rebuilds paragraphs and joins words split by hyphens at line ends
- finds chapter headings and builds a contents list
- lets you bookmark pages with a ribbon and jump back to them
- remembers where you stopped and shows your books on a shelf
- has adjustable text size, keyboard shortcuts (← → to turn, B to bookmark, C for contents) and swipe gestures

Your PDF is read inside your browser with [PDF.js](https://mozilla.github.io/pdf.js/) and is never uploaded anywhere. Bookmarks and reading positions are saved in your browser's local storage on that device.

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

- Works with PDFs that contain real text. Scanned books (photos of pages) have no text to reflow.
- Images in the PDF aren't shown.
- Chapter detection is a best guess from text size and words like "Chapter" or "Prologue".

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole app: layout, styles and script in one file |
| `book-reader.html` | A copy for downloading and opening on its own |
| `manifest.webmanifest` | App name, colours and icons for installing |
| `sw.js` | Service worker that caches the app so it works offline |
| `*.png` | App icons |
