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

    if (!$section.length || $section.data("faqReady")) {
        return;
    }

    $section.data("faqReady", true);

    $items = $section.find(".faq-item");

    // FAQ는 처음에 모두 닫힌 상태
    $items.find(".faq-answer").hide();


    // ==================================================
    // FAQ 아코디언
    // ==================================================

    function closeAllAnswers(exceptItem) {
        $items.not(exceptItem).each(function () {
            var $item = $(this);

            $item.removeClass("is-open");

            $item
                .find(".faq-answer")
                .stop(true, true)
                .slideUp(300);
        });
    }


    $section.on("click", ".faq-question", function () {
        var $item = $(this).closest(".faq-item");
        var $answer = $item.find(".faq-answer");
        var isOpen = $item.hasClass("is-open");

        // 다른 FAQ는 닫기
        closeAllAnswers($item);

        // 이미 열려 있던 FAQ를 다시 클릭하면 닫기
        if (isOpen) {
            $item.removeClass("is-open");

            $answer
                .stop(true, true)
                .slideUp(300);

            return;
        }

        // 선택한 FAQ 열기
        $item.addClass("is-open");

        $answer
            .stop(true, true)
            .slideDown(300);
    });


    // ==================================================
    // 개인정보 전문보기
    // ==================================================

    $section.on(
        "click",
        ".contact-privacy-link",
        function (event) {
            event.preventDefault();
        }
    );


    // ==================================================
    // 필수 입력값 검증
    // ==================================================

    $section.on(
        "input change",
        ".contact-form [required]",
        function () {
            this.setCustomValidity("");
        }
    );


    // ==================================================
    // 문의 폼
    // ==================================================

    $section.on(
        "submit",
        ".contact-form",
        function (event) {
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
                var field =
                    document.getElementById(id);

                var empty;

                if (!field) {
                    return;
                }

                empty =
                    String(
                        $(field).val() || ""
                    ).trim() === "";

                field.setCustomValidity(
                    empty
                        ? "필수 입력칸에 내용을 입력하세요."
                        : ""
                );

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
        }
    );
}
