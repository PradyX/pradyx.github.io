/* Theme switcher: pure browser-side JavaScript, GitHub Pages friendly.
   Each visit loads a random theme (see the inline bootstrap script in
   index.html, which applies it before first paint). A theme manually
   chosen in the switcher is kept for the tab session (sessionStorage),
   so the next visit rolls a new random theme again. */
(function () {
    "use strict";

    var STORAGE_KEY = "portfolio-theme";
    var root = document.documentElement;

    function getThemeNames() {
        var names = [];
        var swatches = document.querySelectorAll("[data-theme-option]");
        for (var i = 0; i < swatches.length; i++) {
            names.push(swatches[i].getAttribute("data-theme-option"));
        }
        return names;
    }

    function getStoredTheme() {
        try {
            return sessionStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function storeTheme(theme) {
        try {
            sessionStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            /* Storage unavailable; theme still applies for this page. */
        }
    }

    function randomTheme() {
        var themes = getThemeNames();
        return themes[Math.floor(Math.random() * themes.length)];
    }

    function isValidTheme(theme) {
        return !!theme && !!document.querySelector('[data-theme-option="' + theme + '"]');
    }

    function updateMetaThemeColor() {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            return;
        }
        var probe = document.createElement("span");
        probe.style.display = "none";
        document.body.appendChild(probe);
        var color = getComputedStyle(probe).getPropertyValue("--theme-color").trim();
        document.body.removeChild(probe);
        if (color) {
            meta.setAttribute("content", color);
        }
    }

    function applyTheme(theme) {
        if (!isValidTheme(theme)) {
            theme = randomTheme();
        }
        root.setAttribute("data-theme", theme);

        var swatches = document.querySelectorAll("[data-theme-option]");
        for (var i = 0; i < swatches.length; i++) {
            var selected = swatches[i].getAttribute("data-theme-option") === theme;
            swatches[i].setAttribute("aria-pressed", selected ? "true" : "false");
        }

        updateMetaThemeColor();
    }

    /* Validate the pre-paint theme (or reroll if none was set). */
    applyTheme(root.getAttribute("data-theme") || randomTheme());

    document.addEventListener("DOMContentLoaded", function () {
        var toggle = document.getElementById("theme-toggle");
        var menu = document.getElementById("theme-menu");

        applyTheme(root.getAttribute("data-theme"));

        if (!toggle || !menu) {
            return;
        }

        function setMenuOpen(open) {
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            if (open) {
                menu.removeAttribute("hidden");
            } else {
                menu.setAttribute("hidden", "");
            }
        }

        toggle.addEventListener("click", function () {
            setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
        });

        menu.addEventListener("click", function (event) {
            if (event.target.closest("[data-theme-random]")) {
                var rerolled = randomTheme();
                storeTheme(rerolled);
                applyTheme(rerolled);
                setMenuOpen(false);
                toggle.focus();
                return;
            }

            var swatch = event.target.closest("[data-theme-option]");
            if (!swatch) {
                return;
            }
            var theme = swatch.getAttribute("data-theme-option");
            storeTheme(theme);
            applyTheme(theme);
            setMenuOpen(false);
            toggle.focus();
        });

        document.addEventListener("click", function (event) {
            if (!event.target.closest("#theme-switcher")) {
                setMenuOpen(false);
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
                setMenuOpen(false);
                toggle.focus();
            }
        });
    });
})();
