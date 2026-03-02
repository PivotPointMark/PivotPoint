// ======================
// INVERSE.JS – Gauss-Jordan Invertálás Fix Oszlopfeliratokkal
// MÓDOSÍTVA a kért UI-logikára:
// - "Kiválasztott lépés végrehajtása" gomb CSAK akkor látszik, ha van kiválasztott pivot
// - ha nincs kiválasztás: se gomb, se "következő lépés" jellegű üzenet
// - rendezés utáni/végi üzenet: csak "A sorok rendezve lettek."
// - NINCS "bal oldali mátrix" szövegezés
// - automatikusan felkínálja a rendezést (gomb), ha a sorcímkék már (a_i) halmazt adják, de rossz sorrendben
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
    const singularWarning = document.getElementById("singular-warning");

    const stepTitle = document.getElementById("step-title");

    // --- Dinamikus gomb: "Egységmátrixra hozás" (sorok rendezése) ---
    // Nem kell HTML-t módosítanod: itt létrehozzuk és beszúrjuk a btnStep mellé.
    const btnFinalizeIdentity = document.createElement("button");
    btnFinalizeIdentity.id = "btn-finalize-identity";
    btnFinalizeIdentity.className = "btn-main btn-secondary hidden";
    btnFinalizeIdentity.style.marginLeft = "0.5rem";
    btnFinalizeIdentity.textContent = "Egységmátrixra hozás";
    stepControls.appendChild(btnFinalizeIdentity);

    // ÁLLAPOT
    let currentMatrixA = [];
    let currentMatrixI = [];
    let matrixSize = 0;
    let selectedPivot = null;
    let stepCount = 0;
    let rowLabels = [];
    let colLabels = [];

    // --- SEGÉDFÜGGVÉNY: TIZEDES -> KÖZÖNSÉGES TÖRT ---
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

    function refreshMath(target) {
        if (window.MathJax && target) {
            MathJax.typesetPromise([target]).catch(() => {});
        }
    }

    function normalizeLabel(label) {
        return String(label).replace(/\s/g, "");
    }

    function labelsMatch(a, b) {
        return normalizeLabel(a) === normalizeLabel(b);
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

    function showFinalizeControls(messageHtml) {
        stepControls.classList.remove("hidden");
        btnStep.classList.add("hidden");
        btnFinalizeIdentity.classList.remove("hidden");
        pivotInfo.innerHTML = messageHtml || "";
        refreshMath(pivotInfo);
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
            if (!labelsMatch(rowLabels[i], colLabels[i])) return false;
        }
        return true;
    }

    function updateFinalizeButtonVisibility() {
        const shouldShowFinalize = isReadyForIdentityReorder() && !isAlreadyOrdered();

        if (shouldShowFinalize) {
            showFinalizeControls("A sorok egységmátrix sorrendbe rendezhetők. Kattints az <strong>Egységmátrixra hozás</strong> gombra.");
            return;
        }

        // Ha van pivot kijelölés, akkor a lépés gomb látszik, különben semmi.
        if (selectedPivot) showPivotControls();
        else hideAllControls();
    }

    function freezeLastTable() {
        const activeWrapper = latexOutput.querySelector(".active-wrapper");
        if (activeWrapper) {
            activeWrapper.classList.remove("active-wrapper");
            activeWrapper.querySelectorAll("td").forEach(td => (td.style.cursor = "default"));
        }
    }

    function handleCellClick(r, c, val, cellElement, tableElement) {
        if (Math.abs(val) < 1e-9) {
            alert("Nullát nem választhatsz pivot elemnek!");
            return;
        }

        tableElement.querySelectorAll(".selected").forEach(s => s.classList.remove("selected"));
        cellElement.classList.add("selected");

        selectedPivot = { row: r, col: c, value: val };

        pivotInfo.innerHTML =
            `Választott pivot: <span style="color:var(--color-primary); font-size:1.1em;">$${rowLabels[r]} \\leftrightarrow ${colLabels[c]}$</span> (Értéke: ${toFraction(val)})`;

        showPivotControls();
        refreshMath(pivotInfo);
    }

    function performGaussJordanStep(pRow, pCol) {
        const n = matrixSize;
        const pivotVal = currentMatrixA[pRow][pCol];

        const newA = currentMatrixA.map(row => row.slice());
        const newI = currentMatrixI.map(row => row.slice());

        // pivot sor normálása
        for (let j = 0; j < n; j++) {
            newA[pRow][j] /= pivotVal;
            newI[pRow][j] /= pivotVal;
        }

        // oszlop kinullázás
        for (let i = 0; i < n; i++) {
            if (i !== pRow) {
                const factor = currentMatrixA[i][pCol];
                for (let j = 0; j < n; j++) {
                    newA[i][j] -= factor * newA[pRow][j];
                    newI[i][j] -= factor * newI[pRow][j];
                }
            }
        }

        currentMatrixA = newA;
        currentMatrixI = newI;
    }

    function reorderRowsToIdentity() {
        if (!isReadyForIdentityReorder()) {
            alert("A sorok még nem rendezhetők egységmátrix sorrendbe.");
            return;
        }

        const newA = [];
        const newI = [];
        const newRowLabels = [];

        for (let i = 0; i < colLabels.length; i++) {
            const wantedLabel = colLabels[i];
            const sourceRowIndex = rowLabels.findIndex(label => labelsMatch(label, wantedLabel));

            if (sourceRowIndex === -1) {
                alert("Nem található minden szükséges sor az átrendezéshez.");
                return;
            }

            newA.push(currentMatrixA[sourceRowIndex].slice());
            newI.push(currentMatrixI[sourceRowIndex].slice());
            newRowLabels.push(rowLabels[sourceRowIndex]);
        }

        currentMatrixA = newA;
        currentMatrixI = newI;
        rowLabels = newRowLabels;

        freezeLastTable();
        selectedPivot = null;
        stepCount++;
        appendNewStep(currentMatrixA, currentMatrixI, stepCount);

        // Végi üzenet (nincs "bal oldal")
        stepControls.classList.remove("hidden");
        btnStep.classList.add("hidden");
        btnFinalizeIdentity.classList.add("hidden");
        pivotInfo.innerHTML = "A sorok rendezve lettek.";
        refreshMath(pivotInfo);

        if (stepTitle) stepTitle.textContent = "Kész";
    }

    function createMatrixTable(matrixData, isInteractive, headers, showRowLabels, tableSide) {
        const table = document.createElement("table");
        table.className = "interactive-matrix";
        if (tableSide === "left") table.classList.add("matrix-left");
        if (tableSide === "right") table.classList.add("matrix-right");

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        headerRow.appendChild(document.createElement("th")); // üres sarok

        headers.forEach(h => {
            const th = document.createElement("th");
            th.innerHTML = `$${h}$`;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        for (let r = 0; r < matrixSize; r++) {
            const tr = document.createElement("tr");

            const th = document.createElement("th");
            th.innerHTML = showRowLabels ? `$${rowLabels[r]}$` : "";
            tr.appendChild(th);

            for (let c = 0; c < matrixSize; c++) {
                const td = document.createElement("td");
                td.className = "interactive-cell";
                const val = matrixData[r][c];
                td.textContent = toFraction(val);

                if (isInteractive) {
                    td.onclick = () => {
                        const wrapper = table.closest(".active-wrapper");
                        if (!wrapper) return;
                        handleCellClick(r, c, val, td, table);
                    };
                }

                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        return table;
    }

    function appendNewStep(matA, matI, count) {
        if (count > 0) {
            const arrow = document.createElement("div");
            arrow.innerHTML = "↓";
            arrow.style.textAlign = "center";
            arrow.style.fontSize = "1.5rem";
            arrow.style.color = "#b77b4f";
            arrow.style.margin = "0.5rem 0";
            latexOutput.appendChild(arrow);
        }

        const stepWrapper = document.createElement("div");
        stepWrapper.className = "step-block";
        stepWrapper.style.textAlign = "center";

        const label = document.createElement("h4");
        label.style.color = "#7b4a2d";
        label.textContent = count === 0 ? "Kiindulás: [ A | I ]" : `${count}. lépés eredménye`;
        stepWrapper.appendChild(label);

        const augmentedWrapper = document.createElement("div");
        augmentedWrapper.className = "augmented-matrix-wrapper active-wrapper";

        // Bal tábla: A (fix oszlopcímkék a1..an)
        const tableA = createMatrixTable(matA, true, colLabels, true, "left");

        // Jobb tábla: I (fix e1..en oszlopcímkék)
        const eHeaders = Array.from({ length: matrixSize }, (_, i) => `e_{${i + 1}}`);
        const tableI = createMatrixTable(matI, false, eHeaders, false, "right");

        augmentedWrapper.appendChild(tableA);
        augmentedWrapper.appendChild(tableI);
        stepWrapper.appendChild(augmentedWrapper);

        latexOutput.appendChild(stepWrapper);

        refreshMath(stepWrapper);
        stepWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function calculateDeterminant(m) {
        if (m.length === 1) return m[0][0];
        if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];

        let det = 0;
        for (let c = 0; c < m.length; c++) {
            const sign = (c % 2 === 0) ? 1 : -1;
            const subMatrix = m.slice(1).map(row => row.filter((_, colIndex) => colIndex !== c));
            det += sign * m[0][c] * calculateDeterminant(subMatrix);
        }
        return det;
    }

    // 1. Mátrix keret létrehozása
    btnCreate.addEventListener("click", () => {
        const n = parseInt(sizeInput.value, 10);

        if (isNaN(n) || n < 2 || n > 5) {
            alert("A mátrix mérete 2 és 5 között lehet.");
            return;
        }

        matrixSize = n;
        stepCount = 0;
        selectedPivot = null;

        gridContainer.innerHTML = "";
        gridContainer.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const input = document.createElement("input");
                input.type = "number";
                input.className = "matrix-cell";
                gridContainer.appendChild(input);
            }
        }

        inputWrapper.classList.remove("hidden");
        displayArea.classList.add("hidden");
        singularWarning.classList.add("hidden");
        latexOutput.innerHTML = "";

        hideAllControls();

        if (stepTitle) stepTitle.textContent = "Induló állapot $[A \\mid I]$";
    });

    btnFillRandom.addEventListener("click", () => {
        const inputs = gridContainer.querySelectorAll("input");
        inputs.forEach(input => {
            input.value = Math.floor(Math.random() * 21) - 10;
        });
    });

    // 2. Számítás indítása
    btnShow.addEventListener("click", () => {
        const inputs = gridContainer.querySelectorAll("input");

        currentMatrixA = [];
        let currentRow = [];

        inputs.forEach((input, index) => {
            currentRow.push(parseFloat(input.value) || 0);
            if ((index + 1) % matrixSize === 0) {
                currentMatrixA.push(currentRow);
                currentRow = [];
            }
        });

        currentMatrixI = Array.from({ length: matrixSize }, (_, i) =>
            Array.from({ length: matrixSize }, (_, j) => (i === j ? 1 : 0))
        );

        // Címkék
        rowLabels = Array.from({ length: matrixSize }, (_, i) => `e_{${i + 1}}`);
        colLabels = Array.from({ length: matrixSize }, (_, i) => `a_{${i + 1}}`);

        const det = calculateDeterminant(currentMatrixA);
        if (Math.abs(det) < 1e-9) singularWarning.classList.remove("hidden");
        else singularWarning.classList.add("hidden");

        stepCount = 0;
        selectedPivot = null;

        latexOutput.innerHTML = "";
        displayArea.classList.remove("hidden");

        hideAllControls();
        appendNewStep(currentMatrixA, currentMatrixI, stepCount);

        if (stepTitle) stepTitle.textContent = "Induló állapot $[A \\mid I]$";
        refreshMath(stepTitle);
    });

    // 3. Lépés végrehajtása (CSAK kijelölt pivot esetén)
    btnStep.addEventListener("click", () => {
        if (!selectedPivot) return;

        // sorcímke frissítése
        rowLabels[selectedPivot.row] = colLabels[selectedPivot.col];

        freezeLastTable();
        performGaussJordanStep(selectedPivot.row, selectedPivot.col);

        selectedPivot = null;
        stepCount++;
        appendNewStep(currentMatrixA, currentMatrixI, stepCount);

        // kijelölés megszűnt -> csak akkor látszanak gombok, ha kell (rendezés) / vagy új kijelölés történik
        updateFinalizeButtonVisibility();
    });

    // 4. Sorok egységmátrix szerinti rendezése
    btnFinalizeIdentity.addEventListener("click", () => {
        reorderRowsToIdentity();
    });
});