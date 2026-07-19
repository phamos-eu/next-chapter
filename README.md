# NextChapter

Writing-first ERPNext implementation planning for [Frappe](https://frappeframework.com/) **v16**.

NextChapter helps you go from free writing to focused work: catch Ideas, mature them through stages, schedule writing sessions, and narrow WIP on a board — without losing a low-barrier notes feel.

**License:** [AGPL-3.0-only](LICENSE)

## Requirements

| Dependency | Version |
|------------|---------|
| Frappe | **v16** (`>=16.0.0,<17.0.0`) |
| Python | **≥ 3.14** |
| Node.js | **≥ 24** (bench / asset builds) |

Declared in [`pyproject.toml`](pyproject.toml) via `[tool.bench.frappe-dependencies]`.

## What you can do

1. Complete the setup wizard (company context + three first ideas).
2. **Write** — left Ideas list (search, status pills, Active/Hidden), center **Brain Dump** / **Chapter** tabs, right progress + next writing time.
3. Hide ideas until later (Later today / Tomorrow / Next week / Next month / Custom).
4. Schedule a writing session and **download a `.ics`** calendar file with a link back to the chapter.
5. **Schedule** view — List, Next 3 days, Next 10 days, Month, 90 days.
6. **Board** — kanban by stage with WIP limits from **NextChapter Settings**.

### Stages

`Idea` → `Outline` → `Draft` → `Ready to write` → `Writing` → `Done`

Idea and Done are unlimited. Outline / Draft / Ready to write / Writing use WIP limits from Settings (defaults 8 / 5 / 3 / 1).

## Install

```bash
cd /path/to/frappe-bench
bench get-app https://github.com/phamos-eu/next-chapter.git
bench --site <site> install-app next_chapter
bench --site <site> migrate
bench --site <site> clear-cache
```

Open `/desk/next-chapter`, or NextChapter → Write. Settings: **NextChapter Settings**.

### Chrome app (macOS)

On HTTPS, open `/desk/next-chapter` — use **Install as app** or Chrome’s install icon. See [`manifest.json`](next_chapter/public/manifest.json) and `/next-chapter-sw.js`.

### Dogfood path

1. Complete the wizard.
2. Search / filter ideas; hide one and find it under **Hidden**.
3. Set **Next writing session**, download `.ics`, open the URL from the event.
4. Switch to **Schedule** (10 days) and **Board**; drag a card until a WIP limit blocks you.

## App structure

| Piece | Purpose |
|-------|---------|
| `Implementation Story` | Company context |
| `Implementation Chapter` | Idea / chapter + schedule + hide |
| `NextChapter Settings` | WIP limits + session defaults |
| Desk page `next-chapter` | Write / Board / Schedule |
| `next_chapter.api.*` | Setup, chapter, ICS |

## Development

```bash
bench --site <site> migrate
bench --site <site> clear-cache
python3 scripts/smoke_check.py
```

## About phamos

Built for implementation preparation at [phamos.eu](https://phamos.eu).
