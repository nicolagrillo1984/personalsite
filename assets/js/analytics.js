(function () {
  "use strict";
  var KEY = "cookie-consent";
  var banner = document.getElementById("cookieBanner");

  function update(value) {
    if (typeof gtag === "function") {
      gtag("consent", "update", { analytics_storage: value });
    }
  }

  var stored = null;
  try {
    stored = localStorage.getItem(KEY);
  } catch (e) {}

  if (stored === "granted" || stored === "denied") {
    update(stored);
    return;
  }

  if (!banner) return;
  banner.hidden = false;

  function choose(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (e) {}
    update(value);
    banner.hidden = true;
  }

  var accept = document.getElementById("cookieAccept");
  var decline = document.getElementById("cookieDecline");
  if (accept) accept.addEventListener("click", function () { choose("granted"); });
  if (decline) decline.addEventListener("click", function () { choose("denied"); });
})();
