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

// ======================
// ZH GENERÁTOR – csak 3×3 inverz feladat
// ======================

let hasGeneratedZh = false;

// Véletlen egész [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 3×3 „szép” egész mátrix: identitásból indulunk, elemi sortetők
function generateNiceIntMatrix3x3() {
  let A = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  const steps = randInt(3, 6);

  for (let s = 0; s < steps; s++) {
    const op = randInt(0, 2);

    if (op === 0) {
      // Sorhozzáadás: R_i <- R_i + k * R_j
      const i = randInt(0, 2);
      let j = randInt(0, 2);
      while (j === i) j = randInt(0, 2);
      let k = randInt(1, 3);
      if (Math.random() < 0.5) k = -k;

      for (let c = 0; c < 3; c++) {
        A[i][c] += k * A[j][c];
      }
    } else if (op === 1) {
      // Sorcsere
      const i = randInt(0, 2);
      let j = randInt(0, 2);
      while (j === i) j = randInt(0, 2);
      const tmp = A[i];
      A[i] = A[j];
      A[j] = tmp;
    } else {
      // Sor szorzása -1-gyel
      const i = randInt(0, 2);
      for (let c = 0; c < 3; c++) {
        A[i][c] *= -1;
      }
    }
  }

  return A;
}

// Inverz Gauss–Jordan-eliminációval
function inverseMatrix(A) {
  const n = A.length;
  const M = A.map((row, i) => {
    const identityRow = new Array(n).fill(0);
    identityRow[i] = 1;
    return row.concat(identityRow);
  });

  for (let i = 0; i < n; i++) {
    // Pivot választás
    let pivotRow = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > Math.abs(M[pivotRow][i])) {
        pivotRow = r;
      }
    }
    if (Math.abs(M[pivotRow][i]) < 1e-10) {
      return null; // szinguláris
    }

    if (pivotRow !== i) {
      const tmp = M[i];
      M[i] = M[pivotRow];
      M[pivotRow] = tmp;
    }

    const pivot = M[i][i];
    for (let c = 0; c < 2 * n; c++) {
      M[i][c] /= pivot;
    }

    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = M[r][i];
      for (let c = 0; c < 2 * n; c++) {
        M[r][c] -= factor * M[i][c];
      }
    }
  }

  const inv = [];
  for (let i = 0; i < n; i++) {
    inv.push(M[i].slice(n));
  }
  return inv;
}

// LaTeX-es mátrix (pmatrix)
function matrixToLatex(A) {
  const rows = A.map((row) => row.join(" & ")).join(" \\\\ ");
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

// Egyetlen feladat generálása: 3×3 inverz
function generateSingleInverseTask() {
  const A = generateNiceIntMatrix3x3();
  const inv = inverseMatrix(A);

  if (!inv) {
    // nagyon ritkán: ha mégis szinguláris lett
    return generateSingleInverseTask();
  }

  // kerekítés egészre – elvileg eleve egész
  const invInt = inv.map((row) => row.map((x) => Math.round(x)));

  const taskHtml = `
    <div class="zh-task">
      <p><strong>1. feladat (mátrixinverz)</strong></p>
      <p>Határozza meg az alábbi $3\\times3$ mátrix inverzét!</p>
      <p>$$A = ${matrixToLatex(A)}$$</p>
    </div>
  `;

  const solutionHtml = `
    <div class="zh-solution">
      <p><strong>1. feladat megoldása</strong></p>
      <p>A Gauss–Jordan-elimináció során az $[A \\mid I]$ mátrixból $[I \\mid A^{-1}]$ adódik.</p>
      <p>Az eredmény:</p>
      <p>$$A^{-1} = ${matrixToLatex(invInt)}$$</p>
    </div>
  `;

  return { taskHtml, solutionHtml };
}

// Kimenet frissítése
function updateZhOutputs(tasksHtml, solutionsHtml) {
  const tasksEl = document.getElementById("zhTasksOutput");
  const solEl = document.getElementById("zhSolutionsOutput");

  if (tasksEl) tasksEl.innerHTML = tasksHtml;
  if (solEl) solEl.innerHTML = solutionsHtml;

  hasGeneratedZh = !!tasksHtml;

  const btnPrintTasks = document.getElementById("btn-print-tasks");
  const btnPrintAll = document.getElementById("btn-print-all");
  const btnShowSolutions = document.getElementById("btn-show-solutions");

  if (btnPrintTasks) btnPrintTasks.disabled = !hasGeneratedZh;
  if (btnPrintAll) btnPrintAll.disabled = !hasGeneratedZh;
  if (btnShowSolutions) btnShowSolutions.disabled = !hasGeneratedZh;

  // új feladatnál mindig task-only nézet legyen
  document.body.classList.remove("solutions-visible");
  if (btnShowSolutions) {
    btnShowSolutions.textContent = "Megoldókulcs megjelenítése";
  }

  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([tasksEl, solEl]).catch((err) =>
      console.error(err.message)
    );
  }
}

// Megoldókulcs megjelenítése/elrejtése (csak WEB)
function toggleSolutionsVisibility() {
  if (!hasGeneratedZh) {
    alert("Előbb generálj egy feladatot!");
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

// Közös segédfüggvény a print mód beállításához
function setPrintMode(modeClass) {
  document.body.classList.remove("print-mode-tasks", "print-mode-all");
  if (modeClass) {
    document.body.classList.add(modeClass);
  }
}

// Belső: PDF generálás (valójában böngésző print + Mentés PDF-be)
function printWithMode(modeClass) {
  if (!hasGeneratedZh) {
    alert("Előbb generálj egy feladatot!");
    return;
  }

  const oldClassName = document.body.className;

  setPrintMode(modeClass);

  const doPrint = () => {
    window.print();
    document.body.className = oldClassName; // visszaállítjuk az eredeti állapotot
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

// Csak feladatok PDF
function printTasksOnly() {
  printWithMode("print-mode-tasks");
}

// Feladat + megoldás PDF
function printTasksAndSolutions() {
  printWithMode("print-mode-all");
}

// Eseménykezelők
document.addEventListener("DOMContentLoaded", () => {
  const btnGenerate = document.getElementById("btn-generate-zh");
  const btnPrintTasks = document.getElementById("btn-print-tasks");
  const btnPrintAll = document.getElementById("btn-print-all");
  const btnShowSolutions = document.getElementById("btn-show-solutions");

  if (btnGenerate) {
    btnGenerate.addEventListener("click", () => {
      const { taskHtml, solutionHtml } = generateSingleInverseTask();
      updateZhOutputs(taskHtml, solutionHtml);
    });
  }

  if (btnShowSolutions) {
    btnShowSolutions.addEventListener("click", toggleSolutionsVisibility);
  }

  if (btnPrintTasks) {
    btnPrintTasks.addEventListener("click", printTasksOnly);
  }

  if (btnPrintAll) {
    btnPrintAll.addEventListener("click", printTasksAndSolutions);
  }
});
