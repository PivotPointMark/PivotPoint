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

function formatLatexNumberParen(num) {
  const s = formatLatexNumber(num);
  return num < 0 ? `(${s})` : s;
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
// PIVOTÁLÁS LOGIKA
// ======================

function findBestPivotGlobal(A, usedRows, solvedCols) {
    const n = A.length;
    let candidates = [];

    for (let r = 0; r < n; r++) {
        if (usedRows.has(r)) continue; 
        for (let c = 0; c < n; c++) {
            if (solvedCols.has(c)) continue; 
            const val = A[r][c];
            if (Math.abs(val) > 1e-9) {
                 candidates.push({ row: r, col: c, val: val, abs: Math.abs(val) });
            }
        }
    }

    if (candidates.length === 0) return null;

    // 1. Prioritás: 1 vagy -1
    for (let cand of candidates) {
        if (Math.abs(cand.abs - 1) < 1e-9) return cand; 
    }

    // 2. Prioritás: Legkisebb abszolút érték
    candidates.sort((a, b) => a.abs - b.abs);
    return candidates[0];
}

function buildPivotSolutionStepsLatex(Aorig) {
  let A = cloneMatrix(Aorig);
  const n = A.length;
  const steps = [];
  
  const usedRows = new Set();  
  const solvedCols = new Set();
  const rowMapping = [];        

  for (let step = 0; step < n; step++) {
      const pivotObj = findBestPivotGlobal(A, usedRows, solvedCols);
      if (!pivotObj) return "\\text{A mátrix szinguláris.}";

      const pRow = pivotObj.row;
      const pCol = pivotObj.col;

      usedRows.add(pRow);
      solvedCols.add(pCol);
      rowMapping[pCol] = pRow;

      steps.push({
          latex: matrixToLatexWithPivot(A, pRow, pCol),
          desc: `\\text{Pivot: } a_{${pRow+1},${pCol+1}}`
      });

      const pivotVal = A[pRow][pCol];

      for (let j = 0; j < n; j++) A[pRow][j] /= pivotVal;
      A[pRow][pCol] = 1; 

      for (let r = 0; r < n; r++) {
          if (r === pRow) continue; 
          const factor = A[r][pCol];
          if (Math.abs(factor) < 1e-9) continue;
          for (let c = 0; c < n; c++) A[r][c] -= factor * A[pRow][c];
          A[r][pCol] = 0;
      }
  }

  let needsSwap = false;
  for(let k=0; k<n; k++) {
      if (rowMapping[k] !== k) needsSwap = true;
  }

  steps.push({
      latex: matrixToLatex(A),
      isPreFinal: true
  });

  if (needsSwap) {
      let finalI = [[1,0,0], [0,1,0], [0,0,1]];
      steps.push({
          latex: matrixToLatex(finalI),
          isFinal: true,
          swapText: "\\text{Sorok rendezése}"
      });
  } else {
      steps[steps.length-1].isFinal = true;
  }

  let latexOutput = `\\begin{aligned}\n`;
  for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (i === 0) latexOutput += `A^{(0)} &= ${step.latex} \\\\[6pt]\n`;
      else if (step.isFinal) {
          if (step.swapText) latexOutput += `\\xrightarrow{\\text{rendezés}} \\quad & ${step.latex}\n`;
          else latexOutput += `\\rightarrow \\quad & ${step.latex}\n`;
      }
      else latexOutput += `\\rightarrow \\quad & ${step.latex} \\\\[6pt]\n`;
  }
  latexOutput += `\\end{aligned}`;
  return latexOutput;
}

// ======================
// DETERMINÁNS MEGOLDÁS (2 Módszer)
// ======================

