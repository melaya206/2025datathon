// Script to create a 3D Filled Line Plot of department data by year
document.addEventListener('DOMContentLoaded', function () {
  // Load the CSV data
  loadDepartmentData();
});

// Function to load the department data from CSV
function loadDepartmentData() {
  console.log("Loading department data from CSV...");

  // Use D3 to load the CSV file
  d3.csv("dataset/CSR_By_Dept_and_Year.csv")
    .then(data => {
      console.log("Department data loaded successfully", data[0]);

      // Process the data
      createDepartment3DPlot(data);
    })
    .catch(error => {
      console.error("Error loading department data:", error);
      document.getElementById('3d-line-plot').innerHTML =
        '<p class="error-message">Failed to load department data: ' + error.message + '</p>';
    });
}

// Function to create the 3D visualization
function createDepartment3DPlot(data) {
  console.log("Creating 3D plot with data:", data.slice(0, 3)); // Log first few rows for debugging

  try {
    // Process the data for 3D plot
    // Group data by department
    const departments = [...new Set(data.map(d => d["City.Department"]))];

    // Define rainbow colors for departments
    const rainbowColors = [
      '#FF00FF',  // Magenta
      '#00FFFF', // Cyan
      '#FF1493', // Pink
      '#800000', // Darkred
      '#4B0082', // Indigo
      '#0000FF', // Blue
      '#00FF00', // Green
      '#FFFF00', // Yellow
      '#FF7F00', // Orange
      '#FF0000' // Red
    ];

    // Create traces for each department
    const traces = departments.map((dept, index) => {
      // Filter data for this department
      const deptData = data.filter(d => d["City.Department"] === dept);

      // Sort by year
      deptData.sort((a, b) => +a.Year - +b.Year);

      // Get color for this department (cycle through colors if more than 10 departments)
      const colorIndex = index % rainbowColors.length;
      const departmentColor = rainbowColors[colorIndex];

      return {
        type: 'scatter3d',
        mode: 'lines',
        name: dept,
        x: deptData.map(d => d["City.Department"]), // Department name for each point
        y: deptData.map(d => +d.Year),      // Year as numeric value
        z: deptData.map(d => +d.Requests),  // Number of requests
        line: {
          width: 6,
          color: departmentColor,
          opacity: 0.7
        },
        surfaceaxis: 1, // Fill to the y-axis
        surfacecolor: departmentColor,
        opacity: 0.8
      };
    });

    // Define layout
    const layout = {
      title: 'Service Requests by Department and Year',
      autosize: true,
      scene: {
        xaxis: {
          title: {
            text: 'Department',
            font: {
              family: 'Arial, sans-serif',
              size: 16,
              color: '#000000',
              weight: 'bold'
            },
            standoff: 15
          },
          showticklabels: true,
          tickangle: 45,
          tickfont: {
            size: 10
          },
          automargin: true, // Ensure all labels are visible
          tickmode: 'array',
          tickvals: departments.map((_, i) => i),
          ticktext: departments
        },
        yaxis: {
          title: {
            text: 'Year',
            font: {
              family: 'Arial, sans-serif',
              size: 16,
              color: '#000000',
              weight: 'bold'
            },
            standoff: 15
          },
          showticklabels: true,
          // Set discrete tick values for years
          dtick: 1, // Force 1-year intervals
          // Ensure we're showing only integer years
          tickmode: 'linear',
          tick0: Math.min(...data.map(d => +d.Year)), // Start at the earliest year
          // Sort years from oldest to newest
          autorange: false,
          range: [
            Math.min(...data.map(d => +d.Year)),
            Math.max(...data.map(d => +d.Year))
          ]
        },
        zaxis: {
          title: {
            text: 'Customer Service Requests',
            font: {
              family: 'Arial, sans-serif',
              size: 16,
              color: '#000000',
              weight: 'bold'
            },
            standoff: 15
          },
          showticklabels: true
        },
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.5 }
        },
        // Add overall scene styling
        bgcolor: 'rgba(245, 245, 250, 0.9)',
        dragmode: 'turntable'
      },
      margin: {
        l: 0,
        r: 0,
        b: 0,
        t: 50,
        pad: 0
      },
      showlegend: true,
      legend: {
        x: 1,
        y: 0.5
      },
      height: 600
    };

    // Create the plot
    Plotly.newPlot('3d-line-plot', traces, layout, { responsive: true });

    // Add interactivity - when hovering over a point, show details
    const chartElement = document.getElementById('3d-line-plot');
    chartElement.on('plotly_hover', function (data) {
      const pointData = data.points[0];
      const deptName = pointData.x;
      const year = pointData.y;
      const requests = pointData.z;

      const hoverInfo = document.getElementById('hover-info') ||
        document.createElement('div');

      hoverInfo.id = 'hover-info';
      hoverInfo.style.position = 'absolute';
      hoverInfo.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      hoverInfo.style.padding = '10px';
      hoverInfo.style.border = '1px solid #ddd';
      hoverInfo.style.borderRadius = '4px';
      hoverInfo.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
      hoverInfo.style.zIndex = '1000';

      // Fix: Get mouse position from the event object correctly
      // The event might be in different places depending on the Plotly version
      const evt = data.event || window.event;
      const mouseX = evt ? (evt.clientX || evt.pageX) : 0;
      const mouseY = evt ? (evt.clientY || evt.pageY) : 0;

      hoverInfo.style.top = (mouseY + 10) + 'px';
      hoverInfo.style.left = (mouseX + 10) + 'px';

      hoverInfo.innerHTML = `
        <strong>Department:</strong> ${deptName}<br>
        <strong>Year:</strong> ${year}<br>
        <strong>Requests:</strong> ${requests.toLocaleString()}
      `;

      if (!document.getElementById('hover-info')) {
        document.body.appendChild(hoverInfo);
      }
    });

    chartElement.on('plotly_unhover', function () {
      const hoverInfo = document.getElementById('hover-info');
      if (hoverInfo) {
        hoverInfo.remove();
      }
    });

    console.log("3D plot created successfully");
  } catch (error) {
    console.error("Error creating 3D plot:", error);
    document.getElementById('3d-line-plot').innerHTML =
      '<p class="error-message">Failed to create visualization: ' + error.message + '</p>';
  }
}

// Helper function to generate random colors for the departments
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}