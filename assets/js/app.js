// Utilidades
const $  = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

const STORAGE_KEYS = {
  lastView: 'mdei:lastView',
  lastDomain: 'mdei:lastDomain'
};

// ---------- SPA ----------

function setView(name) {
  $$('.view').forEach(v => {
    if (v.dataset.view === name) v.classList.add('view--active');
    else v.classList.remove('view--active');
  });

  $$('.nav-link').forEach(btn => {
    if (btn.dataset.viewTarget === name) btn.classList.add('is-active');
    else btn.classList.remove('is-active');
  });

  try { localStorage.setItem(STORAGE_KEYS.lastView, name); } catch {}
}

function initRouter() {
  $$('.nav-link, [data-view-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.viewTarget;
      if (!target) return;
      location.hash = target === 'home' ? '' : ('#' + target);
      setView(target);
    });
  });

  let initial = 'home';
  const hash = location.hash.replace('#','');
  let stored = '';
  try { stored = localStorage.getItem(STORAGE_KEYS.lastView) || ''; } catch {}

  if (hash) initial = hash;
  else if (stored) initial = stored;

  setView(initial);

  window.addEventListener('hashchange', () => {
    const target = location.hash.replace('#','') || 'home';
    setView(target);
  });
}

// ---------- Scroll / header ----------

function initScrollEffects() {
  const bar = $('#scroll-progress');
  const header = $('#site-header');
  if (!bar || !header) return;

  function onScroll() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? window.scrollY / h : 0;
    bar.style.transform = `scaleX(${p.toFixed(3)})`;

    if (window.scrollY > 10) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---------- Reveal ----------

function initReveal() {
  const els = $$('.reveal');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('reveal--visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal--visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));
}

// ---------- Domains ----------

function initDomains() {
  const detail = $('#platform-detail');
  if (!detail) return;

  const titleEl  = $('.platform-detail-title', detail);
  const textEl   = $('.platform-detail-text', detail);
  const pointsEl = $('#platform-detail-points', detail);
  const rows     = $$('.platform-row');
  const search   = $('#domain-search');

  const data = {
    automation: {
      title: 'Automation',
      text: 'PLC, SCADA and control architectures for production lines and industrial processes.',
      points: [
        'Design of PLC/SCADA architectures.',
        'Integration with existing sensors and actuators.',
        'Migration of legacy control systems.'
      ]
    },
    robotics: {
      title: 'Robotics',
      text: 'Integration of industrial robots and cobots with conveyors, vision and safety.',
      points: [
        'Robot cell design and programming.',
        'Safe interaction between operators and robots.',
        'Cycle-time optimisation and diagnostics.'
      ]
    },
    cybersecurity: {
      title: 'Cybersecurity',
      text: 'Segmentation, monitoring and resilience for OT networks and critical assets.',
      points: [
        'Network zoning and firewalling in OT.',
        'Monitoring of industrial protocols.',
        'Incident response and hardening of critical nodes.'
      ]
    }
  };

  function renderDetail(key) {
    const info = data[key];
    if (!info) return;
    titleEl.textContent = info.title;
    textEl.textContent  = info.text;
    pointsEl.innerHTML  = '';
    info.points.forEach(p => {
      const li = document.createElement('li');
      li.textContent = p;
      pointsEl.appendChild(li);
    });
    try { localStorage.setItem(STORAGE_KEYS.lastDomain, key); } catch {}
  }

  rows.forEach(row => {
    row.addEventListener('click', () => {
      const key = row.dataset.domain;
      if (!key) return;
      renderDetail(key);
    });
  });

  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase().trim();
      rows.forEach(row => {
        const t = row.innerText.toLowerCase();
        row.style.display = t.includes(q) ? '' : 'none';
      });
    });
  }

  let stored = '';
  try { stored = localStorage.getItem(STORAGE_KEYS.lastDomain) || ''; } catch {}
  if (stored && data[stored]) renderDetail(stored);
}

// ---------- Parallax panel ----------

function initPanelParallax() {
  const panel = $('#scada-panel');
  if (!panel) return;

  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let rect = panel.getBoundingClientRect();
  let w = rect.width, h = rect.height;

  function updateRect() {
    rect = panel.getBoundingClientRect();
    w = rect.width; h = rect.height;
  }
  window.addEventListener('resize', updateRect);

  window.addEventListener('pointermove', e => {
    const x = (e.clientX - (rect.left + w / 2)) / w;
    const y = (e.clientY - (rect.top + h / 2)) / h;
    const rx = y * -5;
    const ry = x * 5;
    panel.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    panel.style.boxShadow = '0 24px 80px rgba(15,23,42,0.26)';
  });

  panel.addEventListener('mouseleave', () => {
    panel.style.transform = 'rotateX(0deg) rotateY(0deg)';
    panel.style.boxShadow = 'var(--shadow-soft)';
  });
}

// ---------- Dashboard simulado ----------

