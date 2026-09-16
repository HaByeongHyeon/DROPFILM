document.addEventListener("DOMContentLoaded", function () {
    loadComponents().then(function () {
        initHeader();
        initIntroScroll();
        initSystemScroll();
        initVisionSlider();

        if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
        }
    });
});

window.addEventListener("load", function () {
    if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh();
    }
});

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

function initIntroScroll() {
    var section = document.querySelector(".intro-sec");
    var texts = document.querySelectorAll(".intro-sec .intro-text");
    var arrow = document.querySelector(".intro-sec .intro-arrow");

    if (!section || texts.length < 2 || !arrow) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var first = texts[0];
    var second = texts[1];
    var introTimeline = null;

    function resetIntroProgress() {
        setIntroTextProgress(first, 0);
        setIntroLineProgress(arrow, 0);
        setIntroTextProgress(second, 0);
        gsap.set(section, { clearProps: "transform" });
    }

    function destroyIntroAnimation() {
        if (introTimeline) {
            if (introTimeline.scrollTrigger) {
                introTimeline.scrollTrigger.kill(true);
            }
            introTimeline.kill();
            introTimeline = null;
        }

        var existing = ScrollTrigger.getById("intro-reveal");
        if (existing) {
            existing.kill(true);
        }

        var leftoverPin = ScrollTrigger.getById("intro-pin");
        if (leftoverPin) {
            leftoverPin.kill(true);
        }

        resetIntroProgress();
    }

    function createIntroAnimation() {
        destroyIntroAnimation();

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setIntroTextProgress(first, 1);
            setIntroLineProgress(arrow, 1);
            setIntroTextProgress(second, 1);
            return;
        }

        var intro1 = { p: 0 };
        var lineFill = { p: 0 };
        var intro2 = { p: 0 };

        introTimeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                id: "intro-reveal",
                trigger: section,
                start: "bottom bottom",
                end: "top top",
                pin: false,
                scrub: 1,
                invalidateOnRefresh: true,
                refreshPriority: 1
            }
        });

        introTimeline.to(intro1, {
            p: 1,
            duration: 2.6,
            onUpdate: function () {
                setIntroTextProgress(first, intro1.p);
            }
        });

        introTimeline.to(lineFill, {
            p: 1,
            duration: 1.6,
            onUpdate: function () {
                setIntroLineProgress(arrow, lineFill.p);
            }
        });

        introTimeline.to(intro2, {
            p: 1,
            duration: 2.6,
            onUpdate: function () {
                setIntroTextProgress(second, intro2.p);
            }
        });
    }

    var mm = gsap.matchMedia();

    mm.add("(min-width: 875px)", function () {
        createIntroAnimation();

        return function () {
            destroyIntroAnimation();
        };
    });
}

function setIntroTextProgress(el, progress) {
    var p = Math.max(0, Math.min(1, progress));
    var gradient = 0;
    var cursor = 0;

    if (p > 0 && p < 1) {
        gradient = Math.sin(p * Math.PI) * 0.55;
        cursor = 1;
    }

    el.style.setProperty("--intro-progress", String(p));
    el.style.setProperty("--intro-gradient-opacity", String(gradient));
    el.style.setProperty("--intro-cursor-opacity", String(cursor));
}

function setIntroLineProgress(el, progress) {
    var p = Math.max(0, Math.min(1, progress));
    el.style.setProperty("--intro-line-progress", String(p));
}

