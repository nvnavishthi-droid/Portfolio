/* DARK MODE (optional add-on). To remove: delete this file, dark.css and the lines marked "DARK MODE" in index.html. */
(() => {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch {}
  if (saved === "dark") root.classList.add("dark"); // default stays light

  const wire = () => {
    const btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    const sync = () => {
      const dark = root.classList.contains("dark");
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    };
    sync();
    btn.addEventListener("click", () => {
      root.classList.add("theme-anim");
      root.classList.toggle("dark");
      try { localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light"); } catch {}
      sync();
      // re-trigger the icon animation
      btn.querySelectorAll("svg").forEach((s) => { s.style.animation = "none"; void s.offsetWidth; s.style.animation = ""; });
      setTimeout(() => root.classList.remove("theme-anim"), 400);
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
