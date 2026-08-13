// rancho/js/reportes.js

// URL de tu Web App de Google Apps Script
const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbz_GxDuKOMVYSPM9FWPR__TwRyhgDb3_wBzqlrGt_XRbwvzsR53vK2lutwUUfyA9PivAA/exec';

let listaAnimalesBase = []; // Almacenará los datos de Google Sheets
let listaFiltrada = [];     // Mantendrá los datos filtrados por el buscador

document.addEventListener('DOMContentLoaded', () => {
    
    const tablaCuerpo = document.getElementById('tabla-cuerpo');
    const inputBusqueda = document.getElementById('input-busqueda');
    const mensajeSinResultados = document.getElementById('mensaje-sin-resultados');
    
    const elemTotal = document.getElementById('total-animales');
    const elemHembras = document.getElementById('total-hembras');
    const elemMachos = document.getElementById('total-machos');

    const btnExcel = document.getElementById('btn-exportar-excel');
    const btnPDF = document.getElementById('btn-exportar-pdf');

    // 1. Cargar Datos desde Google Sheets
    async function cargarDatosGoogleSheets() {
        if (!tablaCuerpo) return;
        tablaCuerpo.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:20px;">⏳ Cargando datos desde Google Sheets...</td></tr>`;

        try {
            const respuesta = await fetch(URL_WEB_APP, {
                method: 'GET',
                redirect: 'follow'
            });
            
            const datos = await respuesta.json();
            
            listaAnimalesBase = datos;
            listaFiltrada = [...datos];
            renderizarTabla(listaFiltrada);

        } catch (error) {
            console.error("Error cargando los datos:", error);
            tablaCuerpo.innerHTML = `<tr><td colspan="11" style="text-align:center; color:red; padding:20px;">❌ Error al obtener los datos de la base de datos.</td></tr>`;
        }
    }

    // 2. Renderizar la Tabla
    function renderizarTabla(lista) {
        if (!tablaCuerpo) return;
        tablaCuerpo.innerHTML = '';

        if (lista.length === 0) {
            if (mensajeSinResultados) mensajeSinResultados.style.display = 'block';
            actualizarMetricas([]);
            return;
        }

        if (mensajeSinResultados) mensajeSinResultados.style.display = 'none';

        lista.forEach(animal => {
            const tr = document.createElement('tr');
            
            let claseSalud = 'salud-bueno';
            if (animal.estadoSalud === 'Excelente') claseSalud = 'salud-excelente';
            if (animal.estadoSalud === 'Regular') claseSalud = 'salud-regular';
            if (animal.estadoSalud === 'En Tratamiento') claseSalud = 'salud-tratamiento';
            if (animal.estadoSalud === 'Crítico') claseSalud = 'salud-critico';

            let fechaRegLimpia = animal.fechaRegistro;
            if (typeof fechaRegLimpia === 'string' && fechaRegLimpia.includes('T')) {
                fechaRegLimpia = fechaRegLimpia.split('T')[0];
            }

            // Validar padre y madre para que muestren '-' si están vacíos
            const padre = animal.padre && animal.padre.toString().trim() !== '' ? animal.padre : '-';
            const madre = animal.madre && animal.madre.toString().trim() !== '' ? animal.madre : '-';

            tr.innerHTML = `
                <td><strong>${animal.arete || '-'}</strong></td>
                <td>${animal.nombre || '-'}</td>
                <td>${animal.sexo === 'Hembra' ? '♀️ Hembra' : '♂️ Macho'}</td>
                <td>${animal.raza || '-'}</td>
                <td>${animal.edadMeses ? animal.edadMeses + ' meses' : '-'}</td>
                <td>${padre}</td>
                <td>${madre}</td>
                <td><span class="badge-salud ${claseSalud}">${animal.estadoSalud || 'Bueno'}</span></td>
                <td>${fechaRegLimpia || '-'}</td>
                <td>${animal.observaciones || '-'}</td>
                <td style="text-align: center;">
                    <button class="btn-eliminar" data-arete="${animal.arete}" data-nombre="${animal.nombre}" style="background-color: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; transition: background 0.2s;">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
            tablaCuerpo.appendChild(tr);
        });

        // Event listener para los botones de eliminar
        document.querySelectorAll('.btn-eliminar').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const arete = e.target.getAttribute('data-arete');
                const nombre = e.target.getAttribute('data-nombre');
                eliminarAnimal(arete, nombre);
            });
        });

        actualizarMetricas(lista);
    }

    // 3. Función para Eliminar Animal
    async function eliminarAnimal(arete, nombre) {
        const confirmacion = confirm(`¿Estás seguro de que deseas eliminar al animal "${nombre}" con Arete: ${arete}? Esta acción lo borrará también de la base de datos.`);
        
        if (!confirmacion) return;

        try {
            tablaCuerpo.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:20px;">⏳ Eliminando registro de Google Sheets...</td></tr>`;

            await fetch(URL_WEB_APP, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: "eliminar", arete: arete })
            });

            alert(`✅ El animal con Arete ${arete} fue eliminado correctamente.`);
            cargarDatosGoogleSheets();

        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("❌ Hubo un error al intentar eliminar el registro.");
            cargarDatosGoogleSheets();
        }
    }

    // 4. Actualizar Contadores Superiores
    function actualizarMetricas(lista) {
        if (elemTotal) elemTotal.textContent = lista.length;
        if (elemHembras) elemHembras.textContent = lista.filter(a => a.sexo === 'Hembra').length;
        if (elemMachos) elemMachos.textContent = lista.filter(a => a.sexo === 'Macho').length;
    }

    // 5. Buscador en Tiempo Real por Arete o Nombre
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            const texto = e.target.value.toLowerCase().trim();
            listaFiltrada = listaAnimalesBase.filter(animal => {
                const areteTexto = String(animal.arete || '').toLowerCase();
                const nombreTexto = String(animal.nombre || '').toLowerCase();
                return areteTexto.includes(texto) || nombreTexto.includes(texto);
            });
            renderizarTabla(listaFiltrada);
        });
    }

    // 6. EXPORTAR A EXCEL
    if (btnExcel) {
        btnExcel.addEventListener('click', () => {
            if (listaFiltrada.length === 0) {
                alert("No hay registros disponibles para exportar.");
                return;
            }

            const datosExcel = listaFiltrada.map(a => ({
                "ARETE / REGISTRO": a.arete || '-',
                "NOMBRE": a.nombre || '-',
                "SEXO": a.sexo || '-',
                "RAZA": a.raza || '-',
                "FECHA NACIMIENTO": a.fechaNacimiento || '-',
                "EDAD": a.edadMeses || '-',
                "PADRE": a.padre || '-',
                "MADRE": a.madre || '-',
                "ESTADO DE SALUD": a.estadoSalud || '-',
                "FECHA REGISTRO": a.fechaRegistro || '-',
                "OBSERVACIONES": a.observaciones || '-'
            }));

            const hoja = XLSX.utils.json_to_sheet(datosExcel);
            const libro = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(libro, hoja, "Ganado");

            const fechaHoy = new Date().toISOString().split('T')[0];
            XLSX.writeFile(libro, `Reporte_Ganado_Rancho_Alejandro_${fechaHoy}.xlsx`);
        });
    }

    // 7. EXPORTAR A PDF CON MEMBRETE Y LOGO
    if (btnPDF) {
        btnPDF.addEventListener('click', () => {
            if (listaFiltrada.length === 0) {
                alert("No hay registros disponibles para exportar a PDF.");
                return;
            }

            const fechaHoy = new Date().toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            const contenedorPDF = document.createElement('div');
            contenedorPDF.style.padding = '20px';
            contenedorPDF.style.fontFamily = 'Arial, sans-serif';
            contenedorPDF.style.color = '#1f2937';

            contenedorPDF.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2a4d33; padding-bottom: 15px; margin-bottom: 20px;">
                    <div>
                        <h1 style="margin: 0; color: #2a4d33; font-size: 22px; text-transform: uppercase;">Rancho Alejandro</h1>
                        <p style="margin: 3px 0 0 0; font-size: 13px; color: #4b5563;">Sistema de Control e Inventario Ganadero</p>
                        <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b7280;">Fecha de emisión: ${fechaHoy}</p>
                    </div>
                    <div>
                        <img src="assets/banner_sidebar.jpg" style="height: 70px; border-radius: 6px; object-fit: contain;" onerror="this.style.display='none'">
                    </div>
                </div>

                <div style="margin-bottom: 15px; background-color: #f3f4f6; padding: 10px 15px; border-radius: 6px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; color: #2a4d33;">
                    <span>TOTAL REGISTROS EN REPORTE: ${listaFiltrada.length}</span>
                    <span>HEMBRAS: ${listaFiltrada.filter(a => a.sexo === 'Hembra').length} | MACHOS: ${listaFiltrada.filter(a => a.sexo === 'Macho').length}</span>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
                    <thead>
                        <tr style="background-color: #2a4d33; color: white;">
                            <th style="padding: 8px; border: 1px solid #1e3825;">Arete/Reg.</th>
                            <th style="padding: 8px; border: 1px solid #1e3825;">Nombre</th>
                            <th style="padding: 8px; border: 1px solid #1e3825;">Sexo</th>
                            <th style="padding: 8px; border: 1px solid #1e3825;">Raza</th>
                            <th style="padding: 8px; border: 1px solid #1e3825;">Edad</th>
                            <th style="padding: 8px; border: 1px solid #1e3825;">Padre</th>
                            <th style="padding: 8px; border: 1px solid #1e3825;">Madre</th>
                            <th style="padding: 8px; border: 1px solid #1e3825;">Salud</th>
                            <th style="padding: 8px; border: 1px solid #1e3825;">F. Registro</th>
                            <th style="padding: 8px; border: 1px solid #1e3825;">Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listaFiltrada.map((a, i) => `
                            <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                                <td style="padding: 7px; border: 1px solid #e5e7eb; font-weight: bold;">${a.arete || '-'}</td>
                                <td style="padding: 7px; border: 1px solid #e5e7eb;">${a.nombre || '-'}</td>
                                <td style="padding: 7px; border: 1px solid #e5e7eb;">${a.sexo || '-'}</td>
                                <td style="padding: 7px; border: 1px solid #e5e7eb;">${a.raza || '-'}</td>
                                <td style="padding: 7px; border: 1px solid #e5e7eb;">${a.edadMeses || '-'}</td>
                                <td style="padding: 7px; border: 1px solid #e5e7eb;">${a.padre || '-'}</td>
                                <td style="padding: 7px; border: 1px solid #e5e7eb;">${a.madre || '-'}</td>
                                <td style="padding: 7px; border: 1px solid #e5e7eb;">${a.estadoSalud || '-'}</td>
                                <td style="padding: 7px; border: 1px solid #e5e7eb;">${a.fechaRegistro || '-'}</td>
                                <td style="padding: 7px; border: 1px solid #e5e7eb;">${a.observaciones || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 9px; text-align: center; color: #9ca3af;">
                    Documento generado automáticamente por el Sistema Rancho Alejandro.
                </div>
            `;

            const opciones = {
                margin:       10,
                filename:     `Reporte_Rancho_Alejandro_${new Date().toISOString().split('T')[0]}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            btnPDF.disabled = true;
            btnPDF.textContent = "⏳ Generando PDF...";

            html2pdf().set(opciones).from(contenedorPDF).save().then(() => {
                btnPDF.disabled = false;
                btnPDF.textContent = "📄 Exportar PDF";
            }).catch(err => {
                console.error("Error al generar PDF:", err);
                alert("Hubo un detalle al exportar el PDF.");
                btnPDF.disabled = false;
                btnPDF.textContent = "📄 Exportar PDF";
            });
        });
    }

    // Cargar datos iniciales
    cargarDatosGoogleSheets();
});