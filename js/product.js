$(function () {
    loadComponents().then(function () {
        initHeader();
        initProductTabs();
        initProductListInteractions();
        initProductDetail();
        initProductMobileMedia();
    });
});


var PRODUCT_MOBILE_QUERY = "(max-width: 874px)";

var detailMobileSlider = null;
var cameraDetailApi = null;
var currentDetailType = null;


// =========================================================
// 공통
// =========================================================

function isProductMobile() {
    return window.matchMedia(
        PRODUCT_MOBILE_QUERY
    ).matches;
}


function loadComponents() {
    const requests = [];

    $("[data-component]").each(function () {
        const $slot = $(this);
        const name = $slot.data("component");

        requests.push(
            $.get(
                "./assets/component/" +
                name +
                ".html"
            )
                .done(function (html) {
                    $slot.html(html);
                })
                .fail(function () {
                    console.error(
                        "Failed to load component : " +
                        name
                    );
                })
        );
    });

    return Promise.all(requests);
}


// =========================================================
// 상품 탭
// =========================================================

function initProductTabs() {
    const $section = $(".product-sec");

    if (!$section.length) {
        return;
    }

    if (
        $section.data("tabsReady")
    ) {
        return;
    }

    if (
        !$section.find(".tab-menu").length
    ) {
        return;
    }

    $section.data(
        "tabsReady",
        true
    );

    setProductTab("camera");

    $section.on(
        "click",
        ".tab-menu button[data-tab]",
        function () {
            const tab =
                $(this).data("tab");

            if (
                tab === "camera" ||
                tab === "film"
            ) {
                setProductTab(tab);
            }
        }
    );
}


function setProductTab(tab) {
    const $tabs =
        $(".product-sec")
            .not(
                ".is-camera-detail, .is-film-detail"
            );

    $tabs.find(".tab-menu li")
        .removeClass("active");

    $tabs
        .find(
            `.tab-menu button[data-tab="${tab}"]`
        )
        .parent()
        .addClass("active");


    $tabs.find(".product-list")
        .toggleClass(
            "is-film",
            tab === "film"
        );


    /*
     * Camera / Film 표시 상태를
     * JS에서 직접 제어
     */
    $tabs.find(".product-list").each(
        function () {
            const $list =
                $(this);

            const $camera =
                $list.find(
                    ".product-camera"
                );

            const $film =
                $list.find(
                    ".product-film"
                );

            if (tab === "film") {
                $camera.css({
                    opacity: 0,
                    visibility:
                        "hidden",
                    pointerEvents:
                        "none",
                    zIndex: 0
                });

                $film.css({
                    opacity: 1,
                    visibility:
                        "visible",
                    pointerEvents:
                        "auto",
                    zIndex: 1
                });
            } else {
                $camera.css({
                    opacity: 1,
                    visibility:
                        "visible",
                    pointerEvents:
                        "auto",
                    zIndex: 1
                });

                $film.css({
                    opacity: 0,
                    visibility:
                        "hidden",
                    pointerEvents:
                        "none",
                    zIndex: 0
                });
            }
        }
    );
}


// =========================================================
// 상품 목록 인터랙션
// =========================================================

