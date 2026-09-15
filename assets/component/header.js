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
