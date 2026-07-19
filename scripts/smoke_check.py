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
	APP / "next_chapter" / "doctype" / "implementation_story" / "implementation_story.json",
	APP / "next_chapter" / "doctype" / "implementation_chapter" / "implementation_chapter.json",
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
	if modules != "NextChapter":
		errors.append(f"modules.txt expected 'NextChapter', got {modules!r}")

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
		'app_home = "/desk/next-chapter"',
		"app_logo_url",
	):
		if needle not in hooks:
			errors.append(f"hooks.py missing v16 desktop hook: {needle}")

	for rel in (
		"next_chapter/doctype/implementation_story/implementation_story.json",
		"next_chapter/doctype/implementation_chapter/implementation_chapter.json",
		"next_chapter/page/next_chapter/next_chapter.json",
		"next_chapter/workspace/next_chapter/next_chapter.json",
		"workspace_sidebar/next_chapter.json",
	):
		data = json.loads((APP / rel).read_text(encoding="utf-8"))
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
			for required in ("story", "title", "sequence", "summary", "content", "writing_stage"):
				if required not in fields:
					errors.append(f"Chapter missing field: {required}")
			if data.get("sort_field") != "creation":
				errors.append("Chapter sort_field should be creation (Frappe v16)")
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
			if "Write" not in labels:
				errors.append("Workspace Sidebar missing Write page link")

	js = (APP / "next_chapter/page/next_chapter/next_chapter.js").read_text(encoding="utf-8")
	for needle in (
		"next_chapter.api.setup.complete_setup",
		"next_chapter.api.chapter.save_chapter",
		"next_chapter.api.chapter.create_chapter",
		"New Idea",
		"Brain dump",
		"window.next_chapter",
		'frappe.provide("next_chapter")',
	):
		if needle not in js:
			errors.append(f"desk page JS missing: {needle}")

	readme = (ROOT / "README.md").read_text(encoding="utf-8")
	if "bench get-app" not in readme or "Dogfood path" not in readme:
		errors.append("README missing install or dogfood acceptance path")
	if "/desk/next-chapter" not in readme:
		errors.append("README should document /desk/next-chapter for v16")

	license_head = (ROOT / "LICENSE").read_text(encoding="utf-8", errors="ignore")[:80]
	if "AFFERO" not in license_head.upper() and "AGPL" not in license_head.upper():
		errors.append("LICENSE does not look like AGPL")

	if errors:
		print("SMOKE FAIL")
		for err in errors:
			print(f"  - {err}")
		return 1

	print("SMOKE OK — v16 packaging, DocTypes, desk page, workspace/sidebar, README")
	print("Install on a Frappe v16 bench (Python 3.14+) for end-to-end UI checks.")
	return 0


if __name__ == "__main__":
	sys.exit(main())