function initSystemScroll() {
    var section = document.querySelector(".system-sec");
    var wrap = document.querySelector(".system-sec .system-img-wrap");
    var title = document.querySelector(".system-sec .system-title");
    var desc = document.querySelector(".system-sec .system-desc");

    if (!section || !wrap) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var systemTimeline = null;
    var heading = [title, desc].filter(Boolean);

    function calculateSystemMove() {
        var currentY = gsap.getProperty(wrap, "y");
        currentY = typeof currentY === "number" ? currentY : parseFloat(currentY);

        if (isNaN(currentY)) {
            currentY = 0;
        }

        var wrapBottom = wrap.getBoundingClientRect().bottom - currentY;
        var sectionTop = section.getBoundingClientRect().top;

        return sectionTop - wrapBottom;
    }

    function destroySystemAnimation() {
        if (systemTimeline) {
            if (systemTimeline.scrollTrigger) {
                systemTimeline.scrollTrigger.kill(true);
            }
            systemTimeline.kill();
            systemTimeline = null;
        }

        var existing = ScrollTrigger.getById("system-pin");
        if (existing) {
            existing.kill(true);
        }

        gsap.killTweensOf(wrap);
        if (heading.length) {
            gsap.killTweensOf(heading);
            gsap.set(heading, { clearProps: "opacity,transform" });
        }
        gsap.set(wrap, { clearProps: "transform,y" });
        gsap.set(section, { clearProps: "transform" });
    }

    function initSystemAnimation() {
        destroySystemAnimation();

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        systemTimeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                id: "system-pin",
                trigger: section,
                start: "top top",
                end: function () {
                    return "+=" + Math.abs(calculateSystemMove()) * 1.5;
                },
                pin: true,
                pinSpacing: true,
                pinnedClass: "is-pinned",
                scrub: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                refreshPriority: 0
            }
        });

        systemTimeline.to(wrap, {
            y: function () {
                return calculateSystemMove();
            },
            duration: 2,
            force3D: false
        });

        if (heading.length) {
            systemTimeline.to(
                heading,
                {
                    opacity: 0,
                    scale: 0.8,
                    duration: 1,
                    transformOrigin: "center center"
                },
                0
            );
        }

        systemTimeline.to(wrap, {
            y: function () {
                return calculateSystemMove();
            },
            duration: 1,
            force3D: false
        });
    }

    var mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", function () {
        initSystemAnimation();

        return function () {
            destroySystemAnimation();
        };
    });
}

function initVisionSlider() {
    var section = document.querySelector(".vision-sec");
    var list = document.querySelector(".vision-sec .vision-list");

    if (!section || !list) {
        return;
    }

    if (typeof Swiper === "undefined") {
        console.error("Swiper is not loaded.");
        return;
    }

    var mq = window.matchMedia("(max-width: 874px) and (min-width: 402px)");
    var swiper = null;
    var slider = null;
    var pagination = null;

    function enable() {
        if (swiper) {
            return;
        }

        var images = list.querySelectorAll("img");
        if (!images.length) {
            return;
        }

        slider = document.createElement("div");
        slider.className = "swiper vision-swiper";

        var wrapper = document.createElement("div");
        wrapper.className = "swiper-wrapper";

        Array.prototype.forEach.call(images, function (img) {
            var slide = document.createElement("div");
            slide.className = "swiper-slide";
            slide.appendChild(img.cloneNode(true));
            wrapper.appendChild(slide);
        });

        pagination = document.createElement("div");
        pagination.className = "vision-pagination";

        slider.appendChild(wrapper);
        list.insertAdjacentElement("afterend", slider);
        slider.insertAdjacentElement("afterend", pagination);
        section.classList.add("is-mobile-slider");

        swiper = new Swiper(slider, {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: true,
            speed: 400,
            autoplay: false,
            allowTouchMove: true,
            threshold: 12,
            resistanceRatio: 0.65,
            pagination: {
                el: pagination,
                clickable: true
            }
        });
    }

    function disable() {
        if (swiper) {
            swiper.destroy(true, true);
            swiper = null;
        }

        if (slider && slider.parentNode) {
            slider.parentNode.removeChild(slider);
        }
        if (pagination && pagination.parentNode) {
            pagination.parentNode.removeChild(pagination);
        }

        slider = null;
        pagination = null;
        section.classList.remove("is-mobile-slider");
    }

    function sync() {
        if (mq.matches) {
            enable();
        } else {
            disable();
        }
    }

    if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", sync);
    } else if (typeof mq.addListener === "function") {
        mq.addListener(sync);
    }

    sync();
}
