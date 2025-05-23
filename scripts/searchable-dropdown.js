/**
 * searchable-dropdown.js
 * Handles the searchable dropdown functionality for filtering service requests by neighborhood
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
        const choicesOptions = [];

        // Check if the dropdown already has an "All neighborhoods" option
        const hasAllOption = Array.from(dropdown.options).some(option =>
            option.value === 'all' && (option.text === 'All neighborhoods' || option.text === 'All Request Types')
        );

        // Only add the "All" option if it doesn't already exist
        if (!hasAllOption) {
            choicesOptions.push({ value: 'all', label: 'All neighborhoods' });
        }

        // Add the unique values
        choicesOptions.push(...uniqueValues.map(value => ({ value: value, label: value })));

        // Destroy existing Choices instance if it exists
        if (choicesInstance) {
            choicesInstance.destroy();
        }

        // Initialize Choices.js
        choicesInstance = new Choices(dropdown, {
            choices: choicesOptions,
            searchEnabled: true,
            searchPlaceholderValue: 'Search neighborhoods...',
            itemSelectText: '',
            shouldSort: false, // We've already sorted the array
            position: 'bottom',
            renderChoiceLimit: -1,
            placeholderValue: 'Select a neighborhood',
            allowHTML: false,
            searchResultLimit: 100,
            searchChoices: true,
            renderSelectedChoices: 'auto',
            loadingText: 'Loading...',
            noResultsText: 'No results found',
            noChoicesText: 'No choices to choose from',
            itemSelectText: 'Press to select',
            addItemText: (value) => {
                return `Press Enter to add <b>"${value}"</b>`;
            },
            maxItemText: (maxItemCount) => {
                return `Only ${maxItemCount} values can be added`;
            },
            valueComparer: (value1, value2) => {
                return value1 === value2;
            },
            classNames: {
                containerOuter: 'choices',
                containerInner: 'choices__inner',
                input: 'choices__input',
                inputCloned: 'choices__input--cloned',
                list: 'choices__list',
                listItems: 'choices__list--multiple',
                listSingle: 'choices__list--single',
                listDropdown: 'choices__list--dropdown',
                item: 'choices__item',
                itemSelectable: 'choices__item--selectable',
                itemDisabled: 'choices__item--disabled',
                itemChoice: 'choices__item--choice',
                placeholder: 'choices__placeholder',
                group: 'choices__group',
                groupHeading: 'choices__heading',
                button: 'choices__button',
                activeState: 'is-active',
                focusState: 'is-focused',
                openState: 'is-open',
                disabledState: 'is-disabled',
                highlightedState: 'is-highlighted',
                selectedState: 'is-selected',
                flippedState: 'is-flipped',
                loadingState: 'is-loading',
                noResults: 'has-no-results',
                noChoices: 'has-no-choices'
            }
        });

        // Add event listener for when a choice is made
        dropdown.addEventListener('change', function () {
            if (onChangeCallback && typeof onChangeCallback === 'function') {
                onChangeCallback(dropdown.value);
            }
        });

        // Add hover effect enhancement
        enhanceChoicesHoverEffect();

        console.log("Searchable dropdown initialized");
    } catch (error) {
        console.error("Error initializing searchable dropdown:", error);
    }
}

/**
 * Enhance the hover effect for Choices.js dropdown items
 */
function enhanceChoicesHoverEffect() {
    // Wait for the dropdown to be fully initialized
    setTimeout(() => {
        // Add event listener for dropdown opening
        document.addEventListener('click', function (e) {
            // Check if dropdown is open
            const dropdowns = document.querySelectorAll('.choices.is-open');
            if (dropdowns.length > 0) {
                // For each open dropdown
                dropdowns.forEach(dropdown => {
                    // Get all dropdown items
                    const items = dropdown.querySelectorAll('.choices__item--selectable');

                    // Add mouseenter and mouseleave event listeners to each item
                    items.forEach(item => {
                        // Remove existing listeners to prevent duplicates
                        item.removeEventListener('mouseenter', handleMouseEnter);
                        item.removeEventListener('mouseleave', handleMouseLeave);

                        // Add new listeners
                        item.addEventListener('mouseenter', handleMouseEnter);
                        item.addEventListener('mouseleave', handleMouseLeave);
                    });
                });
            }
        });
    }, 100);
}

/**
 * Handle mouseenter event for dropdown items
 */
function handleMouseEnter(e) {
    e.target.style.backgroundColor = '#f0f7ff';
    e.target.classList.add('choices__item--hover');
}

/**
 * Handle mouseleave event for dropdown items
 */
function handleMouseLeave(e) {
    e.target.style.backgroundColor = '';
    e.target.classList.remove('choices__item--hover');
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