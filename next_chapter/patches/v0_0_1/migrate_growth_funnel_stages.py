# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

import frappe


def execute():
	"""Map legacy named writing stages to the growth funnel."""
	mapping = {
		"Idea": "∞",
		"Outline": "9",
		"Draft": "5",
		"Ready to write": "3",
		"Writing": "1",
		"Done": "Done",
	}
	for old, new in mapping.items():
		frappe.db.sql(
			"update `tabImplementation Chapter` set writing_stage=%s where writing_stage=%s",
			(new, old),
		)

	if frappe.db.exists("DocType", "NextChapter Settings") and frappe.db.exists(
		"NextChapter Settings", "NextChapter Settings"
	):
		from next_chapter.next_chapter.doctype.nextchapter_settings.nextchapter_settings import (
			ensure_ritual_defaults,
		)

		doc = frappe.get_single("NextChapter Settings")
		# Seed new WIP defaults if unset
		for field, default in (
			("wip_9", 9),
			("wip_7", 7),
			("wip_5", 5),
			("wip_3", 3),
			("wip_1", 1),
		):
			if doc.meta.has_field(field) and doc.get(field) in (None, ""):
				doc.set(field, default)
		ensure_ritual_defaults(doc)
		doc.save(ignore_permissions=True)

	frappe.db.commit()
