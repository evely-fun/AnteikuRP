/* ==========================================================================
   ANTEIKU RP - motion engine
   Tier 2: GSAP + ScrollTrigger + Lenis, one shared ticker, no parallel RAF.
   ========================================================================== */

(function () {
    "use strict";

    var cfg = window.ANTEIKU;
    var dict = window.ANTEIKU_I18N;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var lenis = null;

    var MOTION = {
        revealDur: 0.9,
        revealStagger: 0.07,
        revealEase: "power3.out",
        scrub: 1
    };

    /* ----------------------------------------------------------------------
       Language
       ---------------------------------------------------------------------- */

    var lang = "ru";

    function readStoredLang() {
        try {
            var saved = localStorage.getItem("anteiku-lang");
            if (saved && dict[saved]) {
                return saved;
            }
        } catch (err) {
            /* storage can be blocked, fall through to detection */
        }
        var nav = (navigator.language || "ru").slice(0, 2).toLowerCase();
        return nav === "ru" ? "ru" : "en";
    }

    function applyLang(next) {
        lang = dict[next] ? next : "ru";
        var table = dict[lang];

        document.documentElement.lang = lang;

        document.querySelectorAll("[data-i18n]").forEach(function (el) {
            var value = table[el.getAttribute("data-i18n")];
            if (value === undefined) {
                return;
            }
            if (el.tagName === "META") {
                el.setAttribute("content", value);
            } else {
                el.textContent = value;
            }
        });

        document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
            var value = table[el.getAttribute("data-i18n-html")];
            if (value !== undefined) {
                el.innerHTML = value;
            }
        });

        var label = document.getElementById("langLabel");
        if (label) {
            label.textContent = lang.toUpperCase();
        }

        document.querySelectorAll(".drawer-lang button").forEach(function (btn) {
            btn.classList.toggle("is-active", btn.dataset.lang === lang);
        });

        buildTicker();
        repaintCounters();

        try {
            localStorage.setItem("anteiku-lang", lang);
        } catch (err) {
            /* ignore */
        }

        if (window.ScrollTrigger) {
            window.ScrollTrigger.refresh();
        }
    }

    function locale() {
        return lang === "ru" ? "ru-RU" : "en-US";
    }

    function repaintCounters() {
        document.querySelectorAll(".js-count[data-done='1']").forEach(function (el) {
            var value = parseInt(el.dataset.count, 10) || 0;
            el.textContent = value.toLocaleString(locale()) + (el.dataset.suffix || "");
        });
    }

    function t(key) {
        return (dict[lang] && dict[lang][key]) || "";
    }

    /* ----------------------------------------------------------------------
       Config wiring
       ---------------------------------------------------------------------- */

    function wireConfig() {
        document.querySelectorAll(".js-ip").forEach(function (el) {
            el.textContent = cfg.serverIp;
        });
        document.querySelectorAll(".js-version").forEach(function (el) {
            el.textContent = cfg.version;
        });
        document.querySelectorAll("[data-link]").forEach(function (el) {
            var href = cfg.links[el.dataset.link];
            if (href) {
                el.setAttribute("href", href);
                if (/^https?:/.test(href)) {
                    el.setAttribute("target", "_blank");
                    el.setAttribute("rel", "noopener");
                }
            }
        });
    }

    function buildTicker() {
        var track = document.getElementById("tickerTrack");
        if (!track) {
            return;
        }
        var unit = t("hero.tickerPromo") + " <b>" + cfg.promoCode + "</b> " + t("hero.tickerReward");
        var cells = [];
        // Two identical halves so the -50% marquee loops seamlessly
        for (var i = 0; i < 8; i++) {
            cells.push("<span>" + unit + "</span>");
        }
        track.innerHTML = cells.join("");
    }

    function loadOnline() {
        function paint(value) {
            document.querySelectorAll("#onlineCount, .js-online").forEach(function (el) {
                el.textContent = value.toLocaleString(locale());
            });
            var counter = document.querySelector(".js-online-count");
            if (counter) {
                counter.dataset.count = String(value);
                if (counter.dataset.done === "1") {
                    counter.textContent = value.toLocaleString(locale());
                }
            }
        }

        paint(cfg.fallbackOnline);

        if (!cfg.statusEndpoint) {
            return;
        }
        fetch(cfg.statusEndpoint)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var online = data && data.players && data.players.online;
                if (typeof online === "number" && online >= 0) {
                    paint(online);
                }
            })
            .catch(function () {
                /* keep the fallback number */
            });
    }

    /* ----------------------------------------------------------------------
       Copy the server address
       ---------------------------------------------------------------------- */

    function showToast() {
        var toast = document.getElementById("toast");
        if (!toast) {
            return;
        }
        toast.classList.add("is-open");
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(function () {
            toast.classList.remove("is-open");
        }, 2200);
    }

    function copyIp(trigger) {
        var done = function () {
            showToast();
            if (!trigger) {
                return;
            }
            trigger.classList.add("is-done");
            setTimeout(function () {
                trigger.classList.remove("is-done");
            }, 2200);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(cfg.serverIp).then(done).catch(function () {
                legacyCopy(cfg.serverIp);
                done();
            });
        } else {
            legacyCopy(cfg.serverIp);
            done();
        }
    }

    function legacyCopy(text) {
        var field = document.createElement("textarea");
        field.value = text;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        try {
            document.execCommand("copy");
        } catch (err) {
            /* nothing else to try */
        }
        document.body.removeChild(field);
    }

    function wireCopy() {
        document.addEventListener("click", function (event) {
            var trigger = event.target.closest(".js-copy-ip, .js-ip-plate");
            if (trigger) {
                event.preventDefault();
                copyIp(trigger);
            }
        });
        document.addEventListener("keydown", function (event) {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }
            var trigger = event.target.closest(".js-ip-plate");
            if (trigger) {
                event.preventDefault();
                copyIp(trigger);
            }
        });
    }

    /* ----------------------------------------------------------------------
       Header and drawer
       ---------------------------------------------------------------------- */

    function wireChrome() {
        var header = document.getElementById("header");
        var drawer = document.getElementById("drawer");
        var scrim = document.getElementById("drawerScrim");
        var burger = document.getElementById("burger");

        var onScroll = function () {
            header.classList.toggle("is-stuck", window.scrollY > 40);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        var setDrawer = function (open) {
            drawer.classList.toggle("is-open", open);
            scrim.classList.toggle("is-open", open);
            drawer.setAttribute("aria-hidden", open ? "false" : "true");
            burger.setAttribute("aria-expanded", open ? "true" : "false");
            document.body.classList.toggle("is-locked", open);
            if (lenis) {
                if (open) {
                    lenis.stop();
                } else {
                    lenis.start();
                }
            }
        };

        burger.addEventListener("click", function () {
            setDrawer(!drawer.classList.contains("is-open"));
        });
        document.getElementById("drawerClose").addEventListener("click", function () {
            setDrawer(false);
        });
        scrim.addEventListener("click", function () {
            setDrawer(false);
        });
        drawer.querySelectorAll("a, .js-copy-ip").forEach(function (el) {
            el.addEventListener("click", function () {
                setDrawer(false);
            });
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                setDrawer(false);
            }
        });

        var langBtn = document.getElementById("langBtn");
        if (langBtn) {
            langBtn.addEventListener("click", function () {
                applyLang(lang === "ru" ? "en" : "ru");
            });
        }
        document.querySelectorAll(".drawer-lang button").forEach(function (btn) {
            btn.addEventListener("click", function () {
                applyLang(btn.dataset.lang);
            });
        });

        var cue = document.getElementById("scrollCue");
        if (cue) {
            cue.addEventListener("click", function () {
                var target = document.getElementById("claim");
                if (lenis) {
                    lenis.scrollTo(target);
                } else {
                    target.scrollIntoView({ behavior: "smooth" });
                }
            });
        }

        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener("click", function (event) {
                var target = document.querySelector(link.getAttribute("href"));
                if (!target) {
                    return;
                }
                event.preventDefault();
                if (lenis) {
                    lenis.scrollTo(target, { offset: -70 });
                } else {
                    target.scrollIntoView({ behavior: "smooth" });
                }
            });
        });
    }

    /* ----------------------------------------------------------------------
       FAQ, one open at a time
       ---------------------------------------------------------------------- */

    function wireFaq() {
        var items = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));
        items.forEach(function (item) {
            item.addEventListener("toggle", function () {
                if (item.open) {
                    items.forEach(function (other) {
                        if (other !== item) {
                            other.open = false;
                        }
                    });
                }
                if (window.ScrollTrigger) {
                    window.ScrollTrigger.refresh();
                }
            });
        });
    }

    /* ----------------------------------------------------------------------
       Ember particles, rendered from the shared ticker only while visible
       ---------------------------------------------------------------------- */

    function createEmbers(canvas, options) {
        var ctx = canvas.getContext("2d");
        var particles = [];
        var visible = false;
        var w = 0;
        var h = 0;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var intensity = 0;

        function resize() {
            var rect = canvas.getBoundingClientRect();
            w = rect.width;
            h = rect.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function spawn(seedY) {
            return {
                x: Math.random() * w,
                y: seedY === undefined ? h + Math.random() * h : Math.random() * h,
                r: 0.6 + Math.random() * 1.8,
                vy: 0.12 + Math.random() * 0.5,
                vx: (Math.random() - 0.5) * 0.25,
                life: Math.random(),
                hue: Math.random() < 0.72 ? options.warm : options.cool
            };
        }

        function build() {
            var count = Math.round(Math.min(w, 1600) / options.density);
            particles = [];
            for (var i = 0; i < count; i++) {
                particles.push(spawn(0));
            }
        }

        function render(delta) {
            if (!visible || w === 0) {
                return;
            }
            ctx.clearRect(0, 0, w, h);
            var boost = 1 + intensity * 2.2;
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.y -= p.vy * boost * delta;
                p.x += p.vx * delta + Math.sin((p.y + p.life * 400) / 90) * 0.18;
                if (p.y < -10) {
                    particles[i] = spawn();
                    continue;
                }
                var fade = Math.min(1, p.y / h) * (1 - p.y / h) * 4;
                ctx.globalAlpha = Math.max(0, Math.min(0.85, fade)) * (0.35 + intensity * 0.65);
                ctx.fillStyle = p.hue;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * boost * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        resize();
        build();

        var observer = new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
        }, { threshold: 0 });
        observer.observe(canvas);

        return {
            render: render,
            resize: function () {
                resize();
                build();
            },
            setIntensity: function (value) {
                intensity = value;
            }
        };
    }

    /* ----------------------------------------------------------------------
       Line splitter, used instead of a paid plugin
       ---------------------------------------------------------------------- */

    function splitLines(el) {
        if (el.dataset.splitDone === "1") {
            return Array.prototype.slice.call(el.querySelectorAll(".line-inner"));
        }
        var source = el.innerHTML;
        el.dataset.splitSource = source;

        // Wrap every word so line boxes can be detected by offsetTop
        var html = source
            .split(/(<br\s*\/?>)/i)
            .map(function (chunk) {
                if (/^<br/i.test(chunk)) {
                    return chunk;
                }
                return chunk.split(/\s+/).filter(Boolean).map(function (word) {
                    return '<span class="w">' + word + "</span>";
                }).join(" ");
            })
            .join("");
        el.innerHTML = html;

        var words = Array.prototype.slice.call(el.querySelectorAll(".w"));
        var lines = [];
        var current = null;
        var lastTop = null;

        words.forEach(function (word) {
            var top = word.offsetTop;
            if (lastTop === null || Math.abs(top - lastTop) > 4) {
                current = [];
                lines.push(current);
                lastTop = top;
            }
            current.push(word.textContent);
        });

        el.innerHTML = lines.map(function (line) {
            return '<span class="line"><span class="line-inner">' + line.join(" ") + "</span></span>";
        }).join("");
        el.dataset.splitDone = "1";

        return Array.prototype.slice.call(el.querySelectorAll(".line-inner"));
    }

    function revertSplits() {
        document.querySelectorAll(".split[data-split-done='1']").forEach(function (el) {
            el.innerHTML = el.dataset.splitSource;
            el.dataset.splitDone = "0";
        });
    }

    /* ----------------------------------------------------------------------
       Static branch, used when the visitor asks for reduced motion
       ---------------------------------------------------------------------- */

    function staticBranch() {
        document.querySelectorAll(".js-count").forEach(function (el) {
            var value = parseInt(el.dataset.count, 10) || 0;
            el.textContent = value.toLocaleString(locale()) + (el.dataset.suffix || "");
            el.dataset.done = "1";
        });
        document.querySelectorAll(".step").forEach(function (step) {
            step.classList.add("is-active");
        });
        var progress = document.getElementById("startProgress");
        if (progress) {
            progress.style.width = "100%";
        }
    }

    /* ----------------------------------------------------------------------
       Scroll scenes
       ---------------------------------------------------------------------- */

    function buildScenes() {
        var gsap = window.gsap;
        var ScrollTrigger = window.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        var LenisCtor = window.Lenis || (window.lenis && window.lenis.default);
        if (LenisCtor) {
            lenis = new LenisCtor({ lerp: 0.085, wheelMultiplier: 1 });
            lenis.on("scroll", ScrollTrigger.update);
            gsap.ticker.add(function (time) {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
            // Exposed so automated checks can jump the page without wheel events
            window.__lenis = lenis;
        }

        var heroEmbers = createEmbers(document.getElementById("heroEmbers"), {
            density: 26, warm: "#ffb066", cool: "#6fd6f2"
        });
        var warEmbers = createEmbers(document.getElementById("warEmbers"), {
            density: 12, warm: "#ff9a3c", cool: "#ffd9a8"
        });
        heroEmbers.setIntensity(0.25);
        warEmbers.setIntensity(0.4);

        var lastTime = 0;
        gsap.ticker.add(function (time) {
            var delta = lastTime ? Math.min((time - lastTime) * 60, 3) : 1;
            lastTime = time;
            heroEmbers.render(delta);
            warEmbers.render(delta);
        });

        /* --- Reveals ---------------------------------------------------- */

        document.querySelectorAll(".split").forEach(function (el) {
            var lines = splitLines(el);
            gsap.from(lines, {
                yPercent: 115,
                duration: MOTION.revealDur,
                ease: MOTION.revealEase,
                stagger: MOTION.revealStagger,
                scrollTrigger: { trigger: el, start: "top 84%" }
            });
        });

        gsap.utils.toArray(".reveal").forEach(function (el) {
            gsap.from(el, {
                y: 28,
                opacity: 0,
                duration: MOTION.revealDur,
                ease: MOTION.revealEase,
                scrollTrigger: { trigger: el, start: "top 88%" }
            });
        });

        /* --- Hero ------------------------------------------------------- */

        gsap.timeline({
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: MOTION.scrub
            }
        })
            .to("#heroBg", { scale: 1.22, ease: "none" }, 0)
            .to(".hero-copy", { yPercent: -18, opacity: 0.15, ease: "none" }, 0)
            .to(".hero-char-l", { yPercent: 16, xPercent: -14, ease: "none" }, 0)
            .to(".hero-char-r", { yPercent: 16, xPercent: 14, ease: "none" }, 0)
            .to(".hero-char-c", { yPercent: 26, opacity: 0, ease: "none" }, 0)
            .to(".scroll-cue", { opacity: 0, ease: "none", duration: 0.2 }, 0);

        gsap.from(".hero-title-main", {
            yPercent: 30, opacity: 0, duration: 1.3, ease: "power3.out", delay: 0.1
        });
        gsap.from(".hero-title-sub", {
            opacity: 0, letterSpacing: "0.2em", duration: 1.4, ease: "power3.out", delay: 0.35
        });
        gsap.from([".hero-char-l", ".hero-char-r"], {
            yPercent: 22, opacity: 0, duration: 1.5, ease: "power3.out", stagger: 0.12, delay: 0.15
        });

        /* --- Roles ------------------------------------------------------ */

        gsap.from(".role-card", {
            y: 54,
            opacity: 0,
            duration: MOTION.revealDur,
            ease: MOTION.revealEase,
            stagger: { each: 0.06, from: "center" },
            scrollTrigger: { trigger: ".role-grid", start: "top 82%" }
        });

        /* --- War, the signature dive ------------------------------------ */

        buildWarScene(gsap, ScrollTrigger, warEmbers);

        /* --- Modes, the Kinetic Brutalist accent ------------------------ */

        buildModes(gsap, ScrollTrigger);

        /* --- Features --------------------------------------------------- */

        gsap.utils.toArray(".feature-media img").forEach(function (img) {
            gsap.fromTo(img,
                { yPercent: -7, scale: 1.14 },
                {
                    yPercent: 7,
                    scale: 1.14,
                    ease: "none",
                    scrollTrigger: {
                        trigger: img.closest(".feature-row"),
                        start: "top bottom",
                        end: "bottom top",
                        scrub: MOTION.scrub
                    }
                });
        });

        /* --- Stats ------------------------------------------------------ */

        gsap.utils.toArray(".js-count").forEach(function (el) {
            var target = parseInt(el.dataset.count, 10) || 0;
            var suffix = el.dataset.suffix || "";
            var box = { value: 0 };
            gsap.to(box, {
                value: target,
                duration: 1.8,
                ease: "power2.out",
                scrollTrigger: { trigger: el, start: "top 88%" },
                onUpdate: function () {
                    el.textContent = Math.round(box.value).toLocaleString(locale()) + suffix;
                },
                onComplete: function () {
                    el.dataset.done = "1";
                }
            });
        });

        gsap.from(".stat", {
            y: 24,
            opacity: 0,
            duration: MOTION.revealDur,
            ease: MOTION.revealEase,
            stagger: MOTION.revealStagger,
            scrollTrigger: { trigger: ".stat-grid", start: "top 88%" }
        });

        /* --- Start steps ------------------------------------------------ */

        var steps = gsap.utils.toArray(".step");
        steps.forEach(function (step, index) {
            ScrollTrigger.create({
                trigger: step,
                start: "top 62%",
                end: "bottom 42%",
                onToggle: function (self) {
                    step.classList.toggle("is-active", self.isActive);
                    if (self.isActive) {
                        var progress = document.getElementById("startProgress");
                        if (progress) {
                            gsap.to(progress, {
                                width: ((index + 1) / steps.length) * 100 + "%",
                                duration: 0.6,
                                ease: "power2.out"
                            });
                        }
                    }
                }
            });
        });

        /* --- Finale ----------------------------------------------------- */

        gsap.fromTo(".finale-bg",
            { yPercent: -8, scale: 1.12 },
            {
                yPercent: 8,
                scale: 1.12,
                ease: "none",
                scrollTrigger: { trigger: ".finale", start: "top bottom", end: "bottom top", scrub: MOTION.scrub }
            });

        /* --- Lifecycle -------------------------------------------------- */

        var resizeTimer;
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                heroEmbers.resize();
                warEmbers.resize();
                revertSplits();
                document.querySelectorAll(".split").forEach(splitLines);
                ScrollTrigger.refresh();
            }, 220);
        });

        ScrollTrigger.refresh();
    }

    function buildWarScene(gsap, ScrollTrigger, warEmbers) {
        var stage = document.querySelector(".war-stage");
        var wide = document.getElementById("warWide");
        var close = document.getElementById("warClose");
        if (!stage || !wide) {
            return;
        }

        // The distant blast sits at this point of the wide plate, in image fractions
        var TARGET = { x: 0.5, y: 0.375 };

        function applyOrigin() {
            if (!wide.naturalWidth) {
                return;
            }
            var iw = wide.naturalWidth;
            var ih = wide.naturalHeight;
            var ew = wide.clientWidth;
            var eh = wide.clientHeight;
            if (!ew || !eh) {
                return;
            }
            // object-fit: cover crops differently per viewport, so the origin is
            // computed in element pixels rather than left as a percentage
            var scale = Math.max(ew / iw, eh / ih);
            var x = TARGET.x * iw * scale + (ew - iw * scale) / 2;
            var y = TARGET.y * ih * scale + (eh - ih * scale) / 2;
            gsap.set(wide, { transformOrigin: x + "px " + y + "px" });
        }

        if (wide.complete) {
            applyOrigin();
        } else {
            wide.addEventListener("load", applyOrigin);
        }
        ScrollTrigger.addEventListener("refreshInit", applyOrigin);

        var beats = gsap.utils.toArray(".war-beat");

        var tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".war",
                pin: ".war-stage",
                start: "top top",
                end: "+=420%",
                scrub: MOTION.scrub,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: function (self) {
                    warEmbers.setIntensity(0.2 + self.progress * 0.8);
                }
            }
        });

        // Wide plate pushes in toward the blast, then hands off to the close plate
        tl.fromTo(wide, { scale: 1 }, { scale: 3.6, ease: "none", duration: 0.62 }, 0)
            .fromTo(".war-layer-close", { opacity: 0 }, { opacity: 1, ease: "power1.inOut", duration: 0.18 }, 0.38)
            .fromTo(close, { scale: 1.38 }, { scale: 1, ease: "none", duration: 0.62 }, 0.38)
            .fromTo(".war-title",
                { scale: 1.1, opacity: 0, filter: "blur(6px)" },
                { scale: 1, opacity: 1, filter: "blur(0px)", ease: "power2.out", duration: 0.12 }, 0.02)
            .to(".war-title", { yPercent: -22, scale: 0.82, ease: "none", duration: 0.6 }, 0.3)
            .to(".war-eyebrow", { opacity: 0, ease: "none", duration: 0.1 }, 0.24);

        // Beats hand over one at a time inside the hold
        var windows = [[0.06, 0.28], [0.34, 0.56], [0.6, 0.8]];
        beats.forEach(function (beat, i) {
            var win = windows[i];
            tl.fromTo(beat, { opacity: 0, y: 18 }, { opacity: 1, y: 0, ease: "power2.out", duration: 0.06 }, win[0])
                .to(beat, { opacity: 0, y: -18, ease: "power2.in", duration: 0.06 }, win[1]);
        });

        tl.fromTo(".war-stat",
            { opacity: 0, y: 26 },
            { opacity: 1, y: 0, ease: "power3.out", duration: 0.1, stagger: 0.03 }, 0.82);
    }

    function buildModes(gsap, ScrollTrigger) {
        var viewport = document.getElementById("modesViewport");
        var track = document.getElementById("modesTrack");
        if (!viewport || !track) {
            return;
        }

        ScrollTrigger.matchMedia({
            "(min-width: 901px)": function () {
                var distance = function () {
                    return Math.max(0, track.scrollWidth - window.innerWidth);
                };
                var tween = gsap.to(track, {
                    x: function () { return -distance(); },
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".modes",
                        pin: true,
                        start: "top top",
                        end: function () { return "+=" + distance(); },
                        scrub: MOTION.scrub,
                        invalidateOnRefresh: true,
                        anticipatePin: 1
                    }
                });

                gsap.utils.toArray(".mode-card").forEach(function (card) {
                    gsap.from(card, {
                        y: 44,
                        opacity: 0,
                        duration: 0.7,
                        ease: MOTION.revealEase,
                        scrollTrigger: {
                            trigger: card,
                            containerAnimation: tween,
                            start: "left 92%"
                        }
                    });
                });

                // Velocity skew, the one Brutalist flourish and only in this zone
                if (lenis) {
                    var onScroll = function (event) {
                        var v = gsap.utils.clamp(-1, 1, (event.velocity || 0) / 70);
                        gsap.to(".mode-card", {
                            skewX: v * 3.5,
                            duration: 0.35,
                            overwrite: "auto",
                            ease: "power2.out"
                        });
                    };
                    lenis.on("scroll", onScroll);
                    return function () {
                        lenis.off("scroll", onScroll);
                        gsap.set(".mode-card", { skewX: 0 });
                    };
                }
            },
            "(max-width: 900px)": function () {
                // Mobile keeps a plain swipeable rail instead of a pinned scene
                viewport.style.overflowX = "auto";
                viewport.style.overscrollBehaviorX = "contain";
                viewport.setAttribute("data-lenis-prevent", "");
                gsap.set(track, { x: 0 });
                return function () {
                    viewport.style.overflowX = "";
                    viewport.removeAttribute("data-lenis-prevent");
                };
            }
        });
    }

    /* ----------------------------------------------------------------------
       Boot
       ---------------------------------------------------------------------- */

    function gateOnAssets(done) {
        var fill = document.getElementById("preloaderFill");
        var critical = [
            "assets/img/hero-city.webp",
            "assets/img/char-police.webp",
            "assets/img/char-criminal.webp",
            "assets/img/char-soldier.webp"
        ];
        var loaded = 0;
        var settle = function () {
            loaded++;
            if (fill) {
                fill.style.width = Math.round((loaded / critical.length) * 100) + "%";
            }
            if (loaded >= critical.length) {
                done();
            }
        };
        critical.forEach(function (src) {
            var img = new Image();
            img.onload = settle;
            img.onerror = settle;
            img.src = src;
        });
        // Never let a stalled asset hold the page hostage
        setTimeout(done, 4000);
    }

    function start() {
        wireConfig();
        applyLang(readStoredLang());
        loadOnline();
        wireCopy();
        wireChrome();
        wireFaq();
        document.documentElement.classList.add("js-on");

        var launched = false;
        var launch = function () {
            if (launched) {
                return;
            }
            launched = true;
            document.getElementById("preloader").classList.add("is-gone");

            if (reduced || !window.gsap || !window.ScrollTrigger) {
                staticBranch();
                return;
            }
            var run = function () {
                buildScenes();
            };
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(run);
            } else {
                run();
            }
        };

        gateOnAssets(launch);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
}());
