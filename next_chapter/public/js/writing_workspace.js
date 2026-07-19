frappe.provide("next_chapter");

next_chapter.STAGES = [
	"Idea",
	"Outline",
	"Draft",
	"Ready to write",
	"Writing",
	"Done",
];

next_chapter.STAGE_COLORS = {
	Idea: "orange",
	Outline: "blue",
	Draft: "cyan",
	"Ready to write": "purple",
	Writing: "green",
	Done: "gray",
};

next_chapter.format_datetime = function (value) {
	if (!value) return "";
	return frappe.datetime.str_to_user(value);
};

next_chapter.format_time = function (value) {
	if (!value) return "";
	return moment(frappe.datetime.str_to_obj(value)).format("HH:mm");
};

next_chapter.format_day_label = function (date_obj) {
	return moment(date_obj).format("ddd D MMM");
};

next_chapter.get_query_chapter = function () {
	try {
		const from_query = new URLSearchParams(window.location.search).get("chapter");
		if (from_query) return from_query;
	} catch (e) {
		// ignore
	}
	if (frappe.route_options && frappe.route_options.chapter) {
		const name = frappe.route_options.chapter;
		delete frappe.route_options.chapter;
		return name;
	}
	return null;
};

next_chapter.download_ics = function (name) {
	window.open(
		frappe.urllib.get_full_url(
			`/api/method/next_chapter.api.chapter.download_ics?name=${encodeURIComponent(name)}`
		),
		"_blank"
	);
};

next_chapter.hide_dialog = function (chapter, on_done) {
	const d = new frappe.ui.Dialog({
		title: __("Hide this idea"),
		fields: [
			{
				fieldtype: "HTML",
				options: `<p><strong>${frappe.utils.escape_html(
					chapter.title || ""
				)}</strong></p><p class="text-muted">${__("Show it again…")}</p>`,
			},
			{
				fieldname: "preset",
				fieldtype: "Select",
				label: __("When"),
				options: "Later today\nTomorrow\nNext week\nNext month\nCustom date",
				default: "Later today",
				reqd: 1,
			},
			{
				fieldname: "custom_until",
				fieldtype: "Datetime",
				label: __("Custom date & time"),
				depends_on: "eval:doc.preset=='Custom date'",
			},
		],
		primary_action_label: __("Hide"),
		primary_action(values) {
			const preset_map = {
				"Later today": "later_today",
				Tomorrow: "tomorrow",
				"Next week": "next_week",
				"Next month": "next_month",
				"Custom date": "custom",
			};
			const preset = preset_map[values.preset] || values.preset;
			const args = { name: chapter.name };
			if (preset === "custom") {
				if (!values.custom_until) {
					frappe.msgprint(__("Please choose a custom date and time."));
					return;
				}
				args.until = values.custom_until;
			} else {
				args.preset = preset;
			}
			frappe.call({
				method: "next_chapter.api.chapter.hide_chapter",
				args,
				callback: (r) => {
					d.hide();
					on_done && on_done(r.message);
				},
			});
		},
	});
	d.show();
};

next_chapter.session_dialog = function (chapter, on_open) {
	const when = chapter.next_write_on
		? next_chapter.format_datetime(chapter.next_write_on)
		: __("Not scheduled");
	const d = new frappe.ui.Dialog({
		title: __("Writing session"),
		fields: [
			{
				fieldtype: "HTML",
				options: `
					<p><strong>${frappe.utils.escape_html(chapter.title || "")}</strong></p>
					<p class="text-muted">${__("When")}: ${frappe.utils.escape_html(when)}</p>
					<p class="text-muted">${__("Status")}: ${frappe.utils.escape_html(
						chapter.writing_stage || ""
					)}</p>
				`,
			},
		],
		primary_action_label: __("Open chapter"),
		primary_action() {
			d.hide();
			on_open && on_open(chapter);
		},
	});
	if (chapter.next_write_on) {
		d.set_secondary_action_label(__("Add to calendar (.ics)"));
		d.set_secondary_action(() => next_chapter.download_ics(chapter.name));
	}
	d.show();
};