function buildDeterminantSolutionsLatex(Aorig) {
    const n = 3;
    const finalDet = det3x3(Aorig);

    // a) Klasszikus
    const a11 = Aorig[0][0], a12 = Aorig[0][1], a13 = Aorig[0][2];
    const a21 = Aorig[1][0], a22 = Aorig[1][1], a23 = Aorig[1][2];
    const a31 = Aorig[2][0], a32 = Aorig[2][1], a33 = Aorig[2][2];

    const sub1 = (a22*a33 - a23*a32);
    const sub2 = (a21*a33 - a23*a31);
    const sub3 = (a21*a32 - a22*a31);

    const classicLatex = `
      \\begin{aligned}
      \\det(A) &= ${formatLatexNumberParen(a11)} \\cdot (${formatLatexNumberParen(a22)}\\cdot${formatLatexNumberParen(a33)} - ${formatLatexNumberParen(a23)}\\cdot${formatLatexNumberParen(a32)}) \\\\
               &\\quad - ${formatLatexNumberParen(a12)} \\cdot (${formatLatexNumberParen(a21)}\\cdot${formatLatexNumberParen(a33)} - ${formatLatexNumberParen(a23)}\\cdot${formatLatexNumberParen(a31)}) \\\\
               &\\quad + ${formatLatexNumberParen(a13)} \\cdot (${formatLatexNumberParen(a21)}\\cdot${formatLatexNumberParen(a32)} - ${formatLatexNumberParen(a22)}\\cdot${formatLatexNumberParen(a31)}) \\\\[4pt]
               &= ${formatLatexNumberParen(a11)} \\cdot (${formatLatexNumber(sub1)}) - ${formatLatexNumberParen(a12)} \\cdot (${formatLatexNumber(sub2)}) + ${formatLatexNumberParen(a13)} \\cdot (${formatLatexNumber(sub3)}) \\\\[4pt]
               &= ${formatLatexNumber(finalDet)}
      \\end{aligned}
    `;

    // b) Pivot
    let A = cloneMatrix(Aorig);
    let usedRows = new Set();
    let solvedCols = new Set();
    let rowMapping = [];
    let factors = []; 
    
    for (let step = 0; step < n; step++) {
        const pivotObj = findBestPivotGlobal(A, usedRows, solvedCols);
        if (!pivotObj) break;
        const pRow = pivotObj.row;
        const pCol = pivotObj.col;
        const pivotVal = pivotObj.val;
        usedRows.add(pRow);
        solvedCols.add(pCol);
        rowMapping[pCol] = pRow;
        factors.push(pivotVal);

        for (let j = 0; j < n; j++) A[pRow][j] /= pivotVal;
        A[pRow][pCol] = 1; 

        for (let r = 0; r < n; r++) {
            if (r === pRow) continue; 
            const f = A[r][pCol];
            if (Math.abs(f) > 1e-9) {
                for (let c = 0; c < n; c++) A[r][c] -= f * A[pRow][c];
                A[r][pCol] = 0;
            }
        }
    }

    // Cserék számolása
    let perm = [];
    for(let c=0; c<n; c++) perm.push(rowMapping[c]); 
    let pCopy = [...perm];
    let swaps = 0;
    for(let i=0; i<n; i++) {
        while(pCopy[i] !== i) {
            const target = pCopy[i];
            [pCopy[target], pCopy[i]] = [pCopy[i], pCopy[target]];
            swaps++;
        }
    }

    const factorsLatex = factors.map(f => formatLatexNumberParen(f)).join(" \\cdot ");
    const pivotLatex = `
      \\begin{aligned}
      \\det(A) &= (-1)^{\\text{sorcserék}} \\cdot (\\text{pivot elemek szorzata}) \\\\
               &= (-1)^{${swaps}} \\cdot (${factorsLatex}) \\\\
               &= ${Math.pow(-1, swaps)} \\cdot (${factors.reduce((a,b)=>a*b, 1)}) \\\\
               &= ${formatLatexNumber(finalDet)}
      \\end{aligned}
    `;

    return { classic: classicLatex, pivot: pivotLatex };
}


// ======================
// GENERÁTOROK
// ======================

function generateComplexIntegerMatrix() {
    let A = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const iterations = randInt(10, 15); 
    for (let i = 0; i < iterations; i++) {
      const r1 = randInt(0, 2), r2 = randInt(0, 2);
      if (r1 === r2) continue;
      let k = randInt(-3, 3); if (k === 0) k = 1; 
      for (let c = 0; c < 3; c++) A[r1][c] += k * A[r2][c];
    }
    return A;
}

