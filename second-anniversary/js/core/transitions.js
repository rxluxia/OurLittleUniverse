const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function waitForTransition(element, className) {
  if (prefersReducedMotion()) {
    element.classList.remove(className);
    return Promise.resolve();
  }

  const styles = window.getComputedStyle(element);
  const timeoutDuration = getTimeoutDuration(styles.transitionDuration, styles.transitionDelay);

  return new Promise((resolve) => {
    let settled = false;
    const timeout = window.setTimeout(finish, timeoutDuration);

    function finish(event) {
      if (event && event.target !== element) {
        return;
      }

      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);
      element.removeEventListener("transitionend", finish);
      element.classList.remove(className);
      resolve();
    }

    element.addEventListener("transitionend", finish);
  });
}

function waitForAnimation(element, className) {
  if (prefersReducedMotion()) {
    element.classList.remove(className);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeout;

    function finish(event) {
      if (event && event.target !== element) {
        return;
      }

      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);
      element.removeEventListener("animationend", finish);
      element.classList.remove(className);
      resolve();
    }

    element.addEventListener("animationend", finish);
    element.classList.add(className);
    const styles = window.getComputedStyle(element);
    timeout = window.setTimeout(
      finish,
      getTimeoutDuration(styles.animationDuration, styles.animationDelay),
    );
  });
}

function getTimeoutDuration(durationValue, delayValue) {
  const durations = durationValue.split(",").map(parseTime);
  const delays = delayValue.split(",").map(parseTime);
  const transitionCount = Math.max(durations.length, delays.length);
  const transitionTime = transitionCount
    ? Math.max(...Array.from({ length: transitionCount }, (_, index) => {
      const duration = durations[index % durations.length];
      const delay = delays[index % delays.length];
      return duration === null || delay === null ? NaN : duration + delay;
    }))
    : NaN;
  return Number.isFinite(transitionTime) && transitionTime !== 0
    ? transitionTime + 100
    : 700;
}

function parseTime(value) {
  const match = value.trim().match(/^(-?(?:\d+\.?\d*|\.\d+))(ms|s)$/i);
  if (!match) {
    return null;
  }

  const time = Number(match[1]);
  return match[2].toLowerCase() === "s" ? time * 1000 : time;
}

export function fadeOut(element) {
  element.classList.add("fade-out");
  return waitForTransition(element, "fade-out");
}

export function fadeIn(element) {
  return waitForAnimation(element, "fade-in");
}

export function zoomTo(element) {
  element.classList.add("zoom-to");
  return waitForTransition(element, "zoom-to");
}

export function crossfade(element, direction) {
  const className = direction === "out" ? "crossfade-out" : "crossfade-in";
  return waitForAnimation(element, className);
}

export function runTransition(element, type, direction) {
  if (type === "zoom") {
    return direction === "out" ? zoomTo(element) : fadeIn(element);
  }

  if (type === "crossfade") {
    return crossfade(element, direction);
  }

  return direction === "out" ? fadeOut(element) : fadeIn(element);
}
