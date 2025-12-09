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
// ZH GENERÁTOR – pivotálás + mátrixinverz
// ======================

let hasGeneratedZh = false;

// Véletlen egész [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Szám formázása LaTeX-hez: egész marad egész, különben max. 2 tizedes
function formatLatexNumber(num) {
  const roundedInt = Math.round(num);
  if (Math.abs(num - roundedInt) < 1e-10) {
    return String(roundedInt);
  }
  const rounded2 = Math.round(num * 100) / 100;
  return String(rounded2);
}

// 3×3 determináns (ellenőrzéshez – itt elvileg mindig ±1 lesz)
function det3(A) {
  const a = A[0][0], b = A[0][1], c = A[0][2];
  const d = A[1][0], e = A[1][1], f = A[1][2];
  const g = A[2][0], h = A[2][1], i = A[2][2];
  return (
    a * (e * i - f * h) -
    b * (d * i - f * g) +
    c * (d * h - e * g)
  );
}

// Megszámoljuk, hány elem „túl egyszerű”: 0 vagy ±1
function countSimpleEntries(A) {
  let cnt = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const v = A[r][c];
      if (v === 0 || Math.abs(v) === 1) cnt++;
    }
  }
  return cnt;
}

// Van-e „nagyobb” elem is (pl. |v| >= 4)?
function hasLargeEntry(A) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (Math.abs(A[r][c]) >= 4) return true;
    }
  }
  return false;
}

// Mátrix klónozás (3×3)
function cloneMatrix3(A) {
  return A.map((row) => row.slice());
}

// Minden elem -10..10 között?
function inBoundsMinus10To10(A) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (A[r][c] < -10 || A[r][c] > 10) return false;
    }
  }
  return true;
}

/**
 * 3×3 „szép” EGÉSZ mátrix generálása úgy, ahogy tanultad:
 *  - indulunk egy felső háromszögű, 1-es átlós mátrixból,
 *  - csak olyan sor- és oszlopműveleteket használunk, amik det=±1-et tartanak:
 *      * R_i <- R_i + k R_j, C_i <- C_i + k C_j (k = -2..-1,1..2)
 *      * sorcsere, oszlopcsere
 *      * sor előjelváltás, oszlop előjelváltás
 *  - minden lépés után -10..10 tartományban maradunk,
 *  - legyen legalább egy „nagyobb” elem (|v| >= 4),
 *  - ne legyen tele 0-val és ±1-gyel (simpleCount <= 7),
 *  - determináns |det| = 1 → az inverz is EGÉSZ mátrix.
 */
