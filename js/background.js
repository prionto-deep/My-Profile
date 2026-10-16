/**
 * background.js — Antigravity Wave-Field Stipple Engine
 * ─────────────────────────────────────────────────────
 * 60fps HiDPI canvas with:
 *  • 1px micro-dots on a 14px grid
 *  • 2D trigonometric wave interference driving opacity & lift
 *  • Spring-damped cursor wake (lerp = 0.06)
 *  • Elliptical radial mask applied via CSS mask-image on the canvas
 */

export function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // ── Grid config ──────────────────────────────────────────
  const GRID_SPACING = 14;          // logical px between dots
  const DOT_RADIUS   = 0.7;         // crisp sub-pixel dot radius
  const ALPHA_MIN    = 0.02;
  const ALPHA_MAX    = 0.26;
  const LIFT_MAX     = 4;           // max upward float in px
  const FREQ         = 0.018;       // spatial wave frequency
  const DRIFT_SPEED  = 0.38;        // time drift multiplier for y-axis
  const CURSOR_RADIUS = 160;        // px — cursor influence radius
  const CURSOR_BOOST  = 0.28;       // extra alpha added at cursor center
  const LERP_STIFFNESS = 0.06;      // spring-damped interpolation factor

  // ── State ─────────────────────────────────────────────────
  let W = 0, H = 0;                 // canvas logical size
  let time = 0;
  let rafId = null;
  let dots = [];                    // { lx, ly } logical coords

  // Mouse tracking with lerp follower
  const mouse    = { x: -9999, y: -9999 };
  const follower = { x: -9999, y: -9999 };

  // ── Resize handler ─────────────────────────────────────────
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    buildDotGrid();
  }

  // ── Pre-compute dot positions ──────────────────────────────
  function buildDotGrid() {
    dots = [];
    const cols = Math.ceil(W / GRID_SPACING) + 1;
    const rows = Math.ceil(H / GRID_SPACING) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({ lx: c * GRID_SPACING, ly: r * GRID_SPACING });
      }
    }
  }

  // ── Wave interference formula ─────────────────────────────
  // Returns a value in [-1, 1]
  function wave(lx, ly, t) {
    return (
      Math.sin(lx * FREQ + t) *
      Math.cos(ly * FREQ - t * DRIFT_SPEED)
    );
  }

  // ── Cursor influence ──────────────────────────────────────
  // Returns 0..1 based on distance from cursor follower
  function cursorInfluence(lx, ly) {
    const dx = lx - follower.x;
    const dy = ly - follower.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > CURSOR_RADIUS) return 0;
    return Math.pow(1 - dist / CURSOR_RADIUS, 2);
  }

  // ── Render frame ──────────────────────────────────────────
  function render() {
    // Spring-damp follower toward actual mouse
    follower.x += (mouse.x - follower.x) * LERP_STIFFNESS;
    follower.y += (mouse.y - follower.y) * LERP_STIFFNESS;

    ctx.clearRect(0, 0, W, H);

    const dotCount = dots.length;
    for (let i = 0; i < dotCount; i++) {
      const { lx, ly } = dots[i];

      // Wave value [-1..1]
      const wv = wave(lx, ly, time);

      // Map to alpha [ALPHA_MIN..ALPHA_MAX]
      const baseAlpha = ALPHA_MIN + ((wv + 1) / 2) * (ALPHA_MAX - ALPHA_MIN);

      // Cursor wake adds luminance
      const boost = cursorInfluence(lx, ly) * CURSOR_BOOST;

      const alpha = Math.min(1, baseAlpha + boost);

      // Upward lift: positive wv = dot rises slightly
      const liftY = -(((wv + 1) / 2) * LIFT_MAX);

      ctx.beginPath();
      ctx.arc(lx, ly + liftY, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 200, 212, ${alpha.toFixed(3)})`;
      ctx.fill();
    }

    time += 0.004; // slow autonomous drift
    rafId = requestAnimationFrame(render);
  }

  // ── Event listeners ───────────────────────────────────────
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  // Fade out on touch devices — just don't track cursor
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    mouse.x = t.clientX;
    mouse.y = t.clientY;
  }, { passive: true });

  window.addEventListener('resize', () => {
    // Cancel current frame, resize, restart
    if (rafId) cancelAnimationFrame(rafId);
    ctx.resetTransform();
    resize();
    rafId = requestAnimationFrame(render);
  }, { passive: true });

  // ── Visibility API — pause when tab hidden ─────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      if (!rafId) rafId = requestAnimationFrame(render);
    }
  });

  // ── Init ──────────────────────────────────────────────────
  resize();
  rafId = requestAnimationFrame(render);
}
