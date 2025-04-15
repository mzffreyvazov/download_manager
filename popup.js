// popup.js

const urlPatternInput = document.getElementById('urlPattern');
const fileExtensionInput = document.getElementById('fileExtension'); // Get the new input
const folderNameInput = document.getElementById('folderName');
const addFilterBtn = document.getElementById('addFilterBtn');
const filterListUl = document.getElementById('filterList');

// --- Functions ---

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
      if (filter.fileExtension) {
          descriptionParts.push(`File is "${filter.fileExtension}"`);
      }

      let filterDescription = "If ";
      if (descriptionParts.length > 0) {
          filterDescription += descriptionParts.join(' AND ');
      } else {
          filterDescription += " (Error: No criteria found) "; // Should not happen with validation
      }
      filterDescription += `, save to "${filter.folderName}/"`;

      textSpan.textContent = filterDescription;


      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.dataset.filterIndex = index; // Store index to identify which filter to delete

      deleteBtn.addEventListener('click', handleDeleteFilter);

      li.appendChild(textSpan);
      li.appendChild(deleteBtn);
      filterListUl.appendChild(li);
    });
  });
}

// Handle adding a new filter
function handleAddFilter() {
  const urlPattern = urlPatternInput.value.trim();
  let fileExtension = fileExtensionInput.value.trim().toLowerCase(); // Get extension, trim, lowercase
  const folderName = folderNameInput.value.trim();

  // --- Validation ---
  if (!folderName) {
    alert('Please enter a folder name.');
    return;
  }
  if (!urlPattern && !fileExtension) {
    alert('Please enter at least a URL pattern OR a file extension.');
    return;
  }
   if (/[\\/]/.test(folderName)) {
       alert('Folder name cannot contain slashes (\\ or /). Please enter a simple name.');
       return;
   }
   // Validate file extension format (if provided)
   if (fileExtension && !fileExtension.startsWith('.')) {
       alert('File extension must start with a dot (e.g., .pdf, .jpg).');
       return;
   }
   if (fileExtension && fileExtension.length < 2) { // Needs at least dot + one character
       alert('File extension seems too short (e.g., .pdf, .jpg).');
       return;
   }
   // --- End Validation ---


  // Construct the new filter object, including the extension (can be empty string)
  const newFilter = { urlPattern, fileExtension, folderName };

  chrome.storage.sync.get(['filters'], (result) => {
    const filters = result.filters || [];
    filters.push(newFilter);
    chrome.storage.sync.set({ filters: filters }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving filter:", chrome.runtime.lastError);
            alert("Error saving filter. See console for details.");
        } else {
            console.log('Filter added:', newFilter);
            urlPatternInput.value = ''; // Clear input fields
            fileExtensionInput.value = '';
            folderNameInput.value = '';
            loadFilters(); // Refresh the displayed list
        }
    });
  });
}

// Handle deleting a filter (no changes needed here)
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