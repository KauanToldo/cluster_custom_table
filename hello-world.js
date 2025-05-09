looker.plugins.visualizations.add({
    id: "hello_world",
    label: "Hello World",
    // options: {
    //   font_size: {
    //     type: "string",
    //     label: "Font Size",
    //     values: [
    //       {"Large": "large"},
    //       {"Small": "small"}
    //     ],
    //     display: "radio",
    //     default: "large"
    //   }
    // },
    // Set up the initial state of the visualization
    create: function(element, config) {
  
      // Insert a <style> tag with some styles we'll use later.
      element.innerHTML = `
        <style>
            .grid-table {
                display: grid;
                width: 100%;
                border: 1px solid #000000;
                border-radius: 8px;
                font-family: Arial, sans-serif;
            }
            .grid-header,
            .grid-row {
                display: contents;
            }
            .grid-cell {
                border-right: 1px solid #ddd;
                border-top: 1px solid #ddd;
                padding: 10px;
                background: white;
                white-space: nowrap;
                font-size: 12px;
                text-decoration: none;
                color: #000000;
            }
            .grid-header-cell {
                font-weight: bold;
                background-color: #f2f2f2;
                font-size: 14px;
                text-align: center;
                display: flex;
                justify-content: center;
                align-items: center;
                // position: sticky;
            }

            // .header-row-1 {
            //     top:0;
            // }

            .pivot-dimension, .dimension {
                background-color: #012C75 !important;
                color: white !important;
            }

            .measure {
                background-color: #007BFF !important;
                color: white !important;
            }

            .grid-cell.numeric.no-right-border {
                border-right: none !important;
            }

            .grid-cell.dim-separator {
                border-right: 2px solid #ddd;
            }

            .grid-header-cell:first-child {
                border-top-left-radius: 8px;
            }
            .grid-header-cell:last-child {
                border-top-right-radius: 8px;
            }
            .numeric {
                text-align: right;
            }

            .grid-cell span span a {
                text-decoration: none;
                color: #000000;
            }

            .grid-row-even {
                background-color: #ffffff;
            }

            .grid-row-odd {
                background-color: #f5f5f5;
            }

            .grid-cell.hovered {
                background-color: #cce5ff !important; /* azul claro para linha/coluna */
            }

            .grid-cell.hovered-cell {
                background-color: #66b3ff !important; /* azul mais escuro para a célula */
            }

            .negative-value {
                color: red;
            }

        </style>
      `;
  
      // Create a container element to let us center the text.
      this._tableContainer = element.appendChild(document.createElement("div"));
    },
    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();
        this._tableContainer.innerHTML = "";

        const pivots = queryResponse.pivots || [];
        const hasPivot = pivots.length > 0;

        const dimensions = queryResponse.fields.dimensions;
        const measures = queryResponse.fields.measures;
        const tableCalcs = queryResponse.fields.table_calculations || [];

        const dimensionCount = dimensions.length;
        const measureCount = measures.length;
        const pivotCount = hasPivot ? pivots.length : 1;
        const totalCols = dimensionCount + (pivotCount * (measureCount + tableCalcs.length));

        // Cria o grid
        const tableGrid = document.createElement("div");
        tableGrid.className = "grid-table";
        tableGrid.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;

        // HEADER ROW 1
        if (hasPivot) {
          // Nome do campo pivotado sobre as dimensões
          const pivotedFieldName = pivots[0]?.metadata?.pivoted_label || pivots[0]?.label || "Pivot"; //não esta pegando o nome do campo pivotado dessa forma
          const pivotedFieldDiv = document.createElement("div");
          pivotedFieldDiv.className = "grid-cell grid-header-cell header-row-1 pivot-dimension";
          pivotedFieldDiv.style.gridColumn = `span ${dimensionCount}`;
          pivotedFieldDiv.textContent = pivotedFieldName;
          tableGrid.appendChild(pivotedFieldDiv);

          // Cada pivot ocupa o espaço de suas medidas
          pivots.forEach(pivot => {
            const pivotLabel = pivot.key || pivot.label;
            const pivotDiv = document.createElement("div");
            pivotDiv.className = "grid-cell grid-header-cell header-row-1 pivot-dimension";
            pivotDiv.style.gridColumn = `span ${measureCount + tableCalcs.length}`;
            pivotDiv.textContent = pivotLabel;
            tableGrid.appendChild(pivotDiv);
          });

          // HEADER ROW 2 (dimensões + medidas)
          dimensions.forEach(dim => {
            const dimDiv = document.createElement("div");
            dimDiv.className = "grid-cell grid-header-cell header-row-2 dimension";
            dimDiv.textContent = dim.label;
            tableGrid.appendChild(dimDiv);
          });

          pivots.forEach(() => {
            measures.forEach(measure => {
              const measureDiv = document.createElement("div");
              measureDiv.className = "grid-cell grid-header-cell header-row-2 measure";
              const viewLabel = measure.view_label || "";
              const rawLabel = measure.label;
              const cleanLabel = rawLabel.replace(viewLabel + " ", "");
              measureDiv.textContent = cleanLabel;
              tableGrid.appendChild(measureDiv);
            });
            tableCalcs.forEach(calc => {
              const div = document.createElement("div");
              div.className = "grid-cell grid-header-cell header-row-2 table-calc";
              div.textContent = calc.label;
              tableGrid.appendChild(div);
            });
          });
        } else {
          // Sem pivôs: cabeçalho simples (dimensões + medidas)
          dimensions.forEach(dim => {
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell";
            div.textContent = dim.label;
            tableGrid.appendChild(div);
          });

          measures.forEach(measure => {
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell";
            const viewLabel = measure.view_label || "";
            const rawLabel = measure.label;
            const cleanLabel = rawLabel.replace(viewLabel + " ", "");
            div.textContent = cleanLabel;
            tableGrid.appendChild(div);
          });

          tableCalcs.forEach(calc => {
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell";
            div.textContent = calc.label;
            tableGrid.appendChild(div);
          });
        }

        // Salva a quantidade de células de cabeçalho
        const headerCellCount = tableGrid.childElementCount;

        // BODY ROWS

        data.forEach((row, rowIndex) => {
            const rowClass = rowIndex % 2 === 0 ? "grid-row-even" : "grid-row-odd";
            let colIndex = 0; // reinicia para cada linha
          
            // Dimensões
            dimensions.forEach((dim, dIndex) => {
              const div = document.createElement("div");
              const isLastDimension = dIndex === dimensions.length - 1;
              div.className = `grid-cell ${rowClass} ${isLastDimension ? 'dim-separator' : ''}`;
              div.dataset.row = rowIndex;
              div.dataset.col = colIndex;
              div.innerHTML = LookerCharts.Utils.htmlForCell(row[dim.name]);
              tableGrid.appendChild(div);
              colIndex++;
            });
          
            if (hasPivot) {
              pivots.forEach(pivot => {
                measures.forEach((measure, mIndex) => {
                  const cellData = row[measure.name][pivot.key];
                  const div = document.createElement("div");

                    // Aplica cor vermelha se for negativo
                    const rawValue = cellData?.value;
                    const numericValue = parseFloat(String(rawValue)?.replace(/[^\d.-]/g, ''));

                    if (!isNaN(numericValue) && numericValue < 0) {
                    div.style.color = "red";
                    }


                  const isLastMeasure = mIndex === measures.length - 1;
                  div.className = `grid-cell numeric ${rowClass} ${!isLastMeasure ? 'no-right-border' : ''}`;
                  div.dataset.row = rowIndex;
                  div.dataset.col = colIndex;
                  div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                  tableGrid.appendChild(div);
                  colIndex++;
                });

                tableCalcs.forEach(calc => {
                  const div = document.createElement("div");
                  const cellData = row[calc.name]?.[pivot.key];  // <- corrigido aqui
                  div.className = `grid-cell ${rowClass}`;
                  div.dataset.row = rowIndex;
                  div.dataset.col = colIndex;
                  div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                  tableGrid.appendChild(div);
                  colIndex++;
                });
              });
            } else {
              measures.forEach(measure => {
                const div = document.createElement("div");
                div.className = `grid-cell ${rowClass}`;
                div.dataset.row = rowIndex;
                div.dataset.col = colIndex;
                div.innerHTML = LookerCharts.Utils.htmlForCell(row[measure.name]);
                tableGrid.appendChild(div);
                colIndex++;
              });

              tableCalcs.forEach(calc => {
                const div = document.createElement("div");
                const cellData = row[calc.name];  // <- direto, sem pivot
                div.className = `grid-cell ${rowClass}`;
                div.dataset.row = rowIndex;
                div.dataset.col = colIndex;
                div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                tableGrid.appendChild(div);
                colIndex++;
              });
            }
          });

          tableGrid.addEventListener("mouseover", (e) => {
            const cell = e.target.closest(".grid-cell");
            if (cell.classList.contains("grid-header-cell")) return;
            if (!cell) return;
          
            const row = cell.dataset.row;
            const col = cell.dataset.col;
          
            tableGrid.querySelectorAll(".grid-cell").forEach(c => {
                if (c.dataset.row === row || c.dataset.col === col) {
                    c.classList.add("hovered");
                  }
                  if (c === cell) {
                    c.classList.add("hovered-cell");
                  }
            });
          });
          
          tableGrid.addEventListener("mouseout", () => {
            tableGrid.querySelectorAll(".grid-cell.hovered, .grid-cell.hovered-cell").forEach(c => {
                c.classList.remove("hovered", "hovered-cell");
              });
          });

        this._tableContainer.appendChild(tableGrid);

        done();

    }
  });