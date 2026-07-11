/* =========================================================
   nuvisco — Client Login
   login-page.js
   ========================================================= */

(function () {
  "use strict";

  // --- Rate limiting state ---
  var loginAttempts = 0;
  var loginBlockedUntil = 0;
  var LOGIN_THROTTLE_WINDOW = 1000; // 1 second minimum between attempts
  var LOGIN_BLOCK_ATTEMPTS = 5;     // block after 5 failed attempts
  var LOGIN_BLOCK_DURATION = 30000; // 30 second block

  function isLoginBlocked() {
    var now = Date.now();
    if (now < loginBlockedUntil) {
      var remaining = Math.ceil((loginBlockedUntil - now) / 1000);
      showToast("Too many attempts", "Please wait " + remaining + " seconds before trying again.", "warning", 5000);
      return true;
    }
    // Reset counter if block has expired
    if (loginBlockedUntil > 0 && now >= loginBlockedUntil) {
      loginAttempts = 0;
      loginBlockedUntil = 0;
    }
    return false;
  }

  function recordLoginAttempt(success) {
    if (success) {
      loginAttempts = 0;
      loginBlockedUntil = 0;
      return;
    }
    loginAttempts++;
    if (loginAttempts >= LOGIN_BLOCK_ATTEMPTS) {
      loginBlockedUntil = Date.now() + LOGIN_BLOCK_DURATION;
      loginAttempts = 0;
    }
  }

  // --- Auth Form Selection ---
  var loginForm = document.getElementById("loginForm");
  var loginEmailInput = document.getElementById("email");
  var loginPasswordInput = document.getElementById("password");

  // --- Forgot Password Modal Elements ---
  var modal = document.getElementById("forgotModal");
  var trigger = document.getElementById("forgotBtn");
  var form = document.getElementById("forgotForm");
  var emailInput = document.getElementById("resetEmail");
  var emailOut = modal ? modal.querySelector("[data-email]") : null;
  var formStep = modal ? modal.querySelector('[data-step="form"]') : null;
  var successStep = modal ? modal.querySelector('[data-step="success"]') : null;
  var lastFocused = null;

  // --- Reset Password Modal Elements ---
  var resetModal = document.getElementById("resetModal");
  var resetForm = document.getElementById("resetForm");
  var resetError = document.getElementById("resetError");
  var resetSubmit = document.getElementById("resetSubmit");
  var resetCloseBtn = document.getElementById("resetCloseBtn");

  // --- Toast Elements ---
  var toastEl = document.getElementById("toast");
  var toastClose = document.getElementById("toastClose");
  var toastTimer = null;

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* ============================================================
     TOAST NOTIFICATION ENGINE
     Replaces native alert() with a styled glass notification.
     ============================================================ */
  var TOAST_ICONS = {
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
    success:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    warning:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>'
  };

  function showToast(title, msg, type, duration) {
    if (!toastEl) return;
    type = type || "error";
    duration = duration || 5000;

    var iconEl = toastEl.querySelector(".toast__icon");
    if (iconEl) iconEl.innerHTML = TOAST_ICONS[type] || TOAST_ICONS.error;

    var titleEl = toastEl.querySelector(".toast__title");
    var msgEl = toastEl.querySelector(".toast__msg");
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = msg;

    // Reset variant class + visibility
    toastEl.className = "toast toast--" + type;

    // Restart the progress-bar animation cleanly (duration matches toast lifetime)
    var progress = toastEl.querySelector(".toast__progress span");
    if (progress) {
      progress.style.animation = "none";
      void progress.offsetWidth; // force reflow
      progress.style.animation = "toastProgress " + duration + "ms linear forwards";
    }

    toastEl.classList.add("is-visible");
    toastEl.setAttribute("aria-hidden", "false");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, duration);
  }

  function hideToast() {
    if (!toastEl) return;
    toastEl.classList.remove("is-visible");
    toastEl.setAttribute("aria-hidden", "true");
    clearTimeout(toastTimer);
  }

  if (toastClose) {
    toastClose.addEventListener("click", hideToast);
  }

  /* ============================================================
     RATE-LIMIT DETECTION HELPERS
     Supabase returns rate-limit errors with messages like
     "For security purposes, you can only request this once
     every 60 seconds." We parse these into friendly copy.
     ============================================================ */
  function isRateLimited(error) {
    if (!error) return false;
    var msg = (error.message || "").toLowerCase();
    return (
      msg.indexOf("rate limit") !== -1 ||
      msg.indexOf("security purposes") !== -1 ||
      msg.indexOf("too many") !== -1 ||
      msg.indexOf("once every") !== -1 ||
      msg.indexOf("for security") !== -1 ||
      error.status === 429
    );
  }

  function parseRetrySeconds(error) {
    if (!error || !error.message) return 300; // default 5 min
    var secMatch = error.message.match(/(\d+)\s*second/i);
    if (secMatch) return parseInt(secMatch[1], 10);
    var minMatch = error.message.match(/(\d+)\s*minute/i);
    if (minMatch) return parseInt(minMatch[1], 10) * 60;
    var hourMatch = error.message.match(/(\d+)\s*hour/i);
    if (hourMatch) return parseInt(hourMatch[1], 10) * 3600;
    return 300;
  }

  function formatRetryTime(seconds) {
    if (seconds < 60) return seconds + " seconds";
    var mins = Math.ceil(seconds / 60);
    if (mins === 1) return "1 minute";
    return mins + " minutes";
  }

  /* ============================================================
     HANDLE STANDARD USER LOGIN
     ============================================================ */
  /* ============================================================
     AUTO-REDIRECT IF ALREADY AUTHENTICATED
     If a user visits the login page while already signed in, send
     them straight to the dashboard instead of showing the form.
     ============================================================ */
  (async function () {
    try {
      const { supabase } = await import("./supabase-config.js");
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        window.location.replace("dashboard.html");
      }
    } catch (e) {
      // Silently fail — the login form will handle auth normally
    }
  })();

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Rate-limit guard — block submission if throttled
      if (isLoginBlocked()) {
        shake(loginForm);
        return;
      }

      var email = loginEmailInput ? loginEmailInput.value.trim() : "";
      var password = loginPasswordInput ? loginPasswordInput.value : "";

      // Empty-field guard
      if (!email && !password) {
        showToast("Almost there", "Please enter your email and password to sign in.", "warning");
        shake(loginForm);
        return;
      }
      if (!email) {
        showToast("Email required", "Please enter your email address to continue.", "warning");
        shake(loginEmailInput);
        if (loginEmailInput) loginEmailInput.focus();
        return;
      }
      if (!password) {
        showToast("Password required", "Please enter your password to continue.", "warning");
        shake(loginPasswordInput);
        if (loginPasswordInput) loginPasswordInput.focus();
        return;
      }

      // Disable submit button while request is in flight
      var submitBtn = loginForm.querySelector('button[type="submit"]');
      var btnLabel = submitBtn ? submitBtn.querySelector("span") : null;
      if (submitBtn) submitBtn.disabled = true;
      if (btnLabel) btnLabel.textContent = "Signing in…";

      try {
        const { supabase } = await import("./supabase-config.js");

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) {
          // Record failed attempt for client-side rate limiting
          recordLoginAttempt(false);

          // Re-enable button
          if (submitBtn) submitBtn.disabled = false;
          if (btnLabel) btnLabel.textContent = "Sign in";

          if (isRateLimited(error)) {
            var secs = parseRetrySeconds(error);
            var limitMsg = secs === 300
              ? "For your security, please wait a moment before trying again."
              : "For your security, please wait " + formatRetryTime(secs) + " before trying again.";
            showToast("Too many attempts", limitMsg, "warning", 7000);
          } else {
            showToast(
              "Couldn't sign you in",
              "That email or password doesn't look right. Double-check and try again.",
              "error"
            );
          }
          shake(loginForm);
          console.error(error);
          return;
        }

        // Reset rate limiter on success
        recordLoginAttempt(true);

        // Success — redirect to dashboard (replace history to avoid login in back-stack)
        window.location.replace("dashboard.html");
      } catch (err) {
        if (submitBtn) submitBtn.disabled = false;
        if (btnLabel) btnLabel.textContent = "Sign in";
        showToast("Service unavailable", "We couldn't reach the login service. Please try again in a moment.", "error", 6000);
        console.error("Supabase load error:", err);
      }
    });
  }

  /* ============================================================
     FORGOT PASSWORD MODAL
     ============================================================ */
  function visibleFocusables(scope) {
    var root = scope || modal;
    var nodes = Array.prototype.slice.call(root.querySelectorAll(FOCUSABLE));
    return nodes.filter(function (n) {
      return n.offsetParent !== null;
    });
  }

  function showStep(step) {
    var isForm = step === "form";
    if (formStep) formStep.hidden = !isForm;
    if (successStep) successStep.hidden = isForm;
  }

  function open() {
    if (!modal) return;
    lastFocused = document.activeElement;
    showStep("form");
    if (form) form.reset();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.setTimeout(function () {
      if (emailInput) emailInput.focus();
    }, 60);
  }

  function close() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    window.setTimeout(function () {
      showStep("form");
    }, 300);
  }

  /* ---- Open via the "Forgot password?" button ---- */
  if (trigger) {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      open();
    });
  }

  /* ---- Close via any [data-close] element ---- */
  if (modal) {
    Array.prototype.forEach.call(
      modal.querySelectorAll("[data-close]"),
      function (el) {
        el.addEventListener("click", close);
      }
    );
  }

  /* ---- Submit Password Reset Request Form ---- */
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var email = emailInput ? emailInput.value.trim() : "";

      if (!email || (emailInput && !emailInput.checkValidity())) {
        if (emailInput) {
          showToast("Valid email needed", "Please enter a valid email address to send the reset link.", "warning");
          shake(emailInput);
          if (emailInput.reportValidity) emailInput.reportValidity();
          else emailInput.focus();
        }
        return;
      }

      // Disable button while sending
      var submitBtn = form.querySelector('button[type="submit"]');
      var btnLabel = submitBtn ? submitBtn.querySelector("span") : null;
      if (submitBtn) submitBtn.disabled = true;
      if (btnLabel) btnLabel.textContent = "Sending…";

      try {
        const { supabase } = await import("./supabase-config.js");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/login.html"
        });

        if (error) {
          // Re-enable button
          if (submitBtn) submitBtn.disabled = false;
          if (btnLabel) btnLabel.textContent = "Send reset link";

          if (isRateLimited(error)) {
            var secs = parseRetrySeconds(error);
            var msg = secs === 300
              ? "You've requested a few reset links already. Please wait before trying again."
              : "You've requested a few reset links already. Please try again in " + formatRetryTime(secs) + ".";
            showToast("Slow down a little", msg, "warning", 7000);
          } else {
            showToast("Couldn't send link", error.message || "Something went wrong. Please try again.", "error");
          }
          return;
        }

        // Re-enable button
        if (submitBtn) submitBtn.disabled = false;
        if (btnLabel) btnLabel.textContent = "Send reset link";

        if (emailOut) emailOut.textContent = email;
        showStep("success");

        var btn = successStep ? successStep.querySelector("[data-close]") : null;
        if (btn) {
          window.setTimeout(function () {
            btn.focus();
          }, 60);
        }
      } catch (err) {
        if (submitBtn) submitBtn.disabled = false;
        if (btnLabel) btnLabel.textContent = "Send reset link";
        showToast("Service unavailable", "We couldn't send the reset email right now. Please try again later.", "error", 6000);
        console.error("Supabase load error:", err);
      }
    });
  }

  /* ============================================================
     RESET PASSWORD MODAL (replaces native prompt())
     Shown when Supabase fires the PASSWORD_RECOVERY event after
     the user clicks the link in the reset email.
     ============================================================ */
  function openResetModal() {
    if (!resetModal) return;
    if (resetError) resetError.hidden = true;
    if (resetForm) resetForm.reset();
    if (resetSubmit) {
      resetSubmit.disabled = false;
      var lbl = resetSubmit.querySelector("span");
      if (lbl) lbl.textContent = "Set new password";
    }
    resetModal.classList.add("is-open");
    resetModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.setTimeout(function () {
      var np = document.getElementById("newPassword");
      if (np) np.focus();
    }, 60);
  }

  function closeResetModal() {
    if (!resetModal) return;
    resetModal.classList.remove("is-open");
    resetModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function showResetError(msg) {
    if (!resetError) return;
    resetError.textContent = msg;
    resetError.hidden = false;
    if (resetForm) {
      resetForm.classList.add("is-shake");
      window.setTimeout(function () {
        resetForm.classList.remove("is-shake");
      }, 450);
    }
  }

  // Close button + backdrop for reset modal
  if (resetCloseBtn) {
    resetCloseBtn.addEventListener("click", function () {
      closeResetModal();
      showToast("Password not updated", "You can refresh the page to set your new password.", "warning", 5000);
    });
  }
  if (resetModal) {
    var resetBackdrop = resetModal.querySelector(".modal__backdrop");
    if (resetBackdrop) {
      resetBackdrop.addEventListener("click", function () {
        closeResetModal();
        showToast("Password not updated", "You can refresh the page to set your new password.", "warning", 5000);
      });
    }
  }

  // Reset form submit handler
  if (resetForm) {
    resetForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      var np = document.getElementById("newPassword");
      var cp = document.getElementById("confirmPassword");
      var newPwd = np ? np.value : "";
      var confPwd = cp ? cp.value : "";

      if (resetError) resetError.hidden = true;

      // Validation
      if (newPwd.length < 8) {
        showResetError("Password must be at least 8 characters long.");
        if (np) np.focus();
        return;
      }
      if (newPwd !== confPwd) {
        showResetError("Those passwords don't match. Please try again.");
        if (cp) cp.focus();
        return;
      }

      // Disable button during request
      if (resetSubmit) resetSubmit.disabled = true;
      var lbl = resetSubmit ? resetSubmit.querySelector("span") : null;
      if (lbl) lbl.textContent = "Securing…";

      try {
        const { supabase } = await import("./supabase-config.js");
        var result = await supabase.auth.updateUser({ password: newPwd });

        if (result.error) {
          if (resetSubmit) resetSubmit.disabled = false;
          if (lbl) lbl.textContent = "Set new password";
          showResetError(result.error.message || "Couldn't update your password. Please try again.");
          console.error(result.error);
        } else {
          closeResetModal();
          showToast("Password updated", "Your account is secured. Taking you to your dashboard…", "success", 4000);
          window.setTimeout(function () {
            window.location.replace("dashboard.html");
          }, 1600);
        }
      } catch (err) {
        if (resetSubmit) resetSubmit.disabled = false;
        if (lbl) lbl.textContent = "Set new password";
        showResetError("Something went wrong. Please try again.");
        console.error("Password update error:", err);
      }
    });
  }

  /* ============================================================
     KEYBOARD HANDLING (Escape + focus trap for both modals)
     ============================================================ */
  document.addEventListener("keydown", function (e) {
    // Escape closes whichever modal is open
    if (e.key === "Escape") {
      if (modal && modal.classList.contains("is-open")) {
        close();
        return;
      }
      if (resetModal && resetModal.classList.contains("is-open")) {
        closeResetModal();
        showToast("Password not updated", "You can refresh the page to set your new password.", "warning", 5000);
        return;
      }
    }

    // Focus trap — only when a modal is open
    var activeModal = null;
    if (modal && modal.classList.contains("is-open")) activeModal = modal;
    else if (resetModal && resetModal.classList.contains("is-open")) activeModal = resetModal;

    if (!activeModal) return;
    if (e.key !== "Tab") return;

    var nodes = visibleFocusables(activeModal);
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ============================================================
     AUTH STATE CHANGES (Handles Recovery → Reset Modal)
     ============================================================ */
  import("./supabase-config.js")
    .then(function (mod) {
      var supabase = mod.supabase;
      supabase.auth.onAuthStateChange(async function (event, session) {
        if (
          event === "PASSWORD_RECOVERY" ||
          window.location.search.indexOf("type=recovery") !== -1
        ) {
          // Open the custom reset-password modal instead of prompt()
          openResetModal();
        }
      });
    })
    .catch(function (err) {
      console.warn("Supabase auth unavailable:", err);
    });

  /* ============================================================
     FLOATING LABEL FIX — ensures labels float up when inputs have content
     ============================================================ */
  (function fixLabels() {
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
  })();

  /* ============================================================
     UTIL: Shake animation helper
     ============================================================ */
  function shake(el) {
    if (!el) return;
    el.classList.add("is-shake");
    window.setTimeout(function () {
      el.classList.remove("is-shake");
    }, 450);
  }
})();
