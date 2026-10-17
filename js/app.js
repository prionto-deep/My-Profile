/**
 * app.js — Main entry point
 * ─────────────────────────────────────────────────────────────
 * 1. Fetches /data/profile.json
 * 2. Initialises the background stipple engine
 * 3. Orchestrates all section renderers
 * 4. Wires up global scroll interactions:
 *      • IntersectionObserver for section reveal
 *      • Active nav-link tracking
 *      • Architectural grid crosshair injection
 *      • Nav scroll-shadow
 */

import { initBackground }  from './background.js';
import { renderHero }      from './renderers/hero.js';
import { renderStats }     from './renderers/stats.js';
import { renderProjects }  from './renderers/projects.js';
import { renderIdeas }     from './renderers/ideas.js';
import { renderTimeline }  from './renderers/timeline.js';
import { renderMap }       from './renderers/map.js';
import { renderContact }   from './renderers/contact.js';

// ── Fetch profile.json ─────────────────────────────────────────
async function loadProfile() {
  const res = await fetch('/data/profile.json');
  if (!res.ok) throw new Error(`Failed to load profile.json: ${res.status}`);
  return res.json();
}

// ── Inject architectural grid crosshairs ───────────────────────
function injectCrosshairs() {
  const overlay = document.querySelector('.grid-overlay');
  if (!overlay) return;

  // Place crosshairs at column-intersection points along certain rows
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;

  // 3 x-positions (column boundaries at ~25%, 50%, 75%)
  const xPositions = [0.25, 0.5, 0.75].map((f) => f * viewW);
  // 4 y-positions
  const yPositions = [0, 0.3, 0.65, 1].map((f) => f * viewH);

  // Remove old crosshairs
  overlay.querySelectorAll('.grid-crosshair').forEach((el) => el.remove());

  xPositions.forEach((x) => {
    yPositions.forEach((y) => {
      const el = document.createElement('div');
      el.className = 'grid-crosshair';
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      overlay.appendChild(el);
    });
  });
}

// ── Scroll reveal via IntersectionObserver ─────────────────────
function initScrollReveal() {
  const sections = document.querySelectorAll('.reveal-section');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  sections.forEach((section) => observer.observe(section));
}

// ── Active nav link tracking ───────────────────────────────────
function initNavTracking() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const nav = document.querySelector('.site-nav');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.section === id);
          });
        }
      });
    },
    { threshold: 0.3, rootMargin: `-${64}px 0px 0px 0px` }
  );

  sections.forEach((s) => observer.observe(s));

  // Nav scroll shadow
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 24);
  }, { passive: true });
}

// ── Render footer ──────────────────────────────────────────────
function renderFooter(profile) {
  const el = document.getElementById('site-footer');
  if (!el || !profile.footer) return;

  const { copyright, builtWith, sourceLabel, sourceUrl } = profile.footer;
  el.innerHTML = `
    <span class="footer-copy">${copyright}</span>
    <span class="footer-built">
      Built with ${builtWith} ·
      <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
         class="footer-source-link" aria-label="View portfolio source code on GitHub">
        ${sourceLabel}
      </a>
    </span>
  `;
}

// ── Apply SEO meta from profile.json ──────────────────────────
function applySEOMeta(meta) {
  if (!meta) return;
  if (meta.siteTitle) document.title = meta.siteTitle;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && meta.description) desc.content = meta.description;
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && meta.siteTitle) ogTitle.content = meta.siteTitle;
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && meta.description) ogDesc.content = meta.description;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && meta.canonicalUrl) canonical.href = meta.canonicalUrl;
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon && meta.favicon) {
    favicon.href = meta.favicon;
    favicon.type = 'image/svg+xml';
  }
}

// ── Boot ───────────────────────────────────────────────────────
async function boot() {
  // 1. Start background canvas immediately (no data dependency)
  initBackground();
  injectCrosshairs();
  window.addEventListener('resize', injectCrosshairs, { passive: true });

  // 2. Load profile data
  let profile;
  try {
    profile = await loadProfile();
  } catch (err) {
    console.error('[app.js] Could not load profile.json:', err);
    document.body.insertAdjacentHTML('afterbegin', `
      <div style="position:fixed;top:70px;left:50%;transform:translateX(-50%);
                  background:rgba(220,80,80,0.1);border:1px solid rgba(220,80,80,0.3);
                  color:#DC5050;padding:12px 20px;border-radius:8px;z-index:999;
                  font-family:monospace;font-size:0.8rem;">
        Failed to load profile.json — check the browser console.
      </div>
    `);
    return;
  }

  // 3. Apply SEO meta
  applySEOMeta(profile.meta);

  // 4. Render all sections synchronously (except stats which is async)
  renderHero(profile);
  renderProjects(profile);
  renderIdeas(profile);
  renderTimeline(profile);
  renderMap(profile);
  renderContact(profile);
  renderFooter(profile);

  // 5. Stats are async — skeleton shown immediately inside renderStats
  renderStats(profile); // intentionally not awaited

  // 6. Wire scroll interactions
  initScrollReveal();
  initNavTracking();
}

// Kick off on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
