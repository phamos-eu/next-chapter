# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

"""Serve the NextChapter service worker from the site root so it can control /desk/*."""

from __future__ import annotations

import frappe
from werkzeug.wrappers import Response


def before_request():
	"""Return a root-scoped service worker for PWA installability."""
	request = getattr(frappe, "request", None)
	if not request or request.method not in ("GET", "HEAD"):
		return

	if request.path != "/next-chapter-sw.js":
		return

	file_path = frappe.get_app_path("next_chapter", "public", "js", "sw.js")
	with open(file_path, encoding="utf-8") as handle:
		body = handle.read()

	response = Response(body, mimetype="application/javascript; charset=utf-8")
	# Allow this root-level worker to control desk routes.
	response.headers["Service-Worker-Allowed"] = "/"
	response.headers["Cache-Control"] = "no-cache"
	return response
