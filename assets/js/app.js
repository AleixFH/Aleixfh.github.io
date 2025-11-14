// Utilidades simples
function qs(sel, parent = document) { return parent.querySelector(sel); }
function qsa(sel, parent = document) { return Array.from(parent.querySelectorAll(sel)); }

const STORAGE_KEYS = {
  lastView: 'mdei:lastView',
  lastDomain: 'mdei:lastDomain'
};

// ----- SPA sencilla -----

function setView(name) {
  const views = qsa('.view');
  views.forEach(v => {
    if (v.dataset.view === name) {
      v.classList.add('view--active');
    } else {
      v.classList.remove('view--active');
    }
  });

  const links = qsa('.nav-link');
  links.forEach(link => {
    if (link.dataset.viewTarget === name) link.classList.add('is-active');
    else link.classList.remove('is-active');
  });

  try { localStorage.setItem(STORAGE_KEYS.lastView, name); } catch (e) {}
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
  try { saved = localStorage.getItem(STORAGE_KEYS.lastView) || ''; } catch (e) {}

  if (hash) initial = hash;
  else if (saved) initial = saved;

  setView(initial);

  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#','') || 'home';
    setView(h);
  });
}

// ----- Scroll progress + header -----

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

// ----- Reveal on scroll -----

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

// ----- Domains: detalle + búsqueda -----

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
    try { localStorage.setItem(STORAGE_KEYS.lastDomain, key); } catch (e) {}
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
  try { savedDomain = localStorage.getItem(STORAGE_KEYS.lastDomain) || ''; } catch (e) {}
  if (savedDomain && data[savedDomain]) renderDetail(savedDomain);
}

// ----- Hero parallax (monitor) -----

function initHeroParallax() {
  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const panel = document.getElementById('hero-monitor') || document.getElementById('hero-panel');
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

// ----- Monitor demanda REE + Chart.js -----

function initDemandChart() {
  const canvas = document.getElementById('demand-chart');
  const valueEl = document.getElementById('demand-current');
  const updatedEl = document.getElementById('demand-updated');
  const statusEl = document.getElementById('demand-status');

  if (!canvas || !window.Chart) return;

  let chart;

  const pad = n => String(n).padStart(2, '0');

  function fmtIsoNoSeconds(d) {
    return (
      d.getFullYear() + '-' +
      pad(d.getMonth() + 1) + '-' +
      pad(d.getDate()) + 'T' +
      pad(d.getHours()) + ':' +
      pad(d.getMinutes())
    );
  }

  const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  async function fetchData() {
    const now = new Date();
    const end = new Date(now.getTime() - 15 * 60 * 1000); // 15 min de margen
    const start = new Date(end.getTime() - 6 * 60 * 60 * 1000); // últimas 6 horas

    const params = new URLSearchParams({
      start_date: fmtIsoNoSeconds(start),
      end_date: fmtIsoNoSeconds(end),
      time_trunc: 'hour'
    });

    const url = 'https://apidatos.ree.es/es/datos/demanda/demanda-tiempo-real?' +
                params.toString();

    if (statusEl) statusEl.textContent = 'Actualizando datos…';

    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();

      const included = json.included || [];
      const attr = included[0] && included[0].attributes;
      const series = (attr && attr.values) || [];
      if (!series.length) throw new Error('Sin datos');

      const labels = series.map(p => new Date(p.datetime));
      const values = series.map(p => p.value);

      const last = series[series.length - 1];
      if (last && last.value != null && valueEl) {
        const mw = Math.round(last.value);
        valueEl.innerHTML = mw.toLocaleString('es-ES') + ' <span class="unit">MW</span>';
      }
      if (last && last.datetime && updatedEl) {
        const d = new Date(last.datetime);
        updatedEl.textContent = 'Último dato: ' + timeFormatter.format(d);
      }

      const chartData = {
        labels,
        datasets: [{
          data: values,
          tension: 0.35,
          borderWidth: 2,
          borderColor: '#111827',
          pointRadius: 0,
          fill: false
        }]
      };

      const options = {
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
                const d = labels[idx];
                return d ? timeFormatter.format(d) : '';
              },
              label: ctx => {
                const v = ctx.parsed.y;
                return v.toLocaleString('es-ES') + ' MW';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 5,
              callback: (value, idx) => timeFormatter.format(labels[idx])
            }
          },
          y: {
            grid: { color: 'rgba(209,213,219,0.7)', drawBorder: false },
            ticks: {
              maxTicksLimit: 4,
              callback: v => v.toLocaleString('es-ES') + ' MW'
            }
          }
        }
      };

      if (!chart) {
        chart = new Chart(canvas.getContext('2d'), {
          type: 'line',
          data: chartData,
          options
        });
      } else {
        chart.data = chartData;
        chart.update();
      }

      if (statusEl) statusEl.textContent = 'Fuente: Red Eléctrica · REData API';
    } catch (err) {
      console.error('Error cargando demanda REE', err);
      if (statusEl) statusEl.textContent = 'No se pueden cargar los datos ahora mismo.';
    }
  }

  fetchData();
  setInterval(fetchData, 5 * 60 * 1000); // cada 5 minutos
}

// ----- Init -----

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-app-ready');

  initRouter();
  initScrollEffects();
  initReveal();
  initDomains();
  initHeroParallax();
  initDemandChart();
});