function initProductListInteractions() {
    const $section =
        $(".product-sec").not(
            ".is-camera-detail, .is-film-detail"
        );

    if (!$section.length) {
        return;
    }


    const $cameraItems =
        $section.find(
            ".product-camera .product-camera-item"
        );

    const $filmItems =
        $section.find(
            ".product-film .product-camera-item"
        );


    $cameraItems.attr({
        tabindex: "0",
        role: "button"
    });

    $filmItems.attr({
        tabindex: "0",
        role: "button"
    });


    // =====================================================
    // Camera
    // =====================================================

    $cameraItems.each(
        function () {
            const $item =
                $(this);

            $item.off(
                "click.productDetail"
            );

            $item.on(
                "click.productDetail",
                function (event) {
                    event.preventDefault();

                    const value =
                        Number(
                            $item.attr(
                                "data-index"
                            )
                        );

                    const index =
                        Number.isNaN(
                            value
                        )
                            ? $cameraItems.index(
                                this
                            )
                            : value;

                    goToProductDetailPage(
                        "camera",
                        index
                    );
                }
            );
        }
    );


    // Camera 키보드
    $cameraItems.off(
        "keydown.productDetail"
    );

    $cameraItems.on(
        "keydown.productDetail",
        function (event) {
            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }

            event.preventDefault();

            const value =
                Number(
                    $(this).attr(
                        "data-index"
                    )
                );

            const index =
                Number.isNaN(value)
                    ? $cameraItems.index(
                        this
                    )
                    : value;

            goToProductDetailPage(
                "camera",
                index
            );
        }
    );


    // =====================================================
    // Film
    // =====================================================

    $filmItems.each(
        function () {
            const $item =
                $(this);

            $item.off(
                "click.productDetail"
            );

            $item.on(
                "click.productDetail",
                function (event) {
                    event.preventDefault();

                    const value =
                        Number(
                            $item.attr(
                                "data-index"
                            )
                        );

                    const index =
                        Number.isNaN(
                            value
                        )
                            ? $filmItems.index(
                                this
                            )
                            : value;

                    goToProductDetailPage(
                        "film",
                        index
                    );
                }
            );
        }
    );


    // Film 키보드
    $filmItems.off(
        "keydown.productDetail"
    );

    $filmItems.on(
        "keydown.productDetail",
        function (event) {
            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }

            event.preventDefault();

            const value =
                Number(
                    $(this).attr(
                        "data-index"
                    )
                );

            const index =
                Number.isNaN(value)
                    ? $filmItems.index(
                        this
                    )
                    : value;

            goToProductDetailPage(
                "film",
                index
            );
        }
    );
}


// =========================================================
// 상세 페이지 이동
// =========================================================

function goToProductDetailPage(
    type,
    index
) {
    const url =
        "./camera-detail.html?type=" +
        encodeURIComponent(type) +
        "&index=" +
        encodeURIComponent(index);

    window.location.assign(url);
}


// =========================================================
// 상세 페이지 초기화
// =========================================================

function initProductDetail() {
    const $cameraSection =
        $(".product-sec.is-camera-detail");

    const $filmSection =
        $(".product-sec.is-film-detail");


    if (
        !$cameraSection.length &&
        !$filmSection.length
    ) {
        return;
    }


    currentDetailType =
        getDetailType();


    let maxIndex = 0;

    if (
        currentDetailType ===
        "film"
    ) {
        maxIndex =
            $filmSection
                .find(
                    ".film-img > li"
                )
                .length;
    } else {
        maxIndex =
            $cameraSection
                .find(
                    ".camera-img > li"
                )
                .length;
    }


    const index =
        getDetailIndex(
            maxIndex
        );


    if (
        currentDetailType ===
        "film"
    ) {
        showFilmDetailSection();

        initFilmDetailSection(
            $filmSection,
            index
        );
    } else {
        showCameraDetailSection();

        initCameraDetailSection(
            $cameraSection,
            index
        );
    }
}


// =========================================================
// URL
// =========================================================

function getDetailType() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const type =
        params.get("type");

    if (type === "film") {
        return "film";
    }

    return "camera";
}


function getDetailIndex(max) {
    const params =
        new URLSearchParams(
            window.location.search
        );

    let index =
        Number(
            params.get("index")
        );


    if (
        !Number.isFinite(index) ||
        index < 0
    ) {
        index = 0;
    }


    index =
        Math.floor(index);


    if (
        typeof max === "number" &&
        max > 0 &&
        index >= max
    ) {
        index = 0;
    }


    return index;
}


// =========================================================
// 상세 섹션 표시
// =========================================================

function showCameraDetailSection() {
    $(".product-sec.is-camera-detail")
        .css(
            "display",
            "block"
        );

    $(".product-sec.is-film-detail")
        .css(
            "display",
            "none"
        );
}


function showFilmDetailSection() {
    $(".product-sec.is-camera-detail")
        .css(
            "display",
            "none"
        );

    $(".product-sec.is-film-detail")
        .css(
            "display",
            "block"
        );
}


// =========================================================
// Camera 상세
// =========================================================