function canBeSolvedWithIntegersGlobal(Aorig) {
    let A = cloneMatrix(Aorig);
    let usedRows = new Set(), solvedCols = new Set();
    const n = 3;
    for (let step = 0; step < n; step++) {
        let foundPivot = null;
        for (let r = 0; r < n; r++) {
            if (usedRows.has(r)) continue;
            for (let c = 0; c < n; c++) {
                if (solvedCols.has(c)) continue;
                if (Math.abs(Math.abs(A[r][c]) - 1) < 1e-9) {
                    foundPivot = {r, c}; break; 
                }
            }
            if (foundPivot) break;
        }
        if (!foundPivot) return false;
        const pRow = foundPivot.r, pCol = foundPivot.c;
        usedRows.add(pRow); solvedCols.add(pCol);
        let pivotVal = A[pRow][pCol];
        for(let j=0; j<n; j++) A[pRow][j] /= pivotVal;
        A[pRow][pCol] = 1;
        for(let r=0; r<n; r++) {
            if (r !== pRow) {
                let f = A[r][pCol];
                if (Math.abs(f) > 1e-9) for(let c=0; c<n; c++) A[r][c] -= f * A[pRow][c];
            }
        }
    }
    return true;
}

// 1. Pivotálás generátor
function generatePivotMatrix3x3() {
  let attempts = 0;
  while (attempts < 20000) {
    attempts++;
    let A = generateComplexIntegerMatrix();
    const z = countExactValue(A, 0), o = countExactValue(A, 1), mo = countExactValue(A, -1);
    if (z > 1 || o > 1 || mo > 1) continue;
    let maxVal = 0; A.flat().forEach(x => maxVal = Math.max(maxVal, Math.abs(x)));
    if (maxVal < 4 || maxVal > 30) continue;
    if (!canBeSolvedWithIntegersGlobal(A)) continue;
    return A;
  }
  return [[1, 2, 5], [2, 5, 12], [1, 3, 4]]; 
}

