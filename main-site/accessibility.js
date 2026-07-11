/* =========================================================
   nuvisco — Digital Craft Studio
   accessibility.js
   Keyboard navigation, focus management, and ARIA helpers.
   Load on all pages to ensure ADA compliance.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. Skip-to-content link
     Dynamically injected if not present in markup.
     Allows keyboard users to bypass repetitive nav.
     --------------------------------------------------------- */
  function ensureSkipLink() {
    if (document.getElementById("skipToContent")) return;
    const skip = document.createElement("a");
    skip.id = "skipToContent";
    skip.className = "skip-to-content";
    skip.href = "#main-content";
    skip.textContent = "Skip to main content";
    document.body.insertBefore(skip, document.body.firstChild);

    // Ensure main content has the id
    const main = document.querySelector("main") || document.querySelector("[role='main']");
    if (main && !main.id) main.id = "main-content";
  }

  /* ---------------------------------------------------------
     2. Keyboard trap for modals / dialogs
     When a modal is open, Tab and Shift+Tab cycle within it.
     --------------------------------------------------------- */
  function trapFocus(container) {
    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    container.addEventListener("keydown", function handler(e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------------------------------------------------------
     3. Modal open/close helpers
     --------------------------------------------------------- */
  function openModal(modal) {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");

    // Focus the first focusable element inside
    const first = modal.querySelector(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (first) first.focus();

    // Trap focus
    trapFocus(modal);

    // Store previously focused element
    modal._prevFocus = document.activeElement;

    // Close on Escape
    modal.addEventListener("keydown", function closeOnEsc(e) {
      if (e.key === "Escape") closeModal(modal);
    });
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("is-open");

    // Return focus to the element that opened the modal
    if (modal._prevFocus) modal._prevFocus.focus();
  }

  /* ---------------------------------------------------------
     4. Flip card keyboard accessibility
     Flippable cards should toggle on Enter/Space
     --------------------------------------------------------- */
  function initFlipCards() {
    document.querySelectorAll("[data-flip]").forEach(function (card) {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-pressed", "false");

      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.classList.toggle("is-flipped");
          const flipped = this.classList.contains("is-flipped");
          this.setAttribute("aria-pressed", flipped ? "true" : "false");
        }
      });
    });
  }

  /* ---------------------------------------------------------
     5. Smooth scroll for anchor links with focus management
     --------------------------------------------------------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");
        if (!targetId || targetId === "#") return;
        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });

        // Move focus to the target for screen readers
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ---------------------------------------------------------
     6. Details/Summary keyboard enhancement
     Ensure <details> can be toggled with keyboard
     --------------------------------------------------------- */
  function initDetails() {
    document.querySelectorAll("details summary").forEach(function (summary) {
      summary.setAttribute("tabindex", "0");
      summary.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const details = this.closest("details");
          if (details) details.open = !details.open;
        }
      });
    });
  }

  /* ---------------------------------------------------------
     7. Announce dynamic content changes to screen readers
     --------------------------------------------------------- */
  function createLiveRegion() {
    if (document.getElementById("a11y-live-region")) return;
    const region = document.createElement("div");
    region.id = "a11y-live-region";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.className = "sr-only";
    document.body.appendChild(region);
  }

  function announce(message) {
    const region = document.getElementById("a11y-live-region");
    if (region) {
      region.textContent = "";
      requestAnimationFrame(function () {
        region.textContent = message;
      });
    }
  }

  /* ---------------------------------------------------------
     8. Expose custom cursor hover state to screen readers
     --------------------------------------------------------- */
  function initHoverAnnouncements() {
    document.querySelectorAll("[data-magnetic], a, button, .flipcard").forEach(function (el) {
      if (el.hasAttribute("data-a11y-hover")) return;
      el.setAttribute("data-a11y-hover", "true");

      el.addEventListener("mouseenter", function () {
        this.classList.add("is-hovered");
      });
      el.addEventListener("mouseleave", function () {
        this.classList.remove("is-hovered");
      });
      el.addEventListener("focus", function () {
        this.classList.add("is-focused");
      });
      el.addEventListener("blur", function () {
        this.classList.remove("is-focused");
      });
    });
  }

  /* ---------------------------------------------------------
     9. Marquee pause on focus for accessibility
     --------------------------------------------------------- */
  function initMarqueeAccessibility() {
    document.querySelectorAll(".marquee__track, .hero__marquee").forEach(function (el) {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "marquee");
      el.setAttribute("aria-label", el.textContent.trim().substring(0, 100) + " — scrolling announcement");
    });
  }

  /* ---------------------------------------------------------
     10. Hamburger menu (mobile)
     Injects hamburger button + mobile nav overlay if not present.
     --------------------------------------------------------- */
  function initHamburger() {
    const nav = document.querySelector(".nav__inner");
    if (!nav) return;
    if (document.querySelector(".nav__hamburger")) return;

    // Get nav links content
    const navLinks = document.querySelector(".nav__links");
    if (!navLinks) return;

    // Create hamburger button
    const btn = document.createElement("button");
    btn.className = "nav__hamburger";
    btn.setAttribute("aria-label", "Toggle navigation menu");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "<span></span><span></span><span></span>";

    // Insert after nav__actions or at end of nav__inner
    const actions = nav.querySelector(".nav__actions");
    if (actions) {
      actions.parentNode.insertBefore(btn, actions.nextSibling);
    } else {
      nav.appendChild(btn);
    }

    // Get the links HTML for the mobile overlay
    const linksHTML = navLinks.innerHTML;

    // Create mobile overlay
    const mobile = document.createElement("div");
    mobile.className = "nav__mobile";
    mobile.setAttribute("role", "dialog");
    mobile.setAttribute("aria-modal", "true");
    mobile.setAttribute("aria-label", "Navigation menu");
    mobile.innerHTML = linksHTML;

    // Insert after the header
    const header = document.querySelector("header.nav");
    if (header) header.parentNode.insertBefore(mobile, header.nextSibling);

    // Toggle logic
    btn.addEventListener("click", function () {
      const open = this.classList.toggle("is-active");
      mobile.classList.toggle("is-open", open);
      this.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });

    // Close on link click
    mobile.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        btn.classList.remove("is-active");
        mobile.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobile.classList.contains("is-open")) {
        btn.classList.remove("is-active");
        mobile.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        btn.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     11. Init all
     --------------------------------------------------------- */
  function init() {
    ensureSkipLink();
    createLiveRegion();
    initFlipCards();
    initSmoothScroll();
    initDetails();
    initHoverAnnouncements();
    initMarqueeAccessibility();
    initHamburger();

    // Expose modal helpers globally
    window.a11y = {
      openModal: openModal,
      closeModal: closeModal,
      announce: announce,
      trapFocus: trapFocus,
    };
  }

  // Run on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();