function initCameraDetailSection(
    $section,
    productIndex
) {
    const $groups =
        $section.find(
            ".camera-img > li"
        );

    const $mainImg =
        $section.find(
            ".detail-main-fallback"
        );

    const $titles =
        $section.find(
            ".camera-info > .title-1"
        );


    if (!$groups.length) {
        return;
    }


    let currentProductIndex =
        productIndex;

    let currentImageIndex = 0;


    function setCameraTitle(
        index
    ) {
        $titles.css(
            "display",
            "none"
        );


        if (
            index >= 0 &&
            index <= 2
        ) {
            $titles
                .eq(0)
                .css(
                    "display",
                    "block"
                );
        } else if (
            index >= 3 &&
            index <= 4
        ) {
            $titles
                .eq(1)
                .css(
                    "display",
                    "block"
                );
        } else if (
            index >= 5 &&
            index <= 6
        ) {
            $titles
                .eq(2)
                .css(
                    "display",
                    "block"
                );
        }
    }


    function setCameraImage(
        imageIndex
    ) {
        const $buttons =
            $groups
                .eq(
                    currentProductIndex
                )
                .find("button");

        const $button =
            $buttons.eq(
                imageIndex
            );

        const $thumb =
            $button.find("img");


        if (
            !$button.length ||
            !$thumb.length
        ) {
            return;
        }


        currentImageIndex =
            imageIndex;


        $buttons
            .removeClass(
                "active"
            );

        $button.addClass(
            "active"
        );


        $mainImg.attr({
            src:
                $thumb.attr(
                    "src"
                ),

            alt:
                $thumb.attr(
                    "alt"
                ) || ""
        });


        if (
            detailMobileSlider &&
            detailMobileSlider
                .visualIndex !==
            imageIndex + 1
        ) {
            goToDetailImage(
                imageIndex
            );
        }
    }


    // 선택되지 않은 그룹 숨김
    $groups.css(
        "display",
        "none"
    );


    // 선택된 그룹 표시
    $groups
        .eq(
            currentProductIndex
        )
        .css(
            "display",
            "flex"
        );


    setCameraTitle(
        currentProductIndex
    );


    setCameraImage(0);


    // Thumbnail
    $section
        .off(
            "click.cameraDetail"
        )
        .on(
            "click.cameraDetail",
            ".camera-img > li button",
            function () {
                const $parent =
                    $(this).parent();

                if (
                    !$parent.is(
                        $groups.eq(
                            currentProductIndex
                        )
                    )
                ) {
                    return;
                }

                setCameraImage(
                    $(this).index()
                );
            }
        );


    cameraDetailApi = {
        getProductIndex:
            function () {
                return currentProductIndex;
            },

        getImageIndex:
            function () {
                return currentImageIndex;
            },

        setImageIndex:
            function (
                index
            ) {
                currentImageIndex =
                    index;
            },

        isOpen:
            function () {
                return true;
            }
    };


    initDetailMobileSlider(
        currentProductIndex
    );
}


// =========================================================
// Film 상세
// =========================================================

function initFilmDetailSection(
    $section,
    productIndex
) {
    const $images =
        $section.find(
            ".film-img > li"
        );

    const $titles =
        $section.find(
            ".film-info > .title-1"
        );

    const $descs =
        $section.find(
            ".film-info > .desc > li"
        );

    const $prices =
        $section.find(
            ".film-info > .price > li"
        );


    if (!$images.length) {
        return;
    }


    // =====================================================
    // 이미지
    // =====================================================

    $images.css(
        "display",
        "none"
    );

    $images
        .eq(productIndex)
        .css(
            "display",
            "flex"
        );


    // =====================================================
    // Title
    // =====================================================

    $titles.css(
        "display",
        "none"
    );

    $titles
        .eq(productIndex)
        .css(
            "display",
            "block"
        );


    // =====================================================
    // Description
    // =====================================================

    $descs.css(
        "display",
        "none"
    );

    $descs
        .eq(productIndex)
        .css(
            "display",
            "block"
        );


    // =====================================================
    // Price
    // =====================================================

    $prices.css(
        "display",
        "none"
    );

    $prices
        .eq(productIndex)
        .css(
            "display",
            "block"
        );


    // =====================================================
    // Spec
    // =====================================================

    $section
        .find(
            ".info-content .spec-row"
        )
        .each(
            function () {
                const $row =
                    $(this);

                const $list =
                    $row.find(
                        "ul"
                    );


                /*
                 * ul이 없는 spec-row
                 *
                 * → 그대로 표시
                 */
                if (
                    !$list.length
                ) {
                    return;
                }


                const $items =
                    $list.find(
                        "li"
                    );


                /*
                 * method
                 *
                 * index 0~2
                 * → 첫 번째 li
                 *
                 * index 3
                 * → 두 번째 li
                 */
                if (
                    $list.hasClass(
                        "method"
                    )
                ) {
                    $items.css(
                        "display",
                        "none"
                    );


                    if (
                        productIndex <= 2
                    ) {
                        $items
                            .eq(0)
                            .css(
                                "display",
                                "block"
                            );
                    } else {
                        $items
                            .eq(1)
                            .css(
                                "display",
                                "block"
                            );
                    }

                    return;
                }


                /*
                 * li가 4개인 경우
                 *
                 * → 해당 index만 표시
                 */
                if (
                    $items.length ===
                    4
                ) {
                    $items.css(
                        "display",
                        "none"
                    );

                    $items
                        .eq(
                            productIndex
                        )
                        .css(
                            "display",
                            "block"
                        );

                    return;
                }


                /*
                 * li가 4개가 아닌 경우
                 *
                 * → 모든 li 표시
                 */
                $items.css(
                    "display",
                    "block"
                );
            }
        );
}


