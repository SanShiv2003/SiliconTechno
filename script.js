/* ==========================================================================
   Silicon Techno Solutions — shared script (vanilla JavaScript, no frameworks)
   ========================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  /* ---------- Active page highlighting ---------- */
  // Each page also sets aria-current in its HTML; this keeps it correct if markup is copied.
  var currentFile = (window.location.pathname.split("/").pop() || "home.html").toLowerCase();
  if (currentFile === "" || currentFile === "index.html") currentFile = "home.html";
  document.querySelectorAll(".nav-list a, .footer-links a").forEach(function (link) {
    var href = (link.getAttribute("href") || "").split("#")[0].split("?")[0].toLowerCase();
    if (href === currentFile) {
      link.setAttribute("aria-current", "page");
    } else if (link.getAttribute("aria-current") === "page") {
      link.removeAttribute("aria-current");
    }
  });

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");

  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setNav(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") === "true" && !nav.contains(e.target) && !toggle.contains(e.target)) {
        setNav(false);
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) setNav(false);
    });
  }

  /* ---------- Header shadow + back-to-top ---------- */
  var header = document.querySelector(".site-header");
  var backToTop = document.querySelector(".back-to-top");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 8);
    if (backToTop) backToTop.classList.toggle("is-visible", y > 500);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      var skipTarget = document.getElementById("main");
      if (skipTarget) skipTarget.focus({ preventScroll: true });
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Projects: category filter ---------- */
  var filterButtons = document.querySelectorAll(".filter-btn");
  var projectCards = document.querySelectorAll(".project-card[data-category]");
  var filterStatus = document.getElementById("filter-status");

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      var shown = 0;
      filterButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      projectCards.forEach(function (card) {
        var match = filter === "all" || card.getAttribute("data-category") === filter;
        card.hidden = !match;
        if (match) shown++;
      });
      if (filterStatus) filterStatus.textContent = shown + (shown === 1 ? " project" : " projects") + " shown";
    });
  });

  /* ---------- Projects: detail panels ---------- */
  function setDetails(btn, open) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
    var label = btn.querySelector(".label");
    if (label) label.textContent = open ? "Hide details" : "View details";
  }
  document.querySelectorAll(".details-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setDetails(btn, btn.getAttribute("aria-expanded") !== "true");
    });
  });
  // Open a project's details when linked directly, e.g. projects.html#project-portal
  if (window.location.hash) {
    var target = document.querySelector(window.location.hash.replace(/[^#\w-]/g, ""));
    if (target && target.classList.contains("project-card")) {
      var btn = target.querySelector(".details-btn");
      if (btn) setDetails(btn, true);
    }
  }

  /* ---------- Contact form: validation + email-client submission ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var OFFICIAL_EMAIL = "silicontechno@gmail.com";
    var statusBox = document.getElementById("form-status");
    var serviceSelect = document.getElementById("enquiry-service");

    // Pre-select a service when arriving from an enquiry link: contact.html?service=internship
    var params = new URLSearchParams(window.location.search);
    var preset = params.get("service");
    if (preset && serviceSelect) {
      var opt = serviceSelect.querySelector('option[value="' + preset.replace(/[^\w-]/g, "") + '"]');
      if (opt) serviceSelect.value = opt.value;
    }

    var rules = {
      "enquiry-name": function (v) {
        if (!v) return "Please enter your full name.";
        if (v.length < 2) return "Name must be at least 2 characters.";
        if (v.length > 80) return "Name must be under 80 characters.";
        if (!/^[A-Za-z][A-Za-z .'-]*$/.test(v)) return "Use letters, spaces, dots, apostrophes or hyphens only.";
        return "";
      },
      "enquiry-phone": function (v) {
        var digits = v.replace(/[\s()-]/g, "");
        if (!v) return "Please enter your phone number.";
        if (!/^(\+91)?[6-9]\d{9}$/.test(digits) && !/^\+\d{8,15}$/.test(digits)) {
          return "Enter a valid 10-digit Indian mobile number, or an international number starting with +.";
        }
        return "";
      },
      "enquiry-email": function (v) {
        if (!v) return "Please enter your email address.";
        if (v.length > 120) return "Email must be under 120 characters.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address, e.g. name@example.com.";
        return "";
      },
      "enquiry-service": function (v) {
        return v ? "" : "Please choose the service you are interested in.";
      },
      "enquiry-message": function (v) {
        if (!v) return "Please write a short message.";
        if (v.length < 15) return "Please add a little more detail (at least 15 characters).";
        if (v.length > 1000) return "Message must be under 1000 characters.";
        return "";
      },
      "enquiry-consent": function (_v, el) {
        return el.checked ? "" : "Please confirm so we can reply to your enquiry.";
      }
    };

    function validateField(el) {
      var rule = rules[el.id];
      if (!rule) return true;
      var value = el.type === "checkbox" ? "" : el.value.trim();
      var message = rule(value, el);
      var field = el.closest(".field") || el.closest(".consent");
      var errorEl = document.getElementById(el.id + "-error");
      if (field) field.classList.toggle("has-error", !!message);
      el.setAttribute("aria-invalid", message ? "true" : "false");
      if (errorEl) errorEl.textContent = message;
      return !message;
    }

    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("blur", function () { validateField(el); });
      el.addEventListener("input", function () {
        if (el.getAttribute("aria-invalid") === "true") validateField(el);
      });
      el.addEventListener("change", function () { validateField(el); });
    });

    var counter = document.getElementById("message-count");
    var messageEl = document.getElementById("enquiry-message");
    if (counter && messageEl) {
      var updateCount = function () { counter.textContent = messageEl.value.length + " / 1000"; };
      messageEl.addEventListener("input", updateCount);
      updateCount();
    }

    function showStatus(type, html) {
      if (!statusBox) return;
      statusBox.className = "form-status is-visible is-" + type;
      statusBox.innerHTML = html;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;
      Object.keys(rules).forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !validateField(el) && !firstInvalid) firstInvalid = el;
      });

      if (firstInvalid) {
        showStatus("error", "Please correct the highlighted fields and try again.");
        firstInvalid.focus();
        return;
      }

      var name = document.getElementById("enquiry-name").value.trim();
      var phone = document.getElementById("enquiry-phone").value.trim();
      var email = document.getElementById("enquiry-email").value.trim();
      var serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;
      var message = messageEl.value.trim();

      var subject = "Website enquiry: " + serviceText + " — " + name;
      var body =
        "Name: " + name + "\n" +
        "Phone: " + phone + "\n" +
        "Email: " + email + "\n" +
        "Service: " + serviceText + "\n\n" +
        "Message:\n" + message + "\n\n" +
        "— Sent from the enquiry form on silicontechnosolutions.com";

      var mailto = "mailto:" + OFFICIAL_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      showStatus(
        "success",
        "Your email app should now open with this enquiry filled in. <strong>Please press Send in your email app</strong> to deliver it. " +
        "If nothing opened, email us directly at <a href=\"mailto:" + OFFICIAL_EMAIL + "\">" + OFFICIAL_EMAIL + "</a>."
      );
      window.location.href = mailto;
    });

    form.addEventListener("reset", function () {
      form.querySelectorAll(".has-error").forEach(function (f) { f.classList.remove("has-error"); });
      form.querySelectorAll(".field-error").forEach(function (f) { f.textContent = ""; });
      form.querySelectorAll("[aria-invalid]").forEach(function (f) { f.setAttribute("aria-invalid", "false"); });
      if (statusBox) statusBox.className = "form-status";
      setTimeout(function () { if (counter && messageEl) counter.textContent = "0 / 1000"; }, 0);
    });
  }
})();
