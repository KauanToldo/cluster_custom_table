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
            .custom-table {
            width: 100%;
            border-collapse: collapse;
            }
            .custom-table th, .custom-table td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            }
            .custom-table th {
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

        // Limpa o conteúdo anterior
        this._tableContainer.innerHTML = "";

        const fields = [
            ...queryResponse.fields.dimensions,
            ...queryResponse.fields.measures
          ];

        const table = document.createElement("table");
        table.className = "custom-table";

        // Cabeçalho da tabela
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        fields.forEach(field => {
            const th = document.createElement("th");
            th.textContent = field.label;
            headerRow.appendChild(th);
          });
      
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        data.forEach(row => {
            const tr = document.createElement("tr");
      
            fields.forEach(field => {
              const td = document.createElement("td");
              td.innerHTML = LookerCharts.Utils.htmlForCell(row[field.name]);
              tr.appendChild(td);
            });
      
            tbody.appendChild(tr);
        });
      
        table.appendChild(tbody);
        this._tableContainer.appendChild(table);
      
        done();





      // Throw some errors and exit if the shape of the data isn't what this chart needs
    //   if (queryResponse.fields.dimensions.length == 0) {
    //     this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
    //     return;
    //   }
    //   console.log(data)
    //   console.log(queryResponse)
    //   // Grab the first cell of the data
    //   var firstRow = data[0];
    //   var firstCell = firstRow[queryResponse.fields.dimensions[0].name];
  
    //   // Insert the data into the page
    //   this._textElement.innerHTML = LookerCharts.Utils.htmlForCell(firstCell);
  
    //   // Set the size to the user-selected size
    //   if (config.font_size == "small") {
    //     this._textElement.className = "hello-world-text-small";
    //   } else {
    //     this._textElement.className = "hello-world-text-large";
    //   }
  
    //   // We are done rendering! Let Looker know.
    //   done()
    }
  });