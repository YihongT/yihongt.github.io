
document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.getAttribute("data-copy-target"));
    if (!target) return;
    await navigator.clipboard.writeText(target.innerText);
    const oldText = button.innerText;
    button.innerText = "Copied";
    button.classList.add("copied");
    setTimeout(() => {
      button.innerText = oldText;
      button.classList.remove("copied");
    }, 1200);
  });
});
