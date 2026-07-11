/* =========================================================
   nuvisco — Digital Craft Studio
   cursor.js
   Standalone custom cursor for legal/static pages.
   No external dependencies. Respects reduced-motion,
   coarse-pointer (touch) devices, and keyboard users.
   ========================================================= */

(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(hover: none)").matches;
  const isKeyboardUser = window.matchMedia("(pointer: coarse)").matches;

  // Disable custom cursor for touch devices, reduced motion, or coarse pointers
  if (prefersReduced || coarsePointer || isKeyboardUser) {
    // Ensure the native cursor is visible
    document.documentElement.style.cursor = "auto";
    const els = document.querySelectorAll(".cursor, .cursor-follower");
    els.forEach(function (el) { if (el) el.style.display = "none"; });
    return;
  }

  const cursor = document.getElementById("cursor");
  const follower = document.getElementById("cursorFollower");
  if (!cursor || !follower) return;

  // Hide the cursor elements when using keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      cursor.style.display = "none";
      follower.style.display = "none";
      document.documentElement.style.cursor = "auto";
    }
  });

  // Show cursor elements when mouse is used
  document.addEventListener("mousemove", function () {
    cursor.style.display = "";
    follower.style.display = "";
    document.documentElement.style.cursor = "none";
  });

  const lerp = (a, b, n) => (1 - n) * a + n * b;

  let mx = window.innerWidth / 2,
    my = window.innerHeight / 2;
  let fx = mx,
    fy = my;

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  });

  const render = () => {
    fx = lerp(fx, mx, 0.18);
    fy = lerp(fy, my, 0.18);
    follower.style.transform = `translate(${fx}px, ${fy}px) translate(-50%, -50%)`;
    requestAnimationFrame(render);
  };
  render();

  document.querySelectorAll("a, button, [data-magnetic], .flipcard, [tabindex], .faq__summary").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("is-hover");
      follower.classList.add("is-hover");
    });
    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-hover");
      follower.classList.remove("is-hover");
    });
  });
})();
