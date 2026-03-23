const indexHtml = `<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>PT Ambara Artha Globaltrans | Air Freight Indonesia</title>
<meta name="description" content="PT Ambara Artha Globaltrans — Indonesia air freight specialist based at Soekarno-Hatta Airport. Real-time cargo tracking, customs clearance, and global delivery."/>
<meta property="og:title" content="PT Ambara Artha Globaltrans | Air Freight Indonesia"/>
<meta property="og:description" content="Specialized air freight forwarding from Indonesia. Track your cargo in real time."/>
<link rel="canonical" href="https://ambaraartha.com/"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config = {
    darkMode:"class",
    theme:{extend:{
      colors:{"primary":"#1122EE","background":"#0B0E14","surface":"#10131A","surface-variant":"#1A1F29","surface-container-low":"#10131a","surface-container":"#1a1c22","surface-container-high":"#282a2f","on-background":"#FFFFFF","on-surface":"#FFFFFF","on-surface-variant":"#94A3B8","outline":"#334155","outline-variant":"#454557","accent":"#9FA7FF","tertiary":"#e9c400","error":"#ffb4ab"},
      fontFamily:{"headline":["Plus Jakarta Sans"],"body":["Inter"],"label":["Plus Jakarta Sans"]},
      borderRadius:{"DEFAULT":"0.125rem","lg":"0.25rem","xl":"0.5rem","full":"0.75rem"}
    }}
  }
</script>
<style>
  .material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24;}
  .hero-glow{background:radial-gradient(circle at 50% 50%,rgba(17,34,238,0.15) 0%,transparent 70%);}
  /* Tracking result styles */
  .tl-item{display:flex;gap:10px;margin-bottom:14px;align-items:flex-start}
  .tl-dot-r{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;flex-shrink:0}
  .tl-dot-r.done{background:rgba(26,122,74,.2);color:#4ade80}
  .tl-dot-r.active{background:rgba(17,34,238,.2);color:#9FA7FF}
  .tl-dot-r.pending{background:rgba(255,255,255,.05);color:#475569}
  .tl-left-r{display:flex;flex-direction:column;align-items:center}
  .tl-line-r{width:1px;background:rgba(255,255,255,.08);flex:1;margin-left:11px;min-height:10px}
  .doc-chip-r{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:5px 10px;border-radius:0.5rem;font-size:.75rem;color:#94A3B8;margin:3px}
  .status-badge-r{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:100px;font-size:.72rem;font-weight:700;letter-spacing:.04em;}
  .s-in-transit{background:rgba(233,196,0,.1);color:#e9c400;}
  .s-delivered{background:rgba(26,122,74,.15);color:#4ade80;}
  .s-pending{background:rgba(17,34,238,.15);color:#9FA7FF;}
  .s-dot{width:5px;height:5px;border-radius:50%;background:currentColor}
</style>
</head>
<body class="bg-[#0B0E14] text-white font-body selection:bg-primary/30">

<!-- NAV -->
<nav class="fixed top-0 w-full z-50 bg-slate-900/60 backdrop-blur-3xl shadow-[0_20px_50px_rgba(159,167,255,0.05)]">
<div class="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
  <a href="index.html" class="text-xl font-bold tracking-tighter text-white uppercase font-headline">Ambara Artha</a>
  <div class="hidden md:flex items-center space-x-8">
    <a class="text-accent border-b-2 border-accent pb-1 font-headline text-sm tracking-wide uppercase font-semibold" href="index.html">Track Shipment</a>
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="services.html">Services</a>
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="about.html">About Us</a>
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="contact.html">Contact</a>
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="blog.html">Blog</a>
  </div>
  <a href="quote.html" class="bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-all active:scale-95 text-sm uppercase tracking-wider">Get a Quote</a>
</div>
</nav>

<!-- HERO -->
<section class="relative pt-40 pb-24 px-6 lg:px-12 overflow-hidden hero-glow" id="tracking">
<div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
  <div class="lg:col-span-7 z-10">
    <span class="inline-block py-1.5 px-4 mb-8 rounded-full bg-primary/20 text-accent text-[11px] font-bold uppercase tracking-[0.2em] font-label border border-primary/30">
      Air Freight Specialist · Est. 2025 · CGK
    </span>
    <h1 class="text-5xl lg:text-8xl font-black font-headline text-white leading-[1.05] mb-8 tracking-tighter">
      Secure way for<br/><span class="text-primary">global delivery.</span>
    </h1>
    <p class="text-xl text-slate-400 max-w-xl mb-12 leading-relaxed">
      Indonesia's air freight specialist based at Soekarno-Hatta Airport. 40+ years of combined expertise. Track your cargo in real time.
    </p>
    <!-- Tracking Widget -->
    <div class="p-1.5 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-w-2xl flex flex-col md:flex-row gap-2 mb-4">
      <div class="flex-grow flex items-center px-5 bg-slate-900/80 rounded-xl border border-white/5">
        <span class="material-symbols-outlined text-primary mr-3">flight_takeoff</span>
        <input id="trackInput" class="w-full bg-transparent border-none focus:ring-0 text-white font-medium py-5 placeholder-slate-500 outline-none" placeholder="Enter tracking number (AAG-XXXX-XXXXX)..." type="text"/>
      </div>
      <button onclick="trackShipment()" class="bg-primary hover:bg-blue-600 text-white px-10 py-5 rounded-xl font-black transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(17,34,238,0.4)] hover:shadow-[0_0_40px_rgba(17,34,238,0.6)]">
        TRACK NOW <span class="material-symbols-outlined text-lg">arrow_forward</span>
      </button>
    </div>
    <div class="flex gap-2 flex-wrap mb-2">
      <span class="text-slate-500 text-xs uppercase tracking-wider font-headline self-center">Try:</span>
      <button onclick="loadSample('AAG-2025-00382')" class="text-accent hover:text-white text-xs border border-white/10 px-3 py-1.5 rounded-lg font-headline hover:border-accent transition-all">AAG-2025-00382</button>
      <button onclick="loadSample('AAG-2025-00591')" class="text-accent hover:text-white text-xs border border-white/10 px-3 py-1.5 rounded-lg font-headline hover:border-accent transition-all">AAG-2025-00591</button>
    </div>

    <!-- TRACKING RESULT -->
    <div id="result" style="display:none;" class="mt-4 bg-[#10131a] border border-white/10 rounded-2xl p-6 max-w-2xl">
      <div id="trackingLoading" style="display:none;" class="text-center py-6 text-accent font-headline text-sm animate-pulse">⏳ Looking up shipment...</div>
      <div id="trackingNotFound" style="display:none;" class="text-center py-6 text-slate-500 font-headline text-sm">No shipment found. Check your tracking number.</div>
      <div id="trackingError" style="display:none;" class="text-center py-6 text-red-400 font-headline text-sm">Connection error. Please try again.</div>
      <div id="trackingData" style="display:none;">
        <div class="flex justify-between items-start mb-4 pb-4 border-b border-white/5">
          <div>
            <div id="res-id" class="font-headline text-xs text-slate-500 uppercase tracking-widest mb-1"></div>
            <div id="res-title" class="font-headline font-bold text-white text-lg"></div>
            <div id="res-route" class="font-headline text-xs text-accent mt-1"></div>
          </div>
          <div id="res-status" class="status-badge-r"></div>
        </div>
        <div id="res-timeline" class="mb-3"></div>
        <div class="pt-3 border-t border-white/5 font-headline text-xs text-slate-500 uppercase tracking-wider mb-2">Documents</div>
        <div id="res-docs-list"></div>
      </div>
    </div>
  </div>

  <div class="lg:col-span-5 relative hidden lg:block">
    <div class="relative rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10">
      <img alt="Air cargo operations at Soekarno-Hatta Airport" class="w-full h-[550px] object-cover opacity-80" src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80"/>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent"></div>
    </div>
    <!-- PPJK Floating Card -->
    <div class="absolute -bottom-8 -left-8 bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-[240px] backdrop-blur-xl">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
          <span class="material-symbols-outlined">verified</span>
        </div>
        <span class="font-black text-sm uppercase tracking-widest text-white">PPJK Licensed</span>
      </div>
      <p class="text-xs text-slate-400 leading-normal">Certified customs clearance at major Indonesian gateways.</p>
    </div>
  </div>
</div>
</section>

<!-- STATS BAR -->
<section class="bg-[#10131A] py-16 px-6 border-y border-white/5">
<div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
  <div class="text-center group">
    <div class="text-4xl lg:text-5xl font-black text-white font-headline mb-2 group-hover:text-primary transition-colors"><span id="statTonnage">—</span><span class="text-accent text-3xl">kg</span></div>
    <div class="text-accent text-[11px] font-bold uppercase tracking-[0.2em] font-label">Tonnage Shipped</div>
  </div>
  <div class="text-center group">
    <div class="text-4xl lg:text-5xl font-black text-white font-headline mb-2 group-hover:text-primary transition-colors">52<span class="text-accent">+</span></div>
    <div class="text-accent text-[11px] font-bold uppercase tracking-[0.2em] font-label">Countries Covered</div>
  </div>
  <div class="text-center group">
    <div class="text-4xl lg:text-5xl font-black text-white font-headline mb-2 group-hover:text-primary transition-colors"><span id="statOnTime">—</span></div>
    <div class="text-accent text-[11px] font-bold uppercase tracking-[0.2em] font-label">On-Time Rate</div>
  </div>
  <div class="text-center group">
    <div class="text-4xl lg:text-5xl font-black text-white font-headline mb-2 group-hover:text-primary transition-colors">24<span class="text-accent">/7</span></div>
    <div class="text-accent text-[11px] font-bold uppercase tracking-[0.2em] font-label">Support Availability</div>
  </div>
</div>
</section>

<!-- SERVICES -->
<section class="py-32 px-6 bg-[#0B0E14]">
<div class="max-w-7xl mx-auto">
  <div class="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
    <div class="max-w-2xl">
      <span class="text-primary font-black text-xs uppercase tracking-[0.3em] mb-4 block">Our Expertise</span>
      <h2 class="text-4xl lg:text-6xl font-black font-headline text-white tracking-tighter">Full-Spectrum Air Logistics</h2>
    </div>
    <p class="text-slate-400 max-w-sm text-lg leading-relaxed">Air freight specialists from CGK to the world. 40+ years of combined management expertise.</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div class="group p-10 bg-[#10131A] border border-white/5 rounded-2xl transition-all hover:bg-[#1A1F29] hover:border-primary/30 cursor-default">
      <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        <span class="material-symbols-outlined text-3xl">flight_takeoff</span>
      </div>
      <h3 class="text-2xl font-black mb-4 font-headline uppercase tracking-tight">Air Freight</h3>
      <p class="text-slate-400 text-base leading-relaxed">Express and standard air cargo from Soekarno-Hatta to destinations worldwide. Our core expertise.</p>
    </div>
    <div class="group p-10 bg-[#1A1F29] border border-primary/20 rounded-2xl shadow-[0_0_40px_rgba(17,34,238,0.1)] transition-all hover:shadow-[0_0_60px_rgba(17,34,238,0.2)] cursor-default">
      <div class="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-all duration-300">
        <span class="material-symbols-outlined text-3xl">gavel</span>
      </div>
      <h3 class="text-2xl font-black mb-4 font-headline uppercase tracking-tight">Customs Clearance</h3>
      <p class="text-slate-300 text-base leading-relaxed">PPJK-licensed specialists for all import/export clearance at Indonesian airports and ports.</p>
    </div>
    <div class="group p-10 bg-[#10131A] border border-white/5 rounded-2xl transition-all hover:bg-[#1A1F29] hover:border-primary/30 cursor-default">
      <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        <span class="material-symbols-outlined text-3xl">query_stats</span>
      </div>
      <h3 class="text-2xl font-black mb-4 font-headline uppercase tracking-tight">Real-Time Tracking</h3>
      <p class="text-slate-400 text-base leading-relaxed">Live AWB updates at every checkpoint. Full shipment visibility from CGK to destination.</p>
    </div>
    <div class="group p-10 bg-[#10131A] border border-white/5 rounded-2xl transition-all hover:bg-[#1A1F29] hover:border-primary/30 cursor-default">
      <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        <span class="material-symbols-outlined text-3xl">search</span>
      </div>
      <h3 class="text-2xl font-black mb-4 font-headline uppercase tracking-tight">Sourcing & Procurement</h3>
      <p class="text-slate-400 text-base leading-relaxed">Connecting overseas buyers with Indonesian suppliers. End-to-end from factory to flight.</p>
    </div>
    <div class="group p-10 bg-[#10131A] border border-white/5 rounded-2xl transition-all hover:bg-[#1A1F29] hover:border-primary/30 cursor-default">
      <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        <span class="material-symbols-outlined text-3xl">security</span>
      </div>
      <h3 class="text-2xl font-black mb-4 font-headline uppercase tracking-tight">Cargo Insurance</h3>
      <p class="text-slate-400 text-base leading-relaxed">All-risk air cargo coverage. Certificate issued same day. Simple and fast claims process.</p>
    </div>
    <div class="group p-10 bg-[#10131A] border border-white/5 rounded-2xl transition-all hover:bg-[#1A1F29] hover:border-primary/30 cursor-default">
      <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        <span class="material-symbols-outlined text-3xl">local_shipping</span>
      </div>
      <h3 class="text-2xl font-black mb-4 font-headline uppercase tracking-tight">Land Transport</h3>
      <p class="text-slate-400 text-base leading-relaxed">Airport to door delivery across Indonesia. GPS-tracked, same-day available in Tangerang/Jakarta.</p>
    </div>
  </div>
</div>
</section>

<!-- CTA -->
<section class="py-24 px-6 bg-[#0B0E14]">
<div class="max-w-7xl mx-auto relative bg-primary rounded-[2rem] p-12 lg:p-24 overflow-hidden text-center shadow-[0_0_100px_rgba(17,34,238,0.3)]">
  <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
  <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]"></div>
  <h2 class="text-4xl lg:text-7xl font-black font-headline text-white mb-8 relative z-10 tracking-tighter">Ready to ship<br/>from Indonesia?</h2>
  <p class="text-white/80 text-xl max-w-2xl mx-auto mb-14 relative z-10 leading-relaxed font-medium">Our team at Soekarno-Hatta Airport is ready to handle your next shipment. 40+ years of air freight expertise.</p>
  <div class="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
    <a href="quote.html" class="bg-white text-primary px-12 py-5 rounded-xl font-black hover:scale-105 transition-all shadow-2xl uppercase tracking-widest">Get a Free Quote</a>
    <a href="contact.html" class="bg-transparent border-2 border-white text-white px-12 py-5 rounded-xl font-black hover:bg-white hover:text-primary transition-all uppercase tracking-widest">Contact Us</a>
  </div>
</div>
</section>

<!-- FOOTER -->
<footer class="bg-[#0b0e14] w-full pt-20 pb-10 border-t border-white/5">
<div class="bg-[#10131a]">
<div class="grid grid-cols-2 md:grid-cols-4 gap-12 px-12 max-w-7xl mx-auto py-16">
  <div class="col-span-2 md:col-span-1">
    <div class="text-2xl font-black text-white mb-6 font-headline uppercase tracking-tighter">Ambara Artha</div>
    <p class="text-slate-500 text-sm leading-relaxed mb-6">PT Ambara Artha Globaltrans — Your secure way for global delivery. Est. 2025, Soekarno-Hatta Airport.</p>
    <a href="https://wa.me/6282125452800" target="_blank" class="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#25D366]/20 transition-all">
      <span class="material-symbols-outlined text-sm">chat</span> WhatsApp Us
    </a>
  </div>
  <div>
    <h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-6 font-bold">Services</h4>
    <ul class="space-y-3">
      <li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="services.html">Air Freight</a></li>
      <li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="services.html">Customs Clearance</a></li>
      <li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="services.html">Land Transport</a></li>
      <li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="services.html">Cargo Insurance</a></li>
      <li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="services.html">Sourcing &amp; Procurement</a></li>
    </ul>
  </div>
  <div>
    <h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-6 font-bold">Company</h4>
    <ul class="space-y-3">
      <li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="about.html">About Us</a></li>
      <li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="network.html">Network</a></li>
      <li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="blog.html">Blog</a></li>
      <li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="quote.html">Get a Quote</a></li>
    </ul>
  </div>
  <div>
    <h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-6 font-bold">Contact</h4>
    <div class="space-y-3 text-xs font-headline uppercase tracking-wider text-slate-500">
      <p class="flex items-start gap-3"><span class="material-symbols-outlined text-sm text-primary">location_on</span>Cargo Terminal, Soekarno-Hatta Airport, Tangerang</p>
      <p class="flex items-center gap-3"><span class="material-symbols-outlined text-sm text-primary">mail</span><a href="/cdn-cgi/l/email-protection#f59686b59498979487949487819d94db969a98" class="hover:text-accent"><span class="__cf_email__" data-cfemail="93f0e0d3f2fef1f2e1f2f2e1e7fbf2bdf0fcfe">[email&#160;protected]</span></a></p>
      <p class="flex items-center gap-3 text-[#25D366] font-bold"><span class="material-symbols-outlined text-sm">chat</span><p class="flex items-center gap-3"><span class="material-symbols-outlined text-sm text-primary">mail</span><a href="/cdn-cgi/l/email-protection#22415162434f404350434350564a430c414d4f" class="hover:text-accent"><span class="__cf_email__" data-cfemail="0f6c7c4f6e626d6e7d6e6e7d7b676e216c6062">[email&#160;protected]</span></a></p>
      <a href="https://wa.me/6282125452800">+62 821-2545-2800</a></p>
      <p class="flex items-center gap-3"><span class="material-symbols-outlined text-sm text-primary">schedule</span>24 Hours · 7 Days</p>
    </div>
  </div>
</div>
</div>
<div class="max-w-7xl mx-auto px-12 flex flex-col md:flex-row justify-between items-center gap-6 py-6">
  <p class="text-slate-600 font-headline text-[10px] uppercase tracking-[0.2em]">© 2025 PT Ambara Artha Globaltrans. All rights reserved.</p>
  
</div>
</footer>

<!-- Floating WhatsApp -->
<a href="https://wa.me/6282125452800" target="_blank" class="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform">
  <span class="material-symbols-outlined text-white text-2xl">chat</span>
</a>

<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
  // ── PUBLIC STATS ──
  async function loadPublicStats() {
    try {
      const res = await fetch("/api/public-stats");
      if (!res.ok) return;
      const d = await res.json();
      const kg = parseFloat(d.tonnage||0);
      const el1=document.getElementById("statTonnage"); if(el1) el1.textContent=kg>0?kg.toFixed(0):"0";
      const el2=document.getElementById("statOnTime"); if(el2) el2.textContent=(d.on_time_rate||100)+"%";
    } catch(e){}
  }
  loadPublicStats();

  // ── TRACKING ──
  const stateIcons={done:"✓",active:"▶",pending:"○"};
  function loadSample(id){document.getElementById("trackInput").value=id;trackShipment();}

  async function trackShipment(){
    const id=document.getElementById("trackInput").value.trim().toUpperCase();
    const resultEl=document.getElementById("result");
    const loadingEl=document.getElementById("trackingLoading");
    const notFoundEl=document.getElementById("trackingNotFound");
    const errorEl=document.getElementById("trackingError");
    const dataEl=document.getElementById("trackingData");
    if(!id)return;
    resultEl.style.display="block";
    loadingEl.style.display="block";
    notFoundEl.style.display="none";
    errorEl.style.display="none";
    dataEl.style.display="none";
    try{
      const res=await fetch(\`/api/track-shipment?id=\${encodeURIComponent(id)}\`);
      const data=await res.json();
      loadingEl.style.display="none";
      if(!res.ok||data.error){notFoundEl.style.display="block";return;}
      const{shipment,events,documents}=data;
      const statusMap={"in-transit":["s-in-transit","In Transit"],"delivered":["s-delivered","Delivered"],"pending":["s-pending","Pending"]};
      const[sCls,sLabel]=statusMap[shipment.status]||["s-pending",shipment.status];
      document.getElementById("res-id").textContent=shipment.tracking_number;
      document.getElementById("res-title").textContent=shipment.title||"";
      const orig=shipment.origin_iata?\`\${shipment.origin_iata} — \${shipment.origin}\`:(shipment.origin||"");
      const dest=shipment.destination_iata?\`\${shipment.destination_iata} — \${shipment.destination}\`:(shipment.destination||"");
      document.getElementById("res-route").textContent="✈ "+orig+" → "+dest;
      const statusEl=document.getElementById("res-status");
      statusEl.className="status-badge-r "+sCls;
      statusEl.innerHTML=\`<span class="s-dot"></span>\${sLabel}\`;
      document.getElementById("res-timeline").innerHTML=events.length===0
        ?'<p class="font-headline text-xs text-slate-500">No events yet.</p>'
        :events.map(e=>\`
          <div class="tl-item">
            <div class="tl-left-r"><div class="tl-dot-r \${e.state}">\${stateIcons[e.state]||"○"}</div><div class="tl-line-r"></div></div>
            <div class="flex-1 pt-0.5">
              <div class="font-body text-sm \${e.state==="pending"?"text-slate-500":"text-white"}">\${e.label}</div>
              <div class="font-headline text-xs text-slate-500 mt-0.5">\${e.location?e.location+" · ":""}\${formatDate(e.event_time)}</div>
            </div>
          </div>\`).join("");
      document.getElementById("res-docs-list").innerHTML=documents.length===0
        ?'<p class="font-headline text-xs text-slate-500">No documents yet.</p>'
        :documents.map(d=>\`<div class="doc-chip-r">📄 \${d.name}</div>\`).join("");
      dataEl.style.display="block";dataEl.style.opacity="0";dataEl.style.transform="translateY(8px)";dataEl.style.transition="opacity .35s,transform .35s";
      setTimeout(()=>{dataEl.style.opacity="1";dataEl.style.transform="none";},10);
    }catch(err){loadingEl.style.display="none";errorEl.style.display="block";}
  }

  function formatDate(d){
    if(!d)return"";
    return new Date(d).toLocal`;

