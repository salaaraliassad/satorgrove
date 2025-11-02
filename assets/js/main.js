(function () {
  const root = document.documentElement;
  const THEME_KEY = 'sg_theme';
  const btn = document.getElementById('themeToggle');

  // --- THEME ---
  const sysPrefersDark = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  function setTheme(theme) {
    // theme: 'dark' | 'light'
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme'); // light = default
    }
    localStorage.setItem(THEME_KEY, theme);
    setLogos();
    setFaviconByTheme();
  }

  function setFaviconByTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const fav = document.getElementById('favicon');
    if (fav) {
      fav.href = dark
        ? './assets/img/favicon/sg-dark-32.png'
        : './assets/img/favicon/sg-light-32.png';
    }
  }

  // Initial theme: saved -> system -> light
  (function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    } else {
      setTheme(sysPrefersDark() ? 'dark' : 'light');
    }
  })();

  // React to OS theme changes if user hasn't explicitly chosen
  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener?.('change', (e) => {
      const saved = localStorage.getItem(THEME_KEY);
      if (!saved) setTheme(e.matches ? 'dark' : 'light');
    });
  } catch {}

  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'light' : 'dark');
    });
  }

  // --- LOGO SWAP ---
  function setLogos() {
    const dark = root.getAttribute('data-theme') === 'dark';
    const swap = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const src = dark ? el.getAttribute('data-dark') : el.getAttribute('data-light');
      if (src) el.src = src;
    };
    swap('heroLogo');
    swap('brandLogo');
  }

  // --- NAV + SCROLL ---
  const navLinks = Array.from(document.querySelectorAll('.menu a[data-scroll]'));
  const sections  = Array.from(document.querySelectorAll('section.page[id]'));
  const linkByHash = new Map(navLinks.map(a => [a.getAttribute('href'), a]));

  // Map sections to the nav item that should be highlighted
  const sectionToNav = {
    'product'           : '#product',
    'product-visuals'   : '#product',
    'product-visuals-2' : '#product',
    'product-partners'  : '#product',
    // add more product sub-sections here if you create them
  };
  const normalizeHash = (hash) => sectionToNav[hash.slice(1)] || hash;

  // Smooth scroll (scroll-margin-top handled in CSS)
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior:'smooth', block:'start' });
      history.replaceState(null, '', href);
      setActiveLink(normalizeHash(href));
    });
  });

  function setActiveLink(hash){
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
  }

  // Highlight active section while scrolling
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const raw  = `#${entry.target.id}`;
      const hash = normalizeHash(raw);
      setActiveLink(hash);
    });
  },{ root:null, threshold:0.6 });

  sections.forEach(s => observer.observe(s));

  // Mark active on load (hash) or default to first section
  (function initActive() {
    const nh = normalizeHash(location.hash || '');
    if (nh && linkByHash.get(nh)) {
      setActiveLink(nh);
    } else if (sections.length) {
      setActiveLink(normalizeHash(`#${sections[0].id}`));
    }
  })();

  // Keep in sync if hash changes (e.g., back/forward)
  window.addEventListener('hashchange', () => {
    const nh = normalizeHash(location.hash || '');
    if (nh && linkByHash.get(nh)) setActiveLink(nh);
  });
})();
