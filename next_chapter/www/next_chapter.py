# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt
"""SPA controller for /next-chapter.

Frappe maps the URL from the HTML filename (``next-chapter.html`` → ``/next-chapter``)
and loads this controller by converting hyphens to underscores
(``next-chapter`` → ``next_chapter.py``). Same pattern as frappe/crm.
"""

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
	boot = get_boot()
	context = frappe._dict()
	context.boot = boot
	# Also expose at template root so index.html can set window.csrf_token early.
	context.csrf_token = boot.csrf_token
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
