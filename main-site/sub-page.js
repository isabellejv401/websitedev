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
     Init
     --------------------------------------------------------- */
  init3D();
  initScrollProgress();
  initScrollIndicator();
})();