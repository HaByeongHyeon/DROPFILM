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

function splitWaveTextNode(textNode) {
    var text = textNode.nodeValue;
    var parent = textNode.parentNode;
    var fragment;
    var parts;

    if (!parent || text == null) {
        return;
    }

    if (/^[\s]*$/.test(text) && /[\n\r]/.test(text)) {
        parent.removeChild(textNode);
        return;
    }

    fragment = document.createDocumentFragment();
    parts = text.split(/(\s+)/);

    parts.forEach(function (part) {
        var word;
        var chars;

        if (!part) {
            return;
        }

        if (/^\s+$/.test(part)) {
            if (/[\n\r]/.test(part)) {
                return;
            }

            fragment.appendChild(document.createTextNode(part));
            return;
        }

        word = document.createElement("span");
        word.className = "wave-word";
        chars = Array.from(part);

        chars.forEach(function (ch) {
            var mask = document.createElement("span");
            var letter = document.createElement("span");

            mask.className = "wave-mask";
            letter.className = "wave-letter";
            letter.textContent = ch;
            mask.appendChild(letter);
            word.appendChild(mask);
        });

        fragment.appendChild(word);
    });

    parent.replaceChild(fragment, textNode);
}

function splitWaveText(element) {
    function walk(node) {
        var children;
        var tag;

        if (!node) {
            return;
        }

        if (node.nodeType === 3) {
            splitWaveTextNode(node);
            return;
        }

        if (node.nodeType !== 1) {
            return;
        }

        tag = node.tagName;

        if (tag === "BR" || tag === "IMG" || tag === "SVG" || tag === "VIDEO") {
            return;
        }

        if (
            node.classList.contains("wave-word") ||
            node.classList.contains("wave-mask") ||
            node.classList.contains("wave-letter")
        ) {
            return;
        }

        children = Array.prototype.slice.call(node.childNodes);
        children.forEach(walk);
    }

    if (!element) {
        return [];
    }

    if (element.dataset.waveReady === "1") {
        return Array.prototype.slice.call(element.querySelectorAll(".wave-letter"));
    }

    walk(element);
    element.dataset.waveReady = "1";

    return Array.prototype.slice.call(element.querySelectorAll(".wave-letter"));
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
            fragment.appendChild(node);
            return;
        }

        line.appendChild(node);
    });

    flushLine();
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
        var lines;

        wrapWaveLines(block);
        lines = block.querySelectorAll(".wave-line");

        if (lines.length) {
            Array.prototype.forEach.call(lines, function (line) {
                targets.push(line);
            });
            return;
        }

        targets.push(block);
    });

    return targets;
}

function setWaveLetters(elements, yValue) {
    Array.prototype.forEach.call(elements, function (element) {
        var letters;

        if (!element) {
            return;
        }

        letters = splitWaveText(element);
        if (!letters.length) {
            return;
        }

        gsap.set(letters, { y: yValue });
    });
}

function addWaveSequence(timeline, elements, position, simultaneous) {
    var inserted = 0;

    Array.prototype.forEach.call(elements, function (element) {
        var letters;
        var pos;

        if (!element) {
            return;
        }

        letters = splitWaveText(element);

        if (!letters.length) {
            return;
        }

        gsap.set(letters, { y: WAVE_Y });

        if (inserted === 0) {
            pos = position;
        } else if (simultaneous) {
            pos = "<";
        } else {
            pos = undefined;
        }

        timeline.to(
            letters,
            {
                y: 0,
                duration: WAVE_DURATION,
                stagger: WAVE_STAGGER,
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
