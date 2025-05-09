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
                border: 1px solid #000000;
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

            .grid-header {
                position: sticky;
                top: 0;
                z-index: 2;
                background: white;
                }

            .grid-scroll-container {
                max-height: 500px; /* ou '100%' dependendo do layout */
                overflow: auto;
            }

            .pivot-dimension, .dimension {
                background-color: #012C75 !important;
                color: white !important;
            }

            .measure {
                background-color: #007BFF !important;
                color: white !important;
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
        </style>
      `;
  
      // Create a container element to let us center the text.
      this._tableContainer = element.appendChild(document.createElement("div"));
    },
    // Render in response to the data or settings changing
    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();
        this._tableContainer.innerHTML = "";

        // Pega os dados
        const pivots = queryResponse.pivots || [];
        const hasPivot = pivots.length > 0;

        const dimensions = queryResponse.fields.dimensions;
        const measures = queryResponse.fields.measures;

        const dimensionCount = dimensions.length;
        const measureCount = measures.length;
        const pivotCount = hasPivot ? pivots.length : 1;
        const totalCols = dimensionCount + (pivotCount * measureCount);

        // Containers
        const headerWrapper = document.createElement("div");
        headerWrapper.className = "grid-header";
        headerWrapper.style.display = "grid";
        headerWrapper.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;

        const bodyWrapper = document.createElement("div");
        bodyWrapper.className = "grid-body";
        bodyWrapper.style.display = "grid";
        bodyWrapper.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;

        // HEADER ROW 1
        dimensions.forEach(dim => {
        const div = document.createElement("div");
        div.className = "grid-cell grid-header-cell header-row-1 dimension";
        div.style.gridRow = "1 / span 2";
        div.textContent = dim.label;
        headerWrapper.appendChild(div);
        });

        if (hasPivot) {
        pivots.forEach(pivot => {
            const pivotLabel = pivot.metadata?.pivoted_label || pivot.label || pivot.key;
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell header-row-1 pivot-dimension";
            div.style.gridColumn = `span ${measureCount}`;
            div.textContent = pivotLabel;
            headerWrapper.appendChild(div);
        });

        // HEADER ROW 2 (measures)
        pivots.forEach(() => {
            measures.forEach(measure => {
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell header-row-2 measure";
            const viewLabel = measure.view_label || ""; 
            const rawLabel = measure.label;
            const cleanLabel = rawLabel.replace(viewLabel + " ", "");
            div.textContent = cleanLabel;
            headerWrapper.appendChild(div);
            });
        });
        } else {
        // Sem pivôs: cabeçalho direto de medidas
        measures.forEach(measure => {
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell";
            const viewLabel = measure.view_label || ""; 
            const rawLabel = measure.label;
            const cleanLabel = rawLabel.replace(viewLabel + " ", "");
            div.textContent = cleanLabel;
            headerWrapper.appendChild(div);
        });
        }

        // BODY
        data.forEach((row, rowIndex) => {
        const rowClass = rowIndex % 2 === 0 ? "grid-row-even" : "grid-row-odd";

        // Dimensões
        dimensions.forEach(dim => {
            const div = document.createElement("div");
            div.className = `grid-cell ${rowClass}`;
            div.innerHTML = LookerCharts.Utils.htmlForCell(row[dim.name]);
            bodyWrapper.appendChild(div);
        });

        if (hasPivot) {
            pivots.forEach(pivot => {
            measures.forEach(measure => {
                const cellData = row[measure.name][pivot.key];
                const div = document.createElement("div");
                div.className = `grid-cell numeric ${rowClass}`;
                div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                bodyWrapper.appendChild(div);
            });
            });
        } else {
            measures.forEach(measure => {
            const div = document.createElement("div");
            div.className = `grid-cell ${rowClass}`;
            div.innerHTML = LookerCharts.Utils.htmlForCell(row[measure.name]);
            bodyWrapper.appendChild(div);
            });
        }
        });

        // SCROLL CONTAINER
        const scrollContainer = document.createElement("div");
        scrollContainer.className = "grid-scroll-container";
        scrollContainer.style.overflow = "auto";
        scrollContainer.appendChild(bodyWrapper);

        // Append to visualization
        this._tableContainer.appendChild(headerWrapper);
        this._tableContainer.appendChild(scrollContainer);

        done();

    }
  });