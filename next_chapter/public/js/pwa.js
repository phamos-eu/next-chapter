// Shared PWA helpers (also loaded from the desk page IIFE via next_chapter.setup_pwa).
frappe.provide("next_chapter");

next_chapter.setup_pwa = function setup_pwa() {
	const next_chapter = window.next_chapter;
	next_chapter._pwa = next_chapter._pwa || {
		deferred_prompt: null,
		installed: window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true,
	};

	next_chapter.ensure_manifest_link();
	next_chapter.ensure_pwa_meta();
	next_chapter.register_service_worker();
	next_chapter.bind_install_events();
};

next_chapter.ensure_manifest_link = function () {
	if (document.querySelector('link[rel="manifest"][data-next-chapter="1"]')) {
		return;
	}
	const link = document.createElement("link");
	link.rel = "manifest";
	link.href = "/assets/next_chapter/manifest.json";
	link.setAttribute("data-next-chapter", "1");
	document.head.appendChild(link);
};

next_chapter.ensure_pwa_meta = function () {
	const metas = [
		{ name: "theme-color", content: "#0f766e" },
		{ name: "mobile-web-app-capable", content: "yes" },
		{ name: "apple-mobile-web-app-capable", content: "yes" },
		{ name: "apple-mobile-web-app-status-bar-style", content: "default" },
		{ name: "apple-mobile-web-app-title", content: "NextChapter" },
	];
	metas.forEach((m) => {
		let el = document.querySelector(`meta[name="${m.name}"][data-next-chapter="1"]`);
		if (!el) {
			el = document.createElement("meta");
			el.setAttribute("name", m.name);
			el.setAttribute("data-next-chapter", "1");
			document.head.appendChild(el);
		}
		el.setAttribute("content", m.content);
	});

	if (!document.querySelector('link[rel="apple-touch-icon"][data-next-chapter="1"]')) {
		const icon = document.createElement("link");
		icon.rel = "apple-touch-icon";
		icon.href = "/assets/next_chapter/images/next-chapter-180.png";
		icon.setAttribute("data-next-chapter", "1");
		document.head.appendChild(icon);
	}
};

next_chapter.register_service_worker = function () {
	if (!("serviceWorker" in navigator)) {
		return;
	}
	// Served from www/ so the script URL is origin-root and may control /desk/*
	navigator.serviceWorker.register("/next-chapter-sw.js", { scope: "/" }).catch((err) => {
		console.warn("NextChapter service worker registration failed", err);
	});
};

next_chapter.bind_install_events = function () {
	const next_chapter = window.next_chapter;
	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		next_chapter._pwa.deferred_prompt = event;
		$(document).trigger("next_chapter_pwa_installable");
	});

	window.addEventListener("appinstalled", () => {
		next_chapter._pwa.deferred_prompt = null;
		next_chapter._pwa.installed = true;
		$(document).trigger("next_chapter_pwa_installed");
	});
};

next_chapter.prompt_install = async function () {
	const next_chapter = window.next_chapter;
	const deferred = next_chapter._pwa && next_chapter._pwa.deferred_prompt;
	if (!deferred) {
		frappe.show_alert({
			message: __(
				"Use Chrome’s install icon in the address bar, or the menu: Install NextChapter…"
			),
			indicator: "blue",
		});
		return false;
	}
	deferred.prompt();
	const choice = await deferred.userChoice;
	next_chapter._pwa.deferred_prompt = null;
	return choice && choice.outcome === "accepted";
};

next_chapter.can_install_pwa = function () {
	const pwa = window.next_chapter._pwa;
	return !!(pwa && pwa.deferred_prompt && !pwa.installed);
};
