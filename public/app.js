// PT Ambara Artha Globaltrans — Shared JS v2.4

// Language Management
const LangManager = {
  current: localStorage.getItem('ambara_lang') || 'en',

  init() {
    const path = window.location.pathname;
    if (path.startsWith('/id/') || path === '/id') this.current = 'id';
    else if (path.startsWith('/en/') || path === '/en') this.current = 'en';
    this.updateToggle();
  },

  switch(lang) {
    if (lang === this.current) return;
    localStorage.setItem('ambara_lang', lang);
    const path = window.location.pathname;
    const newPath = path.replace(/^\/(en|id)/, '/' + lang);
    window.location.href = newPath;
  },

  updateToggle() {
    document.querySelectorAll('.lang-toggle button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.current);
    });
  }
};

// Navbar scroll effect
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 50
      ? 'rgba(11,14,20,0.98)'
      : 'rgba(11,14,20,0.85)';
  });
}

// Mobile menu
function initMobileMenu() {
  const nav = document.querySelector('.mobile-nav');
  if (!nav) return;

  // Detach and append to body to avoid backdrop-filter containing block issues from navbar
  if (nav.parentElement) nav.parentElement.removeChild(nav);
  document.body.appendChild(nav);

  document.querySelectorAll('.mobile-menu-btn').forEach(b => b.addEventListener('click', () => {
    const isOpen = nav.classList.contains('open');
    if (isOpen) {
      nav.classList.remove('open');
      document.body.classList.remove('menu-open');
      setTimeout(() => nav.style.display = 'none', 300);
    } else {
      nav.style.display = 'flex';
      nav.offsetHeight; // trigger reflow
      nav.classList.add('open');
      document.body.classList.add('menu-open');
    }
  }));
}

// Desktop dropdowns
function initNavDropdowns() {
  document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', event => {
      event.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(isOpen));
      document.querySelectorAll('.nav-dropdown.open').forEach(other => {
        if (other === dropdown) return;
        other.classList.remove('open');
        other.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
      });
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
      dropdown.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
      dropdown.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    });
  });
}

// Toast notifications
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Format date
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// Format number with commas
function formatNumber(num) {
  return Number(num).toLocaleString();
}

// Active nav link
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.navbar-links a').forEach(a => {
    a.classList.toggle('active', path.includes(a.getAttribute('href')));
  });
}

// Homepage stats remark
function initStatsRemark() {
  const statsGrid = document.querySelector('.grid-4');
  if (!statsGrid || document.querySelector('.stats-remark')) return;

  const remark = createEl('div', {
    className: 'stats-remark animate-on-scroll',
    text: 'Based on 2026 monthly average performance dataset.',
    styles: {
      marginTop: '28px',
      textAlign: 'center',
      fontSize: '0.8125rem',
      color: 'var(--text-muted)'
    }
  });

  statsGrid.insertAdjacentElement('afterend', remark);
}

