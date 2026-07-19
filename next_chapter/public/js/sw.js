/* NextChapter service worker — minimal fetch handler for installability.
   Desk/API traffic is network-only (auth + live writing data). */

self.addEventListener("install", (event) => {
	self.skipWaiting();
	event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
	event.respondWith(
		fetch(event.request).catch(() =>
			new Response("NextChapter is offline. Reconnect to keep writing.", {
				status: 503,
				statusText: "Service Unavailable",
				headers: { "Content-Type": "text/plain; charset=utf-8" },
			})
		)
	);
});
