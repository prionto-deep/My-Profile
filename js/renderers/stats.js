/**
 * stats.js — Live Coding & Engineering Stats renderer
 * Renders skeleton loaders immediately, then replaces with
 * live data from api.js (GitHub + Codeforces).
 */

import { fetchGitHubStats, fetchCodeforcesStats, cfRankClass } from '../api.js';

// ── Skeleton placeholder cards ────────────────────────────────
function renderSkeletons(container, count = 6) {
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="stat-card skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-text-sm"></div>
      <div class="skeleton skeleton-text-lg"></div>
      <div class="skeleton skeleton-text-xs"></div>
    </div>
  `).join('');
}

// ── Format large numbers ──────────────────────────────────────
function fmt(n) {
  if (n === '—' || n === null || n === undefined) return '—';
  const num = parseInt(n, 10);
  if (isNaN(num)) return String(n);
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
}

// ── Delta badge HTML ──────────────────────────────────────────
function deltaBadge(delta) {
  if (!delta && delta !== 0) return '';
  const sign = delta > 0 ? '+' : '';
  const color = delta > 0 ? 'var(--status-active)' : delta < 0 ? '#DC5050' : 'var(--text-tertiary)';
  return `<span style="color:${color}; font-size:0.72rem; font-family:var(--font-mono);">${sign}${delta}</span>`;
}

// ── Render GitHub cards ───────────────────────────────────────
function renderGitHubCards(gh) {
  const badge = gh.isFallback
    ? `<span class="api-live-badge api-fallback-badge">Offline</span>`
    : `<span class="api-live-badge">${gh.fromCache ? 'Cached' : 'Live'}</span>`;

  return `
    <div class="stat-card reveal-child" aria-label="GitHub public repositories">
      <div class="card-specular"></div>
      ${badge}
      <div class="stat-platform">GitHub</div>
      <div class="stat-value">${fmt(gh.publicRepos)}</div>
      <div class="stat-label">Public Repos</div>
      <div class="stat-sublabel">@${gh.username}</div>
    </div>

    <div class="stat-card reveal-child" aria-label="GitHub total stars">
      <div class="card-specular"></div>
      ${badge}
      <div class="stat-platform">GitHub</div>
      <div class="stat-value">${fmt(gh.totalStars)}</div>
      <div class="stat-label">Total Stars</div>
      <div class="stat-sublabel">${gh.followers !== '—' ? `${fmt(gh.followers)} followers` : ''}</div>
    </div>

    <div class="stat-card reveal-child" aria-label="Top languages on GitHub">
      <div class="card-specular"></div>
      ${badge}
      <div class="stat-platform">GitHub — Top Languages</div>
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:12px;">
        ${gh.topLanguages.map((l) => `<span class="tag">${l}</span>`).join('')}
      </div>
    </div>
  `;
}

// ── Render Codeforces cards ───────────────────────────────────
function renderCodeforcesCards(cf) {
  const badge = cf.isFallback
    ? `<span class="api-live-badge api-fallback-badge">Offline</span>`
    : `<span class="api-live-badge">${cf.fromCache ? 'Cached' : 'Live'}</span>`;

  const ratingClass = cfRankClass(cf.rating);
  const maxClass    = cfRankClass(cf.maxRating);

  // Recent contests mini-list
  const contestsHTML = cf.recentContests.length
    ? `<div style="margin-top:10px; display:flex; flex-direction:column; gap:5px;">
        ${cf.recentContests.slice(0, 3).map((c) => `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <span style="font-size:0.72rem; color:var(--text-tertiary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${c.contestName}</span>
            <div style="display:flex; gap:6px; align-items:center; flex-shrink:0;">
              <span style="font-size:0.7rem; font-family:var(--font-mono); color:var(--text-secondary);">#${c.rank}</span>
              ${deltaBadge(c.delta)}
            </div>
          </div>
        `).join('')}
       </div>`
    : '';

  return `
    <div class="stat-card reveal-child" aria-label="Codeforces current rating">
      <div class="card-specular"></div>
      ${badge}
      <div class="stat-platform">Codeforces</div>
      <div class="stat-value ${ratingClass}">${cf.rating}</div>
      <div class="stat-label">${cf.rankLabel}</div>
      <div class="stat-sublabel">Max: <span class="${maxClass}">${cf.maxRating}</span> (${cf.maxRankLabel})</div>
    </div>

    <div class="stat-card reveal-child" aria-label="Problems solved on Codeforces">
      <div class="card-specular"></div>
      ${badge}
      <div class="stat-platform">Codeforces</div>
      <div class="stat-value">${fmt(cf.solvedCount)}</div>
      <div class="stat-label">Problems Solved</div>
      <div class="stat-sublabel">@${cf.handle}</div>
    </div>

    <div class="stat-card reveal-child" aria-label="Recent Codeforces contests">
      <div class="card-specular"></div>
      ${badge}
      <div class="stat-platform">Codeforces — Recent Contests</div>
      ${cf.recentContests.length
        ? contestsHTML
        : `<div class="stat-sublabel" style="margin-top:12px;">No recent contest data</div>`
      }
    </div>
  `;
}

// ── Main export ───────────────────────────────────────────────
export async function renderStats(profile) {
  const container = document.getElementById('stats-grid');
  if (!container) return;

  const { github, codeforces } = profile;

  // Show skeletons immediately
  renderSkeletons(container, 6);

  // Fetch both APIs in parallel
  const [ghStats, cfStats] = await Promise.all([
    fetchGitHubStats(github.username),
    fetchCodeforcesStats(codeforces.handle),
  ]);

  // Inject real cards
  container.innerHTML =
    renderGitHubCards(ghStats) +
    renderCodeforcesCards(cfStats);

  // Stagger reveal animations
  container.querySelectorAll('.reveal-child').forEach((el, i) => {
    setTimeout(() => el.classList.add('revealed'), i * 80);
  });
}
