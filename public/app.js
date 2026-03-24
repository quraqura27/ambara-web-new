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
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
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
    const data = await res.json();
    if (!res.ok) {
      result.innerHTML = `<div class="card" style="text-align:center;padding:40px"><div style="font-size:2rem;margin-bottom:12px">🔍</div><div style="font-weight:700;margin-bottom:8px">Shipment Not Found</div><div style="color:var(--text-muted)">No shipment found for <strong>${id}</strong>. Please check your tracking number.</div></div>`;
      return;
    }
    renderTrackingResult(data);
  } catch (err) {
    result.innerHTML = `<div class="card" style="text-align:center;padding:40px;color:var(--red)">Connection error. Please try again.</div>`;
  }
}

function renderTrackingResult(data) {
  const { shipment, events } = data;
  const statusColors = { pending: '--yellow', in_transit: '--blue-accent', delivered: '--green', delayed: '--red' };
  const color = statusColors[shipment.status] || '--text-muted';
  
  const eventsHtml = (events || []).map((e, i) => `
    <div style="display:flex;gap:16px;padding:16px 0;border-bottom:1px solid var(--border)">
      <div style="width:10px;height:10px;border-radius:50%;background:${i===0?'var(--blue)':'var(--border)'};margin-top:6px;flex-shrink:0"></div>
      <div>
        <div style="font-weight:600;font-size:0.9375rem">${e.label}</div>
        <div style="font-size:0.8125rem;color:var(--text-muted);margin-top:4px">${e.location || ''} · ${formatDate(e.event_time)}</div>
      </div>
    </div>`).join('');

  document.getElementById('tracking-result').innerHTML = `
    <div class="card" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:24px">
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Tracking Number</div>
          <div style="font-family:var(--font-head);font-size:1.5rem;font-weight:900;letter-spacing:-0.02em">${shipment.tracking_number}</div>
        </div>
        <span class="badge" style="background:rgba(var(${color}),0.1);color:var(${color});border-color:rgba(var(${color}),0.3)">${shipment.status?.replace('_',' ').toUpperCase()}</span>
      </div>
      <div class="grid-2" style="gap:16px">
        <div><div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">FROM</div><div style="font-weight:600">${shipment.origin}</div></div>
        <div><div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">TO</div><div style="font-weight:600">${shipment.destination}</div></div>
        <div><div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">WEIGHT</div><div style="font-weight:600">${shipment.weight_kg} kg</div></div>
        <div><div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">PIECES</div><div style="font-weight:600">${shipment.total_pcs} pcs</div></div>
      </div>
    </div>
    <div class="card">
      <div style="font-family:var(--font-head);font-weight:800;margin-bottom:4px">Tracking History</div>
      ${eventsHtml || '<div style="color:var(--text-muted);padding:20px 0">No events recorded yet.</div>'}
    </div>`;
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
