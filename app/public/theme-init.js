(function () {
  try {
    var t = localStorage.getItem("theme");
    if (t && ["light", "dark", "brasil"].indexOf(t) !== -1) {
      document.documentElement.classList.add(t);
    } else {
      document.documentElement.classList.add("brasil");
    }
  } catch (e) {
    document.documentElement.classList.add("brasil");
  }
})();
