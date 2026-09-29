$(function () {
    loadComponents().then(function () {
        initHeader();
        initProductTabs();
        initCameraDetail();
        initProductMobileMedia();
    });
});

var PRODUCT_MOBILE_QUERY = "(max-width: 767px)";

function isProductMobile() {
    return window.matchMedia(PRODUCT_MOBILE_QUERY).matches;
}

// 컴포넌트 불러오기
function loadComponents() {
    const requests = [];

    $("[data-component]").each(function () {
        const $slot = $(this);
        const name = $slot.data("component");

        requests.push(
            $.get(`./assets/component/${name}.html`)
                .done(function (html) {
                    $slot.html(html);
                })
                .fail(function () {
                    console.error(`Failed to load component : ${name}`);
                })
        );
    });

    return Promise.all(requests);
}

// 탭 메뉴
function initProductTabs() {
    const $section = $(".product-sec");

    if (!$section.length || $section.data("tabsReady")) return;
    if (!$section.find(".tab-menu").length) return;

    $section.data("tabsReady", true);

    setProductTab("camera");

    $section.on("click", ".tab-menu button[data-tab]", function () {
        const tab = $(this).data("tab");

        if (tab === "camera" || tab === "film") {
            setProductTab(tab);
        }
    });
}

// 탭 변경
function setProductTab(tab) {
    $(".tab-menu li").removeClass("active");
    $(`.tab-menu button[data-tab="${tab}"]`).parent().addClass("active");

    $(".product-list").toggleClass("is-film", tab === "film");
}

function initProductMobileMedia() {
    const media = window.matchMedia(PRODUCT_MOBILE_QUERY);

    function sync() {
        if (media.matches) {
            if (cameraDetailApi && cameraDetailApi.isOpen()) {
                initDetailMobileSlider(
                    cameraDetailApi.getProductIndex()
                );
            }
        } else {
            destroyDetailMobileSlider();
        }
    }

    if (typeof media.addEventListener === "function") {
        media.addEventListener("change", sync);
    } else if (typeof media.addListener === "function") {
        media.addListener(sync);
    }

    window.addEventListener("resize", function () {
        if (!isProductMobile()) return;

        syncDetailMobileSliderLayout();
    });
}

function createAxisSwipe(element, options) {
    var startX = 0;
    var startY = 0;
    var axis = "";
    var active = false;
    var moved = false;

    function onStart(event) {
        if (options.isLocked && options.isLocked()) return;
        const point = event.touches ? event.touches[0] : event;
        if (!point) return;
        startX = point.clientX;
        startY = point.clientY;
        axis = "";
        active = true;
        moved = false;
    }

    function onMove(event) {
        if (!active) return;
        const point = event.touches ? event.touches[0] : event;
        if (!point) return;

        const dx = point.clientX - startX;
        const dy = point.clientY - startY;

        if (!axis) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }

        if (axis === "x") {
            event.preventDefault();
            moved = true;
            if (options.onMove) options.onMove(dx);
        }
    }

    function onEnd(event) {
        if (!active) return;
        active = false;

        const point = event.changedTouches ? event.changedTouches[0] : event;
        const dx = point ? point.clientX - startX : 0;

        if (axis !== "x") {
            if (options.onCancel) options.onCancel(false);
            return;
        }

        if (Math.abs(dx) >= 48) {
            options.onSwipe(dx < 0 ? "next" : "prev");
            if (options.onCancel) options.onCancel(true);
        } else if (options.onCancel) {
            options.onCancel(false);
        }
    }

    element.addEventListener("touchstart", onStart, { passive: true });
    element.addEventListener("touchmove", onMove, { passive: false });
    element.addEventListener("touchend", onEnd, { passive: true });
    element.addEventListener("touchcancel", onEnd, { passive: true });

    return {
        wasMoved: function () {
            return moved;
        },
        destroy: function () {
            element.removeEventListener("touchstart", onStart);
            element.removeEventListener("touchmove", onMove);
            element.removeEventListener("touchend", onEnd);
            element.removeEventListener("touchcancel", onEnd);
        }
    };
}

var detailMobileSlider = null;
var cameraDetailApi = null;

