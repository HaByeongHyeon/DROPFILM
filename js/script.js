document.addEventListener("DOMContentLoaded", function () {
    var componentsReady = loadComponents().then(function () {
        initHeader();
    });

    initAboutScroll();
    initPromotionScroll();
    initMeritScroll();
    initComparisonPlanFade();
    initComparisonPlanSequence();
    initSatisfactionListSequence();
    initSlideScroll();
    initBrandSwiper();
    initEffectScroll();
    initContactForm();

    Promise.all([
        componentsReady.then(function () {
            return waitForImages();
        }),
        waitForFonts(),
        waitForWindowLoad()
    ]).then(function () {
        refreshScrollLayout();
    });

    var refreshTimer;
    window.addEventListener("resize", function () {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () {
            refreshScrollLayout();
        }, 200);
    });
});

function waitForWindowLoad() {
    return new Promise(function (resolve) {
        if (document.readyState === "complete") {
            resolve();
            return;
        }

        window.addEventListener("load", resolve, { once: true });
    });
}

function waitForFonts() {
    if (document.fonts && document.fonts.ready) {
        return document.fonts.ready.catch(function () {});
    }

    return Promise.resolve();
}

function waitForImages() {
    var imgs = Array.prototype.slice.call(document.images);

    return Promise.all(imgs.map(function (img) {
        if (img.complete && img.naturalWidth) {
            return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
        }

        return new Promise(function (resolve) {
            function done() {
                if (img.decode) {
                    img.decode().then(resolve).catch(resolve);
                    return;
                }

                resolve();
            }

            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", resolve, { once: true });
        });
    }));
}

function refreshScrollLayout() {
    if (typeof ScrollTrigger === "undefined") {
        return;
    }

    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            ScrollTrigger.refresh();
        });
    });
}

function loadComponents() {
    var slots = document.querySelectorAll("[data-component]");

    return Promise.all(
        Array.from(slots).map(function (slot) {
            var name = slot.getAttribute("data-component");
            var path = "./assets/component/" + name + ".html";

            return fetch(path)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error(
                            "Failed to load component: " + name + " (" + response.status + ")"
                        );
                    }
                    return response.text();
                })
                .then(function (html) {
                    slot.innerHTML = html;
                })
                .catch(function (error) {
                    console.error(error);
                });
        })
    );
}

function isPinRangeActive(scroll, ids) {
    return ScrollTrigger.getAll().some(function (st) {
        if (!st.pin || st.vars.id === "header-hide") {
            return false;
        }
        if (ids && ids.indexOf(st.vars.id) === -1) {
            return false;
        }
        return scroll >= st.start && scroll <= st.end + 1;
    });
}

function effectCardsOverlapHeader(header) {
    var headerBox = header.getBoundingClientRect();
    var effect = document.querySelector(".effect-sec");
    var nodes;
    var i;
    var rect;
    var cs;

    if (!effect) {
        return false;
    }

    nodes = effect.querySelectorAll(".card-top, .card-bottom, .card-wrap");

    for (i = 0; i < nodes.length; i++) {
        cs = window.getComputedStyle(nodes[i]);
        if (Number(cs.opacity) < 0.05 || cs.visibility === "hidden") {
            continue;
        }
        rect = nodes[i].getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) {
            continue;
        }
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
            continue;
        }
        if (rect.bottom > headerBox.top && rect.top < headerBox.bottom) {
            return true;
        }
    }

    return false;
}

function createHeaderHideTrigger(header, options) {
    var existing = ScrollTrigger.getById("header-hide");
    if (existing) {
        existing.kill();
    }

    var showAnim = gsap.from(header, {
        yPercent: -100,
        paused: true,
        duration: 0.25,
        ease: "power2.out"
    }).progress(1);

    ScrollTrigger.create({
        id: "header-hide",
        start: "top top",
        end: "max",
        onUpdate: function (self) {
            if (self.scroll() <= header.offsetHeight) {
                showAnim.play();
                return;
            }

            var covering = isPinRangeActive(self.scroll(), options.pinIds);

            if (!covering && effectCardsOverlapHeader(header)) {
                covering = true;
            }

            if (covering) {
                showAnim.reverse();
                return;
            }

            if (options.hideOnScrollDown) {
                if (self.direction === -1) {
                    showAnim.play();
                } else {
                    showAnim.reverse();
                }
                return;
            }

            showAnim.play();
        }
    });
}

