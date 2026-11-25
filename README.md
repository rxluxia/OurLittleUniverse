# Our Little Universe

A landscape-first romantic scrapbook experience built with HTML5, CSS3, and vanilla JavaScript ES modules.

This folder is the second-anniversary project root. Other chapters can live beside it as sibling folders.

All parts are landscape-gated on coarse-pointer mobile devices; the rotate prompt appears before the opening can be started.

The opening scene has an inward-moving canvas starfield and a centered “Click to Start” button. Only the button activates the transition. Fine-pointer devices use the small SVG cursors in `assets/images/ui/`; touch devices retain their native cursor behavior.

The manga scene shows six edge-to-edge manga images across three spreads, followed by a two-page book-cover spread. “Click here” on the cover opens the scrapbook.

The scrapbook has six pages in three spreads and exactly 20 photo slots: four on each of pages 1–4 and two on each of pages 5–6. Images can be imported, replaced, and enlarged, and remain available while turning pages in the current browser session. They are not persisted or shared between devices: Supabase URL/key are blank and no authentication, database, storage bucket, or access policies are configured. Do not treat these local previews as shared uploads.

Closing the scrapbook returns to the dark poem scene, currently showing the requested work-in-progress monthsary note, floating lights, and bottom text links to Start, Manga, and Scrapbook.

## Project structure

```text
.
├── index.html
├── netlify.toml
├── .gitignore
├── README.md
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   ├── transitions.css
│   └── scenes/
│       ├── opening.css
│       ├── manga.css
│       ├── scrapbook.css
│       └── poem.css
├── js/
│   ├── main.js
│   ├── config.js
│   ├── core/
│   ├── scenes/
│   │   ├── opening.js
│   │   ├── opening-universe.js
│   │   ├── manga.js
│   │   ├── scrapbook.js
│   │   └── poem.js
│   └── services/
├── data/
│   └── manga.json
└── assets/
    ├── fonts/
    └── images/
        ├── manga/
        ├── scrapbook/
        └── ui/
```

## Folder purposes

- `css/` contains the design tokens, reset and base styles, responsive layout, and reusable transitions.
- `css/scenes/` contains the opening, manga, scrapbook, and poem scene styles.
- `js/main.js` composes the in-memory foundation.
- `js/config.js` contains public Supabase configuration placeholders only.
- `js/core/` contains state, scene management, transitions, and navigation.
- `js/scenes/` contains the opening/starfield, manga, scrapbook, and poem controllers.
- `js/services/` is reserved for future storage and data services.
- `data/manga.json` contains the replaceable manga structure skeleton.
- `assets/` contains fonts, manga and scrapbook images, and UI artwork/cursors in `assets/images/ui/`.

## Local development

ES modules require a local HTTP server. VS Code Live Server is recommended.

Alternatively, run a static server with no project dependencies:

```text
python -m http.server 5500
```

Then open `http://localhost:5500/`.

Do not open `index.html` directly with `file://`; browser module loading will be blocked.
