/**
 * map.js — Leaflet.js location card + UTC+6 local time display
 */

let clockInterval = null;

// ── Format time in a given UTC offset ────────────────────────
function formatLocalTime(utcOffsetString) {
  // Parse "+06:00" → 360 minutes
  const sign   = utcOffsetString[0] === '-' ? -1 : 1;
  const parts  = utcOffsetString.slice(1).split(':');
  const offset = sign * (parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10));

  const now     = new Date();
  const utcMs   = now.getTime() + now.getTimezoneOffset() * 60_000;
  const local   = new Date(utcMs + offset * 60_000);

  return local.toLocaleTimeString('en-GB', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function renderMap(profile) {
  const { location } = profile;
  if (!location) return;

  const mapEl = document.getElementById('location-map');
  const metaEl = document.getElementById('location-meta');
  if (!mapEl) return;

  // ── Init Leaflet map ──────────────────────────────────────
  if (typeof L === 'undefined') {
    mapEl.innerHTML = '<div class="project-thumb-fallback">Map unavailable (Leaflet not loaded)</div>';
    return;
  }

  const map = L.map(mapEl, {
    center:          [location.coordinates.lat, location.coordinates.lng],
    zoom:            location.mapZoom,
    zoomControl:     false,
    scrollWheelZoom: false,
    attributionControl: true,
    keyboard:        true,
  });

  // OpenStreetMap tiles — no API key required
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  // Custom pulsing marker
  const pulseIcon = L.divIcon({
    className: '',
    html: `
      <div class="map-pulse-marker" aria-hidden="true">
        <div class="map-pulse-dot"></div>
        <div class="map-pulse-ring"></div>
      </div>
    `,
    iconSize:   [28, 28],
    iconAnchor: [14, 14],
  });

  L.marker(
    [location.coordinates.lat, location.coordinates.lng],
    { icon: pulseIcon, alt: location.pinLabel }
  )
    .addTo(map)
    .bindPopup(`<strong>${location.city}</strong><br>${location.description}`, {
      maxWidth: 220,
      className: 'leaflet-popup-custom',
    });

  // Zoom control on bottom-right
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // ── Location meta & live clock ────────────────────────────
  if (metaEl) {
    metaEl.innerHTML = `
      <div class="location-city">${location.city}, ${location.country}</div>
      <div class="location-time-row">
        <span class="location-time" id="location-clock" aria-live="off" aria-label="Local time in ${location.city}">
          ${formatLocalTime(location.utcOffset)}
        </span>
        <span class="location-tz">${location.utcLabel}</span>
      </div>
      <p class="location-desc">${location.description}</p>
    `;

    // Update clock every second
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(() => {
      const clockEl = document.getElementById('location-clock');
      if (clockEl) clockEl.textContent = formatLocalTime(location.utcOffset);
    }, 1000);
  }
}