function initHeader() {
    var header = document.querySelector(".header");
    if (!header) {
        return;
    }

    initTabletHeaderMenu(header);

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var mm = gsap.matchMedia();

    mm.add("(min-width: 1025px)", function () {
        createHeaderHideTrigger(header, {
            hideOnScrollDown: true,
            pinIds: null
        });

        return function () {
            var hide = ScrollTrigger.getById("header-hide");
            if (hide) {
                hide.kill();
            }
            gsap.set(header, { clearProps: "transform,overflow" });
        };
    });

    mm.add("(max-width: 1024px)", function () {
        var hide = ScrollTrigger.getById("header-hide");
        if (hide) {
            hide.kill();
        }
        gsap.set(header, { clearProps: "transform,overflow" });
    });
}

function initTabletHeaderMenu(header) {
    var toggle = header.querySelector(".header-toggle");
    var overlay = header.querySelector(".header-overlay");
    var nav = header.querySelector(".header-nav");

    if (!toggle || !overlay || !nav) {
        return;
    }

    var isMenuOpen = false;
    var tabletQuery = window.matchMedia("(max-width: 1024px)");

    function setMenuOpen(open) {
        if (!tabletQuery.matches) {
            open = false;
        }

        isMenuOpen = open;
        header.classList.toggle("is-menu-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
        overlay.setAttribute("aria-hidden", open ? "false" : "true");

        if (open) {
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
        } else {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
        }
    }

    toggle.addEventListener("click", function () {
        if (!tabletQuery.matches) {
            return;
        }

        setMenuOpen(!isMenuOpen);
    });

    overlay.addEventListener("click", function () {
        if (isMenuOpen) {
            setMenuOpen(false);
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && isMenuOpen) {
            setMenuOpen(false);
        }
    });

    if (typeof tabletQuery.addEventListener === "function") {
        tabletQuery.addEventListener("change", function () {
            if (!tabletQuery.matches) {
                setMenuOpen(false);
            }
        });
    } else if (typeof tabletQuery.addListener === "function") {
        tabletQuery.addListener(function () {
            if (!tabletQuery.matches) {
                setMenuOpen(false);
            }
        });
    }

    setMenuOpen(false);
}

function initPromotionScroll() {
    var section = document.querySelector(".promotion-sec");
    var wrap = document.querySelector(".promotion-sec .promotion-wrap");
    var orangeCircle = document.querySelector(".promotion-sec .orange-circle");
    var amountSpan = document.querySelector(".promotion-sec .orange-amount span");

    if (!section || !wrap || !orangeCircle || !amountSpan) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var existing = ScrollTrigger.getById("promotion-intro");
    if (existing) {
        existing.kill();
    }

    var whiteItems = Array.prototype.slice.call(
        document.querySelectorAll(".promotion-sec .white-circle li")
    );
    var finalAmountText = amountSpan.textContent.trim();
    var targetAmount = parseInt(finalAmountText.replace(/[^\d]/g, ""), 10);

    if (isNaN(targetAmount)) {
        targetAmount = 0;
    }

    function formatAmount(value) {
        return Math.round(value).toLocaleString("en-US");
    }

    gsap.set(whiteItems, { opacity: 0, y: 40 });
    gsap.set(orangeCircle, { opacity: 0, y: 40 });
    gsap.set(wrap, { "--promotion-line-scale": 0 });
    gsap.set(amountSpan, {
        minWidth: amountSpan.offsetWidth,
        display: "inline-block",
        textAlign: "center"
    });
    amountSpan.textContent = formatAmount(0);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(whiteItems, { opacity: 1, y: 0 });
        gsap.set(wrap, { "--promotion-line-scale": 1 });
        gsap.set(orangeCircle, { opacity: 1, y: 0 });
        amountSpan.textContent = finalAmountText;
        return;
    }

    var count = { value: 0 };
    var lineScale = { value: 0 };

    var timeline = gsap.timeline({ paused: true });

    whiteItems.forEach(function (item, index) {
        timeline.to(item, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out"
        });

        if (index === whiteItems.length - 1) {
            timeline.to(lineScale, {
                value: 1,
                duration: 0.4,
                ease: "none",
                onUpdate: function () {
                    wrap.style.setProperty("--promotion-line-scale", String(lineScale.value));
                }
            }, "<");
        }
    });

    if (!whiteItems.length) {
        timeline.to(lineScale, {
            value: 1,
            duration: 0.4,
            ease: "none",
            onUpdate: function () {
                wrap.style.setProperty("--promotion-line-scale", String(lineScale.value));
            }
        });
    }

    timeline.to(orangeCircle, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
    });

    timeline.to(count, {
        value: targetAmount,
        duration: 0.5,
        ease: "power1.out",
        onUpdate: function () {
            amountSpan.textContent = formatAmount(count.value);
        },
        onComplete: function () {
            amountSpan.textContent = finalAmountText;
        }
    });

    ScrollTrigger.create({
        id: "promotion-intro",
        trigger: section,
        start: "top 80%",
        once: true,
        onEnter: function () {
            timeline.play();
        }
    });
}

