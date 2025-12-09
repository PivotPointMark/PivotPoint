// ======================
// FELADATLOGIKA – mátrixgenerálás, inverz, det, LaTeX, ZH-feladatok
// ======================

// Véletlen egész [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Nem nulla egész [min, max] között
function randNonZeroInt(min, max) {
  let k = 0;
  while (k === 0) {
    k = randInt(min, max);
  }
  return k;
}

// Szám formázása LaTeX-hez
function formatLatexNumber(num) {
  const roundedInt = Math.round(num);
  if (Math.abs(num - roundedInt) < 1e-10) {
    return String(roundedInt);
  }
  const rounded2 = Math.round(num * 100) / 100;
  return String(rounded2);
}

function formatLateNumberSafe(x) {
  return formatLatexNumber(x);
}

// 2D-mátrix klónozása
function cloneMatrix(A) {
  return A.map((row) => row.slice());
}

// LaTeX mátrix
function matrixToLatex(A) {
  const rows = A
    .map((row) => row.map((x) => formatLateNumberSafe(x)).join(" & "))
    .join(" \\\\ ");
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

// LaTeX mátrix pivot kiemeléssel (piros szám, ha van pivot)
function matrixToLatexWithPivot(A, pivotRow, pivotCol) {
  const hasPivot =
    pivotRow !== null &&
    pivotRow !== undefined &&
    pivotCol !== null &&
    pivotCol !== undefined;

  const rows = A
    .map((row, r) =>
      row
        .map((x, c) => {
          const val = formatLateNumberSafe(x);
          if (hasPivot && r === pivotRow && c === pivotCol) {
            return `\\style{color:red}{${val}}`;
          }
          return val;
        })
        .join(" & ")
    )
    .join(" \\\\ ");

  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

// Vektor -> LaTeX oszlopvektor
function vectorToLatex(v) {
  const rows = v.map((x) => formatLatexNumber(x)).join(" \\\\ ");
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

// 3×3 determináns
function det3x3(A) {
  const [a, b, c] = A[0];
  const [d, e, f] = A[1];
  const [g, h, i] = A[2];
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

// Gauss–Jordan inverz (általános)
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
    if (Math.abs(M[pivotRow][i]) < 1e-10) return null;

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

/* ========= 1) PIVOT-FELADAT – 1..10-es mátrix + vizuális lépések ========= */

/**
 * 3×3-as mátrix generálása 1 és 10 közötti egész elemekkel,
 * úgy, hogy det(A) != 0 (tehát pivotálható egységmátrixszá).
 */
function generatePivotMatrix3x3() {
  while (true) {
    const A = [
      [randInt(1, 10), randInt(1, 10), randInt(1, 10)],
      [randInt(1, 10), randInt(1, 10), randInt(1, 10)],
      [randInt(1, 10), randInt(1, 10), randInt(1, 10)]
    ];

    const d = det3x3(A);
    if (d === 0) continue; // szinguláris, dobjuk el

    return A;
  }
}

/**
 * Pivot sor kiválasztása egy adott oszlopban "diák-módra":
 * 1) a MÉG NEM pivotált sorokból (r = col..n-1) keresünk
 *    |a_{r,col}| ≈ 1-et → ha van, az első ilyet választjuk
 * 2) ha nincs ilyen, akkor ugyanebből a tartományból
 *    az abszolút értékben legkisebb nemnulla elemet
 */
function choosePivotRowStudentStyle(A, col) {
  const n = A.length;
  const EPS = 1e-10;
  const ONE_TOL = 1e-10;

  // 1) keresünk abszolút értékben 1-es (vagy -1-es) pivotot
  for (let r = col; r < n; r++) {
    const val = A[r][col];
    if (Math.abs(val) < EPS) continue;
    if (Math.abs(Math.abs(val) - 1) < ONE_TOL) {
      return r; // találtunk 1-et vagy -1-et
    }
  }

  // 2) ha nincs 1-es, keressük a legkisebb abszolút értékű nemnulla elemet
  let bestRow = -1;
  let bestAbs = Infinity;
  for (let r = col; r < n; r++) {
    const val = A[r][col];
    const abs = Math.abs(val);
    if (abs < EPS) continue;
    if (abs < bestAbs) {
      bestAbs = abs;
      bestRow = r;
    }
  }

  return bestRow; // -1, ha semmi nem volt (invertibilisnél nem fordul elő)
}

/**
 * Egy oszlop pivotálása Gauss–Jordan-módszerrel, részleges pivotálással.
 * Az A mátrixot HELYBEN módosítja.
 * col: 0, 1 vagy 2 (oszlop index).
 *
 * Osztási szabály: pivot sor / pivot elem
 * Kinullázási szabály: többi sorból levonjuk factor * pivot sort
 * (a négyszög-szabály ennek algebrai összefoglalása).
 */
function applyPivotColumn(A, col) {
  const n = A.length;

  // Pivot sor kiválasztása "diák-módra" a még nem pivotált sorokból
  let pivotRowOriginal = choosePivotRowStudentStyle(A, col);

  if (pivotRowOriginal === -1 || Math.abs(A[pivotRowOriginal][col]) < 1e-10) {
    return;
  }

  // Sorcsere: a kiválasztott pivot sor kerüljön a col-edik sorba
  if (pivotRowOriginal !== col) {
    const tmp = A[col];
    A[col] = A[pivotRowOriginal];
    A[pivotRowOriginal] = tmp;
  }

  const pivotRow = col;
  const pivotCol = col;
  const pivotVal = A[pivotRow][pivotCol];

  // --- Osztási szabály: pivot sor / pivot elem ---
  for (let j = 0; j < n; j++) {
    A[pivotRow][j] /= pivotVal;
  }

  // --- Kinullázási szabály: a pivot oszlop többi elemét 0-ra hozni ---
  for (let i = 0; i < n; i++) {
    if (i === pivotRow) continue;
    const factor = A[i][pivotCol];
    if (Math.abs(factor) < 1e-10) continue;

    for (let j = 0; j < n; j++) {
      A[i][j] -= factor * A[pivotRow][j];
    }
  }
}

/**
 * Vizuális pivot-lépések LaTeX-ben:
 * A^(0), A^(1), A^(2), A^(3) mátrixok egymás alatt,
 * az első háromban piros a választott pivot elem,
 * A^(3) már I_3, kiemelés nélkül.
 */
function buildPivotSolutionStepsLatex(Aorig) {
  const n = 3;
  let A = cloneMatrix(Aorig);

  const states = [];

  // ---- A^(0): eredeti mátrix, pivot választása ugyanazzal a szabállyal ----
  const pivotRow0 = choosePivotRowStudentStyle(A, 0);
  states.push({ matrix: cloneMatrix(A), pivotRow: pivotRow0, pivotCol: 0 });

  // ---- A^(1): 1. oszlop pivotálása után ----
  applyPivotColumn(A, 0);
  states.push({ matrix: cloneMatrix(A), pivotRow: 0, pivotCol: 0 });

  // ---- A^(2): 2. oszlop pivotálása után ----
  applyPivotColumn(A, 1);
  states.push({ matrix: cloneMatrix(A), pivotRow: 1, pivotCol: 1 });

  // ---- A^(3): 3. oszlop pivotálása után (ez már I_3) ----
  applyPivotColumn(A, 2);
  states.push({ matrix: cloneMatrix(A), pivotRow: null, pivotCol: null });

  const lines = states.map((st, idx) => {
    const M = matrixToLatexWithPivot(st.matrix, st.pivotRow, st.pivotCol);
    return `A^{(${idx})} &= ${M}`;
  });

  return `
\\begin{aligned}
${lines.join('\\\\[6pt]\n')}
\\end{aligned}
`;
}

/* ========= 2) Inverz-feladat mátrixok ========= */

function generateInverseBaseTriangular3x3() {
  while (true) {
    const a12 = randInt(-3, 3);
    const a13 = randInt(-3, 3);
    const a23 = randInt(-3, 3);

    if (a12 === 0 && a13 === 0 && a23 === 0) continue;

    return [
      [1, a12, a13],
      [0, 1, a23],
      [0, 0, 1],
    ];
  }
}

function countNonDiagonalNonZero(A) {
  let cnt = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (r !== c && A[r][c] !== 0) cnt++;
    }
  }
  return cnt;
}

function maxAbsEntry(A) {
  let m = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const v = A[r][c];
      if (Math.abs(v) > m) m = Math.abs(v);
    }
  }
  return m;
}

