// Cambio de vistas (SPA muy simple)
function setView(viewName) {
  const views = document.querySelectorAll('.view');
  views.forEach(v => {
    if (v.dataset.view === viewName) {
      v.classList.add('view--active');
    } else {
      v.classList.remove('view--active');
    }
  });
}

// Navegación por botones con data-view-target
function setupNav() {
  const navButtons = document.querySelectorAll('[data-view-target]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.viewTarget;
      if (target) setView(target);
      // actualiza hash para que se pueda compartir /domains, /contact, etc.
      if (target === 'home') {
        history.replaceState(null, '', './');
      } else {
        location.hash = '#' + target;
      }
    });
  });

  // cargar vista desde el hash actual
  const hash = location.hash.replace('#','');
  if (hash === 'domains' || hash === 'contact') {
    setView(hash);
  } else {
    setView('home');
  }

  window.addEventListener('hashchange', () => {
    const newHash = location.hash.replace('#','') || 'home';
    setView(newHash);
  });
}

// Barra de progreso + header shrink
function setupScrollEffects() {
  const progressEl = document.getElementById('scroll-progress');
  const headerEl = document.getElementById('site-header');

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

// Panel de detalle para domains
function setupDomainDetail() {
  const detail = document.getElementById('platform-detail');
  if (!detail) return;

  const detailsData = {
    automation: {
      title: 'Automation',
      text: 'PLC, SCADA and control architectures for production lines and industrial processes.'
    },
    robotics: {
      title: 'Robotics',
      text: 'Integration of industrial robots and cobots with safety, vision and conveyor systems.'
    },
    cybersecurity: {
      title: 'Cybersecurity',
      text: 'Segmentation, monitoring and resilience for OT networks and critical assets.'
    }
  };

  const rows = document.querySelectorAll('.platform-row');
  rows.forEach(row => {
    row.addEventListener('click', () => {
      const key = row.dataset.domain;
      const info = detailsData[key];
      if (!info) return;
      detail.querySelector('.platform-detail-title').textContent = info.title;
      detail.querySelector('.platform-detail-text').textContent = info.text;
    });
  });
}

// Parallax suave del panel hero
function setupHeroParallax() {
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const panel = document.getElementById('hero-panel');
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

// Inicializar todo
document.addEventListener('DOMContentLoaded', () => {
  setView('home');
  setupNav();
  setupScrollEffects();
  setupDomainDetail();
  setupHeroParallax();
});
