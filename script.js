// Arreglo para almacenar los productos agregados al pedido
let carrito = [];
let mensajeWhatsAppGenerado = "";

// Función para mostrar alerta personalizada de producto agregado
function mostrarAlertaAgregado(nombreProducto) {
  alert(`¡${nombreProducto} agregado al pedido con éxito! 🛒`);
}

// -------------------------------------------------------------
// NUEVA FUNCIÓN: VERIFICAR ESTADO DEL LOCAL (Vie a Dom 19hs a 00hs)
// -------------------------------------------------------------
function verificarEstadoLocal() {
  const contenedor = document.getElementById("estado-local");
  if (!contenedor) return;

  const ahora = new Date();
  const dia = ahora.getDay(); // 0: Domingo, 5: Viernes, 6: Sábado
  const hora = ahora.getHours();

  // Viernes(5), Sábado(6) y Domingo(0) de 19:00 a 23:59hs
  const esDiaPermitido = (dia === 5 || dia === 6 || dia === 0);
  const esHoraPermitida = (hora >= 19 && hora < 24);

  if (esDiaPermitido && esHoraPermitida) {
    contenedor.innerHTML = "🟢 <b>LOCAL ABIERTO</b> (Horario: Vie a Dom 19:00 a 00:00 hs)";
    contenedor.style.background = "#d4edda";
    contenedor.style.color = "#155724";
    contenedor.style.border = "1px solid #c3e6cb";
  } else {
    contenedor.innerHTML = "🔴 <b>LOCAL CERRADO</b> (Horario: Vie a Dom 19:00 a 00:00 hs)";
    contenedor.style.background = "#f8d7da";
    contenedor.style.color = "#721c24";
    contenedor.style.border = "1px solid #f5c6cb";
  }
}

// 1. AGREGAR HAMBURGUESAS AL CARRITO
function agregarAlCarrito(boton, nombreHamburguesa) {
  // Obtener la tarjeta del producto
  const card = boton.closest('.product-card');
  
  // Obtener tamaño/precio y tipo de pan
  const selectVariante = card.querySelector('.select-variante');
  const selectPan = card.querySelector('.select-pan');
  
  const precio = parseInt(selectVariante.value);
  const tamaño = selectVariante.options[selectVariante.selectedIndex].getAttribute('data-nombre');
  const pan = selectPan.value;
  
  // Construir el objeto hamburguesa
  const producto = {
    id: Date.now(), // ID único para identificar cada hamburguesa
    tipo: 'burgers',
    nombre: nombreHamburguesa,
    detalle: `${tamaño} | ${pan}`,
    precio: precio,
    cantidad: 1,
    adicionales: []
  };

  carrito.push(producto);
  mostrarAlertaAgregado(`${nombreHamburguesa} (${tamaño})`);
  actualizarCarrito();
}

// 2. AGREGAR GUARNICIONES (Papas, etc.)
function agregarDirecto(nombreProducto, precio) {
  const producto = {
    id: Date.now(),
    tipo: 'guarniciones',
    nombre: nombreProducto,
    detalle: 'Guarnición individual',
    precio: parseInt(precio),
    cantidad: 1,
    adicionales: []
  };

  carrito.push(producto);
  mostrarAlertaAgregado(nombreProducto);
  actualizarCarrito();
}

// 3. AGREGAR ADICIONALES (Con validación y selección de hamburguesa)
function agregarAdicional(nombreAdicional, precioAdicional) {
  // Filtrar todas las hamburguesas en el carrito
  const hamburguesasEnCarrito = carrito.filter(p => p.tipo === 'burgers');

  // Regla 1: Si no hay hamburguesas, mostrar error
  if (hamburguesasEnCarrito.length === 0) {
    alert("Elija una hamburguesa a la cual agregar el adicional.");
    return;
  }

  let hamburguesaDestino = null;

  // Regla 2: Si hay solo una hamburguesa, se le asigna directamente
  if (hamburguesasEnCarrito.length === 1) {
    hamburguesaDestino = hamburguesasEnCarrito[0];
  } else {
    // Regla 3: Si hay varias, preguntar a cuál agregarle el adicional
    let opciones = "Tienes varias hamburguesas en tu pedido. ¿A cuál le agregamos este adicional?\n\n";
    hamburguesasEnCarrito.forEach((h, index) => {
      opciones += `${index + 1}. ${h.nombre} (${h.detalle})\n`;
    });

    const respuesta = prompt(opciones + "\nEscribe el número correspondiente:");
    const indiceElegido = parseInt(respuesta) - 1;

    if (!isNaN(indiceElegido) && hamburguesasEnCarrito[indiceElegido]) {
      hamburguesaDestino = hamburguesasEnCarrito[indiceElegido];
    } else {
      alert("Selección no válida. El adicional no fue agregado.");
      return;
    }
  }

  // Sumar adicional a la hamburguesa elegida
  hamburguesaDestino.adicionales.push({
    nombre: nombreAdicional,
    precio: parseInt(precioAdicional)
  });

  mostrarAlertaAgregado(`${nombreAdicional} para ${hamburguesaDestino.nombre}`);
  actualizarCarrito();
}

