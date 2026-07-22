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
from next_chapter.api.session import apply_feedback_to_prefs, count_words
from next_chapter.next_chapter.doctype.nextchapter_settings.nextchapter_settings import (
	get_min_words_for_stage,
	get_settings_dict,
	get_wip_limit,
)
from next_chapter.next_chapter.doctype.nextchapter_user_preference.nextchapter_user_preference import (
	get_user_prefs,
)

STAGES = [
	"∞",
	"9",
	"7",
	"5",
	"3",
	"1",
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
	"auto_hidden",
	"next_write_on",
	"write_duration_mins",
	"last_session_words",
	"spawned_from",
	"modified",
]


def _serialize(doc_or_row) -> dict:
	data = {field: doc_or_row.get(field) for field in CHAPTER_FIELDS}
	data["summary"] = data.get("summary") or ""
	data["content"] = data.get("content") or ""
	data["last_session_words"] = int(data.get("last_session_words") or 0)
	data["auto_hidden"] = int(data.get("auto_hidden") or 0)
	hidden_until = data.get("hidden_until")
	snoozed = bool(hidden_until and get_datetime(hidden_until) > now_datetime())
	data["is_hidden"] = snoozed or bool(data["auto_hidden"])
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
			"writing_stage": "∞",
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
	"""Move a chapter to a new stage, enforcing WIP limits and word gates."""
	doc = frappe.get_doc("Implementation Chapter", name)
	if writing_stage not in ALLOWED_STAGES:
		frappe.throw(_("Invalid writing stage."), frappe.ValidationError)
	if writing_stage != doc.writing_stage:
		_assert_word_gate(doc, writing_stage)
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


