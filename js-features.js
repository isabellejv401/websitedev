AOS.init({
  duration: 800,
  easing: 'power2.out',
  once: false,
  mirror: true
});

gsap.registerPlugin(ScrollTrigger);

// Web Development Section Animations
gsap.timeline({
    scrollTrigger: {
        trigger: "#web-dev",
        start: "top center",
    }
})
.from("#web-dev .code-snippet.html", { x: -200, opacity: 0, duration: 1, ease: "power3.out" })
.from("#web-dev .code-snippet.css", { x: 200, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.7")
.from("#web-dev .code-snippet.js", { y: 100, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.7");


// Creativity Section Animations
gsap.utils.toArray("#creativity .creative-card").forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: "top 80%",
            toggleActions: "play none none none"
        },
        opacity: 0,
        y: 50,
        duration: 0.6,
        delay: i * 0.1
    });
});


// Social Media Section Animations
const icons = gsap.utils.toArray("#social-media .social-icon");
const radius = 150;

gsap.timeline({
    scrollTrigger: {
        trigger: "#social-media",
        start: "top center",
        end: "bottom top",
        scrub: 1.5,
    }
})
.to(icons, {
    rotation: 360,
    duration: 10,
    ease: "none",
    repeat: -1
})
.set(icons, {
    modifiers: {
        x: (value, target, targets) => {
            const angle = (targets.indexOf(target) / targets.length) * 2 * Math.PI + gsap.getProperty(target, "rotation") * (Math.PI / 180);
            return Math.cos(angle) * radius;
        },
        y: (value, target, targets) => {
            const angle = (targets.indexOf(target) / targets.length) * 2 * Math.PI + gsap.getProperty(target, "rotation") * (Math.PI / 180);
            return Math.sin(angle) * radius;
        }
    }
});


// SEO Section Animations
gsap.from("#seo .graph-bar", {
    scrollTrigger: {
        trigger: "#seo",
        start: "top center",
        toggleActions: "play none none reverse"
    },
    scaleY: 0,
    stagger: 0.1,
    duration: 1,
    ease: "power3.out"
});
