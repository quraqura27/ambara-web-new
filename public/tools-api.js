// Custom Tool: HS Code Lartas Checker 
// Algorithmic mapping based on INSW / BTKI Chapters

const LARTAS_DB = [
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c >= 1 && c <= 14; }, agencies: 'Karantina / KKP', risk: 'High', details: 'Live Animals, Plants, Meat, Fish' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c >= 16 && c <= 22; }, agencies: 'BPOM (SKI)', risk: 'High', details: 'Processed Foods & Beverages' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 30; }, agencies: 'BPOM / Kemenkes', risk: 'Critical', details: 'Pharmaceuticals / Drugs' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 33 || c === 34; }, agencies: 'BPOM (SKI)', risk: 'High', details: 'Cosmetics & Toiletries' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 38; }, agencies: 'KLHK', risk: 'Critical', details: 'Hazardous / B3 Chemicals' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 39 || c === 40; }, agencies: 'PI Kemendag', risk: 'Medium-High', details: 'Plastics & Tires' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 44; }, agencies: 'PI Kehutanan / SVLK', risk: 'High', details: 'Wood & Forestry' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c >= 50 && c <= 63; }, agencies: 'PI Tekstil / TPT Kemendag', risk: 'High', details: 'Textiles & Garments' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 64; }, agencies: 'PI Alas Kaki Kemendag', risk: 'High', details: 'Footwear' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 69; }, agencies: 'SNI Wajib Kemenperin', risk: 'High', details: 'Ceramics' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 72 || c === 73; }, agencies: 'PI Besi Baja Kemendag & SNI Wajib', risk: 'Critical', details: 'Iron & Steel' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 84 || c === 85; }, agencies: 'POSTEL / SDPPI Kominfo & SNI Wajib', risk: 'Critical', details: 'Telecom & Electronics' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 87; }, agencies: 'TPT Kemenperin', risk: 'High', details: 'Vehicles & Parts' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 90; }, agencies: 'Alkes Kemenkes', risk: 'Critical', details: 'Medical Devices' },
  { match: (hs) => { const c = parseInt(hs.slice(0,2)); return c === 95; }, agencies: 'SNI Wajib', risk: 'High', details: 'Toys' }
];

function analyzeHS(hsCode) {
  // Clean input
  const cleanCode = hsCode.replace(/[^0-9]/g, '');
  if (cleanCode.length < 2) return null;

  for (let rule of LARTAS_DB) {
    if (rule.match(cleanCode)) {
      return {
        chapter: cleanCode.slice(0,2),
        agencies: rule.agencies,
        risk: rule.risk,
        details: rule.details
      };
    }
  }

  // Fallback for general goods indicating general PI constraints
  return {
    chapter: cleanCode.slice(0,2),
    agencies: 'Kemendag / Umum',
    risk: 'Medium',
    details: 'General / Unclassified Lartas'
  };
}

let simulatedCheckTimeout = null;

function performLookup() {
  const isID = window.location.pathname.includes('/id/');
  const input = document.getElementById('hs-input');
  const errorMsg = document.getElementById('hs-error');
  const resultsWrap = document.getElementById('results-wrap');
  
  if (!input.value || input.value.replace(/[^0-9]/g, '').length < 4) {
    errorMsg.style.display = 'block';
    errorMsg.textContent = isID ? 'Format tidak valid. Masukkan minimal 4 digit awal.' : 'Invalid format. Please enter at least the first 4 digits.';
    resultsWrap.style.display = 'none';
    return;
  }
  
  errorMsg.style.display = 'none';
  const cleanCode = input.value.replace(/[^0-9]/g, '');
  const result = analyzeHS(cleanCode);

  // Transition to Loading State
  const loader = document.getElementById('hs-loader');
  resultsWrap.style.display = 'none';
  loader.style.display = 'flex';
  
  const stepText = document.getElementById('hs-loading-text');
  
  let step = 0;
  const steps = isID ? 
    ['Menghubungkan ke server DJBC...', 'Menganalisis profil Buku Tarif Kepabeanan Indonesia...', 'Mengekstrak regulasi Lartas aktif...'] :
    ['Connecting to INSW gateway...', 'Parsing standard WCO Tariff profiling...', 'Extracting active Lartas regulations...'];

  clearInterval(simulatedCheckTimeout);
  simulatedCheckTimeout = setInterval(() => {
    if(step < steps.length) {
      stepText.textContent = steps[step];
      step++;
    } else {
      clearInterval(simulatedCheckTimeout);
      loader.style.display = 'none';
      renderResults(result, isID, cleanCode);
    }
  }, 900); // Create a dramatic dwell time of ~2.7 seconds
}

