# Download Organizer Chrome Extension

A simple Chrome extension to automatically organize downloaded files into specific subfolders based on user-defined rules.

## Features

*   **URL Pattern Matching:** Define filters based on parts of the download source URL (referrer or direct URL). Supports wildcard (`*`) matching for flexible patterns (e.g., `*.university.edu/*syllabus*`).
*   **File Extension Filtering:** Specify one or more file extensions (e.g., `.pdf`, `.docx`, `.zip`) to trigger a filter.
*   **Custom Subfolders:** Assign a specific subfolder name for downloads matching the filter criteria. Folders are created within your default Chrome Downloads directory.
*   **Simple UI:** Manage filters easily through the extension popup. Add new filters, view existing ones, and delete them as needed.

## Screenshots

*(Add screenshots here later)*

**Popup Interface:**
`[Screenshot of the extension popup showing the filter form and current filters]`

**Example Filter:**
`[Screenshot highlighting an example filter in the list]`

## Installation

Since this extension is not on the Chrome Web Store, you need to load it manually:

1.  **Download:** Download the extension files (or clone the repository) to a local folder on your computer.
2.  **Open Chrome Extensions:** Open Google Chrome, type `chrome://extensions` in the address bar, and press Enter.
3.  **Enable Developer Mode:** In the top-right corner of the Extensions page, toggle the "Developer mode" switch ON.
4.  **Load Unpacked:** Click the "Load unpacked" button that appears.
5.  **Select Folder:** Navigate to the folder where you saved the extension files (the folder containing `manifest.json`, `popup.html`, etc.) and select it.
6.  **Done:** The Download Organizer extension should now appear in your list of extensions and be active. You'll see its icon (usually a default puzzle piece if no icon is set) in your Chrome toolbar.

## Usage

1.  **Click the Icon:** Click the Download Organizer extension icon in your Chrome toolbar to open the popup.
2.  **Add a Filter:**
    *   **(Optional) URL Pattern:** Enter a URL pattern in the "If download is from URL matching pattern" field. Use `*` as a wildcard for any sequence of characters. For example, `*google.com/images*` would match downloads from Google Images.
    *   **(Optional) File Extensions:** Type a file extension (including the dot, e.g., `.jpg`) into the "And file extension is one of" field and press Enter. You can add multiple extensions this way. They will appear as tags. Click the 'x' on a tag to remove it.
    *   **Folder Name:** Enter the desired subfolder name (e.g., `University`, `Work_Reports`, `Images`) in the "Save to subfolder named" field. Do **not** use slashes (`/` or `\`) in the folder name.
    *   **Condition Requirement:** You must provide *at least* a URL pattern OR one or more file extensions for the filter to be valid.
    *   Click "Add Filter".
3.  **View Filters:** Your saved filters will appear under "Current Filters", showing the conditions (IF) and the action (THEN).
4.  **Delete Filters:** Click the "Delete" button next to any filter you wish to remove.
5.  **Automatic Organizing:** Now, when you download a file, the extension will check its source URL and filename against your filters. If a match is found, Chrome will automatically suggest saving the file inside the specified subfolder within your main Downloads directory. If no filter matches, the download proceeds to the default location as usual.