function getCameraDetailIndex(max) {
    var params = new URLSearchParams(window.location.search);
    var index = Number(params.get("index"));

    if (!Number.isFinite(index) || index < 0) {
        return 0;
    }

    index = Math.floor(index);

    if (typeof max === "number" && index >= max) {
        return 0;
    }

    return index;
}

function goToCameraDetailPage(index) {
    window.location.href = "./camera-detail.html?index=" + index;
}

function initCameraDetail() {
    const $section = $(".product-sec");

    if (!$section.length || $section.data("detailReady")) return;

    const $items = $section.find(".product-camera .product-camera-item").not("[data-clone]");
    const $groups = $section.find(".camera-img > li");
    const $mainImg = $section.find(".detail-main-fallback");
    const isDetailPage = $groups.length > 0;

    let currentProductIndex = -1;
    let currentImageIndex = 0;
    let isDetailOpen = false;

    $section.data("detailReady", true);

    function setCameraImage(imageIndex) {
        const $buttons = $groups.eq(currentProductIndex).find("button");
        const $button = $buttons.eq(imageIndex);
        const $thumb = $button.find("img");

        if (!$button.length || !$thumb.length) return;

        currentImageIndex = imageIndex;
        $buttons.removeClass("active");
        $button.addClass("active");
        $mainImg.attr({
            src: $thumb.attr("src"),
            alt: $thumb.attr("alt") || ""
        });

        if (detailMobileSlider && detailMobileSlider.visualIndex !== imageIndex + 1) {
            goToDetailImage(imageIndex);
        }
    }

    function openCameraDetail(index) {
        if (!$groups.eq(index).length) return;

        currentProductIndex = index;
        isDetailOpen = true;

        $groups.removeClass("active").find("button").removeClass("active");
        $groups.eq(index).addClass("active");
        $section.addClass("is-camera-detail");
        initDetailMobileSlider(index);
        setCameraImage(0);
    }

    cameraDetailApi = {
        getProductIndex: function () {
            return currentProductIndex;
        },
        getImageIndex: function () {
            return currentImageIndex;
        },
        setImageIndex: function (index) {
            currentImageIndex = index;
        },
        isOpen: function () {
            return isDetailOpen;
        }
    };

    if (isDetailPage) {
        openCameraDetail(getCameraDetailIndex($groups.length));

        $section.on("click", ".camera-detail-back", function () {
            window.location.href = "./product.html";
        });

        $section.on("click", ".camera-img > li.active button", function () {
            setCameraImage($(this).index());
        });
        return;
    }

    $items.attr({ tabindex: "0", role: "button" });

    $section.on(
        "click",
        ".product-camera .product-camera-item",
        function () {
            const index = Number(
                $(this).attr("data-index")
            );

            goToCameraDetailPage(
                Number.isNaN(index)
                    ? $items.index(this)
                    : index
            );
        }
    );

    $section.on("keydown", ".product-camera .product-camera-item", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const index = Number($(this).attr("data-index"));
            goToCameraDetailPage(Number.isNaN(index) ? $items.index(this) : index);
        }
    });
}

function initDetailMobileSlider(productIndex) {
    destroyDetailMobileSlider();

    if (!isProductMobile() || !cameraDetailApi || !cameraDetailApi.isOpen()) return;

    const $viewport = $(".detail-main-viewport");
    const $track = $(".detail-main-track");
    const $buttons = $(".camera-img > li").eq(productIndex).find("button");
    const total = $buttons.length;

    if (!$viewport.length || !$track.length || total < 1) return;

    $track.empty();

    function makeSlide($button) {
        const $img = $button.find("img");
        return $("<div>", { class: "detail-main-slide" }).append(
            $("<img>", {
                src: $img.attr("src"),
                alt: $img.attr("alt") || ""
            })
        );
    }

    $track.append(makeSlide($buttons.eq(total - 1)).attr("data-clone", "true"));
    $buttons.each(function () {
        $track.append(makeSlide($(this)));
    });
    $track.append(makeSlide($buttons.first()).attr("data-clone", "true"));

    detailMobileSlider = {
        $viewport: $viewport,
        $track: $track,
        $buttons: $buttons,
        total: total,
        visualIndex: 1,
        animating: false,
        swipe: null
    };

    setDetailTrackPosition(1, false);
    bindDetailMobileSliderEvents();
}

