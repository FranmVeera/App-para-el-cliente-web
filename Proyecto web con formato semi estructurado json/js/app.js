// js/app.js
const INTERFACES_DIR = 'interfaces/';
const DB_KEY = 'uleamVehicular';

document.addEventListener('DOMContentLoaded', () => {
  initDB();
  cargarInterfaz('login.html', false);
});

// ---------- initDB ----------
function initDB() {
  const raw = localStorage.getItem(DB_KEY);

  if (!raw) {
    console.warn('⚠️  No se encontró clave "uleamVehicular" en localStorage. Creando base inicial...');

    const initial = {
      usuarios: [
        {
          id: 1,
          tipo: 'sistema',
          nombre: 'Administrador',
          correo: 'admin@uleam.edu.ec',
          usuario: 'admin',
          contrasena: 'admin123',
          rol: 'admin'
        },
        {
          id: 2,
          tipo: 'conductor',
          cedula: '1309876543',
          nombre: 'Joel',
          apellido: 'Barrera',
          correo: 'joel@uleam.edu.ec',
          telefono: '0999876543',
          rol: 'estudiante'
        }
      ],
      vehiculos: [
        {
          id: 3,
          placa: 'ABC123',
          marca: 'Toyota',
          modelo: 'Corolla',
          color: 'Blanco',
          tipo: 'auto',
          usuarioId: 2
        }
      ],
      movimientos: []
    };

    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    console.log('✅ Base de datos inicializada:', initial);
    return;
  }

  // Si ya existía, comprobamos que sea JSON válido
  try {
    JSON.parse(raw);
    console.log('✅ Base de datos encontrada en localStorage.');
  } catch (e) {
    console.error('❌ El contenido de localStorage NO es JSON válido. Borrando...');
    localStorage.removeItem(DB_KEY);
    initDB(); // recursión segura
  }
}

// ---------- getDB ----------
function getDB() {
  const raw = localStorage.getItem(DB_KEY);

  if (!raw) {
    console.warn('⚠️  getDB(): No se encontró clave "uleamVehicular".');
    return { usuarios: [], vehiculos: [], movimientos: [] };
  }

  try {
    const db = JSON.parse(raw);
    console.log('📦 Base de datos leída:', db);
    return {
      usuarios: db.usuarios || [],
      vehiculos: db.vehiculos || [],
      movimientos: db.movimientos || []
    };
  } catch (e) {
    console.error('❌ getDB(): Error parseando JSON ->', e);
    localStorage.removeItem(DB_KEY);
    return { usuarios: [], vehiculos: [], movimientos: [] };
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function cargarInterfaz(archivo, mostrarMenu = true) {
  const usuarioLogueado = localStorage.getItem('usuarioLogueado');

  if (!usuarioLogueado && archivo !== 'login.html') {
    cargarInterfaz('login.html', false);
    return;
  }

  fetch(INTERFACES_DIR + archivo)
    .then(res => res.text())
    .then(html => {
      const mainContent = document.getElementById('main-content');
      const sidebar = document.getElementById('sidebar');
      mainContent.innerHTML = html;
      if (sidebar) sidebar.style.display = mostrarMenu ? 'flex' : 'none';
      mainContent.className = mostrarMenu ? 'with-sidebar' : 'full-screen';

      switch (archivo) {
        case 'login.html':
          enlazarLogin();
          break;
        case 'registro-usuario-vehiculo.html':
          enlazarRegistroUsuarioVehiculo();
          break;
        case 'control-ingreso-salida.html':
          enlazarControl();
          break;
        case 'consulta-movimientos.html':
          enlazarConsultaMovimientos();
          break;
        case 'gestion-usuarios.html':
          enlazarGestionUsuarios();
          break;
        case 'panel.html':
          enlazarPanel();
          break;
      }
    })
    .catch(() => {
      document.getElementById('main-content').innerHTML =
        '<div class="error-box"><h2>❌ Error</h2><p>No se pudo cargar la interfaz.</p></div>';
    });
}

function limpiarErrores() {
  document.querySelectorAll('.error-message').forEach(e => (e.textContent = ''));
}

function muestraError(campoBase, mensaje) {
  const div = document.getElementById('error-' + campoBase);
  if (div) div.textContent = mensaje;
}

function validarCedula(cedula) {
  if (!cedula || cedula.length !== 10 || isNaN(cedula)) return false;
  const d = cedula.split('').map(Number);
  const prov = d[0] * 10 + d[1];
  if (prov < 1 || prov > 24) return false;
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let v = d[i] * coef[i];
    if (v >= 10) v -= 9;
    sum += v;
  }
  const verif = (10 - (sum % 10)) % 10;
  return verif === d[9];
}

function validarCorreo(c) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
}

