(function (window, document) {
    "use strict";

    var ENABLE_QUERY = "(min-width: 875px)";
    var GSAP_LAG_SMOOTHING_DELAY = 500;
    var GSAP_LAG_SMOOTHING_DELTA = 33;
    var instance = null;
    var tickerFn = null;
    var mediaQuery = null;
    var mediaBound = false;
    var initialized = false;

    function hasLenis() {
        return typeof window.Lenis === "function";
    }

    function hasGsap() {
        return typeof window.gsap !== "undefined";
    }

    function hasScrollTrigger() {
        return typeof window.ScrollTrigger !== "undefined";
    }

    function shouldEnable() {
        return window.matchMedia(ENABLE_QUERY).matches;
    }

    function isNestedScrollTarget(node) {
        if (!node || typeof node.closest !== "function") {
            return false;
        }

        return Boolean(node.closest(
            "[data-lenis-prevent], .swiper, .swiper-wrapper, .detail-main-viewport, .header-nav, .header-overlay, #map"
        ));
    }

    function onLenisScroll() {
        if (hasScrollTrigger()) {
            ScrollTrigger.update();
        }
    }

    function attachGsapTicker(lenis) {
        if (!hasGsap() || tickerFn) {
            return;
        }

        tickerFn = function (time) {
            if (instance === lenis) {
                lenis.raf(time * 1000);
            }
        };

        gsap.ticker.add(tickerFn);
        gsap.ticker.lagSmoothing(0);
    }

    function detachGsapTicker() {
        if (!tickerFn) {
            return;
        }

        if (hasGsap()) {
            gsap.ticker.remove(tickerFn);
            gsap.ticker.lagSmoothing(GSAP_LAG_SMOOTHING_DELAY, GSAP_LAG_SMOOTHING_DELTA);
        }

        tickerFn = null;
    }

    function createInstance() {
        if (instance || !hasLenis()) {
            return instance;
        }

        instance = new Lenis({
            wrapper: window,
            content: document.documentElement,
            lerp: 0.1,
            smoothWheel: true,
            syncTouch: false,
            autoRaf: !hasGsap(),
            autoResize: true,
            anchors: true,
            allowNestedScroll: true,
            overscroll: true,
            prevent: isNestedScrollTarget
        });

        instance.on("scroll", onLenisScroll);

        if (hasGsap()) {
            attachGsapTicker(instance);
        }

        window.dropfilmSmoothScroll = instance;
        return instance;
    }

    function destroyInstance() {
        detachGsapTicker();

        if (!instance) {
            window.dropfilmSmoothScroll = null;
            return;
        }

        if (typeof instance.off === "function") {
            instance.off("scroll", onLenisScroll);
        }

        instance.destroy();
        instance = null;
        window.dropfilmSmoothScroll = null;
    }

    function syncSmoothScrollMode() {
        if (shouldEnable()) {
            createInstance();
            if (instance && instance.isStopped) {
                instance.start();
            }
            return;
        }

        destroyInstance();
    }

    function bindMedia() {
        if (mediaBound) {
            return;
        }

        mediaQuery = window.matchMedia(ENABLE_QUERY);
        mediaBound = true;

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", syncSmoothScrollMode);
        } else if (typeof mediaQuery.addListener === "function") {
            mediaQuery.addListener(syncSmoothScrollMode);
        }
    }

    function initDropfilmSmoothScroll() {
        if (!initialized) {
            initialized = true;
            bindMedia();
        }

        syncSmoothScrollMode();
        return window.dropfilmSmoothScroll || null;
    }

    window.initDropfilmSmoothScroll = initDropfilmSmoothScroll;
    window.dropfilmSmoothScroll = null;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initDropfilmSmoothScroll);
    } else {
        initDropfilmSmoothScroll();
    }
})(window, document);
