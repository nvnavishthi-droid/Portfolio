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
  const items = [...document.querySelectorAll(targets)].filter((el) => !el.matches(".hero-copy > h1, .hero-copy > .tagline"));
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

  // ---------- Optional hero cursor light (behind text, never over the portrait) ----------
  const heroCopy = document.querySelector(".hero-copy");
  if (heroCopy && fine && !reduced) {
    let heroFrame = 0, cursorX = 0, cursorY = 0;
    heroCopy.addEventListener("pointermove", (event) => {
      cursorX = event.clientX; cursorY = event.clientY;
      if (heroFrame) return;
      heroFrame = requestAnimationFrame(() => {
        heroFrame = 0;
        const rect = heroCopy.getBoundingClientRect();
        heroCopy.style.setProperty("--x", `${cursorX - rect.left}px`);
        heroCopy.style.setProperty("--y", `${cursorY - rect.top + 24}px`);
        heroCopy.classList.add("is-spotlit");
      });
    });
    heroCopy.addEventListener("pointerleave", () => {
      cancelAnimationFrame(heroFrame); heroFrame = 0;
      heroCopy.classList.remove("is-spotlit");
    });
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

  // ---------- Project details pop-up ----------
  const dlg = document.getElementById("project-dialog");
  if (dlg && typeof dlg.showModal === "function") {
    const content = dlg.querySelector(".pd-content");
    // same 3D tilt, glow border and spotlight as every other box (mouse and touch)
    const boxFx = (card) => {
      card.classList.add("gb", "spot");
      if (reduced) return;
      card.classList.add("tilt");
      const MAXD = fine ? 7 : 8;
      let raf = 0, endTimer = 0;
      const apply = (cx, cy) => {
        const r = card.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (cx - r.left) / r.width)) - 0.5;
        const py = Math.min(1, Math.max(0, (cy - r.top) / r.height)) - 0.5;
        card.style.setProperty("--mx", `${cx - r.left}px`);
        card.style.setProperty("--my", `${cy - r.top}px`);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.classList.add(fine ? "is-tilting" : "is-touching"); card.classList.remove("is-resting");
          card.style.transform = `perspective(900px) rotateX(${(-py * MAXD).toFixed(2)}deg) rotateY(${(px * MAXD).toFixed(2)}deg) translateY(-4px)`;
        });
      };
      const reset = () => { cancelAnimationFrame(raf); card.classList.remove("is-tilting", "is-touching"); card.classList.add("is-resting"); card.style.transform = ""; };
      if (fine) {
        card.addEventListener("pointermove", (e) => apply(e.clientX, e.clientY));
        card.addEventListener("pointerleave", reset);
      } else {
        card.addEventListener("touchstart", (e) => { clearTimeout(endTimer); apply(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
        card.addEventListener("touchmove", (e) => apply(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
        const rel = () => { clearTimeout(endTimer); endTimer = setTimeout(reset, 220); };
        card.addEventListener("touchend", rel, { passive: true });
        card.addEventListener("touchcancel", rel, { passive: true });
      }
    };
    // Run the workflow indicator once when the workflow enters the scrollable pop-up.
    let flowObserver = null, flowResize = null;
    const watchWorkflow = () => {
      if (flowObserver) flowObserver.disconnect();
      if (flowResize) flowResize.disconnect();
      flowObserver = null; flowResize = null;
      const flow = content.querySelector(".pd-flow");
      if (!flow || reduced) return;
      const measure = () => flow.style.setProperty("--flow-distance", `${flow.clientWidth * .75}px`);
      measure();
      if ("ResizeObserver" in window) {
        flowResize = new ResizeObserver(measure);
        flowResize.observe(flow);
      }
      if (!("IntersectionObserver" in window)) { flow.classList.add("is-flowing"); return; }
      const observer = new IntersectionObserver((entries) => {
        if (!dlg.open || !flow.isConnected || !entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= .6)) return;
        flow.classList.add("is-flowing");
        observer.disconnect();
      }, { root: content, threshold: .6 });
      flowObserver = observer;
      observer.observe(flow);
    };

    let pushed = false;
    let triggerAnimation = null;
    const open = (id, push = true) => {
      if (triggerAnimation) { triggerAnimation.cancel(); triggerAnimation = null; }
      const tpl = document.getElementById("pd-" + id);
      if (!tpl) return;
      content.replaceChildren(tpl.content.cloneNode(true));
      const small = matchMedia("(max-width: 640px)").matches;
      content.querySelectorAll(small ? ".pd-facts" : ".pd-facts div").forEach(boxFx);
      content.querySelectorAll(".pd-flow-box").forEach(boxFx);
      if (!dlg.open) dlg.showModal();
      dlg.scrollTop = 0; content.scrollTop = 0;
      root.classList.add("pd-open");
      watchWorkflow();
      if (push) { history.pushState({ pd: id }, "", "#project-" + id); pushed = true; }
      else pushed = false;
    };
    const close = () => { if (dlg.open) dlg.close(); };
    dlg.addEventListener("close", () => {
      if (flowObserver) flowObserver.disconnect();
      if (flowResize) flowResize.disconnect();
      dlg.classList.remove("pd-from-flip");
      root.classList.remove("pd-open");
      if (location.hash.startsWith("#project-")) {
        if (pushed) { pushed = false; history.back(); }
        else history.replaceState(null, "", location.pathname + location.search);
      }
    });
    dlg.querySelector(".pd-close").addEventListener("click", close);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); }); // click on the backdrop
    document.querySelectorAll(".btn-details").forEach((b) => b.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (triggerAnimation) return;
      if (reduced || typeof b.animate !== "function") { open(b.dataset.project); return; }
      const card = b.closest(".project");
      const bounds = card.getBoundingClientRect(), button = b.getBoundingClientRect();
      const diameter = Math.hypot(card.clientWidth, card.clientHeight) * 2;
      const ripple = document.createElement("span");
      ripple.className = "project-ripple";
      ripple.setAttribute("aria-hidden", "true");
      Object.assign(ripple.style, {
        width: `${diameter}px`, height: `${diameter}px`,
        left: `${(button.left + button.width / 2 - bounds.left) * card.offsetWidth / bounds.width - diameter / 2}px`,
        top: `${(button.top + button.height / 2 - bounds.top) * card.offsetHeight / bounds.height - diameter / 2}px`
      });
      card.append(ripple);
      b.classList.add("is-opening");
      card.classList.add("is-opening");
      const rippleAnimation = triggerAnimation = ripple.animate([
        { transform: "scale(.02)", opacity: .24 },
        { opacity: .16, offset: .65 },
        { transform: "scale(1)", opacity: 0 }
      ], { duration: 460, easing: "cubic-bezier(0.2, 0.6, 0.35, 1)" });
      const cancelRipple = () => rippleAnimation.cancel();
      const escapeRipple = (event) => { if (event.key === "Escape") cancelRipple(); };
      window.addEventListener("resize", cancelRipple, { once: true });
      window.addEventListener("keydown", escapeRipple);
      try { await rippleAnimation.finished; }
      catch { return; }
      finally {
        window.removeEventListener("resize", cancelRipple);
        window.removeEventListener("keydown", escapeRipple);
        ripple.remove();
        b.classList.remove("is-opening"); card.classList.remove("is-opening");
        if (triggerAnimation === rippleAnimation) triggerAnimation = null;
      }
      const stage = document.createElement("dialog");
      stage.className = "pf-stage";
      stage.setAttribute("aria-label", "Opening project details");
      stage.tabIndex = -1;
      const preview = document.createElement("div");
      preview.className = "pd pf-measure";
      preview.inert = true;
      preview.setAttribute("aria-hidden", "true");
      const details = document.createElement("div");
      details.className = "pd-content";
      details.append(document.getElementById("pd-" + b.dataset.project).content.cloneNode(true));
      preview.append(dlg.querySelector(".pd-close").cloneNode(true), details);
      preview.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      document.body.append(preview);
      const target = preview.getBoundingClientRect();
      preview.className = "pd pc-modal";
      Object.assign(preview.style, {
        left: `${(innerWidth - target.width) / 2}px`, top: `${(innerHeight - target.height) / 2}px`,
        width: `${target.width}px`, height: `${target.height}px`
      });
      const size = innerWidth <= 640 ? 56 : 72;
      const visual = document.createElement("div");
      visual.className = "pc-visual";
      const net = document.createElement("div");
      net.className = "pc-net";
      net.setAttribute("aria-hidden", "true");
      net.inert = true;
      net.style.setProperty("--cube-size", `${size}px`);
      Object.assign(net.style, { left: `${(innerWidth - size) / 2}px`, top: `${(innerHeight - size) / 2}px` });
      const core = document.createElement("div");
      core.className = "pc-core";
      const face = () => { const el = document.createElement("div"); el.className = "pc-face"; return el; };
      const front = face();
      const mark = document.createElement("span");
      mark.className = "pc-mark";
      mark.textContent = "NV";
      front.append(mark);
      core.append(front);
      const hinges = [];
      const hinge = (parent, side, rotation) => {
        const el = document.createElement("div");
        el.className = "pc-hinge pc-" + side;
        el.style.transform = rotation;
        el.append(face()); parent.append(el);
        hinges.push({ el, rotation });
        return el;
      };
      const lid = hinge(core, "top", "rotateX(90deg)");
      hinge(core, "bottom", "rotateX(-90deg)");
      hinge(core, "left", "rotateY(-90deg)");
      hinge(core, "right", "rotateY(90deg)");
      hinge(lid, "top", "rotateX(90deg)");
      net.append(core);
      visual.append(net);
      stage.append(visual, preview);
      document.body.append(stage);
      root.classList.add("pd-open");
      stage.showModal();
      const ease = "cubic-bezier(0.22, 0.8, 0.25, 1)";
      const small = `scale(${size / target.width}, ${size / target.height})`;
      const animations = [
        net.animate([
          { transform: "perspective(1000px) translate3d(-24px, 18px, 0) rotateX(-28deg) rotateY(-38deg) rotateZ(-12deg) scale(.8)" },
          { transform: "perspective(1000px) translate3d(12px, -10px, 0) rotateX(-300deg) rotateY(300deg) rotateZ(14deg) scale(1.08)", offset: .65 },
          { transform: "perspective(1000px) translate3d(0, 0, 0) rotateX(-360deg) rotateY(360deg) rotateZ(0deg) scale(1)" }
        ], { duration: 300, delay: 60, easing: ease, fill: "both" }),
        core.animate([{ transform: `translateZ(${size / 2}px)` }, { transform: "translateZ(0px)" }], { duration: 180, delay: 340, easing: ease, fill: "both" }),
        visual.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, delay: 500, fill: "forwards" }),
        mark.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100, delay: 440, fill: "forwards" })
      ];
      hinges.forEach(({ el, rotation }) => animations.push(el.animate([
        { transform: rotation }, { transform: "rotateX(0deg) rotateY(0deg)" }
      ], { duration: 180, delay: 340, easing: ease, fill: "both" })));
      const expansion = triggerAnimation = preview.animate([
        { transform: small, opacity: 0 },
        { transform: small, opacity: 1, offset: .08 },
        { transform: "scale(1, 1)", opacity: 1 }
      ], { duration: 200, delay: 500, easing: ease, fill: "both" });
      animations.push(expansion);
      const cancel = () => expansion.cancel();
      stage.addEventListener("cancel", (event) => { event.preventDefault(); cancel(); });
      window.addEventListener("resize", cancel, { once: true });
      const cleanup = () => {
        window.removeEventListener("resize", cancel);
        stage.close(); stage.remove(); ripple.remove();
        animations.forEach((animation) => animation.cancel());
        b.classList.remove("is-opening"); card.classList.remove("is-opening");
        if (triggerAnimation === expansion) triggerAnimation = null;
        if (!dlg.open) root.classList.remove("pd-open");
        b.focus({ preventScroll: true });
      };
      expansion.finished.then(() => {
        cleanup();
        dlg.classList.add("pd-from-flip");
        open(b.dataset.project);
      }, cleanup);
    }));
    // clicking anywhere on a card (except its links and buttons) also opens it
    document.querySelectorAll(".project").forEach((card) => {
      card.classList.add("is-clickable");
      card.addEventListener("click", (e) => { if (e.target.closest("a, button")) return; open(card.id); });
    });
    window.addEventListener("popstate", () => {
      if (triggerAnimation) { triggerAnimation.cancel(); triggerAnimation = null; }
      const m = location.hash.match(/^#project-(\w+)/);
      if (m) open(m[1], false); else if (dlg.open) { pushed = false; dlg.close(); }
    });
    const m = location.hash.match(/^#project-(\w+)/);
    if (m) open(m[1], false);
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