function generateNiceIntMatrix3x3() {
  while (true) {
    // 1) Kiinduló felső háromszögű mátrix (det = 1)
    //    kicsi egész számokkal a felső részen, hogy legyen mit "keverni".
    let A = [
      [1, randInt(-3, 3), randInt(-3, 3)],
      [0, 1, randInt(-3, 3)],
      [0, 0, 1],
    ];

    // 2) 3–7 db unimoduláris sor/oszlop művelet
    const numOps = randInt(3, 7);
    let appliedOps = 0;
    let attempts = 0;
    const maxAttempts = numOps * 15;

    const ks = [-2, -1, 1, 2]; // k a sor/oszlophozzáadáshoz

    while (appliedOps < numOps && attempts < maxAttempts) {
      attempts++;
      const opType = randInt(0, 5);
      let B = cloneMatrix3(A);

      if (opType === 0) {
        // Sorhozzáadás: R_i <- R_i + k R_j
        const i = randInt(0, 2);
        let j = randInt(0, 2);
        while (j === i) j = randInt(0, 2);
        const k = ks[randInt(0, ks.length - 1)];
        for (let c = 0; c < 3; c++) {
          B[i][c] += k * B[j][c];
        }
      } else if (opType === 1) {
        // Oszlophozzáadás: C_i <- C_i + k C_j
        const i = randInt(0, 2);
        let j = randInt(0, 2);
        while (j === i) j = randInt(0, 2);
        const k = ks[randInt(0, ks.length - 1)];
        for (let r = 0; r < 3; r++) {
          B[r][i] += k * B[r][j];
        }
      } else if (opType === 2) {
        // Sorcsere
        const i = randInt(0, 2);
        let j = randInt(0, 2);
        while (j === i) j = randInt(0, 2);
        const tmp = B[i];
        B[i] = B[j];
        B[j] = tmp;
      } else if (opType === 3) {
        // Oszlopcsere
        const i = randInt(0, 2);
        let j = randInt(0, 2);
        while (j === i) j = randInt(0, 2);
        for (let r = 0; r < 3; r++) {
          const tmp = B[r][i];
          B[r][i] = B[r][j];
          B[r][j] = tmp;
        }
      } else if (opType === 4) {
        // Sor előjelváltás: R_i <- -R_i
        const i = randInt(0, 2);
        for (let c = 0; c < 3; c++) {
          B[i][c] *= -1;
        }
      } else if (opType === 5) {
        // Oszlop előjelváltás: C_i <- -C_i
        const i = randInt(0, 2);
        for (let r = 0; r < 3; r++) {
          B[r][i] *= -1;
        }
      }

      // Ha kilógna a -10..10 tartományból, dobjuk ezt a lépést
      if (!inBoundsMinus10To10(B)) {
        continue;
      }

      // Egyébként elfogadjuk az új mátrixot
      A = B;
      appliedOps++;
    }

    // Ha nem sikerült elég műveletet alkalmazni, próbáljuk újra az egészet
    if (appliedOps < 3) {
      continue;
    }

    // Ellenőrzések:
    const d = det3(A);
    if (Math.abs(d) !== 1) {
      // Elvileg nem történhet meg, de biztos ami biztos
      continue;
    }

    const simpleCount = countSimpleEntries(A);
    // 9 elem van összesen; 3 db biztosan 1 a diagonálison.
    // Ha simpleCount <= 7, akkor legalább 2 elem "komolyabb".
    if (simpleCount > 7) {
      continue;
    }

    if (!hasLargeEntry(A)) {
      // legyen benne legalább egy nagyobb elem (|v| >= 4)
      continue;
    }

    return A;
  }
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
    // Pivot választás (részleges pivotálás)
    let pivotRow = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > Math.abs(M[pivotRow][i])) {
        pivotRow = r;
      }
    }
    if (Math.abs(M[pivotRow][i]) < 1e-10) {
      return null; // szinguláris – itt elvileg nem fordul elő
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

// LaTeX-es mátrix (pmatrix) – formázott számokkal
function matrixToLatex(A) {
  const rows = A
    .map((row) => row.map((x) => formatLatexNumber(x)).join(" & "))
    .join(" \\\\ ");
  return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
}

/**
 * ZH-fejléc HTML (Miskolci Egyetem, dátum, név, neptun stb.)
 * Minden ZH-változat elejére bekerül.
 */
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
 * Egy teljes ZH-változat generálása:
 *  - ugyanarra a véletlen A-ra dolgozunk (unimoduláris, így az inverz EGÉSZ),
 *  - 1. feladat: pivotálás (A → I3),
 *  - 2. feladat: mátrixinverz (ugyanarra az A-ra),
 *  - megoldókulcsban a végeredmény (I3 és A⁻¹).
 */
function generateExamVariant(variantIndex) {
  const A = generateNiceIntMatrix3x3();
  const invRaw = inverseMatrix(A);

  // elvileg mindig invertálható, de ha mégsem, generáljunk újat
  if (!invRaw) {
    return generateExamVariant(variantIndex);
  }

  // Az inverz elvileg EGÉSZ, a numerikus hibát kerekítjük
  const invInt = invRaw.map((row) => row.map((x) => Math.round(x)));

  const A_latex = matrixToLatex(A);
  const invLatex = matrixToLatex(invInt);
  const headerHtml = getExamHeaderHtml(variantIndex);

  return `
    <div class="zh-pair">
      ${headerHtml}

      <div class="zh-task">
        <p><strong>1. feladat (pivotálás)</strong></p>
        <p>
          Végezze el az alábbi mátrixon a Gauss–Jordan-eliminációt részleges pivotálással
          úgy, hogy az $A$ mátrixból egységmátrix keletkezzen! Írja fel a sorátalakítások lépéseit.
        </p>
        <p>$$A = ${A_latex}$$</p>
      </div>

      <div class="zh-solution">
        <p><strong>1. feladat megoldása</strong></p>
        <p>A Gauss–Jordan-elimináció végén a bal oldalon az egységmátrix adódik:</p>
        <p>
          $$I_3 = \\begin{pmatrix}
          1 & 0 & 0\\\\
          0 & 1 & 0\\\\
          0 & 0 & 1
          \\end{pmatrix}.$$
        </p>
      </div>

      <div class="zh-task">
        <p><strong>2. feladat (mátrixinverz)</strong></p>
        <p>Határozza meg az $A$ mátrix inverzét Gauss–Jordan-eliminációval!</p>
        <p>$$A = ${A_latex}$$</p>
      </div>

      <div class="zh-solution">
        <p><strong>2. feladat megoldása</strong></p>
        <p>
          A Gauss–Jordan-elimináció során az $[A \\mid I]$ mátrixból
          $[I \\mid A^{-1}]$ adódik. Az így kapott inverz (egész elemekkel):
        </p>
        <p>$$A^{-1} = ${invLatex}$$</p>
      </div>
    </div>
  `;
}

/**
 * ZH-változatok száma az inputból.
 */
function getTaskCountFromInput() {
  const input = document.getElementById("task-count");
  if (!input) return 1;

  let n = parseInt(input.value, 10);
  if (isNaN(n) || n <= 0) n = 1;
  if (n > 30) n = 30;

  input.value = n;
  return n;
}

/**
 * Több ZH-változat generálása egymás után.
 */
function generateFullExam(count) {
  let html = "";
  for (let i = 1; i <= count; i++) {
    html += generateExamVariant(i);
  }
  return html;
}

// Kimenet frissítése a DOM-ban
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

  // új generáláskor alapból csak feladatnézet legyen
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

// Megoldókulcs megjelenítése/elrejtése (csak WEB)
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

// Print mód beállítása
function setPrintMode(modeClass) {
  document.body.classList.remove("print-mode-tasks", "print-mode-all");
  if (modeClass) {
    document.body.classList.add(modeClass);
  }
}

// Belső: PDF generálás (böngésző print + Mentés PDF-be)
function printWithMode(modeClass) {
  if (!hasGeneratedZh) {
    alert("Előbb generálj egy feladatsort!");
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

// Webes gomb: feladatsor generálása (N ZH-változat)
function handleGenerateClick() {
  const count = getTaskCountFromInput();
  const html = generateFullExam(count);
  updateZhOutput(html);
}

// Csak feladatok PDF
function handlePrintTasksClick() {
  const count = getTaskCountFromInput();
  const html = generateFullExam(count);
  updateZhOutput(html);
  printWithMode("print-mode-tasks");
}

// Feladat + megoldás PDF
function handlePrintAllClick() {
  const count = getTaskCountFromInput();
  const html = generateFullExam(count);
  updateZhOutput(html);
  printWithMode("print-mode-all");
}

// Eseménykezelők
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
