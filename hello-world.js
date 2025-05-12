looker.plugins.visualizations.add({
    id: "hello_world",
    label: "Hello World",
    options: {
      
      dimension_label_0: {
        type: "string",
        label: "Label para Dimensão 1",
        section: "Series",
        display: "text",
        default: ""
      },

    },
    create: function(element, config) {

      element.innerHTML = `
        <style>
            .table-wrapper {
              width: 100%;
              position: relative;
            }

            .grid-table {
                display: grid;
                border: 1px solid #000000;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                width: max-content;
                min-width: 100%;
            }
            .grid-header,
            .grid-row {
                display: contents;
            }

            .header-row-1 {
              position: sticky;
              top: 0;
              z-index: 1;
              background-color: #fff;
            }

            .header-row-2 {
              position: sticky;
              z-index: 1;
              background-color: #fff;
            }


            .sticky-dimension {
              position: sticky;
              left: 0;
              background-color: #fff;
              z-index: 2;
            }
            
            .header-row-2.dimension.sticky-dimension {
              z-index: 3;
            }

            /* Célula do topo da primeira coluna (campo pivotado) */
            .header-row-1.pivot-dimension.sticky-dimension {
              z-index: 4;
            }

            .grid-cell {
                border-right: 1px solid #ddd;
                border-top: 1px solid #ddd;
                padding: 10px;
                background: white;
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

            .pivot-dimension, .dimension {
                background-color: #012C75 !important;
                color: white !important;
            }

            .measure {
                background-color: #007BFF !important;
                color: white !important;
            }

            .table-calc {
              background-color:rgb(0, 122, 65) !important;
              color: white !important;
            }

            .grid-cell.numeric.no-right-border {
                border-right: none !important;
            }

            .grid-cell.dim-separator {
                border-right: 2px solid #012C75;
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

            .grid-subtotal-row {
              background-color: #f9f9f9;
              font-weight: bold;
              border-top: 2px solid black;
              border-bottom: 2px solid black;
            }

        </style>
      `;
  
      this._tableContainer = element.appendChild(document.createElement("div"));
      this._tableContainer.classList = "table-wrapper"
    },
    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();
        this._tableContainer.innerHTML = "";

        console.log(queryResponse)

        const pivots = queryResponse.pivots || [];
        const hasPivot = pivots.length > 0;

        const dimensions = queryResponse.fields.dimensions;
        const measures = queryResponse.fields.measures;
        const tableCalcs = queryResponse.fields.table_calculations || [];

        const dimensionCount = dimensions.length;
        const measureCount = measures.length;
        const pivotCount = hasPivot ? pivots.length : 1;
        const totalCols = dimensionCount + (pivotCount * (measureCount + tableCalcs.length));

        const newOptions = {};

        // Campos diretos (dimensões e medidas)
        const fields = [...queryResponse.fields.dimensions, ...queryResponse.fields.measures];
        fields.forEach(field => {
          newOptions[`label_${field.name}`] = {
            label: `Label para ${field.label}`,
            type: "string",
            display: "text",
            default: field.label,
            placeholder: field.label_short
          };
        });

        // Campos pivotados
        if (queryResponse.fields.pivots) {
          queryResponse.fields.pivots.forEach(pivotField => {
            newOptions[`label_pivot_${pivotField.name}`] = {
              label: `Label para pivô ${pivotField.label}`,
              type: "string",
              display: "text",
              default: pivotField.label,
              placeholder: pivotField.label_short
            };
          });
        }


        // Atualiza as opções da visualização
        this.options = newOptions;

        // Sempre registra novamente as opções, independente de "details.changed"
        this.trigger("registerOptions", this.options);

        // Cria o grid
        const tableGrid = document.createElement("div");
        tableGrid.className = "grid-table";
        tableGrid.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;

        // HEADER ROW 1
        if (hasPivot) {
          // Nome do campo pivotado sobre as dimensões
          const pivotedFieldDiv = document.createElement("div");
          pivotedFieldDiv.className = "grid-cell grid-header-cell header-row-1 pivot-dimension";
          pivotedFieldDiv.style.gridColumn = `span ${dimensionCount}`;
          const customLabel = config[`label_pivot_${queryResponse.fields.pivots?.[0]?.name}`];
          pivotedFieldDiv.textContent = customLabel
          tableGrid.appendChild(pivotedFieldDiv);

          // Cada pivot ocupa o espaço de suas medidas
          pivots.forEach(pivot => {
            const pivotLabel = pivot.key.split("|")[0];
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
            const customLabel = config[`label_${dim.name}`];
            dimDiv.textContent = customLabel
            tableGrid.appendChild(dimDiv);
          });

          pivots.forEach(() => {
            measures.forEach(measure => {
              const measureDiv = document.createElement("div");
              measureDiv.className = "grid-cell grid-header-cell header-row-2 measure";
              const customLabel = config[`label_${measure.name}`];
              measureDiv.textContent = customLabel
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
            const customLabel = config[`label_${dim.name}`];
            dimDiv.textContent = customLabel
            tableGrid.appendChild(div);
          });

          measures.forEach(measure => {
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell";
            const measure_label = measure.label_short
            const customLabel = config[`label_${measure.name}`];
            measureDiv.textContent = customLabel
            tableGrid.appendChild(div);
          });

          tableCalcs.forEach(calc => {
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell";
            div.textContent = calc.label;
            tableGrid.appendChild(div);
          });
        }

        // BODY ROWS

        const subtotalMap = new Map();
        const firstDimName = dimensions[0]?.name;

        queryResponse.subtotals_data?.[1]?.forEach(sub => {
          const dimValue = sub[firstDimName]?.value;
          if (dimValue !== undefined) {
            subtotalMap.set(dimValue, sub);
          }
        });

        const renderedSpanMap = new Map(); 

        data.forEach((row, rowIndex) => {
          const rowClass = rowIndex % 2 === 0 ? "grid-row-even" : "grid-row-odd";
          let colIndex = 0;

          // Dimensões

          dimensions.forEach((dim, dIndex) => {
            const dimValue = row[dim.name]?.value;

            // Lógica especial para a primeira dimensão
            if (dIndex === 0) {
              const prevRendered = renderedSpanMap.get(dimValue);
              if (prevRendered !== undefined) {
                // Já foi renderizado esse valor, então pula (não adiciona div)
                colIndex++;
                return;
              }

              // Conta quantas vezes esse valor aparece consecutivamente
              let spanCount = 1;
              for (let i = rowIndex + 1; i < data.length; i++) {
                if (data[i][dim.name]?.value === dimValue) {
                  spanCount++;
                } else {
                  break;
                }
              }

              // Marca como já renderizado
              renderedSpanMap.set(dimValue, true);

              // Cria uma célula que representa esse valor fundido
              const div = document.createElement("div");
              const isLastDimension = dIndex === dimensions.length - 1;
              div.className = `grid-cell ${rowClass} ${isLastDimension ? 'dim-separator' : ''}`;
              div.dataset.row = rowIndex;
              div.dataset.col = colIndex;
              div.innerHTML = LookerCharts.Utils.htmlForCell(row[dim.name]);
              div.style.gridRow = `span ${spanCount}`; // ← importante para CSS Grid
              tableGrid.appendChild(div);
            } else {
              // Demais dimensões: renderizam normalmente
              const div = document.createElement("div");
              const isLastDimension = dIndex === dimensions.length - 1;
              div.className = `grid-cell ${rowClass} ${isLastDimension ? 'dim-separator' : ''}`;
              div.dataset.row = rowIndex;
              div.dataset.col = colIndex;
              div.innerHTML = LookerCharts.Utils.htmlForCell(row[dim.name]);
              tableGrid.appendChild(div);
            }

            colIndex++;
          });

          if (hasPivot) {
            pivots.forEach(pivot => {
              measures.forEach((measure, mIndex) => {
                const cellData = row[measure.name][pivot.key];
                const div = document.createElement("div");

                const rawValue = cellData?.value;
                const numericValue = parseFloat(String(rawValue)?.replace(/[^\d.-]/g, ''));
                if (!isNaN(numericValue) && numericValue < 0) {
                  div.style.color = "red";
                }

                const isLastInPivotBlock = mIndex === measures.length - 1 && tableCalcs.length === 0;
                div.className = `grid-cell numeric ${rowClass} ${!isLastInPivotBlock ? 'no-right-border' : ''}`;
                div.dataset.row = rowIndex;
                div.dataset.col = colIndex;
                div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                tableGrid.appendChild(div);
                colIndex++;
              });

              tableCalcs.forEach((calc, calcIndex) => {
                const isLastInPivotBlock = calcIndex === tableCalcs.length - 1;
                const div = document.createElement("div");
                const cellData = row[calc.name]?.[pivot.key];
                div.className = `grid-cell numeric ${rowClass} ${!isLastInPivotBlock ? 'no-right-border' : ''}`;
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
              div.className = `grid-cell numeric ${rowClass}`;
              div.dataset.row = rowIndex;
              div.dataset.col = colIndex;
              div.innerHTML = LookerCharts.Utils.htmlForCell(row[measure.name]);
              tableGrid.appendChild(div);
              colIndex++;
            });

            tableCalcs.forEach(calc => {
              const div = document.createElement("div");
              const cellData = row[calc.name];
              div.className = `grid-cell numeric ${rowClass}`;
              div.dataset.row = rowIndex;
              div.dataset.col = colIndex;
              div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
              tableGrid.appendChild(div);
              colIndex++;
            });
          }

          // === SUBTOTAL LOGIC ===
          const currentDimValue = row[firstDimName]?.value;
          const nextDimValue = data[rowIndex + 1]?.[firstDimName]?.value;

          const isLastRowOfGroup = currentDimValue !== nextDimValue;
          if (isLastRowOfGroup && subtotalMap.has(currentDimValue)) {
            const subtotalRow = subtotalMap.get(currentDimValue);
            let subtotalColIndex = 0;

            const subtotalRowIndex = data.length + rowIndex; // ou qualquer lógica única de rowIndex para subtotais

            // Cabeçalho de subtotal unificado
            const subtotalHeaderDiv = document.createElement("div");
            subtotalHeaderDiv.className = `grid-cell sticky-dimension grid-subtotal-row dim-separator`;
            subtotalHeaderDiv.dataset.col = 0;
            subtotalHeaderDiv.dataset.row = subtotalRowIndex;
            subtotalHeaderDiv.style.gridColumn = `span ${dimensions.length}`;
            subtotalHeaderDiv.textContent = `${subtotalRow[firstDimName]?.value || ""}`;
            tableGrid.appendChild(subtotalHeaderDiv);

            // Avança o índice de coluna
            subtotalColIndex = dimensions.length;

            if (hasPivot) {
              pivots.forEach(pivot => {
                measures.forEach((measure, mIndex) => {
                  const cellData = subtotalRow[measure.name]?.[pivot.key];
                  const div = document.createElement("div");

                  const isLastInPivotBlock = mIndex === measures.length - 1 && tableCalcs.length === 0;
                  div.className = `grid-cell numeric grid-subtotal-row ${!isLastInPivotBlock ? 'no-right-border' : ''}`;

                  div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                  div.dataset.row = subtotalRowIndex;
                  div.dataset.col = subtotalColIndex;
                  tableGrid.appendChild(div);
                  subtotalColIndex++;
                });

                tableCalcs.forEach((calc, calcIndex) => {
                  const cellData = subtotalRow[calc.name]?.[pivot.key];
                  const isLastInPivotBlock = calcIndex === tableCalcs.length - 1;
                  const div = document.createElement("div");
                  
                  div.className = `grid-cell numeric grid-subtotal-row ${!isLastInPivotBlock ? 'no-right-border' : ''}`;

                  div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                  div.dataset.row = subtotalRowIndex;
                  div.dataset.col = subtotalColIndex;
                  tableGrid.appendChild(div);
                  subtotalColIndex++;
                });
              });
            } else {
              measures.forEach(measure => {
                const cellData = subtotalRow[measure.name];
                const div = document.createElement("div");
                div.className = `grid-cell numeric grid-subtotal-row`;
                div.dataset.col = subtotalColIndex;
                div.dataset.row = subtotalRowIndex;
                div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                tableGrid.appendChild(div);
                subtotalColIndex++;
              });

              tableCalcs.forEach(calc => {
                const cellData = subtotalRow[calc.name];
                const div = document.createElement("div");
                div.className = `grid-cell numeric grid-subtotal-row`;
                div.dataset.col = subtotalColIndex;
                div.dataset.row = subtotalRowIndex;
                div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                tableGrid.appendChild(div);
                subtotalColIndex++;
              });
            }
          }
        });

          tableGrid.addEventListener("mouseover", (e) => {
            const cell = e.target.closest(".grid-cell");
            if (cell.classList.contains("grid-header-cell")) return;
            if (cell.classList.contains("sticky-dimension")) return;
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

        requestAnimationFrame(() => {
          const firstRowCells = tableGrid.querySelectorAll(".header-row-1");
          if (firstRowCells.length > 0) {
            // Pega a maior altura da primeira linha (caso haja múltiplas células com quebras de linha)
            const firstRowHeight = Math.max(...Array.from(firstRowCells).map(el => el.offsetHeight));
        
            const secondRowCells = tableGrid.querySelectorAll(".header-row-2");
            secondRowCells.forEach(cell => {
              cell.style.top = `${firstRowHeight}px`;
            });
          }
        });

        requestAnimationFrame(() => {
          const dimensionCount = dimensions.length;
        
          const columnLeftOffsets = [];
          let accumulatedLeft = 0;
        
          for (let i = 0; i < dimensionCount; i++) {
            const selector = `.grid-cell[data-col="${i}"]`;
            const cell = tableGrid.querySelector(selector);
            if (cell) {
              columnLeftOffsets.push(accumulatedLeft);
              accumulatedLeft += cell.offsetWidth;
            }
          }
        
          columnLeftOffsets.forEach((left, i) => {
            const selector = `.grid-cell[data-col="${i}"]`;
            const cells = tableGrid.querySelectorAll(selector);
            cells.forEach(cell => {
              cell.classList.add("sticky-dimension");
              cell.style.left = `${left}px`;
            });
        
            // Também fixa o cabeçalho da header-row-2 (dimensões)
            const headerCells = tableGrid.querySelectorAll(".grid-cell.header-row-2.dimension");
            const headerCell = headerCells[i];
            if (headerCell) {
              headerCell.classList.add("sticky-dimension");
              headerCell.style.left = `${left}px`;
            }
          });
        
          // Fixa a célula da header-row-1 que representa o campo pivotado
          const pivotHeaderCell = tableGrid.querySelector(
            `.grid-cell.header-row-1.pivot-dimension`
          );
          if (pivotHeaderCell) {
            pivotHeaderCell.classList.add("sticky-dimension");
            pivotHeaderCell.style.left = "0px";
            pivotHeaderCell.style.zIndex = "5"; // acima dos demais
          }
        });

    }
  });