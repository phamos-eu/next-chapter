# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe import _

from next_chapter.next_chapter.doctype.implementation_story.implementation_story import (
	get_active_story_name,
)


@frappe.whitelist()
def get_bootstrap():
	"""Return active story + chapters, or signal that setup is needed."""
	story_name = get_active_story_name()
	if not story_name:
		return {"needs_setup": True, "story": None, "chapters": []}

	story = frappe.get_doc("Implementation Story", story_name)
	# Explicit order_by: v16 defaults get_all to creation; we still want sequence first.
	chapters = frappe.get_all(
		"Implementation Chapter",
		filters={"story": story_name},
		fields=[
			"name",
			"title",
			"sequence",
			"writing_stage",
			"summary",
			"content",
			"modified",
		],
		order_by="sequence asc, creation asc",
	)

	return {
		"needs_setup": False,
		"story": {
			"name": story.name,
			"company_name": story.company_name,
			"status": story.status,
		},
		"chapters": chapters,
	}


@frappe.whitelist()
def complete_setup(
	company_name: str,
	company_purpose: str | None = None,
	employees_now: int | None = None,
	employees_1y: int | None = None,
	employees_3y: int | None = None,
	employees_7y: int | None = None,
	company_stage: str | None = None,
	erp_motivation: str | None = None,
	priority_1: str | None = None,
	priority_2: str | None = None,
	priority_3: str | None = None,
):
	"""Create the Implementation Story and three starter Idea chapters."""
	if get_active_story_name():
		frappe.throw(_("An active Implementation Story already exists."), frappe.ValidationError)

	company_name = (company_name or "").strip()
	if not company_name:
		frappe.throw(_("Company name is required."), frappe.ValidationError)

	titles = [
		(priority_1 or "").strip() or _("First priority"),
		(priority_2 or "").strip() or _("Second priority"),
		(priority_3 or "").strip() or _("Third priority"),
	]

	story = frappe.get_doc(
		{
			"doctype": "Implementation Story",
			"company_name": company_name,
			"company_purpose": _as_html(company_purpose),
			"employees_now": _as_int(employees_now),
			"employees_1y": _as_int(employees_1y),
			"employees_3y": _as_int(employees_3y),
			"employees_7y": _as_int(employees_7y),
			"company_stage": _as_html(company_stage),
			"erp_motivation": _as_html(erp_motivation),
			"status": "Active",
		}
	)
	story.insert()

	for idx, title in enumerate(titles, start=1):
		frappe.get_doc(
			{
				"doctype": "Implementation Chapter",
				"story": story.name,
				"title": title,
				"sequence": idx,
				"writing_stage": "Idea",
				"summary": "",
				"content": "",
			}
		).insert()

	return get_bootstrap()


def _as_int(value) -> int | None:
	if value in (None, ""):
		return None
	return int(value)


def _as_html(value: str | None) -> str:
	"""Store plain wizard text in Text Editor fields as simple paragraphs."""
	text = (value or "").strip()
	if not text:
		return ""
	if "<" in text and ">" in text:
		return text
	parts = [frappe.utils.escape_html(p.strip()) for p in text.split("\n") if p.strip()]
	return "".join(f"<p>{p}</p>" for p in parts)
