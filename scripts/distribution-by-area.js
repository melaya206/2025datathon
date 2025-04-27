// Use window load event instead of DOMContentLoaded to ensure all resources are loaded
window.addEventListener('load', function() {
    console.log("Window fully loaded, initializing map...");
    // Add a slight delay to ensure the DOM is fully rendered with proper dimensions
    setTimeout(initMap, 1000); // Increased delay for better reliability
});

// Global map variable
let seattleMap = null;
let markerClusterGroup = null;
let heatLayer = null;
let allMapData = []; // Store all data for filtering
let currentNeighborhoodValue = "dataset/neighborhood-data/ALL.csv"; // Track the currently selected neighborhood
let mapInitialized = false; // Track if the map has been initialized

function initMap() {
    try {
        console.log("Initializing map...");
        
        // Check if map is already initialized
        if (mapInitialized) {
            console.log("Map already initialized, skipping initialization");
            return;
        }
        
        // Get the map container
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error("Map container not found");
            return;
        }
        
        // Get the loading indicator
        const loadingIndicator = document.getElementById('map-loading-indicator');
        
        // Check if the map container has dimensions
        if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
            console.log("Map container has no dimensions, waiting...");
            
            // Wait for the container to have dimensions
            setTimeout(function() {
                initMap();
            }, 100);
            return;
        }
        
        // Initialize the map
        try {
            if (!seattleMap) {
                seattleMap = L.map('map').setView([47.6062, -122.3321], 12);
                
                // Add tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(seattleMap);
                
                // Update loading indicator
                if (loadingIndicator) {
                    loadingIndicator.innerHTML = 'Waiting for data...';
                }
                
                console.log("Map initialized successfully");
                mapInitialized = true; // Mark map as initialized
            } else {
                console.log("Map already exists, skipping initialization");
            }
        } catch (e) {
            console.error("Error during map initialization:", e);
            if (loadingIndicator) {
                loadingIndicator.innerHTML = 'Error initializing map: ' + e.message;
                loadingIndicator.classList.add('error-message');
            }
        }
    } catch (e) {
        console.error("Error in initMap:", e);
    }
}

/**
 * Filter the map data based on the selected neighborhood
 */
function filterMapByNeighborhood() {
    const selectedValue = getSelectedValue('request-neighborhood-filter');
    
    // If the value hasn't changed, don't reload
    if (selectedValue === currentNeighborhoodValue) {
        console.log(`Already showing data for ${selectedValue}`);
        return;
    }
    
    // Update the current neighborhood value
    currentNeighborhoodValue = selectedValue;
    
    console.log(`Loading data for neighborhood: ${selectedValue}`);
    
    try {
        // Show loading indicator
        const loadingIndicator = document.getElementById('map-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
            loadingIndicator.innerHTML = `Loading data for ${selectedValue.replace('.csv', '')}...`;
        }
        
        // Construct the file path
        const filePath = `dataset/neighborhood-data/${selectedValue}`;
        console.log(`Attempting to load: ${filePath}`);
        
        // Load the CSV file for the selected neighborhood
        d3.csv(filePath)
            .then(data => {
                console.log(`Successfully loaded ${data.length} records from ${filePath}`);
                
                // Process the data and update the map
                processNeighborhoodData(data);
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            })
            .catch(error => {
                console.error(`Error loading CSV file ${filePath}:`, error);
                if (loadingIndicator) {
                    loadingIndicator.innerHTML = `Error loading data for ${selectedValue.replace('.csv', '')}: File not found or invalid`;
                }
            });
    } catch (error) {
        console.error("Error in filterMapByNeighborhood:", error);
        const loadingIndicator = document.getElementById('map-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.innerHTML = 'Error filtering data: ' + error.message;
        }
    }
}

/**
 * Process the neighborhood data and update the map
 * 
 * @param {Array} data - The data array from the CSV file
 */
function processNeighborhoodData(data) {
    try {
        console.log("Processing neighborhood data...");
        console.log("Sample data record:", data[0]); // Log a sample record to check field names
        
        // Store the data globally for potential reuse
        allMapData = [...data];
        
        // Filter out records without valid coordinates
        const validData = data.filter(d => {
            // Check if latitude and longitude exist and are valid numbers
            return d.Latitude && d.Longitude && 
                !isNaN(parseFloat(d.Latitude)) && 
                !isNaN(parseFloat(d.Longitude));
        });
        
        if (validData.length === 0) {
            console.log("No valid data with coordinates");
            const loadingIndicator = document.getElementById('map-loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'flex';
                loadingIndicator.innerHTML = 'No valid data with coordinates found for this neighborhood';
            }
            return;
        }
        
        console.log(`Found ${validData.length} records with valid coordinates`);
        
        // Limit to a reasonable number of points for performance
        const displayData = validData.slice(0, 2000);
        
        // Update the map visualization
        createMapVisualization(displayData, 'Latitude', 'Longitude');
    } catch (error) {
        console.error("Error processing neighborhood data:", error);
        const loadingIndicator = document.getElementById('map-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
            loadingIndicator.innerHTML = 'Error processing data: ' + error.message;
        }
    }
}

