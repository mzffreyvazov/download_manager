// popup.js

const urlPatternInput = document.getElementById('urlPattern');
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
      textSpan.textContent = `If URL contains "${filter.urlPattern}", save to "${filter.folderName}/"`;

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
  const folderName = folderNameInput.value.trim();

  if (!urlPattern || !folderName) {
    alert('Please enter both a URL pattern and a folder name.');
    return;
  }

   // Basic validation for folder name (prevent slashes/backslashes)
   if (/[\\/]/.test(folderName)) {
       alert('Folder name cannot contain slashes (\\ or /). Please enter a simple name like "University" or "Work_Documents".');
       return;
   }


  const newFilter = { urlPattern, folderName };

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
            folderNameInput.value = '';
            loadFilters(); // Refresh the displayed list
        }
    });
  });
}

// Handle deleting a filter
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

// Note: Delete listeners are added dynamically in loadFilters