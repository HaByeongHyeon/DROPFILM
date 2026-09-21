document.addEventListener("DOMContentLoaded", function () {
    loadComponents().then(function () {
        initHeader();
        initFranchiseWave();
        initKvSlider();
        initPlanSticky();
        initPlanTabs();
        initBackupScroll();

        if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
        }
    });
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

function initFranchiseWave() {
    initTriggeredWave(".kv-title-wrap", "franchise-kv-wave", ".kv-desc, .title-2", "top 85%");
    initTriggeredWave(".about-sec", "franchise-about-wave", ".about-title, .about-desc", "top 80%");
    initTriggeredWave(".system-title-wrap", "franchise-system-wave", ".point, .system-title", "top 80%");
    initTriggeredWave(".backup-head", "franchise-backup-wave", ".backup-desc, .title-1", "top 80%");
    initTriggeredWave(".contact-sec", "franchise-contact-wave", ".contact-title, .contact-desc", "top 80%");
}

function initKvSlider() {
    var section = document.querySelector(".kv-sec");

    if (!section) {
        return;
    }

    var viewport = section.querySelector(".slide-viewport");
    var prev = section.querySelector(".slide-prev");
    var next = section.querySelector(".slide-next");
    var pagination = section.querySelector(".pagenation");

    if (!viewport || typeof Swiper === "undefined") {
        return;
    }

    var swiper = new Swiper(viewport, {
        slidesPerView: 1,
        speed: 700,
        loop: true,
        allowTouchMove: true,
        breakpoints: {
            768: {
                allowTouchMove: false
            }
        },
        autoplay: {
            delay: 2000,
            disableOnInteraction: false,
            waitForTransition: true
        },
        navigation: {
            prevEl: prev,
            nextEl: next
        },
        pagination: {
            el: pagination,
            clickable: true,
            bulletClass: "pagenation-item",
            bulletActiveClass: "active"
        }
    });

    function restartAutoplay() {
        if (!swiper.autoplay) {
            return;
        }

        swiper.autoplay.stop();
        swiper.autoplay.start();
    }

    if (prev) {
        prev.addEventListener("click", restartAutoplay);
    }

    if (next) {
        next.addEventListener("click", restartAutoplay);
    }

    if (pagination) {
        pagination.addEventListener("click", function (event) {
            if (event.target.classList.contains("pagenation-item")) {
                restartAutoplay();
            }
        });
    }
}

function initPlanSticky() {
    var section = document.querySelector(".plan-sec");
    var wrap = section && section.querySelector(".plan-wrap");
    var planA = wrap && wrap.querySelector(".plan-a");
    var planB = wrap && wrap.querySelector(".plan-b");
    var mq = window.matchMedia("(min-width: 875px)");

    if (!section || !planA || !planB) {
        return;
    }

    function setPlanB(open) {
        section.classList.toggle("is-plan-b", open);
        wrap.classList.toggle("is-plan-b", open);
    }

    function onPlanA() {
        if (!mq.matches) {
            return;
        }

        setPlanB(false);
    }

    function onPlanB() {
        if (!mq.matches) {
            return;
        }

        setPlanB(true);
    }

    planA.addEventListener("pointerenter", onPlanA);
    planA.addEventListener("click", onPlanA);
    planB.addEventListener("pointerenter", onPlanB);
    planB.addEventListener("click", onPlanB);

    if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", function () {
            if (!mq.matches) {
                setPlanB(false);
            }
        });
    }
}

function initPlanTabs() {
    var section = document.querySelector(".plan-sec");
    var wrap = section && section.querySelector(".plan-wrap");
    var tabs = section ? section.querySelectorAll(".plan-tab") : [];
    var mq = window.matchMedia("(max-width: 767px)");
    var current = "a";

    if (!section || !wrap || !tabs.length) {
        return;
    }

    function setPlan(plan) {
        if (!mq.matches || plan === current) {
            return;
        }

        current = plan;
        section.classList.toggle("is-plan-b", plan === "b");
        wrap.classList.toggle("is-plan-b", plan === "b");

        tabs.forEach(function (tab) {
            var active = tab.getAttribute("data-plan") === plan;
            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", active ? "true" : "false");
        });
    }

    function resetMobileA() {
        current = "a";
        section.classList.remove("is-plan-b");
        wrap.classList.remove("is-plan-b");
        tabs.forEach(function (tab) {
            var active = tab.getAttribute("data-plan") === "a";
            tab.classList.toggle("is-active", active);
            tab.setAttribute("aria-selected", active ? "true" : "false");
        });
    }

    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            setPlan(tab.getAttribute("data-plan"));
        });
    });

    if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", function () {
            if (mq.matches) {
                resetMobileA();
            }
        });
    }

    if (mq.matches) {
        resetMobileA();
    }
}

function initBackupScroll() {
    var process = document.querySelector(".backup-process");
    var items;

    if (!process || typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
        return;
    }

    items = process.querySelectorAll(".backup-item");

    if (!items.length) {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.matchMedia({
        "(max-width: 767px)": function () {
            var triggers = [];

            function setActive(current) {
                items.forEach(function (item) {
                    item.classList.toggle("is-scroll-active", item === current);
                });
            }

            items.forEach(function (item, index) {
                var next = items[index + 1];

                triggers.push(
                    ScrollTrigger.create({
                        trigger: item,
                        start: "top 60%",
                        endTrigger: next || process,
                        end: next ? "top 60%" : "bottom 40%",
                        onEnter: function () {
                            setActive(item);
                        },
                        onEnterBack: function () {
                            setActive(item);
                        }
                    })
                );
            });

            if (items[0]) {
                setActive(items[0]);
            }

            return function () {
                items.forEach(function (item) {
                    item.classList.remove("is-scroll-active");
                });
                triggers.forEach(function (trigger) {
                    trigger.kill();
                });
            };
        }
    });
}
