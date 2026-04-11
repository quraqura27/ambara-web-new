// Client-side PDF Generation Engine for Sales Assets
// Uses html2pdf.js to synthesize the DOM into an official Case Study

async function downloadBlogPDF() {
  const isID = window.location.pathname.includes('/id/');
  const postContainer = document.querySelector('.prose'); // The core content block
  const titleEl = document.querySelector('h1');
  const authorEl = document.querySelector('.container > div:nth-child(4) > div:nth-child(2) > div:nth-child(1)');
  const dateEl = document.querySelector('.container > div:nth-child(4) > div:nth-child(2) > div:nth-child(2)');
  
  if (!postContainer || !titleEl) {
    alert(isID ? 'Konten tidak dapat dimuat' : 'Content could not be loaded.');
    return;
  }

  // 1. Create a synthetic Off-DOM wrapper for the PDF Print
  const pdfWrapper = document.createElement('div');
  pdfWrapper.style.position = 'absolute';
  pdfWrapper.style.top = '-9999px';
  pdfWrapper.style.left = '-9999px';
  pdfWrapper.style.width = '800px';
  pdfWrapper.style.padding = '40px';
  pdfWrapper.style.background = '#ffffff';
  pdfWrapper.style.color = '#111827';
  pdfWrapper.style.fontFamily = 'Inter, sans-serif';
  
  // 2. Build the Official Corporate Letterhead
  const letterhead = `
    <div style="border-bottom:3px solid #1122ee; padding-bottom: 20px; margin-bottom: 30px; display:flex; justify-content:space-between; align-items:flex-end;">
      <div>
        <h2 style="margin:0; color:#1122ee; font-weight:900; font-family:'Plus Jakarta Sans', sans-serif;">AMBARA GLOBALTRANS</h2>
        <div style="font-size:0.875rem; color:#6b7280; margin-top:4px;">Official Lartas & Customs Clearances. ISO 9001:2015</div>
      </div>
      <div style="text-align:right; font-size:0.875rem; color:#6b7280;">
        <strong>AFTER-ACTION REPORT</strong><br>
        Date: ${dateEl ? dateEl.textContent : new Date().toLocaleDateString()}
      </div>
    </div>
  `;

  // 3. Clone and clean the content
  const contentClone = postContainer.cloneNode(true);
  
  // Clean up styles for PDF renderer (remove dark mode constraints, force black text)
  contentClone.querySelectorAll('*').forEach(el => {
    el.style.color = '#1f2937';
    if (el.tagName === 'H2' || el.tagName === 'H3') {
      el.style.color = '#111827';
      el.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    }
  });

  // 4. Assemble the final synthetic HTML
  pdfWrapper.innerHTML = `
    ${letterhead}
    <h1 style="font-size: 2rem; margin-bottom: 24px; font-family:'Plus Jakarta Sans', sans-serif; color:#111827;">${titleEl.textContent}</h1>
    <div style="font-size: 1rem; line-height: 1.6;">
      ${contentClone.innerHTML}
    </div>
    <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #4b5563; font-size: 0.875rem;">
      <strong>Ready to bypass Red Lanes?</strong><br>
      WhatsApp our expert team directly at +62 812-9999-8888 or visit ambaraartha.com
    </div>
  `;

  document.body.appendChild(pdfWrapper);

  // 5. Fire html2pdf 
  const currentTitle = document.title.split('—')[0].trim().replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `Ambara-CaseStudy-${currentTitle}.pdf`;

  const opt = {
    margin:       [40, 40, 40, 40], // Top, Left, Bottom, Right margin
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
  };

  try {
    const btn = document.getElementById('pdf-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div style="width:16px;height:16px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin-right:8px;display:inline-block"></div> Generating...';
    btn.style.pointerEvents = 'none';

    await html2pdf().set(opt).from(pdfWrapper).save();

    // Reset UI
    btn.innerHTML = originalText;
    btn.style.pointerEvents = 'auto';
  } catch (error) {
    console.error("PDF Generation failed", error);
    alert('PDF Generation failed. Please try again.');
  } finally {
    document.body.removeChild(pdfWrapper);
  }
}