function validarTelefono(tel) {
  return /^09\d{8}$/.test(tel);
}

function validarPlaca(p) {
  const placa = p.trim().toUpperCase();
  return /^[A-Z]{3}\d{3,4}$/.test(placa) || /^\d{3}[A-Z]{3}$/.test(placa);
}

function formatearFechaHora(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

function obtenerUltimoMovimiento(placa) {
  const db = getDB();
  const movs = db.movimientos.filter(m => m.placa === placa);
  if (!movs.length) return null;
  movs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  return movs[0];
}

function cerrarSesion() {
  if (confirm('¿Desea cerrar sesión?')) {
    localStorage.removeItem('usuarioLogueado');
    cargarInterfaz('login.html', false);
  }
}

function enlazarLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    limpiarErrores();

    const usuarioInput = document.getElementById('usuario').value.trim();
    const contrasenaInput = document.getElementById('contrasena').value;

    let ok = true;
    if (!usuarioInput) {
      muestraError('usuario', '⚠️ Este campo es obligatorio.');
      ok = false;
    }
    if (!contrasenaInput) {
      muestraError('contrasena', '⚠️ Este campo es obligatorio.');
      ok = false;
    }
    if (!ok) return;

    const db = getDB();
    const usuario = db.usuarios.find(
      u =>
        u.tipo === 'sistema' &&
        (u.usuario === usuarioInput || u.correo === usuarioInput)
    );

    if (!usuario || usuario.contrasena !== contrasenaInput) {
      muestraError('contrasena', '⚠️ Usuario o contraseña incorrectos.');
      return;
    }

    alert('✅ Inicio de sesión exitoso');
    localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
    cargarInterfaz('panel.html', true);
  });
}

function enlazarPanel() {
  const db = getDB();
  const hoy = new Date().toISOString().slice(0, 10);

  const ultimosPorPlaca = {};
  db.movimientos.forEach(m => {
    if (!ultimosPorPlaca[m.placa] || new Date(m.fecha) > new Date(ultimosPorPlaca[m.placa].fecha)) {
      ultimosPorPlaca[m.placa] = m;
    }
  });

  const vehiculosDentro = Object.values(ultimosPorPlaca).filter(m => m.tipo === 'ingreso').length;
  const salidasHoy = db.movimientos.filter(
    m => m.tipo === 'salida' && m.fecha.startsWith(hoy)
  ).length;

  const kpiDentro = document.querySelector('[data-kpi="vehiculos-dentro"]');
  const kpiSalidos = document.querySelector('[data-kpi="vehiculos-salidos-hoy"]');

  if (kpiDentro) kpiDentro.textContent = vehiculosDentro;
  if (kpiSalidos) kpiSalidos.textContent = salidasHoy;
}

function enlazarRegistroUsuarioVehiculo() {
  const select = document.getElementById('usuarioExistente');
  if (!select) return;

  while (select.options.length > 1) select.remove(1);

  const db = getDB();
  db.usuarios
    .filter(u => u.tipo === 'conductor')
    .forEach(u => {
      const opt = document.createElement('option');
      opt.value = String(u.id);
      opt.textContent = `${u.nombre} ${u.apellido} (${u.cedula})`;
      select.appendChild(opt);
    });
}

