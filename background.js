


function sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}



function getFileExtension(filename) {
    if (typeof filename !== 'string') return null;
    const lastDotIndex = filename.lastIndexOf('.');
    
    
    if (lastDotIndex > 0 && lastDotIndex < filename.length - 1) {
        return filename.substring(lastDotIndex).toLowerCase(); 
    }
    return null; 
}



function wildcardToRegex(pattern) {
    if (!pattern) return null;
    
    const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = escapedPattern.replace(/\*/g, '.*');
    try {
        
        return new RegExp(regexPattern, 'i');
    } catch (e) {
        console.error(`Invalid regex pattern created from wildcard: ${pattern}`, e);
        return null; 
    }
}


chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    console.log("Download detected:", downloadItem.url, "Filename:", downloadItem.filename, "Referrer:", downloadItem.referrer);

    const sourceUrl = downloadItem.referrer || downloadItem.url; 
    const downloadedExtension = getFileExtension(downloadItem.filename); 

    
    if (!sourceUrl && !downloadItem.filename) {
        console.log("No source URL or filename found for download.");
        return false;
    }

    
    chrome.storage.sync.get(['filters'], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving filters:", chrome.runtime.lastError);
            return;
        }

        const filters = result.filters || [];
        let suggestedPath = null;

        console.log("Checking against filters:", filters);
        console.log(`Downloaded file extension: ${downloadedExtension}`); 

        
        for (const filter of filters) {
            
            if (!filter || typeof filter.folderName !== 'string') {
                console.warn("Skipping invalid filter object:", filter);
                continue;
            }

            
            const urlPattern = filter.urlPattern || ""; 
            
            const requiredExtensions = Array.isArray(filter.fileExtensions) ? filter.fileExtensions : [];

            let urlMatch = false;
            let extensionMatch = false;

            
            if (urlPattern) {
                const urlRegex = wildcardToRegex(urlPattern);
                if (urlRegex && sourceUrl && urlRegex.test(sourceUrl)) {
                    urlMatch = true;
                }
            } else {
                urlMatch = true; 
            }

            
            if (requiredExtensions.length > 0) {
                
                if (downloadedExtension && requiredExtensions.includes(downloadedExtension)) {
                    extensionMatch = true;
                }
                
                
            } else {
                
                extensionMatch = true;
            }

            
            if (urlMatch && extensionMatch) {
                
                const safeFolderName = sanitizeFilename(filter.folderName);
                let originalFilename = downloadItem.filename;
                const lastSeparatorIndex = Math.max(originalFilename.lastIndexOf('/'), originalFilename.lastIndexOf('\\'));
                if (lastSeparatorIndex !== -1) {
                    originalFilename = originalFilename.substring(lastSeparatorIndex + 1);
                }

                suggestedPath = `${safeFolderName}/${originalFilename}`;
                console.log(`Match found for filter (URL Pattern: "${filter.urlPattern || 'N/A'}" (using wildcard matching), Extensions: "[${(filter.fileExtensions || []).join(', ')}]"). Suggesting path: ${suggestedPath}`);
                break; 
            }
        } 

        
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

    
    return true;
});

console.log("Download Organizer background script loaded (with wildcard URL and multi-extension support).");