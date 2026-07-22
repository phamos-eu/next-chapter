# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import escape_html


def execute():
	"""Merge Brain Dump summary into content for single-field writing."""
	rows = frappe.get_all(
		"Implementation Chapter",
		fields=["name", "summary", "content"],
	)
	for row in rows:
		summary = (row.summary or "").strip()
		content = (row.content or "").strip()
		if not summary:
			continue
		if not content:
			html = "".join(f"<p>{escape_html(p)}</p>" for p in summary.split("\n") if p.strip())
			frappe.db.set_value(
				"Implementation Chapter",
				row.name,
				"content",
				html or f"<p>{escape_html(summary)}</p>",
				update_modified=False,
			)
		elif summary not in content.replace("<p>", "").replace("</p>", ""):
			# prepend once
			html = "".join(f"<p>{escape_html(p)}</p>" for p in summary.split("\n") if p.strip())
			frappe.db.set_value(
				"Implementation Chapter",
				row.name,
				"content",
				(html or f"<p>{escape_html(summary)}</p>") + content,
				update_modified=False,
			)
	frappe.db.commit()