const AmbaraIcons = {
  aircraftCargo: '<path d="M3 13.5 21 6l-3 12-6-4-5 5 2-7-6-1.5z"/><path d="m12 14 6-8"/>',
  customsDocument: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M8 13h5"/><path d="M8 17h8"/><path d="M15 11.5h5"/><path d="M17.5 9v5"/>',
  documentStack: '<path d="M7 3h9l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M15 3v5h5"/><path d="M3 7v13a2 2 0 0 0 2 2h11"/><path d="M9 13h7"/><path d="M9 17h5"/>',
  documentSearch: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h6"/><path d="M14 2v6h6"/><circle cx="15.5" cy="15.5" r="3.5"/><path d="m18 18 3 3"/><path d="M8 11h5"/>',
  importerId: '<path d="M3 21h18"/><path d="M5 21V7h8v14"/><path d="M13 11h6v10"/><path d="M8 10h2"/><path d="M8 14h2"/><path d="M16 14h1"/><path d="M16 17h1"/><path d="M7 4h5"/>',
  deliveryRoute: '<path d="M3 7h11v10H3z"/><path d="M14 11h4l3 3v3h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M5 4h8"/><path d="M19 5c1.5 1.5 1.5 3.5 0 5"/>',
  truckRoute: '<path d="M2 7h12v9H2z"/><path d="M14 10h4l4 4v2h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M4 4h6"/><path d="M18 4h3v3"/>',
  airportCargo: '<path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-7h6v7"/><path d="m3 12 18-4"/><path d="M8 11v-1"/><path d="M12 10v-1"/><path d="M16 9v-1"/>',
  warehouseCargo: '<path d="M3 21h18"/><path d="M4 21V9l8-5 8 5v12"/><path d="M7 21v-7h10v7"/><path d="M9 17h6"/><path d="M9 14h6"/><path d="M6 11h12"/>',
  shieldPackage: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-5"/><path d="M8 7h8"/>',
  sourcing: '<path d="M3 21V9l6-4 6 4v12"/><path d="M15 13h6v8"/><path d="M7 21v-6h4v6"/><path d="M16.5 16h3"/><path d="M4 12h10"/>',
  globalAgent: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/><path d="M18 18l3 3"/>',
  importBox: '<path d="M4 8h16v11H4z"/><path d="m12 3 4 4-4 4"/><path d="M4 7h12"/><path d="M8 12h8"/>',
  exportBox: '<path d="M4 8h16v11H4z"/><path d="m12 3-4 4 4 4"/><path d="M8 7h12"/><path d="M8 12h8"/>',
  parcelsCourier: '<path d="M4 8h7v7H4z"/><path d="M13 5h7v7h-7z"/><path d="M12 14h8v6h-8z"/><path d="M5 18h4"/><path d="M3 21h18"/>',
  complianceWarning: '<path d="M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M6 21h12"/>',
  questionDocument: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M10 11a2 2 0 1 1 3.2 1.6c-.8.5-1.2.9-1.2 1.9"/><path d="M12 18h.01"/>',
  documentAlert: '<path d="M5 3h9l5 5v13H5z"/><path d="M14 3v5h5"/><path d="M8 12h5"/><path d="M8 16h4"/><path d="M17 13v4"/><path d="M17 20h.01"/>',
  airportClock: '<path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v5"/><path d="M9 21v-7h4"/><circle cx="18" cy="18" r="4"/><path d="M18 16v2l1.5 1"/>',
  cargoChat: '<path d="M4 6h10v8H4z"/><path d="M14 9h3l3 3v2h-6z"/><circle cx="7" cy="16" r="1.5"/><circle cx="17" cy="16" r="1.5"/><path d="M6 20h9l4 2v-5"/>',
  routeReview: '<path d="M4 18c4-8 12 0 16-8"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="10" r="2"/><path d="M8 6h8"/><path d="M12 3v6"/>'
};

