// ============================================
// FABITECH SOLUTIONS — CART MODULE
// ============================================

const Cart = (() => {
  let items = JSON.parse(localStorage.getItem('tp_cart') || '[]');

  function save() {
    localStorage.setItem('tp_cart', JSON.stringify(items));
  }

  function updateBadge() {
    const count = items.reduce((a, b) => a + b.qty, 0);
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    badge.textContent = count;
    if (count > 0) {
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
  }

  function add(product) {
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ ...product, qty: 1 });
    }
    save();
    updateBadge();
    renderDrawer();
    showToast(`✅ ${product.name} agregado al carrito`);
  }

  function remove(id) {
    items = items.filter(i => i.id !== id);
    save();
    updateBadge();
    renderDrawer();
  }

  function changeQty(id, delta) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      remove(id);
      return;
    }
    save();
    updateBadge();
    renderDrawer();
  }

  function clear() {
    items = [];
    save();
    updateBadge();
    renderDrawer();
  }

  function total() {
    return items.reduce((a, b) => a + b.price * b.qty, 0);
  }

  function formatPrice(n) {
    return n.toLocaleString('es-AR');
  }

  function renderDrawer() {
    const body = document.getElementById('cart-body');
    if (!body) return;

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <p>Tu carrito está vacío</p>
          <p style="font-size:0.82rem;margin-top:8px;color:var(--text-muted)">¡Agregá productos para empezar!</p>
        </div>`;
      document.getElementById('cart-footer').style.display = 'none';
      return;
    }

    document.getElementById('cart-footer').style.display = 'block';

    body.innerHTML = `<div class="cart-items">${items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='assets/placeholder.jpg'">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${formatPrice(item.price * item.qty)}</div>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="Cart.changeQty(${item.id}, -1)">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="Cart.changeQty(${item.id}, 1)">+</button>
            <button class="remove-item-btn" onclick="Cart.remove(${item.id})" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>`).join('')}
    </div>`;

    const totalEl = document.getElementById('cart-total-val');
    if (totalEl) totalEl.innerHTML = `<sup>$</sup>${formatPrice(total())}`;
  }

  function buildWhatsAppMessage() {
    if (items.length === 0) return '';
    let msg = '🛒 *Pedido FabiTech Solutions*\n\n';
    items.forEach(item => {
      msg += `• ${item.name} x${item.qty} = $${formatPrice(item.price * item.qty)}\n`;
    });
    msg += `\n💰 *Total: $${formatPrice(total())}*\n\nQuisiera hacer un pedido.`;
    return encodeURIComponent(msg);
  }

  function openDrawer() {
    document.getElementById('cart-overlay').classList.add('open');
    document.getElementById('cart-drawer').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    document.getElementById('cart-overlay').classList.remove('open');
    document.getElementById('cart-drawer').classList.remove('open');
    document.body.style.overflow = '';
  }

  function init() {
    updateBadge();
    renderDrawer();

    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', openDrawer);

    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.addEventListener('click', closeDrawer);

    const closeBtn = document.getElementById('cart-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    const clearBtn = document.getElementById('cart-clear');
    if (clearBtn) clearBtn.addEventListener('click', clear);

    const checkoutBtn = document.getElementById('cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (items.length === 0) return;
        const WHATSAPP_NUMBER = '5491138621658'; // ← Cambiar por número real
        const msg = buildWhatsAppMessage();
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
      });
    }
  }

  return { add, remove, changeQty, clear, total, init, openDrawer, closeDrawer };
})();

// ─── TOAST NOTIFICATION ───────────────────
function showToast(msg, duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">🔔</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
