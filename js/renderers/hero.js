/**
 * hero.js — Hero & Identity section renderer
 */

// SVG icon paths for social bar
const SOCIAL_ICONS = {
  github: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  codeforces: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 7.5A1.5 1.5 0 013 6V3a1.5 1.5 0 013 0v3A1.5 1.5 0 014.5 7.5zM12 7.5A1.5 1.5 0 0110.5 6V3a1.5 1.5 0 013 0v3A1.5 1.5 0 0112 7.5zm7.5 13.5A1.5 1.5 0 0118 19.5V3a1.5 1.5 0 013 0v16.5a1.5 1.5 0 01-1.5 1.5zM4.5 21A1.5 1.5 0 013 19.5v-9A1.5 1.5 0 016 10.5v9A1.5 1.5 0 014.5 21zm7.5 0A1.5 1.5 0 0110.5 19.5v-6A1.5 1.5 0 0113.5 13.5v6A1.5 1.5 0 0112 21z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
};

// Fallback icon for unknown social types
const FALLBACK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20M2 12h20"/></svg>`;

/**
 * Normalizes a social URL so it is never treated as a relative path by the browser.
 * On Netlify, missing protocol causes relative path appending to the Netlify domain.
 */
function normalizeSocialUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

// ── Typing effect ─────────────────────────────────────────────
function initTypingEffect(taglines, { typingSpeed = 75, deletingSpeed = 40, pauseDelay = 2200 } = {}) {
  const el = document.getElementById('tagline-text');
  if (!el || !taglines.length) return;

  let index = 0;
  let charIndex = 0;
  let isDeleting = false;

  function tick() {
    const current = taglines[index];

    if (!isDeleting) {
      // Type
      el.textContent = current.slice(0, charIndex + 1);
      charIndex++;
      if (charIndex === current.length) {
        isDeleting = true;
        setTimeout(tick, pauseDelay);
        return;
      }
      setTimeout(tick, typingSpeed);
    } else {
      // Delete
      el.textContent = current.slice(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        isDeleting = false;
        index = (index + 1) % taglines.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, deletingSpeed);
    }
  }

  tick();
}

// ── Render hero ───────────────────────────────────────────────
export function renderHero(profile) {
  const { identity, social, skills, meta } = profile;

  // Avatar
  const avatarEl = document.getElementById('hero-avatar');
  if (avatarEl) {
    const img = document.createElement('img');
    img.src = identity.avatar;
    img.alt = identity.avatarAlt;
    img.width = 72;
    img.height = 72;
    img.onerror = () => {
      avatarEl.innerHTML = `<div class="identity-avatar-fallback">${identity.name.slice(0, 2).toUpperCase()}</div>`;
    };
    avatarEl.appendChild(img);
  }

  // Status badge
  const badgeEl = document.getElementById('hero-status-badge');
  if (badgeEl) {
    if (identity.statusBadge) {
      const { label, pulse } = identity.statusBadge;
      badgeEl.innerHTML = `
        <span class="status-dot ${pulse ? 'pulse' : ''}" aria-hidden="true"></span>
        <span class="status-label">${label}</span>
      `;
    } else {
      badgeEl.remove();
    }
  }

  // Name
  const nameEl = document.getElementById('hero-name');
  if (nameEl) nameEl.textContent = identity.name;

  // Bio
  const bioEl = document.getElementById('hero-bio');
  if (bioEl) {
    const bio = identity.bio;
    const highlight = identity.bioHighlight;
    if (highlight && bio.includes(highlight)) {
      bioEl.innerHTML = bio.replace(
        highlight,
        `<span class="bio-highlight">${highlight}</span>`
      );
    } else {
      bioEl.textContent = bio;
    }
  }

  // Actions (get in touch + view work)
  const actionsEl = document.getElementById('hero-actions');
  if (actionsEl) {
    actionsEl.innerHTML = `
      <button
        class="btn btn--primary"
        id="hero-contact-btn"
        aria-label="Go to contact section"
      >
        <span class="btn-label">Get in Touch</span>
        <svg class="btn-icon" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <path d="M7 1L3 6.5h3L4 11l6-6H7V1z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="currentColor" fill-opacity="0.25"/>
        </svg>
      </button>
      <a href="#projects" class="btn btn--ghost" aria-label="View projects">
        <span class="btn-label">View Work</span>
        <svg class="btn-icon" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <path d="M2 6.5h9M6.5 2l4.5 4.5L6.5 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    `;

    // Hero "Get in Touch" → smooth scroll to #contact
    document.getElementById('hero-contact-btn')?.addEventListener('click', () => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Nav "Hire Me" → smooth scroll to #contact
    document.getElementById('nav-hire-btn')?.addEventListener('click', () => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Social bar
  const socialEl = document.getElementById('social-bar');
  if (socialEl && social?.length) {
    socialEl.innerHTML = social.map((s) => {
      const href = normalizeSocialUrl(s.url);
      const isEmail = s.id === 'email' || href.startsWith('mailto:');
      const iconMarkup = SOCIAL_ICONS[s.icon] || FALLBACK_ICON;
      return `
      <a
        href="${href}"
        class="social-link"
        id="social-${s.id}"
        target="${isEmail ? '_self' : '_blank'}"
        rel="${isEmail ? '' : 'noopener noreferrer'}"
        title="${s.title || s.label}"
        aria-label="${s.label}"
      >
        <span class="social-icon" aria-hidden="true">
          ${iconMarkup}
        </span>
        <span class="social-link-label">${s.label}</span>
        <span class="social-link-arrow" aria-hidden="true">↗</span>
      </a>
    `;
    }).join('');
  }

  // Skills
  const skillsEl = document.getElementById('skills-grid');
  if (skillsEl && skills?.length) {
    skillsEl.innerHTML = skills.map((cat) => `
      <div class="skill-category">
        <span class="skill-category-label">${cat.category}</span>
        <div class="skill-tags">
          ${cat.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  // Start typing effect
  initTypingEffect(
    identity.taglines,
    {
      typingSpeed: identity.typingSpeed,
      deletingSpeed: identity.deletingSpeed,
      pauseDelay: identity.pauseDelay,
    }
  );
}
