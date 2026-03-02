document.addEventListener("DOMContentLoaded", () => {
  const sizeInput = document.getElementById("matrix-size");
  const btnCreate = document.getElementById("btn-create-grid");
  const btnFillRandom = document.getElementById("btn-fill-random");
  const btnCalcExpand = document.getElementById("btn-calc-det");
  const btnCalcPivot = document.getElementById("btn-calc-det-pivot");

  const inputWrapper = document.getElementById("matrix-input-wrapper");
  const gridContainer = document.getElementById("matrix-grid");
  const displayArea = document.getElementById("matrix-display-area");
  const stepsContainer = document.getElementById("calc-steps");
  const finalResultSpan = document.getElementById("final-result");
  const resultMethodSpan = document.getElementById("result-method");

  btnCreate.addEventListener("click", () => {
    const n = parseInt(sizeInput.value, 10);

    if (isNaN(n) || n < 2 || n > 4) {
      alert("A determináns számítás itt 2×2, 3×3 vagy 4×4-es mátrixra használható.");
      return;
    }

    gridContainer.innerHTML = "";
    gridContainer.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

    for (let i = 0; i < n * n; i++) {
      const input = document.createElement("input");
      input.type = "number";
      input.className = "matrix-cell";
      input.value = Math.floor(Math.random() * 11) - 5;
      gridContainer.appendChild(input);
    }

    inputWrapper.classList.remove("hidden");
    displayArea.classList.add("hidden");
    stepsContainer.innerHTML = "";
    finalResultSpan.innerHTML = "";
    resultMethodSpan.textContent = "";
  });

  btnFillRandom.addEventListener("click", () => {
    gridContainer.querySelectorAll("input").forEach(input => {
      input.value = Math.floor(Math.random() * 11) - 5;
    });
  });

  btnCalcExpand.addEventListener("click", () => {
    const matrix = readMatrixFromGrid();
    if (!matrix) return;

    stepsContainer.innerHTML = `<h3>Kifejtés az 1. sor szerint:</h3>`;
    const result = detWithSteps(matrix, stepsContainer, 0, "A");

    resultMethodSpan.textContent = "Kifejtési módszer";
    finalResultSpan.innerHTML = toFraction(result);
    displayArea.classList.remove("hidden");
    rerenderMath();
  });

  btnCalcPivot.addEventListener("click", () => {
    const matrix = readMatrixFromGrid();
    if (!matrix) return;

    stepsContainer.innerHTML = `<h3>Determináns kiszámítása pivotálással:</h3>`;
    const result = detByPivotWithSteps(matrix, stepsContainer);

    resultMethodSpan.textContent = "Pivotálásos módszer";
    finalResultSpan.innerHTML = toFraction(result);
    displayArea.classList.remove("hidden");
    rerenderMath();
  });

  function readMatrixFromGrid() {
    const n = parseInt(sizeInput.value, 10);
    const inputs = gridContainer.querySelectorAll("input");

    if (!inputs.length) {
      alert("Először hozd létre a mátrixot.");
      return null;
    }

    const matrix = [];
    let row = [];

    inputs.forEach((inp, idx) => {
      row.push(parseFloat(inp.value) || 0);
      if ((idx + 1) % n === 0) {
        matrix.push(row);
        row = [];
      }
    });

    return matrix;
  }

  function rerenderMath() {
    if (window.MathJax) {
      MathJax.typesetPromise().catch(() => {});
    }
  }

  function toFraction(val) {
    if (!isFinite(val)) return String(val);
    if (Math.abs(val) < 1e-10) return "0";
    if (Math.abs(Math.round(val) - val) < 1e-9) return Math.round(val).toString();

    const sign = val < 0 ? -1 : 1;
    const x = Math.abs(val);

    const tolerance = 1.0e-9;
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = x;

    do {
      const a = Math.floor(b);

      const oldH1 = h1;
      h1 = a * h1 + h2;
      h2 = oldH1;

      const oldK1 = k1;
      k1 = a * k1 + k2;
      k2 = oldK1;

      const diff = b - a;
      if (Math.abs(diff) < tolerance) break;
      b = 1 / diff;
    } while (Math.abs(x - h1 / k1) > x * tolerance);

    return `${sign < 0 ? "-" : ""}${h1}/${k1}`;
  }

  function formatNumber(val) {
    return toFraction(val);
  }

  function mToLatex(matrix) {
    return `\\begin{pmatrix} ${matrix.map(row => row.map(formatNumber).join(" & ")).join(" \\\\ ")} \\end{pmatrix}`;
  }

  function getSubMatrix(matrix, rowToExclude, colToExclude) {
    return matrix
      .filter((_, r) => r !== rowToExclude)
      .map(row => row.filter((_, c) => c !== colToExclude));
  }

  function signChar(sign) {
    return sign === 1 ? "+" : "-";
  }

  function detWithSteps(matrix, container, level = 0, label = "A") {
    const n = matrix.length;
    const indentStyle = `margin-left:${level * 14}px`;

    if (n === 2) {
      const a = matrix[0][0], b = matrix[0][1];
      const c = matrix[1][0], d = matrix[1][1];

      const ad = a * d;
      const bc = b * c;
      const val = ad - bc;

      container.innerHTML += `
        <div class="step-card" style="${indentStyle}">
          <strong>2×2 determináns (${label}) – keresztbeszorzás:</strong><br>
          $\\det ${mToLatex(matrix)} = (${formatNumber(a)}\\cdot${formatNumber(d)}) - (${formatNumber(b)}\\cdot${formatNumber(c)}) = ${formatNumber(ad)} - ${formatNumber(bc)} = ${formatNumber(val)}$
        </div>
      `;
      return val;
    }

    container.innerHTML += `
      <div class="step-card" style="${indentStyle}">
        <strong>${n}×${n} determináns (${label}) – kifejtés az 1. sor szerint:</strong><br>
        $\\det ${mToLatex(matrix)}$
      </div>
    `;

    let total = 0;
    const exprParts = [];

    for (let j = 0; j < n; j++) {
      const element = matrix[0][j];
      const sign = ((j % 2) === 0) ? 1 : -1;
      const s = signChar(sign);
      const sub = getSubMatrix(matrix, 0, j);

      container.innerHTML += `
        <div class="step-card" style="${indentStyle}">
          <strong>${j + 1}. elem:</strong> $a_{1,${j + 1}} = ${formatNumber(element)}$<br>
          Előjel: <strong>${s}</strong><br><br>
          Minor:<br>
          $${mToLatex(sub)}$
        </div>
      `;

      const subDet = detWithSteps(sub, container, level + 1, `${label}_${j + 1}`);
      const term = sign * element * subDet;
      total += term;

      exprParts.push(`${s}\\,(${formatNumber(element)})\\cdot(${formatNumber(subDet)})`);

      container.innerHTML += `
        <div class="step-card step-card-dark" style="${indentStyle}">
          <strong>Tag:</strong><br>
          $${s}\\; ${formatNumber(element)}\\cdot ${formatNumber(subDet)} = ${formatNumber(term)}$
        </div>
      `;
    }

    container.innerHTML += `
      <div class="step-card step-card-dark" style="${indentStyle}">
        <strong>Összesítés (${label}):</strong><br>
        $${exprParts.join(" ")} = ${formatNumber(total)}$
      </div>
    `;

    return total;
  }

  function cloneMatrix(matrix) {
    return matrix.map(row => row.slice());
  }

  function swapRows(matrix, r1, r2) {
    const temp = matrix[r1];
    matrix[r1] = matrix[r2];
    matrix[r2] = temp;
  }

  function detByPivotWithSteps(originalMatrix, container) {
    const matrix = cloneMatrix(originalMatrix);
    const n = matrix.length;
    let sign = 1;

    container.innerHTML += `
      <div class="step-card">
        <strong>Kiinduló mátrix:</strong><br>
        $A = ${mToLatex(matrix)}$
      </div>

      <div class="step-card">
        <strong>Röviden mi a módszer?</strong><br>
        Mindig kiválasztunk egy számot az átlóban, és az alatta lévő számokat lenullázzuk.<br>
        A trükk ez:<br><br>
        <strong>szorzó = lenullázandó szám / kiválasztott szám</strong><br><br>
        Utána az adott sorból kivonjuk a kiválasztott sor ennyiszeresét.<br>
        Így azon a helyen biztosan 0 lesz, mert:<br>
        <strong>lenullázandó szám − (szorzó × kiválasztott szám) = 0</strong>
      </div>
    `;

    for (let pivotIndex = 0; pivotIndex < n; pivotIndex++) {
      if (Math.abs(matrix[pivotIndex][pivotIndex]) < 1e-10) {
        let swapRow = -1;

        for (let r = pivotIndex + 1; r < n; r++) {
          if (Math.abs(matrix[r][pivotIndex]) > 1e-10) {
            swapRow = r;
            break;
          }
        }

        if (swapRow === -1) {
          container.innerHTML += `
            <div class="step-card step-card-dark">
              Ebben az oszlopban már nincs olyan szám, amivel tovább lehetne menni, ezért a determináns: <strong>0</strong>.
            </div>
          `;
          return 0;
        }

        swapRows(matrix, pivotIndex, swapRow);
        sign *= -1;

        container.innerHTML += `
          <div class="step-card">
            <strong>Sort cserélünk:</strong><br>
            A(z) ${pivotIndex + 1}. sort felcseréljük a(z) ${swapRow + 1}. sorral, hogy legyen használható kiválasztott szám.<br>
            Ettől a determináns előjele megfordul.<br><br>
            $${mToLatex(matrix)}$
          </div>
        `;
      }

      const pivot = matrix[pivotIndex][pivotIndex];

      container.innerHTML += `
        <div class="step-card">
          <strong>Kiválasztott szám:</strong><br>
          Most a(z) ${pivotIndex + 1}. sor és ${pivotIndex + 1}. oszlop metszetében lévő számot használjuk.<br>
          Ez a szám: <strong>${formatNumber(pivot)}</strong>
        </div>
      `;

      for (let r = pivotIndex + 1; r < n; r++) {
        const target = matrix[r][pivotIndex];
        if (Math.abs(target) < 1e-10) continue;

        const factor = target / pivot;

        for (let c = pivotIndex; c < n; c++) {
          matrix[r][c] = matrix[r][c] - factor * matrix[pivotIndex][c];
          if (Math.abs(matrix[r][c]) < 1e-10) matrix[r][c] = 0;
        }

        container.innerHTML += `
          <div class="step-card">
            <strong>Nullázás a kiválasztott szám alatt:</strong><br>
            A(z) ${r + 1}. sorban a(z) ${pivotIndex + 1}. oszlopban ezt akarjuk lenullázni: <strong>${formatNumber(target)}</strong><br>
            A kiválasztott szám: <strong>${formatNumber(pivot)}</strong><br><br>

            <strong>1. lépés:</strong> kiszámoljuk a szorzót:<br>
            ${formatNumber(target)} ÷ ${formatNumber(pivot)} = <strong>${formatNumber(factor)}</strong><br><br>

            <strong>2. lépés:</strong> a kiválasztott sort megszorozzuk ezzel:<br>
            ${formatNumber(factor)} × ${formatNumber(pivot)} = <strong>${formatNumber(factor * pivot)}</strong><br><br>

            <strong>3. lépés:</strong> ezt kivonjuk a lenullázandó számból:<br>
            ${formatNumber(target)} - ${formatNumber(factor * pivot)} = <strong>0</strong><br><br>

            Ezért a(z) ${r + 1}. sorból kivonjuk a(z) ${pivotIndex + 1}. sor
            <strong>${formatNumber(factor)}</strong>-szorosát.<br>
            Így azon a helyen tényleg 0 lesz.<br><br>

            $${mToLatex(matrix)}$
          </div>
        `;
      }
    }

    const diagonal = [];
    let diagonalProduct = 1;

    for (let i = 0; i < n; i++) {
      diagonal.push(matrix[i][i]);
      diagonalProduct *= matrix[i][i];
    }

    const det = sign * diagonalProduct;

    container.innerHTML += `
      <div class="step-card step-card-dark">
        <strong>Kész:</strong><br>
        Eljutottunk egy olyan mátrixhoz, ahol az átló alatt minden 0.<br><br>
        $${mToLatex(matrix)}$<br><br>

        Most már csak az átló számait kell összeszorozni:<br>
        $${diagonal.map(formatNumber).join("\\cdot")} = ${formatNumber(diagonalProduct)}$<br><br>

        ${sign === 1
          ? `Nem volt előjelet váltó sorcsere, ezért ez marad a végeredmény.`
          : `Volt páratlan számú sorcsere, ezért a végeredmény előjele mínusz lesz.`}
        <br><br>

        <strong>Végeredmény:</strong><br>
        $\\det(A) = ${formatNumber(det)}$
      </div>
    `;

    return det;
  }
});