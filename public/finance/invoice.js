// public/finance/invoice.js

let currentCustomer = null;
let currentAwbs = [];
let serviceLines = [];
let deductionLines = [];
let logoBase64 = '';

// Check auth and role
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('ambara_token');
  if (!token) { window.location.href = '/admin.html'; return; }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== 'superadmin' && payload.role !== 'finance') {
      alert('Access Denied: Invoice Generator is restricted to Finance/Admin.');
      window.location.href = '/admin.html';
    }
  } catch(e) { window.location.href = '/admin.html'; }

  // Load logo base64
  try {
    const res = await fetch('/finance/logo_base64.txt');
    if (res.ok) {
      logoBase64 = await res.text();
      document.getElementById('logo-img').src = logoBase64;
    }
  } catch(e) {}

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('inv-date').value = today;

  // Setup search debounce
  const searchInput = document.getElementById('search-customer');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const q = e.target.value.trim();
    if (q.length >= 2) {
      searchTimeout = setTimeout(() => searchCustomers(q), 300);
    } else {
      document.getElementById('customer-results').innerHTML = '';
    }
  });

  updatePreview();
});

// ---------- API Helpers ----------
async function api(path, method = 'GET', body = null) {
  const token = localStorage.getItem('ambara_token');
  const opts = { method, headers: { 'Authorization': `Bearer ${token}` } };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`/api/v1/${path}`, opts);
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'API Error');
  return data;
}

// ---------- STEP 1: CUSTOMERS ----------
async function searchCustomers(q) {
  const resCon = document.getElementById('customer-results');
  resCon.innerHTML = '<div style="color:var(--text-muted);font-size:0.875rem">Searching...</div>';
  try {
    const res = await api(`customers-search?q=${encodeURIComponent(q)}`);
    if (!res.data.length) {
      resCon.innerHTML = '<div style="color:var(--text-muted);font-size:0.875rem">No customers found.</div>';
      return;
    }
    resCon.innerHTML = res.data.map(c => `
      <div class="customer-result" onclick='selectCustomer(${JSON.stringify(c).replace(/'/g,"&#39;")})'>
        <div style="font-weight:600">${c.name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${c.npwp ? `NPWP: ${c.npwp} · ` : ''}${c.province_postal || 'No address'}</div>
      </div>
    `).join('');
  } catch (err) {
    resCon.innerHTML = `<div style="color:var(--red);font-size:0.875rem">Error: ${err.message}</div>`;
  }
}

async function selectCustomer(c) {
  currentCustomer = c;
  document.getElementById('selected-customer-name').textContent = c.name;
  
  // Format Address
  let addr1 = c.address_line1 || '';
  if (c.address_line2) addr1 += `, ${c.address_line2}`;
  document.getElementById('p-cust-addr1').textContent = addr1;
  document.getElementById('p-cust-addr2').textContent = c.province_postal || '';
  // City/Country fallback to just NPWP if available
  document.getElementById('p-cust-city').textContent = c.npwp ? `NPWP: ${c.npwp}` : 'INDONESIA';
  document.getElementById('p-cust-name').textContent = c.name;

  // Change view
  document.getElementById('step-1').classList.remove('active');
  document.getElementById('step-2').classList.add('active');
  document.getElementById('tab-1').classList.remove('active');
  document.getElementById('tab-2').classList.add('active');
  document.getElementById('btn-back').disabled = false;
  document.getElementById('btn-next').style.display = 'block';

  // Load AWBs
  loadCustomerAwbs(c.id);
}

