document.addEventListener('DOMContentLoaded', () => {
  // ============================================
  // 1. AUTENTICACIÓN / ACCESO RESTRINGIDO
  // ============================================
  const loginOverlay = document.getElementById('login-overlay');
  const dashboardMainContent = document.getElementById('dashboard-main-content');
  const loginBtn = document.getElementById('login-btn');
  const passwordInput = document.getElementById('admin-password');
  const loginError = document.getElementById('login-error');

  const ADMIN_PASSWORD = "techparts2026"; // Contraseña por defecto

  const checkSession = () => {
    if (sessionStorage.getItem('techparts_admin_auth') === 'true') {
      loginOverlay.style.display = 'none';
      dashboardMainContent.style.display = 'block';
      initDashboard();
    }
  };

  const attemptLogin = () => {
    if (passwordInput.value === ADMIN_PASSWORD) {
      sessionStorage.setItem('techparts_admin_auth', 'true');
      loginOverlay.style.display = 'none';
      dashboardMainContent.style.display = 'block';
      showToast("⚡ Acceso autorizado. Bienvenido.", "success");
      initDashboard();
    } else {
      loginError.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
    }
  };

  if (loginBtn && passwordInput) {
    loginBtn.addEventListener('click', attemptLogin);
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  }

  // Ejecutar verificación de sesión inicial
  checkSession();

  // ============================================
  // 2. INICIALIZACIÓN GENERAL DEL PANEL
  // ============================================
  function initDashboard() {
    initTabs();
    initFormOverlayControls();
    
    // Iniciar escuchas en tiempo real
    startTurnosListener();
    startConsultasListener();
    startProductosListener();
  }

  // ============================================
  // 3. PESTAÑAS DE NAVEGACIÓN (TABS)
  // ============================================
  function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.dashboard-tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        // Desactivar botones y ocultar contenido
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.style.display = 'none');

        // Activar seleccionado
        btn.classList.add('active');
        const targetElement = document.getElementById(`tab-${target}`);
        if (targetElement) {
          targetElement.style.display = 'block';
        }
      });
    });
  }

  // ============================================
  // 4. ESCUCHAS DE FIRESTORE EN TIEMPO REAL
  // ============================================
  
  // A. ESCUCHA DE TURNOS TÉCNICOS
  let unsubscribeTurnos = null;
  function startTurnosListener() {
    if (unsubscribeTurnos) unsubscribeTurnos();

    if (typeof db !== 'undefined') {
      unsubscribeTurnos = db.collection("techparts_turnos").orderBy("date", "desc")
        .onSnapshot((snapshot) => {
          const turnos = [];
          snapshot.forEach((doc) => {
            turnos.push({ ...doc.data(), id: doc.id });
          });
          renderTurnos(turnos);
        }, (error) => {
          console.error("Error al escuchar turnos:", error);
        });
    }
  }

  function renderTurnos(turnos) {
    const totalRepairsEl = document.getElementById('total-repairs-count');
    const tableBody = document.getElementById('repairs-table-body');
    if (totalRepairsEl) totalRepairsEl.textContent = turnos.length;
    if (!tableBody) return;

    if (turnos.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">No hay solicitudes de turnos en la base de datos.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = turnos.map(t => {
      const date = new Date(t.date);
      const formattedDate = date.toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const statusClass = `status-${t.status || 'Pendiente'}`;

      return `
        <tr data-id="${t.id}">
          <td>
            <div class="customer-info">
              <span class="customer-name">${t.name}</span>
            </div>
          </td>
          <td>
            <div class="detail-item">
              <strong>${t.brand}</strong> ${t.model}
            </div>
          </td>
          <td>
            <span style="font-size:0.9rem; font-weight: 500;">⚙️ ${t.service}</span>
          </td>
          <td>
            <div class="detail-text" style="max-width: 250px; white-space: normal; word-break: break-word;">
              "${t.description || 'Sin detalles'}"
            </div>
          </td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${formattedDate}</td>
          <td>
            <span class="status-badge ${statusClass}" 
                  onclick="changeTurnoStatus('${t.id}', '${t.status || 'Pendiente'}')"
                  title="Haz clic para cambiar de estado">
              ${t.status || 'Pendiente'}
            </span>
          </td>
          <td>
            <div class="action-group" style="justify-content: center;">
              <button class="btn-icon" onclick="contactCustomerPhone('${t.phone}', '${t.name}', '${t.service}')" title="Contactar por WhatsApp">💬</button>
              <button class="btn-icon delete btn-delete-record" data-id="${t.id}" data-type="turno" title="Eliminar registro">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindDeleteButtons();
  }

  // B. ESCUCHA DE CONSULTAS GENERALES
  let unsubscribeConsultas = null;
  function startConsultasListener() {
    if (unsubscribeConsultas) unsubscribeConsultas();

    if (typeof db !== 'undefined') {
      unsubscribeConsultas = db.collection("techparts_consultas").orderBy("date", "desc")
        .onSnapshot((snapshot) => {
          const consultas = [];
          snapshot.forEach((doc) => {
            consultas.push({ ...doc.data(), id: doc.id });
          });
          renderConsultas(consultas);
        }, (error) => {
          console.error("Error al escuchar consultas:", error);
        });
    }
  }

  function renderConsultas(consultas) {
    const totalInquiriesEl = document.getElementById('total-inquiries-count');
    const tableBody = document.getElementById('inquiries-table-body');
    if (totalInquiriesEl) totalInquiriesEl.textContent = consultas.length;
    if (!tableBody) return;

    if (consultas.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">No hay consultas de contacto en la base de datos.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = consultas.map(c => {
      const date = new Date(c.date);
      const formattedDate = date.toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const statusClass = `status-${c.status || 'Pendiente'}`;

      return `
        <tr data-id="${c.id}">
          <td>
            <div class="customer-info">
              <span class="customer-name">${c.name}</span>
            </div>
          </td>
          <td style="font-size: 0.88rem; color: var(--accent-cyan);">${c.email}</td>
          <td style="font-weight: 500;">${c.subject}</td>
          <td>
            <div class="detail-text" style="max-width: 280px; white-space: normal; word-break: break-word;">
              "${c.message || 'Sin mensaje'}"
            </div>
          </td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${formattedDate}</td>
          <td>
            <span class="status-badge ${statusClass}" 
                  onclick="changeConsultaStatus('${c.id}', '${c.status || 'Pendiente'}')"
                  title="Haz clic para marcar como respondido/pendiente">
              ${c.status || 'Pendiente'}
            </span>
          </td>
          <td>
            <div class="action-group" style="justify-content: center;">
              <a class="btn-icon" href="mailto:${c.email}?subject=Respuesta FabiTech Solutions: ${encodeURIComponent(c.subject)}" style="text-decoration:none;" title="Responder por Email">✉️</a>
              <button class="btn-icon delete btn-delete-record" data-id="${c.id}" data-type="consulta" title="Eliminar registro">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindDeleteButtons();
  }

  // C. ESCUCHA DE PRODUCTOS DEL CATÁLOGO
  let unsubscribeProductos = null;
  function startProductosListener() {
    if (unsubscribeProductos) unsubscribeProductos();

    if (typeof db !== 'undefined') {
      unsubscribeProductos = db.collection("techparts_productos")
        .onSnapshot((snapshot) => {
          const productos = [];
          snapshot.forEach((doc) => {
            productos.push({ ...doc.data(), id: doc.id });
          });
          renderProductos(productos);
        }, (error) => {
          console.error("Error al escuchar productos:", error);
        });
    }
  }

  function renderProductos(productos) {
    const totalProductsEl = document.getElementById('total-products-count');
    const tableBody = document.getElementById('products-table-body');
    if (totalProductsEl) totalProductsEl.textContent = productos.length;
    if (!tableBody) return;

    if (productos.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">No hay productos cargados en el catálogo.</td>
        </tr>
      `;
      return;
    }

    // Ordenar alfabéticamente por categoría y luego nombre
    productos.sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return a.name.localeCompare(b.name);
    });

    tableBody.innerHTML = productos.map(p => {
      const inStock = p.stock !== false;
      const stockBadge = inStock 
        ? `<span style="color:var(--accent-green); font-weight:600;">✅ En stock</span>` 
        : `<span style="color:var(--accent-red); font-weight:600;">❌ Sin stock</span>`;

      const categoryLabel = {
        'modulos': '📱 Módulos',
        'baterias': '🔋 Baterías',
        'cables': '⚡ Cables/Flex',
        'repuestos': '🔩 Repuestos',
        'accesorios': '🎧 Accesorios'
      }[p.category] || p.category;

      return `
        <tr data-id="${p.id}">
          <td>
            <div class="product-preview">
              <img class="product-img" src="${p.image}" alt="${p.name}" onerror="this.src='assets/placeholder.jpg'">
              <div>
                <div style="font-weight:600; font-size: 0.95rem;">${p.name}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Marca: ${p.brand || 'Universal'}</div>
              </div>
            </div>
          </td>
          <td>
            <span style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500;">
              ${categoryLabel}
            </span>
          </td>
          <td style="font-weight: 700; color: var(--accent-cyan);">
            $${parseFloat(p.price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </td>
          <td style="font-size:0.85rem; color:var(--accent-purple); font-weight:500;">
            ${p.badge ? `✨ ${p.badge}` : '-'}
          </td>
          <td>${stockBadge}</td>
          <td>
            <div class="action-group" style="justify-content: center;">
              <button class="btn-icon edit" onclick="editProduct('${p.id}')" title="Editar producto">✏️</button>
              <button class="btn-icon delete btn-delete-record" data-id="${p.id}" data-type="producto" title="Eliminar producto">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    bindDeleteButtons();
  }

  // ============================================
  // 5. CAMBIOS DE ESTADO DIRECTOS EN TABLAS
  // ============================================
  window.changeTurnoStatus = (id, currentStatus) => {
    if (typeof db === 'undefined') return;

    let newStatus = 'Pendiente';
    if (currentStatus === 'Pendiente') newStatus = 'Confirmado';
    else if (currentStatus === 'Confirmado') newStatus = 'Finalizado';

    db.collection("techparts_turnos").doc(id).update({
      status: newStatus
    })
    .then(() => showToast(`Turno actualizado a ${newStatus}`, "success"))
    .catch(err => console.error("Error al actualizar turno:", err));
  };

  window.changeConsultaStatus = (id, currentStatus) => {
    if (typeof db === 'undefined') return;

    const newStatus = currentStatus === 'Pendiente' ? 'Respondido' : 'Pendiente';

    db.collection("techparts_consultas").doc(id).update({
      status: newStatus
    })
    .then(() => showToast(`Consulta marcada como ${newStatus}`, "success"))
    .catch(err => console.error("Error al actualizar consulta:", err));
  };

  window.contactCustomerPhone = (phone, name, service) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hola ${name}! Te contactamos de FabiTech Solutions ⚡ por tu solicitud de turno de reparación para: ${service}.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // ============================================
  // 6. CONTROL Y GESTIÓN DE ELIMINACIONES SEGUROS
  // ============================================
  function bindDeleteButtons() {
    const deleteBtns = document.querySelectorAll('.btn-delete-record');

    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type');

        if (btn.classList.contains('confirming')) {
          btn.textContent = '...';
          executeDelete(id, type, btn);
        } else {
          btn.classList.add('confirming');
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '¿Seguro?';

          // Resetear en 3 segundos si no vuelve a pulsar
          setTimeout(() => {
            if (document.body.contains(btn)) {
              btn.classList.remove('confirming');
              btn.innerHTML = originalHTML;
            }
          }, 3000);
        }
      });
    });
  }

  function executeDelete(id, type, btn) {
    if (typeof db === 'undefined') return;

    let collectionName = "";
    let typeLabel = "";

    if (type === "turno") {
      collectionName = "techparts_turnos";
      typeLabel = "Turno";
    } else if (type === "consulta") {
      collectionName = "techparts_consultas";
      typeLabel = "Consulta";
    } else if (type === "producto") {
      collectionName = "techparts_productos";
      typeLabel = "Producto";
    }

    db.collection(collectionName).doc(id).delete()
      .then(() => {
        showToast(`${typeLabel} eliminado con éxito de la nube.`, "success");
      })
      .catch(error => {
        console.error(`Error al eliminar ${type}:`, error);
        alert(`No se pudo eliminar: ${error.message}`);
        btn.classList.remove('confirming');
        btn.innerHTML = '🗑️';
      });
  }

  // ============================================
  // 7. FORMULARIO OVERLAY (CRUD PRODUCTO)
  // ============================================
  const productFormOverlay = document.getElementById('product-form-overlay');
  const formBackdrop = document.getElementById('form-backdrop');
  const btnShowAddProduct = document.getElementById('btn-show-add-product');
  const btnCloseProduct = document.getElementById('btn-close-product');
  const btnCancelProduct = document.getElementById('btn-cancel-product');
  const productForm = document.getElementById('product-form');
  const formProductTitle = document.getElementById('form-product-title');

  function initFormOverlayControls() {
    const openForm = () => {
      productFormOverlay.classList.add('open');
      formBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeForm = () => {
      productFormOverlay.classList.remove('open');
      formBackdrop.classList.remove('open');
      document.body.style.overflow = '';
      productForm.reset();
      document.getElementById('product-id').value = '';
      document.getElementById('product-image-file').value = '';
    };

    if (btnShowAddProduct) {
      btnShowAddProduct.addEventListener('click', () => {
        formProductTitle.textContent = "Agregar Nuevo Producto";
        productForm.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-image-file').value = '';
        openForm();
      });
    }

    [btnCloseProduct, btnCancelProduct, formBackdrop].forEach(el => {
      if (el) el.addEventListener('click', closeForm);
    });

    if (productForm) {
      productForm.addEventListener('submit', handleProductSubmit);
    }
  }

  // GUARDAR / EDITAR EN FIRESTORE
  async function handleProductSubmit(e) {
    e.preventDefault();

    const saveBtn = document.getElementById('btn-save-product');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Guardando...";
    saveBtn.disabled = true;

    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value;
    const brand = document.getElementById('product-brand').value;
    const badge = document.getElementById('product-badge').value;
    const description = document.getElementById('product-desc').value;
    const stock = document.getElementById('product-stock').checked;
    let image = document.getElementById('product-image').value;
    const imageFile = document.getElementById('product-image-file').files[0];

    try {
      // 1. Procesamiento de Imagen Local (Compresión local en Base64 JPEG)
      if (imageFile) {
        saveBtn.textContent = "Comprimiendo foto...";
        image = await compressImageToBase64(imageFile);
      } else if (!image) {
        throw new Error("Debes proporcionar una URL o seleccionar una imagen local.");
      }

      const productData = {
        name,
        price,
        category,
        brand,
        badge: badge || "",
        description: description || "",
        stock: stock !== false,
        image
      };

      if (typeof db === 'undefined') {
        throw new Error("Firebase db no está disponible.");
      }

      saveBtn.textContent = "Subiendo a Firestore...";
      
      if (id) {
        // Actualizar
        await db.collection("techparts_productos").doc(id).update(productData);
        showToast("Producto actualizado con éxito en el catálogo.", "success");
      } else {
        // Crear nuevo
        // Generar un ID aleatorio o dejar que Firestore lo genere
        await db.collection("techparts_productos").add(productData);
        showToast("Nuevo producto añadido con éxito.", "success");
      }

      // Cerrar formulario
      document.getElementById('btn-close-product').click();

    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert("Error al guardar: " + error.message);
    } finally {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  }

  // AL HACER CLIC EN EDITAR
  window.editProduct = (id) => {
    if (typeof db === 'undefined') return;

    db.collection("techparts_productos").doc(id).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        document.getElementById('product-id').value = id;
        document.getElementById('product-name').value = data.name;
        document.getElementById('product-price').value = data.price;
        document.getElementById('product-category').value = data.category;
        document.getElementById('product-brand').value = data.brand || 'Universal';
        document.getElementById('product-badge').value = data.badge || '';
        document.getElementById('product-desc').value = data.description || '';
        document.getElementById('product-image').value = data.image.startsWith('data:image') ? '' : data.image; // Evitar pegar base64 largo en el input
        document.getElementById('product-image-file').value = '';
        document.getElementById('product-stock').checked = data.stock !== false;

        formProductTitle.textContent = "Editar Producto";
        
        // Abrir overlay
        document.getElementById('product-form-overlay').classList.add('open');
        document.getElementById('form-backdrop').classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }).catch(err => {
      console.error("Error al obtener detalles del producto:", err);
      showToast("Error al abrir detalles del producto.", "error");
    });
  };

  // FUNCIÓN AUXILIAR DE COMPRESIÓN DE IMÁGENES EN EL CLIENTE
  function compressImageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // JPEG Compresión a 0.7 para óptimo almacenamiento
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(new Error("Error al abrir archivo de imagen."));
      };
      reader.onerror = (err) => reject(new Error("Error al leer archivo de imagen."));
    });
  }

  // ============================================
  // 8. NOTIFICACIONES FLOTANTES (TOASTS)
  // ============================================
  function showToast(message, type = "info") {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === "success" ? "✅" : type === "error" ? "❌" : "⚡";
    toast.innerHTML = `<span>${icon}</span><span style="font-weight:500;">${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3500);
  }
});
