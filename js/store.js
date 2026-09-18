document.addEventListener("DOMContentLoaded", function () {
    loadComponents().then(function () {
        initHeader();
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

var STORE_MOBILE_QUERY = "(max-width: 874px) and (min-width: 402px)";
var storeRegionMap = {
    "전체": "",
    "서울": "seoul",
    "인천": "incheon",
    "부산": "busan",
    "제주": "jeju",
    "경주": "kyongju",
    "전주": "jeonju"
};
var selectedRegion = "전체";
var searchKeyword = "";
var storeSearchBound = false;
var storeTabs = [];
var storeCards = [];
var storeTabsReady = false;
var storeSlider = null;
var storeMediaBound = false;

function isStoreMobile() {
    return window.matchMedia(STORE_MOBILE_QUERY).matches;
}

function normalizeStoreSearchText(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function getStoreListNameByIndex(index) {
    var items = document.querySelectorAll(".map-sec .store-list .store-item");
    var title;

    if (!items[index]) {
        return "";
    }

    title = items[index].querySelector("h3");
    return title ? title.textContent : "";
}

function getFilteredStoreCards() {
    var regionClass = storeRegionMap[selectedRegion] || "";
    var keyword = normalizeStoreSearchText(searchKeyword);

    return storeCards.filter(function (card, index) {
        var name;

        if (regionClass && !card.classList.contains(regionClass)) {
            return false;
        }

        if (!keyword) {
            return true;
        }

        name = getStoreListNameByIndex(index);
        if (!name) {
            return false;
        }

        return normalizeStoreSearchText(name).indexOf(keyword) !== -1;
    });
}

function applyStoreCardVisibility() {
    var visible = getFilteredStoreCards();

    storeCards.forEach(function (card) {
        card.classList.toggle("is-hidden", visible.indexOf(card) === -1);
    });
}

function applyStoreFilterUpdate() {
    applyStoreCardVisibility();

    if (isStoreMobile()) {
        if (storeSlider) {
            rebuildStoreMobileSlider();
        } else {
            initStoreMobileSlider();
        }
        return;
    }

    destroyStoreMobileSlider();
}

function setSelectedRegion(label) {
    selectedRegion = storeRegionMap.hasOwnProperty(label) ? label : "전체";

    storeTabs.forEach(function (item) {
        item.classList.toggle("active", item.textContent.trim() === selectedRegion);
    });

    applyStoreFilterUpdate();
}

function initStoreSearch() {
    var input = document.querySelector(".store-slider-count > input");

    if (!input || storeSearchBound) {
        return;
    }

    storeSearchBound = true;
    input.addEventListener("input", function () {
        searchKeyword = input.value;
        applyStoreFilterUpdate();
    });
}

function initStoreTabs() {
    var section = document.querySelector(".store-sec");

    if (storeTabsReady || !section) {
        return;
    }

    storeTabs = Array.prototype.slice.call(section.querySelectorAll(".tab-item"));
    storeCards = Array.prototype.slice.call(section.querySelectorAll(".store-card"));

    if (!storeTabs.length || !storeCards.length) {
        return;
    }

    storeTabsReady = true;
    initStoreSearch();

    storeTabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            setSelectedRegion(tab.textContent.trim());
        });
    });
}

function updateStoreSliderPagination() {
    var count = document.querySelector(".store-sec .store-slider-count");
    var input;
    var filtered;
    var current;
    var label;

    if (!count) {
        return;
    }

    input = count.querySelector("input");
    filtered = storeSlider ? storeSlider.filtered : getFilteredStoreCards();
    current = storeSlider ? storeSlider.currentIndex : 0;
    label = filtered.length ? current + 1 + "/" + filtered.length : "";
    count.setAttribute("data-page", label);

    if (!input) {
        count.textContent = label;
    }
}

function setStoreTrackPosition(visualIndex, animate) {
    var viewport;
    var width;

    if (!storeSlider) {
        return;
    }

    viewport = storeSlider.viewport;
    width = viewport ? viewport.getBoundingClientRect().width : 0;
    storeSlider.visualIndex = visualIndex;

    Array.prototype.slice.call(storeSlider.track.children).forEach(function (card) {
        card.style.flex = "0 0 " + width + "px";
        card.style.width = width + "px";
        card.style.minWidth = width + "px";
        card.style.maxWidth = width + "px";
    });

    storeSlider.track.style.transition = animate ? "transform 0.4s ease" : "none";
    storeSlider.track.style.transform = "translate3d(" + (-visualIndex * width) + "px, 0, 0)";
}

function goToStoreSlide(logicalIndex, direction) {
    var total;
    var nextIndex;
    var visualIndex;

    if (!storeSlider || storeSlider.animating) {
        return;
    }

    total = storeSlider.filtered.length;
    if (total < 1) {
        return;
    }

    nextIndex = ((logicalIndex % total) + total) % total;
    visualIndex = total === 1 ? 0 : nextIndex + 1;

    if (total > 1 && direction === "next" && storeSlider.currentIndex === total - 1 && nextIndex === 0) {
        visualIndex = total + 1;
    } else if (total > 1 && direction === "prev" && storeSlider.currentIndex === 0 && nextIndex === total - 1) {
        visualIndex = 0;
    }

    storeSlider.animating = total > 1;
    storeSlider.currentIndex = nextIndex;
    updateStoreSliderPagination();
    setStoreTrackPosition(visualIndex, total > 1);

    if (total === 1) {
        storeSlider.animating = false;
    }
}

function settleStoreLoop() {
    if (!storeSlider) {
        return;
    }

    if (storeSlider.filtered.length > 1) {
        if (storeSlider.visualIndex === 0) {
            setStoreTrackPosition(storeSlider.filtered.length, false);
        } else if (storeSlider.visualIndex === storeSlider.filtered.length + 1) {
            setStoreTrackPosition(1, false);
        }
    }

    storeSlider.animating = false;
}

function createStoreAxisSwipe(element, options) {
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

function bindStoreMobileSliderEvents() {
    var track;
    var viewport;
    var section;

    if (!storeSlider) {
        return;
    }

    track = storeSlider.track;
    viewport = storeSlider.viewport;
    section = storeSlider.section;

    storeSlider.onTransitionEnd = function (event) {
        if (event.target !== track || event.propertyName !== "transform") {
            return;
        }
        settleStoreLoop();
    };

    storeSlider.onPrev = function () {
        if (!storeSlider || storeSlider.animating) {
            return;
        }
        goToStoreSlide(storeSlider.currentIndex - 1, "prev");
    };

    storeSlider.onNext = function () {
        if (!storeSlider || storeSlider.animating) {
            return;
        }
        goToStoreSlide(storeSlider.currentIndex + 1, "next");
    };

    track.addEventListener("transitionend", storeSlider.onTransitionEnd);
    section.querySelector(".store-slider-prev").addEventListener("click", storeSlider.onPrev);
    section.querySelector(".store-slider-next").addEventListener("click", storeSlider.onNext);
    storeSlider.swipe = createStoreAxisSwipe(viewport, {
        isLocked: function () {
            return !storeSlider || storeSlider.animating;
        },
        onSwipe: function (direction) {
            if (direction === "next") {
                goToStoreSlide(storeSlider.currentIndex + 1, "next");
            } else {
                goToStoreSlide(storeSlider.currentIndex - 1, "prev");
            }
        }
    });
}

function unbindStoreMobileSliderEvents() {
    if (!storeSlider) {
        return;
    }

    if (storeSlider.onTransitionEnd) {
        storeSlider.track.removeEventListener("transitionend", storeSlider.onTransitionEnd);
    }
    if (storeSlider.onPrev) {
        storeSlider.section.querySelector(".store-slider-prev").removeEventListener("click", storeSlider.onPrev);
    }
    if (storeSlider.onNext) {
        storeSlider.section.querySelector(".store-slider-next").removeEventListener("click", storeSlider.onNext);
    }
    if (storeSlider.swipe) {
        storeSlider.swipe.destroy();
    }
}

function rebuildStoreMobileSlider() {
    var filtered;
    var track;
    var clone;

    if (!storeSlider) {
        return;
    }

    track = storeSlider.track;
    Array.prototype.slice.call(track.querySelectorAll("[data-clone]")).forEach(function (node) {
        node.parentNode.removeChild(node);
    });

    applyStoreCardVisibility();
    filtered = getFilteredStoreCards();
    storeSlider.filtered = filtered;
    storeSlider.currentIndex = 0;
    storeSlider.animating = false;

    if (filtered.length > 1) {
        clone = filtered[filtered.length - 1].cloneNode(true);
        clone.setAttribute("data-clone", "true");
        clone.classList.remove("is-hidden");
        track.insertBefore(clone, track.firstChild);

        clone = filtered[0].cloneNode(true);
        clone.setAttribute("data-clone", "true");
        clone.classList.remove("is-hidden");
        track.appendChild(clone);

        setStoreTrackPosition(1, false);
    } else {
        setStoreTrackPosition(0, false);
    }

    updateStoreSliderPagination();
}

function initStoreMobileSlider() {
    var section = document.querySelector(".store-sec");
    var viewport;
    var track;

    if (!isStoreMobile() || !section || storeSlider) {
        if (storeSlider && isStoreMobile()) {
            setStoreTrackPosition(storeSlider.visualIndex, false);
        }
        return;
    }

    viewport = section.querySelector(".store-slider-viewport");
    track = section.querySelector(".store-card-wrap");

    if (!viewport || !track) {
        return;
    }

    storeSlider = {
        section: section,
        viewport: viewport,
        track: track,
        filtered: [],
        currentIndex: 0,
        visualIndex: 1,
        animating: false,
        swipe: null
    };

    bindStoreMobileSliderEvents();
    rebuildStoreMobileSlider();
}

function destroyStoreMobileSlider() {
    var cards;

    if (!storeSlider) {
        applyStoreCardVisibility();
        return;
    }

    unbindStoreMobileSliderEvents();

    Array.prototype.slice.call(storeSlider.track.querySelectorAll("[data-clone]")).forEach(function (node) {
        node.parentNode.removeChild(node);
    });

    storeSlider.track.style.transform = "";
    storeSlider.track.style.transition = "";
    cards = storeSlider.track.querySelectorAll(".store-card");
    Array.prototype.slice.call(cards).forEach(function (card) {
        card.style.flex = "";
        card.style.width = "";
        card.style.minWidth = "";
        card.style.maxWidth = "";
    });

    storeSlider = null;
    applyStoreCardVisibility();
}

function syncStoreMobileSlider() {
    if (isStoreMobile()) {
        initStoreMobileSlider();
    } else {
        destroyStoreMobileSlider();
    }
}

function bindStoreMobileMedia() {
    var media;

    if (storeMediaBound) {
        return;
    }

    storeMediaBound = true;
    media = window.matchMedia(STORE_MOBILE_QUERY);

    if (typeof media.addEventListener === "function") {
        media.addEventListener("change", syncStoreMobileSlider);
    } else if (typeof media.addListener === "function") {
        media.addListener(syncStoreMobileSlider);
    }

    syncStoreMobileSlider();
}

initStoreTabs();
bindStoreMobileMedia();


// 지도 ====================================================


var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
    mapOption = {
        center: new kakao.maps.LatLng(37.5605459732738, 126.992880571124), // 지도의 중심좌표
        level: 4 // 지도의 확대 레벨
    };

var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

var imageSrc = './assets/images/store-images/icon-marker.png', // 마커이미지의 주소입니다    
    imageSize = new kakao.maps.Size(30, 36), // 마커이미지의 크기입니다
    imageOption = { offset: new kakao.maps.Point(27, 69) }; // 마커이미지의 옵션입니다. 마커의 좌표와 일치시킬 이미지 안에서의 좌표를 설정합니다.

var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

var stores = [
    {
        name: "서울 충무로(본점)",
        lat: 37.5605459732738,
        lng: 126.992880571124
    },
    {
        name: "광화문점",
        lat: 37.5718478584908,
        lng: 126.97685401725769
    },
    {
        name: "홍대점",
        lat: 37.5568904093718,
        lng: 126.923674307594
    },
    {
        name: "인천공항점",
        lat: 37.458350533174,
        lng: 126.42769952089
    },
    {
        name: "부산 해운대점",
        lat: 35.1591069824231,
        lng: 129.160283786856
    },
    {
        name: "제주 성신점",
        lat: 33.462233758483,
        lng: 126.936800689963
    },
    {
        name: "제주 애월점",
        lat: 33.4632634899794,
        lng: 126.309727828319
    },
    {
        name: "경주 황리단길점",
        lat: 35.8374082960758,
        lng: 129.209953703559
    },
    {
        name: "전주 한옥마을점",
        lat: 35.8182133310179,
        lng: 127.153608497904
    }
];

stores.forEach(function (store) {
    var marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(store.lat, store.lng),
        image: markerImage
    });

    marker.setMap(map);
});

