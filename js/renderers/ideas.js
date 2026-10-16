/**
 * ideas.js — Idea Lab / Digital Garden renderer
 */

const STATUS_CSS = {
  'Concept':     'idea-status--concept',
  'Prototyping': 'idea-status--prototyping',
  'Shipped':     'idea-status--shipped',
};

const COMPLEXITY_LABEL = {
  'Low':       '● Low complexity',
  'Medium':    '●● Medium',
  'High':      '●●● High',
  'Very High': '●●●● Very High',
};

export function renderIdeas(profile) {
  const container = document.getElementById('ideas-grid');
  if (!container || !profile.ideas?.length) return;

  container.innerHTML = profile.ideas.map((idea, i) => `
    <article
      class="idea-card reveal-child"
      aria-label="${idea.title} — ${idea.status}"
      style="transition-delay: ${i * 60}ms"
    >
      <span class="idea-status-badge ${STATUS_CSS[idea.status] || 'idea-status--concept'}">
        ${idea.status}
      </span>

      <h3 class="idea-title">${idea.title}</h3>

      <p class="idea-desc">${idea.description}</p>

      <blockquote class="idea-inspiration">
        <span class="mono-label" style="display:block; margin-bottom:4px;">Inspiration</span>
        ${idea.inspiration}
      </blockquote>

      <div class="project-tags">
        ${idea.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
      </div>

      <div class="idea-meta">
        <span class="idea-complexity">
          ${COMPLEXITY_LABEL[idea.estimatedComplexity] || idea.estimatedComplexity}
        </span>
        ${idea.targetDate
          ? `<span class="idea-target">Target: ${idea.targetDate}</span>`
          : ''}
      </div>
    </article>
  `).join('');

  // Stagger IntersectionObserver reveal
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  container.querySelectorAll('.idea-card').forEach((el) => observer.observe(el));
}
