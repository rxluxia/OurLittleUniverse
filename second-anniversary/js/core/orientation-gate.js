import { pause as pauseUniverse, resume as resumeUniverse } from "../scenes/opening-universe.js";
import { subscribe } from "./state.js";

const ORIENTATION_QUERY = "(orientation: portrait) and (max-width: 900px) and (pointer: coarse)";

export function init() {
  const stage = document.querySelector("#stage");
  const navigation = document.querySelector("#site-nav");
  const gate = document.querySelector("#rotate-gate");

  if (!stage || !navigation || !gate) {
    throw new Error("The orientation gate requires the stage, navigation, and gate elements.");
  }

  const orientationPreference = window.matchMedia(ORIENTATION_QUERY);

  function updateGate() {
    const gated = orientationPreference.matches;
    stage.inert = gated;
    navigation.inert = gated;
    gate.hidden = !gated;

    if (gated) {
      pauseUniverse();
    } else {
      resumeUniverse();
    }
  }

  const unsubscribe = subscribe(updateGate);
  orientationPreference.addEventListener("change", updateGate);
  updateGate();

  return () => {
    unsubscribe();
    orientationPreference.removeEventListener("change", updateGate);
    stage.inert = false;
    navigation.inert = false;
    gate.hidden = true;
    resumeUniverse();
  };
}
