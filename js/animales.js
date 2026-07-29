// rancho/js/animales.js

// URL de tu Web App de Google Apps Script
const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbz_GxDuKOMVYSPM9FWPR__TwRyhgDb3_wBzqlrGt_XRbwvzsR53vK2lutwUUfyA9PivAA/exec';

document.addEventListener('DOMContentLoaded', () => {
    
    const fechaRegistroInput = document.getElementById('fecha-registro');
    const fechaNacimientoInput = document.getElementById('fecha-nacimiento');
    const edadMesesInput = document.getElementById('edad-meses');
    const form = document.getElementById('form-registro-animal');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const btnGuardar = document.querySelector('.btn-guardar');

    // 1. Asignar Fecha de Registro Actual automáticamente
    const hoy = new Date();
    const hoyFormateado = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    if (fechaRegistroInput) {
        fechaRegistroInput.value = hoyFormateado;
    }

    // 2. Calcular Edad en Meses automáticamente según la Fecha de Nacimiento
    if (fechaNacimientoInput) {
        fechaNacimientoInput.addEventListener('change', () => {
            const fechaNac = new Date(fechaNacimientoInput.value);
            const fechaActual = new Date();

            if (fechaNac > fechaActual) {
                alert("La fecha de nacimiento no puede ser futura.");
                fechaNacimientoInput.value = '';
                edadMesesInput.value = '';
                return;
            }

            // Cálculo de la diferencia en meses
            let añosDiferencia = fechaActual.getFullYear() - fechaNac.getFullYear();
            let mesesDiferencia = fechaActual.getMonth() - fechaNac.getMonth();
            
            let totalMeses = (añosDiferencia * 12) + mesesDiferencia;

            if (fechaActual.getDate() < fechaNac.getDate()) {
                totalMeses--;
            }

            totalMeses = totalMeses < 0 ? 0 : totalMeses;
            edadMesesInput.value = `${totalMeses} meses`;
        });
    }

    // 3. Botón Limpiar Formulario
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            form.reset();
            fechaRegistroInput.value = hoyFormateado;
            edadMesesInput.value = '';
        });
    }

    // 4. Envío de Datos REAL a Google Sheets
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Bloquear botón temporalmente para evitar doble clic
            btnGuardar.disabled = true;
            btnGuardar.textContent = "⏳ Guardando en Google Sheets...";

            const datosAnimal = {
                arete: document.getElementById('arete').value,
                nombre: document.getElementById('nombre').value,
                sexo: document.getElementById('sexo').value,
                raza: document.getElementById('raza').value,
                fechaNacimiento: fechaNacimientoInput.value,
                edadMeses: edadMesesInput.value,
                estadoSalud: document.getElementById('estado-salud').value,
                fechaRegistro: fechaRegistroInput.value,
                observaciones: document.getElementById('observaciones').value
            };

            try {
                // Envío de datos por POST usando no-cors para evitar bloqueos
                await fetch(URL_WEB_APP, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datosAnimal)
                });

                alert(`✅ ¡Animal "${datosAnimal.nombre}" (${datosAnimal.arete}) guardado exitosamente en Google Sheets!`);
                
                // Limpiar formulario tras guardar
                form.reset();
                fechaRegistroInput.value = hoyFormateado;
                edadMesesInput.value = '';

            } catch (error) {
                console.error("Error al guardar:", error);
                alert("❌ Hubo un error al intentar guardar los datos. Verifique su conexión.");
            } finally {
                btnGuardar.disabled = false;
                btnGuardar.textContent = "💾 Guardar Registro";
            }
        });
    }
});