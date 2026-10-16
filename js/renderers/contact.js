/**
 * contact.js — Netlify Forms contact section renderer
 */

export function renderContact(profile) {
  const { contact } = profile;
  if (!contact) return;

  // Heading + subheading
  const headingEl = document.getElementById('contact-heading');
  if (headingEl) headingEl.textContent = contact.heading;

  const subEl = document.getElementById('contact-subheading');
  if (subEl) subEl.textContent = contact.subheading;

  // Dynamically render form fields from JSON
  const fieldsContainer = document.getElementById('contact-fields');
  if (fieldsContainer) {
    fieldsContainer.innerHTML = contact.fields.map((field) => {
      const requiredAttr = field.required ? 'required' : '';
      const labelClass   = field.required ? 'form-label required' : 'form-label';

      if (field.type === 'textarea') {
        return `
          <div class="form-field">
            <label class="${labelClass}" for="field-${field.name}">${field.label}</label>
            <textarea
              id="field-${field.name}"
              name="${field.name}"
              class="form-textarea"
              placeholder="${field.placeholder}"
              ${requiredAttr}
              aria-required="${field.required}"
              rows="4"
            ></textarea>
          </div>
        `;
      }

      return `
        <div class="form-field">
          <label class="${labelClass}" for="field-${field.name}">${field.label}</label>
          <input
            id="field-${field.name}"
            name="${field.name}"
            type="${field.type}"
            class="form-input"
            placeholder="${field.placeholder}"
            ${requiredAttr}
            aria-required="${field.required}"
            autocomplete="${field.type === 'email' ? 'email' : field.name === 'name' ? 'name' : 'off'}"
          />
        </div>
      `;
    }).join('');
  }

  // Update submit label from JSON
  const submitBtn = document.getElementById('contact-submit');
  if (submitBtn) {
    submitBtn.querySelector('.btn-label').textContent = contact.submitLabel;
  }

  // ── Progressive enhancement form submission ───────────────
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-status');

  if (!form || !statusEl) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic client-side validation
    let valid = true;
    form.querySelectorAll('[required]').forEach((input) => {
      input.classList.remove('error');
      if (!input.value.trim()) {
        input.classList.add('error');
        valid = false;
      }
    });

    if (!valid) {
      statusEl.className = 'contact-status error';
      statusEl.textContent = 'Please fill in all required fields.';
      return;
    }

    // Disable submit during request
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-label').textContent = 'Sending…';
    }

    statusEl.className = 'contact-status';
    statusEl.textContent = '';

    try {
      const formData = new FormData(form);
      const res = await fetch('/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams(formData).toString(),
      });

      if (res.ok) {
        statusEl.className = 'contact-status success';
        statusEl.textContent = contact.successMessage;
        form.reset();
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      statusEl.className = 'contact-status error';
      statusEl.textContent = contact.errorMessage;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-label').textContent = contact.submitLabel;
      }
    }
  });
}
