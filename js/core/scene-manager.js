import { setState } from "./state.js";
import { runTransition } from "./transitions.js";

const SCENE_ORDER = Object.freeze([
  "opening",
  "manga",
  "scrapbook",
  "closing",
  "poem",
]);

const registeredScenes = new Map();
let transitioning = false;

function getSceneElement(name) {
  return document.querySelector(`[data-scene="${name}"]`);
}

function setSceneAvailability(scene, active) {
  scene.classList.toggle("is-active", active);
  scene.setAttribute("aria-hidden", String(!active));

  if (active) {
    scene.removeAttribute("inert");
  } else {
    scene.setAttribute("inert", "");
  }
}

export function registerScene(name, handlers = {}) {
  if (!SCENE_ORDER.includes(name)) {
    throw new Error(`Unknown scene: ${name}`);
  }

  registeredScenes.set(name, {
    enter: handlers.enter || (() => {}),
    exit: handlers.exit || (() => {}),
  });

  return () => registeredScenes.delete(name);
}

export async function goTo(name, options = {}) {
  if (!SCENE_ORDER.includes(name)) {
    throw new Error(`Unknown scene: ${name}`);
  }

  if (transitioning) {
    return false;
  }

  const currentName = document.querySelector(".scene.is-active")?.dataset.scene;
  if (currentName === name) {
    return true;
  }

  const current = getSceneElement(currentName);
  const next = getSceneElement(name);
  const currentHandlers = registeredScenes.get(currentName);
  const nextHandlers = registeredScenes.get(name);

  transitioning = true;

  try {
    const transition = options.transition || "fade";
    if (transition === "crossfade" && current) {
      await currentHandlers?.exit?.();
      setSceneAvailability(next, true);
      await nextHandlers?.enter?.(options);
      await Promise.all([
        runTransition(current, transition, "out"),
        runTransition(next, transition, "in"),
      ]);
      setSceneAvailability(current, false);
    } else {
      if (current) {
        await currentHandlers?.exit?.();
        await runTransition(current, transition, "out");
        setSceneAvailability(current, false);
      }

      setSceneAvailability(next, true);
      await nextHandlers?.enter?.(options);
      await runTransition(next, transition, "in");
    }

    setState({ currentScene: name });
    return true;
  } catch (error) {
    console.error(error);
    if (current) {
      setSceneAvailability(current, false);
    }
    setSceneAvailability(next, true);
    setState({ currentScene: name });
    return false;
  } finally {
    transitioning = false;
  }
}

export function getSceneOrder() {
  return [...SCENE_ORDER];
}