function generateInverseTaskMatrix3x3() {
  while (true) {
    let A = generateInverseBaseTriangular3x3();
    const steps = 3;
    const ks = [-2, -1, 1, 2];

    for (let s = 0; s < steps; s++) {
      let B = A.map((row) => row.slice());
      const opType = randInt(0, 3);

      if (opType === 0) {
        const k = ks[randInt(0, ks.length - 1)];
        for (let c = 0; c < 3; c++) B[2][c] += k * B[1][c];
      } else if (opType === 1) {
        const k = ks[randInt(0, ks.length - 1)];
        for (let c = 0; c < 3; c++) B[1][c] += k * B[0][c];
      } else if (opType === 2) {
        const k = ks[randInt(0, ks.length - 1)];
        for (let c = 0; c < 3; c++) B[2][c] += k * B[0][c];
      } else if (opType === 3) {
        const k = ks[randInt(0, ks.length - 1)];
        for (let r = 0; r < 3; r++) B[r][1] += k * B[r][0];
      }

      if (maxAbsEntry(B) > 40) continue;

      A = B;
    }

    if (countNonDiagonalNonZero(A) < 2) continue;

    return A;
  }
}

function generateExamPair3x3() {
  while (true) {
    const A = generateInverseTaskMatrix3x3();
    const AinvRaw = inverseMatrix(A);
    if (!AinvRaw) continue;

    const AinvInt = [];
    let ok = true;

    for (let r = 0; r < 3; r++) {
      AinvInt[r] = [];
      for (let c = 0; c < 3; c++) {
        const v = AinvRaw[r][c];
        const rounded = Math.round(v);
        if (Math.abs(v - rounded) > 1e-8) {
          ok = false;
          break;
        }
        AinvInt[r][c] = rounded;
      }
      if (!ok) break;
    }

    if (!ok) continue;
    return { taskMatrix: A, solutionMatrix: AinvInt };
  }
}

