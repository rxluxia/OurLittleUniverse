let canvas = null;
let targetElement = null;
let context = null;
let width = 0;
let height = 0;
let targetX = 0;
let targetY = 0;
let targetRadius = 0;
let maxRadius = 0;
let particles = [];
let animationFrame = null;
let resizeTimeout = null;
let lastTimestamp = 0;
let isRunning = false;
let isPaused = false;
let motionPreference = null;

function getColorTokens() {
  const styles = window.getComputedStyle(canvas || document.documentElement);
  return {
    white: styles.getPropertyValue("--white").trim(),
    gray: styles.getPropertyValue("--gray").trim(),
    champagne: styles.getPropertyValue("--champagne").trim(),
    emerald: styles.getPropertyValue("--emerald").trim(),
  };
}

function createParticle(colors) {
  const depth = Math.random();
  const colorChoice = Math.random();
  let color = colors.white;

  if (colorChoice < 0.02) {
    color = colors.emerald;
  } else if (colorChoice < 0.1) {
    color = colors.champagne;
  } else if (colorChoice < 0.48) {
    color = colors.gray;
  }

  return {
    angle: Math.random() * Math.PI * 2,
    radius: maxRadius * (0.9 + Math.random() * 0.1),
    depth,
    size: 0.5 + depth,
    opacity: 0.52 + depth * 0.48,
    speed: 44 + depth * 60,
    turn: (0.12 + Math.random() * 0.22) * (Math.random() < 0.5 ? -1 : 1),
    color,
  };
}

function updateTarget() {
  if (!canvas || !targetElement) {
    return;
  }

  const canvasBounds = canvas.getBoundingClientRect();
  const targetBounds = targetElement.getBoundingClientRect();
  targetX = targetBounds.left + targetBounds.width / 2 - canvasBounds.left;
  targetY = targetBounds.top + targetBounds.height / 2 - canvasBounds.top;
  targetRadius = Math.hypot(targetBounds.width / 2, targetBounds.height / 2);
  maxRadius = Math.max(
    Math.hypot(targetX, targetY),
    Math.hypot(width - targetX, targetY),
    Math.hypot(targetX, height - targetY),
    Math.hypot(width - targetX, height - targetY),
  );
}

function resizeCanvas() {
  if (!canvas || !context) {
    return;
  }

  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  updateTarget();

  const count = Math.min(160, Math.max(48, Math.round((width * height) / 3500)));
  const colors = getColorTokens();
  particles = Array.from({ length: count }, () => createParticle(colors));
  drawParticles();
}

function handleFontsLoaded() {
  if (isRunning) {
    updateTarget();
    drawParticles();
  }
}

function respawnParticle(particle) {
  particle.angle = Math.random() * Math.PI * 2;
  particle.radius = maxRadius * (0.9 + Math.random() * 0.1);
}

function drawParticles() {
  if (!context) {
    return;
  }

  context.clearRect(0, 0, width, height);
  context.lineCap = "round";

  for (const particle of particles) {
    const fade = Math.max(0, Math.min(1, (particle.radius - targetRadius) / 72));
    const x = targetX + Math.cos(particle.angle) * particle.radius;
    const y = targetY + Math.sin(particle.angle) * particle.radius;

    if (particle.radius > targetRadius) {
      const glowRadius = 4 + particle.depth * 8;
      const centerX = x + particle.size / 2;
      const centerY = y + particle.size / 2;
      const trailLength = 12 + particle.depth * 22;
      const tailRadius = particle.radius + trailLength;
      const tailX = targetX + Math.cos(particle.angle) * tailRadius;
      const tailY = targetY + Math.sin(particle.angle) * tailRadius;

      context.globalAlpha = particle.opacity * fade * 0.56;
      const trail = context.createLinearGradient(tailX, tailY, centerX, centerY);
      trail.addColorStop(0, "transparent");
      trail.addColorStop(1, particle.color);
      context.strokeStyle = trail;
      context.lineWidth = 0.6 + particle.depth * 0.8;
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(centerX, centerY);
      context.stroke();

      context.globalAlpha = particle.opacity * fade * 0.38;
      const glow = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        glowRadius,
      );
      glow.addColorStop(0, particle.color);
      glow.addColorStop(1, "transparent");
      context.fillStyle = glow;
      context.fillRect(
        centerX - glowRadius,
        centerY - glowRadius,
        glowRadius * 2,
        glowRadius * 2,
      );

      context.globalAlpha = particle.opacity * fade;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(centerX, centerY, particle.size / 2, 0, Math.PI * 2);
      context.fill();
    }
  }

  context.globalAlpha = 1;
}

