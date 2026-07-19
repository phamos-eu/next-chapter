# Copyright (c) 2024, phamos.eu and Contributors
# GNU GPLv3 License. See license.txt

import frappe
from frappe import _, get_installed_apps
from frappe.translate import get_messages_for_boot, get_translated_doctypes
from frappe.utils import cint, get_system_timezone

no_cache = 1


def get_context():
	"""Get context for the NextChapter web page."""
	from next_chapter.api import check_app_permission, get_dashboard_data

	if not check_app_permission():
		frappe.throw(_("You do not have permission to access NextChapter"), frappe.PermissionError)

	frappe.db.commit()
	
	# Get user info
	user_name = frappe.session.user
	user_full_name = frappe.db.get_value("User", user_name, "full_name") or user_name
	user_initial = user_full_name[0].upper() if user_full_name else "U"
	
	# Get dashboard data
	dashboard_data = get_dashboard_data()
	
	context = frappe._dict()
	context.boot = get_boot()
	context.user_name = user_full_name
	context.user_initial = user_initial
	context.dashboard_data = dashboard_data
	context.has_data = dashboard_data.get("has_data", False)
	context.total_stories = dashboard_data.get("total_stories", 0)
	context.total_chapters = dashboard_data.get("total_chapters", 0)
	context.completed_stories = dashboard_data.get("completed_stories", 0)
	context.in_progress_stories = dashboard_data.get("in_progress_stories", 0)
	
	if frappe.session.user != "Guest":
		pass  # Can add telemetry later if needed
	
	return context


@frappe.whitelist(methods=["POST"], allow_guest=True)
def get_context_for_dev():
	"""Get context for development purposes."""
	if not frappe.conf.developer_mode:
		frappe.throw(_("This method is only meant for developer mode"))
	return get_boot()


def get_boot():
	"""Get boot data for the frontend."""
	return frappe._dict(
		{
			"frappe_version": frappe.__version__,
			"default_route": get_default_route(),
			"site_name": frappe.local.site,
			"socketio_port": frappe.conf.socketio_port,
			"read_only_mode": frappe.flags.read_only,
			"csrf_token": frappe.sessions.get_csrf_token(),
			"setup_complete": cint(frappe.get_system_settings("setup_complete")),
			"sysdefaults": frappe.defaults.get_defaults(),
			"is_demo_site": frappe.conf.get("is_demo_site"),
			"demo_data_created": frappe.db.get_default("next_chapter_demo_data_created") == "1",
			"translated_doctypes": get_translated_doctypes(),
			"translated_messages": get_messages_for_boot(),
			"timezone": {
				"system": get_system_timezone(),
				"user": frappe.db.get_value("User", frappe.session.user, "time_zone")
				or get_system_timezone(),
			},
		}
	)


def get_default_route():
	"""Get the default route for NextChapter."""
	return "/next-chapter"
