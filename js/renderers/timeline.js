/**
 * timeline.js — Education & Journey vertical timeline renderer
 */

// SVG icons for each timeline node type
const TYPE_ICONS = {
  education: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M2 6l6-4 6 4-6 4-6-4z"/><path d="M14 8.5V12M5 10v2.5c0 1 1.3 1.5 3 1.5s3-.5 3-1.5V10"/></svg>`,
  achievement:`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-.5L8 2z"/></svg>`,
  milestone:  `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2.5M8 12.5V15M1 8h2.5M12.5 8H15"/></svg>`,
};

export function renderTimeline(profile) {
  const container = document.getElementById('timeline-container');
  if (!container || !profile.timeline?.length) return;

  container.innerHTML = profile.timeline.map((item, idx) => {
    const icon = TYPE_ICONS[item.type] || TYPE_ICONS.milestone;
    const currentBadge = item.current
      ? `<span class="timeline-current-badge" aria-label="Currently active">● Now</span>`
      : '';

    return `
      <div
        class="timeline-item ${item.current ? 'timeline-current' : ''} reveal-child"
        role="listitem"
        tabindex="0"
        aria-label="${item.year} — ${item.title}"
        style="transition-delay: ${idx * 80}ms"
      >
        <!-- Node dot -->
        <div class="timeline-node" aria-hidden="true">${icon}</div>

        <!-- Year label -->
        <div class="timeline-year">${item.year}</div>

        <!-- Title row -->
        <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:4px;">
          <h3 class="timeline-title">${item.title}</h3>
          ${currentBadge}
        </div>

        <!-- Institution & location -->
        <div class="timeline-institution">
          ${item.institution}
          <span style="color:var(--text-tertiary);"> · ${item.location}</span>
        </div>

        <!-- Description (shows on hover/focus) -->
        <p class="timeline-desc">${item.description}</p>

        <!-- Tags -->
        <div class="timeline-tags">
          ${item.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');

  // IntersectionObserver stagger reveal
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  container.querySelectorAll('.timeline-item').forEach((el) => observer.observe(el));
}