// ---------- STEP 2: BUILD ----------
async function loadCustomerAwbs(customerId) {
  const list = document.getElementById('awb-list');
  list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted)">Loading AWBs...</div>';
  try {
    const res = await api(`customers-awbs?customer_id=${customerId}&invoiced=false`);
    currentAwbs = res.data;
    if (!currentAwbs.length) {
      list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted)">No uninvoiced AWBs available for this customer.</div>';
      return;
    }
    
    list.innerHTML = currentAwbs.map((a, i) => `
      <div class="awb-check-item">
        <input type="checkbox" id="cb-awb-${i}" value="${i}" onchange="toggleAwb(${i})">
        <label for="cb-awb-${i}" style="flex:1;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-family:monospace;font-weight:700;color:var(--blue-accent)">${a.awb_number || 'N/A'}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">Date: ${a.shipment_date||'—'} · Route: ${a.origin||'—'} → ${a.destination||'—'}</div>
          </div>
          <div>
            <span style="font-size:0.8125rem;font-weight:700">${a.chargeable_weight||0} kg</span>
          </div>
        </label>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div style="padding:16px;color:var(--red)">Failed to load AWBs: ${err.message}</div>`;
  }
}

// Keep track of ticked AWBs
let selectedAwbs = [];
function toggleAwb(idx) {
  const cb = document.getElementById(`cb-awb-${idx}`);
  if (cb.checked) {
    const a = currentAwbs[idx];
    selectedAwbs.push({ ...a, _tempId: Date.now()+idx, price_per_kg: 0, line_total: 0 });
  } else {
    selectedAwbs = selectedAwbs.filter(sa => sa.id !== currentAwbs[idx].id);
  }
  updatePreview();
}

function addServiceLine() {
  serviceLines.push({ _tempId: Date.now(), description: '', amount: 0 });
  updatePreview();
}
function removeServiceLine(id) {
  serviceLines = serviceLines.filter(s => s._tempId !== id);
  updatePreview();
}
function addDeduction() {
  deductionLines.push({ _tempId: Date.now(), description: 'Claim / Deduction', amount: 0 });
  updatePreview();
}
function removeDeduction(id) {
  deductionLines = deductionLines.filter(d => d._tempId !== id);
  updatePreview();
}

// ---------- VALIDATION & UPDATES ----------
function validateInvNo() {
  const val = document.getElementById('inv-no').value;
  const err = document.getElementById('inv-no-error');
  const valid = /^AAG\/\d{3}\/[A-Z]+\/\d{2}$/.test(val);
  if (val.length > 0 && !valid) { err.style.display = 'block'; return false; }
  err.style.display = 'none';
  return valid;
}

const formatRp = (num) => {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits:0 }).format(num || 0);
};

// Global state for totals
let g_subtotal = 0;
let g_deductions = 0;
let g_net = 0;
let g_vat = 0;
let g_total = 0;
let g_deposit = 0;
let g_due = 0;

