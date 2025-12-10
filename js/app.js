// ======================
// APP / UI LOGIKA – navbar, űrlap, PDF/print
// ======================

// NAVBAR – mobil menü
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.getElementById("nav-links");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName.toLowerCase() === "a") {
      navLinks.classList.remove("open");
    }
  });
}

// Flag: van-e már generált ZH
let hasGeneratedZh = false;

/* ========= Feladattípus-választás ========= */

function getSelectedTaskTypes() {
  const pivotCb = document.getElementById("type-pivot");
  const inverseCb = document.getElementById("type-inverse");
  const detCb = document.getElementById("type-det");
  const systemCb = document.getElementById("type-system");

  const includePivot = pivotCb ? pivotCb.checked : true;
  const includeInverse = inverseCb ? inverseCb.checked : true;
  const includeDet = detCb ? detCb.checked : true;
  const includeSystem = systemCb ? systemCb.checked : true;

  return { includePivot, includeInverse, includeDet, includeSystem };
}

function ensureAtLeastOneTaskTypeSelected() {
  const types = getSelectedTaskTypes();
  const {
    includePivot,
    includeInverse,
    includeDet,
    includeSystem
  } = types;

  if (!includePivot && !includeInverse && !includeDet && !includeSystem) {
    alert("Válassz ki legalább egy feladattípust!");
    return null;
  }
  return types;
}

/* ========= Feladatszám beolvasása ========= */

function getTaskCountFromInput() {
  const input = document.getElementById("task-count");
  if (!input) return 1;

  let n = parseInt(input.value, 10);
  if (isNaN(n) || n <= 0) n = 1;
  if (n > 30) n = 30;

  input.value = n;
  return n;
}

/* ========= Több ZH-változat generálása ========= */

function generateFullExam(count, types) {
  let html = "";
  for (let i = 1; i <= count; i++) {
    html += generateExamVariant(i, types);
  }
  return html;
}

/* ========= Kimenet frissítése ========= */

function updateZhOutput(html) {
  const outEl = document.getElementById("zhOutput");

  if (outEl) {
    outEl.innerHTML = html || "<p>Nincs megjeleníthető feladatsor.</p>";
  }

  hasGeneratedZh = !!html;

  const btnPrintTasks = document.getElementById("btn-print-tasks");
  const btnPrintAll = document.getElementById("btn-print-all");
  const btnShowSolutions = document.getElementById("btn-show-solutions");

  if (btnPrintTasks) btnPrintTasks.disabled = !hasGeneratedZh;
  if (btnPrintAll) btnPrintAll.disabled = !hasGeneratedZh;
  if (btnShowSolutions) btnShowSolutions.disabled = !hasGeneratedZh;

  // új generáláskor: megoldások elrejtése
  document.body.classList.remove("solutions-visible");
  if (btnShowSolutions) {
    btnShowSolutions.textContent = "Megoldókulcs megjelenítése";
  }

  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([outEl]).catch((err) =>
      console.error(err.message)
    );
  }
}

/* ========= Megoldókulcs kapcsoló (webes nézetben) ========= */

function toggleSolutionsVisibility() {
  if (!hasGeneratedZh) {
    alert("Előbb generálj egy feladatsort!");
    return;
  }

  const body = document.body;
  const btn = document.getElementById("btn-show-solutions");

  body.classList.toggle("solutions-visible");

  if (btn) {
    btn.textContent = body.classList.contains("solutions-visible")
      ? "Megoldókulcs elrejtése"
      : "Megoldókulcs megjelenítése";
  }

  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise().catch((err) => console.error(err.message));
  }
}

/* ========= Nyomtatási módok ========= */

function setPrintMode(modeClass) {
  document.body.classList.remove("print-mode-tasks", "print-mode-all");
  if (modeClass) {
    document.body.classList.add(modeClass);
  }
}

function printWithMode(modeClass) {
  if (!hasGeneratedZh) {
    alert("Előbb generálj egy feladatsort!");
    return;
  }

  const oldClassName = document.body.className;
  setPrintMode(modeClass);

  const doPrint = () => {
    window.print();
    document.body.className = oldClassName;
  };

  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise()
      .then(doPrint)
      .catch((err) => {
        console.error(err.message);
        doPrint();
      });
  } else {
    doPrint();
  }
}

/* ========= Gombkezelők ========= */

function handleGenerateClick() {
  const types = ensureAtLeastOneTaskTypeSelected();
  if (!types) return;

  const count = getTaskCountFromInput();
  const html = generateFullExam(count, types);
  updateZhOutput(html);
}

function handlePrintTasksClick() {
  const types = ensureAtLeastOneTaskTypeSelected();
  if (!types) return;

  const count = getTaskCountFromInput();
  const html = generateFullExam(count, types);
  updateZhOutput(html);
  printWithMode("print-mode-tasks");
}

function handlePrintAllClick() {
  const types = ensureAtLeastOneTaskTypeSelected();
  if (!types) return;

  const count = getTaskCountFromInput();
  const html = generateFullExam(count, types);
  updateZhOutput(html);
  printWithMode("print-mode-all");
}

/* ========= DOM Ready ========= */

document.addEventListener("DOMContentLoaded", () => {
  const btnGenerate = document.getElementById("btn-generate-zh");
  const btnPrintTasks = document.getElementById("btn-print-tasks");
  const btnPrintAll = document.getElementById("btn-print-all");
  const btnShowSolutions = document.getElementById("btn-show-solutions");

  if (btnGenerate) {
    btnGenerate.addEventListener("click", handleGenerateClick);
  }

  if (btnShowSolutions) {
    btnShowSolutions.addEventListener("click", toggleSolutionsVisibility);
  }

  if (btnPrintTasks) {
    btnPrintTasks.addEventListener("click", handlePrintTasksClick);
  }

  if (btnPrintAll) {
    btnPrintAll.addEventListener("click", handlePrintAllClick);
  }
});

// ======================
// LÁTOGATÓ SZÁMLÁLÓ (CountAPI)
// ======================

document.addEventListener("DOMContentLoaded", () => {
    updateVisitorCount();
});

async function updateVisitorCount() {
    const counterElement = document.getElementById("visit-count");
    
    // Csak akkor fusson, ha van ilyen elem az oldalon (pl. a footerben)
    if (!counterElement) return;

    // EGYEDI AZONOSÍTÓ:
    // A "pivot-point-thesis-mark" helyére bármit írhatsz, de legyen egyedi!
    // Ez alapján azonosítja a szerver a te számlálódat.
    const namespace = "pivot-point-thesis-mark-2026"; 
    const key = "visits";

    try {
        // 1. lépés: API hívás (megnöveli a számlálót 'hit' és visszaadja az új értéket)
        // A 'countapi.xyz' egy ingyenes szolgáltatás.
        const response = await fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`);
        
        // 2. lépés: Válasz feldolgozása JSON-ként
        const data = await response.json();
        
        // 3. lépés: Kiírás az oldalra
        counterElement.textContent = data.value;
        
        // (Opcionális) Animáció: Kicsit villanjon fel, amikor megérkezik
        counterElement.style.color = "var(--color-primary)";
        counterElement.style.fontWeight = "bold";

    } catch (error) {
        console.error("Hiba a számláló betöltésekor:", error);
        counterElement.textContent = "(Offline)";
    }
}