/* ========= 3) Determináns-feladat ========= */

function generateDeterminantMatrix3x3() {
  while (true) {
    const A = [
      [randInt(-5, 5), randInt(-5, 5), randInt(-5, 5)],
      [randInt(-5, 5), randInt(-5, 5), randInt(-5, 5)],
      [randInt(-5, 5), randInt(-5, 5), randInt(-5, 5)]
    ];

    const det = det3x3(A);
    if (det === 0) continue;
    if (Math.abs(det) > 80) continue;

    return { matrix: A, determinant: det };
  }
}

/* ========= 4) Lineáris egyenletrendszer-feladat ========= */

function multiplyMatrixVector3x3(A, x) {
  const b = [0, 0, 0];
  for (let r = 0; r < 3; r++) {
    let sum = 0;
    for (let c = 0; c < 3; c++) {
      sum += A[r][c] * x[c];
    }
    b[r] = sum;
  }
  return b;
}

function maxAbsVector3(v) {
  return Math.max(Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]));
}

function generateSystemTask3x3() {
  while (true) {
    const A = generateInverseTaskMatrix3x3();
    const x = [
      randInt(-3, 3),
      randInt(-3, 3),
      randInt(-3, 3)
    ];

    if (x[0] === 0 && x[1] === 0 && x[2] === 0) continue;

    const b = multiplyMatrixVector3x3(A, x);

    if (maxAbsVector3(b) > 60) continue;

    return { A, b, x };
  }
}

/* ========= ZH-fejléc + teljes feladat HTML ========= */

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
          <div>Miskolc, ${year}.  ................</div>
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

/**
 * Egy teljes ZH-változat HTML-je.
 * A types objektum dönti el, melyik feladatok kerülnek bele:
 *  - includePivot
 *  - includeInverse
 *  - includeDet
 *  - includeSystem
 */
