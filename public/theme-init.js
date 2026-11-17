(function () {
  try {
    var stored = localStorage.getItem("perfume-theme");
    if (
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {
    // Storage can be blocked; the ThemeProvider still applies the theme.
  }
})();
