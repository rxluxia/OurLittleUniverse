import { registerScene } from "../core/scene-manager.js";
import {
  start as startUniverse,
  stop as stopUniverse,
} from "./opening-universe.js";

const TYPE_DELAY_MS = 44;
const LINE_PAUSE_MS = 260;

export function init() {
  const scene = document.querySelector('[data-scene="poem"]');
  const canvas = scene.querySelector(".poem__universe");
  const message = scene.querySelector(".poem__message");
  const nav = scene.querySelector(".poem__nav");
  const textNodes = [
    message.querySelector(".poem__progress").firstChild,
    message.querySelector(".poem__note").firstChild,
    message.querySelector("h1").firstChild,
  ];
  const fullText = textNodes.map((node) => node.textContent);
  let typingRun = 0;
  let typingTimer = 0;
  let finishDelay = null;

  function waitForTypingDelay(delay) {
    return new Promise((resolve) => {
      finishDelay = resolve;
      typingTimer = window.setTimeout(() => {
        typingTimer = 0;
        finishDelay = null;
        resolve();
      }, delay);
    });
  }

  function cancelTyping() {
    typingRun += 1;
    window.clearTimeout(typingTimer);
    typingTimer = 0;
    finishDelay?.();
    finishDelay = null;
  }

  async function typeLine(node, text, run) {
    for (const character of Array.from(text)) {
      if (run !== typingRun) {
        return false;
      }

      node.textContent += character;
      await waitForTypingDelay(TYPE_DELAY_MS);
    }

    return run === typingRun;
  }

  async function revealMessage() {
    cancelTyping();
    const run = typingRun;
    scene.classList.remove("poem--text-complete", "poem--nav-visible");
    nav.setAttribute("aria-hidden", "true");
    nav.inert = true;
    message.setAttribute("aria-busy", "true");
    textNodes.forEach((node) => {
      node.textContent = "";
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      textNodes.forEach((node, index) => {
        node.textContent = fullText[index];
      });
    } else {
      for (let index = 0; index < textNodes.length; index += 1) {
        const complete = await typeLine(textNodes[index], fullText[index], run);
        if (!complete) {
          return;
        }

        if (index < textNodes.length - 1) {
          await waitForTypingDelay(LINE_PAUSE_MS);
        }
      }
    }

    if (run !== typingRun) {
      return;
    }

    scene.classList.add("poem--text-complete");
    message.setAttribute("aria-busy", "false");
    nav.removeAttribute("aria-hidden");
    nav.inert = false;
    window.requestAnimationFrame(() => {
      if (run === typingRun) {
        scene.classList.add("poem--nav-visible");
      }
    });
  }

  registerScene("poem", {
    enter() {
      startUniverse(canvas, message);
      void revealMessage();
    },
    exit() {
      cancelTyping();
      stopUniverse();
    },
  });
}
