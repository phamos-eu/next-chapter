# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

from __future__ import annotations

from datetime import datetime, timedelta

import frappe
from frappe import _
from frappe.utils import (
	add_days,
	add_months,
	get_datetime,
	get_url,
	now_datetime,
)

from next_chapter.next_chapter.doctype.implementation_story.implementation_story import (
	get_active_story_name,
)
from next_chapter.next_chapter.doctype.nextchapter_settings.nextchapter_settings import (
	get_settings_dict,
	get_wip_limit,
)

STAGES = [
	"Idea",
	"Outline",
	"Draft",
	"Ready to write",
	"Writing",
	"Done",
]
ALLOWED_STAGES = set(STAGES)

CHAPTER_FIELDS = [
	"name",
	"title",
	"sequence",
	"writing_stage",
	"summary",
	"content",
	"hidden_until",
	"next_write_on",
	"write_duration_mins",
	"modified",
]


def _serialize(doc_or_row) -> dict:
	data = {field: doc_or_row.get(field) for field in CHAPTER_FIELDS}
	data["summary"] = data.get("summary") or ""
	data["content"] = data.get("content") or ""
	hidden_until = data.get("hidden_until")
	if hidden_until:
		data["is_hidden"] = get_datetime(hidden_until) > now_datetime()
	else:
		data["is_hidden"] = False
	return data


def _chapter_url(name: str) -> str:
	return get_url(f"/next-chapter/ideas/{name}")


@frappe.whitelist()
def create_chapter(title: str | None = None, story: str | None = None):
	"""Add a new Idea chapter to the active (or given) story."""
	story_name = story or get_active_story_name()
	if not story_name:
		frappe.throw(_("No active Implementation Story. Complete setup first."), frappe.ValidationError)

	title = (title or "").strip() or _("New idea")
	settings = get_settings_dict()

	max_seq = frappe.db.sql(
		"select max(sequence) from `tabImplementation Chapter` where story=%s",
		story_name,
	)
	sequence = int((max_seq and max_seq[0][0]) or 0) + 1

	doc = frappe.get_doc(
		{
			"doctype": "Implementation Chapter",
			"story": story_name,
			"title": title,
			"sequence": sequence,
			"writing_stage": "Idea",
			"summary": "",
			"content": "",
			"write_duration_mins": settings.get("default_session_mins") or 60,
		}
	)
	doc.insert()
	return _serialize(doc)


@frappe.whitelist()
def save_chapter(
	name: str,
	title: str | None = None,
	summary: str | None = None,
	content: str | None = None,
	writing_stage: str | None = None,
	next_write_on: str | None = None,
	write_duration_mins: int | None = None,
	update_next_write_on: int | None = None,
):
	"""Autosave chapter writing fields from the desk page."""
	if not name:
		frappe.throw(_("Chapter name is required."), frappe.ValidationError)

	doc = frappe.get_doc("Implementation Chapter", name)

	if title is not None:
		title = title.strip()
		if not title:
			frappe.throw(_("Title cannot be empty."), frappe.ValidationError)
		doc.title = title

	if summary is not None:
		doc.summary = summary

	if content is not None:
		doc.content = frappe.utils.sanitize_html(content or "")

	if writing_stage is not None and writing_stage != doc.writing_stage:
		_assert_stage_allowed(writing_stage, exclude_name=doc.name)
		doc.writing_stage = writing_stage

	if update_next_write_on:
		doc.next_write_on = get_datetime(next_write_on) if next_write_on else None

	if write_duration_mins is not None:
		doc.write_duration_mins = int(write_duration_mins) or None

	doc.save()
	return _serialize(doc)


@frappe.whitelist()
def set_stage(name: str, writing_stage: str):
	"""Move a chapter to a new stage, enforcing WIP limits."""
	doc = frappe.get_doc("Implementation Chapter", name)
	if writing_stage not in ALLOWED_STAGES:
		frappe.throw(_("Invalid writing stage."), frappe.ValidationError)
	if writing_stage != doc.writing_stage:
		_assert_stage_allowed(writing_stage, exclude_name=doc.name)
		doc.writing_stage = writing_stage
		doc.save()
	return _serialize(doc)


def _assert_stage_allowed(stage: str, exclude_name: str | None = None):
	limit = get_wip_limit(stage)
	if limit is None:
		return

	filters = {"writing_stage": stage}
	if exclude_name:
		filters["name"] = ["!=", exclude_name]

	count = frappe.db.count("Implementation Chapter", filters)
	if count >= limit:
		frappe.throw(
			_("The {0} column is full ({1}/{1}). Finish or move something else first.").format(
				stage, limit
			),
			frappe.ValidationError,
		)


