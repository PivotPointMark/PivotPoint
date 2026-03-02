// ======================
// PIVOT.JS – Bázistranszformáció
// Finomított működés:
// - csak akkor látszik a "Kiválasztott lépés végrehajtása" gomb, ha tényleg ki van választva pivot
// - a rendezésnél nincs "bal oldali mátrix" szöveg
// - a végén csak ennyi jelenik meg: "A sorok rendezve lettek."
// - csak kiválasztás után jelenik meg a következő lépéshez tartozó vezérlés
// ======================

document.addEventListener("DOMContentLoaded", () => {
    const sizeInput = document.getElementById("matrix-size");
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
    const btnFinalizeIdentity = document.getElementById("btn-finalize-identity");
    const stepTitle = document.getElementById("step-title");

    let currentMatrixData = [];
    let matrixSize = 0;
    let selectedPivot = null;
    let stepCount = 0;
    let rowLabels = [];
    let colLabels = [];

    function toFraction(val) {
        if (Math.abs(val) < 1e-10) return "0";
        if (Math.abs(Math.round(val) - val) < 1e-9) return Math.round(val).toString();

        const tolerance = 1.0e-9;
        let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
        let b = val;

        do {
            const a = Math.floor(b);

            const oldH1 = h1;
            h1 = a * h1 + h2;
            h2 = oldH1;

            const oldK1 = k1;
            k1 = a * k1 + k2;
            k2 = oldK1;

            b = 1 / (b - a);
        } while (Math.abs(val - h1 / k1) > Math.abs(val) * tolerance);

        return `${h1}/${k1}`;
    }

    function normalizeLabel(label) {
        return String(label).replace(/\s/g, "");
    }

    function labelsMatch(a, b) {
        return normalizeLabel(a) === normalizeLabel(b);
    }

    function isReadyForIdentityReorder() {
        if (rowLabels.length !== colLabels.length || rowLabels.length === 0) return false;

        for (let i = 0; i < colLabels.length; i++) {
            const exists = rowLabels.some(rowLabel => labelsMatch(rowLabel, colLabels[i]));
            if (!exists) return false;
        }

        return true;
    }

    function isAlreadyOrdered() {
        if (rowLabels.length !== colLabels.length) return false;

        for (let i = 0; i < rowLabels.length; i++) {
            if (!labelsMatch(rowLabels[i], colLabels[i])) {
                return false;
            }
        }

        return true;
    }

    function hideAllControls() {
        stepControls.classList.add("hidden");
        btnStep.classList.add("hidden");
        btnFinalizeIdentity.classList.add("hidden");
        pivotInfo.innerHTML = "";
    }

    function showPivotControls() {
        stepControls.classList.remove("hidden");
        btnStep.classList.remove("hidden");
        btnFinalizeIdentity.classList.add("hidden");
    }

    function showFinalizeControls() {
        stepControls.classList.remove("hidden");
        btnStep.classList.add("hidden");
        btnFinalizeIdentity.classList.remove("hidden");
    }

    function refreshMath(target) {
        if (window.MathJax && target) {
            MathJax.typesetPromise([target]).catch(() => {});
        }
    }

    function updateFinalizeButtonVisibility() {
        const shouldShowFinalize = isReadyForIdentityReorder() && !isAlreadyOrdered();

        if (shouldShowFinalize) {
            showFinalizeControls();
            pivotInfo.innerHTML = "A sorok egységmátrix sorrendbe rendezhetők. Kattints az <strong>Egységmátrixra hozás</strong> gombra.";
            refreshMath(pivotInfo);
            return;
        }

        if (selectedPivot) {
            showPivotControls();
        } else {
            hideAllControls();
        }
    }

    function freezeLastTable() {
        const last = latexOutput.querySelector(".active-matrix");
        if (last) {
            last.classList.remove("active-matrix");
            last.querySelectorAll("td").forEach(td => {
                td.style.cursor = "default";
            });
        }
    }

    function performGaussStep(pRow, pCol) {
        const n = matrixSize;
        const pivotVal = currentMatrixData[pRow][pCol];
        const newMatrix = currentMatrixData.map(row => row.slice());

        for (let j = 0; j < n; j++) {
            newMatrix[pRow][j] = currentMatrixData[pRow][j] / pivotVal;
        }

        for (let i = 0; i < n; i++) {
            if (i !== pRow) {
                const factor = currentMatrixData[i][pCol];
                for (let j = 0; j < n; j++) {
                    newMatrix[i][j] = currentMatrixData[i][j] - factor * newMatrix[pRow][j];
                }
                newMatrix[i][pCol] = 0;
            }
        }

        currentMatrixData = newMatrix;
    }

    function reorderRowsToIdentity() {
        if (!isReadyForIdentityReorder()) {
            alert("A sorok még nem rendezhetők egységmátrix sorrendbe.");
            return;
        }

        const newMatrix = [];
        const newRowLabels = [];

        for (let i = 0; i < colLabels.length; i++) {
            const wantedLabel = colLabels[i];
            const sourceRowIndex = rowLabels.findIndex(label => labelsMatch(label, wantedLabel));

            if (sourceRowIndex === -1) {
                alert("Nem található minden szükséges sor az átrendezéshez.");
                return;
            }

            newMatrix.push(currentMatrixData[sourceRowIndex].slice());
            newRowLabels.push(rowLabels[sourceRowIndex]);
        }

        currentMatrixData = newMatrix;
        rowLabels = newRowLabels;

        freezeLastTable();
        selectedPivot = null;
        stepCount++;
        appendNewStep(currentMatrixData, stepCount);

        stepControls.classList.remove("hidden");
        btnStep.classList.add("hidden");
        btnFinalizeIdentity.classList.add("hidden");
        pivotInfo.innerHTML = "A sorok rendezve lettek.";
        refreshMath(pivotInfo);
    }

    function appendNewStep(matrixData, count) {
        if (count > 0) {
            const arrow = document.createElement("div");
            arrow.innerHTML = "↓";
            arrow.style.textAlign = "center";
            arrow.style.fontSize = "1.5rem";
            latexOutput.appendChild(arrow);
        }

        const stepWrapper = document.createElement("div");
        stepWrapper.className = "step-block";

        let tableHtml = `<table class="interactive-matrix active-matrix"><thead><tr><th></th>`;

        for (let j = 0; j < matrixSize; j++) {
            tableHtml += `<th>$${colLabels[j]}$</th>`;
        }

        tableHtml += `</tr></thead><tbody>`;

        for (let r = 0; r < matrixSize; r++) {
            tableHtml += `<tr><th>$${rowLabels[r]}$</th>`;
            for (let c = 0; c < matrixSize; c++) {
                const val = matrixData[r][c];
                tableHtml += `<td class="interactive-cell" data-row="${r}" data-col="${c}" data-val="${val}">${toFraction(val)}</td>`;
            }
            tableHtml += `</tr>`;
        }

        tableHtml += `</tbody></table>`;

        stepWrapper.innerHTML = `<h4>${count === 0 ? "Kiinduló állapot" : count + ". lépés"}</h4>` + tableHtml;
        latexOutput.appendChild(stepWrapper);

        stepWrapper.querySelectorAll(".interactive-cell").forEach(cell => {
            cell.onclick = function () {
                if (!this.closest(".active-matrix")) return;

                const r = parseInt(this.dataset.row, 10);
                const c = parseInt(this.dataset.col, 10);
                const val = parseFloat(this.dataset.val);

                if (Math.abs(val) < 1e-10) {
                    alert("Nullát nem választhatsz pivotnak!");
                    return;
                }

                stepWrapper.querySelectorAll(".selected").forEach(s => s.classList.remove("selected"));
                this.classList.add("selected");

                selectedPivot = { row: r, col: c, value: val };

                pivotInfo.innerHTML =
                    `Választott pivot: <span style="color:var(--color-primary); font-size:1.1em;">$${rowLabels[r]} \\leftrightarrow ${colLabels[c]}$</span> (Érték: ${toFraction(val)})`;

                showPivotControls();
                refreshMath(pivotInfo);
            };
        });

        refreshMath(stepWrapper);
        stepWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    btnCreate.addEventListener("click", () => {
        const n = parseInt(sizeInput.value, 10);

        if (isNaN(n) || n < 2 || n > 5) {
            alert("A mátrix mérete 2 és 5 között lehet.");
            return;
        }

        matrixSize = n;
        stepCount = 0;
        selectedPivot = null;
        currentMatrixData = [];
        rowLabels = [];
        colLabels = [];

        gridContainer.innerHTML = "";
        gridContainer.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

        for (let i = 0; i < n * n; i++) {
            const input = document.createElement("input");
            input.type = "number";
            input.className = "matrix-cell";
            gridContainer.appendChild(input);
        }

        inputWrapper.classList.remove("hidden");
        displayArea.classList.add("hidden");
        latexOutput.innerHTML = "";
        hideAllControls();

        if (stepTitle) {
            stepTitle.textContent = "1. lépés: Válassz pivot elemet!";
        }
    });

    btnFillRandom.addEventListener("click", () => {
        const inputs = gridContainer.querySelectorAll("input");
        inputs.forEach(input => {
            input.value = Math.floor(Math.random() * 21) - 10;
        });
    });

    btnShow.addEventListener("click", () => {
        const inputs = gridContainer.querySelectorAll("input");

        currentMatrixData = [];
        let currentRow = [];

        inputs.forEach((input, index) => {
            currentRow.push(parseFloat(input.value) || 0);
            if ((index + 1) % matrixSize === 0) {
                currentMatrixData.push(currentRow);
                currentRow = [];
            }
        });

        rowLabels = Array.from({ length: matrixSize }, (_, i) => `a_${i + 1}`);
        colLabels = Array.from({ length: matrixSize }, (_, i) => `a_${i + 1}`);

        for (let i = 0; i < matrixSize; i++) {
            rowLabels[i] = `e_${i + 1}`;
        }

        stepCount = 0;
        selectedPivot = null;
        latexOutput.innerHTML = "";
        hideAllControls();

        displayArea.classList.remove("hidden");
        appendNewStep(currentMatrixData, stepCount);

        if (stepTitle) {
            stepTitle.textContent = "Válassz pivot elemet!";
        }
    });

    btnStep.addEventListener("click", () => {
        if (!selectedPivot) return;

        rowLabels[selectedPivot.row] = colLabels[selectedPivot.col];

        freezeLastTable();
        performGaussStep(selectedPivot.row, selectedPivot.col);

        selectedPivot = null;
        stepCount++;
        appendNewStep(currentMatrixData, stepCount);

        updateFinalizeButtonVisibility();

        if (stepTitle) {
            if (isReadyForIdentityReorder() && !isAlreadyOrdered()) {
                stepTitle.textContent = "A sorok rendezhetők.";
            } else {
                stepTitle.textContent = "Válassz pivot elemet!";
            }
        }
    });

    btnFinalizeIdentity.addEventListener("click", () => {
        reorderRowsToIdentity();

        if (stepTitle) {
            stepTitle.textContent = "Kész";
        }
    });
});