const aboutHtml = `<!DOCTYPE html>
<html class="scroll-smooth dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>About Us | PT Ambara Artha Globaltrans</title>
<meta name="description" content="PT Ambara Artha Globaltrans — established 2025, air freight specialist at CGK with 40+ years of combined advisory expertise in air cargo."/>
<link rel="canonical" href="https://ambaraartha.com/about.html"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config={darkMode:"class",theme:{extend:{colors:{"primary":"#1122EE","background":"#0B0E14","surface":"#10131A","surface-variant":"#1A1F29","surface-container-low":"#13161c","surface-container":"#1b1c1c","surface-container-high":"#2b2d31","on-background":"#FFFFFF","on-surface":"#FFFFFF","on-surface-variant":"#94A3B8","outline":"#334155","outline-variant":"#454557","accent":"#9FA7FF","tertiary":"#e9c400"},fontFamily:{"headline":["Plus Jakarta Sans"],"body":["Inter"],"label":["Inter"]},borderRadius:{"DEFAULT":"0.125rem","lg":"0.25rem","xl":"0.5rem","full":"0.75rem"}}}}
</script>
<style>
  .material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24;}
  .editorial-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:1.5rem;}
  .glass-nav{background:rgba(11,14,20,0.7);backdrop-filter:blur(40px);}
  .glass-card{background:rgba(255,255,255,0.03);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);}
  .glass-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(159,167,255,0.3);}
  .text-gradient-primary{background:linear-gradient(135deg,#9fa7ff 0%,#1122ee 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
</style>
</head>
<body class="bg-background text-on-surface font-body selection:bg-primary/30 selection:text-white overflow-x-hidden">

<nav class="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 max-w-full mx-auto glass-nav shadow-[0_20px_50px_rgba(159,167,255,0.05)]">
<div class="flex justify-between items-center w-full max-w-7xl mx-auto">
  <a href="index.html" class="text-xl font-bold tracking-tighter text-white uppercase font-headline">Ambara Artha</a>
  <div class="hidden md:flex items-center gap-8">
    <a class="text-slate-400 hover:text-white transition-colors font-semibold text-sm tracking-wide uppercase font-headline" href="index.html">Track Shipment</a>
    <a class="text-slate-400 hover:text-white transition-colors font-semibold text-sm tracking-wide uppercase font-headline" href="services.html">Services</a>
    <a class="text-accent border-b-2 border-accent pb-1 font-semibold text-sm tracking-wide uppercase font-headline" href="about.html">About Us</a>
    <a class="text-slate-400 hover:text-white transition-colors font-semibold text-sm tracking-wide uppercase font-headline" href="contact.html">Contact</a>
    <a class="text-slate-400 hover:text-white transition-colors font-semibold text-sm tracking-wide uppercase font-headline" href="blog.html">Blog</a>
  </div>
  <a href="quote.html" class="bg-gradient-to-br from-primary to-blue-900 text-white px-6 py-2.5 rounded-md font-semibold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase tracking-wider">Get a Quote</a>
</div>
</nav>

<main class="pt-32">
<!-- HERO -->
<section class="px-6 py-20 max-w-7xl mx-auto">
  <div class="editorial-grid">
    <div class="col-span-12 md:col-span-7">
      <span class="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-6 block">Est. 2025 · CGK Cargo Terminal</span>
      <h1 class="text-5xl md:text-7xl leading-[1.1] font-headline font-bold text-white mb-8">New Company. <span class="text-gradient-primary italic">Decades of Expertise.</span></h1>
      <p class="text-lg text-on-surface-variant max-w-xl leading-relaxed mb-10">Based at Soekarno-Hatta International Airport Cargo Terminal — we bridge the gap between Indonesian cargo and global destinations with 40+ years of air freight expertise.</p>
      <div class="flex gap-4 flex-wrap">
        <a href="quote.html" class="px-8 py-4 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 transition-all duration-300 uppercase tracking-wider">Get a Quote</a>
        <a href="contact.html" class="px-8 py-4 border border-white/20 text-white font-bold rounded-lg hover:bg-white/5 transition-all uppercase tracking-wider">Contact Us</a>
      </div>
    </div>
    <div class="col-span-12 md:col-span-5 relative mt-12 md:mt-0">
      <div class="aspect-[4/5] rounded-xl overflow-hidden shadow-2xl relative">
        <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
        <img class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Air cargo operations at Soekarno-Hatta Airport" src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80"/>
      </div>
      <div class="absolute -bottom-6 -left-6 glass-card p-6 rounded-xl shadow-2xl z-20">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"><span class="material-symbols-outlined text-primary">location_on</span></div>
          <div>
            <p class="text-[10px] text-primary uppercase font-bold tracking-widest">Home Base</p>
            <p class="text-lg font-bold text-white">CGK Cargo Terminal</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- STATS -->
<section class="bg-surface-container-low py-16 border-y border-white/5">
  <div class="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
    <div class="text-center">
      <span class="text-5xl font-black text-white font-headline block mb-2">2025</span>
      <div class="h-[2px] w-8 bg-primary mx-auto mb-3"></div>
      <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Year Established</p>
    </div>
    <div class="text-center">
      <span class="text-5xl font-black text-white font-headline block mb-2">40<span class="text-accent">+</span></span>
      <div class="h-[2px] w-8 bg-primary mx-auto mb-3"></div>
      <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Years Advisor Experience</p>
    </div>
    <div class="text-center">
      <span class="text-5xl font-black text-white font-headline block mb-2">52<span class="text-accent">+</span></span>
      <div class="h-[2px] w-8 bg-primary mx-auto mb-3"></div>
      <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Countries Covered</p>
    </div>
    <div class="text-center">
      <span class="text-5xl font-black text-white font-headline block mb-2">24<span class="text-accent">/7</span></span>
      <div class="h-[2px] w-8 bg-primary mx-auto mb-3"></div>
      <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Customer Support</p>
    </div>
  </div>
</section>

<!-- STORY -->
<section class="bg-surface-container-low py-32 border-b border-white/5">
<div class="max-w-7xl mx-auto px-6">
<div class="grid grid-cols-1 md:grid-cols-2 gap-24 items-start">
  <div class="space-y-8">
    <div class="group relative">
      <div class="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
      <div class="relative p-8 glass-card rounded-2xl">
        <h3 class="text-2xl font-headline font-bold mb-4 text-white">Our Story</h3>
        <p class="text-on-surface-variant leading-relaxed">PT Ambara Artha Globaltrans was established in 2025 with a clear mission: to make international air freight forwarding simple, transparent, and reliable for Indonesian businesses of all sizes. While we are a new company, we are built on extraordinary experience.</p>
      </div>
    </div>
    <div class="group relative">
      <div class="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
      <div class="relative p-8 glass-card rounded-2xl">
        <h3 class="text-2xl font-headline font-bold mb-4 text-accent">Our Mission</h3>
        <p class="text-on-surface-variant leading-relaxed">To empower Indonesian businesses through secure, transparent, and high-velocity global air delivery. We ensure every air cargo shipment is handled with precision and care — from CGK to the world.</p>
      </div>
    </div>
    <div class="group relative">
      <div class="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
      <div class="relative p-8 glass-card rounded-2xl">
        <h3 class="text-2xl font-headline font-bold mb-4 text-white">Our Values</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3 text-sm text-on-surface"><span class="material-symbols-outlined text-primary text-lg">check_circle</span><span><strong class="text-white">Precision</strong> — Aviation-grade attention to every detail</span></div>
          <div class="flex items-center gap-3 text-sm text-on-surface"><span class="material-symbols-outlined text-primary text-lg">check_circle</span><span><strong class="text-white">Transparency</strong> — Real-time tracking and honest communication</span></div>
          <div class="flex items-center gap-3 text-sm text-on-surface"><span class="material-symbols-outlined text-primary text-lg">check_circle</span><span><strong class="text-white">Partnership</strong> — Long-term relationships, not just transactions</span></div>
        </div>
      </div>
    </div>
  </div>
  <div>
    <div class="flex items-center gap-4 mb-8">
      <div class="h-[1px] w-12 bg-primary"></div>
      <span class="text-xs font-bold uppercase tracking-[0.3em] text-primary">The Air Freight Specialist</span>
    </div>
    <h2 class="text-4xl font-headline font-bold text-white mb-8 leading-tight">Built on decades of air freight expertise.</h2>
    <p class="text-on-surface-variant mb-8 leading-relaxed text-lg">Our management team and advisory board bring over <strong class="text-white">40+ years of combined expertise</strong> in air freight cargo operations. We know the airlines, the routes, the regulations, and the relationships that make global air logistics work.</p>
    <p class="text-on-surface-variant mb-12 leading-relaxed">Based at Soekarno-Hatta International Airport Cargo Terminal, we have direct access to all major international airlines. Your cargo can move on the next available flight — not the next available day.</p>
    <div class="grid grid-cols-2 gap-8">
      <div>
        <span class="text-4xl font-bold font-headline text-white block mb-2">CGK</span>
        <div class="h-[2px] w-8 bg-primary mb-4"></div>
        <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Home Base Airport</p>
      </div>
      <div>
        <span class="text-4xl font-bold font-headline text-white block mb-2">24/7</span>
        <div class="h-[2px] w-8 bg-primary mb-4"></div>
        <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Always Operational</p>
      </div>
    </div>
  </div>
</div>
</div>
</section>

<!-- CONTACT INFO -->
<section class="py-32 px-6 bg-surface-container-low">
<div class="max-w-7xl mx-auto">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
  <div>
    <h2 class="text-5xl font-headline font-bold mb-8 text-white">Let's connect your <span class="text-accent italic">Business.</span></h2>
    <div class="space-y-10">
      <div class="flex items-start gap-6 group">
        <div class="w-14 h-14 glass-card rounded-xl flex items-center justify-center group-hover:border-primary/50 transition-colors flex-shrink-0">
          <span class="material-symbols-outlined text-primary">mail</span>
        </div>
        <div>
          <p class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Email</p>
          <a href="/cdn-cgi/l/email-protection#ddbeae9dbcb0bfbcafbcbcafa9b5bcf3beb2b0" class="text-xl font-semibold text-white hover:text-accent transition-colors"><span class="__cf_email__" data-cfemail="5a39291a3b37383b283b3b282e323b74393537">[email&#160;protected]</span></a>
        </div>
      </div>
      <div class="flex items-start gap-6 group">
        <div class="w-14 h-14 glass-card rounded-xl flex items-center justify-center group-hover:border-[#25D366]/50 transition-colors flex-shrink-0">
          <span class="material-symbols-outlined text-[#25D366]">chat</span>
        </div>
        <div>
          <p class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Call / WhatsApp</p>
          <a href="https://wa.me/6282125452800" class="text-xl font-semibold text-white hover:text-[#25D366] transition-colors">+62 821-2545-2800</a>
          <p class="text-sm text-on-surface-variant mt-1">24/7 Available</p>
        </div>
      </div>
      <div class="flex items-start gap-6 group">
        <div class="w-14 h-14 glass-card rounded-xl flex items-center justify-center group-hover:border-primary/50 transition-colors flex-shrink-0">
          <span class="material-symbols-outlined text-primary">location_on</span>
        </div>
        <div>
          <p class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Office Address</p>
          <p class="text-xl font-semibold text-white">Soekarno-Hatta International Airport<br/>Cargo Terminal, Jl. Cengkareng Golf Club<br/>Pajang, Benda, Tangerang, Banten</p>
        </div>
      </div>
    </div>
  </div>
  <div class="relative">
    <div class="rounded-2xl overflow-hidden shadow-2xl bg-black p-1 border border-white/10">
      <div class="w-full h-[400px] bg-slate-900 rounded-xl overflow-hidden relative">
        <img class="w-full h-full object-cover opacity-30 contrast-150 brightness-50 grayscale" alt="Soekarno-Hatta Airport Cargo Terminal" src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=60"/>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="bg-primary/90 text-white p-4 rounded-lg shadow-[0_0_30px_rgba(17,34,238,0.4)] flex items-center gap-3 backdrop-blur-md">
            <div class="w-3 h-3 bg-white rounded-full animate-ping"></div>
            <span class="font-black uppercase tracking-tighter">AMBARA HUB · CGK</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
</section>
</main>

<footer class="bg-[#0b0e14] w-full pt-20 pb-10 border-t border-white/5">
<div class="bg-[#10131a]"><div class="grid grid-cols-2 md:grid-cols-4 gap-12 px-12 max-w-7xl mx-auto py-16">
  <div class="col-span-2 md:col-span-1"><div class="text-2xl font-black text-white mb-6 font-headline uppercase tracking-tighter">Ambara Artha</div><p class="text-slate-500 text-sm leading-relaxed mb-4">PT Ambara Artha Globaltrans &mdash; Your secure way for global delivery. Est. 2025.</p><a href="https://wa.me/6282125452800" target="_blank" class="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#25D366]/20 transition-all"><span class="material-symbols-outlined text-sm">chat</span> WhatsApp Us</a></div>
  <div><h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-6 font-bold">Services</h4><ul class="space-y-3"><li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="services.html">Air Freight</a></li><li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="services.html">Customs Clearance</a></li><li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="services.html">Land Transport</a></li><li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="services.html">Sourcing &amp; Procurement</a></li></ul></div>
  <div><h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-6 font-bold">Company</h4><ul class="space-y-3"><li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="about.html">About Us</a></li><li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="network.html">Network</a></li><li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="blog.html">Blog</a></li><li><a class="text-slate-500 hover:text-accent transition-colors text-xs uppercase tracking-wider font-headline" href="quote.html">Get a Quote</a></li></ul></div>
  <div><h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-6 font-bold">Contact</h4><div class="space-y-3 text-xs font-headline uppercase tracking-wider text-slate-500"><p class="flex items-start gap-3"><span class="material-symbols-outlined text-sm text-primary">location_on</span>Cargo Terminal, CGK Airport, Tangerang</p><p class="flex items-center gap-3"><span class="material-symbols-outlined text-sm text-primary">mail</span><a href="/cdn-cgi/l/email-protection#7b18083b1a16191a091a1a090f131a55181416" class="hover:text-accent"><span class="__cf_email__" data-cfemail="9efdeddefff3fcffecffffeceaf6ffb0fdf1f3">[email&#160;protected]</span></a></p><p class="flex items-center gap-3"><span class="material-symbols-outlined text-sm text-primary">mail</span><a href="/cdn-cgi/l/email-protection#7f1c0c3f1e121d1e0d1e1e0d0b171e511c1012" class="hover:text-accent"><span class="__cf_email__" data-cfemail="bad9c9fadbd7d8dbc8dbdbc8ced2db94d9d5d7">[email&#160;protected]</span></a></p>
      <p class="flex items-center gap-3 text-[#25D366] font-bold"><span class="material-symbols-outlined text-sm">chat</span><a href="https://wa.me/6282125452800">+62 821-2545-2800</a></p></div></div>
</div></div>
<div class="max-w-7xl mx-auto px-12 flex flex-col md:flex-row justify-between items-center gap-6 py-6"><p class="text-slate-600 font-headline text-[10px] uppercase tracking-[0.2em]">&copy; 2025 PT Ambara Artha Globaltrans.</p></div>
</footer>
<a href="https://wa.me/6282125452800" target="_blank" class"fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0`;

const servicesHtml = `<!DOCTYPE html>
<html class="scroll-smooth dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Services | PT Ambara Artha Globaltrans</title>
<meta name="description" content="Air freight, customs clearance, land transport, cargo insurance and sourcing services by PT Ambara Artha Globaltrans — Indonesia air freight specialist at CGK."/>
<link rel="canonical" href="https://ambaraartha.com/services.html"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config={darkMode:"class",theme:{extend:{colors:{"primary":"#1122EE","background":"#0B0E14","surface":"#10131A","surface-variant":"#1A1F29","surface-container-low":"#13161c","surface-container":"#1b1c1c","surface-container-high":"#2b2d31","surface-container-highest":"#36393f","on-background":"#FFFFFF","on-surface":"#FFFFFF","on-surface-variant":"#94A3B8","outline":"#334155","outline-variant":"#454557","accent":"#9FA7FF","tertiary":"#e9c400"},fontFamily:{"headline":["Plus Jakarta Sans"],"body":["Inter"],"label":["Inter"]},borderRadius:{"DEFAULT":"0.125rem","lg":"0.25rem","xl":"0.5rem","full":"0.75rem"}}}}
</script>
<style>
  .material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24;}
  .editorial-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:1.5rem;}
  .glass-nav{background:rgba(11,14,20,0.7);backdrop-filter:blur(40px);}
  .glass-card{background:rgba(255,255,255,0.03);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);}
  .glass-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(159,167,255,0.3);}
  .text-gradient-primary{background:linear-gradient(135deg,#9fa7ff 0%,#1122ee 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
</style>
</head>
<body class="bg-background text-on-surface font-body selection:bg-primary/30 selection:text-white overflow-x-hidden">

<nav class="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 glass-nav shadow-[0_20px_50px_rgba(159,167,255,0.05)]">
<div class="flex justify-between items-center w-full max-w-7xl mx-auto">
  <a href="index.html" class="text-xl font-bold tracking-tighter text-white uppercase font-headline">Ambara Artha</a>
  <div class="hidden md:flex items-center gap-8">
    <a class="text-slate-400 hover:text-white transition-colors font-semibold text-sm tracking-wide uppercase font-headline" href="index.html">Track Shipment</a>
    <a class="text-accent border-b-2 border-accent pb-1 font-semibold text-sm tracking-wide uppercase font-headline" href="services.html">Services</a>
    <a class="text-slate-400 hover:text-white transition-colors font-semibold text-sm tracking-wide uppercase font-headline" href="about.html">About Us</a>
    <a class="text-slate-400 hover:text-white transition-colors font-semibold text-sm tracking-wide uppercase font-headline" href="contact.html">Contact</a>
    <a class="text-slate-400 hover:text-white transition-colors font-semibold text-sm tracking-wide uppercase font-headline" href="blog.html">Blog</a>
  </div>
  <a href="quote.html" class="bg-gradient-to-br from-primary to-blue-900 text-white px-6 py-2.5 rounded-md font-semibold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase tracking-wider">Get a Quote</a>
</div>
</nav>

<main class="pt-32">
<!-- HERO -->
<section class="px-6 py-20 max-w-7xl mx-auto">
  <div class="editorial-grid">
    <div class="col-span-12 md:col-span-7">
      <span class="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-6 block">Air Freight Specialist · CGK</span>
      <h1 class="text-5xl md:text-7xl leading-[1.1] font-headline font-bold text-white mb-8">Integrated Air <span class="text-gradient-primary italic">Logistics.</span></h1>
      <p class="text-lg text-on-surface-variant max-w-xl leading-relaxed mb-10">Based at Soekarno-Hatta International Airport — we deliver precision air freight solutions with 40+ years of combined management expertise in air cargo operations.</p>
      <div class="flex gap-4 flex-wrap">
        <a href="quote.html" class="px-8 py-4 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 transition-all">Get a Quote</a>
        <a href="contact.html" class="px-8 py-4 border border-white/20 text-white font-bold rounded-lg hover:bg-white/5 transition-all">Contact Us</a>
      </div>
    </div>
    <div class="col-span-12 md:col-span-5 relative mt-12 md:mt-0">
      <div class="aspect-[4/5] rounded-xl overflow-hidden shadow-2xl relative">
        <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
        <img class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Air cargo terminal operations" src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80"/>
      </div>
    </div>
  </div>
</section>

<!-- SERVICES BENTO -->
<section class="bg-surface-container-low py-32 border-y border-white/5">
<div class="max-w-7xl mx-auto px-6">
  <div class="mb-20 text-center md:text-left">
    <span class="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-4 block">Core Solutions</span>
    <h2 class="text-4xl font-headline font-bold text-white">Integrated Air Freight Architecture</h2>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

    <!-- Air Freight MAIN -->
    <div class="md:col-span-2 glass-card rounded-xl overflow-hidden flex flex-col md:flex-row group transition-all duration-500">
      <div class="md:w-1/2 p-10 flex flex-col justify-between">
        <div>
          <div class="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-8"><span class="material-symbols-outlined text-primary text-2xl">flight_takeoff</span></div>
          <span class="inline-block bg-primary/10 text-accent font-headline text-[10px] px-3 py-1 mb-4 tracking-widest uppercase">Core Expertise &middot; 40+ Years</span>
          <h3 class="text-2xl font-bold font-headline mb-4 text-white">Air Freight</h3>
          <p class="text-on-surface-variant leading-relaxed mb-8">Our core expertise. Express and standard air cargo from CGK to destinations worldwide. Next-Flight-Out (NFO), temperature-controlled, and dangerous goods capability.</p>
          <ul class="space-y-3">
            <li class="flex items-center gap-3 text-sm text-on-surface"><span class="material-symbols-outlined text-primary text-lg">check_circle</span>Next-Flight-Out (NFO) Protocol</li>
            <li class="flex items-center gap-3 text-sm text-on-surface"><span class="material-symbols-outlined text-primary text-lg">check_circle</span>Dangerous Goods (DG) Handling</li>
            <li class="flex items-center gap-3 text-sm text-on-surface"><span class="material-symbols-outlined text-primary text-lg">check_circle</span>Real-Time AWB Tracking</li>
            <li class="flex items-center gap-3 text-sm text-on-surface"><span class="material-symbols-outlined text-primary text-lg">check_circle</span>Cold Chain &amp; Pharma</li>
          </ul>
        </div>
        <a href="quote.html" class="mt-8 flex items-center gap-2 text-primary font-bold hover:translate-x-2 transition-transform"><span class="font-headline text-xs uppercase tracking-widest">Get Air Freight Quote</span><span class="material-symbols-outlined text-sm">arrow_forward</span></a>
      </div>
      <div class="md:w-1/2 min-h-[300px] relative overflow-hidden">
        <img class="w-full h-full object-cover grayscale opacity-60 group-hover:scale-110 group-hover:opacity-90 transition-all duration-1000" alt="Air cargo loading" src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=70"/>
        <div class="absolute inset-0 bg-gradient-to-l from-background/40 to-transparent"></div>
      </div>
    </div>

    <!-- Customs -->
    <div class="bg-gradient-to-br from-primary to-[#000eb7] p-10 rounded-xl text-white flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-primary/10">
      <div class="absolute -top-10 -right-10 opacity-10"><span class="material-symbols-outlined text-[12rem] rotate-12">gavel</span></div>
      <div class="relative z-10">
        <div class="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-8 border border-white/20"><span class="material-symbols-outlined text-white text-3xl">gavel</span></div>
        <h3 class="text-3xl font-bold font-headline mb-4">Customs Clearance (PPJK)</h3>
        <p class="opacity-80 leading-relaxed mb-8">Licensed PPJK team for all import/export clearance at every Indonesian airport and port. PIB/PEB, HS classification, restricted goods handling.</p>
        <div class="space-y-4 mb-8">
          <div class="flex items-center justify-between border-b border-white/10 pb-4"><span class="font-bold">Import (PIB)</span><span class="text-xs uppercase tracking-widest opacity-60">All Airports</span></div>
          <div class="flex items-center justify-between border-b border-white/10 pb-4"><span class="font-bold">Export (PEB)</span><span class="text-xs uppercase tracking-widest opacity-60">All Ports</span></div>
        </div>
      </div>
      <a href="contact.html" class="relative z-10 w-full py-4 bg-white text-[#000eb7] font-bold rounded-lg hover:shadow-xl transition-all duration-300 text-center block">Talk to Customs Team</a>
    </div>

    <!-- Sourcing -->
    <div class="glass-card rounded-xl p-8 group">
      <div class="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6"><span class="material-symbols-outlined text-primary text-2xl">search</span></div>
      <h4 class="text-lg font-bold mb-4 text-white group-hover:text-primary transition-colors">Sourcing &amp; Procurement</h4>
      <p class="text-sm text-on-surface-variant mb-6">Connecting overseas buyers with reliable Indonesian suppliers. Identification, negotiation, quality inspection, and consolidated shipment to destination.</p>
      <a href="contact.html" class="font-headline text-xs uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Inquire Now →</a>
    </div>

    <!-- Insurance -->
    <div class="glass-card rounded-xl p-8 flex flex-col justify-center text-center group">
      <div class="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <span class="material-symbols-outlined text-primary text-4xl">security</span>
      </div>
      <h4 class="text-xl font-bold mb-2 text-white">Cargo Insurance</h4>
      <p class="text-sm text-on-surface-variant mb-4">All-risk air cargo coverage. Certificate issued same day. Competitive premiums, fast claims.</p>
      <a href="contact.html" class="font-headline text-xs uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Learn More →</a>
    </div>

    <!-- Land Transport + Tracking -->
    <div class="glass-card rounded-xl p-8 flex items-center justify-between border-primary/20 bg-primary/5">
      <div>
        <div class="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4"><span class="material-symbols-outlined text-primary text-2xl">local_shipping</span></div>
        <h4 class="text-lg font-bold mb-1 text-white">Land Transport</h4>
        <p class="text-sm text-on-surface-variant">Airport to door delivery across Indonesia. GPS-tracked, same-day in Tangerang/Jakarta.</p>
      </div>
    </div>
  </div>
</div>
</section>

<!-- CTA -->
<section class="py-32 px-6 bg-surface-container-low">
<div class="max-w-7xl mx-auto">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
  <div>
    <h2 class="text-5xl font-headline font-bold mb-8 text-white">Let's move your <span class="text-accent italic">cargo forward.</span></h2>
    <div class="space-y-8">
      <div class="flex items-start gap-6 group">
        <div class="w-14 h-14 glass-card rounded-xl flex items-center justify-center group-hover:border-primary/50 flex-shrink-0"><span class="material-symbols-outlined text-primary">mail</span></div>
        <div><p class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Email Us</p><a href="/cdn-cgi/l/email-protection#5b38281b3a36393a293a3a292f333a75383436" class="text-xl font-semibold text-white hover:text-accent transition-colors"><span class="__cf_email__" data-cfemail="e78494a7868a858695868695938f86c984888a">[email&#160;protected]</span></a></div>
      </div>
      <div class="flex items-start gap-6 group">
        <div class="w-14 h-14 glass-card rounded-xl flex items-center justify-center group-hover:border-[#25D366]/50 flex-shrink-0"><span class="material-symbols-outlined text-[#25D366]">chat</span></div>
        <div><p class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">WhatsApp</p><a href="https://wa.me/6282125452800" class="text-xl font-semibold text-white hover:text-[#25D366] transition-colors">+62 821-2545-2800</a><p class="text-sm text-on-surface-variant mt-1">24/7 Available</p></div>
      </div>
      <div class="flex items-start gap-6 group">
        <div class="w-14 h-14 glass-card rounded-xl flex items-center justify-center group-hover:border-primary/50 flex-shrink-0"><span class="material-symbols-outlined text-primary">location_on</span></div>
        <div><p class="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Home Base</p><p class="text-xl font-semibold text-white">CGK Cargo Terminal,<br/>Soekarno-Hatta Airport</p></div>
      </div>
    </div>
  </div>
  <div class="relative">
    <div class="rounded-2xl overflow-hidden shadow-2xl bg-black p-1 border border-white/10">
      <div class="w-full h-[400px] bg-slate-900 rounded-xl overflow-hidden relative">
        <img class="w-full h-full object-cover opacity-30 contrast-150 brightness-50 grayscale" alt="Soekarno-Hatta Airport" src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=60"/>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="bg-primary/90 text-white p-4 rounded-lg shadow-[0_0_30px_rgba(17,34,238,0.4)] flex items-center gap-3 backdrop-blur-md">
            <div class="w-3 h-3 bg-white rounded-full animate-ping"></div>
            <span class="font-black uppercase tracking-tighter">AMBARA HUB &middot; CGK</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
</section>
</main>

<footer class="bg-[#0b0e14] w-full pt-20 pb-10 border-t border-white/5">
<div class="bg-[#10131a]"><div class="grid grid-cols-2 md:grid-cols-4 gap-12 px-12 max-w-7xl mx-auto py-16">
  <div class="col-span-2 md:col-span-1"><div class="text-2xl font-black text-white mb-4 font-headline uppercase tracking-tighter">Ambara Artha</div><p class="text-slate-500 text-xs leading-relaxed">&copy; 2025 PT Ambara Artha Globaltrans. Your secure way for global delivery.</p></div>
  <div><h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-6 font-bold">Services</h4><ul class="space-y-3"><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="services.html">Air Freight</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="services.html">Customs Clearance</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="services.html">Land Transport</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="services.html">Sourcing &amp; Procurement</a></li></ul></div>
  <div><h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-6 font-bold">Company</h4><ul class="space-y-3"><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="about.html">About Us</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="network.html">Network</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="blog.html">Blog</a></li></ul></div>
  <div><h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-6 font-bold">Contact</h4><div class="space-y-3 text-xs font-headline uppercase tracking-wider text-slate-500"><p><a href="/cdn-cgi/l/email-protection#d6b5a596b7bbb4b7a4b7b7a4a2beb7f8b5b9bb" class="hover:text-accent"><span class="__cf_email__" data-cfemail="d7b4a497b6bab5b6a5b6b6a5a3bfb6f9b4b8ba">[email&#160;protected]</span></a></p><p><a href="/cdn-cgi/l/email-protection#492a3a0928242b283b28283b3d2128672a2624" class="hover:text-accent"><span class="__cf_email__" data-cfemail="e98a9aa988848b889b88889b9d8188c78a8684">[email&#160;protected]</span></a></p>
      <p class="text-[#25D366] font-bold"><a href="https://wa.me/6282125452800">+62 821-2545-2800</a></p><p>24 Hours &middot; 7 Days</p></div></div>
</div></div>
<div class="max-w-7xl mx-auto px-12 flex justify-between items-center py-6"><p class="text-slate-600 text-[10px] uppercase tracking-[0.2em]">&copy; 2025 PT Ambara Artha Globaltrans.</p></div>
</footer>
<a href="https://wa.me/6282125452800" target="_blank" class="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform"><span class=""material-symbols-outlined text-white text-2xl">chat</span></a>
<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare`;

