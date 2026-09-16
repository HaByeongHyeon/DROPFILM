$(function () {
    loadComponents().then(function () {
        initHeader();
        initProductTabs();
    });
});

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