// ==========================================================================
// TANGO FAST FOOD - SCRIPT OFICIAL (INTERACCIONES & DESIGN CRAFT)
// ==========================================================================

let carrito = [];
let mensajeWhatsAppGenerado = "";
let adicionalPendiente = null;
let totalActualPedido = 0;
let categoriaActiva = "todas";

// -------------------------------------------------------------
// PERSISTENCIA (localStorage): carrito + datos del cliente
// -------------------------------------------------------------
const LS_CARRITO = "tango_carrito_v1";
const LS_CLIENTE = "tango_cliente_v1";
const LS_ULTIMO_PEDIDO = "tango_ultimo_pedido_v1";

function guardarCarrito() {
  try {
    localStorage.setItem(LS_CARRITO, JSON.stringify(carrito));
  } catch (e) {
    // almacenamiento no disponible: seguimos sin guardar
  }
}

function guardarDatosCliente() {
  try {
    const inputNombre = document.getElementById("nombre");
    const inputDireccion = document.getElementById("direccion");
    const inputEntrecalles = document.getElementById("entrecalles");
    localStorage.setItem(LS_CLIENTE, JSON.stringify({
      nombre: inputNombre ? inputNombre.value : "",
      direccion: inputDireccion ? inputDireccion.value : "",
      entrecalles: inputEntrecalles ? inputEntrecalles.value : ""
    }));
  } catch (e) {
    // almacenamiento no disponible
  }
}

function cargarEstadoGuardado() {
  try {
    const carritoGuardado = localStorage.getItem(LS_CARRITO);
    if (carritoGuardado) {
      const parseado = JSON.parse(carritoGuardado);
      if (Array.isArray(parseado) && parseado.length > 0) {
        carrito = parseado;
        mostrarToast("Recuperamos tu pedido pendiente 🍔", "burger");
      }
    }
    const clienteGuardado = localStorage.getItem(LS_CLIENTE);
    if (clienteGuardado) {
      const datos = JSON.parse(clienteGuardado);
      const inputNombre = document.getElementById("nombre");
      const inputDireccion = document.getElementById("direccion");
      const inputEntrecalles = document.getElementById("entrecalles");
      if (inputNombre && datos.nombre) inputNombre.value = datos.nombre;
      if (inputDireccion && datos.direccion) inputDireccion.value = datos.direccion;
      if (inputEntrecalles && datos.entrecalles) inputEntrecalles.value = datos.entrecalles;
    }
  } catch (e) {
    // datos corruptos: arrancamos limpio
  }
}

// -------------------------------------------------------------
// ÚLTIMO PEDIDO: guardarlo al enviar + chip "Repetir" + fecha en drawer
// -------------------------------------------------------------
function guardarUltimoPedido() {
  if (carrito.length === 0) return;
  try {
    localStorage.setItem(LS_ULTIMO_PEDIDO, JSON.stringify({
      fecha: new Date().toISOString(),
      items: JSON.parse(JSON.stringify(carrito))
    }));
  } catch (e) {
    // sin almacenamiento
  }
  actualizarUltimoPedidoUI();
}

function leerUltimoPedido() {
  try {
    const guardado = localStorage.getItem(LS_ULTIMO_PEDIDO);
    if (!guardado) return null;
    const parseado = JSON.parse(guardado);
    if (Array.isArray(parseado.items) && parseado.items.length > 0) return parseado;
    return null;
  } catch (e) {
    return null;
  }
}

function repetirUltimoPedido() {
  const ultimo = leerUltimoPedido();
  if (!ultimo) return;
  carrito = JSON.parse(JSON.stringify(ultimo.items));
  guardarCarrito();
  actualizarCarrito();
  abrirCarrito();
  mostrarToast("Pedido cargado. Revisalo y mandalo 🍔", "burger");
}

