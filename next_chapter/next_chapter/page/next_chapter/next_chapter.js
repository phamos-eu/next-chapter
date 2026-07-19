// Legacy Desk Page entry — redirect into the frappe-ui SPA.
frappe.pages["next-chapter"].on_page_load = function () {
	const params = new URLSearchParams(window.location.search);
	const chapter = params.get("chapter") || (frappe.route_options && frappe.route_options.chapter);
	let url = "/next-chapter/ideas";
	if (chapter) {
		url = `/next-chapter/ideas/${encodeURIComponent(chapter)}`;
		if (frappe.route_options) {
			delete frappe.route_options.chapter;
		}
	}
	window.location.replace(url);
};
