# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt
"""SPA entry for NextChapter — same pattern as frappe/crm www/crm.py."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, get_system_timezone

no_cache = 1


def get_context():
	if frappe.session.user == "Guest":
		frappe.local.flags.redirect_location = f"/login?redirect-to={frappe.request.path}"
		raise frappe.Redirect

	frappe.db.commit()
	context = frappe._dict()
	context.boot = get_boot()
	return context


@frappe.whitelist(methods=["POST"], allow_guest=True)
def get_context_for_dev():
	if not frappe.conf.developer_mode:
		frappe.throw(_("This method is only meant for developer mode"))
	return get_boot()


def get_boot():
	return frappe._dict(
		{
			"frappe_version": frappe.__version__,
			"default_route": "/next-chapter",
			"site_name": frappe.local.site,
			"socketio_port": getattr(frappe.conf, "socketio_port", None),
			"csrf_token": frappe.sessions.get_csrf_token(),
			"setup_complete": cint(frappe.get_system_settings("setup_complete")),
			"sitename": frappe.local.site,
			"user": {
				"name": frappe.session.user,
				"full_name": frappe.get_value("User", frappe.session.user, "full_name"),
			},
			"timezone": {
				"system": get_system_timezone(),
				"user": frappe.db.get_value("User", frappe.session.user, "time_zone")
				or get_system_timezone(),
			},
		}
	)
