// ======================
// CREATE_MATRIX.JS – Speciális mátrix generáló és szerkesztő
// ======================

document.addEventListener("DOMContentLoaded", () => {
    const sizeInput = document.getElementById("matrix-size");
    const btnCreate = document.getElementById("btn-create-grid");
    const btnShow = document.getElementById("btn-show-matrix");
    
    // Speciális gombok
    const btnLowerZero = document.getElementById("btn-lower-zero");
    const btnDiagOne = document.getElementById("btn-diag-one");
    const btnUpperRand = document.getElementById("btn-upper-rand");
    const btnFillAll = document.getElementById("btn-fill-all");

    const inputWrapper = document.getElementById("matrix-input-wrapper");
    const gridContainer = document.getElementById("matrix-grid");
    const latexOutput = document.getElementById("latex-output");
    const displayArea = document.getElementById("matrix-display-area");

    // --- MŰVELETI KÁRTYÁK KEZELÉSE ---
    const opCards = document.querySelectorAll(".op-card");
    const opsGrid = document.querySelector(".ops-grid");

    // Kártya kiválasztás logika
    opCards.forEach(card => {
        card.addEventListener("click", (e) => {
            // Ha a gombra vagy inputra kattintott, ne vegye el a fókuszt
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;

            // Aktiválás
            opCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            opsGrid.classList.add("has-active");
        });
    });

    // Ha mellékattint, reset (opcionális, de kényelmesebb így hagyni)

    // --- ALAP FUNKCIÓK ---

    // 1. Keret létrehozása
    btnCreate.addEventListener("click", () => {
      const n = parseInt(sizeInput.value);
      if (isNaN(n) || n < 2 || n > 5) {
        alert("A mátrix mérete 2 és 5 között lehet.");
        return;
      }
  
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
      
      // Reset ops
      opCards.forEach(c => c.classList.remove("active"));
      opsGrid.classList.remove("has-active");
    });

    // --- SEGÉDFÜGGVÉNYEK A KITÖLTÉSHEZ ---
    function getInputs() {
        return gridContainer.querySelectorAll("input");
    }

    function readMatrix() {
        const n = parseInt(sizeInput.value);
        let matrix = [];
        let row = [];
        getInputs().forEach((input, i) => {
            let val = input.value === "" ? 0 : parseFloat(input.value);
            row.push(val);
            if ((i + 1) % n === 0) {
                matrix.push(row);
                row = [];
            }
        });
        return matrix;
    }

    function writeMatrix(matrix) {
        const inputs = getInputs();
        let idx = 0;
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix.length; c++) {
                inputs[idx].value = matrix[r][c];
                idx++;
            }
        }
        // Frissítsük a LaTeX kimenetet is, ha látszik
        if (!displayArea.classList.contains("hidden")) {
            renderLatex(matrix);
        }
    }

    function renderLatex(matrix) {
        const rowsLatex = matrix
            .map(row => row.join(" & "))
            .join(" \\\\ ");
        const latexString = `$$ A = \\begin{pmatrix} ${rowsLatex} \\end{pmatrix} $$`;
        latexOutput.innerHTML = latexString;
        displayArea.classList.remove("hidden");
        if (window.MathJax) MathJax.typesetPromise([latexOutput]);
    }

    // --- ESZKÖZTÁR GOMBOK ---
    
    btnLowerZero.addEventListener("click", () => {
        getInputs().forEach(input => {
            if (parseInt(input.dataset.row) > parseInt(input.dataset.col)) input.value = 0;
        });
    });

    btnDiagOne.addEventListener("click", () => {
        getInputs().forEach(input => {
            if (parseInt(input.dataset.row) === parseInt(input.dataset.col)) input.value = 1;
        });
    });

    btnUpperRand.addEventListener("click", () => {
        getInputs().forEach(input => {
            if (parseInt(input.dataset.row) < parseInt(input.dataset.col)) {
                input.value = Math.floor(Math.random() * 21) - 10;
            }
        });
    });

    btnFillAll.addEventListener("click", () => {
        getInputs().forEach(input => {
            const r = parseInt(input.dataset.row);
            const c = parseInt(input.dataset.col);
            if (r > c) input.value = 0;
            else if (r === c) input.value = 1;
            else input.value = Math.floor(Math.random() * 21) - 10;
        });
    });
  
    // Megjelenítés gomb
    btnShow.addEventListener("click", () => {
        renderLatex(readMatrix());
    });

    // --- MŰVELETEK VÉGREHAJTÁSA (Globális függvényekké téve, hogy a HTML onclick lássa) ---

    window.executeRowSwap = function() {
        const r1 = parseInt(document.getElementById("rs-1").value) - 1;
        const r2 = parseInt(document.getElementById("rs-2").value) - 1;
        const n = parseInt(sizeInput.value);

        if (isNaN(r1) || isNaN(r2) || r1 < 0 || r2 < 0 || r1 >= n || r2 >= n) {
            alert(`Érvénytelen sorindexek! (1-${n} között)`); return;
        }

        let M = readMatrix();
        // Sorcsere
        let temp = M[r1];
        M[r1] = M[r2];
        M[r2] = temp;

        writeMatrix(M);
    };

    window.executeColSwap = function() {
        const c1 = parseInt(document.getElementById("cs-1").value) - 1;
        const c2 = parseInt(document.getElementById("cs-2").value) - 1;
        const n = parseInt(sizeInput.value);

        if (isNaN(c1) || isNaN(c2) || c1 < 0 || c2 < 0 || c1 >= n || c2 >= n) {
            alert(`Érvénytelen oszlopindexek! (1-${n} között)`); return;
        }

        let M = readMatrix();
        // Oszlopcsere
        for(let r=0; r<n; r++) {
            let temp = M[r][c1];
            M[r][c1] = M[r][c2];
            M[r][c2] = temp;
        }

        writeMatrix(M);
    };

    window.executeRowCalc = function() {
        // Ri = Ri + k * Rj
        const target = parseInt(document.getElementById("rc-target").value) - 1;
        const source = parseInt(document.getElementById("rc-source").value) - 1;
        const k = parseFloat(document.getElementById("rc-mult").value);
        const n = parseInt(sizeInput.value);

        if (isNaN(target) || isNaN(source) || isNaN(k)) { alert("Hiányzó adatok!"); return; }
        if (target < 0 || target >= n || source < 0 || source >= n) { alert("Rossz indexek!"); return; }
        if (target === source) { alert("A forrás és a cél nem lehet ugyanaz!"); return; }

        let M = readMatrix();
        for(let c=0; c<n; c++) {
            M[target][c] = M[target][c] + (k * M[source][c]);
        }
        writeMatrix(M);
    };

    window.executeColCalc = function() {
        // Ci = Ci + k * Cj
        const target = parseInt(document.getElementById("cc-target").value) - 1;
        const source = parseInt(document.getElementById("cc-source").value) - 1;
        const k = parseFloat(document.getElementById("cc-mult").value);
        const n = parseInt(sizeInput.value);

        if (isNaN(target) || isNaN(source) || isNaN(k)) { alert("Hiányzó adatok!"); return; }
        if (target < 0 || target >= n || source < 0 || source >= n) { alert("Rossz indexek!"); return; }
        if (target === source) { alert("A forrás és a cél nem lehet ugyanaz!"); return; }

        let M = readMatrix();
        for(let r=0; r<n; r++) {
            M[r][target] = M[r][target] + (k * M[r][source]);
        }
        writeMatrix(M);
    };
});