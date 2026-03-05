(function () {
  try {
    var theme = localStorage.getItem("theme") || "dark";
    var validThemes = ["light", "dark", "brasil"];
    if (!validThemes.includes(theme)) theme = "dark";
    document.documentElement.classList.add(theme);
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
