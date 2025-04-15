// background.js

// Function to sanitize folder names (basic example)
function sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  }
  
  // Helper function to extract file extension (e.g., ".pdf", ".txt")
  // Returns null if no extension found
  function getFileExtension(filename) {
      if (typeof filename !== 'string') return null;
      const lastDotIndex = filename.lastIndexOf('.');
      // Check if dot exists and is not the first character (hidden files)
      // and is not the last character (e.g. "folder.")
      if (lastDotIndex > 0 && lastDotIndex < filename.length - 1) {
          return filename.substring(lastDotIndex).toLowerCase(); // Include the dot, lowercase
      }
      return null; // No valid extension found
  }
  
  
  // Listener for the onDeterminingFilename event
  chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    console.log("Download detected:", downloadItem.url, "Filename:", downloadItem.filename, "Referrer:", downloadItem.referrer);
  
    const sourceUrl = downloadItem.referrer || downloadItem.url; // Prefer referrer
    const downloadedExtension = getFileExtension(downloadItem.filename); // Extract the actual extension
  
    // No need to check filename itself here unless specifically needed later
    if (!sourceUrl && !downloadItem.filename) {
      console.log("No source URL or filename found for download.");
      return false;
    }
  
    // Retrieve filters from storage
    chrome.storage.sync.get(['filters'], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving filters:", chrome.runtime.lastError);
        return;
      }
  
      const filters = result.filters || [];
      let suggestedPath = null;
  
      console.log("Checking against filters:", filters);
      console.log(`Downloaded file extension: ${downloadedExtension}`); // Log extracted extension
  
      // Find the first matching filter
      for (const filter of filters) {
        // Basic validation of filter object structure
        if (!filter || typeof filter.folderName !== 'string') {
            console.warn("Skipping invalid filter object:", filter);
            continue;
        }
  
        // Normalize filter criteria
        const urlPattern = (filter.urlPattern || "").toLowerCase();
        // Expecting an array, default to empty array if missing or not an array
        const requiredExtensions = Array.isArray(filter.fileExtensions) ? filter.fileExtensions : [];
  
        let urlMatch = false;
        let extensionMatch = false;
  
        // --- Check URL Pattern Match ---
        if (urlPattern) {
            if (sourceUrl && sourceUrl.toLowerCase().includes(urlPattern)) {
                urlMatch = true;
            }
        } else {
            urlMatch = true; // No URL pattern required by this filter
        }
  
        // --- Check File Extension Match ---
        if (requiredExtensions.length > 0) {
             // Check if the downloaded file has an extension AND if that extension is in the filter's list
             if (downloadedExtension && requiredExtensions.includes(downloadedExtension)) {
                 extensionMatch = true;
             }
             // If requiredExtensions has items, but downloadedExtension is null or not in the list,
             // extensionMatch remains false.
        } else {
            // No extensions specified in this filter, so this condition is met
            extensionMatch = true;
        }
  
        // --- Determine if Filter Applies ---
        if (urlMatch && extensionMatch) {
          // Construct the new relative path
          const safeFolderName = sanitizeFilename(filter.folderName);
          let originalFilename = downloadItem.filename;
          const lastSeparatorIndex = Math.max(originalFilename.lastIndexOf('/'), originalFilename.lastIndexOf('\\'));
          if (lastSeparatorIndex !== -1) {
              originalFilename = originalFilename.substring(lastSeparatorIndex + 1);
          }
  
          suggestedPath = `${safeFolderName}/${originalFilename}`;
          console.log(`Match found for filter (URL Pattern: "${filter.urlPattern || 'N/A'}", Extensions: "[${(filter.fileExtensions || []).join(', ')}]"). Suggesting path: ${suggestedPath}`);
          break; // Stop checking once a match is found
        }
      } // End of loop through filters
  
      // Suggest path or log default behavior (same as before)
      if (suggestedPath) {
        suggest({
          filename: suggestedPath,
          conflictAction: 'uniquify'
        });
        console.log("Suggestion sent to Chrome API.");
      } else {
        console.log("No matching filter found. Using default download behavior.");
      }
    });
  
    // Indicate that we will response asynchronously
    return true;
  });
  
  console.log("Download Organizer background script loaded (with multi-extension tag support).");