/* =========================================================
   nuvisco — Digital Craft Studio
   sub-page.js
   3D background, scroll progress, and scroll indicator
   for services, about, and contact pages.
   Requires Three.js loaded before this script.
   ========================================================= */

(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* ---------------------------------------------------------
     1. 3D Background (Three.js)
     A drifting particle field + wireframe icosahedron,
     similar to the homepage.
     --------------------------------------------------------- */
  function init3D() {
    var canvas = document.getElementById("bg3d");
    if (!canvas || typeof THREE === "undefined") return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07070b, 0.06);

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 14);

    // ---- Particles ----
    var count = 800;
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var palette = [
      new THREE.Color(0xff5b2e),
      new THREE.Color(0x7c5cff),
      new THREE.Color(0x2ee6c4),
      new THREE.Color(0xf4f1ea),
    ];

    for (var i = 0; i < count; i++) {
      var i3 = i * 3;
      var radius = 8 + Math.random() * 22;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      var c = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    var pMat = new THREE.PointsMaterial({
      size: 0.08, vertexColors: true, transparent: true,
      opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    var points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // ---- Wireframe icosahedron ----
    var icoGeo = new THREE.IcosahedronGeometry(3.2, 1);
    var wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(icoGeo),
      new THREE.LineBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: 0.25 })
    );
    scene.add(wire);

    var icoInner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.2, 0),
      new THREE.MeshBasicMaterial({ color: 0xff5b2e, wireframe: true, transparent: true, opacity: 0.18 })
    );
    scene.add(icoInner);

    // ---- Mouse parallax ----
    var mouse = { x: 0, y: 0 };
    window.addEventListener("mousemove", function (e) {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // ---- Scroll drift ----
    var scrollY = 0;
    window.addEventListener("scroll", function () { scrollY = window.scrollY; }, { passive: true });

    var clock = new THREE.Clock();
    function animate() {
      var t = clock.getElapsedTime();
      points.rotation.y = t * 0.03 + mouse.x * 0.3;
      points.rotation.x = mouse.y * 0.2;
      wire.rotation.x = t * 0.15;
      wire.rotation.y = t * 0.1;
      icoInner.rotation.x = -t * 0.2;
      icoInner.rotation.z = t * 0.12;
      camera.position.y = -scrollY * 0.0015 + mouse.y * 0.8;
      camera.position.x = mouse.x * 1.2;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener("resize", function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /* ---------------------------------------------------------
     2. Scroll Progress Bar
     --------------------------------------------------------- */
  function initScrollProgress() {
    var bar = document.getElementById("scrollProgress");
    if (!bar) return;

    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (y / h) * 100 : 0;
      bar.style.width = p + "%";
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     3. Scroll Down Indicator
     --------------------------------------------------------- */
  function initScrollIndicator() {
    var indicator = document.querySelector(".hero__scroll");
    if (!indicator) return;

    // Hide indicator when user scrolls past hero
    var hero = document.querySelector(".hero");
    if (!hero) return;

    window.addEventListener("scroll", function () {
      var heroBottom = hero.getBoundingClientRect().bottom;
      if (heroBottom < 0) {
        indicator.style.opacity = "0";
        indicator.style.pointerEvents = "none";
      } else {
        indicator.style.opacity = "1";
        indicator.style.pointerEvents = "auto";
      }
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     4. Toast notification helpers (shared pattern with login page)
     --------------------------------------------------------- */
  var TOAST_ICONS = {
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>'
  };

  function showToast(title, msg, type, duration) {
    var toastEl = document.getElementById("toast");
    if (!toastEl) return;
    type = type || "error";
    duration = duration || 5000;

    var iconEl = toastEl.querySelector(".toast__icon");
    if (iconEl) iconEl.innerHTML = TOAST_ICONS[type] || TOAST_ICONS.error;

    var titleEl = toastEl.querySelector(".toast__title");
    var msgEl = toastEl.querySelector(".toast__msg");
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = msg;

    toastEl.className = "toast toast--" + type;

    var progress = toastEl.querySelector(".toast__progress span");
    if (progress) {
      progress.style.animation = "none";
      void progress.offsetWidth;
      progress.style.animation = "toastProgress " + duration + "ms linear forwards";
    }

    toastEl.classList.add("is-visible");
    toastEl.setAttribute("aria-hidden", "false");

    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
      toastEl.setAttribute("aria-hidden", "true");
    }, duration);
  }

  function shake(el) {
    if (!el) return;
    el.classList.add("is-shake");
    setTimeout(function () {
      el.classList.remove("is-shake");
    }, 450);
  }

  /* ---------------------------------------------------------
     5. Floating label fix — ensures labels float up when inputs have content
     --------------------------------------------------------- */
  function fixLabels() {
    var inputs = document.querySelectorAll('.field input, .field textarea');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.value.trim().length > 0) {
        el.classList.add('has-content');
      }
      el.addEventListener('input', function () {
        if (this.value.trim().length > 0) {
          this.classList.add('has-content');
        } else {
          this.classList.remove('has-content');
        }
      });
    }
  }

  /* ---------------------------------------------------------
     6. Contact form — validates required fields, rate-limited,
        sends data to Formspree via fetch
     --------------------------------------------------------- */
  function initContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;

    // Fix floating labels on page load
    fixLabels();

    // Toast close button
    var toastClose = document.getElementById("toastClose");
    if (toastClose) {
      toastClose.addEventListener("click", function () {
        var toastEl = document.getElementById("toast");
        if (toastEl) {
          toastEl.classList.remove("is-visible");
          toastEl.setAttribute("aria-hidden", "true");
        }
        clearTimeout(window._toastTimer);
      });
    }

    // Rate limiting state
    var formBlockedUntil = 0;
    var FORM_COOLDOWN = 3000; // 3 seconds between submissions

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Rate limit check
      var now = Date.now();
      if (now < formBlockedUntil) {
        showToast("Slow down", "Please wait a moment before sending another message.", "warning", 3000);
        shake(form);
        return;
      }

      // Required field validation
      var requiredFields = form.querySelectorAll("[required]");
      var firstInvalid = null;
      for (var i = 0; i < requiredFields.length; i++) {
        var field = requiredFields[i];
        if (!field.value.trim()) {
          if (!firstInvalid) firstInvalid = field;
        }
      }

      if (firstInvalid) {
        var label = form.querySelector('label[for="' + firstInvalid.id + '"]');
        var fieldName = label ? label.textContent : "This field";
        showToast("Required", fieldName + " is required. Please fill it in.", "warning", 4000);
        shake(firstInvalid);
        firstInvalid.focus();
        return;
      }

      formBlockedUntil = now + FORM_COOLDOWN;

      var btn = form.querySelector("button");
      var btnSpan = btn ? btn.querySelector("span") : null;
      var original = btnSpan ? btnSpan.textContent : "";
      if (btn) btn.disabled = true;
      if (btnSpan) btnSpan.textContent = "Sending…";

      try {
        var data = new FormData(form);
        var response = await fetch(form.action, {
          method: form.method,
          body: data,
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          if (btnSpan) btnSpan.textContent = "Sent! ✓";
          form.reset();
          showToast("Message sent", "We'll get back to you within one business day.", "success", 5000);
        } else {
          if (btnSpan) btnSpan.textContent = "Oops — try again";
          showToast("Couldn't send", "Something went wrong. Please try again.", "error", 5000);
        }
      } catch (err) {
        if (btnSpan) btnSpan.textContent = "Oops — try again";
        showToast("Network error", "Couldn't reach our server. Please check your connection.", "error", 5000);
      }

      setTimeout(function () {
        if (btn) btn.disabled = false;
        if (btnSpan) btnSpan.textContent = original;
      }, 3000);
    });
  }

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  init3D();
  initScrollProgress();
  initScrollIndicator();
  initContactForm();
})();