function createMapVisualization(data, latField, lngField) {
    try {
        console.log(`Creating visualization with fields: ${latField}, ${lngField}`);
        
        // Ensure map is valid
        if (!seattleMap) {
            console.error("Map not initialized!");
            return;
        }
        
        // Clear existing layers
        if (markerClusterGroup) {
            seattleMap.removeLayer(markerClusterGroup);
        }
        if (heatLayer) {
            seattleMap.removeLayer(heatLayer);
        }
        
        // Create a marker cluster group
        markerClusterGroup = L.markerClusterGroup();
        
        // Log a sample data point to see the available fields
        if (data.length > 0) {
            console.log("Sample data point for popup:", data[0]);
        }
        
        // Add markers for each service request
        data.forEach(function(d) {
            try {
                const lat = parseFloat(d[latField]);
                const lng = parseFloat(d[lngField]);
                
                if (isNaN(lat) || isNaN(lng)) {
                    return; // Skip invalid coordinates
                }
                
                // Create popup content with request details using the correct column names
                const popupContent = `
                    <strong>Service Request Type:</strong> ${d["Service.Request.Type"] || 'Not specified'}<br>
                    <strong>Department:</strong> ${d["City.Department"] || 'Not specified'}<br>
                    <strong>Created:</strong> ${d["Created.Date"] || 'Not specified'}<br>
                    <strong>Location:</strong> ${d["Location"] || 'Not specified'}<br>
                    <strong>Neighborhood:</strong> ${d["Neighborhood"] || 'Not specified'}<br>
                    <strong>ZIP Code:</strong> ${d["ZIP.Code"] || 'Not specified'}<br>
                    <strong>Police Precinct:</strong> ${d["Police.Precinct"] || 'Not specified'}
                `;
                
                // Add marker to the cluster group
                var marker = L.marker([lat, lng]).bindPopup(popupContent);
                markerClusterGroup.addLayer(marker);
            } catch (e) {
                console.error("Error creating marker:", e);
            }
        });
        
        // Add the marker cluster group to the map
        seattleMap.addLayer(markerClusterGroup);
        
        // Try to create a heatmap if we have enough points
        try {
            if (data.length > 0) {
                console.log("Creating heatmap with", data.length, "points");
                const heatData = data.map(d => {
                    return [parseFloat(d[latField]), parseFloat(d[lngField]), 1];
                });
                
                // Create the heat layer
                heatLayer = L.heatLayer(heatData, {
                    radius: 25,
                    blur: 15,
                    maxZoom: 17
                });
                
                var baseLayers = {
                    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
                };
                
                var overlays = {
                    "Markers": markerClusterGroup,
                    "Heat Map": heatLayer
                };
                
                // Remove any existing layer controls
                const controls = document.getElementsByClassName('leaflet-control-layers');
                while (controls.length > 0) {
                    controls[0].remove();
                }
                
                // Add layer control
                L.control.layers(baseLayers, overlays).addTo(seattleMap);
                
                // Start with the heatmap visible
                seattleMap.addLayer(heatLayer);
                console.log("Heatmap added to map");
            }
        } catch (e) {
            console.error("Error creating heatmap:", e);
        }
    } catch (e) {
        console.error("Error creating map visualization:", e);
    }
}

/**
 * Initialize the map when the page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded, setting up map and dropdown");
    
    // Initialize the map only once
    initMap();
    
    // Initialize the searchable dropdown
    const dropdown = document.getElementById('request-neighborhood-filter');
    if (dropdown) {
        try {
            console.log("Initializing searchable dropdown");
            // Initialize Choices.js on the dropdown
            const choices = new Choices(dropdown, {
                searchEnabled: true,
                searchPlaceholderValue: 'Search neighborhoods...',
                itemSelectText: '',
                position: 'bottom',
                shouldSort: false
            });
            console.log("Searchable dropdown initialized");
            
            // Add event listener for dropdown changes
            dropdown.addEventListener('change', function() {
                console.log("Dropdown changed, filtering neighborhood");
                filterMapByNeighborhood();
            });
        } catch (error) {
            console.error("Error initializing searchable dropdown:", error);
        }
    } else {
        console.error("Neighborhood filter dropdown not found");
    }
    
    // Load the default neighborhood data after a delay
    setTimeout(function() {
        console.log("Loading default neighborhood data");
        filterMapByNeighborhood();
    }, 1000);
});