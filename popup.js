// popup.js

const urlPatternInput = document.getElementById('urlPattern');
// New elements for tags
const extensionInput = document.getElementById('extensionInput');
const extensionTagsContainer = document.getElementById('extensionTagsContainer');
const folderNameInput = document.getElementById('folderName');
const addFilterBtn = document.getElementById('addFilterBtn');
const filterListUl = document.getElementById('filterList');

// --- State for the current filter being built ---
let currentExtensions = []; // Array to hold extensions for the NEW filter

// --- Functions ---

// Render the tags in the container based on the currentExtensions array
function renderTags() {
    extensionTagsContainer.innerHTML = ''; // Clear existing tags
    currentExtensions.forEach((ext, index) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = ext;

        const removeBtn = document.createElement('span');
        removeBtn.className = 'tag-remove';
        removeBtn.textContent = 'x';
        removeBtn.title = 'Remove extension';
        removeBtn.dataset.index = index; // Store index to remove

        removeBtn.addEventListener('click', handleRemoveTag);

        tag.appendChild(removeBtn);
        extensionTagsContainer.appendChild(tag);
    });
}

// Handle removing a tag when its 'x' is clicked
function handleRemoveTag(event) {
    const indexToRemove = parseInt(event.target.dataset.index, 10);
    if (!isNaN(indexToRemove) && indexToRemove >= 0 && indexToRemove < currentExtensions.length) {
        currentExtensions.splice(indexToRemove, 1); // Remove from the array
        renderTags(); // Re-render the tags display
    }
}

// Handle Enter key press in the extension input
function handleExtensionInputKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent potential form submission

        const rawExt = extensionInput.value.trim().toLowerCase();

        // --- Validation ---
        if (!rawExt) return; // Ignore empty input

        if (!rawExt.startsWith('.')) {
            alert('Extension must start with a dot (e.g., .pdf)');
            return;
        }
        if (rawExt.length < 2) {
            alert('Extension seems too short (e.g., .pdf)');
            return;
        }
         if (/[<>:"/\\|?*\s]/.test(rawExt)) {
             alert('Extension contains invalid characters.');
             return;
         }
        if (currentExtensions.includes(rawExt)) {
            alert('Extension already added.');
            extensionInput.value = ''; // Clear input even if duplicate
            return;
        }
        // --- End Validation ---

        currentExtensions.push(rawExt); // Add to our temporary array
        renderTags(); // Update the visual display
        extensionInput.value = ''; // Clear the input field
    }
}

// Load and display filters from storage
function loadFilters() {
  chrome.storage.sync.get(['filters'], (result) => {
    filterListUl.innerHTML = ''; // Clear current list
    const filters = result.filters || [];

    if (filters.length === 0) {
        // Use a specific class for styling the "no filters" message
        const li = document.createElement('li');
        li.className = 'no-filters-message';
        li.textContent = 'No filters defined yet.';
        filterListUl.appendChild(li);
        return;
    }

    filters.forEach((filter, index) => {
      const li = document.createElement('li');
      li.className = 'filter-item'; // Add a class for potential item-level styling

      const contentDiv = document.createElement('div');
      contentDiv.className = 'filter-item-content';

      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'filter-description';

      const conditionsDiv = document.createElement('div');
      conditionsDiv.className = 'filter-conditions';
      conditionsDiv.innerHTML = '<strong>IF:</strong>'; // Start with "IF:"

      let conditionsMet = false; // Track if any condition exists

      // Add URL condition if present
      if (filter.urlPattern) {
          const urlSpan = document.createElement('span');
          // Updated text to mention wildcard matching
          urlSpan.innerHTML = `&nbsp;&nbsp;- URL matches pattern "<code>${filter.urlPattern}</code>"`;
          conditionsDiv.appendChild(urlSpan);
          conditionsMet = true;
      }

      // Add Extension condition if present
      if (filter.fileExtensions && filter.fileExtensions.length > 0) {
          const extSpan = document.createElement('span');
          // Use <code> for better visual distinction of extensions
          const extHtml = filter.fileExtensions.map(ext => `<code>${ext}</code>`).join(', ');
          extSpan.innerHTML = `&nbsp;&nbsp;- File type is one of ${extHtml}`;
          conditionsDiv.appendChild(extSpan);
          conditionsMet = true;
      }

      // Handle case where a filter might have been saved without conditions (should be prevented by UI)
      if (!conditionsMet) {
          const noCondSpan = document.createElement('span');
          noCondSpan.innerHTML = '&nbsp;&nbsp;- <i>(No conditions specified)</i>';
          conditionsDiv.appendChild(noCondSpan);
      }

      descriptionDiv.appendChild(conditionsDiv);

      // Add Action part
      const actionDiv = document.createElement('div');
      actionDiv.className = 'filter-action';
      actionDiv.innerHTML = `<strong>THEN:</strong> Save to "<code>${filter.folderName}/</code>"`;
      descriptionDiv.appendChild(actionDiv);


      // Create Delete Button (remains the same logic)
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.dataset.filterIndex = index;
      deleteBtn.addEventListener('click', handleDeleteFilter);

      // Assemble the list item
      contentDiv.appendChild(descriptionDiv); // Add description part
      contentDiv.appendChild(deleteBtn);      // Add delete button next to description
      li.appendChild(contentDiv);             // Add the main content container to the list item
      filterListUl.appendChild(li);           // Add the list item to the list
    });
  });
}