function formatearFechaPedido(iso) {
  const fecha = new Date(iso);
  if (isNaN(fecha)) return "";
  const dia = fecha.toLocaleDateString("es-AR", { weekday: "long" });
  const hora = fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${hora} hs`;
}

function actualizarUltimoPedidoUI() {
  const ultimo = leerUltimoPedido();
  const chip = document.getElementById("chip-repetir");
  const fechaDiv = document.getElementById("ultimo-pedido-fecha");

  if (chip) chip.style.display = (ultimo && carrito.length === 0) ? "flex" : "none";

  if (fechaDiv) {
    if (ultimo && ultimo.fecha) {
      fechaDiv.textContent = `Último pedido: ${formatearFechaPedido(ultimo.fecha)}`;
      fechaDiv.style.display = "block";
    } else {
      fechaDiv.style.display = "none";
    }
  }
}

// -------------------------------------------------------------
// TOASTS FLUIDOS (Inspirado en Sonner / Emil Kowalski)
// -------------------------------------------------------------
function mostrarToast(mensaje, tipo = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${tipo === "warning" ? "toast-warning" : ""}`;

  let icono = "✅";
  if (tipo === "warning") icono = "⚠️";
  if (tipo === "burger") icono = "🍔";
  if (tipo === "fries") icono = "🍟";

  toast.innerHTML = `<span>${icono}</span> <span>${mensaje}</span>`;
  container.appendChild(toast);

  // Auto-eliminar después de 2.6 segundos con animación suave
  setTimeout(() => {
    toast.classList.add("toast-exit");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 220);
  }, 2600);
}

// -------------------------------------------------------------
// VERIFICAR ESTADO DEL LOCAL (Viernes a Domingo de 19:00 a 00:00)
// -------------------------------------------------------------
function verificarEstadoLocal() {
  const contenedor = document.getElementById("estado-local");
  const texto = document.getElementById("texto-estado");
  if (!contenedor || !texto) return;

  const ahora = new Date();
  const dia = ahora.getDay(); // 0: Domingo, 5: Viernes, 6: Sábado
  const hora = ahora.getHours();

  // Viernes(5), Sábado(6) y Domingo(0) de 19:00 a 23:59 hs
  const esDiaPermitido = (dia === 5 || dia === 6 || dia === 0);
  const esHoraPermitida = (hora >= 19 && hora < 24);

  if (esDiaPermitido && esHoraPermitida) {
    contenedor.className = "estado-bar abierto";
    texto.innerHTML = "LOCAL ABIERTO &bull; Horario: Vie a Dom 19:00 a 00:00 hs";
  } else {
    contenedor.className = "estado-bar cerrado";
    texto.innerHTML = "LOCAL CERRADO &bull; Horario: Vie a Dom 19:00 a 00:00 hs";
  }
}

// -------------------------------------------------------------
// ACTUALIZAR PRECIO VISIBLE EN LA TARJETA AL CAMBIAR SELECT
// -------------------------------------------------------------
function actualizarPrecioCard(selectElement) {
  const card = selectElement.closest(".product-card");
  if (!card) return;
  const precioTag = card.querySelector(".precio-tag");
  const precio = parseInt(selectElement.value, 10);
  if (precioTag && !isNaN(precio)) {
    precioTag.textContent = `$${precio.toLocaleString("es-AR")}`;
  }
}

// -------------------------------------------------------------
// CHIPS DE PAN (Botones pastilla: Papa / Brioche / Parmesano)
// -------------------------------------------------------------
function elegirPan(boton) {
  const grupo = boton.closest(".chips-pan");
  if (!grupo) return;
  grupo.querySelectorAll(".chip-pan").forEach(chip => chip.classList.remove("activo"));
  boton.classList.add("activo");
}

// -------------------------------------------------------------
// AGREGAR HAMBURGUESAS AL PEDIDO
// -------------------------------------------------------------
function agregarAlCarrito(boton, nombreHamburguesa) {
  const card = boton.closest(".product-card");
  const selectVariante = card.querySelector(".select-variante");
  const chipPan = card.querySelector(".chip-pan.activo");

  const precio = parseInt(selectVariante.value, 10);
  const tamaño = selectVariante.options[selectVariante.selectedIndex].getAttribute("data-nombre");
  const pan = chipPan ? chipPan.getAttribute("data-pan") : "Pan de Papa";

  const producto = {
    id: Date.now() + Math.random(),
    tipo: "burgers",
    nombre: nombreHamburguesa,
    detalle: `${tamaño} | ${pan}`,
    precio: precio,
    cantidad: 1,
    adicionales: []
  };

  carrito.push(producto);
  mostrarToast(`${nombreHamburguesa} (${tamaño}) agregada al pedido`, "burger");
  animarBadgeCarrito();
  actualizarCarrito();
}

