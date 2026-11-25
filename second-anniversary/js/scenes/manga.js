import { registerScene, goTo } from "../core/scene-manager.js";
import {
  start as startUniverse,
  stop as stopUniverse,
} from "./opening-universe.js";

const SPREAD_COUNT = 4;
const EXTRA_PAGE_INDEX = SPREAD_COUNT - 1;
const MANGA_PAGE_COUNT = 6;
const PAGE_ASSETS = [
  ...[1, 2, 4, 3, 5, 6].map((page) => ({
    src: `./assets/images/manga/page-${page}.png`,
  })),
  { src: "./assets/images/manga/back-cover.jpg", side: "left" },
  { src: "./assets/images/manga/back-cover.jpg", side: "right" },
];

function createPage(pageNumber) {
  const page = document.createElement("figure");
  page.className = pageNumber > MANGA_PAGE_COUNT
    ? "manga__page manga__page--extra-art"
    : "manga__page";
  renderPage(page, pageNumber);
  return page;
}

function renderPage(element, pageNumber) {
  const asset = PAGE_ASSETS[pageNumber - 1];
  const existingImage = element.firstElementChild;
  if (
    existingImage?.classList.contains("manga__page-art") &&
    existingImage.dataset.pageNumber === String(pageNumber)
  ) {
    return;
  }

  const image = document.createElement("img");
  image.className = asset.side
    ? `manga__page-art manga__page-art--spread-${asset.side}`
    : "manga__page-art";
  image.src = asset.src;
  image.dataset.pageNumber = String(pageNumber);
  image.alt = `Manga page ${pageNumber}`;
  image.decoding = "async";
  element.replaceChildren(image);
}

function renderSpread(element, leftPageNumber, rightPageNumber = leftPageNumber + 1) {
  const hasPageElements =
    element.children.length === 2 &&
    element.children[0].classList.contains("manga__page") &&
    element.children[1].classList.contains("manga__page");
  if (hasPageElements) {
    element.children[0].classList.toggle(
      "manga__page--extra-art",
      leftPageNumber > MANGA_PAGE_COUNT,
    );
    element.children[1].classList.toggle(
      "manga__page--extra-art",
      rightPageNumber > MANGA_PAGE_COUNT,
    );
    renderPage(element.children[0], leftPageNumber);
    renderPage(element.children[1], rightPageNumber);
    return;
  }

  element.replaceChildren(createPage(leftPageNumber), createPage(rightPageNumber));
}

