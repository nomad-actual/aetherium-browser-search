import { renderSearchPage, initSSE, renderHome } from "./search.js";

const params = new URLSearchParams(window.location.search);
const q = params.get("q");

if (q) {
  fetch(`/api/search?q=${encodeURIComponent(q)}` + (params.toString() ? "&" + Array.from(params.entries()).filter(([k]) => k !== "q").map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&") : ""))
    .then((r) => r.json())
    .then((data) => {
      renderSearchPage(data.query, data.results, data.error, params.get("category") || undefined);
      if (data.aiOverviewEnabled && !data.error) {
        initSSE(params);
      }
    })
    .catch(() => {
      renderSearchPage(q, [], "Failed to load search results", undefined);
    });
} else {
  renderHome();
}
