const urlPatternInput = document.getElementById('urlPattern');
const extensionInput = document.getElementById('extensionInput');
const extensionTagsContainer = document.getElementById('extensionTagsContainer');
const folderNameInput = document.getElementById('folderName');
const addFilterBtn = document.getElementById('addFilterBtn');
const filterListUl = document.getElementById('filterList');


let currentExtensions = []; 




function renderTags() {
    extensionTagsContainer.innerHTML = ''; 
    currentExtensions.forEach((ext, index) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = ext;

        const removeBtn = document.createElement('span');
        removeBtn.className = 'tag-remove';
        removeBtn.textContent = 'x';
        removeBtn.title = 'Remove extension';
        removeBtn.dataset.index = index; 

        removeBtn.addEventListener('click', handleRemoveTag);

        tag.appendChild(removeBtn);
        extensionTagsContainer.appendChild(tag);
    });
}


function handleRemoveTag(event) {
    const indexToRemove = parseInt(event.target.dataset.index, 10);
    if (!isNaN(indexToRemove) && indexToRemove >= 0 && indexToRemove < currentExtensions.length) {
        currentExtensions.splice(indexToRemove, 1); 
        renderTags(); 
    }
}


function handleExtensionInputKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); 

        const rawExt = extensionInput.value.trim().toLowerCase();

        
        if (!rawExt) return; 

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
            extensionInput.value = ''; 
            return;
        }
        

        currentExtensions.push(rawExt); 
        renderTags(); 
        extensionInput.value = ''; 
    }
}


function loadFilters() {
  chrome.storage.sync.get(['filters'], (result) => {
    filterListUl.innerHTML = ''; 
    const filters = result.filters || [];

    if (filters.length === 0) {
        
        const li = document.createElement('li');
        li.className = 'no-filters-message';
        li.textContent = 'No filters defined yet.';
        filterListUl.appendChild(li);
        return;
    }

    filters.forEach((filter, index) => {
      const li = document.createElement('li');
      li.className = 'filter-item'; 

      const contentDiv = document.createElement('div');
      contentDiv.className = 'filter-item-content';

      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'filter-description';

      const conditionsDiv = document.createElement('div');
      conditionsDiv.className = 'filter-conditions';
      conditionsDiv.innerHTML = '<strong>IF:</strong>'; 

      let conditionsMet = false; 

      
      if (filter.urlPattern) {
          const urlSpan = document.createElement('span');
          
          urlSpan.innerHTML = `&nbsp;&nbsp;- URL matches pattern "<code>${filter.urlPattern}</code>"`;
          conditionsDiv.appendChild(urlSpan);
          conditionsMet = true;
      }

      
      if (filter.fileExtensions && filter.fileExtensions.length > 0) {
          const extSpan = document.createElement('span');
          
          const extHtml = filter.fileExtensions.map(ext => `<code>${ext}</code>`).join(', ');
          extSpan.innerHTML = `&nbsp;&nbsp;- File type is one of ${extHtml}`;
          conditionsDiv.appendChild(extSpan);
          conditionsMet = true;
      }

      
      if (!conditionsMet) {
          const noCondSpan = document.createElement('span');
          noCondSpan.innerHTML = '&nbsp;&nbsp;- <i>(No conditions specified)</i>';
          conditionsDiv.appendChild(noCondSpan);
      }

      descriptionDiv.appendChild(conditionsDiv);

      
      const actionDiv = document.createElement('div');
      actionDiv.className = 'filter-action';
      actionDiv.innerHTML = `<strong>THEN:</strong> Save to "<code>${filter.folderName}/</code>"`;
      descriptionDiv.appendChild(actionDiv);


      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'delete-btn';
      deleteBtn.dataset.filterIndex = index;
      deleteBtn.addEventListener('click', handleDeleteFilter);

      
      contentDiv.appendChild(descriptionDiv); 
      contentDiv.appendChild(deleteBtn);      
      li.appendChild(contentDiv);             
      filterListUl.appendChild(li);           
    });
  });
}


function handleAddFilter() {
  const urlPattern = urlPatternInput.value.trim();
  
  const folderName = folderNameInput.value.trim();

  
  if (!folderName) {
    alert('Please enter a folder name.');
    return;
  }
  
  if (!urlPattern && currentExtensions.length === 0) {
    alert('Please enter at least a URL pattern OR add one or more file extensions.');
    return;
  }
   if (/[\\/]/.test(folderName)) {
       alert('Folder name cannot contain slashes (\\ or /). Please enter a simple name.');
       return;
   }
   
   


  
  
  const newFilter = {
      urlPattern,
      fileExtensions: [...currentExtensions], 
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
            
            urlPatternInput.value = '';
            folderNameInput.value = '';
            extensionInput.value = ''; 
            currentExtensions = [];   
            renderTags();             
            loadFilters();            
        }
    });
  });
}


function handleDeleteFilter(event) {
    const indexToDelete = parseInt(event.target.dataset.filterIndex, 10);

    chrome.storage.sync.get(['filters'], (result) => {
        let filters = result.filters || [];
        if (indexToDelete >= 0 && indexToDelete < filters.length) {
            const removed = filters.splice(indexToDelete, 1); 
             console.log('Attempting to delete filter:', removed[0]);
            chrome.storage.sync.set({ filters: filters }, () => {
                 if (chrome.runtime.lastError) {
                    console.error("Error deleting filter:", chrome.runtime.lastError);
                    alert("Error deleting filter. See console for details.");
                } else {
                    console.log('Filter deleted.');
                    loadFilters(); 
                }
            });
        } else {
            console.error("Invalid index provided for deletion:", indexToDelete);
        }
    });
}





document.addEventListener('DOMContentLoaded', loadFilters);


addFilterBtn.addEventListener('click', handleAddFilter);


extensionInput.addEventListener('keydown', handleExtensionInputKey);


renderTags();