# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

"""
Patch v0.1.0: Migrate to 10-stage pipeline

This patch performs the data migration for the 10-stage pipeline feature.
It should be executed AFTER deploying the app changes.

Changes made by this patch:
1. Populates the new 'status' field based on existing 'writing_stage' values
2. Sets default values for new WIP limit fields in NextChapter Settings
"""

from __future__ import annotations

import frappe


# Mapping from old writing_stage values to new status values
STAGE_MAPPING = {
	"\u221e": "Capture",
	"9": "Clarification",
	"7": "Incubation",
	"5": "Evaluation",
	"3": "Prioritization",
	"1": "Development",
	"Done": "Done",
	# Legacy values that might exist
	"Idea": "Capture",
	"Outline": "Capture",
	"Draft": "Capture",
	"Ready to write": "Capture",
	"Writing": "Development",
}

# Default values for new WIP limit fields
NEW_WIP_DEFAULTS = {
	"clarification_limit": 9,
	"incubation_limit": 7,
	"evaluation_limit": 5,
	"prioritization_limit": 3,
	"development_limit": 3,
	"validation_limit": 1,
	"commitment_limit": 1,
	"executing_limit": 0,
}

# Default values for new word gate fields
NEW_WORD_GATE_DEFAULTS = {
	"min_words_clarification": 50,
	"min_words_incubation": 120,
	"min_words_evaluation": 250,
	"min_words_prioritization": 400,
	"min_words_development": 600,
	"min_words_validation": 800,
	"min_words_commitment": 1000,
	"min_words_executing": 1200,
}


def execute():
	"""Execute the migration to 10-stage pipeline."""
	
	# Step 1: Migrate Implementation Chapter records
	migrate_chapters()
	
	# Step 2: Update NextChapter Settings with defaults
	update_settings()
	
	frappe.db.commit()
	print("Migration to 10-stage pipeline (v0.1.0) completed successfully!")


def migrate_chapters():
	"""Populate status field from writing_stage for all chapters."""
	
	# Check if status column exists
	if not frappe.db.has_column("Implementation Chapter", "status"):
		print("Status column does not exist yet. DocType update may still be processing.")
		print("Please run: bench update --pull")
		return
	
	# Get all chapters that need migration
	chapters = frappe.db.sql(
		"SELECT name, writing_stage, status FROM `tabImplementation Chapter` "
		"WHERE status IS NULL OR status = ''",
		as_dict=True
	)
	
	if not chapters:
		print("No chapters need migration")
		return
	
	print(f"Migrating {len(chapters)} chapters to new status field...")
	
	for chapter in chapters:
		old_stage = chapter.get("writing_stage") or ""
		new_status = STAGE_MAPPING.get(old_stage, "Capture")
		
		frappe.db.sql(
			"UPDATE `tabImplementation Chapter` SET status = %s WHERE name = %s",
			(new_status, chapter["name"])
		)
	
	print(f"Migrated {len(chapters)} chapters")


def update_settings():
	"""Update NextChapter Settings with default values for new fields."""
	
	if not frappe.db.exists("NextChapter Settings", "NextChapter Settings"):
		print("NextChapter Settings not found, skipping")
		return
	
	settings = frappe.get_single("NextChapter Settings")
	updated = False
	
	# Set defaults for new WIP limit fields
	for fieldname, default_value in NEW_WIP_DEFAULTS.items():
		if settings.get(fieldname) is None:
			settings.set(fieldname, default_value)
			updated = True
			print(f"Set {fieldname} = {default_value}")
	
	# Set defaults for new word gate fields
	for fieldname, default_value in NEW_WORD_GATE_DEFAULTS.items():
		if settings.get(fieldname) is None:
			settings.set(fieldname, default_value)
			updated = True
			print(f"Set {fieldname} = {default_value}")
	
	if updated:
		settings.save(ignore_permissions=True)
		print("Updated NextChapter Settings with new field defaults")
	else:
		print("NextChapter Settings already has all required defaults")
