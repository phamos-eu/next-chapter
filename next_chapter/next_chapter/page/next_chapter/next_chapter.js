// Frappe v16 loads Page JS as an IIFE — keep app state on window via frappe.provide.
frappe.provide("next_chapter");
const next_chapter = window.next_chapter;

frappe.pages["next-chapter"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("NextChapter"),
		single_column: true,
	});

	page.add_inner_message(__("Write your implementation story"));
	$(page.body).html('<div class="next-chapter-app" id="next-chapter-root"></div>');

	const start = () => {
		if (typeof next_chapter.setup_pwa === "function") {
			next_chapter.setup_pwa();
		}
		new next_chapter.WritingApp(page);
	};

	frappe.require("/assets/next_chapter/js/pwa.js", start);
};

next_chapter.WritingApp = class WritingApp {
	constructor(page) {
		this.page = page;
		this.$root = $("#next-chapter-root");
		this.content_control = null;
		this.state = {
			loading: true,
			needs_setup: false,
			story: null,
			chapters: [],
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
				if (!this.state.needs_setup && this.state.chapters.length) {
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
		this.$root.html(`
			<div class="nc-centered text-muted">
				${__("Loading…")}
			</div>
		`);
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
		this.render_workspace();
	}

	/* ---------- Setup wizard (Frappe form styling) ---------- */

	render_wizard() {
		this.destroy_controls();
		const step = this.state.wizard_step;
		const w = this.state.wizard;
		const steps = [
			{
				title: __("What is your company called?"),
				help: __("We'll use this as the name of your implementation story."),
				body: this.field_html(
					"company_name",
					__("Company name"),
					"text",
					w.company_name,
					__("e.g. Acme GmbH")
				),
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
				help: __("Rough numbers are fine. This helps you think about scale."),
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
					__("e.g. growing fast, processes still informal…")
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
					<div class="nc-wizard-progress text-muted">
						${__("Step {0} of {1}", [step + 1, steps.length])}
					</div>
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
				<div class="nc-wizard-install" data-role="install-slot">${this.install_button_html()}</div>
			</div>
		`);

		this.bind_wizard();
		this.bind_install_buttons();
	}

	field_html(name, label, type, value, placeholder) {
		const safe_val = frappe.utils.escape_html(value || "");
		const ph = placeholder ? ` placeholder="${frappe.utils.escape_html(placeholder)}"` : "";
		if (type === "textarea") {
			return `<div class="frappe-control">
				<div class="form-group">
					<label class="control-label" for="nc-${name}">${label}</label>
					<textarea class="form-control" id="nc-${name}" data-field="${name}" rows="4"${ph}>${safe_val}</textarea>
				</div>
			</div>`;
		}
		return `<div class="frappe-control">
			<div class="form-group">
				<label class="control-label" for="nc-${name}">${label}</label>
				<input class="form-control" id="nc-${name}" data-field="${name}" type="${type}" value="${safe_val}"${ph} />
			</div>
		</div>`;
	}

	bind_wizard() {
		this.$root.find("[data-field]").on("input change", (e) => {
			const $el = $(e.currentTarget);
			this.state.wizard[$el.data("field")] = $el.val();
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
			const $el = $(el);
			this.state.wizard[$el.data("field")] = $el.val();
		});
	}

	validate_wizard_step() {
		const w = this.state.wizard;
		const step = this.state.wizard_step;
		this.state.error = "";
		if (step === 0 && !(w.company_name || "").trim()) {
			this.state.error = __("Please enter a company name.");
			return false;
		}
		if (step === 5) {
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
				this.state.active = this.state.chapters[0] ? this.state.chapters[0].name : null;
				this.state.active_tab = "brain-dump";
				this.state.error = "";
				this.render();
			},
			error: (err) => {
				this.state.error =
					(err && err.message) || __("Could not create your story. Please try again.");
				this.render_wizard();
			},
		});
	}

	/* ---------- Main workspace: left / center tabs / right ---------- */

	render_workspace() {
		this.destroy_controls();

		const chapters = this.state.chapters;
		const active = chapters.find((c) => c.name === this.state.active) || chapters[0] || null;
		if (active && this.state.active !== active.name) {
			this.state.active = active.name;
		}

		const company = (this.state.story && this.state.story.company_name) || "";
		const list_html = chapters.length
			? chapters
					.map((c) => {
						const active_cls = c.name === this.state.active ? " active" : "";
						return `<button type="button" class="nc-list-item${active_cls}" data-chapter="${frappe.utils.escape_html(
							c.name
						)}">
						<span class="nc-list-item-title">${frappe.utils.escape_html(c.title || __("Untitled"))}</span>
						<span class="nc-list-item-meta indicator-pill whitespace-nowrap ${this.stage_color(
							c.writing_stage
						)}">${frappe.utils.escape_html(this.friendly_stage(c.writing_stage))}</span>
					</button>`;
					})
					.join("")
			: `<div class="nc-empty-list text-muted">${__("No ideas yet. Add your first one.")}</div>`;

		this.$root.html(`
			<div class="nc-shell">
				<aside class="nc-left">
					<div class="nc-pane-header">
						<div class="nc-pane-title">${__("Ideas")}</div>
						<div class="nc-pane-subtitle text-muted" title="${frappe.utils.escape_html(company)}">
							${frappe.utils.escape_html(company)}
						</div>
					</div>
					<div class="nc-list">${list_html}</div>
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
			this.bind_workspace();
			this.show_tab(this.state.active_tab || "brain-dump");
		} else {
			this.bind_workspace();
		}
		this.bind_install_buttons();
	}

	center_html(active) {
		const tab = this.state.active_tab || "brain-dump";
		return `
			<div class="nc-center-header">
				<input
					type="text"
					class="form-control nc-title-input"
					data-role="title"
					value="${frappe.utils.escape_html(active.title || "")}"
					placeholder="${__("Give this idea a short name")}"
				/>
			</div>
			<div class="form-tabs">
				<ul class="nav form-tabs" role="tablist">
					<li class="nav-item">
						<button type="button" class="nav-link ${
							tab === "brain-dump" ? "active" : ""
						}" data-tab="brain-dump" role="tab">
							${__("Brain Dump")}
						</button>
					</li>
					<li class="nav-item">
						<button type="button" class="nav-link ${
							tab === "chapter" ? "active" : ""
						}" data-tab="chapter" role="tab">
							${__("Chapter")}
						</button>
					</li>
				</ul>
			</div>
			<div class="nc-tab-panels">
				<div class="nc-tab-panel ${tab === "brain-dump" ? "active" : ""}" data-panel="brain-dump">
					<p class="nc-tab-help text-muted">
						${__("Rough notes are welcome. Write a few sentences about what you have in mind.")}
					</p>
					<textarea
						class="form-control nc-summary-input"
						data-role="summary"
						rows="12"
						placeholder="${__("e.g. We need a simple way to track customer tickets and response times…")}"
					>${frappe.utils.escape_html(active.summary || "")}</textarea>
				</div>
				<div class="nc-tab-panel ${tab === "chapter" ? "active" : ""}" data-panel="chapter">
					<p class="nc-tab-help text-muted">
						${__("Shape your notes into a clear chapter — what should happen, and why.")}
					</p>
					<div class="nc-text-editor-wrap" data-role="content-editor"></div>
				</div>
			</div>
		`;
	}

	empty_center_html() {
		return `
			<div class="nc-centered">
				<div class="text-muted">
					${__("Select an idea on the left, or add a new one to start writing.")}
				</div>
			</div>
		`;
	}

	right_html(active) {
		const stage = active.writing_stage || "Idea";
		return `
			<div class="nc-pane-header">
				<div class="nc-pane-title">${__("Details")}</div>
				<div class="nc-save-state text-muted" data-role="save-state">${frappe.utils.escape_html(
					this.state.save_state || __("All changes save automatically")
				)}</div>
			</div>
			<div class="nc-right-body">
				<div class="frappe-control">
					<div class="form-group">
						<label class="control-label">${__("Progress")}</label>
						<select class="form-control" data-role="writing-stage">
							${["Idea", "Outline", "Draft"]
								.map(
									(s) =>
										`<option value="${s}" ${stage === s ? "selected" : ""}>${__(
											this.friendly_stage(s)
										)}</option>`
								)
								.join("")}
						</select>
						<p class="help-box small text-muted">
							${__("Move this forward as your thinking gets clearer.")}
						</p>
					</div>
				</div>

				<div class="nc-side-card">
					<div class="nc-side-card-title">${__("How to use this")}</div>
					<ol class="nc-side-steps text-muted">
						<li>${__("Start in Brain Dump — get thoughts out quickly.")}</li>
						<li>${__("Open the Chapter tab when you are ready to write it up more clearly.")}</li>
						<li>${__("Update Progress when it feels more like an outline or a draft.")}</li>
					</ol>
				</div>

				<div class="nc-side-card nc-install-slot" data-role="install-slot">
					${this.install_button_html()}
				</div>
			</div>
		`;
	}

	empty_right_html() {
		return `
			<div class="nc-pane-header">
				<div class="nc-pane-title">${__("Details")}</div>
			</div>
			<div class="nc-right-body text-muted">
				${__("Idea details will show up here.")}
			</div>
		`;
	}

	friendly_stage(stage) {
		const map = {
			Idea: __("Idea"),
			Outline: __("Outline"),
			Draft: __("Draft"),
		};
		return map[stage] || stage || __("Idea");
	}

	stage_color(stage) {
		if (stage === "Draft") return "green";
		if (stage === "Outline") return "blue";
		return "orange";
	}

	mount_content_editor(active) {
		const $parent = this.$root.find('[data-role="content-editor"]');
		if (!$parent.length) {
			return;
		}

		this.content_control = frappe.ui.form.make_control({
			parent: $parent.get(0),
			df: {
				fieldtype: "Text Editor",
				fieldname: "content",
				label: "",
				reqd: 0,
				placeholder: __("Write freely. Headings, lists, and links are welcome."),
			},
			render_input: true,
			only_input: true,
		});
		this.content_control.set_value(active.content || "");

		// Quill change → autosave
		const schedule = () => this.schedule_save();
		if (this.content_control.quill) {
			this.content_control.quill.on("text-change", schedule);
		} else {
			this.content_control.df.change = schedule;
			$parent.on("input change", schedule);
		}
	}

	destroy_controls() {
		if (this.content_control) {
			try {
				if (this.content_control.quill && this.content_control.quill.off) {
					this.content_control.quill.off("text-change");
				}
			} catch (e) {
				// ignore
			}
			this.content_control = null;
		}
	}

	bind_workspace() {
		this.$root.find(".nc-list-item").on("click", (e) => {
			const name = $(e.currentTarget).data("chapter");
			if (name === this.state.active) return;
			this.flush_save(() => {
				this.state.active = name;
				this.state.active_tab = "brain-dump";
				this.state.save_state = "";
				this.render_workspace();
			});
		});

		this.$root.find('[data-action="new-idea"]').on("click", () => {
			this.flush_save(() => this.create_idea());
		});

		this.$root.find("[data-tab]").on("click", (e) => {
			const tab = $(e.currentTarget).data("tab");
			this.show_tab(tab);
		});

		const schedule = () => this.schedule_save();
		this.$root.find('[data-role="title"]').on("input", schedule);
		this.$root.find('[data-role="summary"]').on("input", schedule);
		this.$root.find('[data-role="writing-stage"]').on("change", schedule);
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
				this.state.save_state = "";
				this.render_workspace();
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
		if (!this.state.active) {
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
		if (this.content_control) {
			content = this.content_control.get_value() || "";
		}
		return { title, summary, content, writing_stage };
	}

	save_active(done) {
		const name = this.state.active;
		if (!name) {
			done && done();
			return;
		}

		const values = this.read_form_values();
		const local = this.state.chapters.find((c) => c.name === name);
		if (local) {
			Object.assign(local, values);
		}

		frappe.call({
			method: "next_chapter.api.chapter.save_chapter",
			args: {
				name,
				title: values.title,
				summary: values.summary,
				content: values.content,
				writing_stage: values.writing_stage,
			},
			callback: (r) => {
				const saved = r.message;
				if (saved) {
					const idx = this.state.chapters.findIndex((c) => c.name === saved.name);
					if (idx >= 0) {
						this.state.chapters[idx] = Object.assign({}, this.state.chapters[idx], saved, {
							content: values.content,
							summary: values.summary,
						});
					}
					this.$root
						.find(`.nc-list-item[data-chapter="${saved.name}"] .nc-list-item-title`)
						.text(saved.title);
					this.$root
						.find(`.nc-list-item[data-chapter="${saved.name}"] .nc-list-item-meta`)
						.text(this.friendly_stage(saved.writing_stage))
						.attr("class", `nc-list-item-meta indicator-pill whitespace-nowrap ${this.stage_color(
							saved.writing_stage
						)}`);
				}
				this.state.save_state = __("Saved");
				this.$root.find('[data-role="save-state"]').text(this.state.save_state);
				done && done();
			},
			error: () => {
				this.state.save_state = __("Could not save — try again");
				this.$root.find('[data-role="save-state"]').text(this.state.save_state);
				done && done();
			},
		});
	}

	install_button_html() {
		if (!this.state.installable) {
			return "";
		}
		return `<button type="button" class="btn btn-default btn-sm btn-block" data-action="install-app">
			${__("Install as app")}
		</button>
		<p class="help-box small text-muted">${__("Open NextChapter in its own window from Chrome.")}</p>`;
	}

	bind_install_buttons() {
		this.$root.find('[data-action="install-app"]').on("click", () => {
			if (typeof next_chapter.prompt_install === "function") {
				next_chapter.prompt_install();
			}
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
