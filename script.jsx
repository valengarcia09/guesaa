function filtrarCategoria(categoria, botonSeleccionado) {
    // 1. Quitar la clase 'active' de todos los botones
    const botones = document.querySelectorAll('.btn-categoria');
    botones.forEach(btn => btn.classList.remove('active'));

    // 2. Agregar la clase 'active' únicamente al botón presionado
    botonSeleccionado.classList.add('active');

    // 3. (Para más adelante): Aquí puedes filtrar las hamburguesas según la categoría elegida
    console.log("Categoría seleccionada:", categoria);
}