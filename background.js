// background.js

// Function to sanitize folder names (basic example)
function sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  }
  
  // Listener for the onDeterminingFilename event
  chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    console.log("Download detected:", downloadItem.url, "Filename:", downloadItem.filename, "Referrer:", downloadItem.referrer);
  
    const sourceUrl = downloadItem.referrer || downloadItem.url; // Prefer referrer
    const downloadFilenameLower = downloadItem.filename.toLowerCase(); // Lowercase filename for comparison
  
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
  
      // Find the first matching filter
      for (const filter of filters) {
        // Ensure filter has necessary properties (basic check)
        if (!filter || typeof filter.folderName !== 'string') {
            console.warn("Skipping invalid filter object:", filter);
            continue;
        }
        
        // Normalize filter criteria (use empty strings if properties are missing)
        const urlPattern = (filter.urlPattern || "").toLowerCase();
        const fileExtension = (filter.fileExtension || "").toLowerCase(); // Already lowercase from popup.js, but safe
  
        let urlMatch = false;
        let extensionMatch = false;
  
        // --- Check URL Pattern Match ---
        // Only check if a URL pattern is specified in the filter
        if (urlPattern) {
            if (sourceUrl && sourceUrl.toLowerCase().includes(urlPattern)) {
                urlMatch = true;
            }
        } else {
            // If no URL pattern is specified, this condition is considered met
            urlMatch = true;
        }
  
        // --- Check File Extension Match ---
        // Only check if a file extension is specified in the filter
        if (fileExtension) {
             // Ensure it starts with a dot (should be guaranteed by popup)
             if (fileExtension.startsWith('.') && downloadFilenameLower.endsWith(fileExtension)) {
                 extensionMatch = true;
             }
        } else {
            // If no file extension is specified, this condition is considered met
            extensionMatch = true;
        }
  
        // --- Determine if Filter Applies ---
        // The filter applies only if BOTH the URL condition AND the extension condition are met.
        // Since conditions are true by default if not specified, this works correctly:
        // - URL only: urlMatch=true/false, extensionMatch=true => filterApplies = urlMatch
        // - Extension only: urlMatch=true, extensionMatch=true/false => filterApplies = extensionMatch
        // - Both: urlMatch=true/false, extensionMatch=true/false => filterApplies = urlMatch && extensionMatch
        // - Neither specified (invalid filter, handled by popup): urlMatch=true, extensionMatch=true => filterApplies = true (but should have folderName)
        if (urlMatch && extensionMatch) {
          // Construct the new relative path
          const safeFolderName = sanitizeFilename(filter.folderName);
          let originalFilename = downloadItem.filename;
          // Extract original filename correctly, even if Chrome provides a partial path
          const lastSeparatorIndex = Math.max(originalFilename.lastIndexOf('/'), originalFilename.lastIndexOf('\\'));
          if (lastSeparatorIndex !== -1) {
              originalFilename = originalFilename.substring(lastSeparatorIndex + 1);
          }
  
          suggestedPath = `${safeFolderName}/${originalFilename}`;
          console.log(`Match found for filter (URL Pattern: "${filter.urlPattern || 'N/A'}", Extension: "${filter.fileExtension || 'N/A'}"). Suggesting path: ${suggestedPath}`);
          break; // Stop checking once a match is found
        }
      } // End of loop through filters
  
      // If a matching filter was found, suggest the new path
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
  
  console.log("Download Organizer background script loaded (with extension filtering).");