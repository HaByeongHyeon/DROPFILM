var WAVE_Y = "100%";
var WAVE_DURATION = 0.7;
var WAVE_STAGGER = 0.016;
var WAVE_EASE = "power3.out";

function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function killScrollTriggerById(id) {
    var existing;

    if (typeof ScrollTrigger === "undefined") {
        return;
    }

    existing = ScrollTrigger.getById(id);
    if (existing) {
        existing.kill();
    }
}

function splitWaveText(element) {
    var rise;

    if (!element) {
        return [];
    }

    if (element.classList.contains("wave-rise")) {
        return [element];
    }

    if (element.dataset.waveReady === "1") {
        rise = element.querySelector(":scope > .wave-rise");
        return rise ? [rise] : [];
    }

    rise = document.createElement("span");
    rise.className = "wave-rise";

    while (element.firstChild) {
        rise.appendChild(element.firstChild);
    }

    element.appendChild(rise);
    element.classList.add("wave-block");
    element.dataset.waveReady = "1";

    return [rise];
}

function wrapWaveLines(element) {
    var children;
    var fragment;
    var line;

    if (!element || element.dataset.waveLines === "1") {
        return;
    }

    children = Array.prototype.slice.call(element.childNodes);
    if (!children.length) {
        return;
    }

    fragment = document.createDocumentFragment();
    line = document.createElement("span");
    line.className = "wave-line";

    function flushLine() {
        if (!line.childNodes.length) {
            return;
        }

        fragment.appendChild(line);
        line = document.createElement("span");
        line.className = "wave-line";
    }

    children.forEach(function (node) {
        if (node.nodeType === 1 && node.tagName === "BR") {
            flushLine();
            return;
        }

        if (node.nodeType === 3 && /^\s*$/.test(node.nodeValue)) {
            return;
        }

        line.appendChild(node);
    });

    flushLine();

    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }

    element.appendChild(fragment);
    element.dataset.waveLines = "1";
}

function getSectionWaveTargets(section) {
    var blocks;
    var targets = [];

    if (!section) {
        return targets;
    }

    blocks = Array.prototype.filter.call(
        section.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li"),
        function (el) {
            if (!el.textContent || !el.textContent.trim()) {
                return false;
            }

            return !el.parentElement.closest("h1, h2, h3, h4, h5, h6, p, li");
        }
    );

    blocks.forEach(function (block) {
        targets.push(block);
    });

    return targets;
}

function getWaveLineTargets(element) {
    var lines;

    if (!element) {
        return [];
    }

    wrapWaveLines(element);
    lines = element.querySelectorAll(".wave-line");

    if (!lines.length) {
        return [element];
    }

    return Array.prototype.slice.call(lines);
}

function setWaveLetters(elements, yValue) {
    Array.prototype.forEach.call(elements, function (element) {
        var rises;

        if (!element) {
            return;
        }

        rises = splitWaveText(element);
        if (!rises.length) {
            return;
        }

        gsap.set(rises, { y: yValue });
    });
}

function addWaveSequence(timeline, elements, position, simultaneous) {
    var inserted = 0;

    Array.prototype.forEach.call(elements, function (element) {
        var rises;
        var pos;

        if (!element) {
            return;
        }

        rises = splitWaveText(element);

        if (!rises.length) {
            return;
        }

        gsap.set(rises, { y: WAVE_Y });

        if (inserted === 0) {
            pos = position;
        } else if (simultaneous) {
            pos = "<";
        } else {
            pos = undefined;
        }

        timeline.to(
            rises,
            {
                y: 0,
                duration: WAVE_DURATION,
                ease: WAVE_EASE
            },
            pos
        );
        inserted += 1;
    });

    return timeline;
}

function createWaveRevealTimeline(elements, scrollTriggerVars) {
    var timeline = gsap.timeline({
        scrollTrigger: scrollTriggerVars
    });

    addWaveSequence(timeline, elements);
    return timeline;
}

function initTriggeredWave(sectionSelector, id, getTargets, start, triggerFrom) {
    var section = document.querySelector(sectionSelector);
    var targets;

    if (!section) {
        return;
    }

    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("GSAP / ScrollTrigger is not loaded.");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);
    killScrollTriggerById(id);

    targets = typeof getTargets === "function"
        ? getTargets(section)
        : section.querySelectorAll(getTargets);

    if (!targets || !targets.length) {
        return;
    }

    if (prefersReducedMotion()) {
        setWaveLetters(targets, 0);
        return;
    }

    setWaveLetters(targets, WAVE_Y);

    createWaveRevealTimeline(targets, {
        id: id,
        trigger: triggerFrom === "section"
            ? section
            : (triggerFrom && section.querySelector(triggerFrom)) || targets[0] || section,
        start: start || "top 80%",
        toggleActions: "play none none reverse",
        invalidateOnRefresh: true
    });
}
