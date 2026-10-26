// Nicola Grillo — personal site interactions
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Nav scroll state ---------- */
  var nav = document.querySelector(".nav");
  var onScroll = function () {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 10);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.querySelector(".mobile-panel");
  var backdrop = document.querySelector(".mobile-backdrop");
  function closeMenu() {
    if (!panel) return;
    panel.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      backdrop.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    backdrop.addEventListener("click", closeMenu);
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }

  /* ---------- Active section highlighting ---------- */
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll(".nav-links a[href^='#']");
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.getAttribute("id");
          navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var ro = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            ro.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--i", i % 6);
      ro.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Stat count-up ---------- */
  var counters = document.querySelectorAll("[data-count-to]");
  if (counters.length) {
    var animateCount = function (el) {
      var target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var start = null;
      var duration = 1100;
      var step = function (ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      var countObs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              countObs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (c) { countObs.observe(c); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---------- Contact form (direct delivery via FormSubmit, no visible email) ---------- */
  var contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    var statusEl = contactForm.querySelector("[data-form-status]");
    var statusDefault = statusEl ? statusEl.textContent : "";
    var submitBtn = contactForm.querySelector("button[type=submit]");
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitBtn) submitBtn.disabled = true;
      if (statusEl) statusEl.textContent = contactForm.dataset.sending || statusDefault;
      fetch(contactForm.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(contactForm)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("bad status " + res.status);
          return res.json();
        })
        .then(function (data) {
          if (data && (data.success === false || data.success === "false")) {
            throw new Error(data.message || "not active");
          }
          if (statusEl) statusEl.textContent = contactForm.dataset.success || statusDefault;
          contactForm.reset();
        })
        .catch(function () {
          if (statusEl) statusEl.textContent = contactForm.dataset.error || statusDefault;
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* ---------- Language proficiency bars ---------- */
  var bars = document.querySelectorAll(".lang-bar-fill");
  if (bars.length && "IntersectionObserver" in window) {
    var barObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.width = entry.target.dataset.fill || "0%";
            barObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    bars.forEach(function (b) { barObs.observe(b); });
  }

  /* ---------- Timeline accordion ---------- */
  var tlItems = document.querySelectorAll(".tl-item");
  tlItems.forEach(function (item, idx) {
    var head = item.querySelector(".tl-head");
    if (!head) return;
    head.setAttribute("aria-expanded", idx === 0 ? "true" : "false");
    if (idx === 0) item.classList.add("is-open");
    head.addEventListener("click", function () {
      var willOpen = !item.classList.contains("is-open");
      item.classList.toggle("is-open", willOpen);
      head.setAttribute("aria-expanded", String(willOpen));
    });
  });

  /* ---------- Social share ---------- */
  var shareRow = document.querySelector("[data-share]");
  if (shareRow) {
    var pageUrl = window.location.href;
    var pageTitle = document.title;
    var xBtn = shareRow.querySelector("[data-share-x]");
    var liBtn = shareRow.querySelector("[data-share-linkedin]");
    var waBtn = shareRow.querySelector("[data-share-whatsapp]");
    var copyBtn = shareRow.querySelector("[data-share-copy]");
    if (xBtn) xBtn.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(pageTitle) + "&url=" + encodeURIComponent(pageUrl);
    if (liBtn) liBtn.href = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(pageUrl);
    if (waBtn) waBtn.href = "https://wa.me/?text=" + encodeURIComponent(pageTitle + " " + pageUrl);
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var done = function () {
          var original = copyBtn.innerHTML;
          copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12.5 10 17 19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          setTimeout(function () { copyBtn.innerHTML = original; }, 1800);
        };
        if (navigator.clipboard) {
          navigator.clipboard.writeText(pageUrl).then(done).catch(function () {});
        }
      });
    }
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Back to top ---------- */
  var toTop = document.querySelector(".to-top");
  if (toTop) {
    toTop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  if (reduceMotion || !isFinePointer) return; // skip decorative-only motion below

  /* ---------- Custom cursor ---------- */
  var dot = document.querySelector(".cursor-dot");
  var ring = document.querySelector(".cursor-ring");
  if (dot && ring) {
    var mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    });
    (function raf() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(raf);
    })();
    document.querySelectorAll("a, button, .tl-head").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-active"); });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll(".magnetic").forEach(function (el) {
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      el.style.transform = "translate(" + x * 0.22 + "px," + y * 0.3 + "px)";
    });
    el.addEventListener("mouseleave", function () {
      el.style.transform = "translate(0,0)";
    });
  });

  /* ---------- Hero blob parallax ---------- */
  var ambience = document.querySelector(".ambience");
  if (ambience) {
    document.addEventListener("mousemove", function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 2;
      var y = (e.clientY / window.innerHeight - 0.5) * 2;
      ambience.style.transform = "translate(" + x * 12 + "px," + y * 12 + "px)";
    });
  }
})();