const contactHtml = `<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Contact | PT Ambara Artha Globaltrans</title>
<meta name="description" content="Contact PT Ambara Artha Globaltrans — air freight specialist at Soekarno-Hatta Airport. Available 24/7. Email, WhatsApp, or visit our CGK cargo terminal."/>
<link rel="canonical" href="https://ambaraartha.com/contact.html"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config={darkMode:"class",theme:{extend:{colors:{"primary":"#1122EE","background":"#0B0E14","surface":"#10131A","surface-variant":"#1A1F29","surface-container-low":"#10131a","surface-container":"#1a1c22","surface-container-high":"#282a2f","on-background":"#FFFFFF","on-surface":"#FFFFFF","on-surface-variant":"#94A3B8","outline":"#334155","outline-variant":"#454557","accent":"#9FA7FF","tertiary":"#e9c400"},fontFamily:{"headline":["Plus Jakarta Sans"],"body":["Inter"],"label":["Inter"]},borderRadius:{"DEFAULT":"0.125rem","lg":"0.25rem","xl":"0.5rem","full":"0.75rem"}}}}
</script>
<style>
  .material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24;}
  body{font-family:"Inter",sans-serif;background-color:#0b0e14;}
  h1,h2,h3,h4{font-family:"Plus Jakarta Sans",sans-serif;}
  input:focus,select:focus,textarea:focus{outline:none;box-shadow:0 0 0 2px rgba(17,34,238,0.4);}
  .glass-card{background:rgba(255,255,255,0.03);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);}
  .glass-card:hover{background:rgba(255,255,255,0.05);border-color:rgba(159,167,255,0.3);}
</style>
</head>
<body class="bg-background text-on-background min-h-screen flex flex-col">

<nav class="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-slate-900/60 backdrop-blur-3xl shadow-[0_20px_50px_rgba(159,167,255,0.05)]">
<div class="flex justify-between items-center w-full max-w-7xl mx-auto">
  <a href="index.html" class="text-xl font-bold tracking-tighter text-white uppercase">Ambara Artha</a>
  <div class="hidden md:flex items-center space-x-8">
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="index.html">Track Shipment</a>
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="services.html">Services</a>
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="about.html">About Us</a>
    <a class="text-accent border-b-2 border-accent pb-1 font-headline text-sm tracking-wide uppercase font-semibold" href="contact.html">Contact</a>
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="blog.html">Blog</a>
  </div>
  <a href="quote.html" class="bg-gradient-to-r from-[#1122EE] to-[#000eb7] text-white px-5 py-2 rounded-md font-semibold text-sm shadow-md hover:opacity-90 transition-all active:scale-95 uppercase tracking-wider">Get a Quote</a>
</div>
</nav>

<main class="flex-grow pt-32 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
  <!-- Hero -->
  <header class="mb-16">
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
      <div class="max-w-3xl">
        <span class="font-headline text-xs text-accent uppercase tracking-[0.3em] mb-4 block">Get In Touch &middot; 24/7</span>
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">Scale Your <span class="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Global Reach</span><br/>Through The Clouds.</h1>
        <p class="text-on-surface-variant text-lg max-w-2xl leading-relaxed">Reach our team any time. Based at Soekarno-Hatta International Airport Cargo Terminal &mdash; always ready for your air freight needs.</p>
      </div>
      <div class="font-headline text-right hidden lg:block">
        <div class="text-accent text-4xl font-bold">24/7<span class="text-xl"> OPS</span></div>
        <div class="text-on-surface-variant text-xs tracking-widest uppercase">Always Available</div>
      </div>
    </div>
  </header>

  <!-- Success -->
  <div id="successMsg" style="display:none;" class="mb-8 bg-primary/10 border border-primary/30 p-6 rounded-xl">
    <div class="font-headline font-bold text-accent mb-1">&#x2705; Message Received!</div>
    <div class="text-on-surface-variant text-sm">Our team will reply within 2 business hours. Check your email for confirmation.</div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
    <!-- Form -->
    <section class="lg:col-span-7 bg-[#10131a] border border-white/5 rounded-xl p-8 md:p-12 relative overflow-hidden">
      <div class="absolute top-0 left-0 w-1 h-full bg-primary"></div>
      <h2 class="text-3xl font-bold mb-8 text-white">Send Us a Message</h2>
      <div class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Full Name *</label>
            <input id="name" class="w-full bg-[#0b0e14] border border-white/5 focus:ring-0 text-white px-4 py-4 rounded-lg transition-all border-l-2 border-l-transparent focus:border-l-primary" placeholder="Your name" type="text"/>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Company</label>
            <input id="company" class="w-full bg-[#0b0e14] border border-white/5 focus:ring-0 text-white px-4 py-4 rounded-lg transition-all border-l-2 border-l-transparent focus:border-l-primary" placeholder="PT / CV name" type="text"/>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Email *</label>
            <input id="email" class="w-full bg-[#0b0e14] border border-white/5 focus:ring-0 text-white px-4 py-4 rounded-lg transition-all border-l-2 border-l-transparent focus:border-l-primary" placeholder="you@company.com" type="email"/>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Phone / WhatsApp</label>
            <input id="phone" class="w-full bg-[#0b0e14] border border-white/5 focus:ring-0 text-white px-4 py-4 rounded-lg transition-all border-l-2 border-l-transparent focus:border-l-primary" placeholder="+62 821-2545-2800" type="text"/>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Topic *</label>
          <div class="relative">
            <select id="topic" class="w-full bg-[#0b0e14] border border-white/5 focus:ring-0 text-white px-4 py-4 rounded-lg transition-all border-l-2 border-l-transparent focus:border-l-primary appearance-none cursor-pointer">
              <option value="">Select a topic...</option>
              <option>Air Freight Inquiry</option>
              <option>Customs Clearance</option>
              <option>Sourcing &amp; Procurement</option>
              <option>Tracking Issue</option>
              <option>General Inquiry</option>
            </select>
            <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">expand_more</span>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Message *</label>
          <textarea id="message" class="w-full bg-[#0b0e14] border border-white/5 focus:ring-0 text-white px-4 py-4 rounded-lg transition-all border-l-2 border-l-transparent focus:border-l-primary" placeholder="Tell us your cargo requirements, route, timeline or any other details..." rows="5"></textarea>
        </div>
        <button id="submitBtn" onclick="submitContact()" class="w-full py-5 bg-gradient-to-r from-[#1122EE] to-[#000eb7] text-white font-headline font-extrabold text-lg tracking-tight rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
          Send Message <span class="material-symbols-outlined">send</span>
        </button>
      </div>
    </section>

    <!-- Info -->
    <aside class="lg:col-span-5 space-y-8">
      <div class="bg-[#10131a] border border-white/5 p-8 rounded-xl">
        <h3 class="font-headline text-xl font-bold mb-6 text-accent">Contact Information</h3>
        <div class="space-y-6">
          <div class="flex items-start gap-4">
            <span class="material-symbols-outlined text-primary">mail</span>
            <div>
              <p class="font-bold text-white text-sm">Email</p>
              <a href="/cdn-cgi/l/email-protection#d9baaa99b8b4bbb8abb8b8abadb1b8f7bab6b4" class="text-on-surface-variant text-sm hover:text-accent transition-colors"><span class="__cf_email__" data-cfemail="8deefecdece0efecffececfff9e5eca3eee2e0">[email&#160;protected]</span></a>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <span class="material-symbols-outlined text-[#25D366]">chat</span>
            <div>
              <p class="font-bold text-white text-sm">Call / WhatsApp</p>
              <a href="https://wa.me/6282125452800" class="text-on-surface-variant text-sm hover:text-[#25D366] transition-colors">+62 821-2545-2800</a>
              <p class="text-accent text-xs font-headline mt-1 uppercase tracking-widest">24/7 AOG Priority Line</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <span class="material-symbols-outlined text-primary">location_on</span>
            <div>
              <p class="font-bold text-white text-sm">Office Address</p>
              <p class="text-on-surface-variant text-sm leading-relaxed">Soekarno-Hatta International Airport,<br/>Cargo Terminal, Jl. Cengkareng Golf Club,<br/>Pajang, Benda, Tangerang, Banten, Indonesia</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <span class="material-symbols-outlined text-primary">schedule</span>
            <div>
              <p class="font-bold text-white text-sm">Business Hours</p>
              <p class="text-accent font-headline text-sm font-bold uppercase tracking-widest">24 Hours &middot; 7 Days &middot; 365 Days</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#10131a] border-l-4 border-accent p-6 rounded-xl">
        <div class="flex justify-between items-center mb-2">
          <span class="font-headline text-xs uppercase text-accent tracking-widest">System Status</span>
          <span class="flex h-2 w-2 rounded-full bg-[#25D366] animate-pulse"></span>
        </div>
        <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-3"><div class="h-full bg-primary w-full"></div></div>
        <p class="text-xs text-on-surface-variant italic leading-relaxed">"Always operational at CGK Cargo Terminal. 24/7 air freight support for urgent and standard shipments."</p>
      </div>

      <div class="bg-[#10131a] border border-white/5 p-6 rounded-xl">
        <h4 class="font-headline font-bold text-white mb-4">Strategic Airport Nodes</h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-[#0b0e14] p-4 rounded-lg"><div class="font-headline text-xl text-primary font-bold">CGK</div><div class="text-xs text-on-surface-variant mt-1">Jakarta &middot; Home Base</div></div>
          <div class="bg-[#0b0e14] p-4 rounded-lg"><div class="font-headline text-xl text-primary font-bold">SIN</div><div class="text-xs text-on-surface-variant mt-1">Singapore Hub</div></div>
          <div class="bg-[#0b0e14] p-4 rounded-lg"><div class="font-headline text-xl text-primary font-bold">DXB</div><div class="text-xs text-on-surface-variant mt-1">Dubai Gateway</div></div>
          <div class="bg-[#0b0e14] p-4 rounded-lg"><div class="font-headline text-xl text-primary font-bold">HKG</div><div class="text-xs text-on-surface-variant mt-1">Hong Kong Node</div></div>
        </div>
      </div>
    </aside>
  </div>
</main>

<footer class="w-full mt-16 bg-[#0b0e14] border-t border-white/5">
<div class="bg-[#10131a]"><div class="grid grid-cols-2 md:grid-cols-4 gap-12 px-12 max-w-7xl mx-auto py-16">
  <div class="col-span-2 md:col-span-1"><h2 class="text-xl font-black text-white font-headline mb-4 uppercase">Ambara Artha</h2><p class="text-slate-500 text-xs leading-relaxed">&copy; 2025 PT Ambara Artha Globaltrans.</p></div>
  <div><h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-4 font-bold">Services</h4><ul class="space-y-3"><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="services.html">Air Freight</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="services.html">Customs Clearance</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="services.html">Sourcing &amp; Procurement</a></li></ul></div>
  <div><h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-4 font-bold">Company</h4><ul class="space-y-3"><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="about.html">About Us</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="blog.html">Blog</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="quote.html">Get a Quote</a></li></ul></div>
  <div><h4 class="text-accent font-headline text-xs uppercase tracking-[0.1em] mb-4 font-bold">Status</h4><div class="flex items-center gap-2 mb-3"><div class="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></div><span class="text-[10px] font-headline uppercase tracking-tighter text-on-surface-variant">24/7 Systems Active</span></div><a href="/cdn-cgi/l/email-protection#bad9c9fadbd7d8dbc8dbdbc8ced2db94d9d5d7" class="text-slate-500 hover:text-accent text-xs block mb-2"><span class="__cf_email__" data-cfemail="99faead9f8f4fbf8ebf8f8ebedf1f8b7faf6f4">[email&#160;protected]</span></a><a href="/cdn-cgi/l/email-protection#21425261404c4340534040535549400f424e4c" class="text-slate-500 hover:text-accent text-xs block mb-2"><span class="__cf_email__" data-cfemail="a7c4d4e7c6cac5c6d5c6c6d5d3cfc689c4c8ca">[email&#160;protected]</span></a>
<a href="/cdn-cgi/l/email-protection#b6d5c5f6d7dbd4d7c4d7d7c4c2ded798d5d9db" class="text-slate-500 hover:text-accent text-xs block mb-1"><span class="__cf_email__" data-cfemail="ef8c9caf8e828d8e9d8e8e9d9b878ec18c8082">[email&#160;protected]</span></a>
<a href="https://wa.me/6282125452800" class="text-[#25D366] font-bold text-xs">+62 821-2545-2800</a></div>
</div></div>
</footer>
<a href="https://wa.me/6282125452800" target="_blank" class="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform"><span class="material-symbols-outlined text-white text-2xl">chat</span></a>

<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
  async function submitContact(){
    const name=document.getElementById("name").value.trim();
    const company=document.getElementById("company").value.trim();
    const email=document.getElementById("email").value.trim();
    const phone=document.getElementById("phone").value.trim();
    const topic=document.getElementById("topic").value;
    const message=document.getElementById("message").value.trim();
    if(!name||!email||!topic||!message){alert("Please fill in all required fields (*)");return;}
    if(!email.includes("@")){alert("Please enter a valid email address");return;}
    const btn=document.getElementById("submitBtn");
    btn.innerHTML="Sending... <span class=\\"material-symbols-outlined\\">hourglass_empty</span>"; btn.disabled=true;
    try{
      const res=await fetch("/api/submit-contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,company,email,phone,topic,message})});
      const data=await res.json();
      if(data.success){
        document.getElementById("successMsg").style.display="block";
        document.getElementById("successMsg").scrollIntoView({behavior:"smooth",block:"center"});
        btn.innerHTML="Message Sent &#x2713;";
      }else{alert("Something went wrong`;