// NUEVA FUNCIÓN: CAMBIAR CANTIDAD (+ / -)
function cambiarCantidad(index, cambio) {
  if (carrito[index]) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) {
      carrito.splice(index, 1);
    }
    actualizarCarrito();
  }
}

// 4. ELIMINAR UN ELEMENTO DEL CARRITO
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

// 5. ACTUALIZAR LA VISTA DEL CARRITO, BOTÓN FLOTANTE Y EL TOTAL
function actualizarCarrito() {
  const listaCarrito = document.getElementById("lista-carrito");
  const totalPrecio = document.getElementById("total-precio");
  const metodoPagoSelect = document.getElementById("metodo-pago");
  const badgeContador = document.getElementById("badge-contador");

  if (!listaCarrito || !totalPrecio) return;

  // Actualizar burbuja flotante de cantidad
  let totalItems = 0;
  carrito.forEach(item => totalItems += (item.cantidad || 1));
  if (badgeContador) badgeContador.textContent = totalItems;

  if (carrito.length === 0) {
    listaCarrito.innerHTML = `<p style="text-align: center; color: #777;">No has agregado ningún producto aún.</p>`;
    totalPrecio.textContent = "0";
    actualizarBotonMercadoPago(0);
    return;
  }

  let html = "";
  let subtotalGeneral = 0;

  carrito.forEach((item, index) => {
    let precioUnitarioTotal = item.precio;
    let detallesAdicionales = "";

    if (item.adicionales && item.adicionales.length > 0) {
      item.adicionales.forEach(a => {
        precioUnitarioTotal += a.precio;
        detallesAdicionales += `<br> ➕ <i>${a.nombre} (+$${a.precio})</i>`;
      });
    }

    let cantidadItem = item.cantidad || 1;
    let subtotalItem = precioUnitarioTotal * cantidadItem;
    subtotalGeneral += subtotalItem;

    html += `
      <div style="border-bottom: 1px solid #ddd; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${item.nombre}</strong> - $${subtotalItem}<br>
          <small style="color: #555;">${item.detalle}${detallesAdicionales}</small>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button onclick="cambiarCantidad(${index}, -1)" style="background: #e0e0e0; border: none; padding: 4px 10px; border-radius: 4px; font-weight: bold; cursor: pointer;">-</button>
          <span><b>${cantidadItem}</b></span>
          <button onclick="cambiarCantidad(${index}, 1)" style="background: #e0e0e0; border: none; padding: 4px 10px; border-radius: 4px; font-weight: bold; cursor: pointer;">+</button>
          <button onclick="eliminarDelCarrito(${index})" style="background: #ff4d4d; color: white; border: none; padding: 5px 8px; border-radius: 5px; cursor: pointer; margin-left: 5px;">❌</button>
        </div>
      </div>
    `;
  });

  let totalFinal = subtotalGeneral;
  const esTransferencia = metodoPagoSelect && metodoPagoSelect.value === "Transferencia";

  // Aplicar recargo del 6% si selecciona Transferencia
  if (esTransferencia) {
    const recargo = Math.round(subtotalGeneral * 0.06);
    totalFinal = subtotalGeneral + recargo;
    html += `
      <div style="padding: 10px 0; color: #856404; font-weight: bold; border-top: 1px dashed #ccc;">
        ➕ Recargo por Transferencia/MP (6%): +$${recargo.toLocaleString()}
      </div>
    `;
  }

  listaCarrito.innerHTML = html;
  totalPrecio.textContent = totalFinal.toLocaleString();

  actualizarBotonMercadoPago(totalFinal);
}

// 6. FILTRAR CATEGORÍAS DE MENÚ
function filtrarCategoria(categoria, boton) {
  const botones = document.querySelectorAll('.btn-categoria');
  botones.forEach(b => b.classList.remove('active'));
  boton.classList.add('active');
  const productos = document.querySelectorAll('.product-card');
  productos.forEach(p => {
    if (categoria === 'todas' || p.getAttribute('data-category') === categoria) {
      p.style.display = 'block';
    } else {
      p.style.display = 'none';
    }
  });
}

