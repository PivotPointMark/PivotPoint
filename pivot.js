// ======================
// PIVOT.JS – Interaktív Gauss-elimináció + Det ellenőrzés
// ======================

document.addEventListener("DOMContentLoaded", () => {
    const sizeInput = document.getElementById("matrix-size");
    const btnCreate = document.getElementById("btn-create-grid");
    const btnShow = document.getElementById("btn-show-matrix");
    
    const inputWrapper = document.getElementById("matrix-input-wrapper");
    const gridContainer = document.getElementById("matrix-grid");
    
    const displayArea = document.getElementById("matrix-display-area");
    const latexOutput = document.getElementById("latex-output");
    
    const stepControls = document.getElementById("step-controls");
    const pivotInfo = document.getElementById("selected-pivot-info");
    const btnStep = document.getElementById("btn-perform-step");
    const stepTitle = document.getElementById("step-title");

    const singularWarning = document.getElementById("singular-warning"); // ÚJ ELEM
  
    // ÁLLAPOT KEZELÉS
    let currentMatrixData = [];
    let matrixSize = 0;
    let selectedPivot = null;
    let stepCount = 0;

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
  
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const input = document.createElement("input");
          input.type = "number";
          input.className = "matrix-cell";
          input.dataset.row = r;
          input.dataset.col = c;
          input.value = ""; 
          input.addEventListener("focus", () => input.select());
          gridContainer.appendChild(input);
        }
      }
  
      inputWrapper.classList.remove("hidden");
      displayArea.classList.add("hidden");
      stepControls.classList.add("hidden");
      singularWarning.classList.add("hidden"); // Reset
    });
  
    // 2. Kezdő mátrix beolvasása és ELLENŐRZÉS
    btnShow.addEventListener("click", () => {
      const inputs = gridContainer.querySelectorAll("input");
      currentMatrixData = [];
      let currentRow = [];
  
      inputs.forEach((input, index) => {
        let val = input.value === "" ? 0 : parseFloat(input.value);
        if (isNaN(val)) val = 0; 
        currentRow.push(val);
        if ((index + 1) % matrixSize === 0) {
          currentMatrixData.push(currentRow);
          currentRow = [];
        }
      });
  
      stepCount = 1;
      
      // --- ÚJ RÉSZ: DETERMINÁNS ELLENŐRZÉS ---
      const det = calculateDeterminant(currentMatrixData);
      
      if (Math.abs(det) < 1e-9) {
          singularWarning.classList.remove("hidden"); // Üzenet megjelenítése
      } else {
          singularWarning.classList.add("hidden"); // Üzenet elrejtése
      }
      // ----------------------------------------

      updateDisplay();
    });

    // 3. LÉPÉS VÉGREHAJTÁSA
    btnStep.addEventListener("click", () => {
        if (!selectedPivot) return;
        performGaussStep(selectedPivot.row, selectedPivot.col);
        selectedPivot = null;
        stepCount++;
        updateDisplay();
    });

    function updateDisplay() {
        stepTitle.textContent = `${stepCount}. lépés: Válassz pivot elemet!`;
        stepControls.classList.add("hidden");
        displayArea.classList.remove("hidden");
        renderInteractiveMatrix(currentMatrixData, matrixSize);
    }

    function renderInteractiveMatrix(matrix, n) {
        latexOutput.innerHTML = ""; 

        const wrapper = document.createElement("div");
        wrapper.className = "interactive-matrix-container";

        const table = document.createElement("table");
        table.className = "interactive-matrix";

        for (let r = 0; r < n; r++) {
            const tr = document.createElement("tr");
            for (let c = 0; c < n; c++) {
                const td = document.createElement("td");
                td.className = "interactive-cell";
                
                let val = matrix[r][c];
                let displayVal = Math.abs(Math.round(val) - val) < 1e-9 
                    ? Math.round(val) 
                    : val.toFixed(2);

                td.textContent = displayVal;
                td.onclick = () => handleCellClick(r, c, val, td, table);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        wrapper.appendChild(table);
        latexOutput.appendChild(wrapper);
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

        pivotInfo.innerHTML = `Választott pivot: <span style="color:var(--color-primary); font-size:1.2em;">${parseFloat(val.toFixed(2))}</span> <br><small>(Sor: ${r+1}, Oszlop: ${c+1})</small>`;
        stepControls.classList.remove("hidden");
    }

    function performGaussStep(pRow, pCol) {
        const n = matrixSize;
        const pivotVal = currentMatrixData[pRow][pCol];

        for (let j = 0; j < n; j++) {
            currentMatrixData[pRow][j] = currentMatrixData[pRow][j] / pivotVal;
        }
        currentMatrixData[pRow][pCol] = 1;

        for (let i = 0; i < n; i++) {
            if (i !== pRow) {
                const factor = currentMatrixData[i][pCol];
                if (Math.abs(factor) < 1e-9) continue;

                for (let j = 0; j < n; j++) {
                    currentMatrixData[i][j] = currentMatrixData[i][j] - (factor * currentMatrixData[pRow][j]);
                }
                currentMatrixData[i][pCol] = 0;
            }
        }
    }

    // --- ÚJ SEGÉDFÜGGVÉNY: Rekurzív Determináns Számító ---
    function calculateDeterminant(m) {
        // Alapeset: 1x1-es mátrix (bár itt min 2x2 van, de biztosra megyünk)
        if (m.length === 1) return m[0][0];
        
        // Alapeset: 2x2-es mátrix (ad-bc)
        if (m.length === 2) {
            return m[0][0] * m[1][1] - m[0][1] * m[1][0];
        }

        // Rekurzió (Kifejtés az első sor szerint)
        let det = 0;
        for (let c = 0; c < m.length; c++) {
            // Előjel: (-1)^c
            const sign = (c % 2 === 0) ? 1 : -1;
            
            // Minor mátrix képzése (az első sor és a c. oszlop elhagyása)
            const subMatrix = m.slice(1).map(row => 
                row.filter((_, colIndex) => colIndex !== c)
            );
            
            det += sign * m[0][c] * calculateDeterminant(subMatrix);
        }
        return det;
    }
});