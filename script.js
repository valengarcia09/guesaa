// Arreglo para almacenar los productos agregados al pedido
let carrito = [];

// Función para mostrar alerta personalizada de producto agregado
function mostrarAlertaAgregado(nombreProducto) {
  alert(`¡${nombreProducto} agregado al pedido con éxito! 🛒`);
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
    precio: precio
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
    precio: precioAdicional
  });

  mostrarAlertaAgregado(`${nombreAdicional} para ${hamburguesaDestino.nombre}`);
  actualizarCarrito();
}

// 4. ELIMINAR UN ELEMENTO DEL CARRITO
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

// 5. ACTUALIZAR LA VISTA DEL CARRITO Y EL TOTAL
function actualizarCarrito() {
  const listaCarrito = document.getElementById("lista-carrito");
  const totalPrecio = document.getElementById("total-precio");

  if (!listaCarrito || !totalPrecio) return;

  if (carrito.length === 0) {
    listaCarrito.innerHTML = `<p style="text-align: center; color: #777;">No has agregado ningún producto aún.</p>`;
    totalPrecio.textContent = "0";
    return;
  }

  let html = "";
  let totalGeneral = 0;

  carrito.forEach((item, index) => {
    let subtotalItem = item.precio;
    let detallesAdicionales = "";

    if (item.adicionales && item.adicionales.length > 0) {
      item.adicionales.forEach(a => {
        subtotalItem += a.precio;
        detallesAdicionales += `<br> ➕ <i>${a.nombre} (+$${a.precio})</i>`;
      });
    }

    totalGeneral += subtotalItem;

    html += `
      <div style="border-bottom: 1px solid #ddd; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${item.nombre}</strong> - $${subtotalItem}<br>
          <small style="color: #555;">${item.detalle}${detallesAdicionales}</small>
        </div>
        <button onclick="eliminarDelCarrito(${index})" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">❌</button>
      </div>
    `;
  });

  listaCarrito.innerHTML = html;
  totalPrecio.textContent = totalGeneral.toLocaleString();
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

// Función para mostrar u ocultar la info de transferencia dinámicamente
function mostrarInfoTransferencia() {
  const metodoSelect = document.getElementById("metodo-pago");
  const infoDiv = document.getElementById("info-transferencia");
  
  if (metodoSelect && infoDiv) {
    if (metodoSelect.value === "Transferencia") {
      infoDiv.style.display = "block";
    } else {
      infoDiv.style.display = "none";
    }
  }
}

// Reemplazar la función enviarWhatsApp con el detalle de Método de Pago
function enviarWhatsApp() {
  const nombre = document.getElementById("nombre") ? document.getElementById("nombre").value.trim() : "";
  const direccion = document.getElementById("direccion") ? document.getElementById("direccion").value.trim() : "";
  const entrecalles = document.getElementById("entrecalles") ? document.getElementById("entrecalles").value.trim() : "";
  const metodoPago = document.getElementById("metodo-pago") ? document.getElementById("metodo-pago").value : "Efectivo";

  if (!nombre) {
    alert("Por favor, ingresa tu nombre antes de enviar el pedido.");
    return;
  }

  if (!direccion) {
    alert("Por favor, ingresa tu dirección antes de enviar el pedido.");
    return;
  }

  if (carrito.length === 0) {
    alert("Tu pedido está vacío. Agrega algún producto primero.");
    return;
  }

  const numeroTelefono = "+5491125645240";
  let mensaje = `¡Hola Tango Fast Food! Soy *${nombre}* y quiero hacer este pedido:\n\n`;
  let totalGeneral = 0;

  carrito.forEach((item, i) => {
    let subtotalItem = item.precio;
    let textoAdicionales = "";

    if (item.adicionales && item.adicionales.length > 0) {
      item.adicionales.forEach(a => {
        subtotalItem += a.precio;
        textoAdicionales += `\n     + Extra: ${a.nombre} (+$${a.precio})`;
      });
    }

    totalGeneral += subtotalItem;
    mensaje += `${i + 1}. *${item.nombre}* ($${subtotalItem})\n   Detalle: ${item.detalle}${textoAdicionales}\n\n`;
  });

  mensaje += `*TOTAL:* $${totalGeneral}\n\n`;
  mensaje += `👤 *DATOS DEL CLIENTE Y ENVÍO:*\n`;
  mensaje += `• *Nombre:* ${nombre}\n`;
  mensaje += `• *Dirección:* ${direccion}\n`;
  if (entrecalles) {
    mensaje += `• *Entre calles:* ${entrecalles}\n`;
  }
  mensaje += `• *Método de pago:* ${metodoPago}\n`;

  if (metodoPago === "Transferencia") {
    mensaje += `\n💳 *DATOS DE TRANSFERENCIA:*\n`;
    mensaje += `• *Alias:* tango.ff\n`;
    mensaje += `• *Titular:* thiago sebastian altamirano\n`;
    mensaje += `• *Billeteras/Bancos:* Mercado Pago, Naranja X, Cuenta DNI, BNA+, Ualá, etc.\n`;
    mensaje += `_(Cuando realices el pedido por WhatsApp, pagar al alias indicado y enviar el comprobante de pago a este mismo chat.)_\n`;
  }

  mensaje += `\n¡Quedo a la espera del envío/confirmación!`;

  const url = `https://api.whatsapp.com/send?phone=${+5491125645240}&text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}