function initAboutScroll() {
    var section = document.querySelector(".about-sec");
    var img = document.querySelector(".about-sec .about-con > img");
    var aboutText = document.querySelector(".about-sec .about-text");

    if (!section || !img || !aboutText) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var textItems = Array.prototype.slice.call(aboutText.children);

    function killAboutPin() {
        var existing = ScrollTrigger.getById("about-pin");
        if (existing) {
            existing.kill();
        }
    }

    function measureImgCenterOffset() {
        var currentX = gsap.getProperty(img, "x") || 0;
        var currentY = gsap.getProperty(img, "y") || 0;

        gsap.set(img, { x: 0, y: 0 });

        var sectionRect = section.getBoundingClientRect();
        var imgRect = img.getBoundingClientRect();
        var imgCenterX = imgRect.left - sectionRect.left + imgRect.width / 2;

        gsap.set(img, { x: currentX, y: currentY });

        return {
            x: window.innerWidth / 2 - imgCenterX
        };
    }

    function start() {
        if (section.dataset.aboutScrollReady === "1") {
            return;
        }
        section.dataset.aboutScrollReady = "1";

        var mm = gsap.matchMedia();

        mm.add("(min-width: 1025px)", function () {
            killAboutPin();
            gsap.set(img, { y: 0, scale: 1, transformOrigin: "center center" });
            gsap.set(textItems, { opacity: 0, y: 40 });

            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                gsap.set(img, { x: 0, y: 0, opacity: 1 });
                gsap.set(textItems, { opacity: 1, y: 0 });
                return function () {
                    killAboutPin();
                    gsap.set(img, { clearProps: "x,y,scale,transform" });
                    gsap.set(textItems, { clearProps: "opacity,transform" });
                };
            }

            var textTimeline = gsap.timeline({ paused: true });

            textItems.forEach(function (item) {
                textTimeline.to(item, {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });

            var imgDuration = 3;
            var holdDuration = 2.4;
            var imgEnd = imgDuration / (imgDuration + holdDuration);

            var timeline = gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                    id: "about-pin",
                    trigger: section,
                    start: "top 80%",
                    end: "bottom 20%",
                    scrub: 0.35,
                    invalidateOnRefresh: true,
                    onUpdate: function (self) {
                        if (self.progress >= imgEnd) {
                            textTimeline.play();
                        } else {
                            textTimeline.reverse();
                        }
                    }
                }
            });

            timeline.fromTo(
                img,
                {
                    x: function () {
                        return measureImgCenterOffset().x;
                    },
                    opacity: 0.6
                },
                {
                    x: 0,
                    opacity: 1,
                    duration: imgDuration,
                    immediateRender: true
                }
            );

            timeline.to({}, { duration: holdDuration });

            return function () {
                killAboutPin();
                textTimeline.kill();
                gsap.set(img, { clearProps: "x,y,scale,transform" });
                gsap.set(textItems, { clearProps: "opacity,transform" });
            };
        });

        mm.add("(max-width: 1024px)", function () {
            killAboutPin();
            gsap.set(img, {
                x: 0,
                y: 0,
                scale: 0.72,
                opacity: 1,
                transformOrigin: "center center"
            });
            gsap.set(textItems, { opacity: 0, y: 40 });

            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                gsap.set(img, { scale: 1, opacity: 1 });
                gsap.set(textItems, { opacity: 1, y: 0 });
                return function () {
                    killAboutPin();
                    gsap.set(img, { clearProps: "scale,x,y,transform" });
                    gsap.set(textItems, { clearProps: "opacity,transform" });
                };
            }

            var timeline = gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                    id: "about-pin",
                    trigger: section,
                    start: "top 80%",
                    end: "bottom 20%",
                    scrub: 0.35,
                    invalidateOnRefresh: true
                }
            });

            timeline.fromTo(
                img,
                {
                    scale: 0.72,
                    opacity: 1
                },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 2,
                    immediateRender: true
                }
            );

            timeline.to({}, { duration: 0.5 });

            timeline.to(textItems, {
                opacity: 1,
                y: 0,
                duration: 1
            });

            timeline.to({}, { duration: 0.6 });

            return function () {
                killAboutPin();
                gsap.set(img, { clearProps: "scale,x,y,transform" });
                gsap.set(textItems, { clearProps: "opacity,transform" });
            };
        });
    }

    if (img.complete) {
        start();
    } else {
        img.addEventListener("load", start, { once: true });
    }
}

