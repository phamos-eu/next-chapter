# Copyright (c) 2024, phamos.eu and Contributors
# GNU GPLv3 License. See license.txt

import frappe
from frappe import _


def check_app_permission():
	"""Check if user has permission to access NextChapter."""
	if frappe.session.user == "Guest":
		return False
	
	# Check if user has any role that allows access
	# For now, allow all authenticated users
	# Can be customized later for specific roles
	return True


@frappe.whitelist()
def get_dashboard_data():
	"""Get dashboard data for NextChapter."""
	from frappe import db
	
	# Get counts
	total_stories = db.count("Implementation Story")
	total_chapters = db.count("Implementation Chapter")
	completed_stories = db.count("Implementation Story", filters={"status": "Completed"})
	in_progress_stories = db.count("Implementation Story", filters={"status": "In Progress"})
	
	# Get recent items
	recent_stories = db.get_all(
		"Implementation Story",
		fields=["name", "title", "status", "creation"],
		order_by="creation desc",
		limit=5
	)
	
	recent_chapters = db.get_all(
		"Implementation Chapter",
		fields=["name", "title", "status", "creation"],
		order_by="creation desc",
		limit=5
	)
	
	return {
		"total_stories": total_stories,
		"total_chapters": total_chapters,
		"completed_stories": completed_stories,
		"in_progress_stories": in_progress_stories,
		"recent_stories": recent_stories,
		"recent_chapters": recent_chapters,
		"has_data": total_stories > 0 or total_chapters > 0
	}