function generateExamVariant(variantIndex, types) {
  const {
    includePivot,
    includeInverse,
    includeDet,
    includeSystem
  } = types;

  const htmlParts = [];
  const headerHtml = getExamHeaderHtml(variantIndex);
  htmlParts.push(`<div class="zh-pair">`);
  htmlParts.push(headerHtml);

  if (includePivot) {
    const pivotMatrix = generatePivotMatrix3x3();
    const Apivot_latex = matrixToLatex(pivotMatrix);
    const pivotSolutionLatex = buildPivotSolutionStepsLatex(pivotMatrix);

    htmlParts.push(`
      <div class="zh-task">
        <p><strong>1. feladat (pivotálás)</strong></p>
        <p>
          Végezze el az alábbi mátrixon a Gauss–Jordan-eliminációt részleges pivotálással,
          és alakítsa a mátrixot egységmátrixszá!
        </p>
        <p>$$A = ${Apivot_latex}$$</p>
      </div>

      <div class="zh-solution">
        <p><strong>1. feladat megoldása</strong></p>
        <p>$$
          ${pivotSolutionLatex}
        $$</p>
      </div>
    `);
  }

  if (includeInverse) {
    const { taskMatrix: invMatrix, solutionMatrix: invSolution } =
      generateExamPair3x3();

    const Ainv_latex = matrixToLatex(invMatrix);
    const AinvInverse_latex = matrixToLatex(invSolution);

    htmlParts.push(`
      <div class="zh-task">
        <p><strong>2. feladat (mátrixinverz)</strong></p>
        <p>Határozza meg az $A$ mátrix inverzét Gauss–Jordan-eliminációval!</p>
        <p>$$A = ${Ainv_latex}$$</p>
      </div>

      <div class="zh-solution">
        <p><strong>2. feladat megoldása</strong></p>
        <p>
          A Gauss–Jordan-elimináció során az $[A \\mid I]$ mátrixból
          $[I \\mid A^{-1}]$ adódik. Az így kapott inverz (egész elemekkel):
        </p>
        <p>$$A^{-1} = ${AinvInverse_latex}$$</p>
      </div>
    `);
  }

  if (includeDet) {
    const { matrix: detMatrix, determinant } = generateDeterminantMatrix3x3();
    const detMatrixLatex = matrixToLatex(detMatrix);
    const detValueLatex = formatLatexNumber(determinant);

    htmlParts.push(`
      <div class="zh-task">
        <p><strong>3. feladat (determináns)</strong></p>
        <p>Számítsa ki az alábbi $3\\times 3$ mátrix determinánsát!</p>
        <p>$$
          A = ${detMatrixLatex}
        $$</p>
      </div>

      <div class="zh-solution">
        <p><strong>3. feladat megoldása</strong></p>
        <p>A determináns értéke:</p>
        <p>
          $$\\det(A) = ${detValueLatex}.$$
        </p>
      </div>
    `);
  }

  if (includeSystem) {
    const { A, b, x } = generateSystemTask3x3();
    const A_latex = matrixToLatex(A);
    const b_latex = vectorToLatex(b);
    const x_latex = vectorToLatex(x);

    htmlParts.push(`
      <div class="zh-task">
        <p><strong>4. feladat (lineáris egyenletrendszer)</strong></p>
        <p>
          Oldja meg az $Ax = b$ lineáris egyenletrendszert Gauss–Jordan-eliminációval
          (pivotálással)!
        </p>
        <p>
          $$A = ${A_latex}, \\quad
          b = ${b_latex}.$$
        </p>
      </div>

      <div class="zh-solution">
        <p><strong>4. feladat megoldása</strong></p>
        <p>
          Az $Ax = b$ egyenletrendszer megoldása az alábbi vektor:
        </p>
        <p>
          $$x = ${x_latex}.$$
        </p>
        <p>
          (Ellenőrzésként $Ax = b$ teljesül.)
        </p>
      </div>
    `);
  }

  htmlParts.push(`</div>`);
  return htmlParts.join("");
}
