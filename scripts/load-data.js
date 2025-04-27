// Global variable to store the CSV data
let globalCsvData = null;
let dataLoadPromise = null;
let dataLoadListeners = [];

// Function to load the CSV data only once
function loadCsvData() {
  // If we already have the data, return it immediately
  if (globalCsvData !== null) {
    return Promise.resolve(globalCsvData);
  }
  
  // If we're already loading the data, return the existing promise
  if (dataLoadPromise !== null) {
    return dataLoadPromise;
  }
  
  console.log("Loading CSV data centrally...");
  
  // Show loading indicators on both visualizations
  updateLoadingStatus('barChart', 'Loading data centrally...');
  updateLoadingStatus('map', 'Loading data centrally...');
  
  // Create the promise to load the data
  dataLoadPromise = d3.csv('./dataset/Customer_Service_Requests_20250426.csv')
    .then(function(data) {
      console.log(`Loaded ${data.length} rows of data`);
      console.log("Sample data row:", data[0]);
      
      // Store the data globally
      globalCsvData = data;
      
      // Notify all listeners that data is ready
      notifyDataListeners(data);
      
      return data;
    })
    .catch(function(error) {
      console.error("Error loading CSV file:", error);
      
      // Show error on both visualizations
      showError('barChart', `Error loading data: ${error.message}`);
      showError('map', `Error loading data: ${error.message}`);
      
      // Reset the promise so we can try again
      dataLoadPromise = null;
      throw error;
    });
  
  return dataLoadPromise;
}

// Helper function to update loading status
function updateLoadingStatus(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="loading-indicator">${message}</div>`;
  }
}

// Helper function to show errors
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<p class="error-message">${message}</p>`;
  }
}

// Function to register a callback for when data is loaded
function onDataLoaded(callback) {
  if (globalCsvData !== null) {
    // Data is already loaded, call immediately
    setTimeout(() => callback(globalCsvData), 0);
  } else {
    // Add to listeners for when data loads
    dataLoadListeners.push(callback);
    
    // If we haven't started loading yet, start loading
    if (dataLoadPromise === null) {
      loadCsvData();
    }
  }
}

// Function to notify all listeners when data is loaded
function notifyDataListeners(data) {
  while (dataLoadListeners.length > 0) {
    const listener = dataLoadListeners.shift();
    try {
      listener(data);
    } catch (e) {
      console.error("Error in data listener:", e);
    }
  }
}

// Check if the document is already loaded, if yes, pre-load the data
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(loadCsvData, 100);
} else {
  // Otherwise wait for the DOM to be ready
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadCsvData, 100);
  });
}