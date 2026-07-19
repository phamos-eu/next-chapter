# NextChapter

Writing-first ERPNext implementation planning for [Frappe](https://frappeframework.com/) **v16**.

NextChapter helps you sit down and write: company context, then **Ideas** that grow from a short brain dump into chapter introductions and longer requirement prose — similar to a focused notes app, structured around an implementation story.

**License:** [AGPL-3.0-only](LICENSE)

## Requirements

| Dependency | Version |
|------------|---------|
| Frappe | **v16** (`>=16.0.0,<17.0.0`) |
| Python | **≥ 3.14** |
| Node.js | **≥ 24** (bench / asset builds) |

Declared in [`pyproject.toml`](pyproject.toml) via `[tool.bench.frappe-dependencies]` for Frappe Cloud / bench compatibility checks.

## Writing-first MVP

This first slice is intentionally simple and single-user:

1. Complete a short setup wizard (company context + three first ideas).
2. Open the **NextChapter** desk page.
3. Write in the middle panel: **Brain Dump** tab for rough notes, **Chapter** tab for the rich text write-up.
4. Use the right panel for progress (Idea → Outline → Draft).
5. Add more ideas from the left sidebar as they appear.

**Not in this slice (planned later):** multi-party review, Lead / sales visibility when asking for help, full implementation status pipeline, PWA, Projects / Milestones / Issues.

## Install

On a Frappe **v16** bench:

```bash
cd /path/to/frappe-bench
bench get-app https://github.com/phamos-eu/next-chapter.git
bench --site <site> install-app next_chapter
bench --site <site> clear-cache
```

Then open the desktop **NextChapter** app, use the workspace sidebar **Write** link, or go to `/desk/next-chapter`.

### Install as a Chrome app (macOS)

NextChapter is set up as an installable PWA when you open the writing page over HTTPS:

1. In Chrome, open `/desk/next-chapter` and stay on the page for a few seconds.
2. Use either:
   - the **Install app** button when it appears in NextChapter, or
   - Chrome’s install icon in the address bar, or
   - **Chrome menu → Cast, save, and share → Install NextChapter…** (wording varies slightly by Chrome version).
3. NextChapter opens in its own window (`display: standalone`).

Technical pieces: [`manifest.json`](next_chapter/public/manifest.json), root service worker at `/next-chapter-sw.js`, and 192/512 PNG icons.

### Dogfood path (acceptance)

1. Open `/desk/next-chapter`.
2. Complete the 6-step wizard → one **Implementation Story** and three **Implementation Chapters** are created.
3. Select a chapter, write a short summary and longer content; wait for autosave (“Saved”).
4. Click **New Idea**, write again, reload the page — content should still be there.

## App structure

| Piece | Purpose |
|-------|---------|
| `Implementation Story` | Company / engagement context from the wizard |
| `Implementation Chapter` | An Idea that becomes a written chapter |
| Desk page `next-chapter` | Wizard + Joplin-like list/editor |
| Workspace + Workspace Sidebar | v16 desktop icon and persistent sidebar |
| `next_chapter.api.*` | Setup and chapter create/save APIs (PWA-ready later) |

## Frappe v16 notes

- Desk routes use `/desk/...` (not `/app/...`).
- `add_to_apps_screen` + `app_home` register the app on the v16 desktop.
- Standard **Workspace** and **Workspace Sidebar** ship with the app.
- Page JS is IIFE-safe (`frappe.provide` / `window.next_chapter`).
- DocType list defaults use `sort_field = creation` per v16 guidance.

## Development

```bash
bench --site <site> migrate
bench --site <site> clear-cache
python3 scripts/smoke_check.py
```

## About phamos

Built to support implementation preparation work at [phamos.eu](https://phamos.eu). Later slices may connect into the phamos sales / consulting cycle; this MVP stays a private writing tool.
