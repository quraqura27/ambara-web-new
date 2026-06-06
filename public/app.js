// PT Ambara Artha Globaltrans — Shared JS v2.0

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
  setActiveNav();
  initScrollAnimations();

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