function registrarVehiculoExistente() {
  limpiarErrores();

  const select = document.getElementById('usuarioExistente');
  const placaInput = document.getElementById('placaVehiculo');

  if (!select || !placaInput) return;

  const usuarioId = select.value;
  const placa = placaInput.value.trim().toUpperCase();

  if (!usuarioId) {
    muestraError('usuario-existente', '⚠️ Seleccione un conductor.');
    return;
  }
  if (!placa) {
    muestraError('placa', '⚠️ Este campo es obligatorio.');
    return;
  }
  if (!validarPlaca(placa)) {
    muestraError('placa', '⚠️ Formato de placa inválido (Ej: ABC123).');
    return;
  }

  const db = getDB();
  if (db.vehiculos.some(v => v.placa === placa)) {
    muestraError('placa', '⚠️ La placa ya está registrada.');
    return;
  }

  db.vehiculos.push({
    id: Date.now(),
    placa,
    marca: document.getElementById('marcaVehiculo').value.trim(),
    modelo: document.getElementById('modeloVehiculo').value.trim(),
    color: document.getElementById('colorVehiculo').value.trim(),
    tipo: document.getElementById('tipoVehiculo').value,
    usuarioId: Number(usuarioId)
  });

  saveDB(db);
  alert(`✅ Vehículo ${placa} registrado para el conductor seleccionado.`);
}

function validarYRegistrar() {
  limpiarErrores();

  const cedula = document.getElementById('cedulaNuevo').value.trim();
  const nombre = document.getElementById('nombreNuevo').value.trim();
  const apellido = document.getElementById('apellidoNuevo').value.trim();
  const correo = document.getElementById('correoNuevo').value.trim();
  const telefono = document.getElementById('telefonoNuevo').value.trim();
  const rol = document.getElementById('rolNuevo').value;
  const placa = document.getElementById('placaVehiculo').value.trim().toUpperCase();
  const marca = document.getElementById('marcaVehiculo').value.trim();
  const modelo = document.getElementById('modeloVehiculo').value.trim();
  const color = document.getElementById('colorVehiculo').value.trim();
  const tipo = document.getElementById('tipoVehiculo').value;

  const faltantes = [];

  if (!cedula || !validarCedula(cedula)) faltantes.push('Cédula válida');
  if (!nombre) faltantes.push('Nombre');
  if (!apellido) faltantes.push('Apellido');
  if (!correo || !validarCorreo(correo)) faltantes.push('Correo válido');
  if (telefono && !validarTelefono(telefono)) faltantes.push('Teléfono 09xxxxxxxx');
  if (!rol) faltantes.push('Rol');
  if (!placa || !validarPlaca(placa)) faltantes.push('Placa válida');
  if (!marca) faltantes.push('Marca');
  if (!modelo) faltantes.push('Modelo');
  if (!color) faltantes.push('Color');
  if (!tipo) faltantes.push('Tipo');

  if (faltantes.length) {
    const resumen = document.getElementById('mensaje-resumen');
    if (resumen) resumen.textContent = '⚠️ Complete: ' + faltantes.join(', ');
    return;
  }

  const db = getDB();

  if (db.vehiculos.some(v => v.placa === placa)) {
    muestraError('placa', '⚠️ La placa ya está registrada.');
    return;
  }

  const nuevoUsuario = {
    id: Date.now(),
    tipo: 'conductor',
    cedula,
    nombre,
    apellido,
    correo,
    telefono,
    rol
  };

  const nuevoVehiculo = {
    id: Date.now() + 1,
    placa,
    marca,
    modelo,
    color,
    tipo,
    usuarioId: nuevoUsuario.id
  };

  db.usuarios.push(nuevoUsuario);
  db.vehiculos.push(nuevoVehiculo);
  saveDB(db);

  alert(`✅ Conductor ${nombre} ${apellido} y vehículo ${placa} registrados.`);
}

