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
            .smart-table {
            width: 100%;
            border-collapse: collapse;
            }
            .smart-table th, .smart-table td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            }
            .smart-table th {
            background-color: #f2f2f2;
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

        const table = document.createElement("table");
        table.className = "smart-table";
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");

        // CABEÇALHO
        const headerRowPivot = document.createElement("tr");
        const headerRowMeasure = document.createElement("tr");

        // Adiciona cabeçalhos das dimensões
        dimensions.forEach(dim => {
            const th = document.createElement("th");
            th.textContent = dim.label;
            th.rowSpan = 2; // ocupa duas linhas do cabeçalho
            headerRowPivot.appendChild(th);
          });

        if (hasPivot) {
        // Agrupar por valores pivotados (ex: países)
        pivots.forEach(pivot => {
            const pivotKey = pivot.key;
            const pivotLabel = pivot.metadata?.pivoted_label || pivot.label || pivotKey;
        
            const th = document.createElement("th");
            th.colSpan = measures.length; // uma célula por medida
            th.textContent = pivotLabel;
            headerRowPivot.appendChild(th);
        
            // Agora adicionamos uma célula por medida (segunda linha do cabeçalho)
            measures.forEach(measure => {
            const th = document.createElement("th");
            th.textContent = measure.label;
            headerRowMeasure.appendChild(th);
            });
        });
        
        thead.appendChild(headerRowPivot);
        thead.appendChild(headerRowMeasure);
        } else {
        // Tabela sem pivôs: cabeçalho simples
        measures.forEach(measure => {
            const th = document.createElement("th");
            th.textContent = measure.label;
            headerRowPivot.appendChild(th);
        });
        
        thead.appendChild(headerRowPivot);
        }

        // CORPO DA TABELA
        data.forEach(row => {
        const tr = document.createElement("tr");

        // Dimensões
        dimensions.forEach(dim => {
            const td = document.createElement("td");
            td.innerHTML = LookerCharts.Utils.htmlForCell(row[dim.name]);
            tr.appendChild(td);
        });

        if (hasPivot) {
            // Medidas por pivô
            pivots.forEach(pivot => {
            measures.forEach(measure => {
                const td = document.createElement("td");
                const cellData = row[measure.name][pivot.key];
                td.innerHTML = LookerCharts.Utils.htmlForCell(cellData);
                tr.appendChild(td);
            });
            });
        } else {
            // Medidas normais
            measures.forEach(measure => {
            const td = document.createElement("td");
            td.innerHTML = LookerCharts.Utils.htmlForCell(row[measure.name]);
            tr.appendChild(td);
            });
        }

        tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        this._tableContainer.appendChild(table);

        done();

    }
  });