// background.js

// Function to sanitize folder names (basic example)
function sanitizeFilename(name) {
    // Replace characters invalid in Windows/Mac/Linux filenames
    // This is a basic list, might need refinement
    return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  }
  
  // Listener for the onDeterminingFilename event
  chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    console.log("Download detected:", downloadItem.url, "Referrer:", downloadItem.referrer);
  
    // Use the referring URL (the page the download was initiated from)
    // Fallback to the download URL itself if referrer is missing
    const sourceUrl = downloadItem.referrer || downloadItem.url;
  
    if (!sourceUrl) {
      console.log("No source URL found for download.");
      // Don't suggest anything, let Chrome handle it normally
      return false; // Indicate we are not handling this asynchronously (or not handling it)
    }
  
    // Retrieve filters from storage
    chrome.storage.sync.get(['filters'], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving filters:", chrome.runtime.lastError);
        return; // Exit if there was an error
      }
  
      const filters = result.filters || [];
      let suggestedPath = null;
  
      console.log("Checking against filters:", filters);
  
      // Find the first matching filter
      for (const filter of filters) {
        try {
          // Basic check: Does the source URL *contain* the filter's URL pattern?
          // Could be enhanced with regex or more specific matching later.
          if (sourceUrl.toLowerCase().includes(filter.urlPattern.toLowerCase())) {
              
            // Extract original filename
            let originalFilename = downloadItem.filename;
            // Find the last path separator (either / or \)
            const lastSeparatorIndex = Math.max(originalFilename.lastIndexOf('/'), originalFilename.lastIndexOf('\\'));
            if (lastSeparatorIndex !== -1) {
                originalFilename = originalFilename.substring(lastSeparatorIndex + 1);
            }
  
            // Sanitize the folder name provided by the user
            const safeFolderName = sanitizeFilename(filter.folderName);
  
            // Construct the new relative path
            // IMPORTANT: Chrome expects forward slashes '/' as path separators
            suggestedPath = `${safeFolderName}/${originalFilename}`;
            console.log(`Match found for filter: ${filter.urlPattern}. Suggesting path: ${suggestedPath}`);
            break; // Stop checking once a match is found
          }
        } catch (error) {
          console.error(`Error processing filter "${filter.urlPattern}":`, error);
          // Continue to the next filter in case of an error with one
        }
      }
  
      // If a matching filter was found, suggest the new path
      if (suggestedPath) {
        suggest({
          filename: suggestedPath,
          // 'uniquify' appends (1), (2) etc. if file exists
          // 'overwrite' overwrites existing files
          // 'prompt' asks the user (like default behavior but with suggested path)
          conflictAction: 'uniquify'
        });
        console.log("Suggestion sent to Chrome API.");
        // Indicate that we will call suggest() asynchronously (required by the API)
        // Note: In Manifest V3 with async/await or Promises, returning true might not be strictly necessary
        // if the promise chain resolves correctly, but it's good practice from V2.
        // However, the primary mechanism is calling suggest().
        // If suggest() is called within this callback, Chrome knows it's handled.
      } else {
        console.log("No matching filter found. Using default download behavior.");
        // If no match, do nothing (don't call suggest). Chrome uses default behavior.
        // Explicitly return false if not handling asynchronously.
        // return false; // Not strictly needed if suggest() is never called
      }
    });
  
    // IMPORTANT: Return true to indicate that we will response asynchronously.
    // The `suggest` function will be called later inside the chrome.storage.sync.get callback.
    return true;
  });
  
  console.log("Download Organizer background script loaded.");