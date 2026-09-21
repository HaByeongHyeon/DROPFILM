document.addEventListener("DOMContentLoaded", function () {
    loadComponents().then(function () {
        initHeader();
    });
    initFaqAccordion();
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

function initFaqAccordion() {
    var $section = $(".contact-sec");
    var $items;
    var $tabs;

    if (!$section.length || $section.data("faqReady")) {
        return;
    }

    $section.data("faqReady", true);
    $items = $section.find(".faq-item");
    $tabs = $section.find(".tab-item");
    $items.find(".faq-answer").hide();

    function closeAllAnswers(exceptItem) {
        $items.not(exceptItem).each(function () {
            var $item = $(this);
            $item.removeClass("is-open");
            $item.find(".faq-answer").stop(true, true).slideUp(300);
        });
    }

    function resetAnswers() {
        $items.removeClass("is-open");
        $items.find(".faq-answer").stop(true, true).hide();
    }

    $section.on("click", ".faq-question", function () {
        var $item = $(this).closest(".faq-item");
        var $answer = $item.find(".faq-answer");
        var isOpen = $item.hasClass("is-open");

        closeAllAnswers($item);

        if (isOpen) {
            $item.removeClass("is-open");
            $answer.stop(true, true).slideUp(300);
            return;
        }

        $item.addClass("is-open");
        $answer.stop(true, true).slideDown(300);
    });

    $section.on("click", ".tab-item", function () {
        var $tab = $(this);
        var tab = $tab.attr("data-tab");

        $tabs.removeClass("active");
        $tab.addClass("active");
        resetAnswers();

        if (tab === "inquiry") {
            $section.addClass("is-inquiry");
            return;
        }

        $section.removeClass("is-inquiry");
    });

    $section.on("click", ".contact-privacy-link", function (event) {
        event.preventDefault();
    });

    $section.on("input change", ".contact-form [required]", function () {
        this.setCustomValidity("");
    });

    $section.on("submit", ".contact-form", function (event) {
        var form = this;
        var requiredIds = [
            "contact-name",
            "contact-email",
            "contact-phone1",
            "contact-phone2",
            "contact-phone3",
            "contact-region"
        ];
        var firstInvalid = null;

        event.preventDefault();

        requiredIds.forEach(function (id) {
            var field = document.getElementById(id);
            var empty;

            if (!field) {
                return;
            }

            empty = String($(field).val() || "").trim() === "";
            field.setCustomValidity(empty ? "필수 입력칸에 내용을 입력하세요." : "");

            if (empty && !firstInvalid) {
                firstInvalid = field;
            }
        });

        if (firstInvalid) {
            form.reportValidity();
            return;
        }

        alert("문의 완료되었습니다.");
        form.reset();
    });
}