// =========================================================
// 모바일 Media
// =========================================================

function initProductMobileMedia() {
    if (
        currentDetailType !==
        "camera"
    ) {
        return;
    }


    const media =
        window.matchMedia(
            PRODUCT_MOBILE_QUERY
        );


    function sync() {
        if (
            media.matches &&
            cameraDetailApi &&
            currentDetailType ===
            "camera"
        ) {
            initDetailMobileSlider(
                cameraDetailApi
                    .getProductIndex()
            );
        } else {
            destroyDetailMobileSlider();
        }
    }


    if (
        typeof media.addEventListener ===
        "function"
    ) {
        media.addEventListener(
            "change",
            sync
        );
    } else if (
        typeof media.addListener ===
        "function"
    ) {
        media.addListener(
            sync
        );
    }


    window.addEventListener(
        "resize",
        function () {
            if (
                currentDetailType !==
                "camera"
            ) {
                return;
            }


            if (
                !isProductMobile()
            ) {
                destroyDetailMobileSlider();
                return;
            }


            syncDetailMobileSliderLayout();
        }
    );


    sync();
}


// =========================================================
// Axis Swipe
// =========================================================

function createAxisSwipe(
    element,
    options
) {
    var startX = 0;
    var startY = 0;
    var axis = "";
    var active = false;
    var moved = false;


    function onStart(event) {
        if (
            options.isLocked &&
            options.isLocked()
        ) {
            return;
        }


        const point =
            event.touches
                ? event.touches[0]
                : event;


        if (!point) {
            return;
        }


        startX =
            point.clientX;

        startY =
            point.clientY;

        axis = "";
        active = true;
        moved = false;
    }


    function onMove(event) {
        if (!active) {
            return;
        }


        const point =
            event.touches
                ? event.touches[0]
                : event;


        if (!point) {
            return;
        }


        const dx =
            point.clientX -
            startX;

        const dy =
            point.clientY -
            startY;


        if (!axis) {
            if (
                Math.abs(dx) < 8 &&
                Math.abs(dy) < 8
            ) {
                return;
            }


            axis =
                Math.abs(dx) >
                    Math.abs(dy)
                    ? "x"
                    : "y";
        }


        if (axis === "x") {
            event.preventDefault();

            moved = true;

            if (
                options.onMove
            ) {
                options.onMove(
                    dx
                );
            }
        }
    }


    function onEnd(event) {
        if (!active) {
            return;
        }


        active = false;


        const point =
            event.changedTouches
                ? event.changedTouches[0]
                : event;


        const dx =
            point
                ? point.clientX -
                startX
                : 0;


        if (axis !== "x") {
            if (
                options.onCancel
            ) {
                options.onCancel(
                    false
                );
            }

            return;
        }


        if (
            Math.abs(dx) >=
            48
        ) {
            options.onSwipe(
                dx < 0
                    ? "next"
                    : "prev"
            );

            if (
                options.onCancel
            ) {
                options.onCancel(
                    true
                );
            }
        } else if (
            options.onCancel
        ) {
            options.onCancel(
                false
            );
        }
    }


    element.addEventListener(
        "touchstart",
        onStart,
        {
            passive: true
        }
    );

    element.addEventListener(
        "touchmove",
        onMove,
        {
            passive: false
        }
    );

    element.addEventListener(
        "touchend",
        onEnd,
        {
            passive: true
        }
    );

    element.addEventListener(
        "touchcancel",
        onEnd,
        {
            passive: true
        }
    );


    return {
        wasMoved:
            function () {
                return moved;
            },

        destroy:
            function () {
                element.removeEventListener(
                    "touchstart",
                    onStart
                );

                element.removeEventListener(
                    "touchmove",
                    onMove
                );

                element.removeEventListener(
                    "touchend",
                    onEnd
                );

                element.removeEventListener(
                    "touchcancel",
                    onEnd
                );
            }
    };
}