function initMeritScroll() {
    var section = document.querySelector(".merit-sec");
    var first = document.querySelector(".merit-1 .merit-text");
    var firstDesc = document.querySelector(".merit-1-desc .merit-text");
    var second = document.querySelector(".merit-2 .merit-text");
    var secondDesc = document.querySelector(".merit-2-desc .merit-text");
    var line = document.querySelector(".merit-line");

    if (!section || !first || !firstDesc || !second || !secondDesc || !line) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var existing = ScrollTrigger.getById("merit-pin");
    if (existing) {
        existing.kill();
    }

    setMeritTextProgress(first, 0);
    setMeritTextProgress(firstDesc, 0);
    setMeritLineProgress(line, 0);
    setMeritTextProgress(second, 0);
    setMeritTextProgress(secondDesc, 0);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setMeritTextProgress(first, 1);
        setMeritTextProgress(firstDesc, 1);
        setMeritLineProgress(line, 1);
        setMeritTextProgress(second, 1);
        setMeritTextProgress(secondDesc, 1);
        return;
    }

    var merit1 = { p: 0 };
    var merit1Desc = { p: 0 };
    var lineFill = { p: 0 };
    var merit2 = { p: 0 };
    var merit2Desc = { p: 0 };

    var timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
            id: "merit-pin",
            trigger: section,
            start: "top 80%",
            end: "bottom 20%",
            scrub: 1,
            invalidateOnRefresh: true
        }
    });

    timeline.to(merit1, {
        p: 1,
        duration: 2.6,
        onUpdate: function () {
            setMeritTextProgress(first, merit1.p);
        }
    });

    timeline.to(merit1Desc, {
        p: 1,
        duration: 1.8,
        onUpdate: function () {
            setMeritTextProgress(firstDesc, merit1Desc.p);
        }
    });

    timeline.to(lineFill, {
        p: 1,
        duration: 1.6,
        onUpdate: function () {
            setMeritLineProgress(line, lineFill.p);
        }
    });

    timeline.to(merit2, {
        p: 1,
        duration: 2.6,
        onUpdate: function () {
            setMeritTextProgress(second, merit2.p);
        }
    });

    timeline.to(merit2Desc, {
        p: 1,
        duration: 1.8,
        onUpdate: function () {
            setMeritTextProgress(secondDesc, merit2Desc.p);
        }
    });

    timeline.to({}, { duration: 1 });
}

function setMeritTextProgress(el, progress) {
    var p = Math.max(0, Math.min(1, progress));
    var gradient = 0;
    var cursor = 0;

    if (p > 0 && p < 1) {
        gradient = Math.sin(p * Math.PI) * 0.55;
        cursor = 1;
    }

    el.style.setProperty("--merit-progress", String(p));
    el.style.setProperty("--merit-gradient-opacity", String(gradient));
    el.style.setProperty("--merit-cursor-opacity", String(cursor));
}

