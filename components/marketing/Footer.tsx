import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

interface FooterProps {
  lang: 'en' | 'id';
}

export default function Footer({ lang }: FooterProps) {
  const base = `/${lang}`;
  const t = {
    en: {
      services: 'Services',
      company: 'Company',
      support: 'Support',
      copy: '© 2025–2026 PT Ambara Artha Globaltrans. All rights reserved.',
      tagline: 'Your secure way for global delivery.',
      address: 'CGK Cargo Terminal, Soekarno-Hatta',
      phone: '+62 821-2545-2800',
      email: 'cs@ambaraartha.com',
      about: 'About Us',
      network: 'Network',
      tools: 'HS Code Checker',
      partners: 'Partners',
      contact: 'Contact Us',
      quote: 'Request Quote',
      portal: 'Client Portal',
      langAlt: 'Bahasa Indonesia',
      langAltHref: '/id'
    },
    id: {
      services: 'Layanan',
      company: 'Perusahaan',
      support: 'Dukungan',
      copy: '© 2025–2026 PT Ambara Artha Globaltrans. Hak cipta dilindungi.',
      tagline: 'Solusi aman untuk pengiriman global Anda.',
      address: 'Terminal Kargo CGK, Soekarno-Hatta',
      phone: '+62 821-2545-2800',
      email: 'cs@ambaraartha.com',
      about: 'Tentang Kami',
      network: 'Jaringan',
      tools: 'Cek Lartas HS Code',
      partners: 'Mitra',
      contact: 'Hubungi Kami',
      quote: 'Minta Penawaran',
      portal: 'Portal Klien',
      langAlt: 'English',
      langAltHref: '/en'
    }
  };

  const tx = t[lang];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href={`${base}/`} className="navbar-brand" style={{ marginBottom: '20px', display: 'flex' }}>
              <div className="navbar-logo" style={{ marginRight: '12px' }}>
                <Image src="/logo.png" alt="PT Ambara Artha Globaltrans" className="brand-logo-image" width={4000} height={622} />
              </div>
            </Link>
            <p style={{ fontSize: '0.875rem', marginBottom: '20px' }}>{tx.tagline}</p>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} /> {tx.address}
              </div>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} /> {tx.phone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} /> {tx.email}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: '20px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tx.services}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href={`${base}/services`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Air Freight</Link>
              <Link href={`${base}/services`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Customs Clearance</Link>
              <Link href={`${base}/services`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Land Transport</Link>
              <Link href={`${base}/services`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Cargo Insurance</Link>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: '20px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tx.company}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href={`${base}/about`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tx.about}</Link>
              <Link href={`${base}/network`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tx.network}</Link>
              <Link href={`${base}/hs-code-checker`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tx.tools}</Link>
              <Link href={`${base}/partners`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tx.partners}</Link>
              <Link href={`${base}/blog`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Blog</Link>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: '20px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tx.support}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href={`${base}/contact`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tx.contact}</Link>
              <Link href={`${base}/faq`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>FAQ</Link>
              <Link href={`${base}/quote`} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tx.quote}</Link>
              <Link href="/dashboard" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tx.portal}</Link>
            </div>
          </div>
        </div>

      <div className="footer-bottom">
          <div className="footer-copy">{tx.copy}</div>
          <Link href={tx.langAltHref} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {tx.langAlt}
          </Link>
        </div>
      </div>
      
      {/* WhatsApp FAB */}
      <a 
        href="https://wa.me/6282125452800" 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-fab" 
        aria-label="WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </footer>
  );
}