// =========================================================
// Camera Mobile Slider
// =========================================================

function initDetailMobileSlider(
    productIndex
) {
    destroyDetailMobileSlider();


    if (
        currentDetailType !==
        "camera"
    ) {
        return;
    }


    if (
        !isProductMobile() ||
        !cameraDetailApi
    ) {
        return;
    }


    const $cameraSection =
        $(".product-sec.is-camera-detail");


    const $viewport =
        $cameraSection.find(
            ".detail-main-viewport"
        );


    const $track =
        $cameraSection.find(
            ".detail-main-track"
        );


    const $buttons =
        $cameraSection
            .find(
                ".camera-img > li"
            )
            .eq(productIndex)
            .find(
                "button"
            );


    const total =
        $buttons.length;


    if (
        !$viewport.length ||
        !$track.length ||
        total < 1
    ) {
        return;
    }


    $track.empty();


    function makeSlide(
        $button
    ) {
        const $img =
            $button.find(
                "img"
            );


        return $("<div>", {
            class:
                "detail-main-slide"
        }).append(
            $("<img>", {
                src:
                    $img.attr(
                        "src"
                    ),

                alt:
                    $img.attr(
                        "alt"
                    ) || ""
            })
        );
    }


    // 마지막 이미지 복제
    $track.append(
        makeSlide(
            $buttons.eq(
                total - 1
            )
        ).attr(
            "data-clone",
            "true"
        )
    );


    // 실제 이미지
    $buttons.each(
        function () {
            $track.append(
                makeSlide(
                    $(this)
                )
            );
        }
    );


    // 첫 번째 이미지 복제
    $track.append(
        makeSlide(
            $buttons.first()
        ).attr(
            "data-clone",
            "true"
        )
    );


    detailMobileSlider = {
        $viewport:
            $viewport,

        $track:
            $track,

        $buttons:
            $buttons,

        total:
            total,

        visualIndex:
            1,

        animating:
            false,

        swipe:
            null
    };


    setDetailTrackPosition(
        1,
        false
    );


    bindDetailMobileSliderEvents();
}


// =========================================================
// Slider 제거
// =========================================================

function destroyDetailMobileSlider() {
    if (
        !detailMobileSlider
    ) {
        return;
    }


    unbindDetailMobileSliderEvents();


    detailMobileSlider
        .$track
        .empty()
        .css({
            transform: "",
            transition: ""
        });


    detailMobileSlider =
        null;
}


// =========================================================
// Slider Layout
// =========================================================

function syncDetailMobileSliderLayout() {
    if (
        !detailMobileSlider ||
        !isProductMobile()
    ) {
        return;
    }


    setDetailTrackPosition(
        detailMobileSlider.visualIndex,
        false
    );
}


// =========================================================
// Slider Position
// =========================================================

function setDetailTrackPosition(
    visualIndex,
    animate
) {
    const slider =
        detailMobileSlider;


    if (!slider) {
        return;
    }


    const viewportEl =
        slider.$viewport.get(
            0
        );


    const width =
        viewportEl
            ? viewportEl
                .getBoundingClientRect()
                .width
            : slider.$viewport.width();


    slider.visualIndex =
        visualIndex;


    slider.$track.css({
        transform:
            "none",

        transition:
            "none",

        width:
            "100%",

        height:
            "100%"
    });


    slider.$track
        .children(
            ".detail-main-slide"
        )
        .each(
            function (index) {
                const offset =
                    (index -
                        visualIndex) *
                    width;


                const isNear =
                    Math.abs(
                        index -
                        visualIndex
                    ) <= 1;


                $(this)
                    .toggleClass(
                        "is-active",
                        index ===
                        visualIndex
                    )
                    .css({
                        inset:
                            "0",

                        width:
                            width +
                            "px",

                        height:
                            "100%",

                        maxWidth:
                            width +
                            "px",

                        minWidth:
                            width +
                            "px",

                        flex:
                            "none",

                        transition:
                            animate &&
                                isNear
                                ? "transform 0.4s ease"
                                : "none",

                        transform:
                            "translate3d(" +
                            offset +
                            "px, 0, 0)"
                    });
            }
        );
}


