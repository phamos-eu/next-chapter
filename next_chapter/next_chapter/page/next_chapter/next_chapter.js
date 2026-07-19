// Frappe v16 loads Page JS as an IIFE — keep app state on window via frappe.provide.
frappe.provide("next_chapter");
const next_chapter = window.next_chapter;

frappe.pages["next-chapter"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("NextChapter"),
		single_column: true,
	});

	$(page.body).html('<div class="next-chapter-app" id="next-chapter-root"></div>');

	const start = () => new next_chapter.WritingApp(page);
	frappe.require(
		["/assets/next_chapter/js/pwa.js", "/assets/next_chapter/js/writing_workspace.js"],
		() => {
			if (typeof next_chapter.setup_pwa === "function") {
				next_chapter.setup_pwa();
			}
			start();
		}
	);
};

next_chapter.WritingApp = class WritingApp {
	constructor(page) {
		this.page = page;
		this.$root = $("#next-chapter-root");
		this.content_control = null;
		this.session_control = null;
		this.state = {
			loading: true,
			needs_setup: false,
			view: "write",
			schedule_tab: "ten",
			list_mode: "active",
			search: "",
			stage_filter: "All",
			story: null,
			chapters: [],
			stages: next_chapter.STAGES.slice(),
			settings: {},
			wip_limits: {},
			active: null,
			active_tab: "brain-dump",
			wizard_step: 0,
			wizard: this.empty_wizard(),
			save_state: "",
			error: "",
			installable: !!(next_chapter.can_install_pwa && next_chapter.can_install_pwa()),
		};
		this._save_timer = null;
		$(document).on("next_chapter_pwa_installable.next_chapter", () => {
			this.state.installable = true;
			this.refresh_install_ui();
		});
		$(document).on("next_chapter_pwa_installed.next_chapter", () => {
			this.state.installable = false;
			this.refresh_install_ui();
		});
		this.bootstrap();
	}

	empty_wizard() {
		return {
			company_name: "",
			company_purpose: "",
			employees_now: "",
			employees_1y: "",
			employees_3y: "",
			employees_7y: "",
			company_stage: "",
			erp_motivation: "",
			priority_1: "",
			priority_2: "",
			priority_3: "",
		};
	}

	bootstrap() {
		this.render_loading();
		frappe.call({
			method: "next_chapter.api.setup.get_bootstrap",
			callback: (r) => {
				const data = r.message || {};
				this.state.loading = false;
				this.state.needs_setup = !!data.needs_setup;
				this.state.story = data.story;
				this.state.chapters = data.chapters || [];
				this.state.stages = data.stages || next_chapter.STAGES.slice();
				this.state.settings = data.settings || {};
				this.state.wip_limits = data.wip_limits || {};
				const deep = next_chapter.get_query_chapter();
				if (deep && this.state.chapters.find((c) => c.name === deep)) {
					this.state.active = deep;
				} else if (this.state.chapters.length) {
					this.state.active = this.state.chapters[0].name;
				}
				this.render();
			},
			error: () => {
				this.state.loading = false;
				this.state.error = __("Could not load NextChapter.");
				this.render();
			},
		});
	}

	render_loading() {
		this.destroy_controls();
		this.$root.html(`<div class="nc-centered text-muted">${__("Loading…")}</div>`);
	}

	render() {
		if (this.state.loading) {
			this.render_loading();
			return;
		}
		if (this.state.needs_setup) {
			this.render_wizard();
			return;
		}
		this.render_shell();
	}

	/* ---------- Wizard ---------- */

	render_wizard() {
		this.destroy_controls();
		const step = this.state.wizard_step;
		const w = this.state.wizard;
		const steps = [
			{
				title: __("What is your company called?"),
				help: __("We'll use this as the name of your implementation story."),
				body: this.field_html("company_name", __("Company name"), "text", w.company_name, __(
					"e.g. Acme GmbH"
				)),
			},
			{
				title: __("What does the company do?"),
				help: __("A short purpose statement is enough."),
				body: this.field_html(
					"company_purpose",
					__("Purpose"),
					"textarea",
					w.company_purpose,
					__("Why does the company exist?")
				),
			},
			{
				title: __("How many people — now and ahead?"),
				help: __("Rough numbers are fine."),
				body: `<div class="nc-employee-grid">
					${this.field_html("employees_now", __("Today"), "number", w.employees_now)}
					${this.field_html("employees_1y", __("In 1 year"), "number", w.employees_1y)}
					${this.field_html("employees_3y", __("In 3 years"), "number", w.employees_3y)}
					${this.field_html("employees_7y", __("In 7 years"), "number", w.employees_7y)}
				</div>`,
			},
			{
				title: __("Where is the company today?"),
				help: __("A few sentences about the current stage."),
				body: this.field_html(
					"company_stage",
					__("Current stage"),
					"textarea",
					w.company_stage,
					__("e.g. growing fast…")
				),
			},
			{
				title: __("Why change systems?"),
				help: __("What is pushing you toward a new ERP?"),
				body: this.field_html(
					"erp_motivation",
					__("Motivation"),
					"textarea",
					w.erp_motivation,
					__("What should get better?")
				),
			},
			{
				title: __("What would you like to tackle first?"),
				help: __("Name up to three starting ideas. You can add more later."),
				body: `<div class="nc-priority-list">
					${this.field_html("priority_1", __("First idea"), "text", w.priority_1, __("e.g. Ticketing"))}
					${this.field_html("priority_2", __("Second idea"), "text", w.priority_2, __("Optional"))}
					${this.field_html("priority_3", __("Third idea"), "text", w.priority_3, __("Optional"))}
				</div>`,
			},
		];
		const current = steps[step];
		const is_last = step === steps.length - 1;
		this.$root.html(`
			<div class="nc-wizard frappe-card">
				<div class="nc-wizard-head">
					<div class="nc-wizard-kicker">${__("Get started")}</div>
					<h2 class="nc-wizard-title">${current.title}</h2>
					<p class="text-muted nc-wizard-help">${current.help}</p>
					<div class="nc-wizard-progress text-muted">${__("Step {0} of {1}", [
						step + 1,
						steps.length,
					])}</div>
				</div>
				<div class="nc-wizard-body">${current.body}</div>
				${
					this.state.error
						? `<div class="alert alert-danger">${frappe.utils.escape_html(this.state.error)}</div>`
						: ""
				}
				<div class="nc-wizard-actions">
					${
						step > 0
							? `<button type="button" class="btn btn-default" data-action="wizard-back">${__(
									"Back"
							  )}</button>`
							: `<span></span>`
					}
					<button type="button" class="btn btn-primary" data-action="wizard-next">
						${is_last ? __("Start writing") : __("Continue")}
					</button>
				</div>
			</div>
		`);
		this.bind_wizard();
	}

	field_html(name, label, type, value, placeholder) {
		const safe_val = frappe.utils.escape_html(value || "");
		const ph = placeholder ? ` placeholder="${frappe.utils.escape_html(placeholder)}"` : "";
		if (type === "textarea") {
			return `<div class="frappe-control"><div class="form-group">
				<label class="control-label" for="nc-${name}">${label}</label>
				<textarea class="form-control" id="nc-${name}" data-field="${name}" rows="4"${ph}>${safe_val}</textarea>
			</div></div>`;
		}
		return `<div class="frappe-control"><div class="form-group">
			<label class="control-label" for="nc-${name}">${label}</label>
			<input class="form-control" id="nc-${name}" data-field="${name}" type="${type}" value="${safe_val}"${ph} />
		</div></div>`;
	}

	bind_wizard() {
		this.$root.find("[data-field]").on("input change", (e) => {
			this.state.wizard[$(e.currentTarget).data("field")] = $(e.currentTarget).val();
		});
		this.$root.find('[data-action="wizard-back"]').on("click", () => {
			this.capture_wizard_fields();
			this.state.wizard_step = Math.max(0, this.state.wizard_step - 1);
			this.state.error = "";
			this.render_wizard();
		});
		this.$root.find('[data-action="wizard-next"]').on("click", () => {
			this.capture_wizard_fields();
			if (!this.validate_wizard_step()) {
				this.render_wizard();
				return;
			}
			if (this.state.wizard_step < 5) {
				this.state.wizard_step += 1;
				this.state.error = "";
				this.render_wizard();
				return;
			}
			this.submit_wizard();
		});
	}

	capture_wizard_fields() {
		this.$root.find("[data-field]").each((_, el) => {
			this.state.wizard[$(el).data("field")] = $(el).val();
		});
	}

	validate_wizard_step() {
		const w = this.state.wizard;
		this.state.error = "";
		if (this.state.wizard_step === 0 && !(w.company_name || "").trim()) {
			this.state.error = __("Please enter a company name.");
			return false;
		}
		if (this.state.wizard_step === 5) {
			const titles = [w.priority_1, w.priority_2, w.priority_3].filter((t) => (t || "").trim());
			if (!titles.length) {
				this.state.error = __("Add at least one idea to begin.");
				return false;
			}
		}
		return true;
	}

	submit_wizard() {
		const w = this.state.wizard;
		this.$root.find('[data-action="wizard-next"]').prop("disabled", true).text(__("Creating…"));
		frappe.call({
			method: "next_chapter.api.setup.complete_setup",
			args: {
				company_name: w.company_name,
				company_purpose: w.company_purpose,
				employees_now: w.employees_now || null,
				employees_1y: w.employees_1y || null,
				employees_3y: w.employees_3y || null,
				employees_7y: w.employees_7y || null,
				company_stage: w.company_stage,
				erp_motivation: w.erp_motivation,
				priority_1: w.priority_1,
				priority_2: w.priority_2,
				priority_3: w.priority_3,
			},
			callback: (r) => {
				const data = r.message || {};
				this.state.needs_setup = false;
				this.state.story = data.story;
				this.state.chapters = data.chapters || [];
				this.state.stages = data.stages || this.state.stages;
				this.state.settings = data.settings || {};
				this.state.wip_limits = data.wip_limits || {};
				this.state.active = this.state.chapters[0] ? this.state.chapters[0].name : null;
				this.state.view = "write";
				this.render();
			},
			error: (err) => {
				this.state.error =
					(err && err.message) || __("Could not create your story. Please try again.");
				this.render_wizard();
			},
		});
	}

	/* ---------- Shell + view switcher ---------- */

	render_shell() {
		this.destroy_controls();
		this.$root.html(`
			<div class="nc-app-frame">
				<div class="nc-view-switcher btn-group" role="group">
					${["write", "board", "schedule"]
						.map(
							(v) => `<button type="button" class="btn btn-default btn-sm ${
								this.state.view === v ? "btn-primary-light active" : ""
							}" data-view="${v}">${this.view_label(v)}</button>`
						)
						.join("")}
				</div>
				<div class="nc-view-body" data-role="view-body"></div>
			</div>
		`);
		this.$root.find("[data-view]").on("click", (e) => {
			const view = $(e.currentTarget).data("view");
			if (view === this.state.view) return;
			this.flush_save(() => {
				this.state.view = view;
				this.render_shell();
			});
		});
		const $body = this.$root.find('[data-role="view-body"]');
		if (this.state.view === "board") {
			this.render_board($body);
		} else if (this.state.view === "schedule") {
			this.render_schedule($body);
		} else {
			this.render_write($body);
		}
	}

	view_label(view) {
		return { write: __("Write"), board: __("Board"), schedule: __("Schedule") }[view] || view;
	}

	/* ---------- Write view ---------- */

	render_write($body) {
		const company = (this.state.story && this.state.story.company_name) || "";
		const active = this.get_active();
		$body.html(`
			<div class="nc-shell">
				<aside class="nc-left">
					<div class="nc-pane-header">
						<div class="nc-pane-title">${__("Ideas")}</div>
						<div class="nc-pane-subtitle text-muted">${frappe.utils.escape_html(company)}</div>
					</div>
					<div class="nc-left-tools">
						<input type="search" class="form-control input-sm" data-role="search"
							placeholder="${__("Search ideas…")}" value="${frappe.utils.escape_html(this.state.search)}" />
						<div class="nc-list-mode btn-group btn-group-sm">
							<button type="button" class="btn btn-default ${
								this.state.list_mode === "active" ? "active" : ""
							}" data-list-mode="active">${__("Active")}</button>
							<button type="button" class="btn btn-default ${
								this.state.list_mode === "hidden" ? "active" : ""
							}" data-list-mode="hidden">${__("Hidden")}</button>
						</div>
						<div class="nc-stage-pills">${this.stage_pills_html()}</div>
					</div>
					<div class="nc-list">${this.filtered_list_html()}</div>
					<div class="nc-pane-footer">
						<button type="button" class="btn btn-primary btn-sm btn-block" data-action="new-idea">
							${__("Add Idea")}
						</button>
					</div>
				</aside>
				<section class="nc-center">
					${active ? this.center_html(active) : this.empty_center_html()}
				</section>
				<aside class="nc-right">
					${active ? this.right_html(active) : this.empty_right_html()}
				</aside>
			</div>
		`);
		if (active) {
			this.mount_content_editor(active);
			this.mount_session_control(active);
		}
		this.bind_write();
		this.bind_install_buttons();
	}

	stage_pills_html() {
		const pills = ["All"].concat(this.state.stages);
		return pills
			.map((stage) => {
				const active = this.state.stage_filter === stage ? " active" : "";
				return `<button type="button" class="nc-pill${active}" data-stage-filter="${frappe.utils.escape_html(
					stage
				)}">${__(stage)}</button>`;
			})
			.join("");
	}

	filtered_chapters() {
		const q = (this.state.search || "").trim().toLowerCase();
		const nowish = true;
		return this.state.chapters.filter((c) => {
			const hidden = !!c.is_hidden;
			if (this.state.list_mode === "hidden" ? !hidden : hidden) return false;
			if (this.state.stage_filter !== "All" && c.writing_stage !== this.state.stage_filter) {
				return false;
			}
			if (!q) return true;
			const hay = `${c.title || ""} ${c.summary || ""}`.toLowerCase();
			return hay.includes(q);
		});
	}

	filtered_list_html() {
		const chapters = this.filtered_chapters();
		if (!chapters.length) {
			return `<div class="nc-empty-list text-muted">${
				this.state.list_mode === "hidden"
					? __("Nothing hidden right now.")
					: __("No ideas match. Try another filter or add one.")
			}</div>`;
		}
		return chapters
			.map((c) => {
				const active_cls = c.name === this.state.active ? " active" : "";
				const color = next_chapter.STAGE_COLORS[c.writing_stage] || "gray";
				return `<div class="nc-list-item${active_cls}" data-chapter="${frappe.utils.escape_html(
					c.name
				)}">
					<button type="button" class="nc-list-item-main" data-chapter="${frappe.utils.escape_html(
						c.name
					)}">
						<span class="nc-list-item-title">${frappe.utils.escape_html(c.title || __("Untitled"))}</span>
						<span class="nc-list-item-meta indicator-pill whitespace-nowrap ${color}">${frappe.utils.escape_html(
					__(c.writing_stage || "Idea")
				)}</span>
					</button>
					<button type="button" class="btn btn-xs btn-default nc-list-more" data-more="${frappe.utils.escape_html(
						c.name
					)}" title="${c.is_hidden ? __("Show again") : __("Hide…")}">⋯</button>
				</div>`;
			})
			.join("");
	}

	center_html(active) {
		const tab = this.state.active_tab || "brain-dump";
		return `
			<div class="nc-center-header">
				<input type="text" class="form-control nc-title-input" data-role="title"
					value="${frappe.utils.escape_html(active.title || "")}"
					placeholder="${__("Give this idea a short name")}" />
			</div>
			<div class="form-tabs">
				<ul class="nav form-tabs" role="tablist">
					<li class="nav-item">
						<button type="button" class="nav-link ${
							tab === "brain-dump" ? "active" : ""
						}" data-tab="brain-dump">${__("Brain Dump")}</button>
					</li>
					<li class="nav-item">
						<button type="button" class="nav-link ${
							tab === "chapter" ? "active" : ""
						}" data-tab="chapter">${__("Chapter")}</button>
					</li>
				</ul>
			</div>
			<div class="nc-tab-panels">
				<div class="nc-tab-panel ${tab === "brain-dump" ? "active" : ""}" data-panel="brain-dump">
					<p class="nc-tab-help text-muted">${__(
						"Rough notes are welcome. Write a few sentences about what you have in mind."
					)}</p>
					<textarea class="form-control nc-summary-input" data-role="summary" rows="12"
						placeholder="${__("e.g. We need a simple way to track customer tickets…")}">${frappe.utils.escape_html(
							active.summary || ""
						)}</textarea>
				</div>
				<div class="nc-tab-panel ${tab === "chapter" ? "active" : ""}" data-panel="chapter">
					<p class="nc-tab-help text-muted">${__(
						"Shape your notes into a clear chapter — what should happen, and why."
					)}</p>
					<div class="nc-text-editor-wrap" data-role="content-editor"></div>
				</div>
			</div>
		`;
	}

	empty_center_html() {
		return `<div class="nc-centered text-muted">${__(
			"Select an idea on the left, or add a new one to start writing."
		)}</div>`;
	}

	right_html(active) {
		const stage = active.writing_stage || "Idea";
		const stage_options = this.state.stages
			.map((s) => `<option value="${s}" ${stage === s ? "selected" : ""}>${__(s)}</option>`)
			.join("");
		return `
			<div class="nc-pane-header">
				<div class="nc-pane-title">${__("Details")}</div>
				<div class="nc-save-state text-muted" data-role="save-state">${frappe.utils.escape_html(
					this.state.save_state || __("All changes save automatically")
				)}</div>
			</div>
			<div class="nc-right-body">
				<div class="frappe-control"><div class="form-group">
					<label class="control-label">${__("Progress")}</label>
					<select class="form-control" data-role="writing-stage">${stage_options}</select>
					<p class="help-box small text-muted">${__(
						"Move this forward as your thinking gets clearer. Later stages have limits."
					)}</p>
				</div></div>

				<div class="nc-side-card">
					<div class="nc-side-card-title">${__("Next writing session")}</div>
					<div data-role="session-control"></div>
					<button type="button" class="btn btn-primary btn-sm btn-block mt-2" data-action="save-session"
						${active.next_write_on ? "" : "disabled"}>
						${__("Add to calendar (.ics)")}
					</button>
					<p class="help-box small text-muted">${__(
						"Pick a time, then download a calendar file with a link back here."
					)}</p>
				</div>

				<div class="nc-side-card">
					<div class="nc-side-card-title">${__("How to use this")}</div>
					<ol class="nc-side-steps text-muted">
						<li>${__("Start in Brain Dump — get thoughts out quickly.")}</li>
						<li>${__("Open Chapter when you are ready to write it up more clearly.")}</li>
						<li>${__("Hide ideas you are not focusing on right now.")}</li>
					</ol>
				</div>
				<div class="nc-side-card nc-install-slot" data-role="install-slot">${this.install_button_html()}</div>
			</div>
		`;
	}

	empty_right_html() {
		return `<div class="nc-pane-header"><div class="nc-pane-title">${__(
			"Details"
		)}</div></div><div class="nc-right-body text-muted">${__(
			"Idea details will show up here."
		)}</div>`;
	}

	mount_content_editor(active) {
		const $parent = this.$root.find('[data-role="content-editor"]');
		if (!$parent.length) return;
		this.content_control = frappe.ui.form.make_control({
			parent: $parent.get(0),
			df: {
				fieldtype: "Text Editor",
				fieldname: "content",
				label: "",
				placeholder: __("Write freely. Headings, lists, and links are welcome."),
			},
			render_input: true,
			only_input: true,
		});
		this.content_control.set_value(active.content || "");
		const schedule = () => this.schedule_save();
		if (this.content_control.quill) {
			this.content_control.quill.on("text-change", schedule);
		} else {
			this.content_control.df.change = schedule;
		}
	}

	mount_session_control(active) {
		const $parent = this.$root.find('[data-role="session-control"]');
		if (!$parent.length) return;
		this.session_control = frappe.ui.form.make_control({
			parent: $parent.get(0),
			df: {
				fieldtype: "Datetime",
				fieldname: "next_write_on",
				label: __("Date & time"),
			},
			render_input: true,
			only_input: true,
		});
		this.session_control.set_value(active.next_write_on || "");
		this.session_control.df.change = () => {
			const val = this.session_control.get_value();
			this.$root.find('[data-action="save-session"]').prop("disabled", !val);
			this.persist_session(val);
		};
	}

	persist_session(next_write_on) {
		const name = this.state.active;
		if (!name) return;
		if (!next_write_on) {
			frappe.call({
				method: "next_chapter.api.chapter.clear_writing_session",
				args: { name },
				callback: (r) => this.replace_chapter(r.message),
			});
			return;
		}
		frappe.call({
			method: "next_chapter.api.chapter.set_writing_session",
			args: {
				name,
				next_write_on,
				write_duration_mins: this.state.settings.default_session_mins || 60,
			},
			callback: (r) => this.replace_chapter(r.message),
		});
	}

	bind_write() {
		this.$root.find("[data-list-mode]").on("click", (e) => {
			this.state.list_mode = $(e.currentTarget).data("list-mode");
			this.render_shell();
		});
		this.$root.find("[data-stage-filter]").on("click", (e) => {
			this.state.stage_filter = $(e.currentTarget).data("stage-filter");
			this.render_shell();
		});
		this.$root.find('[data-role="search"]').on("input", (e) => {
			this.state.search = $(e.currentTarget).val();
			this.$root.find(".nc-list").html(this.filtered_list_html());
			this.bind_list_items();
		});
		this.bind_list_items();
		this.$root.find('[data-action="new-idea"]').on("click", () => {
			this.flush_save(() => this.create_idea());
		});
		this.$root.find("[data-tab]").on("click", (e) => this.show_tab($(e.currentTarget).data("tab")));
		const schedule = () => this.schedule_save();
		this.$root.find('[data-role="title"]').on("input", schedule);
		this.$root.find('[data-role="summary"]').on("input", schedule);
		this.$root.find('[data-role="writing-stage"]').on("change", (e) => {
			const stage = $(e.currentTarget).val();
			frappe.call({
				method: "next_chapter.api.chapter.set_stage",
				args: { name: this.state.active, writing_stage: stage },
				callback: (r) => {
					this.replace_chapter(r.message);
					this.state.save_state = __("Saved");
					this.$root.find('[data-role="save-state"]').text(this.state.save_state);
					this.$root.find(".nc-list").html(this.filtered_list_html());
					this.bind_list_items();
				},
				error: () => {
					// revert select to stored value
					const active = this.get_active();
					if (active) {
						this.$root.find('[data-role="writing-stage"]').val(active.writing_stage);
					}
				},
			});
		});
		this.$root.find('[data-action="save-session"]').on("click", () => {
			const active = this.get_active();
			if (active && active.next_write_on) {
				next_chapter.download_ics(active.name);
			}
		});
	}

	bind_list_items() {
		this.$root.find(".nc-list-item-main").on("click", (e) => {
			const name = $(e.currentTarget).data("chapter");
			if (name === this.state.active && this.state.view === "write") return;
			this.flush_save(() => {
				this.state.active = name;
				this.state.active_tab = "brain-dump";
				this.state.view = "write";
				this.render_shell();
			});
		});
		this.$root.find("[data-more]").on("click", (e) => {
			e.stopPropagation();
			const name = $(e.currentTarget).data("more");
			const chapter = this.state.chapters.find((c) => c.name === name);
			if (!chapter) return;
			if (chapter.is_hidden) {
				frappe.call({
					method: "next_chapter.api.chapter.unhide_chapter",
					args: { name },
					callback: (r) => {
						this.replace_chapter(r.message);
						this.render_shell();
					},
				});
				return;
			}
			next_chapter.hide_dialog(chapter, (updated) => {
				this.replace_chapter(updated);
				if (this.state.active === updated.name) {
					const next = this.filtered_chapters().find((c) => c.name !== updated.name);
					this.state.active = next ? next.name : null;
				}
				this.render_shell();
			});
		});
	}

	/* ---------- Board view ---------- */

	render_board($body) {
		const columns = this.state.stages
			.map((stage) => {
				const cards = this.state.chapters.filter((c) => !c.is_hidden && c.writing_stage === stage);
				const limit = this.state.wip_limits[stage];
				const limit_label =
					limit && Number(limit) > 0 ? `${cards.length}/${limit}` : `${cards.length}/∞`;
				const full = limit && Number(limit) > 0 && cards.length >= Number(limit);
				return `<div class="nc-kanban-col ${full ? "is-full" : ""}" data-stage="${frappe.utils.escape_html(
					stage
				)}">
					<div class="nc-kanban-col-head">
						<span>${__(stage)}</span>
						<span class="text-muted">${limit_label}${full ? " ⚠" : ""}</span>
					</div>
					<div class="nc-kanban-cards" data-drop-stage="${frappe.utils.escape_html(stage)}">
						${cards
							.map(
								(c) => `<div class="nc-kanban-card" draggable="true" data-chapter="${frappe.utils.escape_html(
									c.name
								)}">
								<div class="nc-kanban-card-title">${frappe.utils.escape_html(c.title || "")}</div>
								${
									c.next_write_on
										? `<div class="nc-kanban-card-meta text-muted">${frappe.utils.escape_html(
												next_chapter.format_datetime(c.next_write_on)
										  )}</div>`
										: ""
								}
							</div>`
							)
							.join("")}
					</div>
				</div>`;
			})
			.join("");

		$body.html(`<div class="nc-board">${columns}</div>`);

		let drag_name = null;
		$body.find(".nc-kanban-card").on("dragstart", (e) => {
			drag_name = $(e.currentTarget).data("chapter");
			e.originalEvent.dataTransfer.setData("text/plain", drag_name);
		});
		$body.find(".nc-kanban-cards").on("dragover", (e) => {
			e.preventDefault();
			$(e.currentTarget).addClass("drag-over");
		});
		$body.find(".nc-kanban-cards").on("dragleave", (e) => {
			$(e.currentTarget).removeClass("drag-over");
		});
		$body.find(".nc-kanban-cards").on("drop", (e) => {
			e.preventDefault();
			$(e.currentTarget).removeClass("drag-over");
			const stage = $(e.currentTarget).data("drop-stage");
			const name = drag_name || e.originalEvent.dataTransfer.getData("text/plain");
			if (!name || !stage) return;
			frappe.call({
				method: "next_chapter.api.chapter.set_stage",
				args: { name, writing_stage: stage },
				callback: (r) => {
					this.replace_chapter(r.message);
					this.render_shell();
				},
			});
		});
		$body.find(".nc-kanban-card").on("click", (e) => {
			const name = $(e.currentTarget).data("chapter");
			const chapter = this.state.chapters.find((c) => c.name === name);
			if (!chapter) return;
			next_chapter.session_dialog(chapter, (ch) => {
				this.state.active = ch.name;
				this.state.view = "write";
				this.render_shell();
			});
		});
	}

	/* ---------- Schedule view ---------- */

	render_schedule($body) {
		const tabs = [
			{ key: "list", label: __("List") },
			{ key: "three", label: __("Next 3 days") },
			{ key: "ten", label: __("Next 10 days") },
			{ key: "month", label: __("Month") },
			{ key: "ninety", label: __("90 days") },
		];
		$body.html(`
			<div class="nc-schedule">
				<div class="form-tabs">
					<ul class="nav form-tabs">
						${tabs
							.map(
								(t) => `<li class="nav-item">
								<button type="button" class="nav-link ${
									this.state.schedule_tab === t.key ? "active" : ""
								}" data-schedule-tab="${t.key}">${t.label}</button>
							</li>`
							)
							.join("")}
					</ul>
				</div>
				<div class="nc-schedule-body" data-role="schedule-body"></div>
			</div>
		`);
		$body.find("[data-schedule-tab]").on("click", (e) => {
			this.state.schedule_tab = $(e.currentTarget).data("schedule-tab");
			this.render_shell();
		});
		const $sb = $body.find('[data-role="schedule-body"]');
		const sessions = this.scheduled_chapters();
		const tab = this.state.schedule_tab;
		if (tab === "list") this.render_schedule_list($sb, sessions);
		else if (tab === "three") this.render_schedule_columns($sb, sessions, 3);
		else if (tab === "ten") this.render_schedule_columns($sb, sessions, 10);
		else if (tab === "month") this.render_schedule_month($sb, sessions);
		else this.render_schedule_ninety($sb, sessions);
	}

	scheduled_chapters() {
		return this.state.chapters
			.filter((c) => c.next_write_on && !c.is_hidden)
			.slice()
			.sort((a, b) => (a.next_write_on > b.next_write_on ? 1 : -1));
	}

	render_schedule_list($el, sessions) {
		if (!sessions.length) {
			$el.html(
				`<div class="nc-centered text-muted">${__(
					"No writing sessions scheduled yet. Set a time from the Write view."
				)}</div>`
			);
			return;
		}
		$el.html(`
			<div class="nc-schedule-list">
				${sessions
					.map(
						(c) => `<button type="button" class="nc-schedule-row" data-chapter="${frappe.utils.escape_html(
							c.name
						)}">
						<span class="nc-schedule-when">${frappe.utils.escape_html(
							next_chapter.format_datetime(c.next_write_on)
						)}</span>
						<span class="nc-schedule-title">${frappe.utils.escape_html(c.title || "")}</span>
						<span class="indicator-pill ${next_chapter.STAGE_COLORS[c.writing_stage] || "gray"}">${frappe.utils.escape_html(
							__(c.writing_stage || "")
						)}</span>
					</button>`
					)
					.join("")}
			</div>
		`);
		this.bind_schedule_items($el);
	}

	render_schedule_columns($el, sessions, days) {
		const start = moment().startOf("day");
		const cols = [];
		for (let i = 0; i < days; i++) {
			const day = moment(start).add(i, "days");
			const key = day.format("YYYY-MM-DD");
			const items = sessions.filter(
				(c) => moment(frappe.datetime.str_to_obj(c.next_write_on)).format("YYYY-MM-DD") === key
			);
			cols.push(`<div class="nc-day-col">
				<div class="nc-day-col-head">${frappe.utils.escape_html(next_chapter.format_day_label(day.toDate()))}</div>
				<div class="nc-day-col-body">
					${
						items.length
							? items
									.map(
										(c) => `<button type="button" class="nc-day-card" data-chapter="${frappe.utils.escape_html(
											c.name
										)}">
								<div class="nc-day-card-time">${frappe.utils.escape_html(
									next_chapter.format_time(c.next_write_on)
								)}</div>
								<div>${frappe.utils.escape_html(c.title || "")}</div>
							</button>`
									)
									.join("")
							: `<div class="text-muted nc-day-empty">—</div>`
					}
				</div>
			</div>`);
		}
		$el.html(`<div class="nc-day-grid days-${days}">${cols.join("")}</div>`);
		this.bind_schedule_items($el);
	}

	render_schedule_month($el, sessions) {
		const start = moment().startOf("month");
		const end = moment().endOf("month");
		const cursor = moment(start).startOf("week");
		const last = moment(end).endOf("week");
		const cells = [];
		while (cursor.isSameOrBefore(last, "day")) {
			const key = cursor.format("YYYY-MM-DD");
			const in_month = cursor.month() === start.month();
			const items = sessions.filter(
				(c) => moment(frappe.datetime.str_to_obj(c.next_write_on)).format("YYYY-MM-DD") === key
			);
			cells.push(`<div class="nc-month-cell ${in_month ? "" : "muted"}">
				<div class="nc-month-date">${cursor.date()}</div>
				${items
					.slice(0, 3)
					.map(
						(c) => `<button type="button" class="nc-month-item" data-chapter="${frappe.utils.escape_html(
							c.name
						)}">${frappe.utils.escape_html(c.title || "")}</button>`
					)
					.join("")}
			</div>`);
			cursor.add(1, "day");
		}
		$el.html(`
			<div class="nc-month-title">${frappe.utils.escape_html(start.format("MMMM YYYY"))}</div>
			<div class="nc-month-grid">${cells.join("")}</div>
		`);
		this.bind_schedule_items($el);
	}

	render_schedule_ninety($el, sessions) {
		const end = moment().add(90, "days").endOf("day");
		const upcoming = sessions.filter((c) =>
			moment(frappe.datetime.str_to_obj(c.next_write_on)).isSameOrBefore(end)
		);
		const by_week = {};
		upcoming.forEach((c) => {
			const week = moment(frappe.datetime.str_to_obj(c.next_write_on)).startOf("isoWeek").format("YYYY-MM-DD");
			by_week[week] = by_week[week] || [];
			by_week[week].push(c);
		});
		const weeks = Object.keys(by_week).sort();
		if (!weeks.length) {
			$el.html(
				`<div class="nc-centered text-muted">${__("No sessions in the next 90 days.")}</div>`
			);
			return;
		}
		$el.html(`
			<div class="nc-ninety">
				${weeks
					.map((week) => {
						const label = moment(week).format("D MMM") + " – " + moment(week).add(6, "days").format("D MMM");
						return `<div class="nc-week-block">
							<div class="nc-week-head">${frappe.utils.escape_html(label)}</div>
							${by_week[week]
								.map(
									(c) => `<button type="button" class="nc-schedule-row" data-chapter="${frappe.utils.escape_html(
										c.name
									)}">
									<span class="nc-schedule-when">${frappe.utils.escape_html(
										next_chapter.format_datetime(c.next_write_on)
									)}</span>
									<span class="nc-schedule-title">${frappe.utils.escape_html(c.title || "")}</span>
								</button>`
								)
								.join("")}
						</div>`;
					})
					.join("")}
			</div>
		`);
		this.bind_schedule_items($el);
	}

	bind_schedule_items($el) {
		$el.find("[data-chapter]").on("click", (e) => {
			const name = $(e.currentTarget).data("chapter");
			const chapter = this.state.chapters.find((c) => c.name === name);
			if (!chapter) return;
			next_chapter.session_dialog(chapter, (ch) => {
				this.state.active = ch.name;
				this.state.view = "write";
				this.render_shell();
			});
		});
	}

	/* ---------- Shared helpers ---------- */

	get_active() {
		return this.state.chapters.find((c) => c.name === this.state.active) || null;
	}

	replace_chapter(updated) {
		if (!updated) return;
		const idx = this.state.chapters.findIndex((c) => c.name === updated.name);
		if (idx >= 0) this.state.chapters[idx] = Object.assign({}, this.state.chapters[idx], updated);
		else this.state.chapters.push(updated);
	}

	show_tab(tab) {
		this.state.active_tab = tab;
		this.$root.find("[data-tab]").removeClass("active");
		this.$root.find(`[data-tab="${tab}"]`).addClass("active");
		this.$root.find(".nc-tab-panel").removeClass("active");
		this.$root.find(`[data-panel="${tab}"]`).addClass("active");
	}

	create_idea() {
		frappe.call({
			method: "next_chapter.api.chapter.create_chapter",
			args: { title: __("New idea") },
			callback: (r) => {
				const chapter = r.message;
				if (!chapter) return;
				this.state.chapters.push(chapter);
				this.state.active = chapter.name;
				this.state.active_tab = "brain-dump";
				this.state.list_mode = "active";
				this.render_shell();
				this.$root.find('[data-role="title"]').trigger("focus").select();
			},
		});
	}

	schedule_save() {
		this.state.save_state = __("Saving…");
		this.$root.find('[data-role="save-state"]').text(this.state.save_state);
		clearTimeout(this._save_timer);
		this._save_timer = setTimeout(() => this.save_active(), 600);
	}

	flush_save(done) {
		clearTimeout(this._save_timer);
		if (!this.state.active || this.state.view !== "write") {
			done && done();
			return;
		}
		this.save_active(done);
	}

	read_form_values() {
		const title = this.$root.find('[data-role="title"]').val();
		const summary = this.$root.find('[data-role="summary"]').val();
		const writing_stage = this.$root.find('[data-role="writing-stage"]').val();
		let content = "";
		if (this.content_control) content = this.content_control.get_value() || "";
		return { title, summary, content, writing_stage };
	}

	save_active(done) {
		const name = this.state.active;
		if (!name || this.state.view !== "write") {
			done && done();
			return;
		}
		const values = this.read_form_values();
		const local = this.state.chapters.find((c) => c.name === name);
		if (local) Object.assign(local, values);

		frappe.call({
			method: "next_chapter.api.chapter.save_chapter",
			args: {
				name,
				title: values.title,
				summary: values.summary,
				content: values.content,
			},
			callback: (r) => {
				this.replace_chapter(r.message);
				this.state.save_state = __("Saved");
				this.$root.find('[data-role="save-state"]').text(this.state.save_state);
				this.$root
					.find(`.nc-list-item[data-chapter="${name}"] .nc-list-item-title`)
					.text((r.message && r.message.title) || values.title);
				done && done();
			},
			error: () => {
				this.state.save_state = __("Could not save — try again");
				this.$root.find('[data-role="save-state"]').text(this.state.save_state);
				done && done();
			},
		});
	}

	destroy_controls() {
		this.content_control = null;
		this.session_control = null;
	}

	install_button_html() {
		if (!this.state.installable) return "";
		return `<button type="button" class="btn btn-default btn-sm btn-block" data-action="install-app">
			${__("Install as app")}
		</button>
		<p class="help-box small text-muted">${__("Open NextChapter in its own window from Chrome.")}</p>`;
	}

	bind_install_buttons() {
		this.$root.find('[data-action="install-app"]').on("click", () => {
			if (typeof next_chapter.prompt_install === "function") next_chapter.prompt_install();
		});
	}

	refresh_install_ui() {
		const $slot = this.$root.find('[data-role="install-slot"]');
		if ($slot.length) {
			$slot.html(this.install_button_html());
			this.bind_install_buttons();
		}
	}
};
