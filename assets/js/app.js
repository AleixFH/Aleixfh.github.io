// Helpers
function qs(sel, parent = document) { return parent.querySelector(sel); }
function qsa(sel, parent = document) { return Array.from(parent.querySelectorAll(sel)); }

const STORAGE_KEYS = {
  lastView: 'mdei:lastView',
  lastDomain: 'mdei:lastDomain'
};

// ---------- SPA ----------

function setView(name) {
  const views = qsa('.view');
  views.forEach(v => {
    if (v.dataset.view === name) v.classList.add('view--active');
    else v.classList.remove('view--active');
  });

  const links = qsa('.nav-link');
  links.forEach(link => {
    if (link.dataset.viewTarget === name) link.classList.add('is-active');
    else link.classList.remove('is-active');
  });

  try { localStorage.setItem(STORAGE_KEYS.lastView, name); } catch {}
}

function initRouter() {
  const buttons = qsa('[data-view-target]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.viewTarget;
      if (!target) return;
      location.hash = target === 'home' ? '' : ('#' + target);
      setView(target);
    });
  });

  let initial = 'home';
  const hash = location.hash.replace('#','');
  let saved = '';
  try { saved = localStorage.getItem(STORAGE_KEYS.lastView) || ''; } catch {}

  if (hash) initial = hash;
  else if (saved) initial = saved;

  setView(initial);

  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#','') || 'home';
    setView(h);
  });
}

// ---------- Scroll / header ----------

