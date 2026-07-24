frappe.provide("next_chapter");

next_chapter.STAGES = [
	"Capture",
	"Clarification",
	"Incubation",
	"Evaluation",
	"Prioritization",
	"Development",
	"Validation",
	"Commitment",
	"Executing",
	"Done",
];

next_chapter.STAGE_COLORS = {
	"Capture": "gray",
	"Clarification": "blue",
	"Incubation": "cyan",
	"Evaluation": "orange",
	"Prioritization": "purple",
	"Development": "indigo",
	"Validation": "pink",
	"Commitment": "rose",
	"Executing": "teal",
	"Done": "green",
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
