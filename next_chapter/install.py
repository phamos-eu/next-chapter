import frappe


def after_install():
	"""Ensure a Workspace shortcut exists for the writing desk page."""
	try:
		create_workspace_link()
	except Exception:
		frappe.log_error("NextChapter workspace setup failed", "next_chapter.install")


def create_workspace_link():
	if frappe.db.exists("Workspace", "NextChapter"):
		return

	workspace = frappe.get_doc(
		{
			"doctype": "Workspace",
			"name": "NextChapter",
			"title": "NextChapter",
			"label": "NextChapter",
			"module": "NextChapter",
			"public": 1,
			"is_hidden": 0,
			"content": (
				'[{"id":"nc1","type":"header","data":{"text":'
				'"<span class=\\"h4\\"><b>NextChapter</b></span>","col":12}},'
				'{"id":"nc2","type":"paragraph","data":{"text":'
				'"Write your ERPNext implementation story — from ideas to chapters.","col":12}},'
				'{"id":"nc3","type":"shortcut","data":{"shortcut_name":"Write","col":4}}]'
			),
			"shortcuts": [
				{
					"type": "Page",
					"link_to": "next-chapter",
					"label": "Write",
				}
			],
		}
	)
	workspace.insert(ignore_permissions=True)
