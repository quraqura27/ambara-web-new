"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  lang: 'en' | 'id';
  active?: string;
}

export default function Navbar({ lang, active = '' }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const base = `/${lang}`;
  
  const links = [
    { href: `${base}/`, label: { en: 'Home', id: 'Beranda' }, key: 'home' },
    { href: `${base}/services`, label: { en: 'Services', id: 'Layanan' }, key: 'services' },
    { href: `${base}/about`, label: { en: 'About', id: 'Tentang' }, key: 'about' },
    { href: `${base}/network`, label: { en: 'Network', id: 'Jaringan' }, key: 'network' },
    { href: `${base}/hs-code-checker`, label: { en: 'Free Tools', id: 'Cek Lartas' }, key: 'tools' },
    { href: `${base}/blog`, label: { en: 'Blog', id: 'Blog' }, key: 'blog' },
    { href: `${base}/faq`, label: { en: 'FAQ', id: 'FAQ' }, key: 'faq' },
  ];

  const t = {
    en: { portal: 'Client Portal', quote: 'Get Quote' },
    id: { portal: 'Portal Klien', quote: 'Minta Penawaran' }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link href={`${base}/`} className="navbar-brand">
          <div className="navbar-logo">
            <Image src="/logo.png" alt="PT Ambara Artha Globaltrans" className="brand-logo-image" width={4000} height={622} priority />
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          {links.map((link) => (
            <Link 
              key={link.key} 
              href={link.href} 
              className={active === link.key ? 'active' : ''}
            >
              {link.label[lang]}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          <Link 
            href="/dashboard" 
            className="btn btn-outline btn-sm" 
            style={{ marginRight: '8px', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            {t[lang].portal}
          </Link>
          <div className="lang-toggle">
            <Link 
              href="/en" 
              className={lang === 'en' ? 'active' : ''}
              scroll={false}
            >
              EN
            </Link>
            <Link 
              href="/id" 
              className={lang === 'id' ? 'active' : ''}
              scroll={false}
            >
              ID
            </Link>
          </div>
          <Link href={`${base}/quote`} className="btn btn-primary btn-sm">
            {t[lang].quote}
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-btn" 
          aria-label="Menu"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`} style={{ display: isMobileMenuOpen ? 'flex' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%' }}>
          <div className="navbar-logo">
            <Image src="/logo.png" alt="PT Ambara Artha Globaltrans" className="brand-logo-image" width={4000} height={622} priority />
          </div>
          <button 
            className="mobile-menu-btn" 
            aria-label="Close" 
            style={{ color: 'white', fontSize: '2rem' }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="lang-toggle" style={{ marginBottom: '32px', width: '100%', display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
          <Link 
            href="/en" 
            className={lang === 'en' ? 'active' : ''} 
            style={{ flex: 1, color: 'white', borderColor: 'transparent', textAlign: 'center', padding: '8px 0' }}
          >
            EN
          </Link>
          <Link 
            href="/id" 
            className={lang === 'id' ? 'active' : ''} 
            style={{ flex: 1, color: 'white', borderColor: 'transparent', textAlign: 'center', padding: '8px 0' }}
          >
            ID
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '1.25rem', fontWeight: 600 }}>
          {links.map((link) => (
            <Link 
              key={link.key} 
              href={link.href} 
              style={{ color: 'white', textDecoration: 'none' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label[lang]}
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <Link 
            href="/dashboard" 
            className="btn btn-outline" 
            style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            {t[lang].portal}
          </Link>
          <Link 
            href={`${base}/quote`} 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {t[lang].quote}
          </Link>
        </div>
      </div>
    </nav>
  );
}
