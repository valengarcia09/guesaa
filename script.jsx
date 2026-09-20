// Array para guardar el pedido actual
let carrito = [];

// Función para filtrar por categorías
function filtrarCategoria(categoria, botonSeleccionado) {
  // 1. Quitar 'active' de todos los botones
  const botones = document.querySelectorAll('.btn-categoria');
  botones.forEach(btn => btn.classList.remove('active'));

  // 2. Agregar 'active' al botón presionado
  botonSeleccionado.classList.add('active');

  // 3. Filtrar tarjetas
  const tarjetas = document.querySelectorAll('.product-card');
  tarjetas.forEach(tarjeta => {
    if (categoria === 'todas') {
      tarjeta.style.display = 'flex';
    } else {
      if (tarjeta.getAttribute('data-category') === categoria) {
        tarjeta.style.display = 'flex';
      } else {
        tarjeta.style.display = 'none';
      }
    }
  });
}

// Agregar hamburguesas con opciones
function agregarAlCarrito(boton, nombreBase) {
  const tarjeta = boton.closest('.product-card');
  const selectVariante = tarjeta.querySelector('.select-variante');
  const selectPan = tarjeta.querySelector('.select-pan');

  const precio = parseInt(selectVariante.value);
  const tamaño = selectVariante.options[selectVariante.selectedIndex].getAttribute('data-nombre');
  const pan = selectPan.value;

  const item = {
    nombre: `${nombreBase} (${tamaño})`,
    detalle: pan,
    precio: precio
  };

  carrito.push(item);
  actualizarCarritoUI();
}

// Agregar ítems simples (Guarniciones y Adicionales)
function agregarDirecto(nombre, precio) {
  const item = {
    nombre: nombre,
    detalle: 'Estándar',
    precio: precio
  };

  carrito.push(item);
  actualizarCarritoUI();
}

// Renderizar lista en el HTML
function actualizarCarritoUI() {
  const contenedor = document.getElementById('lista-carrito');
  const totalElem = document.getElementById('total-precio');

  if (carrito.length === 0) {
    contenedor.innerHTML = '<p style="text-align: center; color: #777;">No has agregado ningún producto aún.</p>';
    totalElem.innerText = '0';
    return;
  }

  contenedor.innerHTML = '';
  let total = 0;

  carrito.forEach((item, index) => {
    total += item.precio;
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-carrito';
    itemDiv.innerHTML = `
      <div class="item-info">
        <span class="item-nombre">${item.nombre}</span>
        <span class="item-sub">${item.detalle} - $${item.precio.toLocaleString('es-AR')}</span>
      </div>
      <button class="item-eliminar" onclick="eliminarDelCarrito(${index})">✕</button>
    `;
    contenedor.appendChild(itemDiv);
  });

  totalElem.innerText = total.toLocaleString('es-AR');
}

// Eliminar un ítem
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarritoUI();
}

// Enviar pedido armado por WhatsApp
function enviarWhatsApp() {
  if (carrito.length === 0) {
    alert('Tu pedido está vacío. Agrega algún producto primero.');
    return;
  }


  const numeroTelefono = "+54 9 11 2564-5240"; 

  let mensaje = "¡Hola Tango Fast Food! Quiero hacer este pedido:\n\n";
  let total = 0;

  carrito.forEach((item, i) => {
    mensaje += `${i + 1}. *${item.nombre}*\n   Detalle: ${item.detalle}\n   Precio: $${item.precio}\n\n`;
    total += item.precio;
  });

  mensaje += `*TOTAL: $${total}*\n\n¡Quedo a la espera del envío/confirmación!`;

  const url = `https://api.whatsapp.com/send?phone=${numeroTelefono}&text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}