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

	// Load display fonts once for the writing UI
	if (!document.getElementById("nc-fonts")) {
		const link = document.createElement("link");
		link.id = "nc-fonts";
		link.rel = "stylesheet";
		link.href =
			"https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;600&display=swap";
		document.head.appendChild(link);
	}

	new next_chapter.WritingApp(page);
};

next_chapter.WritingApp = class WritingApp {
	constructor(page) {
		this.page = page;
		this.$root = $("#next-chapter-root");
		this.state = {
			loading: true,
			needs_setup: false,
			story: null,
			chapters: [],
			active: null,
			wizard_step: 0,
			wizard: this.empty_wizard(),
			save_state: "",
			error: "",
		};
		this._save_timer = null;
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
		this.$root.html(
			`<div class="nc-wizard"><p class="nc-wizard-lead">${__("Loading…")}</p></div>`
		);
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
		this.render_editor();
	}

	/* ---------- Wizard ---------- */

	render_wizard() {
		const step = this.state.wizard_step;
		const w = this.state.wizard;
		const steps = [
			{
				title: __("What is your company's name?"),
				body: this.field_html(
					"company_name",
					__("Company name"),
					"text",
					w.company_name,
					__("e.g. phamos GmbH")
				),
			},
			{
				title: __("What is the purpose of the company?"),
				body: this.field_html(
					"company_purpose",
					__("Purpose"),
					"textarea",
					w.company_purpose,
					__("A few sentences on why the company exists.")
				),
			},
			{
				title: __("How many people — now and ahead?"),
				body: `<div class="nc-employee-grid">
					${this.field_html("employees_now", __("Employees now"), "number", w.employees_now)}
					${this.field_html("employees_1y", __("In 1 year"), "number", w.employees_1y)}
					${this.field_html("employees_3y", __("In 3 years"), "number", w.employees_3y)}
					${this.field_html("employees_7y", __("In 7 years"), "number", w.employees_7y)}
				</div>`,
			},
			{
				title: __("What stage is the company at today?"),
				body: this.field_html(
					"company_stage",
					__("Stage today"),
					"textarea",
					w.company_stage,
					__("Briefly describe where things stand.")
				),
			},
			{
				title: __("Why implement a new ERP?"),
				body: this.field_html(
					"erp_motivation",
					__("Motivation"),
					"textarea",
					w.erp_motivation,
					__("What is pushing you toward a new system?")
				),
			},
			{
				title: __("Three things you want to implement first"),
				body: `<div class="nc-priority-list">
					${this.field_html("priority_1", __("First"), "text", w.priority_1, __("Idea title"))}
					${this.field_html("priority_2", __("Second"), "text", w.priority_2, __("Idea title"))}
					${this.field_html("priority_3", __("Third"), "text", w.priority_3, __("Idea title"))}
				</div>`,
			},
		];

		const current = steps[step];
		const is_last = step === steps.length - 1;

		this.$root.html(`
			<div class="nc-wizard">
				<h1 class="nc-brand">NextChapter</h1>
				<p class="nc-wizard-lead">${__(
					"A quiet place to write your ERPNext implementation story — starting with a few questions."
				)}</p>
				<div class="nc-step-meta">${__("Step {0} of {1}", [step + 1, steps.length])}</div>
				<h2 class="nc-step-title">${current.title}</h2>
				<div class="nc-step-body">${current.body}</div>
				${this.state.error ? `<div class="nc-error">${frappe.utils.escape_html(this.state.error)}</div>` : ""}
				<div class="nc-wizard-actions">
					${
						step > 0
							? `<button type="button" class="nc-btn nc-btn-ghost" data-action="wizard-back">${__(
									"Back"
							  )}</button>`
							: ""
					}
					<button type="button" class="nc-btn nc-btn-primary" data-action="wizard-next">
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
			return `<div class="nc-field">
				<label for="nc-${name}">${label}</label>
				<textarea id="nc-${name}" data-field="${name}" rows="4"${ph}>${safe_val}</textarea>
			</div>`;
		}
		return `<div class="nc-field">
			<label for="nc-${name}">${label}</label>
			<input id="nc-${name}" data-field="${name}" type="${type}" value="${safe_val}"${ph} />
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
				this.state.error = __("Add at least one idea title to begin.");
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

	/* ---------- Editor ---------- */

	render_editor() {
		const chapters = this.state.chapters;
		const active = chapters.find((c) => c.name === this.state.active) || chapters[0];
		if (active && this.state.active !== active.name) {
			this.state.active = active.name;
		}

		const list_html = chapters
			.map((c) => {
				const active_cls = c.name === this.state.active ? " is-active" : "";
				return `<button type="button" class="nc-chapter-item${active_cls}" data-chapter="${frappe.utils.escape_html(
					c.name
				)}">
					<span class="nc-chapter-item-title">${frappe.utils.escape_html(c.title || __("Untitled"))}</span>
					<span class="nc-chapter-item-meta">${frappe.utils.escape_html(c.writing_stage || "Idea")}</span>
				</button>`;
			})
			.join("");

		const company = (this.state.story && this.state.story.company_name) || "";

		let editor_html = `<div class="nc-empty-editor">${__("Select or create an idea to start writing.")}</div>`;
		if (active) {
			const plain_content = next_chapter.html_to_plain(active.content || "");
			editor_html = `
				<div class="nc-editor-toolbar">
					<select class="nc-writing-stage" data-role="writing-stage" aria-label="${__("Writing stage")}">
						${["Idea", "Outline", "Draft"]
							.map(
								(s) =>
									`<option value="${s}" ${
										active.writing_stage === s ? "selected" : ""
									}>${__(s)}</option>`
							)
							.join("")}
					</select>
					<div class="nc-save-state" data-role="save-state">${frappe.utils.escape_html(
						this.state.save_state
					)}</div>
				</div>
				<input class="nc-title-input" data-role="title" type="text" value="${frappe.utils.escape_html(
					active.title || ""
				)}" placeholder="${__("Idea title")}" />
				<div class="nc-summary-label">${__("Brain dump")}</div>
				<textarea class="nc-summary-input" data-role="summary" rows="3" placeholder="${__(
					"Two sentences. Messy is fine."
				)}">${frappe.utils.escape_html(active.summary || "")}</textarea>
				<div class="nc-content-label">${__("Chapter")}</div>
				<textarea class="nc-content-input" data-role="content" placeholder="${__(
					"Write the introduction, then keep going…"
				)}">${frappe.utils.escape_html(plain_content)}</textarea>
			`;
		}

		this.$root.html(`
			<aside class="nc-sidebar">
				<div class="nc-sidebar-header">
					<div class="nc-brand">NextChapter</div>
					<div class="nc-story-name" title="${frappe.utils.escape_html(company)}">${frappe.utils.escape_html(
			company
		)}</div>
				</div>
				<div class="nc-chapter-list">${list_html}</div>
				<div class="nc-sidebar-footer">
					<button type="button" class="nc-btn nc-btn-primary" data-action="new-idea">${__(
						"New Idea"
					)}</button>
				</div>
			</aside>
			<section class="nc-editor">${editor_html}</section>
		`);

		this.bind_editor();
	}

	bind_editor() {
		this.$root.find(".nc-chapter-item").on("click", (e) => {
			const name = $(e.currentTarget).data("chapter");
			if (name === this.state.active) return;
			this.flush_save(() => {
				this.state.active = name;
				this.state.save_state = "";
				this.render_editor();
			});
		});

		this.$root.find('[data-action="new-idea"]').on("click", () => {
			this.flush_save(() => this.create_idea());
		});

		const schedule = () => this.schedule_save();
		this.$root.find('[data-role="title"]').on("input", schedule);
		this.$root.find('[data-role="summary"]').on("input", schedule);
		this.$root.find('[data-role="content"]').on("input", schedule);
		this.$root.find('[data-role="writing-stage"]').on("change", schedule);
	}

	create_idea() {
		frappe.call({
			method: "next_chapter.api.chapter.create_chapter",
			args: { title: __("Untitled idea") },
			callback: (r) => {
				const chapter = r.message;
				if (!chapter) return;
				this.state.chapters.push(chapter);
				this.state.active = chapter.name;
				this.state.save_state = "";
				this.render_editor();
				this.$root.find('[data-role="title"]').trigger("focus").select();
			},
		});
	}

	schedule_save() {
		this.state.save_state = __("Saving…");
		this.$root.find('[data-role="save-state"]').text(this.state.save_state).addClass("is-saving");
		clearTimeout(this._save_timer);
		this._save_timer = setTimeout(() => this.save_active(), 500);
	}

	flush_save(done) {
		clearTimeout(this._save_timer);
		if (!this.state.active) {
			done && done();
			return;
		}
		this.save_active(done);
	}

	save_active(done) {
		const name = this.state.active;
		if (!name) {
			done && done();
			return;
		}

		const title = this.$root.find('[data-role="title"]').val();
		const summary = this.$root.find('[data-role="summary"]').val();
		const content = this.$root.find('[data-role="content"]').val();
		const writing_stage = this.$root.find('[data-role="writing-stage"]').val();

		// Keep local state in sync even before server returns
		const local = this.state.chapters.find((c) => c.name === name);
		if (local) {
			local.title = title;
			local.summary = summary;
			local.content = content;
			local.writing_stage = writing_stage;
		}

		frappe.call({
			method: "next_chapter.api.chapter.save_chapter",
			args: {
				name,
				title,
				summary,
				content,
				writing_stage,
			},
			callback: (r) => {
				const saved = r.message;
				if (saved) {
					const idx = this.state.chapters.findIndex((c) => c.name === saved.name);
					if (idx >= 0) {
						// Keep plain content in client state for the textarea
						this.state.chapters[idx] = Object.assign({}, saved, {
							content: content,
							summary: summary,
						});
					}
					// Refresh sidebar labels without full remount if possible
					this.$root
						.find(`.nc-chapter-item[data-chapter="${saved.name}"] .nc-chapter-item-title`)
						.text(saved.title);
					this.$root
						.find(`.nc-chapter-item[data-chapter="${saved.name}"] .nc-chapter-item-meta`)
						.text(saved.writing_stage);
				}
				this.state.save_state = __("Saved");
				this.$root
					.find('[data-role="save-state"]')
					.text(this.state.save_state)
					.removeClass("is-saving");
				done && done();
			},
			error: () => {
				this.state.save_state = __("Save failed");
				this.$root
					.find('[data-role="save-state"]')
					.text(this.state.save_state)
					.removeClass("is-saving");
				done && done();
			},
		});
	}
};

next_chapter.html_to_plain = function (html) {
	if (!html) return "";
	if (html.indexOf("<") === -1) return html;

	const tmp = document.createElement("div");
	tmp.innerHTML = html;

	const blocks = tmp.querySelectorAll("p, div, li, br");
	if (!blocks.length) {
		return (tmp.textContent || "").replace(/\u00a0/g, " ");
	}

	const lines = [];
	tmp.childNodes.forEach((node) => {
		if (node.nodeName === "BR") {
			lines.push("");
			return;
		}
		if (node.nodeType === Node.TEXT_NODE) {
			const t = (node.textContent || "").replace(/\u00a0/g, " ");
			if (t) lines.push(t);
			return;
		}
		if (node.nodeType === Node.ELEMENT_NODE) {
			const t = (node.textContent || "").replace(/\u00a0/g, " ");
			lines.push(t);
		}
	});
	return lines.join("\n");
};
