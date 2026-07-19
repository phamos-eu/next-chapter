# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe.model.document import Document


class ImplementationStory(Document):
	pass


def get_active_story_name() -> str | None:
	return frappe.db.get_value(
		"Implementation Story",
		{"status": "Active"},
		"name",
		order_by="creation asc",
	)
