document.querySelectorAll("[data-print]").forEach((btn) => {
  btn.addEventListener("click", () => window.print());
});
