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
// ZH GENERÁTOR LOGIKA
// ======================

let lastZhTasksText = "";
let lastZhSolutionsText = "";

// Segédfüggvény: véletlen egész [min, max] között
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function intRangeForDifficulty(diff) {
  switch (diff) {
    case "easy":
      return 3;
    case "hard":
      return 9;
    case "medium":
    default:
      return 5;
  }
}

function generateRandomMatrix(size, difficulty) {
  const range = intRangeForDifficulty(difficulty);
  const matrix = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(randInt(-range, range));
    }
    matrix.push(row);
  }
  return matrix;
}

function cloneMatrix(m) {
  return m.map((row) => row.slice());
}

// Determináns (egyszerű Gauss-eliminációval)
function determinant(matrix) {
  const n = matrix.length;
  const a = cloneMatrix(matrix);
  let det = 1;

  for (let i = 0; i < n; i++) {
    // pivot keresése
    let pivotRow = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(a[r][i]) > Math.abs(a[pivotRow][i])) {
        pivotRow = r;
      }
    }

    if (Math.abs(a[pivotRow][i]) < 1e-10) {
      return 0;
    }

    if (pivotRow !== i) {
      const tmp = a[i];
      a[i] = a[pivotRow];
      a[pivotRow] = tmp;
      det *= -1;
    }

    const pivot = a[i][i];
    det *= pivot;

    for (let r = i + 1; r < n; r++) {
      const factor = a[r][i] / pivot;
      for (let c = i; c < n; c++) {
        a[r][c] -= factor * a[i][c];
      }
    }
  }

  return Math.round(det);
}

function generateInvertibleMatrix(size, difficulty, maxTries = 30) {
  for (let k = 0; k < maxTries; k++) {
    const m = generateRandomMatrix(size, difficulty);
    if (determinant(m) !== 0) {
      return m;
    }
  }
  // nagyon ritkán: ha nem találtunk nem szingulárist
  return generateRandomMatrix(size, difficulty);
}

// Gauss–Jordan megoldó: A x = b
function solveLinearSystem(A, b) {
  const n = A.length;
  const M = A.map((row, i) => row.concat([b[i]]));

  for (let i = 0; i < n; i++) {
    // pivot keresése
    let pivotRow = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > Math.abs(M[pivotRow][i])) {
        pivotRow = r;
      }
    }
    if (Math.abs(M[pivotRow][i]) < 1e-10) {
      return null; // nincs egyértelmű megoldás
    }

    if (pivotRow !== i) {
      const tmp = M[i];
      M[i] = M[pivotRow];
      M[pivotRow] = tmp;
    }

    // normalizáljuk a pivot sort
    const pivot = M[i][i];
    for (let c = i; c <= n; c++) {
      M[i][c] /= pivot;
    }

    // nullázzuk a többi sort
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = M[r][i];
      for (let c = i; c <= n; c++) {
        M[r][c] -= factor * M[i][c];
      }
    }
  }

  const x = new Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = M[i][n];
  }
  return x;
}

// Inverz Gauss–Jordan-nel
function inverseMatrix(A) {
  const n = A.length;
  const M = A.map((row, i) => {
    const identityRow = new Array(n).fill(0);
    identityRow[i] = 1;
    return row.concat(identityRow);
  });

  for (let i = 0; i < n; i++) {
    let pivotRow = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > Math.abs(M[pivotRow][i])) {
        pivotRow = r;
      }
    }
    if (Math.abs(M[pivotRow][i]) < 1e-10) {
      return null;
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

// Rang – sorredukált alak nemnulla sorainak száma
function rankOfMatrix(A) {
  const m = cloneMatrix(A);
  const n = m.length;
  let rank = 0;
  let row = 0;

  for (let col = 0; col < n && row < n; col++) {
    // pivot keresése
    let pivotRow = row;
    for (let r = row + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivotRow][col])) {
        pivotRow = r;
      }
    }
    if (Math.abs(m[pivotRow][col]) < 1e-10) {
      continue; // nincs pivot ebben az oszlopban
    }

    // sortcsere
    if (pivotRow !== row) {
      const tmp = m[row];
      m[row] = m[pivotRow];
      m[pivotRow] = tmp;
    }

    const pivot = m[row][col];
    // normalizáljuk
    for (let c = col; c < n; c++) {
      m[row][c] /= pivot;
    }
    // lenullázzuk a többi sort
    for (let r = 0; r < n; r++) {
      if (r === row) continue;
      const factor = m[r][col];
      for (let c = col; c < n; c++) {
        m[r][c] -= factor * m[row][c];
      }
    }

    row++;
    rank++;
  }

  return rank;
}