function updatePreview() {
  // Sync Meta
  const invNo = document.getElementById('inv-no').value || 'AAG/.../.../..';
  document.getElementById('p-inv-no').textContent = invNo;
  document.getElementById('p-bottom-id').textContent = `Invoice No ${invNo}`;
  
  const d = document.getElementById('inv-date').value;
  let fmtDate = '';
  if (d) {
    const dt = new Date(d);
    fmtDate = dt.toLocaleDateString('en-GB', { day:'2-digit', month: 'short', year:'numeric'}).replace(/ /g, '-');
  }
  document.getElementById('p-inv-date').textContent = fmtDate;
  
  const due = document.getElementById('inv-due').value;
  if (due) {
    document.getElementById('tr-due-date').style.display = 'table-row';
    const ddt = new Date(due);
    document.getElementById('p-inv-due').textContent = ddt.toLocaleDateString('en-GB', { day:'2-digit', month: 'short', year:'numeric'}).replace(/ /g, '-');
  } else {
    document.getElementById('tr-due-date').style.display = 'none';
  }
  
  document.getElementById('p-inv-terms').textContent = document.getElementById('inv-terms').value || 'CASH';
  
  const curr = document.getElementById('inv-currency').value;
  
  // Bank Info
  const b = document.getElementById('inv-bank').value;
  const banks = {
    'OCBC': { name: 'BANK OCBC', swift: 'NISPIDJA', branch: 'OCBC Tower', acc: '5458-0012-2586' },
    'MANDIRI': { name: 'BANK MANDIRI', swift: 'BMRIDJA', branch: 'KCP JKT', acc: '166-0000-000-000' }
  };
  if (banks[b]) {
    document.getElementById('p-bank-name').textContent = banks[b].name;
    document.getElementById('p-bank-swift').textContent = banks[b].swift;
    document.getElementById('p-bank-branch').textContent = banks[b].branch;
    document.getElementById('p-bank-acc').textContent = banks[b].acc;
  }
  document.getElementById('p-bank-curr').textContent = curr;
  
  // Form Date for signature
  const cyd = new Date(d || new Date());
  const indoMonths = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  document.getElementById('p-city-date').textContent = `Tangerang, ${cyd.getDate().toString().padStart(2,'0')} ${indoMonths[cyd.getMonth()]} ${cyd.getFullYear()}`;

  // ------------- RENDER TABLES & CALCULATE --------------
  let tbodyHtml = '';
  g_subtotal = 0;
  g_deductions = 0;

  // 1. AWB Items
  selectedAwbs.forEach((a, i) => {
    // Read input value if html element exists
    const iprice = document.getElementById(`awb-price-${a._tempId}`);
    if (iprice) a.price_per_kg = parseFloat(iprice.value) || 0;
    
    a.line_total = a.price_per_kg * parseFloat(a.chargeable_weight || 0);
    g_subtotal += a.line_total;

    // AWB Date format (DD-MMM-YY)
    let sdt = a.shipment_date;
    if (sdt) {
      const dt = new Date(sdt);
      sdt = dt.toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'2-digit'}).replace(/ /g,'-');
    } else sdt = '—';

    // Render Preview Row
    tbodyHtml += `
      <tr>
        <td class="t-center">${i+1}</td>
        <td class="t-center">${a.origin||'—'}</td>
        <td class="t-center">${a.destination||'—'}</td>
        <td class="t-center">${sdt}</td>
        <td>${a.awb_number||'—'}</td>
        <td>${a.flight_number||'—'}</td>
        <td class="t-center">${a.pieces||0}</td>
        <td class="t-right">${a.chargeable_weight||0}</td>
        <td class="t-curr">${curr === 'IDR' ? 'Rp' : curr}</td>
        <td class="t-amt">
          <!-- BUILDER INPUT INJECTED HERE VIA ABSOLUTE POSITIONING HACK OR WE MUST SYNC -->
          <input type="number" id="awb-price-${a._tempId}" value="${a.price_per_kg||0}" oninput="updatePreview()" style="width:70px;border:1px solid #ccc;text-align:right" class="no-print">
          <span class="print-only">${formatRp(a.price_per_kg)}</span>
        </td>
        <td class="t-curr">${curr === 'IDR' ? 'Rp' : curr}</td>
        <td class="t-amt">${formatRp(a.line_total)}</td>
      </tr>
    `;
  });

  // 2. Service Lines
  let tIdx = selectedAwbs.length + 1;
  const sList = document.getElementById('service-lines');
  let sbuildHtml = '';
  
  serviceLines.forEach((s) => {
    // Sync inputs if they exist
    const idesc = document.getElementById(`srv-desc-${s._tempId}`);
    const iamt = document.getElementById(`srv-amt-${s._tempId}`);
    if (idesc) s.description = idesc.value;
    if (iamt) s.amount = parseFloat(iamt.value) || 0;
    
    g_subtotal += s.amount;
    
    // Builder HTML
    sbuildHtml += `
      <div class="builder-row" style="grid-template-columns: 2fr 1fr 30px">
        <input type="text" class="form-control" id="srv-desc-${s._tempId}" value="${s.description}" placeholder="Description" oninput="updatePreview()">
        <input type="number" class="form-control" id="srv-amt-${s._tempId}" value="${s.amount}" oninput="updatePreview()">
        <button class="btn btn-outline" style="padding:0" onclick="removeServiceLine(${s._tempId})">×</button>
      </div>
    `;

    // Preview HTML (spans across AWB columns)
    tbodyHtml += `
      <tr>
        <td class="t-center">${tIdx++}</td>
        <td colspan="7">${s.description}</td>
        <td colspan="2"></td>
        <td class="t-curr">${curr === 'IDR' ? 'Rp' : curr}</td>
        <td class="t-amt">${formatRp(s.amount)}</td>
      </tr>
    `;
  });
  sList.innerHTML = sbuildHtml;

  // 3. Deductions
  const dList = document.getElementById('deduction-lines');
  let dbuildHtml = '';
  
  deductionLines.forEach((d) => {
    const idesc = document.getElementById(`ded-desc-${d._tempId}`);
    const iamt = document.getElementById(`ded-amt-${d._tempId}`);
    if (idesc) d.description = idesc.value;
    if (iamt) d.amount = parseFloat(iamt.value) || 0;
    
    g_deductions += d.amount;
    
    dbuildHtml += `
      <div class="builder-row" style="grid-template-columns: 2fr 1fr 30px">
        <input type="text" class="form-control" id="ded-desc-${d._tempId}" value="${d.description}" placeholder="Deduction" oninput="updatePreview()">
        <input type="number" class="form-control" id="ded-amt-${d._tempId}" value="${d.amount}" oninput="updatePreview()">
        <button class="btn btn-outline" style="padding:0" onclick="removeDeduction(${d._tempId})">×</button>
      </div>
    `;

    tbodyHtml += `
      <tr>
        <td class="t-center">${tIdx++}</td>
        <td colspan="7">${d.description}</td>
        <td colspan="2"></td>
        <td class="t-curr">-${curr === 'IDR' ? 'Rp' : curr}</td>
        <td class="t-amt">${formatRp(d.amount)}</td>
      </tr>
    `;
  });
  dList.innerHTML = dbuildHtml;

  document.getElementById('p-tbody').innerHTML = tbodyHtml;

  // 4. Calculate Totals
  g_net = g_subtotal - g_deductions;
  
  const vatEn = document.getElementById('inv-vat').checked;
  g_vat = vatEn ? (Math.round(g_net * 0.011 * 100) / 100) : 0;
  
  g_total = g_net + g_vat;
  
  const depInput = document.getElementById('inv-deposit');
  g_deposit = parseFloat(depInput.value) || 0;
  
  g_due = g_total - g_deposit;

  // 5. Render TFOOT (Preview)
  let tfootHtml = '';
  const cSym = curr === 'IDR' ? 'Rp' : curr;
  
  tfootHtml += `
    <tr class="inv-total-row">
      <td colspan="10" class="total-label">Subtotal</td>
      <td class="t-curr">${cSym}</td>
      <td class="t-amt">${formatRp(g_net)}</td>
    </tr>
  `;
  
  if (vatEn) {
    tfootHtml += `
    <tr class="inv-total-row">
      <td colspan="10" class="total-label">VAT 1.1%</td>
      <td class="t-curr">${cSym}</td>
      <td class="t-amt">${formatRp(g_vat)}</td>
    </tr>
    <tr class="inv-total-row">
      <td colspan="10" class="total-label">Total</td>
      <td class="t-curr">${cSym}</td>
      <td class="t-amt">${formatRp(g_total)}</td>
    </tr>`;
  }
  
  if (g_deposit > 0) {
    tfootHtml += `
    <tr class="inv-total-row">
      <td colspan="10" class="total-label">Deposit</td>
      <td class="t-curr">-${cSym}</td>
      <td class="t-amt">${formatRp(g_deposit)}</td>
    </tr>`;
  }
  
  tfootHtml += `
    <tr class="inv-total-row">
      <td colspan="10" class="total-label">Total Due</td>
      <td class="t-curr total-val">${cSym}</td>
      <td class="t-amt total-val">${formatRp(g_due)}</td>
    </tr>
  `;
  document.getElementById('p-tfoot').innerHTML = tfootHtml;

  // Update Builder Summary text
  document.getElementById('build-subtotal').textContent = `${cSym} ${formatRp(g_subtotal)}`;
  document.getElementById('build-deductions').textContent = `${cSym} ${formatRp(g_deductions)}`;
  document.getElementById('build-net').textContent = `${cSym} ${formatRp(g_net)}`;
  document.getElementById('build-vat').textContent = `${cSym} ${formatRp(g_vat)}`;
  document.getElementById('build-deposit').textContent = `${cSym} ${formatRp(g_deposit)}`;
  document.getElementById('build-due').textContent = `${cSym} ${formatRp(g_due)}`;

  // Terbilang
  if (curr === 'IDR') {
    document.getElementById('p-terbilang').textContent = `# ${terbilang(g_due)} rupiah`;
  } else {
    document.getElementById('p-terbilang').textContent = '';
  }
  
  // Style hack to make inputs in A4 printable view look like text when printing
  const style = document.createElement('style');
  style.innerHTML = `@media print { .no-print { display:none !important; } .print-only { display:inline !important; } } @media screen { .print-only { display:none !important; } }`;
  document.head.appendChild(style);
}