function enlazarControl() {
  const input = document.getElementById('placaBusqueda');
  if (input) input.focus();
}

function buscarVehiculo() {
  const input = document.getElementById('placaBusqueda');
  const error = document.getElementById('error-placa-busqueda');
  const card = document.getElementById('datosVehiculo');

  if (!input || !error || !card) return;

  error.textContent = '';
  card.style.display = 'none';

  const placa = input.value.trim().toUpperCase();
  if (!placa) {
    error.textContent = '⚠️ Ingrese una placa.';
    return;
  }
  if (!validarPlaca(placa)) {
    error.textContent = '⚠️ Formato inválido (Ej: ABC123).';
    return;
  }

  const db = getDB();
  const vehiculo = db.vehiculos.find(v => v.placa === placa);
  if (!vehiculo) {
    error.textContent = '⚠️ Vehículo no registrado.';
    return;
  }

  const usuario = db.usuarios.find(u => u.id === vehiculo.usuarioId);

  const nombreConductor = document.getElementById('nombreConductor');
  const ultimoIngreso = document.getElementById('ultimoIngreso');

  if (nombreConductor) {
    nombreConductor.textContent = usuario
      ? `${usuario.nombre} ${usuario.apellido}`
      : '-';
  }

  if (ultimoIngreso) {
    const ult = obtenerUltimoMovimiento(placa);
    ultimoIngreso.textContent = ult ? formatearFechaHora(ult.fecha) : 'Sin registro';
  }

  card.style.display = 'block';
}

function registrarIngreso() {
  registrarMovimiento('ingreso');
}

function registrarSalida() {
  registrarMovimiento('salida');
}

function registrarMovimiento(tipo) {
  const input = document.getElementById('placaBusqueda');
  const error = document.getElementById('error-placa-busqueda');

  if (!input || !error) return;

  const placa = input.value.trim().toUpperCase();
  if (!placa) {
    error.textContent = '⚠️ Primero busque un vehículo.';
    return;
  }

  const db = getDB();
  if (!db.vehiculos.some(v => v.placa === placa)) {
    error.textContent = '⚠️ Vehículo no registrado.';
    return;
  }

  db.movimientos.push({
    id: Date.now(),
    placa,
    tipo,
    fecha: new Date().toISOString()
  });
  saveDB(db);

  alert(
    `✅ ${tipo === 'ingreso' ? 'Ingreso' : 'Salida'} registrada para ${placa}.`
  );

  if (tipo === 'ingreso') {
    const ultimoIngreso = document.getElementById('ultimoIngreso');
    if (ultimoIngreso) {
      ultimoIngreso.textContent = formatearFechaHora(new Date().toISOString());
    }
  }
}

function enlazarConsultaMovimientos() {
  const fin = document.getElementById('fechaFin');
  const inicio = document.getElementById('fechaInicio');

  if (!fin || !inicio) return;

  const hoy = new Date();
  const hace7 = new Date(hoy.getTime() - 6 * 24 * 60 * 60 * 1000);

  fin.value = hoy.toISOString().slice(0, 10);
  inicio.value = hace7.toISOString().slice(0, 10);
}