function setMeritLineProgress(el, progress) {
    var p = Math.max(0, Math.min(1, progress));
    el.style.setProperty("--merit-line-progress", String(p));
}

function initComparisonPlanFade() {
    var section = document.querySelector(".comparison-sec");
    var planWrap = document.querySelector(".comparison-sec .plan-wrap");

    if (!section || !planWrap) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var existing = ScrollTrigger.getById("comparison-plan-fade");
    if (existing) {
        existing.kill();
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(planWrap, { opacity: 1, y: 0 });
        return;
    }

    gsap.fromTo(
        planWrap,
        {
            opacity: 0,
            y: 40
        },
        {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            immediateRender: true,
            scrollTrigger: {
                id: "comparison-plan-fade",
                trigger: section,
                start: "top center",
                toggleActions: "play none none reverse",
                invalidateOnRefresh: true
            }
        }
    );
}

function initSatisfactionListFade() {
    var section = document.querySelector(".Satisfaction-sec");
    var list = document.querySelector(".Satisfaction-sec .Satisfaction-list");

    if (!section || !list) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var existing = ScrollTrigger.getById("satisfaction-list-fade");
    if (existing) {
        existing.kill();
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(list, { opacity: 1, y: 0 });
        return;
    }

    gsap.fromTo(
        list,
        {
            opacity: 0,
            y: 40
        },
        {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            immediateRender: true,
            scrollTrigger: {
                id: "satisfaction-list-fade",
                trigger: section,
                start: "top center",
                toggleActions: "play none none reverse",
                invalidateOnRefresh: true
            }
        }
    );
}

function initComparisonPlanSequence() {
    var section = document.querySelector(".comparison-sec");
    var plans = document.querySelectorAll(".comparison-sec .plan");

    if (!section || !plans.length) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var existing = ScrollTrigger.getById("comparison-plan-sequence");
    if (existing) {
        existing.kill();
    }

    gsap.set(plans, { opacity: 0, y: 40 });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(plans, { opacity: 1, y: 0 });
        return;
    }

    var timeline = gsap.timeline({
        defaults: {
            duration: 0.4,
            ease: "power2.out"
        },
        scrollTrigger: {
            id: "comparison-plan-sequence",
            trigger: section,
            start: "top center",
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true
        }
    });

    Array.prototype.forEach.call(plans, function (plan) {
        timeline.to(plan, {
            opacity: 1,
            y: 0
        });
    });
}

function initSatisfactionListSequence() {
    var section = document.querySelector(".Satisfaction-sec");
    var items = document.querySelectorAll(".Satisfaction-sec .Satisfaction-list > li");

    if (!section || !items.length) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var existing = ScrollTrigger.getById("satisfaction-list-sequence");
    if (existing) {
        existing.kill();
    }

    gsap.set(items, { opacity: 0, y: 40 });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(items, { opacity: 1, y: 0 });
        return;
    }

    var timeline = gsap.timeline({
        defaults: {
            duration: 0.4,
            ease: "power2.out"
        },
        scrollTrigger: {
            id: "satisfaction-list-sequence",
            trigger: section,
            start: "top center",
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true
        }
    });

    Array.prototype.forEach.call(items, function (item) {
        timeline.to(item, {
            opacity: 1,
            y: 0
        });
    });
}

