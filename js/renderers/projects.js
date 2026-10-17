/**
 * projects.js — Filterable project cards + modal system
 */

// ── Status CSS class map ──────────────────────────────────────
const STATUS_CLASS = {
  'Shipped':     'project-status--shipped',
  'Prototyping': 'project-status--prototyping',
  'Concept':     'project-status--concept',
};

// ── Build a single project card ───────────────────────────────
function projectCardHTML(project) {
  const { id, title, category, tags, description, thumbnail,
          thumbnailAlt, status, year, links } = project;

  const thumbHTML = thumbnail
    ? `<img src="${thumbnail}" alt="${thumbnailAlt}" loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=&quot;project-thumb-fallback&quot;>[${category}]</div>'">`
    : `<div class="project-thumb-fallback">[${category}]</div>`;

  return `
    <article
      class="project-card reveal-child"
      role="listitem"
      data-project-id="${id}"
      data-category="${category}"
      data-hidden="false"
      tabindex="0"
      aria-label="${title} — ${category}"
    >
      <div class="project-thumb">${thumbHTML}</div>
      <span class="project-status ${STATUS_CLASS[status] || 'project-status--shipped'}" aria-label="Status: ${status}">
        ${status}
      </span>
      <div class="project-body">
        <span class="project-category-label">${category} · ${year}</span>
        <h3 class="project-title">${title}</h3>
        <p class="project-desc">${description}</p>
        <div class="project-tags">
          ${tags.slice(0, 4).map((t) => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    </article>
  `;
}

// ── Modal ─────────────────────────────────────────────────────
let currentProject = null;

function openModal(project) {
  currentProject = project;
  const overlay = document.getElementById('project-modal');
  const content = document.getElementById('modal-content');
  if (!overlay || !content) return;

  const { title, category, tags, description, thumbnail,
          thumbnailAlt, status, year, links, highlights } = project;

  const linksHTML = Object.entries(links || {})
    .filter(([, url]) => url)
    .map(([type, url]) => {
      const labels = { live: 'Live Site', github: 'GitHub', demo: 'Demo Video' };
      return `<a href="${url}" target="_blank" rel="noopener noreferrer"
                 class="btn btn--ghost" aria-label="${labels[type] || type} for ${title}">
                ${labels[type] || type}
                <svg class="btn-icon" width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                  <path d="M2 9L9 2M9 2H4M9 2v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
              </a>`;
    }).join('');

  const highlightsHTML = highlights?.length
    ? `<div class="modal-highlights">
         <span class="modal-highlights-label">Highlights</span>
         ${highlights.map((h) => `<div class="modal-highlight-item">${h}</div>`).join('')}
       </div>`
    : '';

  content.innerHTML = `
    <div class="modal-thumb">
      ${thumbnail
        ? `<img src="${thumbnail}" alt="${thumbnailAlt}" loading="lazy">`
        : `<div class="project-thumb-fallback">[${category}]</div>`
      }
    </div>
    <div class="modal-meta-row">
      <h2 class="modal-title">${title}</h2>
      <span class="project-status ${STATUS_CLASS[status] || ''}">${status}</span>
    </div>
    <p class="mono-label">${category} · ${year}</p>
    <p class="modal-desc">${description}</p>
    ${highlightsHTML}
    <div class="project-tags">${tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
    ${linksHTML ? `<div class="modal-links">${linksHTML}</div>` : ''}
  `;

  overlay.hidden = false;
  overlay.removeAttribute('hidden');
  // Trigger CSS transition
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-close')?.focus();
}

function closeModal() {
  const overlay = document.getElementById('project-modal');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.hidden = true;
  document.body.style.overflow = '';
  currentProject = null;
}

// ── Filter logic ──────────────────────────────────────────────
function applyFilter(categoryId) {
  document.querySelectorAll('.project-card').forEach((card) => {
    const cat = card.dataset.category;
    const hidden = categoryId !== 'all' && cat !== categoryId;
    card.dataset.hidden = hidden ? 'true' : 'false';
  });

  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.category === categoryId);
    btn.setAttribute('aria-pressed', btn.dataset.category === categoryId ? 'true' : 'false');
  });
}

// ── Main export ───────────────────────────────────────────────
export function renderProjects(profile) {
  const { projects, projectCategories } = profile;

  // Filter bar
  const filterBar = document.getElementById('project-filter-bar');
  if (filterBar && projectCategories?.length) {
    filterBar.innerHTML = projectCategories.map((cat) => `
      <button
        class="filter-btn ${cat.id === 'all' ? 'active' : ''}"
        data-category="${cat.id}"
        aria-pressed="${cat.id === 'all' ? 'true' : 'false'}"
      >${cat.label}</button>
    `).join('');

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      applyFilter(btn.dataset.category);
    });
  }

  // Project grid
  const grid = document.getElementById('projects-grid');
  if (!grid || !projects?.length) return;

  grid.innerHTML = projects.map(projectCardHTML).join('');

  // Stagger reveal
  grid.querySelectorAll('.reveal-child').forEach((el, i) => {
    setTimeout(() => el.classList.add('revealed'), i * 60);
  });

  // Click to open modal (cards + keyboard Enter/Space)
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;
    const project = projects.find((p) => p.id === card.dataset.projectId);
    if (project) openModal(project);
  });

  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.project-card');
    if (!card) return;
    e.preventDefault();
    const project = projects.find((p) => p.id === card.dataset.projectId);
    if (project) openModal(project);
  });

  // Modal close button
  document.getElementById('modal-close')?.addEventListener('click', closeModal);

  // Click overlay background to close
  document.getElementById('project-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'project-modal') closeModal();
  });

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentProject) closeModal();
  });
}