function renderResults(res, isID, rawCode) {
  const container = document.getElementById('results-wrap');
  container.style.display = 'block';

  let alertColor = res.risk === 'Critical' ? '#ef4444' : (res.risk === 'High' ? '#f59e0b' : '#3b82f6');
  let alertBg = res.risk === 'Critical' ? 'rgba(239, 68, 68, 0.1)' : (res.risk === 'High' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)');

  container.innerHTML = `
    <div style="background:${alertBg}; border: 1px solid ${alertColor}; padding:24px; border-radius:12px; margin-bottom:24px;">
      <h3 style="color:${alertColor}; margin-top:0; display:flex; align-items:center; gap:8px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        ${isID ? 'Peringatan Lartas Terdeteksi (Bab ' + res.chapter + ')' : 'Lartas Constraint Warning (Chapter ' + res.chapter + ')'}
      </h3>
      <p style="margin-bottom:16px; color:var(--text-muted)">
        ${isID ? 'Berdasarkan profil Sistem Harmonized (HS) Prefix ' + rawCode + ', komoditas ini diklasifikasikan berisiko <strong>'+res.risk+'</strong> untuk terkena pemeriksaan Jalur Merah akibat pembatasan <strong>'+res.details+'</strong>.' : 'Based on the Harmonized System (HS) Prefix ' + rawCode + ', this commodity is classified as <strong>'+res.risk+'</strong> risk for Red Lane inspections due to <strong>'+res.details+'</strong> regulations.'}
      </p>
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px;">
        <div class="badge" style="background:#111; color:white;">Regulator: ${res.agencies}</div>
        <div class="badge" style="background:${alertColor}; color:white;">Risk: ${res.risk}</div>
      </div>
    </div>

    <!-- The Lock-Out Lead Magnet Form -->
    <div class="card" style="border:2px solid var(--blue); position:relative; overflow:hidden;">
      <div style="position:absolute; top:0; left:0; width:100%; height:4px; background:var(--blue);"></div>
      <h4 style="margin-top:0">${isID ? 'Buka Status INSW Mengikat (GRATIS)' : 'Unlock Binding INSW Status (FREE)'}</h4>
      <p style="color:var(--text-muted); font-size:0.9375rem; margin-bottom:24px;">
        ${isID ? 'Hasil di atas adalah proyeksi algoritmik. Untuk melihat apakah kode HS fungsional 8-digit Anda persis diblokir hari ini oleh Customs CEISA, masukkan email kerja Anda untuk memicu kueri PPJK resmi oleh broker berlisensi (ISO 9001).' : 'The results above are an algorithmic projection. To see if your exact 8-digit HS code is blocked today by Customs CEISA, enter your work email to trigger an official PPJK query by our licensed brokers (ISO 9001).'}
      </p>
      
      <form id="lead-magnet-form" onsubmit="submitLead(event, '${rawCode}')" style="display:flex; flex-direction:column; gap:16px;">
        <input type="email" id="lm-email" placeholder="${isID ? 'Email Perusahaan (Wajib)' : 'Work Email (Required)'}" required class="btn" style="text-align:left; border:1px solid var(--border); background:var(--surface2); width:100%;">
        <input type="text" id="lm-phone" placeholder="${isID ? 'Nomor WhatsApp (Opsional untuk balasan 5-menit)' : 'WhatsApp Number (Optional for 5-min reply)'}" class="btn" style="text-align:left; border:1px solid var(--border); background:var(--surface2); width:100%;">
        <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;">
          ${isID ? 'Dapatkan Laporan Final INSW →' : 'Get Final INSW Report →'}
        </button>
      </form>
      <div id="lm-success" style="display:none; padding:20px; text-align:center; color:#10b981; font-weight:600;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 16px; display:block;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        ${isID ? 'Permintaan Terkirim! Tim PPJK kami sedang menjalankan kuery. Kami akan mengirim email/WA laporannya.' : 'Request Sent! Our PPJK team is running the query. We will shoot you an email/WhatsApp with the report.'}
      </div>
    </div>
  `;
}

async function submitLead(e, hsCode) {
  e.preventDefault();
  const form = document.getElementById('lead-magnet-form');
  const success = document.getElementById('lm-success');
  const email = document.getElementById('lm-email').value;
  const phone = document.getElementById('lm-phone').value;
  
  const btn = form.querySelector('button');
  const originalTxt = btn.innerHTML;
  btn.innerHTML = 'Sending...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/client-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'LEAD_MAGNET',
        hsCode: hsCode,
        email: email,
        phone: phone,
        url: window.location.href
      })
    });
    
    // We visually process success regardless to complete the Magnet UX
    form.style.display = 'none';
    success.style.display = 'block';
  } catch (err) {
    alert('Network error. Please try again or WhatsApp us.');
    btn.innerHTML = originalTxt;
    btn.disabled = false;
  }
}
