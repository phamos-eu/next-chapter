# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe.model.document import Document

DEFAULT_PREFS = {
	"page_pile": 0,
	"edit_idle_secs": 45,
	"aim_bias": "keep",
	"ideas_sort": "modified_desc",
	"ideas_visible_limit": 20,
}

IDEAS_SORT_OPTIONS = {
	"modified_desc",
	"title_asc",
	"stage_asc",
	"sequence_asc",
}


class NextChapterUserPreference(Document):
	pass


def get_user_prefs(user: str | None = None) -> dict:
	"""Return preference dict for user, creating a row if missing."""
	user = user or frappe.session.user
	if not user or user == "Guest":
		return dict(DEFAULT_PREFS)

	name = frappe.db.get_value("NextChapter User Preference", {"user": user}, "name")
	if not name:
		doc = frappe.get_doc(
			{
				"doctype": "NextChapter User Preference",
				"user": user,
				**DEFAULT_PREFS,
			}
		)
		doc.insert(ignore_permissions=True)
	else:
		doc = frappe.get_doc("NextChapter User Preference", name)

	sort = doc.ideas_sort or DEFAULT_PREFS["ideas_sort"]
	if sort not in IDEAS_SORT_OPTIONS:
		sort = DEFAULT_PREFS["ideas_sort"]
	limit = int(doc.ideas_visible_limit or DEFAULT_PREFS["ideas_visible_limit"])
	if limit < 1:
		limit = DEFAULT_PREFS["ideas_visible_limit"]

	return {
		"name": doc.name,
		"user": doc.user,
		"page_pile": int(doc.page_pile or 0),
		"edit_idle_secs": int(doc.edit_idle_secs or DEFAULT_PREFS["edit_idle_secs"]),
		"fade_idle_secs": doc.fade_idle_secs,
		"fade_drag": doc.fade_drag,
		"breath_count": doc.breath_count,
		"aim_bias": doc.aim_bias or "keep",
		"last_next_focus_note": doc.last_next_focus_note or "",
		"ideas_sort": sort,
		"ideas_visible_limit": limit,
	}


def save_user_prefs(updates: dict, user: str | None = None) -> dict:
	user = user or frappe.session.user
	prefs = get_user_prefs(user)
	doc = frappe.get_doc("NextChapter User Preference", prefs["name"])
	for key in (
		"page_pile",
		"edit_idle_secs",
		"fade_idle_secs",
		"fade_drag",
		"breath_count",
		"aim_bias",
		"last_next_focus_note",
		"ideas_sort",
		"ideas_visible_limit",
	):
		if key in updates and updates[key] is not None:
			doc.set(key, updates[key])
	if doc.ideas_sort not in IDEAS_SORT_OPTIONS:
		doc.ideas_sort = DEFAULT_PREFS["ideas_sort"]
	if int(doc.ideas_visible_limit or 0) < 1:
		doc.ideas_visible_limit = DEFAULT_PREFS["ideas_visible_limit"]
	doc.save(ignore_permissions=True)
	return get_user_prefs(user)