// ---------- NAV & TABS ----------
let curStep = 1;
function prevStep() {
  if (curStep > 1) {
    document.getElementById(`step-${curStep}`).classList.remove('active');
    document.getElementById(`tab-${curStep}`).classList.remove('active');
    curStep--;
    document.getElementById(`step-${curStep}`).classList.add('active');
    document.getElementById(`tab-${curStep}`).classList.add('active');
  }
  updateNavBtns();
}

function nextStep() {
  if (curStep === 2) {
    if (!validateInvNo()) return alert('Invalid Invoice Number');
    if (selectedAwbs.length === 0 && serviceLines.length === 0) return alert('Select at least one AWB or add a service');
  }
  if (curStep < 3) {
    document.getElementById(`step-${curStep}`).classList.remove('active');
    document.getElementById(`tab-${curStep}`).classList.remove('active');
    curStep++;
    document.getElementById(`step-${curStep}`).classList.add('active');
    document.getElementById(`tab-${curStep}`).classList.add('active');
  }
  updateNavBtns();
}

function updateNavBtns() {
  document.getElementById('btn-back').disabled = curStep === 1;
  document.getElementById('btn-next').style.display = curStep === 3 ? 'none' : 'block';
}

function resetFlow() {
  curStep = 1;
  currentCustomer = null;
  currentAwbs = [];
  selectedAwbs = [];
  document.getElementById('search-customer').value = '';
  document.getElementById('customer-results').innerHTML = '';
  document.querySelectorAll('.step-panel').forEach(e=>e.classList.remove('active'));
  document.querySelectorAll('.progress-tab').forEach(e=>e.classList.remove('active'));
  document.getElementById('step-1').classList.add('active');
  document.getElementById('tab-1').classList.add('active');
  updateNavBtns();
  updatePreview();
}

