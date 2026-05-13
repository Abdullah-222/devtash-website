(function () {
  "use strict";

  if (window.__ventionIndustriesAccordion) return;
  window.__ventionIndustriesAccordion = true;

  function sectionRoot() {
    return document.querySelector("section.jiwsga:has(.cmoBcH)");
  }

  /** Drop SSR "opened" so CSS hover logic owns the first panel until hover. */
  function stripOpened() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var root = sectionRoot();
    if (!root) return;
    root.querySelectorAll(".ikezuX.opened").forEach(function (el) {
      el.classList.remove("opened");
    });
  }

  function init() {
    stripOpened();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Upstream React may re-hydrate and re-add `.opened` — strip once layout settles. */
  window.requestAnimationFrame(function () {
    stripOpened();
    window.setTimeout(stripOpened, 500);
  });
})();
