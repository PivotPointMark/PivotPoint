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

function countExactValue(A, val) {
  let count = 0;
  for(let r=0; r<3; r++){
    for(let c=0; c<3; c++){
       if (Math.abs(A[r][c] - val) < 1e-9) count++;
    }
  }
  return count;
}

// ======================
// PIVOTÁLÁS LOGIKA (Globális keresés, kötetlen sorrend)
// ======================

/**
 * Megkeresi a legjobb pivotot (1 vagy -1) a TELJES mátrixban,
 * de csak olyan sorban és oszlopban, ami még nincs "kész" (nincs a halmazokban).
 */
function findBestPivotGlobal(A, usedRows, solvedCols) {
    const n = A.length;
    let candidates = [];

    for (let r = 0; r < n; r++) {
        if (usedRows.has(r)) continue; // Ez a sor már foglalt

        for (let c = 0; c < n; c++) {
            if (solvedCols.has(c)) continue; // Ez az oszlop már kész

            const val = A[r][c];
            if (Math.abs(val) > 1e-9) {
                 candidates.push({ row: r, col: c, val: val, abs: Math.abs(val) });
            }
        }
    }

    if (candidates.length === 0) return null;

    // 1. Prioritás: 1 vagy -1
    for (let cand of candidates) {
        if (Math.abs(cand.abs - 1) < 1e-9) {
            return cand; 
        }
    }

    // 2. Prioritás: Legkisebb abszolút érték
    candidates.sort((a, b) => a.abs - b.abs);
    return candidates[0];
}

function buildPivotSolutionStepsLatex(Aorig) {
  let A = cloneMatrix(Aorig);
  const n = A.length;
  const steps = [];
  
  const usedRows = new Set();   // Melyik sorban volt már pivot
  const solvedCols = new Set(); // Melyik oszlopot oldottuk már meg
  const rowMapping = [];        // rowMapping[col] = melyik sorban van a pivotja

  // 3 lépés (mert 3x3)
  for (let step = 0; step < n; step++) {
      
      // Keresés bárhol a maradék mátrixban
      const pivotObj = findBestPivotGlobal(A, usedRows, solvedCols);
      
      if (!pivotObj) return "\\text{A mátrix szinguláris.}";

      const pRow = pivotObj.row;
      const pCol = pivotObj.col;

      // Regisztráljuk
      usedRows.add(pRow);
      solvedCols.add(pCol);
      rowMapping[pCol] = pRow;

      // 1. Állapot: Pivot kijelölése
      // A leírásban jelezzük, melyik oszlopot célozzuk
      steps.push({
          latex: matrixToLatexWithPivot(A, pRow, pCol),
          desc: `\\text{Pivot: } a_{${pRow+1},${pCol+1}}`
      });

      const pivotVal = A[pRow][pCol];

      // 2. Normálás
      for (let j = 0; j < n; j++) {
          A[pRow][j] /= pivotVal;
      }
      A[pRow][pCol] = 1; 

      // 3. Kinullázás (minden más sorban az adott oszlop mentén)
      for (let r = 0; r < n; r++) {
          if (r === pRow) continue; 

          const factor = A[r][pCol];
          if (Math.abs(factor) < 1e-9) continue;

          for (let c = 0; c < n; c++) {
              A[r][c] -= factor * A[pRow][c];
          }
          A[r][pCol] = 0;
      }
  }

  // --- VÉGSŐ RENDEZÉS DETEKTÁLÁSA ---
  let needsSwap = false;
  for(let k=0; k<n; k++) {
      if (rowMapping[k] !== k) {
          needsSwap = true;
      }
  }

  // Utolsó számított állapot
  steps.push({
      latex: matrixToLatex(A),
      isPreFinal: true
  });

  if (needsSwap) {
      // Végső állapot (Tiszta I)
      let finalI = [
          [1,0,0], [0,1,0], [0,0,1]
      ];
      steps.push({
          latex: matrixToLatex(finalI),
          isFinal: true,
          swapText: "\\text{Sorok rendezése}"
      });
  } else {
      steps[steps.length-1].isFinal = true;
  }

  // --- OUTPUT GENERÁLÁS ---
  let latexOutput = `\\begin{aligned}\n`;

  for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      if (i === 0) {
          latexOutput += `A^{(0)} &= ${step.latex} \\\\[6pt]\n`;
      } 
      else if (step.isFinal) {
          if (step.swapText) {
             latexOutput += `\\xrightarrow{\\text{rendezés}} \\quad & ${step.latex}\n`;
          } else {
             latexOutput += `\\rightarrow \\quad & ${step.latex}\n`;
          }
      }
      else {
          latexOutput += `\\rightarrow \\quad & ${step.latex} \\\\[6pt]\n`;
      }
  }
  
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
    const iterations = randInt(12, 22); 
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

/**
 * SZIMULÁCIÓ (Globális): 
 * Ellenőrzi, hogy a mátrix megoldható-e egész számokkal, 
 * ha BÁRMELYIK oszlopban kezdhetünk, ahol +/- 1 van.
 */
function canBeSolvedWithIntegersGlobal(Aorig) {
    let A = cloneMatrix(Aorig);
    let usedRows = new Set();
    let solvedCols = new Set();
    const n = 3;

    // 3 lépés
    for (let step = 0; step < n; step++) {
        // Keressünk +/- 1 pivotot bárhol a maradékban
        let foundPivot = null;

        // "Okos" keresés: először 1/-1-et keresünk
        for (let r = 0; r < n; r++) {
            if (usedRows.has(r)) continue;
            for (let c = 0; c < n; c++) {
                if (solvedCols.has(c)) continue;
                
                if (Math.abs(Math.abs(A[r][c]) - 1) < 1e-9) {
                    foundPivot = {r, c};
                    break; 
                }
            }
            if (foundPivot) break;
        }

        // Ha nem találtunk 1-est sehol a szabad helyeken, akkor ez nem jó mátrix
        // (mert törtek jönnének)
        if (!foundPivot) return false;

        const pRow = foundPivot.r;
        const pCol = foundPivot.c;

        usedRows.add(pRow);
        solvedCols.add(pCol);
        
        // Elimináció szimulálása (fontos, mert a többi elem változik!)
        let pivotVal = A[pRow][pCol]; // +/- 1
        
        // Normálás
        for(let j=0; j<n; j++) A[pRow][j] /= pivotVal;
        A[pRow][pCol] = 1;

        // Kinullázás
        for(let r=0; r<n; r++) {
            if (r !== pRow) {
                let f = A[r][pCol];
                if (Math.abs(f) > 1e-9) {
                    for(let c=0; c<n; c++) A[r][c] -= f * A[pRow][c];
                }
            }
        }
    }
    return true;
}


// 1. Pivotálás feladat generátor
function generatePivotMatrix3x3() {
  let attempts = 0;
  
  while (attempts < 20000) {
    attempts++;
    
    let A = generateComplexIntegerMatrix();

    const zeroCount = countExactValue(A, 0);
    const oneCount = countExactValue(A, 1);
    const minusOneCount = countExactValue(A, -1);

    if (zeroCount > 1) continue;
    if (oneCount > 1) continue;
    if (minusOneCount > 1) continue;

    let maxVal = 0;
    A.flat().forEach(x => maxVal = Math.max(maxVal, Math.abs(x)));
    if (maxVal < 4 || maxVal > 30) continue;

    // A frissített, "globális" szimulációt használjuk
    if (!canBeSolvedWithIntegersGlobal(A)) continue;

    return A;
  }
  
  return [[1, 2, 5], [2, 5, 12], [1, 3, 4]]; 
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

  // 1. Pivotálás
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