// ---------- GENERATE API & PDF ----------
async function generateInvoice() {
  const btn = document.getElementById('btn-generate');
  const errEl = document.getElementById('generate-error');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  errEl.style.display = 'none';

  // Construct payload
  let order = 0;
  const plineItems = selectedAwbs.map(a => ({
    awb_id: a.id,
    line_type: 'awb',
    sort_order: ++order,
    origin: a.origin, destination: a.destination,
    shipment_date: a.shipment_date,
    awb_number: a.awb_number, flight_number: a.flight_number,
    pieces: a.pieces, chargeable_weight: a.chargeable_weight,
    description: null,
    price_per_kg: a.price_per_kg, flat_amount: null,
    line_total: a.line_total
  })).concat(serviceLines.map(s => ({
    awb_id: null,
    line_type: 'service',
    sort_order: ++order,
    description: s.description,
    price_per_kg: null, flat_amount: s.amount,
    line_total: s.amount
  })));

  const pdeducts = deductionLines.map((d,i) => ({
    description: d.description,
    amount: d.amount,
    sort_order: i+1
  }));

  const payload = {
    awb_ids: selectedAwbs.map(a=>a.id),
    invoice_number: document.getElementById('inv-no').value,
    currency: document.getElementById('inv-currency').value,
    subtotal: g_subtotal,
    total_pengurangan: g_deductions,
    net_amount: g_net,
    vat_enabled: document.getElementById('inv-vat').checked,
    vat_amount: g_vat,
    total: g_total,
    deposit_amount: g_deposit,
    amount_due: g_due,
    deductions: pdeducts,
    line_items: plineItems,
    invoice_date: document.getElementById('inv-date').value,
    due_date: document.getElementById('inv-due').value || null,
    payment_terms: document.getElementById('inv-terms').value,
    bank_account: document.getElementById('inv-bank').value
  };

  try {
    const res = await api('awbs-mark-invoiced', 'PATCH', payload);
    btn.textContent = 'Generating PDF...';
    
    // PDF Generation
    const element = document.getElementById('invoice-sheet');
    // Hide inputs before print
    const inputs = element.querySelectorAll('input:not([type=checkbox]), select');
    const placeholders = [];
    inputs.forEach(el => {
      const span = document.createElement('span');
      span.textContent = el.value || '';
      if(el.style.textAlign==='right') span.style.cssFloat='right';
      el.parentNode.insertBefore(span, el);
      placeholders.push({el, span});
      el.style.display = 'none';
    });

    const pdfFileName = `${payload.invoice_number.replace(/\//g,'_')}.pdf`;
    const opt = {
      margin:       0,
      filename:     pdfFileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate PDF blob for both download AND cloud upload
    const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
    
    // Trigger browser download
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = pdfFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl);

    // Restore inputs
    placeholders.forEach(p => {
      p.el.style.display = '';
      p.span.remove();
    });

    // Upload PDF to cloud storage (non-blocking)
    btn.textContent = 'Saving to cloud...';
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        await api('invoices-upload-pdf', 'POST', {
          invoice_id: res.invoice_id,
          file_name: pdfFileName,
          file_data: base64
        });
      };
      reader.readAsDataURL(pdfBlob);
    } catch(uploadErr) {
      console.warn('Cloud upload failed (PDF saved locally):', uploadErr);
    }

    btn.textContent = 'Success!';
    btn.classList.add('btn-outline');
    btn.classList.remove('btn-primary');
    btn.style.borderColor = 'var(--green)';
    btn.style.color = 'var(--green)';
    
    // Show success screen
    const step3 = document.getElementById('step-3');
    step3.innerHTML = `
      <div style="text-align:center;padding:40px 0">
        <div style="width:64px;height:64px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style="font-size:1.5rem;margin-bottom:8px">Invoice Generated!</h2>
        <p style="margin-bottom:32px;color:var(--text-muted)">Invoice <strong>${payload.invoice_number}</strong> has been saved to your system and cloud storage. PDF downloaded.</p>
        <div style="display:flex;flex-direction:column;gap:12px;max-width:240px;margin:0 auto">
          <button class="btn btn-primary" onclick="window.location.reload()">+ Create Another</button>
          <a href="/admin.html" class="btn btn-outline">Go to Dashboard</a>
        </div>
      </div>
    `;

  } catch(err) {
    errEl.textContent = 'Save Failed: ' + err.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Save & Download PDF';
  }
}