// ------- Formázó függvények -------

function formatVector(vec) {
  return "(" + vec.map((x) => x.toFixed(2)).join(", ") + ")^T";
}

// Régi, egy soros mátrix – ha kell még valahova
function formatMatrixInline(matrix) {
  const rows = matrix.map((row) => "[" + row.join(", ") + "]");
  return "[ " + rows.join("; ") + " ]";
}

// ÚJ: több soros, „LaTeX-szerű” mátrix karakterekből
function formatMatrixPretty(name, matrix) {
  const strRows = matrix.map((row) => row.map((x) => x.toString()));
  let maxLen = 0;

  strRows.forEach((row) => {
    row.forEach((s) => {
      if (s.length > maxLen) maxLen = s.length;
    });
  });

  const pad = (s) => s.toString().padStart(maxLen, " ");
  const rowToLine = (row) => "[ " + row.map(pad).join("  ") + " ]";
  const prefix = name ? name + " = " : "";

  const lines = strRows.map((row, idx) => {
    const left = idx === 0 ? prefix : " ".repeat(prefix.length);
    return left + rowToLine(row);
  });

  return lines.join("\n");
}

// Vektor oszlopvektorként, mátrix-formában
function formatVectorPretty(name, vec) {
  const matrix = vec.map((v) => [v]);
  return formatMatrixPretty(name, matrix);
}

// ------- Feladattípus-generátorok -------

function generateLinearSystemTask(idx, size, difficulty) {
  const A = generateInvertibleMatrix(size, difficulty);
  const solutionVec = [];
  const baseRange = intRangeForDifficulty(difficulty);
  for (let i = 0; i < size; i++) {
    solutionVec.push(randInt(-baseRange, baseRange));
  }

  // b = A * x
  const b = [];
  for (let i = 0; i < size; i++) {
    let sum = 0;
    for (let j = 0; j < size; j++) {
      sum += A[i][j] * solutionVec[j];
    }
    b.push(sum);
  }

  const taskText =
    `${idx}. feladat (lineáris egyenletrendszer)\n` +
    `Oldja meg az alábbi ${size} ismeretlenes lineáris egyenletrendszert ` +
    `Gauss-eliminációval (pivotálással)!\n\n` +
    `A · x = b,\n` +
    `ahol\n` +
    `${formatMatrixPretty("A", A)}\n` +
    `${formatVectorPretty("b", b)}\n\n`;

  const solutionText =
    `${idx}. feladat megoldása\n` +
    `Egy lehetséges lépésmenet pivotálásos Gauss-eliminációval adódik.\n` +
    `A számolás eredményeként:\n` +
    `x = ${formatVector(solutionVec)}\n\n`;

  return { taskText, solutionText };
}

function generateDeterminantTask(idx, size, difficulty) {
  const A = generateRandomMatrix(size, difficulty);
  const det = determinant(A);

  const taskText =
    `${idx}. feladat (determináns)\n` +
    `Számítsa ki az alábbi ${size}×${size} mátrix determinánsát!\n\n` +
    `${formatMatrixPretty("A", A)}\n\n`;

  const solutionText =
    `${idx}. feladat megoldása\n` +
    `det(A) = ${det}\n\n`;

  return { taskText, solutionText };
}

function generateInverseTask(idx, size, difficulty) {
  const A = generateInvertibleMatrix(size, difficulty);
  const inv = inverseMatrix(A);

  const taskText =
    `${idx}. feladat (mátrixinverz)\n` +
    `Határozza meg az alábbi ${size}×${size} mátrix inverzét!\n\n` +
    `${formatMatrixPretty("A", A)}\n\n`;

  let solutionText =
    `${idx}. feladat megoldása\n` +
    `A Gauss–Jordan-elimináció során az [A | I] mátrixból [I | A⁻¹] adódik.\n`;
  if (inv) {
    const rounded = inv.map((row) => row.map((x) => +x.toFixed(2)));
    solutionText +=
      `Az eredmény:\n` +
      `${formatMatrixPretty("A^-1", rounded)}\n\n`;
  } else {
    solutionText += `A mátrix szinguláris, így nincs inverze.\n\n`;
  }

  return { taskText, solutionText };
}

function generateRankTask(idx, size, difficulty) {
  const A = generateRandomMatrix(size, difficulty);
  const r = rankOfMatrix(A);

  const taskText =
    `${idx}. feladat (rang)\n` +
    `Határozza meg az alábbi ${size}×${size} mátrix rangját!\n\n` +
    `${formatMatrixPretty("A", A)}\n\n`;

  const solutionText =
    `${idx}. feladat megoldása\n` +
    `Pivotálásos Gauss-eliminációval sorredukált alakba visszük A-t.\n` +
    `A nemnulla sorok száma a rang:\n` +
    `rang(A) = ${r}\n\n`;

  return { taskText, solutionText };
}

