/* =========================================================
   nuvisco — Client Dashboard (Supabase Live Integration)
   dashboard-js.js
   ========================================================= */
import { supabase } from './supabase-config.js'

// --- FOLDER KEY DERIVATION ---
// Generates an opaque, deterministic folder key from the user's auth UUID
// so the raw UUID is never exposed in storage paths, data attributes,
// or the DOM — preventing casual user identification.
function deriveFolderKey(userId) {
    var hash = 5381;
    for (var i = 0; i < userId.length; i++) {
        hash = ((hash << 5) + hash) + userId.charCodeAt(i);
        hash |= 0;
    }
    return 'f' + Math.abs(hash).toString(36);
}

// --- GLOBAL APP INITIALIZATION & PROTECTION GATE ---
async function secureDashboardCheck() {
  const { data: { user }, error } = await supabase.auth.getUser()

  // SECURITY GUARD: If no user session exists, stop page logic and redirect instantly.
  // Wipe the page body before redirect to prevent any flash of dashboard content.
  if (!user || error) {
      document.body.innerHTML = '';
      window.location.replace('login.html')
      return
  }

  // PULL CLIENT DATA RECORD DYNAMICALLY
  const { data: submissions } = await supabase
      .from('onboarding_submissions')
      .select('user_id, brand_name, target_launch_date, current_step')
      .eq('user_id', user.id)
      .single()

  // DEFENSE-IN-DEPTH: verify the returned record actually belongs to this user
  // (backstop in case Supabase RLS is ever misconfigured)
  if (submissions && submissions.user_id !== user.id) {
      console.error('RLS MISMATCH: record user_id does not match authenticated user');
      window.location.replace('login.html');
      return;
  }

  // 0. UPDATE CUSTOM BRAND NAME
  const brandNameEl = document.querySelector('.dash__hello em');
  if (brandNameEl && submissions && submissions.brand_name) {
      brandNameEl.textContent = `${submissions.brand_name}.`;
  }

  // 1. DYNAMIC LAUNCH COUNTDOWN DEPLOYMENT
  let target = new Date(2026, 8, 15, 9, 0, 0); // Default: 15 Sep 2026
  
  if (submissions && submissions.target_launch_date) {
      target = new Date(submissions.target_launch_date)
  }

  // Update target launch date display text
  const launchDateEl = document.getElementById("launchDate");
  if (launchDateEl) {
      launchDateEl.textContent = target.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const countEl = document.getElementById("launchCount");
  if (countEl) {
    const now = new Date();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diff > 1) {
      countEl.textContent = diff + " days to go";
    } else if (diff === 1) {
      countEl.textContent = "1 day to go";
    } else if (diff === 0) {
      countEl.textContent = "Launching today";
    } else {
      countEl.textContent = "Launched";
    }
  }

  // 2. DYNAMIC TIMELINE HIGHLIGHT LOGIC (Matching dashboard.html steps 1 to 6)
  if (submissions && submissions.current_step) {
      const activeStep = parseInt(submissions.current_step, 10); // Expecting numbers 1 through 6
      const steps = document.querySelectorAll('.timeline__steps .timeline__step');
      const progressFill = document.querySelector('.timeline__fill');
      
      // Map out text representation of current phase name
      const phaseNames = ["Onboarding", "Discovery", "Design", "Development", "Review & QA", "Launch"];
      const currentPhaseText = phaseNames[activeStep - 1] || "Design";

      // Dynamically update the top header phase text label
      const topPhaseNameEl = document.querySelector('.phase__name');
      if (topPhaseNameEl) topPhaseNameEl.textContent = currentPhaseText;

      // Update structural lower detail phase header
      const detailPhaseEl = document.querySelector('.timeline__detail-phase');
      if (detailPhaseEl) detailPhaseEl.textContent = currentPhaseText;

      // Process step nodes styling inside the list array
      steps.forEach((stepEl, idx) => {
          const stepNumber = idx + 1;
          
          // Clear default state classes entirely
          stepEl.classList.remove('is-done', 'is-active', 'is-upcoming');
          
          if (stepNumber < activeStep) {
              stepEl.classList.add('is-done');
              // Ensure icon node shows a checkmark for completed items
              const node = stepEl.querySelector('.timeline__node');
              if (node && !node.querySelector('svg')) {
                  node.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>`;
              }
          } else if (stepNumber === activeStep) {
              stepEl.classList.add('is-active');
              // Restore step number to visual node
              const node = stepEl.querySelector('.timeline__node');
              if (node) node.innerHTML = stepNumber;
          } else {
              stepEl.classList.add('is-upcoming');
              const node = stepEl.querySelector('.timeline__node');
              if (node) node.innerHTML = stepNumber;
          }
      });

      // Update the progress line fill percentage seamlessly 
      // Steps formulas: (0% for step 1, up to 100% for step 6)
      if (progressFill) {
          const fillPercentage = ((activeStep - 1) / (steps.length - 1)) * 100;
          progressFill.style.setProperty('--p', `${fillPercentage}%`);
      }
  }

  // 3. LOAD & POPULATE ALL EDITABLE FIELDS FROM SUPABASE
  const brandingTextarea = document.getElementById('brandingText');
  const schedulingInput = document.getElementById('scheduling');
  const requestsTextarea = document.getElementById('requests');

  // Social media fields
  const socialInstagram = document.getElementById('socialInstagram');
  const socialTikTok = document.getElementById('socialTikTok');
  const socialYouTube = document.getElementById('socialYouTube');
  const socialX = document.getElementById('socialX');
  const socialFacebook = document.getElementById('socialFacebook');
  const socialOther = document.getElementById('socialOther');

  // Domain provider fields
  const domainAgency = document.getElementById('domainAgency');
  const domainPlatform = document.getElementById('domainPlatform');
  const domainName = document.getElementById('domainName');

  // Payment provider field
  const paymentProvider = document.getElementById('paymentProvider');

  // Single query to fetch all editable columns
  const { data: textData } = await supabase
      .from('onboarding_submissions')
      .select('branding_text, scheduling, social_instagram, social_tiktok, social_youtube, social_x, social_facebook, social_other, domain_agency, domain_platform, domain_name, payment_provider, requests')
      .eq('user_id', user.id)
      .single();

  if (textData) {
      if (textData.branding_text && brandingTextarea) brandingTextarea.value = textData.branding_text;
      if (schedulingInput) schedulingInput.value = textData.scheduling || '';
      if (socialInstagram) socialInstagram.value = textData.social_instagram || '';
      if (socialTikTok) socialTikTok.value = textData.social_tiktok || '';
      if (socialYouTube) socialYouTube.value = textData.social_youtube || '';
      if (socialX) socialX.value = textData.social_x || '';
      if (socialFacebook) socialFacebook.value = textData.social_facebook || '';
      if (socialOther) socialOther.value = textData.social_other || '';
      if (domainAgency) domainAgency.value = textData.domain_agency || '';
      if (domainPlatform) domainPlatform.value = textData.domain_platform || '';
      if (domainName) domainName.value = textData.domain_name || '';
      if (paymentProvider) paymentProvider.value = textData.payment_provider || '';
      if (requestsTextarea) requestsTextarea.value = textData.requests || '';
  }

  // 4. SAVE BUTTON — Persist all editable fields to Supabase in one shot
  const saveBtn = document.getElementById('saveBtn');
  const saveFeedback = document.getElementById('saveFeedback');

  if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
          // Disable button & show saving state to prevent double-click
          saveBtn.disabled = true;
          const btnText = saveBtn.querySelector('span');
          btnText.textContent = 'Saving…';

          const updates = {
              branding_text: brandingTextarea?.value || '',
              scheduling: schedulingInput?.value || '',
              social_instagram: socialInstagram?.value || '',
              social_tiktok: socialTikTok?.value || '',
              social_youtube: socialYouTube?.value || '',
              social_x: socialX?.value || '',
              social_facebook: socialFacebook?.value || '',
              social_other: socialOther?.value || '',
              domain_agency: domainAgency?.value || '',
              domain_platform: domainPlatform?.value || '',
              domain_name: domainName?.value || '',
              payment_provider: paymentProvider?.value || '',
              requests: requestsTextarea?.value || ''
          };

          const { error } = await supabase
              .from('onboarding_submissions')
              .update(updates)
              .eq('user_id', user.id);

          // Re-enable button
          saveBtn.disabled = false;
          btnText.textContent = 'Save changes';

          if (error) {
              if (saveFeedback) {
                  saveFeedback.textContent = '✕ Failed to save. Please try again.';
                  saveFeedback.className = 'dash__save-feedback dash__save-error is-visible';
              }
              console.error('Supabase save error:', error);
          } else {
              if (saveFeedback) {
                  saveFeedback.textContent = '✓ Changes saved successfully';
                  saveFeedback.className = 'dash__save-feedback is-visible';
                  // Auto-hide feedback after 3 seconds
                  setTimeout(() => {
                      saveFeedback.classList.remove('is-visible');
                  }, 3000);
              }
          }
      });
  }

  // 5. LOAD EXISTING FILES FROM SUPABASE STORAGE ON PAGE LOAD
  loadExistingFiles();

  // 6. LOAD EXISTING POLICY FILES
  loadExistingPolicyFiles();

  // 7. FIX FLOATING LABELS — ensure labels float up when inputs have content
  fixFloatingLabels();

  // 8. HIDE LOADING OVERLAY — all data loaded, reveal the dashboard
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('is-hidden');
  }
}

// --- EXISTING FILE RENDERER (for files already in Supabase Storage) ---
function formatStorageSize(bytes) {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function renderStoredFiles(list, files, storagePrefix) {
    if (!list) return;
    list.innerHTML = "";
    files.forEach(function (file) {
        var li = document.createElement("li");

        // File name + size
        var nameSpan = document.createElement("span");
        var sizeText = file.metadata && file.metadata.size
            ? " · " + formatStorageSize(file.metadata.size)
            : "";
        nameSpan.textContent = file.name + sizeText;
        li.appendChild(nameSpan);

        // Delete button
        var delBtn = document.createElement("button");
        delBtn.className = "file-delete";
        delBtn.setAttribute("aria-label", "Delete " + file.name);
        delBtn.textContent = "✕";
        delBtn.dataset.storagePath = (storagePrefix ? storagePrefix + "/" : "") + file.name;
        delBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            openDeleteModal(this.dataset.storagePath, list, this.closest("li"));
        });
        li.appendChild(delBtn);

        list.appendChild(li);
    });
}

async function loadExistingFiles() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    var folderKey = deriveFolderKey(user.id);

    // Get the two dropzone file lists (logo, team photos)
    var lists = document.querySelectorAll('[data-dropzone-files]');
    if (!lists.length) return;

    // Load logos from folderKey/logos/
    const { data: logoResult, error: logoErr } = await supabase.storage
        .from('client-assets')
        .list(folderKey + '/logos', { sortBy: { column: 'name', order: 'desc' } });

    if (!logoErr && logoResult && logoResult.length) {
        renderStoredFiles(lists[0], logoResult, folderKey + '/logos');
    }

    // Load team photos from folderKey/team/
    const { data: teamResult, error: teamErr } = await supabase.storage
        .from('client-assets')
        .list(folderKey + '/team', { sortBy: { column: 'name', order: 'desc' } });

    if (!teamErr && teamResult && teamResult.length) {
        renderStoredFiles(lists[1], teamResult, folderKey + '/team');
    }
}

// --- POLICY FILE LOADER (loads .txt policy documents from storage) ---
async function loadExistingPolicyFiles() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    var folderKey = deriveFolderKey(user.id);

    const { data: files, error } = await supabase.storage
        .from('client-assets')
        .list('policies/' + folderKey, { sortBy: { column: 'name', order: 'desc' } });

    if (error || !files || files.length === 0) return;

    var policyList = document.querySelector('[data-policy-files]');
    if (!policyList) return;

    renderStoredFiles(policyList, files, 'policies/' + folderKey);
}

// --- POLICY FILE UPLOAD (uploads .txt policy docs to policies/folderKey/) ---
async function handlePolicyUpload(files) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    var folderKey = deriveFolderKey(user.id);
    var policyList = document.querySelector('[data-policy-files]');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uniquePath = 'policies/' + folderKey + '/' + Date.now() + '_' + file.name;

        const { data, error } = await supabase.storage
            .from('client-assets')
            .upload(uniquePath, file);

        if (error) {
            console.error('Policy upload failed for ' + file.name + ':', error.message);
            if (policyList) {
                var errItem = document.createElement("li");
                errItem.textContent = "✕ " + file.name + " — upload failed";
                errItem.style.color = "#ef5350";
                errItem.style.borderColor = "rgba(239, 83, 80, 0.3)";
                errItem.style.background = "rgba(239, 83, 80, 0.06)";
                policyList.appendChild(errItem);
                setTimeout(function () {
                    if (errItem.parentNode) errItem.remove();
                }, 5000);
            }
        } else {
            // Uploaded successfully — no-op in production
        }
    }
}

// --- FLOATING LABEL FIX — ensures labels float up when inputs have content ---
function fixFloatingLabels() {
  document.querySelectorAll('.field input, .field textarea').forEach(function(el) {
    // Check initial state
    if (el.value.trim().length > 0) {
      el.classList.add('has-content');
    }
    // Watch for changes
    el.addEventListener('input', function() {
      if (this.value.trim().length > 0) {
        this.classList.add('has-content');
      } else {
        this.classList.remove('has-content');
      }
    });
  });
}

// Execute the secure network checker gate immediately when script mounts
secureDashboardCheck();

// --- HISTORY GUARD ---
// Remove the dashboard from the browser history stack so that
// neither back NOR forward navigation can return to this page.
// The current URL is replaced with login.html in history (the
// dashboard content still displays — no page reload occurs).
(function () {
  if (history.replaceState) {
    history.replaceState(null, '', 'dashboard.html');
  }

  // Fallback: if the page is ever restored from the back-forward
  // cache (bfcache), redirect immediately.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      window.location.replace('login.html');
    }
  });
})();

// --- AUTH STATE CHANGE LISTENER ---
// If the user's session is revoked or expires while they're on the
// dashboard (e.g. admin signs them out, token expires), redirect
// immediately rather than waiting for the next page interaction.
supabase.auth.onAuthStateChange(function (event, session) {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED' || (!session && event !== 'INITIAL_SESSION')) {
    document.body.innerHTML = '';
    window.location.replace('login.html');
  }
});

// --- TAB VISIBILITY RE-AUTHENTICATION ---
// When the user switches away from the dashboard tab and comes back,
// re-verify the session is still valid. This catches scenarios where
// the session was invalidated while the tab was in the background.
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    supabase.auth.getUser().then(function (result) {
      if (!result.data.user || result.error) {
        document.body.innerHTML = '';
        window.location.replace('login.html');
      }
    });
  }
});


// --- FRONTEND DRAG, DROP & INTERACTION ENGINE ---
(function () {
  "use strict";

  var zones = document.querySelectorAll("[data-dropzone]");

  function formatSize(bytes) {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function renderFiles(list, files) {
    if (!list) return;
    list.innerHTML = "";
    Array.prototype.forEach.call(files, function (file) {
      var li = document.createElement("li");
      li.textContent = file.name + " · " + formatSize(file.size);
      list.appendChild(li);
    });
  }

  // ASYNC SUPABASE UPLOAD ENGINE FOR DRAG AND DROP OBJECTS
  async function handleSupabaseFileUpload(files, subfolder) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    var folderKey = deriveFolderKey(user.id);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const folder = subfolder ? folderKey + '/' + subfolder : folderKey;
        const uniquePath = folder + '/' + Date.now() + '_' + file.name;

        const { data, error } = await supabase.storage
            .from('client-assets') 
            .upload(uniquePath, file);

        if (error) {
            console.error(`Upload failed for ${file.name}:`, error.message);
            // Show temporary error message at the top of the file list
            if (list) {
                var errItem = document.createElement("li");
                errItem.textContent = "✕ " + file.name + " — upload failed";
                errItem.style.color = "#ef5350";
                errItem.style.borderColor = "rgba(239, 83, 80, 0.3)";
                errItem.style.background = "rgba(239, 83, 80, 0.06)";
                list.appendChild(errItem);
                setTimeout(function () {
                    if (errItem.parentNode) errItem.remove();
                }, 5000);
            }
        } else {
            // Uploaded successfully — no-op in production
        }
    }
  }

  Array.prototype.forEach.call(zones, function (zone) {
    var input = zone.querySelector("[data-dropzone-input]");
    var list = zone.querySelector("[data-dropzone-files]");
    var dropType = zone.getAttribute("data-dropzone-type") || "";

    zone.addEventListener("click", function (e) {
      if (e.target === input) return;
      if (input) input.click();
    });
    zone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (input) input.click();
      }
    });

    if (input) {
      input.addEventListener("change", function () {
        if (input.files && input.files.length) {
            renderFiles(list, input.files);
            handleSupabaseFileUpload(input.files, dropType).then(loadExistingFiles);
        }
      });
    }

    var dragCount = 0;
    zone.addEventListener("dragenter", function (e) {
      e.preventDefault();
      dragCount++;
      zone.classList.add("is-dragover");
    });
    zone.addEventListener("dragover", function (e) {
      e.preventDefault();
    });
    zone.addEventListener("dragleave", function () {
      dragCount--;
      if (dragCount <= 0) {
        dragCount = 0;
        zone.classList.remove("is-dragover");
      }
    });
    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      dragCount = 0;
      zone.classList.remove("is-dragover");
      var files = e.dataTransfer ? e.dataTransfer.files : null;
      if (files && files.length) {
          renderFiles(list, files);
          handleSupabaseFileUpload(files, dropType).then(loadExistingFiles);
      }
    });
  });

  /* ---- POLICY DOCUMENT DROPZONE ---- */
  var policyZone = document.querySelector("[data-policy-dropzone]");
  if (policyZone) {
    var policyInput = policyZone.querySelector("[data-policy-input]");
    var policyList = policyZone.querySelector("[data-policy-files]");

    policyZone.addEventListener("click", function (e) {
      if (e.target === policyInput) return;
      if (policyInput) policyInput.click();
    });
    policyZone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (policyInput) policyInput.click();
      }
    });

    if (policyInput) {
      policyInput.addEventListener("change", function () {
        if (policyInput.files && policyInput.files.length) {
          renderFiles(policyList, policyInput.files);
          handlePolicyUpload(policyInput.files).then(loadExistingPolicyFiles);
        }
      });
    }

    var dragCount = 0;
    policyZone.addEventListener("dragenter", function (e) {
      e.preventDefault();
      dragCount++;
      policyZone.classList.add("is-dragover");
    });
    policyZone.addEventListener("dragover", function (e) {
      e.preventDefault();
    });
    policyZone.addEventListener("dragleave", function () {
      dragCount--;
      if (dragCount <= 0) {
        dragCount = 0;
        policyZone.classList.remove("is-dragover");
      }
    });
    policyZone.addEventListener("drop", function (e) {
      e.preventDefault();
      dragCount = 0;
      policyZone.classList.remove("is-dragover");
      var files = e.dataTransfer ? e.dataTransfer.files : null;
      if (files && files.length) {
        renderFiles(policyList, files);
        handlePolicyUpload(files).then(loadExistingPolicyFiles);
      }
    });
  }

  /* ---- LOG OUT OPERATION TERMINATION ---- */
  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      await supabase.auth.signOut();
      document.body.innerHTML = '';
      window.location.replace("login.html");
    });
  }

  /* ---- NAVIGATION INTERCEPTION — Replace, don't push ---- */
  // When leaving the dashboard via any internal link, use location.replace()
  // so the back button skips dashboard and goes to login.html instead.
  document.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (!link) return;

    var href = link.getAttribute("href");
    // Only intercept internal page navigations (skip anchors, external, mailto, tel)
    if (!href || href === "#" || href.indexOf("http") === 0 || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
    // Don't intercept the logout flow (it's handled separately above)
    if (link.id === "logoutBtn") return;

    e.preventDefault();
    window.location.replace(href);
  });

  })();

/* ---- DELETE MODAL — confirm & remove uploaded files ---- */
var deleteModal = document.getElementById("deleteModal");
var confirmBtn = document.getElementById("confirmDeleteBtn");
var currentDeletePath = null;
var currentDeleteList = null;
var currentDeleteItem = null;

function openDeleteModal(path, list, li) {
  if (!deleteModal) return;
  currentDeletePath = path;
  currentDeleteList = list;
  currentDeleteItem = li;
  deleteModal.classList.add("is-open");
  deleteModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeDeleteModal() {
  if (!deleteModal) return;
  deleteModal.classList.remove("is-open");
  deleteModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  currentDeletePath = null;
  currentDeleteList = null;
  currentDeleteItem = null;
}

// Close via backdrop/close buttons
if (deleteModal) {
  deleteModal.querySelectorAll("[data-delete-close]").forEach(function(el) {
    el.addEventListener("click", closeDeleteModal);
  });

  // Escape key
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && deleteModal.classList.contains("is-open")) {
      closeDeleteModal();
    }
  });
}

// Confirm delete
if (confirmBtn) {
  confirmBtn.addEventListener("click", async function () {
    if (!currentDeletePath || !currentDeleteList) return;

    var btnSpan = confirmBtn.querySelector("span");
    var originalText = btnSpan ? btnSpan.textContent : "";
    if (btnSpan) btnSpan.textContent = "Deleting…";
    confirmBtn.disabled = true;

    const { error } = await supabase.storage
        .from('client-assets')
        .remove([currentDeletePath]);

    confirmBtn.disabled = false;
    if (btnSpan) btnSpan.textContent = originalText;

    if (error) {
      console.error("Delete failed:", error.message);
    } else {
      // Remove item from the DOM list
      if (currentDeleteItem && currentDeleteItem.parentNode) {
        currentDeleteItem.remove();
      }
    }

    closeDeleteModal();
  });
}
