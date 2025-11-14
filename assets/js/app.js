// --- Helpers ---
function qs(sel, parent = document) { return parent.querySelector(sel); }
function qsa(sel, parent = document) { return Array.from(parent.querySelectorAll(sel)); }

// SPA sencilla con hash + localStorage
const STORAGE_KEYS = {
  lastView: 'mdei:lastView',
  lastDomain: 'mdei:lastDomain'
};

function setView(name) {
  const views = qsa('.view');
  views.forEach(v => {
    if (v.dataset.view === name) {
      v.classList.add('view--active');
    } else {
      v.classList.remove('view--active');
    }
  });

  // nav activa
  const links = qsa('.nav-link');
  links.forEach(link => {
    if (link.dataset.viewTarget === name) link.classList.add('is-active');
    else link.classList.remove('is-active');
  });

  // guarda última vista
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
  const saved = (() => {
    try { return localStorage.getItem(STORAGE_KEYS.lastView) || ''; } catch (e) { return ''; }
  })();
  if (hash) initial = hash;
  else if (saved) initial = saved;

  setView(initial);

  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#','') || 'home';
    setView(h);
  });
}

// Scroll progress + header
function initScrollEffects() {
  const progressEl = qs('#scroll-progress');
  const headerEl = qs('#site-header');

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

// Reveal on scroll
function initReveal() {
  const elements = qsa('.reveal');
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

// Domain detail + search + remember last domain
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

  // search / filtro
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // cargar último dominio visto
  const savedDomain = (() => {
    try { return localStorage.getItem(STORAGE_KEYS.lastDomain) || ''; } catch (e) { return ''; }
  })();
  if (savedDomain && data[savedDomain]) renderDetail(savedDomain);
}

// Hero parallax
function initHeroParallax() {
  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const panel = qs('#hero-panel');
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
    panel.style.boxShadow = '0 18px 70px rgba(15,23,42,0.12)';
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  // marcamos que JS está activo para que el CSS use el modo SPA
  document.body.classList.add('js-app-ready');

  initRouter();
  initScrollEffects();
  initReveal();
  initDomains();
  initHeroParallax();
});
