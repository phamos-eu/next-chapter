# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe.model.document import Document

DEFAULTS = {
	"wip_9": 9,
	"wip_7": 7,
	"wip_5": 5,
	"wip_3": 3,
	"wip_1": 1,
	"default_session_mins": 60,
	"reminder_mins": 15,
	"focus_font_size": 18,
	"breath_count": 3,
	"inhale_seconds": 4,
	"hold_seconds": 2,
	"exhale_seconds": 6,
	"fade_idle_secs": 3,
	"fade_duration_secs": 2,
	"fade_idle_min_secs": 2,
	"fade_idle_max_secs": 8,
	"fade_drag": 0.25,
	"bubble_label_chars": 12,
}

STAGE_WIP_FIELD = {
	"9": "wip_9",
	"7": "wip_7",
	"5": "wip_5",
	"3": "wip_3",
	"1": "wip_1",
}

DEFAULT_RUNWAY = [
	"Silence notifications for the next hour",
	"Close unrelated tabs — one idea only",
	"Phone face-down / out of reach",
]

DEFAULT_BODY = [
	"Relieve yourself",
	"Glass of water nearby",
	"Comfortable seat and posture",
]


class NextChapterSettings(Document):
	def before_save(self):
		ensure_ritual_defaults(self)


def ensure_ritual_defaults(doc):
	"""Seed checklist rows when empty so Desk and SPA always have prompts."""
	if not doc.get("runway_checklist"):
		for prompt in DEFAULT_RUNWAY:
			doc.append("runway_checklist", {"prompt": prompt, "enabled": 1})
	if not doc.get("body_checklist"):
		for prompt in DEFAULT_BODY:
			doc.append("body_checklist", {"prompt": prompt, "enabled": 1})


def _checklist_payload(rows) -> list[dict]:
	items = []
	for row in rows or []:
		prompt = (row.get("prompt") if isinstance(row, dict) else row.get("prompt")) or ""
		prompt = prompt.strip()
		if not prompt:
			continue
		enabled = row.get("enabled") if isinstance(row, dict) else row.get("enabled")
		if enabled in (0, "0", False):
			continue
		items.append({"prompt": prompt, "enabled": 1})
	return items


def get_settings_dict() -> dict:
	"""Return settings values, creating the Single with defaults if missing."""
	if not frappe.db.exists("DocType", "NextChapter Settings"):
		return {
			**DEFAULTS,
			"runway_checklist": [{"prompt": p, "enabled": 1} for p in DEFAULT_RUNWAY],
			"body_checklist": [{"prompt": p, "enabled": 1} for p in DEFAULT_BODY],
		}

	if not frappe.db.exists("NextChapter Settings", "NextChapter Settings"):
		doc = frappe.new_doc("NextChapter Settings")
		doc.update(DEFAULTS)
		ensure_ritual_defaults(doc)
		doc.insert(ignore_permissions=True)
		return get_settings_dict()

	doc = frappe.get_single("NextChapter Settings")
	changed = False
	for key, default in DEFAULTS.items():
		if doc.meta.has_field(key) and doc.get(key) is None:
			doc.set(key, default)
			changed = True
	if not doc.get("runway_checklist") or not doc.get("body_checklist"):
		ensure_ritual_defaults(doc)
		changed = True
	if changed:
		doc.save(ignore_permissions=True)
		doc = frappe.get_single("NextChapter Settings")

	data = {
		key: doc.get(key) if doc.get(key) is not None else DEFAULTS[key] for key in DEFAULTS
	}
	# Keep fade_drag in [0, 1]
	try:
		drag = float(data.get("fade_drag") if data.get("fade_drag") is not None else DEFAULTS["fade_drag"])
	except (TypeError, ValueError):
		drag = DEFAULTS["fade_drag"]
	data["fade_drag"] = max(0.0, min(1.0, drag))
	data["runway_checklist"] = _checklist_payload(doc.get("runway_checklist"))
	data["body_checklist"] = _checklist_payload(doc.get("body_checklist"))
	return data


def get_wip_limit(stage: str) -> int | None:
	"""Return WIP limit for a stage, or None if unlimited."""
	field = STAGE_WIP_FIELD.get(stage)
	if not field:
		return None
	settings = get_settings_dict()
	limit = int(settings.get(field) or 0)
	return limit or None
