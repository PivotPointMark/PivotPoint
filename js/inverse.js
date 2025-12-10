// ======================
// INVERSE.JS – Gauss-Jordan Invertálás
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
    const stepTitle = document.getElementById("step-title");
    const singularWarning = document.getElementById("singular-warning");
  
    // ÁLLAPOT
    let currentMatrixA = []; // Bal oldal (A)
    let currentMatrixI = []; // Jobb oldal (Egységmátrix)
    let matrixSize = 0;
    let selectedPivot = null; 
    let stepCount = 0;

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
      singularWarning.classList.add("hidden");
      latexOutput.innerHTML = ""; 
    });

    // Véletlen kitöltés
    btnFillRandom.addEventListener("click", () => {
        const inputs = gridContainer.querySelectorAll("input");
        inputs.forEach(input => {
            const randomVal = Math.floor(Math.random() * 21) - 10;
            input.value = randomVal;
        });
    });
  
    // 2. Számítás indítása (A és I inicializálása)
    btnShow.addEventListener("click", () => {
      const inputs = gridContainer.querySelectorAll("input");
      currentMatrixA = [];
      let currentRow = [];
  
      // A mátrix beolvasása
      inputs.forEach((input, index) => {
        let val = input.value === "" ? 0 : parseFloat(input.value);
        if (isNaN(val)) val = 0; 
        currentRow.push(val);
        if ((index + 1) % matrixSize === 0) {
          currentMatrixA.push(currentRow);
          currentRow = [];
        }
      });

      // I (Egységmátrix) létrehozása
      currentMatrixI = [];
      for(let r=0; r<matrixSize; r++) {
          let row = [];
          for(let c=0; c<matrixSize; c++) {
              row.push(r === c ? 1 : 0);
          }
          currentMatrixI.push(row);
      }
  
      // Det ellenőrzés
      const det = calculateDeterminant(currentMatrixA);
      if (Math.abs(det) < 1e-9) singularWarning.classList.remove("hidden");
      else singularWarning.classList.add("hidden");

      stepCount = 0;
      latexOutput.innerHTML = ""; 
      displayArea.classList.remove("hidden");
      stepTitle.style.display = "none"; 

      // Kirajzoljuk a [A | I] párost
      appendNewStep(currentMatrixA, currentMatrixI, stepCount);
    });

    // 3. LÉPÉS VÉGREHAJTÁSA
    btnStep.addEventListener("click", () => {
        if (!selectedPivot) return;

        freezeLastTable();
        
        // Művelet mindkét mátrixon
        performGaussJordanStep(selectedPivot.row, selectedPivot.col);

        selectedPivot = null;
        stepControls.classList.add("hidden"); 
        stepCount++;

        appendNewStep(currentMatrixA, currentMatrixI, stepCount);
    });

    /**
     * Új lépés kirajzolása (Két mátrix egymás mellett)
     */
    function appendNewStep(matA, matI, count) {
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
        if (count === 0) label.textContent = "Kiindulás: [ A | I ]";
        else label.textContent = `${count}. lépés eredménye`;
        
        // KONTÉNER A KÉT TÁBLÁZATNAK
        const augmentedWrapper = document.createElement("div");
        augmentedWrapper.className = "augmented-matrix-wrapper active-wrapper"; // active-wrapper jelzi a kattinthatóságot

        // --- BAL TÁBLA (A) - Interaktív ---
        const tableA = createMatrixTable(matA, true); 
        tableA.classList.add("matrix-left");
        
        // --- JOBB TÁBLA (I) - Passzív ---
        const tableI = createMatrixTable(matI, false);
        tableI.classList.add("matrix-right");

        augmentedWrapper.appendChild(tableA);
        augmentedWrapper.appendChild(tableI);

        stepWrapper.appendChild(label);
        stepWrapper.appendChild(augmentedWrapper);
        latexOutput.appendChild(stepWrapper);

        stepWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /**
     * Segédfüggvény táblázat gyártáshoz
     * isInteractive: true (A mátrix), false (I mátrix)
     */
    function createMatrixTable(matrixData, isInteractive) {
        const table = document.createElement("table");
        table.className = "interactive-matrix";

        for (let r = 0; r < matrixSize; r++) {
            const tr = document.createElement("tr");
            for (let c = 0; c < matrixSize; c++) {
                const td = document.createElement("td");
                td.className = "interactive-cell";
                
                let val = matrixData[r][c];
                let displayVal = Math.abs(Math.round(val) - val) < 1e-9 ? Math.round(val) : val.toFixed(2);
                td.textContent = displayVal;

                if (isInteractive) {
                    td.onclick = () => {
                        // Keresünk a szülő wrapperben 'active-wrapper' osztályt
                        const wrapper = table.closest('.augmented-matrix-wrapper');
                        if (!wrapper || !wrapper.classList.contains("active-wrapper")) return;

                        handleCellClick(r, c, val, td, table);
                    };
                }

                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        return table;
    }

    function freezeLastTable() {
        const activeWrapper = latexOutput.querySelector(".active-wrapper");
        if (activeWrapper) {
            activeWrapper.classList.remove("active-wrapper");
            // Halványítás
            const cells = activeWrapper.querySelectorAll("td");
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
        // Előző kijelölés törlése a táblázatból
        const prev = tableElement.querySelector(".selected");
        if (prev) prev.classList.remove("selected");

        cellElement.classList.add("selected");
        selectedPivot = { row: r, col: c, value: val };

        pivotInfo.innerHTML = `Választott pivot: <span style="color:var(--color-primary); font-size:1.2em;">${parseFloat(val.toFixed(2))}</span>`;
        stepControls.classList.remove("hidden");
    }

    /**
     * GAUSS-JORDAN LÉPÉS MINDKÉT MÁTRIXON
     */
    function performGaussJordanStep(pRow, pCol) {
        const n = matrixSize;
        
        // Másolatok készítése
        let newA = currentMatrixA.map(row => row.slice());
        let newI = currentMatrixI.map(row => row.slice());
        
        const pivotVal = newA[pRow][pCol];

        // 1. SOR LEOSZTÁSA (Mindkét mátrixban!)
        for (let j = 0; j < n; j++) {
            newA[pRow][j] /= pivotVal;
            newI[pRow][j] /= pivotVal;
        }
        newA[pRow][pCol] = 1; // Korrekció

        // 2. KINULLÁZÁS (Mindkét mátrixban!)
        for (let i = 0; i < n; i++) {
            if (i !== pRow) {
                const factor = newA[i][pCol];
                if (Math.abs(factor) < 1e-9) continue;

                for (let j = 0; j < n; j++) {
                    newA[i][j] -= factor * newA[pRow][j];
                    newI[i][j] -= factor * newI[pRow][j];
                }
                newA[i][pCol] = 0; // Korrekció
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