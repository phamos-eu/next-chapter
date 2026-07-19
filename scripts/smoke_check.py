#!/usr/bin/env python3
"""Offline structure checks for NextChapter (no Frappe bench required)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "next_chapter"

REQUIRED = [
	APP / "hooks.py",
	APP / "modules.txt",
	APP / "api" / "setup.py",
	APP / "api" / "chapter.py",
	APP / "public" / "css" / "next_chapter.css",
	APP / "public" / "images" / "next-chapter-logo.svg",
	APP / "public" / "images" / "next-chapter-192.png",
	APP / "public" / "images" / "next-chapter-512.png",
	APP / "public" / "manifest.json",
	APP / "public" / "js" / "pwa.js",
	APP / "public" / "js" / "sw.js",
	APP / "public" / "js" / "writing_workspace.js",
	APP / "pwa.py",
	APP / "next_chapter" / "doctype" / "implementation_story" / "implementation_story.json",
	APP / "next_chapter" / "doctype" / "implementation_chapter" / "implementation_chapter.json",
	APP / "next_chapter" / "doctype" / "nextchapter_settings" / "nextchapter_settings.json",
	APP / "next_chapter" / "page" / "next_chapter" / "next_chapter.json",
	APP / "next_chapter" / "page" / "next_chapter" / "next_chapter.js",
	APP / "next_chapter" / "workspace" / "next_chapter" / "next_chapter.json",
	APP / "workspace_sidebar" / "next_chapter.json",
	ROOT / "README.md",
	ROOT / "LICENSE",
	ROOT / "pyproject.toml",
]


def main() -> int:
	errors: list[str] = []

	for path in REQUIRED:
		if not path.exists():
			errors.append(f"missing: {path.relative_to(ROOT)}")

	modules = (APP / "modules.txt").read_text(encoding="utf-8").strip()
	# Frappe scrubs module titles: "Next Chapter" → next_chapter (package folder).
	if modules != "Next Chapter":
		errors.append(f"modules.txt expected 'Next Chapter', got {modules!r}")

	# pyproject / Frappe Cloud v16 declaration
	pyproject = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
	if 'requires-python = ">=3.14"' not in pyproject:
		errors.append("pyproject.toml must require Python >=3.14 for Frappe v16")
	if "[tool.bench.frappe-dependencies]" not in pyproject:
		errors.append("pyproject.toml missing [tool.bench.frappe-dependencies]")
	if 'frappe = ">=16.0.0,<17.0.0"' not in pyproject and "frappe = " not in pyproject:
		errors.append("pyproject.toml must declare frappe v16 dependency range")
	elif ">=16.0.0" not in pyproject:
		errors.append("pyproject.toml frappe dependency must include >=16.0.0")

	hooks = (APP / "hooks.py").read_text(encoding="utf-8")
	for needle in (
		"add_to_apps_screen",
		'app_home = "/next-chapter"',
		"app_logo_url",
		"next_chapter.pwa.before_request",
		"website_route_rules",
		"/next-chapter/<path:app_path>",
	):
		if needle not in hooks:
			errors.append(f"hooks.py missing required hook: {needle}")

	# URL comes from the HTML filename; controller uses underscores for the same name.
	spa_html = APP / "www" / "next-chapter.html"
	spa_boot = APP / "www" / "next_chapter.py"
	if not spa_html.is_file():
		errors.append("missing www/next-chapter.html — run yarn build in frontend/")
	else:
		html = spa_html.read_text(encoding="utf-8")
		if 'id="app"' not in html or "/assets/next_chapter/frontend/" not in html:
			errors.append("www/next-chapter.html must be the Vue SPA shell")
		if "total_stories" in html:
			errors.append("www/next-chapter.html still looks like the old dashboard template")
	if not spa_boot.is_file():
		errors.append("missing www/next_chapter.py (SPA controller for next-chapter.html)")
	else:
		boot_src = spa_boot.read_text(encoding="utf-8")
		for needle in ("get_context", "get_boot", "csrf_token"):
			if needle not in boot_src:
				errors.append(f"www/next_chapter.py missing: {needle}")
		if "get_dashboard_data" in boot_src:
			errors.append("www/next_chapter.py must not call the old dashboard API")
	# Underscore HTML would register /next_chapter instead of /next-chapter.
	if (APP / "www" / "next_chapter.html").is_file():
		errors.append("remove www/next_chapter.html — it steals/conflicts; use next-chapter.html")

	frontend_pkg = ROOT / "frontend" / "package.json"
	if not frontend_pkg.is_file():
		errors.append("missing frontend/package.json (Vue + frappe-ui SPA)")

	manifest = json.loads((APP / "public/manifest.json").read_text(encoding="utf-8"))
	for key in ("name", "short_name", "start_url", "display", "icons"):
		if key not in manifest:
			errors.append(f"manifest.json missing {key}")
	if manifest.get("display") not in {"standalone", "fullscreen", "minimal-ui"}:
		errors.append("manifest.json display must be standalone/fullscreen/minimal-ui")
	if manifest.get("start_url") != "/next-chapter":
		errors.append("manifest.json start_url must be /next-chapter")
	icon_sizes = {i.get("sizes") for i in manifest.get("icons", [])}
	if "192x192" not in icon_sizes or "512x512" not in icon_sizes:
		errors.append("manifest.json needs 192 and 512 icons")

	sw = (APP / "public/js/sw.js").read_text(encoding="utf-8")
	if "addEventListener(\"fetch\"" not in sw and "addEventListener('fetch'" not in sw:
		errors.append("service worker must register a fetch handler")

	pwa_js = (APP / "public/js/pwa.js").read_text(encoding="utf-8")
	for needle in ("setup_pwa", "beforeinstallprompt", "/next-chapter-sw.js", "manifest.json"):
		if needle not in pwa_js:
			errors.append(f"pwa.js missing: {needle}")

	for rel in (
		"next_chapter/doctype/implementation_story/implementation_story.json",
		"next_chapter/doctype/implementation_chapter/implementation_chapter.json",
		"next_chapter/page/next_chapter/next_chapter.json",
		"next_chapter/workspace/next_chapter/next_chapter.json",
		"workspace_sidebar/next_chapter.json",
	):
		data = json.loads((APP / rel).read_text(encoding="utf-8"))
		if data.get("module") and data.get("module") != "Next Chapter":
			errors.append(f"{rel} module must be 'Next Chapter' (scrubs to next_chapter/)")

		if rel.endswith("implementation_story.json"):
			fields = {f["fieldname"] for f in data["fields"]}
			for required in (
				"company_name",
				"company_purpose",
				"employees_now",
				"employees_1y",
				"employees_3y",
				"employees_7y",
				"company_stage",
				"erp_motivation",
				"status",
			):
				if required not in fields:
					errors.append(f"Story missing field: {required}")
			if data.get("sort_field") != "creation":
				errors.append("Story sort_field should be creation (Frappe v16)")
			for forbidden in ("lead", "visibility", "help_requested_on"):
				if forbidden in fields:
					errors.append(f"Story should not have deferred field yet: {forbidden}")
		if rel.endswith("implementation_chapter.json"):
			fields = {f["fieldname"] for f in data["fields"]}
			for required in (
				"story",
				"title",
				"sequence",
				"summary",
				"content",
				"writing_stage",
				"hidden_until",
				"next_write_on",
				"write_duration_mins",
			):
				if required not in fields:
					errors.append(f"Chapter missing field: {required}")
			stage_field = next(f for f in data["fields"] if f["fieldname"] == "writing_stage")
			for stage in ("Idea", "Outline", "Draft", "Ready to write", "Writing", "Done"):
				if stage not in (stage_field.get("options") or ""):
					errors.append(f"Chapter writing_stage missing {stage}")
			if data.get("sort_field") != "creation":
				errors.append("Chapter sort_field should be creation (Frappe v16)")
		if rel.endswith("nextchapter_settings.json"):
			if not data.get("issingle"):
				errors.append("NextChapter Settings must be a Single DocType")
			fields = {f["fieldname"] for f in data["fields"]}
			for required in (
				"wip_outline",
				"wip_draft",
				"wip_ready_to_write",
				"wip_writing",
				"default_session_mins",
			):
				if required not in fields:
					errors.append(f"Settings missing field: {required}")
		if rel.endswith("page/next_chapter/next_chapter.json"):
			if data.get("page_name") != "next-chapter":
				errors.append("Desk page_name must be next-chapter")
		if rel.endswith("workspace/next_chapter/next_chapter.json"):
			if data.get("app") != "next_chapter" or data.get("public") != 1:
				errors.append("Workspace must be public app=next_chapter")
		if rel.endswith("workspace_sidebar/next_chapter.json"):
			if data.get("doctype") != "Workspace Sidebar":
				errors.append("workspace_sidebar JSON must be Workspace Sidebar")
			labels = {i.get("label") for i in data.get("items", [])}
			if "Ideas" not in labels:
				errors.append("Workspace Sidebar missing Ideas link")

	if not (APP / "next_chapter").is_dir():
		errors.append("missing package folder next_chapter/next_chapter for scrubbed module")

	spa_sources = [
		ROOT / "frontend" / "src" / "main.js",
		ROOT / "frontend" / "src" / "router.js",
		ROOT / "frontend" / "src" / "composables" / "useWorkspace.js",
		ROOT / "frontend" / "src" / "pages" / "Ideas.vue",
		ROOT / "frontend" / "src" / "pages" / "Write.vue",
		ROOT / "frontend" / "src" / "pages" / "Board.vue",
		ROOT / "frontend" / "src" / "pages" / "Schedule.vue",
		ROOT / "frontend" / "src" / "pages" / "Setup.vue",
		ROOT / "frontend" / "src" / "components" / "AppShell.vue",
	]
	front = ""
	for path in spa_sources:
		if not path.is_file():
			errors.append(f"missing SPA source: {path.relative_to(ROOT)}")
			continue
		front += "\n" + path.read_text(encoding="utf-8")
	for needle in (
		"next_chapter.api.setup.complete_setup",
		"next_chapter.api.setup.get_bootstrap",
		"next_chapter.api.chapter.save_chapter",
		"next_chapter.api.chapter.create_chapter",
		"next_chapter.api.chapter.hide_chapter",
		"next_chapter.api.chapter.set_stage",
		"Add Idea",
		"Brain Dump",
		"Ideas",
		"createWebHistory('/next-chapter')",
		"frappe-ui",
		"Could not open NextChapter",
	):
		if needle not in front:
			errors.append(f"SPA source missing: {needle}")

	api = (APP / "api/chapter.py").read_text(encoding="utf-8")
	for needle in (
		"download_ics",
		"hide_chapter",
		"set_writing_session",
		"BEGIN:VCALENDAR",
		"/next-chapter/ideas/",
	):
		if needle not in api:
			errors.append(f"chapter API missing: {needle}")

	sidebar = json.loads((APP / "workspace_sidebar/next_chapter.json").read_text(encoding="utf-8"))
	labels = {i.get("label") for i in sidebar.get("items", [])}
	if "Settings" not in labels:
		errors.append("Workspace Sidebar missing Settings link")
	ideas_item = next((i for i in sidebar.get("items", []) if i.get("label") == "Ideas"), None)
	if not ideas_item or ideas_item.get("link_to") != "/next-chapter/ideas":
		errors.append("Workspace Sidebar Ideas link must point to /next-chapter/ideas")

	readme = (ROOT / "README.md").read_text(encoding="utf-8")
	if "bench get-app" not in readme or "Dogfood path" not in readme:
		errors.append("README missing install or dogfood acceptance path")
	if "/next-chapter" not in readme:
		errors.append("README should document /next-chapter SPA entry")
	if "frappe-ui" not in readme:
		errors.append("README should mention frappe-ui SPA")
	if "Chrome app" not in readme and "Install as a Chrome app" not in readme:
		errors.append("README should document Chrome PWA install")

	page_js = (APP / "next_chapter/page/next_chapter/next_chapter.js").read_text(
		encoding="utf-8"
	)
	if "/next-chapter" not in page_js or "location.replace" not in page_js:
		errors.append("Desk page should redirect to /next-chapter SPA")

	license_head = (ROOT / "LICENSE").read_text(encoding="utf-8", errors="ignore")[:80]
	if "AFFERO" not in license_head.upper() and "AGPL" not in license_head.upper():
		errors.append("LICENSE does not look like AGPL")

	if errors:
		print("SMOKE FAIL")
		for err in errors:
			print(f"  - {err}")
		return 1

	print("SMOKE OK — v16 packaging, DocTypes, SPA boot, workspace/sidebar, README")
	print("Install on a Frappe v16 bench (Python 3.14+) for end-to-end UI checks.")
	return 0


if __name__ == "__main__":
	sys.exit(main())