Array.prototype.slice.call(document.querySelectorAll(".map-sec .store-item")).forEach(function (item) {
    item.addEventListener("click", function () {
        var title = item.querySelector("h3");
        var name = title ? title.textContent.trim() : "";
        var store = stores.filter(function (entry) {
            return entry.name === name;
        })[0] || stores[Array.prototype.indexOf.call(item.parentNode.children, item)];

        if (!store) {
            return;
        }

        map.panTo(new kakao.maps.LatLng(store.lat, store.lng));
    });
});

(function initMapSecStoreSearch() {
    var searchInput = document.querySelector(".map-sec .search-box .input");
    var storeItems = document.querySelectorAll(".map-sec .store-list .store-item");

    if (!searchInput || !storeItems.length) {
        return;
    }

    function filterMapStoreList() {
        var keyword = searchInput.value.trim().toLowerCase();

        Array.prototype.forEach.call(storeItems, function (item) {
            var title = item.querySelector("h3");
            var storeName = title ? title.textContent.trim().toLowerCase() : "";
            var matched = !keyword || (storeName && storeName.indexOf(keyword) !== -1);

            item.style.display = matched ? "" : "none";
        });
    }

    searchInput.addEventListener("input", filterMapStoreList);
})();

var mapResizeTimer;

window.addEventListener("resize", function () {
    clearTimeout(mapResizeTimer);
    mapResizeTimer = setTimeout(function () {
        if (map && typeof map.relayout === "function") {
            map.relayout();
        }
        syncStoreMobileSlider();
    }, 200);
});  