// =========================================================
// Thumbnail
// =========================================================

function updateDetailThumbnail(
    imageIndex
) {
    if (
        !detailMobileSlider ||
        !cameraDetailApi
    ) {
        return;
    }


    cameraDetailApi.setImageIndex(
        imageIndex
    );


    detailMobileSlider
        .$buttons
        .removeClass(
            "active"
        );


    detailMobileSlider
        .$buttons
        .eq(imageIndex)
        .addClass(
            "active"
        );
}


// =========================================================
// 이미지 이동
// =========================================================

function goToDetailImage(
    imageIndex,
    direction
) {
    const slider =
        detailMobileSlider;


    if (
        !slider ||
        slider.animating
    ) {
        return;
    }


    const total =
        slider.total;


    const current =
        cameraDetailApi
            .getImageIndex();


    const nextIndex =
        (
            (
                imageIndex %
                total
            ) +
            total
        ) %
        total;


    let visualIndex =
        nextIndex + 1;


    if (
        direction === "next" &&
        current ===
        total - 1 &&
        nextIndex === 0
    ) {
        visualIndex =
            total + 1;
    } else if (
        direction === "prev" &&
        current === 0 &&
        nextIndex ===
        total - 1
    ) {
        visualIndex = 0;
    }


    if (
        visualIndex ===
        slider.visualIndex
    ) {
        updateDetailThumbnail(
            nextIndex
        );

        return;
    }


    slider.animating =
        true;


    updateDetailThumbnail(
        nextIndex
    );


    setDetailTrackPosition(
        visualIndex,
        true
    );
}


// =========================================================
// 무한 Slider
// =========================================================

function settleDetailLoop() {
    const slider =
        detailMobileSlider;


    if (!slider) {
        return;
    }


    if (
        slider.visualIndex ===
        0
    ) {
        setDetailTrackPosition(
            slider.total,
            false
        );
    } else if (
        slider.visualIndex ===
        slider.total + 1
    ) {
        setDetailTrackPosition(
            1,
            false
        );
    }


    slider.animating =
        false;
}


// =========================================================
// Slider Event
// =========================================================

function bindDetailMobileSliderEvents() {
    const slider =
        detailMobileSlider;


    const viewport =
        slider.$viewport.get(
            0
        );


    const track =
        slider.$track.get(
            0
        );


    slider.onTransitionEnd =
        function (event) {
            if (
                !event.target.classList.contains(
                    "detail-main-slide"
                )
            ) {
                return;
            }


            if (
                event.propertyName !==
                "transform"
            ) {
                return;
            }


            settleDetailLoop();
        };


    track.addEventListener(
        "transitionend",
        slider.onTransitionEnd
    );


    slider.swipe =
        createAxisSwipe(
            viewport,
            {
                isLocked:
                    function () {
                        return slider.animating;
                    },

                onSwipe:
                    function (
                        direction
                    ) {
                        const current =
                            cameraDetailApi
                                .getImageIndex();


                        if (
                            direction ===
                            "next"
                        ) {
                            goToDetailImage(
                                current +
                                1,
                                "next"
                            );
                        } else {
                            goToDetailImage(
                                current -
                                1,
                                "prev"
                            );
                        }
                    }
            }
        );
}


// =========================================================
// Slider Event 제거
// =========================================================

function unbindDetailMobileSliderEvents() {
    const slider =
        detailMobileSlider;


    if (!slider) {
        return;
    }


    if (
        slider.onTransitionEnd
    ) {
        slider.$track
            .get(0)
            .removeEventListener(
                "transitionend",
                slider.onTransitionEnd
            );
    }


    if (slider.swipe) {
        slider.swipe.destroy();
    }
}