function initScrollEffects() {
  const progressEl = qs('#scroll-progress');
  const headerEl = qs('#site-header');
  if (!progressEl || !headerEl) return;

  function onScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? window.scrollY / docHeight : 0;
    progressEl.style.transform = 'scaleX(' + progress.toFixed(3) + ')';

    if (window.scrollY > 10) headerEl.classList.add('is-scrolled');
    else headerEl.classList.remove('is-scrolled');
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---------- Reveal ----------

function initReveal() {
  const elements = qsa('.reveal');
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('reveal--visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

// ---------- Domains ----------

function initDomains() {
  const detail = qs('#platform-detail');
  if (!detail) return;

  const titleEl = qs('.platform-detail-title', detail);
  const textEl = qs('.platform-detail-text', detail);
  const pointsEl = qs('#platform-detail-points', detail);
  const rows = qsa('.platform-row');
  const searchInput = qs('#domain-search');

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
    textEl.textContent = info.text;
    pointsEl.innerHTML = '';
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

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  let savedDomain = '';
  try { savedDomain = localStorage.getItem(STORAGE_KEYS.lastDomain) || ''; } catch {}
  if (savedDomain && data[savedDomain]) renderDetail(savedDomain);
}

// ---------- Hero parallax ----------

function initHeroParallax() {
  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const panel = qs('#hero-monitor');
  if (!panel) return;

  let rect = panel.getBoundingClientRect();
  let width = rect.width;
  let height = rect.height;

  function updateRect() {
    rect = panel.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
  }

  window.addEventListener('resize', updateRect);

  window.addEventListener('pointermove', e => {
    const x = (e.clientX - (rect.left + width / 2)) / width;
    const y = (e.clientY - (rect.top + height / 2)) / height;
    const rotateX = y * -6;
    const rotateY = x * 6;

    panel.style.transform =
      'rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg)';
    panel.style.boxShadow = '0 24px 80px rgba(15,23,42,0.2)';
  });

  panel.addEventListener('mouseleave', () => {
    panel.style.transform = 'rotateX(0deg) rotateY(0deg)';
    panel.style.boxShadow = 'var(--shadow-soft)';
  });
}

// ---------- Dashboard simulado (multi-widget) ----------

function initDashboardSimulated() {
  if (!window.Chart) return;

  const gaugeCanvas = qs('#chart-gauge');
  const barsCanvas = qs('#chart-bars');
  const radarCanvas = qs('#chart-radar');
  const trendCanvas = qs('#chart-trend');

  if (!gaugeCanvas || !barsCanvas || !radarCanvas || !trendCanvas) return;

  const loadEl = qs('#metric-load');
  const prodEl = qs('#metric-production');
  const statusEl = qs('#metric-status');
  const outputEl = qs('#metric-output');
  const gaugeValueEl = qs('#gauge-value');
  const updatedEl = qs('#demand-updated');
  const stateEl = qs('#demand-status');

  const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Valores base
  let production = 51;
  let jobStatus = 59;
  let output = 42;
  let load = 72;

  // Serie de tendencia
  const maxPoints = 60;
  const trendLabels = [];
  const trendValues = [];

  const now = Date.now();
  for (let i = maxPoints - 1; i >= 0; i--) {
    const t = new Date(now - i * 1000);
    trendLabels.push(t);
    load += (Math.random() - 0.5) * 2.5;
    trendValues.push(load);
  }

  function randAround(base, amp) {
    return base + (Math.random() - 0.5) * amp;
  }

  // Gauge (utilisation)
  const gaugeChart = new Chart(gaugeCanvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Used', 'Free'],
      datasets: [{
        data: [jobStatus, 100 - jobStatus],
        backgroundColor: ['#111827', 'rgba(17,24,39,0.08)'],
        borderWidth: 0
      }]
    },
    options: {
      rotation: -135 * (Math.PI / 180),
      circumference: 270 * (Math.PI / 180),
      cutout: '70%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });

  // Barras (demand)
  const barsChart = new Chart(barsCanvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Line A', 'Line B', 'Line C'],
      datasets: [{
        data: [70, 29, 41],
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
      }
    }
  });

  // Radar (KPI balance)
  const radarChart = new Chart(radarCanvas.getContext('2d'), {
    type: 'radar',
    data: {
      labels: ['KPI 1', 'KPI 2', 'KPI 3', 'KPI 4'],
      datasets: [{
        data: [70, 55, 64, 48],
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
          grid: { color: 'rgba(209,213,219,0.7)' },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { display: false },
          pointLabels: { font: { size: 9 } }
        }
      }
    }
  });

  // Trend line
  const trendChart = new Chart(trendCanvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [{
        data: trendValues,
        tension: 0.35,
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
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: items => {
              const idx = items[0].dataIndex;
              const d = trendLabels[idx];
              return d ? timeFormatter.format(d) : '';
            },
            label: ctx => ctx.parsed.y.toFixed(1) + ' % load'
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxTicksLimit: 4,
            callback: (value, idx) => timeFormatter.format(trendLabels[idx])
          }
        },
        y: {
          grid: { color: 'rgba(209,213,219,0.7)', drawBorder: false },
          ticks: {
            maxTicksLimit: 3,
            callback: v => v.toFixed(0) + ' %'
          }
        }
      },
      animation: { duration: 200 }
    }
  });

  // Actualiza numeritos y estado
  function updateReadouts(vLoad, vProd, vStatus, vOutput, t) {
    if (loadEl) {
      loadEl.innerHTML = Math.round(vLoad) +
        '<span class="unit"> % load</span>';
    }
    if (prodEl) prodEl.textContent = vProd.toFixed(1);
    if (statusEl) statusEl.textContent = vStatus.toFixed(0) + '%';
    if (outputEl) outputEl.textContent = vOutput.toFixed(1);
    if (gaugeValueEl) gaugeValueEl.textContent = vStatus.toFixed(0) + '%';
    if (updatedEl) updatedEl.textContent = 'Updated: ' + timeFormatter.format(t);

    if (stateEl) {
      let state = 'Normal';
      if (vStatus > 85 || vLoad > 90) state = 'High load';
      else if (vStatus < 35 || vLoad < 40) state = 'Low load';
      stateEl.textContent = state + ' · Live simulation · 1s refresh';
    }
  }

  const lastTime = trendLabels[trendLabels.length - 1];
  updateReadouts(load, production, jobStatus, output, lastTime);

  // Tick de simulación
  setInterval(() => {
    const t = new Date();

    // random walk suave
    production = randAround(production, 1.4);
    jobStatus = Math.max(0, Math.min(100, randAround(jobStatus, 2.8)));
    output = randAround(output, 1.5);
    load = Math.max(30, Math.min(100, randAround(load, 2.0)));

    // actualizar tendencias
    trendLabels.push(t);
    trendValues.push(load);
    if (trendLabels.length > maxPoints) trendLabels.shift();
    if (trendValues.length > maxPoints) trendValues.shift();

    trendChart.data.labels = trendLabels;
    trendChart.data.datasets[0].data = trendValues;
    trendChart.update('none');

    // gauge
    gaugeChart.data.datasets[0].data = [jobStatus, 100 - jobStatus];
    gaugeChart.update('none');

    // barras
    barsChart.data.datasets[0].data = [
      Math.max(0, randAround(70, 5)),
      Math.max(0, randAround(29, 4)),
      Math.max(0, randAround(41, 4))
    ];
    barsChart.update('none');

    // radar
    radarChart.data.datasets[0].data = [
      Math.max(0, Math.min(100, randAround(70, 5))),
      Math.max(0, Math.min(100, randAround(55, 6))),
      Math.max(0, Math.min(100, randAround(64, 4))),
      Math.max(0, Math.min(100, randAround(48, 7)))
    ];
    radarChart.update('none');

    updateReadouts(load, production, jobStatus, output, t);
  }, 1000);
}

// ---------- Init ----------

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-app-ready');

  initRouter();
  initScrollEffects();
  initReveal();
  initDomains();
  initHeroParallax();
  initDashboardSimulated();
});