function updateParticles(delta) {
  for (const particle of particles) {
    const progress = 1 - particle.radius / maxRadius;
    particle.radius -= particle.speed * (0.5 + progress * 1.5) * delta;
    particle.angle += particle.turn * (0.6 + progress) * delta;

    if (particle.radius <= targetRadius) {
      respawnParticle(particle);
    }
  }
}

function requestNextFrame() {
  if (
    isRunning
    && !isPaused
    && !document.hidden
    && !motionPreference.matches
    && animationFrame === null
  ) {
    animationFrame = window.requestAnimationFrame(drawFrame);
  }
}

function drawFrame(timestamp) {
  animationFrame = null;
  if (!isRunning || isPaused || document.hidden || motionPreference.matches) {
    lastTimestamp = 0;
    return;
  }

  updateTarget();
  const delta = lastTimestamp
    ? Math.min((timestamp - lastTimestamp) / 1000, 0.05)
    : 0;
  lastTimestamp = timestamp;

  updateParticles(delta);
  drawParticles();
  requestNextFrame();
}

function handleResize() {
  window.clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    resizeTimeout = null;
    resizeCanvas();
  }, 120);
}

function handleVisibilityChange() {
  if (document.hidden) {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    lastTimestamp = 0;
    return;
  }

  if (isPaused) {
    return;
  }

  if (motionPreference.matches) {
    drawParticles();
  } else {
    requestNextFrame();
  }
}

function handleMotionPreferenceChange() {
  if (isPaused) {
    return;
  }

  if (motionPreference.matches) {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    lastTimestamp = 0;
    drawParticles();
  } else {
    requestNextFrame();
  }
}

export function start(targetCanvas, target = null) {
  stop();
  canvas = targetCanvas;
  targetElement = target || canvas.closest('[data-scene="opening"]')?.querySelector(".opening__start");
  if (!targetElement) throw new Error("The starfield requires a target element.");

  context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create the opening scene canvas context.");
  }

  motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  isPaused = false;
  isRunning = true;
  resizeCanvas();
  window.addEventListener("resize", handleResize);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  motionPreference.addEventListener("change", handleMotionPreferenceChange);
  document.fonts?.addEventListener("loadingdone", handleFontsLoaded);
  document.fonts?.ready.then(handleFontsLoaded);
  requestNextFrame();
}

export function pause() {
  isPaused = true;

  if (animationFrame !== null) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  lastTimestamp = 0;
}

export function resume() {
  isPaused = false;

  if (!isRunning || !canvas || !context) {
    return;
  }

  if (motionPreference.matches) {
    drawParticles();
  } else {
    requestNextFrame();
  }
}

export function stop() {
  isRunning = false;

  if (animationFrame !== null) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  window.clearTimeout(resizeTimeout);
  resizeTimeout = null;
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  motionPreference?.removeEventListener("change", handleMotionPreferenceChange);
  document.fonts?.removeEventListener("loadingdone", handleFontsLoaded);

  if (context && canvas) {
    context.clearRect(0, 0, width, height);
  }

  canvas = null;
  targetElement = null;
  context = null;
  particles = [];
  motionPreference = null;
  lastTimestamp = 0;
}
