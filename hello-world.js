looker.plugins.visualizations.add({
    id: "hello_world",
    label: "Hello World",
    options: {
      font_size: {
        type: "string",
        label: "Font Size",
        values: [
          {"Large": "large"},
          {"Small": "small"}
        ],
        display: "radio",
        default: "large"
      }
    },
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
                border: 1px solid #ddd;
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
            }

            .pivot-dimension {
                background-color: #012C75 !important;
            }

            .measure {
                background-color: #007BFF !important;
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

        // Calculate total columns
        const dimensionCount = dimensions.length;
        const measureCount = measures.length;
        const pivotCount = hasPivot ? pivots.length : 1;
        const totalCols = dimensionCount + (pivotCount * measureCount);

        // Create wrapper
        const tableGrid = document.createElement("div");
        tableGrid.className = "grid-table";
        tableGrid.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;

        // HEADER ROW 1
        dimensions.forEach(dim => {
        const div = document.createElement("div");
        div.className = "grid-cell grid-header-cell";
        div.style.gridRow = "1 / span 2";
        div.textContent = dim.label;
        tableGrid.appendChild(div);
        });

        if (hasPivot) {
        pivots.forEach(pivot => {
            const pivotLabel = pivot.metadata?.pivoted_label || pivot.label || pivot.key;
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell pivot-dimension";
            div.style.gridColumn = `span ${measureCount}`;
            div.textContent = pivotLabel;
            tableGrid.appendChild(div);
        });

        // HEADER ROW 2 (measures under pivots)
        pivots.forEach(() => {
            measures.forEach(measure => {
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell measure";
            viewLabel = measure.view_label || ""; 
            rawLabel = measure.label;
            cleanLabel = rawLabel.replace(viewLabel + " ", "");
            div.textContent = cleanLabel;
            tableGrid.appendChild(div);
            });
        });
        } else {
        // Sem pivôs: uma única linha de cabeçalho para medidas
        measures.forEach(measure => {
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell";
            viewLabel = measure.view_label || ""; 
            rawLabel = measure.label;
            cleanLabel = rawLabel.replace(viewLabel + " ", "");
            div.textContent = cleanLabel;
            tableGrid.appendChild(div);
        });
        }

        // BODY ROWS
        data.forEach(row => {
        // Dimensões
        dimensions.forEach(dim => {
            const div = document.createElement("div");
            div.className = "grid-cell";
            div.innerHTML = LookerCharts.Utils.htmlForCell(row[dim.name]);
            tableGrid.appendChild(div);
        });

        if (hasPivot) {
            pivots.forEach(pivot => {
            measures.forEach(measure => {
                const cellData = row[measure.name][pivot.key];
                const div = document.createElement("div");
                div.className = "grid-cell numeric";
                div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                tableGrid.appendChild(div);
            });
            });
        } else {
            measures.forEach(measure => {
            const div = document.createElement("div");
            div.className = "grid-cell";
            div.innerHTML = LookerCharts.Utils.htmlForCell(row[measure.name]);
            tableGrid.appendChild(div);
            });
        }
        });

        this._tableContainer.appendChild(tableGrid);
        done();

    }
  });