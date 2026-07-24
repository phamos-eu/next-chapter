# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

from __future__ import annotations

import frappe
from frappe import _


def execute():
	"""Migrate all existing Implementation Chapters to the new 'Capture' stage.

	This migration handles the transition from the old stage system (∞, 9, 7, 5, 3, 1, Done)
	to the new 10-stage pipeline (Capture, Clarification, Incubation, Evaluation,
	Prioritization, Development, Validation, Commitment, Executing, Done).

	All existing ideas are moved to 'Capture' stage to start fresh with the new pipeline.
	"""
	from frappe.utils import get_datetime, now_datetime

	# Map old stage values to the new Capture stage
	# Old stages: ∞, 9, 7, 5, 3, 1, Done
	# Also handle any legacy stage names that might exist
	old_stages = ["\u221e", "9", "7", "5", "3", "1", "Done", "Idea", "Outline", "Draft", "Ready to write", "Writing"]

	# Update all existing Implementation Chapters to "Capture"
	count = frappe.db.sql(
		"""
		UPDATE `tabImplementation Chapter`
		SET writing_stage = 'Capture'
		WHERE writing_stage IN ({})
		""".format(", ".join([frappe.db.escape(s) for s in old_stages]))
	)

	if count and count[0] > 0:
		frappe.db.commit()
		print(f"Migrated {count[0]} existing ideas to 'Capture' stage.")
	else:
		print("No existing ideas found to migrate.")

	# Also update the default value for new chapters
	try:
		frappe.db.sql(
			"""
			ALTER TABLE `tabImplementation Chapter`
			ALTER COLUMN `writing_stage` SET DEFAULT 'Capture'
			"""
		)
		print("Updated default writing_stage to 'Capture'.")
	except Exception as e:
		print(f"Could not update default value: {e}")

	# Log the migration in a custom doc for tracking
	try:
		if not frappe.db.exists("DocType", "NextChapter Migration Log"):
			# Create a simple log entry in a custom table or just print
			pass
		
		# For now, just print summary
		print("\n=== Migration Summary ===")
		print("All existing Implementation Chapters have been migrated to 'Capture' stage.")
		print("The new 10-stage pipeline is now active:")
		print("  1. Capture")
		print("  2. Clarification")
		print("  3. Incubation")
		print("  4. Evaluation")
		print("  5. Prioritization")
		print("  6. Development")
		print("  7. Validation")
		print("  8. Commitment")
		print("  9. Executing")
		print("  10. Done")
		except Exception as e:
		print(f"Error during migration logging: {e}")