function initSlideScroll() {
    var section = document.querySelector(".slide-sec");
    var wrap = document.querySelector(".slide-sec .slide-wrap");
    var pagination = document.querySelector(".slide-sec .pagenation");

    if (!section || !wrap) {
        return;
    }

    var slides = wrap.querySelectorAll(".slide");
    var pages = section.querySelectorAll(".pagenation .page");

    if (!slides.length) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var existing = ScrollTrigger.getById("slide-pin");
    if (existing) {
        existing.kill();
    }

    function getTextItems(slide) {
        return Array.prototype.filter.call(slide.children, function (child) {
            return !child.classList.contains("slide-dim");
        });
    }

    var OVERLAY_MAX = 0.6;
    var overlays = Array.prototype.map.call(slides, function (slide) {
        var dim = slide.querySelector(".slide-dim");

        if (!dim) {
            dim = document.createElement("div");
            dim.className = "slide-dim";
            dim.setAttribute("aria-hidden", "true");
            slide.insertBefore(dim, slide.firstChild);
        }

        gsap.set(dim, { autoAlpha: 0 });
        return dim;
    });

    function setPageActive(index) {
        Array.prototype.forEach.call(pages, function (page, pageIndex) {
            if (pageIndex === index) {
                page.classList.add("active");
            } else {
                page.classList.remove("active");
            }
        });
    }

    function getSlideTravel() {
        return wrap.offsetHeight || window.innerHeight;
    }

    function getEndScale() {
        var width = wrap.offsetWidth || window.innerWidth;
        if (!width) {
            return 1;
        }

        var targetWidth = 1440;
        if (window.matchMedia("(max-width: 1024px)").matches) {
            targetWidth = Math.min(width * 0.88, width - 40);
        }

        return Math.min(1, targetWidth / width);
    }

    function getPaginationOrigin() {
        if (!pagination) {
            return "center center";
        }

        var sectionRect = section.getBoundingClientRect();
        var pageRect = pagination.getBoundingClientRect();

        return (
            sectionRect.width / 2 - (pageRect.left - sectionRect.left) + "px " +
            (sectionRect.height / 2 - (pageRect.top - sectionRect.top)) + "px"
        );
    }

    Array.prototype.forEach.call(slides, function (slide, index) {
        gsap.set(slide, {
            x: 0,
            y: index === 0 ? 0 : getSlideTravel(),
            zIndex: index + 1,
            force3D: true
        });
        gsap.set(getTextItems(slide), { opacity: 0, y: 40 });
    });

    gsap.set(wrap, {
        scale: 1,
        borderRadius: 0,
        transformOrigin: "center center"
    });

    if (pagination) {
        gsap.set(pagination, {
            scale: 1,
            transformOrigin: getPaginationOrigin()
        });
    }

    setPageActive(0);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(slides[0], { y: 0 });
        gsap.set(overlays[0], { autoAlpha: OVERLAY_MAX });
        gsap.set(getTextItems(slides[0]), { opacity: 1, y: 0 });
        return;
    }

    var hold = { value: 0 };

    var timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
            id: "slide-pin",
            trigger: section,
            start: "top 80%",
            end: "bottom 20%",
            scrub: 0.35,
            invalidateOnRefresh: true,
            onRefresh: function () {
                Array.prototype.forEach.call(slides, function (slide, index) {
                    if (index === 0) {
                        return;
                    }

                    var tween = timeline.getTweensOf(slide)[0];
                    if (!tween || tween.progress() > 0) {
                        return;
                    }

                    gsap.set(slide, { y: getSlideTravel() });
                });

                if (pagination) {
                    gsap.set(pagination, { transformOrigin: getPaginationOrigin() });
                }
            },
            onUpdate: function () {
                var current = 0;
                var time = timeline.time();

                for (var i = 0; i < slides.length; i++) {
                    var labelTime = timeline.labels["slide-" + i];
                    if (typeof labelTime === "number" && time >= labelTime - 0.0001) {
                        current = i;
                    }
                }

                setPageActive(current);
            }
        }
    });

    Array.prototype.forEach.call(slides, function (slide, index) {
        timeline.addLabel("slide-" + index);

        if (index > 0) {
            timeline.fromTo(
                slide,
                {
                    y: getSlideTravel
                },
                {
                    y: 0,
                    duration: 1.2,
                    immediateRender: false
                }
            );
        }

        timeline.fromTo(
            overlays[index],
            {
                autoAlpha: 0
            },
            {
                autoAlpha: OVERLAY_MAX,
                duration: 0.9,
                immediateRender: false
            }
        );

        timeline.to(getTextItems(slide), {
            opacity: 1,
            y: 0,
            duration: 0.8
        });

        timeline.to(hold, { value: index + 1, duration: 0.6 });
    });

    timeline.to(hold, { value: hold.value + 1, duration: 0.5 });

    timeline.addLabel("shrink");

    timeline.to(wrap, {
        scale: getEndScale,
        borderRadius: 48,
        duration: 1.4
    }, "shrink");

    if (pagination) {
        timeline.to(pagination, {
            scale: getEndScale,
            duration: 1.4
        }, "shrink");
    }

    timeline.to(hold, { value: hold.value + 2, duration: 0.7 });
}

