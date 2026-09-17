/* ==========================================================================
   ANTEIKU RolePlay - hero screen behaviour
   ========================================================================== */

(function () {
    "use strict";

    var cfg = window.ANTEIKU;
    var dict = window.ANTEIKU_I18N;
    var lang = "ru";

    /* ----------------------------------------------------------------------
       Viewport unit, kept correct while mobile browser chrome collapses
       ---------------------------------------------------------------------- */

    function setVh() {
        document.documentElement.style.setProperty("--vh", window.innerHeight * 0.01 + "px");
    }

    /* ----------------------------------------------------------------------
       Language
       ---------------------------------------------------------------------- */

    function storedLang() {
        try {
            var saved = localStorage.getItem("anteiku-lang");
            if (saved && dict[saved]) {
                return saved;
            }
        } catch (err) {
            /* storage can be blocked, fall through to detection */
        }
        return (navigator.language || "ru").slice(0, 2).toLowerCase() === "ru" ? "ru" : "en";
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

        document.querySelectorAll(".mobile-lang-option").forEach(function (opt) {
            opt.classList.toggle("is-active", opt.dataset.lang === lang);
        });

        paintOnline(lastOnline);

        try {
            localStorage.setItem("anteiku-lang", lang);
        } catch (err) {
            /* ignore */
        }
    }

    /* ----------------------------------------------------------------------
       Config wiring and player count
       ---------------------------------------------------------------------- */

    var lastOnline = null;

    function wireConfig() {
        document.querySelectorAll("[data-link]").forEach(function (el) {
            var href = cfg.links[el.dataset.link];
            if (!href) {
                return;
            }
            el.setAttribute("href", href);
            if (/^https?:/.test(href)) {
                el.setAttribute("target", "_blank");
                el.setAttribute("rel", "noopener");
            } else {
                el.removeAttribute("target");
            }
        });
    }

    function paintOnline(value) {
        if (value === null || value === undefined) {
            return;
        }
        lastOnline = value;
        var text = value.toLocaleString(lang === "ru" ? "ru-RU" : "en-US");
        document.querySelectorAll("#onlineCount, .js-online").forEach(function (el) {
            el.textContent = text;
        });
    }

    function loadOnline() {
        paintOnline(cfg.fallbackOnline);
        if (!cfg.statusEndpoint) {
            return;
        }
        fetch(cfg.statusEndpoint)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var online = data && data.players && data.players.online;
                if (typeof online === "number" && online >= 0) {
                    paintOnline(online);
                }
            })
            .catch(function () {
                /* keep the fallback number */
            });
    }

    /* ----------------------------------------------------------------------
       Copy the server address
       ---------------------------------------------------------------------- */

    var toastTimer;

    function showToast() {
        var toast = document.getElementById("toast");
        toast.classList.add("is-open");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove("is-open");
        }, 2200);
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

    function copyIp(trigger) {
        var done = function () {
            showToast();
            if (!trigger) {
                return;
            }
            trigger.classList.add("is-copied");
            setTimeout(function () {
                trigger.classList.remove("is-copied");
            }, 2200);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(cfg.serverIp).then(done, function () {
                legacyCopy(cfg.serverIp);
                done();
            });
        } else {
            legacyCopy(cfg.serverIp);
            done();
        }
    }

    /* ----------------------------------------------------------------------
       Chrome
       ---------------------------------------------------------------------- */

    function wireChrome() {
        var menu = document.getElementById("mobileMenu");
        var burger = document.getElementById("hamburgerBtn");

        var setMenu = function (open) {
            menu.classList.toggle("is-open", open);
            burger.setAttribute("aria-expanded", open ? "true" : "false");
            document.body.classList.toggle("menu-open", open);
        };

        burger.addEventListener("click", function () {
            setMenu(!menu.classList.contains("is-open"));
        });
        document.getElementById("mobileMenuClose").addEventListener("click", function () {
            setMenu(false);
        });
        menu.addEventListener("click", function (event) {
            if (event.target === menu) {
                setMenu(false);
            }
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                setMenu(false);
            }
        });

        document.addEventListener("click", function (event) {
            var trigger = event.target.closest(".js-copy-ip");
            if (trigger) {
                event.preventDefault();
                copyIp(trigger);
                setMenu(false);
            }
        });

        document.getElementById("langSwitcher").addEventListener("click", function () {
            applyLang(lang === "ru" ? "en" : "ru");
        });
        document.querySelectorAll(".mobile-lang-option").forEach(function (opt) {
            opt.addEventListener("click", function () {
                applyLang(opt.dataset.lang);
            });
        });

        document.getElementById("scrollIndicator").addEventListener("click", function () {
            window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
        });
    }

    /* ----------------------------------------------------------------------
       Preloader, gated on the artwork the first frame actually needs
       ---------------------------------------------------------------------- */

    function boot() {
        var fill = document.querySelector(".preloader-bar-fill");
        var critical = ["img/pers/1.webp", "img/pers/2.webp", "img/pers/3.webp", "img/logo.svg"];
        var loaded = 0;
        var finished = false;

        var reveal = function () {
            if (finished) {
                return;
            }
            finished = true;
            if (fill) {
                fill.style.width = "100%";
            }
            setTimeout(function () {
                document.getElementById("preloader").classList.add("preloader-out");
                document.body.classList.add("chars-visible");
            }, 260);
        };

        var step = function () {
            loaded++;
            if (fill) {
                fill.style.width = Math.round((loaded / critical.length) * 100) + "%";
            }
            if (loaded >= critical.length) {
                reveal();
            }
        };

        critical.forEach(function (src) {
            var img = new Image();
            img.onload = step;
            img.onerror = step;
            img.src = src;
        });

        // A stalled asset must never hold the page hostage
        setTimeout(reveal, 5000);
    }

    function start() {
        setVh();
        window.addEventListener("resize", setVh);
        window.addEventListener("orientationchange", setVh);

        wireConfig();
        applyLang(storedLang());
        loadOnline();
        wireChrome();
        boot();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
}());
