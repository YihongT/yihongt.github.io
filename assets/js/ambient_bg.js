(() => {
  const canvas = document.getElementById("ambient-bg");
  if (!canvas) return;
  const body = document.body;
  const dataset = body ? body.dataset : {};
  const enabledValue = dataset.ambientBg;
  if (enabledValue === "off" || enabledValue === "false" || enabledValue === "0") return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const parseNumber = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };
  const parseCssRgbVar = (styles, name, fallback) => {
    const raw = (styles.getPropertyValue(name) || "").trim();
    if (!raw) return fallback;
    const parts = raw.split(",").map(v => Number(v.trim()));
    if (parts.length !== 3 || parts.some(v => !Number.isFinite(v))) return fallback;
    return parts;
  };
  const rgba = (rgb, alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  const baseDensity = parseNumber(dataset.ambientBgDensity, 110);
  const density = prefersReduced ? Math.max(18, Math.round(baseDensity / 3)) : baseDensity;
  const particles = [];
  let width = 0;
  let height = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let scrollY = 0;
  let lastTime = 0;
  let activeThemeId = "";
  let glowPalette = {
    link: [99, 102, 241],
    accent: [56, 189, 248]
  };
  const refreshGlowPalette = () => {
    const styles = getComputedStyle(document.documentElement);
    glowPalette = {
      link: parseCssRgbVar(styles, "--link-rgb", [99, 102, 241]),
      accent: parseCssRgbVar(styles, "--accent-rgb", [56, 189, 248])
    };
  };

  const palette = {
    light: [
      "rgba(37, 99, 235, 0.22)",
      "rgba(16, 185, 129, 0.2)",
      "rgba(148, 163, 184, 0.2)"
    ],
    dark: [
      "rgba(124, 196, 255, 0.24)",
      "rgba(52, 211, 153, 0.2)",
      "rgba(148, 163, 184, 0.2)"
    ]
  };

  const config = {
    glowLight: parseNumber(dataset.ambientBgGlowLight, 0.08),
    glowDark: parseNumber(dataset.ambientBgGlowDark, 0.12),
    glowRadiusScale: parseNumber(dataset.ambientBgGlowRadiusScale, 1.05),
    lineDistance: parseNumber(dataset.ambientBgLineDistance, 110),
    lineDistanceMobile: parseNumber(dataset.ambientBgLineDistanceMobile, 36),
    lineAlphaLight: parseNumber(dataset.ambientBgLineAlphaLight, 0.12),
    lineAlphaDark: parseNumber(dataset.ambientBgLineAlphaDark, 0.15),
    particleSpeed: parseNumber(dataset.ambientBgParticleSpeed, 0.12),
    particleSpeedJitter: parseNumber(dataset.ambientBgParticleSpeedJitter, 0.3),
    particleDrift: parseNumber(dataset.ambientBgParticleDrift, 0.18),
    particleAlphaBase: parseNumber(dataset.ambientBgParticleAlphaBase, 0.85),
    particleAlphaBoost: parseNumber(dataset.ambientBgParticleAlphaBoost, 0.4),
    particleRepulseRadius: parseNumber(dataset.ambientBgParticleRepulseRadius, 140),
    particleRepulseStrength: parseNumber(dataset.ambientBgParticleRepulseStrength, 0.6),
    scrollDriftX: parseNumber(dataset.ambientBgScrollDriftX, 0.015),
    scrollDriftY: parseNumber(dataset.ambientBgScrollDriftY, 0.04),
    wobble: parseNumber(dataset.ambientBgWobble, 6)
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * window.devicePixelRatio);
    canvas.height = Math.floor(height * window.devicePixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    pointerX = width * 0.5;
    pointerY = height * 0.4;
    targetX = pointerX;
    targetY = pointerY;
    resetParticles();
  };

  const resetParticles = () => {
    particles.length = 0;
    for (let i = 0; i < density; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1.2 + Math.random() * 2.8,
        speed: config.particleSpeed + Math.random() * config.particleSpeedJitter,
        drift: (Math.random() - 0.5) * config.particleDrift,
        colorIndex: i % 3,
        phase: Math.random() * Math.PI * 2
      });
    }
  };

  const drawGlow = (themeId) => {
    const isDark = themeId === "dark";
    const glowStrength = isDark ? config.glowDark : config.glowLight;
    const maxRadius = Math.hypot(width, height) * config.glowRadiusScale;

    // Keep a subtle, full-screen base so the glow never drops out at any scroll position.
    ctx.fillStyle = rgba(glowPalette.link, glowStrength * 0.14);
    ctx.fillRect(0, 0, width, height);

    // Main mouse-follow glow.
    const follower = ctx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, maxRadius);
    follower.addColorStop(0, rgba(glowPalette.link, glowStrength * 0.95));
    follower.addColorStop(0.42, rgba(glowPalette.accent, glowStrength * 0.48));
    follower.addColorStop(1, rgba(glowPalette.link, 0));
    ctx.fillStyle = follower;
    ctx.fillRect(0, 0, width, height);

    // Secondary ambient highlight to avoid a hard single-spot look.
    const ambient = ctx.createRadialGradient(
      width * 0.86,
      height * 0.18,
      0,
      width * 0.86,
      height * 0.18,
      maxRadius
    );
    ambient.addColorStop(0, rgba(glowPalette.accent, glowStrength * 0.2));
    ambient.addColorStop(1, rgba(glowPalette.accent, 0));
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawConnections = (theme, offsetX, offsetY) => {
    const maxDist = (isTouch || width <= 768) ? config.lineDistanceMobile : config.lineDistance;
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      for (let j = i + 1; j < particles.length; j += 1) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          const baseAlpha = theme === "dark" ? config.lineAlphaDark : config.lineAlphaLight;
          const alpha = (1 - dist / maxDist) * baseAlpha;
          ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(p.x + offsetX, p.y + offsetY);
          ctx.lineTo(q.x + offsetX, q.y + offsetY);
          ctx.stroke();
        }
      }
    }
  };

  const drawParticles = (theme, offsetX, offsetY) => {
    const colors = theme === "dark" ? palette.dark : palette.light;
    particles.forEach(p => {
      const wobble = Math.sin(p.phase) * config.wobble;
      const dx = p.x - pointerX;
      const dy = p.y - pointerY;
      const dist = Math.hypot(dx, dy);
    const influenceRadius = config.particleRepulseRadius;
    const lift = dist < influenceRadius ? (1 - dist / influenceRadius) : 0;
      const radiusBoost = 1 + lift * 0.9;
      const alphaBoost = config.particleAlphaBase + lift * config.particleAlphaBoost;
      ctx.beginPath();
      ctx.fillStyle = colors[p.colorIndex];
      ctx.globalAlpha = alphaBoost;
      ctx.arc(p.x + offsetX + wobble, p.y + offsetY, p.r * radiusBoost, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  };

  const draw = (time) => {
    ctx.clearRect(0, 0, width, height);
    const themeId = document.documentElement.getAttribute("data-theme") || "light";
    if (themeId !== activeThemeId) {
      activeThemeId = themeId;
      refreshGlowPalette();
    }
    const theme = themeId === "dark" ? "dark" : "light";
    const driftX = Math.sin(time * 0.00008) * 10 + scrollY * config.scrollDriftX;
    const driftY = Math.cos(time * 0.00007) * 10 + scrollY * config.scrollDriftY;
    const normX = (pointerX / width - 0.5) * 40;
    const normY = (pointerY / height - 0.5) * 40;
    const offsetX = normX * 0.02 + driftX;
    const offsetY = normY * 0.02 + driftY;
    drawGlow(themeId);
    drawConnections(theme, offsetX, offsetY);
    drawParticles(theme, offsetX, offsetY);
  };

  const update = (time) => {
    const delta = Math.min(48, time - (lastTime || time));
    lastTime = time;
    if (!prefersReduced) {
      particles.forEach(p => {
        const dx = p.x - pointerX;
        const dy = p.y - pointerY;
        const dist = Math.hypot(dx, dy);
        if (dist < config.particleRepulseRadius && dist > 0.001) {
          const push = (1 - dist / config.particleRepulseRadius) * config.particleRepulseStrength;
          p.x += (dx / dist) * push * (delta / 16);
          p.y += (dy / dist) * push * (delta / 16);
        }
        p.y += p.speed * (delta / 16);
        p.x += p.drift * (delta / 16);
        p.phase += 0.004 * (delta / 16);
        if (p.y - p.r > height) p.y = -p.r;
        if (p.x - p.r > width) p.x = -p.r;
        if (p.x + p.r < 0) p.x = width + p.r;
      });
    }
    pointerX += (targetX - pointerX) * 0.08;
    pointerY += (targetY - pointerY) * 0.08;
    draw(time);
    requestAnimationFrame(update);
  };

  const handleMove = (event) => {
    if (isTouch) return;
    targetX = event.clientX;
    targetY = event.clientY;
  };

  const handleScroll = () => {
    scrollY = window.scrollY || 0;
  };

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", handleMove, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
  });

  resize();
  handleScroll();
  update(0);
})();
