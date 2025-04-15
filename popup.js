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
        filterListUl.innerHTML = '<li>No filters defined yet.</li>';
        return;
    }

    filters.forEach((filter, index) => {
      const li = document.createElement('li');

      const textSpan = document.createElement('span');
      textSpan.className = 'filter-text';

      // Build the description string based on provided filter criteria
      let descriptionParts = [];
      if (filter.urlPattern) {
          descriptionParts.push(`URL contains "${filter.urlPattern}"`);
      }
      // Now handle the array of extensions
      if (filter.fileExtensions && filter.fileExtensions.length > 0) {
          // Join the extensions for display
          descriptionParts.push(`File type is one of "${filter.fileExtensions.join(', ')}"`);
      }

      let filterDescription = "If ";
      if (descriptionParts.length > 0) {
          filterDescription += descriptionParts.join(' AND ');
      } else {
          // This case should ideally be prevented by validation on add
          filterDescription += " (Error: No criteria found) ";
      }
      filterDescription += `, save to "${filter.folderName}/"`;

      textSpan.textContent = filterDescription;


      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.dataset.filterIndex = index; // Store index to identify which filter to delete

      deleteBtn.addEventListener('click', handleDeleteFilter); // Uses the existing delete function

      li.appendChild(textSpan);
      li.appendChild(deleteBtn);
      filterListUl.appendChild(li);
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