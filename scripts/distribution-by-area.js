// Use window load event instead of DOMContentLoaded to ensure all resources are loaded
window.addEventListener('load', function() {
    console.log("Window fully loaded, initializing map...");
    initMap();
});

// Global map variable
let seattleMap = null;

function initMap() {
    try {
        console.log("Starting map initialization");
        
        // Get the map container
        const mapContainer = document.getElementById('map');
        
        // Add loading indicator
        if (mapContainer) {
            mapContainer.innerHTML = '<div class="loading-indicator">Loading map data...</div>';
            console.log("Map container dimensions:", mapContainer.offsetWidth, "x", mapContainer.offsetHeight);
        } else {
            console.error("Map container not found!");
            return;
        }
        
        // Create the map with a slight delay to ensure container is ready
        setTimeout(function() {
            try {
                // Initialize the map centered on Seattle
                seattleMap = L.map('map', {
                    fadeAnimation: false,
                    zoomAnimation: false,
                    markerZoomAnimation: false
                }).setView([47.6062, -122.3321], 12);
                
                // Add the OpenStreetMap tile layer
                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19
                }).addTo(seattleMap);
                
                // Force a resize
                seattleMap.invalidateSize(true);
                
                // Load data
                loadMapData();
                
                console.log("Map initialized successfully");
            } catch (e) {
                console.error("Error during map initialization:", e);
                mapContainer.innerHTML = '<div class="error-message">Error initializing map: ' + e.message + '</div>';
            }
        }, 500);
    } catch (e) {
        console.error("Critical error in initMap:", e);
    }
}

function loadMapData() {
    console.log("Loading data for map...");
    
    d3.csv('./dataset/Customer_Service_Requests_20250426.csv')
        .then(function(data) {
            console.log("CSV data loaded, processing for map...");
            processMapData(data);
        })
        .catch(function(error) {
            console.error("Error loading CSV data:", error);
            document.getElementById('map').innerHTML = 
                '<div class="error-message">Error loading data: ' + error.message + '</div>';
        });
}

function processMapData(data) {
    try {
        console.log("Processing map data...");
        console.log("Sample data record:", data[0]); // Log a sample record to check field names
        
        // Filter out records without valid coordinates
        const validData = data.filter(d => {
            // Check if latitude and longitude exist and are valid numbers
            return d.Latitude && d.Longitude && 
                !isNaN(parseFloat(d.Latitude)) && 
                !isNaN(parseFloat(d.Longitude));
        });
        
        console.log(`Found ${validData.length} records with valid coordinates`);
        
        // If no valid data found, try alternative field names
        if (validData.length === 0) {
            console.log("Trying alternative field names...");
            // Log the keys of the first record to see what field names are available
            if (data.length > 0) {
                console.log("Available fields:", Object.keys(data[0]));
            }
            
            // Try with lowercase field names
            const validDataAlt = data.filter(d => {
                return d.latitude && d.longitude && 
                    !isNaN(parseFloat(d.latitude)) && 
                    !isNaN(parseFloat(d.longitude));
            });
            
            console.log(`Found ${validDataAlt.length} records with alternative field names`);
            
            if (validDataAlt.length > 0) {
                // Use the alternative data if found
                const displayData = validDataAlt.slice(0, 2000);
                createMapVisualization(displayData, 'latitude', 'longitude');
                return;
            }
            
            // If still no valid data, check for latitude_longitude field
            const validDataGeo = data.filter(d => d.latitude_longitude);
            console.log(`Found ${validDataGeo.length} records with latitude_longitude field`);
            
            if (validDataGeo.length > 0) {
                // Process latitude_longitude field
                // This typically comes in format like "POINT (-122.3321 47.6062)"
                const processedData = validDataGeo.map(d => {
                    try {
                        if (d.latitude_longitude) {
                            // Extract coordinates from POINT format
                            const match = d.latitude_longitude.match(/POINT \(([^ ]+) ([^ ]+)\)/);
                            if (match) {
                                return {
                                    ...d,
                                    extractedLng: parseFloat(match[1]),
                                    extractedLat: parseFloat(match[2])
                                };
                            }
                        }
                        return null;
                    } catch (e) {
                        console.error("Error processing point data:", e);
                        return null;
                    }
                }).filter(d => d !== null);
                
                console.log(`Processed ${processedData.length} records from latitude_longitude field`);
                
                if (processedData.length > 0) {
                    const displayData = processedData.slice(0, 2000);
                    createMapVisualization(displayData, 'extractedLat', 'extractedLng');
                    return;
                }
            }
            
            // If we still have no valid data, show an error
            document.getElementById('map').innerHTML = 
                '<div class="error-message">No valid coordinate data found in the dataset. Please check the data format.</div>';
            return;
        }
        
        // Limit to a reasonable number of points for performance
        const displayData = validData.slice(0, 2000);
        
        // Create markers
        createMapVisualization(displayData, 'Latitude', 'Longitude');
    } catch (e) {
        console.error("Error processing map data:", e);
        document.getElementById('map').innerHTML = 
            '<div class="error-message">Error processing map data: ' + e.message + '</div>';
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
        
        // Create a marker cluster group
        var markers = L.markerClusterGroup();
        
        // Add markers for each service request
        data.forEach(function(d) {
            try {
                const lat = parseFloat(d[latField]);
                const lng = parseFloat(d[lngField]);
                
                // Create popup content with request details
                const popupContent = `
                    <strong>Request Type:</strong> ${d.webintakeservicerequests || d["Service Request Type"] || 'Not specified'}<br>
                    <strong>Department:</strong> ${d.departmentname || d["City Department"] || 'Not specified'}<br>
                    <strong>Status:</strong> ${d.servicerequeststatusname || d.Status || 'Not specified'}<br>
                    <strong>Created:</strong> ${d.createddate || d["Created Date"] || 'Not specified'}<br>
                    <strong>Method:</strong> ${d.methodreceivedname || d["Method Received"] || 'Not specified'}<br>
                    <strong>Neighborhood:</strong> ${d.neighborhood || d.Neighborhood || 'Not specified'}<br>
                    <strong>ZIP Code:</strong> ${d.zipcode || d["ZIP Code"] || 'Not specified'}
                `;
                
                // Add marker to the cluster group
                var marker = L.marker([lat, lng]).bindPopup(popupContent);
                markers.addLayer(marker);
            } catch (e) {
                console.error("Error creating marker:", e);
            }
        });
        
        // Add the marker cluster group to the map
        seattleMap.addLayer(markers);
        
        // Try to create a heatmap if we have enough points
        try {
            if (data.length > 100) {
                var heatData = data.map(function(d) {
                    return [parseFloat(d[latField]), parseFloat(d[lngField]), 1];
                });
                
                var heat = L.heatLayer(heatData, {
                    radius: 25,
                    blur: 15,
                    maxZoom: 17
                });
                
                // Add layer control
                var baseLayers = {
                    "OpenStreetMap": L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
                };
                
                var overlays = {
                    "Markers": markers,
                    "Heat Map": heat
                };
                
                L.control.layers(baseLayers, overlays).addTo(seattleMap);
                
                // Start with the heatmap visible
                seattleMap.addLayer(heat);
            }
        } catch (e) {
            console.error("Error creating heatmap:", e);
        }
        
        console.log("Map visualization complete");
    } catch (e) {
        console.error("Error creating map visualization:", e);
    }
}