import { registerScene, goTo } from "../core/scene-manager.js";
import {
  start as startUniverse,
  stop as stopUniverse,
} from "./opening-universe.js";

export function init() {
  const scene = document.querySelector('[data-scene="opening"]');
  const canvas = scene.querySelector(".opening__universe");
  const button = scene.querySelector(".opening__start");
  let transitionStarted = false;

  function enter() {
    transitionStarted = false;
    button.disabled = false;
    scene.classList.remove("opening--closing");
    scene.classList.remove("opening--entered");
    void scene.offsetWidth;
    scene.classList.add("opening--entered");
    startUniverse(canvas);
    button.focus({ preventScroll: true });
  }

  async function startStory() {
    if (transitionStarted) {
      return;
    }

    transitionStarted = true;
    button.blur();
    button.disabled = true;
    scene.classList.add("opening--closing");
    await goTo("manga", { transition: "fade" });
  }

  registerScene("opening", {
    enter,
    exit() {
      if (!transitionStarted) {
        stopUniverse();
      }
    },
  });

  button.addEventListener("click", startStory);
  enter();
}
