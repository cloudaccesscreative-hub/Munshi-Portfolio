(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Header style on scroll
  const header = $("#header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  const toggle = $("#menuToggle"), links = $("#navLinks");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  $$("a", links).forEach(a => a.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  // Highlight the nav link for the section in view
  const navMap = new Map($$("a", links).map(a => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && navMap.has(e.target.id)) {
        navMap.forEach(a => a.classList.remove("active"));
        navMap.get(e.target.id).classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(s => spy.observe(s));

  // Reveal on scroll
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      reveal.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach(el => reveal.observe(el));

  // Count-up stats
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || "";
      const t0 = performance.now(), dur = 1600;
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString("en-GB") + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  });
  $$("[data-count]").forEach(c => countIO.observe(c));

  // Reel cards: silent preview on hover (desktop)
  const canHover = window.matchMedia("(hover: hover)").matches;
  if (canHover) {
    $$(".reel-card").forEach(card => {
      const v = $("video", card);
      card.addEventListener("mouseenter", () => {
        v.play().then(() => card.classList.add("playing")).catch(() => {});
      });
      card.addEventListener("mouseleave", () => {
        v.pause(); v.currentTime = 0; card.classList.remove("playing");
      });
    });
  }

  // Video modal (plays with sound)
  const modal = $("#videoModal"), frame = $("#modalFrame");
  const heroVideo = $(".phone video");
  let lastFocus = null;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const openModal = el => {
    lastFocus = el;
    const src = (el.dataset.video || "").trim();
    $("#modalTitle").textContent = el.dataset.title || "";
    $("#modalSub").textContent = el.dataset.sub || "";
    frame.classList.toggle("vertical", el.dataset.vertical === "1");

    if (!src) {
      frame.innerHTML = `<div class="modal-empty"><div><strong>Video coming soon</strong>Add a video file or link to this project's <code>data-video</code> attribute.</div></div>`;
    } else if (/\.(mp4|webm|mov)(\?|$)/i.test(src)) {
      frame.innerHTML = `<video src="${esc(src)}" controls autoplay playsinline></video>`;
    } else {
      const url = src + (src.includes("?") ? "&" : "?") + "autoplay=1&rel=0";
      frame.innerHTML = `<iframe src="${esc(url)}" title="${esc(el.dataset.title || "Video")}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    }
    heroVideo && heroVideo.pause();
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    $("#modalClose").focus();
  };
  const closeModal = () => {
    modal.classList.remove("open");
    frame.innerHTML = "";
    document.body.style.overflow = "";
    heroVideo && heroVideo.play().catch(() => {});
    lastFocus && lastFocus.focus();
  };
  $$("[data-video]").forEach(el => {
    el.addEventListener("click", () => openModal(el));
    if (el.getAttribute("role") === "button") {
      el.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(el); }
      });
    }
  });
  $("#modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("open")) closeModal(); });

  // Contact form: open the visitor's email app with the message ready to send
  const form = $("#contactForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = new FormData(form);
    const services = d.getAll("service").join(", ") || "Not specified";
    const name = d.get("name"), org = d.get("org");
    const subject = `Video editing enquiry from ${name}${org ? " (" + org + ")" : ""}`;
    const body =
      `Assalamu alaikum Munshi,\n\n${d.get("message")}\n\n` +
      `Services needed: ${services}\n` +
      `Name: ${name}\n` +
      (org ? `Organisation: ${org}\n` : "");
    window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $("#formSuccess").classList.add("show");
  });

  $("#year").textContent = new Date().getFullYear();
})();
