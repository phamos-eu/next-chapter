# NextChapter

Writing-first ERPNext implementation planning for [Frappe](https://frappeframework.com/).

NextChapter helps you sit down and write: company context, then **Ideas** that grow from a short brain dump into chapter introductions and longer requirement prose — similar to a focused notes app, structured around an implementation story.

**License:** [AGPL-3.0-only](LICENSE)

## Writing-first MVP

This first slice is intentionally simple and single-user:

1. Complete a short setup wizard (company context + three first ideas).
2. Open the **NextChapter** desk page.
3. Write: expand each Idea’s summary (brain dump) and content (introduction → full chapter).
4. Add more Ideas as they appear.
5. Optionally mark personal writing stage: Idea → Outline → Draft.

**Not in this slice (planned later):** multi-party review, Lead / sales visibility when asking for help, full implementation status pipeline, PWA, Projects / Milestones / Issues.

## Install

On a Frappe bench (v14/v15+):

```bash
cd /path/to/frappe-bench
bench get-app https://github.com/phamos-eu/next-chapter.git
bench --site <site> install-app next_chapter
bench --site <site> clear-cache
```

Then open Desk → **NextChapter** workspace → **Write**, or go to `/app/next-chapter`.

### Dogfood path (acceptance)

1. Open `/app/next-chapter`.
2. Complete the 6-step wizard → one **Implementation Story** and three **Implementation Chapters** are created.
3. Select a chapter, write a short summary and longer content; wait for autosave (“Saved”).
4. Click **New Idea**, write again, reload the page — content should still be there.

## App structure

| Piece | Purpose |
|-------|---------|
| `Implementation Story` | Company / engagement context from the wizard |
| `Implementation Chapter` | An Idea that becomes a written chapter |
| Desk page `next-chapter` | Wizard + Joplin-like list/editor |
| `next_chapter.api.*` | Setup and chapter create/save APIs (PWA-ready later) |

## Development

```bash
bench --site <site> migrate
bench --site <site> clear-cache
```

## About phamos

Built to support implementation preparation work at [phamos.eu](https://phamos.eu). Later slices may connect into the phamos sales / consulting cycle; this MVP stays a private writing tool.
