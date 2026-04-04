import { API_BASE } from "~/lib/config";

const queue: { event: string; meta?: Record<string, unknown> }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (queue.length === 0) return;
  const events = queue.splice(0);
  const body = JSON.stringify({ events });
  // Use sendBeacon for reliability on page unload, fall back to fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon(`${API_BASE}/events`, new Blob([body], { type: "application/json" }));
  } else {
    fetch(`${API_BASE}/events`, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

export function track(event: string, meta?: Record<string, unknown>) {
  queue.push({ event, meta });
  if (queue.length >= 10) {
    flush();
  } else {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 5000);
  }
}