const quoteHtml = `<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Get a Quote | PT Ambara Artha Globaltrans</title>
<meta name="description" content="Request an air freight quote from PT Ambara Artha Globaltrans. Based at Soekarno-Hatta Airport CGK. Fast response within 2 business hours."/>
<link rel="canonical" href="https://ambaraartha.com/quote.html"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config={darkMode:"class",theme:{extend:{colors:{"primary":"#1122EE","background":"#0B0E14","surface":"#10131A","surface-variant":"#1A1F29","surface-container-low":"#10131a","surface-container":"#1a1c22","surface-container-high":"#282a2f","on-background":"#FFFFFF","on-surface":"#FFFFFF","on-surface-variant":"#94A3B8","outline":"#334155","outline-variant":"#454557","accent":"#9FA7FF","tertiary":"#e9c400"},fontFamily:{"headline":["Plus Jakarta Sans"],"body":["Inter"],"label":["Inter"]},borderRadius:{"DEFAULT":"0.125rem","lg":"0.25rem","xl":"0.5rem","full":"0.75rem"}}}}
</script>
<style>
  .material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24;}
  body{font-family:"Inter",sans-serif;background-color:#0b0e14;}
  h1,h2,h3,h4{font-family:"Plus Jakarta Sans",sans-serif;}
  input:focus,select:focus,textarea:focus{outline:none;box-shadow:0 0 0 2px rgba(17,34,238,0.4);}
</style>
</head>
<body class="bg-background text-on-background min-h-screen flex flex-col">

<nav class="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 max-w-7xl mx-auto bg-slate-900/60 backdrop-blur-3xl shadow-[0_20px_50px_rgba(159,167,255,0.05)]" style="left:0;right:0;max-width:100%">
<div class="flex justify-between items-center w-full max-w-7xl mx-auto">
  <a href="index.html" class="text-xl font-bold tracking-tighter text-white uppercase">Ambara Artha</a>
  <div class="hidden md:flex items-center space-x-8">
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="index.html">Track Shipment</a>
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="services.html">Services</a>
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="about.html">About Us</a>
    <a class="text-slate-400 hover:text-white transition-colors font-headline text-sm tracking-wide uppercase font-semibold" href="contact.html">Contact</a>
  </div>
  <button class="bg-gradient-to-r from-[#1122EE] to-[#000eb7] text-white px-5 py-2 rounded-md font-semibold text-sm shadow-md hover:opacity-90 transition-all active:scale-95 uppercase tracking-wider">Get a Quote</button>
</div>
</nav>

<main class="flex-grow pt-24 pb-32 px-4 md:px-8">
<div class="max-w-5xl mx-auto">
  <!-- Success State -->
  <div id="successState" style="display:none;" class="text-center py-24">
    <div class="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-8">
      <span class="material-symbols-outlined text-4xl text-accent">check_circle</span>
    </div>
    <h2 class="text-4xl font-black font-headline text-white mb-4">Quote Request Received!</h2>
    <p class="text-slate-400 text-lg mb-4">Our team will prepare a competitive rate and reply within <strong class="text-white">2 business hours</strong>.</p>
    <div class="inline-block bg-[#10131a] border border-white/10 rounded-xl px-8 py-4 mb-8">
      <p class="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Reference Number</p>
      <p id="refNum" class="text-2xl font-black font-headline text-accent"></p>
      <p class="text-xs text-slate-500 mt-1">Confirmation sent to: <span id="confirmEmail" class="text-white"></span></p>
    </div>
    <div class="flex gap-4 justify-center">
      <a href="index.html" class="border border-white/20 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/5 transition-all uppercase tracking-wider text-sm">Back to Home</a>
      <a href="index.html#tracking" class="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all uppercase tracking-wider text-sm">Track a Shipment</a>
    </div>
  </div>

  <!-- Form State -->
  <div id="formState">
  <div class="mb-12">
    <span class="text-[11px] uppercase tracking-[0.2em] font-black text-accent mb-2 block">Freight Quotation</span>
    <h1 class="text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">Request a <span class="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Global Quote</span></h1>
    <p class="text-slate-400 text-lg max-w-2xl font-medium">Complete the form below to receive a competitive rate for your air freight shipment. Response within 2 hours.</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
    <!-- FORM -->
    <div class="lg:col-span-8 space-y-8">

      <!-- Step 1: Route -->
      <section class="bg-[#10131a] border border-white/5 rounded-xl p-8 hover:border-white/10 transition-all duration-300">
        <div class="flex items-center gap-4 mb-8">
          <span class="w-10 h-10 rounded-full bg-[#1122EE] text-white flex items-center justify-center font-bold">01</span>
          <h2 class="text-xl font-bold text-white uppercase tracking-wider">Origin &amp; Destination</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 flex items-center gap-1">Origin Location</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">location_on</span>
              <input id="q_origin" class="w-full pl-12 pr-4 py-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] transition-all text-white font-medium placeholder:text-slate-600" placeholder="City or Airport (e.g. Jakarta, CGK)" type="text"/>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 flex items-center gap-1">Destination Location</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">flag</span>
              <input id="q_dest" class="w-full pl-12 pr-4 py-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] transition-all text-white font-medium placeholder:text-slate-600" placeholder="City or Airport (e.g. Singapore, SIN)" type="text"/>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Cargo Ready Date</label>
            <input id="q_date" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] text-white" type="date"/>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Incoterms</label>
            <div class="relative">
              <select id="q_incoterms" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] appearance-none font-medium cursor-pointer text-white">
                <option>EXW - Ex Works</option><option>FOB - Free on Board</option><option>CIF - Cost, Insurance &amp; Freight</option><option>DAP - Delivered At Place</option><option>DDP - Delivered Duty Paid</option>
              </select>
              <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">expand_more</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Step 2: Cargo Details -->
      <section class="bg-[#10131a] border border-white/5 rounded-xl p-8 hover:border-white/10 transition-all duration-300">
        <div class="flex items-center gap-4 mb-8">
          <span class="w-10 h-10 rounded-full bg-[#1122EE] text-white flex items-center justify-center font-bold">02</span>
          <h2 class="text-xl font-bold text-white uppercase tracking-wider">Cargo Details</h2>
        </div>
        <div class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Cargo Type</label>
              <div class="relative">
                <select id="q_cargo_type" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] appearance-none font-medium cursor-pointer text-white">
                  <option>General Cargo</option><option>Dangerous Goods (DG)</option><option>Perishable / Cold Chain</option><option>High Value / Fragile</option><option>Oversized</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">expand_more</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Number of Packages</label>
              <input id="q_packages" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] font-medium text-white placeholder:text-slate-600" placeholder="10" type="number" min="1"/>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Cargo Value (USD)</label>
              <input id="q_value" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] font-medium text-white placeholder:text-slate-600" placeholder="5000" type="number" min="0"/>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Goods Description</label>
            <input id="q_desc" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] text-white placeholder:text-slate-600" placeholder="e.g. Electronic Components — Fragile" type="text"/>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Weight (kg)</label>
              <input id="q_weight" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] font-medium text-white placeholder:text-slate-600" placeholder="0.00" type="number" step="0.01"/>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Length (cm)</label>
              <input id="q_length" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] font-medium text-white placeholder:text-slate-600" placeholder="L" type="number"/>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Width (cm)</label>
              <input id="q_width" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] font-medium text-white placeholder:text-slate-600" placeholder="W" type="number"/>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Height (cm)</label>
              <input id="q_height" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] font-medium text-white placeholder:text-slate-600" placeholder="H" type="number"/>
            </div>
          </div>
          <!-- Speed Selection -->
          <div class="space-y-4">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Shipping Speed</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label class="group relative flex items-center justify-between p-4 bg-[#0b0e14] border border-white/5 rounded-xl cursor-pointer hover:border-[#1122EE]/50 transition-all">
                <input checked class="hidden peer" id="speed_standard" name="speed" type="radio" value="Standard"/>
                <div class="flex items-center gap-3"><span class="material-symbols-outlined text-accent">eco</span><div><p class="font-bold text-white text-sm">Standard</p><p class="text-[9px] text-slate-500 uppercase tracking-tighter">Best Value</p></div></div>
                <div class="w-5 h-5 rounded-full border-2 border-white/10 peer-checked:border-[#1122EE] peer-checked:bg-[#1122EE] flex items-center justify-center"><div class="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div></div>
              </label>
              <label class="group relative flex items-center justify-between p-4 bg-[#0b0e14] border border-white/5 rounded-xl cursor-pointer hover:border-[#1122EE]/50 transition-all">
                <input class="hidden peer" id="speed_express" name="speed" type="radio" value="Express NFO"/>
                <div class="flex items-center gap-3"><span class="material-symbols-outlined text-accent">rocket_launch</span><div><p class="font-bold text-white text-sm">Express NFO</p><p class="text-[9px] text-slate-500 uppercase tracking-tighter">Next Flight Out</p></div></div>
                <div class="w-5 h-5 rounded-full border-2 border-white/10 peer-checked:border-[#1122EE] peer-checked:bg-[#1122EE] flex items-center justify-center"><div class="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div></div>
              </label>
              <label class="group relative flex items-center justify-between p-4 bg-[#0b0e14] border border-white/5 rounded-xl cursor-pointer hover:border-[#1122EE]/50 transition-all">
                <input class="hidden peer" id="speed_charter" name="speed" type="radio" value="Charter"/>
                <div class="flex items-center gap-3"><span class="material-symbols-outlined text-accent">diamond</span><div><p class="font-bold text-white text-sm">Charter</p><p class="text-[9px] text-slate-500 uppercase tracking-tighter">Dedicated Flight</p></div></div>
                <div class="w-5 h-5 rounded-full border-2 border-white/10 peer-checked:border-[#1122EE] peer-checked:bg-[#1122EE] flex items-center justify-center"><div class="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div></div>
              </label>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Special Requirements (Optional)</label>
            <textarea id="q_special" class="w-full bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] text-white px-4 py-4" rows="3" placeholder="DG classification, temperature control, fragile handling..."></textarea>
          </div>
        </div>
      </section>

      <!-- Step 3: Contact -->
      <section class="bg-[#10131a] border border-white/5 rounded-xl p-8 hover:border-white/10 transition-all duration-300">
        <div class="flex items-center gap-4 mb-8">
          <span class="w-10 h-10 rounded-full bg-[#1122EE] text-white flex items-center justify-center font-bold">03</span>
          <h2 class="text-xl font-bold text-white uppercase tracking-wider">Contact Information</h2>
        </div>
        <div class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Full Name *</label>
              <input id="q_name" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] font-medium text-white placeholder:text-slate-600" placeholder="Your name" type="text"/>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Company Name *</label>
              <input id="q_company" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] font-medium text-white placeholder:text-slate-600" placeholder="PT / CV name" type="text"/>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Email Address *</label>
              <input id="q_email" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] font-medium text-white placeholder:text-slate-600" placeholder="you@company.com" type="email"/>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Phone / WhatsApp *</label>
              <input id="q_phone" class="w-full p-4 bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] font-medium text-white placeholder:text-slate-600" placeholder="+62 821-2545-2800" type="tel"/>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Additional Notes</label>
            <textarea id="q_notes" class="w-full bg-[#0b0e14] border border-white/5 rounded-lg focus:ring-2 focus:ring-[#1122EE] text-white px-4 py-4" rows="3" placeholder="Anything else we should know..."></textarea>
          </div>
        </div>
      </section>

      <div class="flex justify-end pt-4">
        <button id="submitBtn" onclick="submitQuote()" class="bg-gradient-to-r from-[#1122EE] to-[#000eb7] text-white px-10 py-5 rounded-md font-bold text-lg shadow-[0_0_30px_rgba(17,34,238,0.3)] hover:shadow-[0_0_45px_rgba(17,34,238,0.5)] transition-all flex items-center gap-3 active:scale-[0.98] uppercase tracking-[0.1em]">
          Submit Quote Request <span class="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>

    <!-- SIDEBAR -->
    <aside class="lg:col-span-4 h-fit sticky top-28 space-y-6">
      <div class="bg-[#10131a] border border-white/5 rounded-xl shadow-2xl p-6 overflow-hidden relative">
        <div class="absolute top-0 right-0 w-32 h-32 bg-[#1122EE]/10 rounded-bl-full -mr-10 -mt-10"></div>
        <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
          <span class="material-symbols-outlined text-accent">analytics</span>Quote Summary
        </h3>
        <div class="space-y-6 relative">
          <div class="flex items-start gap-4">
            <div class="flex flex-col items-center gap-1 pt-1">
              <div class="w-3 h-3 rounded-full border-2 border-[#1122EE] bg-[#0b0e14]"></div>
              <div class="w-[2px] h-10 bg-gradient-to-b from-[#1122EE] to-slate-800"></div>
              <div class="w-3 h-3 rounded-full bg-[#1122EE]"></div>
            </div>
            <div class="space-y-4 flex-grow">
              <div><p class="text-[10px] font-bold uppercase text-slate-600 tracking-[0.05rem]">Origin</p><p id="sum_origin" class="font-bold text-sm text-accent">Pending Input...</p></div>
              <div><p class="text-[10px] font-bold uppercase text-slate-600 tracking-[0.05rem]">Destination</p><p id="sum_dest" class="font-bold text-sm text-slate-400">Pending Input...</p></div>
            </div>
          </div>
          <div class="pt-6 border-t border-white/5">
            <div class="grid grid-cols-2 gap-4">
              <div><p class="text-[10px] font-bold uppercase text-slate-600">Weight</p><p id="sum_weight" class="text-sm font-semibold text-slate-300">-- kg</p></div>
              <div><p class="text-[10px] font-bold uppercase text-slate-600">Service</p><p id="sum_speed" class="text-sm font-semibold text-slate-300">Standard</p></div>
            </div>
          </div>
          <div class="bg-[#0b0e14] p-4 rounded-lg border border-white/5">
            <p class="text-[11px] text-slate-500 flex gap-2 italic"><span class="material-symbols-outlined text-sm text-accent">verified</span>Full breakdown provided in official quote via email within 2 hours.</p>
          </div>
        </div>
      </div>
      <div class="bg-[#1122EE]/5 border border-[#1122EE]/20 p-6 rounded-xl">
        <h4 class="font-bold text-white mb-2 uppercase text-xs tracking-[0.1em]">Need Immediate Help?</h4>
        <p class="text-sm text-slate-400 mb-4 leading-relaxed">Our team at CGK is available 24/7 for urgent shipments.</p>
        <a class="text-accent font-bold text-sm flex items-center gap-1 hover:underline hover:underline-offset-4 transition-all" href="https://wa.me/6282125452800">
          WhatsApp +62 821-2545-2800 <span class="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      </div>
    </aside>
  </div>
  </div><!-- end formState -->
</div>
</main>

<footer class="w-full pt-20 pb-10 bg-[#0b0e14] border-t border-white/5">
<div class="grid grid-cols-2 md:grid-cols-4 gap-12 px-12 max-w-7xl mx-auto">
  <div class="col-span-2 md:col-span-1"><h2 class="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Ambara Artha</h2><p class="text-slate-500 text-xs uppercase tracking-[0.05rem] leading-relaxed mb-6">&copy; 2025 PT Ambara Artha Globaltrans. Your secure way for global delivery.</p></div>
  <div><h3 class="text-accent font-bold text-[10px] uppercase tracking-[0.2em] mb-6">Services</h3><ul class="space-y-4"><li><a class="text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-[0.05rem]" href="services.html">Air Freight</a></li><li><a class="text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-[0.05rem]" href="services.html">Customs Clearance</a></li><li><a class="text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-[0.05rem]" href="services.html">Sourcing &amp; Procurement</a></li></ul></div>
  <div><h3 class="text-accent font-bold text-[10px] uppercase tracking-[0.2em] mb-6">Company</h3><ul class="space-y-4"><li><a class="text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-[0.05rem]" href="about.html">About Us</a></li><li><a class="text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-[0.05rem]" href="blog.html">Blog</a></li></ul></div>
  <div><h3 class="text-accent font-bold text-[10px] uppercase tracking-[0.2em] mb-6">Contact</h3><a href="/cdn-cgi/l/email-protection#096a7a4968646b687b68687b7d6168276a6664" class="text-slate-500 hover:text-accent text-xs block mb-2"><span class="__cf_email__" data-cfemail="b2d1c1f2d3dfd0d3c0d3d3c0c6dad39cd1dddf">[email&#160;protected]</span></a><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></div><span class="text-[10px] font-label uppercase tracking-tighter text-on-surface-variant">24/7 Systems Active</span></div><p class="text-slate-500 text-xs mt-4"><a href="/cdn-cgi/l/email-protection#b6d5c5f6d7dbd4d7c4d7d7c4c2ded798d5d9db" class="hover:text-accent"><span class="__cf_email__" data-cfemail="791a0a3918141b180b18180b0d1118571a1614">[email&#160;protected]</span></a></p><p class="text-slate-500 text-xs mt-2"><a href="/cdn-cgi/l/email-protection#f09383b0919d929182919182849891de939f9d" class="hover:text-accent"><span class="__cf_email__" data-cfemail="4a29390a2b27282b382b2b383e222b64292527">[email&#160;protected]</span></a></p><p class="text-[#25D366] text-xs mt-2 font-bold"><a href="https://wa.me/6282125452800">+62 821-2545-2800</a></p></div>
</div>
</footer>
<a href="https://wa.me/6282125452800" target="_blank" class="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform"><span class="material-symbols-outlined text-white text-2xl">chat</span></a>

<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
  // Live summary update
  document.getElementById("q_origin").addEventListener("input",e=>{document.getElementById("sum_origin").textContent=e.target.value||"Pending Input..."});
  document.getElementById("q_dest").addEventListener("input",e=>{document.getElementById("sum_dest").textContent=e.target.value||"Pending Input..."});
  document.getElementById("q_weight").addEventListener("input",e=>{document.getElementById("sum_weight").textContent=(e.target.value||"--")+" kg"});
  document.querySelectorAll("input[name=speed]").forEach(r=>r.addEventListener("change",e=>{document.getElementById("sum_speed").textContent=e.target.value}));

  async function submitQuote(){
    const name=document.getElementById("q_name").value.trim();
    const company=document.getElementById("q_company").value.trim();
    const email=document.getElementById("q_email").value.trim();
    const phone=document.getElementById("q_phone").value.trim();
    const origin=document.getElementById("q_origin").value.trim();
    const destination=document.getElementById("q_dest").value.trim();
    if(!name||!company||!email||!phone){alert("Please fill in all required contact fields (*)");return;}
    if(!email.includes("@")){alert("Please enter a valid email address");return;}
    const btn=document.getElementById("submitBtn");
    btn.innerHTML="Submitting... <span class=\\"material-symbols-outlined\\">hourglass_empty</span>"; btn.disabled=true;
    const freightType=document.querySelector("input[name=speed]:checked")?.value||"Standard";
    const payload={
      freightType, origin, destination,
      readyDate:document.getElementById("q_date").value,
      incoterms:document.getElementById("q_incoterms").value,
      cargoDesc:document.getElementById("q_desc").value.trim(),
      weight:document.getElementById("q_weight").value,
      volume:"",
      packages:document.getElementById("q_packages").value,
      cargoValue:document.getElementById("q_value").value,
      insurance:"no",
      special:document.getElementById("q_special").value.trim(),
      name,company,email,phone,
      notes:document.getElementById("q_notes").value.trim()
    };
    try{
      const res=await fetch("/api/submit-quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await res.json();
      if(data.success){
        document.getElementById("refNum").textContent="REF: "+data.reference;
        document.getElementById("confirmEmail").textContent=email;
        document.getElementById("formState").style.display="none";
        document.getElementById("successState").style.display="block";
        window.scrollTo({top:0,behavior:"smooth"});
      } else {alert("Something went wrong. Please try again.");btn.innerHTML=`;

const networkHtml = `<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Network | PT Ambara Artha Globaltrans</title>
<meta name="description" content="PT Ambara Artha Globaltrans global air freight network. Based at CGK with connections to 52+ countries via SIN, DXB, HKG and more."/>
<link rel="canonical" href="https://ambaraartha.com/network.html"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
  tailwind.config={darkMode:"class",theme:{extend:{colors:{"primary":"#1122EE","background":"#0B0E14","surface":"#10131A","surface-variant":"#1A1F29","surface-container-low":"#10131a","surface-container":"#151921","surface-container-high":"#1e222a","surface-container-highest":"#282c35","on-background":"#FFFFFF","on-surface":"#FFFFFF","on-surface-variant":"#94A3B8","outline":"#334155","outline-variant":"#454557","accent":"#9FA7FF","tertiary":"#e9c400"},fontFamily:{"headline":["Plus Jakarta Sans"],"body":["Inter"],"label":["Plus Jakarta Sans"]},borderRadius:{"DEFAULT":"0.125rem","lg":"0.25rem","xl":"0.5rem","full":"0.75rem"}}}}
</script>
<style>
  .material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24;vertical-align:middle;}
  .editorial-shadow{box-shadow:0px 20px 50px rgba(0,0,0,0.5);}
  .glow-accent{box-shadow:0 0 15px rgba(159,167,255,0.4);}
  .glow-text{text-shadow:0 0 8px rgba(159,167,255,0.5);}
  .glow-dot{box-shadow:0 0 10px rgba(159,167,255,0.8);}
  .glass-hud{background:rgba(49,53,59,0.6);backdrop-filter:blur(12px);}
</style>
</head>
<body class="bg-background text-on-surface font-body selection:bg-primary/30 selection:text-white">

<nav class="fixed top-0 w-full flex justify-between items-center px-8 py-4 max-w-full mx-auto bg-slate-900/60 backdrop-blur-3xl z-50 shadow-[0_20px_50px_rgba(159,167,255,0.05)]">
<div class="flex justify-between items-center w-full max-w-7xl mx-auto">
  <a href="index.html" class="text-xl font-bold tracking-tighter text-white uppercase font-headline">PT Ambara Artha Globaltrans</a>
  <div class="hidden md:flex items-center gap-8">
    <a class="text-slate-400 hover:text-white font-headline text-sm tracking-wide uppercase font-semibold" href="index.html">Track Shipment</a>
    <a class="text-slate-400 hover:text-white font-headline text-sm tracking-wide uppercase font-semibold" href="services.html">Services</a>
    <a class="text-slate-400 hover:text-white font-headline text-sm tracking-wide uppercase font-semibold" href="about.html">About Us</a>
    <a class="text-accent border-b-2 border-accent pb-1 font-headline text-sm tracking-wide uppercase font-semibold" href="network.html">Network</a>
    <a class="text-slate-400 hover:text-white font-headline text-sm tracking-wide uppercase font-semibold" href="contact.html">Contact</a>
  </div>
  <a href="quote.html" class="bg-accent text-[#000eb7] px-6 py-2.5 rounded-md font-bold text-sm transition-transform active:scale-95 uppercase tracking-wider glow-accent">Get a Quote</a>
</div>
</nav>

<main class="pt-32 pb-20 px-6 max-w-7xl mx-auto">
<!-- HERO -->
<section class="mb-16">
  <div class="flex flex-col md:flex-row justify-between items-end gap-6 border-l-4 border-primary pl-6">
    <div>
      <span class="font-headline text-xs font-bold uppercase tracking-widest text-accent mb-2 block glow-text">Global Air Freight Network</span>
      <h1 class="font-headline text-6xl font-extrabold text-white tracking-tighter">CGK to the World</h1>
      <p class="text-lg text-on-surface-variant mt-3 max-w-lg leading-relaxed">Air freight connections from Soekarno-Hatta International Airport to 52+ countries worldwide. 40+ years of combined air cargo expertise.</p>
    </div>
    <div class="flex flex-col items-end flex-shrink-0">
      <div class="bg-surface-container-high text-on-surface-variant px-5 py-2 rounded-full font-bold text-sm mb-3 flex items-center gap-2 border border-white/10">
        <span class="material-symbols-outlined text-[20px]">flight_takeoff</span>AIR FREIGHT SPECIALIST
      </div>
      <div class="text-right">
        <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Home Base</span>
        <span class="font-headline text-3xl font-bold text-white">CGK · Jakarta</span>
      </div>
    </div>
  </div>
</section>

<!-- MAP + TIMELINE GRID -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
  <!-- Left: Hub List -->
  <div class="lg:col-span-5 space-y-6">
    <div class="bg-surface-container-low p-8 rounded-xl relative overflow-hidden border border-white/5">
      <h2 class="font-headline text-xl font-bold mb-10 flex items-center gap-3 text-white">
        <span class="material-symbols-outlined text-primary">hub</span>Airport Node Presence
      </h2>
      <div class="relative space-y-10 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
        <!-- CGK Home -->
        <div class="relative pl-10">
          <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10 glow-dot">
            <span class="material-symbols-outlined text-[14px] text-white font-bold">home</span>
          </div>
          <div>
            <h3 class="font-headline text-sm font-bold text-accent uppercase tracking-wide glow-text">Jakarta (CGK) · Home Base</h3>
            <p class="text-sm text-on-surface-variant mt-1 leading-relaxed">Soekarno-Hatta International Airport Cargo Terminal. Our primary operating hub with direct access to all major airlines.</p>
            <span class="text-[10px] font-bold uppercase text-white/30 mt-2 block tracking-widest">Indonesia · 24/7 Operations</span>
          </div>
        </div>
        <!-- SUB -->
        <div class="relative pl-10">
          <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface-container-highest border border-white/10 text-primary flex items-center justify-center z-10"><span class="material-symbols-outlined text-[14px]">flight</span></div>
          <div><h3 class="font-headline text-sm font-bold text-white uppercase tracking-wide">Surabaya (SUB)</h3><p class="text-sm text-on-surface-variant mt-1">Juanda International Airport. East Java cargo node serving Surabaya and surrounding industrial regions.</p></div>
        </div>
        <!-- DPS -->
        <div class="relative pl-10">
          <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface-container-highest border border-white/10 text-primary flex items-center justify-center z-10"><span class="material-symbols-outlined text-[14px]">flight</span></div>
          <div><h3 class="font-headline text-sm font-bold text-white uppercase tracking-wide">Bali (DPS)</h3><p class="text-sm text-on-surface-variant mt-1">Ngurah Rai International Airport. Bali cargo node for export of artisan goods, perishables, and tourism industry freight.</p></div>
        </div>
      </div>
    </div>
    <!-- CTA Support -->
    <div class="bg-[#1122ee] p-8 rounded-xl text-white editorial-shadow relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
      <h3 class="font-headline text-lg font-bold mb-4 relative z-10">Ready to Ship?</h3>
      <p class="text-white/70 text-sm mb-8 leading-relaxed relative z-10">Our CGK team is available 24/7 for urgent and standard air freight. Get a competitive quote in under 2 hours.</p>
      <div class="grid grid-cols-2 gap-4 relative z-10">
        <a class="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-all py-3 rounded-md text-xs font-bold uppercase tracking-widest" href="https://wa.me/6282125452800">
          <span class="material-symbols-outlined text-sm">chat</span>WhatsApp
        </a>
        <a class="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-all py-3 rounded-md text-xs font-bold uppercase tracking-widest" href="quote.html">
          <span class="material-symbols-outlined text-sm">request_quote</span>Get Quote
        </a>
      </div>
    </div>
  </div>

  <!-- Right: Map + Stats -->
  <div class="lg:col-span-7 space-y-8">
    <!-- Map -->
    <div class="relative bg-black rounded-xl h-[420px] overflow-hidden editorial-shadow border border-white/5">
      <div class="absolute inset-0">
        <img class="w-full h-full object-cover opacity-30 grayscale contrast-125" alt="Global air freight network map" src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=60"/>
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
      </div>
      <!-- CGK Node (Primary) -->
      <div class="absolute top-[62%] left-[74%]">
        <div class="relative">
          <div class="absolute -inset-4 bg-primary/20 rounded-full animate-pulse"></div>
          <div class="w-5 h-5 bg-primary rounded-full border-4 border-black shadow-2xl glow-dot relative z-10"></div>
          <div class="absolute -top-10 -left-10 glass-hud px-3 py-2 rounded-lg border border-primary/30 whitespace-nowrap">
            <span class="text-[9px] font-black text-primary block uppercase tracking-tighter glow-text">HOME BASE</span>
            <span class="text-xs font-bold text-white uppercase">CGK / JAKARTA</span>
          </div>
        </div>
      </div>
      <!-- SUB Node -->
      <div class="absolute top-[67%] left-[76%] group cursor-pointer">
        <div class="w-3 h-3 bg-accent rounded-full animate-pulse mb-2"></div>
        <div class="glass-hud p-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="font-headline text-xs text-accent">NODE_EAST_JAVA</span>
          <div class="font-headline font-bold text-white text-sm">SUB / SURABAYA</div>
        </div>
      </div>
      <!-- DPS Node -->
      <div class="absolute top-[70%] left-[77%] group cursor-pointer">
        <div class="w-3 h-3 bg-accent rounded-full animate-pulse mb-2"></div>
        <div class="glass-hud p-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="font-headline text-xs text-accent">NODE_BALI</span>
          <div class="font-headline font-bold text-white text-sm">DPS / BALI</div>
        </div>
      </div>
      <!-- Map Stats -->
      <div class="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4">
        <div class="glass-hud px-4 py-3 rounded-lg border border-white/10">
          <span class="text-[9px] font-bold uppercase text-white/40 block mb-1 tracking-widest">On-Time Rate</span>
          <span id="mapOnTime" class="text-sm font-bold text-white uppercase">—</span>
        </div>
        <div class="glass-hud px-4 py-3 rounded-lg border border-white/10">
          <span class="text-[9px] font-bold uppercase text-white/40 block mb-1 tracking-widest">Countries</span>
          <span class="text-sm font-bold text-white uppercase">52+</span>
        </div>
        <div class="glass-hud px-4 py-3 rounded-lg border border-white/10">
          <span class="text-[9px] font-bold uppercase text-white/40 block mb-1 tracking-widest">Support</span>
          <span class="text-sm font-bold text-white uppercase">24/7</span>
        </div>
      </div>
    </div>

    <!-- Bento Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-surface-container-low p-6 rounded-xl border border-white/5 border-l-4 border-l-primary/50">
        <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-5 glow-text">Why Air Freight from CGK?</h4>
        <div class="space-y-4">
          <div class="flex justify-between border-b border-white/5 pb-3"><span class="text-sm text-on-surface-variant">Home Base</span><span class="text-sm font-bold text-white">CGK Cargo Terminal</span></div>
          <div class="flex justify-between border-b border-white/5 pb-3"><span class="text-sm text-on-surface-variant">Expertise</span><span class="text-sm font-bold text-white">40+ Years</span></div>
          <div class="flex justify-between pb-1"><span class="text-sm text-on-surface-variant">Est.</span><span class="text-sm font-bold text-white">2025</span></div>
        </div>
      </div>
      <div class="bg-surface-container-low p-6 rounded-xl border border-white/5 border-l-4 border-l-primary/50">
        <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-5 glow-text">Service Capabilities</h4>
        <div class="space-y-4">
          <div class="flex justify-between border-b border-white/5 pb-3"><span class="text-sm text-on-surface-variant">Standard Air</span><span class="text-sm font-bold text-white">3–7 Days</span></div>
          <div class="flex justify-between border-b border-white/5 pb-3"><span class="text-sm text-on-surface-variant">Express NFO</span><span class="text-sm font-bold text-white">24–48 Hours</span></div>
          <div class="flex justify-between pb-1"><span class="text-sm text-on-surface-variant">Charter</span><span class="text-sm font-bold text-white">On Request</span></div>
        </div>
      </div>
    </div>
  </div>
</div>
</main>

<footer class="bg-[#0b0e14] pt-20 pb-10 mt-12 border-t border-white/5">
<div class="bg-[#10131a] w-full py-16 mb-4">
<div class="grid grid-cols-2 md:grid-cols-4 gap-12 px-12 max-w-7xl mx-auto">
  <div class="col-span-2 md:col-span-1"><div class="text-2xl font-black text-white mb-4 uppercase tracking-tighter">PT Ambara Artha</div><p class="text-slate-500 text-xs leading-relaxed">&copy; 2025 PT Ambara Artha Globaltrans. Your secure way for global delivery.</p></div>
  <div><h5 class="text-accent font-headline text-xs uppercase tracking-[0.2em] font-bold mb-6">Services</h5><ul class="space-y-3"><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="services.html">Air Freight</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="services.html">Customs Clearance</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="services.html">Sourcing &amp; Procurement</a></li></ul></div>
  <div><h5 class="text-accent font-headline text-xs uppercase tracking-[0.2em] font-bold mb-6">Company</h5><ul class="space-y-3"><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="about.html">About Us</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="blog.html">Blog</a></li><li><a class="text-slate-500 hover:text-accent text-xs uppercase tracking-wider font-headline" href="quote.html">Get a Quote</a></li></ul></div>
  <div><h5 class="text-accent font-headline text-xs uppercase tracking-[0.2em] font-bold mb-6">Technical Data</h5><div class="bg-slate-900 p-4 rounded-sm border-l border-accent/30"><span class="font-headline text-[10px] text-accent block mb-2 uppercase tracking-widest">System_Status</span><div class="flex items-center gap-2"><div class="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse"></div><span class="font-headline text-xs text-white">ALL SYSTEMS NOMINAL</span></div></div></div>
</div>
</div>
<div class="max-w-7xl mx-auto px-12 flex justify-between items-center gap-6 py-4">
  <p class="text-slate-600 font-headline text-[10px] uppercase tracking-[0.2em]">&copy; 2025 PT Ambara Artha Globaltrans.</p>
  
</div>
</footer>
<a href="https://wa.me/6282125452800" target="_blank" class="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform"><span class="material-symbols-outlined text-white text-2xl">chat</span></a>
<script>
  async function loadStats(){
    try{const res=await fetch("/api/public-stats");if(!res.ok)return;const d=await res.json();const el=document.getElementById("mapOnTime");if(el)el.textContent=(d.on_time_rate||100)+"%";}catch(e){}
  }
  loadStats();
</script>
</body></html>`;

