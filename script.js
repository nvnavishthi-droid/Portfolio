(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---------- Scroll reveal (every block on the page) ----------
  const targets = [
    ".hero-copy > *", ".hero-photo", ".stat",
    ".section-head > *", ".about-grid > div > *", ".facts li",
    ".job", ".project", ".skill-card", ".cp-card", ".cert", ".cert-head", ".edu li", ".stack-band",
    ".cta-copy > *", ".cta-actions > *"
  ].join(",");
  const items = [...document.querySelectorAll(targets)];
  items.forEach((el) => {
    el.classList.add("reveal");
    const sibs = [...el.parentElement.children].filter((c) => c.matches(targets));
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 6));
  });
  const lines = document.querySelectorAll(".timeline, .edu");
  if (root.classList.contains("js-reveal")) {
    root.classList.add("reveal-ready");
    const ro = new IntersectionObserver((entries) => {
      // Plays once: in when it first enters the viewport, then stays.
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        ro.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach((el) => ro.observe(el));
    lines.forEach((el) => ro.observe(el));
  }

  // ---------- Count-up for the hero figures ----------
  const counters = document.querySelectorAll(".stat dd, .cp-num");
  const countUp = (el) => {
    if (!el.dataset.final) el.dataset.final = el.textContent.trim();
    const final = el.dataset.final;
    if (el._raf) cancelAnimationFrame(el._raf);
    const m = final.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    const target = parseFloat(m[1].replace(/,/g, ""));
    const decimals = (m[1].split(".")[1] || "").length;
    const commas = m[1].includes(",");
    const start = performance.now(), dur = 1400;
    el.setAttribute("aria-label", final);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const v = target * (1 - Math.pow(1 - t, 3));
      let txt = v.toFixed(decimals);
      if (commas) txt = Number(txt).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      el.textContent = (t < 1 ? txt : m[1]) + m[2];
      if (t < 1) el._raf = requestAnimationFrame(tick);
    };
    el._raf = requestAnimationFrame(tick);
  };
  if (!reduced && !/[?&]still\b/.test(location.search) && "IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); } });
    }, { threshold: 0 });
    counters.forEach((c) => co.observe(c));
  }

  // ---------- Card spotlight following the pointer ----------
  if (fine) {
    document.querySelectorAll(".project, .skill-card, .cp-card, .cert, .stat, .facts li, .job-card, .edu-card").forEach((card) => {
      card.classList.add("spot");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  // ---------- Gradient borders and 3D tilt on cards ----------
  document.querySelectorAll(".project, .skill-card, .cp-card, .cert, .stat, .facts li, .job-card, .edu-card").forEach((c) => c.classList.add("gb"));
  const cta = document.querySelector(".cta"); if (cta) cta.classList.add("gb");
  if (fine && !reduced) {
    const MAX = 7; // degrees
    document.querySelectorAll(".project, .skill-card, .cp-card, .cert, .stat, .facts li, .job-card, .edu-card").forEach((card) => {
      card.classList.add("tilt");
      let raf = 0;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.classList.add("is-tilting"); card.classList.remove("is-resting");
          card.style.transform = `perspective(900px) rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg) translateY(-4px)`;
        });
      });
      card.addEventListener("pointerleave", () => {
        cancelAnimationFrame(raf);
        card.classList.remove("is-tilting"); card.classList.add("is-resting");
        card.style.transform = "";
      });
    });
  }

  // ---------- Touch screens: same 3D tilt, glow border and spotlight while a finger is on a card ----------
  if (!fine && !reduced && ("ontouchstart" in window || navigator.maxTouchPoints > 0)) {
    const MAXT = 8; // degrees
    document.querySelectorAll(".project, .skill-card, .cp-card, .cert, .stat, .facts li, .job-card, .edu-card").forEach((card) => {
      card.classList.add("tilt", "spot");
      let raf = 0, endTimer = 0;
      const tilt = (t) => {
        const r = card.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (t.clientX - r.left) / r.width)) - 0.5;
        const py = Math.min(1, Math.max(0, (t.clientY - r.top) / r.height)) - 0.5;
        card.style.setProperty("--mx", `${t.clientX - r.left}px`);
        card.style.setProperty("--my", `${t.clientY - r.top}px`);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.classList.add("is-touching"); card.classList.remove("is-resting");
          card.style.transform = `perspective(900px) rotateX(${(-py * MAXT).toFixed(2)}deg) rotateY(${(px * MAXT).toFixed(2)}deg) translateY(-4px)`;
        });
      };
      const release = () => {
        clearTimeout(endTimer);
        endTimer = setTimeout(() => {
          cancelAnimationFrame(raf);
          card.classList.remove("is-touching"); card.classList.add("is-resting");
          card.style.transform = "";
        }, 220);
      };
      card.addEventListener("touchstart", (e) => { clearTimeout(endTimer); tilt(e.touches[0]); }, { passive: true });
      card.addEventListener("touchmove", (e) => tilt(e.touches[0]), { passive: true });
      card.addEventListener("touchend", release, { passive: true });
      card.addEventListener("touchcancel", release, { passive: true });
    });
  }

  // ---------- Copy email button ----------
  const copyBtn = document.querySelector(".copy-btn");
  if (copyBtn) {
    const label = copyBtn.querySelector(".copy-label");
    const status = document.getElementById("copy-status");
    let timer = 0;
    const fallbackCopy = (text) => {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch {}
      ta.remove(); return ok;
    };
    copyBtn.addEventListener("click", async () => {
      const text = copyBtn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = fallbackCopy(text); }
      label.textContent = ok ? "Copied" : "Press Ctrl+C";
      copyBtn.classList.toggle("is-copied", ok);
      if (status) status.textContent = ok ? "Email address copied" : "";
      clearTimeout(timer);
      timer = setTimeout(() => { label.textContent = "Copy"; copyBtn.classList.remove("is-copied"); if (status) status.textContent = ""; }, 2200);
    });
  }

  // ---------- Scroll progress and back-to-top ----------
  const bar = document.querySelector(".progress span");
  const toTop = document.querySelector(".to-top");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      if (bar) bar.style.setProperty("--p", p.toFixed(4));
      if (toTop) toTop.classList.toggle("is-on", scrollY > innerHeight * 0.8);
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Highlight the section in view in the top navigation ----------
  const navLinks = [...document.querySelectorAll(".nav a")];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => {
        if (a.getAttribute("href") === "#" + en.target.id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => io.observe(s));
})();
