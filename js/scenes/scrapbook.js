import { registerScene, goTo } from "../core/scene-manager.js";
import {
  start as startUniverse,
  stop as stopUniverse,
} from "./opening-universe.js";

const PAGES = [
  {
    title: "MY FAVORITE CUTE PHOTOS OF YOU",
    description: "Ran's favorite cute photos of Liean.",
    slots: 4,
  },
  {
    title: "YOUR FAVORITE CUTE PHOTOS OF ME",
    description: "Liean's favorite cute photos of Ran.",
    slots: 4,
  },
  {
    title: "YOUR FAVORITE COOL PHOTOS OF ME",
    description: "Liean's favorite cool photos of Ran.",
    slots: 4,
  },
  {
    title: "MY FAVORITE COOL PHOTOS OF YOU",
    description: "Ran's favorite cool photos of Liean.",
    slots: 4,
  },
  {
    title: "MY MOST FAVORITE PICTURES OF YOU",
    description: "Ran's two most favorite photos of Liean.",
    slots: 2,
  },
  {
    title: "MY MOST FAVORITE PICTURES OF YOU",
    description: "Liean's two most favorite photos of Ran.",
    slots: 2,
  },
];

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const PAGES_PER_SPREAD = 2;

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function decodeImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = () => reject(new Error("This file could not be read as an image."));
    image.src = url;
  });
}