const blogHtml = `<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Blog & Insights | Ambara Artha</title>
<meta name="description" content="Air freight guides, customs tips, and logistics insights from PT Ambara Artha Globaltrans — Indonesia's air freight specialist."/>
<meta property="og:title" content="Blog & Insights | Ambara Artha"/>
<meta property="og:description" content="Air freight guides, customs tips, and logistics insights from PT Ambara Artha Globaltrans."/>
<meta property="og:type" content="website"/>
<link rel="canonical" href="https://ambaraartha.com/blog.html"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config = {
    darkMode:"class",
    theme:{extend:{
      colors:{"on-tertiary-fixed-variant":"#004d62","on-primary-fixed":"#370e00","surface-container-lowest":"#0a0e13","on-tertiary":"#003544","tertiary":"#89d0ed","surface":"#101419","surface-bright":"#36393f","inverse-surface":"#e0e2ea","on-surface":"#e0e2ea","on-background":"#e0e2ea","error-container":"#93000a","secondary-fixed":"#d3e4fc","outline-variant":"#44474c","surface-tint":"#ffb599","error":"#ffb4ab","surface-container-low":"#181c21","inverse-primary":"#a63b00","secondary-fixed-dim":"#b7c8df","surface-container":"#1c2025","outline":"#8e9197","secondary-container":"#3a4a5d","surface-container-highest":"#31353b","on-secondary-container":"#a9bad0","surface-container-high":"#262a30","inverse-on-surface":"#2d3136","on-primary-container":"#e55400","on-tertiary-container":"#438da8","tertiary-container":"#001f29","tertiary-fixed-dim":"#89d0ed","primary-fixed":"#ffdbce","on-secondary":"#213244","primary":"#ffb599","primary-container":"#370e00","on-surface-variant":"#c4c6cd","on-error-container":"#ffdad6","secondary":"#b7c8df","on-tertiary-fixed":"#001f29","on-primary":"#5a1c00","primary-fixed-dim":"#ffb599","on-secondary-fixed":"#0b1d2e","on-error":"#690005","on-primary-fixed-variant":"#7f2b00","tertiary-fixed":"#baeaff","surface-dim":"#101419","on-secondary-fixed-variant":"#38485b","background":"#101419","surface-variant":"#31353b"},
      fontFamily:{"headline":["Manrope"],"body":["Inter"],"label":["Space Grotesk"]},
      borderRadius:{"DEFAULT":"0.125rem","lg":"0.25rem","xl":"0.5rem","full":"0.75rem"}
    }}
  }
</script>
<style>
  .material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24;}
  .safety-gradient{background:linear-gradient(135deg,#ffb599 0%,#e55400 100%);}
  .cat-badge{display:inline-block;padding:2px 10px;border-radius:100px;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;}
  .cat-guides{background:rgba(137,208,237,.12);color:#89d0ed;}
  .cat-regulations{background:rgba(255,181,153,.12);color:#ffb599;}
  .cat-news{background:rgba(26,122,74,.12);color:#4ade80;}
  .cat-general{background:rgba(255,255,255,.08);color:#c4c6cd;}
</style>
</head>
<body class="bg-background text-on-background font-body selection:bg-primary selection:text-on-primary">

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-[#0B1D2E] backdrop-blur-md opacity-95 shadow-2xl shadow-black/50">
<div class="flex justify-between items-center max-w-7xl mx-auto px-8 py-5">
  <a href="index.html" class="text-2xl font-black tracking-tighter text-white uppercase font-headline">Ambara Artha</a>
  <div class="hidden md:flex space-x-8 items-center">
    <a class="text-slate-300 hover:text-sky-200 transition-colors font-body text-sm uppercase tracking-wider" href="index.html">Home</a>
    <a class="text-slate-300 hover:text-sky-200 transition-colors font-body text-sm uppercase tracking-wider" href="services.html">Services</a>
    <a class="text-slate-300 hover:text-sky-200 transition-colors font-body text-sm uppercase tracking-wider" href="network.html">Network</a>
    <a class="text-sky-400 font-bold border-b-2 border-sky-400 pb-1 font-body text-sm uppercase tracking-wider" href="blog.html">Blog</a>
    <a class="text-slate-300 hover:text-sky-200 transition-colors font-body text-sm uppercase tracking-wider" href="contact.html">Contact</a>
  </div>
  <a href="quote.html" class="safety-gradient text-on-primary-fixed px-6 py-2 font-headline font-bold text-sm rounded-sm active:scale-95 transition-transform">Get a Quote</a>
</div>
</nav>

<!-- Hero -->
<section class="pt-40 pb-16 px-8 max-w-7xl mx-auto">
  <span class="font-label text-tertiary uppercase tracking-[0.3em] text-xs mb-4 block">Insights & Knowledge Base</span>
  <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
    <div>
      <h1 class="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-4">Blog <span class="text-primary">&</span><br/>Insights.</h1>
      <p class="text-on-surface-variant text-lg max-w-xl leading-relaxed">Air freight guides, customs tips, and industry news — in English and Bahasa Indonesia.</p>
    </div>
    <!-- Language toggle -->
    <div class="flex gap-2 flex-shrink-0">
      <button id="btnEN" onclick="setLang('en')" class="safety-gradient text-on-primary-fixed px-5 py-2 font-label text-xs font-bold rounded-sm uppercase tracking-wider">English</button>
      <button id="btnID" onclick="setLang('id')" class="border border-outline-variant text-on-surface-variant px-5 py-2 font-label text-xs font-bold rounded-sm uppercase tracking-wider hover:border-outline transition-colors">Bahasa</button>
    </div>
  </div>

  <!-- Category filter -->
  <div class="flex gap-3 flex-wrap mb-12 border-b border-outline-variant/30 pb-6">
    <button onclick="filterCat('')" class="cat-btn active font-label text-xs uppercase tracking-wider px-4 py-2 border border-outline-variant hover:border-primary transition-colors" data-cat="">All Topics</button>
    <button onclick="filterCat('guides')" class="cat-btn font-label text-xs uppercase tracking-wider px-4 py-2 border border-outline-variant hover:border-primary transition-colors" data-cat="guides">✈ Freight Guides</button>
    <button onclick="filterCat('regulations')" class="cat-btn font-label text-xs uppercase tracking-wider px-4 py-2 border border-outline-variant hover:border-primary transition-colors" data-cat="regulations">🏛 Customs & Regulations</button>
    <button onclick="filterCat('news')" class="cat-btn font-label text-xs uppercase tracking-wider px-4 py-2 border border-outline-variant hover:border-primary transition-colors" data-cat="news">📢 Company News</button>
  </div>

  <!-- Posts grid -->
  <div id="postsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-64">
    <div class="col-span-full text-center py-16 text-outline font-label text-sm animate-pulse">Loading posts...</div>
  </div>

  <!-- Load more -->
  <div id="loadMoreWrap" class="text-center mt-12" style="display:none;">
    <button onclick="loadMore()" class="border border-outline-variant text-on-surface-variant px-8 py-3 font-label text-xs uppercase tracking-wider hover:border-primary hover:text-primary transition-colors">Load More</button>
  </div>
</section>

<!-- SEO CTA -->
<section class="py-20 bg-surface-container-lowest border-y border-outline-variant/20 px-8 mt-16">
  <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
    <div>
      <h2 class="font-headline text-3xl font-bold text-on-surface mb-2">Ready to Ship from Indonesia?</h2>
      <p class="text-on-surface-variant">Get a competitive air freight quote from our team at CGK Cargo Terminal.</p>
    </div>
    <div class="flex gap-4 flex-shrink-0">
      <a href="quote.html" class="safety-gradient text-on-primary-fixed px-8 py-3 font-headline font-bold text-sm rounded-sm hover:opacity-90 transition-opacity">Get a Free Quote</a>
      <a href="contact.html" class="border border-outline-variant px-8 py-3 font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors rounded-sm">Contact Us</a>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="bg-[#0B1D2E] w-full">
<div class="grid grid-cols-1 md:grid-cols-4 gap-16 max-w-7xl mx-auto px-10 py-20">
  <div><div class="text-xl font-black text-white tracking-widest font-headline mb-8 uppercase">Ambara Artha</div><p class="font-body text-xs text-slate-400 opacity-70 leading-relaxed">&copy; 2025 PT Ambara Artha Globaltrans. Your secure way for global delivery.</p></div>
  <div><h4 class="font-headline text-lg font-bold text-white mb-6">Services</h4><ul class="space-y-4 font-body text-xs"><li><a class="text-slate-400 hover:text-sky-300 transition-colors" href="services.html">Air Freight</a></li><li><a class="text-slate-400 hover:text-sky-300 transition-colors" href="services.html">Customs Clearance</a></li><li><a class="text-slate-400 hover:text-sky-300 transition-colors" href="services.html">Sourcing &amp; Procurement</a></li></ul></div>
  <div><h4 class="font-headline text-lg font-bold text-white mb-6">Company</h4><ul class="space-y-4 font-body text-xs"><li><a class="text-slate-400 hover:text-sky-300 transition-colors" href="about.html">About Us</a></li><li><a class="text-slate-400 hover:text-sky-300 transition-colors" href="blog.html">Blog</a></li><li><a class="text-slate-400 hover:text-sky-300 transition-colors" href="contact.html">Contact</a></li></ul></div>
  <div><h4 class="font-headline text-lg font-bold text-white mb-6">Contact</h4><ul class="space-y-4 font-body text-xs text-slate-400"><li><a href="/cdn-cgi/l/email-protection#6e0d1d2e0f030c0f1c0f0f1c1a060f400d0103" class="hover:text-sky-300 transition-colors"><span class="__cf_email__" data-cfemail="ddbeae9dbcb0bfbcafbcbcafa9b5bcf3beb2b0">[email&#160;protected]</span></a></li><li><a href="https://wa.me/6282125452800" class="hover:text-sky-300 transition-colors">+62 821-2545-2800</a></li><li>24 Hours &middot; 7 Days</li></ul></div>
</div>
<div class="border-t border-slate-800/50 py-8 max-w-7xl mx-auto px-10 flex justify-between items-center"><div class="font-body text-xs text-slate-400 opacity-70">&copy; 2025 PT Ambara Artha Globaltrans.</div><div class="font-label text-[10px] text-sky-500 uppercase tracking-widest">Global Terminal Ops // ACTIVE</div></div>
</footer>

<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
  let currentLang = 'en';
  let currentCat = '';
  let offset = 0;
  const limit = 9;
  let totalPosts = 0;

  const catColors = { guides:'cat-guides', regulations:'cat-regulations', news:'cat-news', general:'cat-general' };

  function setLang(lang) {
    currentLang = lang;
    document.getElementById('btnEN').className = lang==='en'
      ? 'safety-gradient text-on-primary-fixed px-5 py-2 font-label text-xs font-bold rounded-sm uppercase tracking-wider'
      : 'border border-outline-variant text-on-surface-variant px-5 py-2 font-label text-xs font-bold rounded-sm uppercase tracking-wider hover:border-outline transition-colors';
    document.getElementById('btnID').className = lang==='id'
      ? 'safety-gradient text-on-primary-fixed px-5 py-2 font-label text-xs font-bold rounded-sm uppercase tracking-wider'
      : 'border border-outline-variant text-on-surface-variant px-5 py-2 font-label text-xs font-bold rounded-sm uppercase tracking-wider hover:border-outline transition-colors';
    offset = 0;
    loadPosts(true);
  }

  function filterCat(cat) {
    currentCat = cat;
    offset = 0;
    document.querySelectorAll('.cat-btn').forEach(b => {
      b.classList.toggle('border-primary', b.dataset.cat === cat);
      b.classList.toggle('text-primary', b.dataset.cat === cat);
      b.classList.toggle('border-outline-variant', b.dataset.cat !== cat);
      b.classList.toggle('text-on-surface-variant', b.dataset.cat !== cat);
    });
    loadPosts(true);
  }

  function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString(currentLang==='id'?'id-ID':'en-US', {day:'numeric',month:'long',year:'numeric'});
  }

  function renderPost(p) {
    const title = currentLang==='id' ? p.title_id : p.title_en;
    const excerpt = currentLang==='id' ? p.excerpt_id : p.excerpt_en;
    const catColor = catColors[p.category] || 'cat-general';
    const catLabel = {guides:'Freight Guide', regulations:'Regulations', news:'Company News', general:'General'}[p.category] || p.category;
    return \`
      <a href="blog-post.html?slug=\${p.slug}&lang=\${currentLang}" class="group block bg-surface-container-low hover:bg-surface-container transition-colors duration-300 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
        \${p.cover_image_url ? \`<div class="h-48 overflow-hidden"><img src="\${p.cover_image_url}" alt="\${title}" class="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700"/></div>\` : \`<div class="h-48 bg-surface-container-high flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-outline">article</span></div>\`}
        <div class="p-8">
          <div class="flex items-center gap-3 mb-4">
            <span class="cat-badge \${catColor}">\${catLabel}</span>
            <span class="font-label text-[10px] text-outline uppercase tracking-wider">\${formatDate(p.published_at)}</span>
          </div>
          <h3 class="font-headline text-xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors leading-tight">\${title}</h3>
          <p class="text-on-surface-variant text-sm leading-relaxed line-clamp-3">\${excerpt||''}</p>
          <div class="mt-6 flex items-center gap-2 text-primary font-label text-xs uppercase tracking-widest">
            <span>Read Article</span>
            <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
        </div>
      </a>\`;
  }

  async function loadPosts(reset=false) {
    if (reset) { offset=0; document.getElementById('postsGrid').innerHTML='<div class="col-span-full text-center py-16 text-outline font-label text-sm animate-pulse">Loading posts...</div>'; }
    try {
      const params = new URLSearchParams({ action:'list', lang:currentLang, limit, offset });
      if (currentCat) params.set('category', currentCat);
      const res = await fetch(\`/api/blog-api?\${params}\`);
      const { posts, total } = await res.json();
      totalPosts = total;
      const grid = document.getElementById('postsGrid');
      if (reset) grid.innerHTML = '';
      if (!posts.length && reset) {
        grid.innerHTML = '<div class="col-span-full text-center py-16 text-outline font-label text-sm">No posts found.</div>';
      } else {
        posts.forEach(p => { const div=document.createElement('div'); div.innerHTML=renderPost(p); grid.appendChild(div.firstElementChild); });
      }
      offset += posts.length;
      document.getElementById('loadMoreWrap').style.display = offset < totalPosts ? 'block' : 'none';
    } catch(e) {
      document.getElementById('postsGrid').innerHTML='<div class="col-span-full text-center py-16 text-red-400 font-label text-sm">Failed to load posts. Please refresh.</div>';
    }
  }

  function loadMore() { loadPosts(false); }
  loadPosts(true);
</script>
</body></html>`;

const blogpostHtml = `<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title id="pageTitle">Blog | Ambara Artha</title>
<meta id="metaDesc" name="description" content=""/>
<meta id="ogTitle" property="og:title" content=""/>
<meta id="ogDesc" property="og:description" content=""/>
<meta property="og:type" content="article"/>
<meta id="ogImage" property="og:image" content=""/>
<link id="canonical" rel="canonical" href="https://ambaraartha.com/blog-post.html"/>
<!-- Structured Data -->
<script id="structuredData" type="application/ld+json">{}</script>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config = {
    darkMode:"class",
    theme:{extend:{
      colors:{"on-tertiary-fixed-variant":"#004d62","on-primary-fixed":"#370e00","surface-container-lowest":"#0a0e13","on-tertiary":"#003544","tertiary":"#89d0ed","surface":"#101419","surface-bright":"#36393f","inverse-surface":"#e0e2ea","on-surface":"#e0e2ea","on-background":"#e0e2ea","error-container":"#93000a","secondary-fixed":"#d3e4fc","outline-variant":"#44474c","surface-tint":"#ffb599","error":"#ffb4ab","surface-container-low":"#181c21","inverse-primary":"#a63b00","secondary-fixed-dim":"#b7c8df","surface-container":"#1c2025","outline":"#8e9197","secondary-container":"#3a4a5d","surface-container-highest":"#31353b","on-secondary-container":"#a9bad0","surface-container-high":"#262a30","inverse-on-surface":"#2d3136","on-primary-container":"#e55400","on-tertiary-container":"#438da8","tertiary-container":"#001f29","tertiary-fixed-dim":"#89d0ed","primary-fixed":"#ffdbce","on-secondary":"#213244","primary":"#ffb599","primary-container":"#370e00","on-surface-variant":"#c4c6cd","on-error-container":"#ffdad6","secondary":"#b7c8df","on-tertiary-fixed":"#001f29","on-primary":"#5a1c00","primary-fixed-dim":"#ffb599","on-secondary-fixed":"#0b1d2e","on-error":"#690005","on-primary-fixed-variant":"#7f2b00","tertiary-fixed":"#baeaff","surface-dim":"#101419","on-secondary-fixed-variant":"#38485b","background":"#101419","surface-variant":"#31353b"},
      fontFamily:{"headline":["Manrope"],"body":["Inter"],"label":["Space Grotesk"]},
      borderRadius:{"DEFAULT":"0.125rem","lg":"0.25rem","xl":"0.5rem","full":"0.75rem"}
    }}
  }
</script>
<style>
  .material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24;}
  .safety-gradient{background:linear-gradient(135deg,#ffb599 0%,#e55400 100%);}
  /* Article content styles */
  #articleContent h2{font-family:"Manrope",sans-serif;font-size:1.6rem;font-weight:800;color:#e0e2ea;margin:2rem 0 1rem;letter-spacing:-.02em;}
  #articleContent h3{font-family:"Manrope",sans-serif;font-size:1.2rem;font-weight:700;color:#e0e2ea;margin:1.5rem 0 .75rem;}
  #articleContent p{color:#c4c6cd;line-height:1.8;margin-bottom:1.25rem;}
  #articleContent strong{color:#e0e2ea;font-weight:600;}
  #articleContent ul,#articleContent ol{margin:0 0 1.25rem 1.5rem;color:#c4c6cd;line-height:1.8;}
  #articleContent li{margin-bottom:.5rem;}
  #articleContent a{color:#ffb599;text-decoration:underline;}
  #articleContent a:hover{opacity:.8;}
  #articleContent blockquote{border-left:3px solid #ffb599;padding:1rem 1.5rem;background:#1c2025;margin:1.5rem 0;font-style:italic;}
  #articleContent code{background:#262a30;padding:2px 6px;border-radius:2px;font-size:.85em;color:#89d0ed;}
</style>
</head>
<body class="bg-background text-on-background font-body selection:bg-primary selection:text-on-primary">

<nav class="fixed top-0 w-full z-50 bg-[#0B1D2E] backdrop-blur-md opacity-95 shadow-2xl shadow-black/50">
<div class="flex justify-between items-center max-w-7xl mx-auto px-8 py-5">
  <a href="index.html" class="text-2xl font-black tracking-tighter text-white uppercase font-headline">Ambara Artha</a>
  <div class="hidden md:flex space-x-8 items-center">
    <a class="text-slate-300 hover:text-sky-200 transition-colors font-body text-sm uppercase tracking-wider" href="index.html">Home</a>
    <a class="text-slate-300 hover:text-sky-200 transition-colors font-body text-sm uppercase tracking-wider" href="services.html">Services</a>
    <a class="text-sky-400 font-bold border-b-2 border-sky-400 pb-1 font-body text-sm uppercase tracking-wider" href="blog.html">Blog</a>
    <a class="text-slate-300 hover:text-sky-200 transition-colors font-body text-sm uppercase tracking-wider" href="contact.html">Contact</a>
  </div>
  <a href="quote.html" class="safety-gradient text-on-primary-fixed px-6 py-2 font-headline font-bold text-sm rounded-sm active:scale-95 transition-transform">Get a Quote</a>
</div>
</nav>

<!-- Loading state -->
<div id="loadingState" class="min-h-screen flex items-center justify-center">
  <div class="text-center"><div class="font-label text-sm text-outline animate-pulse mb-4">Loading article...</div></div>
</div>

<!-- Article -->
<article id="articleWrap" style="display:none;" class="pt-32 pb-20">
  <!-- Hero -->
  <div id="articleHero" class="relative bg-surface-container-low border-b border-outline-variant/20 mb-0">
    <div id="coverImg" class="hidden h-72 overflow-hidden">
      <img id="coverImgEl" src="" alt="" class="w-full h-full object-cover opacity-40 grayscale"/>
      <div class="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent"></div>
    </div>
    <div class="max-w-3xl mx-auto px-8 py-16 relative">
      <!-- Language toggle -->
      <div class="flex gap-2 mb-8">
        <button id="btnEN" onclick="setLang('en')" class="safety-gradient text-on-primary-fixed px-4 py-1.5 font-label text-xs font-bold rounded-sm uppercase tracking-wider">EN</button>
        <button id="btnID" onclick="setLang('id')" class="border border-outline-variant text-on-surface-variant px-4 py-1.5 font-label text-xs font-bold rounded-sm uppercase tracking-wider hover:border-outline transition-colors">ID</button>
      </div>
      <div class="flex items-center gap-3 mb-5">
        <span id="catBadge" class="inline-block px-3 py-1 rounded-full font-label text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary"></span>
        <span id="postDate" class="font-label text-xs text-outline uppercase tracking-wider"></span>
        <span class="font-label text-xs text-outline">·</span>
        <span id="postAuthor" class="font-label text-xs text-outline"></span>
      </div>
      <h1 id="postTitle" class="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface leading-tight mb-6"></h1>
      <p id="postExcerpt" class="text-on-surface-variant text-xl leading-relaxed mb-8"></p>
      <div id="postTags" class="flex flex-wrap gap-2"></div>
    </div>
  </div>

  <!-- Content -->
  <div class="max-w-3xl mx-auto px-8 py-12">
    <div id="articleContent" class="mb-16"></div>

    <!-- Share / CTA -->
    <div class="border-t border-outline-variant/30 pt-12 mt-8">
      <div class="bg-surface-container p-8 border-l-4 border-primary mb-8">
        <div class="font-label text-xs text-tertiary uppercase tracking-widest mb-3">Need Air Freight from Indonesia?</div>
        <h3 class="font-headline text-2xl font-bold text-on-surface mb-3">Get a Quote from Ambara Artha</h3>
        <p class="text-on-surface-variant text-sm mb-6">Based at Soekarno-Hatta Airport. 40+ years of combined expertise. Available 24/7.</p>
        <div class="flex gap-4 flex-wrap">
          <a href="quote.html" class="safety-gradient text-on-primary-fixed px-6 py-3 font-headline font-bold text-sm rounded-sm hover:opacity-90 transition-opacity">Get a Free Quote</a>
          <a href="contact.html" class="border border-outline-variant px-6 py-3 font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors rounded-sm">Contact Us</a>
        </div>
      </div>
      <a href="blog.html" class="flex items-center gap-2 text-outline hover:text-primary transition-colors font-label text-xs uppercase tracking-widest">
        <span class="material-symbols-outlined text-sm">arrow_back</span>
        <span>Back to Blog</span>
      </a>
    </div>
  </div>
</article>

<!-- Error state -->
<div id="errorState" style="display:none;" class="min-h-screen flex items-center justify-center">
  <div class="text-center px-8">
    <div class="font-headline text-2xl font-bold text-on-surface mb-4">Post not found</div>
    <a href="blog.html" class="font-label text-xs text-primary uppercase tracking-widest hover:opacity-70">← Back to Blog</a>
  </div>
</div>

<footer class="bg-[#0B1D2E] w-full">
<div class="grid grid-cols-1 md:grid-cols-4 gap-16 max-w-7xl mx-auto px-10 py-20">
  <div><div class="text-xl font-black text-white tracking-widest font-headline mb-8 uppercase">Ambara Artha</div><p class="font-body text-xs text-slate-400 opacity-70">&copy; 2025 PT Ambara Artha Globaltrans.</p></div>
  <div><h4 class="font-headline text-lg font-bold text-white mb-6">Services</h4><ul class="space-y-4 font-body text-xs"><li><a class="text-slate-400 hover:text-sky-300 transition-colors" href="services.html">Air Freight</a></li><li><a class="text-slate-400 hover:text-sky-300 transition-colors" href="services.html">Customs Clearance</a></li></ul></div>
  <div><h4 class="font-headline text-lg font-bold text-white mb-6">Company</h4><ul class="space-y-4 font-body text-xs"><li><a class="text-slate-400 hover:text-sky-300 transition-colors" href="about.html">About Us</a></li><li><a class="text-slate-400 hover:text-sky-300 transition-colors" href="blog.html">Blog</a></li></ul></div>
  <div><h4 class="font-headline text-lg font-bold text-white mb-6">Contact</h4><ul class="space-y-4 font-body text-xs text-slate-400"><li><a href="/cdn-cgi/l/email-protection#20435360414d4241524141525448410e434f4d" class="hover:text-sky-300"><span class="__cf_email__" data-cfemail="ee8d9dae8f838c8f9c8f8f9c9a868fc08d8183">[email&#160;protected]</span></a></li><li><a href="https://wa.me/6282125452800" class="hover:text-sky-300">+62 821-2545-2800</a></li></ul></div>
</div>
</footer>

<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  let currentLang = params.get('lang') || 'en';
  let postData = null;

  const catColors = { guides:'bg-tertiary/10 text-tertiary', regulations:'bg-primary/10 text-primary', news:'bg-green-900/30 text-green-400', general:'bg-white/5 text-on-surface-variant' };
  const catLabels = { guides:'Freight Guide', regulations:'Regulations', news:'Company News', general:'General' };

  function setLang(lang) {
    currentLang = lang;
    document.getElementById('btnEN').className = lang==='en'
      ? 'safety-gradient text-on-primary-fixed px-4 py-1.5 font-label text-xs font-bold rounded-sm uppercase tracking-wider'
      : 'border border-outline-variant text-on-surface-variant px-4 py-1.5 font-label text-xs font-bold rounded-sm uppercase tracking-wider hover:border-outline transition-colors';
    document.getElementById('btnID').className = lang==='id'
      ? 'safety-gradient text-on-primary-fixed px-4 py-1.5 font-label text-xs font-bold rounded-sm uppercase tracking-wider'
      : 'border border-outline-variant text-on-surface-variant px-4 py-1.5 font-label text-xs font-bold rounded-sm uppercase tracking-wider hover:border-outline transition-colors';
    if (postData) renderPost(postData);
  }

  function renderPost(p) {
    const title = currentLang==='id' ? p.title_id : p.title_en;
    const excerpt = currentLang==='id' ? p.excerpt_id : p.excerpt_en;
    const content = currentLang==='id' ? p.content_id : p.content_en;
    const metaTitle = currentLang==='id' ? (p.meta_title_id||p.title_id) : (p.meta_title_en||p.title_en);
    const metaDesc = currentLang==='id' ? (p.meta_description_id||p.excerpt_id) : (p.meta_description_en||p.excerpt_en);

    // Update SEO
    document.title = metaTitle + ' | Ambara Artha';
    document.getElementById('metaDesc').content = metaDesc||'';
    document.getElementById('ogTitle').content = metaTitle||'';
    document.getElementById('ogDesc').content = metaDesc||'';
    if (p.cover_image_url) document.getElementById('ogImage').content = p.cover_image_url;
    document.getElementById('canonical').href = \`https://ambaraartha.com/blog-post.html?slug=\${p.slug}&lang=\${currentLang}\`;

    // Structured data
    document.getElementById('structuredData').textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "description": excerpt,
      "author": {"@type":"Organization","name":p.author||"Ambara Artha Team"},
      "publisher": {"@type":"Organization","name":"PT Ambara Artha Globaltrans","url":"https://ambaraartha.com"},
      "datePublished": p.published_at,
      "dateModified": p.updated_at,
      "image": p.cover_image_url || "https://ambaraartha.com/Stamp_2_Stationery_Ambara_Artha_Globaltrans.png",
      "url": \`https://ambaraartha.com/blog-post.html?slug=\${p.slug}&lang=\${currentLang}\`
    });

    // Cover image
    if (p.cover_image_url) {
      document.getElementById('coverImg').classList.remove('hidden');
      document.getElementById('coverImgEl').src = p.cover_image_url;
      document.getElementById('coverImgEl').alt = title;
    }

    // Content
    document.getElementById('catBadge').textContent = catLabels[p.category]||p.category;
    document.getElementById('catBadge').className = 'inline-block px-3 py-1 rounded-full font-label text-xs font-bold uppercase tracking-wider ' + (catColors[p.category]||catColors.general);
    document.getElementById('postDate').textContent = new Date(p.published_at).toLocaleDateString(currentLang==='id'?'id-ID':'en-US',{day:'numeric',month:'long',year:'numeric'});
    document.getElementById('postAuthor').textContent = p.author||'Ambara Artha Team';
    document.getElementById('postTitle').textContent = title;
    document.getElementById('postExcerpt').textContent = excerpt||'';
    document.getElementById('articleContent').innerHTML = content||'';
    if (p.tags?.length) {
      document.getElementById('postTags').innerHTML = p.tags.map(t=>\`<span class="font-label text-[10px] uppercase tracking-wider border border-outline-variant px-2 py-1 text-outline">\${t}</span>\`).join('');
    }
  }

  async function loadPost() {
    if (!slug) { document.getElementById('loadingState').style.display='none'; document.getElementById('errorState').style.display='flex'; return; }
    try {
      const res = await fetch(\`/api/blog-api?action=post&slug=\${encodeURIComponent(slug)}\`);
      if (!res.ok) throw new Error('Not found');
      postData = await res.json();
      renderPost(postData);
      document.getElementById('loadingState').style.display='none';
      document.getElementById('articleWrap').style.display='block';
    } catch(e) {
      document.getElementById('loadingState').style.display='none';
      document.getElementById('errorState').style.display='flex';
    }
  }

  setLang(currentLang);
  loadPost();
</script>
</body></html>`;