function buscarMovimientos() {
  const inicioEl = document.getElementById('fechaInicio');
  const finEl = document.getElementById('fechaFin');
  const filtroEl = document.getElementById('filtro');
  const errorInicio = document.getElementById('error-fecha-inicio');
  const errorFin = document.getElementById('error-fecha-fin');

  if (!inicioEl || !finEl || !filtroEl || !errorInicio || !errorFin) return;

  const inicio = inicioEl.value;
  const fin = finEl.value;
  const filtro = filtroEl.value.trim().toUpperCase();

  errorInicio.textContent = '';
  errorFin.textContent = '';

  let valido = true;
  if (!inicio) {
    errorInicio.textContent = '⚠️ Obligatorio.';
    valido = false;
  }
  if (!fin) {
    errorFin.textContent = '⚠️ Obligatorio.';
    valido = false;
  }
  if (inicio && fin && new Date(inicio) > new Date(fin)) {
    errorFin.textContent = '⚠️ Fecha final no puede ser menor.';
    valido = false;
  }
  if (!valido) return;

  const db = getDB();
  const inicioDate = new Date(inicio);
  const finDate = new Date(fin);
  finDate.setHours(23, 59, 59, 999);

  const resultados = db.movimientos.filter(m => {
    const fecha = new Date(m.fecha);
    const enRango = fecha >= inicioDate && fecha <= finDate;

    if (!enRango) return false;

    if (!filtro) return true;

    const placaCoincide = m.placa.toUpperCase().includes(filtro);

    const vehiculo = db.vehiculos.find(v => v.placa === m.placa);
    const usuario = vehiculo
      ? db.usuarios.find(u => u.id === vehiculo.usuarioId)
      : null;
    const cedulaCoincide =
      usuario && usuario.cedula && usuario.cedula.includes(filtro);

    return placaCoincide || cedulaCoincide;
  });

  renderTablaMovimientos(resultados);
}

function renderTablaMovimientos(lista) {
  const tbody = document.getElementById('tbodyMovimientos');

  if (!tbody) {
    console.table(lista);
    alert(`✅ Se encontraron ${lista.length} movimientos.`);
    return;
  }

  tbody.innerHTML = '';

  if (!lista.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'Sin movimientos para los criterios seleccionados.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const db = getDB();
  lista
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .forEach(m => {
      const vehiculo = db.vehiculos.find(v => v.placa === m.placa);
      const usuario = vehiculo
        ? db.usuarios.find(u => u.id === vehiculo.usuarioId)
        : null;

      const tr = document.createElement('tr');
      const celdas = [
        formatearFechaHora(m.fecha),
        m.placa,
        m.tipo === 'ingreso' ? 'Ingreso' : 'Salida',
        usuario ? `${usuario.nombre} ${usuario.apellido}` : '-'
      ];

      celdas.forEach(texto => {
        const td = document.createElement('td');
        td.textContent = texto;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
}

function enlazarGestionUsuarios() {
  // Sin funciones adicionales por ahora
}

function crearUsuarioSistema() {
  const nombre = document.getElementById('nombreCompleto').value.trim();
  const correo = document.getElementById('correoAdmin').value.trim();
  const rol = document.getElementById('rolAdmin').value;
  const pass = document.getElementById('contrasenaAdmin').value;

  limpiarErrores();

  let valido = true;
  if (!nombre) {
    muestraError('nombre', '⚠️ Obligatorio');
    valido = false;
  }
  if (!correo || !validarCorreo(correo)) {
    muestraError('correo', '⚠️ Correo inválido');
    valido = false;
  }
  if (!rol) {
    muestraError('rol', '⚠️ Seleccione un rol');
    valido = false;
  }
  if (!pass || pass.length < 6) {
    muestraError('contrasena', '⚠️ Mínimo 6 caracteres');
    valido = false;
  }
  if (!valido) return;

  const db = getDB();
  if (
    db.usuarios.some(
      u => u.tipo === 'sistema' && u.correo.toLowerCase() === correo.toLowerCase()
    )
  ) {
    muestraError('correo', '⚠️ Ya existe un usuario con este correo.');
    return;
  }

  db.usuarios.push({
    id: Date.now(),
    tipo: 'sistema',
    nombre,
    correo,
    rol,
    contrasena: pass
  });
  saveDB(db);

  alert(`✅ Usuario ${nombre} creado como ${rol}.`);

  document.getElementById('nombreCompleto').value = '';
  document.getElementById('correoAdmin').value = '';
  document.getElementById('rolAdmin').value = '';
  document.getElementById('contrasenaAdmin').value = '';
}