// -------------------------------------------------------------
// AGREGAR GUARNICIONES (Papas, etc.)
// -------------------------------------------------------------
function agregarDirecto(nombreProducto, precio) {
  const producto = {
    id: Date.now() + Math.random(),
    tipo: "guarniciones",
    nombre: nombreProducto,
    detalle: "Porción individual",
    precio: parseInt(precio, 10),
    cantidad: 1,
    adicionales: []
  };

  carrito.push(producto);
  mostrarToast(`${nombreProducto} agregada`, "fries");
  animarBadgeCarrito();
  actualizarCarrito();
}

// -------------------------------------------------------------
// AGREGAR ADICIONALES (Con Modal Estilizado si hay varias burgers)
// -------------------------------------------------------------
function agregarAdicional(nombreAdicional, precioAdicional) {
  const hamburguesasEnCarrito = carrito.filter(p => p.tipo === "burgers");

  // Regla 1: Si no hay hamburguesas, avisar
  if (hamburguesasEnCarrito.length === 0) {
    mostrarToast("Elegí primero una hamburguesa para sumarle este adicional", "warning");
    irAlCarrito();
    return;
  }

  // Regla 2: Si hay solo una, se asigna directamente
  if (hamburguesasEnCarrito.length === 1) {
    const destino = hamburguesasEnCarrito[0];
    destino.adicionales.push({
      nombre: nombreAdicional,
      precio: parseInt(precioAdicional, 10)
    });
    mostrarToast(`Extra ${nombreAdicional} sumado a ${destino.nombre}`, "success");
    animarBadgeCarrito();
    actualizarCarrito();
    return;
  }

  // Regla 3: Si hay más de una, abrir modal táctil para elegir cuál
  adicionalPendiente = {
    nombre: nombreAdicional,
    precio: parseInt(precioAdicional, 10)
  };

  const modalBurger = document.getElementById("modal-seleccionar-burger");
  const listaOpciones = document.getElementById("lista-opciones-burger");
  const tituloModal = document.getElementById("titulo-modal-adicional");

  if (!modalBurger || !listaOpciones) return;

  tituloModal.textContent = `Sumar ${nombreAdicional} (+$${parseInt(precioAdicional, 10).toLocaleString("es-AR")})`;
  listaOpciones.innerHTML = "";

  hamburguesasEnCarrito.forEach((burger, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-elegir-burger";
    btn.innerHTML = `
      <div>
        <strong>🍔 ${burger.nombre}</strong>
        <div style="font-size: 0.8rem; color: #6b7280; font-weight: normal;">${burger.detalle}</div>
      </div>
      <span style="color: #2b543b; font-weight: 800;">Elegir &rarr;</span>
    `;
    btn.onclick = () => asignarAdicionalAHamburguesa(burger.id);
    listaOpciones.appendChild(btn);
  });

  modalBurger.style.display = "flex";
}

function asignarAdicionalAHamburguesa(burgerId) {
  if (!adicionalPendiente) return;
  const burger = carrito.find(item => item.id === burgerId);
  if (burger) {
    burger.adicionales.push({
      nombre: adicionalPendiente.nombre,
      precio: adicionalPendiente.precio
    });
    mostrarToast(`Extra ${adicionalPendiente.nombre} sumado a ${burger.nombre}`, "success");
    animarBadgeCarrito();
    actualizarCarrito();
  }
  cerrarModalBurger();
}

function cerrarModalBurger() {
  const modalBurger = document.getElementById("modal-seleccionar-burger");
  if (modalBurger) modalBurger.style.display = "none";
  adicionalPendiente = null;
}

// -------------------------------------------------------------
// CAMBIAR CANTIDAD (+ / -) Y ELIMINAR
// -------------------------------------------------------------
function cambiarCantidad(index, cambio) {
  if (carrito[index]) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) {
      carrito.splice(index, 1);
    }
    animarBadgeCarrito();
    actualizarCarrito();
  }
}

