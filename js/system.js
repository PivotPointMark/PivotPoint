// ======================
// SYSTEM.JS – Lineáris egyenletrendszer megoldó (Gauss-Jordan)
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
    let currentMatrixA = []; // Bal oldal (A mátrix: n x n)
    let currentVectorB = []; // Jobb oldal (b vektor: n x 1)
    let matrixSize = 0;
    let selectedPivot = null; 
    let stepCount = 0;

    // 1. Mátrix keret létrehozása (n x (n+1) rács)
    btnCreate.addEventListener("click", () => {
        const n = parseInt(sizeInput.value);
        if (isNaN(n) || n < 2 || n > 5) {
            alert("Az ismeretlenek száma 2 és 5 között lehet.");
            return;
        }
        matrixSize = n;
        stepCount = 0;

        gridContainer.innerHTML = "";
        // Itt n+1 oszlop kell (n darab A együttható + 1 darab b vektor)
        gridContainer.style.gridTemplateColumns = `repeat(${n + 1}, 1fr)`;

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n + 1; c++) {
                const input = document.createElement("input");
                input.type = "number";
                input.className = "matrix-cell";
                input.dataset.row = r;
                input.dataset.col = c;
                input.value = ""; 
                input.addEventListener("focus", () => input.select());

                // Vizuális elválasztás a 'b' vektornak (az utolsó oszlop)
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
        singularWarning.classList.add("hidden");
        latexOutput.innerHTML = ""; 
    });

    // 2. Véletlen kitöltés - NEHEZÍTETT OKOS GENERÁTOR (Mindig egész megoldást ad)
    btnFillRandom.addEventListener("click", () => {
        const n = matrixSize;
        
        let A = [];
        let x = [];
        let b = [];
        let valid = false;
        let attempts = 0;

        // Addig keverjük, amíg "szép" és "kellően nehéz" mátrixot nem kapunk
        while (!valid && attempts < 1500) {
            attempts++;
            
            // 1. Induljunk ki egységmátrixból
            A = Array.from({length: n}, (_, i) => 
                Array.from({length: n}, (_, j) => i === j ? 1 : 0)
            );

            // 2. Sorműveletek nagyobb szorzókkal
            const rowIterations = n * 3; 
            for (let step = 0; step < rowIterations; step++) {
                let r1 = Math.floor(Math.random() * n);
                let r2 = Math.floor(Math.random() * n);
                if (r1 !== r2) {
                    // Nagyobb szorzók, hogy nőjenek a számok (-3..3)
                    let possibleK = [-3, -2, -1, 1, 2, 3]; 
                    let k = possibleK[Math.floor(Math.random() * possibleK.length)];
                    for (let c = 0; c < n; c++) {
                        A[r1][c] += k * A[r2][c];
                    }
                }
            }

            // 3. Oszlopműveletek (hogy a mintázatok is eltűnjenek)
            const colIterations = n * 2;
            for (let step = 0; step < colIterations; step++) {
                let c1 = Math.floor(Math.random() * n);
                let c2 = Math.floor(Math.random() * n);
                if (c1 !== c2) {
                    let possibleK = [-2, -1, 1, 2];
                    let k = possibleK[Math.floor(Math.random() * possibleK.length)];
                    for (let r = 0; r < n; r++) {
                        A[r][c1] += k * A[r][c2];
                    }
                }
            }

            // 4. Sorcsere a randomabb kinézetért
            for(let step = 0; step < n; step++) {
                let r1 = Math.floor(Math.random() * n);
                let r2 = Math.floor(Math.random() * n);
                let temp = A[r1];
                A[r1] = A[r2];
                A[r2] = temp;
            }

            // 5. Ellenőrizzük a nehézséget
            let maxVal = 0;
            let zeroCount = 0;
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    let absVal = Math.abs(A[r][c]);
                    if (absVal > maxVal) maxVal = absVal;
                    if (absVal === 0) zeroCount++;
                }
            }

            // Feltétel: Legyen legalább 5-ös szám benne, max 35-ig, és ne legyen tele nullával
            if (maxVal >= 5 && maxVal <= 35 && zeroCount <= n - 1) {
                valid = true;
            }
        }

        // 6. Generáljuk le a végeredményt (x vektor) egészekből (-5 és 5 között)
        for (let i = 0; i < n; i++) {
            x.push(Math.floor(Math.random() * 11) - 5); 
        }

        // 7. Számoljuk ki a b vektort: b = A * x
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                sum += A[i][j] * x[j];
            }
            b.push(sum);
        }

        // 8. Írjuk be a mezőkbe a mátrixot és a b vektort
        const inputs = gridContainer.querySelectorAll("input");
        inputs.forEach((input, index) => {
            let r = Math.floor(index / (n + 1));
            let c = index % (n + 1);
            
            if (c < n) {
                input.value = A[r][c]; // A mátrix elemei
            } else {
                input.value = b[r];    // b vektor elemei
            }
        });
    });

    // 3. Számítás indítása (A és b inicializálása)
    btnShow.addEventListener("click", () => {
        const inputs = gridContainer.querySelectorAll("input");
        currentMatrixA = [];
        currentVectorB = [];
        
        let currentRowA = [];
        let currentRowB = [];

        // A mátrix beolvasása
        inputs.forEach((input, index) => {
            let val = input.value === "" ? 0 : parseFloat(input.value);
            if (isNaN(val)) val = 0; 
            
            let c = index % (matrixSize + 1);
            
            if (c < matrixSize) {
                currentRowA.push(val);
            } else {
                currentRowB.push(val);
                currentMatrixA.push(currentRowA);
                currentVectorB.push(currentRowB);
                currentRowA = [];
                currentRowB = [];
            }
        });

        // Det ellenőrzés
        const det = calculateDeterminant(currentMatrixA);
        if (Math.abs(det) < 1e-9) singularWarning.classList.remove("hidden");
        else singularWarning.classList.add("hidden");

        stepCount = 0;
        latexOutput.innerHTML = ""; 
        displayArea.classList.remove("hidden");
        stepTitle.style.display = "none"; 

        // Kirajzoljuk a [A | b] párost
        appendNewStep(currentMatrixA, currentVectorB, stepCount);
    });

    // 4. LÉPÉS VÉGREHAJTÁSA
    btnStep.addEventListener("click", () => {
        if (!selectedPivot) return;

        freezeLastTable();
        
        // Művelet mindkét mátrixon
        performGaussJordanStep(selectedPivot.row, selectedPivot.col);

        selectedPivot = null;
        stepControls.classList.add("hidden"); 
        stepCount++;

        appendNewStep(currentMatrixA, currentVectorB, stepCount);
    });

    /**
     * Új lépés kirajzolása (A és b egymás mellett)
     */
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
        
        if (count === 0) label.textContent = "Kiindulás: [ A | b ] (Válassz pivotot az A részben!)";
        else label.textContent = `${count}. lépés eredménye`;
        
        // KONTÉNER A KÉT TÁBLÁZATNAK
        const augmentedWrapper = document.createElement("div");
        augmentedWrapper.className = "augmented-matrix-wrapper active-wrapper";

        // --- BAL TÁBLA (A) - Interaktív ---
        const tableA = createMatrixTable(matA, true);
        tableA.classList.add("matrix-left");
        
        // --- JOBB TÁBLA (b) - Passzív ---
        const tableB = createMatrixTable(vecB, false);
        tableB.classList.add("matrix-right");

        augmentedWrapper.appendChild(tableA);
        augmentedWrapper.appendChild(tableB);

        stepWrapper.appendChild(label);
        stepWrapper.appendChild(augmentedWrapper);
        latexOutput.appendChild(stepWrapper);

        // Ellenőrizzük, hogy készen vagyunk-e (Egységmátrix van-e bal oldalt)
        if (checkIfSolved(matA)) {
            augmentedWrapper.classList.remove("active-wrapper");
            freezeLastTable(); // Letiltjuk a további kattintást
            showFinalSolution(vecB, stepWrapper);
        } else {
            stepWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    /**
     * Segédfüggvény HTML táblázat gyártáshoz
     */
    function createMatrixTable(matrixData, isInteractive) {
        const table = document.createElement("table");
        table.className = "interactive-matrix";
        const rows = matrixData.length;
        const cols = matrixData[0].length;

        for (let r = 0; r < rows; r++) {
            const tr = document.createElement("tr");
            for (let c = 0; c < cols; c++) {
                const td = document.createElement("td");
                td.className = "interactive-cell";
                
                let val = matrixData[r][c];
                let displayVal = Math.abs(Math.round(val) - val) < 1e-9 ? Math.round(val) : val.toFixed(2);
                td.textContent = displayVal;

                if (isInteractive) {
                    td.onclick = () => {
                        const wrapper = table.closest('.augmented-matrix-wrapper');
                        if (!wrapper || !wrapper.classList.contains("active-wrapper")) return;
                        handleCellClick(r, c, val, td, table);
                    };
                } else {
                    td.style.backgroundColor = "#faf5f0";
                    td.style.fontWeight = "bold";
                    td.style.color = "#5f4939";
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
        pivotInfo.innerHTML = `Választott pivot: <span style="color:var(--color-primary); font-size:1.2em;">${parseFloat(val.toFixed(2))}</span>`;
        stepControls.classList.remove("hidden");
    }

    /**
     * GAUSS-JORDAN LÉPÉS A és b mátrixokon
     */
    function performGaussJordanStep(pRow, pCol) {
        const n = matrixSize;
        let newA = currentMatrixA.map(row => row.slice());
        let newB = currentVectorB.map(row => row.slice());
        
        const pivotVal = newA[pRow][pCol];
        
        // 1. SOR LEOSZTÁSA (Mindkét mátrixban!)
        for (let j = 0; j < n; j++) newA[pRow][j] /= pivotVal;
        newB[pRow][0] /= pivotVal;

        newA[pRow][pCol] = 1;

        // 2. KINULLÁZÁS a többi sorban
        for (let i = 0; i < n; i++) {
            if (i !== pRow) {
                const factor = newA[i][pCol];
                if (Math.abs(factor) < 1e-9) continue;

                for (let j = 0; j < n; j++) {
                    newA[i][j] -= factor * newA[pRow][j];
                }
                newB[i][0] -= factor * newB[pRow][0];
                newA[i][pCol] = 0; 
            }
        }
        
        currentMatrixA = newA;
        currentVectorB = newB;
    }

    /**
     * Ellenőrzi, hogy A mátrix átalakult-e egységmátrixszá
     */
    function checkIfSolved(matA) {
        for(let r = 0; r < matrixSize; r++) {
            for(let c = 0; c < matrixSize; c++) {
                let expected = (r === c) ? 1 : 0;
                if(Math.abs(matA[r][c] - expected) > 1e-6) return false;
            }
        }
        return true;
    }

    /**
     * Kiírja a végső x1, x2... megoldásokat
     */
    function showFinalSolution(vecB, container) {
        const solutionDiv = document.createElement("div");
        solutionDiv.className = "generation-result";
        solutionDiv.style.marginTop = "2rem";
        
        let latexStr = `\\begin{aligned}\n`;
        for(let i = 0; i < matrixSize; i++) {
            let val = vecB[i][0];
            let displayVal = Math.abs(Math.round(val) - val) < 1e-9 ? Math.round(val) : val.toFixed(2);
            latexStr += `x_${i+1} &= ${displayVal} \\\\\n`;
        }
        latexStr += `\\end{aligned}`;

        solutionDiv.innerHTML = `<p style="margin-bottom:1rem; font-weight:bold;">A feladatot sikeresen megoldottad!</p> $$${latexStr}$$`;
        
        container.appendChild(solutionDiv);
        
        if (window.MathJax) {
            MathJax.typesetPromise([solutionDiv]).then(() => {
                container.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }
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