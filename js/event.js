document.addEventListener("DOMContentLoaded", function () {
    loadComponents().then(function () {
        initHeader();
    });
    initEventPopup();
    bindEventMobileMedia();
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

var EVENT_MOBILE_QUERY = "(max-width: 874px) and (min-width: 402px)";
var eventSlider = null;
var eventMediaBound = false;
var eventOriginalItems = [];

function isEventMobile() {
    return window.matchMedia(EVENT_MOBILE_QUERY).matches;
}

function initEventPopup() {
    var section = document.querySelector(".event-sec");
    var popupWrap;
    var eventList;
    var closeBtn;
    var dataLists;
    var isBound = false;
    var savedHtmlOverflow = "";
    var savedBodyOverflow = "";

    if (!section || isBound) {
        return;
    }

    popupWrap = section.querySelector(".popup-wrap");
    eventList = section.querySelector(".event-list");
    closeBtn = section.querySelector(".close");

    if (!popupWrap || !eventList) {
        return;
    }

    eventOriginalItems = Array.prototype.filter.call(eventList.children, function (item) {
        return item.getAttribute("data-clone") !== "true";
    });
    dataLists = [
        popupWrap.querySelector(".event-loacte"),
        popupWrap.querySelector(".popup-img-list"),
        popupWrap.querySelector(".popoup-text-wrap .popup-title"),
        popupWrap.querySelector(".popup-subtitle"),
        popupWrap.querySelector(".popup-desc")
    ];

    function lockBackgroundScroll() {
        savedHtmlOverflow = document.documentElement.style.overflow;
        savedBodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";

        if (window.dropfilmSmoothScroll && typeof window.dropfilmSmoothScroll.stop === "function") {
            window.dropfilmSmoothScroll.stop();
        }
    }

    function unlockBackgroundScroll() {
        document.documentElement.style.overflow = savedHtmlOverflow;
        document.body.style.overflow = savedBodyOverflow;

        if (window.dropfilmSmoothScroll && typeof window.dropfilmSmoothScroll.start === "function") {
            window.dropfilmSmoothScroll.start();
        }
    }

    function setPopupContent(index) {
        dataLists.forEach(function (list) {
            if (!list) {
                return;
            }

            Array.prototype.forEach.call(list.children, function (item, itemIndex) {
                item.classList.toggle("is-active", itemIndex === index);
            });
        });
    }

    function openPopup(index) {
        setPopupContent(index);
        popupWrap.classList.add("is-open");
        popupWrap.setAttribute("aria-hidden", "false");
        lockBackgroundScroll();
    }

    function closePopup() {
        popupWrap.classList.remove("is-open");
        popupWrap.setAttribute("aria-hidden", "true");
        unlockBackgroundScroll();
    }

    eventList.addEventListener("click", function (event) {
        var item = event.target.closest("li");
        var index;
        var source;
        var hasContent;

        if (!item || !eventList.contains(item)) {
            return;
        }

        if (eventSlider && eventSlider.dragged) {
            eventSlider.dragged = false;
            return;
        }

        if (item.getAttribute("data-clone") === "true") {
            index = eventSlider ? eventSlider.currentIndex : -1;
        } else {
            index = eventOriginalItems.indexOf(item);
        }

        source = eventOriginalItems[index];

        if (index < 0 || !source || source.classList.contains("event-comming")) {
            return;
        }

        hasContent = dataLists.every(function (list) {
            return list && list.children[index];
        });

        if (!hasContent) {
            return;
        }

        openPopup(index);
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", function () {
            closePopup();
        });
    }

    isBound = true;
}

function getEventOriginalItems(track) {
    return Array.prototype.filter.call(track.children, function (item) {
        return item.getAttribute("data-clone") !== "true";
    });
}

function updateEventSliderPagination() {
    var count = document.querySelector(".event-sec .event-slider-count");
    var total;
    var current;

    if (!count) {
        return;
    }

    total = eventSlider ? eventSlider.items.length : eventOriginalItems.length;
    current = eventSlider ? eventSlider.currentIndex : 0;
    count.textContent = total ? current + 1 + "/" + total : "";
}

function setEventTrackPosition(visualIndex, animate) {
    var viewport;
    var width;

    if (!eventSlider) {
        return;
    }

    viewport = eventSlider.viewport;
    width = viewport ? viewport.getBoundingClientRect().width : 0;
    eventSlider.visualIndex = visualIndex;

    Array.prototype.slice.call(eventSlider.track.children).forEach(function (item) {
        item.style.flex = "0 0 " + width + "px";
        item.style.width = width + "px";
        item.style.minWidth = width + "px";
        item.style.maxWidth = width + "px";
    });

    eventSlider.track.style.transition = animate ? "transform 0.4s ease" : "none";
    eventSlider.track.style.transform = "translate3d(" + (-visualIndex * width) + "px, 0, 0)";
}

function goToEventSlide(logicalIndex, direction) {
    var total;
    var nextIndex;
    var visualIndex;

    if (!eventSlider || eventSlider.animating) {
        return;
    }

    total = eventSlider.items.length;
    if (total < 1) {
        return;
    }

    nextIndex = ((logicalIndex % total) + total) % total;
    visualIndex = total === 1 ? 0 : nextIndex + 1;

    if (total > 1 && direction === "next" && eventSlider.currentIndex === total - 1 && nextIndex === 0) {
        visualIndex = total + 1;
    } else if (total > 1 && direction === "prev" && eventSlider.currentIndex === 0 && nextIndex === total - 1) {
        visualIndex = 0;
    }

    eventSlider.animating = total > 1;
    eventSlider.currentIndex = nextIndex;
    updateEventSliderPagination();
    setEventTrackPosition(visualIndex, total > 1);

    if (total === 1) {
        eventSlider.animating = false;
    }
}

function settleEventLoop() {
    if (!eventSlider) {
        return;
    }

    if (eventSlider.items.length > 1) {
        if (eventSlider.visualIndex === 0) {
            setEventTrackPosition(eventSlider.items.length, false);
        } else if (eventSlider.visualIndex === eventSlider.items.length + 1) {
            setEventTrackPosition(1, false);
        }
    }

    eventSlider.animating = false;
}

function createEventAxisSwipe(element, options) {
    var startX = 0;
    var startY = 0;
    var axis = "";
    var active = false;

    function onStart(event) {
        var point;

        if (options.isLocked && options.isLocked()) {
            return;
        }

        point = event.touches ? event.touches[0] : event;
        if (!point) {
            return;
        }

        startX = point.clientX;
        startY = point.clientY;
        axis = "";
        active = true;
    }

    function onMove(event) {
        var point;
        var dx;
        var dy;

        if (!active) {
            return;
        }

        point = event.touches ? event.touches[0] : event;
        if (!point) {
            return;
        }

        dx = point.clientX - startX;
        dy = point.clientY - startY;

        if (!axis) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
                return;
            }
            axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }

        if (axis === "x") {
            event.preventDefault();
        }
    }

    function onEnd(event) {
        var point;
        var dx;

        if (!active) {
            return;
        }

        active = false;
        point = event.changedTouches ? event.changedTouches[0] : event;
        dx = point ? point.clientX - startX : 0;

        if (axis !== "x") {
            return;
        }

        if (Math.abs(dx) >= 48) {
            options.onSwipe(dx < 0 ? "next" : "prev");
        }
    }

    element.addEventListener("touchstart", onStart, { passive: true });
    element.addEventListener("touchmove", onMove, { passive: false });
    element.addEventListener("touchend", onEnd, { passive: true });
    element.addEventListener("touchcancel", onEnd, { passive: true });

    return {
        destroy: function () {
            element.removeEventListener("touchstart", onStart);
            element.removeEventListener("touchmove", onMove);
            element.removeEventListener("touchend", onEnd);
            element.removeEventListener("touchcancel", onEnd);
        }
    };
}