// 7. PREPARAR Y DESPLEGAR MODAL DE RESUMEN
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

  // Validación visual en bordes rojos
  if (!nombre) {
    if (inputNombre) inputNombre.style.border = "2px solid red";
    esValido = false;
  } else if (inputNombre) {
    inputNombre.style.border = "1px solid #ccc";
  }

  if (!direccion) {
    if (inputDireccion) inputDireccion.style.border = "2px solid red";
    esValido = false;
  } else if (inputDireccion) {
    inputDireccion.style.border = "1px solid #ccc";
  }

  if (!esValido) {
    alert("Por favor, completa los campos marcados en rojo.");
    return;
  }

  if (carrito.length === 0) {
    alert("Tu pedido está vacío. Agrega algún producto primero.");
    return;
  }

  let subtotalGeneral = 0;
  let resumenHTML = `<p><b>Cliente:</b> ${nombre}</p><p><b>Dirección:</b> ${direccion} ${entrecalles ? '(' + entrecalles + ')' : ''}</p><hr><p><b>Detalle:</b></p><ul>`;
  let mensaje = `¡Hola Tango Fast Food! Soy *${nombre}* y quiero hacer este pedido:\n\n`;

  carrito.forEach((item, i) => {
    let precioUnitarioTotal = item.precio;
    let textoAdicionales = "";

    if (item.adicionales && item.adicionales.length > 0) {
      item.adicionales.forEach(a => {
        precioUnitarioTotal += a.precio;
        textoAdicionales += `\n     + Extra: ${a.nombre} (+$${a.precio})`;
      });
    }

    let cantidadItem = item.cantidad || 1;
    let subtotalItem = precioUnitarioTotal * cantidadItem;
    subtotalGeneral += subtotalItem;

    mensaje += `${i + 1}. *${cantidadItem}x ${item.nombre}* ($${subtotalItem})\n   Detalle: ${item.detalle}${textoAdicionales}\n\n`;
    resumenHTML += `<li>${cantidadItem}x ${item.nombre} - $${subtotalItem}</li>`;
  });

  resumenHTML += `</ul>`;
  let totalFinal = subtotalGeneral;

  if (metodoPago === "Transferencia") {
    const recargo = Math.round(subtotalGeneral * 0.06);
    totalFinal = subtotalGeneral + recargo;
    mensaje += `*Subtotal:* $${subtotalGeneral}\n`;
    mensaje += `*Recargo Transferencia (6%):* $${recargo}\n`;
    resumenHTML += `<p><b>Recargo Transferencia (6%):</b> +$${recargo}</p>`;
  }

  mensaje += `*TOTAL FINAL:* $${totalFinal}\n\n`;
  resumenHTML += `<p style="font-size: 16px; color: #111;"><b>TOTAL FINAL: $${totalFinal}</b></p>`;

  // Cálculo del vuelto si paga en Efectivo
  if (metodoPago === "Efectivo" && pagoCon > 0) {
    const vuelto = pagoCon - totalFinal;
    if (vuelto >= 0) {
      mensaje += `💵 *Paga con:* $${pagoCon} (Vuelto: $${vuelto})\n`;
      resumenHTML += `<p><b>Paga con:</b> $${pagoCon} | <b>Vuelto:</b> $${vuelto}</p>`;
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
    resumenHTML += `<p><b>Notas:</b> ${observaciones}</p>`;
  }
  mensaje += `• *Método de pago:* ${metodoPago}\n`;

  if (metodoPago === "Transferencia") {
    mensaje += `\n💳 *DATOS DE TRANSFERENCIA:*\n`;
    mensaje += `• *Alias:* tango.ff\n`;
    mensaje += `• *Titular:* Thiago sebastian altamirano\n`;
    mensaje += `_(Pagar $${totalFinal} al alias indicado con el 6% incluido y adjuntar el comprobante de pago a este chat.)_\n`;
  }

  mensaje += `\n¡Quedo a la espera del envío/confirmación!`;

  mensajeWhatsAppGenerado = mensaje;

  // Si existe el modal de confirmación en el HTML, lo muestra. Si no, envía directo.
  const modal = document.getElementById("modal-resumen");
  if (modal) {
    document.getElementById("contenido-modal").innerHTML = resumenHTML;
    modal.style.display = "flex";
  } else {
    confirmarYEnviarWhatsApp();
  }
}

// FUNCIONES DEL MODAL
function cerrarModal() {
  const modal = document.getElementById("modal-resumen");
  if (modal) modal.style.display = "none";
}

function confirmarYEnviarWhatsApp() {
  cerrarModal();
  const numeroTelefono = "+5491125645240";
  const url = `https://api.whatsapp.com/send?phone=${+5491125645240}&text=${encodeURIComponent(mensajeWhatsAppGenerado)}`;
  window.open(url, '_blank');
}

// MOSTRAR / OCULTAR INFORMACIÓN Y CONTROLAR CAMPO DE VUELTO
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
      if (campoVuelto) campoVuelto.style.display = "block";
    }
  }
  actualizarCarrito();
}

// ACTUALIZAR BOTÓN DE MERCADO PAGO CON MONTO FINAL (ÚNICA FUNCIÓN DEFINITIVA)
function actualizarBotonMercadoPago(monto) {
  const btnMP = document.getElementById("btn-pago-mp");
  if (!btnMP) return;

  let totalCalculado = monto;

  if (totalCalculado === undefined) {
    const totalPrecio = document.getElementById("total-precio");
    totalCalculado = totalPrecio ? totalPrecio.textContent : "0";
  }

  btnMP.textContent = `Pagar $${totalCalculado.toLocaleString()} por Mercado Pago 💙`;
  btnMP.href = `https://link.mercadopago.com.ar/tangofastfood`;
}

// VERIFICAR HORARIO DEL LOCAL AL CARGAR LA PÁGINA
window.onload = function() {
  verificarEstadoLocal();
};