// ------- ZH teljes generálása -------

function generateZhFromForm(options) {
  const { size, difficulty, numLinear, numDet, numInv, numRank } = options;

  let idx = 1;
  let tasks = "";
  let solutions = "";

  for (let i = 0; i < numLinear; i++, idx++) {
    const { taskText, solutionText } = generateLinearSystemTask(
      idx,
      size,
      difficulty
    );
    tasks += taskText;
    solutions += solutionText;
  }

  for (let i = 0; i < numDet; i++, idx++) {
    const { taskText, solutionText } = generateDeterminantTask(
      idx,
      size,
      difficulty
    );
    tasks += taskText;
    solutions += solutionText;
  }

  for (let i = 0; i < numInv; i++, idx++) {
    const { taskText, solutionText } = generateInverseTask(
      idx,
      size,
      difficulty
    );
    tasks += taskText;
    solutions += solutionText;
  }

  for (let i = 0; i < numRank; i++, idx++) {
    const { taskText, solutionText } = generateRankTask(
      idx,
      size,
      difficulty
    );
    tasks += taskText;
    solutions += solutionText;
  }

  if (!tasks) {
    tasks =
      "Nem lett kiválasztva egyetlen feladattípus sem. " +
      "Adj meg legalább egy darabszámot a generáláshoz.\n";
    solutions = "Nincs megoldókulcs, mert nincs generált feladat.\n";
  }

  return { tasks, solutions };
}

function updateZhOutputs(tasks, solutions) {
  const tasksEl = document.getElementById("zhTasksOutput");
  const solEl = document.getElementById("zhSolutionsOutput");
  if (tasksEl) tasksEl.textContent = tasks;
  if (solEl) solEl.textContent = solutions;

  lastZhTasksText = tasks;
  lastZhSolutionsText = solutions;

  // PDF gombok engedélyezése
  const btnZh = document.getElementById("btn-download-zh");
  const btnSol = document.getElementById("btn-download-solutions");
  if (btnZh) btnZh.disabled = false;
  if (btnSol) btnSol.disabled = false;
}

// ------- PDF generálás jsPDF-vel -------

function downloadPdf(type) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("A PDF generáláshoz szükséges jsPDF könyvtár nem érhető el.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const isZh = type === "zh";
  const title = isZh ? "ZH feladatsor" : "Megoldókulcs";
  const text = isZh ? lastZhTasksText : lastZhSolutionsText;

  doc.setFont("Courier", "Normal"); // monospaced, hogy a mátrix szépen álljon
  doc.setFontSize(14);
  doc.text(`Pivot Point – ${title}`, 10, 15);

  doc.setFontSize(11);
  const marginLeft = 10;
  const maxWidth = 190 - marginLeft;
  const lines = doc.splitTextToSize(text, maxWidth);

  let y = 25;
  const lineHeight = 6;

  lines.forEach((line) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, marginLeft, y);
    y += lineHeight;
  });

  const filename = isZh ? "zh_feladatlap.pdf" : "zh_megoldokulcs.pdf";
  doc.save(filename);
}

// ------- Eseménykezelők -------

document.addEventListener("DOMContentLoaded", () => {
  const btnGenerate = document.getElementById("btn-generate-zh");
  const btnZh = document.getElementById("btn-download-zh");
  const btnSol = document.getElementById("btn-download-solutions");

  if (btnGenerate) {
    btnGenerate.addEventListener("click", () => {
      const size = parseInt(
        document.getElementById("matrix-size").value,
        10
      );
      const difficulty = document.getElementById("difficulty").value;

      const numLinear = parseInt(
        document.getElementById("num-linear").value || "0",
        10
      );
      const numDet = parseInt(
        document.getElementById("num-det").value || "0",
        10
      );
      const numInv = parseInt(
        document.getElementById("num-inv").value || "0",
        10
      );
      const numRank = parseInt(
        document.getElementById("num-rank").value || "0",
        10
      );

      const { tasks, solutions } = generateZhFromForm({
        size,
        difficulty,
        numLinear,
        numDet,
        numInv,
        numRank,
      });

      updateZhOutputs(tasks, solutions);
    });
  }

  if (btnZh) {
    btnZh.addEventListener("click", () => downloadPdf("zh"));
  }
  if (btnSol) {
    btnSol.addEventListener("click", () => downloadPdf("solutions"));
  }
});
