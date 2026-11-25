# Claude Handoff — Our Little Universe

## Project snapshot

- Project root: `second-anniversary/`
- Stack: HTML5, CSS3, vanilla JavaScript ES modules. No frameworks, packages, build step, CDNs, or external fonts.
- Layout: landscape-first; desktop stage is capped at 1280px.
- The project has no initialized Git repository.
- Current implementation includes the opening, six-page manga with a two-page book-cover spread, interactive scrapbook, and a work-in-progress poem/closing note. Scrapbook image previews are local to the current browser session because shared storage is not configured.

## Current experience

- `index.html` contains the six scenes, the opening canvas, manga reader and book-cover page, scrapbook, monthsary note, hidden navigation, and rotate-to-landscape gate.
- The opening has no title or note. Its button is centered and styled with the system serif token, champagne glow, no border, no oval outline, and no underline. The HTML label currently reads `CLICK TO START`.
- `js/scenes/opening.js` initializes the opening scene and starts the starfield. Only the button starts the transition; empty-space clicks do nothing. The button is blurred and disabled after activation to prevent a focus outline or double activation. The button click keeps the starfield running while the opening slowly dims; the canvas stops after the manga scene opens.
- Clicking fades the opening scene to black over 1.6 seconds while the starfield continues, then activates the manga scene. Reduced-motion mode skips the slow fade.
- `js/scenes/opening-universe.js` draws faster inward-moving light streaks and soft glows aimed at the button. The canvas uses CSS color tokens, caps device pixel ratio at 2, responds to resize/font changes, and pauses for hidden tabs, reduced motion, and the orientation gate. Its animation is cleaned up after the transition and restarts on returning to opening.
- `js/core/orientation-gate.js` shows the rotate prompt on coarse-pointer portrait devices up to 900px wide before the opening can be started, and keeps every scene inaccessible until the device is landscape.
- `assets/images/ui/cursor.svg` and `cursor-hover.svg` provide the default and interactive cursors. `css/tokens.css` defines their cursor tokens; `css/base.css` applies them only to fine pointers and restores the default cursor on disabled buttons.
- The manga shell in `index.html` is styled by `css/scenes/manga.css` and initialized by `js/scenes/manga.js`. It has three full-bleed two-page spreads, then a two-page cover spread using the supplied `back-cover.jpg`. A narrow center gutter separates each spread, and the “Click here” button on the cover transitions to the scrapbook.
- The scrapbook is initialized by `js/scenes/scrapbook.js`. Its cover is landscape, and its six pages always display as three two-page spreads across viewport sizes. It has 20 independent photo slots (four each on pages 1–4, two each on pages 5–6), with local import/replacement, enlargement, navigation, and a close-to-poem action. Imported images remain in memory across page navigation but do not survive refreshes or sync across devices.
- The poem/closing scene shows the requested work-in-progress monthsary note and has a transparent bottom navigation with text links to Start, Manga, and Scrapbook.
- Supabase is not configured: `js/config.js` has blank URL and anon-key placeholders, and there is no authentication, database, storage bucket, or RLS setup. Do not claim shared or persistent uploads. Shared uploads require authenticated access and secure private-bucket/database policies for the two users; never put a service-role key in browser code.

## Foundation and key files

- `css/tokens.css`: color, typography, spacing, layout, and timing tokens.
- `css/layout.css`: scene layout, responsive landscape stage, safe areas, and rotate-gate styling.
- `css/transitions.css`, `js/core/transitions.js`: fade/zoom/page-flip transitions, reduced-motion handling, and transition-end timeout fallback.
- `js/core/scene-manager.js`: fixed scene order, scene registration/navigation, inert and `aria-hidden` state, error fallback, and transition lock.
- `js/core/state.js`: in-memory scene/navigation state and subscriptions; no browser storage.
- `js/core/nav.js`: navigation remains hidden until explicitly unlocked.
- `js/main.js`: initializes the orientation gate, opening, manga, epilogue, scrapbook, and poem scenes, and exposes `window.sceneManager` and `window.unlockNav`.
- `js/config.js`: empty Supabase URL and public anon-key placeholders only; never place a service-role key here.
- `data/manga.json`: six pages with four empty panels per page.
- `README.md`: project overview, landscape gate, folder purposes, and local server instructions.

## Recent UI decision

The start control should remain simple: serif “Click to Start” styling, no underline, and no green oval outline. Keyboard focus receives a subtle text glow instead of an outline. Note that the current HTML source uses uppercase `CLICK TO START`; CSS does not apply text-transform.

## Verification

Browser checks on the current implementation confirmed:

- No console errors or failed network responses.
- Both cursor SVGs load successfully. Fine pointers use the dot-and-ring cursor, switching to emerald over interactive controls; touch emulation has no custom cursor.
- Clicking empty opening space does nothing. Mouse click, button tap, Enter, and Space activate the button and navigate to manga.
- No overflow at 320×640, 640×360, 844×390, 932×430, and 1440×900; the desktop stage is 1280px wide and centered.
- With coarse-pointer emulation, portrait orientation shows the gate and makes the stage/navigation inert before start and across all scenes; landscape removes the gate.
- The poem scene's Start, Manga, and Scrapbook text links navigate to their matching scenes without adding a background behind the nav.
- The starfield pauses under the gate, resumes in landscape, and restarts when returning to the opening scene.
- Clicking the opening blurs the button, applies the 1.6-second dark fade, and activates the manga scene. Reduced-motion mode navigates immediately.
- The manga scene contains three spreads; its next control advances through the two page-turn animations and disables at the final spread.
- Keyboard focus has no outline or underline and retains a visible text-glow cue.

## Continuation constraints

Keep changes limited to the phase the owner requests. Do not invent manga dialogue or poem content. Keep the stack dependency-free, disclose the scrapbook's local-only image behavior until secure shared storage is configured, and preserve reduced-motion and keyboard accessibility behavior.
