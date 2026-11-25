import { setState } from "./state.js";

export function unlockNav() {
  const nav = document.querySelector("#site-nav");
  nav.hidden = false;
  setState({ navUnlocked: true });
  return nav;
}

export function connectNav(sceneManager) {
  const navs = document.querySelectorAll("#site-nav, .poem__nav");

  for (const nav of navs) {
    nav.addEventListener("click", (event) => {
      const link = event.target.closest("[data-target]");
      if (!link || !nav.contains(link)) {
        return;
      }

      event.preventDefault();
      sceneManager.goTo(link.dataset.target);
    });
  }
}