function initBrandSwiper() {
    var wraps = document.querySelectorAll(".brand-wrap");

    if (!wraps.length) {
        return;
    }

    if (typeof Swiper === "undefined") {
        console.error("Swiper is not loaded.");
        return;
    }

    Array.prototype.forEach.call(wraps, function (wrap, index) {
        wrap.classList.add("swiper");
        wrap.classList.add("swiper-" + index);

        if (!wrap.querySelector(".swiper-wrapper")) {
            var originals = Array.prototype.slice.call(wrap.children);
            originals.forEach(function (child) {
                wrap.appendChild(child.cloneNode(true));
            });

            var wrapper = document.createElement("div");
            wrapper.className = "swiper-wrapper";

            Array.prototype.slice.call(wrap.children).forEach(function (child) {
                var slide = document.createElement("div");
                slide.className = "swiper-slide";
                slide.appendChild(child);
                wrapper.appendChild(slide);
            });

            wrap.appendChild(wrapper);
        }

        new Swiper(wrap, {
            slidesPerView: "auto",
            spaceBetween: 150,
            loop: true,
            speed: 5000,
            allowTouchMove: false,
            autoplay: {
                delay: 0,
                disableOnInteraction: false
            },
            breakpoints: {
                0: {
                    spaceBetween: 80
                },
                768: {
                    spaceBetween: 64
                },
                1025: {
                    spaceBetween: 150
                }
            }
        });
    });
}

