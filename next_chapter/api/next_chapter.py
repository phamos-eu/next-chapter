# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe


def check_app_permission():
	"""Return True when the current user may open the NextChapter SPA."""
	return frappe.session.user != "Guest"
