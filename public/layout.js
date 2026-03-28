// Shared layout components
window.AMBARA = window.AMBARA || {};

AMBARA.getLang = () => {
  const path = window.location.pathname;
  return path.startsWith('/id') ? 'id' : 'en';
};

AMBARA.getNavbar = (active = '') => {
  const lang = AMBARA.getLang();
  const base = `/${lang}`;
  const links = [
    { href: `${base}/`, label: { en: 'Home', id: 'Beranda' }, key: 'home' },
    { href: `${base}/services`, label: { en: 'Services', id: 'Layanan' }, key: 'services' },
    { href: `${base}/about`, label: { en: 'About', id: 'Tentang' }, key: 'about' },
    { href: `${base}/network`, label: { en: 'Network', id: 'Jaringan' }, key: 'network' },
    { href: `${base}/blog`, label: { en: 'Blog', id: 'Blog' }, key: 'blog' },
    { href: `${base}/faq`, label: { en: 'FAQ', id: 'FAQ' }, key: 'faq' },
  ];
  return `
  <nav class="navbar">
    <div class="container">
      <a href="${base}/" class="navbar-brand">
        <div class="navbar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>
        </div>
        <div class="navbar-brand-text">AMBARA<span>ARTHA</span></div>
      </a>
      <div class="navbar-links">
        ${links.map(l => `<a href="${l.href}" ${active === l.key ? 'class="active"' : ''}>${l.label[lang]}</a>`).join('')}
      </div>
      <div class="navbar-actions">
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
          <div class="navbar-brand-text" style="color:white">AMBARA<span style="color:var(--blue-accent)">ARTHA</span></div>
          <button class="mobile-menu-btn" aria-label="Close" style="color:white;font-size:2rem">&times;</button>
        </div>
        <div class="lang-toggle" style="margin-bottom:32px;width:100%;display:flex;background:rgba(255,255,255,0.1);border-radius:8px">
          <button data-lang="en" ${lang === 'en' ? 'class="active"' : ''} style="flex:1;color:white;border-color:transparent">EN</button>
          <button data-lang="id" ${lang === 'id' ? 'class="active"' : ''} style="flex:1;color:white;border-color:transparent">ID</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:24px;font-size:1.25rem;font-weight:600">
          ${links.map(l => `<a href="${l.href}" style="color:white;text-decoration:none">${l.label[lang]}</a>`).join('')}
        </div>
        <a href="${base}/quote" class="btn btn-primary" style="margin-top:auto;width:100%;justify-content:center">${lang === 'id' ? 'Minta Penawaran' : 'Get Quote'}</a>
      </div>

    </div>
  </nav>`;
};

AMBARA.getFooter = () => {
  const lang = AMBARA.getLang();
  const base = `/${lang}`;
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
            <div class="navbar-logo" style="margin-right:12px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg></div>
            <div class="navbar-brand-text">AMBARA<span>ARTHA</span></div>
          </a>
          <p style="font-size:0.875rem;margin-bottom:20px">Your secure way for global delivery.</p>
          <div style="font-size:0.875rem;color:var(--text-muted)">
            <div style="margin-bottom:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;vertical-align:-3px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>CGK Cargo Terminal, Soekarno-Hatta</div>
            <div style="margin-bottom:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;vertical-align:-3px"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>+62 821-2545-2800</div>
            <div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;vertical-align:-3px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>cs@ambaraartha.com</div>
          </div>
        </div>
        <div>
          <div style="font-weight:700;margin-bottom:20px;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em">${tx.services}</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <a href="${base}/services" style="font-size:0.875rem;color:var(--text-muted)">Air Freight</a>
            <a href="${base}/services" style="font-size:0.875rem;color:var(--text-muted)">Customs Clearance</a>
            <a href="${base}/services" style="font-size:0.875rem;color:var(--text-muted)">Land Transport</a>
            <a href="${base}/services" style="font-size:0.875rem;color:var(--text-muted)">Cargo Insurance</a>
          </div>
        </div>
        <div>
          <div style="font-weight:700;margin-bottom:20px;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em">${tx.company}</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <a href="${base}/about" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Tentang Kami' : 'About Us'}</a>
            <a href="${base}/network" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Jaringan' : 'Network'}</a>
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
            <a href="${base}/client" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'id' ? 'Portal Klien' : 'Client Portal'}</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copy">${tx.copy}</div>
        <a href="${lang === 'en' ? '/id/' : '/en/'}" style="font-size:0.875rem;color:var(--text-muted)">${lang === 'en' ? 'Bahasa Indonesia' : 'English'}</a>
      </div>
    </div>
  </footer>
  <a href="https://wa.me/6282125452800" target="_blank" class="whatsapp-fab" aria-label="WhatsApp">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>`;
};