function initEffectScroll() {
    var section = document.querySelector(".effect-sec");
    var wrap = document.querySelector(".effect-sec .card-wrap");
    var title = document.querySelector(".effect-sec .effect-title");
    var desc = document.querySelector(".effect-sec .effect-desc");

    if (!section || !wrap) {
        return;
    }

    var cards = wrap.querySelectorAll(".effect-card");
    var cardTops = wrap.querySelectorAll(".card-top");
    var cardBottoms = wrap.querySelectorAll(".card-bottom");

    if (!cards.length) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var existing = ScrollTrigger.getById("effect-pin");
    if (existing) {
        existing.kill();
    }

    var cardY = [-90, -30, 30, 90];

    function getCardYs() {
        var sample = wrap.querySelector(".effect-card > img");
        var ratio = sample && sample.offsetWidth ? sample.offsetWidth / 342 : 1;
        return cardY.map(function (value) {
            return Math.round(value * ratio);
        });
    }
    var intro = [];

    if (title) {
        intro.push(title);
    }
    if (desc) {
        intro.push(desc);
    }

    function getWrapCenterY() {
        var currentY = gsap.getProperty(wrap, "y") || 0;
        gsap.set(wrap, { y: 0 });

        var sectionRect = section.getBoundingClientRect();
        var wrapRect = wrap.getBoundingClientRect();
        var wrapTopInSection = wrapRect.top - sectionRect.top;
        var wrapH = wrapRect.height;
        var wrapCenter = wrapTopInSection + wrapH / 2;
        var viewCenter = window.innerHeight / 2;
        var delta = viewCenter - wrapCenter;

        var img = wrap.querySelector(".effect-card > img");
        var cardH = img ? img.getBoundingClientRect().height : 0;
        var gap = getCardGap();
        var ys = getCardYs();
        var minCardY = 0;
        var maxCardY = 0;
        var i;

        for (i = 0; i < ys.length; i++) {
            if (ys[i] < minCardY) {
                minCardY = ys[i];
            }
            if (ys[i] > maxCardY) {
                maxCardY = ys[i];
            }
        }

        var minTop = 16;
        var headerEl = document.querySelector(".header");
        if (window.matchMedia("(max-width: 1024px)").matches && headerEl) {
            minTop = headerEl.offsetHeight + 16;
        }

        var reveal = 40;
        var highest = wrapTopInSection + delta + minCardY - gap - cardH - reveal;
        if (highest < minTop) {
            delta += minTop - highest;
        }

        var sectionH = section.offsetHeight;
        var lowest = wrapTopInSection + delta + wrapH + maxCardY + gap + cardH + reveal;
        if (lowest > sectionH - 16) {
            delta -= lowest - (sectionH - 16);
            highest = wrapTopInSection + delta + minCardY - gap - cardH - reveal;
            if (highest < minTop) {
                delta += minTop - highest;
            }
        }

        gsap.set(wrap, { y: currentY });
        return delta;
    }

    function getCardGap() {
        var card = wrap.querySelector(".effect-card");
        if (!card) {
            return 40;
        }

        var gap = parseFloat(window.getComputedStyle(card).rowGap || window.getComputedStyle(card).gap);
        return isNaN(gap) ? 40 : gap;
    }

    function updateEffectClearance() {
        var img = wrap.querySelector(".effect-card > img");
        var cardH = img ? img.getBoundingClientRect().height : 400;
        var gap = getCardGap();
        var ys = getCardYs();
        var maxDown = 0;
        var i;

        for (i = 0; i < ys.length; i++) {
            if (ys[i] > maxDown) {
                maxDown = ys[i];
            }
        }

        var shift = Math.max(0, getWrapCenterY());
        var extra = Math.ceil(shift + maxDown + gap + cardH + 48);
        var minPad = window.matchMedia("(max-width: 1024px)").matches ? extra : Math.max(680, extra);

        section.style.setProperty("--effect-clearance", minPad + "px");
    }

    updateEffectClearance();
    ScrollTrigger.addEventListener("refreshInit", updateEffectClearance);

    gsap.set(wrap, { y: 0 });
    gsap.set(cardTops, { opacity: 0, y: -40 });
    gsap.set(cardBottoms, { opacity: 0, y: 40 });
    gsap.set(intro, { opacity: 1, y: 0 });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(wrap, { y: getWrapCenterY() });
        Array.prototype.forEach.call(cards, function (card, index) {
            gsap.set(card, { y: getCardYs()[index] || 0 });
        });
        gsap.set(cardTops, { opacity: 1, y: 0 });
        gsap.set(cardBottoms, { opacity: 1, y: 0 });
        gsap.set(intro, { opacity: 0, y: 0 });
        return;
    }

    var hold = { value: 0 };

    var timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
            id: "effect-pin",
            trigger: section,
            start: "top 80%",
            end: "bottom 20%",
            scrub: 0.35,
            invalidateOnRefresh: true,
            onUpdate: function () {
                var headerST = ScrollTrigger.getById("header-hide");
                if (headerST) {
                    headerST.update();
                }
            }
        }
    });

    timeline.to(wrap, {
        y: getWrapCenterY,
        duration: 1.2
    });

    if (intro.length) {
        timeline.to(intro, {
            opacity: 0,
            y: -24,
            duration: 0.8
        }, 0);
    }

    timeline.to(hold, { value: 1, duration: 0.4 });

    Array.prototype.forEach.call(cards, function (card, index) {
        timeline.to(card, {
            y: function () {
                return getCardYs()[index] || 0;
            },
            duration: 1.2
        }, "cards");
    });

    timeline.to(hold, { value: 2, duration: 0.5 });

    timeline.to(cardTops, {
        opacity: 1,
        y: 0,
        duration: 1
    }, "reveal");

    timeline.to(cardBottoms, {
        opacity: 1,
        y: 0,
        duration: 1
    }, "reveal");

    timeline.to(hold, { value: 3, duration: 0.8 });
}

function initContactForm() {
    var form = document.querySelector(".contact-sec .contact-form");

    if (!form) {
        return;
    }

    var phoneInputs = form.querySelectorAll('input[type="tel"]');
    var privacyLink = form.querySelector(".contact-privacy-link");

    Array.prototype.forEach.call(phoneInputs, function (input) {
        input.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9]/g, "").slice(0, 4);
        });

        input.addEventListener("keypress", function (event) {
            if (event.ctrlKey || event.metaKey || event.key.length !== 1) {
                return;
            }

            if (!/[0-9]/.test(event.key)) {
                event.preventDefault();
            }
        });
    });

    if (privacyLink) {
        privacyLink.addEventListener("click", function (event) {
            event.preventDefault();
        });
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        alert("문의 완료되었습니다.");
    });
}
