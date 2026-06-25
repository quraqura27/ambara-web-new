// Shared layout components
window.AMBARA = window.AMBARA || {};

AMBARA.getLang = () => {
  const path = window.location.pathname;
  return path.startsWith('/id') ? 'id' : 'en';
};

AMBARA.getNavbar = (active = '') => {
  const lang = AMBARA.getLang();
  const base = `/${lang}`;
  const serviceLinks = lang === 'id' ? [
    { href: `${base}/dukungan-kargo-udara-cgk`, label: 'Kargo Udara' },
    { href: `${base}/services`, label: 'Freight Forwarding' },
    { href: `${base}/dukungan-import-undername-indonesia`, label: 'Dukungan Importer of Record' },
    { href: `${base}/pengiriman-ddp-indonesia`, label: 'DDP / DDU' },
    { href: `${base}/services`, label: 'Door-to-Door' },
  ] : [
    { href: `${base}/air-freight-forwarder-indonesia`, label: 'Air Freight' },
    { href: `${base}/freight-forwarding-indonesia`, label: 'Freight Forwarding' },
    { href: `${base}/undername-import-indonesia`, label: 'Importer of Record Support' },
    { href: `${base}/ddp-shipping-indonesia`, label: 'DDP / DDU' },
    { href: `${base}/services`, label: 'Door-to-Door' },
  ];
  const toolLinks = [
    { href: `${base}/hs-code-checker`, label: lang === 'id' ? 'Cek HS Code / Lartas' : 'HS Code Checker' },
    { href: `${base}/document-preparation`, label: lang === 'id' ? 'Persiapan Dokumen' : 'Document Preparation' },
  ];
  const links = [
    { href: `${base}/`, label: { en: 'Home', id: 'Beranda' }, key: 'home' },
    { label: { en: 'Services', id: 'Layanan' }, key: 'services', dropdown: serviceLinks },
    { href: `${base}/network`, label: { en: 'Network', id: 'Jaringan' }, key: 'network' },
    { label: { en: 'Tools', id: 'Tools' }, key: 'tools', dropdown: toolLinks },
    { href: `${base}/about`, label: { en: 'About', id: 'Tentang' }, key: 'about' },
  ];
  const renderDesktopLink = (l) => {
    if (!l.dropdown) {
      return `<a href="${l.href}" ${active === l.key ? 'class="active"' : ''}>${l.label[lang]}</a>`;
    }
    return `<div class="nav-dropdown ${active === l.key ? 'active' : ''}">
      <button class="nav-dropdown-trigger" type="button" aria-haspopup="true" aria-expanded="false">${l.label[lang]} <span aria-hidden="true">▾</span></button>
      <div class="nav-dropdown-menu" role="menu">
        ${l.dropdown.map(item => `<a href="${item.href}" role="menuitem">${item.label}</a>`).join('')}
      </div>
    </div>`;
  };
  const renderMobileLink = (l) => {
    if (!l.dropdown) {
      return `<a href="${l.href}" class="mobile-nav-link">${l.label[lang]}</a>`;
    }
    return `<details class="mobile-nav-group" ${active === l.key ? 'open' : ''}>
      <summary>${l.label[lang]}</summary>
      <div class="mobile-nav-submenu">
        ${l.dropdown.map(item => `<a href="${item.href}">${item.label}</a>`).join('')}
      </div>
    </details>`;
  };
  return `
  <nav class="navbar">
    <div class="container">
      <a href="${base}/" class="navbar-brand">
        <div class="navbar-logo">
          <img src="/logo.png" alt="PT Ambara Artha Globaltrans" class="brand-logo-image" width="4000" height="622">
        </div>
      </a>
      <div class="navbar-links">
        ${links.map(renderDesktopLink).join('')}
      </div>
      <div class="navbar-actions">
        <a href="/dashboard" class="btn btn-outline btn-sm" style="margin-right:8px;border-color:rgba(255,255,255,0.2);color:white">${lang === 'id' ? 'Portal Klien' : 'Client Portal'}</a>
        <div class="lang-toggle">
          <button data-lang="en" ${lang === 'en' ? 'class="active"' : ''}>EN</button>
          <button data-lang="id" ${lang === 'id' ? 'class="active"' : ''}>ID</button>
        </div>
        <a href="${base}/quote" class="btn btn-primary btn-sm">${lang === 'id' ? 'Minta Penawaran' : 'Get Quote'}</a>
      </div>
      <button class="mobile-menu-btn" aria-label="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>

    <div class="mobile-nav">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;width:100%">
        <div class="navbar-logo"><img src="/logo.png" alt="PT Ambara Artha Globaltrans" class="brand-logo-image" width="4000" height="622"></div>
        <button class="mobile-menu-btn" aria-label="Close" style="color:white;font-size:2rem">&times;</button>
      </div>
      <div class="lang-toggle" style="margin-bottom:32px;width:100%;display:flex;background:rgba(255,255,255,0.1);border-radius:8px">
        <button data-lang="en" ${lang === 'en' ? 'class="active"' : ''} style="flex:1;color:white;border-color:transparent">EN</button>
        <button data-lang="id" ${lang === 'id' ? 'class="active"' : ''} style="flex:1;color:white;border-color:transparent">ID</button>
      </div>
      <div class="mobile-nav-list">
        ${links.map(renderMobileLink).join('')}
      </div>
      <a href="/dashboard" class="btn btn-outline" style="margin-top:auto;width:100%;justify-content:center;margin-bottom:12px;border-color:rgba(255,255,255,0.2);color:white">${lang === 'id' ? 'Portal Klien' : 'Client Portal'}</a>
      <a href="${base}/quote" class="btn btn-primary" style="width:100%;justify-content:center">${lang === 'id' ? 'Minta Penawaran' : 'Get Quote'}</a>
    </div>
  </nav>`;
};

