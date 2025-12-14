document.addEventListener("DOMContentLoaded", () => {
  construirGrafoDependencias();
  inicializarEstado();
  construirMapaRamos();
});

let dependientes = {};
let mapaRamos = {};

// ----------------------
// GRAFO DE DEPENDENCIAS
// ----------------------
function construirGrafoDependencias() {
  dependientes = {};
  document.querySelectorAll("[data-requisitos]").forEach(el => {
    const lista = el.getAttribute("data-requisitos");
    if (!lista) return;

    const reqs = lista.split(",").map(s => s.trim()).filter(Boolean);
    reqs.forEach(rid => {
      if (!dependientes[rid]) dependientes[rid] = new Set();
      dependientes[rid].add(el.id);
    });
  });
}

// ✅ CAMBIO CLAVE: IGNORAR REQUISITOS QUE NO EXISTEN
function cumpleRequisitos(el) {
  const lista = el.getAttribute("data-requisitos");
  if (!lista) return true;

  const reqs = lista.split(",").map(s => s.trim()).filter(Boolean);

  return reqs.every(rid => {
    const r = document.getElementById(rid);

    // si el requisito no existe en la malla → se ignora
    if (!r) return true;

    return r.classList.contains("activo");
  });
}

function inicializarEstado() {
  document.querySelectorAll(".ramo").forEach(el => {
    if (el.hasAttribute("data-requisitos")) {
      if (cumpleRequisitos(el)) {
        el.classList.remove("bloqueado");
        el.classList.add("desbloqueado");
      } else {
        el.classList.add("bloqueado");
        el.classList.remove("desbloqueado");
        el.classList.remove("activo");
      }
    } else {
      el.classList.remove("bloqueado");
      el.classList.add("desbloqueado");
    }
  });
}

function toggleRamo(id) {
  const el = document.getElementById(id);
  if (!el || el.classList.contains("bloqueado")) return;

  const ahoraActivo = el.classList.toggle("activo");

  if (ahoraActivo) {
    if (dependientes[id]) {
      dependientes[id].forEach(depId => {
        const depEl = document.getElementById(depId);
        if (depEl && cumpleRequisitos(depEl)) {
          depEl.classList.remove("bloqueado");
          depEl.classList.add("desbloqueado");
        }
      });
    }
  } else {
    cerrarDependientesRecursivo(id);
  }
}

function cerrarDependientesRecursivo(id) {
  if (!dependientes[id]) return;

  dependientes[id].forEach(depId => {
    const depEl = document.getElementById(depId);
    if (!depEl) return;

    depEl.classList.remove("activo");
    if (!cumpleRequisitos(depEl)) {
      depEl.classList.add("bloqueado");
      depEl.classList.remove("desbloqueado");
    }
    cerrarDependientesRecursivo(depId);
  });
}

// ----------------------
// SIMULACIÓN DE REPROBACIÓN
// ----------------------
function construirMapaRamos() {
  mapaRamos = {};
  document.querySelectorAll(".columna").forEach((col, index) => {
    const semestre = index + 1;
    col.querySelectorAll(".ramo").forEach(ramo => {
      mapaRamos[ramo.id] = {
        id: ramo.id,
        semestre,
        requisitos: (ramo.dataset.requisitos || "")
          .split(",")
          .map(s => s.trim())
          .filter(Boolean),
      };
    });
  });
}

function simularReprobacion() {
  const id = prompt("Ingresa el ID del ramo que reprobaste (ej: FIS100):");
  if (!id || !mapaRamos[id]) {
    alert("Ramo no encontrado.");
    return;
  }

  moverRamoUnSemestreAdelante(id);

  if (dependientes[id]) {
    dependientes[id].forEach(depId => actualizarDependientes(depId));
  }

  inicializarEstado();
  alert(`El ramo ${id} y sus dependientes fueron reorganizados.`);
}

function moverRamoUnSemestreAdelante(id) {
  const ramo = mapaRamos[id];
  const el = document.getElementById(id);
  if (!ramo || !el) return;

  const columnas = document.querySelectorAll(".columna");
  const nuevaColumna = columnas[ramo.semestre];

  if (!nuevaColumna) return;

  nuevaColumna.appendChild(el);
  ramo.semestre++;
}

function actualizarDependientes(id) {
  const ramo = mapaRamos[id];
  const el = document.getElementById(id);
  if (!ramo || !el) return;

  let maxSemReq = 0;

  ramo.requisitos.forEach(reqId => {
    const req = mapaRamos[reqId];
    if (req && req.semestre > maxSemReq) {
      maxSemReq = req.semestre;
    }
  });

  if (ramo.semestre <= maxSemReq) {
    const columnas = document.querySelectorAll(".columna");
    const nuevaCol = columnas[maxSemReq];
    if (!nuevaCol) return;

    nuevaCol.appendChild(el);
    ramo.semestre = maxSemReq + 1;
  }

  if (dependientes[id]) {
    dependientes[id].forEach(depId => actualizarDependientes(depId));
  }
}