function initAmbaraIcons() {
  document.querySelectorAll('[data-ambara-icon]').forEach(icon => {
    const name = icon.getAttribute('data-ambara-icon');
    if (!AmbaraIcons[name] || icon.querySelector('svg')) return;
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${AmbaraIcons[name]}</svg>`;
  });
}

// Animate on scroll
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    observer.observe(el);
  });
}

// Google Analytics 4
(function () {
  var measurementId = "G-S3FQR046ZC";

  if (!measurementId || window.__ambaraGa4Loaded) return;
  window.__ambaraGa4Loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId);
})();

// WhatsApp CTA analytics
function getWhatsAppServiceCategory() {
  const bodyCategory = document.body && document.body.getAttribute('data-service-category');
  if (bodyCategory) return bodyCategory;

  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const slug = path
    .replace(/^\/(en|id)\//, '')
    .replace(/^\//, '')
    .replace(/\.html$/, '');

  const categories = {
    '': 'homepage',
    'en': 'homepage',
    'id': 'homepage',
    index: 'homepage',
    'freight-forwarding-indonesia': 'freight_forwarding',
    'air-freight-forwarder-indonesia': 'air_freight_forwarder',
    'indonesia-freight-forwarder-for-overseas-agents': 'overseas_agents',
    'air-freight-to-indonesia': 'air_import',
    'air-freight-from-indonesia': 'air_export',
    'cgk-air-cargo-agent': 'cgk_air_cargo',
    'dukungan-kargo-udara-cgk': 'cgk_air_cargo',
    'indonesia-customs-clearance': 'customs_clearance',
    'regulated-cargo-clearance-indonesia': 'customs_clearance',
    'bpom-import-clearance-indonesia': 'customs_clearance',
    'undername-import-indonesia': 'undername_import',
    'undername-import-service-indonesia': 'undername_import',
    'dukungan-import-undername-indonesia': 'undername_import',
    'ddp-shipping-indonesia': 'ddp_shipping',
    'ddp-shipping-to-indonesia': 'ddp_shipping',
    'pengiriman-ddp-indonesia': 'ddp_shipping',
    'document-preparation': 'document_preparation',
    network: 'network',
    services: 'services'
  };

  return categories[slug] || 'general';
}

function getWhatsAppCtaText(link) {
  const visibleText = (link.textContent || '').replace(/\s+/g, ' ').trim();
  return visibleText || link.getAttribute('aria-label') || 'WhatsApp';
}

function getWhatsAppLinkCategory(link) {
  const linkCategory = link.getAttribute('data-service-category');
  const pageCategory = getWhatsAppServiceCategory();
  if (linkCategory && linkCategory !== 'general') return linkCategory;
  return pageCategory || linkCategory || 'general';
}

function trackWhatsAppClick(link) {
  const payload = {
    page_path: window.location.pathname,
    page_title: document.title,
    cta_location: link.getAttribute('data-cta-location') || 'unknown',
    service_category: getWhatsAppLinkCategory(link),
    cta_text: getWhatsAppCtaText(link),
    destination_url: link.href
  };

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'whatsapp_click', payload);
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'whatsapp_click',
    ...payload
  });
}

function bindWhatsAppTracking(root = document) {
  root.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="whatsapp"]').forEach(link => {
    if (link.dataset.whatsappTracked === 'true') return;
    link.dataset.whatsappTracked = 'true';
    link.addEventListener('click', () => trackWhatsAppClick(link));
  });
}

window.trackWhatsAppClick = trackWhatsAppClick;
window.bindWhatsAppTracking = bindWhatsAppTracking;

// Tracking form submit
async function trackShipment(id) {
  const result = document.getElementById('tracking-result');
  if (!result) return;
  result.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)"><div style="width:32px;height:32px;border:3px solid var(--blue);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px"></div>Tracking shipment...</div>`;

  try {
    const res = await fetch(`/api/track-shipment?id=${encodeURIComponent(id)}`);
    const data = await readTrackingResponse(res);
    if (!res.ok) {
      if (res.status === 404 || data?.code === 'SHIPMENT_NOT_FOUND') {
        renderShipmentNotFound(result, id);
      } else {
        renderTrackingError(result, data, res.status);
      }
      return;
    }
    renderTrackingResult(data);
  } catch (err) {
    renderTrackingError(result);
  }
}

async function readTrackingResponse(res) {
  try {
    return await res.json();
  } catch (err) {
    return null;
  }
}

function setStyles(el, styles) {
  Object.entries(styles).forEach(([key, value]) => {
    el.style[key] = value;
  });
  return el;
}

function createEl(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.text !== undefined) el.textContent = options.text;
  if (options.styles) setStyles(el, options.styles);
  return el;
}

function appendField(parent, label, value) {
  const field = createEl('div');
  field.appendChild(createEl('div', {
    text: label,
    styles: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)',
      marginBottom: '4px'
    }
  }));
  field.appendChild(createEl('div', {
    text: value ?? '-',
    styles: { fontWeight: '600' }
  }));
  parent.appendChild(field);
}

function renderShipmentNotFound(result, id) {
  result.replaceChildren();
  const card = createEl('div', {
    className: 'card',
    styles: { textAlign: 'center', padding: '40px' }
  });
  card.appendChild(createEl('div', {
    text: 'Search',
    styles: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }
  }));
  card.appendChild(createEl('div', {
    text: 'Shipment Not Found',
    styles: { fontWeight: '700', marginBottom: '8px' }
  }));
  const message = createEl('div', {
    styles: { color: 'var(--text-muted)' }
  });
  message.append('No shipment found for ');
  message.appendChild(createEl('strong', { text: id }));
  message.append('. Please check your tracking number.');
  card.appendChild(message);
  result.appendChild(card);
}

function renderTrackingError(result, data = null, status = null) {
  const message = data?.code === 'TRACKING_CONFIG_ERROR'
    ? 'Tracking service configuration issue. Please contact Ambara support.'
    : data?.code === 'TRACKING_UPSTREAM_ERROR'
      ? 'Tracking service is temporarily unavailable. Please try again later.'
      : status
        ? 'Tracking lookup failed. Please try again later.'
        : 'Connection error. Please try again.';

  result.replaceChildren();
  result.appendChild(createEl('div', {
    className: 'card',
    text: message,
    styles: { textAlign: 'center', padding: '40px', color: 'var(--red)' }
  }));
}