def _assert_word_gate(doc, target_stage: str):
	settings = get_settings_dict()
	if settings.get("in_development"):
		return
	# Only gate forward moves in the funnel
	order = STAGES
	try:
		cur_i = order.index(doc.writing_stage)
		new_i = order.index(target_stage)
	except ValueError:
		return
	if new_i <= cur_i:
		return
	min_words = get_min_words_for_stage(target_stage)
	if min_words <= 0:
		return
	words = count_words(doc.content or doc.summary)
	if words < min_words:
		frappe.throw(
			_("Need at least {0} words to move to stage {1} (currently {2}).").format(
				min_words, target_stage, words
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
	doc.auto_hidden = 0
	doc.save()
	return _serialize(doc)


@frappe.whitelist()
def reconcile_visible_ideas():
	"""Whitelist wrapper so the SPA can refresh auto-hidden state after edits."""
	return reconcile_ideas_visibility()


def reconcile_ideas_visibility(story: str | None = None, user: str | None = None) -> list[dict]:
	"""Keep the top N ideas (by user sort) Active; auto-hide the rest.

	Manual snoozes (`hidden_until`) are left alone. Auto-hidden ideas can
	return when they rank inside the visible limit again (e.g. after edit).
	"""
	from next_chapter.next_chapter.doctype.implementation_story.implementation_story import (
		get_active_story_name,
	)
	from next_chapter.next_chapter.doctype.nextchapter_user_preference.nextchapter_user_preference import (
		get_user_prefs,
	)

	story_name = story or get_active_story_name()
	if not story_name:
		return []

	prefs = get_user_prefs(user)
	limit = int(prefs.get("ideas_visible_limit") or 20)
	sort = prefs.get("ideas_sort") or "modified_desc"

	rows = frappe.get_all(
		"Implementation Chapter",
		filters={"story": story_name},
		fields=CHAPTER_FIELDS,
	)
	now = now_datetime()

	def snoozed(row) -> bool:
		hu = row.get("hidden_until")
		return bool(hu and get_datetime(hu) > now)

	# Only rank ideas that are not manually snoozed
	rankable = [r for r in rows if not snoozed(r)]
	stage_rank = {s: i for i, s in enumerate(STAGES)}

	def sort_key(row):
		if sort == "title_asc":
			return ((row.get("title") or "").lower(), row.get("name"))
		if sort == "stage_asc":
			return (stage_rank.get(row.get("writing_stage"), 99), row.get("name"))
		if sort == "sequence_asc":
			return (int(row.get("sequence") or 0), row.get("name"))
		# modified_desc (default): newest edit first
		return (get_datetime(row.get("modified") or now), row.get("name"))

	reverse = sort == "modified_desc"
	rankable.sort(key=sort_key, reverse=reverse)

	visible_names = {r.name for r in rankable[:limit]}
	changed = False
	for row in rankable:
		want_auto = 0 if row.name in visible_names else 1
		cur = int(row.get("auto_hidden") or 0)
		if cur != want_auto:
			frappe.db.set_value(
				"Implementation Chapter",
				row.name,
				"auto_hidden",
				want_auto,
				update_modified=False,
			)
			row["auto_hidden"] = want_auto
			changed = True

	if changed:
		frappe.db.commit()

	return [_serialize(r) for r in rows]


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
def capture_side_idea(parent: str, text: str, name: str | None = None):
	"""Create or update an ∞-stage idea captured during a focus session."""
	if not parent:
		frappe.throw(_("Parent chapter is required."), frappe.ValidationError)

	parent_doc = frappe.get_doc("Implementation Chapter", parent)
	raw = (text or "").strip()
	if not raw:
		frappe.throw(_("Idea text is required."), frappe.ValidationError)

	title = raw.split("\n", 1)[0].strip()
	if len(title) > 80:
		title = title[:77].rstrip() + "…"
	if not title:
		title = _("Captured idea")

	settings = get_settings_dict()

	if name and frappe.db.exists("Implementation Chapter", name):
		doc = frappe.get_doc("Implementation Chapter", name)
		if doc.spawned_from and doc.spawned_from != parent:
			frappe.throw(_("This idea belongs to another chapter."), frappe.ValidationError)
		doc.title = title
		doc.summary = raw
		doc.spawned_from = parent
		doc.save()
		return _serialize(doc)

	max_seq = frappe.db.sql(
		"select max(sequence) from `tabImplementation Chapter` where story=%s",
		parent_doc.story,
	)
	sequence = int((max_seq and max_seq[0][0]) or 0) + 1

	doc = frappe.get_doc(
		{
			"doctype": "Implementation Chapter",
			"story": parent_doc.story,
			"title": title,
			"sequence": sequence,
			"writing_stage": "∞",
			"summary": raw,
			"content": "",
			"spawned_from": parent,
			"write_duration_mins": settings.get("default_session_mins") or 60,
		}
	)
	doc.insert()
	return _serialize(doc)


@frappe.whitelist()
def complete_writing_session(
	name: str,
	words_written: int | None = None,
	word_goal: int | None = None,
	content: str | None = None,
	summary: str | None = None,
	started_on: str | None = None,
	aim_choice: str | None = None,
	felt_productive: str | None = None,
	aim_adjust: str | None = None,
	distraction_level: str | None = None,
	fade_adjust: str | None = None,
	start_felt_long: str | None = None,
	next_focus_note: str | None = None,
	prior_focus_note_action: str | None = None,
	was_scheduled: int | None = None,
	schedule_slots: str | None = None,
):
	"""Persist focus-session results, Writing Session log, and optional schedules."""
	if not name:
		frappe.throw(_("Chapter name is required."), frappe.ValidationError)

	doc = frappe.get_doc("Implementation Chapter", name)
	words = max(int(words_written or 0), 0)
	goal = max(int(word_goal or 0), 0)
	doc.last_session_words = words

	if content is not None:
		plain_words = count_words(content)
		max_words = int(get_settings_dict().get("max_words") or 0)
		if max_words and plain_words > max_words and not get_settings_dict().get("in_development"):
			frappe.throw(
				_("This idea has reached the maximum of {0} words.").format(max_words),
				frappe.ValidationError,
			)
		doc.content = frappe.utils.sanitize_html(content or "")
	if summary is not None:
		doc.summary = summary

	# Optional: set next_write_on from first upcoming slot
	slots = []
	if schedule_slots:
		import json

		try:
			slots = json.loads(schedule_slots) if isinstance(schedule_slots, str) else schedule_slots
		except Exception:
			slots = []
	if slots:
		first = slots[0]
		if first:
			doc.next_write_on = get_datetime(first)

	doc.save()

	ended = now_datetime()
	started = get_datetime(started_on) if started_on else ended
	duration = max((ended - started).total_seconds() / 60.0, 0)

	session = frappe.get_doc(
		{
			"doctype": "Writing Session",
			"chapter": doc.name,
			"user": frappe.session.user,
			"started_on": started,
			"ended_on": ended,
			"duration_mins": duration,
			"words_planned": goal,
			"words_written": words,
			"aim_choice": aim_choice or "",
			"felt_productive": felt_productive or "",
			"aim_adjust": aim_adjust or "",
			"distraction_level": distraction_level or "",
			"fade_adjust": fade_adjust or "",
			"start_felt_long": start_felt_long or "",
			"next_focus_note": next_focus_note or "",
			"prior_focus_note_action": prior_focus_note_action or "",
			"was_scheduled": 1 if was_scheduled else 0,
		}
	)
	session.insert(ignore_permissions=True)

	apply_feedback_to_prefs(
		{
			"fade_adjust": fade_adjust,
			"aim_adjust": aim_adjust,
			"start_felt_long": start_felt_long,
			"next_focus_note": next_focus_note,
		}
	)

	# Additional schedule slots beyond the first: store as next_write_on only for first;
	# extras could be future work — for now we keep first on chapter.
	return {
		"chapter": _serialize(doc),
		"session": session.name,
		"words_written": words,
		"word_goal": goal,
		"prefs": get_user_prefs(),
	}


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
