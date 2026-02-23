// ======================
// PIVOT.JS – Bázistranszformáció Törtekkel és Címkecserével
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

    let currentMatrixData = [];
    let matrixSize = 0;
    let selectedPivot = null;
    let stepCount = 0;
    let rowLabels = []; // Sorok bázisvektorai (e1, e2...)
    let colLabels = []; // Oszlopok nevei (a1, a2...)

    // Törté alakító segédfüggvény a megjelenítéshez
    function toFraction(val) {
        if (Math.abs(val) < 1e-10) return "0";
        if (Math.abs(Math.round(val) - val) < 1e-9) return Math.round(val).toString();
        const tolerance = 1.0E-9;
        let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
        let b = val;
        do {
            let a = Math.floor(b);
            let aux = h1; h1 = a * h1 + h2; h2 = aux;
            aux = k1; k1 = a * k1 + k2; k2 = aux;
            b = 1 / (b - a);
        } while (Math.abs(val - h1 / k1) > Math.abs(val) * tolerance);
        return h1 + "/" + k1;
    }

    // 1. Keret létrehozása
    btnCreate.addEventListener("click", () => {
        const n = parseInt(sizeInput.value);
        if (isNaN(n) || n < 2 || n > 5) {
            alert("A mátrix mérete 2 és 5 között lehet.");
            return;
        }
        matrixSize = n;
        stepCount = 0;
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
    });

    btnFillRandom.addEventListener("click", () => {
        const inputs = gridContainer.querySelectorAll("input");
        inputs.forEach(input => {
            input.value = Math.floor(Math.random() * 21) - 10;
        });
    });

    // 2. Kezdő mátrix beolvasása
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

        rowLabels = Array.from({length: matrixSize}, (_, i) => `e_{${i+1}}`);
        colLabels = Array.from({length: matrixSize}, (_, i) => `a_{${i+1}}`);
        
        stepCount = 0;
        latexOutput.innerHTML = "";
        displayArea.classList.remove("hidden");
        appendNewStep(currentMatrixData, stepCount);
    });

    // 3. LÉPÉS VÉGREHAJTÁSA
    btnStep.addEventListener("click", () => {
        if (!selectedPivot) return;
        
        // CÍMKE CSERE
        const oldRow = rowLabels[selectedPivot.row];
        const oldCol = colLabels[selectedPivot.col];
        rowLabels[selectedPivot.row] = oldCol;
        colLabels[selectedPivot.col] = oldRow;

        freezeLastTable();
        performGaussStep(selectedPivot.row, selectedPivot.col);
        
        selectedPivot = null;
        stepCount++;
        appendNewStep(currentMatrixData, stepCount);
        stepControls.classList.add("hidden");
    });

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
        for(let j=0; j < matrixSize; j++) tableHtml += `<th>$${colLabels[j]}$</th>`;
        tableHtml += `</tr></thead><tbody>`;

        for (let r = 0; r < matrixSize; r++) {
            tableHtml += `<tr><th>$${rowLabels[r]}$</th>`;
            for (let c = 0; c < matrixSize; c++) {
                let val = matrixData[r][c];
                tableHtml += `<td class="interactive-cell" data-row="${r}" data-col="${c}" data-val="${val}">${toFraction(val)}</td>`;
            }
            tableHtml += `</tr>`;
        }
        tableHtml += `</tbody></table>`;

        stepWrapper.innerHTML = `<h4>${count === 0 ? "Kiinduló állapot" : count + ". lépés"}</h4>` + tableHtml;
        latexOutput.appendChild(stepWrapper);

        stepWrapper.querySelectorAll(".interactive-cell").forEach(cell => {
            cell.onclick = function() {
                if (!this.closest('.active-matrix')) return;
                const r = parseInt(this.dataset.row);
                const c = parseInt(this.dataset.col);
                const val = parseFloat(this.dataset.val);
                if (Math.abs(val) < 1e-10) { 
                    alert("Nullát nem választhatsz pivotnak!");
                    return; 
                }
                
                stepWrapper.querySelectorAll(".selected").forEach(s => s.classList.remove("selected"));
                this.classList.add("selected");
                selectedPivot = { row: r, col: c, value: val };
                pivotInfo.innerHTML = `Választott pivot: <span style="color:var(--color-primary); font-size:1.1em;">$${rowLabels[r]} \\leftrightarrow ${colLabels[c]}$</span> (Érték: ${toFraction(val)})`;
                stepControls.classList.remove("hidden");
                if (window.MathJax) MathJax.typesetPromise([pivotInfo]);
            };
        });

        if (window.MathJax) MathJax.typesetPromise([stepWrapper]);
        stepWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function freezeLastTable() {
        const last = latexOutput.querySelector(".active-matrix");
        if (last) {
            last.classList.remove("active-matrix");
            last.querySelectorAll("td").forEach(td => td.style.cursor = "default");
        }
    }

    function performGaussStep(pRow, pCol) {
        const n = matrixSize;
        const pivotVal = currentMatrixData[pRow][pCol];
        let newMatrix = currentMatrixData.map(row => row.slice());

        for (let j = 0; j < n; j++) {
            newMatrix[pRow][j] = currentMatrixData[pRow][j] / pivotVal;
        }

        for (let i = 0; i < n; i++) {
            if (i !== pRow) {
                const factor = currentMatrixData[i][pCol];
                for (let j = 0; j < n; j++) {
                    newMatrix[i][j] = currentMatrixData[i][j] - (factor * newMatrix[pRow][j]);
                }
                newMatrix[i][pCol] = 0;
            }
        }
        currentMatrixData = newMatrix;
    }
});