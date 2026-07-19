app_name = "next_chapter"
app_title = "NextChapter"
app_publisher = "phamos.eu"
app_description = "Writing-first ERPNext implementation planning — ideas to chapters"
app_email = "support@phamos.eu"
app_license = "agpl-3.0"
app_version = "0.0.1"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/next_chapter/css/next_chapter.css"
# app_include_js = "/assets/next_chapter/js/next_chapter.js"

# include js, css files in header of web template
# web_include_css = "/assets/next_chapter/css/next_chapter.css"
# web_include_js = "/assets/next_chapter/js/next_chapter.js"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "next_chapter.utils.jinja_methods",
# 	"filters": "next_chapter.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "next_chapter.install.before_install"
after_install = "next_chapter.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "next_chapter.uninstall.before_uninstall"
# after_uninstall = "next_chapter.uninstall.after_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "next_chapter.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"next_chapter.tasks.all"
# 	],
# }

# Testing
# -------

# before_tests = "next_chapter.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "next_chapter.event.get_events"
# }

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"next_chapter.auth.validate"
# ]
