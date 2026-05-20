// ============================================
// TECHPARTS — MAIN APP LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  initMobileNav();
  initFilters();
  renderProducts('all');
  renderServices();
  renderBrands();
  renderTestimonials();
  initContactForm();
  initReveal();
  Cart.init();
  initCounters();
});

// ─── PARTICLES ────────────────────────────
function initParticles() {
  const container = document.querySelector('.hero-particles');
  if (!container) return;
  const colors = ['#00d4ff', '#00ff88', '#7c3aed', '#ffffff'];
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 5 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${Math.random() * 15 + 10}s;
      animation-delay:${Math.random() * -20}s;
      filter:blur(${Math.random() > 0.5 ? 1 : 0}px);
    `;
    container.appendChild(p);
  }
}

// ─── NAVBAR ───────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    highlightNavLink();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function highlightNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-links a[href^="#"], #mobile-nav a[href^="#"]');
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id;
  });
  links.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}

// ─── MOBILE NAV ───────────────────────────
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', open);
  });

  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });
}

// ─── PRODUCT FILTERS ──────────────────────
let currentFilter = 'all';

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderProducts(currentFilter);
    });
  });
}

// ─── RENDER PRODUCTS ──────────────────────
function renderProducts(filter) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const filtered = filter === 'all'
    ? products
    : products.filter(p => p.category === filter);

  const empty = document.getElementById('products-empty');

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty && empty.classList.add('visible');
    return;
  }
  empty && empty.classList.remove('visible');

  grid.innerHTML = filtered.map(p => `
    <div class="product-card reveal${!p.stock ? ' out-of-stock' : ''}">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" onerror="this.src='assets/placeholder.jpg'" loading="lazy">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        ${!p.stock ? `<div class="out-of-stock-overlay">SIN STOCK</div>` : ''}
      </div>
      <div class="product-body">
        <div class="product-brand">${p.brand}</div>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <div class="product-price"><sup>$</sup>${p.price.toLocaleString('es-AR')}</div>
          <button
            class="add-to-cart-btn"
            onclick="Cart.add(${JSON.stringify(JSON.stringify(p))})"
            ${!p.stock ? 'disabled' : ''}
            id="prod-btn-${p.id}"
          >${p.stock ? '+ Carrito' : 'Sin stock'}</button>
        </div>
      </div>
    </div>
  `).join('');

  // Fix: re-bind click correctly
  grid.querySelectorAll('.add-to-cart-btn:not([disabled])').forEach(btn => {
    const id = parseInt(btn.id.replace('prod-btn-', ''));
    const product = products.find(p => p.id === id);
    if (product) {
      btn.onclick = () => {
        Cart.add(product);
        btn.textContent = '✓ Agregado';
        btn.style.background = 'linear-gradient(135deg, var(--accent-green), #00cc70)';
        setTimeout(() => {
          btn.textContent = '+ Carrito';
          btn.style.background = '';
        }, 1500);
      };
    }
  });

  // re-trigger reveal
  setTimeout(initReveal, 50);
}

// ─── RENDER SERVICES ──────────────────────
function renderServices() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  grid.innerHTML = services.map(s => `
    <div class="service-card reveal${s.popular ? ' popular' : ''}">
      ${s.popular ? '<span class="popular-badge">⭐ Más pedido</span>' : ''}
      <div class="service-icon">${s.icon}</div>
      <h3 class="service-name">${s.name}</h3>
      <p class="service-desc">${s.description}</p>
      <div class="service-meta">
        <div class="service-price">
          Desde $${s.priceFrom.toLocaleString('es-AR')}
          <span>/ estimado</span>
        </div>
        <div class="service-time">⏱ ${s.time}</div>
      </div>
      <button class="btn btn-ghost btn-sm" style="margin-top:20px;width:100%"
        onclick="scrollToContact('repair')">
        Solicitar turno →
      </button>
    </div>
  `).join('');
  setTimeout(initReveal, 50);
}

// ─── RENDER BRANDS ────────────────────────
function renderBrands() {
  const track = document.getElementById('brands-track');
  if (!track) return;
  // Duplicamos para el scroll infinito
  const doubled = [...brands, ...brands];
  track.innerHTML = doubled.map(b => `
    <div class="brand-item">${b.name}</div>
  `).join('');
}

// ─── RENDER TESTIMONIALS ──────────────────
function renderTestimonials() {
  const grid = document.getElementById('testimonials-grid');
  if (!grid) return;
  grid.innerHTML = testimonials.map(t => `
    <div class="testimonial-card reveal">
      <div class="testimonial-header">
        <div class="testimonial-avatar">${t.avatar}</div>
        <div class="testimonial-info">
          <div class="name">${t.name}</div>
          <div class="service-tag">${t.service}</div>
        </div>
      </div>
      <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
      <p class="testimonial-text" style="margin-top:12px">${t.text}</p>
    </div>
  `).join('');
  setTimeout(initReveal, 50);
}

// ─── CONTACT FORM ─────────────────────────
function initContactForm() {
  // Tabs
  document.querySelectorAll('.form-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${target}`)?.classList.add('active');
    });
  });

  // Submit handlers
  ['form-contact', 'form-repair'].forEach(formId => {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('.form-submit');
      btn.textContent = 'Enviando...';
      btn.disabled = true;
      setTimeout(() => {
        form.style.display = 'none';
        const success = document.getElementById(`success-${formId.replace('form-', '')}`);
        if (success) success.classList.add('visible');
      }, 1200);
    });
  });
}

function scrollToContact(tab) {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    if (tab === 'repair') {
      document.querySelector('[data-tab="repair"]')?.click();
    }
  }, 600);
}

// ─── SCROLL REVEAL ────────────────────────
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
}

// ─── ANIMATED COUNTERS ────────────────────
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      let current = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = Math.floor(current).toLocaleString('es-AR') + suffix;
      }, 16);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}
