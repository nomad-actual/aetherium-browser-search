let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let currentIndex = -1;
let items: string[] = [];

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function showSuggestions(suggestions: string[], dropdown: HTMLElement) {
  if (!suggestions || suggestions.length === 0) {
    dropdown.classList.remove("visible");
    dropdown.innerHTML = "";
    items = [];
    currentIndex = -1;
    return;
  }
  items = suggestions;
  dropdown.innerHTML = suggestions.map((item, i) =>
    `<li class="autocomplete-item" data-index="${i}">` +
      `<span class="autocomplete-icon">&#x2315;</span>` +
      `<span class="autocomplete-text">${escapeHtml(item)}</span></li>`
  ).join("");
  dropdown.classList.add("visible");

  dropdown.querySelectorAll<HTMLElement>(".autocomplete-item").forEach(el => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.getAttribute("data-index") || "0", 10);
      const input = document.getElementById("search-input") || document.getElementById("home-search-input");
      if (input && items[idx]) {
        (input as HTMLInputElement).value = items[idx];
        dropdown.classList.remove("visible");
        dropdown.innerHTML = "";
        items = [];
        currentIndex = -1;
        const form = input.closest("form");
        if (form) form.requestSubmit();
      }
    });
  });
}

function hideSuggestions(dropdown: HTMLElement) {
  dropdown.classList.remove("visible");
  dropdown.innerHTML = "";
  items = [];
  currentIndex = -1;
}

function updateActive(index: number, dropdown: HTMLElement) {
  dropdown.querySelectorAll(".autocomplete-item").forEach((el, i) => {
    el.classList.toggle("active", i === index);
  });
}

export function initAutocomplete(isSearchPage: boolean) {
  const inputId = isSearchPage ? "search-input" : "home-search-input";
  const dropdownId = isSearchPage ? "autocomplete-dropdown" : "home-autocomplete-dropdown";

  const input = document.getElementById(inputId) as HTMLInputElement | null;
  const dropdown = document.getElementById(dropdownId) as HTMLElement | null;

  if (!input || !dropdown) return;

  const category = new URLSearchParams(window.location.search).get("category");

  input.addEventListener("input", () => {
    const q = input.value.trim();
    clearTimeout(debounceTimer!);
    if (q.length < 1) {
      hideSuggestions(dropdown);
      return;
    }
    debounceTimer = setTimeout(() => {
      const url = `/autocompleter?q=${encodeURIComponent(q)}` + (category ? `&category=${encodeURIComponent(category)}` : "");
      fetch(url)
        .then(r => r.json())
        .then(data => showSuggestions(data.items || [], dropdown))
        .catch(() => hideSuggestions(dropdown));
    }, isSearchPage ? 50 : 150);
  });

  input.addEventListener("keydown", (e) => {
    if (items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % items.length;
      updateActive(currentIndex, dropdown);
      input.value = items[currentIndex];
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateActive(currentIndex, dropdown);
      input.value = items[currentIndex];
    } else if (e.key === "Enter") {
      if (currentIndex >= 0 && currentIndex < items.length) {
        e.preventDefault();
        input.value = items[currentIndex];
        hideSuggestions(dropdown);
        const form = input.closest("form");
        if (form) form.requestSubmit();
      }
    } else if (e.key === "Escape") {
      hideSuggestions(dropdown);
    }
  });

  document.addEventListener("click", (e) => {
    const selector = isSearchPage ? ".search-form" : ".home form";
    const target = e.target as HTMLElement;
    if (!target.closest(selector)) {
      hideSuggestions(dropdown);
    }
  });
}