function eliminarDelCarrito(index) {
  if (carrito[index]) {
    const itemEliminado = carrito[index];
    carrito.splice(index, 1);
    mostrarToast(`${itemEliminado.nombre} eliminado del pedido`, "warning");
    animarBadgeCarrito();
    actualizarCarrito();
  }
}

function animarBadgeCarrito() {
  const badge = document.getElementById("badge-contador");
  if (badge) {
    badge.classList.remove("bump");
    void badge.offsetWidth; // Trigger reflow para reiniciar la animación
    badge.classList.add("bump");
  }
}

// -------------------------------------------------------------
// ACTUALIZAR LA VISTA DEL CARRITO Y TOTALES
// -------------------------------------------------------------
function actualizarCarrito() {
  const listaCarrito = document.getElementById("lista-carrito");
  const totalPrecio = document.getElementById("total-precio");
  const metodoPagoSelect = document.getElementById("metodo-pago");
  const badgeContador = document.getElementById("badge-contador");
  const lineaRecargo = document.getElementById("linea-recargo");
  const montoRecargoSpan = document.getElementById("monto-recargo");

  if (!listaCarrito || !totalPrecio) return;

  // Actualizar contador del badge flotante
  let totalItems = 0;
  carrito.forEach(item => totalItems += (item.cantidad || 1));
  if (badgeContador) badgeContador.textContent = totalItems;

  if (carrito.length === 0) {
    listaCarrito.innerHTML = `<p style="text-align: center; color: #6b7280; padding: 24px 0;">No has agregado ningún producto aún.</p>`;
    totalPrecio.textContent = "0";
    if (lineaRecargo) lineaRecargo.style.display = "none";
    totalActualPedido = 0;
    actualizarBadgesPedido();
    actualizarVueltoEnVivo();
    actualizarUltimoPedidoUI();
    guardarCarrito();
    actualizarBotonMercadoPago(0);
    return;
  }

  let html = "";
  let subtotalGeneral = 0;

  carrito.forEach((item, index) => {
    let precioUnitarioTotal = item.precio;
    let adicionalesHtml = "";

    if (item.adicionales && item.adicionales.length > 0) {
      item.adicionales.forEach(a => {
        precioUnitarioTotal += a.precio;
        adicionalesHtml += `<br><span class="item-extra">➕ Extra: ${a.nombre} (+$${a.precio.toLocaleString("es-AR")})</span>`;
      });
    }

    const cantidadItem = item.cantidad || 1;
    const subtotalItem = precioUnitarioTotal * cantidadItem;
    subtotalGeneral += subtotalItem;

    html += `
      <div class="item-carrito-row">
        <div class="item-info">
          <span class="item-nombre">${item.nombre}</span>
          <span class="item-detalle">${item.detalle}${adicionalesHtml}</span>
          <span style="font-weight: 800; color: #ea580c; font-size: 0.95rem; margin-top: 2px;">$${subtotalItem.toLocaleString("es-AR")}</span>
        </div>
        <div class="item-controles">
          <button type="button" class="btn-qty" onclick="cambiarCantidad(${index}, -1)" title="Restar uno">-</button>
          <span class="item-qty-num">${cantidadItem}</span>
          <button type="button" class="btn-qty" onclick="cambiarCantidad(${index}, 1)" title="Sumar uno">+</button>
          <button type="button" class="btn-eliminar" onclick="eliminarDelCarrito(${index})" title="Eliminar del pedido">🗑️</button>
        </div>
      </div>
    `;
  });

  let totalFinal = subtotalGeneral;
  const esTransferencia = metodoPagoSelect && metodoPagoSelect.value === "Transferencia";

  if (esTransferencia) {
    const recargo = Math.round(subtotalGeneral * 0.06);
    totalFinal = subtotalGeneral + recargo;
    if (lineaRecargo && montoRecargoSpan) {
      lineaRecargo.style.display = "flex";
      montoRecargoSpan.textContent = `+$${recargo.toLocaleString("es-AR")}`;
    }
  } else {
    if (lineaRecargo) lineaRecargo.style.display = "none";
  }

  listaCarrito.innerHTML = html;
  totalPrecio.textContent = totalFinal.toLocaleString("es-AR");
  totalActualPedido = totalFinal;
  actualizarBotonMercadoPago(totalFinal);
  actualizarBadgesPedido();
  actualizarVueltoEnVivo();
  actualizarUltimoPedidoUI();
  guardarCarrito();
}

