
document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.getAttribute("data-copy-target"));
    if (!target) return;
    await navigator.clipboard.writeText(target.innerText);
    const label = button.querySelector(".copy-label") || button;
    const oldText = label.textContent;
    label.textContent = "Copied";
    button.classList.add("copied");
    setTimeout(() => {
      label.textContent = oldText;
      button.classList.remove("copied");
    }, 1200);
  });
});
