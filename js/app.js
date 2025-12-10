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
    trackEvent("zh_generated");
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
// ZH GENERÁLÁS SZÁMLÁLÓ (Kijelzéssel)
// ======================

// 1. Amikor az oldal betöltődik, kérjük le a JELENLEGI számot (növelés nélkül)
document.addEventListener("DOMContentLoaded", () => {
    fetchGenCount();
    
    // Eseményfigyelő a generálás gombra (ha létezik az oldalon)
    const btnGenerate = document.getElementById("btn-generate-zh");
    if (btnGenerate) {
        btnGenerate.addEventListener("click", () => {
            incrementGenCount();
        });
    }
});

// KONFIGURÁCIÓ
const API_NAMESPACE = "pivot-point-szakdolgozat-mark";
const API_KEY = "zh_generated"; // Fontos: Ez ugyanaz a kulcs legyen!

// A. Csak lekérdezés (Read-only)
async function fetchGenCount() {
    const displayEl = document.getElementById("gen-count");
    if (!displayEl) return;

    try {
        // Ha NEM írjuk oda a végére, hogy "/up", akkor csak lekérdezi
        const response = await fetch(`https://api.counterapi.dev/v1/${API_NAMESPACE}/${API_KEY}`);
        
        if (!response.ok) throw new Error("API Hiba");
        
        const data = await response.json();
        displayEl.textContent = data.count;
        
    } catch (error) {
        console.error("Számláló hiba:", error);
        displayEl.textContent = "...";
    }
}

// B. Növelés és Frissítés (Increment)
async function incrementGenCount() {
    const displayEl = document.getElementById("gen-count");
    
    // Opcionális: Pörgetés effektus vagy színváltás jelzi, hogy történt valami
    if(displayEl) displayEl.style.color = "#ccc"; // Kicsit elhalványul amíg tölt

    try {
        // Az "/up" végződés növeli a számot
        const response = await fetch(`https://api.counterapi.dev/v1/${API_NAMESPACE}/${API_KEY}/up`);
        
        if (!response.ok) throw new Error("API Hiba");

        const data = await response.json();
        
        // Frissítjük a kijelzőt az új számmal
        if (displayEl) {
            displayEl.textContent = data.count;
            displayEl.style.color = "var(--color-primary)"; // Vissza a szín
            displayEl.style.fontWeight = "bold";
            
            // Egy kis animáció (megnő egy pillanatra)
            displayEl.style.transition = "transform 0.2s";
            displayEl.style.transform = "scale(1.5)";
            setTimeout(() => displayEl.style.transform = "scale(1)", 200);
        }

    } catch (error) {
        console.error("Növelési hiba:", error);
    }
}