(function () {
  "use strict";

  if (window.__vcExpertiseMegaNav) return;
  window.__vcExpertiseMegaNav = true;

  var MQ = "(min-width: 1080px)";
  var TRIGGER_SEL = ".kycIdF > .fFpJPB > .pDEJK:first-of-type .dJvWsv";
  var HOST_SEL = ".kycIdF > .fFpJPB > .pDEJK:first-of-type .gIHtZb";

  function mqOk() {
    return window.matchMedia(MQ).matches;
  }

  function expertiseHost() {
    var row = document.querySelector(".kycIdF > .fFpJPB");
    if (!row) return null;
    return row.querySelector(":scope > .pDEJK:first-of-type .gIHtZb") || null;
  }

  function triggerEl() {
    var h = expertiseHost();
    return h ? h.querySelector(":scope > .dJvWsv") : null;
  }

  function setExpanded(open) {
    var t = triggerEl();
    if (t) t.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function close() {
    var host = expertiseHost();
    if (!host) return;
    host.classList.remove("vc-mega-open");
    setExpanded(false);
  }

  function toggle() {
    var host = expertiseHost();
    if (!host) return;
    var open = host.classList.toggle("vc-mega-open");
    setExpanded(open);
  }

  var rafAria = 0;
  function scheduleEnsureAria() {
    if (rafAria) return;
    rafAria = requestAnimationFrame(function () {
      rafAria = 0;
      ensureAria();
    });
  }

  function ensureAria() {
    var t = document.querySelector(TRIGGER_SEL);
    if (!t) return;
    if (!t.hasAttribute("data-vc-nav-expertise")) {
      t.setAttribute("data-vc-nav-expertise", "");
      t.setAttribute("role", "button");
      t.setAttribute("tabindex", "0");
      t.setAttribute("aria-haspopup", "true");
    }
    var host = t.closest(".gIHtZb");
    t.setAttribute(
      "aria-expanded",
      host && host.classList.contains("vc-mega-open") ? "true" : "false"
    );
  }

  function onDocClick(e) {
    if (!mqOk()) return;

    var t = e.target.closest(TRIGGER_SEL);
    if (t) {
      toggle();
      return;
    }

    var host = expertiseHost();
    if (!host || !host.classList.contains("vc-mega-open")) return;

    if (host.contains(e.target)) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (a && host.contains(a)) close();
      return;
    }

    close();
  }

  function onDocKeydown(e) {
    if (!mqOk()) return;

    if (e.key === "Escape") {
      close();
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      var t = e.target.closest && e.target.closest(TRIGGER_SEL);
      if (t) {
        e.preventDefault();
        toggle();
      }
    }
  }

  function onResize() {
    if (!mqOk()) close();
  }

  function patchHistory() {
    function onNav() {
      close();
      scheduleEnsureAria();
    }

    ["pushState", "replaceState"].forEach(function (method) {
      var orig = history[method].bind(history);
      history[method] = function (state, title, url) {
        var ret = orig(state, title, url);
        onNav();
        return ret;
      };
    });

    window.addEventListener("popstate", onNav);

    if (typeof navigation !== "undefined" && navigation.addEventListener) {
      try {
        navigation.addEventListener("navigate", onNav);
      } catch (_) {}
    }
  }

  function observeHeader() {
    var header = document.querySelector("header.nUJUL");
    if (!header || header.hasAttribute("data-vc-expertise-mo")) return;
    header.setAttribute("data-vc-expertise-mo", "");
    var obs = new MutationObserver(function () {
      scheduleEnsureAria();
    });
    obs.observe(header, { childList: true, subtree: true });
  }

  function init() {
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onDocKeydown);
    window.addEventListener("resize", onResize);
    patchHistory();
    observeHeader();
    scheduleEnsureAria();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
