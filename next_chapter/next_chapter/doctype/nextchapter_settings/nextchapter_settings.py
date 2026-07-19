# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe.model.document import Document

DEFAULTS = {
	"wip_outline": 8,
	"wip_draft": 5,
	"wip_ready_to_write": 3,
	"wip_writing": 1,
	"default_session_mins": 60,
	"reminder_mins": 15,
}

STAGE_WIP_FIELD = {
	"Outline": "wip_outline",
	"Draft": "wip_draft",
	"Ready to write": "wip_ready_to_write",
	"Writing": "wip_writing",
}


class NextChapterSettings(Document):
	pass


def get_settings_dict() -> dict:
	"""Return settings values, creating the Single with defaults if missing."""
	if not frappe.db.exists("DocType", "NextChapter Settings"):
		return dict(DEFAULTS)

	if not frappe.db.exists("NextChapter Settings", "NextChapter Settings"):
		doc = frappe.new_doc("NextChapter Settings")
		doc.update(DEFAULTS)
		doc.insert(ignore_permissions=True)
		return dict(DEFAULTS)

	doc = frappe.get_single("NextChapter Settings")
	data = {key: doc.get(key) if doc.get(key) is not None else DEFAULTS[key] for key in DEFAULTS}
	return data


def get_wip_limit(stage: str) -> int | None:
	"""Return WIP limit for a stage, or None if unlimited."""
	field = STAGE_WIP_FIELD.get(stage)
	if not field:
		return None
	settings = get_settings_dict()
	limit = int(settings.get(field) or 0)
	return limit or None