function bindEventMobileSliderEvents() {
    var track;
    var viewport;
    var section;

    if (!eventSlider) {
        return;
    }

    track = eventSlider.track;
    viewport = eventSlider.viewport;
    section = eventSlider.section;

    eventSlider.onTransitionEnd = function (event) {
        if (event.target !== track || event.propertyName !== "transform") {
            return;
        }
        settleEventLoop();
    };

    eventSlider.onPrev = function () {
        if (!eventSlider || eventSlider.animating) {
            return;
        }
        goToEventSlide(eventSlider.currentIndex - 1, "prev");
    };

    eventSlider.onNext = function () {
        if (!eventSlider || eventSlider.animating) {
            return;
        }
        goToEventSlide(eventSlider.currentIndex + 1, "next");
    };

    track.addEventListener("transitionend", eventSlider.onTransitionEnd);
    section.querySelector(".event-slider-prev").addEventListener("click", eventSlider.onPrev);
    section.querySelector(".event-slider-next").addEventListener("click", eventSlider.onNext);
    eventSlider.swipe = createEventAxisSwipe(viewport, {
        isLocked: function () {
            return !eventSlider || eventSlider.animating;
        },
        onSwipe: function (direction) {
            if (eventSlider) {
                eventSlider.dragged = true;
            }
            if (direction === "next") {
                goToEventSlide(eventSlider.currentIndex + 1, "next");
            } else {
                goToEventSlide(eventSlider.currentIndex - 1, "prev");
            }
        }
    });
}

