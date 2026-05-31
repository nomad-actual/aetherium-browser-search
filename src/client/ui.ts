const THEMES = ["gruvbox", "tokyonight", "dark-aero"] as const;

function getCookie(name: string): string | null {
  const cookies = document.cookie.split("; ");
  for (const c of cookies) {
    const [key, ...valParts] = c.split("=");
    if (key === name) return valParts.join("=");
  }
  return null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000`;
}

export function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function applyTheme(name: string) {
  if (!THEMES.includes(name as typeof THEMES[number])) {
    name = "gruvbox";
  }
  document.body.setAttribute("data-theme", name);
  setCookie("aetherium-theme", name);

  document.querySelectorAll(".dropdown-item").forEach(el => {
    el.classList.toggle("active", el.getAttribute("data-theme") === name);
  });

  document.querySelectorAll(".theme-dot").forEach(el => {
    el.classList.toggle("active", el.getAttribute("data-theme") === name);
  });
}

export function initTheme() {
  requestAnimationFrame(() => {
    const stored = getCookie("aetherium-theme") || "gruvbox";
    applyTheme(stored);

    document.querySelectorAll<HTMLElement>(".theme-toggle").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const dd = document.getElementById("theme-dropdown");
        if (dd) {
          document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("open"));
          dd.classList.toggle("open");
        }
        e.stopPropagation();
      });
    });

    document.querySelectorAll<HTMLElement>(".dropdown-item").forEach(item => {
      item.addEventListener("click", (e) => {
        applyTheme(item.getAttribute("data-theme") || "gruvbox");
        document.getElementById("theme-dropdown")?.classList.remove("open");
        e.stopPropagation();
      });
    });

    document.querySelectorAll<HTMLElement>(".theme-dot").forEach(dot => {
      dot.addEventListener("click", (e) => {
        applyTheme(dot.getAttribute("data-theme") || "gruvbox");
        document.getElementById("theme-dropdown")?.classList.remove("open");
        e.stopPropagation();
      });
    });

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".dropdown-wrap") && !target.closest(".theme-toggle")) {
        document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("open"));
      }
    });
  });
}

