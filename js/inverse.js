// ======================
// INVERSE.JS – Gauss-Jordan Invertálás Báziscserével és Tört alakú megjelenítéssel
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

    // ÁLLAPOT
    let currentMatrixA = []; 
    let currentMatrixI = [];
    let matrixSize = 0;
    let selectedPivot = null; 
    let stepCount = 0;
    let rowLabels = []; // Sorok címkéi (e1, e2...)
    let colLabels = []; // Oszlopok címkéi (a1, a2...)

    // --- SEGÉDFÜGGVÉNY: TIZEDES TÖRT -> KÖZÖNSÉGES TÖRT (Szép megjelenítéshez) ---
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

    // 1. Mátrix keret létrehozása
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
      stepControls.classList.add("hidden");
      singularWarning.classList.add("hidden");
      latexOutput.innerHTML = ""; 
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

      currentMatrixI = Array.from({length: matrixSize}, (_, i) => 
          Array.from({length: matrixSize}, (_, j) => i === j ? 1 : 0)
      );

      // Címkék inicializálása
      rowLabels = Array.from({length: matrixSize}, (_, i) => `e_{${i+1}}`);
      colLabels = Array.from({length: matrixSize}, (_, i) => `a_{${i+1}}`);
  
      const det = calculateDeterminant(currentMatrixA);
      if (Math.abs(det) < 1e-9) singularWarning.classList.remove("hidden");
      else singularWarning.classList.add("hidden");

      stepCount = 0;
      latexOutput.innerHTML = ""; 
      displayArea.classList.remove("hidden");
      appendNewStep(currentMatrixA, currentMatrixI, stepCount);
    });

    // 3. LÉPÉS VÉGREHAJTÁSA
    btnStep.addEventListener("click", () => {
        if (!selectedPivot) return;

        // BÁZISCSERE: Sor- és oszlopcímke megcserélése
        const oldRow = rowLabels[selectedPivot.row];
        const oldCol = colLabels[selectedPivot.col];
        rowLabels[selectedPivot.row] = oldCol;
        colLabels[selectedPivot.col] = oldRow;

        freezeLastTable();
        performGaussJordanStep(selectedPivot.row, selectedPivot.col);

        selectedPivot = null;
        stepControls.classList.add("hidden"); 
        stepCount++;
        appendNewStep(currentMatrixA, currentMatrixI, stepCount);
    });

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

        // Táblázatok generálása fejléccel (toFraction használatával a tizedes helyett)
        const tableA = createMatrixTable(matA, true, colLabels); 
        tableA.classList.add("matrix-left");
        const tableI = createMatrixTable(matI, false, Array.from({length: matrixSize}, (_, i) => `e_{${i+1}}`));
        tableI.classList.add("matrix-right");

        augmentedWrapper.appendChild(tableA);
        augmentedWrapper.appendChild(tableI);
        stepWrapper.appendChild(augmentedWrapper);
        latexOutput.appendChild(stepWrapper);

        if (window.MathJax) MathJax.typesetPromise([stepWrapper]);
        stepWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function createMatrixTable(matrixData, isInteractive, headers) {
        const table = document.createElement("table");
        table.className = "interactive-matrix";

        // Fejléc (a1, a2... vagy e1, e2...)
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
            
            // Sor címke (e1, a1...)
            const th = document.createElement("th");
            th.innerHTML = isInteractive ? `$${rowLabels[r]}$` : ""; 
            tr.appendChild(th);

            for (let c = 0; c < matrixSize; c++) {
                const td = document.createElement("td");
                td.className = "interactive-cell";
                let val = matrixData[r][c];
                // Tizedes megjelenítés helyett tört megjelenítés hívása
                td.textContent = toFraction(val);

                if (isInteractive) {
                    td.onclick = () => {
                        const wrapper = table.closest('.active-wrapper');
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

    function freezeLastTable() {
        const activeWrapper = latexOutput.querySelector(".active-wrapper");
        if (activeWrapper) {
            activeWrapper.classList.remove("active-wrapper");
            activeWrapper.querySelectorAll("td").forEach(td => td.style.cursor = "default");
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

        pivotInfo.innerHTML = `Választott pivot: <span style="color:var(--color-primary); font-size:1.1em;">$${rowLabels[r]} \\leftrightarrow ${colLabels[c]}$</span> (Értéke: ${toFraction(val)})`;
        stepControls.classList.remove("hidden");
        if (window.MathJax) MathJax.typesetPromise([pivotInfo]);
    }

    function performGaussJordanStep(pRow, pCol) {
        const n = matrixSize;
        const pivotVal = currentMatrixA[pRow][pCol];
        let newA = currentMatrixA.map(row => row.slice());
        let newI = currentMatrixI.map(row => row.slice());

        for (let j = 0; j < n; j++) {
            newA[pRow][j] /= pivotVal;
            newI[pRow][j] /= pivotVal;
        }

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
});