function destroyDetailMobileSlider() {
    if (!detailMobileSlider) return;

    unbindDetailMobileSliderEvents();
    detailMobileSlider.$track.empty().css({
        transform: "",
        transition: ""
    });
    detailMobileSlider = null;
}

function syncDetailMobileSliderLayout() {
    if (!detailMobileSlider || !isProductMobile()) return;
    setDetailTrackPosition(detailMobileSlider.visualIndex, false);
}

function setDetailTrackPosition(visualIndex, animate) {
    const slider = detailMobileSlider;
    if (!slider) return;

    const viewportEl = slider.$viewport.get(0);
    const width = viewportEl ? viewportEl.getBoundingClientRect().width : slider.$viewport.width();

    slider.visualIndex = visualIndex;
    slider.$track.css({
        transform: "none",
        transition: "none",
        width: "100%",
        height: "100%"
    });

    slider.$track.children(".detail-main-slide").each(function (index) {
        const offset = (index - visualIndex) * width;
        const isNear = Math.abs(index - visualIndex) <= 1;

        $(this)
            .toggleClass("is-active", index === visualIndex)
            .css({
                inset: "0",
                width: width + "px",
                height: "100%",
                maxWidth: width + "px",
                minWidth: width + "px",
                flex: "none",
                transition: animate && isNear ? "transform 0.4s ease" : "none",
                transform: "translate3d(" + offset + "px, 0, 0)"
            });
    });
}

function updateDetailThumbnail(imageIndex) {
    if (!detailMobileSlider || !cameraDetailApi) return;

    cameraDetailApi.setImageIndex(imageIndex);
    detailMobileSlider.$buttons.removeClass("active");
    detailMobileSlider.$buttons.eq(imageIndex).addClass("active");
}

function goToDetailImage(imageIndex, direction) {
    const slider = detailMobileSlider;
    if (!slider || slider.animating) return;

    const total = slider.total;
    const current = cameraDetailApi.getImageIndex();
    const nextIndex = ((imageIndex % total) + total) % total;
    let visualIndex = nextIndex + 1;

    if (direction === "next" && current === total - 1 && nextIndex === 0) {
        visualIndex = total + 1;
    } else if (direction === "prev" && current === 0 && nextIndex === total - 1) {
        visualIndex = 0;
    }

    if (visualIndex === slider.visualIndex) {
        updateDetailThumbnail(nextIndex);
        return;
    }

    slider.animating = true;
    updateDetailThumbnail(nextIndex);
    setDetailTrackPosition(visualIndex, true);
}

function settleDetailLoop() {
    const slider = detailMobileSlider;
    if (!slider) return;

    if (slider.visualIndex === 0) {
        setDetailTrackPosition(slider.total, false);
    } else if (slider.visualIndex === slider.total + 1) {
        setDetailTrackPosition(1, false);
    }

    slider.animating = false;
}

function bindDetailMobileSliderEvents() {
    const slider = detailMobileSlider;
    const viewport = slider.$viewport.get(0);
    const track = slider.$track.get(0);

    slider.onTransitionEnd = function (event) {
        if (!event.target.classList.contains("detail-main-slide")) return;
        if (event.propertyName !== "transform") return;
        settleDetailLoop();
    };

    track.addEventListener("transitionend", slider.onTransitionEnd);

    slider.swipe = createAxisSwipe(viewport, {
        isLocked: function () {
            return slider.animating;
        },
        onSwipe: function (direction) {
            const current = cameraDetailApi.getImageIndex();
            if (direction === "next") goToDetailImage(current + 1, "next");
            else goToDetailImage(current - 1, "prev");
        }
    });
}

function unbindDetailMobileSliderEvents() {
    const slider = detailMobileSlider;
    if (!slider) return;

    if (slider.onTransitionEnd) {
        slider.$track.get(0).removeEventListener("transitionend", slider.onTransitionEnd);
    }
    if (slider.swipe) slider.swipe.destroy();
}