@frappe.whitelist()
def hide_chapter(name: str, until: str | None = None, preset: str | None = None):
	"""Snooze a chapter until a datetime (or named preset)."""
	doc = frappe.get_doc("Implementation Chapter", name)
	doc.hidden_until = _resolve_hide_until(until=until, preset=preset)
	doc.save()
	return _serialize(doc)


@frappe.whitelist()
def unhide_chapter(name: str):
	doc = frappe.get_doc("Implementation Chapter", name)
	doc.hidden_until = None
	doc.save()
	return _serialize(doc)


def _resolve_hide_until(until: str | None = None, preset: str | None = None):
	now = now_datetime()
	if preset == "later_today":
		later = now.replace(hour=18, minute=0, second=0, microsecond=0)
		if later <= now:
			later = now + timedelta(hours=2)
		return later
	if preset == "tomorrow":
		return add_days(now, 1).replace(hour=9, minute=0, second=0, microsecond=0)
	if preset == "next_week":
		return add_days(now, 7).replace(hour=9, minute=0, second=0, microsecond=0)
	if preset == "next_month":
		return add_months(now, 1).replace(hour=9, minute=0, second=0, microsecond=0)
	if until:
		return get_datetime(until)
	frappe.throw(_("Please choose when to show this idea again."), frappe.ValidationError)


@frappe.whitelist()
def set_writing_session(name: str, next_write_on: str, write_duration_mins: int | None = None):
	"""Schedule the next writing session for a chapter."""
	doc = frappe.get_doc("Implementation Chapter", name)
	if not next_write_on:
		frappe.throw(_("Please choose a date and time."), frappe.ValidationError)
	doc.next_write_on = get_datetime(next_write_on)
	if write_duration_mins is not None:
		doc.write_duration_mins = int(write_duration_mins)
	elif not doc.write_duration_mins:
		doc.write_duration_mins = get_settings_dict().get("default_session_mins") or 60
	doc.save()
	return _serialize(doc)


@frappe.whitelist()
def clear_writing_session(name: str):
	doc = frappe.get_doc("Implementation Chapter", name)
	doc.next_write_on = None
	doc.save()
	return _serialize(doc)


@frappe.whitelist()
def download_ics(name: str):
	"""Download an .ics calendar file for the chapter's next writing session."""
	doc = frappe.get_doc("Implementation Chapter", name)
	if not doc.next_write_on:
		frappe.throw(_("Set a writing time before downloading a calendar file."), frappe.ValidationError)

	settings = get_settings_dict()
	duration = int(doc.write_duration_mins or settings.get("default_session_mins") or 60)
	reminder = int(settings.get("reminder_mins") or 15)
	start = get_datetime(doc.next_write_on)
	end = start + timedelta(minutes=duration)
	url = _chapter_url(doc.name)
	description = (doc.summary or "").strip() or _("Writing session for {0}").format(doc.title)
	description = f"{description}\\n\\n{url}"

	uid = f"{doc.name}-{start.strftime('%Y%m%dT%H%M%S')}@nextchapter"
	ics = _build_ics(
		uid=uid,
		summary=doc.title,
		description=description,
		url=url,
		start=start,
		end=end,
		reminder_mins=reminder,
	)

	safe_title = "".join(c if c.isalnum() or c in "-_ " else "_" for c in doc.title).strip() or "session"
	frappe.local.response.filename = f"{safe_title}.ics"
	frappe.local.response.filecontent = ics
	frappe.local.response.type = "download"


def _build_ics(
	uid: str,
	summary: str,
	description: str,
	url: str,
	start: datetime,
	end: datetime,
	reminder_mins: int,
) -> str:
	def fmt(dt: datetime) -> str:
		return dt.strftime("%Y%m%dT%H%M%S")

	now = now_datetime()
	summary_esc = _ics_escape(summary)
	desc_esc = _ics_escape(description)
	url_esc = _ics_escape(url)

	lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//NextChapter//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		f"UID:{uid}",
		f"DTSTAMP:{fmt(now)}",
		f"DTSTART:{fmt(start)}",
		f"DTEND:{fmt(end)}",
		f"SUMMARY:{summary_esc}",
		f"DESCRIPTION:{desc_esc}",
		f"URL:{url_esc}",
		"BEGIN:VALARM",
		"ACTION:DISPLAY",
		f"DESCRIPTION:{summary_esc}",
		f"TRIGGER:-PT{max(reminder_mins, 0)}M",
		"END:VALARM",
		"END:VEVENT",
		"END:VCALENDAR",
		"",
	]
	return "\r\n".join(lines)


def _ics_escape(value: str) -> str:
	return (
		(value or "")
		.replace("\\", "\\\\")
		.replace(";", "\\;")
		.replace(",", "\\,")
		.replace("\n", "\\n")
		.replace("\r", "")
	)
