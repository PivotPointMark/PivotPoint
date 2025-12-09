// tasks.js

// ======================
// SEGÉDFÜGGVÉNYEK
// ======================

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatLatexNumber(num) {
  const roundedInt = Math.round(num);
  if (Math.abs(num - roundedInt) < 1e-9) {
    return String(roundedInt);
  }
  const rounded2 = Math.round(num * 100) / 100;
  return String(rounded2);
}

function cloneMatrix(A) {
  return A.map((row) => row.slice());
}

function matrixToLatex(A) {
  const rows = A
    .map((row) => row.map((x) => formatLatexNumber(x)).join(" & "))
    .join(" \\\\ ");
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

function matrixToLatexWithPivot(A, pivotRow, pivotCol) {
  const rows = A.map((row, r) =>
    row
      .map((x, c) => {
        const val = formatLatexNumber(x);
        if (r === pivotRow && c === pivotCol) {
          return `\\style{color:red}{${val}}`;
        }
        return val;
      })
      .join(" & ")
  ).join(" \\\\ ");

  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

function vectorToLatex(v) {
  const rows = v.map((x) => formatLatexNumber(x)).join(" \\\\ ");
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

function det3x3(A) {
  const [a, b, c] = A[0];
  const [d, e, f] = A[1];
  const [g, h, i] = A[2];
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

// ======================
// PIVOTÁLÁS LOGIKA
// ======================

function getPreferredPivotRow(A, colIndex) {
  const n = A.length;
  let candidates = [];

  for (let r = colIndex; r < n; r++) {
    const val = A[r][colIndex];
    if (Math.abs(val) > 1e-9) { 
      candidates.push({ row: r, val: val, abs: Math.abs(val) });
    }
  }

  if (candidates.length === 0) return -1;

  for (let cand of candidates) {
    if (Math.abs(cand.abs - 1) < 1e-9) {
      return cand.row; 
    }
  }

  candidates.sort((a, b) => a.abs - b.abs);
  return candidates[0].row;
}

function buildPivotSolutionStepsLatex(Aorig) {
  let A = cloneMatrix(Aorig);
  const n = A.length;
  const steps = [];
  const swaps = [];

  for (let col = 0; col < n; col++) {
    // 1. Pivot keresés
    const pivotRowIndex = getPreferredPivotRow(A, col);
    if (pivotRowIndex === -1) return "\\text{Szinguláris mátrix.}";

    // Mentés pivot jelöléssel
    steps.push({
      latex: matrixToLatexWithPivot(A, pivotRowIndex, col),
      desc: `A^${col > 0 ? "(" + col + ")" : ""}`
    });

    // 2. Sorcsere
    if (pivotRowIndex !== col) {
      let tmp = A[col];
      A[col] = A[pivotRowIndex];
      A[pivotRowIndex] = tmp;
      // Szebb formátum: "2. <-> 3. sor"
      swaps.push(`\\text{${col + 1}. sor} \\leftrightarrow \\text{${pivotRowIndex + 1}. sor}`);
    }

    const pivotVal = A[col][col];

    // 3. Normálás
    for (let j = 0; j < n; j++) {
      A[col][j] /= pivotVal;
    }
    A[col][col] = 1;

    // 4. Kinullázás
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = A[r][col];
      if (Math.abs(factor) < 1e-9) continue;
      for (let c = 0; c < n; c++) {
        A[r][c] -= factor * A[col][c];
      }
      A[r][col] = 0;
    }
  }

  // Végső állapot
  steps.push({
    latex: matrixToLatex(A),
    desc: `A^{(3)} = I`
  });

  // --- Output Generálás (Javított elrendezés) ---
  let latexOutput = `\\begin{aligned}\n`;

  // Minden lépés az utolsó kivételével
  for (let i = 0; i < steps.length - 1; i++) {
      const step = steps[i];
      if (i === 0) {
          latexOutput += `A^{(0)} &= ${step.latex} \\\\[6pt]\n`;
      } else {
          latexOutput += `\\rightarrow \\quad & ${step.latex} \\\\[6pt]\n`;
      }
  }

  // ITT JÖN A SORCSERE SZÖVEG (ha van)
  if (swaps.length > 0) {
      // Egy "üres" sorba írjuk a szöveget, hogy az utolsó előtti mátrix ALÁ kerüljön
      latexOutput += `& \\text{Végrehajtott sorcserék: } ${swaps.join(", ")} \\\\[6pt]\n`;
  }

  // Végül az utolsó mátrix (Egységmátrix)
  const finalStep = steps[steps.length - 1];
  latexOutput += `\\rightarrow \\quad & ${finalStep.latex}\n`;

  latexOutput += `\\end{aligned}`;

  return latexOutput;
}

// ======================
// GENERÁTOROK
// ======================

function generateComplexIntegerMatrix() {
    let A = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
    const iterations = randInt(8, 15); 
    for (let i = 0; i < iterations; i++) {
      const r1 = randInt(0, 2);
      const r2 = randInt(0, 2);
      if (r1 === r2) continue;
      let k = randInt(-3, 3);
      if (k === 0) k = 1; 
      for (let c = 0; c < 3; c++) {
        A[r1][c] += k * A[r2][c];
      }
    }
    return A;
}

// 1. Pivotálás feladat generátor
function generatePivotMatrix3x3() {
  while (true) {
    let A = generateComplexIntegerMatrix();
    const col1Vals = [Math.abs(A[0][0]), Math.abs(A[1][0]), Math.abs(A[2][0])];
    const hasOneInCol1 = col1Vals.some(v => Math.abs(v - 1) < 0.1);
    if (!hasOneInCol1) continue;

    let zeroCount = 0;
    let maxVal = 0;
    for(let r=0; r<3; r++){
        for(let c=0; c<3; c++){
            if(Math.abs(A[r][c]) < 0.1) zeroCount++;
            if(Math.abs(A[r][c]) > maxVal) maxVal = Math.abs(A[r][c]);
        }
    }
    if (zeroCount > 2) continue;
    if (maxVal < 5 || maxVal > 25) continue;
    return A;
  }
}

// 2. Inverz feladat generátor
function generateInverseTaskMatrix3x3() {
    while(true) {
        let A = generateComplexIntegerMatrix();
        let maxVal = 0;
        A.flat().forEach(x => maxVal = Math.max(maxVal, Math.abs(x)));
        if (maxVal < 4 || maxVal > 30) continue;
        return A;
    }
}

function calculateInverse(A) {
    const n = A.length;
    let M = A.map((row, i) => {
        let rowI = Array(n).fill(0);
        rowI[i] = 1;
        return [...row, ...rowI];
    });

    for (let i = 0; i < n; i++) {
        let pivot = M[i][i];
        if (Math.abs(pivot) < 1e-9) {
             let swapRow = -1;
             for(let r=i+1; r<n; r++) {
                 if(Math.abs(M[r][i]) > 1e-9) { swapRow = r; break; }
             }
             if(swapRow === -1) return null;
             [M[i], M[swapRow]] = [M[swapRow], M[i]];
             pivot = M[i][i];
        }
        for(let c=0; c<2*n; c++) M[i][c] /= pivot;
        for(let r=0; r<n; r++) {
            if (r !== i) {
                let factor = M[r][i];
                for(let c=0; c<2*n; c++) M[r][c] -= factor * M[i][c];
            }
        }
    }
    return M.map(row => row.slice(n));
}

function generateExamPair3x3() {
    let A, Ainv;
    while(true) {
        A = generateInverseTaskMatrix3x3();
        Ainv = calculateInverse(A);
        if (Ainv) break;
    }
    return { taskMatrix: A, solutionMatrix: Ainv };
}

// 3. Determináns
function generateDeterminantMatrix3x3() {
  while (true) {
    const A = [
      [randInt(-6, 6), randInt(-6, 6), randInt(-6, 6)],
      [randInt(-6, 6), randInt(-6, 6), randInt(-6, 6)],
      [randInt(-6, 6), randInt(-6, 6), randInt(-6, 6)]
    ];
    const d = det3x3(A);
    if (d !== 0 && Math.abs(d) < 80) return { matrix: A, determinant: d };
  }
}

// 4. Egyenletrendszer
function generateSystemTask3x3() {
  const { taskMatrix: A } = generateExamPair3x3();
  const x = [randInt(-4, 4), randInt(-4, 4), randInt(-4, 4)];
  const b = [0, 0, 0];
  for(let r=0; r<3; r++) {
      for(let c=0; c<3; c++) {
          b[r] += A[r][c] * x[c];
      }
  }
  return { A, b, x };
}

// ======================
// HTML GENERÁLÁS
// ======================

function getExamHeaderHtml(variantIndex) {
  const year = new Date().getFullYear();
  return `
    <div class="zh-exam-header">
      <div class="zh-exam-header-row">
        <div>
          <div>Miskolci Egyetem</div>
          <div>Alkalmazott Matematikai Tanszék</div>
        </div>
        <div class="zh-exam-header-right">
          <div>Miskolc, ${year}. ................</div>
          <div>Név: ................................................</div>
          <div>Neptun kód: ...............................</div>
        </div>
      </div>
      <div class="zh-exam-header-center">
        Zárthelyi dolgozat
        <span class="zh-exam-subject">Lineáris Algebra</span>
        című tantárgyból
        <div>(Változat ${variantIndex})</div>
      </div>
    </div>
  `;
}

function generateExamVariant(variantIndex, types) {
  const { includePivot, includeInverse, includeDet, includeSystem } = types;
  const htmlParts = [];
  
  htmlParts.push(`<div class="zh-pair">`);
  htmlParts.push(getExamHeaderHtml(variantIndex));

  let taskCounter = 1;

  // 1. Pivotálás (CSAK CÍM + MÁTRIX)
  if (includePivot) {
    const pivotMatrix = generatePivotMatrix3x3();
    const latexM = matrixToLatex(pivotMatrix);
    const solutionLatex = buildPivotSolutionStepsLatex(pivotMatrix);

    htmlParts.push(`
      <div class="zh-task">
        <p><strong>${taskCounter}. feladat (pivotálás)</strong></p>
        <p>$$A = ${latexM}$$</p>
      </div>
      <div class="zh-solution">
        <p><strong>${taskCounter}. feladat megoldása</strong></p>
        <p>$$ ${solutionLatex} $$</p>
      </div>
    `);
    taskCounter++;
  }

  // 2. Inverz
  if (includeInverse) {
    const { taskMatrix, solutionMatrix } = generateExamPair3x3();
    htmlParts.push(`
      <div class="zh-task">
        <p><strong>${taskCounter}. feladat (mátrixinverz)</strong></p>
        <p>Határozza meg az $A$ mátrix inverzét!</p>
        <p>$$A = ${matrixToLatex(taskMatrix)}$$</p>
      </div>
      <div class="zh-solution">
        <p><strong>${taskCounter}. feladat megoldása</strong></p>
        <p>$$A^{-1} = ${matrixToLatex(solutionMatrix)}$$</p>
      </div>
    `);
    taskCounter++;
  }

  // 3. Determináns
  if (includeDet) {
    const { matrix, determinant } = generateDeterminantMatrix3x3();
    htmlParts.push(`
      <div class="zh-task">
        <p><strong>${taskCounter}. feladat (determináns)</strong></p>
        <p>Számítsa ki az alábbi mátrix determinánsát!</p>
        <p>$$A = ${matrixToLatex(matrix)}$$</p>
      </div>
      <div class="zh-solution">
        <p><strong>${taskCounter}. feladat megoldása</strong></p>
        <p>$$\\det(A) = ${formatLatexNumber(determinant)}$$</p>
      </div>
    `);
    taskCounter++;
  }

  // 4. Egyenletrendszer
  if (includeSystem) {
    const { A, b, x } = generateSystemTask3x3();
    htmlParts.push(`
      <div class="zh-task">
        <p><strong>${taskCounter}. feladat (egyenletrendszer)</strong></p>
        <p>Oldja meg az $Ax = b$ egyenletrendszert!</p>
        <p>$$A = ${matrixToLatex(A)}, \\quad b = ${vectorToLatex(b)}$$</p>
      </div>
      <div class="zh-solution">
        <p><strong>${taskCounter}. feladat megoldása</strong></p>
        <p>$$x = ${vectorToLatex(x)}$$</p>
      </div>
    `);
    taskCounter++;
  }

  htmlParts.push(`</div>`);
  return htmlParts.join("");
}