// ---------- TERBILANG (Indonesian Number to Words) ----------
function terbilang(uang) {
  uang = Math.floor(Math.abs(uang));
  if (uang === 0) return 'nol';
  
  const angka = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  let res = "";

  if (uang < 12) res = " " + angka[uang];
  else if (uang < 20) res = terbilang(uang - 10) + " belas";
  else if (uang < 100) res = terbilang(Math.floor(uang / 10)) + " puluh" + terbilang(uang % 10);
  else if (uang < 200) res = " seratus" + terbilang(uang - 100);
  else if (uang < 1000) res = terbilang(Math.floor(uang / 100)) + " ratus" + terbilang(uang % 100);
  else if (uang < 2000) res = " seribu" + terbilang(uang - 1000);
  else if (uang < 1000000) res = terbilang(Math.floor(uang / 1000)) + " ribu" + terbilang(uang % 1000);
  else if (uang < 1000000000) res = terbilang(Math.floor(uang / 1000000)) + " juta" + terbilang(uang % 1000000);
  else if (uang < 1000000000000) res = terbilang(Math.floor(uang / 1000000000)) + " miliar" + terbilang(uang % 1000000000);
  else if (uang < 1000000000000000) res = terbilang(Math.floor(uang / 1000000000000)) + " triliun" + terbilang(uang % 1000000000000);
  
  return res.trim();
}