const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin — PT Ambara Artha Globaltrans</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f4f6fb; --surface: #fff; --ink: #0a0f1e; --ink-soft: #5a6178;
    --blue: #1a4bbf; --blue-dark: #0f2e80; --blue-light: #e8eefa;
    --red: #d92b2b; --red-dim: #fceaea; --border: #dde2ef;
    --green: #1a7a4a; --green-dim: #e2f2eb;
    --amber: #c97a00; --amber-dim: #fef3e0;
    --sidebar: #0a0f1e; --radius: 12px;
    --shadow: 0 2px 12px rgba(26,75,191,0.08);
    --shadow-lg: 0 8px 32px rgba(26,75,191,0.12);
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Geist', sans-serif; background: var(--bg); color: var(--ink); min-height: 100vh; }
  h1,h2,h3,h4 { font-family: 'Geist', sans-serif; font-optical-sizing: auto; }

  /* LOGIN SCREEN */
  #loginScreen {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #0a0f1e 0%, #0f2e80 100%);
  }
  .login-card {
    background: #fff; border-radius: 20px; padding: 48px 40px;
    width: 100%; max-width: 400px; text-align: center;
    box-shadow: 0 24px 60px rgba(0,0,0,0.3);
  }
  .login-logo { font-family: 'Geist', sans-serif; font-size: 1.2rem; font-weight: 800; color: var(--blue); margin-bottom: 4px; }
  .login-logo span { color: var(--red); }
  .login-sub { font-size: .82rem; color: var(--ink-soft); margin-bottom: 32px; }
  .login-card h2 { font-size: 1.4rem; margin-bottom: 24px; }
  .login-input {
    width: 100%; padding: 13px 16px; border: 1.5px solid var(--border); border-radius: 10px;
    font-family: 'Geist', sans-serif; font-size: .95rem; outline: none; margin-bottom: 14px;
    transition: border-color .2s;
  }
  .login-input:focus { border-color: var(--blue); }
  .login-btn {
    width: 100%; padding: 14px; border-radius: 100px; border: none;
    background: linear-gradient(135deg, var(--blue), var(--blue-dark));
    color: #fff; font-family: 'Geist', sans-serif; font-size: .95rem; font-weight: 700;
    cursor: pointer; transition: transform .15s;
  }
  .login-btn:hover { transform: translateY(-1px); }
  .login-error { color: var(--red); font-size: .85rem; margin-top: 10px; display: none; }

  /* ADMIN LAYOUT */
  #adminApp { display: none; min-height: 100vh; }
  .layout { display: flex; min-height: 100vh; }

  /* SIDEBAR */
  .sidebar {
    width: 240px; background: var(--sidebar); color: #fff;
    display: flex; flex-direction: column; flex-shrink: 0;
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 50;
  }
  .sidebar-brand {
    padding: 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.08);
    font-family: 'Geist', sans-serif; font-size: .95rem; font-weight: 800;
  }
  .sidebar-brand span { color: var(--red); }
  .sidebar-label { font-size: .7rem; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: .1em; padding: 20px 20px 8px; }
  .sidebar-link {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 20px; cursor: pointer; transition: background .15s;
    font-size: .88rem; font-weight: 500; color: rgba(255,255,255,0.6); border-radius: 0;
    border: none; background: transparent; width: 100%; text-align: left;
  }
  .sidebar-link:hover { background: rgba(255,255,255,0.07); color: #fff; }
  .sidebar-link.active { background: rgba(26,75,191,0.4); color: #fff; }
  .sidebar-link .icon { font-size: 1rem; width: 20px; text-align: center; }
  .badge {
    margin-left: auto; background: var(--red); color: #fff;
    font-size: .7rem; font-weight: 700; padding: 2px 7px; border-radius: 100px;
  }
  .sidebar-bottom { margin-top: auto; padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.08); }
  .sidebar-bottom a { font-size: .82rem; color: rgba(255,255,255,0.4); text-decoration: none; }
  .sidebar-bottom a:hover { color: #fff; }

  /* MAIN CONTENT */
  .main { margin-left: 240px; flex: 1; padding: 32px; }
  .page { display: none; }
  .page.active { display: block; }

  /* TOP BAR */
  .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
  .topbar h1 { font-size: 1.5rem; font-weight: 800; letter-spacing: -.03em; }
  .topbar-actions { display: flex; gap: 10px; }

  /* STAT CARDS */
  .stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat-card { background: var(--surface); border-radius: var(--radius); padding: 22px; border: 1px solid var(--border); }
  .stat-card-label { font-size: .78rem; color: var(--ink-soft); font-weight: 500; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
  .stat-card-num { font-family: 'Geist', sans-serif; font-size: 2rem; font-weight: 800; letter-spacing: -.04em; }
  .stat-card-num.blue { color: var(--blue); }
  .stat-card-num.green { color: var(--green); }
  .stat-card-num.amber { color: var(--amber); }
  .stat-card-num.red { color: var(--red); }

  /* TABLE */
  .card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; margin-bottom: 24px; }
  .card-header { padding: 18px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .card-header h3 { font-size: 1rem; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 12px 16px; text-align: left; font-size: .75rem; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid var(--border); background: var(--bg); }
  td { padding: 14px 16px; font-size: .88rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg); }

  /* STATUS BADGES */
  .status { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 100px; font-size: .75rem; font-weight: 600; white-space: nowrap; }
  .status-pending { background: var(--blue-light); color: var(--blue); }
  .status-in-transit { background: var(--amber-dim); color: var(--amber); }
  .status-delivered { background: var(--green-dim); color: var(--green); }
  .status-new { background: var(--red-dim); color: var(--red); }
  .status-unread { background: var(--red-dim); color: var(--red); }
  .status-read { background: #f0f0f0; color: #888; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

  /* BUTTONS */
  .btn { padding: 9px 18px; border-radius: 100px; border: none; font-family: 'Geist', sans-serif; font-size: .82rem; font-weight: 700; cursor: pointer; transition: all .15s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-blue { background: var(--blue); color: #fff; }
  .btn-blue:hover { background: var(--blue-dark); }
  .btn-red { background: var(--red-dim); color: var(--red); }
  .btn-red:hover { background: #f8c8c8; }
  .btn-ghost { background: var(--bg); border: 1px solid var(--border); color: var(--ink); }
  .btn-ghost:hover { border-color: var(--blue); color: var(--blue); }
  .btn-sm { padding: 6px 12px; font-size: .75rem; }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200;
    display: none; align-items: center; justify-content: center; padding: 20px;
  }
  .modal-overlay.open { display: flex; }
  .modal {
    background: #fff; border-radius: 20px; padding: 36px; width: 100%;
    max-width: 560px; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  }
  .modal h3 { font-size: 1.2rem; font-weight: 800; margin-bottom: 20px; }
  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: .8rem; font-weight: 600; margin-bottom: 6px; color: var(--ink-soft); }
  .form-group input, .form-group select, .form-group textarea {
    width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 10px;
    font-family: 'Geist', sans-serif; font-size: .9rem; color: var(--ink);
    background: var(--bg); outline: none; transition: border-color .2s;
  }
  .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--blue); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }

  /* SHIPMENT DETAIL */
  .detail-section { margin-bottom: 24px; }
  .detail-section h4 { font-size: .8rem; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }

  /* TIMELINE IN ADMIN */
  .tl-item { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
  .tl-dot-sm { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
  .tl-dot-sm.done { background: var(--green-dim); color: var(--green); }
  .tl-dot-sm.active { background: var(--blue-light); color: var(--blue); }
  .tl-dot-sm.pending { background: #f0f0f0; color: #aaa; }
  .tl-text { font-size: .88rem; }
  .tl-meta-sm { font-size: .78rem; color: var(--ink-soft); }

  /* EMPTY STATE */
  .empty { text-align: center; padding: 48px 20px; color: var(--ink-soft); }
  .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
  .empty h4 { font-size: 1rem; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
  .empty p { font-size: .88rem; }

  /* SEARCH */
  .search-input {
    padding: 9px 16px; border: 1.5px solid var(--border); border-radius: 100px;
    font-family: 'Geist', sans-serif; font-size: .88rem; outline: none; width: 240px;
    transition: border-color .2s;
  }
  .search-input:focus { border-color: var(--blue); }

  .loading { text-align: center; padding: 32px; color: var(--ink-soft); font-size: .9rem; }

  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { margin-left: 0; padding: 20px; }
    .stat-cards { grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>

<!-- LOGIN -->
<div id="loginScreen">
  <div class="login-card">
    <div class="login-logo">Ambara <span>Artha</span> Globaltrans</div>
    <div class="login-sub">Admin Dashboard</div>
    <h2>Sign In</h2>
    <input type="password" class="login-input" id="loginPass" placeholder="Enter admin password" onkeypress="if(event.key==='Enter')doLogin()" />
    <button class="login-btn" onclick="doLogin()">Sign In →</button>
    <div class="login-error" id="loginError">❌ Incorrect password. Please try again.</div>
  </div>
</div>

<!-- ADMIN APP -->
<div id="adminApp">
  <div class="layout">

    <!-- SIDEBAR -->
    <div class="sidebar">
      <div class="sidebar-brand">Ambara <span>Admin</span></div>
      <div class="sidebar-label">Main</div>
      <button class="sidebar-link active" onclick="showPage('dashboard', this)"><span class="icon">📊</span> Dashboard</button>
      <button class="sidebar-link" onclick="showPage('shipments', this)"><span class="icon">📦</span> Shipments</button>
      <div class="sidebar-label">Inbox</div>
      <button class="sidebar-link" onclick="showPage('quotes', this)"><span class="icon">💬</span> Quote Requests <span class="badge" id="quoteBadge">0</span></button>
      <button class="sidebar-link" onclick="showPage('contacts', this)"><span class="icon">📩</span> Messages <span class="badge" id="contactBadge">0</span></button>
      <div class="sidebar-label">Content</div>
      <button class="sidebar-link" onclick="showPage('blog', this)"><span class="icon">📝</span> Blog Posts</button>
      <div class="sidebar-bottom">
        <a href="index.html" target="_blank">← Back to Website</a>
      </div>
    </div>

    <!-- MAIN -->
    <div class="main">

      <!-- DASHBOARD PAGE -->
      <div class="page active" id="page-dashboard">
        <div class="topbar">
          <div>
            <h1>Dashboard</h1>
            <p style="font-size:.85rem;color:var(--ink-soft);margin-top:2px;">Welcome back! Here's what's happening.</p>
          </div>
          <div class="topbar-actions">
            <button class="btn btn-blue" onclick="openNewShipmentModal()">＋ New Shipment</button>
          </div>
        </div>

        <div class="stat-cards">
          <div class="stat-card"><div class="stat-card-label">Tonnage Shipped (kg)</div><div class="stat-card-num blue" id="statTonnage">—</div></div>
          <div class="stat-card"><div class="stat-card-label">On-Time Rate</div><div class="stat-card-num green" id="statOnTime">—</div></div>
          <div class="stat-card"><div class="stat-card-label">Damaged Goods</div><div class="stat-card-num red" id="statDamaged">—</div></div>
          <div class="stat-card"><div class="stat-card-label">Countries Covered</div><div class="stat-card-num amber" id="statCountries">52+</div></div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Recent Shipments</h3><button class="btn btn-ghost btn-sm" onclick="showPage('shipments', document.querySelector('.sidebar-link:nth-child(4))'))">View All</button></div>
          <table>
            <thead><tr><th>Tracking #</th><th>Shipment</th><th>Route</th><th>Status</th><th>Customer</th></tr></thead>
            <tbody id="dashShipments"><tr><td colspan="5" class="loading">Loading...</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- SHIPMENTS PAGE -->
      <div class="page" id="page-shipments">
        <div class="topbar">
          <h1>Shipments</h1>
          <div class="topbar-actions">
            <input type="text" class="search-input" placeholder="🔍 Search tracking #..." oninput="filterShipments(this.value)" />
            <button class="btn btn-blue" onclick="openNewShipmentModal()">＋ New Shipment</button>
          </div>
        </div>
        <div class="card">
          <table>
            <thead><tr><th>Tracking #</th><th>Title</th><th>Route</th><th>Status</th><th>Customer</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody id="shipmentsTable"><tr><td colspan="7" class="loading">Loading...</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- QUOTES PAGE -->
      <div class="page" id="page-quotes">
        <div class="topbar"><h1>Quote Requests</h1></div>
        <div class="card">
          <table>
            <thead><tr><th>Ref #</th><th>Type</th><th>Route</th><th>Company</th><th>Contact</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody id="quotesTable"><tr><td colspan="8" class="loading">Loading...</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- CONTACTS PAGE -->
      <div class="page" id="page-contacts">
        <div class="topbar"><h1>Contact Messages</h1></div>
        <div class="card">
          <table>
            <thead><tr><th>Name</th><th>Company</th><th>Topic</th><th>Message</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody id="contactsTable"><tr><td colspan="7" class="loading">Loading...</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- BLOG PAGE -->
      <div class="page" id="page-blog">
        <div class="topbar">
          <h1>Blog Posts</h1>
          <div class="topbar-actions">
            <button class="btn btn-blue" onclick="openBlogModal()">＋ New Post</button>
          </div>
        </div>
        <div class="card">
          <table>
            <thead><tr><th>Title (EN)</th><th>Category</th><th>Status</th><th>Published</th><th>Actions</th></tr></thead>
            <tbody id="blogTable"><tr><td colspan="5" class="loading">Loading...</td></tr></tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- NEW SHIPMENT MODAL -->
<div class="modal-overlay" id="newShipmentModal">
  <div class="modal" style="max-width:640px">
    <h3>✈️ New Shipment</h3>

    <div class="form-row">
      <div class="form-group">
        <label>Tracking Number *</label>
        <input type="text" id="ns_tracking" placeholder="AAG-2025-XXXXX" />
      </div>
      <div class="form-group">
        <label>Status *</label>
        <select id="ns_status">
          <option value="pending">Pending</option>
          <option value="in-transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>Goods Description *</label>
      <input type="text" id="ns_title" placeholder="e.g. Electronics — Samsung Phones" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Origin Airport (IATA) *</label>
        <input type="text" id="ns_origin_iata" placeholder="e.g. CGK" maxlength="3" style="text-transform:uppercase" />
      </div>
      <div class="form-group">
        <label>Destination Airport (IATA) *</label>
        <input type="text" id="ns_dest_iata" placeholder="e.g. SIN" maxlength="3" style="text-transform:uppercase" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Origin (Full) *</label>
        <input type="text" id="ns_origin" placeholder="e.g. Jakarta, ID" />
      </div>
      <div class="form-group">
        <label>Destination (Full) *</label>
        <input type="text" id="ns_destination" placeholder="e.g. Singapore, SG" />
      </div>
    </div>

    <div style="border-top:1px solid var(--border);margin:16px 0 16px;padding-top:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Shipper Details</div>
      <div class="form-group">
        <label>Shipper Name *</label>
        <input type="text" id="ns_shipper_name" placeholder="Company or individual name" />
      </div>
      <div class="form-group">
        <label>Shipper Address</label>
        <input type="text" id="ns_shipper_address" placeholder="Full address" />
      </div>
    </div>

    <div style="border-top:1px solid var(--border);margin:0 0 16px;padding-top:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Consignee Details</div>
      <div class="form-group">
        <label>Consignee Name *</label>
        <input type="text" id="ns_custname" placeholder="Company or individual name" />
      </div>
      <div class="form-group">
        <label>Consignee Address</label>
        <input type="text" id="ns_consignee_address" placeholder="Full address" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Consignee Phone</label>
          <input type="text" id="ns_consignee_phone" placeholder="+62 ..." />
        </div>
        <div class="form-group">
          <label>Consignee Email</label>
          <input type="email" id="ns_custemail" placeholder="customer@email.com" />
        </div>
      </div>
    </div>

    <div style="border-top:1px solid var(--border);margin:0 0 16px;padding-top:16px">
      <div style="font-size:.78rem;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Cargo Details</div>
      <div class="form-row">
        <div class="form-group">
          <label>Total Pieces *</label>
          <input type="number" id="ns_pcs" placeholder="e.g. 10" min="1" value="1" />
        </div>
        <div class="form-group">
          <label>Weight (kg) *</label>
          <input type="number" id="ns_weight" placeholder="e.g. 150.5" step="0.01" min="0" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Chargeable Weight (kg)</label>
          <input type="number" id="ns_chargeable" placeholder="If different from actual" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label>Damaged?</label>
          <select id="ns_damaged">
            <option value="false">No</option>
            <option value="true">Yes — Report Damage</option>
          </select>
        </div>
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('newShipmentModal')">Cancel</button>
      <button class="btn btn-blue" onclick="createShipment()">✈️ Create Shipment</button>
    </div>
  </div>
</div>

<!-- SHIPMENT DETAIL MODAL -->
<div class="modal-overlay" id="detailModal">
  <div class="modal" style="max-width:680px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h3 id="detailTitle">Shipment Detail</h3>
      <button class="btn btn-ghost btn-sm" onclick="closeModal('detailModal')">✕ Close</button>
    </div>
    <div id="detailContent">Loading...</div>
  </div>
</div>

<!-- ADD EVENT MODAL -->
<div class="modal-overlay" id="addEventModal">
  <div class="modal">
    <h3>＋ Add Tracking Event</h3>
    <input type="hidden" id="ev_shipment_id" />
    <div class="form-group">
      <label>Event Label *</label>
      <input type="text" id="ev_label" placeholder="e.g. Departed Port of Shanghai" />
    </div>
    <div class="form-group">
      <label>Location</label>
      <input type="text" id="ev_location" placeholder="e.g. Port of Shanghai, CN" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Date & Time *</label>
        <input type="datetime-local" id="ev_time" />
      </div>
      <div class="form-group">
        <label>State *</label>
        <select id="ev_state">
          <option value="done">✓ Done</option>
          <option value="active">▶ Active (Current)</option>
          <option value="pending">○ Pending (Upcoming)</option>
        </select>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('addEventModal')">Cancel</button>
      <button class="btn btn-blue" onclick="addEvent()">Add Event</button>
    </div>
  </div>
</div>

<script>
  let adminPassword = '';
  let allShipments = [];

  // ── AUTH ──
  function doLogin() {
    const pass = document.getElementById('loginPass').value;
    adminPassword = pass;

    // Test auth with a real API call
    apiFetch('GET', 'shipments')
      .then(() => {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminApp').style.display = 'block';
        loadDashboard();
        loadShipments();
        loadQuotes();
        loadContacts();
      })
      .catch(() => {
        document.getElementById('loginError').style.display = 'block';
        adminPassword = '';
      });
  }

  // ── API ──
  function apiFetch(method, action, body) {
    return fetch(\`/api/admin-api?action=\${action}\`, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
      body: body ? JSON.stringify(body) : undefined
    }).then(r => {
      if (!r.ok) throw new Error('Unauthorized');
      return r.json();
    });
  }

  // ── NAVIGATION ──
  function showPage(name, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    if (btn) btn.classList.add('active');
  }

  // ── DASHBOARD ──
  async function loadDashboard() {
    try {
      const ships = await apiFetch('GET', 'shipments');
      const quotes = await apiFetch('GET', 'quotes');

      // Tonnage — sum of weight_kg for all shipments
      const totalKg = ships.reduce((sum, s) => sum + parseFloat(s.weight_kg || 0), 0);
      document.getElementById('statTonnage').textContent = totalKg > 0 ? totalKg.toFixed(1) : '0';

      // On-time rate — delivered / total * 100 (if no shipments show N/A)
      const delivered = ships.filter(s => s.status === 'delivered').length;
      const damaged = ships.filter(s => s.is_damaged === true).length;
      const onTime = delivered > 0 ? Math.round((delivered - damaged) / delivered * 100) : 100;
      document.getElementById('statOnTime').textContent = ships.length > 0 ? onTime + '%' : '100%';

      // Damaged goods count
      document.getElementById('statDamaged').textContent = damaged;

      // Countries — static
      document.getElementById('statCountries').textContent = '52+';

      const recent = ships.slice(0, 5);
      document.getElementById('dashShipments').innerHTML = recent.length === 0
        ? '<tr><td colspan="5"><div class="empty"><div class="empty-icon">📦</div><h4>No shipments yet</h4><p>Create your first shipment!</p></div></td></tr>'
        : recent.map(s => \`
          <tr>
            <td><strong>\${s.tracking_number}</strong></td>
            <td>\${s.title}</td>
            <td style="color:var(--ink-soft);font-size:.82rem">\${s.origin_iata || s.origin} → \${s.destination_iata || s.destination}</td>
            <td>\${statusBadge(s.status)}</td>
            <td style="font-size:.82rem">\${s.customer_name || '—'}</td>
          </tr>\`).join('');
    } catch(e) { console.error(e); }
  }

  // ── SHIPMENTS ──
  async function loadShipments() {
    try {
      allShipments = await apiFetch('GET', 'shipments');
      renderShipments(allShipments);
    } catch(e) { console.error(e); }
  }

  function renderShipments(ships) {
    const tbody = document.getElementById('shipmentsTable');
    if (ships.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><div class="empty-icon">📦</div><h4>No shipments yet</h4><p>Click "+ New Shipment" to add one.</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = ships.map(s => \`
      <tr>
        <td><strong style="font-family:monospace">\${s.tracking_number}</strong></td>
        <td>\${s.title}</td>
        <td style="font-size:.82rem;color:var(--ink-soft)">\${s.origin} → \${s.destination}</td>
        <td>\${statusBadge(s.status)}</td>
        <td style="font-size:.82rem">\${s.customer_name || '—'}</td>
        <td style="font-size:.78rem;color:var(--ink-soft)">\${formatDate(s.created_at)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="openDetail(\${s.id})">📋 Detail</button>
            <button class="btn btn-red btn-sm" onclick="deleteShipment(\${s.id}, '\${s.tracking_number}')">🗑️</button>
          </div>
        </td>
      </tr>\`).join('');
  }

  function filterShipments(q) {
    const filtered = allShipments.filter(s =>
      s.tracking_number.toLowerCase().includes(q.toLowerCase()) ||
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      (s.customer_name || '').toLowerCase().includes(q.toLowerCase())
    );
    renderShipments(filtered);
  }

  async function openDetail(id) {
    document.getElementById('detailModal').classList.add('open');
    document.getElementById('detailContent').innerHTML = '<div class="loading">Loading...</div>';

    try {
      const { shipment: s, events, docs } = await apiFetch('GET', \`shipment&id=\${id}\`);
      document.getElementById('detailTitle').textContent = s.tracking_number;

      document.getElementById('detailContent').innerHTML = \`
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center;">
          \${statusBadge(s.status)}
          <span style="font-size:.85rem;color:var(--ink-soft);">✈️ \${s.origin_iata||s.origin} → \${s.destination_iata||s.destination}</span>
          \${s.weight_kg ? \`<span style="font-size:.85rem;color:var(--ink-soft);">⚖️ \${s.weight_kg} kg</span>\` : ''}
          \${s.total_pcs ? \`<span style="font-size:.85rem;color:var(--ink-soft);">📦 \${s.total_pcs} pcs</span>\` : ''}
          \${s.is_damaged ? \`<span style="font-size:.85rem;color:var(--red);font-weight:700;">⚠️ Damage Reported</span>\` : ''}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div style="background:var(--bg);border-radius:10px;padding:14px;">
            <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;color:var(--ink-soft);letter-spacing:.06em;margin-bottom:8px;">Shipper</div>
            <div style="font-size:.88rem;font-weight:600;">\${s.shipper_name || '—'}</div>
            <div style="font-size:.78rem;color:var(--ink-soft);margin-top:4px;">\${s.shipper_address || ''}</div>
          </div>
          <div style="background:var(--bg);border-radius:10px;padding:14px;">
            <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;color:var(--ink-soft);letter-spacing:.06em;margin-bottom:8px;">Consignee</div>
            <div style="font-size:.88rem;font-weight:600;">\${s.customer_name || '—'}</div>
            <div style="font-size:.78rem;color:var(--ink-soft);margin-top:4px;">\${s.consignee_address || ''}</div>
            \${s.consignee_phone ? \`<div style="font-size:.78rem;color:var(--ink-soft);">📞 \${s.consignee_phone}</div>\` : ''}
            \${s.customer_email ? \`<div style="font-size:.78rem;color:var(--ink-soft);">✉️ \${s.customer_email}</div>\` : ''}
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center;flex-wrap:wrap;">
          <label style="font-size:.78rem;font-weight:700;color:var(--ink-soft);">UPDATE STATUS:</label>
          <select onchange="updateStatus(\${s.id}, this.value)" style="padding:6px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:'Geist',sans-serif;font-size:.85rem;outline:none;">
            <option \${s.status==='pending'?'selected':''} value="pending">Pending</option>
            <option \${s.status==='in-transit'?'selected':''} value="in-transit">In Transit</option>
            <option \${s.status==='delivered'?'selected':''} value="delivered">Delivered</option>
          </select>
          <button class="btn btn-ghost btn-sm" onclick="printConsignmentNotes(\${JSON.stringify(s).replace(/"/g,'&quot;')})">🖨️ Print Labels (\${s.total_pcs||1})</button>
          <button class="btn btn-red btn-sm" onclick="deleteShipment(\${s.id}, '\${s.tracking_number}')">🗑️ Delete</button>
        </div>

        <div class="detail-section" style="margin-top:16px">
          <h4>Tracking Timeline</h4>
          \${events.length === 0 ? '<p style="font-size:.85rem;color:var(--ink-soft)">No events yet.</p>' :
            events.map(e => \`
              <div class="tl-item">
                <div class="tl-dot-sm \${e.state}">\${e.state==='done'?'✓':e.state==='active'?'▶':'○'}</div>
                <div>
                  <div class="tl-text">\${e.label}</div>
                  <div class="tl-meta-sm">\${e.location || ''} · \${formatDate(e.event_time)}</div>
                </div>
                <button class="btn btn-red btn-sm" style="margin-left:auto" onclick="deleteEvent(\${e.id}, \${s.id})">✕</button>
              </div>\`).join('')
          }
          <button class="btn btn-ghost btn-sm" style="margin-top:12px" onclick="openAddEvent(\${s.id})">＋ Add Event</button>
        </div>

        <div class="detail-section">
          <h4>Documents (\${docs.length})</h4>
          \${docs.length === 0 ? '<p style="font-size:.85rem;color:var(--ink-soft)">No documents uploaded.</p>' :
            docs.map(d => \`<div style="font-size:.88rem;padding:6px 0;border-bottom:1px solid var(--border)">📄 \${d.name}</div>\`).join('')
          }
        </div>
      \`;
    } catch(e) {
      document.getElementById('detailContent').innerHTML = '<p style="color:red">Failed to load shipment details.</p>';
    }
  }

  async function updateStatus(id, status) {
    try {
      await apiFetch('POST', 'update-status', { id, status });
      loadShipments(); loadDashboard();
      alert('Status updated successfully!');
    } catch(e) { alert('Failed to update status.'); }
  }

  async function deleteShipment(id, num) {
    if (!confirm(\`Delete shipment \${num}? This cannot be undone.\`)) return;
    try {
      await apiFetch('POST', 'delete-shipment', { id });
      closeModal('detailModal');
      loadShipments(); loadDashboard();
    } catch(e) { alert('Failed to delete shipment.'); }
  }

  // ── NEW SHIPMENT ──
  function openNewShipmentModal() {
    const num = 'AAG-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*90000)+10000);
    document.getElementById('ns_tracking').value = num;
    document.getElementById('ns_pcs').value = 1;
    document.getElementById('ns_damaged').value = 'false';
    document.getElementById('newShipmentModal').classList.add('open');
  }

  async function createShipment() {
    const tracking_number = document.getElementById('ns_tracking').value.trim().toUpperCase();
    const title = document.getElementById('ns_title').value.trim();
    const origin_iata = document.getElementById('ns_origin_iata').value.trim().toUpperCase();
    const destination_iata = document.getElementById('ns_dest_iata').value.trim().toUpperCase();
    const origin = document.getElementById('ns_origin').value.trim();
    const destination = document.getElementById('ns_destination').value.trim();
    const status = document.getElementById('ns_status').value;
    const shipper_name = document.getElementById('ns_shipper_name').value.trim();
    const shipper_address = document.getElementById('ns_shipper_address').value.trim();
    const customer_name = document.getElementById('ns_custname').value.trim();
    const consignee_address = document.getElementById('ns_consignee_address').value.trim();
    const consignee_phone = document.getElementById('ns_consignee_phone').value.trim();
    const customer_email = document.getElementById('ns_custemail').value.trim();
    const total_pcs = parseInt(document.getElementById('ns_pcs').value) || 1;
    const weight_kg = parseFloat(document.getElementById('ns_weight').value) || 0;
    const chargeable_weight = parseFloat(document.getElementById('ns_chargeable').value) || weight_kg;
    const is_damaged = document.getElementById('ns_damaged').value === 'true';

    if (!tracking_number || !title || !origin || !destination || !origin_iata || !destination_iata || !shipper_name || !customer_name) {
      alert('Please fill in all required fields'); return;
    }

    try {
      const shipment = await apiFetch('POST', 'create-shipment', {
        tracking_number, title, origin, destination, status,
        origin_iata, destination_iata,
        shipper_name, shipper_address,
        customer_name, consignee_address, consignee_phone, customer_email,
        total_pcs, weight_kg, chargeable_weight, is_damaged
      });
      closeModal('newShipmentModal');
      loadShipments(); loadDashboard();

      // Prompt to print consignment notes
      if (confirm(\`✅ Shipment \${tracking_number} created!\\n\\nPrint consignment notes now? (\${total_pcs} label\${total_pcs>1?'s':''})\`)) {
        printConsignmentNotes(shipment);
      }
    } catch(e) { alert('Failed to create shipment. Tracking number may already exist.'); }
  }

  // ── CONSIGNMENT NOTE PRINTER ──
  function printConsignmentNotes(s) {
    const totalPcs = s.total_pcs || 1;
    const labels = [];

    for (let i = 1; i <= totalPcs; i++) {
      labels.push(\`
        <div class="cn-label" style="
          width:150mm; height:100mm; padding:6mm; box-sizing:border-box;
          border:1.5px solid #000; font-family:Arial,sans-serif;
          page-break-after: \${i < totalPcs ? 'always' : 'auto'};
          display:flex; flex-direction:column; gap:3mm; position:relative;
          background:#fff;
        ">
          <!-- HEADER -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #000;padding-bottom:2mm;margin-bottom:1mm;">
            <div>
              <div style="font-size:9pt;font-weight:900;letter-spacing:-.3px;">PT AMBARA ARTHA GLOBALTRANS</div>
              <div style="font-size:6.5pt;color:#555;">Cargo Terminal, Soekarno-Hatta Airport, Tangerang</div>
              <div style="font-size:6.5pt;color:#555;">cs@ambaraartha.com · +62 821-2545-2800</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:7pt;font-weight:700;color:#666;">CONSIGNMENT NOTE</div>
              <div style="font-size:8pt;font-weight:900;font-family:monospace;">\${s.tracking_number}</div>
              <div style="background:#000;color:#fff;font-size:8pt;font-weight:900;padding:1mm 3mm;border-radius:2px;margin-top:1mm;text-align:center;">\${i} / \${totalPcs}</div>
            </div>
          </div>

          <!-- ROUTE -->
          <div style="display:flex;align-items:center;justify-content:center;gap:4mm;background:#f0f0f0;padding:2mm;border-radius:2px;">
            <div style="text-align:center;">
              <div style="font-size:16pt;font-weight:900;letter-spacing:-1px;">\${s.origin_iata || '???'}</div>
              <div style="font-size:6pt;color:#555;">\${s.origin || ''}</div>
            </div>
            <div style="font-size:12pt;">✈</div>
            <div style="text-align:center;">
              <div style="font-size:16pt;font-weight:900;letter-spacing:-1px;">\${s.destination_iata || '???'}</div>
              <div style="font-size:6pt;color:#555;">\${s.destination || ''}</div>
            </div>
          </div>

          <!-- SHIPPER / CONSIGNEE -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:3mm;flex:1;">
            <div style="border:1px solid #ccc;padding:2mm;border-radius:2px;">
              <div style="font-size:6pt;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:1mm;">Shipper</div>
              <div style="font-size:7.5pt;font-weight:700;">\${s.shipper_name || '—'}</div>
              <div style="font-size:6.5pt;color:#444;margin-top:1mm;line-height:1.3;">\${s.shipper_address || ''}</div>
            </div>
            <div style="border:1px solid #ccc;padding:2mm;border-radius:2px;">
              <div style="font-size:6pt;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:1mm;">Consignee</div>
              <div style="font-size:7.5pt;font-weight:700;">\${s.customer_name || '—'}</div>
              <div style="font-size:6.5pt;color:#444;margin-top:1mm;line-height:1.3;">\${s.consignee_address || ''}</div>
              \${s.consignee_phone ? \`<div style="font-size:6.5pt;color:#444;">📞 \${s.consignee_phone}</div>\` : ''}
            </div>
          </div>

          <!-- GOODS + WEIGHT -->
          <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:2mm;">
            <div style="border:1px solid #ccc;padding:2mm;border-radius:2px;">
              <div style="font-size:6pt;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:1mm;">Goods Description</div>
              <div style="font-size:7pt;">\${s.title || '—'}</div>
            </div>
            <div style="border:1px solid #ccc;padding:2mm;border-radius:2px;text-align:center;">
              <div style="font-size:6pt;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:1mm;">Weight</div>
              <div style="font-size:8pt;font-weight:700;">\${s.weight_kg ? s.weight_kg + ' kg' : '—'}</div>
            </div>
            <div style="border:1px solid #ccc;padding:2mm;border-radius:2px;text-align:center;">
              <div style="font-size:6pt;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:1mm;">Pcs</div>
              <div style="font-size:8pt;font-weight:700;">\${i} / \${totalPcs}</div>
            </div>
          </div>

          <!-- QR + BARCODE AREA -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #ccc;padding-top:2mm;">
            <div id="qr_\${s.tracking_number}_\${i}" style="width:18mm;height:18mm;"></div>
            <div id="bc_\${s.tracking_number}_\${i}" style="flex:1;margin:0 3mm;overflow:hidden;"></div>
            <div style="font-size:6pt;color:#888;text-align:right;">
              <div>ambaraartha.com</div>
              <div style="margin-top:1mm;">Track your shipment online</div>
            </div>
          </div>
        </div>
      \`);
    }

    // Open print window
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(\`
      <!DOCTYPE html><html><head>
      <title>Consignment Notes — \${s.tracking_number}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\\/script>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\\/script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f0f0; padding: 10mm; }
        .cn-label { margin-bottom: 8mm; }
        @media print {
          body { background: #fff; padding: 0; }
          .no-print { display: none !important; }
          .cn-label { margin: 0; }
        }
      </style>
      </head><body>
      <div class="no-print" style="text-align:center;padding:10px;margin-bottom:10px;background:#1a4bbf;color:#fff;border-radius:8px;font-family:Arial;cursor:pointer;font-size:14px;font-weight:700;" onclick="window.print()">🖨️ Print All \${totalPcs} Label(s)</div>
      \${labels.join('')}
      <script>
        window.onload = function() {
          \${Array.from({length: totalPcs}, (_, i) => \`
            try {
              new QRCode(document.getElementById('qr_\${s.tracking_number}_\${i+1}'), {
                text: 'https://ambaraartha.com/#tracking?id=\${s.tracking_number}',
                width: 68, height: 68, colorDark: '#000', colorLight: '#fff',
                correctLevel: QRCode.CorrectLevel.M
              });
            } catch(e) {}
            try {
              var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
              document.getElementById('bc_\${s.tracking_number}_\${i+1}').appendChild(svg);
              JsBarcode(svg, '\${s.tracking_number}', {
                format:'CODE128', width:1.5, height:35, displayValue:true,
                fontSize:8, margin:2, textMargin:2
              });
            } catch(e) {}
          \`).join('')}
        };
      <\\/script>
      </body>
    \`);
    win.document.close();
  }

  // ── EVENTS ──
  function openAddEvent(shipmentId) {
    document.getElementById('ev_shipment_id').value = shipmentId;
    document.getElementById('ev_label').value = '';
    document.getElementById('ev_location').value = '';
    document.getElementById('ev_time').value = new Date().toISOString().slice(0,16);
    document.getElementById('addEventModal').classList.add('open');
  }

  async function addEvent() {
    const shipment_id = document.getElementById('ev_shipment_id').value;
    const label = document.getElementById('ev_label').value.trim();
    const location = document.getElementById('ev_location').value.trim();
    const event_time = document.getElementById('ev_time').value;
    const state = document.getElementById('ev_state').value;

    if (!label || !event_time) { alert('Please fill in the event label and time'); return; }

    try {
      await apiFetch('POST', 'add-event', { shipment_id, label, location, event_time, state });
      closeModal('addEventModal');
      openDetail(shipment_id); // Refresh detail view
    } catch(e) { alert('Failed to add event.'); }
  }

  async function deleteEvent(eventId, shipmentId) {
    if (!confirm('Remove this tracking event?')) return;
    try {
      await apiFetch('POST', 'delete-event', { id: eventId });
      openDetail(shipmentId); // Refresh
    } catch(e) { alert('Failed to delete event.'); }
  }

  // ── QUOTES ──
  async function loadQuotes() {
    try {
      const quotes = await apiFetch('GET', 'quotes');
      const newCount = quotes.filter(q => q.status === 'new').length;
      document.getElementById('quoteBadge').textContent = newCount;

      const tbody = document.getElementById('quotesTable');
      if (quotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><div class="empty-icon">💬</div><h4>No quote requests yet</h4></div></td></tr>';
        return;
      }
      tbody.innerHTML = quotes.map(q => \`
        <tr>
          <td><strong style="font-size:.8rem">\${q.reference_number}</strong></td>
          <td style="font-size:.82rem">\${q.freight_type || '—'}</td>
          <td style="font-size:.8rem;color:var(--ink-soft)">\${q.origin || '—'} → \${q.destination || '—'}</td>
          <td style="font-size:.85rem">\${q.company_name || '—'}</td>
          <td style="font-size:.82rem">\${q.contact_name}<br><span style="color:var(--ink-soft)">\${q.email}</span></td>
          <td style="font-size:.78rem;color:var(--ink-soft)">\${formatDate(q.created_at)}</td>
          <td>\${statusBadge(q.status)}</td>
          <td>
            \${q.status === 'new' ? \`<button class="btn btn-ghost btn-sm" onclick="markQuote(\${q.id})">Mark Seen</button>\` : ''}
          </td>
        </tr>\`).join('');
    } catch(e) { console.error(e); }
  }

  async function markQuote(id) {
    await apiFetch('POST', 'update-quote', { id, status: 'seen' });
    loadQuotes();
  }

  // ── CONTACTS ──
  async function loadContacts() {
    try {
      const contacts = await apiFetch('GET', 'contacts');
      const unreadCount = contacts.filter(c => c.status === 'unread').length;
      document.getElementById('contactBadge').textContent = unreadCount;

      const tbody = document.getElementById('contactsTable');
      if (contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><div class="empty-icon">📩</div><h4>No messages yet</h4></div></td></tr>';
        return;
      }
      tbody.innerHTML = contacts.map(c => \`
        <tr style="\${c.status==='unread'?'font-weight:600':''}">
          <td>\${c.name}</td>
          <td style="font-size:.85rem">\${c.company || '—'}</td>
          <td style="font-size:.82rem">\${c.topic || '—'}</td>
          <td style="font-size:.82rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="\${c.message}">\${c.message}</td>
          <td style="font-size:.78rem;color:var(--ink-soft)">\${formatDate(c.created_at)}</td>
          <td>\${statusBadge(c.status)}</td>
          <td>
            \${c.status==='unread' ? \`<button class="btn btn-ghost btn-sm" onclick="markRead(\${c.id})">Mark Read</button>\` : ''}
            <a href="mailto:\${c.email}" class="btn btn-blue btn-sm">Reply</a>
          </td>
        </tr>\`).join('');
    } catch(e) { console.error(e); }
  }

  async function markRead(id) {
    await apiFetch('POST', 'read-contact', { id });
    loadContacts();
  }

  // ── HELPERS ──
  function statusBadge(status) {
    const map = {
      'pending': ['status-pending', 'Pending'],
      'in-transit': ['status-in-transit', 'In Transit'],
      'delivered': ['status-delivered', 'Delivered'],
      'new': ['status-new', 'New'],
      'seen': ['status-read', 'Seen'],
      'unread': ['status-unread', 'Unread'],
      'read': ['status-read', 'Read'],
    };
    const [cls, label] = map[status] || ['status-pending', status];
    return \`<span class="status \${cls}"><span class="status-dot"></span>\${label}</span>\`;
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });

  // ── BLOG ──
  let editingBlogId = null;

  function blogApiFetch(method, action, body) {
    return fetch(\`/api/blog-admin?action=\${action}\`, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
      body: body ? JSON.stringify(body) : undefined
    }).then(r => r.json());
  }

  async function loadBlog() {
    try {
      const posts = await apiFetch('GET', 'admin-list').catch(() =>
        fetch('/api/blog-api?action=admin-list', {
          headers: { 'x-admin-password': adminPassword }
        }).then(r => r.json())
      );
      const tbody = document.getElementById('blogTable');
      if (!Array.isArray(posts) || posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty"><div class="empty-icon">📝</div><h4>No blog posts yet</h4><p>Click "+ New Post" to write your first article.</p></div></td></tr>';
        return;
      }
      tbody.innerHTML = posts.map(p => \`
        <tr>
          <td><strong>\${p.title_en}</strong><br/><span style="font-size:.75rem;color:var(--ink-soft)">\${p.title_id}</span></td>
          <td><span class="status status-pending">\${p.category||'general'}</span></td>
          <td>\${p.status === 'published'
            ? '<span class="status status-delivered"><span class="status-dot"></span>Published</span>'
            : '<span class="status status-pending"><span class="status-dot"></span>Draft</span>'}</td>
          <td style="font-size:.78rem;color:var(--ink-soft)">\${p.published_at ? formatDate(p.published_at) : '—'}</td>
          <td>
            <div style="display:flex;gap:6px">
              <a href="blog-post.html?slug=\${p.slug}" target="_blank" class="btn btn-ghost btn-sm">👁 View</a>
              <button class="btn btn-ghost btn-sm" onclick="editBlog(\${p.id})">✏️ Edit</button>
              <button class="btn btn-red btn-sm" onclick="deleteBlog(\${p.id}, '\${p.title_en.replace(/'/g,"\\\\'")}')">🗑️</button>
            </div>
          </td>
        </tr>\`).join('');
    } catch(e) { console.error(e); }
  }

  function openBlogModal(post) {
    editingBlogId = post ? post.id : null;
    document.getElementById('blogModalTitle').textContent = post ? '✏️ Edit Post' : '＋ New Blog Post';
    document.getElementById('blog_slug').value = post?.slug || '';
    document.getElementById('blog_title_en').value = post?.title_en || '';
    document.getElementById('blog_title_id').value = post?.title_id || '';
    document.getElementById('blog_excerpt_en').value = post?.excerpt_en || '';
    document.getElementById('blog_excerpt_id').value = post?.excerpt_id || '';
    document.getElementById('blog_content_en').value = post?.content_en || '';
    document.getElementById('blog_content_id').value = post?.content_id || '';
    document.getElementById('blog_category').value = post?.category || 'guides';
    document.getElementById('blog_tags').value = post?.tags?.join(', ') || '';
    document.getElementById('blog_cover').value = post?.cover_image_url || '';
    document.getElementById('blog_meta_title_en').value = post?.meta_title_en || '';
    document.getElementById('blog_meta_desc_en').value = post?.meta_description_en || '';
    document.getElementById('blog_meta_title_id').value = post?.meta_title_id || '';
    document.getElementById('blog_meta_desc_id').value = post?.meta_description_id || '';
    document.getElementById('blog_status').value = post?.status || 'draft';
    document.getElementById('blogModal').classList.add('open');
  }

  async function editBlog(id) {
    try {
      const res = await fetch(\`/api/blog-admin?action=get&id=\${id}\`, {
        headers: { 'x-admin-password': adminPassword }
      });
      const post = await res.json();
      openBlogModal(post);
    } catch(e) { alert('Failed to load post.'); }
  }

  function autoSlug() {
    if (editingBlogId) return; // don't auto-slug when editing
    const title = document.getElementById('blog_title_en').value;
    document.getElementById('blog_slug').value = title.toLowerCase()
      .replace(/[^a-z0-9\\s-]/g,'').replace(/\\s+/g,'-').replace(/-+/g,'-').trim().slice(0,80);
  }

  async function saveBlog() {
    const body = {
      id: editingBlogId,
      slug: document.getElementById('blog_slug').value.trim(),
      title_en: document.getElementById('blog_title_en').value.trim(),
      title_id: document.getElementById('blog_title_id').value.trim(),
      excerpt_en: document.getElementById('blog_excerpt_en').value.trim(),
      excerpt_id: document.getElementById('blog_excerpt_id').value.trim(),
      content_en: document.getElementById('blog_content_en').value.trim(),
      content_id: document.getElementById('blog_content_id').value.trim(),
      category: document.getElementById('blog_category').value,
      tags: document.getElementById('blog_tags').value,
      cover_image_url: document.getElementById('blog_cover').value.trim(),
      meta_title_en: document.getElementById('blog_meta_title_en').value.trim(),
      meta_description_en: document.getElementById('blog_meta_desc_en').value.trim(),
      meta_title_id: document.getElementById('blog_meta_title_id').value.trim(),
      meta_description_id: document.getElementById('blog_meta_desc_id').value.trim(),
      status: document.getElementById('blog_status').value,
    };
    if (!body.slug || !body.title_en || !body.title_id) { alert('Please fill in: Slug, Title EN, Title ID'); return; }
    const btn = document.getElementById('saveBlogBtn');
    btn.textContent = 'Saving...'; btn.disabled = true;
    try {
      const action = editingBlogId ? 'update' : 'create';
      await blogApiFetch('POST', action, body);
      closeModal('blogModal');
      loadBlog();
      alert(editingBlogId ? '✅ Post updated!' : '✅ Post created!');
    } catch(e) { alert('Failed to save post.'); }
    btn.textContent = 'Save Post'; btn.disabled = false;
  }

  async function deleteBlog(id, title) {
    if (!confirm(\`Delete "\${title}"? This cannot be undone.\`)) return;
    await blogApiFetch('POST', 'delete', { id });
    loadBlog();
  }

  // Load blog when page shown
  const origShowPage = showPage;
  // Override showPage to load blog lazily
  window._blogLoaded = false;
</script>

<!-- BLOG MODAL -->
<div class="modal-overlay" id="blogModal">
  <div class="modal" style="max-width:780px;max-height:92vh;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h3 id="blogModalTitle">＋ New Blog Post</h3>
      <button class="btn btn-ghost btn-sm" onclick="closeModal('blogModal')">✕ Close</button>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:20px">
      <button onclick="showBlogTab('content')" id="tab-content" class="btn btn-ghost btn-sm" style="border-radius:0;border-bottom:2px solid var(--blue)">📝 Content</button>
      <button onclick="showBlogTab('seo')" id="tab-seo" class="btn btn-ghost btn-sm" style="border-radius:0;border-bottom:2px solid transparent">🔍 SEO</button>
    </div>

    <!-- Content Tab -->
    <div id="blogTab-content">
      <div class="form-row">
        <div class="form-group">
          <label>Title (English) *</label>
          <input id="blog_title_en" type="text" placeholder="What is an Airway Bill?" oninput="autoSlug()"/>
        </div>
        <div class="form-group">
          <label>Title (Indonesian) *</label>
          <input id="blog_title_id" type="text" placeholder="Apa itu Airway Bill?"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>URL Slug *</label>
          <input id="blog_slug" type="text" placeholder="what-is-airway-bill"/>
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="blog_category">
            <option value="guides">✈ Freight Guides</option>
            <option value="regulations">🏛 Customs & Regulations</option>
            <option value="news">📢 Company News</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Excerpt (English)</label>
          <textarea id="blog_excerpt_en" rows="2" placeholder="Short summary for blog listing..."></textarea>
        </div>
        <div class="form-group">
          <label>Excerpt (Indonesian)</label>
          <textarea id="blog_excerpt_id" rows="2" placeholder="Ringkasan singkat..."></textarea>
        </div>
      </div>
      <div class="form-group">
        <label>Content (English) — supports HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;</label>
        <textarea id="blog_content_en" rows="8" placeholder="<h2>Introduction</h2><p>Write your article here...</p>"></textarea>
      </div>
      <div class="form-group">
        <label>Content (Indonesian) — mendukung tag HTML &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;</label>
        <textarea id="blog_content_id" rows="8" placeholder="<h2>Pendahuluan</h2><p>Tulis artikel Anda di sini...</p>"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tags (comma separated)</label>
          <input id="blog_tags" type="text" placeholder="airway bill, AWB, air freight"/>
        </div>
        <div class="form-group">
          <label>Cover Image URL</label>
          <input id="blog_cover" type="text" placeholder="https://images.unsplash.com/..."/>
        </div>
      </div>
    </div>

    <!-- SEO Tab -->
    <div id="blogTab-seo" style="display:none;">
      <div style="background:var(--bg);border-radius:8px;padding:14px;margin-bottom:16px;font-size:.82rem;color:var(--ink-soft);">
        💡 Good SEO: Meta titles 50–60 chars, meta descriptions 120–160 chars. Use your target keyword naturally.
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Meta Title (English)</label>
          <input id="blog_meta_title_en" type="text" placeholder="What is an AWB? | Ambara Artha"/>
        </div>
        <div class="form-group">
          <label>Meta Title (Indonesian)</label>
          <input id="blog_meta_title_id" type="text" placeholder="Apa itu AWB? | Ambara Artha"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Meta Description (English)</label>
          <textarea id="blog_meta_desc_en" rows="3" placeholder="Learn everything about Airway Bills in air freight..."></textarea>
        </div>
        <div class="form-group">
          <label>Meta Description (Indonesian)</label>
          <textarea id="blog_meta_desc_id" rows="3" placeholder="Pelajari semua tentang Airway Bill dalam air freight..."></textarea>
        </div>
      </div>
    </div>

    <div class="modal-actions">
      <div style="display:flex;gap:10px;align-items:center">
        <label style="font-size:.8rem;font-weight:600;color:var(--ink-soft)">Status:</label>
        <select id="blog_status" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:'Geist',sans-serif;font-size:.85rem;outline:none;">
          <option value="draft">📋 Draft</option>
          <option value="published">✅ Published</option>
        </select>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" onclick="closeModal('blogModal')">Cancel</button>
        <button class="btn btn-blue" id="saveBlogBtn" onclick="saveBlog()">Save Post</button>
      </div>
    </div>
  </div>
</div>

<script>
  function showBlogTab(tab) {
    document.getElementById('blogTab-content').style.display = tab==='content' ? 'block' : 'none';
    document.getElementById('blogTab-seo').style.display = tab==='seo' ? 'block' : 'none';
    document.getElementById('tab-content').style.borderBottomColor = tab==='content' ? 'var(--blue)' : 'transparent';
    document.getElementById('tab-seo').style.borderBottomColor = tab==='seo' ? 'var(--blue)' : 'transparent';
  }

  // Patch showPage to load blog lazily
  const _origShowPage = showPage;
  showPage = function(name, btn) {
    _origShowPage(name, btn);
    if (name === 'blog' && !window._blogLoaded) { loadBlog(); window._blogLoaded = true; }
  };
</script>
</body>
</html>
`;


// ── PT AMBARA ARTHA GLOBALTRANS — CLOUDFLARE WORKER ──
// Serves static HTML + handles all /api/* routes using D1

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
  'Content-Type': 'application/json'
};

// ── STATIC FILE MAP ──

const PAGES = {
  '/':              indexHtml,
  '/index.html':    indexHtml,
  '/about.html':    aboutHtml,
  '/services.html': servicesHtml,
  '/contact.html':  contactHtml,
  '/quote.html':    quoteHtml,
  '/network.html':  networkHtml,
  '/blog.html':     blogHtml,
  '/blog-post.html':blogPostHtml,
  '/admin.html':    adminHtml,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response('', { headers: CORS });
    }

    // ── STATIC PAGES ──
    if (PAGES[path]) {
      return new Response(PAGES[path], {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // ── API ROUTES ──
    if (path.startsWith('/api/')) {
      const route = path.replace('/api/', '');
      const params = Object.fromEntries(url.searchParams);
      let body = {};
      if (request.method === 'POST') {
        try { body = await request.json(); } catch {}
      }
      const adminPwd = request.headers.get('x-admin-password');

      try {
        // TRACK SHIPMENT
        if (route === 'track-shipment') {
          const { id } = params;
          if (!id) return json({ error: 'Tracking ID required' }, 400);
          const shipment = await env.DB.prepare(
            'SELECT * FROM shipments WHERE tracking_number = ? LIMIT 1'
          ).bind(id.toUpperCase()).first();
          if (!shipment) return json({ error: 'Shipment not found' }, 404);
          const events = await env.DB.prepare(
            'SELECT * FROM tracking_events WHERE shipment_id = ? ORDER BY event_time ASC'
          ).bind(shipment.id).all();
          const documents = await env.DB.prepare(
            'SELECT * FROM documents WHERE shipment_id = ? ORDER BY uploaded_at DESC'
          ).bind(shipment.id).all();
          return json({ shipment, events: events.results, documents: documents.results });
        }

        // PUBLIC STATS
        if (route === 'public-stats') {
          const rows = await env.DB.prepare('SELECT status, weight_kg, is_damaged FROM shipments').all();
          const ships = rows.results;
          const totalKg = ships.reduce((s, r) => s + parseFloat(r.weight_kg || 0), 0);
          const delivered = ships.filter(s => s.status === 'delivered').length;
          const damaged = ships.filter(s => s.is_damaged === 1).length;
          const onTimeRate = delivered > 0 ? Math.round((delivered - damaged) / delivered * 100) : 100;
          return json({ tonnage: totalKg.toFixed(1), on_time_rate: onTimeRate, damaged, countries: 52 });
        }

        // SUBMIT CONTACT
        if (route === 'submit-contact' && request.method === 'POST') {
          const { name, company, email, phone, topic, message } = body;
          await env.DB.prepare(
            'INSERT INTO contact_messages (name,company,email,phone,topic,message,status,created_at) VALUES (?,?,?,?,?,?,?,datetime("now"))'
          ).bind(name,company||'',email,phone||'',topic,message,'unread').run();
          await sendEmail(env, email, 'We received your message — PT Ambara Artha Globaltrans',
            customerContactEmail(name, topic, message));
          await sendEmail(env, env.EMAIL_TO, `📩 New Message: ${topic} — ${name}`,
            adminContactEmail(name, company, email, phone, topic, message));
          return json({ success: true });
        }

        // SUBMIT QUOTE
        if (route === 'submit-quote' && request.method === 'POST') {
          const { freightType,origin,destination,readyDate,incoterms,cargoDesc,weight,
                  volume,packages,cargoValue,insurance,special,name,company,email,phone,notes } = body;
          const ref = 'AAG-Q-' + Date.now().toString().slice(-5);
          await env.DB.prepare(
            `INSERT INTO quote_requests (reference_number,freight_type,origin,destination,ready_date,incoterms,
            cargo_description,weight_kg,volume_cbm,num_packages,cargo_value_usd,needs_insurance,
            special_requirements,contact_name,company_name,email,phone,notes,status,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`
          ).bind(ref,freightType,origin,destination,readyDate||'',incoterms||'',cargoDesc||'',
            weight||0,volume||0,packages||1,cargoValue||0,insurance||'',special||'',
            name,company||'',email,phone||'',notes||'','new').run();
          await sendEmail(env, email, `Quote Request Received — ${ref}`,
            customerQuoteEmail(name, ref, origin, destination, freightType, cargoDesc, weight, env.EMAIL_TO));
          await sendEmail(env, env.EMAIL_TO, `🆕 New Quote: ${ref} — ${company||name}`,
            adminQuoteEmail(ref, name, company, email, phone, origin, destination, freightType, cargoDesc, weight, readyDate, notes));
          return json({ success: true, reference: ref });
        }

        // BLOG API
        if (route === 'blog-api') {
          const { action, slug, category, limit=20, offset=0 } = params;
          if (!action || action === 'list') {
            let stmt;
            if (category) {
              stmt = env.DB.prepare(`SELECT id,slug,title_en,title_id,excerpt_en,excerpt_id,category,tags,author,published_at,cover_image_url FROM blog_posts WHERE status='published' AND category=? ORDER BY published_at DESC LIMIT ? OFFSET ?`).bind(category,parseInt(limit),parseInt(offset));
            } else {
              stmt = env.DB.prepare(`SELECT id,slug,title_en,title_id,excerpt_en,excerpt_id,category,tags,author,published_at,cover_image_url FROM blog_posts WHERE status='published' ORDER BY published_at DESC LIMIT ? OFFSET ?`).bind(parseInt(limit),parseInt(offset));
            }
            const posts = await stmt.all();
            const total = await env.DB.prepare(`SELECT COUNT(*) as count FROM blog_posts WHERE status='published'`).first();
            return json({ posts: posts.results, total: total.count });
          }
          if (action === 'post' && slug) {
            const post = await env.DB.prepare(`SELECT * FROM blog_posts WHERE slug=? AND status='published'`).bind(slug).first();
            if (!post) return json({ error: 'Post not found' }, 404);
            return json(post);
          }
          if (action === 'admin-list') {
            if (adminPwd !== (env.ADMIN_PASSWORD || 'ambara2025')) return json({ error: 'Unauthorized' }, 401);
            const posts = await env.DB.prepare(`SELECT id,slug,title_en,title_id,category,status,published_at,created_at FROM blog_posts ORDER BY created_at DESC`).all();
            return json(posts.results);
          }
        }

        // BLOG ADMIN
        if (route === 'blog-admin') {
          if (adminPwd !== (env.ADMIN_PASSWORD || 'ambara2025')) return json({ error: 'Unauthorized' }, 401);
          const { action } = params;
          if (action === 'create' && request.method === 'POST') {
            const { slug,title_en,title_id,excerpt_en,excerpt_id,content_en,content_id,
                    category,tags,author,status,meta_title_en,meta_title_id,
                    meta_description_en,meta_description_id,cover_image_url } = body;
            const pub = status==='published' ? new Date().toISOString() : null;
            const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags||'');
            await env.DB.prepare(`INSERT INTO blog_posts (slug,title_en,title_id,excerpt_en,excerpt_id,content_en,content_id,category,tags,author,status,meta_title_en,meta_title_id,meta_description_en,meta_description_id,cover_image_url,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`)
              .bind(slug,title_en,title_id,excerpt_en||'',excerpt_id||'',content_en||'',content_id||'',category||'general',tagsStr,author||'Ambara Artha Team',status||'draft',meta_title_en||'',meta_title_id||'',meta_description_en||'',meta_description_id||'',cover_image_url||'',pub).run();
            return json({ success: true });
          }
          if (action === 'update' && request.method === 'POST') {
            const { id,slug,title_en,title_id,excerpt_en,excerpt_id,content_en,content_id,
                    category,tags,author,status,meta_title_en,meta_title_id,
                    meta_description_en,meta_description_id,cover_image_url } = body;
            const existing = await env.DB.prepare('SELECT published_at FROM blog_posts WHERE id=?').bind(id).first();
            const pub = status==='published' ? (existing?.published_at || new Date().toISOString()) : null;
            const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags||'');
            await env.DB.prepare(`UPDATE blog_posts SET slug=?,title_en=?,title_id=?,excerpt_en=?,excerpt_id=?,content_en=?,content_id=?,category=?,tags=?,author=?,status=?,meta_title_en=?,meta_title_id=?,meta_description_en=?,meta_description_id=?,cover_image_url=?,published_at=?,updated_at=datetime('now') WHERE id=?`)
              .bind(slug,title_en,title_id,excerpt_en||'',excerpt_id||'',content_en||'',content_id||'',category||'general',tagsStr,author||'Ambara Artha Team',status||'draft',meta_title_en||'',meta_title_id||'',meta_description_en||'',meta_description_id||'',cover_image_url||'',pub,id).run();
            return json({ success: true });
          }
          if (action === 'delete' && request.method === 'POST') {
            await env.DB.prepare('DELETE FROM blog_posts WHERE id=?').bind(body.id).run();
            return json({ success: true });
          }
          if (action === 'get') {
            const post = await env.DB.prepare('SELECT * FROM blog_posts WHERE id=?').bind(params.id).first();
            return json(post);
          }
        }

        // ADMIN API
        if (route === 'admin-api') {
          if (adminPwd !== (env.ADMIN_PASSWORD || 'ambara2025')) return json({ error: 'Unauthorized' }, 401);
          const { action, id } = params;

          if (action === 'shipments') {
            const rows = await env.DB.prepare('SELECT * FROM shipments ORDER BY created_at DESC').all();
            return json(rows.results);
          }
          if (action === 'shipment') {
            const shipment = await env.DB.prepare('SELECT * FROM shipments WHERE id=?').bind(id).first();
            const events = await env.DB.prepare('SELECT * FROM tracking_events WHERE shipment_id=? ORDER BY event_time ASC').bind(id).all();
            const docs = await env.DB.prepare('SELECT * FROM documents WHERE shipment_id=?').bind(id).all();
            return json({ shipment, events: events.results, docs: docs.results });
          }
          if (action === 'quotes') {
            const rows = await env.DB.prepare('SELECT * FROM quote_requests ORDER BY created_at DESC').all();
            return json(rows.results);
          }
          if (action === 'contacts') {
            const rows = await env.DB.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
            return json(rows.results);
          }
          if (action === 'create-shipment' && request.method === 'POST') {
            const { tracking_number,title,origin,destination,status,origin_iata,destination_iata,
                    shipper_name,shipper_address,customer_name,consignee_address,consignee_phone,
                    customer_email,total_pcs,weight_kg,chargeable_weight,is_damaged } = body;
            const result = await env.DB.prepare(`INSERT INTO shipments (tracking_number,title,origin,destination,status,origin_iata,destination_iata,shipper_name,shipper_address,customer_name,consignee_address,consignee_phone,customer_email,total_pcs,weight_kg,chargeable_weight,is_damaged,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now')) RETURNING *`)
              .bind(tracking_number,title,origin,destination,status,origin_iata||'',destination_iata||'',shipper_name||'',shipper_address||'',customer_name||'',consignee_address||'',consignee_phone||'',customer_email||'',total_pcs||1,weight_kg||0,chargeable_weight||weight_kg||0,is_damaged?1:0).first();
            if (customer_email) {
              await sendEmail(env, customer_email, `Shipment Created: ${tracking_number}`,
                `<p>Your shipment <strong>${tracking_number}</strong> has been created. Track it at ambaraartha.com.</p>`);
            }
            return json(result);
          }
          if (action === 'update-status' && request.method === 'POST') {
            await env.DB.prepare(`UPDATE shipments SET status=?,updated_at=datetime('now') WHERE id=?`).bind(body.status,body.id).run();
            const shipment = await env.DB.prepare('SELECT * FROM shipments WHERE id=?').bind(body.id).first();
            if (shipment?.customer_email) {
              await sendEmail(env, shipment.customer_email, `Shipment Update: ${shipment.tracking_number}`,
                `<p>Your shipment status is now: <strong>${body.status}</strong>. Track at ambaraartha.com.</p>`);
            }
            return json({ success: true });
          }
          if (action === 'add-event' && request.method === 'POST') {
            const { shipment_id,label,location,event_time,state } = body;
            await env.DB.prepare(`INSERT INTO tracking_events (shipment_id,label,location,event_time,state,created_at) VALUES (?,?,?,?,?,datetime('now'))`)
              .bind(shipment_id,label,location||'',event_time,state||'done').run();
            const shipment = await env.DB.prepare('SELECT * FROM shipments WHERE id=?').bind(shipment_id).first();
            if (shipment?.customer_email) {
              await sendEmail(env, shipment.customer_email, `Update: ${shipment.tracking_number} — ${label}`,
                `<p>New update on your shipment: <strong>${label}</strong>${location ? ' at ' + location : ''}.</p>`);
            }
            return json({ success: true });
          }
          if (action === 'delete-event' && request.method === 'POST') {
            await env.DB.prepare('DELETE FROM tracking_events WHERE id=?').bind(body.id).run();
            return json({ success: true });
          }
          if (action === 'delete-shipment' && request.method === 'POST') {
            await env.DB.prepare('DELETE FROM tracking_events WHERE shipment_id=?').bind(body.id).run();
            await env.DB.prepare('DELETE FROM documents WHERE shipment_id=?').bind(body.id).run();
            await env.DB.prepare('DELETE FROM shipments WHERE id=?').bind(body.id).run();
            return json({ success: true });
          }
          if (action === 'read-contact' && request.method === 'POST') {
            await env.DB.prepare(`UPDATE contact_messages SET status='read' WHERE id=?`).bind(body.id).run();
            return json({ success: true });
          }
          if (action === 'update-quote' && request.method === 'POST') {
            await env.DB.prepare('UPDATE quote_requests SET status=? WHERE id=?').bind(body.status,body.id).run();
            return json({ success: true });
          }
        }

        return json({ error: 'Not found' }, 404);
      } catch (err) {
        console.error(err);
        return json({ error: err.message }, 500);
      }
    }

    // 404 for anything else
    return new Response('Not Found', { status: 404 });
  }
};

// ── HELPERS ──
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `PT Ambara Artha Globaltrans <${env.EMAIL_FROM || 'noreply@ambaraartha.com'}>`,
        to, subject, html
      })
    });
  } catch (e) { console.error('Email error:', e); }
}

function customerContactEmail(name, topic, message) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6fb;padding:24px;">
    <div style="background:linear-gradient(135deg,#0a0f1e,#1122EE);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
      <div style="font-size:22px;font-weight:900;color:#fff;">PT Ambara Artha Globaltrans</div>
    </div>
    <div style="background:#fff;padding:36px;border-radius:0 0 16px 16px;border:1px solid #dde2ef;">
      <h2 style="color:#0a0f1e;">✅ Message Received!</h2>
      <p>Dear <strong>${name}</strong>, our team will reply within <strong>2 business hours</strong>.</p>
      <div style="background:#f4f6fb;padding:16px;border-radius:8px;"><strong>Topic:</strong> ${topic}<br/><strong>Message:</strong><br/>${message}</div>
    </div>
  </div>`;
}

function adminContactEmail(name, company, email, phone, topic, message) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#0a0f1e;border-radius:12px;padding:24px;color:#fff;margin-bottom:16px;"><div style="font-size:18px;font-weight:900;">📩 New Contact: ${topic}</div></div>
    <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #dde2ef;">
      <p><strong>Name:</strong> ${name}</p><p><strong>Company:</strong> ${company||'—'}</p>
      <p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone||'—'}</p>
      <p><strong>Topic:</strong> ${topic}</p>
      <div style="background:#f4f6fb;padding:16px;border-radius:8px;margin-top:12px;">${message}</div>
      <div style="margin-top:16px;text-align:center;"><a href="mailto:${email}" style="background:#1122EE;color:#fff;padding:12px 28px;border-radius:100px;text-decoration:none;font-weight:700;">Reply →</a></div>
    </div>
  </div>`;
}

