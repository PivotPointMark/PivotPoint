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

// LaTeX mátrix
function matrixToLatex(A) {
  const rows = A
    .map((row) => row.map((x) => formatLatexNumber(x)).join(" & "))
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

// Gauss–Jordan inverz
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

/* ========= 1) Pivot-feladat mátrixok ========= */

function generatePivotBaseMatrix3x3() {
  while (true) {
    const a12 = randInt(-3, 3);
    const a13 = randInt(-3, 3);
    const a23 = randInt(-3, 3);

    // ne legyen teljesen identitás
    if (a12 === 0 && a13 === 0 && a23 === 0) continue;

    return [
      [1, a12, a13],
      [0, 1, a23],
      [0, 0, 1],
    ];
  }
}

function generatePivotMatrix3x3() {
  while (true) {
    const S = generatePivotBaseMatrix3x3();
    const M = S.map((row) => row.slice());

    const k1 = randNonZeroInt(-3, 3);
    for (let c = 0; c < 3; c++) M[2][c] += k1 * M[1][c];

    const k2 = randNonZeroInt(-3, 3);
    for (let c = 0; c < 3; c++) M[1][c] += k2 * M[0][c];

    const k3 = randNonZeroInt(-3, 3);
    for (let c = 0; c < 3; c++) M[2][c] += k3 * M[0][c];

    let maxAbs = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const v = M[r][c];
        if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v);
      }
    }
    if (maxAbs > 40) continue;

    return M;
  }
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

// mátrix * vektor
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

// max abs egy 3-dimenziós vektorban
function maxAbsVector3(v) {
  return Math.max(Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]));
}

// Ax = b típusú feladat
function generateSystemTask3x3() {
  while (true) {
    const A = generateInverseTaskMatrix3x3(); // invertálható, "szép"
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
 * 1. pivotálás
 * 2. mátrixinverz
 * 3. determináns
 * 4. lineáris egyenletrendszer
 */
function generateExamVariant(variantIndex, includePivot, includeInverse) {
  const htmlParts = [];
  const headerHtml = getExamHeaderHtml(variantIndex);
  htmlParts.push(`<div class="zh-pair">`);
  htmlParts.push(headerHtml);

  /* ---- 1. feladat: pivotálás ---- */
  if (includePivot) {
    const pivotMatrix = generatePivotMatrix3x3();
    const Apivot_latex = matrixToLatex(pivotMatrix);

    htmlParts.push(`
      <div class="zh-task">
        <p><strong>1. feladat (pivotálás)</strong></p>
        <p>
          Végezze el az alábbi mátrixon a Gauss–Jordan-eliminációt részleges pivotálással,
          és alakítsa a mátrixot egységmátrixszá! Írja fel a sorátalakítások lépéseit.
        </p>
        <p>$$A = ${Apivot_latex}$$</p>
      </div>

      <div class="zh-solution">
        <p><strong>1. feladat megoldása</strong></p>
        <p>
          A Gauss–Jordan-elimináció végén a bal oldalon az egységmátrix adódik:
        </p>
        <p>
          $$I_3 = \\begin{pmatrix}
          1 & 0 & 0\\\\
          0 & 1 & 0\\\\
          0 & 0 & 1
          \\end{pmatrix}.$$
        </p>
        <p>
          A köztes sorátalakításokat a hallgatónak kell lépésről lépésre felírnia.
        </p>
      </div>
    `);
  }

  /* ---- 2. feladat: mátrixinverz ---- */
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

  /* ---- 3. feladat: determináns ---- */
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

  /* ---- 4. feladat: lineáris egyenletrendszer ---- */
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

  htmlParts.push(`</div>`);
  return htmlParts.join("");
}
