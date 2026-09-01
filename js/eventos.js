// Reemplaza esta URL con el Web App URL de tu Google Apps Script
const URL_SCRIPT = 'https://script.google.com/macros/s/AKfycbz_GxDuKOMVYSPM9FWPR__TwRyhgDb3_wBzqlrGt_XRbwvzsR53vK2lutwUUfyA9PivAA/exec';
let eventoEditandoId = null;
document.addEventListener("DOMContentLoaded", () => {
    // 1. Establecer fecha de hoy por defecto
    const inputFecha = document.getElementById("fecha");
    if (inputFecha) {
        inputFecha.value = new Date().toISOString().split("T")[0];
    }

    // 2. Cargar lista de eventos iniciales
    cargarEventos();

    // 3. Listener para el formulario de guardado
    const formEvento = document.getElementById("form-evento");
    if (formEvento) {
        formEvento.addEventListener("submit", guardarEvento);
    }
});

// --- Función para obtener y listar eventos ---
function cargarEventos() {
    const contenedor = document.getElementById("contenedor-eventos");
    contenedor.innerHTML = `<p style="text-align: center; color: #777; font-style: italic; grid-column: 1 / -1;">Cargando eventos registrados...</p>`;

    fetch(`${URL_SCRIPT}?accion=obtenerEventos`)
        .then(response => response.json())
        .then(data => {
            renderizarEventos(data);
        })
        .catch(error => {
            console.error("Error al cargar eventos:", error);
            contenedor.innerHTML = `<p style="text-align: center; color: #b91c1c; grid-column: 1 / -1;">Error al cargar los eventos. Intenta nuevamente.</p>`;
        });
}

// --- Función para pintar las tarjetas en pantalla ---
// Variable global para controlar si estamos editando


// --- Función para pintar las tarjetas en pantalla ---
function renderizarEventos(eventos) {
    const contenedor = document.getElementById("contenedor-eventos");
    contenedor.innerHTML = "";

    if (!eventos || eventos.length === 0) {
        contenedor.innerHTML = `<p style="text-align: center; color: #777; font-style: italic; grid-column: 1 / -1;">No hay tareas ni notas registradas aún.</p>`;
        return;
    }

    // Invertimos el arreglo para mostrar los más recientes primero
    eventos.reverse().forEach(evt => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-evento";

        // Determinar clase de badge según estado
        let badgeClass = "badge-pendiente";
        if (evt.estado === "En Proceso") badgeClass = "badge-proceso";
        if (evt.estado === "Completado") badgeClass = "badge-completado";

        // Guardamos los datos escapados en formato JSON dentro de un atributo HTML para poder editar
        const evtJson = JSON.stringify(evt).replace(/'/g, "&apos;").replace(/"/g, "&quot;");

        tarjeta.innerHTML = `
            <div>
                <div class="tarjeta-evento-titulo">${evt.titulo}</div>
                <div class="tarjeta-evento-fecha">📅 ${evt.fecha || 'Sin fecha'}</div>
                <div class="tarjeta-evento-detalles">${evt.detalles || 'Sin detalles adicionales.'}</div>
            </div>
            <div class="tarjeta-evento-footer">
                <span class="badge-evt ${badgeClass}">${evt.estado}</span>
                <div class="acciones-tarjeta" style="display: flex; gap: 8px;">
                    <button onclick='cargarEventoParaEditar(${evtJson})' style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" title="Editar evento">✏️</button>
                    <button onclick="eliminarEventoNota('${evt.id}')" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" title="Eliminar nota">🗑️</button>
                </div>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// --- Cargar datos en el formulario para editar ---
function cargarEventoParaEditar(evt) {
    eventoEditandoId = evt.id;
    
    document.getElementById("titulo").value = evt.titulo;
    document.getElementById("fecha").value = evt.fecha;
    document.getElementById("estado").value = evt.estado;
    document.getElementById("detalles").value = evt.detalles;

    const btnGuardar = document.getElementById("btn-guardar-evt");
    btnGuardar.textContent = "🔄 Actualizar Evento";
    
    // Desplazar suavemente la pantalla hacia el formulario
    document.querySelector(".tarjeta-formulario").scrollIntoView({ behavior: "smooth" });
}

// --- Ajuste en la función de guardar para soportar edición ---
function guardarEvento(e) {
    e.preventDefault();

    const btnGuardar = document.getElementById("btn-guardar-evt");
    btnGuardar.disabled = true;
    btnGuardar.textContent = "⏳ Guardando...";

    const datos = {
        id: eventoEditandoId, // Si es nulo crea nuevo, si trae ID actualiza
        titulo: document.getElementById("titulo").value,
        fecha: document.getElementById("fecha").value,
        estado: document.getElementById("estado").value,
        detalles: document.getElementById("detalles").value
    };

    fetch(URL_SCRIPT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    })
    .then(() => {
        alert(eventoEditandoId ? "¡Evento actualizado con éxito!" : "¡Evento guardado con éxito!");
        limpiarFormulario();
        setTimeout(cargarEventos, 1000);
    })
    .catch(error => {
        console.error("Error al guardar:", error);
        alert("Ocurrió un error al guardar.");
        btnGuardar.disabled = false;
        btnGuardar.textContent = eventoEditandoId ? "🔄 Actualizar Evento" : "💾 Guardar Evento";
    });
}

// --- Resetear formulario ---
function limpiarFormulario() {
    eventoEditandoId = null;
    document.getElementById("form-evento").reset();
    document.getElementById("fecha").value = new Date().toISOString().split("T")[0];
    
    const btnGuardar = document.getElementById("btn-guardar-evt");
    btnGuardar.disabled = false;
    btnGuardar.textContent = "💾 Guardar Evento";
}

// --- Función para eliminar evento ---
function eliminarEventoNota(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este evento?")) return;

    fetch(URL_SCRIPT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "eliminarEvento", id: id })
    })
    .then(() => {
        alert("Evento eliminado.");
        setTimeout(cargarEventos, 1000);
    })
    .catch(err => console.error("Error al eliminar:", err));
}