function initDashboard() {
  if (!window.Chart) return;

  const barsCanvas  = $('#chart-bars');
  const radarCanvas = $('#chart-radar');
  const trendCanvas = $('#chart-trend');

  if (!barsCanvas || !radarCanvas || !trendCanvas) return;

  const loadEl   = $('#metric-load');
  const prodEl   = $('#metric-production');
  const jobEl    = $('#metric-job');
  const outEl    = $('#metric-output');
  const updEl    = $('#scada-updated');
  const statusEl = $('#scada-status');

  // Estado inicial (fábrica española)
  let production = 52; // units/h
  let jobStatus  = 68; // %
  let output     = 46; // kW
  let load       = 74; // %

  let demand = [72, 34, 41];          // 3 líneas
  let kpi    = [72, 58, 66, 52];      // 4 KPIs

  const randAround = (base, amp) =>
    base + (Math.random() - 0.5) * amp;

  const clamp = (v, min, max) =>
    Math.max(min, Math.min(max, v));

  // ---- Tendencia ----
  const maxPoints   = 60;
  const trendLabels = Array.from({ length: maxPoints }, (_, i) => i);
  const trendValues = trendLabels.map(() => load + (Math.random() - 0.5) * 2);

  const trendChart = new Chart(trendCanvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [{
        data: trendValues,
        tension: 0.45,
        borderWidth: 2,
        borderColor: '#111827',
        pointRadius: 0,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: {
          display: false
        },
        y: {
          grid: { color: 'rgba(209,213,219,0.7)', drawBorder: false },
          ticks: {
            maxTicksLimit: 3,
            callback: v => v.toFixed(0) + ' %'
          }
        }
      },
      animation: {
        duration: 550,
        easing: 'easeOutCubic'
      }
    }
  });

  // ---- Barras (demanda por línea) ----
  const barsChart = new Chart(barsCanvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Line A', 'Line B', 'Line C'],
      datasets: [{
        data: demand,
        backgroundColor: 'rgba(17,24,39,0.12)',
        borderColor: '#111827',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { display: false }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 9 } }
        }
      },
      animation: {
        duration: 480,
        easing: 'easeOutCubic'
      }
    }
  });

  // ---- Radar (equilibrio de KPIs) ----
  const radarChart = new Chart(radarCanvas.getContext('2d'), {
    type: 'radar',
    data: {
      labels: ['Throughput', 'Quality', 'Energy', 'Availability'],
      datasets: [{
        data: kpi,
        borderColor: '#111827',
        backgroundColor: 'rgba(17,24,39,0.07)',
        borderWidth: 1,
        pointRadius: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(156,163,175,0.5)' },
          grid:      { color: 'rgba(209,213,219,0.7)' },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { display: false },
          pointLabels: { font: { size: 9 } }
        }
      },
      animation: {
        duration: 480,
        easing: 'easeOutCubic'
      }
    }
  });

  // ---- Actualizar texto ----
  function updateText(now) {
    if (loadEl)
      loadEl.innerHTML = `${Math.round(load)}<span class="unit">% load</span>`;
    if (prodEl)
      prodEl.textContent = production.toFixed(1);
    if (jobEl)
      jobEl.textContent = jobStatus.toFixed(0) + '%';
    if (outEl)
      outEl.textContent = output.toFixed(1);

    if (updEl)
      updEl.textContent = `Updated: ${now.toLocaleTimeString('en-GB')}`;

    if (statusEl) {
      let state = 'Normal';
      if (jobStatus > 85 || load > 90) state = 'High load';
      else if (jobStatus < 45 || load < 55) state = 'Low load';
      statusEl.textContent = `${state} · Supervisory, forecasting & optimisation`;
    }
  }

  updateText(new Date());

  // ---- Bucle de simulación ----
  setInterval(() => {
    const now = new Date();

    // Salidas y KPIs se mueven suave
    production = clamp(randAround(production, 0.6), 40, 65);
    jobStatus  = clamp(randAround(jobStatus, 1.1), 40, 95);
    output     = clamp(randAround(output, 0.7), 35, 60);
    load       = clamp(randAround(load, 0.8), 50, 95);

    demand = demand.map((v, idx) => {
      const amp = idx === 0 ? 2.5 : 2;
      return clamp(randAround(v, amp), 10, 100);
    });

    kpi = kpi.map(v => clamp(randAround(v, 2.3), 40, 100));

    // Tendencia
    trendValues.push(load);
    if (trendValues.length > maxPoints) trendValues.shift();
    trendChart.data.datasets[0].data = trendValues;
    trendChart.update();

    // Barras
    barsChart.data.datasets[0].data = demand;
    barsChart.update();

    // Radar
    radarChart.data.datasets[0].data = kpi;
    radarChart.update();

    updateText(now);
  }, 1000);
}

// ---------- Init ----------

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-ready');

  initRouter();
  initScrollEffects();
  initReveal();
  initDomains();
  initPanelParallax();
  initDashboard();
});
