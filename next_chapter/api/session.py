# Copyright (c) 2026, phamos.eu and contributors
# For license information, please see license.txt

from __future__ import annotations

import re
from collections import defaultdict
from datetime import timedelta

import frappe
from frappe import _
from frappe.utils import get_datetime, now_datetime

from next_chapter.next_chapter.doctype.nextchapter_user_preference.nextchapter_user_preference import (
	get_user_prefs,
	save_user_prefs,
)


SESSION_FIELDS = [
	"name",
	"chapter",
	"user",
	"started_on",
	"ended_on",
	"duration_mins",
	"words_planned",
	"words_written",
	"aim_choice",
	"felt_productive",
	"aim_adjust",
	"distraction_level",
	"fade_adjust",
	"start_felt_long",
	"next_focus_note",
	"prior_focus_note_action",
	"was_scheduled",
	"creation",
]


def count_words(text: str | None) -> int:
	plain = re.sub(r"<[^>]+>", " ", text or "")
	plain = re.sub(r"\s+", " ", plain).strip()
	if not plain:
		return 0
	return len(plain.split(" "))


def _serialize_session(row) -> dict:
	return {f: row.get(f) for f in SESSION_FIELDS}


@frappe.whitelist()
def list_sessions(chapter: str):
	if not chapter:
		frappe.throw(_("Chapter is required."), frappe.ValidationError)
	rows = frappe.get_all(
		"Writing Session",
		filters={"chapter": chapter},
		fields=SESSION_FIELDS,
		order_by="ended_on desc, creation desc",
		limit_page_length=200,
	)
	return [_serialize_session(r) for r in rows]


@frappe.whitelist()
def chapter_stats(chapter: str):
	"""Aggregate 12 overview stats for an idea."""
	sessions = list_sessions(chapter)
	total_sessions = len(sessions)
	total_words = sum(int(s.get("words_written") or 0) for s in sessions)
	total_mins = sum(float(s.get("duration_mins") or 0) for s in sessions)

	# weekly buckets
	by_week = defaultdict(int)
	for s in sessions:
		ended = s.get("ended_on") or s.get("started_on") or s.get("creation")
		if not ended:
			continue
		dt = get_datetime(ended)
		# ISO week key
		key = f"{dt.isocalendar()[0]}-W{dt.isocalendar()[1]:02d}"
		by_week[key] += 1
	week_counts = list(by_week.values()) or [0]

	planned_pairs = [
		(int(s.get("words_planned") or 0), int(s.get("words_written") or 0))
		for s in sessions[:5]
		if int(s.get("words_planned") or 0) or int(s.get("words_written") or 0)
	]
	scheduled = [s for s in sessions if s.get("was_scheduled")]
	started_scheduled = len(scheduled)
	# approximate: was_scheduled means they had a schedule when completing
	focus_actions = [s.get("prior_focus_note_action") for s in sessions if s.get("prior_focus_note_action")]
	kept = sum(1 for a in focus_actions if a in ("kept", "edited"))
	aim_mix = {"more": 0, "similar": 0, "less": 0}
	for s in sessions:
		a = s.get("aim_choice")
		if a in aim_mix:
			aim_mix[a] += 1

	avg_sessions_week = round(sum(week_counts) / max(len(week_counts), 1), 2)
	avg_len = round(total_mins / total_sessions, 1) if total_sessions else 0
	longest = max((float(s.get("duration_mins") or 0) for s in sessions), default=0)
	words_trend = [int(s.get("words_written") or 0) for s in reversed(sessions[-12:])]

	return {
		"consistency": {
			"total_sessions": total_sessions,
			"avg_sessions_per_week": avg_sessions_week,
			"best_week": max(week_counts),
			"quietest_week": min(week_counts),
		},
		"output": {
			"total_words": total_words,
			"planned_vs_actual": planned_pairs,
			"words_trend": words_trend,
		},
		"time": {
			"total_focus_mins": round(total_mins, 1),
			"avg_session_mins": avg_len,
			"longest_session_mins": round(longest, 1),
		},
		"planning": {
			"scheduled_sessions": started_scheduled,
			"focus_note_keep_rate": round(kept / len(focus_actions), 2) if focus_actions else None,
			"aim_mix": aim_mix,
		},
	}


@frappe.whitelist()
def get_prefs():
	return get_user_prefs()


@frappe.whitelist()
def save_prefs(**kwargs):
	allowed = {
		"page_pile",
		"edit_idle_secs",
		"fade_idle_secs",
		"fade_drag",
		"breath_count",
		"aim_bias",
		"last_next_focus_note",
	}
	updates = {k: kwargs[k] for k in allowed if k in kwargs}
	return save_user_prefs(updates)


def apply_feedback_to_prefs(feedback: dict):
	"""Nudge user prefs from Complete wizard choices."""
	prefs = get_user_prefs()
	updates = {}
	from next_chapter.next_chapter.doctype.nextchapter_settings.nextchapter_settings import (
		get_settings_dict,
	)

	settings = get_settings_dict()
	base_idle = prefs.get("fade_idle_secs") or settings.get("fade_idle_secs") or 3
	base_drag = prefs.get("fade_drag")
	if base_drag is None:
		base_drag = settings.get("fade_drag") or 0.25
	base_breaths = prefs.get("breath_count") or settings.get("breath_count") or 3

	fade_adjust = feedback.get("fade_adjust")
	if fade_adjust == "increase":
		updates["fade_idle_secs"] = int(base_idle) + 1
		updates["fade_drag"] = min(1.0, float(base_drag) + 0.05)
	elif fade_adjust == "decrease":
		updates["fade_idle_secs"] = max(1, int(base_idle) - 1)
		updates["fade_drag"] = max(0.0, float(base_drag) - 0.05)

	aim_adjust = feedback.get("aim_adjust")
	if aim_adjust in ("increase", "keep", "decrease"):
		updates["aim_bias"] = aim_adjust

	if feedback.get("next_focus_note") is not None:
		updates["last_next_focus_note"] = feedback.get("next_focus_note") or ""

	# optional breath tweak via start_felt_long
	if feedback.get("start_felt_long") == "yes":
		updates["breath_count"] = max(1, int(base_breaths) - 1)
	elif feedback.get("start_felt_long") == "no":
		updates["breath_count"] = int(base_breaths)

	if updates:
		save_user_prefs(updates)
