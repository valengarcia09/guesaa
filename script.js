// ==========================================================================
// TANGO FAST FOOD - SCRIPT OFICIAL (INTERACCIONES & DESIGN CRAFT)
// ==========================================================================

let carrito = [];
let mensajeWhatsAppGenerado = "";
let adicionalPendiente = null;

// -------------------------------------------------------------
// SISTEMA DE TOASTS FLUIDOS (Inspirado en Sonner / Emil Kowalski)
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
// AGREGAR HAMBURGUESAS AL PEDIDO
// -------------------------------------------------------------
function agregarAlCarrito(boton, nombreHamburguesa) {
  const card = boton.closest(".product-card");
  const selectVariante = card.querySelector(".select-variante");
  const selectPan = card.querySelector(".select-pan");

  const precio = parseInt(selectVariante.value, 10);
  const tamaño = selectVariante.options[selectVariante.selectedIndex].getAttribute("data-nombre");
  const pan = selectPan.value;

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
  actualizarBotonMercadoPago(totalFinal);
}

// -------------------------------------------------------------
// FILTRAR CATEGORÍAS CON ANIMACIÓN SUAVE
// -------------------------------------------------------------
function filtrarCategoria(categoria, boton) {
  const botones = document.querySelectorAll(".btn-categoria");
  botones.forEach(b => b.classList.remove("active"));
  boton.classList.add("active");

  const productos = document.querySelectorAll(".product-card");
  productos.forEach(p => {
    if (categoria === "todas" || p.getAttribute("data-category") === categoria) {
      p.style.display = "flex";
      p.style.opacity = "1";
      p.style.transform = "scale(1)";
    } else {
      p.style.display = "none";
    }
  });
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
  const numeroTelefono = "5491125645240";
  const url = `https://api.whatsapp.com/send?phone=${numeroTelefono}&text=${encodeURIComponent(mensajeWhatsAppGenerado)}`;
  window.open(url, "_blank");
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

function irAlCarrito() {
  const seccion = document.getElementById("seccion-carrito");
  if (seccion) {
    seccion.scrollIntoView({ behavior: "smooth" });
  }
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
};