function unbindEventMobileSliderEvents() {
    if (!eventSlider) {
        return;
    }

    if (eventSlider.onTransitionEnd) {
        eventSlider.track.removeEventListener("transitionend", eventSlider.onTransitionEnd);
    }
    if (eventSlider.onPrev) {
        eventSlider.section.querySelector(".event-slider-prev").removeEventListener("click", eventSlider.onPrev);
    }
    if (eventSlider.onNext) {
        eventSlider.section.querySelector(".event-slider-next").removeEventListener("click", eventSlider.onNext);
    }
    if (eventSlider.swipe) {
        eventSlider.swipe.destroy();
    }
}

function rebuildEventMobileSlider() {
    var items;
    var track;
    var clone;

    if (!eventSlider) {
        return;
    }

    track = eventSlider.track;
    Array.prototype.slice.call(track.querySelectorAll("[data-clone]")).forEach(function (node) {
        node.parentNode.removeChild(node);
    });

    items = getEventOriginalItems(track);
    eventSlider.items = items;
    eventOriginalItems = items;
    eventSlider.currentIndex = 0;
    eventSlider.animating = false;
    eventSlider.dragged = false;

    if (items.length > 1) {
        clone = items[items.length - 1].cloneNode(true);
        clone.setAttribute("data-clone", "true");
        track.insertBefore(clone, track.firstChild);

        clone = items[0].cloneNode(true);
        clone.setAttribute("data-clone", "true");
        track.appendChild(clone);

        setEventTrackPosition(1, false);
    } else {
        setEventTrackPosition(0, false);
    }

    updateEventSliderPagination();
}

function initEventMobileSlider() {
    var section = document.querySelector(".event-sec");
    var viewport;
    var track;

    if (!isEventMobile() || !section || eventSlider) {
        if (eventSlider && isEventMobile()) {
            setEventTrackPosition(eventSlider.visualIndex, false);
        }
        return;
    }

    viewport = section.querySelector(".event-slider-viewport");
    track = section.querySelector(".event-list");

    if (!viewport || !track) {
        return;
    }

    eventSlider = {
        section: section,
        viewport: viewport,
        track: track,
        items: [],
        currentIndex: 0,
        visualIndex: 1,
        animating: false,
        dragged: false,
        swipe: null
    };

    bindEventMobileSliderEvents();
    rebuildEventMobileSlider();
}

function destroyEventMobileSlider() {
    var items;

    if (!eventSlider) {
        return;
    }

    unbindEventMobileSliderEvents();

    Array.prototype.slice.call(eventSlider.track.querySelectorAll("[data-clone]")).forEach(function (node) {
        node.parentNode.removeChild(node);
    });

    eventSlider.track.style.transform = "";
    eventSlider.track.style.transition = "";
    items = eventSlider.track.children;
    Array.prototype.slice.call(items).forEach(function (item) {
        item.style.flex = "";
        item.style.width = "";
        item.style.minWidth = "";
        item.style.maxWidth = "";
    });

    eventOriginalItems = getEventOriginalItems(eventSlider.track);
    eventSlider = null;
}

function syncEventMobileSlider() {
    if (isEventMobile()) {
        initEventMobileSlider();
    } else {
        destroyEventMobileSlider();
    }
}

function bindEventMobileMedia() {
    var media;

    if (eventMediaBound) {
        return;
    }

    eventMediaBound = true;
    media = window.matchMedia(EVENT_MOBILE_QUERY);

    if (typeof media.addEventListener === "function") {
        media.addEventListener("change", syncEventMobileSlider);
    } else if (typeof media.addListener === "function") {
        media.addListener(syncEventMobileSlider);
    }

    window.addEventListener("resize", function () {
        if (eventSlider && isEventMobile()) {
            setEventTrackPosition(eventSlider.visualIndex, false);
        }
    });

    syncEventMobileSlider();
}
