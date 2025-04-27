// Wait for the centralized data loading
document.addEventListener('DOMContentLoaded', function() {
  // Show loading indicator
  document.getElementById('barChart').innerHTML = 
    '<div class="loading-indicator">Waiting for data...</div>';
  
  // Register for data load
  onDataLoaded(function(data) {
    console.log("Department chart received centralized data");
    
    // Use setTimeout to allow the loading message to render before processing
    setTimeout(() => {
      // Now create the chart with this data
      createDepartmentDistrictChart(data);
    }, 100);
  });
});

// Function to create the 3D visualization
function createDepartmentDistrictChart(data) {
  console.log("Starting data processing...");
  
  // Clean and validate data first
  const cleanData = data.filter(d => 
    d["City Department"] && d["City Department"].trim() !== '' && 
    d["Council District"] && d["Council District"].trim() !== ''
  );
  
  if (cleanData.length === 0) {
    console.error("No valid data after filtering");
    document.getElementById('barChart').innerHTML = 
      '<p class="error-message">No valid data available for visualization</p>';
    return;
  }
  
  console.log("Clean data count:", cleanData.length);
  
  // Group data by department and council district
  const departments = [...new Set(cleanData.map(d => d["City Department"]))];
  const districts = [...new Set(cleanData.map(d => d["Council District"]))].sort();
  
  console.log("Unique departments:", departments);
  console.log("Unique districts:", districts);
  
  // Create a matrix of counts - ensure all values are numeric
  let z_data = [];
  for (let district of districts) {
    let districtRow = [];
    for (let dept of departments) {
      // Count service requests for this department and district
      const count = cleanData.filter(d => 
        d["City Department"] === dept && 
        d["Council District"] === district
      ).length;
      districtRow.push(count);
    }
    z_data.push(districtRow);
  }
  
  console.log("Data matrix dimensions:", z_data.length, "×", z_data[0]?.length || 0);
  
  // Validate the data matrix
  if (z_data.length === 0 || !z_data[0] || z_data[0].length === 0) {
    console.error("Empty data matrix");
    document.getElementById('barChart').innerHTML = 
      '<p class="error-message">Unable to create visualization: empty data matrix</p>';
    return;
  }
  
  // Try a 2D heatmap instead of 3D surface which might be more reliable
  const chartData = [{
    type: 'heatmap',
    z: z_data,
    x: departments,
    y: districts,
    colorscale: 'Viridis'
  }];
  
  const layout = {
    title: 'Service Requests by Department and Council District',
    xaxis: {title: 'Department'},
    yaxis: {title: 'Council District'},
    autosize: true,
    height: 700, // Increased from 600 to 700 to provide more space
    margin: {
      l: 100,
      r: 50,
      b: 150, // Increased bottom margin to accommodate labels
      t: 90,
    }
  };
  
  // Add a simple config object just for responsive behavior
  const config = {
    responsive: true
  };
  
  try {
    console.log("Rendering chart...");
    // Clear the loading indicator before rendering the chart
    document.getElementById('barChart').innerHTML = '';
    Plotly.newPlot('barChart', chartData, layout, config);
    
    // Add simple window resize handler
    window.addEventListener('resize', function() {
      Plotly.Plots.resize(document.getElementById('barChart'));
    });
    
    console.log("Chart successfully rendered");
  } catch (error) {
    console.error("Error rendering chart:", error);
    document.getElementById('barChart').innerHTML = 
      '<p class="error-message">Error rendering chart: ' + error.message + '</p>';
  }
}