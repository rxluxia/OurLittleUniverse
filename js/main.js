import { setState } from "./core/state.js";
import { getSceneOrder, registerScene, goTo } from "./core/scene-manager.js";
import { unlockNav, connectNav } from "./core/nav.js";
import { init as initOrientationGate } from "./core/orientation-gate.js";
import { init as initOpening } from "./scenes/opening.js";
import { init as initManga } from "./scenes/manga.js";
import { init as initScrapbook } from "./scenes/scrapbook.js";
import { init as initPoem } from "./scenes/poem.js";

const sceneManager = {
  registerScene,
  goTo,
};

for (const name of getSceneOrder()) {
  if (["opening", "manga", "scrapbook", "poem"].includes(name)) {
    continue;
  }

  registerScene(name, {
    enter() {},
    exit() {},
  });
}

initOrientationGate();
initOpening();
initManga();
initScrapbook();
initPoem();
connectNav(sceneManager);
setState({ currentScene: "opening", navUnlocked: false });

window.sceneManager = sceneManager;
window.unlockNav = unlockNav;

window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});