export function init() {
  const scene = document.querySelector('[data-scene="scrapbook"]');
  const canvas = scene.querySelector(".scrapbook__universe");
  const readerCanvas = scene.querySelector(".scrapbook__reader-universe");
  const intro = scene.querySelector(".scrapbook__intro");
  const coverButton = scene.querySelector(".scrapbook__cover");
  const reader = scene.querySelector(".scrapbook__reader");
  const pageShell = scene.querySelector(".scrapbook__page-shell");
  const pagesElement = scene.querySelector(".scrapbook__pages");
  const turningLeaf = scene.querySelector(".scrapbook__turning-leaf");
  const pageIndicator = scene.querySelector(".scrapbook__page-indicator");
  const previousButton = scene.querySelector(".scrapbook__previous");
  const nextButton = scene.querySelector(".scrapbook__next");
  const viewer = scene.querySelector(".scrapbook__viewer");
  const viewerImage = scene.querySelector(".scrapbook__viewer-image");
  const viewerClose = scene.querySelector(".scrapbook__viewer-close");
  const importedPhotos = new Map();
  let currentPageIndex = 0;
  let pendingImports = 0;
  let isOpening = false;
  let isTurning = false;
  let isClosing = false;

  function updateControls() {
    const isLastPage = currentPageIndex + PAGES_PER_SPREAD >= PAGES.length;
    previousButton.hidden = currentPageIndex === 0;
    previousButton.disabled = isOpening || isTurning || isClosing || pendingImports > 0;
    nextButton.disabled = isOpening || isTurning || isClosing || pendingImports > 0;
    nextButton.setAttribute(
      "aria-label",
      isLastPage
        ? "Close the scrapbook and continue"
        : "Next scrapbook spread",
    );
    pageIndicator.textContent =
      `Pages ${currentPageIndex + 1}–${Math.min(currentPageIndex + PAGES_PER_SPREAD, PAGES.length)} of ${PAGES.length}`;
  }

  function openViewer(photo, pageIndex, slotIndex) {
    viewerImage.src = photo.url;
    viewerImage.alt = `Photo ${slotIndex + 1} on scrapbook page ${pageIndex + 1}`;
    viewer.showModal();
    document.body.classList.add("scrapbook-viewer-open");
  }

  async function importImage(event, pageIndex, slotIndex, status) {
    const input = event.currentTarget;
    const file = input.files[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      status.textContent = "Choose an image file.";
      input.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      status.textContent = "Choose an image smaller than 20 MB.";
      input.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    pendingImports += 1;
    status.textContent = "Reading image…";
    updateControls();

    try {
      await decodeImage(url);
      const key = `${pageIndex}-${slotIndex}`;
      const previousPhoto = importedPhotos.get(key);
      if (previousPhoto) {
        URL.revokeObjectURL(previousPhoto.url);
      }

      importedPhotos.set(key, { url, name: file.name });
      renderPages();
    } catch (error) {
      URL.revokeObjectURL(url);
      status.textContent = error.message;
    } finally {
      pendingImports -= 1;
      input.value = "";
      updateControls();
    }
  }

  function createPhotoSlot(pageIndex, slotIndex) {
    const photo = importedPhotos.get(`${pageIndex}-${slotIndex}`);
    const slot = document.createElement("figure");
    slot.className = "scrapbook__photo-slot";

    const frame = document.createElement("div");
    frame.className = "scrapbook__photo-frame";

    if (photo) {
      const viewButton = document.createElement("button");
      viewButton.className = "scrapbook__photo-view";
      viewButton.type = "button";
      viewButton.setAttribute(
        "aria-label",
        `Enlarge photo ${slotIndex + 1} on page ${pageIndex + 1}`,
      );

      const image = document.createElement("img");
      image.src = photo.url;
      image.alt = `Photo ${slotIndex + 1} on scrapbook page ${pageIndex + 1}`;
      viewButton.append(image);
      viewButton.addEventListener("click", () => openViewer(photo, pageIndex, slotIndex));
      frame.append(viewButton);
    } else {
      const placeholder = createTextElement(
        "div",
        "scrapbook__empty-slot",
        "Empty photo slot",
      );
      placeholder.setAttribute("role", "img");
      placeholder.setAttribute(
        "aria-label",
        `Empty photo slot ${slotIndex + 1} on page ${pageIndex + 1}`,
      );
      placeholder.append(createTextElement("span", "scrapbook__empty-mark", "+"));
      frame.append(placeholder);
    }

    const input = document.createElement("input");
    input.className = "scrapbook__file-input";
    input.type = "file";
    input.accept = "image/*";
    input.id = `scrapbook-photo-${pageIndex + 1}-${slotIndex + 1}`;
    input.addEventListener("change", (event) => {
      importImage(event, pageIndex, slotIndex, status);
    });

    const chooseButton = createTextElement(
      "button",
      "scrapbook__import",
      photo ? "Choose Again" : "Choose Image",
    );
    chooseButton.type = "button";
    chooseButton.addEventListener("click", () => input.click());

    const status = createTextElement(
      "figcaption",
      "scrapbook__slot-status",
      photo ? "Imported for this session" : "Empty slot",
    );
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    slot.append(frame, input, chooseButton, status);
    return slot;
  }

  function createPage(pageIndex) {
    const pageData = PAGES[pageIndex];
    const page = document.createElement("article");
    page.className = "scrapbook__page";
    page.dataset.slotCount = String(pageData.slots);

    const heading = createTextElement("h2", "scrapbook__page-heading", pageData.title);
    const description = createTextElement(
      "p",
      "scrapbook__page-copy",
      pageData.description,
    );
    const header = document.createElement("header");
    header.className = "scrapbook__page-intro";
    header.append(heading, description);

    const slots = document.createElement("div");
    slots.className = "scrapbook__slots";
    for (let slotIndex = 0; slotIndex < pageData.slots; slotIndex += 1) {
      slots.append(createPhotoSlot(pageIndex, slotIndex));
    }

    page.append(header, slots);
    return page;
  }

  function createTurningPage(pageIndex, backFace = false) {
    const page = createPage(pageIndex);
    page.classList.add("scrapbook__turning-face");
    if (backFace) {
      page.classList.add("scrapbook__turning-face--back");
    }

    page.querySelectorAll(
      ".scrapbook__file-input, .scrapbook__import, .scrapbook__slot-status",
    ).forEach((element) => element.remove());
    return page;
  }

  function renderPages() {
    const visiblePages = [];
    for (
      let offset = 0;
      offset < PAGES_PER_SPREAD && currentPageIndex + offset < PAGES.length;
      offset += 1
    ) {
      visiblePages.push(createPage(currentPageIndex + offset));
    }

    pagesElement.replaceChildren(...visiblePages);
    updateControls();
  }

  function turnPages(direction) {
    if (isOpening || isTurning || isClosing || pendingImports > 0) {
      return;
    }

    const nextIndex = currentPageIndex + direction * PAGES_PER_SPREAD;
    if (nextIndex < 0 || nextIndex >= PAGES.length) {
      return;
    }

    const currentPages = Array.from(pagesElement.children);
    if (direction > 0) {
      pagesElement.replaceChildren(currentPages[0], createPage(nextIndex + 1));
      turningLeaf.replaceChildren(
        createTurningPage(currentPageIndex + 1),
        createTurningPage(nextIndex, true),
      );
    } else {
      pagesElement.replaceChildren(createPage(nextIndex), currentPages[1]);
      turningLeaf.replaceChildren(
        createTurningPage(currentPageIndex),
        createTurningPage(nextIndex + 1, true),
      );
    }

    isTurning = true;
    pageShell.inert = true;
    updateControls();

    let settled = false;
    let timeout;

    function finishTurn(event) {
      if (event && event.target !== turningLeaf) {
        return;
      }

      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);
      turningLeaf.removeEventListener("animationend", finishTurn);
      pageShell.classList.remove("is-turning-next", "is-turning-previous");
      turningLeaf.replaceChildren();
      pageShell.inert = false;
      currentPageIndex = nextIndex;
      isTurning = false;
      renderPages();
    }

    turningLeaf.addEventListener("animationend", finishTurn);
    timeout = window.setTimeout(finishTurn, 1200);
    pageShell.classList.add(direction > 0 ? "is-turning-next" : "is-turning-previous");
  }

  async function closeScrapbook() {
    if (isOpening || isTurning || isClosing || pendingImports > 0) {
      return;
    }

    isClosing = true;
    reader.classList.add("is-closing");
    updateControls();

    let settled = false;
    const timeout = window.setTimeout(finishClose, 1000);

    async function finishClose(event) {
      if (event && event.target !== reader) {
        return;
      }

      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);
      reader.removeEventListener("animationend", finishClose);
      await goTo("poem", { transition: "fade" });
    }

    reader.addEventListener("animationend", finishClose);
  }

  function openScrapbook() {
    if (isOpening || !reader.hidden) {
      return;
    }

    isOpening = true;
    stopUniverse();
    intro.classList.add("is-opening");
    reader.hidden = false;
    reader.classList.remove("is-closing");
    reader.classList.add("is-opening");
    renderPages();
    startUniverse(readerCanvas, pageIndicator);

    let settled = false;
    const timeout = window.setTimeout(finishOpening, 900);

    function finishOpening(event) {
      if (event && event.target !== intro) {
        return;
      }

      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);
      intro.removeEventListener("animationend", finishOpening);
      intro.hidden = true;
      intro.classList.remove("is-opening");
      reader.classList.remove("is-opening");
      isOpening = false;
      updateControls();
      nextButton.focus({ preventScroll: true });
    }

    intro.addEventListener("animationend", finishOpening);
  }

  registerScene("scrapbook", {
    enter(options = {}) {
      const openReader = options.openReader === true;
      intro.hidden = openReader;
      intro.classList.remove("is-opening");
      reader.hidden = !openReader;
      reader.classList.remove("is-opening", "is-closing");
      isOpening = false;
      isClosing = false;
      if (openReader) {
        currentPageIndex = 0;
      }
      renderPages();
      startUniverse(
        openReader ? readerCanvas : canvas,
        openReader ? pageIndicator : coverButton,
      );
    },
    exit() {
      stopUniverse();
      if (viewer.open) {
        viewer.close();
      }
    },
  });

  coverButton.addEventListener("click", openScrapbook);
  previousButton.addEventListener("click", () => turnPages(-1));
  nextButton.addEventListener("click", () => {
    if (currentPageIndex + PAGES_PER_SPREAD >= PAGES.length) {
      void closeScrapbook();
      return;
    }

    turnPages(1);
  });
  viewerClose.addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
      viewer.close();
    }
  });
  viewer.addEventListener("close", () => {
    viewerImage.removeAttribute("src");
    document.body.classList.remove("scrapbook-viewer-open");
  });
  renderPages();
}
