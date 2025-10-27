/* Sistema Vehicular ULEAM - Navegación y utilidades */
const INTERFACES_DIR = 'interfaces/';

document.addEventListener('DOMContentLoaded', () => {
  cargarInterfaz('login.html', false);
});

function cargarInterfaz(archivo, mostrarMenu = true) {
  fetch(INTERFACES_DIR + archivo)
    .then(res => {
      if (!res.ok) throw new Error('Archivo no encontrado');
      return res.text();
    })
    .then(html => {
      document.getElementById('main-content').innerHTML = html;
      const sidebar = document.getElementById('sidebar');
      const mainContent = document.getElementById('main-content');
      sidebar.style.display = mostrarMenu ? 'flex' : 'none';
      mainContent.className = mostrarMenu ? 'with-sidebar' : 'full-screen';

      /* Ligas dinámicas después del fetch */
      if (archivo === 'login.html') enlazarLogin();
      if (archivo === 'control-ingreso-salida.html') enlazarControl();
    })
    .catch(err => {
      console.error(err);
      document.getElementById('main-content').innerHTML =
        `<div class="error-box"><h2>❌ Error</h2><p>No se pudo cargar la interfaz.</p></div>`;
    });
}

/* ----------- LOGIN ----------- */
function enlazarLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const clave   = document.getElementById('contrasena').value.trim();
    limpiarErrores();
    let ok = true;
    if (!usuario) { muestraError('usuario', '⚠️ Obligatorio.'); ok = false; }
    if (!clave)   { muestraError('contrasena', '⚠️ Obligatorio.'); ok = false; }
    if (ok) {
      alert('✅ Inicio de sesión exitoso');
      cargarInterfaz('panel.html', true);
    }
  });
}

/* ----------- CONTROL INGRESO/SALIDA ----------- */
function enlazarControl() {
  const btnBuscar = document.querySelector('.btn-search');
  if (btnBuscar) btnBuscar.addEventListener('click', buscarVehiculo);
}

function buscarVehiculo() {
  const input = document.getElementById('placaBusqueda');
  const error = document.getElementById('error-placa-busqueda');
  const card  = document.getElementById('datosVehiculo');
  if (!input || !error || !card) return;

  error.textContent = '';
  card.style.display = 'none';

  const placa = input.value.trim();
  if (!placa) { error.textContent = '⚠️ Por favor ingrese una placa.'; return; }
  if (!validarPlaca(placa)) {
    error.textTextContent = '⚠️ Formato de placa inválido. Use: ABC123, ABC1234 o 123ABC.';
    return;
  }

  /* Simulación */
  document.getElementById('nombreConductor').textContent = 'Joel Barrera';
  document.getElementById('ultimoIngreso').textContent   = '23/10/2025 07:30';
  card.style.display = 'block';
}

function registrarIngreso() { alert('✅ Ingreso registrado'); }
function registrarSalida()  { alert('✅ Salida registrada'); }

/* ----------- UTILITARIOS ----------- */
function cerrarSesion() {
  if (confirm('¿Desea cerrar sesión?')) cargarInterfaz('login.html', false);
}
function limpiarErrores() {
  document.querySelectorAll('.error-message').forEach(e => e.textContent = '');
}
function muestraError(campo, msg) {
  const div = document.getElementById('error-' + campo);
  if (div) div.textContent = msg;
}
function validarPlaca(p) {
  const placa = p.trim().toUpperCase();
  return /^[A-Z]{3}\d{3,4}$/.test(placa) || /^\d{3}[A-Z]{3}$/.test(placa);
}