// Handle adding a new filter
function handleAddFilter() {
  const urlPattern = urlPatternInput.value.trim();
  // Extensions are now taken from the currentExtensions array
  const folderName = folderNameInput.value.trim();

  // --- Validation ---
  if (!folderName) {
    alert('Please enter a folder name.');
    return;
  }
  // Check if *at least one* condition exists
  if (!urlPattern && currentExtensions.length === 0) {
    alert('Please enter at least a URL pattern OR add one or more file extensions.');
    return;
  }
   if (/[\\/]/.test(folderName)) {
       alert('Folder name cannot contain slashes (\\ or /). Please enter a simple name.');
       return;
   }
   // Extension format validation happens when adding tags now.
   // --- End Validation ---


  // Construct the new filter object, using the array for extensions
  // IMPORTANT: Use a different key name like 'fileExtensions' (plural)
  const newFilter = {
      urlPattern,
      fileExtensions: [...currentExtensions], // Store a copy of the array
      folderName
  };

  chrome.storage.sync.get(['filters'], (result) => {
    const filters = result.filters || [];
    filters.push(newFilter);
    chrome.storage.sync.set({ filters: filters }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving filter:", chrome.runtime.lastError);
            alert("Error saving filter. See console for details.");
        } else {
            console.log('Filter added:', newFilter);
            // Clear the form AND the tag state
            urlPatternInput.value = '';
            folderNameInput.value = '';
            extensionInput.value = ''; // Clear the typing input
            currentExtensions = [];   // Reset the array for the next filter
            renderTags();             // Clear the displayed tags
            loadFilters();            // Refresh the main list of saved filters
        }
    });
  });
}

// Handle deleting a filter (no changes needed here, it deletes based on index)
function handleDeleteFilter(event) {
    const indexToDelete = parseInt(event.target.dataset.filterIndex, 10);

    chrome.storage.sync.get(['filters'], (result) => {
        let filters = result.filters || [];
        if (indexToDelete >= 0 && indexToDelete < filters.length) {
            const removed = filters.splice(indexToDelete, 1); // Remove filter at the specified index
             console.log('Attempting to delete filter:', removed[0]);
            chrome.storage.sync.set({ filters: filters }, () => {
                 if (chrome.runtime.lastError) {
                    console.error("Error deleting filter:", chrome.runtime.lastError);
                    alert("Error deleting filter. See console for details.");
                } else {
                    console.log('Filter deleted.');
                    loadFilters(); // Refresh the list
                }
            });
        } else {
            console.error("Invalid index provided for deletion:", indexToDelete);
        }
    });
}


// --- Event Listeners ---

// Load filters when the popup opens
document.addEventListener('DOMContentLoaded', loadFilters);

// Add filter when the button is clicked
addFilterBtn.addEventListener('click', handleAddFilter);

// Listen for Enter key in the extension input field
extensionInput.addEventListener('keydown', handleExtensionInputKey);

// Initial rendering of tags (will be empty at first)
renderTags();