// -------------------------------------------------------------
// BADGE "X EN PEDIDO" EN LAS TARJETAS DEL MENÚ
// -------------------------------------------------------------
function actualizarBadgesPedido() {
  document.querySelectorAll(".product-card").forEach(card => {
    const nombreCard = ((card.querySelector("h3") || {}).textContent || "").trim();
    const wrapper = card.querySelector(".product-img-wrapper");
    if (!wrapper) return;
    if (!card.querySelector(".badge-en-pedido")) {
      const nuevo = document.createElement("div");
      nuevo.className = "badge-en-pedido";
      wrapper.appendChild(nuevo);
    }
    const badge = card.querySelector(".badge-en-pedido");
    let enPedido = 0;
    carrito.forEach(item => {
      if (item.nombre && item.nombre.trim().toUpperCase() === nombreCard.toUpperCase()) {
        enPedido += (item.cantidad || 1);
      }
    });
    if (enPedido > 0) {
      badge.textContent = `${enPedido} en tu pedido`;
      badge.classList.add("visible");
    } else {
      badge.classList.remove("visible");
    }
  });
}

// -------------------------------------------------------------
// VUELTO EN VIVO (etiqueta verde mientras escribís cuánto pagás)
// -------------------------------------------------------------
function actualizarVueltoEnVivo() {
  const feedback = document.getElementById("vuelto-feedback");
  const inputPagoCon = document.getElementById("pago-con");
  const metodoPagoSelect = document.getElementById("metodo-pago");
  if (!feedback || !inputPagoCon) return;

  const metodoPago = metodoPagoSelect ? metodoPagoSelect.value : "Efectivo";
  if (metodoPago !== "Efectivo" || inputPagoCon.value === "" || totalActualPedido <= 0) {
    feedback.textContent = "";
    return;
  }

  const pagoCon = parseFloat(inputPagoCon.value);
  if (isNaN(pagoCon) || pagoCon <= 0) {
    feedback.textContent = "";
    return;
  }

  const vuelto = pagoCon - totalActualPedido;
  if (vuelto >= 0) {
    feedback.textContent = `💵 Tu vuelto será de $${vuelto.toLocaleString("es-AR")}`;
    feedback.classList.remove("vuelto-falta");
    feedback.classList.add("vuelto-ok");
  } else {
    feedback.textContent = `⚠️ Te faltan $${Math.abs(vuelto).toLocaleString("es-AR")} para cubrir el total`;
    feedback.classList.remove("vuelto-ok");
    feedback.classList.add("vuelto-falta");
  }
}

// -------------------------------------------------------------
// FILTRAR CATEGORÍAS CON ANIMACIÓN SUAVE
// -------------------------------------------------------------
function filtrarCategoria(categoria, boton) {
  const botones = document.querySelectorAll(".btn-categoria");
  botones.forEach(b => b.classList.remove("active"));
  boton.classList.add("active");
  categoriaActiva = categoria;
  aplicarFiltrosMenu();
}

// -------------------------------------------------------------
// BUSCADOR EN TIEMPO REAL (combina categoría activa + texto)
// -------------------------------------------------------------
function filtrarBusqueda(query) {
  aplicarFiltrosMenu(query);
}

