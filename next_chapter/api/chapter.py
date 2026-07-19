# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe import _

from next_chapter.next_chapter.doctype.implementation_story.implementation_story import (
	get_active_story_name,
)

ALLOWED_STAGES = {"Idea", "Outline", "Draft"}


@frappe.whitelist()
def create_chapter(title: str | None = None, story: str | None = None):
	"""Add a new Idea chapter to the active (or given) story."""
	story_name = story or get_active_story_name()
	if not story_name:
		frappe.throw(_("No active Implementation Story. Complete setup first."), frappe.ValidationError)

	title = (title or "").strip() or _("Untitled idea")

	max_seq = frappe.db.sql(
		"select max(sequence) from `tabImplementation Chapter` where story=%s",
		story_name,
	)
	sequence = int((max_seq and max_seq[0][0]) or 0) + 1

	doc = frappe.get_doc(
		{
			"doctype": "Implementation Chapter",
			"story": story_name,
			"title": title,
			"sequence": sequence,
			"writing_stage": "Idea",
			"summary": "",
			"content": "",
		}
	)
	doc.insert()

	return {
		"name": doc.name,
		"title": doc.title,
		"sequence": doc.sequence,
		"writing_stage": doc.writing_stage,
		"summary": doc.summary or "",
		"content": doc.content or "",
		"modified": doc.modified,
	}


@frappe.whitelist()
def save_chapter(
	name: str,
	title: str | None = None,
	summary: str | None = None,
	content: str | None = None,
	writing_stage: str | None = None,
):
	"""Autosave chapter writing fields from the desk page."""
	if not name:
		frappe.throw(_("Chapter name is required."), frappe.ValidationError)

	doc = frappe.get_doc("Implementation Chapter", name)

	if title is not None:
		title = title.strip()
		if not title:
			frappe.throw(_("Title cannot be empty."), frappe.ValidationError)
		doc.title = title

	if summary is not None:
		doc.summary = summary

	if content is not None:
		# Text Editor (Quill) sends HTML; sanitize before storage.
		doc.content = frappe.utils.sanitize_html(content or "")

	if writing_stage is not None:
		if writing_stage not in ALLOWED_STAGES:
			frappe.throw(_("Invalid writing stage."), frappe.ValidationError)
		doc.writing_stage = writing_stage

	doc.save()

	return {
		"name": doc.name,
		"title": doc.title,
		"sequence": doc.sequence,
		"writing_stage": doc.writing_stage,
		"summary": doc.summary or "",
		"content": doc.content or "",
		"modified": doc.modified,
	}
