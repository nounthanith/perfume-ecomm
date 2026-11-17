(function () {
  try {
    if (sessionStorage.getItem("g-fragrance-splash-seen")) {
      document.documentElement.classList.add("splash-skipped");
    }
  } catch (e) {
    // Storage can be blocked; the splash still behaves normally.
  }
})();
