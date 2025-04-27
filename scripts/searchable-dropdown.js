/**
 * searchable-dropdown.js
 * Handles the searchable dropdown functionality for filtering service requests
 */

// Global instance of Choices.js
let choicesInstance = null;

/**
 * Initialize a searchable dropdown for filtering
 * 
 * @param {string} elementId - The ID of the select element to transform
 * @param {Array} data - The data array to extract options from
 * @param {string} fieldName - The field name to use for extracting unique values
 * @param {Function} onChangeCallback - Function to call when selection changes
 */
function initSearchableDropdown(elementId, data, fieldName, onChangeCallback) {
    const dropdown = document.getElementById(elementId);
    if (!dropdown) {
        console.error(`Element with ID ${elementId} not found`);
        return;
    }
    
    try {
        // Get unique values from the data using the specified field
        const uniqueValues = [...new Set(data
            .filter(d => d[fieldName] && d[fieldName].trim() !== '')
            .map(d => d[fieldName]))]
            .sort();
        
        console.log(`Found ${uniqueValues.length} unique values for ${fieldName}`);
        
        // Prepare choices options
        const choicesOptions = [
            { value: 'all', label: 'All Request Types' },
            ...uniqueValues.map(value => ({ value: value, label: value }))
        ];
        
        // Destroy existing Choices instance if it exists
        if (choicesInstance) {
            choicesInstance.destroy();
        }
        
        // Initialize Choices.js
        choicesInstance = new Choices(dropdown, {
            choices: choicesOptions,
            searchEnabled: true,
            searchPlaceholderValue: 'Search request types...',
            itemSelectText: '',
            shouldSort: false, // We've already sorted the array
            position: 'bottom',
            placeholder: true,
            placeholderValue: 'Select a request type',
            classNames: {
                containerOuter: 'choices filter-dropdown'
            }
        });
        
        // Add event listener for when a choice is made
        if (onChangeCallback && typeof onChangeCallback === 'function') {
            dropdown.addEventListener('change', onChangeCallback);
        }
        
        return choicesInstance;
    } catch (error) {
        console.error("Error initializing searchable dropdown:", error);
        return null;
    }
}

/**
 * Destroy the current Choices.js instance
 */
function destroySearchableDropdown() {
    if (choicesInstance) {
        choicesInstance.destroy();
        choicesInstance = null;
    }
}

/**
 * Get the currently selected value from the dropdown
 * 
 * @param {string} elementId - The ID of the select element
 * @returns {string} The selected value
 */
function getSelectedValue(elementId) {
    const dropdown = document.getElementById(elementId);
    return dropdown ? dropdown.value : null;
}