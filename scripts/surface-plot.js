d3.csv('https://raw.githubusercontent.com/plotly/datasets/master/api_docs/mt_bruno_elevation.csv')
  .then(function(rows) {
    // Check what we're getting
    console.log("Data structure:", rows);
    
    function unpack(rows, key) {
        // In D3v7, rows is an array of objects where each object has properties
        // corresponding to the CSV column headers
        return rows.map(function(row) { 
            return parseFloat(row[key]); 
        });
    }

    var z_data = [];
    // Get the column names from the first row
    var columnNames = Object.keys(rows[0]);
    
    // Use column names instead of indices
    for(var i = 0; i < columnNames.length; i++) {
        z_data.push(unpack(rows, columnNames[i]));
    }

    var data = [{
        z: z_data,
        type: 'surface'
    }];

    var layout = {
        title: {
            text: 'Chart: Requests by Year'
        },
        autosize: false,
        width: 500,
        height: 500,
        margin: {
            l: 65,
            r: 50,
            b: 65,
            t: 90,
        }
    };
    
    Plotly.newPlot('myDiv', data, layout);
  })
  .catch(function(error) {
    console.error("Error loading the CSV file:", error);
  });