function customerQuoteEmail(name, ref, origin, destination, freightType, cargoDesc, weight, adminEmail) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6fb;padding:24px;">
    <div style="background:linear-gradient(135deg,#0a0f1e,#1122EE);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
      <div style="font-size:22px;font-weight:900;color:#fff;">PT Ambara Artha Globaltrans</div>
    </div>
    <div style="background:#fff;padding:36px;border-radius:0 0 16px 16px;border:1px solid #dde2ef;">
      <h2>✅ Quote Request Received!</h2>
      <p>Dear <strong>${name}</strong>, our team will reply within <strong>2 business hours</strong>.</p>
      <div style="background:#f4f6fb;padding:20px;border-radius:12px;">
        <div style="font-size:24px;font-weight:900;color:#1122EE;font-family:monospace;">${ref}</div>
        <p><strong>Route:</strong> ${origin} → ${destination}<br/><strong>Type:</strong> ${freightType}<br/><strong>Cargo:</strong> ${cargoDesc} · ${weight} kg</p>
      </div>
    </div>
  </div>`;
}

function adminQuoteEmail(ref, name, company, email, phone, origin, destination, freightType, cargoDesc, weight, readyDate, notes) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#0a0f1e;border-radius:12px;padding:24px;color:#fff;margin-bottom:16px;"><div style="font-size:18px;font-weight:900;">🆕 New Quote — ${ref}</div></div>
    <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #dde2ef;">
      <p><strong>Company:</strong> ${company||'—'}</p>
      <p><strong>Contact:</strong> ${name} · ${email} · ${phone}</p>
      <p><strong>Route:</strong> ${origin} → ${destination}</p>
      <p><strong>Freight:</strong> ${freightType} · ${cargoDesc} · ${weight} kg</p>
      <p><strong>Ready Date:</strong> ${readyDate}</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
    </div>
  </div>`;
}