AMBARA.getFooter = () => {
  const lang = AMBARA.getLang();
  const base = `/${lang}`;
  const freightForwardingHref = lang === 'id' ? `${base}/services` : `${base}/freight-forwarding-indonesia`;
  const t = {
    en: { services: 'Services', company: 'Company', support: 'Support', copy: '© 2025–2026 PT Ambara Artha Globaltrans. All rights reserved.' },
    id: { services: 'Layanan', company: 'Perusahaan', support: 'Dukungan', copy: '© 2025–2026 PT Ambara Artha Globaltrans. Hak cipta dilindungi.' }
  };
  const tx = t[lang];
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="${base}/" class="navbar-brand" style="margin-bottom:20px;display:flex">
            <div class="navbar-logo" style="margin-right:12px"><img src="/logo.png" alt="PT Ambara Artha Globaltrans" class="brand-logo-image" width="4000" height="622"></div>
          </a>
          <p style="font-size:0.875rem;margin-bottom:20px">Your secure way for global delivery.</p>
          <div style="font-size:0.875rem;color:var(--text-muted)">
            <div style="margin-bottom:8px">CGK Cargo Terminal, Soekarno-Hatta</div>
            <div style="margin-bottom:8px">+62 821-2545-2800</div>
            <div>cs@ambaraartha.com</div>
          </div>
        </div>
        <div>
          <div style="font-weight:700;margin-bottom:20px;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em">${tx.services}</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <a href="${freightForwardingHref}" style="font-size:0.875rem;color:var(--text-muted)">Freight Forwarding</a>
            <a href="${base}/air-freight-to-indonesia" style="font-size:0.875rem;color:var(--text-muted)">Air Freight to Indonesia</a>
            <a href="${base}/air-freight-from-indonesia" style="font-size:0.875rem;color:var(--text-muted)">Air Freight from Indonesia</a>
            <a href="${base}/indonesia-customs-clearance" style="font-size:0.875rem;color:var(--text-muted)">Customs Clearance</a>
            <a href="${base}/undername-import-indonesia" style="font-size:0.875rem;color:var(--text-muted)">Undername Import</a>
            <a href="${base}/ddp-shipping-indonesia" style="font-size:0.875rem;color:var(--text-muted)">DDP / DDU Shipping</a>
            <a href="${base}/cgk-air-cargo-agent" style="font-size:0.875rem;color:var(--text-muted)">CGK Air Cargo</a>
          </div>
        </div>
        <div>
          <div style="font-weight:700;margin-bottom:20px;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em">${tx.company}</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <a href="${base}/about" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Tentang Kami' : 'About Us'}</a>
            <a href="${base}/network" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Jaringan' : 'Network'}</a>
            <a href="${base}/hs-code-checker" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Cek Lartas HS Code' : 'HS Code Checker'}</a>
            <a href="${base}/document-preparation" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Persiapan Dokumen' : 'Document Preparation'}</a>
            <a href="${base}/partners" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Mitra' : 'Partners'}</a>
            <a href="${base}/blog" style="font-size:0.875rem;color:var(--text-muted)">Blog</a>
          </div>
        </div>
        <div>
          <div style="font-weight:700;margin-bottom:20px;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em">${tx.support}</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <a href="${base}/contact" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Hubungi Kami' : 'Contact Us'}</a>
            <a href="${base}/faq" style="font-size:0.875rem;color:var(--text-muted)">FAQ</a>
            <a href="${base}/quote" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Minta Penawaran' : 'Get Quote'}</a>
            <a href="/dashboard" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Portal Klien' : 'Client Portal'}</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copy">${tx.copy}</div>
        <a href="${lang === 'en' ? '/id/' : '/en/'}" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'en' ? 'Bahasa Indonesia' : 'English'}</a>
      </div>
    </div>
  </footer>
  <a href="https://wa.me/6282125452800" target="_blank" class="whatsapp-fab" aria-label="WhatsApp" data-cta-location="floating_whatsapp" data-service-category="general">WhatsApp</a>`;
};

(function initHomepageStatsFromPortal() {
  const FALLBACK_TONS_SHIPPED = 121;
  const FALLBACK_ON_TIME_RATE = 99.2;
  const FALLBACK_COUNTRIES_SERVED = 52;

  function getLang() {
    return typeof AMBARA?.getLang === 'function' ? AMBARA.getLang() : 'en';
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function formatInteger(value) {
    return Number(value).toLocaleString(getLang() === 'id' ? 'id-ID' : 'en-US', { maximumFractionDigits: 0 });
  }

  function formatPercent(value) {
    return `${Number(value).toFixed(1).replace('.', getLang() === 'id' ? ',' : '.')}%`;
  }

  function updateRemark() {
    const remark = document.querySelector('.stats-remark');
    if (!remark) return;
    remark.textContent = getLang() === 'id'
      ? 'Berdasarkan dataset performa operasional Ambara.'
      : 'Based on Ambara’s operational performance dataset.';
  }

  function applyStats(stats = {}) {
    const tonsShipped = Number.isFinite(Number(stats.tonsShipped))
      ? Number(stats.tonsShipped)
      : FALLBACK_TONS_SHIPPED;
    const onTimeRate = Number.isFinite(Number(stats.onTimeRate))
      ? Number(stats.onTimeRate)
      : FALLBACK_ON_TIME_RATE;
    const countriesServed = Number.isFinite(Number(stats.countriesServed))
      ? Number(stats.countriesServed)
      : FALLBACK_COUNTRIES_SERVED;

    setText('stat-tonnage', `${formatInteger(Math.round(tonsShipped))} T`);
    setText('stat-ontime', formatPercent(onTimeRate));
    setText('stat-countries', formatInteger(countriesServed));
    updateRemark();
  }

  async function refreshStats() {
    if (!document.getElementById('stat-tonnage')) return;

    applyStats();

    try {
      const response = await fetch('/api/public-stats', { cache: 'no-store' });
      if (!response.ok) throw new Error('Stats request failed');
      applyStats(await response.json());
    } catch (error) {
      console.warn('Unable to refresh public homepage stats', error);
      applyStats();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(refreshStats, 0));
  } else {
    window.setTimeout(refreshStats, 0);
  }
})();
