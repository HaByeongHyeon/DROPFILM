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

function getSectionPinEnd(section) {
    var height = section.offsetHeight;
    var paddingBottom;

    if (section.classList.contains("effect-sec")) {
        paddingBottom = parseFloat(window.getComputedStyle(section).paddingBottom) || 0;
        height = Math.max(window.innerHeight, height - paddingBottom);
    }

    return "+=" + Math.round(height + window.innerHeight * 0.6);
}

function getSlidePinEnd(section, timeline) {
    var base = section.offsetHeight + window.innerHeight * 0.6;
    var total = timeline && timeline.duration ? timeline.duration() : 0;
    var shrinkAt;
    var slidePart;
    var rest;

    if (!total) {
        return "+=" + Math.round(base * 4);
    }

    shrinkAt = timeline.labels.shrink;
    if (typeof shrinkAt !== "number") {
        return "+=" + Math.round(base * 4);
    }

    slidePart = shrinkAt;
    rest = total - shrinkAt;
    return "+=" + Math.round(base * ((slidePart * 4) + rest) / total);
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
        start: "center center",
        pin: false,
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
                    start: "top top",
                    end: function () {
                        return getSectionPinEnd(section);
                    },
                    pin: true,
                    pinSpacing: true,
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
                    immediateRender: false
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
                    start: "top top",
                    end: function () {
                        return getSectionPinEnd(section);
                    },
                    pin: true,
                    pinSpacing: true,
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
                    immediateRender: false
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
    var firstWrap = document.querySelector(".merit-1-wrap");
    var first = document.querySelector(".merit-1 .merit-text");
    var firstDesc = document.querySelector(".merit-1-desc .merit-text");
    var second = document.querySelector(".merit-2 .merit-text");
    var secondDesc = document.querySelector(".merit-2-desc .merit-text");
    var line = document.querySelector(".merit-line");

    if (!section || !firstWrap || !first || !firstDesc || !second || !secondDesc || !line) {
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
            start: "top top",
            end: function () {
                return getSectionPinEnd(section);
            },
            pin: true,
            pinSpacing: true,
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
            start: "top top",
            pin: false,
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
        borderRadius: 0,
        transformOrigin: "center center"
    });

    if (pagination) {
        gsap.set(pagination, {
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
        paused: true
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

    ScrollTrigger.create({
        id: "slide-pin",
        trigger: section,
        animation: timeline,
        start: "top top",
        end: function () {
            return getSlidePinEnd(section, timeline);
        },
        pin: true,
        pinSpacing: true,
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
    });
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
        var wrapRect;
        var wrapCenter;
        var viewCenter;
        var delta;
        var minTop;
        var headerEl;

        gsap.set(wrap, { y: 0 });
        wrapRect = wrap.getBoundingClientRect();

        if (wrapRect.bottom < 0 || wrapRect.top > window.innerHeight) {
            gsap.set(wrap, { y: currentY });
            return 0;
        }

        wrapCenter = wrapRect.top + wrapRect.height / 2;
        viewCenter = window.innerHeight / 2;
        delta = viewCenter - wrapCenter;

        minTop = 16;
        headerEl = document.querySelector(".header");
        if (window.matchMedia("(max-width: 1024px)").matches && headerEl) {
            minTop = headerEl.offsetHeight + 16;
        }

        if (wrapRect.top + delta < minTop) {
            delta = minTop - wrapRect.top;
        }

        gsap.set(wrap, { y: currentY });
        return delta;
    }

    function getEffectPinStart() {
        var currentY = gsap.getProperty(wrap, "y") || 0;
        var wrapRect;
        var wrapCenter;
        var start;
        var slideST;

        gsap.set(wrap, { y: 0 });
        wrapRect = wrap.getBoundingClientRect();
        wrapCenter = wrapRect.top + window.pageYOffset + wrapRect.height / 2;
        gsap.set(wrap, { y: currentY });

        start = wrapCenter - window.innerHeight / 2;
        slideST = ScrollTrigger.getById("slide-pin");

        if (slideST && start < slideST.end) {
            start = slideST.end;
        }

        return start;
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
    if (section.dataset.effectRefreshBound !== "1") {
        section.dataset.effectRefreshBound = "1";
        ScrollTrigger.addEventListener("refreshInit", updateEffectClearance);
    }

    gsap.set(wrap, { clearProps: "transform" });
    gsap.set(cardTops, { opacity: 0, y: 0 });
    gsap.set(cardBottoms, { opacity: 0, y: 0 });
    gsap.set(intro, { opacity: 1, clearProps: "transform" });

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
            start: getEffectPinStart,
            end: function () {
                return getSectionPinEnd(section);
            },
            pin: true,
            pinSpacing: true,
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

    timeline.fromTo(
        wrap,
        { y: 0 },
        {
            y: getWrapCenterY,
            duration: 1.2,
            immediateRender: false
        }
    );

    if (intro.length) {
        timeline.to(intro, {
            opacity: 0,
            y: -24,
            duration: 0.8,
            immediateRender: false
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

    timeline.fromTo(
        cardTops,
        { opacity: 0, y: -40 },
        {
            opacity: 1,
            y: 0,
            duration: 1,
            immediateRender: false
        },
        "reveal"
    );

    timeline.fromTo(
        cardBottoms,
        { opacity: 0, y: 40 },
        {
            opacity: 1,
            y: 0,
            duration: 1,
            immediateRender: false
        },
        "reveal"
    );

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
