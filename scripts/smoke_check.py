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
	APP / "next_chapter" / "doctype" / "implementation_story" / "implementation_story.json",
	APP / "next_chapter" / "doctype" / "implementation_chapter" / "implementation_chapter.json",
	APP / "next_chapter" / "page" / "next_chapter" / "next_chapter.json",
	APP / "next_chapter" / "page" / "next_chapter" / "next_chapter.js",
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

	for rel in (
		"next_chapter/doctype/implementation_story/implementation_story.json",
		"next_chapter/doctype/implementation_chapter/implementation_chapter.json",
		"next_chapter/page/next_chapter/next_chapter.json",
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
			# Writing-first slice: no sales/privacy fields yet
			for forbidden in ("lead", "visibility", "help_requested_on"):
				if forbidden in fields:
					errors.append(f"Story should not have deferred field yet: {forbidden}")
		if rel.endswith("implementation_chapter.json"):
			fields = {f["fieldname"] for f in data["fields"]}
			for required in ("story", "title", "sequence", "summary", "content", "writing_stage"):
				if required not in fields:
					errors.append(f"Chapter missing field: {required}")
		if rel.endswith("next_chapter.json"):
			if data.get("page_name") != "next-chapter":
				errors.append("Desk page_name must be next-chapter")

	js = (APP / "next_chapter/page/next_chapter/next_chapter.js").read_text(encoding="utf-8")
	for needle in (
		"next_chapter.api.setup.complete_setup",
		"next_chapter.api.chapter.save_chapter",
		"next_chapter.api.chapter.create_chapter",
		"New Idea",
		"Brain dump",
	):
		if needle not in js:
			errors.append(f"desk page JS missing: {needle}")

	readme = (ROOT / "README.md").read_text(encoding="utf-8")
	if "bench get-app" not in readme or "Dogfood path" not in readme:
		errors.append("README missing install or dogfood acceptance path")

	license_head = (ROOT / "LICENSE").read_text(encoding="utf-8", errors="ignore")[:80]
	if "AFFERO" not in license_head.upper() and "AGPL" not in license_head.upper():
		errors.append("LICENSE does not look like AGPL")

	if errors:
		print("SMOKE FAIL")
		for err in errors:
			print(f"  - {err}")
		return 1

	print("SMOKE OK — structure, DocTypes, desk page, README, AGPL license")
	print("Install on a bench to exercise wizard → write → autosave end-to-end.")
	return 0


if __name__ == "__main__":
	sys.exit(main())
