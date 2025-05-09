looker.plugins.visualizations.add({
    id: "hello_world",
    label: "Hello World",
    options: {
      font_size: {
        type: "string",
        label: "Font Size",
        values: [
          { "Large": "large" },
          { "Small": "small" }
        ],
        display: "radio",
        default: "large"
      }
    },
  
    create: function (element, config) {
      element.innerHTML = `
        <style>
          .grid-table {
            display: grid;
            width: 100%;
            border: 1px solid #000000;
            border-radius: 8px;
            font-family: Arial, sans-serif;
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
          }
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
            background-color: #cce5ff !important;
          }
          .grid-cell.hovered-cell {
            background-color: #66b3ff !important;
          }
          .negative-value {
            color: red;
          }
          .header-container {
            position: sticky;
            top: 0;
            z-index: 10;
            background: white;
          }
          .table-wrapper {
            width: 100%;
            overflow: auto;
          }
        </style>
      `;
  
      this._tableContainer = element.appendChild(document.createElement("div"));
    },
  
    updateAsync: function (data, element, config, queryResponse, details, done) {
      this.clearErrors();
      this._tableContainer.innerHTML = "";
  
      const pivots = queryResponse.pivots || [];
      const hasPivot = pivots.length > 0;
      const dimensions = queryResponse.fields.dimensions;
      const measures = queryResponse.fields.measures;
  
      const dimensionCount = dimensions.length;
      const measureCount = measures.length;
      const pivotCount = hasPivot ? pivots.length : 1;
      const totalCols = dimensionCount + (pivotCount * measureCount);
  
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
  
      const headerContainer = document.createElement("div");
      headerContainer.className = "grid-table header-container";
      headerContainer.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;
  
      const bodyContainer = document.createElement("div");
      bodyContainer.className = "grid-table";
      bodyContainer.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;
  
      // HEADER ROW 1
      dimensions.forEach(dim => {
        const div = document.createElement("div");
        div.className = "grid-cell grid-header-cell header-row-1 dimension";
        div.style.gridRow = "1 / span 2";
        div.textContent = dim.label;
        headerContainer.appendChild(div);
      });
  
      if (hasPivot) {
        pivots.forEach(pivot => {
          const pivotLabel = pivot.metadata?.pivoted_label || pivot.label || pivot.key;
          const div = document.createElement("div");
          div.className = "grid-cell grid-header-cell header-row-1 pivot-dimension";
          div.style.gridColumn = `span ${measureCount}`;
          div.textContent = pivotLabel;
          headerContainer.appendChild(div);
        });
  
        pivots.forEach(() => {
          measures.forEach(measure => {
            const div = document.createElement("div");
            div.className = "grid-cell grid-header-cell header-row-2 measure";
            const viewLabel = measure.view_label || "";
            const rawLabel = measure.label;
            const cleanLabel = rawLabel.replace(viewLabel + " ", "");
            div.textContent = cleanLabel;
            headerContainer.appendChild(div);
          });
        });
      } else {
        measures.forEach(measure => {
          const div = document.createElement("div");
          div.className = "grid-cell grid-header-cell";
          const viewLabel = measure.view_label || "";
          const rawLabel = measure.label;
          const cleanLabel = rawLabel.replace(viewLabel + " ", "");
          div.textContent = cleanLabel;
          headerContainer.appendChild(div);
        });
      }
  
      data.forEach((row, rowIndex) => {
        const rowClass = rowIndex % 2 === 0 ? "grid-row-even" : "grid-row-odd";
        let colIndex = 0;
  
        dimensions.forEach((dim, dIndex) => {
          const div = document.createElement("div");
          const isLastDimension = dIndex === dimensions.length - 1;
          div.className = `grid-cell ${rowClass} ${isLastDimension ? 'dim-separator' : ''}`;
          div.dataset.row = rowIndex;
          div.dataset.col = colIndex;
          div.innerHTML = LookerCharts.Utils.htmlForCell(row[dim.name]);
          bodyContainer.appendChild(div);
          colIndex++;
        });
  
        if (hasPivot) {
          pivots.forEach(pivot => {
            measures.forEach((measure, mIndex) => {
              const cellData = row[measure.name][pivot.key];
              const div = document.createElement("div");
  
              const rawValue = cellData?.value;
              const cleanedValue = typeof rawValue === "string" ? rawValue.replace(/[^\d.-]/g, '') : rawValue;
              const numericValue = parseFloat(cleanedValue);
  
              if (!isNaN(numericValue) && numericValue < 0) {
                div.style.color = "red";
              }
  
              const isLastMeasure = mIndex === measures.length - 1;
              div.className = `grid-cell numeric ${rowClass} ${!isLastMeasure ? 'no-right-border' : ''}`;
              div.dataset.row = rowIndex;
              div.dataset.col = colIndex;
              div.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
              bodyContainer.appendChild(div);
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
            bodyContainer.appendChild(div);
            colIndex++;
          });
        }
      });
  
      bodyContainer.addEventListener("mouseover", (e) => {
        const cell = e.target.closest(".grid-cell");
        if (cell.classList.contains("grid-header-cell")) return;
        if (!cell) return;
  
        const row = cell.dataset.row;
        const col = cell.dataset.col;
  
        bodyContainer.querySelectorAll(".grid-cell").forEach(c => {
          if (c.dataset.row === row || c.dataset.col === col) {
            c.classList.add("hovered");
          }
          if (c === cell) {
            c.classList.add("hovered-cell");
          }
        });
      });
  
      bodyContainer.addEventListener("mouseout", () => {
        bodyContainer.querySelectorAll(".grid-cell.hovered, .grid-cell.hovered-cell").forEach(c => {
          c.classList.remove("hovered", "hovered-cell");
        });
      });
  
      wrapper.appendChild(headerContainer);
      wrapper.appendChild(bodyContainer);
      this._tableContainer.appendChild(wrapper);
  
      done();
    }
  });
  