export function init() {
  const scene = document.querySelector('[data-scene="manga"]');
  const canvas = scene.querySelector(".manga__universe");
  const spreadFrame = scene.querySelector(".manga__spread-frame");
  const underlay = scene.querySelector(".manga__underlay");
  const sheet = scene.querySelector(".manga__turning-sheet");
  const leaf = scene.querySelector(".manga__leaf");
  const leafFront = scene.querySelector(".manga__leaf-front");
  const leafBack = scene.querySelector(".manga__leaf-back");
  const previousButton = scene.querySelector(".manga__previous");
  const nextButton = scene.querySelector(".manga__next");
  const continueButton = scene.querySelector(".manga__continue");
  const nextGlyph = nextButton.querySelector("span");

  let currentSpread = 0;
  let isTurning = false;
  let isNavigatingToScrapbook = false;
  let isExtraPagePromptReady = false;
  let extraPagePromptTimeout = null;

  function updateControls() {
    const isExtraPage = currentSpread === EXTRA_PAGE_INDEX;
    previousButton.hidden = isTurning || isNavigatingToScrapbook || currentSpread === 0;
    previousButton.disabled = isTurning || isNavigatingToScrapbook;
    nextButton.hidden = isTurning || isNavigatingToScrapbook || isExtraPage;
    nextButton.disabled = isTurning || isNavigatingToScrapbook;
    continueButton.hidden =
      isTurning || isNavigatingToScrapbook || !isExtraPage || !isExtraPagePromptReady;
    continueButton.disabled = isTurning || isNavigatingToScrapbook;
    previousButton.setAttribute(
      "aria-label",
      currentSpread === 0 ? "Start of manga" : isExtraPage ? "Back to manga" : "Previous spread",
    );
    nextButton.setAttribute(
      "aria-label",
      currentSpread === EXTRA_PAGE_INDEX - 1 ? "Open extra page" : "Next spread",
    );
    nextGlyph.textContent = "›";
  }

  function updateSpread() {
    renderSpread(underlay, currentSpread * 2 + 1);
    updateControls();
  }

  function turnSpread(direction) {
    const nextSpread = currentSpread + direction;
    if (isTurning || isNavigatingToScrapbook || nextSpread < 0 || nextSpread >= SPREAD_COUNT) {
      return;
    }

    isTurning = true;
    const turningPage = direction > 0 ? currentSpread * 2 + 2 : currentSpread * 2 + 1;
    const reversePage = direction > 0 ? nextSpread * 2 + 1 : nextSpread * 2 + 2;

    if (currentSpread === EXTRA_PAGE_INDEX) {
      window.clearTimeout(extraPagePromptTimeout);
      extraPagePromptTimeout = null;
      isExtraPagePromptReady = false;
      continueButton.classList.remove("is-visible");
    }
    if (direction > 0) {
      renderSpread(underlay, currentSpread * 2 + 1, nextSpread * 2 + 2);
    } else {
      renderSpread(underlay, nextSpread * 2 + 1, currentSpread * 2 + 2);
    }
    renderPage(leafFront, turningPage);
    renderPage(leafBack, reversePage);
    updateControls();

    let settled = false;
    let timeout;

    function finishTurn(event) {
      if (event && event.target !== leaf) {
        return;
      }

      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);
      leaf.removeEventListener("animationend", finishTurn);
      sheet.classList.remove("is-turning-next", "is-turning-previous");
      currentSpread = nextSpread;
      isTurning = false;
      updateSpread();
      if (currentSpread === EXTRA_PAGE_INDEX) {
        extraPagePromptTimeout = window.setTimeout(() => {
          extraPagePromptTimeout = null;
          if (currentSpread !== EXTRA_PAGE_INDEX || isNavigatingToScrapbook) {
            return;
          }
          isExtraPagePromptReady = true;
          continueButton.classList.add("is-visible");
          updateControls();
        }, 550);
      }
    }

    leaf.addEventListener("animationend", finishTurn);
    timeout = window.setTimeout(finishTurn, 1400);
    sheet.classList.add(direction > 0 ? "is-turning-next" : "is-turning-previous");
  }

  async function continueToScrapbook() {
    if (isNavigatingToScrapbook || isTurning || currentSpread !== EXTRA_PAGE_INDEX) {
      return;
    }

    isNavigatingToScrapbook = true;
    updateControls();
    const transitioned = await goTo("scrapbook", {
      transition: "crossfade",
      openReader: true,
    });
    if (!transitioned) {
      isNavigatingToScrapbook = false;
      updateControls();
    }
  }

  registerScene("manga", {
    enter() {
      currentSpread = 0;
      isTurning = false;
      isNavigatingToScrapbook = false;
      isExtraPagePromptReady = false;
      window.clearTimeout(extraPagePromptTimeout);
      extraPagePromptTimeout = null;
      continueButton.classList.remove("is-visible");
      sheet.classList.remove("is-turning-next", "is-turning-previous");
      updateSpread();
      startUniverse(canvas, spreadFrame);
    },
    exit() {
      stopUniverse();
    },
  });

  previousButton.addEventListener("click", () => turnSpread(-1));
  nextButton.addEventListener("click", () => turnSpread(1));
  continueButton.addEventListener("click", continueToScrapbook);
  updateSpread();
}
