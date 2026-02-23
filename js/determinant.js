document.addEventListener("DOMContentLoaded", () => {
  const sizeInput = document.getElementById("matrix-size");
  const btnCreate = document.getElementById("btn-create-grid");
  const btnFillRandom = document.getElementById("btn-fill-random");
  const btnCalc = document.getElementById("btn-calc-det");
  const inputWrapper = document.getElementById("matrix-input-wrapper");
  const gridContainer = document.getElementById("matrix-grid");
  const displayArea = document.getElementById("matrix-display-area");
  const stepsContainer = document.getElementById("calc-steps");
  const finalResultSpan = document.getElementById("final-result");

  // 1) Rács létrehozása
  btnCreate.addEventListener("click", () => {
    const n = parseInt(sizeInput.value);
    if (n < 2 || n > 4) {
      alert("A kifejtési módszer 2x2, 3x3 vagy 4x4-es mátrixra ajánlott!");
      return;
    }

    gridContainer.innerHTML = "";
    gridContainer.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

    for (let i = 0; i < n * n; i++) {
      const input = document.createElement("input");
      input.type = "number";
      input.className = "matrix-cell";
      input.value = Math.floor(Math.random() * 11);
      gridContainer.appendChild(input);
    }

    inputWrapper.classList.remove("hidden");
    displayArea.classList.add("hidden");
  });

  // 2) Véletlen kitöltés (-5..5)
  btnFillRandom.addEventListener("click", () => {
    gridContainer.querySelectorAll("input").forEach(i => {
      i.value = Math.floor(Math.random() * 11) - 5;
    });
  });

  // 3) Determináns számítás
  btnCalc.addEventListener("click", () => {
    const n = parseInt(sizeInput.value);
    const inputs = gridContainer.querySelectorAll("input");

    let matrix = [];
    let row = [];
    inputs.forEach((inp, idx) => {
      row.push(parseFloat(inp.value) || 0);
      if ((idx + 1) % n === 0) {
        matrix.push(row);
        row = [];
      }
    });

    stepsContainer.innerHTML = "<h3>Kifejtés az 1. sor szerint (minden minor teljes levezetéssel):</h3>";

    // Teljes levezetés rekurzívan
    const result = detWithSteps(matrix, stepsContainer, 0, "A");

    finalResultSpan.innerHTML = result;
    displayArea.classList.remove("hidden");

    if (window.MathJax) MathJax.typesetPromise();
  });

  // --- Segédfüggvények ---

  // Mátrix LaTeX formátum
  function mToLatex(matrix) {
    return `\\begin{pmatrix} ${matrix.map(r => r.join(" & ")).join(" \\\\ ")} \\end{pmatrix}`;
  }

  // Minor mátrix (sor/oszlop kihúzás)
  function getSubMatrix(matrix, rowToExclude, colToExclude) {
    return matrix
      .filter((_, r) => r !== rowToExclude)
      .map(row => row.filter((_, c) => c !== colToExclude));
  }

  // 2x2 determináns
  function det2x2(m) {
    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  }

  function signChar(sign) {
    return sign === 1 ? "+" : "-";
  }

  /**
   * Rekurzív determináns számítás részletes levezetéssel
   * matrix: számokból álló n×n tömb
   * container: DOM elem (ide írjuk a lépéseket)
   * level: behúzás szint a vizuális tagoláshoz
   * label: mátrix név a leírásban (A, A_1, ...)
   */
  function detWithSteps(matrix, container, level = 0, label = "A") {
    const n = matrix.length;
    const indentStyle = `margin-left:${level * 14}px`;

    // 2x2: keresztbeszorzás teljesen kiírva
    if (n === 2) {
      const a = matrix[0][0], b = matrix[0][1];
      const c = matrix[1][0], d = matrix[1][1];

      const ad = a * d;
      const bc = b * c;
      const val = ad - bc;

      container.innerHTML += `
        <div class="step-card" style="${indentStyle}">
          <strong>2×2 determináns (${label}) – keresztbeszorzás:</strong><br>
          $\\det ${mToLatex(matrix)} = (${a}\\cdot${d}) - (${b}\\cdot${c}) = ${ad} - ${bc} = ${val}$
        </div>
      `;
      return val;
    }

    // n>2: kifejtés 1. sor szerint
    container.innerHTML += `
      <div class="step-card" style="${indentStyle}">
        <strong>${n}×${n} determináns (${label}) – kifejtés az 1. sor szerint:</strong><br>
        $\\det ${mToLatex(matrix)}$<br><br>
        Első sor: $${matrix[0].join(", ")}$
      </div>
    `;

    let total = 0;
    let exprParts = [];

    for (let j = 0; j < n; j++) {
      const element = matrix[0][j];
      const sign = ((0 + j) % 2 === 0) ? 1 : -1;
      const s = signChar(sign);

      const sub = getSubMatrix(matrix, 0, j);

      container.innerHTML += `
        <div class="step-card" style="${indentStyle}">
          <strong>${j + 1}. elem:</strong> $a_{1,${j + 1}} = ${element}$<br>
          Előjel (sakktábla-szabály): <strong>${s}</strong><br><br>
          Minor (1. sor és ${j + 1}. oszlop kihúzva):<br>
          $${mToLatex(sub)}$
        </div>
      `;

      // A minor determinánsát is részletezzük!
      const subDet = detWithSteps(sub, container, level + 1, `${label}_{${j + 1}}`);

      const term = sign * element * subDet;
      total += term;

      exprParts.push(`${s} (${element})\\cdot(${subDet})`);

      container.innerHTML += `
        <div class="step-card" style="${indentStyle}; background:var(--color-bg-dark); color:white;">
          <strong>Tag:</strong><br>
          $${s}\\; ${element}\\cdot \\det(${mToLatex(sub)}) = ${s}\\; ${element}\\cdot(${subDet}) = ${term}$
        </div>
      `;
    }

    container.innerHTML += `
      <div class="step-card" style="${indentStyle}; background:var(--color-bg-dark); color:white;">
        <strong>Összesítés (${label}):</strong><br>
        $${exprParts.join(" ")} = ${total}$
      </div>
    `;

    return total;
  }
});