function renderTrackingResult(data) {
  const { shipment, events } = data;
  const statusColors = {
    pending: '--yellow',
    processed: '--blue-accent',
    in_transit: '--blue-accent',
    arrived_destination: '--blue-accent',
    out_for_delivery: '--blue-accent',
    delivered: '--green',
    exception: '--red',
    delayed: '--red',
    cancelled: '--red'
  };
  const color = statusColors[shipment.status] || '--text-muted';

  const result = document.getElementById('tracking-result');
  result.replaceChildren();

  const summaryCard = createEl('div', {
    className: 'card',
    styles: { marginBottom: '20px' }
  });
  const header = createEl('div', {
    styles: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '24px'
    }
  });
  const numberBlock = createEl('div');
  numberBlock.appendChild(createEl('div', {
    text: 'Tracking Number',
    styles: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '6px'
    }
  }));
  numberBlock.appendChild(createEl('div', {
    text: shipment.tracking_number ?? '-',
    styles: {
      fontFamily: 'var(--font-head)',
      fontSize: '1.5rem',
      fontWeight: '900',
      letterSpacing: '-0.02em'
    }
  }));
  const badge = createEl('span', {
    className: 'badge',
    text: shipment.status ? shipment.status.replace('_', ' ').toUpperCase() : 'UNKNOWN',
    styles: {
      background: `rgba(var(${color}),0.1)`,
      color: `var(${color})`,
      borderColor: `rgba(var(${color}),0.3)`
    }
  });
  header.append(numberBlock, badge);
  summaryCard.appendChild(header);

  const grid = createEl('div', {
    className: 'grid-2',
    styles: { gap: '16px' }
  });
  appendField(grid, 'FROM', shipment.origin);
  appendField(grid, 'TO', shipment.destination);
  appendField(grid, 'WEIGHT', shipment.weight_kg == null ? '-' : `${shipment.weight_kg} kg`);
  appendField(grid, 'PIECES', shipment.total_pcs == null ? '-' : `${shipment.total_pcs} pcs`);
  summaryCard.appendChild(grid);

  const historyCard = createEl('div', { className: 'card' });
  historyCard.appendChild(createEl('div', {
    text: 'Tracking History',
    styles: {
      fontFamily: 'var(--font-head)',
      fontWeight: '800',
      marginBottom: '4px'
    }
  }));

  if (events && events.length) {
    events.forEach((event, index) => {
      const item = createEl('div', {
        styles: {
          display: 'flex',
          gap: '16px',
          padding: '16px 0',
          borderBottom: '1px solid var(--border)'
        }
      });
      item.appendChild(createEl('div', {
        styles: {
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: index === events.length - 1 ? 'var(--blue)' : 'var(--border)',
          marginTop: '6px',
          flexShrink: '0'
        }
      }));
      const content = createEl('div');
      content.appendChild(createEl('div', {
        text: event.label ?? event.status ?? 'Tracking update',
        styles: { fontWeight: '600', fontSize: '0.9375rem' }
      }));
      content.appendChild(createEl('div', {
        text: [event.location, event.event_time ? formatDate(event.event_time) : null]
          .filter(Boolean)
          .join(' · '),
        styles: {
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          marginTop: '4px'
        }
      }));
      if (event.description) {
        content.appendChild(createEl('div', {
          text: event.description,
          styles: {
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            marginTop: '4px'
          }
        }));
      }
      item.appendChild(content);
      historyCard.appendChild(item);
    });
  } else {
    historyCard.appendChild(createEl('div', {
      text: 'Shipment found. No public milestones recorded yet.',
      styles: { color: 'var(--text-muted)', padding: '20px 0' }
    }));
  }

  result.append(summaryCard, historyCard);
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  LangManager.init();
  initNavbar();
  initMobileMenu();
  initNavDropdowns();
  initStatsRemark();
  initAmbaraIcons();
  setActiveNav();
  initScrollAnimations();
  bindWhatsAppTracking();
  window.setTimeout(bindWhatsAppTracking, 250);
  window.setTimeout(bindWhatsAppTracking, 1000);

  // Lang toggle buttons
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => LangManager.switch(btn.dataset.lang));
  });

  // Tracking form
  const trackForm = document.getElementById('track-form');
  if (trackForm) {
    trackForm.addEventListener('submit', e => {
      e.preventDefault();
      const id = document.getElementById('tracking-input')?.value?.trim();
      if (id) trackShipment(id);
    });
  }
});

// CSS spinner
const spinStyle = document.createElement('style');
spinStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(spinStyle);
