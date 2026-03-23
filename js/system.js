// ======================
// SYSTEM.JS – Általános lineáris egyenletrendszer megoldó (Gauss-Jordan / RREF)
// Kezel: m x n mátrixokat is, pl. 2x5, 3x6
// MÓDOSÍTVA:
// - e1, e2, ... bázisváltozók megjelenítése
// - a1, a2, ... oszlopváltozók megjelenítése
// - pivot után a bázis automatikusan frissül
// - a végső megoldásban x helyett a szerepel
// - nincs "Bázis" felirat bal fent
// - a b oszlop előtt nincsenek sorfeliratok
// ======================

document.addEventListener("DOMContentLoaded", () => {
    const rowsInput = document.getElementById("matrix-rows");
    const colsInput = document.getElementById("matrix-cols");

    const btnCreate = document.getElementById("btn-create-grid");
    const btnShow = document.getElementById("btn-show-matrix");
    const btnFillRandom = document.getElementById("btn-fill-random");

    const inputWrapper = document.getElementById("matrix-input-wrapper");
    const gridContainer = document.getElementById("matrix-grid");

    const displayArea = document.getElementById("matrix-display-area");
    const latexOutput = document.getElementById("latex-output");

    const stepControls = document.getElementById("step-controls");
    const pivotInfo = document.getElementById("selected-pivot-info");
    const btnStep = document.getElementById("btn-perform-step");
    const stepTitle = document.getElementById("step-title");
    const systemWarning = document.getElementById("system-warning");
    const basisInfo = document.getElementById("basis-info");

    // ÁLLAPOT
    let currentMatrixA = []; // m x n
    let currentVectorB = []; // m x 1
    let rowCount = 0;
    let colCount = 0;
    let selectedPivot = null;
    let stepCount = 0;

    // Jelölések
    let rowLabels = []; // aktuális bázis: kezdetben e_i, később egy részük a_j
    let colLabels = []; // a_1, a_2, ...

    // 1. Mátrix keret létrehozása
    btnCreate.addEventListener("click", () => {
        const m = parseInt(rowsInput.value, 10);
        const n = parseInt(colsInput.value, 10);

        if (isNaN(m) || isNaN(n) || m < 1 || n < 1 || m > 8 || n > 8) {
            alert("A sorok és oszlopok száma 1 és 8 között lehet.");
            return;
        }

        rowCount = m;
        colCount = n;
        stepCount = 0;
        selectedPivot = null;

        rowLabels = Array.from({ length: m }, (_, i) => `e_${i + 1}`);
        colLabels = Array.from({ length: n }, (_, i) => `a_${i + 1}`);

        gridContainer.innerHTML = "";
        gridContainer.style.gridTemplateColumns = `repeat(${n + 1}, 1fr)`;

        for (let r = 0; r < m; r++) {
            for (let c = 0; c < n + 1; c++) {
                const input = document.createElement("input");
                input.type = "number";
                input.className = "matrix-cell";
                input.dataset.row = r;
                input.dataset.col = c;
                input.value = "";
                input.addEventListener("focus", () => input.select());

                if (c === n) {
                    input.style.borderLeft = "3px solid #7b4a2d";
                    input.style.backgroundColor = "rgba(224, 184, 120, 0.15)";
                    input.title = `b${r + 1} érték`;
                }

                gridContainer.appendChild(input);
            }
        }

        inputWrapper.classList.remove("hidden");
        displayArea.classList.add("hidden");
        stepControls.classList.add("hidden");
        systemWarning.classList.add("hidden");
        systemWarning.innerHTML = "";
        latexOutput.innerHTML = "";
        basisInfo.innerHTML = "";
    });

    // 2. Véletlen kitöltés – mindig konzisztens rendszert készít
    btnFillRandom.addEventListener("click", () => {
        const m = rowCount;
        const n = colCount;

        if (!m || !n) {
            alert("Előbb hozd létre a mátrix keretet.");
            return;
        }

        let A = Array.from({ length: m }, () =>
            Array.from({ length: n }, () => randomInt(-6, 6))
        );

        for (let r = 0; r < m; r++) {
            if (A[r].every(v => v === 0)) {
                const c = randomInt(0, n - 1);
                A[r][c] = randomNonZeroInt(-6, 6);
            }
        }

        const solutionVector = Array.from({ length: n }, () => randomInt(-5, 5));

        const b = Array.from({ length: m }, (_, r) => {
            let sum = 0;
            for (let c = 0; c < n; c++) {
                sum += A[r][c] * solutionVector[c];
            }
            return sum;
        });

        const inputs = gridContainer.querySelectorAll("input");
        inputs.forEach((input, index) => {
            const r = Math.floor(index / (n + 1));
            const c = index % (n + 1);

            if (c < n) {
                input.value = A[r][c];
            } else {
                input.value = b[r];
            }
        });
    });

    // 3. Számítás indítása
    btnShow.addEventListener("click", () => {
        const inputs = gridContainer.querySelectorAll("input");

        if (!rowCount || !colCount || inputs.length === 0) {
            alert("Előbb hozd létre a mátrix keretet.");
            return;
        }

        currentMatrixA = [];
        currentVectorB = [];

        let currentRowA = [];

        inputs.forEach((input, index) => {
            let val = input.value === "" ? 0 : parseFloat(input.value);
            if (isNaN(val)) val = 0;

            const c = index % (colCount + 1);

            if (c < colCount) {
                currentRowA.push(val);
            } else {
                currentMatrixA.push(currentRowA);
                currentVectorB.push([val]);
                currentRowA = [];
            }
        });

        rowLabels = Array.from({ length: rowCount }, (_, i) => `e_${i + 1}`);
        colLabels = Array.from({ length: colCount }, (_, i) => `a_${i + 1}`);

        stepCount = 0;
        selectedPivot = null;
        latexOutput.innerHTML = "";
        displayArea.classList.remove("hidden");
        stepTitle.style.display = "none";
        stepControls.classList.add("hidden");

        updateBasisInfo();
        updateSystemWarning();
        appendNewStep(currentMatrixA, currentVectorB, stepCount);
    });

    // 4. LÉPÉS VÉGREHAJTÁSA
    btnStep.addEventListener("click", () => {
        if (!selectedPivot) return;

        // A kiválasztott sor bázisváltozója lecserélődik a kiválasztott oszlop változójára
        rowLabels[selectedPivot.row] = colLabels[selectedPivot.col];

        freezeLastTable();
        performGaussJordanStep(selectedPivot.row, selectedPivot.col);

        selectedPivot = null;
        stepControls.classList.add("hidden");
        stepCount++;

        updateBasisInfo();
        updateSystemWarning();
        appendNewStep(currentMatrixA, currentVectorB, stepCount);
    });

    function updateBasisInfo() {
        if (!basisInfo) return;

        const basisSet = new Set(rowLabels.map(normalizeLabel));
        const nonBasis = colLabels.filter(label => !basisSet.has(normalizeLabel(label)));

        basisInfo.innerHTML = `
            <div style="margin-bottom:0.45rem;">
                <strong>Aktuális bázis:</strong>
                ${rowLabels.map(l => `$${l}$`).join(", ")}
            </div>
            <div>
                <strong>Nem bázisváltozók:</strong>
                ${nonBasis.length ? nonBasis.map(l => `$${l}$`).join(", ") : "—"}
            </div>
        `;

        if (window.MathJax) {
            MathJax.typesetPromise([basisInfo]).catch(() => {});
        }
    }

    function appendNewStep(matA, vecB, count) {
        if (count > 0) {
            const arrowDiv = document.createElement("div");
            arrowDiv.style.textAlign = "center";
            arrowDiv.style.fontSize = "1.5rem";
            arrowDiv.style.color = "#b77b4f";
            arrowDiv.style.margin = "0.5rem 0";
            arrowDiv.innerHTML = "↓";
            latexOutput.appendChild(arrowDiv);
        }

        const stepWrapper = document.createElement("div");
        stepWrapper.className = "step-block";
        stepWrapper.style.textAlign = "center";

        const label = document.createElement("h4");
        label.style.color = "#7b4a2d";
        label.style.marginBottom = "0.5rem";

        if (count === 0) {
            label.innerHTML = "Kiindulás: \\([A \\mid b]\\) (Válassz pivotot az \\(A\\) részben!)";
        } else {
            label.textContent = `${count}. lépés eredménye`;
        }

        const augmentedWrapper = document.createElement("div");
        augmentedWrapper.className = "augmented-matrix-wrapper active-wrapper";

        const tableA = createMatrixTable(matA, true, "A");
        tableA.classList.add("matrix-left");

        const tableB = createMatrixTable(vecB, false, "b");
        tableB.classList.add("matrix-right");

        augmentedWrapper.appendChild(tableA);
        augmentedWrapper.appendChild(tableB);

        stepWrapper.appendChild(label);
        stepWrapper.appendChild(augmentedWrapper);
        latexOutput.appendChild(stepWrapper);

        const endState = getEndState(matA, vecB);

        if (endState.done) {
            augmentedWrapper.classList.remove("active-wrapper");
            freezeLastTable();
            showFinalSolution(stepWrapper, endState.classification, endState.reason);
        } else {
            stepWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        if (window.MathJax) {
            MathJax.typesetPromise([stepWrapper]).catch(() => {});
        }
    }

    function createMatrixTable(matrixData, isInteractive, type) {
        const table = document.createElement("table");
        table.className = "interactive-matrix";

        const rows = matrixData.length;
        const cols = matrixData[0].length;

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        const corner = document.createElement("th");
        corner.innerHTML = "";
        corner.style.padding = "8px 10px";
        headerRow.appendChild(corner);

        if (type === "A") {
            for (let c = 0; c < cols; c++) {
                const th = document.createElement("th");
                th.innerHTML = `$${colLabels[c]}$`;
                th.style.padding = "8px 12px";
                th.style.color = "#7b4a2d";
                headerRow.appendChild(th);
            }
        } else {
            const th = document.createElement("th");
            th.innerHTML = "$b$";
            th.style.padding = "8px 12px";
            th.style.color = "#7b4a2d";
            headerRow.appendChild(th);
        }

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        for (let r = 0; r < rows; r++) {
            const tr = document.createElement("tr");

            const rowHeader = document.createElement("th");

            if (type === "A") {
                rowHeader.innerHTML = `$${rowLabels[r]}$`;
                rowHeader.style.color = "#7b4a2d";
                rowHeader.style.fontWeight = "700";
            } else {
                rowHeader.innerHTML = "";
            }

            rowHeader.style.padding = "8px 12px";
            tr.appendChild(rowHeader);

            for (let c = 0; c < cols; c++) {
                const td = document.createElement("td");
                td.className = "interactive-cell";

                const val = matrixData[r][c];
                td.textContent = formatAsFraction(val);

                if (isInteractive) {
                    td.onclick = () => {
                        const wrapper = table.closest(".augmented-matrix-wrapper");
                        if (!wrapper || !wrapper.classList.contains("active-wrapper")) return;

                        handleCellClick(r, c, val, td, table);
                    };
                } else {
                    td.style.backgroundColor = "#faf5f0";
                    td.style.fontWeight = "bold";
                    td.style.color = "#5f4939";
                    td.style.cursor = "default";
                }

                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        return table;
    }

    function freezeLastTable() {
        const activeWrapper = latexOutput.querySelector(".active-wrapper");
        if (activeWrapper) {
            activeWrapper.classList.remove("active-wrapper");
            const cells = activeWrapper.querySelectorAll(".matrix-left td");
            cells.forEach(cell => {
                cell.style.cursor = "default";
                if (!cell.classList.contains("selected")) {
                    cell.style.opacity = "0.6";
                }
            });
        }
    }

    function handleCellClick(r, c, val, cellElement, tableElement) {
        if (Math.abs(val) < 1e-9) {
            alert("Nullát nem választhatsz pivot elemnek!");
            return;
        }

        const prev = tableElement.querySelector(".selected");
        if (prev) prev.classList.remove("selected");

        cellElement.classList.add("selected");
        selectedPivot = { row: r, col: c, value: val };

        pivotInfo.innerHTML =
            `Választott pivot: <span style="color:var(--color-primary); font-size:1.1em;">$${rowLabels[r]} \\leftrightarrow ${colLabels[c]}$</span> &nbsp; (érték: <strong>${formatAsFraction(val)}</strong>)`;

        stepControls.classList.remove("hidden");

        if (window.MathJax) {
            MathJax.typesetPromise([pivotInfo]).catch(() => {});
        }
    }

    function performGaussJordanStep(pRow, pCol) {
        const m = rowCount;
        const n = colCount;

        const newA = currentMatrixA.map(row => row.slice());
        const newB = currentVectorB.map(row => row.slice());

        const pivotVal = newA[pRow][pCol];

        // 1. Pivot sor normálása
        for (let j = 0; j < n; j++) {
            newA[pRow][j] /= pivotVal;
        }
        newB[pRow][0] /= pivotVal;

        for (let j = 0; j < n; j++) {
            if (Math.abs(newA[pRow][j]) < 1e-12) newA[pRow][j] = 0;
            if (Math.abs(newA[pRow][j] - 1) < 1e-12) newA[pRow][j] = 1;
        }
        if (Math.abs(newB[pRow][0]) < 1e-12) newB[pRow][0] = 0;
        newA[pRow][pCol] = 1;

        // 2. Nullázás ugyanabban az oszlopban minden más sorban
        for (let i = 0; i < m; i++) {
            if (i === pRow) continue;

            const factor = newA[i][pCol];
            if (Math.abs(factor) < 1e-9) continue;

            for (let j = 0; j < n; j++) {
                newA[i][j] -= factor * newA[pRow][j];
                if (Math.abs(newA[i][j]) < 1e-12) newA[i][j] = 0;
                if (Math.abs(newA[i][j] - 1) < 1e-12) newA[i][j] = 1;
            }

            newB[i][0] -= factor * newB[pRow][0];
            if (Math.abs(newB[i][0]) < 1e-12) newB[i][0] = 0;

            newA[i][pCol] = 0;
        }

        currentMatrixA = newA;
        currentVectorB = newB;
    }

    function getEndState(matA, vecB) {
        const classification = classifySystem(matA, vecB);

        if (classification.type === "inconsistent") {
            return {
                done: true,
                classification,
                reason: "inconsistent"
            };
        }

        if (classification.type === "unique") {
            return {
                done: true,
                classification,
                reason: "unique"
            };
        }

        const maxPossiblePivots = Math.min(rowCount, colCount);

        if (
            classification.type === "infinite" &&
            classification.pivotColumns.length === maxPossiblePivots &&
            isReadableForParametricSolution(matA, classification)
        ) {
            return {
                done: true,
                classification,
                reason: "infinite-max-pivots"
            };
        }

        return {
            done: false,
            classification,
            reason: null
        };
    }

    function isReadableForParametricSolution(matA, classification) {
        for (const pCol of classification.pivotColumns) {
            const pRow = classification.pivotRowByCol[pCol];
            if (pRow === undefined) return false;

            for (let r = 0; r < rowCount; r++) {
                const expected = (r === pRow) ? 1 : 0;
                if (!nearlyEqual(matA[r][pCol], expected)) {
                    return false;
                }
            }
        }
        return true;
    }

    function showFinalSolution(container, classification, reason) {
        const solutionDiv = document.createElement("div");
        solutionDiv.className = "generation-result";
        solutionDiv.style.marginTop = "2rem";

        if (classification.type === "inconsistent") {
            solutionDiv.innerHTML = `
                <p style="margin-bottom:1rem; font-weight:bold; color:#9b2c2c;">
                    A rendszer ellentmondásos, ezért nincs megoldása.
                </p>
                <div>$$\\text{Nincs\\ megoldás}$$</div>
            `;
            container.appendChild(solutionDiv);
            if (window.MathJax) MathJax.typesetPromise([solutionDiv]).catch(() => {});
            return;
        }

        if (classification.type === "unique") {
            let latexStr = `\\begin{aligned}\n`;

            for (let c = 0; c < colCount; c++) {
                const pivotRow = classification.pivotRowByCol[c];
                const val = currentVectorB[pivotRow][0];
                latexStr += `a_{${c + 1}} &= ${toLatexNumber(val)} \\\\\n`;
            }

            latexStr += `\\end{aligned}`;

            solutionDiv.innerHTML = `
                <p style="margin-bottom:1rem; font-weight:bold;">
                    A feladatot sikeresen megoldottad.
                </p>
                <div>$$${latexStr}$$</div>
            `;
            container.appendChild(solutionDiv);
            if (window.MathJax) MathJax.typesetPromise([solutionDiv]).catch(() => {});
            return;
        }

        const freeVars = classification.freeColumns;
        const pivotCols = classification.pivotColumns;
        const pivotRowByCol = classification.pivotRowByCol;

        let latexStr = `\\begin{aligned}\n`;

        freeVars.forEach((col, idx) => {
            latexStr += `a_{${col + 1}} &= t_{${idx + 1}} \\\\\n`;
        });

        pivotCols.forEach((pCol) => {
            const r = pivotRowByCol[pCol];
            let expr = `${toLatexNumber(currentVectorB[r][0])}`;

            freeVars.forEach((fCol, idx) => {
                const coeff = currentMatrixA[r][fCol];
                if (nearlyZero(coeff)) return;

                const paramName = `t_{${idx + 1}}`;

                if (coeff > 0) {
                    expr += ` - ${toLatexCoeff(coeff)}${paramName}`;
                } else {
                    expr += ` + ${toLatexCoeff(-coeff)}${paramName}`;
                }
            });

            latexStr += `a_{${pCol + 1}} &= ${expr} \\\\\n`;
        });

        latexStr += `\\end{aligned}`;

        let introText = `
            <p style="margin-bottom:1rem; font-weight:bold; color:#7b4a2d;">
                A rendszernek végtelen sok megoldása van.
            </p>
        `;

        if (reason === "infinite-max-pivots") {
            introText = `
                <p style="margin-bottom:0.6rem; font-weight:bold; color:#7b4a2d;">
                    A rendszernek végtelen sok megoldása van.
                </p>
                <p style="margin-bottom:1rem; color:#6b5241;">
                    Már megvan a maximálisan lehetséges pivotszám, ezért a további lépések
                    már nem adnak új pivotot, csak az alakot rendeznék tovább.
                    A paraméteres megoldás már most kiolvasható:
                </p>
            `;
        }

        solutionDiv.innerHTML = `
            ${introText}
            <div>$$${latexStr}$$</div>
        `;

        container.appendChild(solutionDiv);
        if (window.MathJax) MathJax.typesetPromise([solutionDiv]).catch(() => {});
    }

    function classifySystem(matA, vecB) {
        const m = rowCount;
        const n = colCount;

        let pivotColumns = [];
        let pivotRowByCol = {};

        for (let r = 0; r < m; r++) {
            const rowZero = matA[r].every(v => nearlyZero(v));
            if (rowZero && !nearlyZero(vecB[r][0])) {
                return { type: "inconsistent" };
            }

            const lead = firstNonZeroColumn(matA[r]);
            if (lead !== -1 && nearlyEqual(matA[r][lead], 1)) {
                let isPivotCol = true;

                for (let rr = 0; rr < m; rr++) {
                    if (rr === r) continue;
                    if (!nearlyZero(matA[rr][lead])) {
                        isPivotCol = false;
                        break;
                    }
                }

                if (isPivotCol) {
                    pivotColumns.push(lead);
                    pivotRowByCol[lead] = r;
                }
            }
        }

        pivotColumns = [...new Set(pivotColumns)].sort((a, b) => a - b);

        const freeColumns = [];
        for (let c = 0; c < n; c++) {
            if (!pivotColumns.includes(c)) {
                freeColumns.push(c);
            }
        }

        if (pivotColumns.length === n) {
            return {
                type: "unique",
                pivotColumns,
                freeColumns,
                pivotRowByCol
            };
        }

        return {
            type: "infinite",
            pivotColumns,
            freeColumns,
            pivotRowByCol
        };
    }

    function updateSystemWarning() {
        const classification = classifySystem(currentMatrixA, currentVectorB);
        const maxPossiblePivots = Math.min(rowCount, colCount);

        systemWarning.classList.remove("hidden");

        if (classification.type === "inconsistent") {
            systemWarning.innerHTML = `
                ⚠️ <strong>Figyelem:</strong>
                A rendszer ellentmondásos alakot tartalmaz, ezért
                <strong>nincs megoldás</strong>.
            `;
            return;
        }

        if (classification.type === "unique") {
            systemWarning.innerHTML = `
                ✅ <strong>Megjegyzés:</strong>
                Minden változóhoz tartozik pivot, ezért
                <strong>egyértelmű megoldás</strong> várható.
            `;
            return;
        }

        if (classification.pivotColumns.length === maxPossiblePivots && colCount > maxPossiblePivots) {
            systemWarning.innerHTML = `
                ℹ️ <strong>Megjegyzés:</strong>
                Már megvan a maximálisan lehetséges pivotszám, de maradtak szabad változók,
                ezért a rendszernek <strong>végtelen sok megoldása van</strong>.
            `;
            return;
        }

        systemWarning.innerHTML = `
            ℹ️ <strong>Megjegyzés:</strong>
            A rendszer jelenleg még átalakítás alatt van. Ha maradnak szabad változók
            és nincs ellentmondás, akkor <strong>végtelen sok megoldás</strong> lesz.
        `;
    }

    function firstNonZeroColumn(row) {
        for (let c = 0; c < row.length; c++) {
            if (!nearlyZero(row[c])) return c;
        }
        return -1;
    }

    function normalizeLabel(label) {
        return String(label).replace(/\s/g, "");
    }

    function nearlyZero(x) {
        return Math.abs(x) < 1e-9;
    }

    function nearlyEqual(a, b) {
        return Math.abs(a - b) < 1e-9;
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomNonZeroInt(min, max) {
        let x = 0;
        while (x === 0) x = randomInt(min, max);
        return x;
    }
});

/**
 * Számot törtté alakít
 */
function formatAsFraction(num) {
    if (num === null || num === undefined || isNaN(num)) return "?";
    if (!isFinite(num)) return num > 0 ? "∞" : "-∞";

    if (Math.abs(Math.round(num) - num) < 1e-10) {
        return Math.round(num).toString();
    }

    const sign = num < 0 ? "-" : "";
    const n = Math.abs(num);
    const limit = 1e-10;

    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = n;

    for (let i = 0; i < 20; i++) {
        const a = Math.floor(b);

        const auxH = h1;
        h1 = a * h1 + h2;
        h2 = auxH;

        const auxK = k1;
        k1 = a * k1 + k2;
        k2 = auxK;

        if (Math.abs(n - h1 / k1) < limit) break;

        const remainder = b - a;
        if (Math.abs(remainder) < 1e-12) break;

        b = 1 / remainder;
    }

    return sign + h1 + "/" + k1;
}

function toLatexNumber(num) {
    const s = formatAsFraction(num);

    if (s.includes("/")) {
        const idx = s.indexOf("/");
        const nume = s.slice(0, idx);
        const deno = s.slice(idx + 1);
        return `\\frac{${nume}}{${deno}}`;
    }

    return s;
}

function toLatexCoeff(num) {
    if (Math.abs(num - 1) < 1e-10) return "";
    return toLatexNumber(num);
}