# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

"""
Patch: Add status field and migrate to 10-stage pipeline

This patch adds a new 'status' field to Implementation Chapter and NextChapter Settings
to support the 10-stage pipeline while maintaining backward compatibility with the
existing 'writing_stage' field.

The migration:
1. Adds the 'status' field to Implementation Chapter DocType
2. Maps existing writing_stage values to new status values
3. Sets default status to 'Capture' for new chapters
4. Adds new WIP limit fields for the new stages
"""

from __future__ import annotations

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	"""Execute the migration to add status field and 10-stage pipeline support."""
	
	# Step 1: Add status field to Implementation Chapter via Custom Field
	# This is the Frappe-recommended way to add fields to existing DocTypes
	add_status_field_to_chapter()
	
	# Step 2: Migrate existing data from writing_stage to status
	migrate_writing_stage_to_status()
	
	# Step 3: Add new WIP limit fields to NextChapter Settings
	add_new_wip_fields_to_settings()
	
	frappe.db.commit()
	print("Migration to 10-stage pipeline completed successfully!")


def add_status_field_to_chapter():
	"""Add status field to Implementation Chapter using Custom Field."""
	from frappe import _
	
	# Check if status field already exists
	if frappe.db.has_column("Implementation Chapter", "status"):
		print("Status field already exists in Implementation Chapter")
		return
	
	# Create the status field as a custom field
	# This ensures it's added to the database without breaking existing installations
	custom_field = {
		"doctype": "Custom Field",
		"dt": "Implementation Chapter",
		"fieldname": "status",
		"label": "Status",
		"fieldtype": "Select",
		"options": "Capture\nClarification\nIncubation\nEvaluation\nPrioritization\nDevelopment\nValidation\nCommitment\nExecuting\nDone",
		"default": "Capture",
		"insert_after": "writing_stage",
		"reqd": 0,
		"in_list_view": 1,
		"in_standard_filter": 1,
	}
	
	try:
		# Use frappe.get_doc to create the custom field
		doc = frappe.get_doc(custom_field)
		doc.save(ignore_permissions=True)
		print("Added status field to Implementation Chapter via Custom Field")
		except Exception as e:
		print(f"Could not create custom field: {e}")
		# Fallback: try to add column directly
		try:
			frappe.db.sql("""
				ALTER TABLE `tabImplementation Chapter`
				ADD COLUMN `status` VARCHAR(255)
				DEFAULT 'Capture'
				AFTER `writing_stage`
			""")
			print("Added status column directly to database")
		except Exception as e2:
			print(f"Could not add status column: {e2}")


def migrate_writing_stage_to_status():
	"""Migrate existing writing_stage values to new status values."""
	from frappe.utils import get_datetime, now_datetime
	
	# Mapping from old writing_stage values to new status values
	stage_mapping = {
		"\u221e": "Capture",
		"9": "Clarification",
		"7": "Incubation",
		"5": "Evaluation",
		"3": "Prioritization",
		"1": "Development",
		"Done": "Done",
	}
	
	# Also handle any legacy stage names that might exist
	legacy_mapping = {
		"Idea": "Capture",
		"Outline": "Capture",
		"Draft": "Capture",
		"Ready to write": "Capture",
		"Writing": "Development",
	}
	
	all_mapping = {**stage_mapping, **legacy_mapping}
	
	# Update all existing chapters that don't have a status yet
	chapters = frappe.db.sql(
		"SELECT name, writing_stage FROM `tabImplementation Chapter` WHERE status IS NULL OR status = ''",
		as_dict=True
	)
	
	if chapters:
		print(f"Migrating {len(chapters)} chapters to new status field...")
		for chapter in chapters:
			old_stage = chapter.get("writing_stage") or ""
			new_status = all_mapping.get(old_stage, "Capture")
			
			frappe.db.sql(
				"UPDATE `tabImplementation Chapter` SET status = %s WHERE name = %s",
				(new_status, chapter["name"])
			)
		print(f"  Migrated {len(chapters)} chapters")
	else:
		print("No chapters need migration")


def add_new_wip_fields_to_settings():
	"""Add new WIP limit fields for the 10-stage pipeline."""
	
	# Check if new fields already exist
	settings = frappe.get_single("NextChapter Settings") if frappe.db.exists("NextChapter Settings", "NextChapter Settings") else None
	
	if not settings:
		print("NextChapter Settings not found, skipping WIP field addition")
		return
	
	# List of new fields to add with their defaults
	new_fields = [
		("clarification_limit", 9, "Clarification Limit"),
		("incubation_limit", 7, "Incubation Limit"),
		("evaluation_limit", 5, "Evaluation Limit"),
		("prioritization_limit", 3, "Prioritization Limit"),
		("development_limit", 3, "Development Limit"),
		("validation_limit", 1, "Validation Limit"),
		("commitment_limit", 1, "Commitment Limit"),
		("executing_limit", 0, "Executing Limit"),
		("min_words_clarification", 50, "Min Words for Clarification"),
		("min_words_incubation", 120, "Min Words for Incubation"),
		("min_words_evaluation", 250, "Min Words for Evaluation"),
		("min_words_prioritization", 400, "Min Words for Prioritization"),
		("min_words_development", 600, "Min Words for Development"),
		("min_words_validation", 800, "Min Words for Validation"),
		("min_words_commitment", 1000, "Min Words for Commitment"),
		("min_words_executing", 1200, "Min Words for Executing"),
	]
	
	updated = False
	for fieldname, default_value, label in new_fields:
		if not settings.meta.has_field(fieldname):
			# Field doesn't exist in DocType, need to add via custom field
			try:
				custom_field = frappe.get_doc({
					"doctype": "Custom Field",
					"dt": "NextChapter Settings",
					"fieldname": fieldname,
					"label": label,
					"fieldtype": "Int",
					"default": default_value,
					"non_negative": 1,
				})
				custom_field.save(ignore_permissions=True)
				print(f"Added custom field: {fieldname}")
				updated = True
			except Exception as e:
			print(f"Could not add field {fieldname}: {e}")
		else:
			# Field exists in DocType but might not have a value
			if settings.get(fieldname) is None:
				settings.set(fieldname, default_value)
				updated = True
				print(f"Set default value for {fieldname}: {default_value}")
	
	if updated:
		settings.save(ignore_permissions=True)
		print("Updated NextChapter Settings with new WIP fields")