// 2. Inverz generátor
function generateInverseTaskMatrix3x3() {
    while(true) {
        let A = generateComplexIntegerMatrix();
        let maxVal = 0; A.flat().forEach(x => maxVal = Math.max(maxVal, Math.abs(x)));
        if (maxVal < 4 || maxVal > 30) continue;
        return A;
    }
}
function calculateInverse(A) {
    const n = A.length;
    let M = A.map((row, i) => {
        let rowI = Array(n).fill(0); rowI[i] = 1; return [...row, ...rowI];
    });
    for (let i = 0; i < n; i++) {
        let pivot = M[i][i];
        if (Math.abs(pivot) < 1e-9) {
             let swapRow = -1;
             for(let r=i+1; r<n; r++) if(Math.abs(M[r][i]) > 1e-9) { swapRow = r; break; }
             if(swapRow === -1) return null;
             [M[i], M[swapRow]] = [M[swapRow], M[i]]; pivot = M[i][i];
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
    while(true) { A = generateInverseTaskMatrix3x3(); Ainv = calculateInverse(A); if (Ainv) break; }
    return { taskMatrix: A, solutionMatrix: Ainv };
}

// --- 3. DETERMINÁNS GENERÁTOR (NEHEZÍTETT) ---
function generateDeterminantMatrix3x3() {
  let attempts = 0;
  // Kicsit bátrabb próbálkozások
  while (attempts < 5000) {
    attempts++;
    
    // 1. Generálás nagyobb tartományban (-9 és 9 között)
    let A = [
      [randInt(-9, 9), randInt(-9, 9), randInt(-9, 9)],
      [randInt(-9, 9), randInt(-9, 9), randInt(-9, 9)],
      [randInt(-9, 9), randInt(-9, 9), randInt(-9, 9)]
    ];
    
    // 2. Zéró kontroll: Max 1 darab 0 lehet a mátrixban (hogy Sarrusszal dolgozni kelljen)
    const zeroCount = countExactValue(A, 0);
    if (zeroCount > 1) continue;

    const d = det3x3(A);
    
    // 3. Determináns kontroll: 
    // Ne legyen túl kicsi (trivialitás elkerülése) és ne túl nagy (számolhatóság)
    if (Math.abs(d) < 15 || Math.abs(d) > 200) continue;

    // 4. Pivotálhatóság kontroll:
    // Mivel a b) feladatrész pivotálást kér, muszáj, hogy legyen benne +/- 1,
    // különben a "pivotálásos" megoldás tele lenne csúnya törtekkel.
    if (!canBeSolvedWithIntegersGlobal(A)) continue;

    return { matrix: A, determinant: d };
  }
  return { matrix: [[2,-3,4],[1,5,-2],[3,1,7]], determinant: 135 }; 
}

// 4. Egyenletrendszer
function generateSystemTask3x3() {
  const { taskMatrix: A } = generateExamPair3x3();
  const x = [randInt(-4, 4), randInt(-4, 4), randInt(-4, 4)];
  const b = [0, 0, 0];
  for(let r=0; r<3; r++) for(let c=0; c<3; c++) b[r] += A[r][c] * x[c];
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
        <div><div>Miskolci Egyetem</div><div>Alkalmazott Matematikai Tanszék</div></div>
        <div class="zh-exam-header-right"><div>Miskolc, ${year}. ................</div><div>Név: ................................................</div><div>Neptun kód: ...............................</div></div>
      </div>
      <div class="zh-exam-header-center">Zárthelyi dolgozat<span class="zh-exam-subject">Lineáris Algebra</span>című tantárgyból<div>(Változat ${variantIndex})</div></div>
    </div>
  `;
}

function generateExamVariant(variantIndex, types) {
  const { includePivot, includeInverse, includeDet, includeSystem } = types;
  const htmlParts = [];
  htmlParts.push(`<div class="zh-pair">`);
  htmlParts.push(getExamHeaderHtml(variantIndex));

  let taskCounter = 1;

  if (includePivot) {
    const pivotMatrix = generatePivotMatrix3x3();
    const latexM = matrixToLatex(pivotMatrix);
    const solutionLatex = buildPivotSolutionStepsLatex(pivotMatrix);
    htmlParts.push(`
      <div class="zh-task"><p><strong>${taskCounter}. feladat (pivotálás)</strong></p><p>$$A = ${latexM}$$</p></div>
      <div class="zh-solution"><p><strong>${taskCounter}. feladat megoldása</strong></p><p>$$ ${solutionLatex} $$</p></div>
    `);
    taskCounter++;
  }

  if (includeInverse) {
    const { taskMatrix, solutionMatrix } = generateExamPair3x3();
    htmlParts.push(`
      <div class="zh-task"><p><strong>${taskCounter}. feladat (mátrixinverz)</strong></p><p>Határozza meg az $A$ mátrix inverzét!</p><p>$$A = ${matrixToLatex(taskMatrix)}$$</p></div>
      <div class="zh-solution"><p><strong>${taskCounter}. feladat megoldása</strong></p><p>$$A^{-1} = ${matrixToLatex(solutionMatrix)}$$</p></div>
    `);
    taskCounter++;
  }

  if (includeDet) {
    const { matrix, determinant } = generateDeterminantMatrix3x3();
    const solutions = buildDeterminantSolutionsLatex(matrix);
    
    htmlParts.push(`
      <div class="zh-task">
        <p><strong>${taskCounter}. feladat (determináns)</strong></p>
        <p>Számítsa ki az alábbi mátrix determinánsát kétféle módszerrel:
           <br>a) Klasszikus kifejtéssel (Sarrus-szabály vagy kifejtési tétel)
           <br>b) Pivotálással (felső háromszög alakra hozással)</p>
        <p>$$A = ${matrixToLatex(matrix)}$$</p>
      </div>
      <div class="zh-solution">
        <p><strong>${taskCounter}. feladat megoldása</strong></p>
        <p><strong>a) Klasszikus módszer:</strong></p>
        <p>$$ ${solutions.classic} $$</p>
        <p><strong>b) Pivotálás módszere:</strong></p>
        <p>$$ ${solutions.pivot} $$</p>
      </div>
    `);
    taskCounter++;
  }

  if (includeSystem) {
    const { A, b, x } = generateSystemTask3x3();
    htmlParts.push(`
      <div class="zh-task"><p><strong>${taskCounter}. feladat (egyenletrendszer)</strong></p><p>Oldja meg az $Ax = b$ egyenletrendszert!</p><p>$$A = ${matrixToLatex(A)}, \\quad b = ${vectorToLatex(b)}$$</p></div>
      <div class="zh-solution"><p><strong>${taskCounter}. feladat megoldása</strong></p><p>$$x = ${vectorToLatex(x)}$$</p></div>
    `);
    taskCounter++;
  }

  htmlParts.push(`</div>`);
  return htmlParts.join("");
}