function normalizarTexto(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function aplicarFiltrosMenu(query) {
  const inputBuscador = document.getElementById("buscador");
  const consulta = normalizarTexto(typeof query === "string" ? query : (inputBuscador ? inputBuscador.value : ""));
  let visibles = 0;

  document.querySelectorAll(".product-card").forEach(p => {
    const enCategoria = categoriaActiva === "todas" || p.getAttribute("data-category") === categoriaActiva;
    const textoCard = normalizarTexto(p.textContent);
    const coincide = !consulta || textoCard.includes(consulta);

    if (enCategoria && coincide) {
      p.style.display = "flex";
      visibles++;
    } else {
      p.style.display = "none";
    }
  });

  const vacio = document.getElementById("sin-resultados");
  if (vacio) vacio.style.display = visibles === 0 ? "block" : "none";
}

// -------------------------------------------------------------
// CHECKOUT: PREPARAR Y DESPLEGAR MODAL DE RESUMEN
// -------------------------------------------------------------
function enviarWhatsApp() {
  const inputNombre = document.getElementById("nombre");
  const inputDireccion = document.getElementById("direccion");
  const inputEntreCalles = document.getElementById("entrecalles");
  const inputObservaciones = document.getElementById("observaciones");
  const inputPagoCon = document.getElementById("pago-con");
  const metodoPagoSelect = document.getElementById("metodo-pago");

  const nombre = inputNombre ? inputNombre.value.trim() : "";
  const direccion = inputDireccion ? inputDireccion.value.trim() : "";
  const entrecalles = inputEntreCalles ? inputEntreCalles.value.trim() : "";
  const observaciones = inputObservaciones ? inputObservaciones.value.trim() : "";
  const pagoCon = inputPagoCon ? parseFloat(inputPagoCon.value) : 0;
  const metodoPago = metodoPagoSelect ? metodoPagoSelect.value : "Efectivo";

  let esValido = true;

  if (!nombre) {
    if (inputNombre) inputNombre.classList.add("is-invalid");
    esValido = false;
  } else if (inputNombre) {
    inputNombre.classList.remove("is-invalid");
  }

  if (!direccion) {
    if (inputDireccion) inputDireccion.classList.add("is-invalid");
    esValido = false;
  } else if (inputDireccion) {
    inputDireccion.classList.remove("is-invalid");
  }

  if (!esValido) {
    mostrarToast("Por favor, completá los campos obligatorios marcados en rojo", "warning");
    irAlCarrito();
    return;
  }

  if (carrito.length === 0) {
    mostrarToast("Tu pedido está vacío. ¡Agregá tus burgers favoritas!", "warning");
    return;
  }

  let subtotalGeneral = 0;
  let resumenHTML = `
    <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 14px; border: 1px solid #e5e7eb;">
      <p style="margin: 3px 0;"><b>👤 Cliente:</b> ${nombre}</p>
      <p style="margin: 3px 0;"><b>📍 Dirección:</b> ${direccion} ${entrecalles ? '(' + entrecalles + ')' : ''}</p>
      <p style="margin: 3px 0;"><b>💳 Pago:</b> ${metodoPago}</p>
    </div>
    <p style="margin-bottom: 8px;"><b>🍔 Detalle del Pedido:</b></p>
    <ul style="padding-left: 18px; margin-bottom: 14px;">
  `;

  let mensaje = `¡Hola Tango Fast Food! Soy *${nombre}* y quiero hacer este pedido:\n\n`;

  carrito.forEach((item, i) => {
    let precioUnitarioTotal = item.precio;
    let textoAdicionales = "";

    if (item.adicionales && item.adicionales.length > 0) {
      item.adicionales.forEach(a => {
        precioUnitarioTotal += a.precio;
        textoAdicionales += `\n     + Extra: ${a.nombre} (+$${a.precio.toLocaleString("es-AR")})`;
      });
    }

    const cantidadItem = item.cantidad || 1;
    const subtotalItem = precioUnitarioTotal * cantidadItem;
    subtotalGeneral += subtotalItem;

    mensaje += `${i + 1}. *${cantidadItem}x ${item.nombre}* ($${subtotalItem.toLocaleString("es-AR")})\n   Detalle: ${item.detalle}${textoAdicionales}\n\n`;
    resumenHTML += `<li style="margin-bottom: 6px;"><b>${cantidadItem}x ${item.nombre}</b> - $${subtotalItem.toLocaleString("es-AR")} <br><small style="color: #6b7280;">${item.detalle}</small></li>`;
  });

  resumenHTML += `</ul>`;
  let totalFinal = subtotalGeneral;

  if (metodoPago === "Transferencia") {
    const recargo = Math.round(subtotalGeneral * 0.06);
    totalFinal = subtotalGeneral + recargo;
    mensaje += `*Subtotal:* $${subtotalGeneral.toLocaleString("es-AR")}\n`;
    mensaje += `*Recargo Transferencia (6%):* $${recargo.toLocaleString("es-AR")}\n`;
    resumenHTML += `<p style="color: #b45309; font-size: 0.9rem;"><b>Recargo Transferencia/MP (6%):</b> +$${recargo.toLocaleString("es-AR")}</p>`;
  }

  mensaje += `*TOTAL FINAL:* $${totalFinal.toLocaleString("es-AR")}\n\n`;
  resumenHTML += `
    <div style="background: #edf7f1; padding: 12px; border-radius: 8px; border: 1.5px solid #2b543b; margin-top: 10px;">
      <p style="margin: 0; font-size: 1.15rem; color: #162c1f; text-align: center;">
        <b>TOTAL FINAL: $${totalFinal.toLocaleString("es-AR")}</b>
      </p>
    </div>
  `;

  // Cálculo de vuelto si paga en Efectivo
  if (metodoPago === "Efectivo" && pagoCon > 0) {
    const vuelto = pagoCon - totalFinal;
    if (vuelto >= 0) {
      mensaje += `💵 *Paga con:* $${pagoCon.toLocaleString("es-AR")} (Vuelto: $${vuelto.toLocaleString("es-AR")})\n`;
      resumenHTML += `<p style="font-size: 0.88rem; margin-top: 8px; color: #374151;"><b>Abona con:</b> $${pagoCon.toLocaleString("es-AR")} &bull; <b>Vuelto estimado:</b> $${vuelto.toLocaleString("es-AR")}</p>`;
    }
  }

  mensaje += `👤 *DATOS DEL CLIENTE Y ENVÍO:*\n`;
  mensaje += `• *Nombre:* ${nombre}\n`;
  mensaje += `• *Dirección:* ${direccion}\n`;
  if (entrecalles) {
    mensaje += `• *Entre calles:* ${entrecalles}\n`;
  }
  if (observaciones) {
    mensaje += `• *Notas:* ${observaciones}\n`;
  }
  mensaje += `• *Método de pago:* ${metodoPago}\n`;

  if (metodoPago === "Transferencia") {
    mensaje += `\n💳 *DATOS DE TRANSFERENCIA:*\n`;
    mensaje += `• *Alias:* tango.ff\n`;
    mensaje += `• *Titular:* Thiago Sebastian Altamirano\n`;
    mensaje += `_(Pagar $${totalFinal.toLocaleString("es-AR")} al alias indicado con el 6% incluido y adjuntar comprobante a este chat.)_\n`;
  }

  mensaje += `\n¡Quedo a la espera de la confirmación!`;
  mensajeWhatsAppGenerado = mensaje;

  const modal = document.getElementById("modal-resumen");
  if (modal) {
    document.getElementById("contenido-modal").innerHTML = resumenHTML;
    modal.style.display = "flex";
  } else {
    confirmarYEnviarWhatsApp();
  }
}

// -------------------------------------------------------------
// CONTROLADORES DE MODALES Y WHATSAPP
// -------------------------------------------------------------
function cerrarModal() {
  const modal = document.getElementById("modal-resumen");
  if (modal) modal.style.display = "none";
}

function confirmarYEnviarWhatsApp() {
  cerrarModal();
  cerrarCarrito();
  guardarUltimoPedido(); // snapshot para "Repetir tu último pedido"
  const numeroTelefono = "5491125645240";
  const url = `https://api.whatsapp.com/send?phone=${numeroTelefono}&text=${encodeURIComponent(mensajeWhatsAppGenerado)}`;
  // Confeti de celebración (no bloqueante, el popup abre en el mismo gesto)
  lanzarConfeti();
  window.open(url, "_blank");
}

// -------------------------------------------------------------
// CONFETI SUTIL AL CONFIRMAR PEDIDO (canvas liviano, colores de marca)
// -------------------------------------------------------------
function lanzarConfeti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return; // respecto a usuarios con movimiento reducido
  }
  const canvas = document.getElementById("confeti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvas.style.display = "block";

  const colores = ["#ea580c", "#f59e0b", "#dc2626", "#25d366", "#ffffff"];
  const particulas = [];
  const total = 140;
  for (let i = 0; i < total; i++) {
    particulas.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.3,
      w: 6 + Math.random() * 5,
      h: 9 + Math.random() * 7,
      vy: 2.2 + Math.random() * 2.8,
      vx: -1.4 + Math.random() * 2.8,
      rot: Math.random() * Math.PI * 2,
      vr: -0.12 + Math.random() * 0.24,
      color: colores[Math.floor(Math.random() * colores.length)],
      delay: Math.random() * 24
    });
  }

  const duracionMs = 2200;
  const inicio = performance.now();

  function pintarFrame(ahora) {
    const t = ahora - inicio;
    const progreso = t / duracionMs;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const desvanecido = progreso > 0.7 ? 1 - (progreso - 0.7) / 0.3 : 1;

    particulas.forEach(p => {
      if (p.delay > 0) {
        p.delay--;
        return;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, desvanecido);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (progreso < 1) {
      requestAnimationFrame(pintarFrame);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      canvas.style.display = "none";
    }
  }

  requestAnimationFrame(pintarFrame);
}

function mostrarInfoTransferencia() {
  const metodoSelect = document.getElementById("metodo-pago");
  const infoDiv = document.getElementById("info-transferencia");
  const campoVuelto = document.getElementById("campo-vuelto");

  if (metodoSelect) {
    if (metodoSelect.value === "Transferencia") {
      if (infoDiv) infoDiv.style.display = "block";
      if (campoVuelto) campoVuelto.style.display = "none";
    } else {
      if (infoDiv) infoDiv.style.display = "none";
      if (campoVuelto) campoVuelto.style.display = "flex";
    }
  }
  actualizarCarrito();
}

function actualizarBotonMercadoPago(monto) {
  const btnMP = document.getElementById("btn-pago-mp");
  if (!btnMP) return;

  let totalCalculado = monto;
  if (totalCalculado === undefined) {
    const totalPrecio = document.getElementById("total-precio");
    totalCalculado = totalPrecio ? totalPrecio.textContent : "0";
  }

  btnMP.textContent = `Pagar $${totalCalculado.toLocaleString("es-AR")} por Mercado Pago 💙`;
  btnMP.href = "https://link.mercadopago.com.ar/tangofastfood";
}

// -------------------------------------------------------------
// DRAWER LATERAL DEL CARRITO (slide-over con backdrop)
// -------------------------------------------------------------
function abrirCarrito() {
  const drawer = document.getElementById("seccion-carrito");
  const backdrop = document.getElementById("drawer-backdrop");
  if (!drawer || !backdrop) return;

  document.body.style.overflow = "hidden"; // bloquea el scroll de fondo
  backdrop.classList.add("visible");
  drawer.classList.add("abierto");

  const btnCerrar = document.getElementById("btn-cerrar-carrito");
  if (btnCerrar) btnCerrar.focus();
}

function cerrarCarrito() {
  const drawer = document.getElementById("seccion-carrito");
  const backdrop = document.getElementById("drawer-backdrop");
  if (!drawer || !backdrop) return;

  backdrop.classList.remove("visible");
  drawer.classList.remove("abierto");
  document.body.style.overflow = "";
}

// Alias de compatibilidad (otros flujos ya lo llamaban)
function irAlCarrito() {
  abrirCarrito();
}

// -------------------------------------------------------------
// INICIALIZACIÓN
// -------------------------------------------------------------
window.onload = function() {
  verificarEstadoLocal();
  // Limpiar clase is-invalid al escribir
  const inputs = document.querySelectorAll(".input-control");
  inputs.forEach(input => {
    input.addEventListener("input", () => input.classList.remove("is-invalid"));
  });

  // Guardar datos del cliente mientras se escriben
  ["nombre", "direccion", "entrecalles"].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener("input", guardarDatosCliente);
  });

  // Vuelto en vivo
  const inputPagoCon = document.getElementById("pago-con");
  if (inputPagoCon) inputPagoCon.addEventListener("input", actualizarVueltoEnVivo);

  // Cerrar el drawer con tecla Esc
  window.addEventListener("keydown", ev => {
    if (ev.key === "Escape") cerrarCarrito();
  });

  // Restaurar carrito y datos guardados
  cargarEstadoGuardado();
  actualizarCarrito();
  actualizarUltimoPedidoUI();
};
