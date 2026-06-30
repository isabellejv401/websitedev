/* =========================================================
   nuvisco — Digital Craft Studio
   home-page-js.js
   GSAP · ScrollTrigger · AOS · Three.js · Custom interactions
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */
  const lerp = (a, b, n) => (1 - n) * a + n * b;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Preloader
  --------------------------------------------------------- */
  function initPreloader() {
    const pre = document.getElementById("preloader");
    const bar = pre.querySelector(".preloader__bar span");
    const count = document.getElementById("preCount");
    let val = 0;

    const tick = () => {
      val += Math.random() * 12 + 4;
      if (val >= 100) val = 100;
      bar.style.width = val + "%";
      count.textContent = Math.floor(val);
      if (val < 100) {
        setTimeout(tick, 120);
      } else {
        setTimeout(() => {
          pre.classList.add("is-done");
          revealHero();
        }, 400);
      }
    };
    tick();
  }

  function revealHero() {
    const lines = document.querySelectorAll(".hero__title .line__inner");
    gsap.to(lines, {
      y: 0,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.12,
      delay: 0.1,
    });
  }

  /* ---------------------------------------------------------
     AOS
  --------------------------------------------------------- */
  function initAOS() {
    if (prefersReduced || !window.AOS) return;
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
    });
  }

  /* ---------------------------------------------------------
     Custom Cursor + Magnetic
  --------------------------------------------------------- */
  function initCursor() {
    if (prefersReduced) return;
    const cursor = document.getElementById("cursor");
    const follower = document.getElementById("cursorFollower");
    if (!cursor || !follower) return;

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

    document.querySelectorAll("a, button, [data-magnetic], .flipcard").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.classList.add("is-hover");
        follower.classList.add("is-hover");
      });
      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-hover");
        follower.classList.remove("is-hover");
      });
    });
  }

  function initMagnetic() {
    if (prefersReduced) return;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: x * strength, y: y * strength, duration: 0.5, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ---------------------------------------------------------
     Nav scroll state + scroll progress
  --------------------------------------------------------- */
  function initScrollUI() {
    const nav = document.getElementById("nav");
    const progress = document.getElementById("scrollProgress");

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 60);

      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? (y / h) * 100 : 0;
      progress.style.width = p + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     Count-up stats
  --------------------------------------------------------- */
  function initCounters() {
    if (prefersReduced) return;
    const nums = document.querySelectorAll(".stat__num");
    nums.forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const suffix = el.dataset.suffix || "";

      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = obj.val.toFixed(decimals) + suffix;
            },
          });
        },
      });
    });
  }

  /* ---------------------------------------------------------
     Section reveal animations (GSAP)
  --------------------------------------------------------- */
  function initReveals() {
    if (prefersReduced) return;
    gsap.utils.toArray(".section-head__title").forEach((el) => {
      gsap.from(el, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // Parallax on craft stages
    gsap.utils.toArray(".craft__stage").forEach((el) => {
      gsap.to(el, {
        yPercent: -8,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // About orbs drift
    gsap.utils.toArray(".orb").forEach((orb, i) => {
      gsap.to(orb, {
        y: i % 2 === 0 ? -40 : 40,
        x: i % 2 === 0 ? 20 : -20,
        ease: "none",
        scrollTrigger: { trigger: orb, start: "top bottom", end: "bottom top", scrub: 1.5 },
      });
    });
  }

  /* ---------------------------------------------------------
     Background 3D scene (Three.js)
     A drifting field of particles + wireframe icosahedron
  --------------------------------------------------------- */
  function initBackground3D() {
    const canvas = document.getElementById("bg3d");
    if (!canvas || typeof THREE === "undefined" || prefersReduced) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07070b, 0.06);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 14);

    let visible = true;
    let bgAnimId;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !bgAnimId) {
          animate();
        } else if (!visible && bgAnimId) {
          cancelAnimationFrame(bgAnimId);
          bgAnimId = null;
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    // ---- Particle field ----
    const particleCount = 1400;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [
      new THREE.Color(0xff5b2e),
      new THREE.Color(0x7c5cff),
      new THREE.Color(0x2ee6c4),
      new THREE.Color(0xf4f1ea),
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = 8 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // ---- Wireframe icosahedron ----
    const icoGeo = new THREE.IcosahedronGeometry(3.2, 1);
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(icoGeo),
      new THREE.LineBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: 0.25 })
    );
    scene.add(wire);

    const icoInner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.2, 0),
      new THREE.MeshBasicMaterial({
        color: 0xff5b2e,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      })
    );
    scene.add(icoInner);

    // ---- Mouse parallax ----
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    window.addEventListener("mousemove", (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // ---- Scroll-driven camera ----
    let scrollY = 0;
    window.addEventListener("scroll", () => {
      scrollY = window.scrollY;
    }, { passive: true });

    const clock = new THREE.Clock();
    function animate() {
      if (!visible) {
        bgAnimId = null;
        return;
      }
      const t = clock.getElapsedTime();

      target.x = lerp(target.x, mouse.x, 0.05);
      target.y = lerp(target.y, mouse.y, 0.05);

      points.rotation.y = t * 0.03 + target.x * 0.3;
      points.rotation.x = target.y * 0.2;

      wire.rotation.x = t * 0.15;
      wire.rotation.y = t * 0.1;
      icoInner.rotation.x = -t * 0.2;
      icoInner.rotation.z = t * 0.12;

      // subtle camera drift on scroll
      camera.position.y = -scrollY * 0.0015;
      camera.position.x = target.x * 1.2;
      camera.position.y += target.y * 0.8;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      bgAnimId = requestAnimationFrame(animate);
    }
    bgAnimId = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleResize);
    document.addEventListener("webkitfullscreenchange", handleResize);
    document.addEventListener("mozfullscreenchange", handleResize);
    document.addEventListener("MSFullscreenChange", handleResize);
  }

  /* ---------------------------------------------------------
     Showcase 3D scroll scene
     A morphing knot that rotates & changes color through scroll,
     with synced text panels.
  --------------------------------------------------------- */
  function initShowcase3D() {
    const canvas = document.getElementById("showcase3d");
    if (!canvas || typeof THREE === "undefined" || prefersReduced) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    // Resize to canvas element
    function resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("fullscreenchange", resize);
    document.addEventListener("webkitfullscreenchange", resize);
    document.addEventListener("mozfullscreenchange", resize);
    document.addEventListener("MSFullscreenChange", resize);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const key = new THREE.PointLight(0xff5b2e, 2, 50);
    key.position.set(5, 5, 5);
    scene.add(key);
    const rim = new THREE.PointLight(0x2ee6c4, 2, 50);
    rim.position.set(-5, -3, 4);
    scene.add(rim);

    // Morphing torus knot
    const geo = new THREE.TorusKnotGeometry(1.6, 0.5, 200, 32, 2, 3);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x7c5cff,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x1a0f2e,
      emissiveIntensity: 0.6,
    });
    const knot = new THREE.Mesh(geo, mat);
    scene.add(knot);

    // Orbiting particles
    const orbCount = 300;
    const oPos = new Float32Array(orbCount * 3);
    for (let i = 0; i < orbCount; i++) {
      const r = 3 + Math.random() * 2.5;
      const a = Math.random() * Math.PI * 2;
      const b = Math.random() * Math.PI;
      oPos[i * 3] = r * Math.sin(b) * Math.cos(a);
      oPos[i * 3 + 1] = r * Math.sin(b) * Math.sin(a);
      oPos[i * 3 + 2] = r * Math.cos(b);
    }
    const oGeo = new THREE.BufferGeometry();
    oGeo.setAttribute("position", new THREE.BufferAttribute(oPos, 3));
    const oMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x2ee6c4,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const orbiters = new THREE.Points(oGeo, oMat);
    scene.add(orbiters);

    // Panels
    const panels = document.querySelectorAll(".showcase__panel");
    const colors = [0xff5b2e, 0x7c5cff, 0x2ee6c4];

    // Mobile sticky positioning fix
    const showcaseSection = document.querySelector(".showcase");
    const showcaseSticky = document.querySelector(".showcase__sticky");
    const isMobile = () => window.innerWidth <= 560;

    if (showcaseSection && showcaseSticky && isMobile()) {
      const onScroll = () => {
        const rect = showcaseSection.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionHeight = showcaseSection.offsetHeight;
        const viewportHeight = window.innerHeight;

        // When section top reaches viewport top, make it fixed
        if (sectionTop <= 0 && sectionTop > -sectionHeight + viewportHeight) {
          showcaseSticky.style.position = "fixed";
          showcaseSticky.style.top = "0";
          showcaseSticky.style.left = "0";
          showcaseSticky.style.width = "100%";
          showcaseSticky.style.height = "100vh";
        } else {
          showcaseSticky.style.position = "sticky";
          showcaseSticky.style.top = "0";
          showcaseSticky.style.left = "auto";
          showcaseSticky.style.width = "auto";
          showcaseSticky.style.height = "100vh";
        }
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll(); // Initial check
    }

    // ScrollTrigger driving the scene
    const state = { progress: 0 };
    ScrollTrigger.create({
      trigger: ".showcase",
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        state.progress = self.progress;
        const idx = Math.min(2, Math.floor(self.progress * 3));
        panels.forEach((p, i) => p.classList.toggle("is-active", i === idx));

        // color shift
        const c = colors[idx];
        mat.color.setHex(c);
        mat.emissive.setHex(c);
        key.color.setHex(c);
      },
    });

    const clock = new THREE.Clock();
    let visible = true;
    let showcaseAnimId;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !showcaseAnimId) {
          animate();
        } else if (!visible && showcaseAnimId) {
          cancelAnimationFrame(showcaseAnimId);
          showcaseAnimId = null;
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    function animate() {
      if (!visible) {
        showcaseAnimId = null;
        return;
      }
      const t = clock.getElapsedTime();
      const p = state.progress;

      knot.rotation.x = t * 0.3 + p * Math.PI * 2;
      knot.rotation.y = t * 0.4 + p * Math.PI * 3;
      knot.scale.setScalar(1 + Math.sin(t) * 0.05);

      orbiters.rotation.y = t * 0.1;
      orbiters.rotation.x = t * 0.05;

      camera.position.z = 7 - p * 1.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      showcaseAnimId = requestAnimationFrame(animate);
    }
    showcaseAnimId = requestAnimationFrame(animate);
  }

  /* ---------------------------------------------------------
      Craft Lab — four interactive 3D models
      Each canvas hosts a unique form. When the cursor enters the
      box the model responds to drag (orbit);
      otherwise it auto-rotates gently.
   --------------------------------------------------------- */
  function initCraft3D() {
    const canvases = document.querySelectorAll(".craft__canvas");
    if (!canvases.length || typeof THREE === "undefined" || prefersReduced) return;

    const palette = [0xff5b2e, 0x7c5cff, 0x2ee6c4, 0xf4f1ea];

    /* ---- Model builders: each returns a THREE.Group ---- */
    function buildHelix() {
      const g = new THREE.Group();
      const geo = new THREE.TorusKnotGeometry(1.1, 0.36, 180, 28, 2, 3);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x7c5cff, metalness: 0.85, roughness: 0.2,
        emissive: 0x1a0f2e, emissiveIntensity: 0.5,
      });
      g.add(new THREE.Mesh(geo, mat));
      return g;
    }

    function buildCluster() {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({
        color: 0x2ee6c4, metalness: 0.6, roughness: 0.25,
        flatShading: true, emissive: 0x0a2a25, emissiveIntensity: 0.4,
      });
      const count = 9;
      for (let i = 0; i < count; i++) {
        const r = 0.45 + Math.random() * 0.5;
        const geo = new THREE.OctahedronGeometry(r, 0);
        const m = new THREE.Mesh(geo, mat);
        const dist = 1.1;
        m.position.set(
          (Math.random() - 0.5) * dist,
          (Math.random() - 0.5) * dist,
          (Math.random() - 0.5) * dist
        );
        m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        m.userData.spin = {
          x: (Math.random() - 0.5) * 0.4,
          y: (Math.random() - 0.5) * 0.4,
        };
        g.add(m);
      }
      return g;
    }

    function buildBloom() {
      const g = new THREE.Group();
      const petalMat = new THREE.MeshStandardMaterial({
        color: 0xff5b2e, metalness: 0.5, roughness: 0.3,
        emissive: 0x2a0f0a, emissiveIntensity: 0.5, side: THREE.DoubleSide,
      });
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xf4f1ea, emissive: 0xff5b2e, emissiveIntensity: 0.6,
        metalness: 0.4, roughness: 0.3,
      });
      const petals = 8;
      for (let i = 0; i < petals; i++) {
        const geo = new THREE.ConeGeometry(0.32, 1.1, 6, 1, true);
        const p = new THREE.Mesh(geo, petalMat);
        const a = (i / petals) * Math.PI * 2;
        p.position.set(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55);
        p.rotation.z = Math.cos(a) * 0.5;
        p.rotation.x = -Math.sin(a) * 0.5;
        p.userData.baseRot = { x: p.rotation.x, z: p.rotation.z };
        g.add(p);
      }
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), coreMat);
      g.add(core);
      g.userData.core = core;
      return g;
    }

    function buildLattice() {
      const g = new THREE.Group();
      const geo = new THREE.IcosahedronGeometry(1.4, 1);
      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x2ee6c4, transparent: true, opacity: 0.6 })
      );
      g.add(wire);
      const inner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.9, 0),
        new THREE.MeshBasicMaterial({ color: 0xff5b2e, wireframe: true, transparent: true, opacity: 0.3 })
      );
      g.add(inner);
      g.userData.inner = inner;
      // floating nodes
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xf4f1ea });
      const pos = geo.attributes.position;
      const seen = {};
      for (let i = 0; i < pos.count; i++) {
        const key = [pos.getX(i).toFixed(2), pos.getY(i).toFixed(2), pos.getZ(i).toFixed(2)].join(",");
        if (seen[key]) continue;
        seen[key] = 1;
        const n = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), nodeMat);
        n.position.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        g.add(n);
      }
      return g;
    }

    const builders = [buildHelix, buildCluster, buildBloom, buildLattice];

    canvases.forEach((canvas, idx) => {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 4.6);

      function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.45));
      const key = new THREE.PointLight(palette[idx % palette.length], 2.2, 50);
      key.position.set(4, 4, 5);
      scene.add(key);
      const rim = new THREE.PointLight(palette[(idx + 2) % palette.length], 1.6, 50);
      rim.position.set(-4, -3, 3);
      scene.add(rim);

      const model = builders[idx]();
      scene.add(model);

      // Interaction state
      const state = {
        rotX: 0.3, rotY: 0,
        targetRotX: 0.3, targetRotY: 0,
        zoom: 4.6, targetZoom: 4.6,
        active: false,
        dragging: false,
        lastX: 0, lastY: 0,
      };

      const onEnter = () => { state.active = true; };
      const onLeave = () => { state.active = false; state.dragging = false; };
      const onDown = (x, y) => { state.dragging = true; state.lastX = x; state.lastY = y; };
      const onMove = (x, y) => {
        if (!state.dragging) return;
        const dx = x - state.lastX;
        const dy = y - state.lastY;
        state.targetRotY += dx * 0.01;
        state.targetRotX += dy * 0.01;
        state.targetRotX = clamp(state.targetRotX, -1.4, 1.4);
        state.lastX = x; state.lastY = y;
      };
      const onUp = () => { state.dragging = false; };

      canvas.addEventListener("mouseenter", onEnter);
      canvas.addEventListener("mouseleave", onLeave);
      canvas.addEventListener("mousedown", (e) => onDown(e.clientX, e.clientY));
      window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
      window.addEventListener("mouseup", onUp);
      canvas.addEventListener("touchstart", (e) => {
        onEnter();
        if (e.touches[0]) onDown(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      canvas.addEventListener("touchmove", (e) => {
        if (state.dragging) {
          e.preventDefault();
        }
        if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: false });
      canvas.addEventListener("touchend", onLeave);

      const clock = new THREE.Clock();
      let visible = true;
      let craftAnimId;
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
          if (visible && !craftAnimId) {
            animate();
          } else if (!visible && craftAnimId) {
            cancelAnimationFrame(craftAnimId);
            craftAnimId = null;
          }
        },
        { threshold: 0 }
      );
      io.observe(canvas);

      function animate() {
        if (!visible) {
          craftAnimId = null;
          return;
        }
        const t = clock.getElapsedTime();

        // Auto-rotate when idle; ease toward drag target when active
        if (!state.dragging) {
          state.targetRotY += 0.004;
        }
        state.rotX = lerp(state.rotX, state.targetRotX, 0.1);
        state.rotY = lerp(state.rotY, state.targetRotY, 0.1);
        state.zoom = lerp(state.zoom, state.targetZoom, 0.1);

        model.rotation.x = state.rotX;
        model.rotation.y = state.rotY;
        camera.position.z = state.zoom;

        // Per-model life
        if (idx === 1) {
          model.children.forEach((c) => {
            if (c.userData.spin) {
              c.rotation.x += c.userData.spin.x * 0.02;
              c.rotation.y += c.userData.spin.y * 0.02;
            }
          });
        }
        if (idx === 2 && model.userData.core) {
          model.userData.core.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
          model.children.forEach((c) => {
            if (c.userData.baseRot) {
              const b = c.userData.baseRot;
              c.rotation.z = b.z + Math.sin(t * 1.5) * 0.12;
            }
          });
        }
        if (idx === 3 && model.userData.inner) {
          model.userData.inner.rotation.x = -t * 0.3;
          model.userData.inner.rotation.z = t * 0.2;
        }

        key.intensity = 2.2 + Math.sin(t * 0.8) * 0.3;
        renderer.render(scene, camera);
        craftAnimId = requestAnimationFrame(animate);
      }
      craftAnimId = requestAnimationFrame(animate);
    });
  }

  /* ---------------------------------------------------------
      Flip Cards — click to reveal the back
   --------------------------------------------------------- */
  function initFlipCards() {
    document.querySelectorAll("[data-flip]").forEach((card) => {
      card.addEventListener("click", () => {
        card.classList.toggle("is-flipped");
      });
    });
  }

  /* ---------------------------------------------------------
      Mobile burger (simple toggle)
   --------------------------------------------------------- */
  function initBurger() {
    const burger = document.getElementById("burger");
    const links = document.querySelector(".nav__links");
    if (!burger || !links) return;
    burger.addEventListener("click", () => {
      links.classList.toggle("is-open");
    });
  }

  /* ---------------------------------------------------------
     Contact form (demo)
  --------------------------------------------------------- */
  function initForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button span");
      const original = btn.textContent;
      btn.textContent = "Sending…";
      setTimeout(() => {
        btn.textContent = "Sent! ✓";
        form.reset();
        setTimeout(() => (btn.textContent = original), 2200);
      }, 1200);
    });
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  function init() {
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    initAOS();
    initPreloader();
    initCursor();
    initMagnetic();
    initScrollUI();
    initCounters();
    initReveals();
    initBackground3D();
    initShowcase3D();
    initCraft3D();
    initFlipCards();
    initBurger();
    initForm();

    // Refresh ScrollTrigger after everything loads
    window.addEventListener("load", () => {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
