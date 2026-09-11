const showAnim = gsap.from(".header", {
    yPercent: -100,
    paused: true,
    duration: 0.25
}).progress(1);

ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate: function (self) {
        self.direction === -1 ? showAnim.play() : showAnim.reverse();
    }
});
