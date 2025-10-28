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

function cumpleRequisitos(el) {
  const lista = el.getAttribute("data-requisitos");
  if (!lista) return true;
  const reqs = lista.split(",").map(s => s.trim()).filter(Boolean);
  return reqs.every(rid => {
    const r = document.getElementById(rid);
    return r && r.classList.contains("activo");
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
  if (!el) return;
  if (el.classList.contains("bloqueado")) return;

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
  document.querySelectorAll(".columna").forEach((col, index) => {
    const semestre = index + 1;
    col.querySelectorAll(".ramo").forEach(ramo => {
      mapaRamos[ramo.id] = {
        id: ramo.id,
        semestre: semestre,
        requisitos: (ramo.dataset.requisitos || "").split(",").filter(Boolean),
      };
    });
  });
}

function simularReprobacion() {
  const id = prompt("Ingresa el ID del ramo que reprobaste (por ejemplo: MAT060):");
  if (!id || !mapaRamos[id]) {
    alert("Ramo no encontrado.");
    return;
  }

  moverRamoUnSemestreAdelante(id);

  if (dependientes[id]) {
    dependientes[id].forEach(depId => {
      actualizarDependientes(depId);
    });
  }

  inicializarEstado();
  alert(`El ramo ${id} y sus dependientes se han reorganizado según sus prerequisitos.`);
}

function moverRamoUnSemestreAdelante(id) {
  const ramo = mapaRamos[id];
  if (!ramo) return;

  const el = document.getElementById(id);
  if (!el) return;

  const columnas = document.querySelectorAll(".columna");
  let nuevaSemestreIndex = ramo.semestre;

  while (columnas.length <= nuevaSemestreIndex) {
    const colNueva = document.createElement("div");
    colNueva.classList.add("columna");
    const titulo = document.createElement("div");
    titulo.classList.add("titulo");
    titulo.innerText = `Semestre ${columnas.length + 1}`;
    colNueva.appendChild(titulo);
    document.getElementById("malla").appendChild(colNueva);
  }

  const nuevaColumna = document.querySelectorAll(".columna")[nuevaSemestreIndex];
  el.style.transition = "all 0.5s ease";
  el.style.backgroundColor = "#e2b6f0";
  nuevaColumna.appendChild(el);
  ramo.semestre++;

  setTimeout(() => el.style.backgroundColor = "", 600);
}

function actualizarDependientes(id) {
  const ramo = mapaRamos[id];
  if (!ramo) return;

  const el = document.getElementById(id);
  if (!el) return;

  let maxSemestreReq = 0;
  ramo.requisitos.forEach(reqId => {
    const reqRamo = mapaRamos[reqId];
    if (!reqRamo) return;
    if (reqRamo.semestre > maxSemestreReq) maxSemestreReq = reqRamo.semestre;
  });

  if (ramo.semestre <= maxSemestreReq) {
    const columnas = document.querySelectorAll(".columna");

    while (columnas.length <= maxSemestreReq) {
      const colNueva = document.createElement("div");
      colNueva.classList.add("columna");
      const titulo = document.createElement("div");
      titulo.classList.add("titulo");
      titulo.innerText = `Semestre ${columnas.length + 1}`;
      colNueva.appendChild(titulo);
      document.getElementById("malla").appendChild(colNueva);
    }

    const nuevaColumna = document.querySelectorAll(".columna")[maxSemestreReq];
    el.style.transition = "all 0.5s ease";
    el.style.backgroundColor = "#e2b6f0";
    nuevaColumna.appendChild(el);
    ramo.semestre = maxSemestreReq + 1;

    setTimeout(() => el.style.backgroundColor = "", 600);
  }

  if (dependientes[id]) {
    dependientes[id].forEach(depId => actualizarDependientes(depId));
  }
}